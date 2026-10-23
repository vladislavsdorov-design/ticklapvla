import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCH9CeUn88EELoBpGpdKITMYXKA8GAVa7U",
  authDomain: "tongarant.firebaseapp.com",
  databaseURL: "https://tongarant-default-rtdb.firebaseio.com",
  projectId: "tongarant",
  storageBucket: "tongarant.firebasestorage.app",
  messagingSenderId: "645663892446",
  appId: "1:645663892446:web:eb0b1647787c0bdc9ff34f",
  measurementId: "G-N1Q2PG0K2D",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
