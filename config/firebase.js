// config/firebase.js
import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0Qg3b6O_6dN6qTua635AHu4ZREqoVx2o",
  authDomain: "nutriscan-adaad.firebaseapp.com",
  projectId: "nutriscan-adaad",
  storageBucket: "nutriscan-adaad.appspot.com",
  messagingSenderId: "1086096631944",
  appId: "1:1086096631944:web:592635928e2fd3c29c173d",
  measurementId: "G-DGD7895HYF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
