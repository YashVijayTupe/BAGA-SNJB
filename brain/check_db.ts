import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";
import path from "path";

// Pull config from the frontend environment file
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function runCheck() {
  console.log("🔍 Checking Database from 'brain' folder...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const complaints = await getDocs(collection(db, "complaints"));
    console.log(`✅ Success! Found ${complaints.size} complaints.`);
    
    complaints.forEach(doc => {
      console.log(`- [${doc.id}]: ${doc.data().issue_category} (${doc.data().status})`);
    });

  } catch (error) {
    console.error("❌ Firebase Error:", error);
  }
}

runCheck();
