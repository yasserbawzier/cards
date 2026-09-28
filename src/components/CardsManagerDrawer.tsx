import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Sparkles 
} from 'lucide-react';
import { AppUser } from '../lib/firebase';
import { DigitalCardData } from '../types';

interface CardsManagerDrawerProps {
  cards: DigitalCardData[];
  activeCardId: string;
  onSelectCard: (card: DigitalCardData) => void;
  onAddNewCard: () => void;
  onDeleteCard: (cardId: string) => void;
  currentUser: AppUser | null;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  isLoading?: boolean;
}

export const CardsManagerDrawer: React.FC<CardsManagerDrawerProps> = ({
  cards,
  activeCardId,
  onSelectCard,
  onAddNewCard,
  onDeleteCard,
  currentUser,
  onSignInGoogle,
  onSignOut,
  isLoading,
}) => {
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setIsAuthLoading(true);
      await onSignInGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      setIsAuthLoading(true);
      await onSignOut();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const isAnonymous = currentUser?.isAnonymous ?? true;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl mb-4 animate-fade-in">
      {/* User Isolation & Security Banner */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 mb-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-200 block truncate">
                {!isAnonymous && currentUser?.displayName
                  ? currentUser.displayName
                  : !isAnonymous && currentUser?.email
                  ? currentUser.email
                  : 'مساحتك الخاصة المحمية'}
              </span>
              <span className="text-[10px] text-emerald-400 block font-mono">
                {isAnonymous ? 'جلسة مشفرة خاصة بجهازك' : 'حساب Google متزامن'}
              </span>
            </div>
          </div>

          <div>
            {isAnonymous ? (
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isAuthLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
                title="تسجيل الدخول بحساب Google للوصول لبطاقاتك من أي جهاز"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>ربط بـ Google</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOutClick}
                disabled={isAuthLoading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 text-[11px] font-medium transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3 h-3" />
                <span>خروج</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          جميع البطاقات التي تضيفها هنا تُحفظ تلقائياً في حسابك فقط، وهي معزولة تماماً ولا يمكن لأي مستخدم آخر رؤيتها أو التداخل معها.
        </p>
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              بطاقاتك المحفوظة ({cards.length})
            </h3>
            <span className="text-[10px] text-emerald-400">
              قاعدة بيانات خاصة بحسابك
            </span>
          </div>
        </div>

        <button
          id="btn-add-new-card-top"
          onClick={onAddNewCard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>بطاقة جديدة</span>
        </button>
      </div>

      {/* Cards List Horizontal / Scrollable */}
      {cards.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs bg-slate-950/50 rounded-xl border border-slate-800/80">
          لم تقم بإضافة أي بطاقة بعد في حسابك. اضغط على زر "بطاقة جديدة" للبدء.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {cards.map((card) => {
            const isSelected = card.cardId === activeCardId;
            return (
              <div
                key={card.cardId}
                onClick={() => onSelectCard(card)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {card.profile.fullName || 'بدون اسم'}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        المعروضة حالياً
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {card.profile.companyName || 'بدون شركة'} • {card.phoneNumbers.length} أرقام • {card.bankAccounts.length} حسابات
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {cards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCard(card.cardId)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                      title="حذف البطاقة من حسابك"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
