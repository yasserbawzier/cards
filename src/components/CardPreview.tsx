import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Download, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Share2,
  Sparkles,
  Smartphone
} from 'lucide-react';
import QRCode from 'qrcode';
import { DigitalCardData } from '../types';
import { 
  identifyBankApp, 
  copyAccountAndOpenBankApp, 
  copyTextToClipboard,
  getBankAppLaunchUrl
} from '../utils/bankAppLinks';

interface CardPreviewProps {
  cardData: DigitalCardData;
  lang: 'ar' | 'en';
  onOpenQr: (qrDataUrl: string) => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ cardData, lang, onOpenQr }) => {
  const isAr = lang === 'ar';
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopyAccount = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedAccount(accountNumber);
    setTimeout(() => {
      setCopiedAccount(null);
    }, 2500);
  };

  const handleLaunchBankApp = (accountNumber: string, exchangeName: string, accountHolderName?: string) => {
    setCopiedAccount(accountNumber);
    setTimeout(() => setCopiedAccount(null), 2500);

    const bankApp = identifyBankApp(exchangeName);
    const accountData = {
      accountNumber,
      exchangeName,
      accountHolderName,
    };

    if (bankApp) {
      copyAccountAndOpenBankApp(bankApp, accountData);
    } else {
      copyTextToClipboard(accountNumber);
    }
  };

  const handleDownloadVcf = () => {
    const vcardContent = cardData.vcardRaw;
    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = (cardData.profile.fullName || 'contact').replace(/\s+/g, '_') + '.vcf';
    link.setAttribute('download', cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleShowQr = async () => {
    try {
      // Use the raw vCard string so mobile cameras directly prompt "Add to Contacts"!
      const qrDataUrl = await QRCode.toDataURL(cardData.vcardRaw, {
        width: 380,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      });
      onOpenQr(qrDataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Action Bar */}
      <div className="w-full max-w-md flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {isAr ? 'معاينة البطاقة الرقمية الحية' : 'Live Digital Business Card'}
        </span>
        <div className="flex items-center gap-2">
          <button
            id="btn-show-qr"
            onClick={handleShowQr}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:text-white hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'رمز QR للجوال' : 'Phone QR'}</span>
          </button>
          <button
            id="btn-download-vcf-top"
            onClick={handleDownloadVcf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md shadow-emerald-900/30"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'تم التحميل!' : 'Saved!'}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحميل vCard' : 'Download .vcf'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Luxury Business Card Container */}
      <div
        id="digital-card-container"
        className="w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/90 shadow-2xl shadow-slate-950/80 overflow-hidden relative"
      >
        {/* Decorative Top Accent & Geometric pattern */}
        <div className="h-28 w-full bg-gradient-to-r from-emerald-900/40 via-teal-800/30 to-slate-900 relative overflow-hidden border-b border-slate-800/50">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-slate-800/80 text-[11px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            NFC & vCard 3.0
          </div>
        </div>

        {/* Profile Card Header Info */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar / Monogram */}
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-xl shadow-emerald-950/50">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl font-bold text-emerald-400 tracking-wider font-mono">
                {cardData.profile.fullName
                  ? cardData.profile.fullName
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                  : 'VC'}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                #{cardData.cardId.slice(0, 16)}
              </span>
            </div>
          </div>

          {/* Full Name & Job Title */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {cardData.profile.fullName || (isAr ? 'الاسم الكامل' : 'Full Name')}
            </h1>
            <p className="text-sm font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span>{cardData.profile.jobTitle || (isAr ? 'المنصب الوظيفي' : 'Job Title')}</span>
            </p>
            {cardData.profile.companyName && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{cardData.profile.companyName}</span>
              </p>
            )}
          </div>

          {/* AI-Generated Bio Section */}
          {cardData.profile.bio && (
            <div className="mb-5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 relative">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400/90 mb-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{isAr ? 'نبذة تعريفية احترافية' : 'Executive Summary'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{cardData.profile.bio}"
              </p>
            </div>
          )}

          {/* Phone Numbers & Direct WhatsApp Links */}
          <div className="space-y-2.5 mb-6">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-0.5">
              <span>{isAr ? 'أرقام الاتصال وقنوات التواصل' : 'Phone & Direct WhatsApp'}</span>
              <span className="text-[10px] text-emerald-400/80 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">
                {cardData.phoneNumbers.length} {isAr ? 'أرقام' : 'numbers'}
              </span>
            </div>

            {cardData.phoneNumbers.map((phone, idx) => {
              const waLink = phone.whatsappLink;
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-300">{phone.label}</span>
                      {phone.isWhatsapp && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <MessageSquare className="w-2.5 h-2.5" />
                          واتساب
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400 dir-ltr select-all">
                      {phone.number}
                    </span>
                  </div>

                  {/* Contact Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${phone.number}`}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 hover:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isAr ? 'اتصال هاتف' : 'Call Phone'}</span>
                    </a>

                    {phone.isWhatsapp && waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-medium text-emerald-300 hover:text-emerald-200 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isAr ? 'محادثة واتساب' : 'WhatsApp'}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900/40 border border-slate-800/40 text-xs font-medium text-slate-600 cursor-not-allowed"
                      >
                        <span>{isAr ? 'واتساب غير متوفر' : 'No WhatsApp'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bank & Exchange Accounts */}
          {cardData.bankAccounts && cardData.bankAccounts.length > 0 && (
            <div className="space-y-2.5 mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-0.5">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  {isAr ? 'بيانات التحويل والصرافة' : 'Exchange & Bank Accounts'}
                </span>
                <span className="text-[10px] text-amber-400/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
                  {cardData.bankAccounts.length} {isAr ? 'حسابات' : 'accounts'}
                </span>
              </div>

              {cardData.bankAccounts.map((account, idx) => {
                const isCopied = copiedAccount === account.accountNumber;
                const matchedBank = identifyBankApp(account.exchangeName);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90 hover:border-amber-500/30 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {account.exchangeName}
                          </span>
                          {matchedBank && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {matchedBank.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs font-semibold text-amber-300 tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all">
                            {account.accountNumber}
                          </span>
                          {account.accountHolderName && (
                            <span className="text-[11px] text-slate-400 truncate">
                              ({account.accountHolderName})
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        id={`btn-copy-account-${idx}`}
                        onClick={() => handleCopyAccount(account.accountNumber)}
                        className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                        title={isAr ? 'نسخ رقم الحساب' : 'Copy account number'}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px]">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">{isAr ? 'نسخ' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* زر فتح التطبيق المباشر عبر رابط أصيل متوافق 100% مع أندرويد */}
                    {matchedBank && (
                      <div className="pt-2 border-t border-slate-900">
                        <a
                          href={getBankAppLaunchUrl(matchedBank)}
                          target="_top"
                          rel="noopener noreferrer"
                          onClick={() => {
                            copyTextToClipboard(account.accountNumber);
                            setCopiedAccount(account.accountNumber);
                            setTimeout(() => setCopiedAccount(null), 2500);
                          }}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 text-white ${matchedBank.buttonBgClass}`}
                        >
                          <Smartphone className="w-3.5 h-3.5 shrink-0" />
                          <span>فتح تطبيق ({matchedBank.shortName})</span>
                          <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Primary Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-800/70">
            <button
              id="btn-download-vcf-main"
              onClick={handleDownloadVcf}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'حفظ جهة الاتصال في الهاتف (.vcf)' : 'Save Contact to Phone (.vcf)'}</span>
            </button>

            <button
              id="btn-open-qr-modal"
              onClick={handleShowQr}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'عرض رمز QR للمسح المباشر بالكاميرا' : 'Show Camera Scannable QR Code'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
