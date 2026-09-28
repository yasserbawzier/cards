import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  query, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { DigitalCardData } from '../types';

const OFFLINE_CARDS_KEY_PREFIX = 'offline_user_cards_';

/**
 * Saves cards locally to localStorage so they are immediately available offline
 */
export function saveCardsToLocalCache(userId: string, cards: DigitalCardData[]): void {
  try {
    if (!userId) return;
    localStorage.setItem(OFFLINE_CARDS_KEY_PREFIX + userId, JSON.stringify(cards));
  } catch (e) {
    console.warn('Notice caching cards locally:', e);
  }
}

/**
 * Retrieves cached cards from localStorage immediately (zero network delay)
 */
export function getCardsFromLocalCache(userId: string): DigitalCardData[] {
  try {
    if (!userId) return [];
    const raw = localStorage.getItem(OFFLINE_CARDS_KEY_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as DigitalCardData[];
    }
  } catch (e) {
    console.warn('Notice reading cached cards:', e);
  }
  return [];
}

/**
 * Saves a card strictly under the authenticated user's isolated subcollection
 * and updates the offline cache instantly.
 */
export async function saveUserCard(userId: string, card: DigitalCardData): Promise<void> {
  if (!userId) throw new Error('User ID is required to save card');
  
  const now = new Date().toISOString();
  const cardPayload: DigitalCardData = {
    ...card,
    ownerId: userId,
    createdAt: card.createdAt || now,
    updatedAt: now,
  };

  // 1. التخزين المحلي الفوري لضمان حفظ البطاقة حتى لو كان المستخدم بدون اتصال
  try {
    const existing = getCardsFromLocalCache(userId);
    const index = existing.findIndex(c => c.cardId === cardPayload.cardId);
    let updatedList: DigitalCardData[];
    if (index >= 0) {
      updatedList = [...existing];
      updatedList[index] = cardPayload;
    } else {
      updatedList = [cardPayload, ...existing];
    }
    saveCardsToLocalCache(userId, updatedList);
  } catch (e) {
    console.warn('Local offline save warning:', e);
  }

  // 2. المزامنة مع فايربيس السحابي إذا كان متصلاً
  try {
    const cardDocRef = doc(db, 'users', userId, 'cards', card.cardId);
    await setDoc(cardDocRef, cardPayload, { merge: true });
  } catch (firebaseErr) {
    console.warn('Firestore offline notice (card saved locally in offline cache):', firebaseErr);
    // لن يتوقف التطبيق وسيستمر بالعمل مع الكاش المحلي
  }
}

/**
 * Deletes a card from the user's isolated subcollection and local cache
 */
export async function deleteUserCard(userId: string, cardId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required to delete card');

  // 1. الحذف من الكاش المحلي أولاً
  try {
    const existing = getCardsFromLocalCache(userId);
    const updatedList = existing.filter(c => c.cardId !== cardId);
    saveCardsToLocalCache(userId, updatedList);
  } catch (e) {
    console.warn('Local offline delete warning:', e);
  }

  // 2. الحذف من قاعدة فايربيس
  try {
    const cardDocRef = doc(db, 'users', userId, 'cards', cardId);
    await deleteDoc(cardDocRef);
  } catch (firebaseErr) {
    console.warn('Firestore delete offline notice:', firebaseErr);
  }
}

/**
 * Subscribes in real-time ONLY to the authenticated user's cards
 * مع تحميل الكاش المحلي فوراً بدون أي انتظار
 */
export function subscribeToUserCards(
  userId: string,
  onUpdate: (cards: DigitalCardData[]) => void,
  onError?: (err: Error) => void
) {
  if (!userId) return () => {};

  // 1. استرجاع الكاش المحلي فوراً وعرضه للمستخدم خلال أجزاء من الثانية
  const cachedCards = getCardsFromLocalCache(userId);
  if (cachedCards.length > 0) {
    onUpdate(cachedCards);
  }

  const cardsRef = collection(db, 'users', userId, 'cards');
  const q = query(cardsRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const cards: DigitalCardData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DigitalCardData;
        cards.push(data);
      });
      
      // Sort by updatedAt descending if available
      cards.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });

      // حفظ النتيجة الحديثة من السحابة في الكاش المحلي
      saveCardsToLocalCache(userId, cards);
      onUpdate(cards);
    },
    (err) => {
      console.warn('Realtime cards subscription offline notice:', err.message);
      // في حالة انقطاع الاتصال، نظل معتمدين على الكاش المحلي دون أي خطأ
      const fallback = getCardsFromLocalCache(userId);
      if (fallback.length > 0) {
        onUpdate(fallback);
      }
      if (onError) onError(err);
    }
  );
}

/**
 * Fetches a single card by owner and cardId (with local cache fallback)
 */
export async function getCardById(userId: string, cardId: string): Promise<DigitalCardData | null> {
  // فحص الكاش المحلي أولاً
  const localCards = getCardsFromLocalCache(userId);
  const localMatch = localCards.find(c => c.cardId === cardId);
  if (localMatch) return localMatch;

  try {
    const cardDocRef = doc(db, 'users', userId, 'cards', cardId);
    const snap = await getDoc(cardDocRef);
    if (snap.exists()) {
      return snap.data() as DigitalCardData;
    }
    return null;
  } catch (e) {
    console.warn('Error fetching card online, checking local cache:', e);
    return localMatch || null;
  }
}
