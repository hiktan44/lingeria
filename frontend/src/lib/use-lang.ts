'use client';

import { useState, useEffect, useCallback } from 'react';

type Lang = 'tr' | 'en';

const STORAGE_KEY = 'ui_lang';
const EVENT_NAME = 'ui_lang_change';

// IP detection with timeout and cache. Returns null when no service answers,
// so the caller can fall back to the browser language instead of assuming TR.
async function lookupCountry(url: string, signal: AbortSignal): Promise<string | null> {
  try {
    const r = await fetch(url, { signal, cache: 'no-store' });
    if (!r.ok) return null;
    const data = await r.json();
    const code = String(data?.country_code || '').toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

async function detectCountry(): Promise<string | null> {
  const cacheKey = 'ip_country_cache';
  const cacheTimeKey = 'ip_country_cache_time';

  // Check session storage cache (24h)
  try {
    const cachedCountry = sessionStorage.getItem(cacheKey);
    const cachedTime = sessionStorage.getItem(cacheTimeKey);
    if (cachedCountry && cachedTime && Date.now() - parseInt(cachedTime, 10) < 24 * 60 * 60 * 1000) {
      return cachedCountry;
    }
  } catch {
    /* ignore */
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s total
  try {
    const country =
      (await lookupCountry('https://ipwho.is/', controller.signal)) ??
      (await lookupCountry('https://ipapi.co/json/', controller.signal));
    if (country) {
      try {
        sessionStorage.setItem(cacheKey, country);
        sessionStorage.setItem(cacheTimeKey, Date.now().toString());
      } catch {
        /* ignore */
      }
    }
    return country;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Browser language fallback when the IP lookup is unavailable: any non-Turkish
// browser gets English so a foreign visitor never lands on Turkish by default.
function browserLang(): Lang {
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    const primary = (langs.find(Boolean) || '').toLowerCase();
    if (primary) return primary.startsWith('tr') ? 'tr' : 'en';
  } catch {
    /* ignore */
  }
  return 'tr';
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>('tr');
  const [isDetected, setIsDetected] = useState(false);

  useEffect(() => {
    // 1. Check localStorage preference
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && (stored === 'tr' || stored === 'en')) {
      setLangState(stored);
      setIsDetected(true);
      return;
    }

    // 2. Detect from IP
    detectCountry().then(country => {
      const detectedLang: Lang = country === 'TR' ? 'tr' : country ? 'en' : browserLang();
      setLangState(detectedLang);
      setIsDetected(true);
    }).catch(() => {
      // 3. Fallback to navigator.language
      setLangState(browserLang());
      setIsDetected(true);
    });
  }, []);

  // Listen for language changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newLang = e.newValue as Lang;
        if (newLang === 'tr' || newLang === 'en') {
          setLangState(newLang);
        }
      }
    };

    // Listen for custom events within the same tab
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<Lang>;
      if (customEvent.detail === 'tr' || customEvent.detail === 'en') {
        setLangState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(EVENT_NAME, handleLangChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(EVENT_NAME, handleLangChange);
    };
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    // Update state
    setLangState(newLang);
    
    // Update localStorage
    localStorage.setItem(STORAGE_KEY, newLang);
    
    // Set cookie (1 year)
    document.cookie = `${STORAGE_KEY}=${newLang}; max-age=31536000; path=/; SameSite=Lax`;
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newLang }));
  }, []);

  const pickByLang = useCallback(<T,>(lang: Lang, tr: T, en: T): T => {
    return lang === 'tr' ? tr : en;
  }, []);

  return { lang, setLang, isDetected, pickByLang };
}