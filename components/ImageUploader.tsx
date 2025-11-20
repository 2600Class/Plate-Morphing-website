import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  currentImage: string | null;
  className?: string;
  compact?: boolean;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  currentImage, 
  className = '',
  compact = false,
  label = "Upload Image"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  if (currentImage) {
    return (
      <div className={`relative group w-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl ${className} ${compact ? 'h-48' : 'h-full min-h-[300px]'}`}>
        <img 
          src={currentImage} 
          alt="Uploaded" 
          className="w-full h-full object-contain bg-slate-900/50"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            type="button"
            onClick={triggerInput}
            className={`bg-white text-slate-900 rounded-lg font-medium transform hover:scale-105 transition-transform ${compact ? 'px-3 py-1 text-sm' : 'px-4 py-2'}`}
          >
            Change
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
         <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md uppercase tracking-wide">
          {label}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={triggerInput}
      className={`border-2 border-dashed border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-slate-800/50 transition-all cursor-pointer flex flex-col items-center justify-center group bg-slate-800/20 ${className} ${compact ? 'h-48' : 'w-full h-[400px]'}`}
    >
      <div className={`bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200 border border-slate-700 group-hover:border-indigo-500/50 shadow-lg ${compact ? 'w-10 h-10 mb-2' : 'w-16 h-16 mb-4'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className={`text-slate-400 group-hover:text-indigo-400 ${compact ? 'h-5 w-5' : 'h-8 w-8'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className={`font-medium text-slate-300 group-hover:text-white ${compact ? 'text-sm' : 'text-lg'}`}>{label}</p>
      {!compact && <p className="text-sm text-slate-500 mt-2">Click to browse or select a file</p>}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ImageUploader;