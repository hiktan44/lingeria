'use client';

import { useT } from '../lib/i18n';

export function LangSwitch() {
  const { lang, setLang, t } = useT();

  return (
    <button
      onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white text-sm font-medium"
      title={t('langSwitch.tooltip')}
      aria-label={t('langSwitch.tooltip')}
    >
      <span className={`font-bold ${lang === 'tr' ? 'text-purple-400' : 'text-gray-400'}`}>
        {t('langSwitch.tr')}
      </span>
      <span className="text-gray-500">/</span>
      <span className={`font-bold ${lang === 'en' ? 'text-purple-400' : 'text-gray-400'}`}>
        {t('langSwitch.en')}
      </span>
    </button>
  );
}