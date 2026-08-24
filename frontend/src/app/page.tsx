'use client';

import Link from 'next/link';
import { useT } from '../lib/i18n';
import { LangSwitch } from '../components/LangSwitch';

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
      <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center border border-white/10 mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

export default function Home() {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30 font-sans overflow-x-hidden">
      {/* Navbar Placeholder */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              F
            </div>
            <span className="font-bold text-lg tracking-tight">Fasheone<span className="text-purple-400">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">{t('nav.features')}</a>
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">{t('nav.howItWorks')}</a>
            <a href="#pricing" className="hidden sm:inline text-sm text-gray-400 hover:text-white transition-colors">{t('nav.pricing')}</a>
            <Link
              href="/workspace/intimate-apparel"
              className="text-sm px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/5 transition-all text-white font-medium"
            >
              {t('nav.goToApp')}
            </Link>
            <LangSwitch />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Abstract Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              <span>{t('hero.badge')}</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              {t('hero.title').split(' ').slice(0, 2).join(' ')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                {t('hero.title').split(' ').slice(2).join(' ')}
              </span>
            </h1>
            <p className="text-gray-400 text-lg lg:text-xl mb-10 max-w-xl leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/workspace/intimate-apparel"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
              >
                {t('hero.cta.primary')}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center justify-center px-8 py-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-colors"
              >
                {t('hero.cta.secondary')}
              </a>
            </div>
          </div>

          {/* Hero Image Container */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900 group aspect-[4/3] lg:aspect-auto lg:h-[600px]">
            {/* Split before/after representation */}
            <div className="absolute inset-0 grid grid-cols-2">
              <div className="relative h-full w-full border-r border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&w=800&q=80"
                  alt="Raw flat lay product"
                  className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded text-xs font-medium border border-white/10">
                  {t('product.raw')}
                </div>
              </div>
              <div className="relative h-full w-full">
                 <img
                  src="https://images.unsplash.com/photo-1524041255072-7da0525d6b34?auto=format&fit=crop&w=800&q=80"
                  alt="AI final product"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-purple-600/80 backdrop-blur-sm px-3 py-1.5 rounded text-xs font-medium border border-purple-400/30">
                  {t('product.aiOutput')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">{t('features.title')}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>}
              title={t('features.advancedModels.title')}
              desc={t('features.advancedModels.desc')}
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>}
              title={t('features.modelCustomization.title')}
              desc={t('features.modelCustomization.desc')}
            />
            <FeatureCard
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>}
              title={t('features.lightingControl.title')}
              desc={t('features.lightingControl.desc')}
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/5 bg-[#0a0a0a] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold">{t('pricing.title')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-300">{t('pricing.subtitle')}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[t('pricing.basic'), t('pricing.studio'), t('pricing.pro')].map((plan) => (
              <div key={plan} className="rounded-xl border border-white/10 bg-white/[0.04] p-6 font-semibold">
                {plan}
                <p className="mt-2 text-sm font-normal text-gray-400">{t('pricing.terms')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-white/5 bg-black text-center">
        <nav aria-label={t('footer.legalLabel')} className="mb-4 flex flex-wrap justify-center gap-5 text-sm text-gray-300">
          <Link href="/privacy" className="hover:text-white">{t('nav.privacy')}</Link>
          <Link href="/terms" className="hover:text-white">{t('nav.terms')}</Link>
          <Link href="/cookies" className="hover:text-white">{t('nav.cookies')}</Link>
          <Link href="/contact" className="hover:text-white">{t('nav.contact')}</Link>
          <a href="#pricing" className="hover:text-white">{t('nav.pricing')}</a>
        </nav>
        <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Lingeria by Fasheone. {t('footer.rights')}</p>
      </footer>
    </div>
  );
}
