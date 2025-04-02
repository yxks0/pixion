
// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔐 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCqZKvkxr8vddWBaOlnGFTfyrIOq8Aw0Ys",
  authDomain: "pixion-c19b4.firebaseapp.com",
  projectId: "pixion-c19b4",
  storageBucket: "pixion-c19b4.firebasestorage.app",
  messagingSenderId: "480232974462",
  appId: "1:480232974462:web:c5f243c72c2e813ff6502f",
  measurementId: "G-SE9PSCLV36"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// ✅ Attach to window so HTML buttons can call them
window.login = async function () {
  try {
    const result = await signInWithPopup(auth, provider);
    alert(`Welcome ${result.user.displayName}`);
  } catch (error) {
    console.error("Login failed:", error);
    alert("Login failed. Check console.");
  }
};

window.logout = async function () {
  await signOut(auth);
  alert("Logged out!");
};

// You can export more here if needed


// Save to a specific slot
window.saveDrawing = async function (slotName, drawingData) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login to save your drawing.");
    return;
  }

  const docRef = doc(db, "drawings", user.uid);
  const docSnap = await getDoc(docRef);
  const existingData = docSnap.exists() ? docSnap.data() : {};

  existingData[slotName] = {
    ...drawingData,
    timestamp: Date.now(),
  };

  await setDoc(docRef, existingData);
  alert(`Saved to ${slotName}`);
};

// Load from a specific slot
window.loadDrawing = async function (slotName) {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login to load your drawing.");
    return;
  }

  const docRef = doc(db, "drawings", user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists() && docSnap.data()[slotName]) {
    return docSnap.data()[slotName];
  } else {
    alert(`No drawing found in ${slotName}`);
    return null;
  }
};

import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.uploadToGallery = async function (drawingData) {
  const user = auth.currentUser;
  if (!user || !drawingData || !drawingData.colors || !drawingData.size) {
    alert("Missing user or drawing data.");
    return;
  }

  await addDoc(collection(db, "publicGallery"), {
    uid: user.uid,
    name: user.displayName,
    drawing: drawingData,
    timestamp: Date.now()
  });

  alert("Uploaded to public gallery!");
};


// Load public gallery
window.loadPublicGallery = async function () {
  const snapshot = await getDocs(collection(db, "publicGallery"));
  return snapshot.docs.map(doc => doc.data());
};
