import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  cardName: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  cardName,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col items-center text-center">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-inner">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="text-base font-extrabold text-white mb-1">
          تأكيد حذف الكرت
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          هل أنت متأكد من حذف كرت <span className="font-bold text-white">«{cardName || 'هذا الكرت'}»</span>؟
          <br />
          <span className="text-slate-500 text-[11px]">سيتم حذف هذا الكرت نهائياً من قاعدة البيانات.</span>
        </p>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-2">
          {/* Confirm delete button */}
          <button
            type="button"
            id="btn-confirm-delete"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/50 cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{isDeleting ? 'جارٍ الحذف...' : 'نعم، احذف الكرت'}</span>
          </button>

          {/* Cancel button */}
          <button
            type="button"
            id="btn-cancel-delete"
            disabled={isDeleting}
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
