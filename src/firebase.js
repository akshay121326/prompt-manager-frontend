import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace with your Firebase project configuration
// You can also use environment variables like import.meta.env.VITE_FIREBASE_API_KEY
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug: Check if env vars are loaded in production
if (import.meta.env.PROD) {
    const mask = (str) => str ? `${str.substring(0, 4)}...${str.substring(str.length - 4)}` : "MISSING";
    console.log("Firebase Config Debug:", {
        apiKey: mask(firebaseConfig.apiKey),
        projectId: mask(firebaseConfig.projectId),
        env_keys: Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
    });
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
