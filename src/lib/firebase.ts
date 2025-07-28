
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SEDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let app: FirebaseApp;

// Basic check to ensure the hardcoded config has a projectId
if (!firebaseConfig.projectId) {
  throw new Error(
    "Firebase Configuration Error: `projectId` is missing in the hardcoded firebaseConfig object."
  );
}

if (getApps().length === 0) {
  // Initialize Firebase only if no apps have been initialized yet
  app = initializeApp(firebaseConfig);
} else {
  // Get the default app if it has already been initialized
  app = getApp();
}

const database: Database = getDatabase(app);
const firestore: Firestore = getFirestore(app);

export { app as firebaseApp, database, firestore };
