// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

// Firebase configuration from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBGAMvS_6U4td-eTvxwIOgE9mWhjAZyBwU",
  authDomain: "gedo-2000.firebaseapp.com",
  projectId: "gedo-2000",
  storageBucket: "gedo-2000.firebasestorage.app",
  messagingSenderId: "741253169611",
  appId: "1:741253169611:web:291974f53353fc8c92364e",
  measurementId: "G-673LV45NQZ"
};

// Initialize Firebase
console.log('Initializing Firebase...');
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Store configuration
const WHATSAPP_NUMBER = "+201002402986";
const CURRENCY = "EGP";

console.log('Firebase initialized successfully!');
console.log('Database reference:', db);

const storage = firebase.storage();