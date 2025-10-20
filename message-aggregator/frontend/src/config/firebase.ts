import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCkdf7UMhDcJUr-O2ggsqHY1bmZlxJD9Tk",
  authDomain: "mainproject-1f5b8.firebaseapp.com",
  projectId: "mainproject-1f5b8",
  storageBucket: "mainproject-1f5b8.firebasestorage.app",
  messagingSenderId: "145856085559",
  appId: "1:145856085559:web:abd27b51eb26d1f064c9b2",
  measurementId: "G-GNE1T81WD3",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
