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
    console.log("Firebase Config Loaded:", {
        apiKey: !!firebaseConfig.apiKey,
        projectId: !!firebaseConfig.projectId
    });
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
