import React from 'react';
import { X, Download, Smartphone, Check } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  fullName: string;
  lang: 'ar' | 'en';
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  qrDataUrl,
  fullName,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [downloaded, setDownloaded] = React.useState(false);

  if (!isOpen) return null;

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${(fullName || 'contact').replace(/\s+/g, '_')}_qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {isAr ? 'امسح الرمز لفتح البطاقة' : 'Scan to View Card'}
        </h3>
        <p className="text-xs text-slate-400 mb-4 px-2">
          {isAr
            ? `افتح تطبيق الكاميرا على أي هاتف آيفون أو أندرويد لفتح بطاقة وحسابات ${fullName || 'العمل'} مباشرة في التطبيق`
            : `Open your smartphone camera to instantly view the digital card and bank accounts of ${fullName || 'this contact'} in the app`}
        </p>

        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl shadow-xl mb-5 flex items-center justify-center">
          <img
            src={qrDataUrl}
            alt="vCard QR Code"
            className="w-60 h-60 object-contain rounded-lg"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownloadQr}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-950/50"
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4" />
              <span>{isAr ? 'تم تحميل الصورة!' : 'QR Image Saved!'}</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>{isAr ? 'تحميل صورة QR كملف PNG' : 'Download QR Image (PNG)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
