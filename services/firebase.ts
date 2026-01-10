
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
// Fix: Named exports from firebase/analytics can sometimes fail resolution in certain build environments.
// Using a namespaced import is a more robust way to access getAnalytics and isSupported.
import * as analytics from "firebase/analytics";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// Initialize storage with explicit bucket URL to avoid CORS issues
export const storage = getStorage(app, firebaseConfig.storageBucket);
export const functions = getFunctions(app, "us-central1");

// Connect to Functions emulator in development if available
if (import.meta.env.DEV && import.meta.env.VITE_FUNCTIONS_EMULATOR_URL) {
  import('firebase/functions').then(({ connectFunctionsEmulator }) => {
    const [host, port] = import.meta.env.VITE_FUNCTIONS_EMULATOR_URL.split(':');
    connectFunctionsEmulator(functions, host, parseInt(port) || 5001);
  }).catch(err => {
    console.warn('Functions emulator connection failed:', err);
  });
}

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

// Fix: Access members through the analytics namespace to avoid "no exported member" errors
if (analytics.isSupported && typeof analytics.isSupported === 'function') {
  analytics.isSupported().then(supported => {
    if (supported && typeof analytics.getAnalytics === 'function') {
      analytics.getAnalytics(app);
    }
  });
}

export default app;
