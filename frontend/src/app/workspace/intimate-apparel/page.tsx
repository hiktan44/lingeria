"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../../../lib/api';
import { AuthModal } from '../../../components/AuthModal';

// ── Sabitler ──────────────────────────────────────────────────────────────────

const COLOR_SWATCHES = [
  '#fff','#f5f5f5','#e0e0e0','#9e9e9e','#616161','#212121',
  '#ef5350','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3',
  '#03a9f4','#00bcd4','#009688','#4caf50','#8bc34a','#cddc39',
  '#ffeb3b','#ffc107','#ff9800','#ff5722','#795548','#607d8b',
];

const MODELS = [
  { name: 'Nano Banana Pro',    credit: 12 },
  { name: 'SeedDream 4.5',      credit: 8  },
];

// ── Toast bileşeni ────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType }

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium pointer-events-auto transition-all animate-in slide-in-from-right
            ${t.type === 'success' ? 'bg-green-800/90 text-green-200 border border-green-600'
            : t.type === 'error'   ? 'bg-red-900/90 text-red-200 border border-red-700'
            :                        'bg-indigo-900/90 text-indigo-200 border border-indigo-700'}`}
        >
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span className="flex-1 max-w-xs">{t.msg}</span>
          <button onClick={() => onClose(t.id)} aria-label="Bildirimi kapat" className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  );
}

// ── Select bileşeni ───────────────────────────────────────────────────────────

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        aria-label={`Seçenek, mevcut değer: ${value}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-[#1a1a2e] border border-[#2a2a4a] text-gray-200 text-sm rounded px-3 py-2 pr-7 focus:outline-none focus:border-purple-500"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">▼</span>
    </div>
  );
}

