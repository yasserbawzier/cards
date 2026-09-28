/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Check } from 'lucide-react';
import { SimpleHeader } from './components/SimpleHeader';
import { SimpleMobileForm } from './components/SimpleMobileForm';
import { SimpleMobileCard } from './components/SimpleMobileCard';
import { RegisteredCardsList } from './components/RegisteredCardsList';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { QrModal } from './components/QrModal';
import { ShareAppModal } from './components/ShareAppModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { DigitalCardData } from './types';
import { generateVCardString, buildPermanentCardUrl } from './utils/vcard';
import { 
  saveUserCard, 
  deleteUserCard, 
  subscribeToUserCards,
  getCardById
} from './lib/cardsService';
import { 
  auth, 
  ensureAuthenticatedUser, 
  logInWithGoogle, 
  logOutUser,
  testFirestoreConnection,
  getOrCreateLocalUserId,
  getSavedAuthUser,
  saveAuthUserToStorage,
  AppUser 
} from './lib/firebase';

const createBlankCardForUser = (userId: string): DigitalCardData => {
  const cardId = 'card-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const liveUrl = buildPermanentCardUrl(userId, cardId);

  const card: DigitalCardData = {
    cardId,
    ownerId: userId,
    profile: {
      fullName: '',
      companyName: '',
      jobTitle: '',
      bio: '',
    },
    phoneNumbers: [
      {
        label: 'الرقم الرئيسي',
        number: '+967 ',
        isWhatsapp: true,
        whatsappLink: null,
      },
    ],
    bankAccounts: [
      {
        exchangeName: 'شركة العمقي للصرافة',
        accountNumber: '',
        accountHolderName: '',
      },
    ],
    vcardRaw: '',
  };

  card.vcardRaw = generateVCardString(
    card.profile,
    card.phoneNumbers,
    card.bankAccounts,
    liveUrl
  );
  return card;
};

