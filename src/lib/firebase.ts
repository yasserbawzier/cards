import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth with persistent local storage
export const auth = getAuth(app);

// Force browser local persistence so sessions remain permanently stored across refreshes / exits
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Persistence configuration note:', err);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface AppUser {
  uid: string;
  isAnonymous: boolean;
  email?: string | null;
  displayName?: string | null;
}

const LOCAL_STORAGE_USER_KEY = 'digital_card_device_user_id';
const SAVED_AUTH_USER_KEY = 'digital_card_saved_auth_user';

/**
 * Reads any previously signed-in user or persistent user from localStorage.
 * This guarantees the user's account and cards remain active immediately upon opening the site.
 */
export function getSavedAuthUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(SAVED_AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.uid === 'string' && parsed.uid.length > 0) {
      return parsed as AppUser;
    }
  } catch (e) {
    console.warn('Notice reading saved auth user:', e);
  }
  return null;
}

/**
 * Saves or clears the authenticated user state in persistent localStorage.
 */
export function saveAuthUserToStorage(user: AppUser | null): void {
  try {
    if (user) {
      localStorage.setItem(SAVED_AUTH_USER_KEY, JSON.stringify(user));
      // Keep device ID in sync as well
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.uid);
    } else {
      localStorage.removeItem(SAVED_AUTH_USER_KEY);
    }
  } catch (e) {
    console.warn('Notice saving auth user to storage:', e);
  }
}

/**
 * Returns a persistent isolated user ID for this browser session/device.
 */
export function getOrCreateLocalUserId(): string {
  try {
    let stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!stored) {
      stored = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, stored);
    }
    return stored;
  } catch {
    return 'usr_' + Date.now().toString(36);
  }
}

/**
 * Ensures the user has an active identity.
 * Prioritizes:
 * 1. Active auth.currentUser
 * 2. Stored authenticated account from localStorage (e.g. from Google login)
 * 3. Anonymous login or persistent device ID fallback.
 */
export async function ensureAuthenticatedUser(): Promise<AppUser> {
  // 1. If Firebase Auth already has a currentUser in memory
  if (auth.currentUser) {
    const activeUser: AppUser = {
      uid: auth.currentUser.uid,
      isAnonymous: auth.currentUser.isAnonymous,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
    };
    saveAuthUserToStorage(activeUser);
    return activeUser;
  }

  // 2. If the user previously logged into their account, preserve it immediately
  const saved = getSavedAuthUser();
  if (saved && !saved.isAnonymous) {
    return saved;
  }

  // 3. If there is a saved guest identity, preserve that too so their cards aren't lost
  if (saved && saved.uid) {
    return saved;
  }

  // 4. Try anonymous sign in
  try {
    const cred = await signInAnonymously(auth);
    const guestUser: AppUser = {
      uid: cred.user.uid,
      isAnonymous: true,
      email: null,
      displayName: null,
    };
    saveAuthUserToStorage(guestUser);
    return guestUser;
  } catch (err: any) {
    // 5. Fallback to stable persistent local ID
    const localId = getOrCreateLocalUserId();
    const fallbackUser: AppUser = {
      uid: localId,
      isAnonymous: true,
      email: null,
      displayName: null,
    };
    saveAuthUserToStorage(fallbackUser);
    return fallbackUser;
  }
}

// Sign in with Google provider and persist session
export async function logInWithGoogle(): Promise<AppUser> {
  try {
    await setPersistence(auth, browserLocalPersistence).catch(() => {});
    const result = await signInWithPopup(auth, googleProvider);
    const user: AppUser = {
      uid: result.user.uid,
      isAnonymous: false,
      email: result.user.email,
      displayName: result.user.displayName,
    };
    saveAuthUserToStorage(user);
    return user;
  } catch (error) {
    console.warn('Google Sign-In notice:', error);
    throw error;
  }
}

// Sign out and reset to a clean isolated session
export async function logOutUser(): Promise<AppUser> {
  saveAuthUserToStorage(null);

  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }

  // Clear previous session from localStorage
  try {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(SAVED_AUTH_USER_KEY);
  } catch {}

  // Generate a fresh unique local guest session
  const freshGuestId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, freshGuestId);
  } catch {}

  const freshGuestUser: AppUser = {
    uid: freshGuestId,
    isAnonymous: true,
    email: null,
    displayName: null,
  };
  saveAuthUserToStorage(freshGuestUser);

  return freshGuestUser;
}

// Verify initial connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (err: any) {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn('Firestore running in offline / cached mode.');
    }
    return false;
  }
}

export default app;
