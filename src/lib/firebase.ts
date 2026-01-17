import { initializeApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBXtrp-gDoRTkaixbyvOwYdDtQY7CmpQfU",
  authDomain: "codeshareforum.firebaseapp.com",
  projectId: "codeshareforum",
  storageBucket: "codeshareforum.firebasestorage.app",
  messagingSenderId: "1031503278052",
  appId: "1:1031503278052:web:f033b51e8d601a568061f1",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* 🔑 קריטי ל-WEB + Cloud Functions */
setPersistence(auth, browserLocalPersistence);
