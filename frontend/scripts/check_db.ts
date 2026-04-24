import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function checkDatabase() {
  console.log("🚀 Initializing BAGA Database Check...");
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Check Complaints
    console.log("📂 Fetching 'complaints' collection...");
    const complaintsSnap = await getDocs(collection(db, "complaints"));
    console.log(`✅ Success! Found ${complaintsSnap.size} complaints.`);
    
    // Check Users
    console.log("👤 Fetching 'users' collection...");
    const usersSnap = await getDocs(collection(db, "users"));
    console.log(`✅ Success! Found ${usersSnap.size} registered users.`);

    if (complaintsSnap.size > 0) {
      console.log("\n--- Latest Complaint Snippet ---");
      const firstDoc = complaintsSnap.docs[0];
      console.log(JSON.stringify({ id: firstDoc.id, ...firstDoc.data() }, null, 2));
    }

  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

checkDatabase();
