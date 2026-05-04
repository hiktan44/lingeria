import { FastifyInstance } from 'fastify';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { buildPrompt, SHOE_NEGATIVE_PROMPT } from './promptBuilder';
import { validateGenerateInput } from '../utils/validation';

const KIE_BASE = process.env.KIE_BASE_URL || 'https://api.kie.ai';
const getKieKey = () => process.env.KIE_API_KEY || '';

const MODEL_MAP: Record<string, string> = {
  'Nano Banana Pro':   'nano-banana-pro',
  'Nano Banana 2':     'nano-banana-2',
  'SeedDream 4.5':     'seedream/4.5-edit',
  'SeedDream 5.0':     'seedream/5-lite-image-to-image',
  'ChatGPT Image 1.5': 'gpt-image/1.5-image-to-image',
};

const MODEL_COSTS: Record<string, number> = {
  'Nano Banana Pro': 12,
  'Nano Banana 2': 10,
  'SeedDream 4.5': 8,
  'SeedDream 5.0': 15,
  'ChatGPT Image 1.5': 20,
};

async function requireAuth(request: any, reply: any) {
  const authHeader = request.headers.authorization;
  if (!authHeader) return reply.code(401).send({ error: 'Yetkilendirme gerekli' });
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    request.user = decoded;
  } catch {
    return reply.code(401).send({ error: 'Geçersiz token' });
  }
}

async function pollTask(taskId: string, maxWait = 120000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await axios.get(`${KIE_BASE}/api/v1/jobs/recordInfo`, {
      params: { taskId },
      headers: { Authorization: `Bearer ${getKieKey()}` },
    });
    const { state, resultJson, failMsg } = res.data?.data || {};
    if (state === 'success') {
      const parsed = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
      return parsed?.resultUrls?.[0] || parsed?.url || null;
    }
    if (state === 'failed') throw new Error(failMsg || 'Kie.ai görev başarısız oldu');
  }
  throw new Error('Zaman aşımı: görsel 120 saniyede üretilemedi');
}

async function uploadToKie(base64DataUrl: string): Promise<string> {
  const match = base64DataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.*)$/);
  const ext = match ? match[1].replace('jpeg', 'jpg') : 'png';
  const rawBase64 = match ? match[2] : base64DataUrl;
  const uniqueName = `rq-${Date.now()}-${Math.floor(Math.random()*1000)}.${ext}`;
  
  try {
    const res = await axios.post(
      'https://kieai.redpandaai.co/api/file-base64-upload',
      { base64Data: rawBase64, fileName: uniqueName, uploadPath: 'images' },
      { headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' } }
    );
    if (!res.data?.data?.downloadUrl) {
      throw new Error('Görsel upload edilemedi (Kie.ai CDN boş döndü)');
    }
    return res.data.data.downloadUrl;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.response?.data?.msg || err?.message || 'Upload hatası';
    throw new Error(`Upload Hatası: ${msg}`);
  }
}

