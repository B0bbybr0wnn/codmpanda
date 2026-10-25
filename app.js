import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, signInWithCredential, signOut, onAuthStateChanged, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp,
  increment, arrayUnion, arrayRemove, Timestamp, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Restore the stable pre-fullscreen app behavior. The app source is kept byte-for-byte
// after the original static import block and evaluated as one module-scoped program.
(async function loadRestoredApp() {
  const paths = [
    '/app-core-20261025-01.txt',
    '/app-core-20261025-02.txt',
    '/app-core-20261025-03.txt',
    '/app-core-20261025-04.txt',
    '/app-core-20261025-05.txt',
    '/app-core-20261025-06.txt'
  ];
  try {
    const chunks = await Promise.all(paths.map(async (path) => {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load restored app source: ' + path + ' (' + response.status + ')');
      return response.text();
    }));
    const source = chunks.join('');
    if (!source.includes('async function openUserProfile(uid)') ||
        source.includes('player-profile-fullscreen.js') ||
        source.includes('profile-fullscreen')) {
      throw new Error('Restored source integrity check failed');
    }
    eval(source);
  } catch (error) {
    console.error('[CODMPanda] Could not start restored app:', error);
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.animation = 'none';
      splash.innerHTML = '<div style="max-width:300px;padding:24px;text-align:center;color:#fff;font:14px system-ui"><strong>CODMPanda could not load.</strong><p style="color:#aaa;margin-top:8px">Please refresh when the connection is available.</p></div>';
    }
  }
})();
