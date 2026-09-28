import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Copy, 
  Check, 
  ArrowRight,
  ExternalLink,
  Smartphone,
  Share2,
  Link,
  Sparkles,
  ChevronDown,
  X,
  Download,
  AlertCircle
} from 'lucide-react';
import { DigitalCardData } from '../types';
import { 
  identifyBankApp, 
  copyAccountAndOpenBankApp, 
  copyTextToClipboard,
  getBankAppLaunchUrl,
  getBankPlayStoreUrl,
  triggerSystemOpenWith
} from '../utils/bankAppLinks';
import { buildPermanentCardUrl } from '../utils/vcard';

interface SimpleMobileCardProps {
  cardData: DigitalCardData;
  onBack?: () => void;
  isPublicView?: boolean;
  onOpenCreateNew?: () => void;
}

interface NotInstalledBankState {
  bankName: string;
  shortName: string;
  accountNumber: string;
  playStoreUrl: string;
}

export const SimpleMobileCard: React.FC<SimpleMobileCardProps> = ({ 
  cardData, 
  onBack,
  isPublicView = false,
  onOpenCreateNew,
}) => {
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeBankToast, setActiveBankToast] = useState<{ message: string; bankName: string } | null>(null);
  const [notInstalledModal, setNotInstalledModal] = useState<NotInstalledBankState | null>(null);

  // التحكم بإخفاء وإظهار الحسابات البنكية وأرقام الهواتف بضغطة زر
  const [isPhonesOpen, setIsPhonesOpen] = useState<boolean>(false);
  const [isBanksOpen, setIsBanksOpen] = useState<boolean>(false);

  // Link to this specific card scoped by ownerId + cardId
  const liveUrl = cardData.ownerId 
    ? buildPermanentCardUrl(cardData.ownerId, cardData.cardId)
    : '';

  const handleCopyCardLiveLink = async () => {
    if (!liveUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `بطاقة ${cardData.profile.fullName} الرسمية`,
          text: `البطاقة الرقمية الرسمية وأرقام الحسابات المعتمدة: ${cardData.profile.fullName}`,
          url: liveUrl,
        });
      } else {
        await navigator.clipboard.writeText(liveUrl);
        setCopiedLink(true);
        setActiveBankToast({
          message: 'تم نسخ الرابط الدائم للبطاقة بنجاح!',
          bankName: '',
        });
        setTimeout(() => setCopiedLink(false), 3000);
        setTimeout(() => setActiveBankToast(null), 3000);
      }
    } catch {
      await navigator.clipboard.writeText(liveUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleCopyPhone = (phoneNum: string) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedPhone(phoneNum);
    setActiveBankToast({
      message: 'تم نسخ رقم الهاتف بنجاح!',
      bankName: '',
    });
    setTimeout(() => {
      setCopiedPhone(null);
      setActiveBankToast(null);
    }, 2500);
  };

  const handleCopyAccount = (accountNumber: string, showToast = true) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedAccount(accountNumber);
    if (showToast) {
      setActiveBankToast({
        message: 'تم نسخ رقم الحساب بنجاح',
        bankName: '',
      });
      setTimeout(() => {
        setActiveBankToast(null);
      }, 3000);
    }
    setTimeout(() => {
      setCopiedAccount(null);
    }, 3000);
  };

  // 1. نسخ رقم الحساب وفتح تطبيق البنك مباشرة عبر Intent صريح بدون browser fallback
  // 2. معالجة خطأ ذكية للتحقق من وجود التطبيق قبل محاولة فتحه لمنع التوجيه غير المقصود للمتجر
  const handleLaunchBankApp = (accountNumber: string, exchangeName: string, accountHolderName?: string) => {
    // نسخ رقم الحساب فوراً إلى الحافظة
    copyTextToClipboard(accountNumber);
    setCopiedAccount(accountNumber);

    const bankApp = identifyBankApp(exchangeName);
    const bankLabel = bankApp ? bankApp.shortName : exchangeName;

    // في حال عدم التعرف على البنك
    if (!bankApp) {
      setActiveBankToast({
        message: `تم نسخ رقم الحساب بنجاح: ${accountNumber}`,
        bankName: exchangeName,
      });
      setTimeout(() => {
        setActiveBankToast(null);
        setCopiedAccount(null);
      }, 3000);
      return;
    }

    const primaryPkg = bankApp.androidPackages && bankApp.androidPackages.length > 0 ? bankApp.androidPackages[0] : '';
    const playStoreUrl = getBankPlayStoreUrl(bankApp);
    const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

    setActiveBankToast({
      message: `تم نسخ رقم الحساب! جارٍ تشغيل (${bankLabel})...`,
      bankName: exchangeName,
    });

    if (isAndroid && primaryPkg) {
      // Intent URL مباشر بدون Browser fallback لمنع أي توجيه غير مقصود للمتجر
      const directIntent = `intent://#Intent;package=${primaryPkg};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end`;

      let appOpened = false;
      const markOpened = () => {
        appOpened = true;
      };

      // الاستماع لأحداث النظام التي تشير إلى أن التطبيق قد فُتح وتوقفت الصفحة الحالية
      window.addEventListener('pagehide', markOpened, { once: true });
      window.addEventListener('blur', markOpened, { once: true });
      const handleVisibilityChange = () => {
        if (document.hidden) {
          markOpened();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange, { once: true });

      // محاولة الفتح المباشر دون أي شاشات وسيطة
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = directIntent;
        } else {
          window.location.href = directIntent;
        }
      } catch {
        window.location.href = directIntent;
      }

      // معالجة خطأ ذكية: إذا ظل المتصفح نشطاً ولم يستجب النظام (التطبيق غير مثبت)
      // لا يتم تحويل المستخدم للمتجر تلقائياً، بل يُعرض له تنبيه واضح مع خيار اختياري
      setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', markOpened);
        window.removeEventListener('blur', markOpened);

        if (!appOpened && !document.hidden) {
          setActiveBankToast(null);
          setNotInstalledModal({
            bankName: bankApp.name,
            shortName: bankApp.shortName,
            accountNumber,
            playStoreUrl,
          });
        }
      }, 1400);

      return;
    }

    if (isIOS) {
      const iosUrl = bankApp.iosScheme || (bankApp.schemes && bankApp.schemes.length > 0 ? bankApp.schemes[0] : '');
      if (iosUrl) {
        window.location.href = iosUrl;
        return;
      }
    }

    // لسطح المكتب أو الحالات الأخرى
    triggerSystemOpenWith({
      accountNumber,
      exchangeName,
      accountHolderName,
    });
  };

  const hasPhoneNumbers = cardData.phoneNumbers && cardData.phoneNumbers.length > 0;
  const hasBankAccounts = cardData.bankAccounts && cardData.bankAccounts.length > 0;

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      {/* زر العودة إلى قائمة البطاقات المسجلة أو شريط مشاركة الرابط الدائم */}
      <div className="w-full flex items-center justify-between gap-2 mb-3.5 flex-wrap">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            id="btn-back-to-registered-cards"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer shadow-md"
          >
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <span>العودة إلى بطاقاتك المسجلة</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>بطاقة رسمية معتمدة</span>
            </span>
          </div>
        )}

        {/* أزرار المشاركة: نسخ ومشاركة الرابط الدائم فقط لحصر الزائر على التطبيق */}
        <div className="flex items-center gap-2 mr-auto">
          {liveUrl && (
            <button
              type="button"
              onClick={handleCopyCardLiveLink}
              id="btn-copy-live-card-link"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-900/30 transition-all cursor-pointer active:scale-95"
              title="مشاركة الرابط الثابت لهذه البطاقة (محدث دائماً)"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم نسخ الرابط!</span>
                </>
              ) : (
                <>
                  <Link className="w-3.5 h-3.5" />
                  <span>مشاركة رابط الكرت</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* عرض معلومات وتفاصيل البطاقة فقط بشكل نقي ومريح */}
      <div
        id="digital-card-container"
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden relative"
      >
        {/* شريط الغلاف العلوي */}
        <div className="h-20 bg-gradient-to-r from-emerald-800 to-teal-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-300">
            بطاقة عمل رقمية
          </div>
        </div>

        {/* جسم البطاقة: الاسم والشركة وبيانات التواصل والحسابات فقط */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* الصورة الرمزية / الحرف الأول */}
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <div className="w-18 h-18 rounded-2xl bg-slate-950 border-3 border-slate-900 shadow-xl flex items-center justify-center text-emerald-400 font-extrabold text-2xl">
              {(cardData.profile.fullName || 'ك').trim().charAt(0)}
            </div>
          </div>

          {/* الاسم والشركة والمسمى الوظيفي */}
          <div className="mb-4">
            <h2 className="text-xl font-black text-white tracking-tight">
              {cardData.profile.fullName || 'بدون اسم'}
            </h2>
            
            {cardData.profile.companyName && (
              <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold mt-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{cardData.profile.companyName}</span>
              </div>
            )}

            {cardData.profile.jobTitle && (
              <div className="text-xs text-slate-400 mt-0.5">
                {cardData.profile.jobTitle}
              </div>
            )}

            {cardData.profile.bio && (
              <p className="text-xs text-slate-400 mt-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                {cardData.profile.bio}
              </p>
            )}
          </div>

          {/* أرقام الهواتف والتواصل المباشر - مخفية وتظهر عند الضغط */}
          {hasPhoneNumbers && (
            <div className="mb-3.5">
              <button
                type="button"
                onClick={() => setIsPhonesOpen(!isPhonesOpen)}
                id="btn-toggle-card-phones"
                className={`w-full p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-right shadow-sm active:scale-[0.99] ${
                  isPhonesOpen
                    ? 'bg-slate-950 border-emerald-500/50 shadow-emerald-950/20'
                    : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
                title="اضغط لإظهار أو إخفاء أرقام التواصل"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-right min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-100">
                      <span>أرقام التواصل والهواتف</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {cardData.phoneNumbers.length}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {isPhonesOpen ? 'انقر لإخفاء الأرقام' : 'انقر لإظهار الأرقام والاتصال أو الواتساب'}
                    </div>
                  </div>
                </div>

                <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 transition-transform duration-300 shrink-0 ${isPhonesOpen ? 'rotate-180 text-emerald-400 border-emerald-500/30' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* قائمة الأرقام المنسدلة عند النقر */}
              {isPhonesOpen && (
                <div className="mt-2.5 space-y-2 animate-fade-in pr-1 pl-1">
                  {cardData.phoneNumbers.map((phone, idx) => {
                    const cleanedNumber = phone.number.replace(/\s+/g, '');
                    const waLink = phone.whatsappLink || `https://wa.me/${cleanedNumber.replace(/[^\d]/g, '')}`;
                    const isCopied = copiedPhone === phone.number;

                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 flex items-center justify-between gap-2 shadow-inner"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-slate-400 truncate">
                            {phone.label || 'هاتف'}
                          </div>
                          <div 
                            className="font-mono text-sm font-bold text-slate-100 tracking-wider hover:text-emerald-300 cursor-pointer select-all transition-colors" 
                            dir="ltr"
                            onClick={() => handleCopyPhone(phone.number)}
                            title="انقر لنسخ رقم الهاتف"
                          >
                            {phone.number}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* زر نسخ رقم الهاتف */}
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(phone.number)}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                            title="نسخ رقم الهاتف"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>

                          {/* زر الاتصال */}
                          <a
                            href={`tel:${cleanedNumber}`}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                            title="اتصال هاتفي مباشر"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          </a>

                          {/* زر الواتساب المباشر */}
                          {phone.isWhatsapp && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                              title="فتح محادثة واتساب مباشرة"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* حسابات الصرافة والبنوك المعتمدة - مخفية وتظهر عند الضغط */}
          {hasBankAccounts && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setIsBanksOpen(!isBanksOpen)}
                id="btn-toggle-card-banks"
                className={`w-full p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-right shadow-sm active:scale-[0.99] ${
                  isBanksOpen
                    ? 'bg-slate-950 border-amber-500/50 shadow-amber-950/20'
                    : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
                title="اضغط لإظهار أو إخفاء الحسابات البنكية المعتمدة"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="text-right min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-100">
                      <span>الحسابات البنكية المعتمدة</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {cardData.bankAccounts.length}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {isBanksOpen ? 'انقر لإخفاء الحسابات' : 'انقر لإظهار الحسابات والإيداع المباشر'}
                    </div>
                  </div>
                </div>

                <div className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 transition-transform duration-300 shrink-0 ${isBanksOpen ? 'rotate-180 text-amber-400 border-amber-500/30' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Toast إشعار نسخ الحساب وفتح التطبيق المباشر */}
              {activeBankToast && (
                <div className="my-2.5 p-2.5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border border-emerald-500/40 text-xs text-slate-200 flex items-center gap-2.5 shadow-lg animate-fade-in">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 text-right leading-tight">
                    <div className="font-bold text-emerald-300">تم النسخ بنجاح!</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">{activeBankToast.message}</div>
                  </div>
                </div>
              )}

              {/* قائمة الحسابات البنكية المنسدلة عند النقر */}
              {isBanksOpen && (
                <div className="mt-2.5 space-y-2.5 animate-fade-in pr-1 pl-1">
                  {cardData.bankAccounts.map((account, idx) => {
                    const isCopied = copiedAccount === account.accountNumber;
                    const matchedBank = identifyBankApp(account.exchangeName);

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-col gap-2.5 hover:border-slate-700/80 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-amber-400 truncate">
                                {account.exchangeName}
                              </span>
                              {matchedBank && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  {matchedBank.badge}
                                </span>
                              )}
                            </div>
                            
                            <div 
                              className="font-mono text-sm sm:text-base font-extrabold text-white tracking-wider mt-1 select-all cursor-pointer hover:text-amber-300 transition-colors" 
                              dir="ltr"
                              onClick={() => handleCopyAccount(account.accountNumber)}
                              title="انقر لنسخ رقم الحساب"
                            >
                              {account.accountNumber}
                            </div>
                            
                            {account.accountHolderName && (
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                باسم: <span className="text-slate-300 font-medium">{account.accountHolderName}</span>
                              </div>
                            )}
                          </div>

                          {/* زر النسخ السريع فقط */}
                          <button
                            type="button"
                            onClick={() => handleCopyAccount(account.accountNumber)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                              isCopied
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                            title="نسخ رقم الحساب فقط"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* شريط الانتقال لتطبيق البنك - فتح مباشر عبر Intent بدون Browser fallback مع فحص ذكي */}
                        <div className="pt-2 border-t border-slate-900 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLaunchBankApp(account.accountNumber, account.exchangeName, account.accountHolderName)}
                            className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98 text-white ${
                              matchedBank ? matchedBank.buttonBgClass : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                            title={`نسخ رقم الحساب وفتح تطبيق ${matchedBank ? matchedBank.shortName : account.exchangeName}`}
                          >
                            <Smartphone className="w-4 h-4 shrink-0" />
                            <span>
                              {matchedBank 
                                ? `فتح تطبيق (${matchedBank.shortName})` 
                                : `نسخ رقم الحساب والتحويل (${account.exchangeName})`
                              }
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* نافذة معالجة الخطأ الذكية عند عدم العثور على التطبيق أو عدم تثبيته */}
      {notInstalledModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setNotInstalledModal(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative text-center flex flex-col gap-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setNotInstalledModal(null)}
              className="absolute top-3 left-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mt-1">
              <Smartphone className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-100">
                تطبيق ({notInstalledModal.shortName}) غير مثبت
              </h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                لم يتم العثور على التطبيق مثبتًا على هاتفك. تم نسخ رقم الحساب بنجاح إلى الحافظة:
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-amber-300 tracking-wider select-all">
                {notInstalledModal.accountNumber}
              </span>
              <button
                type="button"
                onClick={() => {
                  copyTextToClipboard(notInstalledModal.accountNumber);
                  handleCopyAccount(notInstalledModal.accountNumber);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>تم النسخ</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {notInstalledModal.playStoreUrl && (
                <a
                  href={notInstalledModal.playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق من Google Play (اختياري)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setNotInstalledModal(null)}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* شريط الإعلان الذكي لانتشار التطبيق (Viral Promo Banner) */}
      <div className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/20 text-center shadow-lg">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300 mb-1">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>أنشئ بطاقة أعمالك وحساباتك المصرفية برابط دائم مجاناً!</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3 max-w-sm mx-auto">
          شارك حساباتك البنكية وأرقامك مع عملائك بسهولة وسرعة بضغطة زر واحدة.
        </p>
        <button
          type="button"
          onClick={() => {
            if (onOpenCreateNew) {
              onOpenCreateNew();
            } else {
              window.location.href = window.location.origin;
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-950/60 transition-all cursor-pointer active:scale-95"
        >
          <span>إنشاء بطاقتي الرقمية الآن ✨</span>
        </button>
      </div>
    </div>
  );
};
