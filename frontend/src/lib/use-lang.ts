'use client';

import { useState, useEffect, useCallback } from 'react';

type Lang = 'tr' | 'en';

const STORAGE_KEY = 'ui_lang';
const EVENT_NAME = 'ui_lang_change';

// IP detection with timeout and cache
async function detectCountry(): Promise<string> {
  const cacheKey = 'ip_country_cache';
  const cacheTimeKey = 'ip_country_cache_time';
  
  // Check session storage cache (24h)
  const cachedCountry = sessionStorage.getItem(cacheKey);
  const cachedTime = sessionStorage.getItem(cacheTimeKey);
  if (cachedCountry && cachedTime) {
    const cacheAge = Date.now() - parseInt(cachedTime, 10);
    if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
      return cachedCountry;
    }
  }

  const controllers: AbortController[] = [];
  
  try {
    // Try ipwho.is first (more reliable)
    const controller1 = new AbortController();
    const controller2 = new AbortController();
    controllers.push(controller1, controller2);
    
    const timeoutId = setTimeout(() => {
      controller1.abort();
      controller2.abort();
    }, 2500); // 2.5s timeout

    const race = Promise.race([
      fetch('https://ipwho.is/', { signal: controller1.signal })
        .then(r => r.json())
        .then(data => data.country_code || 'TR'),
      fetch('https://ipapi.co/json/', { signal: controller2.signal })
        .then(r => r.json())
        .then(data => data.country_code || 'TR')
        .catch(() => 'TR')
    ]);

    const country = await race;
    clearTimeout(timeoutId);
    
    // Cache the result
    sessionStorage.setItem(cacheKey, country);
    sessionStorage.setItem(cacheTimeKey, Date.now().toString());
    
    return country;
  } catch {
    return 'TR';
  } finally {
    controllers.forEach(c => c.abort());
  }
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
      const detectedLang: Lang = country === 'TR' ? 'tr' : 'en';
      setLangState(detectedLang);
      setIsDetected(true);
    }).catch(() => {
      // 3. Fallback to navigator.language
      const navLang = navigator.language.toLowerCase();
      const fallbackLang: Lang = navLang.startsWith('tr') ? 'tr' : 'en';
      setLangState(fallbackLang);
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