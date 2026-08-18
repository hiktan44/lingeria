import Link from 'next/link';

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#0a0a0a] px-5 py-12 text-white"><article className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-10"><Link href="/" className="text-sm text-purple-300">← Lingeria</Link><h1 className="mt-6 text-3xl font-bold">{title}</h1><p className="mt-2 text-sm text-gray-400">Son güncelleme: 18 Ağustos 2026</p><div className="mt-8 space-y-5 leading-7 text-gray-300">{children}</div></article></main>;
}
