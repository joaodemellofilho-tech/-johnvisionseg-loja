// assets/js/firebase-init.js
// Initialize Firebase SDKs and expose auth and firestore globals
// This file should be loaded after the Firebase SDK scripts and firebase-config.js
if (typeof firebase === 'undefined' || !firebase.apps.length) {
  console.warn('Firebase SDK not loaded yet.');
} else {
  // Initialize app if not already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(window.JOHNVISIONSEG_FIREBASE_CONFIG);
  }
  // Expose auth and firestore for other scripts
  window.auth = firebase.auth();
  window.db = firebase.firestore();
}