// ── Toggle bileşeni ───────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={value ? 'Ayarı kapat' : 'Ayarı aç'}
      onClick={() => onChange(!value)}
      className={`w-9 h-5 rounded-full transition-colors relative ${value ? 'bg-purple-600' : 'bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

function UploadZone({ label, image, onUpload, inputRef }: {
  label: string; image: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div>
      <p className="text-gray-400 mb-1">{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-[#2a2a4a] rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition relative overflow-hidden group"
      >
        {image
          ? <img src={image} className="w-full h-full object-cover" alt="" />
          : (
            <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-purple-400 transition">
              <span className="text-xl">+</span>
              <span className="text-[10px] text-center px-2">Yükle</span>
            </div>
          )
        }
        <input ref={inputRef} type="file" accept="image/*" aria-label={`${label} yükle`} className="hidden" onChange={onUpload} />
      </div>
    </div>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────────────────────

export default function Workspace() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const [productImage, setProductImage]   = useState<string | null>(null);
  const [drawingImage, setDrawingImage]   = useState<string | null>(null);
  const [resultImage, setResultImage]     = useState<string | null>(null);
  const [mukayeseImage, setMukayeseImage] = useState<string | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [activeTab, setActiveTab]         = useState('Üret');
  const [toasts, setToasts]               = useState<Toast[]>([]);

  const [selectedModel, setSelectedModel] = useState('Nano Banana Pro');
  const [mukayeseliUret, setMukayeseliUret] = useState(false);
  const [kyafetTuru, setKyafetTuru]       = useState('Genel');
  const [cokluRenk, setCokluRenk]         = useState(false);
  const [selectedColor, setSelectedColor] = useState('#fff');
  const [disilikModu, setDisilikModu]     = useState(false);
  const [zeminTarifi, setZeminTarifi]     = useState('');

  const [enBoyOrani, setEnBoyOrani]       = useState('3:4');
  const [ozelOlcu, setOzelOlcu]           = useState('1024x1024');

  const [parcaKuresi, setParcaKuresi]   = useState('Atletik');
  const [sunumModu, setSunumModu]       = useState('Katalog Çekimi');
  const [isikTipi, setIsikTipi]         = useState('Stüdyo Aydınlığı');
  const [renktonu, setRenktonu]         = useState('Açık Nötr');
  const [cekim, setCekim]               = useState('Uzak Çekim (Tüm Vücut)');

  const [modelYas, setModelYas]       = useState('Yetişkin (25-35)');
  const [cinsiyet, setCinsiyet]       = useState('Kadın');
  const [vucutTipi, setVucutTipi]     = useState('Standart');
  const [sacRengi, setSacRengi]       = useState('Brunet');
  const [sacStili, setSacStili]       = useState('Doğal Düz');
  const [boyUzunlugu, setBoyUzunlugu] = useState('Seçiniz');
  const [vucutYapisi, setVucutYapisi] = useState('Seçiniz');
  const [ayakkabi, setAyakkabi]       = useState('Yok');
  const [aksesuar, setAksesuar]       = useState('Yok');
  const [flasTipi, setFlasTipi]       = useState('Soft Difüz');
  const [mekan, setMekan]             = useState('Beyaz Stüdyo');
  const [ekstraPrompt, setEkstraPrompt] = useState('');
  
  const [etnikKoken, setEtnikKoken]   = useState('Farklı (Karışık)');
  const [kameraAcisi, setKameraAcisi] = useState('Göz Hizası');
  const [modelKilitli, setModelKilitli] = useState(false);
  const [mankenUploadImage, setMankenUploadImage] = useState<string | null>(null);
  const [desenUploadImage, setDesenUploadImage] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<'model1' | 'model2'>('model1');

  const productRef  = useRef<HTMLInputElement>(null);
  const drawingRef  = useRef<HTMLInputElement>(null);
  const mankenRef   = useRef<HTMLInputElement>(null);
  const desenRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe().then(res => {
        setUser(res.user);
        setBalance(res.user.balance);
      }).catch(() => {
        api.removeToken();
      });
    }
  }, []);

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAuth = (userData: any) => {
    setUser(userData);
    setBalance(userData.balance);
    showToast('Giriş başarılı!', 'success');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setBalance(null);
    showToast('Çıkış yapıldı', 'info');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'drawing' | 'manken' | 'desen') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Dosya 10MB\'dan büyük olamaz', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'product') setProductImage(reader.result as string);
      else if (type === 'drawing') setDrawingImage(reader.result as string);
      else if (type === 'manken') setMankenUploadImage(reader.result as string);
      else if (type === 'desen') setDesenUploadImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!productImage) { showToast('Lütfen önce bir ürün görseli yükleyin', 'error'); return; }
    if (enBoyOrani === 'Özel' && !/^\d+[x*]\d+$/.test(ozelOlcu)) {
      showToast('Geçersiz özel ölçü formatı (örn: 1024x1024)', 'error');
      return;
    }
    setIsLoading(true);
    setResultImage(null);

    const t = (str: string) => {
      const db: Record<string,string> = {
        'İç Giyim': 'Lingerie', 'Bra': 'Bra', 'Panty': 'Panty', 'Bra Set': 'Bra Set', 'Shapewear': 'Shapewear', 'Loungewear': 'Loungewear', 'Swimwear': 'Swimwear',
        'Stüdyo Aydınlığı': 'Studio Lighting', 'Doğal Işık': 'Natural Light', 'Golden Hour': 'Golden Hour', 'Dramatik': 'Dramatic Lighting', 'Editoryal': 'Editorial Fashion Style',
        'Açık Nötr': 'Light Neutral', 'Sıcak Beyaz': 'Warm White', 'Soğuk Gri': 'Cool Gray', 'Krem': 'Cream Tone',
        'Uzak Çekim (Tüm Vücut)': 'Full Body Wide Shot', 'Orta Çekim (Bel Hizası)': 'Medium Shot', 'Yakın Çekim (Ürün Detay)': 'Close-up Detail Shot', 'Ghost Mannequin': 'Ghost Mannequin, visible product only, no human body',
        'Genç (18-25)': 'Young', 'Yetişkin (25-35)': 'Adult', 'Orta Yaş (35-45)': 'Middle-aged',
        'Kadın': 'Woman', 'Erkek': 'Man', 'Non-binary': 'Androgynous',
        'Standart': 'Standard Body', 'İnce': 'Slim Body', 'Atletik': 'Athletic Body', 'Dolgun': 'Curvy Body', 'Plus Size': 'Plus Size',
        'Brunet': 'Brunette', 'Siyah': 'Black', 'Sarışın': 'Blonde', 'Kızıl': 'Redhead', 'Gri': 'Grey',
        'Doğal Düz': 'Natural Straight', 'Dalgalı': 'Wavy', 'Toplu': 'Updo', 'Kısa': 'Short', 'Örgülü': 'Braided',
        'Beyaz Stüdyo': 'White Studio Background', 'Bej Stüdyo': 'Beige Studio Background', 'Outdoor': 'Outdoor Nature', 'Ev İçi': 'Cozy Home Interior', 'Sahil': 'Sandy Beach', 'Lüks Otel': 'Luxury Hotel Room', 'Otel Odası': 'Hotel Room',
        'Katalog Çekimi': 'Catalog Shot', 'Reklam': 'Commercial Shot', 'Sosyal Medya': 'Social Media Style',
        'Soft Difüz': 'Soft Diffused Flash', 'Sert': 'Hard Flash', 'Yok': 'No Flash', 'Doğal': 'Natural Lighting',
        'Topuklu': 'High Heels', 'Düz': 'Flat Shoes', 'Spor': 'Sneakers', 'Sandalet': 'Sandals',
        'Kolye': 'Necklace', 'Küpe': 'Earrings', 'Bilezik': 'Bracelet', 'Gözlük': 'Glasses',
        'Farklı (Karışık)': 'Mixed Ethnicity', 'Türk': 'Turkish', 'Avrupalı': 'European', 'İskandinav': 'Scandinavian', 'Akdeniz': 'Mediterranean', 'Doğu Asyalı': 'East Asian', 'Afrikalı': 'African', 'Latin': 'Latina', 'Orta Doğulu': 'Middle Eastern', 'Slav / Doğu Avrupalı': 'Slavic / Eastern European',
        'Göz Hizası': 'Eye-level Shot', 'Alt Açı (Low Angle)': 'Low Angle Shot', 'Üst Açı (High Angle)': 'High Angle Shot', 'Geniş Açı': 'Wide Angle', 'Yakın Çekim (Portre)': 'Portrait Close-up',
      };
      return db[str] || str;
    };

    let resolvedClothingType = kyafetTuru;
    if (kyafetTuru === 'Genel') {
      try {
        showToast('Kıyafet analizi yapılıyor...', 'info');
        const data = await api.analyzeImage(productImage);
        if (data.category) {
          resolvedClothingType = data.category;
          showToast(`Kıyafet tespit edildi: ${data.category}`, 'success');
        } else {
          resolvedClothingType = 'Fashion piece';
        }
      } catch(err) {
        resolvedClothingType = 'Fashion piece';
      }
    }

    let translatedZemin = zeminTarifi;
    let translatedEkstra = ekstraPrompt;
    if (zeminTarifi.trim()) {
      try {
        const res = await api.translate(zeminTarifi);
        translatedZemin = res.translated || zeminTarifi;
      } catch { /* fallback */ }
    }
    if (ekstraPrompt.trim()) {
      try {
        const res = await api.translate(ekstraPrompt);
        translatedEkstra = res.translated || ekstraPrompt;
      } catch { /* fallback */ }
    }

    const prompt = [
      `${t(sunumModu)} ${t(resolvedClothingType)} photography.`,
      `Camera Angle: ${t(kameraAcisi)}. Lighting: ${t(isikTipi)}, ${t(flasTipi)}. Tone: ${t(renktonu)}. Shot: ${t(cekim)}.`,
      `Model: ${t(etnikKoken)} ethnicity ${t(modelYas)} ${t(cinsiyet)}, ${t(vucutTipi)}, ${t(sacRengi)} ${t(sacStili)} hair.`,
      `Shoes: ${t(ayakkabi)}. Accessories: ${t(aksesuar)}.`,
      `Setting: ${t(mekan)}.`,
      translatedZemin ? `Background specific: ${translatedZemin}.` : '',
      translatedEkstra,
    ].filter(Boolean).join(' ');

    try {
      if (mukayeseliUret) {
        const modelsToRun = ['Nano Banana Pro', 'SeedDream 4.5'];
        const promises = modelsToRun.map(m =>
          api.generate({
            imageUrl: productImage, mankenImage: mankenUploadImage, desenImage: desenUploadImage, modelKilitli,
            prompt, outputMode: cekim, complianceMode: 'Catalog Safe',
            selectedModel: m,
            aspectRatio: enBoyOrani === 'Özel' ? ozelOlcu : enBoyOrani,
          }).catch(e => ({ error: e.message }))
        );

        const results = await Promise.all(promises);
        const [res1, res2] = results;

        if ((res1 as any).error && (res2 as any).error) throw new Error(`${(res1 as any).error} & ${(res2 as any).error}`);
        
        if ((res1 as any).resultUrl) setResultImage((res1 as any).resultUrl);
        else showToast(`Nano Banana Pro Hatası: ${(res1 as any).error}`, 'error');

        if ((res2 as any).resultUrl) setMukayeseImage((res2 as any).resultUrl);
        else showToast(`SeedDream Hatası: ${(res2 as any).error}`, 'error');

        setActivePreview('model1');
        showToast('Mukayeseli üretim tamamlandı!', 'success');
        try { const bal = await api.getBalance(); setBalance(bal.balance); } catch {}

      } else {
        const data = await api.generate({
          imageUrl: productImage, mankenImage: mankenUploadImage, desenImage: desenUploadImage, modelKilitli,
          prompt, outputMode: cekim, complianceMode: 'Catalog Safe',
          selectedModel,
          aspectRatio: enBoyOrani === 'Özel' ? ozelOlcu : enBoyOrani,
        });

        if (data.resultUrl) {
          setResultImage(data.resultUrl);
          setMukayeseImage(null);
          showToast('Görsel başarıyla oluşturuldu!', 'success');
          try { const bal = await api.getBalance(); setBalance(bal.balance); } catch {}
        } else {
          throw new Error('Sonuç URL\'i alınamadı');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Üretim başarısız, tekrar deneyin', 'error');
      console.error('[Workspace] generate error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      showToast('İndirme başlatılıyor...', 'info');
      const response = await fetch(resultImage);
      if (!response.ok) throw new Error('Görsel indirilemedi');
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `fasheone-${selectedModel.replace(/\s/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Görsel indirildi!', 'success');
    } catch (err: any) {
      window.open(resultImage, '_blank');
      showToast('Doğrudan indirme başarısız, yeni sekmede açıldı', 'info');
    }
  };

  const handleCopy = async () => {
    if (!resultImage) return;
    try {
      await navigator.clipboard.writeText(resultImage);
      showToast('URL panoya kopyalandı', 'success');
    } catch {
      showToast('Kopyalama başarısız', 'error');
    }
  };

  const currentCredit = mukayeseliUret ? 20 : (MODELS.find(m => m.name === selectedModel)?.credit ?? 12);

  return (
    <React.Fragment>
      <ToastContainer toasts={toasts} onClose={closeToast} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onAuth={handleAuth} />

      <div className="flex min-h-screen flex-col bg-[#0d0d1a] text-gray-200 font-sans overflow-x-hidden text-sm lg:h-screen lg:flex-row lg:overflow-hidden">

        {/* ===== SOL PANEL ===== */}
        <aside className="flex w-full min-w-0 flex-col border-b border-[#1e1e3a] lg:w-[320px] lg:min-w-[320px] lg:overflow-hidden lg:border-b-0 lg:border-r">

          {/* User bar */}
          <div className="p-3 border-b border-[#1e1e3a] flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">{user.email[0].toUpperCase()}</div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-300 truncate max-w-[140px]">{user.email}</span>
                  <span className="text-xs text-purple-400 font-bold">{balance !== null ? `${balance.toFixed(2)} ₺` : '...'} bakiye</span>
                </div>
                <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-400 ml-2">Çıkış</button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 rounded-lg font-medium">
                Giriş Yap / Kayıt Ol
              </button>
            )}
          </div>

          {/* Yükleme Alanı */}
          <div className="p-3 border-b border-[#1e1e3a] grid grid-cols-2 gap-2">
            <UploadZone label="① Çizim (Opsiyonel)" image={drawingImage} onUpload={e => handleUpload(e, 'drawing')} inputRef={drawingRef} />
            <UploadZone label="② Ürün Görseli *"    image={productImage} onUpload={e => handleUpload(e, 'product')} inputRef={productRef} />
          </div>

          <div className="p-3 space-y-4 lg:flex-1 lg:overflow-y-auto">

            {/* Model Seçimi */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-purple-400 font-bold text-base">⚙ Model Seçimi</h3>
                <label className="flex items-center gap-2 cursor-pointer bg-[#111127] border border-[#2a2a4a] px-2 py-1 rounded hover:border-purple-500 transition shadow-lg">
                  <input type="checkbox" className="hidden" checked={mukayeseliUret} onChange={() => setMukayeseliUret(!mukayeseliUret)} />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${mukayeseliUret ? 'bg-purple-500 border-purple-500' : 'border-gray-500'}`}>
                    {mukayeseliUret && <span className="text-white text-[10px] leading-none">✓</span>}
                  </div>
                  <span className={`text-xs font-bold leading-none select-none ${mukayeseliUret ? 'text-purple-400' : 'text-gray-400'}`}>Mukayeseli</span>
                </label>
              </div>
              
              {!mukayeseliUret && (
                <div className="space-y-2 mb-4 bg-[#111127] p-2 rounded-xl border border-[#1e1e3a]">
                  {MODELS.map(m => (
                    <div key={m.name} onClick={() => setSelectedModel(m.name)} className="cursor-pointer px-2 py-1.5 hover:bg-[#1a1a2e] rounded transition">
                      <label className="flex items-center justify-between">
                        <span className={`flex items-center gap-2 text-sm ${selectedModel === m.name ? 'text-white' : 'text-gray-400'}`}>
                          <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${selectedModel === m.name ? 'border-purple-500 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'border-gray-600'}`} />
                          {m.name}
                        </span>
                        <span className="text-xs text-purple-300 font-medium">{m.credit} kredi</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-gray-400 mb-1">Kıyafet Türü</p>
                  <Select value={kyafetTuru} onChange={setKyafetTuru}
                    options={['Genel','İç Giyim','Bra','Panty','Bra Set','Shapewear','Loungewear','Swimwear']} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-400 mb-1">En Boy Oranı</p>
                    <Select value={enBoyOrani} onChange={setEnBoyOrani}
                      options={['3:4', '1:1', '4:3', '9:16', '16:9', 'Özel']} />
                  </div>
                  {enBoyOrani === 'Özel' && (
                    <div>
                      <p className="text-gray-400 mb-1">Özel Çözünürlük</p>
                      <input 
                        type="text" 
                        value={ozelOlcu} 
                        onChange={e => setOzelOlcu(e.target.value)} 
                        placeholder="1024x1024"
                        className="w-full bg-[#1a1a2e] border border-[#2a2a4a] text-gray-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Çoklu Renk Optimizasyonu</span>
                  <Toggle value={cokluRenk} onChange={setCokluRenk} />
                </div>

                <div>
                  <p className="text-gray-400 mb-1.5">Üst Parça Rengi</p>
                  <div className="flex flex-wrap gap-1">
                    {COLOR_SWATCHES.map(c => (
                      <button key={c} onClick={() => setSelectedColor(c)}
                        type="button"
                        aria-label={`Üst parça rengini ${c} yap`}
                        className={`w-5 h-5 rounded-full border-2 transition ${selectedColor === c ? 'border-purple-400 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Dişilik Modu</span>
                  <Toggle value={disilikModu} onChange={setDisilikModu} />
                </div>
              </div>
            </section>

            {/* Arka Plan */}
            <section>
              <p className="text-gray-300 font-medium mb-1.5">🌿 Model Arka Plan Tarifi</p>
              <textarea
                value={zeminTarifi}
                onChange={e => setZeminTarifi(e.target.value)}
                placeholder="Örn: Soft luxury studio, beige tones"
                rows={2}
                className="w-full bg-[#1a1a2e] border border-[#2a2a4a] text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 resize-none"
              />
            </section>

            {/* Çekim Parametreleri */}
            <section>
              <h3 className="text-purple-400 font-bold text-base mb-3">📷 Çekim Parametreleri</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-400 mb-1">Parça Küresi</p>
                  <Select value={parcaKuresi} onChange={setParcaKuresi} options={['Atletik','Minimal','Klasik','Lüks']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Sunum Modu</p>
                  <Select value={sunumModu} onChange={setSunumModu} options={['Katalog Çekimi','Reklam','Editoryal','Sosyal Medya']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Kamera Açısı</p>
                  <Select value={kameraAcisi} onChange={setKameraAcisi} options={['Göz Hizası','Alt Açı (Low Angle)','Üst Açı (High Angle)','Geniş Açı','Yakın Çekim (Portre)']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Işık Tipi</p>
                  <Select value={isikTipi} onChange={setIsikTipi} options={['Stüdyo Aydınlığı','Doğal Işık','Golden Hour','Dramatik']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Renk Tonu</p>
                  <Select value={renktonu} onChange={setRenktonu} options={['Açık Nötr','Sıcak Beyaz','Soğuk Gri','Krem']} />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-gray-400 mb-1">Çekim Mesafesi</p>
                <Select value={cekim} onChange={setCekim} options={[
                  'Uzak Çekim (Tüm Vücut)',
                  'Orta Çekim (Bel Hizası)',
                  'Yakın Çekim (Ürün Detay)',
                  'Ghost Mannequin',
                ]} />
              </div>
            </section>

            {/* Manken Detayları */}
            <section>
              <h3 className="text-purple-400 font-bold text-base mb-3">🧍 Manken Detayları</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-gray-400 mb-1">Etnik Köken</p>
                  <Select value={etnikKoken} onChange={setEtnikKoken} options={['Farklı (Karışık)','Türk','Avrupalı','İskandinav','Akdeniz','Doğu Asyalı','Afrikalı','Latin','Orta Doğulu','Slav / Doğu Avrupalı']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Yaş Grubu</p>
                  <Select value={modelYas} onChange={setModelYas} options={['Genç (18-25)','Yetişkin (25-35)','Orta Yaş (35-45)']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Cinsiyet</p>
                  <Select value={cinsiyet} onChange={setCinsiyet} options={['Kadın','Erkek','Non-binary']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Vücut Tipi</p>
                  <Select value={vucutTipi} onChange={setVucutTipi} options={['Standart','İnce','Atletik','Dolgun','Plus Size']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Saç Rengi</p>
                  <Select value={sacRengi} onChange={setSacRengi} options={['Brunet','Siyah','Sarışın','Kızıl','Gri']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Saç Stili</p>
                  <Select value={sacStili} onChange={setSacStili} options={['Doğal Düz','Dalgalı','Toplu','Kısa','Örgülü']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Boy Uzunluğu</p>
                  <Select value={boyUzunlugu} onChange={setBoyUzunlugu} options={['Seçiniz','Kısa','Orta','Uzun']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Vücut Yapısı</p>
                  <Select value={vucutYapisi} onChange={setVucutYapisi} options={['Seçiniz','Zayıf','Normal','Kaslı','Dolgun']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Ayakkabı</p>
                  <Select value={ayakkabi} onChange={setAyakkabi} options={['Yok','Topuklu','Düz','Spor','Sandalet']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Aksesuar</p>
                  <Select value={aksesuar} onChange={setAksesuar} options={['Yok','Kolye','Küpe','Bilezik','Gözlük']} />
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Flaş Tipi</p>
                  <Select value={flasTipi} onChange={setFlasTipi} options={['Soft Difüz','Sert','Yok','Doğal']} />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-gray-400 mb-1">Mekan</p>
                <Select value={mekan} onChange={setMekan} options={['Beyaz Stüdyo','Bej Stüdyo','Outdoor','Ev İçi','Sahil','Lüks Otel']} />
              </div>
            </section>

            {/* Gelişmiş Model Kontrolleri */}
            <section className="space-y-3 pt-2">
              <div className="bg-[#111127] border border-[#2a2a4a] rounded-xl p-3 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-gray-300 font-bold">Model Sürekliliği</p>
                  <p className="text-gray-500 text-xs mt-0.5">Beğendiğiniz modeli sonraki üretimlerde koruyun.</p>
                </div>
                <button
                  onClick={() => setModelKilitli(!modelKilitli)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border text-sm font-medium transition ${modelKilitli ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-[#1a1a2e] text-gray-400 border-[#2a2a4a] hover:bg-[#2a2a4a]'}`}
                >
                  <span className="text-lg leading-none">{modelKilitli ? '🔒' : '🔓'}</span>
                  {modelKilitli ? 'Kilitlendi' : 'Kilitle'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111127] border border-[#2a2a4a] border-dashed rounded-xl p-3 flex flex-col items-start gap-2 relative group hover:border-[#4a4a7a] transition shadow-lg">
                  <p className="text-gray-300 font-bold mb-1 line-clamp-1">Manken Model Ekle</p>
                  <p className="text-gray-500 text-[10px] leading-relaxed mb-2 opacity-80">Modelin kimliğini sabit tutmak istiyorsanız yükleyin.</p>
                  <button onClick={() => mankenRef.current?.click()} className="w-full py-2 bg-[#1a1a2e] rounded border border-[#2a2a4a] text-gray-400 text-xs hover:text-purple-400 hover:border-purple-500/50 transition flex items-center justify-center gap-2 mt-auto">
                    {mankenUploadImage ? <span className="text-green-400">✅ Yüklendi</span> : <span>🖼️ Manken Yükle</span>}
                  </button>
                  <input ref={mankenRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'manken')} />
                </div>

                <div className="bg-[#111127] border border-[#2a2a4a] border-dashed rounded-xl p-3 flex flex-col items-start gap-2 relative group hover:border-[#4a4a7a] transition shadow-lg">
                  <p className="text-gray-300 font-bold mb-1 line-clamp-1">Desen Yükle</p>
                  <p className="text-gray-500 text-[10px] leading-relaxed mb-2 opacity-80">Kıyafetin kumaşını bu desenle değiştirin.</p>
                  <button onClick={() => desenRef.current?.click()} className="w-full py-2 bg-[#1a1a2e] rounded border border-[#2a2a4a] text-gray-400 text-xs hover:text-purple-400 hover:border-purple-500/50 transition flex items-center justify-center gap-2 mt-auto">
                    {desenUploadImage ? <span className="text-green-400">✅ Yüklendi</span> : <span>🖼️ Desen Yükle</span>}
                  </button>
                  <input ref={desenRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'desen')} />
                </div>
              </div>
            </section>

            {/* Ekstra Prompt */}
            <section>
              <p className="text-gray-300 font-medium mb-1.5">✍ Ekstra Yönergeler</p>
              <textarea
                value={ekstraPrompt}
                onChange={e => setEkstraPrompt(e.target.value)}
                placeholder="Örn: 3 farklı pozisyonda göster..."
                rows={3}
                className="w-full bg-[#1a1a2e] border border-[#2a2a4a] text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 resize-none"
              />
            </section>

          </div>

          {/* Alt Aksiyon */}
          <div className="p-3 border-t border-[#1e1e3a] space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Model: <span className="text-purple-400 font-bold">{currentCredit} kredi</span></span>
              <span className={balance !== null && balance < currentCredit ? 'text-red-400' : 'text-gray-500'}>
                Bakiye: {balance !== null ? `${balance.toFixed(2)} ₺` : 'Giriş yapın'}
              </span>
            </div>
            <button
              id="generate-btn"
              onClick={handleGenerate}
              disabled={isLoading || !productImage}
              className="w-full bg-gradient-to-r from-purple-700 to-pink-600 hover:from-purple-600 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition shadow-lg text-sm"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  İşleniyor...
                </span>
              ) : '⚡ Canlı Model Oluştur'}
            </button>
          </div>
        </aside>

        {/* ===== SAĞ PANEL ===== */}
        <main className="flex min-h-[70vh] flex-1 flex-col bg-[#0a0a18] lg:min-h-0 lg:overflow-hidden">

          <div className="flex items-center gap-1 overflow-x-auto px-3 pt-3 pb-0 border-b border-[#1e1e3a] sm:px-4">
            {['Üret','Karşılaştırma','Galeri','Arşiv'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-t transition ${activeTab === tab ? 'bg-[#1a1a2e] text-purple-300 border border-[#2a2a4a] border-b-0' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
            <div className="ml-auto hidden items-center gap-2 mb-2 sm:flex">
              <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div> Sistem Aktif
              </span>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-auto flex items-start justify-center sm:p-6">
            <div className="w-full max-w-2xl">
              <div className="bg-[#111127] border border-[#1e1e3a] rounded-2xl overflow-hidden aspect-[3/4] flex items-center justify-center relative shadow-2xl">

                {isLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff3366] border-t-transparent shadow-[0_0_15px_#ff336688]" />
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[#ff3366] font-medium animate-pulse tracking-wide text-lg">Sihir örüyoruz...</p>
                      <p className="text-white/30 text-[10px] font-bold tracking-[0.3em] uppercase">Fasheone</p>
                    </div>
                  </div>
                ) : resultImage || mukayeseImage ? (
                  <div className="w-full h-full relative group bg-[#0a0a18]">
                    <img 
                      src={activePreview === 'model1' || !mukayeseImage ? resultImage! : mukayeseImage} 
                      alt="Üretilen Model Görseli" 
                      className="w-full h-full object-cover transition-all duration-300" 
                    />
                    <div className="absolute top-3 right-3 bg-black/80 px-3 py-1.5 text-xs rounded-lg text-white font-bold backdrop-blur-sm border border-white/10 shadow-xl">
                      {activePreview === 'model1' || !mukayeseImage ? 'Nano Banana Pro' : 'SeedDream 4.5'}
                    </div>

                    {mukayeseImage && resultImage && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/15 shadow-2xl">
                        <button 
                          onClick={() => setActivePreview('model1')} 
                          aria-label="Nano Banana Pro sonucunu göster"
                          className={`relative w-14 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${activePreview === 'model1' ? 'border-purple-500 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-100'}`}
                        >
                          <img src={resultImage} alt="Nano Banana" className="w-full h-full object-cover" />
                        </button>
                        <button 
                          onClick={() => setActivePreview('model2')} 
                          aria-label="SeedDream 4.5 sonucunu göster"
                          className={`relative w-14 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${activePreview === 'model2' ? 'border-purple-500 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-100'}`}
                        >
                          <img src={mukayeseImage} alt="SeedDream" className="w-full h-full object-cover" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : productImage ? (
                  <div className="flex flex-col items-center gap-3 p-6">
                    <img src={productImage} alt="Yüklenen Ürün" className="max-h-64 object-contain opacity-60 rounded-xl" />
                    <p className="text-gray-500 text-sm text-center">
                      Ürün yüklendi. Ayarları yapıp<br />
                      <span className="text-purple-400 font-semibold">⚡ Canlı Model Oluştur</span>&apos;a basın.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-[#1a1a2e] flex items-center justify-center text-3xl">🪡</div>
                    <p className="text-gray-400">Ürün görselini yükleyip model oluşturun</p>
                    <p className="text-gray-600 text-sm">Desteklenen: PNG, JPG, WEBP · Maks 10MB</p>
                  </div>
                )}

                {resultImage && (
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-sm text-white px-3 py-1 rounded-full">
                    ✨ {selectedModel} · Fasheone
                  </div>
                )}
              </div>

              {resultImage && (
                <div className="mt-4 flex gap-2 justify-center flex-wrap">
                  <button
                    id="regenerate-btn"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-[#1a1a2e] border border-[#2a2a4a] hover:border-purple-500 text-gray-300 px-4 py-2 rounded-lg text-sm transition disabled:opacity-40"
                  >
                    🔄 Yeniden Üret
                  </button>
                  <button
                    id="download-btn"
                    onClick={handleDownload}
                    className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition font-semibold"
                  >
                    ⬇️ İndir PNG
                  </button>
                  <button
                    id="copy-btn"
                    onClick={handleCopy}
                    className="bg-[#1a1a2e] border border-[#2a2a4a] hover:border-blue-500 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
                  >
                    📋 URL Kopyala
                  </button>
                  <button
                    id="favorite-btn"
                    onClick={() => showToast('Favorilere eklendi', 'success')}
                    className="bg-[#1a1a2e] border border-[#2a2a4a] hover:border-pink-500 text-gray-300 px-4 py-2 rounded-lg text-sm transition"
                  >
                    ❤️ Favorile
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </React.Fragment>
  );
}
