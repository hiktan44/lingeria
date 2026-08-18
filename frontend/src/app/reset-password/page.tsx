'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';

function ResetPasswordForm() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const data = await api.resetPassword(token, password);
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message || 'Şifre güncellenemedi');
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#0a0a0a] px-4 py-16 text-white">
    <form onSubmit={submit} className="mx-auto max-w-md rounded-xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-2xl font-bold">Yeni şifre belirle</h1>
      <label htmlFor="new-password" className="mt-6 block text-sm text-gray-300">Yeni şifre</label>
      <input id="new-password" type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-black px-3 py-2" />
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-green-300">{message}</p>}
      <button disabled={loading || !token} className="mt-5 w-full rounded-lg bg-purple-600 py-2 font-medium disabled:opacity-50">{loading ? 'İşleniyor…' : 'Şifreyi Güncelle'}</button>
      <Link href="/workspace/intimate-apparel" className="mt-4 block text-center text-sm text-purple-300">Giriş ekranına dön</Link>
    </form>
  </main>;
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>;
}
