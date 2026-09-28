import React from 'react';
import { CreditCard, Sparkles, Code2, Globe } from 'lucide-react';

interface NavbarProps {
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  activeTab: 'preview' | 'json' | 'vcf';
  onSelectTab: (tab: 'preview' | 'json' | 'vcf') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  activeTab,
  onSelectTab,
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-base sm:text-lg">
                {isAr ? 'محرك بطاقات الأعمال الرقمية' : 'Digital vCard AI Engine'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                vCard v3.0 JSON
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {isAr
                ? 'استخراج المعطيات، روابط واتساب المباشرة، وحسابات الصرافة'
                : 'Direct WhatsApp Links & Exchange Banking Standardization'}
            </p>
          </div>
        </div>

        {/* View Switchers & Lang Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs sm:text-sm font-medium">
            <button
              id="tab-btn-preview"
              onClick={() => onSelectTab('preview')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? 'البطاقة الذكية' : 'Digital Card'}
            </button>
            <button
              id="tab-btn-json"
              onClick={() => onSelectTab('json')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                activeTab === 'json'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON Schema</span>
            </button>
            <button
              id="tab-btn-vcf"
              onClick={() => onSelectTab('vcf')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'vcf'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              .vcf Raw
            </button>
          </div>

          <button
            id="btn-lang-toggle"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
            title={isAr ? 'Switch to English' : 'التحويل للغة العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
