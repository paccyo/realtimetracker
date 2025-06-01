
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;

// Firebase SDK's getDatabase() requires a projectId to determine the database URL,
// even if databaseURL is provided in the config.
// Throw an error if projectId is missing, as this is critical.
if (!firebaseConfig.projectId) {
  throw new Error(
    "Firebase Configuration Error: `projectId` is missing. " +
    "Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set in your .env.local file and is accessible."
  );
}

// It's also good practice to have databaseURL, though the SDK might derive it from projectId.
// If it's missing, log a warning.
if (!firebaseConfig.databaseURL) {
  console.warn(
    "Firebase Configuration Warning: `databaseURL` is missing. " +
    "The SDK will attempt to derive it from `projectId`. " +
    "Ensure NEXT_PUBLIC_FIREBASE_DATABASE_URL is set if this derivation fails, " +
    "or if your project uses a non-standard database URL."
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

export { app as firebaseApp, database };
