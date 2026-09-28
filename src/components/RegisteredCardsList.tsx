import React, { useState } from 'react';
import { 
  Building2, 
  Eye, 
  Trash2, 
  QrCode, 
  FileText, 
  Check, 
  Loader2, 
  Plus, 
  Edit3, 
  Search, 
  X, 
  SearchX, 
  Briefcase, 
  Share2,
  Link,
  CreditCard,
  Copy,
  ExternalLink,
  Smartphone,
  ChevronDown,
  Phone,
  MessageSquare
} from 'lucide-react';
import QRCode from 'qrcode';
import { DigitalCardData } from '../types';
import { buildPermanentCardUrl } from '../utils/vcard';
import { 
  identifyBankApp, 
  copyAccountAndOpenBankApp, 
  copyTextToClipboard,
  getBankAppLaunchUrl
} from '../utils/bankAppLinks';

interface RegisteredCardsListProps {
  cards: DigitalCardData[];
  onViewCard: (card: DigitalCardData) => void;
  onEditCard: (card: DigitalCardData) => void;
  onOpenQr: (qrDataUrl: string, cardName: string) => void;
  onDeleteCard: (cardId: string, cardName: string) => void;
  onAddNewCard: () => void;
  onOpenShareApp?: () => void;
}

// دالة لتطبيع النصوص العربية لتسهيل البحث (الهمزات والتاء المربوطة)
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, ''); // إزالة التشكيل
}

// توليد صورة الباركود بدقة عالية للمشاركة
async function generateBarcodeImageFile(card: DigitalCardData): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 760;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Background
  ctx.fillStyle = '#020617'; // slate-950
  ctx.fillRect(0, 0, 600, 760);

  // Card Border
  ctx.strokeStyle = '#1e293b'; // slate-800
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 568, 728);

  // Header Title
  ctx.fillStyle = '#10b981'; // emerald-500
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('بطاقة أعمال رقمية', 300, 68);

  // Full Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(card.profile.fullName || 'بطاقة عمل', 300, 118);

  // Company Name
  if (card.profile.companyName) {
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '20px sans-serif';
    ctx.fillText(card.profile.companyName, 300, 155);
  }

  // Generate QR Canvas with permanent live card link
  const cardUrl = card.ownerId ? buildPermanentCardUrl(card.ownerId, card.cardId) : (card.vcardRaw || card.profile.fullName);
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, cardUrl, {
    width: 380,
    margin: 2,
    color: {
      dark: '#020617',
      light: '#ffffff',
    },
  });

  // White Card Background for QR Code
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(100, 185, 400, 400, 20);
  ctx.fill();
  ctx.drawImage(qrCanvas, 110, 195, 380, 380);

  // Instructions text below QR
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('امسح الباركود لفتح البطاقة والحسابات في التطبيق', 300, 630);

  // Phone number if available
  if (card.phoneNumbers && card.phoneNumbers[0]?.number) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(card.phoneNumbers[0].number, 300, 670);
  }

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const fileName = `barcode-${(card.profile.fullName || 'card').replace(/\s+/g, '_')}.png`;
        resolve(new File([blob], fileName, { type: 'image/png' }));
      } else {
        reject(new Error('Failed to create image blob'));
      }
    }, 'image/png');
  });
}

