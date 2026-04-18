"use client";

import { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { storageService } from "@/lib/services/storageService";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  stationId: string;
  userId: string;
  onSuccess: (url: string) => void;
}

export const ImageUpload = ({ stationId, userId, onSuccess }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setStatus('compressing');
      
      // Step 1: Client-side compression to save storage costs
      const compressedBlob = await storageService.compressImage(file);
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
      
      setStatus('uploading');
      
      // Step 2: Upload to Firebase Storage
      const url = await storageService.uploadStationImage(stationId, userId, compressedFile);
      
      setStatus('success');
      onSuccess(url);
      
      // Reset after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "w-full h-12 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[11px] tracking-widest relative overflow-hidden",
          status === 'idle' && "bg-slate-900 text-white hover:bg-black",
          status === 'compressing' && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
          status === 'uploading' && "bg-primary/10 text-primary border border-primary/20",
          status === 'success' && "bg-emerald-500 text-white shadow-emerald-500/20",
          status === 'error' && "bg-rose-500 text-white"
        )}
      >
        {status === 'idle' && (
          <>
            <Camera size={18} className="text-primary" />
            ফটো প্রমাণ যোগ করুন
          </>
        )}
        
        {status === 'compressing' && (
          <>
            <Loader2 size={18} className="animate-spin" />
            ছবি ছোট করা হচ্ছে...
          </>
        )}
        
        {status === 'uploading' && (
          <>
            <Loader2 size={18} className="animate-spin" />
            আপলোড হচ্ছে...
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle size={18} />
            সফলভাবে যুক্ত হয়েছে
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle size={18} />
            আপলোড ব্যর্থ হয়েছে
          </>
        )}

        {/* Shine Animation */}
        {status === 'idle' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
        )}
      </button>
    </div>
  );
};
