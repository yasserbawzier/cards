import React from 'react';
import { 
  User, 
  Building2, 
  Briefcase,
  Phone, 
  Plus, 
  Trash2, 
  MessageSquare, 
  CreditCard, 
  Save, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { DigitalCardData, PhoneNumber, BankAccount } from '../types';
import { cleanPhoneNumberForWhatsapp } from '../utils/vcard';
import { SUPPORTED_BANK_APPS, identifyBankApp } from '../utils/bankAppLinks';

interface SimpleMobileFormProps {
  cardData: DigitalCardData;
  onUpdateCardData: (data: DigitalCardData) => void;
  onSaveAndPreview: () => Promise<void> | void;
  onCancel?: () => void;
  isSaving?: boolean;
  isNewCard?: boolean;
}

const COMMON_BANKS_AR = [
  'شركة العمقي للصرافة',
  'بنك الكريمي للتمويل الأصغر الإسلامي',
  'بنك بن دول للتمويل الأصغر الإسلامي',
  'بنك القطيبي الإسلامي',
  'بنك البسيري للتمويل الأصغر',
  'بنك حضرموت التجاري',
  'محفظة قروشي (بنك حضرموت)',
  'محفظة عدن كاش (بنك عدن)',
  'بنك أمجاد للتمويل الأصغر',
  'بنك التضامن',
  'بنك الشامل اليمني للتمويل الأصغر',
  'شركة الإنماء للصرافة',
];

export const SimpleMobileForm: React.FC<SimpleMobileFormProps> = ({
  cardData,
  onUpdateCardData,
  onSaveAndPreview,
  onCancel,
  isSaving = false,
  isNewCard = false,
}) => {
  const [fullName, setFullName] = React.useState(cardData.profile.fullName || '');
  const [companyName, setCompanyName] = React.useState(cardData.profile.companyName || '');
  const [jobTitle, setJobTitle] = React.useState(cardData.profile.jobTitle || '');
  const [phoneNumbers, setPhoneNumbers] = React.useState<PhoneNumber[]>(
    cardData.phoneNumbers && cardData.phoneNumbers.length > 0
      ? cardData.phoneNumbers
      : [
          {
            label: 'الرقم الرئيسي',
            number: '+967 ',
            isWhatsapp: true,
            whatsappLink: null,
          },
        ]
  );
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>(
    cardData.bankAccounts && cardData.bankAccounts.length > 0
      ? cardData.bankAccounts
      : [
          {
            exchangeName: 'شركة العمقي للصرافة',
            accountNumber: '',
            accountHolderName: '',
          },
        ]
  );
  const [showSavedToast, setShowSavedToast] = React.useState(false);

  // Sync state if cardData updates from external source
  React.useEffect(() => {
    setFullName(cardData.profile.fullName || '');
    setCompanyName(cardData.profile.companyName || '');
    setJobTitle(cardData.profile.jobTitle || '');
    if (cardData.phoneNumbers && cardData.phoneNumbers.length > 0) {
      setPhoneNumbers(cardData.phoneNumbers);
    } else {
      setPhoneNumbers([
        {
          label: 'الرقم الرئيسي',
          number: '+967 ',
          isWhatsapp: true,
          whatsappLink: null,
        },
      ]);
    }
    if (cardData.bankAccounts && cardData.bankAccounts.length > 0) {
      setBankAccounts(cardData.bankAccounts);
    } else {
      setBankAccounts([
        {
          exchangeName: 'شركة العمقي للصرافة',
          accountNumber: '',
          accountHolderName: '',
        },
      ]);
    }
  }, [cardData]);

  const updateCard = (
    updatedName: string,
    updatedCompany: string,
    updatedJob: string,
    updatedPhones: PhoneNumber[],
    updatedBanks: BankAccount[]
  ) => {
    // Generate clean whatsapp links for numbers using the Yemeni-aware helper
    const finalPhones = updatedPhones.map((p) => {
      const cleanDigits = cleanPhoneNumberForWhatsapp(p.number);
      const waLink = p.isWhatsapp && cleanDigits ? `https://wa.me/${cleanDigits}` : null;
      return {
        ...p,
        whatsappLink: waLink,
      };
    });

    const updated: DigitalCardData = {
      ...cardData,
      profile: {
        ...cardData.profile,
        fullName: updatedName,
        companyName: updatedCompany,
        jobTitle: updatedJob,
      },
      phoneNumbers: finalPhones,
      bankAccounts: updatedBanks,
    };
    onUpdateCardData(updated);
  };

  const handleFullNameChange = (val: string) => {
    setFullName(val);
    updateCard(val, companyName, jobTitle, phoneNumbers, bankAccounts);
  };

  const handleCompanyNameChange = (val: string) => {
    setCompanyName(val);
    updateCard(fullName, val, jobTitle, phoneNumbers, bankAccounts);
  };

  const handleJobTitleChange = (val: string) => {
    setJobTitle(val);
    updateCard(fullName, companyName, val, phoneNumbers, bankAccounts);
  };

  // Phone handlers
  const handleAddPhone = () => {
    const newPhone: PhoneNumber = {
      label: phoneNumbers.length === 0 ? 'الرقم الرئيسي' : 'رقم إضافي',
      number: '+967 ',
      isWhatsapp: true,
      whatsappLink: null,
    };
    const updated = [...phoneNumbers, newPhone];
    setPhoneNumbers(updated);
    updateCard(fullName, companyName, jobTitle, updated, bankAccounts);
  };

  const handleRemovePhone = (index: number) => {
    if (phoneNumbers.length <= 1) return;
    const updated = phoneNumbers.filter((_, i) => i !== index);
    setPhoneNumbers(updated);
    updateCard(fullName, companyName, jobTitle, updated, bankAccounts);
  };

  const handlePhoneChange = (index: number, field: keyof PhoneNumber, val: any) => {
    const updated = [...phoneNumbers];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setPhoneNumbers(updated);
    updateCard(fullName, companyName, jobTitle, updated, bankAccounts);
  };

  // دالة مساعدة لاستخراج الأرقام المحلية لليمن بدون تكرار مفتاح الدولة
  const extractLocalYemenDigits = (raw: string): string => {
    if (!raw) return '';
    let str = raw.trim();
    // إزالة أي بادئة +967 أو 00967 أو 967 إذا قام المستخدم بلصق رقم كامل
    str = str.replace(/^\+967\s*/, '')
             .replace(/^00967\s*/, '')
             .replace(/^967\s*/, '');
    return str;
  };

  const handlePhoneDigitsChange = (index: number, val: string) => {
    const localDigits = extractLocalYemenDigits(val);
    const fullNumber = localDigits.trim() ? `+967 ${localDigits}` : '+967 ';
    handlePhoneChange(index, 'number', fullNumber);
  };

  // Bank handlers
  const handleAddBank = () => {
    const newBank: BankAccount = {
      exchangeName: 'شركة العمقي للصرافة',
      accountNumber: '',
      accountHolderName: fullName || '',
    };
    const updated = [...bankAccounts, newBank];
    setBankAccounts(updated);
    updateCard(fullName, companyName, jobTitle, phoneNumbers, updated);
  };

  const handleRemoveBank = (index: number) => {
    if (bankAccounts.length <= 1) return;
    const updated = bankAccounts.filter((_, i) => i !== index);
    setBankAccounts(updated);
    updateCard(fullName, companyName, jobTitle, phoneNumbers, updated);
  };

  const handleBankChange = (index: number, field: keyof BankAccount, val: string) => {
    const updated = [...bankAccounts];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setBankAccounts(updated);
    updateCard(fullName, companyName, jobTitle, phoneNumbers, updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
    onSaveAndPreview();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
      {/* 1. الاسم كامل */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <User className="w-4 h-4" />
          </div>
          <span>الاسم كامل</span>
          <span className="text-rose-400">*</span>
        </label>
        <input
          id="input-fullname"
          type="text"
          value={fullName}
          onChange={(e) => handleFullNameChange(e.target.value)}
          placeholder="مثال: المهندس أحمد سالم باوزير"
          required
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm sm:text-base font-medium transition-colors"
        />
      </div>

      {/* 2. اسم الشركة أو النشاط التجاري */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 className="w-4 h-4" />
          </div>
          <span>اسم الشركة أو النشاط التجاري</span>
        </label>
        <input
          id="input-companyname"
          type="text"
          value={companyName}
          onChange={(e) => handleCompanyNameChange(e.target.value)}
          placeholder="مثال: شركة حضرموت للتجارة والاستيراد"
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm sm:text-base font-medium transition-colors"
        />
      </div>

      {/* 3. المسمى الوظيفي */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
        <label className="flex items-center gap-2 text-sm font-bold text-slate-200 mb-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <span>المسمى الوظيفي</span>
        </label>
        <input
          id="input-jobtitle"
          type="text"
          value={jobTitle}
          onChange={(e) => handleJobTitleChange(e.target.value)}
          placeholder="مثال: المدير العام / مهندس تقنية / مسؤول مبيعات"
          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 text-sm sm:text-base font-medium transition-colors"
        />
      </div>

      {/* 4. أرقام الهواتف وقنوات الواتساب */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Phone className="w-4 h-4" />
            </div>
            <span>أرقام الهواتف والتواصل</span>
          </label>
          <button
            type="button"
            id="btn-add-phone-simple"
            onClick={handleAddPhone}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة رقم</span>
          </button>
        </div>

        <div className="space-y-3">
          {phoneNumbers.map((phone, idx) => {
            const cleanDigits = cleanPhoneNumberForWhatsapp(phone.number);

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={phone.label}
                    onChange={(e) => handlePhoneChange(idx, 'label', e.target.value)}
                    placeholder="الوصف (مثال: مباشر، واتساب)"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[140px]"
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={phone.isWhatsapp}
                        onChange={(e) => handlePhoneChange(idx, 'isWhatsapp', e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                      />
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">واتساب</span>
                    </label>

                    {phoneNumbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                        title="حذف الرقم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  {/* حقل إدخال رقم الهاتف مع مفتاح دولة اليمن ثابت مباشرة ولا يمكن مسحه */}
                  <div 
                    className="flex items-center rounded-xl bg-slate-900 border border-slate-800 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all shadow-inner"
                    dir="ltr"
                  >
                    <div className="px-3 py-2.5 bg-slate-800/90 border-r border-slate-700/80 text-emerald-400 font-mono font-bold text-xs sm:text-sm select-none flex items-center gap-1.5 shrink-0">
                      <span className="text-sm">🇾🇪</span>
                      <span>+967</span>
                    </div>

                    <input
                      type="tel"
                      inputMode="numeric"
                      dir="ltr"
                      value={extractLocalYemenDigits(phone.number)}
                      onChange={(e) => handlePhoneDigitsChange(idx, e.target.value)}
                      placeholder="770 000 000"
                      className="w-full px-3.5 py-2.5 bg-transparent text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono text-sm"
                    />
                  </div>

                  {/* تلميح وتأكيد رابط الواتساب التلقائي */}
                  {phone.isWhatsapp && cleanDigits && (
                    <p className="text-[11px] text-emerald-400/90 mt-1.5 flex items-center gap-1.5 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>رابط الواتساب المباشر: wa.me/{cleanDigits}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. حسابات الصرافة والبنوك */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <span>حسابات الصرافة والبنوك</span>
          </label>
          <button
            type="button"
            id="btn-add-bank-simple"
            onClick={handleAddBank}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة حساب</span>
          </button>
        </div>

        <div className="space-y-3">
          {bankAccounts.map((bank, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-300">
                  الحساب #{idx + 1}
                </span>
                {bankAccounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveBank(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                    title="حذف الحساب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* اختيار أو كتابة جهة الصرافة / البنك */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    جهة الصرافة أو البنك
                  </label>
                  <span className="text-[10px] text-amber-400 font-medium">
                    (انقر لاختيار بنك مدعوم)
                  </span>
                </div>

                {/* أزرار سريعة للبنوك وشركات الصرافة المرتبطة بتطبيقاتها */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Object.values(SUPPORTED_BANK_APPS).map((supportedApp) => {
                    const isSelected = bank.exchangeName === supportedApp.name;
                    return (
                      <button
                        key={supportedApp.id}
                        type="button"
                        onClick={() => handleBankChange(idx, 'exchangeName', supportedApp.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                        title={supportedApp.name}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{supportedApp.badge}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  list={`banks-list-${idx}`}
                  value={bank.exchangeName}
                  onChange={(e) => handleBankChange(idx, 'exchangeName', e.target.value)}
                  placeholder="اختر من القائمة أعلاه أو اكتب اسم البنك..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-xs sm:text-sm font-medium"
                />
                <datalist id={`banks-list-${idx}`}>
                  {Object.values(SUPPORTED_BANK_APPS).map((bApp) => (
                    <option key={bApp.id} value={bApp.name}>
                      {bApp.shortName}
                    </option>
                  ))}
                  {COMMON_BANKS_AR.map((bName) => (
                    <option key={bName} value={bName} />
                  ))}
                </datalist>

                {/* إشعار وتأكيد ربط البنك بالتطبيق المباشر */}
                {identifyBankApp(bank.exchangeName) ? (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>مرتبط تلقائياً بتطبيق ({identifyBankApp(bank.exchangeName)?.shortName}) للفتح الفوري والإيداع</span>
                  </p>
                ) : bank.exchangeName.trim() ? (
                  <p className="text-[11px] text-slate-400 mt-1">
                    سيتم عرض الحساب مع زر النسخ السريع الذكي
                  </p>
                ) : null}
              </div>

              {/* رقم الحساب */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  رقم الحساب
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={bank.accountNumber}
                  onChange={(e) => handleBankChange(idx, 'accountNumber', e.target.value)}
                  placeholder="مثال: 12345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-sm"
                />
              </div>

              {/* اسم صاحب الحساب */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  اسم صاحب الحساب (اختياري)
                </label>
                <input
                  type="text"
                  value={bank.accountHolderName || ''}
                  onChange={(e) => handleBankChange(idx, 'accountHolderName', e.target.value)}
                  placeholder="اسم صاحب الحساب لدى الصرافة"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* زر الحفظ والمتابعة */}
      <div className="flex items-center gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-800 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          id="btn-save-card-final"
          className="flex-[2] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isNewCard ? 'حفظ الكرت وعرضه' : 'حفظ التعديلات'}</span>
        </button>
      </div>
    </form>
  );
};