// تنسيق بيانات الكرت كنص أنيق للمشاركة
function formatCardAsText(card: DigitalCardData): string {
  let text = `📇 بطاقة عمل رقمية\n`;
  text += `👤 الاسم: ${card.profile.fullName}\n`;
  if (card.profile.companyName) {
    text += `🏢 الشركة: ${card.profile.companyName}\n`;
  }
  if (card.profile.jobTitle) {
    text += `💼 المسمى: ${card.profile.jobTitle}\n`;
  }

  if (card.phoneNumbers && card.phoneNumbers.length > 0) {
    text += `\n📞 أرقام التواصل:\n`;
    card.phoneNumbers.forEach((p) => {
      text += `• ${p.label || 'هاتف'}: ${p.number}`;
      if (p.isWhatsapp && p.whatsappLink) {
        text += ` (واتساب: ${p.whatsappLink})`;
      }
      text += `\n`;
    });
  }

  if (card.bankAccounts && card.bankAccounts.length > 0) {
    text += `\n💳 حسابات الصرافة والبنوك:\n`;
    card.bankAccounts.forEach((b) => {
      text += `• ${b.exchangeName}: ${b.accountNumber}`;
      if (b.accountHolderName) {
        text += ` (باسم: ${b.accountHolderName})`;
      }
      text += `\n`;
    });
  }

  if (card.ownerId) {
    const liveUrl = buildPermanentCardUrl(card.ownerId, card.cardId);
    text += `\n🔗 رابط البطاقة والإيداع المباشر في التطبيق:\n${liveUrl}\n`;
  }

  return text.trim();
}

