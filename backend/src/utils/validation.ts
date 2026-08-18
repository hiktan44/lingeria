export function validateGenerateInput(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.imageUrl) {
    errors.push('imageUrl gereklidir');
  }

  if (body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.startsWith('data:')) {
    const sizeInBytes = Math.round((body.imageUrl.length * 3) / 4);
    const sizeInMB = sizeInBytes / (1024 * 1024);
    if (sizeInMB > 10) {
      errors.push('Görsel boyutu 10MB\'dan küçük olmalıdır');
    }
  }

  const validModels = ['Nano Banana Pro', 'Nano Banana 2', 'SeedDream 4.5', 'SeedDream 5.0', 'ChatGPT Image 1.5'];
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