export default async function aiRouterRoutes(server: FastifyInstance) {

  server.post('/translate', async (request, reply) => {
    const { text } = request.body as any;
    if (!text) return reply.send({ translated: '' });
    try {
      const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=en&dt=t&q=${encodeURIComponent(text)}`);
      const translated = res.data[0].map((item: any) => item[0]).join('');
      return reply.send({ translated });
    } catch (err) {
      server.log.error('Translate error: ' + err);
      return reply.send({ translated: text });
    }
  });

  server.post('/analyze-image', async (request, reply) => {
    const { image } = request.body as { image: string };
    if (!image) return reply.send({ category: 'Clothing' });
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        server.log.warn('GEMINI_API_KEY is not defined. Using default category.');
        return reply.send({ category: 'Fashion item' });
      }

      const match = image.match(/^data:image\/([a-zA-Z+]+);base64,(.*)$/);
      if (!match) return reply.send({ category: 'Clothing' });
      const mimeType = `image/${match[1]}`;
      const base64Data = match[2];

      const payload = {
        contents: [{
          parts: [
            { text: "Analyze this image and identify the primary piece of clothing on the mannequin or person. Reply with just 1-2 words in English (e.g. 'Bra', 'Panties', 'Bikini', 'Nightgown', 'Crop top', 'Swimsuit', 'Dress', 'Pajamas'). Be highly accurate and use standard fashion terminology." },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }]
      };

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      let text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Fashion piece';
      text = text.replace(/[^a-zA-Z\s\-]/g, '');
      return reply.send({ category: text });
    } catch(err: any) {
      server.log.error('Gemini analyze error:', err?.response?.data || err?.message);
      return reply.send({ category: 'Fashion garment' });
    }
  });

  server.post('/generate', { preHandler: [requireAuth] }, async (request, reply) => {
    const { imageUrl, mankenImage, desenImage, modelKilitli, prompt, outputMode, complianceMode, selectedModel, category, vibe, shoeType, material, aspectRatio } = request.body as any;

    const validation = validateGenerateInput({ imageUrl, selectedModel, aspectRatio });
    if (!validation.valid) {
      return reply.code(400).send({ error: 'Validation failed', details: validation.errors });
    }

    if (!imageUrl) return reply.code(400).send({ error: 'Görsel URL gereklidir.' });

    const userId = (request as any).user?.id;
    const cost = MODEL_COSTS[selectedModel] || 10;

    try {
      const userResult = await query('SELECT balance FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Kullanıcı bulunamadı' });
      }
      const balance = parseFloat(userResult.rows[0].balance);
      if (balance < cost) {
        return reply.code(402).send({ error: 'Yetersiz bakiye', balance, cost });
      }
    } catch (err) {
      server.log.error('Balance check error:', err);
    }

    const currentKey = getKieKey();
    if (!currentKey || currentKey === 'your-kie-api-key') {
      await new Promise(r => setTimeout(r, 2000));
      return reply.send({
        success: true,
        jobId: `dev-${Date.now()}`,
        resultUrl: `https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80`,
        qualityScore: 94,
        complianceStatus: 'Catalog Ready',
      });
    }

    const modelSlug = MODEL_MAP[selectedModel] || 'seedream/4-5-image-to-image';
    const hasImageEdit = true;

    const generatedPrompt = buildPrompt(category, vibe, shoeType, material, prompt);
    
    const seed = modelKilitli ? 8888888 : undefined;
    
    const input: Record<string, any> = {
      prompt: generatedPrompt,
      quality: 'basic',
    };
    if (seed) input.seed = seed;
    
    if (category === 'shoe') {
      input.aspect_ratio = '1:1';
      input.negative_prompt = SHOE_NEGATIVE_PROMPT;
    } else if (aspectRatio) {
      if (aspectRatio.includes('x') || aspectRatio.includes('*')) {
        const sep = aspectRatio.includes('x') ? 'x' : '*';
        const [w, h] = aspectRatio.split(sep);
        const width = parseInt(w.trim());
        const height = parseInt(h.trim());
        input.aspect_ratio = 'custom';
        input.width = width;
        input.height = height;
        input.image_size = { width, height };
        input.size = `${width}x${height}`;
      } else {
        input.aspect_ratio = aspectRatio;
      }
    } else {
      input.aspect_ratio = '3:4';
    }
    
    let uploadedImageUrl = imageUrl;
    let uploadedManken = mankenImage;
    let uploadedDesen = desenImage;

    try {
      if (hasImageEdit) {
        if (imageUrl.startsWith('data:image')) {
          uploadedImageUrl = await uploadToKie(imageUrl);
        }
        if (mankenImage && mankenImage.startsWith('data:image')) {
          uploadedManken = await uploadToKie(mankenImage);
        }
        if (desenImage && desenImage.startsWith('data:image')) {
          uploadedDesen = await uploadToKie(desenImage);
        }

        const allUrls = [uploadedImageUrl];
        if (uploadedManken) allUrls.push(uploadedManken);
        if (uploadedDesen) allUrls.push(uploadedDesen);

        input.image_urls = allUrls;
        input.image_url = uploadedImageUrl; 
        input.imagePath = uploadedImageUrl;
        input.image_input = allUrls;
      }

      const createRes = await axios.post(
        `${KIE_BASE}/api/v1/jobs/createTask`,
        { model: modelSlug, input },
        { headers: { Authorization: `Bearer ${getKieKey()}`, 'Content-Type': 'application/json' } }
      );

      const taskId = createRes.data?.data?.taskId;
      if (!taskId) throw new Error('taskId alınamadı: ' + JSON.stringify(createRes.data));

      const resultUrl = await pollTask(taskId);
      if (!resultUrl) throw new Error('Sonuç URL\'i boş döndü');

      try {
        await query('UPDATE users SET balance = balance - $1, updated_at = NOW() WHERE id = $2', [cost, userId]);
        await query(
          'INSERT INTO generations (user_id, result_url, model, prompt, cost) VALUES ($1, $2, $3, $4, $5)',
          [userId, resultUrl, selectedModel, generatedPrompt, cost]
        );
      } catch (dbErr) {
        server.log.error('DB update error:', dbErr);
      }

      return reply.send({ success: true, jobId: taskId, resultUrl, qualityScore: 95, complianceStatus: 'Catalog Ready', cost });

    } catch (err: any) {
      server.log.error(err);
      
      let msg = 'AI üretimi başarısız';
      
      if (err?.response?.data) {
        const errData = err.response.data;
        if (errData.msg) msg = errData.msg;
        if (errData.code === 402) msg = 'Yetersiz Bakiye: Kie.ai bakiyeniz bu işlem için yetersiz. Lütfen API kredisi yükleyin.';
        if (errData.code === 500 && errData.msg === 'This field is required') msg = 'Kie.ai Hatası: Seçilen model geçici olarak desteklenmiyor veya parametre hatası (Seeddream servisi arızalı). Lütfen Nano Banana Pro modelini seçin.';
        if (errData.code === 422) msg = 'Desteklenmeyen Model: Seçtiğiniz model Kie.ai sunucusunda aktif değil.';
      } else {
        msg = err?.message || msg;
      }
      
      return reply.code(500).send({ error: msg });
    }
  });

  server.get('/task/:taskId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    if (!getKieKey()) return reply.code(400).send({ error: 'API key eksik' });
    try {
      const res = await axios.get(`${KIE_BASE}/api/v1/jobs/recordInfo`, {
        params: { taskId },
        headers: { Authorization: `Bearer ${getKieKey()}` },
      });
      return reply.send(res.data);
    } catch (err: any) {
      return reply.code(500).send({ error: err?.message });
    }
  });
}
