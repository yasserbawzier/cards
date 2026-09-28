import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  QrCode, 
  Sparkles, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInstall?: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  onOpenInstall,
}) => {
  const [appUrl, setAppUrl] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      setAppUrl(currentUrl);

      QRCode.toDataURL(currentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then(setQrUrl)
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareTitle = 'تطبيق بطاقتي - البطاقة الرقمية الذكية';
  const shareText = `📇 احصل على بطاقتك الرقمية الذكية عبر تطبيق «بطاقتي»:\nحفظ جهات الاتصال، أرقام الواتساب، وحسابات الصرافة والبنوك بكل سهولة مع باركود QR:\n${appUrl}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div 
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">مشاركة التطبيق</h3>
              <p className="text-[11px] text-slate-400">شارك رابط التطبيق مع أصدقائك وعملائك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* رمز QR لفتح التطبيق على الهاتف */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800/90 text-center">
          <div className="p-2 bg-white rounded-xl shadow-lg mb-2">
            {qrUrl ? (
              <img src={qrUrl} alt="رمز QR لفتح التطبيق" className="w-36 h-36" />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-slate-800">
                <QrCode className="w-8 h-8 animate-pulse" />
              </div>
            )}
          </div>
          <p className="text-xs font-bold text-slate-300">
            امسح الباركود بالكاميرا لفتح التطبيق في الجوال
          </p>
        </div>

        {/* رابط التطبيق وزر النسخ */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
          <input
            type="text"
            readOnly
            value={appUrl}
            dir="ltr"
            className="w-full bg-transparent px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none truncate"
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ</span>
              </>
            )}
          </button>
        </div>

        {/* خيارات المشاركة المباشرة */}
        <div className="grid grid-cols-2 gap-2">
          {/* مشاركة عبر واتساب */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all text-center"
          >
            <MessageSquare className="w-4 h-4" />
            <span>عبر واتساب</span>
          </a>

          {/* مشاركة النظام الشاملة */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>مشاركة الرابط</span>
          </button>
        </div>

        {/* زر التثبيت من داخل نافذة المشاركة إن أراد */}
        {onOpenInstall && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInstall();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>هل تريد تثبيت التطبيق على جوالك؟ اضغط هنا</span>
          </button>
        )}
      </div>
    </div>
  );
};
