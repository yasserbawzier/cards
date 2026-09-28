import React from 'react';
import { CreditCard, Download, LogIn, LogOut, Share2, ShieldCheck, UserCheck } from 'lucide-react';
import { AppUser } from '../lib/firebase';

interface SimpleHeaderProps {
  cardsCount: number;
  currentUser: AppUser | null;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onOpenShareApp?: () => void;
  onOpenInstallGuide?: () => void;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  cardsCount,
  currentUser,
  onSignInGoogle,
  onSignOut,
  onOpenShareApp,
  onOpenInstallGuide,
}) => {
  const isAnonymous = currentUser?.isAnonymous ?? true;
  const userIdentifier = !isAnonymous && currentUser?.email
    ? currentUser.email
    : !isAnonymous && currentUser?.displayName
    ? currentUser.displayName
    : 'حساب زائر محمي';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 sm:px-4 py-2 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* معلومات التطبيق والعدد */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-md shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[11px] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-sm text-white leading-tight truncate">
                البطائق الرقمية
              </h1>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                {cardsCount} {cardsCount === 1 ? 'كرت' : 'بطائق'}
              </span>
            </div>
          </div>
        </div>

        {/* أدوات الحساب ومشاركة وتثبيت التطبيق */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* زر مشاركة التطبيق */}
          {onOpenShareApp && (
            <button
              type="button"
              id="btn-share-app-header"
              onClick={onOpenShareApp}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
              title="مشاركة التطبيق"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* زر تثبيت التطبيق */}
          {onOpenInstallGuide && (
            <button
              type="button"
              id="btn-install-app-header"
              onClick={onOpenInstallGuide}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition-colors cursor-pointer"
              title="تثبيت التطبيق على الجوال"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>تثبيت</span>
            </button>
          )}

          {/* الحساب المسجل */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/90 rounded-xl px-2 py-1 text-xs max-w-[130px] sm:max-w-[170px]">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {isAnonymous ? (
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              )}
              <span 
                className="text-[10px] font-semibold text-slate-300 truncate"
                title={userIdentifier}
              >
                {userIdentifier}
              </span>
            </div>

            <div className="shrink-0 mr-0.5">
              {isAnonymous ? (
                <button
                  type="button"
                  id="btn-login-google-header"
                  onClick={onSignInGoogle}
                  className="inline-flex items-center px-1 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[9px] font-bold border border-slate-700 transition-colors cursor-pointer"
                  title="تسجيل الدخول بـ Google لمزامنة البطائق"
                >
                  <LogIn className="w-2.5 h-2.5" />
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-logout-header"
                  onClick={onSignOut}
                  className="inline-flex items-center px-1 py-0.5 rounded-md bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-[9px] font-medium border border-slate-800 transition-colors cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
