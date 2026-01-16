
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MSG_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MESURMENT_ID"
};

// Check if the user has actually filled in their config
export const isFirebaseConfigured = 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID" && 
  firebaseConfig.apiKey !== "YOUR_API_KEY";

let db: any = null;
let auth: any = null;
let gamesCollection: any = null;
let templatesCollection: any = null;
let requirementsCollection: any = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    gamesCollection = collection(db, "games");
    templatesCollection = collection(db, "templates");
    requirementsCollection = collection(db, "requirements");
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

// Firestore Helpers - Games
export const cloudSaveGame = async (game: any) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    await setDoc(doc(db, "games", game.id), game);
  } catch (err: any) {
    if (err.code === 'permission-denied') {
      console.error("PERMISSION DENIED: You must be logged in as an admin to save games.");
    }
    throw err;
  }
};

export const cloudDeleteGame = async (id: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    await deleteDoc(doc(db, "games", id));
  } catch (err: any) {
    throw err;
  }
};

export const cloudFetchGames = async () => {
  if (!isFirebaseConfigured || !gamesCollection) return null;
  try {
    const snapshot = await getDocs(gamesCollection);
    return snapshot.docs.map(doc => doc.data());
  } catch (err: any) {
    throw err;
  }
};

// Firestore Helpers - Templates
export const cloudSaveTemplate = async (template: any) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    await setDoc(doc(db, "templates", template.id), template);
  } catch (err: any) {
    console.error("Cloud Save Template Error:", err);
    throw err;
  }
};

export const cloudSaveRequirements = async (requirement: any) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    await setDoc(doc(db, "requirements", requirement.id), requirement);
  } catch (err: any) {
    console.error("Cloud Save Requirement Error:", err);
    throw err;
  }
};


export const cloudDeleteTemplate = async (id: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    await deleteDoc(doc(db, "templates", id));
  } catch (err: any) {
    console.error("Cloud Delete Template Error:", err);
    throw err;
  }
};

export const cloudDeleteRequirements = async (id: string) => {
  if (!isFirebaseConfigured || !db) return;
  try {
    await deleteDoc(doc(db, "requirements", id));
  } catch (err: any) {
    console.error("Cloud Delete Requirement Error:", err);
    throw err;
  }
};

export const cloudFetchTemplates = async () => {
  if (!isFirebaseConfigured || !templatesCollection) return null;
  try {
    const snapshot = await getDocs(templatesCollection);
    return snapshot.docs.map(doc => doc.data());
  } catch (err: any) {
    throw err;
  }
};

export const cloudFetchRequirements = async () => {
  if (!isFirebaseConfigured || !requirementsCollection) return null;
  try {
    const snapshot = await getDocs(requirementsCollection);
    return snapshot.docs.map(doc => doc.data());
  } catch (err: any) {
    throw err;
  }
};
