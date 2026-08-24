import { useCallback } from 'react';
import { useLang } from './use-lang';

type Lang = 'tr' | 'en';

// Translation dictionary with namespace structure
export const DICT: Record<string, Record<Lang, string>> = {
  // Common
  'common.and': { tr: 've', en: 'and' },

  // Navigation
  'nav.features': { tr: 'Özellikler', en: 'Features' },
  'nav.howItWorks': { tr: 'Nasıl Çalışır', en: 'How It Works' },
  'nav.pricing': { tr: 'Fiyatlandırma', en: 'Pricing' },
  'nav.goToApp': { tr: 'Uygulamaya Git', en: 'Go to App' },
  'nav.privacy': { tr: 'Gizlilik', en: 'Privacy' },
  'nav.terms': { tr: 'Kullanım Şartları', en: 'Terms of Service' },
  'nav.cookies': { tr: 'Çerezler', en: 'Cookies' },
  'nav.contact': { tr: 'İletişim', en: 'Contact' },
  
  // Hero section
  'hero.badge': { tr: 'Yeni Nesil Yapay Zeka Stüdyosu v2.0', en: 'Next-Gen AI Studio v2.0' },
  'hero.title': { tr: 'Geleceğin Moda Stüdyosuna Hoş Geldiniz', en: 'Welcome to the Future Fashion Studio' },
  'hero.subtitle': { tr: 'Fiziksel numunelerinizi saniyeler içinde büyüleyici e-ticaret görsellerine dönüştürün. Manken, mekan veya prodüksiyon maliyeti olmadan yaratıcılığınızı özgür bırakın.', en: 'Transform your physical samples into stunning e-commerce visuals in seconds. Unleash your creativity without model, location, or production costs.' },
  'hero.cta.primary': { tr: 'Stüdyoya Giriş Yap', en: 'Enter Studio' },
  'hero.cta.secondary': { tr: 'Nasıl Çalışır?', en: 'How It Works?' },
  
  // Features section
  'features.title': { tr: 'Sınırları Kaldıran Özellikler', en: 'Limitless Features' },
  'features.subtitle': { tr: 'Geleneksel fotoğraf çekimlerinin karmaşasını unutun. Fasheone AI ile tüm kontrol elinizde.', en: 'Forget the complexity of traditional photo shoots. With Fasheone AI, you have full control.' },
  'features.advancedModels.title': { tr: 'Gelişmiş Model Senaryoları', en: 'Advanced Model Scenarios' },
  'features.advancedModels.desc': { tr: 'Nano Banana Pro ve SeedDream 5.0 gibi endüstri lideri AI modelleri ile en yüksek fotorealistik kaliteyi elde edin.', en: 'Achieve the highest photorealistic quality with industry-leading AI models like Nano Banana Pro and SeedDream 5.0.' },
  'features.modelCustomization.title': { tr: 'Manken Özelleştirme', en: 'Model Customization' },
  'features.modelCustomization.desc': { tr: 'Yaş, vücut tipi, saç rengi ve boy uzunluğu gibi parametreleri saniyeler içinde değiştirerek hedeflenen kitleye uygun görseller üretin.', en: 'Generate visuals tailored to your target audience by changing parameters like age, body type, hair color, and height in seconds.' },
  'features.lightingControl.title': { tr: 'Işık ve Mekan Kontrolü', en: 'Lighting and Location Control' },
  'features.lightingControl.desc': { tr: 'Stüdyo aydınlatması, dış mekan veya gece çekimi gibi profesyonel aydınlatma kurulumlarını tek tıkla uygulayın.', en: 'Apply professional lighting setups like studio lighting, outdoor, or night shots with a single click.' },
  
  // Product display
  'product.raw': { tr: 'Ham Ürün (Girdi)', en: 'Raw Product (Input)' },
  'product.aiOutput': { tr: 'Yapay Zeka Çıktısı', en: 'AI Output' },
  
  // Pricing section
  'pricing.title': { tr: 'Kullandığınız kadar kredi', en: 'Pay as you go credits' },
  'pricing.subtitle': { tr: 'Her üretimin kredi maliyeti işlemden önce çalışma alanında gösterilir. Krediler Lingeria hesabınıza özeldir ve fasheone.com bakiyesiyle otomatik birleşmez.', en: 'Each generation credit cost is shown in the workspace before processing. Credits are specific to your Lingeria account and do not automatically merge with fasheone.com balance.' },
  'pricing.basic': { tr: 'Başlangıç · 100 kredi', en: 'Basic · 100 credits' },
  'pricing.studio': { tr: 'Stüdyo · 250 kredi', en: 'Studio · 250 credits' },
  'pricing.pro': { tr: 'Profesyonel · 500 kredi', en: 'Professional · 500 credits' },
  'pricing.terms': { tr: 'Güncel fiyat ve ödeme koşulları satın alma ekranında gösterilir.', en: 'Current price and payment terms are shown on the purchase screen.' },
  
  // Footer
  'footer.rights': { tr: 'Tüm hakları saklıdır.', en: 'All rights reserved.' },
  'footer.legalLabel': { tr: 'Yasal ve iletişim bağlantıları', en: 'Legal and contact links' },
  
  // Authentication
  'auth.login': { tr: 'Giriş Yap', en: 'Login' },
  'auth.register': { tr: 'Kayıt Ol', en: 'Register' },
  'auth.forgotPassword': { tr: 'Şifremi Unuttum', en: 'Forgot Password' },
  'auth.email': { tr: 'Email', en: 'Email' },
  'auth.password': { tr: 'Şifre', en: 'Password' },
  'auth.emailPlaceholder': { tr: 'email@example.com', en: 'email@example.com' },
  'auth.passwordPlaceholder': { tr: 'En az 6 karakter', en: 'At least 6 characters' },
  'auth.passwordHelp': { tr: 'En az 6 karakter.', en: 'At least 6 characters.' },
  'auth.acceptTerms': { tr: 'Kullanım Şartları ve Gizlilik Politikası\'nı kabul ediyorum.', en: 'I accept the Terms of Service and Privacy Policy.' },
  'auth.processing': { tr: 'İşleniyor...', en: 'Processing...' },
  'auth.sendResetLink': { tr: 'Sıfırlama Bağlantısı Gönder', en: 'Send Reset Link' },
  'auth.noAccount': { tr: 'Hesabın yok mu?', en: 'Don\'t have an account?' },
  'auth.hasAccount': { tr: 'Zaten hesabın var mı?', en: 'Already have an account?' },
  'auth.toRegister': { tr: 'Kayıt Ol', en: 'Register' },
  'auth.toLogin': { tr: 'Giriş Yap', en: 'Login' },
  'auth.backToLogin': { tr: 'Giriş ekranına dön', en: 'Back to login' },
  'auth.closeDialog': { tr: 'Pencereyi kapat', en: 'Close dialog' },
  'auth.error': { tr: 'Bir hata oluştu', en: 'An error occurred' },
  
  // Workspace
  'workspace.login': { tr: 'Giriş Yap / Kayıt Ol', en: 'Login / Register' },
  'workspace.logout': { tr: 'Çıkış', en: 'Logout' },
  'workspace.balance': { tr: 'bakiye', en: 'balance' },
  'workspace.drawingUpload': { tr: 'Çizim (Opsiyonel)', en: 'Drawing (Optional)' },
  'workspace.productUpload': { tr: 'Ürün Görseli *', en: 'Product Image *' },
  'workspace.upload': { tr: 'Yükle', en: 'Upload' },
  'workspace.modelSelection': { tr: 'Model Seçimi', en: 'Model Selection' },
  'workspace.comparative': { tr: 'Mukayeseli', en: 'Comparative' },
  'workspace.credits': { tr: 'kredi', en: 'credits' },
  'workspace.clothingType': { tr: 'Kıyafet Türü', en: 'Clothing Type' },
  'workspace.aspectRatio': { tr: 'En Boy Oranı', en: 'Aspect Ratio' },
  'workspace.customResolution': { tr: 'Özel Çözünürlük', en: 'Custom Resolution' },
  'workspace.multicolorOpt': { tr: 'Çoklu Renk Optimizasyonu', en: 'Multi-Color Optimization' },
  'workspace.topColor': { tr: 'Üst Parça Rengi', en: 'Top Color' },
  'workspace.femininityMode': { tr: 'Dişilik Modu', en: 'Femininity Mode' },
  'workspace.modelBackground': { tr: 'Model Arka Plan Tarifi', en: 'Model Background Description' },
  'workspace.backgroundPlaceholder': { tr: 'Örn: Soft luxury studio, beige tones', en: 'E.g: Soft luxury studio, beige tones' },
  'workspace.shootParams': { tr: 'Çekim Parametreleri', en: 'Shooting Parameters' },
  'workspace.bodySphere': { tr: 'Parça Küresi', en: 'Body Sphere' },
  'workspace.presentationMode': { tr: 'Sunum Modu', en: 'Presentation Mode' },
  'workspace.cameraAngle': { tr: 'Kamera Açısı', en: 'Camera Angle' },
  'workspace.lightingType': { tr: 'Işık Tipi', en: 'Lighting Type' },
  'workspace.colorTone': { tr: 'Renk Tonu', en: 'Color Tone' },
  'workspace.shootDistance': { tr: 'Çekim Mesafesi', en: 'Shooting Distance' },
  'workspace.modelDetails': { tr: 'Manken Detayları', en: 'Model Details' },
  'workspace.ethnicity': { tr: 'Etnik Köken', en: 'Ethnicity' },
  'workspace.ageGroup': { tr: 'Yaş Grubu', en: 'Age Group' },
  'workspace.gender': { tr: 'Cinsiyet', en: 'Gender' },
  'workspace.bodyType': { tr: 'Vücut Tipi', en: 'Body Type' },
  'workspace.hairColor': { tr: 'Saç Rengi', en: 'Hair Color' },
  'workspace.hairStyle': { tr: 'Saç Stili', en: 'Hair Style' },
  'workspace.height': { tr: 'Boy Uzunluğu', en: 'Height' },
  'workspace.bodyStructure': { tr: 'Vücut Yapısı', en: 'Body Structure' },
  'workspace.select': { tr: 'Seçiniz', en: 'Select' },
  'workspace.shoes': { tr: 'Ayakkabı', en: 'Shoes' },
  'workspace.accessories': { tr: 'Aksesuar', en: 'Accessories' },
  'workspace.flashType': { tr: 'Flaş Tipi', en: 'Flash Type' },
  'workspace.location': { tr: 'Mekan', en: 'Location' },
  'workspace.modelConsistency': { tr: 'Model Sürekliliği', en: 'Model Consistency' },
  'workspace.modelConsistencyDesc': { tr: 'Beğendiğiniz modeli sonraki üretimlerde koruyun.', en: 'Preserve your preferred model in future generations.' },
  'workspace.locked': { tr: 'Kilitlendi', en: 'Locked' },
  'workspace.lock': { tr: 'Kilitle', en: 'Lock' },
  'workspace.addMannequin': { tr: 'Manken Model Ekle', en: 'Add Mannequin Model' },
  'workspace.addMannequinDesc': { tr: 'Modelin kimliğini sabit tutmak istiyorsanız yükleyin.', en: 'Upload if you want to keep the model identity fixed.' },
  'workspace.uploadMannequin': { tr: 'Manken Yükle', en: 'Upload Mannequin' },
  'workspace.uploadPattern': { tr: 'Desen Yükle', en: 'Upload Pattern' },
  'workspace.uploadPatternDesc': { tr: 'Kıyafetin kumaşını bu desenle değiştirin.', en: 'Replace the clothing fabric with this pattern.' },
  'workspace.extraInstructions': { tr: 'Ekstra Yönergeler', en: 'Extra Instructions' },
  'workspace.extraPlaceholder': { tr: 'Örn: 3 farklı pozisyonda göster...', en: 'E.g: Show in 3 different positions...' },
  'workspace.currentCredit': { tr: 'Model:', en: 'Model:' },
  'workspace.yourBalance': { tr: 'Bakiye:', en: 'Balance:' },
  'workspace.loginRequired': { tr: 'Giriş yapın', en: 'Login required' },
  'workspace.generate': { tr: 'Canlı Model Oluştur', en: 'Generate Live Model' },
  'workspace.processing': { tr: 'İşleniyor...', en: 'Processing...' },
  'workspace.weavingMagic': { tr: 'Sihir örüyoruz...', en: 'Weaving magic...' },
  'workspace.productLoaded': { tr: 'Ürün yüklendi. Ayarları yapııp', en: 'Product loaded. Configure settings and' },
  'workspace.clickGenerate': { tr: '\'a basın.', en: 'click' },
  'workspace.uploadProduct': { tr: 'Ürün görselini yükleyip model oluşturun', en: 'Upload product image and create model' },
  'workspace.supportedFormats': { tr: 'Desteklenen: PNG, JPG, WEBP · Maks 10MB', en: 'Supported: PNG, JPG, WEBP · Max 10MB' },
  'workspace.regenerate': { tr: 'Yeniden Üret', en: 'Regenerate' },
  'workspace.download': { tr: 'İndir PNG', en: 'Download PNG' },
  'workspace.copyURL': { tr: 'URL Kopyala', en: 'Copy URL' },
  'workspace.favorite': { tr: 'Favorile', en: 'Favorite' },
  'workspace.producingImage': { tr: 'Üretilen Model Görseli', en: 'Produced Model Image' },
  'workspace.uploadedProduct': { tr: 'Yüklenen Ürün', en: 'Uploaded Product' },
  
  // Workspace tabs
  'tabs.generate': { tr: 'Üret', en: 'Generate' },
  'tabs.comparison': { tr: 'Karşılaştırma', en: 'Comparison' },
  'tabs.gallery': { tr: 'Galeri', en: 'Gallery' },
  'tabs.archive': { tr: 'Arşiv', en: 'Archive' },
  'tabs.systemActive': { tr: 'Sistem Aktif', en: 'System Active' },
  
  // Toast messages
  'toast.loginSuccess': { tr: 'Giriş başarılı!', en: 'Login successful!' },
  'toast.logoutSuccess': { tr: 'Çıkış yapıldı', en: 'Logged out' },
  'toast.fileTooLarge': { tr: 'Dosya 10MB\'dan büyük olamaz', en: 'File cannot exceed 10MB' },
  'toast.uploadProductFirst': { tr: 'Lütfen önce bir ürün görseli yükleyin', en: 'Please upload a product image first' },
  'toast.invalidResolution': { tr: 'Geçersiz özel ölçü formatı (örn: 1024x1024)', en: 'Invalid custom resolution format (e.g: 1024x1024)' },
  'toast.analyzingClothing': { tr: 'Kıyafet analizi yapılıyor...', en: 'Analyzing clothing...' },
  'toast.clothingDetected': { tr: 'Kıyafet tespit edildi:', en: 'Clothing detected:' },
  'toast.comparativeSuccess': { tr: 'Mukayeseli üretim tamamlandı!', en: 'Comparative generation completed!' },
  'toast.imageGenerated': { tr: 'Görsel başarıyla oluşturuldu!', en: 'Image successfully created!' },
  'toast.nanoBananaError': { tr: 'Nano Banana Pro Hatası:', en: 'Nano Banana Pro Error:' },
  'toast.seedDreamError': { tr: 'SeedDream Hatası:', en: 'SeedDream Error:' },
  'toast.generationFailed': { tr: 'Üretim başarısız, tekrar deneyin', en: 'Generation failed, please try again' },
  'toast.downloadStarting': { tr: 'İndirme başlatılıyor...', en: 'Starting download...' },
  'toast.imageDownloaded': { tr: 'Görsel indirildi!', en: 'Image downloaded!' },
  'toast.imageFailed': { tr: 'Görsel indirilemedi', en: 'Failed to download image' },
  'toast.downloadFailed': { tr: 'Doğrudan indirme başarısız, yeni sekmede açıldı', en: 'Direct download failed, opened in new tab' },
  'toast.urlCopied': { tr: 'URL panoya kopyalandı', en: 'URL copied to clipboard' },
  'toast.copyFailed': { tr: 'Kopyalama başarısız', en: 'Copy failed' },
  'toast.favorited': { tr: 'Favorilere eklendi', en: 'Added to favorites' },
  
  // Language switcher
  'langSwitch.tooltip': { tr: 'Dili değiştir', en: 'Switch language' },
  'langSwitch.tr': { tr: 'TR', en: 'TR' },
  'langSwitch.en': { tr: 'EN', en: 'EN' },
};

// Translation function
export function t(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const entry = DICT[key];
  
  if (!entry) {
    console.warn(`Missing translation key: ${key}`);
    return key;
  }
  
  const text = entry[lang] || entry.tr; // Fallback to Turkish
  
  if (!vars) return text;
  
  // Simple variable substitution
  let result = text;
  for (const [varKey, value] of Object.entries(vars)) {
    result = result.replace(`{${varKey}}`, String(value));
  }
  
  return result;
}

// useT hook combines useLang and t
export function useT() {
  const { lang, setLang, isDetected, pickByLang } = useLang();
  
  const translate = useCallback((key: string, vars?: Record<string, string | number>) => {
    return t(key, lang, vars);
  }, [lang]);
  
  return {
    lang,
    setLang,
    isDetected,
    pickByLang,
    t: translate,
  };
}

// For TypeScript
export type { Lang };