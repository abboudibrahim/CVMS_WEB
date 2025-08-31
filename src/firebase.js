// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAB8Ri4n5V-6YIPS99hND1xs6zC6nwWWcA",
  authDomain: "cvms-45967.firebaseapp.com",
  projectId: "cvms-45967",
  storageBucket: "cvms-45967.firebasestorage.app",
  messagingSenderId: "981508902572",
  appId: "1:981508902572:web:e248eee4f06f939afcd909",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
