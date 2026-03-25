import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAX4pTZMU1zzR8r66b_U0PoEEo6B4VpQYA",
  authDomain: "nextround-4c74d.firebaseapp.com",
  databaseURL: "https://nextround-4c74d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nextround-4c74d",
  storageBucket: "nextround-4c74d.firebasestorage.app",
  messagingSenderId: "255488063888",
  appId: "1:255488063888:web:ee255d0281549c661f1b15",
  measurementId: "G-1B225NJ1S9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);