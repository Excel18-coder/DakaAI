import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from './config';

const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const signInWithGoogle = async () => {
  try {
    console.log('🔓 Starting Google Sign-In...');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Origin:', window.location.origin);
    console.log('🔐 Firebase Auth object:', firebaseAuth);
    
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    console.log('✅ Google Sign-In successful:', result.user.email);
    return result.user;
  } catch (error: any) {
    console.error('❌ Firebase Google Sign-In Error Code:', error.code);
    console.error('❌ Firebase Google Sign-In Error Message:', error.message);
    console.error('❌ Full Error Object:', error);
    
    // Map Firebase error codes to user-friendly messages
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('⚠️ Popup was closed by user or Firebase rejected the domain');
      console.log('💡 This usually means localhost:8080 is NOT in Firebase authorized domains');
      const err = new Error('popup-closed-by-user');
      err.message = 'Sign in cancelled - domain may not be authorized in Firebase';
      throw err;
    } else if (error.code === 'auth/popup-blocked') {
      const err = new Error('popup-blocked');
      err.message = 'Popup was blocked. Please allow popups and try again.';
      throw err;
    } else if (error.code === 'auth/network-request-failed') {
      const err = new Error('network-error');
      err.message = 'Network error. Check your connection and try again.';
      throw err;
    } else if (error.code === 'auth/unauthorized-domain') {
      const err = new Error('unauthorized-domain');
      err.message = 'This domain is not authorized. Add localhost:8080 to Firebase authorized domains.';
      throw err;
    } else if (error.code === 'auth/cancelled-popup-request') {
      const err = new Error('cancelled-popup-request');
      err.message = 'Multiple sign-in attempts detected. Please try again.';
      throw err;
    }
    
    throw error;
  }
};

export const firebaseSignOut = async () => {
  try {
    await signOut(firebaseAuth);
    console.log('✅ Signed out successfully');
  } catch (error) {
    console.error('❌ Sign out error:', error);
    throw error;
  }
};

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(firebaseAuth, (user) => {
    if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('❌ No user authenticated');
    }
    callback(user);
  });
};

export { firebaseAuth };
