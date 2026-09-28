import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Building, 
  FileText, 
  Sliders, 
  Phone,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { DigitalCardData, PhoneNumber, BankAccount } from '../types';
import { SAMPLE_TEMPLATES } from '../data/templates';

interface InputPanelProps {
  cardData: DigitalCardData;
  onUpdateCardData: (data: DigitalCardData) => void;
  onGenerateFromRaw: (raw: string) => Promise<void>;
  isLoading: boolean;
  lang: 'ar' | 'en';
}

const COMMON_EXCHANGES_AR = [
  'شركة العمقي للصرافة',
  'بنك الكريمي للتمويل الأصغر الإسلامي',
  'شركة البسيري للصرافة',
  'بنك التضامن',
  'مصرف الراجحي',
  'البنك الأهلي السعودي',
  'بنك اليمن والكويت',
];

export const InputPanel: React.FC<InputPanelProps> = ({
  cardData,
  onUpdateCardData,
  onGenerateFromRaw,
  isLoading,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [activeMode, setActiveMode] = useState<'ai' | 'studio'>('ai');
  const [rawText, setRawText] = useState(SAMPLE_TEMPLATES[0].rawText);

  // Studio form states
  const [fullName, setFullName] = useState(cardData.profile.fullName);
  const [companyName, setCompanyName] = useState(cardData.profile.companyName);
  const [jobTitle, setJobTitle] = useState(cardData.profile.jobTitle);
  const [bio, setBio] = useState(cardData.profile.bio);
  const [phones, setPhones] = useState<PhoneNumber[]>(cardData.phoneNumbers);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(cardData.bankAccounts);

  // Sync internal studio state if cardData updates from AI
  React.useEffect(() => {
    setFullName(cardData.profile.fullName);
    setCompanyName(cardData.profile.companyName);
    setJobTitle(cardData.profile.jobTitle);
    setBio(cardData.profile.bio);
    setPhones(cardData.phoneNumbers);
    setBankAccounts(cardData.bankAccounts);
  }, [cardData]);

  const handleSelectTemplate = (templateRaw: string) => {
    setRawText(templateRaw);
  };

  const handleRunAiProcess = async () => {
    if (!rawText.trim() || isLoading) return;
    await onGenerateFromRaw(rawText);
  };

  const handleSaveStudioChanges = () => {
    const updated: DigitalCardData = {
      ...cardData,
      profile: {
        fullName,
        companyName,
        jobTitle,
        bio,
      },
      phoneNumbers: phones,
      bankAccounts,
    };
    onUpdateCardData(updated);
  };

  const handleAddPhone = () => {
    const newPhone: PhoneNumber = {
      label: isAr ? 'رقم إضافي' : 'Additional Phone',
      number: '+96777',
      isWhatsapp: true,
      whatsappLink: 'https://wa.me/96777',
    };
    const updated = [...phones, newPhone];
    setPhones(updated);
  };

  const handleRemovePhone = (index: number) => {
    const updated = phones.filter((_, i) => i !== index);
    setPhones(updated);
  };

  const handlePhoneChange = (index: number, field: keyof PhoneNumber, value: any) => {
    const updated = phones.map((p, i) => {
      if (i !== index) return p;
      const modified = { ...p, [field]: value };
      if (field === 'isWhatsapp' || field === 'number') {
        const cleanDigits = modified.number.replace(/\D/g, '');
        modified.whatsappLink = modified.isWhatsapp && cleanDigits ? `https://wa.me/${cleanDigits}` : null;
      }
      return modified;
    });
    setPhones(updated);
  };

  const handleAddBank = (prefillName?: string) => {
    const newAcc: BankAccount = {
      exchangeName: prefillName || (isAr ? 'شركة العمقي للصرافة' : 'Bank Account'),
      accountNumber: '',
      accountHolderName: fullName,
    };
    setBankAccounts([...bankAccounts, newAcc]);
  };

  const handleRemoveBank = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const handleBankChange = (index: number, field: keyof BankAccount, value: string) => {
    const updated = bankAccounts.map((b, i) => {
      if (i !== index) return b;
      return { ...b, [field]: value };
    });
    setBankAccounts(updated);
  };

  return (
    <div className="w-full bg-slate-900/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col h-full">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2">
          <button
            id="mode-btn-ai"
            onClick={() => setActiveMode('ai')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'ai'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'معالج النص الخام بالذكاء الاصطناعي' : 'AI Raw Text Engine'}</span>
          </button>

          <button
            id="mode-btn-studio"
            onClick={() => setActiveMode('studio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeMode === 'studio'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'المحرر اليدوي والتحكم' : 'Studio Editor'}</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60 hidden sm:inline-block">
          Gemini 3.8 Flash Engine
        </span>
      </div>

      {activeMode === 'ai' ? (
        <div className="flex flex-col flex-1 gap-4">
          {/* Templates shortcuts */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block">
              {isAr ? 'نماذج جاهزة للتجربة السريعة:' : 'Quick Presets & Scenarios:'}
            </label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  id={`tmpl-btn-${tmpl.id}`}
                  onClick={() => handleSelectTemplate(tmpl.rawText)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all text-left"
                >
                  {isAr ? tmpl.nameAr : tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Raw Text Input */}
          <div className="flex flex-col flex-1">
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                {isAr
                  ? 'الصق أو اكتب تفاصيل الشخص أو صاحب العمل بدون ترتيب:'
                  : 'Paste or write unorganized details (Name, Multiple Phones, Exchange Accounts, etc.):'}
              </span>
              <button
                onClick={() => setRawText('')}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                title="Clear"
              >
                <RotateCcw className="w-3 h-3" />
                {isAr ? 'مسح النص' : 'Clear'}
              </button>
            </label>

            <textarea
              id="raw-details-input"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال:\nاسمي أحمد سالم، مدير شركة النور للتجارة، رقمي الرئيسي 770960110 واتساب، ومبيعات 733445566، وحساب العمقي 25401988، وحساب بنك الكريمي 77096011...'
                  : 'Example:\nName: John Doe, Founder of TechCorp. Primary mobile +1-415-555-0199 (WhatsApp). Support phone +1-415-555-0100. SVB Account #123456789...'
              }
              rows={8}
              className="w-full flex-1 min-h-[220px] p-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-slate-200 text-sm leading-relaxed font-sans placeholder-slate-600 resize-y transition-colors"
            />
          </div>

          {/* Engine Action Button */}
          <div>
            <button
              id="btn-process-ai"
              disabled={isLoading || !rawText.trim()}
              onClick={handleRunAiProcess}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isAr ? 'جاري معالجة المعطيات وتوليد vCard...' : 'Processing & Standardizing JSON...'}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 text-emerald-200" />
                  <span>
                    {isAr
                      ? 'تشغيل محرك الذكاء الاصطناعي واستخراج vCard'
                      : 'Execute AI Engine & Generate vCard'}
                  </span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              {isAr
                ? 'ينتج فوراً ملف vCard v3.0 معتمد وروابط واتساب مباشرة https://wa.me وحسابات صرافة موحدة'
                : 'Outputs strict JSON Schema, formatted vCard v3.0, and direct WhatsApp links instantly'}
            </p>
          </div>
        </div>
      ) : (
        /* Studio Manual Editor */
        <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
          {/* Basic Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">
                {isAr ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <input
                id="studio-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">
                {isAr ? 'اسم الشركة أو المؤسسة' : 'Company Name'}
              </label>
              <input
                id="studio-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">
              {isAr ? 'المنصب أو المسمى الوظيفي' : 'Job Title'}
            </label>
            <input
              id="studio-title"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">
              {isAr ? 'النبذة المهنية (جملتان)' : 'Professional Bio (2 Sentences)'}
            </label>
            <textarea
              id="studio-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Multiple Phone Numbers Editor */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                {isAr ? 'أرقام الهواتف وقنوات الواتساب' : 'Phone Numbers & WhatsApp'}
              </label>
              <button
                id="btn-add-phone"
                onClick={handleAddPhone}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? 'إضافة رقم' : 'Add Phone'}
              </button>
            </div>

            <div className="space-y-2">
              {phones.map((phone, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={phone.label}
                    onChange={(e) => handlePhoneChange(idx, 'label', e.target.value)}
                    placeholder={isAr ? 'الوصف (مثال: الرئيسي)' : 'Label'}
                    className="w-1/3 px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={phone.number}
                    onChange={(e) => handlePhoneChange(idx, 'number', e.target.value)}
                    placeholder="+967..."
                    className="flex-1 px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={phone.isWhatsapp}
                      onChange={(e) => handlePhoneChange(idx, 'isWhatsapp', e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                  </label>
                  {phones.length > 1 && (
                    <button
                      onClick={() => handleRemovePhone(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Multiple Bank & Exchange Accounts */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'حسابات الصرافة والبنوك' : 'Exchange & Bank Accounts'}
              </label>
              <button
                id="btn-add-bank"
                onClick={() => handleAddBank()}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? 'إضافة حساب' : 'Add Account'}
              </button>
            </div>

            {/* Quick exchange badges */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_EXCHANGES_AR.slice(0, 4).map((exName, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAddBank(exName)}
                  className="text-[10px] px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
                >
                  + {exName}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {bankAccounts.map((acc, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={acc.exchangeName}
                      onChange={(e) => handleBankChange(idx, 'exchangeName', e.target.value)}
                      placeholder={isAr ? 'اسم شركة الصرافة أو البنك' : 'Bank / Exchange Name'}
                      className="flex-1 px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <button
                      onClick={() => handleRemoveBank(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={acc.accountNumber}
                      onChange={(e) => handleBankChange(idx, 'accountNumber', e.target.value)}
                      placeholder={isAr ? 'رقم الحساب' : 'Account Number'}
                      className="w-1/2 px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300"
                    />
                    <input
                      type="text"
                      value={acc.accountHolderName || ''}
                      onChange={(e) => handleBankChange(idx, 'accountHolderName', e.target.value)}
                      placeholder={isAr ? 'اسم صاحب الحساب (اختياري)' : 'Holder Name (Optional)'}
                      className="flex-1 px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            id="btn-apply-studio"
            onClick={handleSaveStudioChanges}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <span>{isAr ? 'تطبيق التحديثات على البطاقة و vCard' : 'Apply Updates to Card & vCard'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
