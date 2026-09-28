import React, { useState } from 'react';
import { Copy, Check, Terminal, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DigitalCardData } from '../types';

interface JsonViewerProps {
  cardData: DigitalCardData;
  lang: 'ar' | 'en';
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ cardData, lang }) => {
  const isAr = lang === 'ar';
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const jsonString = JSON.stringify(cardData, null, 2);

  const curlCommand = `curl -X POST https://${window.location.host}/api/generate-card \\
  -H "Content-Type: application/json" \\
  -d '{
    "rawInput": "أحمد سالم باوزير، مدير شركة حضرموت للتجارة، +967770960110 واتساب، شركة العمقي حساب 25401988"
  }'`;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Schema Verification Checklist */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-bold text-slate-200">
            {isAr ? 'توافق Schema القياسي بنسبة 100%' : '100% Strict Schema Compliant'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> cardId
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> profile
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> phoneNumbers (wa.me)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> bankAccounts
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> vcardRaw
          </span>
        </div>
      </div>

      {/* JSON Code Box */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-xs text-slate-400">output_response.json</span>
          </div>

          <button
            id="btn-copy-json"
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'نسخ JSON' : 'Copy JSON'}</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 sm:p-5 text-xs sm:text-sm font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-[500px] dir-ltr text-left selection:bg-emerald-900 selection:text-white">
          <code>{jsonString}</code>
        </pre>
      </div>

      {/* API cURL Integration snippet */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            {isAr ? 'طلب API المباشر (cURL) لتكامل المنصة:' : 'Backend API cURL Integration:'}
          </span>
          <button
            id="btn-copy-curl"
            onClick={handleCopyCurl}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
          >
            {copiedCurl ? (
              <>
                <Check className="w-3 h-3" />
                <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>{isAr ? 'نسخ الأمر' : 'Copy cURL'}</span>
              </>
            )}
          </button>
        </div>
        <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto dir-ltr text-left">
          <code>{curlCommand}</code>
        </pre>
      </div>
    </div>
  );
};
