import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  X, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppBannerProps {
  forceOpenGuide?: boolean;
  onCloseGuide?: () => void;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({
  forceOpenGuide = false,
  onCloseGuide,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const isGuideActive = forceOpenGuide || showGuideModal;

  const handleCloseModal = () => {
    setShowGuideModal(false);
    if (onCloseGuide) onCloseGuide();
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // إذا كان التطبيق مثبت ومفتوح بالفعل كـ Standalone PWA، نخفي البانر إلا إذا طلب المستخدم الدليل صراحة
  if (isInstalled && !forceOpenGuide) {
    return null;
  }

  return (
    <>
      {/* شريط دعوة التثبيت السريع أعلى الصفحة أو تحت الترويسة إذا لم يتم إغلاقه */}
      {!isDismissed && !isInstalled && (
        <div 
          dir="rtl"
          className="w-full bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-teal-950/90 border-b border-emerald-500/30 px-3 py-2 text-xs flex items-center justify-between gap-2 shadow-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white truncate text-[11px] sm:text-xs">
                تثبيت التطبيق على هاتفك المحمول
              </p>
              <p className="text-[10px] text-emerald-300/80 truncate">
                وصول فوري وسريع لبطاقاتك من الشاشة الرئيسية دون الحاجة للمتصفح
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="btn-install-pwa-top"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalling ? 'جارٍ...' : 'تثبيت الآن'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* نافذة توضيح خطوات التثبيت لـ iPhone / iPad ومختلف الأجهزة */}
      {isGuideActive && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          dir="rtl"
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* الرأس */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isIOS ? 'تثبيت التطبيق على آيفون / آيباد' : 'تثبيت التطبيق على هاتفك'}
                  </h3>
                  <p className="text-[11px] text-slate-400">طريقة سهلة للوصول بضغطة واحدة</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* محتوى الخطوات */}
            {isIOS ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-slate-300">
                    اضغط على زر <strong className="text-white">المشاركة (Share)</strong>{' '}
                    في شريط متصفح سفاري Safari أسفل الشاشة:
                    <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <Share className="w-4 h-4" />
                      <span>زر المشاركة</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-slate-300">
                    مرر القائمة للأسفل واختر{' '}
                    <strong className="text-white">إضافة إلى الصفحة الرئيسية</strong>:
                    <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <PlusSquare className="w-4 h-4" />
                      <span>(Add to Home Screen)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-slate-300">
                    اضغط <strong className="text-emerald-400">إضافة (Add)</strong> في أعلى الزاوية. سيظهر التطبيق فوراً كأيقونة مستقلة على شاشة جهازك!
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 space-y-2">
                  <p className="font-semibold text-white">
                    خطوات التثبيت السريع على أندرويد ومتصفحات كروم:
                  </p>
                  <p>
                    1. اضغط على زر <strong>خيارات المتصفح (⋮)</strong> في الزاوية العلوية.
                  </p>
                  <p>
                    2. اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
                  </p>
                  <p>
                    3. قم بالتأكيد وسيعمل التطبيق بدون الحاجة لفتح المتصفح في كل مرة.
                  </p>
                </div>
              </div>
            )}

            {/* زر الإغلاق */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-colors cursor-pointer"
            >
              فهمت، حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
