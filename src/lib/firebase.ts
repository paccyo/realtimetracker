
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyCnjI1sLDgAztoY26IdRMPqATARoD9qHuM",
  authDomain: "chronotrack-u10nt.firebaseapp.com",
  databaseURL: "https://chronotrack-u10nt-default-rtdb.firebaseio.com",
  projectId: "chronotrack-u10nt",
  storageBucket: "chronotrack-u10nt.firebasestorage.app",
  messagingSenderId: "125029841927",
  appId: "1:125029841927:web:97a624246dba73d9437ea2"
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
