/*
  Script to test Firestore rules for your KaPlato project.
  1. Install dependencies: npm install firebase
  2. Fill in your Firebase config and user credentials below.
  3. Run: node scripts/test-firestore.js
*/

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase project config (imported from src/environments/firebase.config.ts)
const firebaseConfig = {
  apiKey: "AIzaSyAg9Ky2EFnziobgz_Y7Y_J4PPDfZHaKlDI",
  authDomain: "kaplato.firebaseapp.com",
  projectId: "kaplato",
  storageBucket: "kaplato.firebasestorage.app",
  messagingSenderId: "894851954122",
  appId: "1:894851954122:web:fdfee8cd0d3d0d884ecb33"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function runTests() {
  try {
    // Unauthenticated read test
    console.log("Running unauthenticated read test...");
    const publicSnap = await getDoc(doc(db, "karenderias", "testDoc"));
    console.log("karenderias/testDoc exists?", publicSnap.exists());

    // If credentials provided, test authenticated write
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    if (email && password) {
      console.log("Signing in as test user...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in as:", userCredential.user.email);
      console.log("Running authenticated write test...");
      await setDoc(doc(db, "testCollection", "testDoc"), { foo: "bar" });
      console.log("testCollection/testDoc written successfully");
    } else {
      console.warn("TEST_USER_EMAIL and/or TEST_USER_PASSWORD not set, skipping authenticated tests.");
    }
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

runTests();
