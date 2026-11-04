// Yalnızca raster görsel data URL'leri kabul edilir; SVG ve görsel olmayan
// türler (ör. data:text/html) reddedilir.
const IMAGE_DATA_URL_RE = /^data:image\/(png|jpe?g|webp|gif|heic|heif|avif|bmp|tiff);base64,/i;
export const MAX_IMAGE_MB = 10;
export const MAX_TRANSLATE_CHARS = 5000;

export function validateImageField(value: unknown, field: string, errors: string[]): void {
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string') {
    errors.push(`${field} metin olmalıdır`);
    return;
  }
  if (value.startsWith('data:')) {
    if (!IMAGE_DATA_URL_RE.test(value)) {
      errors.push(`${field}: yalnızca PNG, JPEG, WEBP, GIF, HEIC, AVIF, BMP veya TIFF görsel yüklenebilir`);
      return;
    }
    const sizeInMB = Math.round((value.length * 3) / 4) / (1024 * 1024);
    if (sizeInMB > MAX_IMAGE_MB) {
      errors.push(`${field}: görsel boyutu ${MAX_IMAGE_MB}MB'dan küçük olmalıdır`);
    }
    return;
  }
  if (!/^https?:\/\//i.test(value)) {
    errors.push(`${field}: geçersiz görsel adresi`);
  }
}

export function validateGenerateInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.imageUrl) {
    errors.push('imageUrl gereklidir');
  }

  // Ürün, manken ve desen görsellerinin hepsi tür + boyut kontrolünden geçer
  // (eskiden yalnızca imageUrl'in boyutu denetleniyordu).
  validateImageField(body.imageUrl, 'imageUrl', errors);
  validateImageField(body.mankenImage, 'mankenImage', errors);
  validateImageField(body.desenImage, 'desenImage', errors);

  const validModels = ['Nano Banana Pro', 'Nano Banana 2', 'SeedDream 4.5', 'SeedDream 5.0', 'SeedDream 5.0 Pro', 'ChatGPT Image 1.5'];
  if (body.selectedModel && !validModels.includes(body.selectedModel)) {
    errors.push('Geçersiz model. Seçilebilir: ' + validModels.join(', '));
  }

  if (body.aspectRatio && !/^\d+:\d+$|^\d+[x*]\d+$/.test(body.aspectRatio)) {
    errors.push('Geçersiz aspect ratio formatı (örn: 3:4, 1024x768)');
  }

  if (body.extraPrompt && typeof body.extraPrompt === 'string' && body.extraPrompt.length > 2000) {
    errors.push('Ekstra prompt 2000 karakterden uzun olamaz');
  }

  return { valid: errors.length === 0, errors };
}

export function validateAuthInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.email || typeof body.email !== 'string') {
    errors.push('Email gereklidir');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('Geçerli bir email adresi girin');
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.push('Şifre gereklidir');
  } else if (body.password.length < 6) {
    errors.push('Şifre en az 6 karakter olmalıdır');
  }

  return { valid: errors.length === 0, errors };
}
