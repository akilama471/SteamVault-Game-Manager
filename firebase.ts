
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// IMPORTANT: Replace these with your real values from the Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "steamvault-game-manager",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if the user has actually filled in their config
export const isFirebaseConfigured = 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID" && 
  firebaseConfig.apiKey !== "YOUR_API_KEY";

let db: any = null;
let auth: any = null;
let gamesCollection: any = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    gamesCollection = collection(db, "games");
  } catch (err) {
    console.error("Firebase initialization failed:", err);
  }
}

export { auth };

// Auth Helpers
export const loginAdmin = (email: string, pass: string) => {
  if (!auth) return Promise.reject("Auth not initialized");
  return signInWithEmailAndPassword(auth, email, pass);
};

export const logoutAdmin = () => {
  if (!auth) return Promise.resolve();
  return signOut(auth);
};

export const subscribeToAuth = (callback: (user: any) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
};

// Firestore Helpers
export const cloudSaveGame = async (game: any) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    await setDoc(doc(db, "games", game.id), game);
  } catch (err) {
    console.warn("Cloud save failed (check Firestore Rules):", err);
    throw err;
  }
};

export const cloudDeleteGame = async (id: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    await deleteDoc(doc(db, "games", id));
  } catch (err) {
    console.warn("Cloud delete failed:", err);
    throw err;
  }
};

export const cloudFetchGames = async () => {
  if (!isFirebaseConfigured || !gamesCollection) {
    console.info("Firebase not configured. Using local mode.");
    return null;
  }
  try {
    const snapshot = await getDocs(gamesCollection);
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.error("Error fetching from Firestore:", err);
    throw err;
  }
};
