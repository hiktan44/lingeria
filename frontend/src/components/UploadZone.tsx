'use client';

import { useRef, useState } from 'react';

interface UploadZoneProps {
  onUpload: (file: File, dataUrl: string) => void;
  preview?: string | null;
  label: string;
  accept?: string;
  maxSizeMB?: number;
  required?: boolean;
}

export function UploadZone({ onUpload, preview, label, accept = 'image/*', maxSizeMB = 10, required = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onUpload(file, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label} {required && <span className="text-red-400">*</span>}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          preview ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-32 mx-auto rounded" />
        ) : (
          <p className="text-sm text-gray-400">Görsel yüklemek için tıklayın</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
