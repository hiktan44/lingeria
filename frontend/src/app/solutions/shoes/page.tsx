"use client";

import React, { useState } from 'react';
import { api } from '@/lib/api';

const VIBES = [
  { id: 'luxury', label: 'Lüks', icon: '✨', desc: 'Silent Luxury - Mermer kaide, editorial' },
  { id: 'urban', label: 'Sokak', icon: '🌆', desc: 'Urban Hype - Islak asfalt, neon' },
  { id: 'onfoot', label: 'Ayakta', icon: '🚶', desc: 'On-Foot - Doğal kullanım, lifestyle' },
  { id: 'action', label: 'Aksiyon', icon: '⚡', desc: 'Performance - Havada asılı, toz bulutu' },
  { id: 'marketplace', label: 'Stüdyo', icon: '🛒', desc: 'Trendyol/Amazon standart beyaz fon' },
];

export default function ShoesPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState(VIBES[0].id);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setResultUrl(null); // yeni resim yüklendiğinde eski sonucu gizle
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!previewUrl) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.generate({
        imageUrl: previewUrl,
        category: 'shoe',
        vibe: selectedVibe,
        shoeType: 'sneaker',
        material: 'premium material',
        selectedModel: ['luxury', 'action'].includes(selectedVibe)
          ? 'SeedDream 5.0'
          : 'Nano Banana Pro',
      });

      setResultUrl(data.resultUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Section */}
        <header className="text-center space-y-4 py-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Akıllı Telefonunla Çek, AI Stüdyonu Yaratsın
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Ayakkabı fotoğraflarınızı lüks kataloglara, sokak stiline veya model ayağındaki gerçekçi görüntülere anında dönüştürün.
          </p>
        </header>

        {/* Builder Section */}
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL - Controls */}
          <div className="md:col-span-4 space-y-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-300">1. Ayakkabı Görselini Seçin</label>
              <div className="relative border-2 border-dashed border-neutral-700 rounded-xl hover:border-neutral-500 transition-colors bg-neutral-800/50 p-6 flex flex-col items-center justify-center text-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <svg className="w-8 h-8 text-neutral-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <p className="text-sm font-medium text-neutral-200">Görsel Yükle veya Sürükle</p>
                <p className="text-xs text-neutral-500 mt-1">PNG, JPG, WEBP (Maks 10MB)</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-neutral-300">2. Üretim "Vibe" Etiketini Seçin</label>
              <div className="grid grid-cols-1 gap-2">
                {VIBES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVibe(v.id)}
                    className={`flex items-start text-left p-3 rounded-lg border transition-all ${
                      selectedVibe === v.id 
                        ? 'border-indigo-500 bg-indigo-500/10' 
                        : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700/50 hover:border-neutral-600'
                    }`}
                  >
                    <span className="text-xl mr-3">{v.icon}</span>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-200">{v.label}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">{v.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={!previewUrl || loading}
              className="w-full py-4 px-6 bg-white text-black rounded-xl font-bold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-200 transition-colors flex items-center justify-center shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Yapay Zeka Üretiyor...
                </>
              ) : (
                'Görseli Üret (1 Kredi)'
              )}
            </button>
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Preview & Results */}
          <div className="md:col-span-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 min-h-[600px] flex items-center justify-center relative overflow-hidden">
            {!previewUrl && !resultUrl && (
              <div className="text-neutral-500 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Bir ürün fotoğrafı yükleyerek başlayın.</p>
              </div>
            )}

            {(previewUrl && !resultUrl && !loading) && (
              <div className="w-full h-full flex items-center justify-center">
                <img src={previewUrl} alt="Original" className="max-h-full max-w-full object-contain rounded-lg opacity-80" />
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-white animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-r-2 border-b-2 border-indigo-500 animate-spin-reverse"></div>
                </div>
                <p className="text-lg font-medium text-white tracking-widest uppercase animate-pulse">SİHİR ÖRÜLÜYOR...</p>
                <p className="text-xs text-neutral-400 max-w-xs text-center">Bu işlem yüksek kaliteli doku tespiti sebebiyle ~30 saniye sürebilir.</p>
              </div>
            )}

            {resultUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/50 text-white text-xs font-bold rounded-full backdrop-blur-md">
                   SÜPER ÇÖZÜNÜRLÜK ULAŞILDI
                </div>
                <img src={resultUrl} alt="AI Generated" className="max-h-[600px] max-w-full object-contain rounded-lg shadow-2xl" />
                
                {/* Result Actions */}
                <div className="absolute bottom-6 flex gap-4">
                   <button onClick={() => window.open(resultUrl, '_blank')} className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium border border-neutral-600 shadow-md">
                     Büyüt
                   </button>
                   <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium shadow-md">
                     Kaydet & İndir
                   </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
