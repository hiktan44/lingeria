// Commit native no-FK evidence before returning a new customer JWT.
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { getClient } from '../config/database';
export type LoginMethod = 'password' | 'register';
export class LoginJournalUnavailable extends Error {
  constructor() { super('Giriş şu anda tamamlanamıyor. Lütfen tekrar deneyin.'); this.name='LoginJournalUnavailable'; }
}
export async function recordLoginEvent(userId: string, method: LoginMethod, token: string, secret: string): Promise<void> {
  let client: Awaited<ReturnType<typeof getClient>> | undefined;
  try {
    const claims=jwt.verify(token,secret,{algorithms:['HS256']});
    if(typeof claims==='string'||claims.id!==userId||typeof claims.email!=='string'||!['password','register'].includes(method))throw Error('verified_session_required');
    const eventId=createHash('sha256').update('lingeria:auth-session-issued:v1:'+method+':'+token).digest('hex');
    client=await getClient();await client.query('BEGIN');await client.query("SET LOCAL synchronous_commit='on'");await client.query("SET LOCAL lock_timeout='3s'");await client.query("SET LOCAL statement_timeout='5s'");
    const result=await client.query(`INSERT INTO public.lingeria_issued_login_events(id,actor_id,method,at,excluded)
      SELECT $1,u.id::text,$3,clock_timestamp(),md5(lower(btrim(u.email)))='05f8a46fa52d4c99a9c1df5488f8b747'
      FROM public.users u WHERE u.id::text=$2 AND lower(btrim(u.email))=$4
      ON CONFLICT(id) DO UPDATE SET id=EXCLUDED.id RETURNING actor_id`,[eventId,userId,method,claims.email.trim().toLowerCase()]);
    if(result.rows.length!==1||result.rows[0].actor_id!==userId)throw Error('canonical_actor_unverified');
    await client.query('COMMIT');
  } catch {
    if(client)await client.query('ROLLBACK').catch(()=>{});
    throw new LoginJournalUnavailable();
  } finally { client?.release(); }
}
