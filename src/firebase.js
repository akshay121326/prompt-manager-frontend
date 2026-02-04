import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Replace with your Firebase project configuration
// You can also use environment variables like import.meta.env.VITE_FIREBASE_API_KEY
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
