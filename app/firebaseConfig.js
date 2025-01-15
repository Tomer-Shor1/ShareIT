// firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAvIDbKAaM57QVUK6Pmw5koJ-LUYOOzjjE",
  authDomain: "do-a-favor---oz.firebaseapp.com",
  projectId: "do-a-favor---oz",
  storageBucket: "do-a-favor---oz.firebasestorage.app",
  messagingSenderId: "441220624714",
  appId: "1:441220624714:android:4f5141197a3714593291b3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(); // Ensure this is correctly imported and initialized

export { db };