export default function App() {
  // استرجاع الحساب المسجل مسبقاً فوراً لمنع أي اختفاء للبطاقات أو إجبار على إعادة التسجيل
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getSavedAuthUser());
  const [cards, setCards] = useState<DigitalCardData[]>([]);
  const [viewingCard, setViewingCard] = useState<DigitalCardData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingCard, setEditingCard] = useState<DigitalCardData | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string | null>(null);
  const [qrModalCardName, setQrModalCardName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(() => !getSavedAuthUser());

  // حالة حذف الكرت المخصصة (بدون استخدام window.confirm المحظور في الآي فريم)
  const [cardToDelete, setCardToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [isShareAppOpen, setIsShareAppOpen] = useState<boolean>(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState<boolean>(false);

  // حالة الرابط الدائم المباشر (Public Live Card) عند فتح رابط مشارك
  const [publicSharedCard, setPublicSharedCard] = useState<DigitalCardData | null>(null);
  const [isLoadingPublicCard, setIsLoadingPublicCard] = useState<boolean>(false);
  const [publicCardError, setPublicCardError] = useState<string | null>(null);

  // 0. فحص رابط الصفحة: إذا كان الزائر يفتح رابط بطاقة دائم (?u=userId&c=cardId)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const targetUserId = urlParams.get('u');
      const targetCardId = urlParams.get('c');

      if (targetUserId && targetCardId) {
        setIsLoadingPublicCard(true);
        getCardById(targetUserId, targetCardId)
          .then((card) => {
            if (card) {
              setPublicSharedCard(card);
            } else {
              setPublicCardError('عذراً، لم يتم العثور على هذه البطاقة أو تم حذفها من قبل صاحبها.');
            }
          })
          .catch((err) => {
            console.error('Error fetching public card:', err);
            setPublicCardError('حدث خطأ أثناء تحميل بيانات البطاقة، يرجى المحاولة لاحقاً.');
          })
          .finally(() => {
            setIsLoadingPublicCard(false);
          });
      }
    } catch (e) {
      console.warn('URL search params check failed:', e);
    }
  }, []);

  // 1. Initial Authentication & User Setup - الحفاظ الدائم على الجلسة
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser: AppUser = {
          uid: firebaseUser.uid,
          isAnonymous: firebaseUser.isAnonymous,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        };
        saveAuthUserToStorage(appUser);
        setCurrentUser(appUser);
        setIsLoadingAuth(false);
      } else {
        // إذا كان المتصفح لا يحتوي على جلسة في الذاكرة حالياً:
        // نتحقق من الحساب المحفوظ محلياً أولاً قبل إجراء أي تسجيل زائر جديد
        const saved = getSavedAuthUser();
        if (saved && (!saved.isAnonymous || saved.uid)) {
          setCurrentUser(saved);
          setIsLoadingAuth(false);
        } else {
          // في حال عدم وجود أي حساب محفوظ مسبقاً فقط
          ensureAuthenticatedUser()
            .then((user) => {
              setCurrentUser(user);
              setIsLoadingAuth(false);
            })
            .catch((err) => {
              console.warn('Initial session fallback:', err);
              const localId = getOrCreateLocalUserId();
              const fallbackUser: AppUser = {
                uid: localId,
                isAnonymous: true,
              };
              saveAuthUserToStorage(fallbackUser);
              setCurrentUser(fallbackUser);
              setIsLoadingAuth(false);
            });
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Subscription scoped to the authenticated user's ID
  // Clean: No pre-populated dummy data. If 0 cards exist, cards is empty.
  useEffect(() => {
    if (!currentUser) return;

    const uid = currentUser.uid;
    const unsubscribeCards = subscribeToUserCards(
      uid,
      (userCards) => {
        setCards(userCards);
        // If viewing a card that still exists, update it; otherwise if it was deleted, clear viewingCard
        setViewingCard((prev) => {
          if (!prev) return null;
          const found = userCards.find((c) => c.cardId === prev.cardId);
          return found || null;
        });
      },
      (err) => {
        console.warn('Realtime subscription notice for user:', err.message);
      }
    );

    return () => unsubscribeCards();
  }, [currentUser?.uid]);

  // Open "تسجيل كرت جديد"
  const handleOpenRegisterCard = () => {
    if (!currentUser) return;
    const blank = createBlankCardForUser(currentUser.uid);
    setEditingCard(blank);
    setFormMode('create');
    setIsFormOpen(true);
    setViewingCard(null);
  };

  // Open "تعديل بيانات الكرت"
  const handleOpenEditCard = (cardToEdit: DigitalCardData) => {
    setEditingCard(cardToEdit);
    setFormMode('edit');
    setIsFormOpen(true);
  };

  // Update card data in state and synchronize vCard raw
  const handleUpdateCardData = (newData: DigitalCardData) => {
    if (!currentUser) return;

    const liveUrl = buildPermanentCardUrl(currentUser.uid, newData.cardId);
    const updatedVcard = generateVCardString(
      newData.profile,
      newData.phoneNumbers,
      newData.bankAccounts,
      liveUrl
    );
    const updatedCard: DigitalCardData = {
      ...newData,
      ownerId: currentUser.uid,
      vcardRaw: updatedVcard,
    };

    setEditingCard(updatedCard);
    if (viewingCard && viewingCard.cardId === updatedCard.cardId) {
      setViewingCard(updatedCard);
    }
  };

  // Save card into user's isolated Firestore collection directly
  const handleSaveCard = async () => {
    if (!currentUser) return;
    const cardToSave = editingCard || createBlankCardForUser(currentUser.uid);

    try {
      setIsSaving(true);
      await saveUserCard(currentUser.uid, cardToSave);
      
      // Update local state
      setCards((prev) => {
        const exists = prev.some((c) => c.cardId === cardToSave.cardId);
        if (exists) {
          return prev.map((c) => (c.cardId === cardToSave.cardId ? cardToSave : c));
        }
        return [cardToSave, ...prev];
      });

      // Show the newly saved/edited card in detailed view
      setViewingCard(cardToSave);
      setIsFormOpen(false);
      setEditingCard(null);
      setFeedbackToast('تم حفظ الكرت بنجاح في قاعدة البيانات');
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err) {
      console.error('Failed to save user card to database:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // فتح نافذة تأكيد الحذف
  const handleRequestDeleteCard = (cardIdToDelete: string, cardName?: string) => {
    setCardToDelete({
      id: cardIdToDelete,
      name: cardName?.trim() || 'هذا الكرت',
    });
  };

  // تنفيذ الحذف الفعلي من قاعدة البيانات
  const handleConfirmDeleteCard = async () => {
    if (!currentUser || !cardToDelete) return;

    try {
      setIsDeletingCard(true);
      await deleteUserCard(currentUser.uid, cardToDelete.id);

      // تحديث الحالة محلياً فوراً
      setCards((prev) => prev.filter((c) => c.cardId !== cardToDelete.id));
      if (viewingCard?.cardId === cardToDelete.id) {
        setViewingCard(null);
      }

      const deletedName = cardToDelete.name;
      setCardToDelete(null);
      setFeedbackToast(`تم حذف كرت «${deletedName}» نهائياً بنجاح`);
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (err) {
      console.error('Failed to delete user card:', err);
      setFeedbackToast('حدث خطأ أثناء محاولة الحذف، يرجى المحاولة مرة أخرى.');
      setTimeout(() => setFeedbackToast(null), 3000);
    } finally {
      setIsDeletingCard(false);
    }
  };

  const handleSignInGoogle = async () => {
    try {
      const googleUser = await logInWithGoogle();
      setCurrentUser(googleUser);
      setFeedbackToast('تم تسجيل الدخول بنجاح ومزامنة بطاقاتك.');
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (e: any) {
      if (e?.code !== 'auth/popup-closed-by-user') {
        console.warn('Sign in with Google notice:', e);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      const freshUser = await logOutUser();
      setCurrentUser(freshUser);
      setViewingCard(null);
      setEditingCard(null);
      setIsFormOpen(false);
      setFeedbackToast('تم تسجيل الخروج بنجاح.');
      setTimeout(() => setFeedbackToast(null), 3000);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
  };

  // Determine what to display:
  // If user has 0 cards, show the registration form directly with no dummy data
  const showRegisterDirectly = cards.length === 0;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white"
    >
      {/* أعلى الصفحة: الحساب المسجل + إجمالي البطائق + خيارات المشاركة والتثبيت */}
      <SimpleHeader
        cardsCount={cards.length}
        currentUser={currentUser}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOut}
        onOpenShareApp={() => setIsShareAppOpen(true)}
        onOpenInstallGuide={() => setIsInstallGuideOpen(true)}
      />

      {/* شريط حالة العمل بدون إنترنت والمزامنة الذكية */}
      <OfflineStatusBanner />

      {/* شريط تثبيت التطبيق على الجوال */}
      <InstallAppBanner 
        forceOpenGuide={isInstallGuideOpen} 
        onCloseGuide={() => setIsInstallGuideOpen(false)} 
      />

      {/* المحتوى الرئيسي */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 flex flex-col items-center">
        {/* إشعار التغذية الراجعة */}
        {feedbackToast && (
          <div className="w-full mb-3 py-2.5 px-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-fade-in text-center shadow-xl">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* حالة تحميل رابط الكرت الدائم للزائر */}
        {isLoadingPublicCard ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold text-slate-200">جارٍ تحميل البطاقة الرقمية المعتمدة...</span>
          </div>
        ) : publicCardError ? (
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center animate-fade-in my-8 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
              ✕
            </div>
            <h3 className="text-base font-bold text-white mb-2">تعذر العثور على البطاقة</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              {publicCardError}
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = window.location.origin;
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              الانتقال إلى الرئيسية وإنشاء بطاقتك
            </button>
          </div>
        ) : publicSharedCard ? (
          /* عرض البطاقة الدائمة للزائر مع كافة أزرار الإيداع والنسخ وحفظ جهة الاتصال والتسويق التلقائي */
          <div className="w-full animate-fade-in flex flex-col items-center">
            <SimpleMobileCard
              cardData={publicSharedCard}
              isPublicView={true}
              onOpenCreateNew={() => {
                // مسح معلمات الرابط والانتقال لتسجيل بطاقة
                window.history.replaceState({}, '', window.location.pathname);
                setPublicSharedCard(null);
                handleOpenRegisterCard();
              }}
            />
          </div>
        ) : isLoadingAuth ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>جارٍ الاتصال بقاعدة البيانات...</span>
          </div>
        ) : showRegisterDirectly ? (
          /* في حال المستخدم جديد ولا توجد بطائق مسجلة مسبقاً: يظهر فقط تسجيل كرت جديد */
          <div className="w-full animate-fade-in">
            <div className="mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-base font-extrabold text-white">
                تسجيل كرت جديد
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                أدخل بياناتك وسيتم حفظ الكرت مباشرة في قاعدة البيانات.
              </p>
            </div>

            <SimpleMobileForm
              cardData={editingCard || createBlankCardForUser(currentUser?.uid || 'temp')}
              onUpdateCardData={handleUpdateCardData}
              onSaveAndPreview={handleSaveCard}
              isSaving={isSaving}
              isNewCard={true}
            />
          </div>
        ) : isFormOpen && editingCard ? (
          /* نموذج تسجيل كرت إضافي أو تعديل كرت حالي */
          <div className="w-full animate-fade-in">
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  {formMode === 'create' ? 'تسجيل كرت جديد' : 'تعديل بيانات الكرت'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  تُحفظ التعديلات في قاعدة البيانات وتنعكس مباشرة على الكرت.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingCard(null);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>

            <SimpleMobileForm
              cardData={editingCard}
              onUpdateCardData={handleUpdateCardData}
              onSaveAndPreview={handleSaveCard}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingCard(null);
              }}
              isSaving={isSaving}
              isNewCard={formMode === 'create'}
            />
          </div>
        ) : viewingCard ? (
          /* عند الضغط على زر العرض: تظهر البطاقة التي فيها جميع بيانات الكرت واضحة فقط بدون أزرار المشاركة والحذف والكي ار وحفظ جهة الاتصال */
          <div className="w-full animate-fade-in flex flex-col items-center">
            <SimpleMobileCard
              cardData={viewingCard}
              onBack={() => setViewingCard(null)}
            />
          </div>
        ) : (
          /* خيار "بطاقاتك المسجلة": الاسم، الشركة، زر التعديل، زر رمز QR، زر الحذف، زر المشاركة كصورة، وزر المشاركة كنص، وزر العرض */
          <RegisteredCardsList
            cards={cards}
            onViewCard={(card) => setViewingCard(card)}
            onEditCard={(card) => handleOpenEditCard(card)}
            onOpenQr={(url, name) => {
              setQrModalDataUrl(url);
              setQrModalCardName(name);
            }}
            onDeleteCard={(cardId, cardName) => handleRequestDeleteCard(cardId, cardName)}
            onAddNewCard={handleOpenRegisterCard}
          />
        )}
      </main>

      {/* نافذة تأكيد الحذف المخصصة والآمنة للأجهزة والتطبيقات */}
      <DeleteConfirmModal
        isOpen={Boolean(cardToDelete)}
        cardName={cardToDelete?.name || ''}
        onConfirm={handleConfirmDeleteCard}
        onCancel={() => setCardToDelete(null)}
        isDeleting={isDeletingCard}
      />

      {/* نافذة رمز الاستجابة السريعة QR لكاميرا الجوال */}
      <QrModal
        isOpen={Boolean(qrModalDataUrl)}
        onClose={() => setQrModalDataUrl(null)}
        qrDataUrl={qrModalDataUrl || ''}
        fullName={qrModalCardName || viewingCard?.profile.fullName || ''}
        lang="ar"
      />

      {/* نافذة مشاركة التطبيق مع الآخرين */}
      <ShareAppModal
        isOpen={isShareAppOpen}
        onClose={() => setIsShareAppOpen(false)}
        onOpenInstall={() => setIsInstallGuideOpen(true)}
      />
    </div>
  );
}
