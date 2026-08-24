'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { useT } from '../lib/i18n';
import Link from 'next/link';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onAuth }: AuthModalProps) {
  const { t } = useT();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (forgotMode) {
        const data = await api.forgotPassword(email);
        setMessage(data.message);
        return;
      }
      const data = isLogin
        ? await api.login(email, password)
        : await api.register(email, password);
      onAuth(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || t('auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md mx-4">
        <h2 id="auth-title" className="text-xl font-bold text-white mb-4">
          {forgotMode ? t('auth.forgotPassword') : isLogin ? t('auth.login') : t('auth.register')}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="auth-email" className="text-sm text-gray-300">{t('auth.email')}</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white mt-1 focus:border-purple-500 focus:outline-none"
              placeholder={t('auth.emailPlaceholder')}
            />
          </div>
          {!forgotMode && <div>
            <label htmlFor="auth-password" className="text-sm text-gray-300">{t('auth.password')}</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white mt-1 focus:border-purple-500 focus:outline-none"
              placeholder={t('auth.passwordPlaceholder')}
              aria-describedby={error ? 'auth-error' : 'auth-password-help'}
            />
            <p id="auth-password-help" className="mt-1 text-xs text-gray-400">{t('auth.passwordHelp')}</p>
          </div>}
          {!isLogin && !forgotMode && (
            <label className="flex items-start gap-2 text-xs leading-relaxed text-gray-300">
              <input type="checkbox" required checked={acceptedLegal} onChange={event => setAcceptedLegal(event.target.checked)} className="mt-0.5 h-4 w-4 accent-purple-500" />
              <span><Link className="text-purple-300 underline" href="/terms">{t('nav.terms')}</Link> {t('common.and')} <Link className="text-purple-300 underline" href="/privacy">{t('nav.privacy')}</Link></span>
            </label>
          )}
          {error && <p id="auth-error" role="alert" className="text-sm text-red-300">{error}</p>}
          {message && <p role="status" className="text-sm text-green-300">{message}</p>}
          <button
            type="submit"
            disabled={loading || (!isLogin && !forgotMode && !acceptedLegal)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? t('auth.processing') : forgotMode ? t('auth.sendResetLink') : isLogin ? t('auth.login') : t('auth.register')}
          </button>
        </form>
        {!forgotMode && <p className="text-sm text-gray-300 mt-4 text-center">
          {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            className="text-purple-400 hover:underline"
          >
            {isLogin ? t('auth.toRegister') : t('auth.toLogin')}
          </button>
        </p>}
        {isLogin && !forgotMode && <button type="button" onClick={() => { setForgotMode(true); setError(''); setMessage(''); }} className="mt-3 w-full text-sm text-purple-300 hover:underline">{t('auth.forgotPassword')}</button>}
        {forgotMode && <button type="button" onClick={() => { setForgotMode(false); setError(''); setMessage(''); }} className="mt-3 w-full text-sm text-purple-300 hover:underline">{t('auth.backToLogin')}</button>}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label={t('auth.closeDialog')}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
