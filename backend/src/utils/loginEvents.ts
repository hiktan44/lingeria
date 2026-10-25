// Dogrulanmis giris olay gunlugu (login_events). Yalnizca kimlik dogrulamasi
// gectikten sonra cagrilir; kisisel veri (e-posta, IP, user-agent, token)
// yazilmaz. Yazma hatasi girisi ASLA engellemez.
import { randomUUID } from 'crypto';
import { query } from '../config/database';

export type LoginMethod = 'password' | 'register';

export async function recordLoginEvent(userId: string, method: LoginMethod): Promise<void> {
  try {
    await query('INSERT INTO login_events (id, user_id, method) VALUES ($1, $2, $3)', [randomUUID(), userId, method]);
  } catch (err: any) {
    console.error('[login_events] giris olayi yazilamadi:', err?.message ?? err);
  }
}
