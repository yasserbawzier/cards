import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Info } from 'lucide-react';

interface VCardViewerProps {
  vcardRaw: string;
  fullName: string;
  lang: 'ar' | 'en';
}

export const VCardViewer: React.FC<VCardViewerProps> = ({ vcardRaw, fullName, lang }) => {
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(vcardRaw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([vcardRaw], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = (fullName || 'contact').replace(/\s+/g, '_') + '.vcf';
    link.setAttribute('download', cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Information Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-200">
              vCard Format (VERSION: 3.0) UTF-8
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'متوافق بالكامل مع جميع هواتف Apple iOS و Android Google Contacts'
                : 'Fully compatible with Apple iOS Contacts, Android Google Contacts, and Outlook'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-vcf"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'نسخ النص' : 'Copy Text'}</span>
              </>
            )}
          </button>

          <button
            id="btn-download-vcf-viewer"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحميل .vcf' : 'Download .vcf'}</span>
          </button>
        </div>
      </div>

      {/* Code box */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>contact.vcf</span>
          <span className="text-[11px] text-emerald-400">text/vcard; charset=utf-8</span>
        </div>
        <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-teal-300 leading-relaxed overflow-x-auto max-h-[500px] dir-ltr text-left selection:bg-teal-900 selection:text-white whitespace-pre-wrap">
          <code>{vcardRaw}</code>
        </pre>
      </div>

      {/* RFC standard explanation */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-400">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          {isAr
            ? 'تستخدم المعايير العالمية ترميز UTF-8 لتفادي تشوه الحروف والأسماء العربية، بالإضافة إلى وسم أرقام الهواتف بعلامات CELL و WORK مع تسجيل رابط واتساب المباشر في حقول التواصل الحديثة.'
            : 'Complies with vCard 3.0 RFC 2426 specification, supporting multi-language UTF-8 names, multiple TEL entries with CELL and WORK types, and direct WhatsApp links.'}
        </p>
      </div>
    </div>
  );
};
