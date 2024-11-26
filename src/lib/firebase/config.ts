import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "A1ZaSyD2A2H2hDgAZZ6uYFdlCDqWH6OtXq-II4M",
  authDomain: "voucher-management-13b98.firebaseapp.com",
  projectId: "voucher-management-13b98",
  storageBucket: "voucher-management-13b98.firebasestorage.app",
  messagingSenderId: "109883879613",
  appId: "1:109883879613:web:5b71ce1b89bbbfd82a18dd",
  measurementId: "G-DJZY89NB98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
