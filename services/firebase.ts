
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
// Fix: Named exports from firebase/analytics can sometimes fail resolution in certain build environments.
// Using a namespaced import is a more robust way to access getAnalytics and isSupported.
import * as analytics from "firebase/analytics";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDWThmYCCND5mnQJ5M6aMZzgL-MUZObeS0",
  authDomain: "craftly-76601.firebaseapp.com",
  projectId: "craftly-76601",
  storageBucket: "craftly-76601.firebasestorage.app",
  messagingSenderId: "319030527620",
  appId: "1:319030527620:web:41fa695ef17c84ca42a4d1",
  measurementId: "G-5WV9F4FYHR"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");
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
