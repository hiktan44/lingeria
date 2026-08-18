import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { validateAuthInput } from '../utils/validation';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export default async function authRouterRoutes(server: FastifyInstance) {
  const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'development-only-secret');
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured in production');
  }

  server.post('/register', async (request, reply) => {
    const body = request.body as any;
    const validation = validateAuthInput(body);
    if (!validation.valid) {
      return reply.code(400).send({ error: 'Validation failed', details: validation.errors });
    }

    const { email, password } = body;

    try {
      const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return reply.code(409).send({ error: 'Bu email zaten kayıtlı' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await query(
        'INSERT INTO users (email, password, balance) VALUES ($1, $2, $3) RETURNING id, email, balance',
        [email, hashedPassword, 100.0]
      );

      const newUser = result.rows[0];

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      return reply.code(201).send({
        message: 'Kayıt başarılı',
        token,
        user: { id: newUser.id, email: newUser.email, balance: newUser.balance },
      });
    } catch (err: any) {
      server.log.error('Register error:', err);
      return reply.code(500).send({ error: 'Kayıt sırasında hata oluştu' });
    }
  });

  server.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email ve şifre gereklidir' });
    }

    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return reply.code(401).send({ error: 'Email veya şifre hatalı' });
      }

      const user = result.rows[0];

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return reply.code(401).send({ error: 'Email veya şifre hatalı' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as any }
      );

      return reply.send({
        message: 'Giriş başarılı',
        token,
        user: { id: user.id, email: user.email, balance: user.balance },
      });
    } catch (err: any) {
      server.log.error('Login error:', err);
      return reply.code(500).send({ error: 'Sunucu hatası' });
    }
  });

  server.post('/forgot-password', async (request, reply) => {
    const { email } = request.body as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.code(400).send({ error: 'Geçerli bir email adresi girin' });
    }

    const genericMessage = 'Bu adres kayıtlıysa şifre sıfırlama bağlantısı gönderildi.';
    const result = await query('SELECT id, email FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) return reply.send({ message: genericMessage });

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (!smtpHost || !smtpUser || !smtpPassword) {
      server.log.error('Password reset requested but SMTP is not configured');
      return reply.code(503).send({ error: 'Şifre sıfırlama servisi şu anda kullanılamıyor' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await query('DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < NOW()', [result.rows[0].id]);
    await query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')",
      [result.rows[0].id, tokenHash],
    );

    const resetBaseUrl = process.env.RESET_BASE_URL || 'http://localhost:3001/reset-password';
    const resetUrl = `${resetBaseUrl}?token=${encodeURIComponent(rawToken)}`;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPassword },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: result.rows[0].email,
      subject: 'Lingeria şifre sıfırlama',
      text: `Şifrenizi bir saat içinde yenilemek için bu bağlantıyı açın: ${resetUrl}`,
      html: `<p>Şifrenizi bir saat içinde yenilemek için aşağıdaki bağlantıyı açın:</p><p><a href="${resetUrl}">Şifremi yenile</a></p><p>Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`,
    });

    return reply.send({ message: genericMessage });
  });

  server.post('/reset-password', async (request, reply) => {
    const { token, password } = request.body as { token?: string; password?: string };
    if (!token || !password || password.length < 6) {
      return reply.code(400).send({ error: 'Geçerli bağlantı ve en az 6 karakterlik şifre gereklidir' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenResult = await query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [tokenHash],
    );
    if (tokenResult.rows.length === 0) {
      return reply.code(400).send({ error: 'Bağlantı geçersiz, kullanılmış veya süresi dolmuş' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, tokenResult.rows[0].user_id]);
    return reply.send({ message: 'Şifreniz güncellendi. Şimdi giriş yapabilirsiniz.' });
  });

  server.get('/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) return reply.code(401).send({ error: 'Token gerekli' });
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      const result = await query(
        'SELECT id, email, balance, created_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Kullanıcı bulunamadı' });
      }

      return reply.send({ user: result.rows[0] });
    } catch (err: any) {
      server.log.error('Get user error:', err);
      return reply.code(401).send({ error: 'Geçersiz token' });
    }
  });
}