export const RegisteredCardsList: React.FC<RegisteredCardsListProps> = ({
  cards,
  onViewCard,
  onEditCard,
  onOpenQr,
  onDeleteCard,
  onAddNewCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sharingImageCardId, setSharingImageCardId] = useState<string | null>(null);
  const [copiedTextCardId, setCopiedTextCardId] = useState<string | null>(null);
  const [copiedLinkCardId, setCopiedLinkCardId] = useState<string | null>(null);
  const [copiedAccountKey, setCopiedAccountKey] = useState<string | null>(null);
  const [copiedPhoneKey, setCopiedPhoneKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // التحكم بإخفاء وإظهار الحسابات البنكية وأرقام الهواتف لكل كرت
  const [expandedBanksCardIds, setExpandedBanksCardIds] = useState<Record<string, boolean>>({});
  const [expandedPhonesCardIds, setExpandedPhonesCardIds] = useState<Record<string, boolean>>({});

  const toggleCardBanks = (cardId: string) => {
    setExpandedBanksCardIds(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const toggleCardPhones = (cardId: string) => {
    setExpandedPhonesCardIds(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const handleCopyPhone = (phoneKey: string, phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhoneKey(phoneKey);
    setToastMessage(`تم نسخ رقم الهاتف: ${phoneNumber}`);
    setTimeout(() => {
      setCopiedPhoneKey(null);
      setToastMessage(null);
    }, 2500);
  };

  // تصفية البطاقات حسب: اسم الشخص، اسم الشركة، أو المسمى الوظيفي
  const filteredCards = cards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const query = normalizeArabic(searchQuery);

    const name = normalizeArabic(card.profile.fullName || '');
    const company = normalizeArabic(card.profile.companyName || '');
    const job = normalizeArabic(card.profile.jobTitle || '');

    return name.includes(query) || company.includes(query) || job.includes(query);
  });

  // قراءة رمز الكيو ار وعرضه
  const handleOpenQrCode = async (card: DigitalCardData) => {
    try {
      // توجيه رمز الكيو ار إلى الرابط المباشر للتطبيق بدلاً من ملف جهة الاتصال لحصر المستخدم على التطبيق
      const cardUrl = card.ownerId 
        ? buildPermanentCardUrl(card.ownerId, card.cardId) 
        : (card.vcardRaw || card.profile.fullName);

      const qrDataUrl = await QRCode.toDataURL(cardUrl, {
        width: 380,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      });
      onOpenQr(qrDataUrl, card.profile.fullName);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  // مشاركة صورة الباركود
  const handleShareBarcodeImage = async (card: DigitalCardData) => {
    try {
      setSharingImageCardId(card.cardId);
      const imageFile = await generateBarcodeImageFile(card);

      // Web Share API إذا كانت تدعم مشاركة الملفات
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          files: [imageFile],
          title: `باركود ${card.profile.fullName}`,
          text: `باركود بطاقة عمل: ${card.profile.fullName}`,
        });
        setToastMessage('تمت مشاركة صورة الباركود بنجاح');
      } else {
        // تنزيل كصورة تلقائياً
        const url = URL.createObjectURL(imageFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = imageFile.name;
        link.click();
        URL.revokeObjectURL(url);
        setToastMessage('تم حفظ صورة الباركود في جهازك');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing barcode image:', err);
      }
    } finally {
      setSharingImageCardId(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // مشاركة الكرت كنص
  const handleShareAsText = async (card: DigitalCardData) => {
    const textContent = formatCardAsText(card);

    if (navigator.share) {
      try {
        await navigator.share({
          title: card.profile.fullName,
          text: textContent,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // نسخ إلى الحافظة كبديل
    try {
      await navigator.clipboard.writeText(textContent);
      setCopiedTextCardId(card.cardId);
      setToastMessage('تم نسخ نص بيانات الكرت بنجاح!');
      setTimeout(() => {
        setCopiedTextCardId(null);
        setToastMessage(null);
      }, 3000);
    } catch {
      setToastMessage('تعذر النسخ، يرجى مراجعة صلاحيات المتصفح.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // مشاركة الرابط الدائم للبطاقة
  const handleShareLiveLink = async (card: DigitalCardData) => {
    if (!card.ownerId) return;
    const liveUrl = buildPermanentCardUrl(card.ownerId, card.cardId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `بطاقة ${card.profile.fullName}`,
          text: `البطاقة الرقمية الرسمية وأرقام الحسابات المعتمدة: ${card.profile.fullName}`,
          url: liveUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopiedLinkCardId(card.cardId);
      setToastMessage('تم نسخ الرابط الدائم للبطاقة بنجاح!');
      setTimeout(() => {
        setCopiedLinkCardId(null);
        setToastMessage(null);
      }, 3000);
    } catch {
      setToastMessage('تعذر نسخ الرابط، يرجى المحاولة لاحقاً.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // نسخ رقم الحساب البنكي مباشرة من البطاقة
  const handleCopyAccount = async (accountKey: string, accountNumber: string, bankName: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccountKey(accountKey);
      setToastMessage(`تم نسخ رقم حساب (${bankName}): ${accountNumber}`);
      setTimeout(() => {
        setCopiedAccountKey(null);
        setToastMessage(null);
      }, 3000);
    } catch {
      setToastMessage('تعذر نسخ رقم الحساب، يرجى المحاولة يدوياً.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // 1. نسخ رقم الحساب وفتح تطبيق البنك مباشرة دون انتظار
  const handleLaunchBankApp = (
    accountKey: string,
    accountNumber: string,
    exchangeName: string,
    accountHolderName?: string
  ) => {
    const bankApp = identifyBankApp(exchangeName);
    const accountData = {
      accountNumber,
      exchangeName,
      accountHolderName,
    };

    // إطلاق التطبيق فوراً في أول لحظة
    if (bankApp) {
      copyAccountAndOpenBankApp(bankApp, accountData);
    } else {
      copyTextToClipboard(accountNumber);
    }

    setCopiedAccountKey(accountKey);
    const appLabel = bankApp ? bankApp.shortName : exchangeName;

    setToastMessage(`تم نسخ رقم الحساب! جارٍ فتح (${appLabel})...`);
    setTimeout(() => {
      setCopiedAccountKey(null);
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="w-full animate-fade-in flex flex-col">
      {/* إشعار عند نجاح العملية */}
      {toastMessage && (
        <div className="mb-3 py-2 px-3 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in text-center shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* عنوان القسم: بطاقاتك المسجلة */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <span>بطاقاتك المسجلة</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {cards.length}
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            قائمة البطاقات المسجلة والمحفوظة في حسابك
          </p>
        </div>

        <button
          onClick={onAddNewCard}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>إضافة كرت</span>
        </button>
      </div>

      {/* شريط البحث في أعلى الصفحة: يبحث بالاسم أو الشركة أو المسمى الوظيفي */}
      {cards.length > 0 && (
        <div className="mb-3.5">
          <div className="relative flex items-center">
            <div className="absolute right-3.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-emerald-400" />
            </div>
            <input
              id="input-cards-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الشخص، الشركة، أو المسمى الوظيفي..."
              className="w-full pr-10 pl-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* تفاصيل نتائج البحث */}
          {searchQuery.trim() && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1 font-medium">
              <span>
                نتائج البحث:{' '}
                <strong className="text-emerald-400">{filteredCards.length}</strong> من{' '}
                {cards.length}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                إلغاء التصفية
              </button>
            </div>
          )}
        </div>
      )}

      {/* قائمة البطائق المسجلة أو نتائج البحث */}
      <div className="space-y-3.5">
        {filteredCards.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
              <SearchX className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                لا توجد بطاقة مطابقة لبحثك
              </p>
              <p className="text-xs text-slate-400 mt-1">
                تأكد من كتابة اسم الشخص، اسم الشركة، أو المسمى الوظيفي
              </p>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                مسح نص البحث
              </button>
            )}
          </div>
        ) : (
          filteredCards.map((card) => {
            const isSharingThisBarcode = sharingImageCardId === card.cardId;
            const isCopiedThisText = copiedTextCardId === card.cardId;

            return (
              <div
                key={card.cardId}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-3 hover:border-slate-700/80 transition-all"
              >
                {/* تفاصيل البطاقة: الاسم والشركة والمسمى الوظيفي + زر العرض */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="min-w-0 flex-1">
                    {/* الاسم */}
                    <h3 className="text-base font-extrabold text-white truncate">
                      {card.profile.fullName || 'بدون اسم'}
                    </h3>

                    {/* الشركة */}
                    {card.profile.companyName ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium mt-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{card.profile.companyName}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        لم يُحدد اسم الشركة
                      </div>
                    )}

                    {/* المسمى الوظيفي */}
                    {card.profile.jobTitle && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                        <Briefcase className="w-3 h-3 text-teal-400 shrink-0" />
                        <span className="truncate">{card.profile.jobTitle}</span>
                      </div>
                    )}
                  </div>

                  {/* زر العرض: عند الضغط عليه تظهر معلومات البطاقة فقط */}
                  <button
                    onClick={() => onViewCard(card)}
                    id={`btn-view-card-${card.cardId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer shrink-0"
                    title="عرض بيانات ومعلومات البطاقة كاملة"
                  >
                    <Eye className="w-4 h-4" />
                    <span>العرض</span>
                  </button>
                </div>

                {/* أرقام التواصل والهواتف - قابلة للإظهار والإخفاء بنقرة زر */}
                {card.phoneNumbers && card.phoneNumbers.length > 0 && (
                  <div className="flex flex-col rounded-xl bg-slate-950/70 border border-slate-800/90 overflow-hidden shadow-inner">
                    <button
                      type="button"
                      onClick={() => toggleCardPhones(card.cardId)}
                      className="w-full p-2.5 flex items-center justify-between text-right hover:bg-slate-900/80 transition-colors cursor-pointer"
                      title="اضغط لإظهار أو إخفاء أرقام التواصل"
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">
                          أرقام التواصل ({card.phoneNumbers.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {expandedPhonesCardIds[card.cardId] ? 'إخفاء' : 'إظهار الأرقام'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-300 ${expandedPhonesCardIds[card.cardId] ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {expandedPhonesCardIds[card.cardId] && (
                      <div className="p-2.5 pt-0 border-t border-slate-800/60 mt-1 space-y-1.5 animate-fade-in">
                        {card.phoneNumbers.map((phone, pIdx) => {
                          const phoneKey = `${card.cardId}-p-${pIdx}`;
                          const isCopied = copiedPhoneKey === phoneKey;
                          const cleanedNumber = phone.number.replace(/\s+/g, '');
                          const waLink = phone.whatsappLink || `https://wa.me/${cleanedNumber.replace(/[^\d]/g, '')}`;

                          return (
                            <div
                              key={pIdx}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] text-slate-400 truncate">
                                  {phone.label || 'هاتف'}
                                </div>
                                <div 
                                  className="font-mono text-xs font-bold text-slate-100 tracking-wider hover:text-emerald-300 cursor-pointer select-all transition-colors" 
                                  dir="ltr"
                                  onClick={() => handleCopyPhone(phoneKey, phone.number)}
                                  title="انقر لنسخ رقم الهاتف"
                                >
                                  {phone.number}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCopyPhone(phoneKey, phone.number)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="نسخ رقم الهاتف"
                                >
                                  {isCopied ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                                <a
                                  href={`tel:${cleanedNumber}`}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                  title="اتصال هاتفي"
                                >
                                  <Phone className="w-3 h-3 text-emerald-400" />
                                </a>
                                {phone.isWhatsapp && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                    title="واتساب"
                                  >
                                    <MessageSquare className="w-3 h-3" />
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

                {/* الحسابات البنكية المعتمدة - قابلة للإظهار والإخفاء بنقرة زر */}
                {card.bankAccounts && card.bankAccounts.length > 0 && (
                  <div className="flex flex-col rounded-xl bg-slate-950/70 border border-slate-800/90 overflow-hidden shadow-inner">
                    <button
                      type="button"
                      onClick={() => toggleCardBanks(card.cardId)}
                      className="w-full p-2.5 flex items-center justify-between text-right hover:bg-slate-900/80 transition-colors cursor-pointer"
                      title="اضغط لإظهار أو إخفاء الحسابات البنكية المعتمدة"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-slate-200">
                          الحسابات البنكية المعتمدة ({card.bankAccounts.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {expandedBanksCardIds[card.cardId] ? 'إخفاء' : 'إظهار الحسابات'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-300 ${expandedBanksCardIds[card.cardId] ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {expandedBanksCardIds[card.cardId] && (
                      <div className="p-2.5 pt-0 border-t border-slate-800/60 mt-1 grid grid-cols-1 gap-1.5 animate-fade-in">
                        {card.bankAccounts.map((account, accIdx) => {
                          const accountKey = `${card.cardId}-acc-${accIdx}`;
                          const isCopied = copiedAccountKey === accountKey;
                          const matchedBank = identifyBankApp(account.exchangeName);

                          return (
                            <div
                              key={accIdx}
                              className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors hover:border-slate-700"
                            >
                              {/* اسم البنك ورقم الحساب والاسم */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-xs font-bold truncate ${matchedBank ? matchedBank.colorClass : 'text-slate-200'}`}>
                                    {account.exchangeName}
                                  </span>
                                  {matchedBank && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-semibold shrink-0">
                                      {matchedBank.badge}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    dir="ltr"
                                    className="font-mono text-xs font-bold text-emerald-300 tracking-wider select-all cursor-pointer hover:text-emerald-200"
                                    onClick={() => handleCopyAccount(accountKey, account.accountNumber, account.exchangeName)}
                                    title="انقر لنسخ رقم الحساب"
                                  >
                                    {account.accountNumber}
                                  </span>
                                  {account.accountHolderName && (
                                    <span className="text-[10px] text-slate-400 truncate max-w-[130px]" title={account.accountHolderName}>
                                      ({account.accountHolderName})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* أزرار الإجراء السريع للحساب: نسخ + إيداع بالتطبيق */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                {/* زر نسخ رقم الحساب */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyAccount(accountKey, account.accountNumber, account.exchangeName)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                                  title="نسخ رقم هذا الحساب"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">تم النسخ</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-400" />
                                      <span>نسخ</span>
                                    </>
                                  )}
                                </button>

                                {/* زر فتح تطبيق البنك مباشرة عبر رابط أصيل متوافق 100% مع أندرويد */}
                                {matchedBank ? (
                                  <a
                                    href={getBankAppLaunchUrl(matchedBank)}
                                    target="_top"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                      copyTextToClipboard(account.accountNumber);
                                      setCopiedAccountKey(accountKey);
                                      setToastMessage(`تم نسخ رقم الحساب! جارٍ فتح (${matchedBank.shortName})...`);
                                      setTimeout(() => {
                                        setCopiedAccountKey(null);
                                        setToastMessage(null);
                                      }, 3500);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-sm transition-all cursor-pointer active:scale-95 text-white ${matchedBank.buttonBgClass}`}
                                    title={`نسخ رقم الحساب وفتح تطبيق ${matchedBank.shortName}`}
                                  >
                                    <Smartphone className="w-3.5 h-3.5" />
                                    <span>{matchedBank.shortName}</span>
                                    <ExternalLink className="w-3 h-3 opacity-80" />
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleLaunchBankApp(accountKey, account.accountNumber, account.exchangeName, account.accountHolderName)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-sm transition-all cursor-pointer active:scale-95 bg-emerald-600 hover:bg-emerald-500 text-white"
                                    title={`نسخ رقم الحساب لـ ${account.exchangeName}`}
                                  >
                                    <Smartphone className="w-3.5 h-3.5" />
                                    <span>نسخ الحساب</span>
                                    <ExternalLink className="w-3 h-3 opacity-80" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* أزرار الإجراءات المتوفرة في بطاقاتك المسجلة:
                    1. زر التعديل
                    2. زر قراءة رمز الكيو ار
                    3. زر الحذف
                    4. زر مشاركة الرابط الدائم
                    5. زر المشاركة كصورة (الباركود)
                    6. زر المشاركة كنص
                */}
                <div className="flex flex-col gap-2 pt-0.5">
                  {/* السطر الأول: التعديل - قراءة الكيو ار - الحذف */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* 1. زر التعديل */}
                    <button
                      type="button"
                      onClick={() => onEditCard(card)}
                      id={`btn-edit-card-${card.cardId}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="تعديل بيانات الكرت"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    {/* 2. زر قراءة رمز الكيو ار */}
                    <button
                      type="button"
                      onClick={() => handleOpenQrCode(card)}
                      id={`btn-qr-card-${card.cardId}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-teal-300 hover:text-teal-200 transition-colors cursor-pointer"
                      title="قراءة وعرض رمز الكيو ار QR بالكاميرا"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>رمز QR</span>
                    </button>

                    {/* 3. زر الحذف */}
                    <button
                      type="button"
                      onClick={() => onDeleteCard(card.cardId, card.profile.fullName)}
                      id={`btn-delete-card-${card.cardId}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="حذف هذا الكرت نهائياً من حسابك"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>الحذف</span>
                    </button>
                  </div>

                  {/* السطر الثاني: مشاركة الرابط الدائم - المشاركة كصورة (الباركود) - والمشاركة كنص */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* زر مشاركة الرابط الدائم للمصرفية المحدثة */}
                    <button
                      type="button"
                      onClick={() => handleShareLiveLink(card)}
                      id={`btn-share-link-${card.cardId}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      title="مشاركة ونسخ الرابط الدائم للبطاقة (المحدث دائماً)"
                    >
                      {copiedLinkCardId === card.cardId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-3.5 h-3.5 text-emerald-400" />
                          <span>رابط الكرت</span>
                        </>
                      )}
                    </button>

                    {/* 4. زر المشاركة كصورة (صورة الباركود) */}
                    <button
                      type="button"
                      onClick={() => handleShareBarcodeImage(card)}
                      disabled={isSharingThisBarcode}
                      id={`btn-share-barcode-${card.cardId}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer disabled:opacity-60"
                      title="مشاركة صورة الباركود الخاصة بالكرت"
                    >
                      {isSharingThisBarcode ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      ) : (
                        <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>مشاركة كصورة</span>
                    </button>

                    {/* 5. زر المشاركة كنص */}
                    <button
                      type="button"
                      onClick={() => handleShareAsText(card)}
                      id={`btn-share-text-${card.cardId}`}
                      className="flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-sky-300 hover:text-sky-200 transition-colors cursor-pointer"
                      title="مشاركة بيانات الكرت كنص رسالة أو نسخه"
                    >
                      {isCopiedThisText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                          <span>مشاركة كنص</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
