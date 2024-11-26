import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'storage/storage';

const firebaseConfig = {
  // Copy your exact config from Firebase Console here
  apiKey: "AIza...", // Your actual API key
  authDomain: "voucher-management-13b98.firebaseapp.com",
  projectId: "voucher-management-13b98",
  storageBucket: "voucher-management-13b98.firebasestorage.app",
  messagingSenderId: "109883879613",
  appId: "1:109883879613:web:5b71ce1b89bbbfd82a18dd",
  measurementId: "G-DJZY89NB98"
};

console.log('Initializing Firebase with config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Add auth state listener for debugging
onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user ? 'User logged in' : 'No user');
  if (user) {
    console.log('User details:', {
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified
    });
  }
});

export default app;
