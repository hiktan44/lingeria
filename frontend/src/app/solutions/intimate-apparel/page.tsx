import Link from 'next/link';
import React from 'react';

export default function IntimateApparelLanding() {
  return (
    <main className="min-h-screen bg-brand-cream text-brand-deepPurple font-sans">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:px-24 flex flex-col items-center text-center">
        <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
          İç Giyim Markaları İçin Gerçekçi ve Kontrollü AI Görseller
        </h1>
        <p className="max-w-2xl text-lg md:text-xl mb-10 text-gray-700">
          Sütyen, külot, takım iç giyim, shapewear ve loungewear ürünlerinizi doğru doku, doğru kalıp ve kontrollü sunumla e-ticaret görsellerine dönüştürün.
        </p>
        <div className="flex gap-4">
          <Link href="/workspace/intimate-apparel" className="bg-brand-deepPurple text-white px-8 py-3 rounded-full hover:bg-purple-900 transition shadow-lg font-medium">
            İç Giyim Workspace&apos;i Dene
          </Link>
          <Link href="/solutions/shoes" className="bg-brand-dustyRose text-white px-8 py-3 rounded-full hover:bg-pink-400 transition shadow-lg font-medium">
            Ayakkabı Çözümünü Gör
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-6 py-16 bg-white">
        <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="p-6 bg-brand-cream rounded-xl shadow-sm border border-brand-dustyRose/20">
            <h3 className="font-bold text-xl mb-3">Ürün sadakati yüksek</h3>
            <p className="text-sm text-gray-600">Orijinal ürününüzün hiçbir detayını bozmadan üretir.</p>
          </div>
          <div className="p-6 bg-brand-cream rounded-xl shadow-sm border border-brand-dustyRose/20">
            <h3 className="font-bold text-xl mb-3">Katalog ve reklam odaklı</h3>
            <p className="text-sm text-gray-600">Sadece e-ticaret siteleri ve reklamlarda satışı artırmak için tasarlanmış görseller.</p>
          </div>
          <div className="p-6 bg-brand-cream rounded-xl shadow-sm border border-brand-dustyRose/20">
            <h3 className="font-bold text-xl mb-3">Kontrollü görünürlük</h3>
            <p className="text-sm text-gray-600">NSFW filtreleri ile pazar yerlerinde yasaklanma riski olmadan, tamamen güvenli sunum.</p>
          </div>
          <div className="p-6 bg-brand-cream rounded-xl shadow-sm border border-brand-dustyRose/20">
            <h3 className="font-bold text-xl mb-3">Doku ve dantel koruma</h3>
            <p className="text-sm text-gray-600">Sütyen kopçası ve dantel detaylarının tamamen korunduğu spesifik iç giyim yapay zekası.</p>
          </div>
        </div>
      </section>

      {/* VTO Demo Placeholder */}
      <section className="px-6 py-20 bg-brand-deepPurple text-white text-center">
        <h2 className="font-serif text-4xl mb-6">Canlı Demo: Flat Lay&apos;den Modele</h2>
        <Link href="/workspace/intimate-apparel" className="block w-full max-w-5xl h-96 mx-auto rounded-xl flex items-center justify-center border border-white/10 bg-black/20 hover:bg-black/30 transition cursor-pointer">
          <p className="text-brand-dustyRose text-xl">Workspace&apos;i Aç ve Demo Yap →</p>
        </Link>
      </section>
    </main>
  );
}
