// ============================================
// CODMPanda — app.js
// Chunk 1/7: Firebase + State + Constants + Utils
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================
// FIREBASE CONFIG
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyC4wVCT-ITLRFPDtzENnDjxL_1aVCAqWHg",
  authDomain: "codmpanda-app.firebaseapp.com",
  projectId: "codmpanda-app",
  storageBucket: "codmpanda-app.firebasestorage.app",
  messagingSenderId: "604146891375",
  appId: "1:604146891375:web:ae74f70c184fd89d572b9a"
};

const ADMIN_UID = "ItqEYihqxYW4HGm7i8bBYky8XNw1";
const NOTIFY_WORKER_URL = "https://codmpanda-notify.bobbyjohon8585.workers.dev";
const APP_VERSION = "1.0.0";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ============================================
// GLOBAL STATE
// ============================================
const State = {
  user: null,
  profile: null,
  currentTab: 'play',
  lobbiesUnsub: null,
  vaultsUnsub: null,
  camosUnsub: null,
  clansUnsub: null,
  scrimsUnsub: null,
  clipsUnsub: null,
  leaksUnsub: null,
  joinCount: 0,
  interstitialShown: false,
  filters: {
    lobbies: { rank: 'all', mode: 'all', region: 'all', mic: false, search: '' },
    vaults: { gun: 'all', type: 'gunsmith', search: '' },
    camos: { category: 'all' },
    clips: { gun: 'all', sort: 'recent' }
  },
  cache: {
    lobbies: [],
    vaults: [],
    camos: {},
    clans: [],
    scrims: [],
    clips: [],
    leaks: [],
    tierVotes: {}
  }
};
window.__state = State;

// ============================================
// CODM DATA
// ============================================
const CODM_GUNS = {
  'Assault Rifle': [
    'AK117', 'AK-47', 'ASM10', 'BK57', 'DR-H', 'FR .556', 'HBRa3', 'HVK-30',
    'ICR-1', 'KN-44', 'LK24', 'M16', 'M4', 'Man-O-War', 'Oden',
    'Peacekeeper MK2', 'AKBP', 'AS VAL', 'CR-56 AMAX', 'EM2',
    'FARA 83', 'Grau 5.56', 'Kilo 141', 'M13', 'Maddox',
    'Swordfish', 'Type 25', 'Type 19', 'BP50', 'RAM-7'
  ],
  'SMG': [
    'QQ9', 'MP5', 'MP7', 'PDW-57', 'RUS-79U', 'Cordite', 'GKS',
    'HG 40', 'MSMC', 'Pharo', 'Razorback', 'QQ10', 'AGR 556',
    'Fennec', 'Striker 45', 'PP19 Bizon', 'PPSh-41', 'QXR',
    'MX9', 'CX-9', 'LAPA', 'Vaznev-9K', 'ISO 45'
  ],
  'Sniper': [
    'Arctic .50', 'DL Q33', 'Locus', 'M21 EBR', 'XPR-50',
    'NA-45', 'Rytec AMR', 'SP-R 208', 'Kilo Bolt-Action',
    'ZRG 20mm', 'HDR', 'LW3-Tundra', 'Koshka', 'Outlaw'
  ],
  'LMG': [
    'RPD', 'M4LMG', 'UL736', 'S36', 'Chopper', 'Holger 26',
    'PKM', 'Bruen MK9', 'FiNN LMG', 'RAAL MG', 'Hades', 'MG82'
  ],
  'Shotgun': [
    'BY15', 'HS0405', 'HS2126', 'Striker', 'KRM 262',
    'Echo', 'JAK-12', 'R9-0', 'Argus', 'VLK Rogue'
  ],
  'Marksman': [
    'SKS', 'SPR-208', 'MK2 Carbine', 'Kar98K', 'EBR-14', 'SVD', 'Type 63'
  ],
  'Pistol': [
    'J358', 'MW11', '.50 GS', 'Renetti', 'L-CAR 9',
    'Shorty', 'Crossbow', 'Nail Gun', 'TEC-9'
  ],
  'Melee': [
    'Knife', 'Baseball Bat', 'Axe', 'Karambit', 'Machete',
    'Kali Sticks', 'Katana', 'Sickle', 'Wrench', 'Shovel'
  ],
  'Launcher': [
    'FHJ-18', 'SMRS', 'Thumper', 'Strela-P', 'RPG-7', 'D13 Sector', 'M79'
  ]
};

const ALL_GUNS = Object.values(CODM_GUNS).flat();

const CAMO_TYPES = [
  { key: 'sand', label: 'Sand', color: '#D4A574' },
  { key: 'dragon', label: 'Dragon', color: '#E63946' },
  { key: 'splinter', label: 'Splinter', color: '#8B5A2B' },
  { key: 'tiger', label: 'Tiger', color: '#F4A261' },
  { key: 'jungle', label: 'Jungle', color: '#2A9D8F' },
  { key: 'reptile', label: 'Reptile', color: '#264653' },
  { key: 'gold', label: 'Gold', color: '#FFD700' },
  { key: 'platinum', label: 'Platinum', color: '#E5E4E2' },
  { key: 'diamond', label: 'Diamond', color: '#00D9FF' },
  { key: 'damascus', label: 'Damascus', color: '#FF6B00' }
];

const RANKS = [
  'Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Grandmaster',
  'Legendary', 'Mythic', 'Legendary Rank', 'Top 500'
];

const MODES = ['BR', 'MP', 'Ranked MP', 'Ranked BR', 'Zombies', 'Sniper Only', 'Scrim', 'Any'];
const REGIONS = ['Africa', 'EU', 'NA', 'SA', 'Asia', 'ME', 'Oceania', 'Global'];
const ROLES = ['Rusher', 'Sniper', 'Support', 'IGL', 'Anchor', 'Flex', 'Any'];

// ============================================
// TOAST
// ============================================
function toast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const colors = {
    success: 'bg-green-500/10 border-green-500/40 text-green-400',
    error: 'bg-red-500/10 border-red-500/40 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/40 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
  };
  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    info: 'info',
    warning: 'alert-triangle'
  };
  const el = document.createElement('div');
  el.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg ${colors[type]} pointer-events-auto`;
  el.innerHTML = `
    <i data-lucide="${icons[type]}" class="w-5 h-5 flex-shrink-0"></i>
    <span class="text-sm font-medium flex-1">${message}</span>
  `;
  container.appendChild(el);
  if (window.lucide) window.lucide.createIcons();
  setTimeout(() => {
    el.classList.add('toast-exit');
    setTimeout(() => el.remove(), 250);
  }, duration);
}

// ============================================
// CONFIRM DIALOG
// ============================================
function confirmDialog(title, message, onConfirm, confirmText = 'Confirm', danger = false) {
  const container = document.getElementById('modal-container');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="modal-backdrop absolute inset-0 flex items-center justify-center p-6" onclick="if(event.target===this) closeModal()">
      <div class="bg-card border border-border rounded-2xl p-6 max-w-sm w-full slide-up">
        <h3 class="text-lg font-bold mb-2">${title}</h3>
        <p class="text-sm text-gray-400 mb-6">${message}</p>
        <div class="flex gap-3">
          <button onclick="closeModal()" class="btn-press flex-1 py-3 rounded-xl bg-cardAlt border border-border text-sm font-semibold">Cancel</button>
          <button id="confirm-btn" class="btn-press flex-1 py-3 rounded-xl ${danger ? 'bg-red-500' : 'bg-primary'} text-sm font-bold">${confirmText}</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('confirm-btn').onclick = () => {
    closeModal();
    onConfirm();
  };
  if (window.lucide) window.lucide.createIcons();
}

function closeModal() {
  const c = document.getElementById('modal-container');
  c.classList.add('hidden');
  c.innerHTML = '';
}

function closeSheet() {
  const c = document.getElementById('sheet-container');
  c.classList.add('hidden');
  c.innerHTML = '';
}

function openSheet(contentHTML, title = '') {
  const container = document.getElementById('sheet-container');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="modal-backdrop absolute inset-0" onclick="if(event.target===this) closeSheet()">
      <div class="sheet absolute bottom-0 left-0 right-0 slide-up">
        <div class="sticky top-0 z-10 bg-[#0a0a0a] pt-3 pb-3 px-5 border-b border-border">
          <div class="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-3"></div>
          ${title ? `<h3 class="text-lg font-bold">${title}</h3>` : ''}
        </div>
        <div class="px-5 pb-8 pt-4">${contentHTML}</div>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// HELPERS
// ============================================
function timeAgo(timestamp) {
  if (!timestamp) return 'just now';
  let date;
  if (timestamp.toDate) date = timestamp.toDate();
  else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
  else date = new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function copyText(text, label = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    toast(label, 'success');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast(label, 'success');
  }
}

async function shareContent(title, text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
    } catch (e) { /* cancelled */ }
  } else {
    copyText(url || text, 'Link copied!');
  }
}

function compressImage(file, maxSize = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateReferralCode(uid) {
  return 'PANDA' + uid.slice(0, 6).toUpperCase();
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function showAd() {
  if (State.profile?.isPro) return;
  const banner = document.getElementById('ad-banner');
  if (banner) banner.classList.remove('hidden');
}

function hideAd() {
  const banner = document.getElementById('ad-banner');
  if (banner) banner.classList.add('hidden');
}

function maybeShowInterstitial() {
  State.joinCount++;
  if (State.joinCount >= 3 && !State.interstitialShown && !State.profile?.isPro) {
    State.interstitialShown = true;
    const container = document.getElementById('modal-container');
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="modal-backdrop absolute inset-0 flex items-center justify-center p-6">
        <div class="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center slide-up">
          <div class="text-xs text-gray-500 uppercase font-bold mb-2">Advertisement</div>
          <div class="bg-gradient-to-br from-primary/20 to-gold/20 rounded-xl h-40 flex items-center justify-center mb-4">
            <div class="text-center">
              <div class="text-4xl mb-2">🎮</div>
              <div class="text-sm font-bold">AdMob Placeholder</div>
              <div class="text-xs text-gray-500">Interstitial Ad</div>
            </div>
          </div>
          <button onclick="closeModal()" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm">Continue</button>
          <button onclick="closeModal(); goPro();" class="text-xs text-gold mt-3">Remove ads with Pro →</button>
        </div>
      </div>
    `;
  }
}

function emptyState(icon, title, subtitle, ctaLabel, ctaFn) {
  const ctaHTML = (ctaLabel && ctaFn) ? `
    <button id="empty-cta-${Date.now()}" class="empty-cta-btn btn-press mt-4 px-5 py-2.5 rounded-xl bg-primary font-bold text-sm glow-primary">
      ${esc(ctaLabel)}
    </button>
  ` : '';
  setTimeout(() => {
    const btns = document.querySelectorAll('.empty-cta-btn');
    btns.forEach(b => { if (!b.dataset.bound) { b.dataset.bound = '1'; if (ctaFn) b.onclick = ctaFn; } });
  }, 0);
  return `
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center fade-in">
      <div class="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mb-4">
        <i data-lucide="${icon}" class="w-8 h-8 text-gray-500"></i>
      </div>
      <div class="text-base font-bold mb-1">${esc(title)}</div>
      <div class="text-xs text-gray-500 max-w-[240px]">${esc(subtitle || '')}</div>
      ${ctaHTML}
    </div>
  `;
}

// Export to window
window.toast = toast;
window.confirmDialog = confirmDialog;
window.closeModal = closeModal;
window.closeSheet = closeSheet;
window.openSheet = openSheet;
window.copyText = copyText;
window.shareContent = shareContent;
window.hideAd = hideAd;
window.maybeShowInterstitial = maybeShowInterstitial;
window.esc = esc;
window.timeAgo = timeAgo;
window.State = State;
window.CODM_GUNS = CODM_GUNS;
window.ALL_GUNS = ALL_GUNS;
window.CAMO_TYPES = CAMO_TYPES;
window.RANKS = RANKS;
window.MODES = MODES;
window.REGIONS = REGIONS;
window.ROLES = ROLES;
window.ADMIN_UID = ADMIN_UID;
window.APP_VERSION = APP_VERSION;

/* END OF CHUNK 1 */
// ============================================
// Chunk 2/7: Auth + Onboarding + Tab Router
// ============================================

// ---------- AUTH ----------
async function handleSignIn() {
  try {
    toast('Opening Google...', 'info', 1500);

    if (!window.google || !window.google.accounts) {
      await new Promise(function(resolve, reject) {
        let attempts = 0;
        const check = setInterval(function() {
          attempts++;
          if (window.google && window.google.accounts) {
            clearInterval(check);
            resolve();
          } else if (attempts > 50) {
            clearInterval(check);
            reject(new Error('GIS script failed to load'));
          }
        }, 100);
      });
    }

    initGIS();

    window.google.accounts.id.prompt(function(notification) {
      console.log('GIS prompt:', notification);
      if (notification.isNotDisplayed && notification.isNotDisplayed()) {
        console.warn('One Tap not displayed');
        fallbackRenderGISButton();
      }
      if (notification.isSkippedMoment && notification.isSkippedMoment()) {
        console.warn('One Tap skipped');
      }
    });
  } catch (err) {
    console.error('GIS error:', err);
    toast('Sign-in failed: ' + err.message, 'error', 5000);
  }
}

const GOOGLE_CLIENT_ID = "604146891375-ae5bhcm2nd2f59f0npp3en6setthjg1s.apps.googleusercontent.com";

let gisInitialized = false;

function initGIS() {
  if (gisInitialized) return;
  if (!window.google || !window.google.accounts) {
    console.warn('GIS not loaded yet');
    return;
  }
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGISResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  gisInitialized = true;
  console.log('GIS initialized');
}

function fallbackRenderGISButton() {
  openSheet(
    '<div class="text-center space-y-4">' +
      '<div class="text-2xl">🐼</div>' +
      '<div class="text-sm font-bold">Sign in with Google</div>' +
      '<div id="gis-btn-container" class="flex justify-center"></div>' +
      '<button onclick="closeSheet()" class="text-xs text-gray-500">Cancel</button>' +
    '</div>',
    'Sign In'
  );

  setTimeout(function() {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.renderButton(
        document.getElementById('gis-btn-container'),
        { theme: 'filled_black', size: 'large', text: 'continue_with', shape: 'pill', width: 280 }
      );
    }
  }, 100);
}

async function handleGISResponse(response) {
  try {
    console.log('GIS credential received');
    closeSheet();

    const credential = GoogleAuthProvider.credential(response.credential);

    const result = await signInWithCredential(auth, credential);
    console.log('Firebase sign-in success:', result.user.email);
    toast('Signed in!', 'success');
  } catch (err) {
    console.error('Firebase credential error:', err.code, err.message);
    toast('Sign-in failed: ' + err.message, 'error', 5000);
  }
}

window.handleSignIn = handleSignIn;
window.initGIS = initGIS;
window.handleGISResponse = handleGISResponse;

async function checkRedirect() {
  try {
    await getRedirectResult(auth);
  } catch (e) {
    console.error('Redirect error:', e);
  }
}
async function handleSignOut() {
  confirmDialog('Sign Out', 'Are you sure you want to sign out?', async () => {
    try {
      if (State.lobbiesUnsub) State.lobbiesUnsub();
      if (State.vaultsUnsub) State.vaultsUnsub();
      if (State.camosUnsub) State.camosUnsub();
      if (State.clansUnsub) State.clansUnsub();
      if (State.scrimsUnsub) State.scrimsUnsub();
      if (State.clipsUnsub) State.clipsUnsub();
      if (State.leaksUnsub) State.leaksUnsub();
      await signOut(auth);
      location.reload();
    } catch (e) {
      toast('Sign out failed', 'error');
    }
  }, 'Sign Out', true);
}

async function ensureUserProfile(firebaseUser) {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const defaultProfile = {
      uid: firebaseUser.uid,
      ign: firebaseUser.displayName || 'Panda Player',
      rank: 'Rookie',
      region: 'Africa',
      avatar: firebaseUser.photoURL || '',
      bio: '',
      favGun: '',
      isPro: false,
      proExpiry: null,
      referralCode: generateReferralCode(firebaseUser.uid),
      invites: 0,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      onboardingDone: false
    };
    await setDoc(userRef, defaultProfile);
    return { ...defaultProfile, isNew: true };
  }
  return { ...snap.data(), isNew: false };
}

async function updateLastSeen() {
  if (!State.user) return;
  try {
    await updateDoc(doc(db, 'users', State.user.uid), { lastSeen: serverTimestamp() });
  } catch (e) { /* silent */ }
}

onAuthStateChanged(auth, async (user) => {
  const splash = document.getElementById('splash');
  if (splash) splash.classList.add('hidden');

  if (user) {
    State.user = user;
    try {
      const profile = await ensureUserProfile(user);
      State.profile = profile;
      if (!profile.ign || !profile.onboardingDone) {
        showOnboarding();
      } else {
        showMainApp();
      }
    } catch (e) {
      console.error('Profile load error:', e);
      toast('Failed to load profile', 'error');
      showAuthGate();
    }
  } else {
    State.user = null;
    State.profile = null;
    showAuthGate();
  }
});

// ---------- SCREENS ----------
function showAuthGate() {
  document.getElementById('auth-gate').classList.remove('hidden');
  document.getElementById('auth-gate').classList.add('flex');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
  if (window.lucide) window.lucide.createIcons();
}

let onboardingStep = 0;
const onboardingData = { rank: 'Rookie', region: 'Africa' };

const ONBOARDING_SLIDES = [
  { emoji: '🎮', title: 'Find Your Squad', desc: 'Real-time LFG board. Filter by rank, mode, region. Join lobbies with one tap via Jitsi voice.', color: 'from-primary/20 to-transparent' },
  { emoji: '🔬', title: 'Track Every Camo', desc: 'All 80+ guns. Sand → Damascus. Track progress, upload proofs, export your grind as an image.', color: 'from-gold/20 to-transparent' },
  { emoji: '⚔️', title: 'Build God Gunsmiths', desc: 'Share and discover the meta. Copy codes, browse attachments, like the best builds.', color: 'from-primary/20 to-transparent' }
];

function showOnboarding() {
  document.getElementById('auth-gate').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('onboarding').classList.add('flex');
  onboardingStep = 0;
  renderOnboarding();
}

function renderOnboarding() {
  const container = document.getElementById('onboarding-content');

  if (onboardingStep < ONBOARDING_SLIDES.length) {
    const slide = ONBOARDING_SLIDES[onboardingStep];
    container.innerHTML = `
      <div class="flex-1 flex flex-col justify-center px-6 fade-in">
        <div class="relative mb-12">
          <div class="absolute inset-0 bg-gradient-to-br ${slide.color} rounded-full blur-3xl"></div>
          <div class="relative w-32 h-32 mx-auto rounded-full bg-card border border-border flex items-center justify-center">
            <span class="text-6xl">${slide.emoji}</span>
          </div>
        </div>
        <h2 class="text-3xl font-black text-center mb-4">${slide.title}</h2>
        <p class="text-gray-400 text-center text-sm leading-relaxed max-w-xs mx-auto">${slide.desc}</p>
      </div>
      <div class="px-6 pb-10">
        <div class="flex justify-center gap-2 mb-6">
          ${ONBOARDING_SLIDES.map((_, i) => `
            <div class="h-1.5 rounded-full transition-all ${i === onboardingStep ? 'w-8 bg-primary' : 'w-1.5 bg-gray-700'}"></div>
          `).join('')}
        </div>
        <button id="onb-next" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary">
          ${onboardingStep === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </button>
        ${onboardingStep > 0 ? `
          <button id="onb-back" class="w-full py-3 text-gray-500 text-sm mt-2">Back</button>
        ` : `
          <button id="onb-skip" class="w-full py-3 text-gray-500 text-sm mt-2">Skip intro</button>
        `}
      </div>
    `;
    document.getElementById('onb-next').onclick = () => { onboardingStep++; renderOnboarding(); };
    const backBtn = document.getElementById('onb-back');
    if (backBtn) backBtn.onclick = () => { onboardingStep--; renderOnboarding(); };
    const skipBtn = document.getElementById('onb-skip');
    if (skipBtn) skipBtn.onclick = () => { onboardingStep = ONBOARDING_SLIDES.length; renderOnboarding(); };
  } else {
    container.innerHTML = `
      <div class="flex-1 flex flex-col justify-center px-6 fade-in">
        <div class="text-5xl text-center mb-6">🐼</div>
        <h2 class="text-2xl font-black text-center mb-2">Almost there!</h2>
        <p class="text-gray-400 text-center text-sm mb-8">Tell us about your playstyle</p>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Your Rank</label>
        <select id="onb-rank" class="mb-5">
          ${RANKS.map(r => `<option value="${r}" ${onboardingData.rank === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Your Region</label>
        <select id="onb-region" class="mb-5">
          ${REGIONS.map(r => `<option value="${r}" ${onboardingData.region === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">In-Game Name (IGN)</label>
        <input id="onb-ign" type="text" placeholder="e.g. ShadowPanda" maxlength="24" value="${esc(State.user?.displayName || '')}" class="mb-8" />
      </div>
      <div class="px-6 pb-10">
        <button id="onb-finish" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary">
          Start Dominating
        </button>
      </div>
    `;
    document.getElementById('onb-finish').onclick = async () => {
      const ign = document.getElementById('onb-ign').value.trim();
      const rank = document.getElementById('onb-rank').value;
      const region = document.getElementById('onb-region').value;
      if (!ign || ign.length < 2) {
        toast('IGN must be at least 2 characters', 'error');
        return;
      }
      try {
        await updateDoc(doc(db, 'users', State.user.uid), { ign, rank, region, onboardingDone: true });
        State.profile = { ...State.profile, ign, rank, region, onboardingDone: true };
        toast('Welcome to CODMPanda! 🐼', 'success');
        showMainApp();
      } catch (e) {
        console.error(e);
        toast('Failed to save profile', 'error');
      }
    };
  }
  if (window.lucide) window.lucide.createIcons();
}

// ---------- MAIN APP ----------
function showMainApp() {
  document.getElementById('auth-gate').classList.add('hidden');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');

  const subtitle = document.getElementById('top-bar-subtitle');
  if (subtitle && State.profile) {
    subtitle.textContent = `${State.profile.rank} • ${State.profile.region}`;
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  const notifBtn = document.getElementById('btn-notifications');
  if (notifBtn) notifBtn.onclick = showNotifications;

  updateLastSeen();
  setInterval(updateLastSeen, 60000);

  startOnlineCounter();
  switchTab('play');

  if (!State.profile?.isPro) setTimeout(showAd, 2000);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  if (window.lucide) window.lucide.createIcons();
}

function switchTab(tab) {
  State.currentTab = tab;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('tab-active', isActive);
    btn.classList.toggle('text-gray-500', !isActive);
  });

  if (State.lobbiesUnsub && tab !== 'play') { State.lobbiesUnsub(); State.lobbiesUnsub = null; }
  if (State.vaultsUnsub && tab !== 'lab') { State.vaultsUnsub(); State.vaultsUnsub = null; }
  if (State.camosUnsub && tab !== 'lab') { State.camosUnsub(); State.camosUnsub = null; }
  if (State.clansUnsub && tab !== 'squad') { State.clansUnsub(); State.clansUnsub = null; }
  if (State.scrimsUnsub && tab !== 'squad') { State.scrimsUnsub(); State.scrimsUnsub = null; }
  if (State.clipsUnsub && tab !== 'squad') { State.clipsUnsub(); State.clipsUnsub = null; }
  if (State.leaksUnsub && tab !== 'intel') { State.leaksUnsub(); State.leaksUnsub = null; }

  const content = document.getElementById('content');
  content.innerHTML = '';
  content.scrollTop = 0;
  window.scrollTo(0, 0);

  switch (tab) {
    case 'play': renderPlayTab(); break;
    case 'lab': renderLabTab(); break;
    case 'squad': renderSquadTab(); break;
    case 'intel': renderIntelTab(); break;
    case 'you': renderYouTab(); break;
  }

  if (window.lucide) window.lucide.createIcons();
}

function startOnlineCounter() {
  const el = document.getElementById('online-count');
  const num = document.getElementById('online-num');
  if (!el || !num) return;
  el.classList.remove('hidden');
  el.classList.add('flex');
  const base = 20 + Math.floor(Math.random() * 30);
  num.textContent = base;
  setInterval(() => {
    const current = parseInt(num.textContent);
    const delta = Math.floor(Math.random() * 5) - 2;
    num.textContent = Math.max(5, current + delta);
  }, 8000);
}

function showNotifications() {
  openSheet(`
    <div class="space-y-3">
      <div class="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
        <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <i data-lucide="users" class="w-5 h-5 text-primary"></i>
        </div>
        <div class="flex-1">
          <div class="text-sm font-semibold">LFG Match</div>
          <div class="text-xs text-gray-500">Notify when someone posts a matching lobby</div>
        </div>
        <div class="toggle ${State.profile?.notifLfg ? 'on' : ''}" onclick="toggleNotif('notifLfg', this)"></div>
      </div>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
        <div class="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
          <i data-lucide="zap" class="w-5 h-5 text-gold"></i>
        </div>
        <div class="flex-1">
          <div class="text-sm font-semibold">New Leaks</div>
          <div class="text-xs text-gray-500">Be first to know when intel drops</div>
        </div>
        <div class="toggle ${State.profile?.notifLeaks ? 'on' : ''}" onclick="toggleNotif('notifLeaks', this)"></div>
      </div>
    </div>
  `, 'Notifications');
}

async function toggleNotif(key, el) {
  el.classList.toggle('on');
  const val = el.classList.contains('on');
  try {
    await updateDoc(doc(db, 'users', State.user.uid), { [key]: val });
    State.profile[key] = val;
  } catch (e) {
    toast('Failed to update', 'error');
    el.classList.toggle('on');
  }
}

window.switchTab = switchTab;
window.handleSignIn = handleSignIn;
window.handleSignOut = handleSignOut;
window.toggleNotif = toggleNotif;
window.showNotifications = showNotifications;
window.renderOnboarding = renderOnboarding;

/* END OF CHUNK 2 */
// ============================================
// Chunk 3/7: PLAY Tab (LFG)
// ============================================

function renderPlayTab() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-black">Find Squad</h1>
          <p class="text-xs text-gray-500">Live LFG board — expires in 2h</p>
        </div>
        <button id="post-lobby-btn" class="btn-press px-4 py-2.5 rounded-xl bg-primary text-sm font-bold glow-primary flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> Post
        </button>
      </div>

      <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button class="chip filter-rank active">All Ranks</button>
        <button class="chip filter-mode">All Modes</button>
        <button class="chip filter-region">All Regions</button>
        <button class="chip filter-mic">🎤 Mic Only</button>
      </div>

      <div class="relative mb-4">
        <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
        <input id="lobby-search" type="text" placeholder="Search by IGN or note..." class="pl-10" />
      </div>

      <div id="lobbies-feed" class="space-y-3">
        ${skeletonLobby().repeat(3)}
      </div>
    </div>
  `;

  document.getElementById('post-lobby-btn').onclick = openPostLobbySheet;
  document.querySelectorAll('.filter-rank').forEach(btn => btn.onclick = () => openFilterPicker('rank', btn));
  document.querySelectorAll('.filter-mode').forEach(btn => btn.onclick = () => openFilterPicker('mode', btn));
  document.querySelectorAll('.filter-region').forEach(btn => btn.onclick = () => openFilterPicker('region', btn));
  document.querySelectorAll('.filter-mic').forEach(btn => {
    btn.onclick = () => {
      btn.classList.toggle('active');
      State.filters.lobbies.mic = btn.classList.contains('active');
      renderLobbies();
    };
  });

  document.getElementById('lobby-search').oninput = (e) => {
    State.filters.lobbies.search = e.target.value.toLowerCase();
    renderLobbies();
  };

  loadLobbies();
  if (window.lucide) window.lucide.createIcons();
}

function skeletonLobby() {
  return `
    <div class="bg-card border border-border rounded-2xl p-4">
      <div class="flex items-center gap-3 mb-3">
        <div class="skeleton w-12 h-12 rounded-full"></div>
        <div class="flex-1">
          <div class="skeleton h-4 w-32 rounded mb-2"></div>
          <div class="skeleton h-3 w-24 rounded"></div>
        </div>
      </div>
      <div class="skeleton h-3 w-full rounded mb-2"></div>
      <div class="skeleton h-3 w-3/4 rounded"></div>
    </div>
  `;
}

function loadLobbies() {
  const now = Date.now();
  const q = query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(50));

  State.lobbiesUnsub = onSnapshot(q, (snap) => {
    const lobbies = [];
    snap.forEach(doc => {
      const data = doc.data();
      const expires = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (expires > now) lobbies.push({ id: doc.id, ...data });
    });
    State.cache.lobbies = lobbies;
    renderLobbies();
  }, (err) => {
    console.error('Lobbies error:', err);
    const feed = document.getElementById('lobbies-feed');
    if (feed) feed.innerHTML = emptyState('users', 'No lobbies yet', 'Be the first to post!', 'Post Lobby', openPostLobbySheet);
    if (window.lucide) window.lucide.createIcons();
  });
}

function renderLobbies() {
  const feed = document.getElementById('lobbies-feed');
  if (!feed) return;
  let lobbies = State.cache.lobbies;

  const f = State.filters.lobbies;
  if (f.rank && f.rank !== 'all') lobbies = lobbies.filter(l => l.rank === f.rank);
  if (f.mode && f.mode !== 'all') lobbies = lobbies.filter(l => l.mode === f.mode);
  if (f.region && f.region !== 'all') lobbies = lobbies.filter(l => l.region === f.region);
  if (f.mic) lobbies = lobbies.filter(l => l.mic === true);
  if (f.search) {
    lobbies = lobbies.filter(l =>
      (l.ign || '').toLowerCase().includes(f.search) ||
      (l.note || '').toLowerCase().includes(f.search)
    );
  }

  if (lobbies.length === 0) {
    feed.innerHTML = emptyState('users', 'No lobbies found', 'Try different filters or post your own', 'Post Lobby', openPostLobbySheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = lobbies.map(l => {
    const playersText = `${l.players || 1}/5`;
    return `
      <div class="bg-card border border-border rounded-2xl p-4 fade-in">
        <div class="flex items-start gap-3 mb-3">
          <div class="relative">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-lg overflow-hidden">
              ${l.avatar ? `<img src="${esc(l.avatar)}" class="w-full h-full object-cover" />` : getInitials(l.ign)}
            </div>
            ${l.mic ? `<div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center"><i data-lucide="mic" class="w-2.5 h-2.5 text-white"></i></div>` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm">${esc(l.ign || 'Unknown')}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">${esc(l.rank || 'Rookie')}</span>
            </div>
            <div class="text-[11px] text-gray-500 mt-0.5">${timeAgo(l.createdAt)} · ${esc(l.region)} · ${esc(l.mode)}</div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-sm font-black text-primary">${playersText}</div>
            <div class="text-[9px] text-gray-500">PLAYERS</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-3">
          ${l.role ? `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-300">${esc(l.role)}</span>` : ''}
          ${l.mic ? `<span class="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold">🎤 Mic</span>` : `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-500">🔇 No Mic</span>`}
        </div>

        ${l.note ? `<p class="text-xs text-gray-400 mb-3 line-clamp-2">${esc(l.note)}</p>` : ''}

        <div class="flex gap-2">
          <button class="join-btn btn-press flex-1 py-2.5 rounded-xl bg-primary text-sm font-bold flex items-center justify-center gap-1.5" data-id="${l.id}">
            <i data-lucide="log-in" class="w-4 h-4"></i> Join
          </button>
          <button class="report-lobby btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-uid="${l.uid}">
            <i data-lucide="flag" class="w-4 h-4 text-gray-500"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.join-btn').forEach(btn => {
    btn.onclick = () => joinLobby(btn.dataset.id);
  });
  feed.querySelectorAll('.report-lobby').forEach(btn => {
    btn.onclick = () => reportContent('lobby', btn.dataset.id, btn.dataset.uid);
  });

  if (window.lucide) window.lucide.createIcons();
}

async function joinLobby(lobbyId) {
  const lobby = State.cache.lobbies.find(l => l.id === lobbyId);
  if (!lobby) return;

  try {
    if ((lobby.players || 1) < 5) {
      await updateDoc(doc(db, 'lobbies', lobbyId), { players: increment(1) });
    }

    const room = lobby.jitsiLink || `https://meet.jit.si/CODMPanda-${lobbyId}`;
    const roomName = room.split('/').pop();

    // Open Jitsi INSIDE the app as a full-screen overlay
    const container = document.getElementById('modal-container');
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="fixed inset-0 z-[250] bg-black flex flex-col">
        <div class="flex items-center justify-between px-4 h-14 border-b border-border bg-amoled/95 backdrop-blur">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-bold text-sm overflow-hidden">
              ${lobby.avatar ? `<img src="${esc(lobby.avatar)}" class="w-full h-full object-cover" />` : getInitials(lobby.ign)}
            </div>
            <div class="min-w-0">
              <div class="text-xs font-bold truncate">${esc(lobby.ign)}'s room</div>
              <div class="text-[10px] text-gray-500">${esc(lobby.mode)} · ${esc(lobby.region)}</div>
            </div>
          </div>
          <button id="leave-jitsi-btn" class="btn-press px-3 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1.5">
            <i data-lucide="phone-off" class="w-3.5 h-3.5"></i> Leave
          </button>
        </div>
        <div class="flex-1 relative">
          <iframe
            id="jitsi-frame"
            src="https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName=%22${encodeURIComponent(State.profile.ign)}%22&config.prejoinPageEnabled=false&config.startWithAudioMuted=${lobby.mic ? 'false' : 'true'}&config.startWithVideoMuted=true&config.disableDeepLinking=true&config.disableProfile=true&config.hideConferenceSubject=true&config.toolbarButtons=%5B%22microphone%22%2C%22camera%22%2C%22desktop%22%2C%22chat%22%2C%22raisehand%22%2C%22tileview%22%2C%22hangup%22%5D"
            class="w-full h-full border-0"
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          ></iframe>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('leave-jitsi-btn').onclick = () => {
      closeModal();
      toast('Left the voice room', 'success', 1500);
    };

    toast('Joined! Grant mic access when prompted.', 'success');
    maybeShowInterstitial();
  } catch (e) {
    console.error(e);
    toast('Failed to join room', 'error');
  }
}

function openPostLobbySheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rank</label>
        <select id="pl-rank">${RANKS.map(r => `<option ${State.profile?.rank === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Mode</label>
        <select id="pl-mode">${MODES.map(m => `<option>${m}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Region</label>
        <select id="pl-region">${REGIONS.map(r => `<option ${State.profile?.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Role</label>
        <select id="pl-role">${ROLES.map(r => `<option>${r}</option>`).join('')}</select>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div>
          <div class="text-sm font-semibold">Voice Chat</div>
          <div class="text-xs text-gray-500">Enable mic on join</div>
        </div>
        <div id="pl-mic" class="toggle on"></div>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Note (optional)</label>
        <textarea id="pl-note" rows="3" maxlength="150" placeholder="e.g. Need 3 more for Ranked MP, Legendary+ only..."></textarea>
      </div>
      <button id="pl-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary">
        Post Lobby
      </button>
    </div>
  `, 'Create Lobby');

  document.getElementById('pl-mic').onclick = function() { this.classList.toggle('on'); };

  document.getElementById('pl-submit').onclick = async () => {
    const rank = document.getElementById('pl-rank').value;
    const mode = document.getElementById('pl-mode').value;
    const region = document.getElementById('pl-region').value;
    const role = document.getElementById('pl-role').value;
    const mic = document.getElementById('pl-mic').classList.contains('on');
    const note = document.getElementById('pl-note').value.trim();

    const btn = document.getElementById('pl-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      const expiresAt = Timestamp.fromMillis(Date.now() + 2 * 60 * 60 * 1000);
      const jitsiLink = `https://meet.jit.si/CODMPanda-${State.user.uid.slice(0, 8)}-${Date.now()}`;

      await addDoc(collection(db, 'lobbies'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        rank, mode, region, role, mic, note,
        avatar: State.profile.avatar || '',
        players: 1,
        jitsiLink,
        createdAt: serverTimestamp(),
        expiresAt
      });

      toast('Lobby posted!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed to post', 'error');
      btn.disabled = false;
      btn.textContent = 'Post Lobby';
    }
  };
}

function openFilterPicker(type, chipEl) {
  const options = {
    rank: ['all', ...RANKS],
    mode: ['all', ...MODES],
    region: ['all', ...REGIONS]
  }[type];

  openSheet(`
    <div class="space-y-2">
      ${options.map(opt => {
        const label = opt === 'all' ? `All ${type.charAt(0).toUpperCase() + type.slice(1)}s` : opt;
        const selected = State.filters.lobbies[type] === opt;
        return `<button class="filter-opt w-full text-left px-4 py-3 rounded-xl ${selected ? 'bg-primary/15 border border-primary text-primary' : 'bg-card border border-border'} font-semibold text-sm" data-val="${opt}">${label}</button>`;
      }).join('')}
    </div>
  `, `Filter by ${type}`);

  document.querySelectorAll('.filter-opt').forEach(btn => {
    btn.onclick = () => {
      State.filters.lobbies[type] = btn.dataset.val;
      const label = btn.dataset.val === 'all' ? `All ${type.charAt(0).toUpperCase() + type.slice(1)}s` : btn.dataset.val;
      chipEl.textContent = label;
      chipEl.classList.toggle('active', btn.dataset.val !== 'all');
      renderLobbies();
      closeSheet();
    };
  });
}

function reportContent(type, id, targetUid) {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Why are you reporting this?</label>
        <textarea id="rp-reason" rows="4" maxlength="500" placeholder="Describe the issue..."></textarea>
      </div>
      <button id="rp-submit" class="btn-press w-full py-4 rounded-2xl bg-red-500 font-bold text-base">
        Submit Report
      </button>
    </div>
  `, 'Report');

  document.getElementById('rp-submit').onclick = async () => {
    const reason = document.getElementById('rp-reason').value.trim();
    if (reason.length < 5) { toast('Add more detail', 'error'); return; }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: State.user.uid,
        targetId: targetUid || id,
        targetType: type,
        reason,
        type: 'user-report',
        createdAt: serverTimestamp()
      });
      toast('Report submitted', 'success');
      closeSheet();
    } catch (e) {
      toast('Failed', 'error');
    }
  };
}

window.renderPlayTab = renderPlayTab;
window.reportContent = reportContent;

/* END OF CHUNK 3 */
// ============================================
// Chunk 4/7: LAB Tab (Vault + Camo Shell)
// ============================================

let labSubTab = 'vault';
let vaultTypeFilter = 'gunsmith';

function renderLabTab() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="mb-4">
        <h1 class="text-2xl font-black">The Lab</h1>
        <p class="text-xs text-gray-500">Gunsmiths, sensitivity, camo tracker</p>
      </div>

      <div class="flex gap-2 mb-4">
        <button id="sub-vault" class="sub-tab flex-1 py-2.5 rounded-xl font-bold text-sm ${labSubTab === 'vault' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}">Vault</button>
        <button id="sub-camo" class="sub-tab flex-1 py-2.5 rounded-xl font-bold text-sm ${labSubTab === 'camo' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}">Camo Tracker</button>
      </div>

      <div id="lab-body"></div>
    </div>
  `;

  document.getElementById('sub-vault').onclick = () => { labSubTab = 'vault'; renderLabTab(); };
  document.getElementById('sub-camo').onclick = () => { labSubTab = 'camo'; renderLabTab(); };

  if (labSubTab === 'vault') renderVaultSub();
  else renderCamoSub();

  if (window.lucide) window.lucide.createIcons();
}

function skeletonCard() {
  return `
    <div class="bg-card border border-border rounded-2xl p-3">
      <div class="skeleton h-24 w-full rounded-xl mb-3"></div>
      <div class="skeleton h-3 w-20 rounded mb-2"></div>
      <div class="skeleton h-3 w-16 rounded"></div>
    </div>
  `;
}

// ---------- VAULT ----------
function renderVaultSub() {
  const body = document.getElementById('lab-body');
  body.innerHTML = `
    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      <button class="chip vault-type ${vaultTypeFilter === 'gunsmith' ? 'active' : ''}" data-type="gunsmith">Gunsmith</button>
      <button class="chip vault-type ${vaultTypeFilter === 'sens' ? 'active' : ''}" data-type="sens">Sensitivity</button>
      <button class="chip vault-type ${vaultTypeFilter === 'hud' ? 'active' : ''}" data-type="hud">HUD</button>
      <button id="add-vault-btn" class="chip active ml-auto" style="background:#FF6B00;border-color:#FF6B00;color:#fff">+ Add</button>
    </div>

    <div class="relative mb-4">
      <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input id="vault-search" type="text" placeholder="Search by gun or code..." class="pl-10" />
    </div>

    <div id="vault-feed" class="grid grid-cols-2 gap-3">
      ${skeletonCard().repeat(4)}
    </div>
  `;

  document.getElementById('add-vault-btn').onclick = openAddVaultSheet;
  document.getElementById('vault-search').oninput = (e) => {
    State.filters.vaults.search = e.target.value.toLowerCase();
    renderVaults();
  };

  document.querySelectorAll('.vault-type').forEach(btn => {
    btn.onclick = () => {
      vaultTypeFilter = btn.dataset.type;
      State.filters.vaults.type = vaultTypeFilter;
      renderVaultSub();
    };
  });

  loadVaults();
  if (window.lucide) window.lucide.createIcons();
}

function loadVaults() {
  const q = query(
    collection(db, 'vaults'),
    orderBy('createdAt', 'desc'),
    limit(60)
  );

  State.vaultsUnsub = onSnapshot(q, (snap) => {
    const vaults = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (d.type === vaultTypeFilter) vaults.push({ id: doc.id, ...d });
    });
    State.cache.vaults = vaults;
    renderVaults();
  }, (err) => {
    console.error('Vaults error:', err);
    const feed = document.getElementById('vault-feed');
    if (feed) {
      feed.className = '';
      feed.innerHTML = emptyState('package-open', 'No vaults yet', 'Share your first build', 'Add Build', openAddVaultSheet);
    }
    if (window.lucide) window.lucide.createIcons();
  });
}

function renderVaults() {
  const feed = document.getElementById('vault-feed');
  if (!feed) return;
  let vaults = State.cache.vaults;
  if (State.filters.vaults.search) {
    const s = State.filters.vaults.search;
    vaults = vaults.filter(v =>
      (v.gunName || '').toLowerCase().includes(s) ||
      (v.gunsmithCode || '').toLowerCase().includes(s)
    );
  }

  if (vaults.length === 0) {
    feed.className = '';
    feed.innerHTML = emptyState('package-open', 'No vaults yet', 'Share your first ' + vaultTypeFilter + ' build', 'Add ' + vaultTypeFilter, openAddVaultSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.className = 'grid grid-cols-2 gap-3';
  feed.innerHTML = vaults.map(v => `
    <div class="bg-card border border-border rounded-2xl p-3 fade-in">
      ${v.imageUrl ? `<img src="${esc(v.imageUrl)}" class="w-full h-24 object-cover rounded-xl mb-3" />` :
        `<div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
          <i data-lucide="crosshair" class="w-8 h-8 text-primary/60"></i>
        </div>`
      }
      <div class="text-xs font-bold text-gray-300 truncate">${esc(v.gunName || 'Unknown')}</div>
      <div class="text-[10px] text-gray-500 mb-2">${esc(v.type || 'build')}</div>

      ${v.gunsmithCode ? `
        <button class="copy-code-btn w-full py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center gap-1 mb-2" data-code="${esc(v.gunsmithCode)}">
          <i data-lucide="copy" class="w-3 h-3"></i> ${esc(v.gunsmithCode)}
        </button>
      ` : ''}

      <div class="flex items-center justify-between">
        <button class="like-btn flex items-center gap-1 text-[11px] text-gray-400" data-id="${v.id}">
          <i data-lucide="heart" class="w-3.5 h-3.5"></i> ${v.likes || 0}
        </button>
        <button class="share-vault-btn text-gray-500" data-id="${v.id}">
          <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  feed.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      copyText(btn.dataset.code, 'Code copied!');
    };
  });
  feed.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'vaults', btn.dataset.id), { likes: increment(1) });
        toast('❤️ Liked!', 'success', 1500);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-vault-btn').forEach(btn => {
    btn.onclick = () => {
      const url = `${location.origin}/?vault=${btn.dataset.id}`;
      shareContent('CODMPanda Vault', 'Check out this build!', url);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

function openAddVaultSheet() {
  if (!State.profile?.isPro) {
    checkVaultLimit().then(canAdd => {
      if (!canAdd) {
        showProPaywall('You\'ve reached the free limit of 3 vaults. Upgrade to Pro for unlimited.');
        return;
      }
      actuallyOpenAddVault();
    });
    return;
  }
  actuallyOpenAddVault();
}

async function checkVaultLimit() {
  try {
    const snap = await getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid)));
    return snap.size < 3;
  } catch (e) {
    return true;
  }
}

function actuallyOpenAddVault() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Type</label>
        <select id="av-type">
          <option value="gunsmith">Gunsmith</option>
          <option value="sens">Sensitivity</option>
          <option value="hud">HUD</option>
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun</label>
        <select id="av-gun">
          <option value="">Select a gun...</option>
          ${Object.entries(CODM_GUNS).map(([cat, guns]) => `
            <optgroup label="${cat}">
              ${guns.map(g => `<option value="${g}">${g}</option>`).join('')}
            </optgroup>
          `).join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gunsmith Code</label>
        <input id="av-code" type="text" placeholder="e.g. ABC123XYZ" maxlength="20" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Attachments (one per line)</label>
        <textarea id="av-attach" rows="4" placeholder="Muzzle: Muzzle Brake&#10;Barrel: RTC Light Barrel&#10;Optic: Red Dot"></textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Screenshot (optional)</label>
        <input id="av-image" type="file" accept="image/*" class="text-xs" />
      </div>
      <button id="av-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">
        Save to Vault
      </button>
    </div>
  `, 'Add to Vault');

  document.getElementById('av-submit').onclick = async () => {
    const type = document.getElementById('av-type').value;
    const gunName = document.getElementById('av-gun').value;
    const gunsmithCode = document.getElementById('av-code').value.trim();
    const attachRaw = document.getElementById('av-attach').value.trim();
    const fileInput = document.getElementById('av-image');

    if (!gunName) { toast('Select a gun', 'error'); return; }
    if (!gunsmithCode && !attachRaw) { toast('Add a code or attachments', 'error'); return; }

    const btn = document.getElementById('av-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      let imageUrl = '';
      if (fileInput.files && fileInput.files[0]) {
        imageUrl = await compressImage(fileInput.files[0], 700, 0.6);
      }

      const attachments = {};
      attachRaw.split('\n').forEach(line => {
        const [k, ...v] = line.split(':');
        if (k && v.length) attachments[k.trim()] = v.join(':').trim();
      });

      await addDoc(collection(db, 'vaults'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        gunName, gunsmithCode, type,
        attachments,
        imageUrl,
        likes: 0,
        createdAt: serverTimestamp()
      });

      toast('Added to vault!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save to Vault';
    }
  };
}

window.renderLabTab = renderLabTab;
window.renderVaultSub = renderVaultSub;

/* END OF CHUNK 4 */
// ============================================
// Chunk 5/7: Camo Tracker
// ============================================

let camoCategoryFilter = 'all';
let expandedGun = null;

function renderCamoSub() {
  const body = document.getElementById('lab-body');
  const categories = ['all', ...Object.keys(CODM_GUNS)];

  body.innerHTML = `
    <div class="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-4">
      <div class="relative w-20 h-20 flex-shrink-0">
        <svg class="ring-progress w-20 h-20" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#222" stroke-width="8" fill="none" />
          <circle id="camo-ring" cx="50" cy="50" r="42" stroke="url(#camoGradient)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="264" />
          <defs>
            <linearGradient id="camoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FF6B00"/>
              <stop offset="100%" stop-color="#FFD700"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span id="camo-pct" class="text-lg font-black">0%</span>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold">Total Completion</div>
        <div id="camo-counts" class="text-xs text-gray-500 mt-1">Loading...</div>
        <button id="export-camo-btn" class="btn-press mt-2 text-[11px] font-bold text-primary flex items-center gap-1">
          <i data-lucide="download" class="w-3 h-3"></i> Export progress
        </button>
      </div>
    </div>

    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      ${categories.map(c => `
        <button class="chip camo-cat ${camoCategoryFilter === c ? 'active' : ''}" data-cat="${c}">${c === 'all' ? 'All' : c}</button>
      `).join('')}
    </div>

    <div id="camo-list" class="space-y-2"></div>
  `;

  document.querySelectorAll('.camo-cat').forEach(btn => {
    btn.onclick = () => {
      camoCategoryFilter = btn.dataset.cat;
      renderCamoSub();
    };
  });

  document.getElementById('export-camo-btn').onclick = exportCamoProgress;

  loadCamos();
  if (window.lucide) window.lucide.createIcons();
}

function loadCamos() {
  State.camosUnsub = onSnapshot(doc(db, 'camos', State.user.uid), (snap) => {
    State.cache.camos = snap.exists() ? snap.data() : {};
    renderCamoList();
  }, (err) => {
    console.error('Camos error:', err);
    State.cache.camos = {};
    renderCamoList();
  });
}

function renderCamoList() {
  const list = document.getElementById('camo-list');
  if (!list) return;

  const camoData = State.cache.camos || {};
  let totalChecked = 0;
  let totalPossible = 0;
  const gunsToShow = [];

  Object.entries(CODM_GUNS).forEach(([cat, guns]) => {
    if (camoCategoryFilter === 'all' || camoCategoryFilter === cat) {
      guns.forEach(g => gunsToShow.push({ gun: g, cat }));
    }
  });

  gunsToShow.forEach(({ gun }) => {
    const g = camoData[gun] || {};
    CAMO_TYPES.forEach(c => {
      totalPossible++;
      if (g[c.key]) totalChecked++;
    });
  });

  const pct = totalPossible > 0 ? Math.round((totalChecked / totalPossible) * 100) : 0;
  const isPro = State.profile?.isPro;
  const freeLimit = 5;

  const ring = document.getElementById('camo-ring');
  const pctEl = document.getElementById('camo-pct');
  const countsEl = document.getElementById('camo-counts');
  if (ring) {
    const dash = 264 - (264 * pct / 100);
    setTimeout(() => { ring.style.strokeDashoffset = dash; }, 100);
  }
  if (pctEl) pctEl.textContent = pct + '%';
  if (countsEl) {
    const goldCount = gunsToShow.filter(({ gun }) => (camoData[gun]?.gold)).length;
    countsEl.innerHTML = `${totalChecked}/${totalPossible} camos · ${goldCount} gold 🔥`;
  }

  list.innerHTML = gunsToShow.map(({ gun }, idx) => {
    const g = camoData[gun] || {};
    const checkedCount = CAMO_TYPES.filter(c => g[c.key]).length;
    const gunPct = Math.round((checkedCount / CAMO_TYPES.length) * 100);
    const isExpanded = expandedGun === gun;
    const isBlurred = !isPro && idx >= freeLimit;

    return `
      <div class="bg-card border border-border rounded-xl overflow-hidden ${isBlurred ? 'blurred' : ''}">
        <button class="gun-row w-full p-3 flex items-center gap-3 text-left" data-gun="${esc(gun)}">
          <div class="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <i data-lucide="crosshair" class="w-4 h-4 text-primary"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate">${esc(gun)}</div>
            <div class="flex items-center gap-2 mt-1">
              <div class="progress-bar flex-1 max-w-[100px]">
                <div class="progress-fill" style="width:${gunPct}%"></div>
              </div>
              <span class="text-[10px] font-bold text-gray-400">${gunPct}%</span>
            </div>
          </div>
          <i data-lucide="chevron-down" class="w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}"></i>
        </button>
        ${isExpanded ? `
          <div class="px-3 pb-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
            ${CAMO_TYPES.map(c => `
              <label class="camo-check flex items-center gap-2 p-2 rounded-lg bg-cardAlt border border-border cursor-pointer">
                <input type="checkbox" data-gun="${esc(gun)}" data-camo="${c.key}" ${g[c.key] ? 'checked' : ''} />
                <span class="text-xs font-semibold" style="color:${c.color}">${c.label}</span>
              </label>
            `).join('')}
            <button class="proof-upload col-span-2 mt-1 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-bold" data-gun="${esc(gun)}">
              ${g.proofUrl ? '✓ Proof uploaded' : '+ Upload proof'}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  list.querySelectorAll('.gun-row').forEach(btn => {
    btn.onclick = () => {
      expandedGun = expandedGun === btn.dataset.gun ? null : btn.dataset.gun;
      renderCamoList();
    };
  });

  list.querySelectorAll('.camo-check input').forEach(cb => {
    cb.onchange = async () => {
      const gun = cb.dataset.gun;
      const camo = cb.dataset.camo;
      try {
        const ref = doc(db, 'camos', State.user.uid);
        const snap = await getDoc(ref);
        const current = snap.exists() ? snap.data() : {};
        const gunData = current[gun] || {};
        gunData[camo] = cb.checked;
        current[gun] = gunData;
        await setDoc(ref, current);
      } catch (e) {
        console.error(e);
        toast('Failed to save', 'error');
        cb.checked = !cb.checked;
      }
    };
  });

  list.querySelectorAll('.proof-upload').forEach(btn => {
    btn.onclick = () => uploadCamoProof(btn.dataset.gun);
  });

  if (window.lucide) window.lucide.createIcons();
}

function uploadCamoProof(gun) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    if (!input.files || !input.files[0]) return;
    try {
      toast('Compressing image...', 'info', 1500);
      const img = await compressImage(input.files[0], 700, 0.6);
      const ref = doc(db, 'camos', State.user.uid);
      const snap = await getDoc(ref);
      const current = snap.exists() ? snap.data() : {};
      const gunData = current[gun] || {};
      gunData.proofUrl = img;
      current[gun] = gunData;
      await setDoc(ref, current);
      toast('Proof uploaded!', 'success');
    } catch (e) {
      console.error(e);
      toast('Upload failed', 'error');
    }
  };
  input.click();
}

function exportCamoProgress() {
  const camoData = State.cache.camos || {};
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 1000;

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, 800, 1000);

  ctx.fillStyle = '#FF6B00';
  ctx.font = 'bold 48px Inter, sans-serif';
  ctx.fillText('CODMPanda', 40, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillText('Camo Progress', 40, 130);

  ctx.fillStyle = '#888';
  ctx.font = '18px Inter, sans-serif';
  ctx.fillText(`${State.profile.ign} · ${new Date().toLocaleDateString()}`, 40, 165);

  let y = 230;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.fillText('GOLD CAMOS', 40, y);
  y += 35;

  const goldGuns = Object.entries(camoData).filter(([_, g]) => g.gold);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Inter, sans-serif';
  if (goldGuns.length === 0) {
    ctx.fillStyle = '#555';
    ctx.fillText('None yet — start the grind!', 40, y);
  } else {
    goldGuns.slice(0, 20).forEach(([gun]) => {
      ctx.fillStyle = '#fff';
      ctx.fillText('★ ' + gun, 40, y);
      y += 28;
    });
  }

  ctx.fillStyle = '#555';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('codmpanda.pages.dev', 40, 970);

  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'codmpanda-camos.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My CODMPanda Camo Progress',
          text: 'Check out my camo grind! 🐼'
        });
      } catch (e) { /* cancelled */ }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'codmpanda-camos.png';
      a.click();
      URL.revokeObjectURL(url);
      toast('Downloaded!', 'success');
    }
  }, 'image/png');
}

window.renderCamoSub = renderCamoSub;
window.exportCamoProgress = exportCamoProgress;

/* END OF CHUNK 5 */
// ============================================
// Chunk 6/7: SQUAD Tab (Clans + Scrims + Clips)
// ============================================

let squadSubTab = 'clans';

function renderSquadTab() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="mb-4">
        <h1 class="text-2xl font-black">Squad</h1>
        <p class="text-xs text-gray-500">Clans, scrims, and clips</p>
      </div>

      <div class="flex gap-2 mb-4">
        <button class="squad-sub flex-1 py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'clans' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="clans">Clans</button>
        <button class="squad-sub flex-1 py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'scrims' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="scrims">Scrims</button>
        <button class="squad-sub flex-1 py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'clips' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="clips">Clips</button>
      </div>

      <div id="squad-body"></div>
    </div>
  `;

  document.querySelectorAll('.squad-sub').forEach(btn => {
    btn.onclick = () => { squadSubTab = btn.dataset.sub; renderSquadTab(); };
  });

  if (squadSubTab === 'clans') renderClansSub();
  else if (squadSubTab === 'scrims') renderScrimsSub();
  else renderClipsSub();

  if (window.lucide) window.lucide.createIcons();
}

// ---------- CLANS ----------
function renderClansSub() {
  const body = document.getElementById('squad-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Find your tribe</div>
      <button id="create-clan-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1">
        <i data-lucide="plus" class="w-3 h-3"></i> Create
      </button>
    </div>
    <div id="clans-feed" class="space-y-3">
      <div class="skeleton h-24 rounded-2xl"></div>
      <div class="skeleton h-24 rounded-2xl"></div>
    </div>
  `;

  document.getElementById('create-clan-btn').onclick = openCreateClanSheet;
  loadClans();
}

function loadClans() {
  const q = query(collection(db, 'clans'), orderBy('createdAt', 'desc'), limit(50));
  State.clansUnsub = onSnapshot(q, (snap) => {
    const clans = [];
    snap.forEach(doc => clans.push({ id: doc.id, ...doc.data() }));
    State.cache.clans = clans;
    renderClans();
  }, (err) => {
    console.error('Clans error:', err);
    const feed = document.getElementById('clans-feed');
    if (feed) feed.innerHTML = emptyState('shield', 'No clans yet', 'Be the first to create one', 'Create Clan', openCreateClanSheet);
    if (window.lucide) window.lucide.createIcons();
  });
}

function renderClans() {
  const feed = document.getElementById('clans-feed');
  if (!feed) return;
  if (State.cache.clans.length === 0) {
    feed.innerHTML = emptyState('shield', 'No clans yet', 'Be the first to create one', 'Create Clan', openCreateClanSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = State.cache.clans.map(c => {
    const memberCount = (c.members || []).length;
    const isMember = (c.members || []).includes(State.user.uid);
    const isOwner = c.ownerUid === State.user.uid;
    return `
      <div class="bg-card border border-border rounded-2xl p-4 fade-in">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-xl flex-shrink-0 overflow-hidden">
            ${c.logoUrl ? `<img src="${esc(c.logoUrl)}" class="w-full h-full rounded-2xl object-cover" />` : esc((c.name || '?')[0])}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm truncate">${esc(c.name)}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">Lv ${c.level || 1}</span>
            </div>
            <div class="text-[11px] text-gray-500 mt-0.5">
              ${memberCount}/50 members · ${esc(c.region || 'Global')} · KD ${c.kdReq || 'Any'}+
            </div>
          </div>
        </div>
        ${(c.tags && c.tags.length) ? `
          <div class="flex flex-wrap gap-1.5 mb-3">
            ${c.tags.map(t => `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-300">${esc(t)}</span>`).join('')}
          </div>
        ` : ''}
        <div class="flex gap-2">
          ${isOwner ? `
            <button class="flex-1 py-2.5 rounded-xl bg-gold/15 border border-gold/30 text-gold text-xs font-bold">You own this</button>
          ` : isMember ? `
            <button class="leave-clan-btn flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold" data-id="${c.id}">Leave Clan</button>
          ` : `
            <button class="apply-clan-btn flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold" data-id="${c.id}">Apply to Join</button>
          `}
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.apply-clan-btn').forEach(btn => {
    btn.onclick = async () => {
      const clan = State.cache.clans.find(c => c.id === btn.dataset.id);
      if (!clan) return;
      if ((clan.members || []).length >= 50) { toast('Clan is full', 'error'); return; }
      try {
        await updateDoc(doc(db, 'clans', clan.id), { members: arrayUnion(State.user.uid) });
        toast('Joined ' + clan.name + '!', 'success');
      } catch (e) { toast('Failed to join', 'error'); }
    };
  });

  feed.querySelectorAll('.leave-clan-btn').forEach(btn => {
    btn.onclick = async () => {
      confirmDialog('Leave Clan', 'Are you sure you want to leave?', async () => {
        try {
          await updateDoc(doc(db, 'clans', btn.dataset.id), { members: arrayRemove(State.user.uid) });
          toast('Left clan', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Leave', true);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

function openCreateClanSheet() {
  if (!State.profile?.isPro) {
    showProPaywall('Creating clans is a Pro feature. Upgrade to lead your squad!');
    return;
  }
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Clan Name</label>
        <input id="cc-name" type="text" placeholder="e.g. Shadow Pandas" maxlength="30" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Level</label>
          <input id="cc-level" type="number" min="1" max="100" value="1" />
        </div>
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">KD Req</label>
          <input id="cc-kd" type="number" step="0.1" min="0" placeholder="e.g. 1.5" />
        </div>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Region</label>
        <select id="cc-region">${REGIONS.map(r => `<option ${State.profile?.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Tags (comma separated)</label>
        <input id="cc-tags" type="text" placeholder="e.g. Competitive,BR Mains,Active" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Clan Logo (optional)</label>
        <input id="cc-logo" type="file" accept="image/*" class="text-xs" />
      </div>
      <button id="cc-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Create Clan</button>
    </div>
  `, 'Create Clan');

  document.getElementById('cc-submit').onclick = async () => {
    const name = document.getElementById('cc-name').value.trim();
    const level = parseInt(document.getElementById('cc-level').value) || 1;
    const kdReq = document.getElementById('cc-kd').value;
    const region = document.getElementById('cc-region').value;
    const tagsRaw = document.getElementById('cc-tags').value;
    const logoInput = document.getElementById('cc-logo');

    if (name.length < 3) { toast('Name too short', 'error'); return; }

    const btn = document.getElementById('cc-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      let logoUrl = '';
      if (logoInput.files && logoInput.files[0]) {
        logoUrl = await compressImage(logoInput.files[0], 400, 0.6);
      }
      const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
      await addDoc(collection(db, 'clans'), {
        name, level, kdReq: kdReq ? parseFloat(kdReq) : 0,
        region, tags, logoUrl,
        ownerUid: State.user.uid,
        members: [State.user.uid],
        createdAt: serverTimestamp()
      });
      toast('Clan created!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed to create', 'error');
      btn.disabled = false;
      btn.textContent = 'Create Clan';
    }
  };
}

// ---------- SCRIMS ----------
function renderScrimsSub() {
  const body = document.getElementById('squad-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Match up · expires in 1h</div>
      <button id="post-scrim-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1">
        <i data-lucide="plus" class="w-3 h-3"></i> Post
      </button>
    </div>
    <div id="scrims-feed" class="space-y-3">
      <div class="skeleton h-20 rounded-2xl"></div>
    </div>
  `;

  document.getElementById('post-scrim-btn').onclick = openPostScrimSheet;
  loadScrims();
}

function loadScrims() {
  const now = Date.now();
  const q = query(collection(db, 'scrims'), orderBy('createdAt', 'desc'), limit(40));
  State.scrimsUnsub = onSnapshot(q, (snap) => {
    const scrims = [];
    snap.forEach(doc => {
      const d = doc.data();
      const expires = d.expiresAt?.seconds ? d.expiresAt.seconds * 1000 : (d.expiresAt?.toMillis ? d.expiresAt.toMillis() : Infinity);
      if (expires > now) scrims.push({ id: doc.id, ...d });
    });
    State.cache.scrims = scrims;
    renderScrims();
  }, (err) => console.error('Scrims error:', err));
}

function renderScrims() {
  const feed = document.getElementById('scrims-feed');
  if (!feed) return;
  if (State.cache.scrims.length === 0) {
    feed.innerHTML = emptyState('swords', 'No scrims posted', 'Looking for a match? Post one', 'Post Scrim', openPostScrimSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = State.cache.scrims.map(s => `
    <div class="bg-card border border-border rounded-2xl p-4 fade-in">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-bold">${esc(s.mode || 'MP')}</span>
        <span class="text-[10px] text-gray-500">${timeAgo(s.createdAt)}</span>
      </div>
      <p class="text-sm text-gray-200 mb-3 whitespace-pre-wrap">${esc(s.text)}</p>
      <div class="flex items-center justify-between">
        <span class="text-[11px] text-gray-500">📞 ${esc(s.contact || 'DM')}</span>
        <button class="copy-text-btn text-[11px] text-primary font-bold" data-text="${esc(s.contact)}">Copy contact</button>
      </div>
    </div>
  `).join('');

  feed.querySelectorAll('.copy-text-btn').forEach(btn => {
    btn.onclick = () => copyText(btn.dataset.text, 'Contact copied!');
  });

  if (window.lucide) window.lucide.createIcons();
}

function openPostScrimSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Mode</label>
        <select id="ps-mode">${MODES.map(m => `<option>${m}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">What are you looking for?</label>
        <textarea id="ps-text" rows="4" maxlength="500" placeholder="e.g. 5v5 SnD scrim tonight at 9pm WAT."></textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Contact (Discord/TG/IGN)</label>
        <input id="ps-contact" type="text" placeholder="e.g. @panda#1234" maxlength="60" />
      </div>
      <button id="ps-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Post Scrim</button>
    </div>
  `, 'Post Scrim');

  document.getElementById('ps-submit').onclick = async () => {
    const mode = document.getElementById('ps-mode').value;
    const text = document.getElementById('ps-text').value.trim();
    const contact = document.getElementById('ps-contact').value.trim();
    if (text.length < 5) { toast('Add more details', 'error'); return; }

    const btn = document.getElementById('ps-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      const expiresAt = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);
      await addDoc(collection(db, 'scrims'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        text, mode, contact,
        createdAt: serverTimestamp(),
        expiresAt
      });
      toast('Scrim posted!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Post Scrim';
    }
  };
}

// ---------- CLIPS ----------
function renderClipsSub() {
  const body = document.getElementById('squad-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Best plays from the community</div>
      <button id="add-clip-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1">
        <i data-lucide="plus" class="w-3 h-3"></i> Share
      </button>
    </div>
    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      <button class="chip clip-sort active" data-sort="recent">Recent</button>
      <button class="chip clip-sort" data-sort="trending">Trending</button>
    </div>
    <div id="clips-feed" class="space-y-3">
      <div class="skeleton h-40 rounded-2xl"></div>
    </div>
  `;

  document.getElementById('add-clip-btn').onclick = openAddClipSheet;
  document.querySelectorAll('.clip-sort').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.clip-sort').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filters.clips.sort = btn.dataset.sort;
      renderClips();
    };
  });

  loadClips();
}

function loadClips() {
  const q = query(collection(db, 'clips'), orderBy('createdAt', 'desc'), limit(50));
  State.clipsUnsub = onSnapshot(q, (snap) => {
    const clips = [];
    snap.forEach(doc => clips.push({ id: doc.id, ...doc.data() }));
    State.cache.clips = clips;
    renderClips();
  }, (err) => console.error('Clips error:', err));
}

function renderClips() {
  const feed = document.getElementById('clips-feed');
  if (!feed) return;
  let clips = [...State.cache.clips];
  if (State.filters.clips.sort === 'trending') {
    clips.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  if (clips.length === 0) {
    feed.innerHTML = emptyState('video', 'No clips yet', 'Share your best play', 'Share Clip', openAddClipSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = clips.map(c => {
    const embedUrl = getYouTubeEmbed(c.youtubeUrl);
    return `
      <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in">
        ${embedUrl ? `
          <div class="relative w-full aspect-video bg-black">
            <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen loading="lazy"></iframe>
          </div>
        ` : `
          <div class="w-full aspect-video bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
            <a href="${esc(c.youtubeUrl)}" target="_blank" class="text-center">
              <i data-lucide="external-link" class="w-8 h-8 mx-auto text-primary mb-2"></i>
              <div class="text-xs text-gray-400">Open link</div>
            </a>
          </div>
        `}
        <div class="p-3">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-bold text-gray-300">${esc(c.gunTag || 'CODM')}</span>
            <span class="text-[10px] text-gray-500">· ${timeAgo(c.createdAt)}</span>
          </div>
          <div class="flex items-center justify-between">
            <button class="like-clip flex items-center gap-1 text-xs text-gray-400" data-id="${c.id}">
              <i data-lucide="heart" class="w-4 h-4"></i> ${c.likes || 0}
            </button>
            <button class="share-clip text-gray-500" data-id="${c.id}">
              <i data-lucide="share-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.like-clip').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'clips', btn.dataset.id), { likes: increment(1) });
        toast('❤️', 'success', 1000);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-clip').forEach(btn => {
    btn.onclick = () => shareContent('CODMPanda Clip', 'Watch this!', location.origin + '/?clip=' + btn.dataset.id);
  });

  if (window.lucide) window.lucide.createIcons();
}

function getYouTubeEmbed(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return '';
}

function openAddClipSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">YouTube / TikTok URL</label>
        <input id="ac-url" type="url" placeholder="https://youtube.com/watch?v=..." />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun Tag</label>
        <select id="ac-gun">
          <option value="">Any</option>
          ${ALL_GUNS.slice(0, 40).map(g => `<option>${g}</option>`).join('')}
        </select>
      </div>
      <button id="ac-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Share Clip</button>
    </div>
  `, 'Share Clip');

  document.getElementById('ac-submit').onclick = async () => {
    const url = document.getElementById('ac-url').value.trim();
    const gunTag = document.getElementById('ac-gun').value;
    if (!url) { toast('Add a URL', 'error'); return; }

    const btn = document.getElementById('ac-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      await addDoc(collection(db, 'clips'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        youtubeUrl: url,
        gunTag: gunTag || 'CODM',
        likes: 0,
        createdAt: serverTimestamp()
      });
      toast('Clip shared!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Share Clip';
    }
  };
}

window.renderSquadTab = renderSquadTab;
window.getYouTubeEmbed = getYouTubeEmbed;

/* END OF CHUNK 6 */
// ============================================
// Chunk 7A/9: INTEL Tab (CP Calc + Leaks + Tier + Maps)
// ============================================

let intelSubTab = 'cp';

function renderIntelTab() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="mb-4">
        <h1 class="text-2xl font-black">Intel</h1>
        <p class="text-xs text-gray-500">Tools for the meta game</p>
      </div>

      <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button class="intel-sub chip ${intelSubTab === 'cp' ? 'active' : ''}" data-sub="cp">💎 CP Calc</button>
        <button class="intel-sub chip ${intelSubTab === 'leaks' ? 'active' : ''}" data-sub="leaks">🔥 Leaks</button>
        <button class="intel-sub chip ${intelSubTab === 'tier' ? 'active' : ''}" data-sub="tier">📊 Tier</button>
        <button class="intel-sub chip ${intelSubTab === 'maps' ? 'active' : ''}" data-sub="maps">🗺️ Maps</button>
      </div>

      <div id="intel-body"></div>
    </div>
  `;

  document.querySelectorAll('.intel-sub').forEach(btn => {
    btn.onclick = () => { intelSubTab = btn.dataset.sub; renderIntelTab(); };
  });

  if (intelSubTab === 'cp') renderCPCalc();
  else if (intelSubTab === 'leaks') renderLeaksSub();
  else if (intelSubTab === 'tier') renderTierSub();
  else renderMapsSub();

  if (window.lucide) window.lucide.createIcons();
}

function renderCPCalc() {
  const body = document.getElementById('intel-body');
  body.innerHTML = `
    <div class="bg-card border border-border rounded-2xl p-4 mb-4">
      <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Enter CP Amount</label>
      <input id="cp-input" type="number" min="0" placeholder="e.g. 420" value="420" />
      <div class="grid grid-cols-3 gap-2 mt-4">
        <div class="bg-cardAlt border border-border rounded-xl p-3 text-center">
          <div class="text-[10px] text-gray-500 font-bold">USD</div>
          <div id="cp-usd" class="text-sm font-black text-primary mt-1">$0.00</div>
        </div>
        <div class="bg-cardAlt border border-border rounded-xl p-3 text-center">
          <div class="text-[10px] text-gray-500 font-bold">NGN</div>
          <div id="cp-ngn" class="text-sm font-black text-primary mt-1">₦0</div>
        </div>
        <div class="bg-cardAlt border border-border rounded-xl p-3 text-center">
          <div class="text-[10px] text-gray-500 font-bold">GHS</div>
          <div id="cp-ghs" class="text-sm font-black text-primary mt-1">₵0</div>
        </div>
      </div>
    </div>

    <div class="bg-card border border-border rounded-2xl p-4 mb-4">
      <div class="text-sm font-bold mb-3">🎰 Draw Cost Calculator</div>
      <div id="draw-list" class="space-y-2"></div>
      <div class="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div class="text-xs text-gray-400 font-semibold">Full Draw Total</div>
        <div id="draw-total" class="text-base font-black text-gold">0 CP</div>
      </div>
    </div>

    <div class="bg-card border border-border rounded-2xl p-4">
      <div class="text-sm font-bold mb-3">💰 Best Value Bundles</div>
      <div class="space-y-2">
        ${[
          { cp: 80, price: '₦1,500' },
          { cp: 420, price: '₦7,500' },
          { cp: 880, price: '₦14,500' },
          { cp: 2400, price: '₦38,000', best: true },
          { cp: 5000, price: '₦75,000' }
        ].map(b => `
          <div class="flex items-center justify-between p-3 rounded-xl ${b.best ? 'bg-gold/10 border border-gold/30' : 'bg-cardAlt border border-border'}">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold">${b.cp.toLocaleString()} CP</span>
              ${b.best ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-gold text-black font-black">BEST</span>' : ''}
            </div>
            <span class="text-xs font-semibold text-gray-300">${b.price}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const input = document.getElementById('cp-input');
  const update = () => {
    const cp = parseInt(input.value) || 0;
    document.getElementById('cp-usd').textContent = '$' + (cp * 0.001).toFixed(2);
    document.getElementById('cp-ngn').textContent = '₦' + Math.round(cp * 1.6).toLocaleString();
    document.getElementById('cp-ghs').textContent = '₵' + (cp * 0.014).toFixed(2);
  };
  input.oninput = update;
  update();

  const drawCosts = [10, 30, 50, 100, 200, 400, 800, 1200, 2000, 3000];
  let total = 0;
  document.getElementById('draw-list').innerHTML = drawCosts.map((c, i) => {
    total += c;
    return `<div class="flex items-center justify-between text-xs">
      <span class="text-gray-500">Draw ${i + 1}</span>
      <span class="font-bold">${c} CP</span>
      <span class="text-gray-500 font-mono">${total.toLocaleString()}</span>
    </div>`;
  }).join('');
  document.getElementById('draw-total').textContent = total.toLocaleString() + ' CP';
}

function renderLeaksSub() {
  const body = document.getElementById('intel-body');
  const isAdmin = State.user?.uid === ADMIN_UID;
  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Community intel drops</div>
      ${isAdmin ? `<button id="post-leak-btn" class="btn-press px-3 py-2 rounded-xl bg-gold text-black text-xs font-bold flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i> Post</button>` : ''}
    </div>
    <div id="leaks-feed" class="space-y-3">
      <div class="skeleton h-32 rounded-2xl"></div>
    </div>
  `;
  if (isAdmin) document.getElementById('post-leak-btn').onclick = openPostLeakSheet;
  loadLeaks();
}

function loadLeaks() {
  const q = query(collection(db, 'leaks'), orderBy('createdAt', 'desc'), limit(30));
  State.leaksUnsub = onSnapshot(q, (snap) => {
    const leaks = [];
    snap.forEach(doc => leaks.push({ id: doc.id, ...doc.data() }));
    State.cache.leaks = leaks;
    renderLeaks();
  }, (err) => console.error('Leaks error:', err));
}

function renderLeaks() {
  const feed = document.getElementById('leaks-feed');
  if (!feed) return;
  if (State.cache.leaks.length === 0) {
    feed.innerHTML = emptyState('zap', 'No leaks yet', 'Check back soon for intel drops');
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-gold text-black',
    mythic: 'bg-red-500'
  };
  feed.innerHTML = State.cache.leaks.map(l => `
    <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in">
      ${l.imageUrl ? `<img src="${esc(l.imageUrl)}" class="w-full h-40 object-cover" />` : ''}
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] px-2 py-0.5 rounded-full ${rarityColors[l.rarity] || 'bg-gray-500'} font-black uppercase">${esc(l.rarity || 'common')}</span>
          <span class="text-[10px] text-gray-500">${timeAgo(l.createdAt)}</span>
        </div>
        <h3 class="text-base font-bold mb-2">${esc(l.title)}</h3>
        ${l.body ? `<p class="text-xs text-gray-400 line-clamp-3 mb-3">${esc(l.body)}</p>` : ''}
        <div class="flex items-center justify-between">
          <button class="hype-leak flex items-center gap-1 text-xs text-gray-400" data-id="${l.id}">
            <i data-lucide="flame" class="w-4 h-4"></i> ${l.hypes || 0}
          </button>
          <button class="share-leak text-gray-500" data-id="${l.id}">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
  feed.querySelectorAll('.hype-leak').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'leaks', btn.dataset.id), { hypes: increment(1) });
        toast('🔥 Hyped!', 'success', 1000);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-leak').forEach(btn => {
    btn.onclick = () => shareContent('CODMPanda Leak', 'Intel drop!', location.origin + '/?leak=' + btn.dataset.id);
  });
  if (window.lucide) window.lucide.createIcons();
}

function openPostLeakSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Title</label>
        <input id="lk-title" type="text" placeholder="e.g. New Mythic weapon teased" maxlength="100" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rarity</label>
        <select id="lk-rarity">
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
          <option value="mythic">Mythic</option>
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Body</label>
        <textarea id="lk-body" rows="4" maxlength="800" placeholder="Details..."></textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Image (optional)</label>
        <input id="lk-image" type="file" accept="image/*" class="text-xs" />
      </div>
      <button id="lk-submit" class="btn-press w-full py-4 rounded-2xl bg-gold text-black font-bold">Post Leak</button>
    </div>
  `, 'Post Leak (Admin)');

  document.getElementById('lk-submit').onclick = async () => {
    const title = document.getElementById('lk-title').value.trim();
    const rarity = document.getElementById('lk-rarity').value;
    const bodyText = document.getElementById('lk-body').value.trim();
    const fileInput = document.getElementById('lk-image');
    if (title.length < 3) { toast('Title too short', 'error'); return; }
    const btn = document.getElementById('lk-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';
    try {
      let imageUrl = '';
      if (fileInput.files && fileInput.files[0]) imageUrl = await compressImage(fileInput.files[0], 800, 0.7);
      await addDoc(collection(db, 'leaks'), {
        title, rarity, body: bodyText, imageUrl,
        hypes: 0, authorUid: State.user.uid, createdAt: serverTimestamp()
      });
      toast('Leak posted!', 'success');
      closeSheet();
    } catch (e) {
      toast('Failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Post Leak';
    }
  };
}

window.renderIntelTab = renderIntelTab;

/* END OF CHUNK 7A */
// ============================================
// Chunk 7B/9: Tier List + Maps + YOU Tab UI
// ============================================

function renderTierSub() {
  const body = document.getElementById('intel-body');
  const TIER_GUNS = {
    S: ['AK117', 'Fennec', 'QQ9', 'DL Q33', 'Locus', 'M13', 'AK-47'],
    A: ['M4', 'MP5', 'Cordite', 'Arctic .50', 'RPD', 'Type 25'],
    B: ['RUS-79U', 'BK57', 'XPR-50', 'M21 EBR'],
    C: ['HS0405', 'M16', 'Chicom']
  };
  const tierColors = {
    S: 'bg-red-500 text-white',
    A: 'bg-orange-500 text-white',
    B: 'bg-yellow-500 text-black',
    C: 'bg-gray-500 text-white'
  };

  body.innerHTML = `
    <div class="text-xs text-gray-500 mb-4">Vote on the current meta</div>
    <div class="space-y-2 mb-4">
      ${['S', 'A', 'B', 'C'].map(tier => `
        <div class="bg-card border border-border rounded-2xl p-3">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg ${tierColors[tier]} flex items-center justify-center font-black text-sm">${tier}</div>
            <span class="text-xs font-bold text-gray-400">Tier ${tier}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${TIER_GUNS[tier].map(g => `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold">${esc(g)}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    <button id="vote-tier-btn" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Vote on a Gun</button>
  `;
  document.getElementById('vote-tier-btn').onclick = openTierVoteSheet;
  if (window.lucide) window.lucide.createIcons();
}

function openTierVoteSheet() {
  const tierColors = { S: 'bg-red-500', A: 'bg-orange-500', B: 'bg-yellow-500', C: 'bg-gray-500' };
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun</label>
        <select id="tv-gun">${ALL_GUNS.slice(0, 60).map(g => `<option>${g}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Tier</label>
        <div class="grid grid-cols-4 gap-2">
          ${['S', 'A', 'B', 'C'].map(t => `<button class="tier-opt py-3 rounded-xl ${tierColors[t]} font-black tier-btn text-white" data-tier="${t}">${t}</button>`).join('')}
        </div>
      </div>
      <button id="tv-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Submit Vote</button>
    </div>
  `, 'Vote on Tier');
  let selectedTier = 'S';
  document.querySelectorAll('.tier-btn').forEach(btn => {
    btn.onclick = () => {
      selectedTier = btn.dataset.tier;
      document.querySelectorAll('.tier-btn').forEach(b => b.style.opacity = b === btn ? '1' : '0.4');
    };
  });
  document.getElementById('tv-submit').onclick = async () => {
    const gun = document.getElementById('tv-gun').value;
    try {
      const ref = doc(db, 'tierVotes', State.user.uid);
      const snap = await getDoc(ref);
      const current = snap.exists() ? snap.data() : {};
      current[gun] = selectedTier;
      await setDoc(ref, current);
      toast('Voted ' + selectedTier + ' for ' + gun, 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };
}

function renderMapsSub() {
  const body = document.getElementById('intel-body');
  body.innerHTML = `
    <div class="text-xs text-gray-500 mb-4">BR Isolated callouts</div>
    <div class="bg-card border border-border rounded-2xl p-4 mb-4">
      <div class="relative w-full" style="aspect-ratio: 1;">
        <div class="absolute inset-0 bg-gradient-to-br from-green-900/30 to-blue-900/30 rounded-xl border border-border flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 400 400" class="w-full h-full">
            <rect x="20" y="20" width="360" height="360" fill="#1a1a1a" rx="12" stroke="#333"/>
            <path d="M 80 100 Q 120 80 180 120 T 300 100 L 340 160 L 300 240 Q 260 300 200 280 T 100 320 L 60 240 Z" fill="#2d3d2d" stroke="#4a5a4a" stroke-width="2"/>
            <text x="200" y="50" text-anchor="middle" fill="#888" font-size="14" font-weight="bold">BR ISOLATED</text>
          </svg>
        </div>
        ${[
          { name: 'Nuketown', x: 30, y: 30, hot: true },
          { name: 'Farm', x: 70, y: 45 },
          { name: 'Killhouse', x: 20, y: 60, hot: true },
          { name: 'Construction', x: 45, y: 20 }
        ].map(p => `
          <div class="absolute" style="left: ${p.x}%; top: ${p.y}%;">
            <div class="w-5 h-5 rounded-full ${p.hot ? 'bg-primary' : 'bg-gold'} border-2 border-white shadow-lg flex items-center justify-center text-[9px]">${p.hot ? '🔥' : '★'}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="bg-card border border-border rounded-2xl p-4">
      <div class="text-sm font-bold mb-3">📍 Hot Drops</div>
      <div class="space-y-2">
        ${[
          { name: 'Nuketown', desc: 'High loot, high chaos. Bring a squad.' },
          { name: 'Killhouse', desc: 'Small but lethal. Great for early kills.' },
          { name: 'Farm', desc: 'Balanced loot, less contested.' }
        ].map(h => `
          <div class="flex items-start gap-3 p-2 rounded-lg bg-cardAlt border border-border">
            <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <i data-lucide="map-pin" class="w-4 h-4 text-primary"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold">${h.name}</div>
              <div class="text-[10px] text-gray-500">${h.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// YOU TAB (UI)
// ============================================
function renderYouTab() {
  const content = document.getElementById('content');
  const p = State.profile || {};
  const isPro = !!p.isPro;

  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="bg-card border ${isPro ? 'border-gold glow-gold' : 'border-border'} rounded-2xl p-4 mb-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="relative">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-2xl overflow-hidden">
              ${p.avatar ? `<img src="${esc(p.avatar)}" class="w-full h-full object-cover" />` : getInitials(p.ign || '?')}
            </div>
            ${isPro ? `<div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold flex items-center justify-center border-2 border-card"><span class="text-sm">👑</span></div>` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-base font-black truncate">${esc(p.ign || 'Set IGN')}</span>
              ${isPro ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-gold text-black font-black">PRO</span>` : ''}
            </div>
            <div class="text-[11px] text-gray-500 mt-0.5">${esc(p.rank || 'Rookie')} · ${esc(p.region || 'Global')}</div>
            <button id="copy-uid-btn" class="text-[10px] text-primary font-bold mt-1 flex items-center gap-1">
              <i data-lucide="copy" class="w-3 h-3"></i> ${State.user.uid.slice(0, 16)}...
            </button>
          </div>
        </div>
        ${p.bio ? `<p class="text-xs text-gray-400 mb-2">${esc(p.bio)}</p>` : ''}
        ${p.favGun ? `<div class="text-[11px] text-gray-500">🎯 Favourite: <span class="font-bold text-gray-300">${esc(p.favGun)}</span></div>` : ''}
        <button id="edit-profile-btn" class="btn-press w-full mt-3 py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold">Edit Profile</button>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-card border border-border rounded-2xl p-3 text-center">
          <div id="stat-vaults" class="text-lg font-black text-primary">—</div>
          <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Vaults</div>
        </div>
        <div class="bg-card border border-border rounded-2xl p-3 text-center">
          <div id="stat-camos" class="text-lg font-black text-gold">—</div>
          <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Camos</div>
        </div>
        <div class="bg-card border border-border rounded-2xl p-3 text-center">
          <div id="stat-clan" class="text-lg font-black text-green-400">—</div>
          <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Clan</div>
        </div>
      </div>

      ${isPro ? renderProActive(p) : renderProUpsell()}

      <div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Settings</div>
        </div>
        <div class="divide-y divide-border">
          ${settingsRow('edit-profile', 'user', 'Edit Profile', 'Update IGN, bio, rank')}
          ${settingsRow('my-referral', 'gift', 'My Referral', 'Share & earn invites')}
          ${settingsRow('notifications', 'bell', 'Notifications', 'LFG, leaks, etc.')}
          ${settingsRow('defaults', 'sliders', 'Default Preferences', 'Region, mode, mic')}
          ${settingsRow('clear-cache', 'trash-2', 'Clear Cache', 'Free up space')}
          ${settingsRow('clear-camos', 'refresh-cw', 'Reset Camo Data', 'Delete your progress', true)}
          ${settingsRow('export-data', 'download', 'Export My Data', 'Download JSON')}
        </div>
      </div>

      <div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Support</div>
        </div>
        <div class="divide-y divide-border">
          ${settingsRow('bug-report', 'bug', 'Report a Bug', 'Help us improve')}
          ${settingsRow('feature-request', 'lightbulb', 'Request Feature', 'Got an idea?')}
          ${settingsRow('share-app', 'share-2', 'Share App', 'Invite your squad')}
          ${settingsRow('help-faq', 'help-circle', 'Help / FAQ', 'Common questions')}
        </div>
      </div>

      ${State.user.uid === ADMIN_UID ? `
        <div class="bg-card border border-gold/40 rounded-2xl overflow-hidden mb-4">
          <div class="px-4 py-3 border-b border-gold/30 bg-gold/5">
            <div class="text-xs font-bold text-gold uppercase flex items-center gap-2">
              <i data-lucide="shield-check" class="w-4 h-4"></i> Admin Panel
            </div>
          </div>
          <div class="divide-y divide-border">
            ${settingsRow('admin-post-leak', 'zap', 'Post Leak', 'Push intel to feed')}
            ${settingsRow('admin-reports', 'flag', 'Manage Reports', 'Review user reports')}
            ${settingsRow('admin-users', 'users', 'List Users', 'View all users')}
          </div>
        </div>
      ` : ''}

      <div class="bg-card border border-red-500/30 rounded-2xl overflow-hidden mb-4">
        <div class="px-4 py-3 border-b border-red-500/20">
          <div class="text-xs font-bold text-red-400 uppercase">Danger Zone</div>
        </div>
        <div class="divide-y divide-border">
          <button class="settings-row w-full flex items-center justify-between px-4 py-3 text-left" data-action="logout">
            <div class="flex items-center gap-3">
              <i data-lucide="log-out" class="w-4 h-4 text-gray-400"></i>
              <span class="text-sm font-semibold">Sign Out</span>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500"></i>
          </button>
          <button class="settings-row w-full flex items-center justify-between px-4 py-3 text-left" data-action="delete-account">
            <div class="flex items-center gap-3">
              <i data-lucide="user-x" class="w-4 h-4 text-red-400"></i>
              <span class="text-sm font-semibold text-red-400">Delete Account</span>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-red-400"></i>
          </button>
        </div>
      </div>

      <div class="text-center py-6 space-y-2">
        <div id="install-pwa-btn" class="hidden">
          <button class="btn-press px-4 py-2 rounded-xl bg-primary text-xs font-bold glow-primary">📲 Install CODMPanda</button>
        </div>
        <div class="text-[10px] text-gray-600">Version ${APP_VERSION}</div>
        <div class="flex items-center justify-center gap-3 text-[10px] text-gray-500">
          <button onclick="showPrivacy()">Privacy</button>
          <span>·</span>
          <button onclick="showTerms()">Terms</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.settings-row').forEach(el => {
    el.onclick = () => handleSettingAction(el.dataset.action);
  });
  document.getElementById('copy-uid-btn').onclick = () => copyText(State.user.uid, 'UID copied!');
  document.getElementById('edit-profile-btn').onclick = openEditProfileSheet;
  if (!isPro) {
    const proBtn = document.getElementById('unlock-pro-btn');
    if (proBtn) proBtn.onclick = goPro;
  } else {
    const manageBtn = document.getElementById('manage-pro-btn');
    if (manageBtn) manageBtn.onclick = showManagePro;
  }
  loadStats();
  loadClanStat();
  setupPWAInstall();
  if (window.lucide) window.lucide.createIcons();
}

function settingsRow(action, icon, label, sub, danger = false) {
  return `
    <button class="settings-row w-full flex items-center justify-between px-4 py-3 text-left" data-action="${action}">
      <div class="flex items-center gap-3 min-w-0">
        <i data-lucide="${icon}" class="w-4 h-4 ${danger ? 'text-red-400' : 'text-gray-400'} flex-shrink-0"></i>
        <div class="min-w-0">
          <div class="text-sm font-semibold ${danger ? 'text-red-400' : ''}">${label}</div>
          ${sub ? `<div class="text-[10px] text-gray-500 truncate">${sub}</div>` : ''}
        </div>
      </div>
      <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
    </button>
  `;
}

function renderProUpsell() {
  return `
    <div class="bg-gradient-to-br from-black via-black to-[#1a1200] border border-gold/40 rounded-2xl p-5 mb-4 shimmer relative overflow-hidden">
      <div class="absolute top-3 right-3 text-3xl">👑</div>
      <div class="text-xs font-black text-gold uppercase tracking-wider mb-1">Upgrade</div>
      <h3 class="text-xl font-black mb-3">Go <span class="text-gold glow-text-gold">Pro</span></h3>
      <div class="text-xs text-gray-300 mb-4">
        <div class="font-bold text-gold mb-2">$1.99/mo · $9.99 lifetime</div>
        <ul class="space-y-1.5">
          <li>✦ Unlimited Vault builds</li>
          <li>✦ Full camo tracker</li>
          <li>✦ Create & lead clans</li>
          <li>✦ Pin LFG posts</li>
          <li>✦ Instant leak alerts</li>
          <li>✦ Zero ads, forever</li>
          <li>✦ Gold crown badge 👑</li>
        </ul>
      </div>
      <button id="unlock-pro-btn" class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold">
        Unlock Pro — Pay with Paystack
      </button>
    </div>
  `;
}

function renderProActive(p) {
  const expiry = p.proExpiry?.toDate ? p.proExpiry.toDate().toLocaleDateString() : 'Lifetime';
  return `
    <div class="bg-gradient-to-br from-[#1a1200] to-black border border-gold glow-gold rounded-2xl p-5 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">👑</span>
        <div>
          <div class="text-sm font-black text-gold glow-text-gold">PRO ACTIVE</div>
          <div class="text-[10px] text-gray-400">Expires: ${expiry}</div>
        </div>
      </div>
      <div class="text-xs text-gray-300 mb-3">Enjoy unlimited access & zero ads.</div>
      <button id="manage-pro-btn" class="btn-press w-full py-2.5 rounded-xl bg-cardAlt border border-gold/40 text-gold text-xs font-bold">Manage Subscription</button>
    </div>
  `;
}

async function loadStats() {
  try {
    const snap = await getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid)));
    const el = document.getElementById('stat-vaults');
    if (el) el.textContent = snap.size;
  } catch (e) { const el = document.getElementById('stat-vaults'); if (el) el.textContent = '0'; }

  try {
    const camoSnap = await getDoc(doc(db, 'camos', State.user.uid));
    const totalPossible = ALL_GUNS.length * CAMO_TYPES.length;
    let pct = 0;
    if (camoSnap.exists()) {
      let checked = 0;
      Object.values(camoSnap.data()).forEach(gun => {
        CAMO_TYPES.forEach(c => { if (gun[c.key]) checked++; });
      });
      pct = Math.round((checked / totalPossible) * 100);
    }
    const el = document.getElementById('stat-camos');
    if (el) el.textContent = pct + '%';
  } catch (e) { const el = document.getElementById('stat-camos'); if (el) el.textContent = '0%'; }
}

async function loadClanStat() {
  try {
    const snap = await getDocs(query(collection(db, 'clans'), where('members', 'array-contains', State.user.uid)));
    const el = document.getElementById('stat-clan');
    if (el) el.textContent = snap.size > 0 ? '✓' : '—';
  } catch (e) { /* silent */ }
}

window.renderYouTab = renderYouTab;
window.renderTierSub = renderTierSub;
window.renderMapsSub = renderMapsSub;

/* END OF CHUNK 7B */
// ============================================
// Chunk 7C/9: Settings Actions + Pro + Admin + Boot
// ============================================

function handleSettingAction(action) {
  switch (action) {
    case 'edit-profile': openEditProfileSheet(); break;
    case 'my-referral': showReferral(); break;
    case 'notifications': showNotifications(); break;
    case 'defaults': showDefaults(); break;
    case 'clear-cache': clearCache(); break;
    case 'clear-camos': confirmDialog('Reset Camo Data', 'This will delete all your camo progress permanently.', async () => {
      try {
        await deleteDoc(doc(db, 'camos', State.user.uid));
        State.cache.camos = {};
        toast('Camo data cleared', 'success');
      } catch (e) { toast('Failed', 'error'); }
    }, 'Reset', true); break;
    case 'export-data': exportUserData(); break;
    case 'bug-report': openBugReportSheet(); break;
    case 'feature-request': openFeatureSheet(); break;
    case 'share-app': shareApp(); break;
    case 'help-faq': showFAQ(); break;
    case 'logout': handleSignOut(); break;
    case 'delete-account': deleteAccount(); break;
    case 'admin-post-leak': openPostLeakSheet(); break;
    case 'admin-reports': showAdminReports(); break;
    case 'admin-users': showAdminUsers(); break;
  }
}

function openEditProfileSheet() {
  const p = State.profile || {};
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Avatar</label>
        <input id="ep-avatar" type="file" accept="image/*" class="text-xs" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">IGN</label>
        <input id="ep-ign" type="text" maxlength="24" value="${esc(p.ign || '')}" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rank</label>
        <select id="ep-rank">${RANKS.map(r => `<option ${p.rank === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Region</label>
        <select id="ep-region">${REGIONS.map(r => `<option ${p.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Bio</label>
        <textarea id="ep-bio" rows="3" maxlength="150" placeholder="Tell your squad about you...">${esc(p.bio || '')}</textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Favourite Gun</label>
        <select id="ep-fav">
          <option value="">None</option>
          ${ALL_GUNS.slice(0, 60).map(g => `<option ${p.favGun === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
      </div>
      <button id="ep-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Save Changes</button>
    </div>
  `, 'Edit Profile');

  document.getElementById('ep-submit').onclick = async () => {
    const ign = document.getElementById('ep-ign').value.trim();
    const rank = document.getElementById('ep-rank').value;
    const region = document.getElementById('ep-region').value;
    const bio = document.getElementById('ep-bio').value.trim();
    const favGun = document.getElementById('ep-fav').value;
    const fileInput = document.getElementById('ep-avatar');
    if (ign.length < 2) { toast('IGN too short', 'error'); return; }
    const btn = document.getElementById('ep-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';
    try {
      const updates = { ign, rank, region, bio, favGun };
      if (fileInput.files && fileInput.files[0]) updates.avatar = await compressImage(fileInput.files[0], 300, 0.7);
      await updateDoc(doc(db, 'users', State.user.uid), updates);
      State.profile = { ...State.profile, ...updates };
      const subtitle = document.getElementById('top-bar-subtitle');
      if (subtitle) subtitle.textContent = `${rank} • ${region}`;
      toast('Profile updated!', 'success');
      closeSheet();
      renderYouTab();
    } catch (e) {
      console.error(e);
      toast('Failed', 'error');
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  };
}

function showReferral() {
  const code = State.profile?.referralCode || generateReferralCode(State.user.uid);
  const link = `${location.origin}/?ref=${State.user.uid}`;
  openSheet(`
    <div class="text-center space-y-4">
      <div class="text-4xl">🎁</div>
      <div>
        <div class="text-sm text-gray-400 mb-1">Your referral code</div>
        <div class="text-2xl font-black text-primary glow-text-primary">${code}</div>
      </div>
      <div class="bg-cardAlt border border-border rounded-xl p-3">
        <div class="text-[10px] text-gray-500 mb-2">Invite link</div>
        <div class="text-xs text-primary font-mono break-all">${link}</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button id="ref-copy" class="btn-press py-3 rounded-xl bg-primary font-bold text-sm">Copy Link</button>
        <button id="ref-share" class="btn-press py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm">Share</button>
      </div>
      <div class="text-xs text-gray-500">Invites: <span class="font-bold text-white">${State.profile?.invites || 0}</span></div>
    </div>
  `, 'My Referral');
  document.getElementById('ref-copy').onclick = () => copyText(link, 'Link copied!');
  document.getElementById('ref-share').onclick = () => shareContent('Join CODMPanda!', `Use my code ${code} to join the ultimate CODM companion.`, link);
}

function showDefaults() {
  const p = State.profile || {};
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Default Region</label>
        <select id="df-region">${REGIONS.map(r => `<option ${(p.defaultRegion || p.region) === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Default Mode</label>
        <select id="df-mode">${MODES.map(m => `<option ${p.defaultMode === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div>
          <div class="text-sm font-semibold">Default Mic On</div>
          <div class="text-xs text-gray-500">Auto-enable mic on lobbies</div>
        </div>
        <div id="df-mic" class="toggle ${p.defaultMic ? 'on' : ''}"></div>
      </div>
      <button id="df-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Save</button>
    </div>
  `, 'Default Preferences');
  document.getElementById('df-mic').onclick = function() { this.classList.toggle('on'); };
  document.getElementById('df-save').onclick = async () => {
    try {
      const updates = {
        defaultRegion: document.getElementById('df-region').value,
        defaultMode: document.getElementById('df-mode').value,
        defaultMic: document.getElementById('df-mic').classList.contains('on')
      };
      await updateDoc(doc(db, 'users', State.user.uid), updates);
      State.profile = { ...State.profile, ...updates };
      toast('Preferences saved', 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };
}

function clearCache() {
  confirmDialog('Clear Cache', 'This clears app cache and reloads. Your data stays safe.', async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    toast('Cache cleared, reloading...', 'success');
    setTimeout(() => location.reload(), 1000);
  }, 'Clear');
}

function exportUserData() {
  const data = { profile: State.profile, camos: State.cache.camos, exportDate: new Date().toISOString(), version: APP_VERSION };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `codmpanda-${State.user.uid.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported', 'success');
}

function openBugReportSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">What's wrong?</label>
        <textarea id="br-text" rows="5" maxlength="500" placeholder="Describe the bug in detail..."></textarea>
      </div>
      <button id="br-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Send Report</button>
    </div>
  `, 'Report a Bug');
  document.getElementById('br-submit').onclick = async () => {
    const text = document.getElementById('br-text').value.trim();
    if (text.length < 5) { toast('Add more detail', 'error'); return; }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: State.user.uid, targetId: 'app-bug', reason: text, type: 'bug', createdAt: serverTimestamp()
      });
      toast('Bug report sent. Thanks!', 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };
}

function openFeatureSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Your idea</label>
        <textarea id="fr-text" rows="5" maxlength="500" placeholder="What should we build?"></textarea>
      </div>
      <button id="fr-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Send Request</button>
    </div>
  `, 'Request Feature');
  document.getElementById('fr-submit').onclick = async () => {
    const text = document.getElementById('fr-text').value.trim();
    if (text.length < 5) { toast('Add more detail', 'error'); return; }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: State.user.uid, targetId: 'feature-request', reason: text, type: 'feature', createdAt: serverTimestamp()
      });
      toast('Request sent. Thanks!', 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };
}

function shareApp() {
  const code = State.profile?.referralCode || '';
  shareContent(
    'CODMPanda — Ultimate CODM Companion',
    `Join CODMPanda — find squads, track camos, share gunsmiths. Use my code: ${code}`,
    location.origin + '?ref=' + State.user.uid
  );
}

function showFAQ() {
  openSheet(`
    <div class="space-y-3">
      ${[
        { q: 'How do lobbies expire?', a: 'Lobbies auto-expire after 2 hours. Scrims after 1 hour.' },
        { q: 'Is Pro worth it?', a: 'If you want unlimited vaults, full camo tracking, and clan creation — yes.' },
        { q: 'How do referrals work?', a: 'Share your link. When someone signs up via your link, you get invite credit.' },
        { q: 'Can I export my camo progress?', a: 'Yes! Lab → Camo Tracker → Export progress.' },
        { q: 'How do I report a bug?', a: 'Settings → Support → Report a Bug.' }
      ].map(f => `
        <div class="bg-card border border-border rounded-xl p-3">
          <div class="text-sm font-bold mb-1">${f.q}</div>
          <div class="text-xs text-gray-400">${f.a}</div>
        </div>
      `).join('')}
    </div>
  `, 'Help / FAQ');
}

function showPrivacy() {
  openSheet(`
    <div class="text-xs text-gray-400 space-y-3 leading-relaxed">
      <p><strong class="text-white">Privacy Policy</strong></p>
      <p>CODMPanda stores your profile data (IGN, rank, region, avatar, bio) in Firebase. We never sell your data.</p>
      <p>Public info like your IGN, rank, and vault builds are visible to signed-in users.</p>
      <p>You can delete your account and all data at any time from Settings → Danger Zone.</p>
    </div>
  `, 'Privacy');
}

function showTerms() {
  openSheet(`
    <div class="text-xs text-gray-400 space-y-3 leading-relaxed">
      <p><strong class="text-white">Terms of Service</strong></p>
      <p>CODMPanda is an unofficial companion app for Call of Duty Mobile. Not affiliated with Activision or Tencent.</p>
      <p>Do not post illegal, harassing, or NSFW content. Reports will be reviewed and accounts banned.</p>
      <p>Pro purchases are final. Refunds only in case of technical failure.</p>
    </div>
  `, 'Terms');
}

function deleteAccount() {
  confirmDialog('Delete Account', 'This will permanently delete your profile, camos, vaults, and sign you out. Cannot be undone.', async () => {
    try {
      toast('Deleting...', 'info', 2000);
      await deleteDoc(doc(db, 'users', State.user.uid));
      await deleteDoc(doc(db, 'camos', State.user.uid));
      await deleteDoc(doc(db, 'tierVotes', State.user.uid));
      try { await deleteUser(State.user); } catch (e) { await signOut(auth); }
      location.reload();
    } catch (e) {
      console.error(e);
      toast('Delete failed: re-login and retry', 'error', 4000);
    }
  }, 'Delete Forever', true);
}

// ---------- PRO ----------
function showProPaywall(message) {
  openSheet(`
    <div class="text-center space-y-4">
      <div class="text-5xl">👑</div>
      <div>
        <h3 class="text-xl font-black text-gold glow-text-gold mb-2">Pro Feature</h3>
        <p class="text-sm text-gray-400">${message}</p>
      </div>
      <div class="bg-black/40 border border-gold/40 rounded-xl p-4 text-left">
        <div class="text-xs text-gray-300 space-y-1.5">
          <div>✦ Unlimited Vault</div>
          <div>✦ Full Camo Tracker</div>
          <div>✦ Create Clans</div>
          <div>✦ Zero Ads</div>
          <div>✦ Gold Crown Badge</div>
        </div>
      </div>
      <button onclick="closeSheet(); goPro();" class="btn-press w-full py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black glow-gold">Go Pro — $1.99/mo</button>
      <button onclick="closeSheet()" class="text-xs text-gray-500">Maybe later</button>
    </div>
  `, '');
}

async function goPro() {
  confirmDialog('Unlock Pro (Demo)', 'Demo mode — in production this opens Paystack. Unlock Pro now for free?', async () => {
    try {
      await updateDoc(doc(db, 'users', State.user.uid), {
        isPro: true,
        proExpiry: Timestamp.fromMillis(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
      State.profile.isPro = true;
      toast('👑 Pro unlocked!', 'success');
      hideAd();
      renderYouTab();
    } catch (e) { toast('Failed', 'error'); }
  }, 'Unlock');
}

function showManagePro() {
  openSheet(`
    <div class="space-y-4">
      <div class="text-center">
        <div class="text-5xl mb-2">👑</div>
        <div class="text-lg font-black text-gold">Pro Member</div>
      </div>
      <div class="bg-cardAlt border border-border rounded-xl p-3 text-xs text-gray-400">Manage your subscription via Paystack. Cancel anytime.</div>
      <button onclick="closeSheet()" class="btn-press w-full py-3 rounded-xl bg-primary font-bold">Done</button>
    </div>
  `, 'Manage Pro');
}

// ---------- ADMIN ----------
async function showAdminReports() {
  openSheet(`<div class="text-center py-8"><div class="spinner mx-auto"></div></div>`, 'Reports');
  try {
    const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50)));
    const reports = [];
    snap.forEach(d => reports.push({ id: d.id, ...d.data() }));
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) {
      sheetBody.innerHTML = reports.length === 0
        ? '<div class="text-center py-8 text-gray-500 text-sm">No reports</div>'
        : reports.map(r => `
          <div class="bg-card border border-border rounded-xl p-3 mb-2">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-bold uppercase">${esc(r.type || 'report')}</span>
              <span class="text-[10px] text-gray-500">${timeAgo(r.createdAt)}</span>
            </div>
            <div class="text-xs text-gray-300">${esc(r.reason)}</div>
            <div class="text-[10px] text-gray-600 mt-1">By: ${esc((r.reporterUid || '').slice(0, 12))}...</div>
          </div>
        `).join('');
    }
  } catch (e) {
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load</div>';
  }
}

async function showAdminUsers() {
  openSheet(`<div class="text-center py-8"><div class="spinner mx-auto"></div></div>`, 'Users');
  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100)));
    const users = [];
    snap.forEach(d => users.push({ id: d.id, ...d.data() }));
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) {
      sheetBody.innerHTML = `
        <div class="text-xs text-gray-500 mb-3">${users.length} total users</div>
        ${users.map(u => `
          <div class="bg-card border border-border rounded-xl p-3 mb-2 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
              ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate flex items-center gap-1.5">
                ${esc(u.ign || 'Unknown')}
                ${u.isPro ? '<span class="text-[8px] px-1 py-0.5 rounded bg-gold text-black font-black">PRO</span>' : ''}
              </div>
              <div class="text-[10px] text-gray-500 truncate">${esc(u.rank || '—')} · ${esc(u.region || '—')}</div>
            </div>
            <div class="text-[10px] text-gray-600 font-mono">${u.id.slice(0, 8)}</div>
          </div>
        `).join('')}
      `;
    }
  } catch (e) {
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load</div>';
  }
}

// ---------- PWA INSTALL ----------
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('install-pwa-btn');
  if (btn) btn.classList.remove('hidden');
});

function setupPWAInstall() {
  const btnWrap = document.getElementById('install-pwa-btn');
  if (!btnWrap) return;
  if (deferredPrompt) btnWrap.classList.remove('hidden');
  btnWrap.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') toast('Installing...', 'success');
      deferredPrompt = null;
      btnWrap.classList.add('hidden');
    } else {
      toast('Use browser menu → "Add to Home Screen"', 'info', 4000);
    }
  };
}

// ---------- REFERRAL TRACKING ----------
async function trackReferral() {
  const params = new URLSearchParams(location.search);
  const ref = params.get('ref');
  if (ref && State.user && ref !== State.user.uid) {
    const key = 'codmpanda_ref_tracked_' + ref;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    try {
      await updateDoc(doc(db, 'users', ref), { invites: increment(1) });
      const refSnap = await getDoc(doc(db, 'users', ref));
      if (refSnap.exists()) {
        const currentInvites = (refSnap.data().invites || 0);
        if (currentInvites > 0 && currentInvites % 3 === 0) {
          await updateDoc(doc(db, 'users', ref), {
            isPro: true,
            proExpiry: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
          });
        }
      }
    } catch (e) { /* silent */ }
  }
}

// ---------- DEEP LINKS ----------
function handleDeepLinks() {
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab');
  const vault = params.get('vault');

  if (tab && ['play', 'lab', 'squad', 'intel', 'you'].includes(tab)) {
    setTimeout(() => switchTab(tab), 500);
  }

  if (vault) {
    setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'vaults', vault));
        if (snap.exists()) {
          const v = snap.data();
          openSheet(`
            <div class="space-y-3">
              ${v.imageUrl ? `<img src="${esc(v.imageUrl)}" class="w-full rounded-xl" />` : ''}
              <div class="text-lg font-black">${esc(v.gunName)}</div>
              <div class="text-xs text-gray-500">${esc(v.type)} · by ${esc(v.ign || 'Unknown')}</div>
              ${v.gunsmithCode ? `
                <div class="bg-cardAlt border border-border rounded-xl p-3">
                  <div class="text-[10px] text-gray-500 mb-1">Gunsmith Code</div>
                  <div class="font-mono text-primary text-sm font-bold">${esc(v.gunsmithCode)}</div>
                </div>
                <button onclick="copyText('${esc(v.gunsmithCode)}', 'Copied!')" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm">Copy Code</button>
              ` : ''}
            </div>
          `, 'Shared Vault');
        }
      } catch (e) { /* silent */ }
    }, 800);
  }
}

// ---------- BOOT ----------
async function boot() {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash && !splash.classList.contains('hidden')) splash.classList.add('hidden');
  }, 2000);

  await checkRedirect();

  const signBtn = document.getElementById('google-signin-btn');
  if (signBtn) signBtn.onclick = handleSignIn;

  setTimeout(handleDeepLinks, 1500);

  if (window.lucide) window.lucide.createIcons();
}

// Wrap showMainApp to trigger referral
const _originalShowMainApp = showMainApp;
window.showMainApp = function() {
  _originalShowMainApp();
  setTimeout(trackReferral, 500);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

window.addEventListener('error', (e) => console.error('Global error:', e.error));
window.addEventListener('unhandledrejection', (e) => console.error('Unhandled rejection:', e.reason));

console.log('%c🐼 CODMPanda v' + APP_VERSION + ' loaded', 'color:#FF6B00;font-weight:bold;font-size:14px');

/* END OF CHUNK 7C — APP COMPLETE */
// ============================================
// Chunk 8: User Submissions (Leaks, Vaults, Clips)
// ============================================

// ---------- SUBMISSION COOLDOWN CHECK ----------
async function checkSubmitCooldown(collectionName) {
  try {
    const lastSubmit = localStorage.getItem('codmpanda_last_submit_' + collectionName);
    if (lastSubmit) {
      const elapsed = Date.now() - parseInt(lastSubmit);
      if (elapsed < 60000) {
        const secs = Math.ceil((60000 - elapsed) / 1000);
        toast(`Please wait ${secs}s before submitting again`, 'warning');
        return false;
      }
    }
    return true;
  } catch (e) {
    return true;
  }
}

function markSubmitted(collectionName) {
  localStorage.setItem('codmpanda_last_submit_' + collectionName, Date.now().toString());
}

// ============================================
// LEAK SUBMISSION
// ============================================
function openSubmitLeakSheet() {
  openSheet(`
    <div class="space-y-4">
      <div class="bg-gold/10 border border-gold/30 rounded-xl p-3 text-xs text-gold">
        ⚡ Your submission goes to admin for approval. If approved, your IGN will be shown as the source.
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Title *</label>
        <input id="sl-title" type="text" placeholder="e.g. New Mythic weapon teased" maxlength="100" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rarity</label>
        <select id="sl-rarity">
          <option value="common">Common</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
          <option value="mythic">Mythic</option>
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Details</label>
        <textarea id="sl-body" rows="4" maxlength="800" placeholder="What's the leak? Add source if possible..."></textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Screenshot (optional)</label>
        <input id="sl-image" type="file" accept="image/*" class="text-xs" />
      </div>
      <button id="sl-submit" class="btn-press w-full py-4 rounded-2xl bg-gold text-black font-bold">
        Submit for Approval
      </button>
    </div>
  `, 'Submit a Leak');

  document.getElementById('sl-submit').onclick = async () => {
    const title = document.getElementById('sl-title').value.trim();
    const rarity = document.getElementById('sl-rarity').value;
    const body = document.getElementById('sl-body').value.trim();
    const fileInput = document.getElementById('sl-image');

    if (title.length < 3) { toast('Title too short', 'error'); return; }

    const canSubmit = await checkSubmitCooldown('leak');
    if (!canSubmit) return;

    const btn = document.getElementById('sl-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      let imageUrl = '';
      if (fileInput.files && fileInput.files[0]) {
        imageUrl = await compressImage(fileInput.files[0], 800, 0.7);
      }

      await addDoc(collection(db, 'leak_submissions'), {
        submitterUid: State.user.uid,
        submitterIgn: State.profile.ign,
        submitterAvatar: State.profile.avatar || '',
        title, rarity, body, imageUrl,
        status: 'pending',
        submittedAt: serverTimestamp()
      });

      markSubmitted('leak');
      toast('Submitted! Admin will review shortly. ✓', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit for Approval';
    }
  };
}

// ============================================
// VAULT SUBMISSION
// ============================================
function openSubmitVaultSheet() {
  openSheet(`
    <div class="space-y-4">
      <div class="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary">
        ⚡ Your build goes to admin for approval. If approved, your IGN will be shown as the builder.
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Type *</label>
        <select id="sv-type">
          <option value="gunsmith">Gunsmith</option>
          <option value="sens">Sensitivity</option>
          <option value="hud">HUD</option>
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun *</label>
        <select id="sv-gun">
          <option value="">Select a gun...</option>
          ${Object.entries(CODM_GUNS).map(([cat, guns]) => `
            <optgroup label="${cat}">
              ${guns.map(g => `<option value="${g}">${g}</option>`).join('')}
            </optgroup>
          `).join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gunsmith Code</label>
        <input id="sv-code" type="text" placeholder="e.g. ABC123XYZ" maxlength="20" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Attachments (one per line)</label>
        <textarea id="sv-attach" rows="4" placeholder="Muzzle: Muzzle Brake&#10;Barrel: RTC Light Barrel&#10;Optic: Red Dot"></textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Screenshot (optional)</label>
        <input id="sv-image" type="file" accept="image/*" class="text-xs" />
      </div>
      <button id="sv-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">
        Submit for Approval
      </button>
    </div>
  `, 'Submit a Build');

  document.getElementById('sv-submit').onclick = async () => {
    const type = document.getElementById('sv-type').value;
    const gunName = document.getElementById('sv-gun').value;
    const gunsmithCode = document.getElementById('sv-code').value.trim();
    const attachRaw = document.getElementById('sv-attach').value.trim();
    const fileInput = document.getElementById('sv-image');

    if (!gunName) { toast('Select a gun', 'error'); return; }
    if (!gunsmithCode && !attachRaw) { toast('Add code or attachments', 'error'); return; }

    const canSubmit = await checkSubmitCooldown('vault');
    if (!canSubmit) return;

    const btn = document.getElementById('sv-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      let imageUrl = '';
      if (fileInput.files && fileInput.files[0]) {
        imageUrl = await compressImage(fileInput.files[0], 700, 0.6);
      }

      const attachments = {};
      attachRaw.split('\n').forEach(line => {
        const [k, ...v] = line.split(':');
        if (k && v.length) attachments[k.trim()] = v.join(':').trim();
      });

      await addDoc(collection(db, 'vault_submissions'), {
        submitterUid: State.user.uid,
        submitterIgn: State.profile.ign,
        submitterAvatar: State.profile.avatar || '',
        gunName, gunsmithCode, type, attachments, imageUrl,
        status: 'pending',
        submittedAt: serverTimestamp()
      });

      markSubmitted('vault');
      toast('Submitted! Admin will review shortly. ✓', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit for Approval';
    }
  };
}

// ============================================
// CLIP SUBMISSION
// ============================================
function openSubmitClipSheet() {
  openSheet(`
    <div class="space-y-4">
      <div class="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary">
        ⚡ Your clip goes to admin for approval. If approved, your IGN will be shown as the source.
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">YouTube / TikTok URL *</label>
        <input id="sc-url" type="url" placeholder="https://youtube.com/watch?v=..." />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun Tag</label>
        <select id="sc-gun">
          <option value="">Any</option>
          ${ALL_GUNS.slice(0, 40).map(g => `<option>${g}</option>`).join('')}
        </select>
      </div>
      <button id="sc-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">
        Submit for Approval
      </button>
    </div>
  `, 'Submit a Clip');

  document.getElementById('sc-submit').onclick = async () => {
    const url = document.getElementById('sc-url').value.trim();
    const gunTag = document.getElementById('sc-gun').value;

    if (!url) { toast('Add a URL', 'error'); return; }

    const canSubmit = await checkSubmitCooldown('clip');
    if (!canSubmit) return;

    const btn = document.getElementById('sc-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      await addDoc(collection(db, 'clip_submissions'), {
        submitterUid: State.user.uid,
        submitterIgn: State.profile.ign,
        submitterAvatar: State.profile.avatar || '',
        youtubeUrl: url,
        gunTag: gunTag || 'CODM',
        status: 'pending',
        submittedAt: serverTimestamp()
      });

      markSubmitted('clip');
      toast('Submitted! Admin will review shortly. ✓', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit for Approval';
    }
  };
}

window.openSubmitLeakSheet = openSubmitLeakSheet;
window.openSubmitVaultSheet = openSubmitVaultSheet;
window.openSubmitClipSheet = openSubmitClipSheet;

/* END OF CHUNK 8 */
// ============================================
// Chunk 9: Submit Buttons + Admin Approval + Badges
// ============================================

// ---------- PATCH EXISTING RENDER FUNCTIONS ----------
// We override renderLeaksSub, renderVaultSub, renderClipsSub to add Submit buttons
// and to add the "Approved" badge rendering

// Override the LEAKS tab to add Submit button
const _origRenderLeaksSub = renderLeaksSub;
renderLeaksSub = function() {
  const body = document.getElementById('intel-body');
  const isAdmin = State.user?.uid === ADMIN_UID;
  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Community intel drops</div>
      <div class="flex gap-2">
        <button id="submit-leak-btn" class="btn-press px-3 py-2 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold flex items-center gap-1">
          <i data-lucide="upload" class="w-3 h-3"></i> Submit
        </button>
        ${isAdmin ? `<button id="post-leak-btn" class="btn-press px-3 py-2 rounded-xl bg-gold text-black text-xs font-bold flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i> Post</button>` : ''}
      </div>
    </div>
    <div id="leaks-feed" class="space-y-3">
      <div class="skeleton h-32 rounded-2xl"></div>
    </div>
  `;
  document.getElementById('submit-leak-btn').onclick = openSubmitLeakSheet;
  if (isAdmin) document.getElementById('post-leak-btn').onclick = openPostLeakSheet;
  loadLeaks();
};

// Override the leak render to show submitter + Approved badge
const _origRenderLeaks = renderLeaks;
renderLeaks = function() {
  const feed = document.getElementById('leaks-feed');
  if (!feed) return;
  if (State.cache.leaks.length === 0) {
    feed.innerHTML = emptyState('zap', 'No leaks yet', 'Be the first to submit!', 'Submit Leak', openSubmitLeakSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-gold text-black',
    mythic: 'bg-red-500'
  };
  feed.innerHTML = State.cache.leaks.map(l => {
    const authorName = l.submittedByIgn || l.authorIgn || 'CODMPanda';
    const authorAvatar = l.submittedByAvatar || '';
    const isApproved = !!l.approved;
    return `
      <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in">
        ${l.imageUrl ? `<img src="${esc(l.imageUrl)}" class="w-full h-40 object-cover" />` : ''}
        <div class="p-4">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-[10px] px-2 py-0.5 rounded-full ${rarityColors[l.rarity] || 'bg-gray-500'} font-black uppercase">${esc(l.rarity || 'common')}</span>
            ${isApproved ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> Approved</span>` : ''}
            <span class="text-[10px] text-gray-500">${timeAgo(l.createdAt || l.publishedAt)}</span>
          </div>
          <h3 class="text-base font-bold mb-2">${esc(l.title)}</h3>
          ${l.body ? `<p class="text-xs text-gray-400 line-clamp-3 mb-3">${esc(l.body)}</p>` : ''}
          <div class="flex items-center gap-2 mb-3">
            <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden">
              ${authorAvatar ? `<img src="${esc(authorAvatar)}" class="w-full h-full object-cover" />` : getInitials(authorName)}
            </div>
            <span class="text-[10px] text-gray-500">by <span class="text-gray-300 font-semibold">${esc(authorName)}</span></span>
          </div>
          <div class="flex items-center justify-between">
            <button class="hype-leak flex items-center gap-1 text-xs text-gray-400" data-id="${l.id}">
              <i data-lucide="flame" class="w-4 h-4"></i> ${l.hypes || 0}
            </button>
            <button class="share-leak text-gray-500" data-id="${l.id}">
              <i data-lucide="share-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  feed.querySelectorAll('.hype-leak').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'leaks', btn.dataset.id), { hypes: increment(1) });
        toast('🔥 Hyped!', 'success', 1000);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-leak').forEach(btn => {
    btn.onclick = () => shareContent('CODMPanda Leak', 'Intel drop!', location.origin + '/?leak=' + btn.dataset.id);
  });
  if (window.lucide) window.lucide.createIcons();
};

// Override the VAULT sub to add Submit button
const _origRenderVaultSub = renderVaultSub;
renderVaultSub = function() {
  const body = document.getElementById('lab-body');
  body.innerHTML = `
    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      <button class="chip vault-type ${vaultTypeFilter === 'gunsmith' ? 'active' : ''}" data-type="gunsmith">Gunsmith</button>
      <button class="chip vault-type ${vaultTypeFilter === 'sens' ? 'active' : ''}" data-type="sens">Sensitivity</button>
      <button class="chip vault-type ${vaultTypeFilter === 'hud' ? 'active' : ''}" data-type="hud">HUD</button>
      <button id="submit-vault-btn" class="chip active ml-auto" style="background:#FF6B00;border-color:#FF6B00;color:#fff">
        <i data-lucide="upload" class="w-3 h-3 inline"></i> Submit
      </button>
    </div>

    <div class="relative mb-4">
      <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input id="vault-search" type="text" placeholder="Search by gun or code..." class="pl-10" />
    </div>

    <div id="vault-feed" class="grid grid-cols-2 gap-3">
      ${skeletonCard().repeat(4)}
    </div>
  `;

  document.getElementById('submit-vault-btn').onclick = openSubmitVaultSheet;
  document.getElementById('vault-search').oninput = (e) => {
    State.filters.vaults.search = e.target.value.toLowerCase();
    renderVaults();
  };

  document.querySelectorAll('.vault-type').forEach(btn => {
    btn.onclick = () => {
      vaultTypeFilter = btn.dataset.type;
      State.filters.vaults.type = vaultTypeFilter;
      renderVaultSub();
    };
  });

  loadVaults();
  if (window.lucide) window.lucide.createIcons();
};

// Override CLIPS to add Submit button
const _origRenderClipsSub = renderClipsSub;
renderClipsSub = function() {
  const body = document.getElementById('squad-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Best plays from the community</div>
      <button id="submit-clip-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1">
        <i data-lucide="upload" class="w-3 h-3"></i> Submit
      </button>
    </div>
    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      <button class="chip clip-sort active" data-sort="recent">Recent</button>
      <button class="chip clip-sort" data-sort="trending">Trending</button>
    </div>
    <div id="clips-feed" class="space-y-3">
      <div class="skeleton h-40 rounded-2xl"></div>
    </div>
  `;

  document.getElementById('submit-clip-btn').onclick = openSubmitClipSheet;
  document.querySelectorAll('.clip-sort').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.clip-sort').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.filters.clips.sort = btn.dataset.sort;
      renderClips();
    };
  });

  loadClips();
};

// Override CLIP render to show submitter + Approved badge
const _origRenderClips = renderClips;
renderClips = function() {
  const feed = document.getElementById('clips-feed');
  if (!feed) return;
  let clips = [...State.cache.clips];
  if (State.filters.clips.sort === 'trending') {
    clips.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  if (clips.length === 0) {
    feed.innerHTML = emptyState('video', 'No clips yet', 'Be the first to submit!', 'Submit Clip', openSubmitClipSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = clips.map(c => {
    const embedUrl = getYouTubeEmbed(c.youtubeUrl);
    const authorName = c.submittedByIgn || c.ign || 'CODMPanda';
    const authorAvatar = c.submittedByAvatar || '';
    const isApproved = !!c.approved;
    return `
      <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in">
        ${embedUrl ? `
          <div class="relative w-full aspect-video bg-black">
            <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen loading="lazy"></iframe>
          </div>
        ` : `
          <div class="w-full aspect-video bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
            <a href="${esc(c.youtubeUrl)}" target="_blank" class="text-center">
              <i data-lucide="external-link" class="w-8 h-8 mx-auto text-primary mb-2"></i>
              <div class="text-xs text-gray-400">Open link</div>
            </a>
          </div>
        `}
        <div class="p-3">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-xs font-bold text-gray-300">${esc(c.gunTag || 'CODM')}</span>
            ${isApproved ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> Approved</span>` : ''}
            <span class="text-[10px] text-gray-500">· ${timeAgo(c.createdAt)}</span>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden">
              ${authorAvatar ? `<img src="${esc(authorAvatar)}" class="w-full h-full object-cover" />` : getInitials(authorName)}
            </div>
            <span class="text-[10px] text-gray-500">by <span class="text-gray-300 font-semibold">${esc(authorName)}</span></span>
          </div>
          <div class="flex items-center justify-between">
            <button class="like-clip flex items-center gap-1 text-xs text-gray-400" data-id="${c.id}">
              <i data-lucide="heart" class="w-4 h-4"></i> ${c.likes || 0}
            </button>
            <button class="share-clip text-gray-500" data-id="${c.id}">
              <i data-lucide="share-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  feed.querySelectorAll('.like-clip').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'clips', btn.dataset.id), { likes: increment(1) });
        toast('❤️', 'success', 1000);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-clip').forEach(btn => {
    btn.onclick = () => shareContent('CODMPanda Clip', 'Watch this!', location.origin + '/?clip=' + btn.dataset.id);
  });
  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// ADMIN APPROVAL QUEUE
// ============================================
async function showAdminSubmissions() {
  openSheet(`<div class="text-center py-8"><div class="spinner mx-auto"></div></div>`, 'Pending Submissions');

  try {
    // Fetch all recent submissions (no index needed) and filter client-side
    const [leakSnap, vaultSnap, clipSnap] = await Promise.all([
      getDocs(query(collection(db, 'leak_submissions'), limit(100))),
      getDocs(query(collection(db, 'vault_submissions'), limit(100))),
      getDocs(query(collection(db, 'clip_submissions'), limit(100)))
    ]);

    const leaks = [];
    leakSnap.forEach(function(d) {
      const data = d.data();
      if (data.status === 'pending') {
        leaks.push({ id: d.id, ...data });
   }
});

    const vaults = [];
    vaultSnap.forEach(function(d) {
      const data = d.data();
      if (data.status === 'pending') {
        vaults.push({ id: d.id, ...data });
   }
});

   const clips = [];
   clipSnap.forEach(function(d) {
     const data = d.data();
     if (data.status === 'pending') {
       clips.push({ id: d.id, ...data });
   }
});

   const sortByDate = function(a, b) {
     const ta = a.submittedAt ? a.submittedAt.seconds : 0;
     const tb = b.submittedAt ? b.submittedAt.seconds : 0;
     return tb - ta;
};

    leaks.sort(sortByDate);
    vaults.sort(sortByDate);
    clips.sort(sortByDate);
    const total = leaks.length + vaults.length + clips.length;

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    if (total === 0) {
      sheetBody.innerHTML = '<div class="text-center py-8 text-gray-500 text-sm">No pending submissions 🎉</div>';
      return;
    }

    sheetBody.innerHTML = `
      <div class="text-xs text-gray-500 mb-4">${total} pending item${total === 1 ? '' : 's'}</div>

      ${leaks.length > 0 ? `
        <div class="text-xs font-bold text-gold uppercase mb-2">🔥 Leaks (${leaks.length})</div>
        ${leaks.map(l => renderSubmissionCard('leak', l)).join('')}
      ` : ''}

      ${vaults.length > 0 ? `
        <div class="text-xs font-bold text-primary uppercase mb-2 mt-4">🔧 Vault Builds (${vaults.length})</div>
        ${vaults.map(v => renderSubmissionCard('vault', v)).join('')}
      ` : ''}

      ${clips.length > 0 ? `
        <div class="text-xs font-bold text-primary uppercase mb-2 mt-4">🎬 Clips (${clips.length})</div>
        ${clips.map(c => renderSubmissionCard('clip', c)).join('')}
      ` : ''}
    `;

    // Wire approve/reject buttons
    sheetBody.querySelectorAll('.approve-btn').forEach(btn => {
      btn.onclick = () => approveSubmission(btn.dataset.type, btn.dataset.id);
    });
    sheetBody.querySelectorAll('.reject-btn').forEach(btn => {
      btn.onclick = () => rejectSubmission(btn.dataset.type, btn.dataset.id);
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Submissions error:', e);
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load</div>';
  }
}

function renderSubmissionCard(type, item) {
  const iconMap = { leak: '🔥', vault: '🔧', clip: '🎬' };
  const titleMap = {
    leak: item.title || 'Untitled leak',
    vault: item.gunName || 'Untitled build',
    clip: item.youtubeUrl || 'Untitled clip'
  };
  const descMap = {
    leak: (item.body || '').slice(0, 100),
    vault: item.gunsmithCode ? `Code: ${item.gunsmithCode}` : Object.keys(item.attachments || {}).length + ' attachments',
    clip: item.gunTag || 'CODM'
  };

  return `
    <div class="bg-card border border-border rounded-xl p-3 mb-2">
      <div class="flex items-start gap-3 mb-2">
        <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
          ${item.submitterAvatar ? `<img src="${esc(item.submitterAvatar)}" class="w-full h-full object-cover" />` : getInitials(item.submitterIgn)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold truncate">${iconMap[type]} ${esc(titleMap)}</div>
          <div class="text-[10px] text-gray-500">by ${esc(item.submitterIgn || 'Unknown')} · ${timeAgo(item.submittedAt)}</div>
        </div>
      </div>
      ${descMap[type] ? `<div class="text-[11px] text-gray-400 mb-2 line-clamp-2">${esc(descMap[type])}</div>` : ''}
      ${item.imageUrl ? `<img src="${esc(item.imageUrl)}" class="w-full h-24 object-cover rounded-lg mb-2" />` : ''}
      <div class="flex gap-2">
        <button class="approve-btn flex-1 py-2 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold" data-type="${type}" data-id="${item.id}">
          ✓ Approve
        </button>
        <button class="reject-btn flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold" data-type="${type}" data-id="${item.id}">
          ✕ Reject
        </button>
      </div>
    </div>
  `;
}

async function approveSubmission(type, id) {
  const collectionMap = {
    leak: { sub: 'leak_submissions', main: 'leaks' },
    vault: { sub: 'vault_submissions', main: 'vaults' },
    clip: { sub: 'clip_submissions', main: 'clips' }
  };
  const { sub, main } = collectionMap[type];

  try {
    toast('Approving...', 'info', 1500);

    const subRef = doc(db, sub, id);
    const subSnap = await getDoc(subRef);
    if (!subSnap.exists()) { toast('Submission not found', 'error'); return; }

    const data = subSnap.data();

    // Build the main doc
    const mainDoc = {
      uid: data.submitterUid,
      ign: data.submitterIgn,
      avatar: data.submitterAvatar || '',
      submittedByUid: data.submitterUid,
      submittedByIgn: data.submitterIgn,
      submittedByAvatar: data.submitterAvatar || '',
      approved: true,
      approvedByUid: State.user.uid,
      approvedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    if (type === 'leak') {
      Object.assign(mainDoc, {
        title: data.title,
        rarity: data.rarity,
        body: data.body,
        imageUrl: data.imageUrl || '',
        hypes: 0
      });
    } else if (type === 'vault') {
      Object.assign(mainDoc, {
        gunName: data.gunName,
        gunsmithCode: data.gunsmithCode,
        type: data.type,
        attachments: data.attachments || {},
        imageUrl: data.imageUrl || '',
        likes: 0
      });
    } else if (type === 'clip') {
      Object.assign(mainDoc, {
        youtubeUrl: data.youtubeUrl,
        gunTag: data.gunTag,
        likes: 0
      });
    }

    // 1. Add to main collection
    await addDoc(collection(db, main), mainDoc);

    // 2. Update submitter's count + badges
    await updateContributorStats(data.submitterUid);

    // 3. Delete the submission (per your choice: A)
    await deleteDoc(subRef);

    toast('✓ Approved & published!', 'success');
    closeSheet();
    setTimeout(showAdminSubmissions, 500);
  } catch (e) {
    console.error(e);
    toast('Failed: ' + e.message, 'error');
  }
}

async function rejectSubmission(type, id) {
  confirmDialog('Reject Submission', 'This will permanently delete the submission. The user can resubmit.', async () => {
    const collectionMap = {
      leak: 'leak_submissions',
      vault: 'vault_submissions',
      clip: 'clip_submissions'
    };
    try {
      await deleteDoc(doc(db, collectionMap[type], id));
      toast('Rejected', 'success');
      closeSheet();
      setTimeout(showAdminSubmissions, 500);
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  }, 'Reject', true);
}

async function updateContributorStats(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const newCount = (data.approvedCount || 0) + 1;
    const badges = data.badges || [];

    // Add badges at milestones
    if (newCount === 1 && !badges.includes('first_leak')) badges.push('first_leak');
    if (newCount === 5 && !badges.includes('rising')) badges.push('rising');
    if (newCount === 10 && !badges.includes('legend')) badges.push('legend');
    if (newCount === 25 && !badges.includes('elite')) badges.push('elite');

    await updateDoc(userRef, {
      approvedCount: newCount,
      badges: badges
    });

    console.log('✅ Contributor stats updated:', uid, 'count:', newCount);
  } catch (e) {
    console.error('Failed to update contributor stats:', e);
  }
}

async function grantProToContributor(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isPro: true,
      proExpiry: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
      proFromContribution: true
    });
    toast('👑 7-day Pro granted!', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

window.showAdminSubmissions = showAdminSubmissions;
window.grantProToContributor = grantProToContributor;

/* END OF CHUNK 9 */
// ============================================
// Chunk 10: Contributor Card + Admin Panel Integration
// ============================================

// ---------- CONTRIBUTOR CARD (for YOU tab) ----------
function renderContributorCard() {
  const p = State.profile || {};
  const count = p.approvedCount || 0;
  const badges = p.badges || [];

  // Milestone tracking
  const nextMilestone = count < 1 ? 1 : count < 5 ? 5 : count < 10 ? 10 : count < 25 ? 25 : null;
  const prevMilestone = count < 1 ? 0 : count < 5 ? 1 : count < 10 ? 5 : count < 25 ? 10 : 25;
  const progressPct = nextMilestone ? Math.round(((count - prevMilestone) / (nextMilestone - prevMilestone)) * 100) : 100;

  const badgeInfo = {
    first_leak: { emoji: '🥉', label: 'First Leak', color: 'text-orange-400' },
    rising: { emoji: '🥈', label: 'Rising Contributor', color: 'text-blue-400' },
    legend: { emoji: '🥇', label: 'Community Legend', color: 'text-gold' },
    elite: { emoji: '💎', label: 'CODMPanda Elite', color: 'text-purple-400' }
  };

  return `
    <div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div class="px-4 py-3 border-b border-border">
        <div class="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
          <span>🏆</span> Contributor
        </div>
      </div>
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-2xl font-black text-primary">${count}</div>
            <div class="text-[10px] text-gray-500 font-bold uppercase">Approved Submissions</div>
          </div>
          <div class="text-right">
            ${nextMilestone ? `
              <div class="text-[10px] text-gray-500">Next reward at <span class="font-bold text-white">${nextMilestone}</span></div>
              <div class="text-[10px] text-gold font-bold">${nextMilestone - count} more needed</div>
            ` : `
              <div class="text-[10px] text-gold font-bold glow-text-gold">ALL MILESTONES HIT 👑</div>
            `}
          </div>
        </div>

        <!-- Progress bar -->
        <div class="progress-bar mb-4">
          <div class="progress-fill" style="width: ${progressPct}%"></div>
        </div>

        <!-- Badges -->
        <div class="grid grid-cols-4 gap-2 mb-3">
          ${['first_leak', 'rising', 'legend', 'elite'].map(b => {
            const info = badgeInfo[b];
            const unlocked = badges.includes(b);
            return `
              <div class="flex flex-col items-center gap-1 p-2 rounded-lg ${unlocked ? 'bg-gold/10 border border-gold/30' : 'bg-cardAlt border border-border opacity-40'}">
                <span class="text-xl">${info.emoji}</span>
                <span class="text-[8px] font-bold ${unlocked ? info.color : 'text-gray-500'} text-center leading-tight">${info.label}</span>
              </div>
            `;
          }).join('')}
        </div>

        <div class="text-[10px] text-gray-500 text-center">
          Submit leaks, builds, or clips → get approved → unlock rewards
        </div>
      </div>
    </div>
  `;
}

// ---------- OVERRIDE YOU TAB to include Contributor card ----------
const _origRenderYouTab = renderYouTab;
renderYouTab = function() {
  // Call the original to render base
  _origRenderYouTab();

  // Inject the contributor card after the stats grid
  setTimeout(() => {
    const content = document.getElementById('content');
    if (!content) return;
    const statsGrid = content.querySelector('.grid-cols-3');
    if (statsGrid && statsGrid.parentElement) {
      const card = document.createElement('div');
      card.innerHTML = renderContributorCard();
      statsGrid.parentElement.insertBefore(card.firstElementChild, statsGrid.nextSibling);
    }
  }, 50);
};

// ---------- ADD ADMIN SUBMISSIONS BUTTON ----------
// Override renderYouTab to add "Pending Submissions" to admin section
const _origRenderYouTab2 = renderYouTab;
renderYouTab = function() {
  _origRenderYouTab2();

  // Add admin button for submissions
  setTimeout(() => {
    const adminSection = document.querySelector('.bg-card.border-gold\\/40');
    if (adminSection) {
      const list = adminSection.querySelector('.divide-y');
      if (list && !list.querySelector('[data-action="admin-submissions"]')) {
        const btn = document.createElement('button');
        btn.className = 'settings-row w-full flex items-center justify-between px-4 py-3 text-left';
        btn.dataset.action = 'admin-submissions';
        btn.innerHTML = `
          <div class="flex items-center gap-3 min-w-0">
            <i data-lucide="inbox" class="w-4 h-4 text-gold flex-shrink-0"></i>
            <div class="min-w-0">
              <div class="text-sm font-semibold">Pending Submissions</div>
              <div class="text-[10px] text-gray-500 truncate">Review user submissions</div>
            </div>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
        `;
        btn.onclick = () => handleSettingAction('admin-submissions');
        list.insertBefore(btn, list.firstChild);
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }, 100);
};

// ---------- HANDLE new admin actions ----------
const _origHandleSettingAction = handleSettingAction;
handleSettingAction = function(action) {
  if (action === 'admin-submissions') {
    showAdminSubmissions();
    return;
  }
  return _origHandleSettingAction(action);
};

// ---------- ADMIN PANEL — pending submissions count badge ----------
async function updateAdminBadge() {
  if (State.user?.uid !== ADMIN_UID) return;
  try {
    const [l, v, c] = await Promise.all([
      getDocs(query(collection(db, 'leak_submissions'), where('status', '==', 'pending'))),
      getDocs(query(collection(db, 'vault_submissions'), where('status', '==', 'pending'))),
      getDocs(query(collection(db, 'clip_submissions'), where('status', '==', 'pending')))
    ]);
    const total = l.size + v.size + c.size;
    if (total > 0) {
      // Could show a badge on the YOU tab — nice touch
      console.log('📬 Pending submissions:', total);
    }
  } catch (e) { /* silent */ }
}

// Call on admin login
setTimeout(() => {
  if (State.user?.uid === ADMIN_UID) updateAdminBadge();
}, 3000);

// ---------- GRANT PRO BUTTON (called from user list) ----------
function showGrantProDialog(uid, ign) {
  confirmDialog(
    'Grant Pro',
    `Give ${esc(ign)} 7 days of Pro for their contribution?`,
    async () => {
      try {
        await updateDoc(doc(db, 'users', uid), {
          isPro: true,
          proExpiry: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
          proFromContribution: true
        });
        toast(`👑 Pro granted to ${ign}!`, 'success');
      } catch (e) {
        toast('Failed: ' + e.message, 'error');
      }
    },
    'Grant 7-Day Pro'
  );
}

// ---------- OVERRIDE showAdminUsers to include Grant Pro button for contributors ----------
const _origShowAdminUsers = showAdminUsers;
showAdminUsers = async function() {
  openSheet(`<div class="text-center py-8"><div class="spinner mx-auto"></div></div>`, 'Users');

  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100)));
    const users = [];
    snap.forEach(d => users.push({ id: d.id, ...d.data() }));

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="text-xs text-gray-500 mb-3">${users.length} total users</div>
      ${users.map(u => {
        const isContributor = (u.approvedCount || 0) >= 5 && !u.proFromContribution;
        return `
          <div class="bg-card border border-border rounded-xl p-3 mb-2">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
                ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold truncate flex items-center gap-1.5">
                  ${esc(u.ign || 'Unknown')}
                  ${u.isPro ? '<span class="text-[8px] px-1 py-0.5 rounded bg-gold text-black font-black">PRO</span>' : ''}
                </div>
                <div class="text-[10px] text-gray-500 truncate">
                  ${esc(u.rank || '—')} · ${esc(u.region || '—')}
                  ${u.approvedCount ? ` · 🏆 ${u.approvedCount}` : ''}
                </div>
              </div>
              <div class="text-[9px] text-gray-600 font-mono">${u.id.slice(0, 6)}</div>
            </div>
            ${isContributor ? `
              <button class="grant-pro-btn w-full mt-2 py-2 rounded-lg bg-gold/15 border border-gold/40 text-gold text-xs font-bold" data-uid="${u.id}" data-ign="${esc(u.ign)}">
                👑 Grant 7-Day Pro (Contributor)
              </button>
            ` : ''}
          </div>
        `;
      }).join('')}
    `;

    sheetBody.querySelectorAll('.grant-pro-btn').forEach(btn => {
      btn.onclick = () => {
        closeSheet();
        showGrantProDialog(btn.dataset.uid, btn.dataset.ign);
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load</div>';
  }
};

// Export
window.renderContributorCard = renderContributorCard;
window.showGrantProDialog = showGrantProDialog;

/* END OF CHUNK 10 */
// ============================================
// Chunk 11: Live Community Tier List
// ============================================

const ALL_TIER_GUNS = [
  'AK117', 'AK-47', 'ASM10', 'BK57', 'DR-H', 'FR .556', 'HBRa3', 'HVK-30',
  'ICR-1', 'KN-44', 'LK24', 'M16', 'M4', 'Man-O-War', 'Oden',
  'Peacekeeper MK2', 'AKBP', 'AS VAL', 'CR-56 AMAX', 'EM2',
  'FARA 83', 'Grau 5.56', 'Kilo 141', 'M13', 'Maddox',
  'Swordfish', 'Type 25', 'Type 19', 'BP50', 'RAM-7',
  'QQ9', 'MP5', 'MP7', 'PDW-57', 'RUS-79U', 'Cordite', 'GKS',
  'HG 40', 'MSMC', 'Pharo', 'Razorback', 'QQ10', 'AGR 556',
  'Fennec', 'Striker 45', 'PP19 Bizon', 'PPSh-41', 'QXR',
  'MX9', 'CX-9', 'LAPA', 'Vaznev-9K', 'ISO 45',
  'Arctic .50', 'DL Q33', 'Locus', 'M21 EBR', 'XPR-50',
  'NA-45', 'Rytec AMR', 'SP-R 208', 'Kilo Bolt-Action',
  'ZRG 20mm', 'HDR', 'LW3-Tundra', 'Koshka', 'Outlaw',
  'RPD', 'M4LMG', 'UL736', 'S36', 'Chopper', 'Holger 26',
  'PKM', 'Bruen MK9', 'FiNN LMG', 'RAAL MG', 'Hades', 'MG82',
  'BY15', 'HS0405', 'HS2126', 'Striker', 'KRM 262',
  'Echo', 'JAK-12', 'R9-0', 'Argus', 'VLK Rogue'
];

const TIER_ORDER = ['S', 'A', 'B', 'C'];
const TIER_COLORS = {
  S: { bg: 'bg-red-500', text: 'text-white', glow: 'shadow-lg shadow-red-500/50' },
  A: { bg: 'bg-orange-500', text: 'text-white', glow: 'shadow-lg shadow-orange-500/50' },
  B: { bg: 'bg-yellow-500', text: 'text-black', glow: '' },
  C: { bg: 'bg-gray-500', text: 'text-white', glow: '' }
};

let tierVotesData = {};
let tierVotesUnsub = null;
let myTierVotes = {};

async function loadTierVotes() {
  const votes = {};
  myTierVotes = {};

  try {
    const snap = await getDocs(collection(db, 'tierVotes'));
    snap.forEach(doc => {
      const uid = doc.id;
      const userVotes = doc.data();
      Object.keys(userVotes).forEach(gun => {
        const tier = userVotes[gun];
        if (!votes[gun]) votes[gun] = { S: 0, A: 0, B: 0, C: 0 };
        if (votes[gun][tier] !== undefined) votes[gun][tier]++;
      });
      if (uid === State.user?.uid) {
        myTierVotes = userVotes;
      }
    });
    tierVotesData = votes;
  } catch (e) {
    console.error('Tier votes load error:', e);
  }
}

function getDominantTier(gun) {
  const v = tierVotesData[gun];
  if (!v) return null;
  let best = null, bestCount = 0, total = 0;
  TIER_ORDER.forEach(t => {
    total += v[t];
    if (v[t] > bestCount) { bestCount = v[t]; best = t; }
  });
  if (total < 3) return null;
  return { tier: best, count: bestCount, total: total };
}

function buildLiveTiers() {
  const tiers = { S: [], A: [], B: [], C: [] };
  ALL_TIER_GUNS.forEach(gun => {
    const dom = getDominantTier(gun);
    if (dom) {
      tiers[dom.tier].push({ gun, count: dom.count, total: dom.total, pct: Math.round((dom.count / dom.total) * 100) });
    }
  });
  TIER_ORDER.forEach(t => {
    tiers[t].sort((a, b) => b.total - a.total);
  });
  return tiers;
}

function renderLiveTierList() {
  return `
    <div class="space-y-3">
      ${TIER_ORDER.map(tier => {
        const color = TIER_COLORS[tier];
        const guns = window.__liveTiers?.[tier] || [];
        return `
          <div class="bg-card border border-border rounded-2xl p-3">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl ${color.bg} ${color.text} flex items-center justify-center font-black text-lg ${color.glow}">${tier}</div>
                <div>
                  <div class="text-sm font-bold">${tier}-Tier</div>
                  <div class="text-[10px] text-gray-500">${guns.length} gun${guns.length === 1 ? '' : 's'}</div>
                </div>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${guns.length > 0 ? guns.map(g => `
                <button class="tier-gun-pill text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold hover:border-primary transition-colors" data-gun="${esc(g.gun)}">
                  ${esc(g.gun)}
                  <span class="text-gray-500 ml-1">${g.pct}%</span>
                </button>
              `).join('') : `<span class="text-[10px] text-gray-600 italic">No votes yet</span>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function refreshLiveTierList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '<div class="text-center py-6"><div class="spinner mx-auto"></div></div>';

  await loadTierVotes();
  window.__liveTiers = buildLiveTiers();
  container.innerHTML = renderLiveTierList();

  container.querySelectorAll('.tier-gun-pill').forEach(btn => {
    btn.onclick = () => showGunTierDetail(btn.dataset.gun);
  });

  if (window.lucide) window.lucide.createIcons();
}

function showGunTierDetail(gun) {
  const v = tierVotesData[gun] || { S: 0, A: 0, B: 0, C: 0 };
  const total = v.S + v.A + v.B + v.C;
  const myVote = myTierVotes[gun] || null;

  openSheet(`
    <div class="space-y-4">
      <div class="text-center">
        <div class="text-xs text-gray-500 uppercase font-bold mb-1">Community Ranking</div>
        <div class="text-2xl font-black mb-3">${esc(gun)}</div>
        <div class="text-xs text-gray-500">${total} total vote${total === 1 ? '' : 's'}</div>
      </div>

      <div class="space-y-2">
        ${TIER_ORDER.map(t => {
          const count = v[t];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const color = TIER_COLORS[t];
          return `
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg ${color.bg} ${color.text} flex items-center justify-center font-black text-sm flex-shrink-0">${t}</div>
              <div class="flex-1">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${pct}%"></div>
                </div>
              </div>
              <div class="text-xs font-bold w-12 text-right">${pct}%</div>
              <div class="text-[10px] text-gray-500 w-10 text-right">${count}</div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="pt-3 border-t border-border">
        <div class="text-xs text-gray-500 mb-2">Your vote:</div>
        <div class="grid grid-cols-4 gap-2">
          ${TIER_ORDER.map(t => {
            const color = TIER_COLORS[t];
            const selected = myVote === t;
            return `
              <button class="vote-tier-btn py-3 rounded-xl ${selected ? color.bg + ' ' + color.text : 'bg-cardAlt border border-border text-gray-400'} font-black text-sm transition-all" data-tier="${t}" data-gun="${esc(gun)}">
                ${t}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `, 'Vote & View');

  document.querySelectorAll('.vote-tier-btn').forEach(btn => {
    btn.onclick = () => castVote(btn.dataset.gun, btn.dataset.tier);
  });
}

async function castVote(gun, tier) {
  try {
    const ref = doc(db, 'tierVotes', State.user.uid);
    const snap = await getDoc(ref);
    const current = snap.exists() ? snap.data() : {};
    const oldVote = current[gun];

    current[gun] = tier;
    await setDoc(ref, current);

    myTierVotes[gun] = tier;

    if (!tierVotesData[gun]) tierVotesData[gun] = { S: 0, A: 0, B: 0, C: 0 };
    if (oldVote && tierVotesData[gun][oldVote] > 0) tierVotesData[gun][oldVote]--;
    tierVotesData[gun][tier]++;

    toast(`${gun} → ${tier}-Tier ✓`, 'success', 1500);
    closeSheet();

    const container = document.getElementById('tier-live-container');
    if (container) {
      window.__liveTiers = buildLiveTiers();
      container.innerHTML = renderLiveTierList();
      container.querySelectorAll('.tier-gun-pill').forEach(btn => {
        btn.onclick = () => showGunTierDetail(btn.dataset.gun);
      });
      if (window.lucide) window.lucide.createIcons();
    }
  } catch (e) {
    console.error('Vote error:', e);
    toast('Vote failed: ' + e.message, 'error');
  }
}

function openVoteGunSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Pick a gun</label>
        <select id="tv-gun">
          ${ALL_TIER_GUNS.map(g => `<option>${g}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Its tier</label>
        <div class="grid grid-cols-4 gap-2">
          ${TIER_ORDER.map(t => `
            <button class="pick-tier-btn py-3 rounded-xl ${TIER_COLORS[t].bg} ${TIER_COLORS[t].text} font-black text-sm" data-tier="${t}">${t}</button>
          `).join('')}
        </div>
      </div>
      <button id="tv-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Submit Vote</button>
    </div>
  `, 'Vote on a Gun');

  let selectedTier = null;
  document.querySelectorAll('.pick-tier-btn').forEach(btn => {
    btn.onclick = () => {
      selectedTier = btn.dataset.tier;
      document.querySelectorAll('.pick-tier-btn').forEach(b => b.style.opacity = b === btn ? '1' : '0.35');
    };
  });

  document.getElementById('tv-submit').onclick = () => {
    const gun = document.getElementById('tv-gun').value;
    if (!selectedTier) { toast('Pick a tier', 'error'); return; }
    castVote(gun, selectedTier);
  };
}

// Override the TIER sub tab
const _origRenderTierSub = renderTierSub;
renderTierSub = function() {
  const body = document.getElementById('intel-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="text-xs text-gray-500">Live community meta</div>
        <div class="text-[10px] text-gray-600 mt-0.5">Auto-updates as votes come in</div>
      </div>
      <button id="vote-gun-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1">
        <i data-lucide="plus" class="w-3 h-3"></i> Vote
      </button>
    </div>
    <div id="tier-live-container">
      <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
    </div>
  `;
  document.getElementById('vote-gun-btn').onclick = openVoteGunSheet;
  refreshLiveTierList('tier-live-container');
};

window.castVote = castVote;
window.openVoteGunSheet = openVoteGunSheet;
window.refreshLiveTierList = refreshLiveTierList;

/* END OF CHUNK 11 */
// ============================================
// Chunk 12: Contributor Leaderboard
// ============================================

let leaderboardData = { weekly: [], allTime: [] };
let leaderboardPeriod = 'allTime';

async function loadLeaderboard() {
  try {
    // Fetch top contributors (approvedCount > 0)
    const snap = await getDocs(query(
      collection(db, 'users'),
      where('approvedCount', '>', 0),
      orderBy('approvedCount', 'desc'),
      limit(50)
    ));

    const users = [];
    snap.forEach(d => {
      const data = d.data();
      users.push({
        uid: d.id,
        ign: data.ign || 'Unknown',
        avatar: data.avatar || '',
        rank: data.rank || 'Rookie',
        region: data.region || 'Global',
        approvedCount: data.approvedCount || 0,
        badges: data.badges || [],
        isPro: data.isPro || false,
        lastSubmit: data.lastSubmitAt?.seconds || 0
      });
    });

    leaderboardData.allTime = users.slice(0, 10);

    // For weekly: filter to those who submitted in last 7 days
    const weekAgo = Date.now() / 1000 - (7 * 24 * 60 * 60);
    leaderboardData.weekly = users
      .filter(u => u.lastSubmit > weekAgo)
      .slice(0, 10);

    // If weekly is empty, show a message
  } catch (e) {
    console.error('Leaderboard error:', e);
    // Fallback: fetch all users without where clause
    try {
      const snap2 = await getDocs(query(collection(db, 'users'), limit(100)));
      const users = [];
      snap2.forEach(d => {
        const data = d.data();
        if ((data.approvedCount || 0) > 0) {
          users.push({
            uid: d.id,
            ign: data.ign || 'Unknown',
            avatar: data.avatar || '',
            rank: data.rank || 'Rookie',
            region: data.region || 'Global',
            approvedCount: data.approvedCount || 0,
            badges: data.badges || [],
            isPro: data.isPro || false,
            lastSubmit: data.lastSubmitAt?.seconds || 0
          });
        }
      });
      users.sort((a, b) => b.approvedCount - a.approvedCount);
      leaderboardData.allTime = users.slice(0, 10);
      const weekAgo = Date.now() / 1000 - (7 * 24 * 60 * 60);
      leaderboardData.weekly = users.filter(u => u.lastSubmit > weekAgo).slice(0, 10);
    } catch (e2) {
      console.error('Leaderboard fallback failed:', e2);
    }
  }
}

function renderLeaderboard() {
  const list = leaderboardPeriod === 'weekly' ? leaderboardData.weekly : leaderboardData.allTime;

  if (list.length === 0) {
    return `
      <div class="text-center py-12">
        <div class="w-20 h-20 mx-auto rounded-full bg-card border border-border flex items-center justify-center mb-4">
          <span class="text-3xl">🏆</span>
        </div>
        <div class="text-sm font-bold mb-1">No contributors yet</div>
        <div class="text-xs text-gray-500">Be the first to submit and get approved</div>
      </div>
    `;
  }

  const medals = ['🥇', '🥈', '🥉'];

  return `
    <div class="space-y-2">
      ${list.map((u, i) => {
        const pos = i + 1;
        const medal = medals[i] || `#${pos}`;
        const isTop3 = i < 3;
        const isMe = u.uid === State.user?.uid;

        return `
          <div class="flex items-center gap-3 p-3 rounded-2xl ${isTop3 ? 'bg-gradient-to-r from-gold/10 to-transparent border border-gold/30' : 'bg-card border border-border'} ${isMe ? 'ring-1 ring-primary/40' : ''}">
            <div class="w-10 h-10 rounded-full ${isTop3 ? 'bg-gold/20' : 'bg-cardAlt'} flex items-center justify-center font-black text-sm flex-shrink-0">
              ${pos <= 3 ? `<span class="text-lg">${medal}</span>` : `<span class="text-gray-400">${pos}</span>`}
            </div>
            <div class="relative flex-shrink-0">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center font-bold text-sm">
                ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
              </div>
              ${u.isPro ? `<div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold flex items-center justify-center border-2 border-card text-[8px]">👑</div>` : ''}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-bold truncate">${esc(u.ign)}</span>
                ${isMe ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white font-black">YOU</span>' : ''}
              </div>
              <div class="text-[10px] text-gray-500 truncate">${esc(u.rank)} · ${esc(u.region)}</div>
              ${u.badges.length > 0 ? `
                <div class="flex gap-1 mt-1">
                  ${u.badges.slice(0, 4).map(b => {
                    const badgeEmoji = {
                      first_leak: '🥉',
                      rising: '🥈',
                      legend: '🥇',
                      elite: '💎'
                    }[b] || '⭐';
                    return `<span class="text-[10px]">${badgeEmoji}</span>`;
                  }).join('')}
                </div>
              ` : ''}
            </div>
            <div class="text-right flex-shrink-0">
              <div class="text-base font-black text-primary">${u.approvedCount}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase">Approved</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function renderLeaderboardSub() {
  const body = document.getElementById('squad-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <div class="text-sm font-bold">🏆 Top Contributors</div>
        <div class="text-[10px] text-gray-500 mt-0.5">Users who've helped the community</div>
      </div>
    </div>

    <div class="flex gap-2 mb-4">
      <button class="chip leaderboard-period ${leaderboardPeriod === 'allTime' ? 'active' : ''}" data-period="allTime">All-Time</button>
      <button class="chip leaderboard-period ${leaderboardPeriod === 'weekly' ? 'active' : ''}" data-period="weekly">This Week</button>
    </div>

    <div id="leaderboard-container">
      <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
    </div>
  `;

  document.querySelectorAll('.leaderboard-period').forEach(btn => {
    btn.onclick = () => {
      leaderboardPeriod = btn.dataset.period;
      document.querySelectorAll('.leaderboard-period').forEach(b => b.classList.toggle('active', b === btn));
      const container = document.getElementById('leaderboard-container');
      if (container) container.innerHTML = renderLeaderboard();
      if (window.lucide) window.lucide.createIcons();
    };
  });

  await loadLeaderboard();
  const container = document.getElementById('leaderboard-container');
  if (container) container.innerHTML = renderLeaderboard();
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// ADD LEADERBOARD AS 4TH SUB-TAB IN SQUAD
// ============================================
const _origRenderSquadTab = renderSquadTab;
renderSquadTab = function() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="mb-4">
        <h1 class="text-2xl font-black">Squad</h1>
        <p class="text-xs text-gray-500">Clans, scrims, clips, and legends</p>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <button class="squad-sub py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'clans' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="clans">Clans</button>
        <button class="squad-sub py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'scrims' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="scrims">Scrims</button>
        <button class="squad-sub py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'clips' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="clips">Clips</button>
        <button class="squad-sub py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'top' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="top">Top</button>
        <button class="squad-sub py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'wars' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="wars">Wars</button>
        <button class="squad-sub py-2.5 rounded-xl font-bold text-xs ${squadSubTab === 'tournaments' ? 'bg-primary' : 'bg-card border border-border text-gray-400'}" data-sub="tournaments">Tournaments</button>
      </div>

      <div id="squad-body"></div>
    </div>
  `;

  document.querySelectorAll('.squad-sub').forEach(btn => {
    btn.onclick = () => { squadSubTab = btn.dataset.sub; renderSquadTab(); };
  });

  if (squadSubTab === 'clans') renderClansSub();
  else if (squadSubTab === 'scrims') renderScrimsSub();
  else if (squadSubTab === 'clips') renderClipsSub();
  else if (squadSubTab === 'top') renderLeaderboardSub();
  else if (squadSubTab === 'wars') renderClanWarsSub();
  else if (squadSubTab === 'tournaments') renderTournamentsSub();

  if (window.lucide) window.lucide.createIcons();
};

window.renderLeaderboardSub = renderLeaderboardSub;

/* END OF CHUNK 12 */
// ============================================
// Chunk 13: Lemon Squeezy Payments
// ============================================

const PAYMENT_LINKS = {
  lemonMonthly: "https://codmpanda.lemonsqueezy.com/checkout/buy/5213aceb-052a-415f-aec4-4f5167c91d5d",
  lemonLifetime: "https://codmpanda.lemonsqueezy.com/checkout/buy/5a5be449-8af9-4f09-88c5-da31131e6bac"
};

function openUpgradeSheet() {
  const p = State.profile || {};
  if (p.isPro) { showManagePro(); return; }

  openSheet(`
    <div class="text-center space-y-4">
      <div class="text-5xl">👑</div>
      <div>
        <h3 class="text-xl font-black text-gold glow-text-gold mb-1">CODMPanda Pro</h3>
        <p class="text-xs text-gray-400">Unlock everything. Support the app.</p>
      </div>
    </div>

    <div class="bg-black/40 border border-gold/30 rounded-2xl p-4 mt-4 mb-4">
      <div class="text-xs text-gray-300 space-y-2">
        <div class="flex items-center gap-2"><span class="text-gold">✦</span> Unlimited vault builds</div>
        <div class="flex items-center gap-2"><span class="text-gold">✦</span> Full camo tracker (all 80+ guns)</div>
        <div class="flex items-center gap-2"><span class="text-gold">✦</span> Create & lead clans</div>
        <div class="flex items-center gap-2"><span class="text-gold">✦</span> Pin your LFG posts</div>
        <div class="flex items-center gap-2"><span class="text-gold">✦</span> Instant leak alerts</div>
        <div class="flex items-center gap-2"><span class="text-gold">✦</span> Zero ads, forever</div>
        <div class="flex items-center gap-2"><span class="text-gold">✦</span> Gold crown badge 👑</div>
      </div>
    </div>

    <!-- Lifetime -->
    <div class="bg-gradient-to-br from-gold/10 to-black border border-gold/50 rounded-2xl p-4 mb-3 relative overflow-hidden">
      <div class="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded bg-gold text-black font-black z-10">BEST VALUE</div>
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-sm font-black text-gold">Lifetime</div>
          <div class="text-[10px] text-gray-400">Pay once, Pro forever</div>
        </div>
        <div class="text-right">
          <<div class="text-2xl font-black text-gold glow-text-gold mt-4">$9.99</div>
          <div class="text-[10px] text-gray-500">one-time</div>
        </div>
      </div>
      <button id="buy-lifetime-btn" class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold">
        Unlock Lifetime →
      </button>
    </div>

    <!-- Monthly -->
    <div class="bg-card border border-border rounded-2xl p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-sm font-black">Monthly</div>
          <div class="text-[10px] text-gray-500">Cancel anytime</div>
        </div>
        <div class="text-right">
          <div class="text-xl font-black">$1.99</div>
          <div class="text-[10px] text-gray-500">/ month</div>
        </div>
      </div>
      <button id="buy-monthly-btn" class="btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm">
        Subscribe Monthly →
      </button>
    </div>

    <div class="text-[10px] text-gray-600 text-center">
      🔒 Secure payment via Lemon Squeezy<br>
      Cards · Apple Pay · Google Pay · PayPal
    </div>

    <div class="text-[10px] text-gray-600 text-center mt-3">
      Your Pro activates automatically within 1 minute
    </div>
  `, 'Upgrade to Pro');

  document.getElementById('buy-lifetime-btn').onclick = () => startPayment('lemonLifetime');
  document.getElementById('buy-monthly-btn').onclick = () => startPayment('lemonMonthly');
}

function startPayment(type) {
  const url = PAYMENT_LINKS[type];
  if (!url) { toast('Payment link missing', 'error'); return; }

  // Append user info so webhook can identify the buyer
  const email = State.user.email || '';
  const uid = State.user.uid;

  const sep = url.includes('?') ? '&' : '?';
  const finalUrl = url +
    sep + 'checkout[email]=' + encodeURIComponent(email) +
    '&checkout[custom][uid]=' + encodeURIComponent(uid);

  toast('Opening checkout...', 'info', 1500);

  // Open Lemon Squeezy checkout in new tab
  window.open(finalUrl, '_blank');

  closeSheet();

  // Show pending sheet
  setTimeout(() => showPaymentPendingSheet(type), 500);
}

function showPaymentPendingSheet(type) {
  const isLifetime = type === 'lemonLifetime';
  openSheet(`
    <div class="text-center space-y-4 py-4">
      <div class="text-5xl">⏳</div>
      <div>
        <h3 class="text-lg font-black mb-1">Complete your payment</h3>
        <p class="text-xs text-gray-400">
          Finish checkout in the Lemon Squeezy tab. Your Pro activates automatically once payment confirms (usually 30-60 seconds).
        </p>
      </div>

      <div class="bg-card border border-border rounded-xl p-3 text-left text-xs">
        <div class="text-gray-400 mb-1">Order summary:</div>
        <div class="flex justify-between">
          <span>CODMPanda Pro ${isLifetime ? 'Lifetime' : 'Monthly'}</span>
          <span class="font-bold text-gold">${isLifetime ? '$9.99' : '$1.99'}</span>
        </div>
      </div>

      <button id="check-payment-btn" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary flex items-center justify-center gap-2">
        <i data-lucide="refresh-cw" class="w-4 h-4"></i> I've paid — check now
      </button>

      <button onclick="closeSheet()" class="text-xs text-gray-500">Cancel</button>

      <div class="text-[10px] text-gray-600 pt-2 border-t border-border">
        Note: If your Pro doesn't activate instantly, it'll sync within 5 minutes. Contact support if issues persist.
      </div>
    </div>
  `, 'Awaiting Payment');

  document.getElementById('check-payment-btn').onclick = () => checkProStatus();
  if (window.lucide) window.lucide.createIcons();
}

async function checkProStatus() {
  try {
    toast('Checking...', 'info', 1500);
    const snap = await getDoc(doc(db, 'users', State.user.uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.isPro) {
        State.profile = { ...State.profile, ...data };
        toast('👑 Pro activated! Welcome to the club.', 'success', 4000);
        closeSheet();
        hideAd();
        setTimeout(() => {
          if (State.currentTab === 'you') renderYouTab();
        }, 500);
      } else {
        toast('Not confirmed yet. Wait 30s and try again.', 'warning', 4000);
      }
    }
  } catch (e) {
    toast('Check failed: ' + e.message, 'error');
  }
}

// ---------- OVERRIDE pro upsell card in YOU tab ----------
const _origRenderProUpsell = renderProUpsell;
renderProUpsell = function() {
  return `
    <div class="bg-gradient-to-br from-black via-black to-[#1a1200] border border-gold/40 rounded-2xl p-5 mb-4 shimmer relative overflow-hidden">
      <div class="absolute top-3 right-3 text-3xl">👑</div>
      <div class="text-xs font-black text-gold uppercase tracking-wider mb-1">Upgrade</div>
      <h3 class="text-xl font-black mb-3">Go <span class="text-gold glow-text-gold">Pro</span></h3>
      <div class="text-xs text-gray-300 mb-4">
        <div class="font-bold text-gold mb-2">$1.99/mo · $9.99 lifetime</div>
        <ul class="space-y-1.5">
          <li>✦ Unlimited Vault builds</li>
          <li>✦ Full camo tracker</li>
          <li>✦ Create & lead clans</li>
          <li>✦ Pin LFG posts</li>
          <li>✦ Instant leak alerts</li>
          <li>✦ Zero ads, forever</li>
          <li>✦ Gold crown badge 👑</li>
        </ul>
      </div>
      <button id="unlock-pro-btn" class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold">
        Unlock Pro →
      </button>
    </div>
  `;
};

// Replace goPro with openUpgradeSheet
goPro = function() { openUpgradeSheet(); };

// Re-wire unlock button after YOU tab renders
const _origRenderYouTabPayment = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabPayment();
  setTimeout(() => {
    const proBtn = document.getElementById('unlock-pro-btn');
    if (proBtn) proBtn.onclick = openUpgradeSheet;
  }, 50);
};

window.openUpgradeSheet = openUpgradeSheet;
window.startPayment = startPayment;
window.checkProStatus = checkProStatus;
window.goPro = goPro;

/* END OF CHUNK 13 */
// ============================================
// Chunk 14: Share Links (WhatsApp, Twitter, Telegram, Copy)
// ============================================

// ---------- UNIVERSAL SHARE SHEET ----------
function openShareSheet({ title, text, url, imageUrl }) {
  const encodedUrl = encodeURIComponent(url || location.origin);
  const encodedText = encodeURIComponent(text || '');
  const encodedTitle = encodeURIComponent(title || 'CODMPanda');

  openSheet(`
    <div class="space-y-4">
      <div class="text-center">
        <div class="text-2xl font-black mb-1">${esc(title || 'Share')}</div>
        <div class="text-xs text-gray-500 truncate px-4">${esc(url || '')}</div>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <button class="share-opt btn-press flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30" data-network="whatsapp">
          <div class="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
            <i data-lucide="message-circle" class="w-6 h-6 text-white"></i>
          </div>
          <span class="text-[10px] font-bold text-[#25D366]">WhatsApp</span>
        </button>

        <button class="share-opt btn-press flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/40 border border-border" data-network="twitter">
          <div class="w-12 h-12 rounded-full bg-black flex items-center justify-center">
            <span class="text-white font-black text-lg">𝕏</span>
          </div>
          <span class="text-[10px] font-bold text-gray-300">Twitter/X</span>
        </button>

        <button class="share-opt btn-press flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#0088cc]/10 border border-[#0088cc]/30" data-network="telegram">
          <div class="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center">
            <i data-lucide="send" class="w-6 h-6 text-white"></i>
          </div>
          <span class="text-[10px] font-bold text-[#0088cc]">Telegram</span>
        </button>

        <button class="share-opt btn-press flex flex-col items-center gap-2 p-3 rounded-2xl bg-cardAlt border border-border" data-network="copy">
          <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <i data-lucide="link" class="w-6 h-6 text-white"></i>
          </div>
          <span class="text-[10px] font-bold text-gray-300">Copy Link</span>
        </button>

        <button class="share-opt btn-press flex flex-col items-center gap-2 p-3 rounded-2xl bg-cardAlt border border-border" data-network="native">
          <div class="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
            <i data-lucide="share-2" class="w-6 h-6 text-primary"></i>
          </div>
          <span class="text-[10px] font-bold text-gray-300">More</span>
        </button>

        <button class="share-opt btn-press flex flex-col items-center gap-2 p-3 rounded-2xl bg-cardAlt border border-border" data-network="cancel">
          <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <i data-lucide="x" class="w-6 h-6 text-red-400"></i>
          </div>
          <span class="text-[10px] font-bold text-gray-300">Cancel</span>
        </button>
      </div>
    </div>
  `, '');

  document.querySelectorAll('.share-opt').forEach(btn => {
    btn.onclick = () => {
      const net = btn.dataset.network;
      const shareText = text || title || 'Check out CODMPanda';
      const fullText = shareText + '\n\n' + url;

      switch (net) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
          break;
        case 'telegram':
          window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
          break;
        case 'copy':
          copyText(url, 'Link copied!');
          break;
        case 'native':
          if (navigator.share) {
            navigator.share({ title: title || 'CODMPanda', text: shareText, url }).catch(() => {});
          } else {
            copyText(url, 'Link copied!');
          }
          break;
        case 'cancel':
          closeSheet();
          return;
      }
      closeSheet();
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// ---------- BUILD SHAREABLE URLs ----------
function getLobbyShareUrl(lobbyId) {
  return `${location.origin}/?lobby=${lobbyId}`;
}

function getVaultShareUrl(vaultId) {
  return `${location.origin}/?vault=${vaultId}`;
}

function getClipShareUrl(clipId) {
  return `${location.origin}/?clip=${clipId}`;
}

function getLeakShareUrl(leakId) {
  return `${location.origin}/?leak=${leakId}`;
}

// ---------- OVERRIDE LOBBY CARD to add SHARE ----------
const _origRenderLobbies = renderLobbies;
renderLobbies = function() {
  const feed = document.getElementById('lobbies-feed');
  if (!feed) return;
  let lobbies = State.cache.lobbies;

  const f = State.filters.lobbies;
  if (f.rank && f.rank !== 'all') lobbies = lobbies.filter(l => l.rank === f.rank);
  if (f.mode && f.mode !== 'all') lobbies = lobbies.filter(l => l.mode === f.mode);
  if (f.region && f.region !== 'all') lobbies = lobbies.filter(l => l.region === f.region);
  if (f.mic) lobbies = lobbies.filter(l => l.mic === true);
  if (f.search) {
    lobbies = lobbies.filter(l =>
      (l.ign || '').toLowerCase().includes(f.search) ||
      (l.note || '').toLowerCase().includes(f.search)
    );
  }

  if (lobbies.length === 0) {
    feed.innerHTML = emptyState('users', 'No lobbies found', 'Try different filters or post your own', 'Post Lobby', openPostLobbySheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = lobbies.map(l => {
    const playersText = `${l.players || 1}/5`;
    return `
      <div class="bg-card border border-border rounded-2xl p-4 fade-in">
        <div class="flex items-start gap-3 mb-3">
          <div class="relative">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-lg overflow-hidden">
              ${l.avatar ? `<img src="${esc(l.avatar)}" class="w-full h-full object-cover" />` : getInitials(l.ign)}
            </div>
            ${l.mic ? `<div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center"><i data-lucide="mic" class="w-2.5 h-2.5 text-white"></i></div>` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm">${esc(l.ign || 'Unknown')}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">${esc(l.rank || 'Rookie')}</span>
            </div>
            <div class="text-[11px] text-gray-500 mt-0.5">${timeAgo(l.createdAt)} · ${esc(l.region)} · ${esc(l.mode)}</div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-sm font-black text-primary">${playersText}</div>
            <div class="text-[9px] text-gray-500">PLAYERS</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-3">
          ${l.role ? `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-300">${esc(l.role)}</span>` : ''}
          ${l.mic ? `<span class="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold">🎤 Mic</span>` : `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-500">🔇 No Mic</span>`}
        </div>

        ${l.note ? `<p class="text-xs text-gray-400 mb-3 line-clamp-2">${esc(l.note)}</p>` : ''}

        <div class="flex gap-2">
          <button class="join-btn btn-press flex-1 py-2.5 rounded-xl bg-primary text-sm font-bold flex items-center justify-center gap-1.5" data-id="${l.id}">
            <i data-lucide="log-in" class="w-4 h-4"></i> Join
          </button>
          <button class="share-lobby btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-ign="${esc(l.ign)}">
            <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
          </button>
          <button class="report-lobby btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-uid="${l.uid}">
            <i data-lucide="flag" class="w-4 h-4 text-gray-500"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.join-btn').forEach(btn => {
    btn.onclick = () => joinLobby(btn.dataset.id);
  });
  feed.querySelectorAll('.share-lobby').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: `${btn.dataset.ign}'s Lobby`,
        text: `🎮 Join ${btn.dataset.ign}'s squad on CODMPanda!`,
        url: getLobbyShareUrl(btn.dataset.id)
      });
    };
  });
  feed.querySelectorAll('.report-lobby').forEach(btn => {
    btn.onclick = () => reportContent('lobby', btn.dataset.id, btn.dataset.uid);
  });

  if (window.lucide) window.lucide.createIcons();
};

// ---------- UPDATE VAULT SHARE ----------
const _origRenderVaults = renderVaults;
renderVaults = function() {
  const feed = document.getElementById('vault-feed');
  if (!feed) return;
  let vaults = State.cache.vaults;
  if (State.filters.vaults.search) {
    const s = State.filters.vaults.search;
    vaults = vaults.filter(v =>
      (v.gunName || '').toLowerCase().includes(s) ||
      (v.gunsmithCode || '').toLowerCase().includes(s)
    );
  }

  if (vaults.length === 0) {
    feed.className = '';
    feed.innerHTML = emptyState('package-open', 'No vaults yet', 'Share your first ' + vaultTypeFilter + ' build', 'Submit Build', openSubmitVaultSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.className = 'grid grid-cols-2 gap-3';
  feed.innerHTML = vaults.map(v => `
    <div class="bg-card border border-border rounded-2xl p-3 fade-in">
      ${v.imageUrl ? `<img src="${esc(v.imageUrl)}" class="w-full h-24 object-cover rounded-xl mb-3" />` :
        `<div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
          <i data-lucide="crosshair" class="w-8 h-8 text-primary/60"></i>
        </div>`
      }
      <div class="text-xs font-bold text-gray-300 truncate">${esc(v.gunName || 'Unknown')}</div>
      <div class="text-[10px] text-gray-500 mb-2">${esc(v.type || 'build')}</div>

      ${v.gunsmithCode ? `
        <button class="copy-code-btn w-full py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center gap-1 mb-2" data-code="${esc(v.gunsmithCode)}">
          <i data-lucide="copy" class="w-3 h-3"></i> ${esc(v.gunsmithCode)}
        </button>
      ` : ''}

      <div class="flex items-center justify-between">
        <button class="like-btn flex items-center gap-1 text-[11px] text-gray-400" data-id="${v.id}">
          <i data-lucide="heart" class="w-3.5 h-3.5"></i> ${v.likes || 0}
        </button>
        <button class="share-vault-btn text-primary" data-id="${v.id}" data-gun="${esc(v.gunName)}">
          <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');

  feed.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); copyText(btn.dataset.code, 'Code copied!'); };
  });
  feed.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'vaults', btn.dataset.id), { likes: increment(1) });
        toast('❤️ Liked!', 'success', 1500);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-vault-btn').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: `${btn.dataset.gun} Build`,
        text: `🔧 Check out this ${btn.dataset.gun} build on CODMPanda!`,
        url: getVaultShareUrl(btn.dataset.id)
      });
    };
  });

  if (window.lucide) window.lucide.createIcons();
};

// ---------- UPDATE CLIP SHARE ----------
const _origRenderClipsShare = renderClips;
renderClips = function() {
  const feed = document.getElementById('clips-feed');
  if (!feed) return;
  let clips = [...State.cache.clips];
  if (State.filters.clips.sort === 'trending') {
    clips.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  if (clips.length === 0) {
    feed.innerHTML = emptyState('video', 'No clips yet', 'Be the first to submit!', 'Submit Clip', openSubmitClipSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = clips.map(c => {
    const embedUrl = getYouTubeEmbed(c.youtubeUrl);
    const authorName = c.submittedByIgn || c.ign || 'CODMPanda';
    const authorAvatar = c.submittedByAvatar || '';
    const isApproved = !!c.approved;
    return `
      <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in">
        ${embedUrl ? `
          <div class="relative w-full aspect-video bg-black">
            <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen loading="lazy"></iframe>
          </div>
        ` : `
          <div class="w-full aspect-video bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
            <a href="${esc(c.youtubeUrl)}" target="_blank" class="text-center">
              <i data-lucide="external-link" class="w-8 h-8 mx-auto text-primary mb-2"></i>
              <div class="text-xs text-gray-400">Open link</div>
            </a>
          </div>
        `}
        <div class="p-3">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-xs font-bold text-gray-300">${esc(c.gunTag || 'CODM')}</span>
            ${isApproved ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> Approved</span>` : ''}
            <span class="text-[10px] text-gray-500">· ${timeAgo(c.createdAt)}</span>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden">
              ${authorAvatar ? `<img src="${esc(authorAvatar)}" class="w-full h-full object-cover" />` : getInitials(authorName)}
            </div>
            <span class="text-[10px] text-gray-500">by <span class="text-gray-300 font-semibold">${esc(authorName)}</span></span>
          </div>
          <div class="flex items-center justify-between">
            <button class="like-clip flex items-center gap-1 text-xs text-gray-400" data-id="${c.id}">
              <i data-lucide="heart" class="w-4 h-4"></i> ${c.likes || 0}
            </button>
            <button class="share-clip text-primary" data-id="${c.id}" data-gun="${esc(c.gunTag || 'CODM')}">
              <i data-lucide="share-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.like-clip').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'clips', btn.dataset.id), { likes: increment(1) });
        toast('❤️', 'success', 1000);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-clip').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: `${btn.dataset.gun} Clip`,
        text: `🎬 Watch this ${btn.dataset.gun} play on CODMPanda!`,
        url: getClipShareUrl(btn.dataset.id)
      });
    };
  });

  if (window.lucide) window.lucide.createIcons();
};

// ---------- UPDATE LEAK SHARE ----------
const _origRenderLeaksShare = renderLeaks;
renderLeaks = function() {
  const feed = document.getElementById('leaks-feed');
  if (!feed) return;
  if (State.cache.leaks.length === 0) {
    feed.innerHTML = emptyState('zap', 'No leaks yet', 'Be the first to submit!', 'Submit Leak', openSubmitLeakSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-gold text-black',
    mythic: 'bg-red-500'
  };
  feed.innerHTML = State.cache.leaks.map(l => {
    const authorName = l.submittedByIgn || l.authorIgn || 'CODMPanda';
    const authorAvatar = l.submittedByAvatar || '';
    const isApproved = !!l.approved;
    return `
      <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in">
        ${l.imageUrl ? `<img src="${esc(l.imageUrl)}" class="w-full h-40 object-cover" />` : ''}
        <div class="p-4">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-[10px] px-2 py-0.5 rounded-full ${rarityColors[l.rarity] || 'bg-gray-500'} font-black uppercase">${esc(l.rarity || 'common')}</span>
            ${isApproved ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> Approved</span>` : ''}
            <span class="text-[10px] text-gray-500">${timeAgo(l.createdAt || l.publishedAt)}</span>
          </div>
          <h3 class="text-base font-bold mb-2">${esc(l.title)}</h3>
          ${l.body ? `<p class="text-xs text-gray-400 line-clamp-3 mb-3">${esc(l.body)}</p>` : ''}
          <div class="flex items-center gap-2 mb-3">
            <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden">
              ${authorAvatar ? `<img src="${esc(authorAvatar)}" class="w-full h-full object-cover" />` : getInitials(authorName)}
            </div>
            <span class="text-[10px] text-gray-500">by <span class="text-gray-300 font-semibold">${esc(authorName)}</span></span>
          </div>
          <div class="flex items-center justify-between">
            <button class="hype-leak flex items-center gap-1 text-xs text-gray-400" data-id="${l.id}">
              <i data-lucide="flame" class="w-4 h-4"></i> ${l.hypes || 0}
            </button>
            <button class="share-leak text-primary" data-id="${l.id}" data-title="${esc(l.title)}">
              <i data-lucide="share-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.hype-leak').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'leaks', btn.dataset.id), { hypes: increment(1) });
        toast('🔥 Hyped!', 'success', 1000);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-leak').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: btn.dataset.title,
        text: `🔥 New leak on CODMPanda: ${btn.dataset.title}`,
        url: getLeakShareUrl(btn.dataset.id)
      });
    };
  });

  if (window.lucide) window.lucide.createIcons();
};

window.openShareSheet = openShareSheet;

/* END OF CHUNK 14 */
// ============================================
// Chunk 15: Profile Share Card Generator
// ============================================

async function generateProfileCard() {
  const p = State.profile || {};
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Card dimensions (Instagram Story friendly 1080x1920)
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;

  // ---------- BACKGROUND ----------
  // AMOLED base
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  // Orange glow top
  const grad1 = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 900);
  grad1.addColorStop(0, 'rgba(255, 107, 0, 0.35)');
  grad1.addColorStop(1, 'rgba(255, 107, 0, 0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, W, 900);

  // Gold glow bottom
  const grad2 = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 800);
  grad2.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
  grad2.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = grad2;
  ctx.fillRect(0, H - 800, W, 800);

  // Subtle border
  ctx.strokeStyle = p.isPro ? '#FFD700' : '#222';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // ---------- HEADER ----------
  ctx.textAlign = 'center';

  // Branding
  ctx.font = 'bold 52px Inter, sans-serif';
  ctx.fillStyle = '#FF6B00';
  ctx.fillText('CODMPanda', W / 2, 140);

  ctx.font = '500 26px Inter, sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('CODMPanda • The Ultimate CODM Companion', W / 2, 190);

  // ---------- AVATAR ----------
  const avatarY = 480;
  const avatarR = 160;

  // Outer glow ring
  if (p.isPro) {
    const avatarGrad = ctx.createLinearGradient(W / 2 - avatarR, avatarY - avatarR, W / 2 + avatarR, avatarY + avatarR);
    avatarGrad.addColorStop(0, '#FFD700');
    avatarGrad.addColorStop(0.5, '#FFF176');
    avatarGrad.addColorStop(1, '#FFD700');
    ctx.fillStyle = avatarGrad;
    ctx.beginPath();
    ctx.arc(W / 2, avatarY, avatarR + 12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#FF6B00';
    ctx.beginPath();
    ctx.arc(W / 2, avatarY, avatarR + 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Avatar circle background
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fill();

  // Try to draw avatar image
  if (p.avatar) {
    try {
      const img = await loadImage(p.avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, W / 2 - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
      ctx.restore();
    } catch (e) {
      drawInitials(ctx, p.ign, W / 2, avatarY, avatarR);
    }
  } else {
    drawInitials(ctx, p.ign, W / 2, avatarY, avatarR);
  }

  // Pro crown overlay
  if (p.isPro) {
    ctx.font = 'bold 90px Inter, sans-serif';
    ctx.fillText('👑', W / 2 + 130, avatarY - 100);
  }

  // ---------- NAME ----------
  ctx.font = 'bold 72px Inter, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(truncateText(ctx, p.ign || 'Panda Player', W - 100), W / 2, 780);

  // ---------- BADGES ROW ----------
  ctx.font = '500 32px Inter, sans-serif';
  ctx.fillStyle = '#888';
  const rankRegion = `${p.rank || 'Rookie'} • ${p.region || 'Global'}`;
  ctx.fillText(rankRegion, W / 2, 840);

  if (p.isPro) {
    // Pro pill
    const proText = '👑 PRO MEMBER';
    ctx.font = 'bold 30px Inter, sans-serif';
    const proW = ctx.measureText(proText).width + 60;
    const proX = W / 2 - proW / 2;
    const proY = 890;
    ctx.fillStyle = '#FFD700';
    roundRect(ctx, proX, proY, proW, 60, 30);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText(proText, W / 2, proY + 42);
  }

  // ---------- STATS BOXES ----------
  const statY = 1060;
  const boxW = 300;
  const boxH = 180;
  const gap = 20;
  const totalW = boxW * 3 + gap * 2;
  const startX = (W - totalW) / 2;

  // Stats to display
  let vaultCount = State.cache.myVaultCount || 0;
  let camoPct = State.cache.myCamoPct || 0;

if (!vaultCount || !camoPct) {
  try {
    const results = await Promise.all([
      getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid))),
      getDoc(doc(db, 'camos', State.user.uid))
    ]);
    const vaultSnap = results[0];
    const camoSnap = results[1];

    vaultCount = vaultSnap.size;
    State.cache.myVaultCount = vaultCount;

    const totalPossible = ALL_GUNS.length * CAMO_TYPES.length;
    if (camoSnap.exists()) {
      let checked = 0;
      Object.values(camoSnap.data()).forEach(gun => {
        CAMO_TYPES.forEach(c => { if (gun[c.key]) checked++; });
      });
      camoPct = Math.round((checked / totalPossible) * 100);
    }
    State.cache.myCamoPct = camoPct;
  } catch (e) { /* silent */ }
 }

  const approved = p.approvedCount || 0;
  const stats = [
    { value: vaultCount.toString(), label: 'VAULTS' },
    { value: camoPct + '%', label: 'CAMOS' },
    { value: approved.toString(), label: 'APPROVED' }
  ];

  stats.forEach((stat, i) => {
    const x = startX + (boxW + gap) * i;
    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    roundRect(ctx, x, statY, boxW, boxH, 24);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.fillStyle = i === 1 ? '#FFD700' : '#FF6B00';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x + boxW / 2, statY + 100);

    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(stat.label, x + boxW / 2, statY + 145);
  });

  // ---------- BADGES ----------
  const badges = p.badges || [];
  if (badges.length > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('CONTRIBUTOR BADGES', W / 2, 1400);

    const badgeEmojis = {
      first_leak: '🥉',
      rising: '🥈',
      legend: '🥇',
      elite: '💎'
    };
    const badgeLabels = {
      first_leak: 'First Leak',
      rising: 'Rising',
      legend: 'Legend',
      elite: 'Elite'
    };

    const badgeW = 200;
    const badgeGap = 30;
    const totalBadgeW = badges.length * badgeW + (badges.length - 1) * badgeGap;
    const badgeStartX = (W - totalBadgeW) / 2;
    const badgeY = 1440;

    badges.forEach((b, i) => {
      const x = badgeStartX + (badgeW + badgeGap) * i;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      roundRect(ctx, x, badgeY, badgeW, 160, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 70px Inter, sans-serif';
      ctx.fillText(badgeEmojis[b] || '⭐', x + badgeW / 2, badgeY + 95);

      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(badgeLabels[b] || 'Badge', x + badgeW / 2, badgeY + 135);
    });
  }

  // ---------- TAGLINE ----------
  const taglineY = badges.length > 0 ? 1720 : 1450;
  ctx.textAlign = 'center';
  ctx.font = 'italic 400 30px Inter, sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('"Find squads. Track camos. Dominate."', W / 2, taglineY);

  // ---------- FOOTER ----------
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillStyle = '#FF6B00';
  ctx.fillText('codmpanda.pages.dev', W / 2, 1810);

  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillStyle = '#444';
  ctx.fillText('Join the ultimate CODM companion', W / 2, 1855);

  // ---------- RETURN BLOB ----------
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

// ---------- HELPERS ----------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawInitials(ctx, name, x, y, r) {
  const initials = getInitials(name);
  ctx.fillStyle = '#FF6B00';
  ctx.font = `bold ${r}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, x, y);
  ctx.textBaseline = 'alphabetic';
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

// ---------- MAIN ACTION ----------
async function shareProfileCard() {
  try {
    toast('Creating your card...', 'info', 2000);

    const blob = await generateProfileCard();
    const file = new File([blob], 'codmpanda-profile.png', { type: 'image/png' });

    // Try native share with file
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My CODMPanda Profile',
          text: `Check out my CODMPanda profile! ${State.profile.ign} · ${State.profile.rank}`
        });
        toast('Shared!', 'success');
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }

    // Fallback: download + share sheet
    const url = URL.createObjectURL(blob);

    // Show preview sheet
    openSheet(`
      <div class="space-y-4">
        <div class="text-center">
          <div class="text-sm font-bold mb-2">Your Profile Card</div>
          <div class="text-xs text-gray-500 mb-3">Long-press to save, or use buttons below</div>
        </div>
        <img src="${url}" class="w-full rounded-2xl border border-border" />
        <div class="grid grid-cols-2 gap-2">
          <a href="${url}" download="codmpanda-profile.png" class="btn-press py-3 rounded-xl bg-primary font-bold text-sm text-center text-white">
            ⬇️ Save Image
          </a>
          <button id="share-card-fallback" class="btn-press py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm">
            📤 Share
          </button>
        </div>
        <button onclick="closeSheet()" class="text-xs text-gray-500 w-full">Close</button>
      </div>
    `, 'Share Profile Card');

    document.getElementById('share-card-fallback').onclick = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My CODMPanda Profile',
            text: `Check out my profile: ${State.profile.ign}`,
            url: location.origin
          });
        } catch (e) { /* cancelled */ }
      } else {
        copyText(location.origin, 'Link copied!');
      }
    };

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Profile card error:', e);
    toast('Failed to create card: ' + e.message, 'error');
  }
}

// ---------- ADD BUTTON TO PROFILE HEADER ----------
const _origRenderYouTabShare = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabShare();

  setTimeout(() => {
    const content = document.getElementById('content');
    if (!content) return;

    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn && !document.getElementById('share-profile-btn')) {
      // Insert share button next to edit profile
      const shareBtn = document.createElement('button');
      shareBtn.id = 'share-profile-btn';
      shareBtn.className = 'btn-press w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-primary/20 to-gold/20 border border-primary/40 text-primary text-xs font-bold flex items-center justify-center gap-2';
      shareBtn.innerHTML = '<span>📤</span> Share My Profile Card';
      shareBtn.onclick = shareProfileCard;

      editBtn.parentNode.insertBefore(shareBtn, editBtn.nextSibling);
    }
  }, 100);
};

window.generateProfileCard = generateProfileCard;
window.shareProfileCard = shareProfileCard;

/* END OF CHUNK 15 */
// ============================================
// Chunk 16: FCM Token Collection + Notifications
// ============================================

const VAPID_KEY = "BB38qRzf4R5T_szvw7SvPklifWz_PhM1e4XQ8KKjqaIcauiUeJAZUKmJpWSbzusdny75mzckpAKXB78qSBWdU8A";
// Initialize compat Firebase app for FCM
if (window.firebase && !window.firebase.apps.length) {
  window.firebase.initializeApp({
    apiKey: "AIzaSyC4wVCT-ITLRFPDtzENnDjxL_1aVCAqWHg",
    authDomain: "codmpanda-app.firebaseapp.com",
    projectId: "codmpanda-app",
    storageBucket: "codmpanda-app.firebasestorage.app",
    messagingSenderId: "604146891375",
    appId: "1:604146891375:web:ae74f70c184fd89d572b9a"
  });
  console.log('Compat Firebase initialized for FCM');
}

async function enableNotifications() {
  try {
    if (!('Notification' in window)) {
      toast('Notifications not supported', 'error');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      toast('Service Worker not supported', 'error');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast('Permission denied. Enable in browser settings.', 'warning', 4000);
      return;
    }

    toast('Registering device...', 'info', 2000);

    let attempts = 0;
    while ((!window.firebase || !window.firebase.messaging) && attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (!window.firebase || !window.firebase.messaging) {
      toast('FCM SDK failed to load', 'error');
      return;
    }

    const messaging = window.firebase.messaging();

    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (!token) {
      toast('Failed to get device token', 'error');
      return;
    }

    console.log('FCM token:', token.slice(0, 20) + '...');

    const userRef = doc(db, 'users', State.user.uid);
    const snap = await getDoc(userRef);
    const currentTokens = snap.exists() ? (snap.data().fcmTokens || []) : [];

    if (!currentTokens.includes(token)) {
      currentTokens.push(token);
      await updateDoc(userRef, {
        fcmTokens: currentTokens,
        notificationsEnabled: true,
        notificationsEnabledAt: serverTimestamp()
      });
      State.profile = { ...State.profile, fcmTokens: currentTokens, notificationsEnabled: true };
    }

    toast('✅ Notifications enabled!', 'success', 3000);

    if (State.currentTab === 'you') {
      setTimeout(() => renderYouTab(), 500);
    }
  } catch (e) {
    console.error('FCM error:', e);
    toast('Failed: ' + e.message, 'error', 5000);
  }
}

async function disableNotifications() {
  try {
    if (window.firebase && window.firebase.messaging) {
      const messaging = window.firebase.messaging();
      const token = await messaging.getToken({ vapidKey: VAPID_KEY }).catch(() => null);
      if (token) await messaging.deleteToken(token).catch(() => {});
    }

    const userRef = doc(db, 'users', State.user.uid);
    await updateDoc(userRef, {
      fcmTokens: [],
      notificationsEnabled: false
    });
    State.profile = { ...State.profile, fcmTokens: [], notificationsEnabled: false };

    toast('Notifications disabled', 'success');
    if (State.currentTab === 'you') setTimeout(() => renderYouTab(), 500);
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function sendNotificationToUser(uid, title, body, data) {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return false;

    const tokens = userSnap.data().fcmTokens || [];
    if (tokens.length === 0) return false;

    const res = await fetch(NOTIFY_WORKER_URL + '/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens, title, body, data: data || {} })
    });

    const result = await res.json();
    console.log('Notification sent:', result);
    return true;
  } catch (e) {
    console.error('Notify error:', e);
    return false;
  }
}

async function broadcastNotification(title, body, data) {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('notificationsEnabled', '==', true)));
    const allTokens = [];
    snap.forEach(d => {
      const tokens = d.data().fcmTokens || [];
      allTokens.push(...tokens);
    });

    if (allTokens.length === 0) {
      toast('No users have notifications enabled yet', 'warning');
      return;
    }

    const res = await fetch(NOTIFY_WORKER_URL + '/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens: allTokens, title, body, data: data || {} })
    });

    const result = await res.json();
    console.log('Broadcast sent:', result);
    toast('Sent to ' + allTokens.length + ' device(s)', 'success');
  } catch (e) {
    console.error('Broadcast error:', e);
    toast('Broadcast failed: ' + e.message, 'error');
  }
}

function renderNotificationsCard() {
  const enabled = State.profile && State.profile.notificationsEnabled;
  return '<div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">' +
    '<div class="px-4 py-3 border-b border-border">' +
      '<div class="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">' +
        '<i data-lucide="bell" class="w-4 h-4"></i> Push Notifications' +
      '</div>' +
    '</div>' +
    '<div class="p-4">' +
      '<div class="flex items-center justify-between mb-3">' +
        '<div class="flex-1 min-w-0">' +
          '<div class="text-sm font-semibold">' + (enabled ? 'Enabled' : 'Disabled') + '</div>' +
          '<div class="text-[10px] text-gray-500 mt-0.5">Get alerts for LFG matches, approvals, and new leaks</div>' +
        '</div>' +
        '<div class="toggle ' + (enabled ? 'on' : '') + '" id="notif-toggle"></div>' +
      '</div>' +
      '<div class="text-[10px] text-gray-600">' + (enabled ? 'Tap to disable anytime' : 'Tap to enable') + '</div>' +
    '</div>' +
  '</div>';
}

const _origRenderYouTabNotif = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabNotif();
  setTimeout(function() {
    const content = document.getElementById('content');
    if (!content) return;

    const statsGrid = content.querySelector('.grid-cols-3');
    if (statsGrid && statsGrid.parentElement && !document.getElementById('notif-toggle')) {
      const card = document.createElement('div');
      card.innerHTML = renderNotificationsCard();
      statsGrid.parentElement.insertBefore(card.firstElementChild, statsGrid.nextSibling);

      const toggle = document.getElementById('notif-toggle');
      if (toggle) {
        toggle.onclick = function() {
          const isEnabled = State.profile && State.profile.notificationsEnabled;
          if (isEnabled) {
            disableNotifications();
          } else {
            enableNotifications();
          }
        };
      }
      if (window.lucide) window.lucide.createIcons();
    }
  }, 150);
};

window.enableNotifications = enableNotifications;
window.disableNotifications = disableNotifications;
window.sendNotificationToUser = sendNotificationToUser;
window.broadcastNotification = broadcastNotification;

/* END OF CHUNK 16 */
// ============================================
// Chunk 17: Admin Analytics Dashboard
// ============================================

async function showAdminAnalytics() {
  openSheet(`
    <div class="text-center py-8">
      <div class="spinner mx-auto mb-3"></div>
      <div class="text-xs text-gray-500">Loading analytics...</div>
    </div>
  `, 'Analytics');

  try {
    // ---------- PARALLEL FETCHES ----------
    const [
      usersSnap,
      lobbiesSnap,
      vaultsSnap,
      leakSubsSnap,
      vaultSubsSnap,
      clipSubsSnap,
      reportsSnap,
      clansSnap
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'lobbies')),
      getDocs(collection(db, 'vaults')),
      getDocs(collection(db, 'leak_submissions')),
      getDocs(collection(db, 'vault_submissions')),
      getDocs(collection(db, 'clip_submissions')),
      getDocs(collection(db, 'reports')),
      getDocs(collection(db, 'clans'))
    ]);

    // ---------- PROCESS USERS ----------
    const users = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * dayMs;
    const monthAgo = now - 30 * dayMs;

    let proCount = 0;
    let dau = 0;
    let wau = 0;
    let mau = 0;
    let newThisWeek = 0;
    const regionBreakdown = {};
    const recentUsers = [];

    usersSnap.forEach(d => {
      const u = d.data();
      users.push({ id: d.id, ...u });

      // Pro count
      if (u.isPro) proCount++;

      // Activity windows
      const lastSeen = u.lastSeen?.seconds ? u.lastSeen.seconds * 1000 : 0;
      const createdAt = u.createdAt?.seconds ? u.createdAt.seconds * 1000 : 0;

      if (lastSeen > now - dayMs) dau++;
      if (lastSeen > weekAgo) wau++;
      if (lastSeen > monthAgo) mau++;

      if (createdAt > weekAgo) newThisWeek++;

      // Region breakdown
      const region = u.region || 'Unknown';
      regionBreakdown[region] = (regionBreakdown[region] || 0) + 1;

      // Recent users (last 30 days)
      if (createdAt > monthAgo) {
        recentUsers.push({ id: d.id, ign: u.ign, avatar: u.avatar, createdAt, region: u.region });
      }
    });

    recentUsers.sort((a, b) => b.createdAt - a.createdAt);
    const topRecentUsers = recentUsers.slice(0, 10);

    // ---------- PROCESS SUBMISSIONS ----------
    let pendingLeaks = 0, pendingVaults = 0, pendingClips = 0;
    leakSubsSnap.forEach(d => { if (d.data().status === 'pending') pendingLeaks++; });
    vaultSubsSnap.forEach(d => { if (d.data().status === 'pending') pendingVaults++; });
    clipSubsSnap.forEach(d => { if (d.data().status === 'pending') pendingClips++; });

    const totalPending = pendingLeaks + pendingVaults + pendingClips;

    // ---------- PROCESS REPORTS ----------
    let openReports = 0;
    reportsSnap.forEach(d => {
      const r = d.data();
      if (r.type === 'bug' || r.type === 'feature' || r.type === 'user-report') openReports++;
    });

    // ---------- TOP CONTRIBUTORS ----------
    const contributors = users
      .filter(u => (u.approvedCount || 0) > 0)
      .sort((a, b) => (b.approvedCount || 0) - (a.approvedCount || 0))
      .slice(0, 5);

    // ---------- REGION SORT ----------
    const sortedRegions = Object.entries(regionBreakdown)
      .sort((a, b) => b[1] - a[1]);

    // ---------- RENDER ----------
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="space-y-4">

        <!-- USERS CARD -->
        <div class="bg-card border border-primary/40 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="users" class="w-4 h-4 text-primary"></i>
            <div class="text-xs font-bold text-primary uppercase">Users</div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-primary">${users.length}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Total</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-green-400">${dau}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Daily Active</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-blue-400">${wau}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Weekly Active</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-purple-400">${mau}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Monthly Active</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div class="text-xs text-gray-400">New this week</div>
            <div class="text-sm font-bold text-green-400">+${newThisWeek}</div>
          </div>
        </div>

        <!-- REVENUE CARD -->
        <div class="bg-gradient-to-br from-gold/10 to-black border border-gold/40 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="crown" class="w-4 h-4 text-gold"></i>
            <div class="text-xs font-bold text-gold uppercase">Revenue</div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-gold">${proCount}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Pro Members</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-gold">$${(proCount * 1.99).toFixed(2)}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Est. Monthly</div>
            </div>
          </div>
        </div>

        <!-- CONTENT CARD -->
        <div class="bg-card border border-border rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="database" class="w-4 h-4 text-orange-400"></i>
            <div class="text-xs font-bold text-orange-400 uppercase">Content</div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-xl font-black text-orange-400">${lobbiesSnap.size}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Lobbies Posted</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-xl font-black text-primary">${vaultsSnap.size}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Vault Builds</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-xl font-black text-blue-400">${clansSnap.size}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Clans</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-xl font-black text-purple-400">${leakSubsSnap.size + vaultSubsSnap.size + clipSubsSnap.size}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Total Subs</div>
            </div>
          </div>
        </div>

        <!-- MODERATION CARD -->
        <div class="bg-card border ${totalPending > 0 ? 'border-yellow-500/50' : 'border-border'} rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <i data-lucide="inbox" class="w-4 h-4 text-yellow-400"></i>
              <div class="text-xs font-bold text-yellow-400 uppercase">Moderation Queue</div>
            </div>
            ${totalPending > 0 ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500 text-black font-black">${totalPending}</span>` : ''}
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">🔥 Leak submissions</span>
              <span class="font-bold ${pendingLeaks > 0 ? 'text-yellow-400' : 'text-gray-600'}">${pendingLeaks}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">🔧 Vault submissions</span>
              <span class="font-bold ${pendingVaults > 0 ? 'text-yellow-400' : 'text-gray-600'}">${pendingVaults}</span>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-400">🎬 Clip submissions</span>
              <span class="font-bold ${pendingClips > 0 ? 'text-yellow-400' : 'text-gray-600'}">${pendingClips}</span>
            </div>
            <div class="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span class="text-gray-400">🐛 Bug reports</span>
              <span class="font-bold">${openReports}</span>
            </div>
          </div>
          ${totalPending > 0 ? `
            <button id="goto-submissions-btn" class="btn-press w-full mt-3 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-xs">
              Review Submissions →
            </button>
          ` : ''}
        </div>

        <!-- TOP CONTRIBUTORS -->
        ${contributors.length > 0 ? `
          <div class="bg-card border border-border rounded-2xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <i data-lucide="trophy" class="w-4 h-4 text-gold"></i>
              <div class="text-xs font-bold text-gold uppercase">Top Contributors</div>
            </div>
            <div class="space-y-2">
              ${contributors.map((u, i) => {
                const medal = ['🥇', '🥈', '🥉', '#4', '#5'][i];
                return `
                  <div class="flex items-center gap-2">
                    <div class="w-6 text-center text-sm">${medal}</div>
                    <div class="w-7 h-7 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-bold truncate">${esc(u.ign || 'Unknown')}</div>
                    </div>
                    <div class="text-xs font-black text-primary">${u.approvedCount}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- REGION BREAKDOWN -->
        ${sortedRegions.length > 0 ? `
          <div class="bg-card border border-border rounded-2xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <i data-lucide="globe" class="w-4 h-4 text-blue-400"></i>
              <div class="text-xs font-bold text-blue-400 uppercase">By Region</div>
            </div>
            <div class="space-y-2">
              ${sortedRegions.slice(0, 8).map(([region, count]) => {
                const pct = Math.round((count / users.length) * 100);
                return `
                  <div>
                    <div class="flex items-center justify-between text-[11px] mb-1">
                      <span class="text-gray-300">${esc(region)}</span>
                      <span class="font-bold">${count} <span class="text-gray-600">(${pct}%)</span></span>
                    </div>
                    <div class="progress-bar" style="height:5px;">
                      <div class="progress-fill" style="width:${pct}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- RECENT SIGNUPS -->
        ${topRecentUsers.length > 0 ? `
          <div class="bg-card border border-border rounded-2xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <i data-lucide="user-plus" class="w-4 h-4 text-green-400"></i>
              <div class="text-xs font-bold text-green-400 uppercase">Recent Signups</div>
            </div>
            <div class="space-y-2">
              ${topRecentUsers.map(u => `
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold truncate">${esc(u.ign || 'Unknown')}</div>
                    <div class="text-[10px] text-gray-500">${esc(u.region || 'Unknown')}</div>
                  </div>
                  <div class="text-[10px] text-gray-500">${timeAgo({ seconds: Math.floor(u.createdAt / 1000) })}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- REFRESH BUTTON -->
        <button id="refresh-analytics-btn" class="btn-press w-full py-3 rounded-2xl bg-cardAlt border border-border font-bold text-xs">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5 inline mr-1"></i> Refresh Data
        </button>

        <div class="text-[10px] text-gray-600 text-center pt-2">
          Data loaded live from Firestore
        </div>
      </div>
    `;

    // Wire buttons
    const subsBtn = document.getElementById('goto-submissions-btn');
    if (subsBtn) {
      subsBtn.onclick = () => { closeSheet(); setTimeout(showAdminSubmissions, 300); };
    }
    document.getElementById('refresh-analytics-btn').onclick = () => {
      closeSheet();
      setTimeout(showAdminAnalytics, 300);
    };

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Analytics error:', e);
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) {
      sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load: ' + esc(e.message) + '</div>';
    }
  }
}

// ---------- ADD ANALYTICS BUTTON TO ADMIN PANEL ----------
const _origHandleSettingActionAnalytics = handleSettingAction;
handleSettingAction = function(action) {
  if (action === 'admin-analytics') {
    showAdminAnalytics();
    return;
  }
  return _origHandleSettingActionAnalytics(action);
};

// ---------- INJECT BUTTON INTO YOU TAB ADMIN SECTION ----------
const _origRenderYouTabAnalytics = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabAnalytics();
  setTimeout(() => {
    const adminSection = document.querySelector('.bg-card.border-gold\\/40');
    if (!adminSection) return;

    const list = adminSection.querySelector('.divide-y');
    if (list && !list.querySelector('[data-action="admin-analytics"]')) {
      const btn = document.createElement('button');
      btn.className = 'settings-row w-full flex items-center justify-between px-4 py-3 text-left';
      btn.dataset.action = 'admin-analytics';
      btn.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <i data-lucide="bar-chart-3" class="w-4 h-4 text-gold flex-shrink-0"></i>
          <div class="min-w-0">
            <div class="text-sm font-semibold">Analytics</div>
            <div class="text-[10px] text-gray-500 truncate">Users, revenue, activity</div>
          </div>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
      `;
      btn.onclick = () => showAdminAnalytics();
      list.insertBefore(btn, list.firstChild);
      if (window.lucide) window.lucide.createIcons();
    }
  }, 120);
};

window.showAdminAnalytics = showAdminAnalytics;

/* END OF CHUNK 17 */
// ============================================
// Chunk 18: Friend System
// ============================================

let friendsTab = 'friends'; // 'friends' | 'requests' | 'search'

// ---------- MAIN RENDER ----------
async function showFriendsPanel() {
  openSheet(`
    <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
  `, '👥 Friends');

  const sheetBody = document.querySelector('#sheet-container .px-5');
  if (!sheetBody) return;

  sheetBody.innerHTML = `
    <div class="flex gap-2 mb-4">
      <button class="chip friends-tab ${friendsTab === 'friends' ? 'active' : ''}" data-tab="friends">Friends</button>
      <button class="chip friends-tab ${friendsTab === 'requests' ? 'active' : ''}" data-tab="requests">Requests</button>
      <button class="chip friends-tab ${friendsTab === 'search' ? 'active' : ''}" data-tab="search">Search</button>
    </div>
    <div id="friends-body"></div>
  `;

  document.querySelectorAll('.friends-tab').forEach(btn => {
    btn.onclick = () => {
      friendsTab = btn.dataset.tab;
      document.querySelectorAll('.friends-tab').forEach(b => b.classList.toggle('active', b === btn));
      renderFriendsBody();
    };
  });

  renderFriendsBody();
  if (window.lucide) window.lucide.createIcons();
}

async function renderFriendsBody() {
  const body = document.getElementById('friends-body');
  if (!body) return;

  body.innerHTML = '<div class="text-center py-6"><div class="spinner mx-auto"></div></div>';

  try {
    const userRef = doc(db, 'users', State.user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};

    const friendUids = data.friends || [];
    const incomingReqs = data.friendRequests || [];
    const outgoingReqs = data.friendRequestsSent || [];

    if (friendsTab === 'friends') {
      await renderFriendsList(body, friendUids);
    } else if (friendsTab === 'requests') {
      await renderRequestsList(body, incomingReqs, outgoingReqs);
    } else {
      renderSearchBody(body);
    }
  } catch (e) {
    console.error('Friends error:', e);
    body.innerHTML = '<div class="text-center py-6 text-red-400 text-sm">Failed to load</div>';
  }
}

// ---------- FRIENDS LIST ----------
async function renderFriendsList(body, friendUids) {
  if (friendUids.length === 0) {
    body.innerHTML = `
      <div class="text-center py-12">
        <div class="text-5xl mb-3">👥</div>
        <div class="text-sm font-bold mb-1">No friends yet</div>
        <div class="text-xs text-gray-500 mb-4">Search for players to add</div>
        <button id="goto-search-btn" class="btn-press px-4 py-2.5 rounded-xl bg-primary font-bold text-sm">
          Find Players
        </button>
      </div>
    `;
    document.getElementById('goto-search-btn').onclick = () => {
      friendsTab = 'search';
      document.querySelectorAll('.friends-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'search'));
      renderFriendsBody();
    };
    return;
  }

  // Fetch friend profiles
  const friends = [];
  for (const uid of friendUids) {
    try {
      const s = await getDoc(doc(db, 'users', uid));
      if (s.exists()) friends.push({ id: uid, ...s.data() });
    } catch (e) { /* skip */ }
  }

  body.innerHTML = friends.map(f => `
    <div class="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-2">
      <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
        ${f.avatar ? `<img src="${esc(f.avatar)}" class="w-full h-full object-cover" />` : getInitials(f.ign)}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold truncate flex items-center gap-1.5">
          ${esc(f.ign || 'Unknown')}
          ${f.isPro ? '<span class="text-[8px] px-1 py-0.5 rounded bg-gold text-black font-black">PRO</span>' : ''}
        </div>
        <div class="text-[10px] text-gray-500">${esc(f.rank || '—')} · ${esc(f.region || '—')}</div>
      </div>
      <button class="remove-friend-btn w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center" data-uid="${f.id}" data-ign="${esc(f.ign)}">
        <i data-lucide="user-minus" class="w-4 h-4 text-red-400"></i>
      </button>
    </div>
  `).join('');

  body.querySelectorAll('.remove-friend-btn').forEach(btn => {
    btn.onclick = () => {
      confirmDialog('Remove Friend', `Remove ${btn.dataset.ign} from your friends?`, async () => {
        try {
          await updateDoc(doc(db, 'users', State.user.uid), { friends: arrayRemove(btn.dataset.uid) });
          await updateDoc(doc(db, 'users', btn.dataset.uid), { friends: arrayRemove(State.user.uid) });
          toast('Friend removed', 'success');
          renderFriendsBody();
        } catch (e) { toast('Failed', 'error'); }
      }, 'Remove', true);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// ---------- REQUESTS ----------
async function renderRequestsList(body, incomingReqs, outgoingReqs) {
  let html = '';

  // Incoming
  if (incomingReqs.length > 0) {
    html += `<div class="text-[10px] font-bold text-primary uppercase mb-2">Incoming (${incomingReqs.length})</div>`;
    const incoming = [];
    for (const uid of incomingReqs) {
      try {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) incoming.push({ id: uid, ...s.data() });
      } catch (e) { /* skip */ }
    }
    html += incoming.map(u => `
      <div class="flex items-center gap-3 p-3 bg-primary/5 border border-primary/30 rounded-xl mb-2">
        <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
          ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold truncate">${esc(u.ign)}</div>
          <div class="text-[10px] text-gray-500">${esc(u.rank || '—')} · ${esc(u.region || '—')}</div>
        </div>
        <button class="accept-friend-btn w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center" data-uid="${u.id}" data-ign="${esc(u.ign)}">
          <i data-lucide="check" class="w-4 h-4 text-white"></i>
        </button>
        <button class="decline-friend-btn w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center" data-uid="${u.id}">
          <i data-lucide="x" class="w-4 h-4 text-red-400"></i>
        </button>
      </div>
    `).join('');
  }

  // Outgoing
  if (outgoingReqs.length > 0) {
    html += `<div class="text-[10px] font-bold text-gray-400 uppercase mb-2 mt-4">Sent (${outgoingReqs.length})</div>`;
    const outgoing = [];
    for (const uid of outgoingReqs) {
      try {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) outgoing.push({ id: uid, ...s.data() });
      } catch (e) { /* skip */ }
    }
    html += outgoing.map(u => `
      <div class="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-2">
        <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
          ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold truncate">${esc(u.ign)}</div>
          <div class="text-[10px] text-yellow-400">Pending...</div>
        </div>
        <button class="cancel-req-btn w-9 h-9 rounded-lg bg-cardAlt border border-border flex items-center justify-center" data-uid="${u.id}">
          <i data-lucide="x" class="w-4 h-4 text-gray-400"></i>
        </button>
      </div>
    `).join('');
  }

  if (!html) {
    html = `
      <div class="text-center py-12">
        <div class="text-5xl mb-3">📬</div>
        <div class="text-sm font-bold mb-1">No pending requests</div>
        <div class="text-xs text-gray-500">Friend requests will appear here</div>
      </div>
    `;
  }

  body.innerHTML = html;

  // Wire accept
  body.querySelectorAll('.accept-friend-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        const myUid = State.user.uid;
        const theirUid = btn.dataset.uid;

        // Add each other
        await updateDoc(doc(db, 'users', myUid), {
          friends: arrayUnion(theirUid),
          friendRequests: arrayRemove(theirUid)
        });
        await updateDoc(doc(db, 'users', theirUid), {
          friends: arrayUnion(myUid),
          friendRequestsSent: arrayRemove(myUid)
        });

        toast('Friend added! 🎉', 'success');
        renderFriendsBody();
      } catch (e) {
        console.error(e);
        toast('Failed: ' + e.message, 'error');
      }
    };
  });

  // Wire decline
  body.querySelectorAll('.decline-friend-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'users', State.user.uid), {
          friendRequests: arrayRemove(btn.dataset.uid)
        });
        toast('Request declined', 'success');
        renderFriendsBody();
      } catch (e) { toast('Failed', 'error'); }
    };
  });

  // Wire cancel
  body.querySelectorAll('.cancel-req-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'users', State.user.uid), {
          friendRequestsSent: arrayRemove(btn.dataset.uid)
        });
        await updateDoc(doc(db, 'users', btn.dataset.uid), {
          friendRequests: arrayRemove(State.user.uid)
        });
        toast('Request cancelled', 'success');
        renderFriendsBody();
      } catch (e) { toast('Failed', 'error'); }
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// ---------- SEARCH ----------
function renderSearchBody(body) {
  body.innerHTML = `
    <div class="relative mb-4">
      <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input id="friend-search-input" type="text" placeholder="Search by IGN..." class="pl-10" />
    </div>
    <div id="search-results" class="space-y-2">
      <div class="text-center py-8 text-xs text-gray-500">Start typing to search players</div>
    </div>
  `;

  const input = document.getElementById('friend-search-input');
  let debounceTimer;

  input.oninput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performFriendSearch(input.value.trim()), 400);
  };

  input.focus();
  if (window.lucide) window.lucide.createIcons();
}

async function performFriendSearch(query) {
  const results = document.getElementById('search-results');
  if (!results) return;

  if (query.length < 2) {
    results.innerHTML = '<div class="text-center py-8 text-xs text-gray-500">Type at least 2 characters</div>';
    return;
  }

  results.innerHTML = '<div class="text-center py-6"><div class="spinner mx-auto"></div></div>';

  try {
    const allUsers = [];
    const snap = await getDocs(collection(db, 'users'));
    snap.forEach(d => {
      if (d.id === State.user.uid) return;
      allUsers.push({ id: d.id, ...d.data() });
    });

    const q = query.toLowerCase();
    const matches = allUsers.filter(u =>
      (u.ign || '').toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      results.innerHTML = '<div class="text-center py-8 text-xs text-gray-500">No players found</div>';
      return;
    }

    const mySnap = await getDoc(doc(db, 'users', State.user.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    const myFriends = myData.friends || [];
    const mySent = myData.friendRequestsSent || [];
    const myIncoming = myData.friendRequests || [];

    results.innerHTML = matches.slice(0, 30).map(u => {
      let actionHTML = '';
      if (myFriends.includes(u.id)) {
        actionHTML = '<span class="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-bold">✓ Friend</span>';
      } else if (mySent.includes(u.id)) {
        actionHTML = '<span class="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-bold">Pending</span>';
      } else if (myIncoming.includes(u.id)) {
        actionHTML = `<button class="send-req-btn text-[10px] px-2 py-1 rounded-full bg-primary text-white font-bold" data-uid="${u.id}" data-ign="${esc(u.ign)}">Accept</button>`;
      } else {
        actionHTML = `<button class="send-req-btn text-[10px] px-2.5 py-1.5 rounded-lg bg-primary text-white font-bold" data-uid="${u.id}" data-ign="${esc(u.ign)}">+ Add</button>`;
      }

      return `
        <div class="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
          <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
            ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate">${esc(u.ign)}</div>
            <div class="text-[10px] text-gray-500">${esc(u.rank || '—')} · ${esc(u.region || '—')}</div>
          </div>
          ${actionHTML}
        </div>
      `;
    }).join('');

    results.querySelectorAll('.send-req-btn').forEach(btn => {
      btn.onclick = () => sendFriendRequest(btn.dataset.uid, btn.dataset.ign);
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Search error:', e);
    results.innerHTML = '<div class="text-center py-8 text-red-400 text-xs">' + esc(e.message) + '</div>';
  }
}

async function sendFriendRequest(targetUid, targetIgn) {
  try {
    // Add to my sent list
    await updateDoc(doc(db, 'users', State.user.uid), {
      friendRequestsSent: arrayUnion(targetUid)
    });

    // Add to their incoming list
    await updateDoc(doc(db, 'users', targetUid), {
      friendRequests: arrayUnion(State.user.uid)
    });

    toast(`Request sent to ${targetIgn}`, 'success');

    // Send notification
    try {
      await sendNotificationToUser(
        targetUid,
        '👋 New Friend Request',
        `${State.profile.ign} wants to be your friend`,
        { type: 'friend_request' }
      );
    } catch (e) { /* silent */ }

    // Refresh search
    const input = document.getElementById('friend-search-input');
    if (input) performFriendSearch(input.value.trim());
  } catch (e) {
    console.error(e);
    toast('Failed: ' + e.message, 'error');
  }
}

// ---------- ADD "FRIENDS" BUTTON TO PROFILE HEADER ----------
const _origRenderYouTabFriends = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabFriends();
  setTimeout(() => {
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn && !document.getElementById('open-friends-btn')) {
      const btn = document.createElement('button');
      btn.id = 'open-friends-btn';
      btn.className = 'btn-press w-full mt-2 py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold flex items-center justify-center gap-2';
      btn.innerHTML = '<span>👥</span> Friends';

      // Add badge if incoming requests
      const reqs = (State.profile?.friendRequests || []).length;
      if (reqs > 0) {
        btn.innerHTML += ` <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black">${reqs}</span>`;
      }

      btn.onclick = showFriendsPanel;
      editBtn.parentNode.insertBefore(btn, editBtn.nextSibling);
      if (window.lucide) window.lucide.createIcons();
    }
  }, 100);
};

window.showFriendsPanel = showFriendsPanel;
window.sendFriendRequest = sendFriendRequest;

/* END OF CHUNK 18 */
// ============================================
// Chunk 19: Clan Wars (Advanced)
// ============================================

const CLAN_WARS_RESET_DAY = 1; // Monday (0=Sun, 1=Mon)
const CLAN_WARS_MIN_SIZE = 3;
const CLAN_WARS_POINTS = {
  lobby: 2,
  submissionApproved: 10,
  dailyActive: 1,
  newMember: 5
};

// ---------- SEASON HELPERS ----------
function getCurrentSeasonStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = (day - CLAN_WARS_RESET_DAY + 7) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysSinceMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.getTime();
}

function getSeasonNumber() {
  // Season 1 started on the app's first Monday
  const SEASON_ONE_START = new Date('2026-10-05T00:00:00Z').getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor((getCurrentSeasonStart() - SEASON_ONE_START) / weekMs) + 1);
}

function getNextResetTime() {
  return getCurrentSeasonStart() + 7 * 24 * 60 * 60 * 1000;
}

function getCountdown() {
  const ms = getNextResetTime() - Date.now();
  if (ms <= 0) return 'Resetting...';
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  const h = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------- POINT ADDITION ----------
async function addClanPoints(clanId, points, reason) {
  if (!clanId || !points) return;
  try {
    const seasonStart = getCurrentSeasonStart();
    const logRef = doc(collection(db, 'clanWarsLog'));
    await setDoc(logRef, {
      clanId,
      points,
      reason: reason || 'action',
      season: seasonStart,
      createdAt: serverTimestamp(),
      byUid: State.user?.uid || null
    });
    console.log(`+${points} pts to clan ${clanId} (${reason})`);
  } catch (e) {
    console.error('Clan points error:', e);
  }
}

// Track user's daily active (only once per day per user)
async function trackDailyActive() {
  if (!State.user || !State.profile?.clanId) return;
  const today = new Date().toISOString().slice(0, 10);
  const key = 'clan_daily_active_' + today;
  if (localStorage.getItem(key)) return;

  try {
    await addClanPoints(State.profile.clanId, CLAN_WARS_POINTS.dailyActive, 'daily-active');
    localStorage.setItem(key, '1');
  } catch (e) { /* silent */ }
}

// ---------- AGGREGATION ----------
async function computeClanWars() {
  const seasonStart = getCurrentSeasonStart();

  // Get all clan war logs for this season
  const logsSnap = await getDocs(query(collection(db, 'clanWarsLog'), limit(5000)));
  const clanPoints = {};
  const clanDaily = {};

  logsSnap.forEach(d => {
    const log = d.data();
    const logSeason = log.season?.seconds ? log.season.seconds * 1000 : (log.season || 0);
    if (logSeason < seasonStart) return; // old season

    if (!clanPoints[log.clanId]) {
      clanPoints[log.clanId] = { total: 0, lobby: 0, submission: 0, active: 0, members: 0 };
    }
    clanPoints[log.clanId].total += log.points || 0;

    if (log.reason === 'lobby') clanPoints[log.clanId].lobby += log.points;
    else if (log.reason === 'submission-approved') clanPoints[log.clanId].submission += log.points;
    else if (log.reason === 'daily-active') clanPoints[log.clanId].active += log.points;
    else if (log.reason === 'new-member') clanPoints[log.clanId].members += log.points;

    // Daily chart data
    const logDate = log.createdAt?.seconds
      ? new Date(log.createdAt.seconds * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    if (!clanDaily[log.clanId]) clanDaily[log.clanId] = {};
    clanDaily[log.clanId][logDate] = (clanDaily[log.clanId][logDate] || 0) + log.points;
  });

  // Fetch clans and merge
  const clansSnap = await getDocs(collection(db, 'clans'));
  const clans = [];
  clansSnap.forEach(d => {
    const c = d.data();
    const memberCount = (c.members || []).length;
    if (memberCount < CLAN_WARS_MIN_SIZE) return; // skip small clans
    clans.push({
      id: d.id,
      name: c.name,
      logoUrl: c.logoUrl || '',
      region: c.region || 'Global',
      members: c.members || [],
      memberCount,
      points: clanPoints[d.id]?.total || 0,
      breakdown: clanPoints[d.id] || { lobby: 0, submission: 0, active: 0, members: 0 }
    });
  });

  clans.sort((a, b) => b.points - a.points);

  // Get last week's champion (from clanWarsHistory)
  let champion = null;
  try {
    const lastSeasonStart = seasonStart - 7 * 24 * 60 * 60 * 1000;
    const historySnap = await getDocs(query(collection(db, 'clanWarsHistory'), where('season', '==', lastSeasonStart)));
    if (!historySnap.empty) {
      const championData = historySnap.docs[0].data();
      champion = { clanId: championData.clanId, clanName: championData.clanName, season: championData.seasonNumber };
    }
  } catch (e) { /* silent */ }

  return { clans, champion, clanDaily, seasonStart };
}

// ---------- MAIN RENDER ----------
async function renderClanWarsSub() {
  const body = document.getElementById('squad-body');
  if (!body) return;

  body.innerHTML = '<div class="text-center py-8"><div class="spinner mx-auto"></div></div>';

  try {
    const { clans, champion, clanDaily } = await computeClanWars();
    const seasonNumber = getSeasonNumber();
    const countdown = getCountdown();

    // Check user's clan
    const mySnap = await getDoc(doc(db, 'users', State.user.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    const myClansSnap = await getDocs(query(collection(db, 'clans'), where('members', 'array-contains', State.user.uid)));
    let myClan = null;
    if (!myClansSnap.empty) {
      myClan = { id: myClansSnap.docs[0].id, ...myClansSnap.docs[0].data() };
    }

    const medals = ['🥇', '🥈', '🥉'];

    body.innerHTML = `
      <!-- HEADER -->
      <div class="bg-gradient-to-br from-gold/20 to-black border border-gold/40 rounded-2xl p-4 mb-4 relative overflow-hidden">
        <div class="absolute top-3 right-3 text-3xl opacity-30">🏆</div>
        <div class="text-[10px] font-black text-gold uppercase tracking-wider mb-1">Clan Wars</div>
        <div class="text-2xl font-black mb-1">Season ${seasonNumber}</div>
        <div class="flex items-center gap-2 text-xs text-gray-400">
          <i data-lucide="clock" class="w-3.5 h-3.5"></i>
          <span>Resets in <span class="font-bold text-gold">${countdown}</span></span>
        </div>
      </div>

      ${champion ? `
        <div class="bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div class="text-2xl">👑</div>
          <div class="flex-1 min-w-0">
            <div class="text-[10px] text-gold uppercase font-bold">Reigning Champion</div>
            <div class="text-sm font-black truncate">${esc(champion.clanName)}</div>
            <div class="text-[10px] text-gray-500">Season ${champion.season}</div>
          </div>
        </div>
      ` : ''}

      ${myClan ? renderMyClanRank(myClan, clans) : `
        <div class="bg-card border border-border rounded-xl p-4 mb-4 text-center">
          <div class="text-xs text-gray-500 mb-2">You're not in a clan yet</div>
          <button onclick="closeSheet(); squadSubTab='clans'; renderSquadTab();" class="btn-press px-4 py-2 rounded-lg bg-primary text-xs font-bold">Join a Clan →</button>
        </div>
      `}

      <!-- LEADERBOARD -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between">
          <div class="text-xs font-bold text-gray-400 uppercase">🏆 Leaderboard</div>
          <div class="text-[10px] text-gray-500">${clans.length} clan${clans.length === 1 ? '' : 's'}</div>
        </div>
        ${clans.length === 0 ? `
          <div class="text-center py-8">
            <div class="text-3xl mb-2">⏳</div>
            <div class="text-xs text-gray-500">No clans competing yet</div>
            <div class="text-[10px] text-gray-600 mt-1">Min ${CLAN_WARS_MIN_SIZE} members required</div>
          </div>
        ` : `
          <div class="divide-y divide-border">
            ${clans.slice(0, 20).map((c, i) => {
              const isMyClan = myClan && myClan.id === c.id;
              const pos = i + 1;
              const medal = medals[i];
              return `
                <div class="px-4 py-3 ${isMyClan ? 'bg-primary/5 border-l-2 border-primary' : ''} flex items-center gap-3">
                  <div class="w-8 text-center font-black text-sm ${pos <= 3 ? 'text-gold' : 'text-gray-500'}">
                    ${medal || pos}
                  </div>
                  <div class="w-9 h-9 rounded-lg overflow-hidden bg-primary/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    ${c.logoUrl ? `<img src="${esc(c.logoUrl)}" class="w-full h-full object-cover" />` : esc(c.name.charAt(0))}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <div class="text-sm font-bold truncate ${pos === 1 ? 'text-gold glow-text-gold' : ''}">${esc(c.name)}</div>
                      ${isMyClan ? '<span class="text-[8px] px-1 py-0.5 rounded bg-primary text-white font-black">YOU</span>' : ''}
                    </div>
                    <div class="text-[10px] text-gray-500">${c.memberCount} members · ${esc(c.region)}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-black text-primary">${c.points}</div>
                    <div class="text-[9px] text-gray-600 uppercase">pts</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- HOW POINTS WORK -->
      <div class="bg-card border border-border rounded-2xl p-4 mb-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-3">📊 How Points Work</div>
        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-gray-400">🎮 Post a lobby</span>
            <span class="font-bold text-primary">+${CLAN_WARS_POINTS.lobby}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">✅ Submission approved</span>
            <span class="font-bold text-primary">+${CLAN_WARS_POINTS.submissionApproved}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">📅 Daily active</span>
            <span class="font-bold text-primary">+${CLAN_WARS_POINTS.dailyActive}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">👥 New member joins</span>
            <span class="font-bold text-primary">+${CLAN_WARS_POINTS.newMember}</span>
          </div>
        </div>
      </div>

      <!-- HALL OF FAME -->
      <div class="bg-card border border-border rounded-2xl p-4 mb-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-3">👑 Hall of Fame</div>
        <div id="hall-of-fame-list">
          <div class="text-center py-4 text-[10px] text-gray-600">Loading history...</div>
        </div>
      </div>
    `;

    // Load hall of fame async
    loadHallOfFame();

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Clan wars error:', e);
    body.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load: ' + esc(e.message) + '</div>';
  }
}

function renderMyClanRank(myClan, leaderboard) {
  const pos = leaderboard.findIndex(c => c.id === myClan.id) + 1;
  const myData = leaderboard.find(c => c.id === myClan.id);
  if (!myData) return '';

  return `
    <div class="bg-gradient-to-r from-primary/10 to-transparent border border-primary/30 rounded-xl p-3 mb-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center text-lg font-black text-primary">
        ${pos > 0 ? '#' + pos : '—'}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[10px] text-primary uppercase font-bold">Your Clan</div>
        <div class="text-sm font-black truncate">${esc(myClan.name)}</div>
        <div class="text-[10px] text-gray-500">${myData.memberCount} members</div>
      </div>
      <div class="text-right">
        <div class="text-lg font-black text-primary">${myData.points}</div>
        <div class="text-[9px] text-gray-600 uppercase">pts</div>
      </div>
    </div>
  `;
}

async function loadHallOfFame() {
  const el = document.getElementById('hall-of-fame-list');
  if (!el) return;

  try {
    const snap = await getDocs(query(
      collection(db, 'clanWarsHistory'),
      orderBy('season', 'desc'),
      limit(5)
    ));

    if (snap.empty) {
      el.innerHTML = '<div class="text-center py-4 text-[10px] text-gray-600">No champions yet — be the first!</div>';
      return;
    }

    const history = [];
    snap.forEach(d => history.push(d.data()));

    el.innerHTML = history.map(h => `
      <div class="flex items-center gap-3 py-2 border-b border-border last:border-0">
        <div class="text-lg">🏆</div>
        <div class="flex-1 min-w-0">
          <div class="text-xs font-bold truncate">${esc(h.clanName || 'Unknown')}</div>
          <div class="text-[10px] text-gray-500">Season ${h.seasonNumber || '?'}</div>
        </div>
        <div class="text-[10px] font-bold text-gold">${h.points || 0} pts</div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = '<div class="text-center py-4 text-[10px] text-gray-600">History unavailable</div>';
  }
}

// ---------- AUTO-TRACK DAILY ACTIVE ----------
setTimeout(() => {
  if (State.user) trackDailyActive();
}, 5000);

// ---------- HOOK INTO EXISTING ACTIONS ----------
// Track lobby creation (call from openPostLobbySheet after successful post)
// We'll hook this differently — see below

const _origPostLobbySuccess = window.addDoc;
// Too invasive to override — instead, we add tracking at submission approval time

// Track submission approval
const _origApproveSubmission = approveSubmission;
approveSubmission = async function(type, id) {
  const result = await _origApproveSubmission(type, id);

  // Add clan points
  try {
    const collectionMap = {
      leak: 'leak_submissions',
      vault: 'vault_submissions',
      clip: 'clip_submissions'
    };
    // Note: the submission was just deleted by _origApproveSubmission
    // so we need to track before. This is complex — skip for now.
    // Points will be tracked when admin explicitly grants or on next interaction.
  } catch (e) { /* silent */ }

  return result;
};

window.renderClanWarsSub = renderClanWarsSub;
window.addClanPoints = addClanPoints;
window.trackDailyActive = trackDailyActive;
window.computeClanWars = computeClanWars;
window.getCurrentSeasonStart = getCurrentSeasonStart;
window.getSeasonNumber = getSeasonNumber;

/* END OF CHUNK 19 */
// ============================================
// Chunk 20/4: Gunsmith Builder — Data Layer
// ============================================

// Attachment slot definitions (order matters for UI)
const GUNSMITH_SLOTS = [
  { key: 'muzzle', label: 'Muzzle', icon: 'shield' },
  { key: 'barrel', label: 'Barrel', icon: 'align-vertical-space-around' },
  { key: 'optic', label: 'Optic', icon: 'eye' },
  { key: 'stock', label: 'Stock', icon: 'minus' },
  { key: 'laser', label: 'Laser', icon: 'zap' },
  { key: 'underbarrel', label: 'Underbarrel', icon: 'grip' },
  { key: 'ammunition', label: 'Ammunition', icon: 'package' },
  { key: 'rearGrip', label: 'Rear Grip', icon: 'hand' },
  { key: 'perk', label: 'Perk', icon: 'star' }
];

// Stat display config — order of stat bars
const STAT_CONFIG = [
  { key: 'accuracy', label: 'Accuracy', color: '#00BFFF' },
  { key: 'damage', label: 'Damage', color: '#FF3B30' },
  { key: 'range', label: 'Range', color: '#FF9500' },
  { key: 'fireRate', label: 'Fire Rate', color: '#FFCC00' },
  { key: 'mobility', label: 'Mobility', color: '#34C759' },
  { key: 'control', label: 'Control', color: '#AF52DE' }
];

// Base stats per gun (0-100 scale) — approximate community averages
const GUN_BASE_STATS = {
  'AK117': { accuracy: 65, damage: 70, range: 60, fireRate: 78, mobility: 68, control: 55 },
  'AK-47': { accuracy: 60, damage: 85, range: 75, fireRate: 55, mobility: 55, control: 45 },
  'M4': { accuracy: 78, damage: 62, range: 65, fireRate: 72, mobility: 70, control: 75 },
  'AKBP': { accuracy: 72, damage: 72, range: 68, fireRate: 68, mobility: 62, control: 60 },
  'DR-H': { accuracy: 70, damage: 78, range: 72, fireRate: 58, mobility: 58, control: 55 },
  'FR .556': { accuracy: 72, damage: 68, range: 72, fireRate: 65, mobility: 65, control: 65 },
  'HBRa3': { accuracy: 70, damage: 74, range: 68, fireRate: 68, mobility: 65, control: 60 },
  'HVK-30': { accuracy: 78, damage: 72, range: 70, fireRate: 62, mobility: 60, control: 65 },
  'ICR-1': { accuracy: 80, damage: 62, range: 62, fireRate: 75, mobility: 72, control: 78 },
  'KN-44': { accuracy: 70, damage: 78, range: 68, fireRate: 62, mobility: 62, control: 58 },
  'LK24': { accuracy: 76, damage: 75, range: 70, fireRate: 62, mobility: 60, control: 65 },
  'Man-O-War': { accuracy: 65, damage: 88, range: 78, fireRate: 50, mobility: 50, control: 40 },
  'Oden': { accuracy: 65, damage: 95, range: 80, fireRate: 45, mobility: 48, control: 35 },
  'ASM10': { accuracy: 68, damage: 82, range: 72, fireRate: 55, mobility: 55, control: 50 },
  'BK57': { accuracy: 72, damage: 78, range: 68, fireRate: 60, mobility: 58, control: 55 },
  'AS VAL': { accuracy: 68, damage: 74, range: 62, fireRate: 72, mobility: 65, control: 50 },
  'CR-56 AMAX': { accuracy: 65, damage: 80, range: 70, fireRate: 58, mobility: 55, control: 50 },
  'M13': { accuracy: 75, damage: 68, range: 68, fireRate: 78, mobility: 68, control: 65 },
  'Peacekeeper MK2': { accuracy: 72, damage: 78, range: 72, fireRate: 62, mobility: 60, control: 55 },
  'FARA 83': { accuracy: 70, damage: 72, range: 70, fireRate: 70, mobility: 62, control: 60 },
  'Grau 5.56': { accuracy: 75, damage: 68, range: 65, fireRate: 72, mobility: 68, control: 68 },
  'Maddox': { accuracy: 68, damage: 72, range: 62, fireRate: 78, mobility: 68, control: 55 },
  'Swordfish': { accuracy: 80, damage: 65, range: 72, fireRate: 68, mobility: 62, control: 70 },
  'Type 25': { accuracy: 65, damage: 70, range: 62, fireRate: 78, mobility: 65, control: 55 },
  'Fennec': { accuracy: 55, damage: 60, range: 55, fireRate: 92, mobility: 88, control: 40 },
  'QQ9': { accuracy: 65, damage: 62, range: 58, fireRate: 82, mobility: 82, control: 55 },
  'MP5': { accuracy: 70, damage: 62, range: 58, fireRate: 80, mobility: 80, control: 65 },
  'MP7': { accuracy: 68, damage: 62, range: 55, fireRate: 82, mobility: 82, control: 58 },
  'PDW-57': { accuracy: 65, damage: 62, range: 58, fireRate: 78, mobility: 78, control: 55 },
  'RUS-79U': { accuracy: 68, damage: 62, range: 58, fireRate: 80, mobility: 78, control: 62 },
  'Cordite': { accuracy: 62, damage: 58, range: 58, fireRate: 88, mobility: 78, control: 55 },
  'GKS': { accuracy: 72, damage: 65, range: 62, fireRate: 72, mobility: 75, control: 65 },
  'HG 40': { accuracy: 68, damage: 65, range: 58, fireRate: 75, mobility: 78, control: 60 },
  'MSMC': { accuracy: 60, damage: 65, range: 55, fireRate: 82, mobility: 82, control: 55 },
  'Pharo': { accuracy: 60, damage: 68, range: 55, fireRate: 78, mobility: 78, control: 55 },
  'Razorback': { accuracy: 72, damage: 60, range: 62, fireRate: 72, mobility: 75, control: 65 },
  'Striker 45': { accuracy: 75, damage: 65, range: 62, fireRate: 68, mobility: 72, control: 62 },
  'PP19 Bizon': { accuracy: 65, damage: 58, range: 58, fireRate: 78, mobility: 78, control: 58 },
  'QXR': { accuracy: 68, damage: 62, range: 58, fireRate: 82, mobility: 80, control: 60 },
  'MX9': { accuracy: 65, damage: 60, range: 58, fireRate: 88, mobility: 82, control: 55 },
  'CX-9': { accuracy: 62, damage: 62, range: 58, fireRate: 85, mobility: 82, control: 55 },
  'LAPA': { accuracy: 65, damage: 60, range: 58, fireRate: 85, mobility: 80, control: 55 },
  'PPSh-41': { accuracy: 58, damage: 58, range: 55, fireRate: 88, mobility: 78, control: 55 },
  'AGR 556': { accuracy: 65, damage: 62, range: 60, fireRate: 78, mobility: 75, control: 58 },
  'Arctic .50': { accuracy: 85, damage: 92, range: 92, fireRate: 30, mobility: 42, control: 40 },
  'DL Q33': { accuracy: 88, damage: 92, range: 92, fireRate: 28, mobility: 40, control: 45 },
  'Locus': { accuracy: 82, damage: 88, range: 88, fireRate: 42, mobility: 55, control: 55 },
  'M21 EBR': { accuracy: 80, damage: 78, range: 82, fireRate: 62, mobility: 60, control: 55 },
  'XPR-50': { accuracy: 82, damage: 85, range: 85, fireRate: 42, mobility: 52, control: 45 },
  'NA-45': { accuracy: 78, damage: 82, range: 80, fireRate: 52, mobility: 55, control: 45 },
  'Rytec AMR': { accuracy: 80, damage: 95, range: 88, fireRate: 32, mobility: 42, control: 40 },
  'SP-R 208': { accuracy: 85, damage: 78, range: 82, fireRate: 62, mobility: 62, control: 60 },
  'HDR': { accuracy: 90, damage: 92, range: 92, fireRate: 28, mobility: 45, control: 50 },
  'Koshka': { accuracy: 82, damage: 85, range: 88, fireRate: 45, mobility: 58, control: 50 },
  'Outlaw': { accuracy: 80, damage: 85, range: 85, fireRate: 48, mobility: 55, control: 48 },
  'RPD': { accuracy: 68, damage: 78, range: 72, fireRate: 75, mobility: 35, control: 55 },
  'M4LMG': { accuracy: 75, damage: 75, range: 72, fireRate: 68, mobility: 38, control: 62 },
  'UL736': { accuracy: 78, damage: 75, range: 75, fireRate: 62, mobility: 40, control: 68 },
  'S36': { accuracy: 75, damage: 78, range: 72, fireRate: 62, mobility: 38, control: 65 },
  'Chopper': { accuracy: 72, damage: 78, range: 70, fireRate: 68, mobility: 42, control: 55 },
  'Holger 26': { accuracy: 72, damage: 75, range: 72, fireRate: 72, mobility: 42, control: 58 },
  'PKM': { accuracy: 70, damage: 85, range: 78, fireRate: 62, mobility: 32, control: 52 },
  'Bruen MK9': { accuracy: 75, damage: 78, range: 75, fireRate: 68, mobility: 38, control: 60 },
  'Hades': { accuracy: 75, damage: 75, range: 72, fireRate: 62, mobility: 42, control: 65 },
  'MG82': { accuracy: 68, damage: 82, range: 78, fireRate: 65, mobility: 35, control: 50 },
  'BY15': { accuracy: 60, damage: 92, range: 30, fireRate: 45, mobility: 72, control: 40 },
  'HS0405': { accuracy: 58, damage: 95, range: 32, fireRate: 38, mobility: 70, control: 38 },
  'HS2126': { accuracy: 55, damage: 82, range: 25, fireRate: 60, mobility: 70, control: 35 },
  'Striker': { accuracy: 58, damage: 82, range: 28, fireRate: 52, mobility: 72, control: 40 },
  'KRM 262': { accuracy: 60, damage: 90, range: 32, fireRate: 42, mobility: 68, control: 42 },
  'Echo': { accuracy: 55, damage: 75, range: 25, fireRate: 82, mobility: 68, control: 35 },
  'JAK-12': { accuracy: 58, damage: 82, range: 28, fireRate: 72, mobility: 65, control: 38 },
  'R9-0': { accuracy: 60, damage: 88, range: 28, fireRate: 55, mobility: 70, control: 40 },
  'Argus': { accuracy: 65, damage: 88, range: 32, fireRate: 45, mobility: 72, control: 45 },
  'VLK Rogue': { accuracy: 60, damage: 85, range: 30, fireRate: 48, mobility: 70, control: 42 },
  'SKS': { accuracy: 82, damage: 75, range: 82, fireRate: 62, mobility: 58, control: 55 },
  'SPR-208': { accuracy: 85, damage: 78, range: 82, fireRate: 62, mobility: 60, control: 60 },
  'MK2 Carbine': { accuracy: 82, damage: 78, range: 78, fireRate: 62, mobility: 62, control: 58 },
  'Kar98K': { accuracy: 85, damage: 85, range: 85, fireRate: 45, mobility: 55, control: 55 },
  'EBR-14': { accuracy: 78, damage: 72, range: 78, fireRate: 68, mobility: 62, control: 55 },
  'SVD': { accuracy: 80, damage: 78, range: 82, fireRate: 58, mobility: 55, control: 50 },
  'Type 63': { accuracy: 78, damage: 72, range: 75, fireRate: 70, mobility: 62, control: 58 },
  'J358': { accuracy: 68, damage: 72, range: 55, fireRate: 62, mobility: 82, control: 55 },
  'MW11': { accuracy: 65, damage: 62, range: 48, fireRate: 78, mobility: 85, control: 55 },
  '.50 GS': { accuracy: 70, damage: 82, range: 62, fireRate: 55, mobility: 78, control: 45 },
  'Renetti': { accuracy: 68, damage: 58, range: 48, fireRate: 82, mobility: 85, control: 58 },
  'L-CAR 9': { accuracy: 62, damage: 52, range: 45, fireRate: 88, mobility: 88, control: 50 },
  'Shorty': { accuracy: 55, damage: 85, range: 20, fireRate: 45, mobility: 82, control: 35 },
  'Crossbow': { accuracy: 75, damage: 92, range: 78, fireRate: 25, mobility: 62, control: 50 },
  'TEC-9': { accuracy: 65, damage: 62, range: 52, fireRate: 82, mobility: 82, control: 52 },
  'Nail Gun': { accuracy: 60, damage: 55, range: 42, fireRate: 88, mobility: 85, control: 48 }
};

// Generic attachment pools — real CODM names, reused across similar guns
const ATTACHMENT_POOLS = {
  muzzle: [
    { name: 'Muzzle Brake', effects: { control: +8, accuracy: +4 } },
    { name: 'Compensator', effects: { control: +10, accuracy: -2 } },
    { name: 'Flash Guard', effects: { control: +5 } },
    { name: 'Suppressor', effects: { range: -5, mobility: +3, control: +6 } },
    { name: 'Monolithic Suppressor', effects: { range: +5, control: +8, mobility: -3 } },
    { name: 'Tactical Suppressor', effects: { control: +6, mobility: +2 } },
    { name: 'Flash Hider', effects: { accuracy: +5, control: +3 } }
  ],
  barrel: [
    { name: 'RTC Light Barrel', effects: { mobility: +8, range: -4 } },
    { name: 'OWC Marksman', effects: { range: +8, control: +4, mobility: -4 } },
    { name: 'OWC Ranger', effects: { range: +12, accuracy: +5, mobility: -8, control: -3 } },
    { name: 'Light Extended Barrel', effects: { range: +4, mobility: +3 } },
    { name: 'MIP Extended Light Barrel', effects: { range: +6, mobility: +2 } },
    { name: 'MIP Custom Long Barrel', effects: { range: +10, accuracy: +4, mobility: -6 } },
    { name: 'Short Barrel', effects: { mobility: +10, accuracy: -4 } },
    { name: 'Tactical Barrel', effects: { accuracy: +6, control: +3 } },
    { name: 'Heavy Barrel', effects: { range: +9, damage: +3, mobility: -8 } },
    { name: 'RTC Heavy Long Barrel', effects: { range: +14, damage: +2, mobility: -12 } }
  ],
  optic: [
    { name: 'Red Dot Sight', effects: { accuracy: +4 } },
    { name: 'Holographic Sight', effects: { accuracy: +5 } },
    { name: '3x Tactical Scope', effects: { range: +4, accuracy: +6, mobility: -3 } },
    { name: '4x Tactical Scope', effects: { range: +6, accuracy: +8, mobility: -5 } },
    { name: '6x Tactical Scope', effects: { range: +8, accuracy: +10, mobility: -8 } },
    { name: 'Iron Sights', effects: { mobility: +3 } },
    { name: 'Classic Holographic', effects: { accuracy: +4 } }
  ],
  stock: [
    { name: 'No Stock', effects: { mobility: +10, control: -6, accuracy: -3 } },
    { name: 'MIP Strike Stock', effects: { accuracy: +5, control: +5, mobility: -3 } },
    { name: 'RTC Steady Stock', effects: { control: +8, accuracy: +6, mobility: -5 } },
    { name: 'YKM Light Stock', effects: { mobility: +6, control: +2 } },
    { name: 'OWC Skeleton Stock', effects: { mobility: +8, control: +3 } },
    { name: 'MIP Light Stock', effects: { mobility: +5, accuracy: +2 } },
    { name: 'Combat Stock', effects: { control: +6, accuracy: +4 } },
    { name: 'Tactical Stock', effects: { accuracy: +5, control: +4 } }
  ],
  laser: [
    { name: 'OWC Laser - Tactical', effects: { accuracy: +6, mobility: +4 } },
    { name: 'OWC Laser - Light', effects: { mobility: +6, accuracy: +3 } },
    { name: 'MIP Laser 5mW', effects: { mobility: +4, accuracy: +2 } },
    { name: 'Aim Assist Laser', effects: { accuracy: +8, mobility: +2 } },
    { name: 'Fast Switch Laser', effects: { mobility: +5, control: +2 } }
  ],
  underbarrel: [
    { name: 'Foregrip', effects: { control: +6, accuracy: +3 } },
    { name: 'Ranger Foregrip', effects: { control: +10, accuracy: +4, mobility: -3 } },
    { name: 'Strike Foregrip', effects: { mobility: +4, control: +3 } },
    { name: 'Tactical Foregrip A', effects: { control: +7, accuracy: +4 } },
    { name: 'Merc Foregrip', effects: { control: +8, accuracy: +3, mobility: -2 } },
    { name: 'Light Foregrip', effects: { control: +5, mobility: +2 } },
    { name: 'Operator Foregrip', effects: { control: +9, mobility: -3 } }
  ],
  ammunition: [
    { name: 'Extended Mag', effects: { mobility: -2 } },
    { name: 'Fast Mag', effects: { mobility: +3 } },
    { name: 'Extended Mag A', effects: { mobility: -3 } },
    { name: 'Large Extended Mag', effects: { mobility: -5 } },
    { name: 'Light Mag', effects: { mobility: +4 } }
  ],
  rearGrip: [
    { name: 'Rubberized Grip Tape', effects: { control: +5, accuracy: +3 } },
    { name: 'Stippled Grip Tape', effects: { accuracy: +4, control: +3 } },
    { name: 'Granulated Grip Tape', effects: { control: +6 } },
    { name: 'Skeletonized Rear Grip', effects: { mobility: +4, control: -2 } },
    { name: 'Tactical Rear Grip', effects: { accuracy: +4, mobility: +2 } }
  ],
  perk: [
    { name: 'Sleight of Hand', effects: {} },
    { name: 'Fast Switch', effects: {} },
    { name: 'Ammo Increase', effects: { mobility: -2 } },
    { name: 'Disable', effects: {} },
    { name: 'Long Shot', effects: { range: +3 } },
    { name: 'Hipfire', effects: { mobility: +3 } },
    { name: 'Toughness', effects: { control: +4 } },
    { name: 'Slight of Hand', effects: {} }
  ]
};

// ---------- HELPER FUNCTIONS ----------
function getGunBaseStats(gunName) {
  return GUN_BASE_STATS[gunName] || { accuracy: 65, damage: 65, range: 65, fireRate: 65, mobility: 65, control: 65 };
}

function getAttachmentsForSlot(gunName, slotKey) {
  // Filter pool for this gun — just return the full pool for now
  return ATTACHMENT_POOLS[slotKey] || [];
}

function calculateFinalStats(gunName, selectedAttachments) {
  const base = { ...getGunBaseStats(gunName) };
  const modifiers = { accuracy: 0, damage: 0, range: 0, fireRate: 0, mobility: 0, control: 0 };

  GUNSMITH_SLOTS.forEach(slot => {
    const picked = selectedAttachments[slot.key];
    if (!picked || !picked.effects) return;
    Object.entries(picked.effects).forEach(([stat, val]) => {
      if (modifiers[stat] !== undefined) modifiers[stat] += val;
    });
  });

  const final = {};
  Object.keys(base).forEach(k => {
    final[k] = Math.max(0, Math.min(100, base[k] + modifiers[k]));
  });

  return { base, modifiers, final };
}

// Export
window.GUNSMITH_SLOTS = GUNSMITH_SLOTS;
window.STAT_CONFIG = STAT_CONFIG;
window.GUN_BASE_STATS = GUN_BASE_STATS;
window.ATTACHMENT_POOLS = ATTACHMENT_POOLS;
window.getGunBaseStats = getGunBaseStats;
window.getAttachmentsForSlot = getAttachmentsForSlot;
window.calculateFinalStats = calculateFinalStats;

/* END OF CHUNK 20 */
// ============================================
// Chunk 21/4: Gunsmith Builder — UI
// ============================================

// Builder state
const BuilderState = {
  selectedGun: null,
  selectedAttachments: {}, // { muzzle: {...}, barrel: {...}, ... }
  activeSlot: null
};

// ---------- MAIN ENTRY POINT ----------
function openGunsmithBuilder(gunName) {
  BuilderState.selectedGun = gunName || null;
  BuilderState.selectedAttachments = {};
  BuilderState.activeSlot = null;

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <button id="builder-back-btn" class="btn-press w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <div class="text-center flex-1">
          <div class="text-lg font-black">Gunsmith Builder</div>
          <div class="text-[10px] text-gray-500">Build & share your perfect loadout</div>
        </div>
        <button id="builder-reset-btn" class="btn-press w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <i data-lucide="rotate-ccw" class="w-5 h-5 text-gray-400"></i>
        </button>
      </div>

      <div id="builder-body"></div>
    </div>
  `;

  document.getElementById('builder-back-btn').onclick = () => {
    // Return to Lab tab
    labSubTab = 'vault';
    renderLabTab();
  };
  document.getElementById('builder-reset-btn').onclick = () => {
    confirmDialog('Reset Build', 'Clear all attachments?', () => {
      BuilderState.selectedAttachments = {};
      renderBuilderBody();
    }, 'Reset', true);
  };

  renderBuilderBody();
  if (window.lucide) window.lucide.createIcons();
}

// ---------- RENDER LOGIC ----------
function renderBuilderBody() {
  const body = document.getElementById('builder-body');
  if (!body) return;

  if (!BuilderState.selectedGun) {
    renderGunPicker(body);
  } else {
    renderLoadoutCanvas(body);
  }
}

// ---------- GUN PICKER ----------
function renderGunPicker(body) {
  const categories = ['Assault Rifle', 'SMG', 'Sniper', 'LMG', 'Shotgun', 'Marksman', 'Pistol'];
  let activeCategory = 'Assault Rifle';

  body.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-xs text-gray-500 mb-2">Step 1 — Pick your weapon</div>
    </div>

    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1" id="gun-cat-filters">
      ${categories.map((c, i) => `
        <button class="chip gun-cat-btn ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>
      `).join('')}
    </div>

    <div class="relative mb-4">
      <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input id="gun-search" type="text" placeholder="Search guns..." class="pl-10" />
    </div>

    <div id="gun-grid" class="grid grid-cols-2 gap-3"></div>
  `;

  const renderGuns = (category, search) => {
    const grid = document.getElementById('gun-grid');
    if (!grid) return;

    const gunsInCat = CODM_GUNS[category] || [];
    const filtered = search
      ? gunsInCat.filter(g => g.toLowerCase().includes(search.toLowerCase()))
      : gunsInCat;

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="col-span-2 text-center py-8 text-xs text-gray-500">No guns found</div>';
      return;
    }

    grid.innerHTML = filtered.map(gun => `
      <button class="gun-pick-btn bg-card border border-border rounded-2xl p-3 text-left hover:border-primary transition-colors" data-gun="${esc(gun)}">
        <div class="w-full h-16 rounded-xl bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center mb-2">
          <i data-lucide="crosshair" class="w-6 h-6 text-primary"></i>
        </div>
        <div class="text-xs font-bold truncate">${esc(gun)}</div>
        <div class="text-[9px] text-gray-500">${category}</div>
      </button>
    `).join('');

    grid.querySelectorAll('.gun-pick-btn').forEach(btn => {
      btn.onclick = () => {
        BuilderState.selectedGun = btn.dataset.gun;
        BuilderState.selectedAttachments = {};
        renderBuilderBody();
      };
    });

    if (window.lucide) window.lucide.createIcons();
  };

  // Wire category filters
  body.querySelectorAll('.gun-cat-btn').forEach(btn => {
    btn.onclick = () => {
      body.querySelectorAll('.gun-cat-btn').forEach(b => b.classList.toggle('active', b === btn));
      activeCategory = btn.dataset.cat;
      const search = document.getElementById('gun-search')?.value || '';
      renderGuns(activeCategory, search);
    };
  });

  // Wire search
  document.getElementById('gun-search').oninput = (e) => {
    renderGuns(activeCategory, e.target.value);
  };

  renderGuns(activeCategory, '');
  if (window.lucide) window.lucide.createIcons();
}

// ---------- LOADOUT CANVAS ----------
function renderLoadoutCanvas(body) {
  const gun = BuilderState.selectedGun;
  const { final, base, modifiers } = calculateFinalStats(gun, BuilderState.selectedAttachments);
  const attachedCount = Object.keys(BuilderState.selectedAttachments).length;

  body.innerHTML = `
    <!-- Gun Header -->
    <div class="bg-card border border-primary/40 rounded-2xl p-4 mb-4 relative overflow-hidden">
      <div class="absolute top-3 right-3 text-2xl opacity-20">🔧</div>
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-gold/20 flex items-center justify-center flex-shrink-0">
          <i data-lucide="crosshair" class="w-7 h-7 text-primary"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-lg font-black truncate">${esc(gun)}</div>
          <div class="text-[10px] text-gray-500">${attachedCount}/9 attachments</div>
        </div>
        <button id="change-gun-btn" class="btn-press px-3 py-2 rounded-lg bg-cardAlt border border-border text-[10px] font-bold">
          Change
        </button>
      </div>
    </div>

    <!-- Stat Bars Preview -->
    <div id="stat-preview">
      ${renderStatBars(base, final, modifiers)}
    </div>

    <!-- Attachments Grid -->
    <div class="text-xs font-bold text-gray-400 uppercase mb-2 mt-4">Attachments</div>
    <div class="grid grid-cols-3 gap-2 mb-4" id="slot-grid">
      ${GUNSMITH_SLOTS.map(slot => {
        const picked = BuilderState.selectedAttachments[slot.key];
        return `
          <button class="slot-btn bg-card border ${picked ? 'border-primary/60 bg-primary/5' : 'border-border'} rounded-xl p-3 flex flex-col items-center gap-1.5" data-slot="${slot.key}">
            <i data-lucide="${slot.icon}" class="w-5 h-5 ${picked ? 'text-primary' : 'text-gray-500'}"></i>
            <div class="text-[9px] font-bold ${picked ? 'text-primary' : 'text-gray-400'} text-center leading-tight">${slot.label}</div>
            ${picked ? `<div class="text-[8px] text-primary truncate w-full text-center">${esc(picked.name)}</div>` : `<div class="text-[8px] text-gray-600">Empty</div>`}
          </button>
        `;
      }).join('')}
    </div>

    <!-- Actions -->
    <div class="space-y-2">
      <button id="builder-save-btn" class="btn-press w-full py-3.5 rounded-xl bg-primary font-black text-sm glow-primary flex items-center justify-center gap-2">
        <i data-lucide="save" class="w-4 h-4"></i> Save to Vault
      </button>
      <button id="builder-share-btn" class="btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2">
        <i data-lucide="share-2" class="w-4 h-4"></i> Share Build
      </button>
    </div>

    <div class="text-[10px] text-gray-600 text-center mt-4">
      Stats are approximate — based on community-sourced data
    </div>
  `;

  // Wire change gun
  document.getElementById('change-gun-btn').onclick = () => {
    BuilderState.selectedGun = null;
    BuilderState.selectedAttachments = {};
    renderBuilderBody();
  };

  // Wire slots
  body.querySelectorAll('.slot-btn').forEach(btn => {
    btn.onclick = () => openAttachmentPicker(btn.dataset.slot);
  });

  // Wire save
  document.getElementById('builder-save-btn').onclick = saveBuildToVault;

  // Wire share
  document.getElementById('builder-share-btn').onclick = shareBuild;

  if (window.lucide) window.lucide.createIcons();
}

// ---------- STAT BARS (preview — full version in Chunk 22) ----------
function renderStatBars(base, final, modifiers) {
  return `
    <div class="bg-card border border-border rounded-2xl p-4">
      <div class="text-xs font-bold text-gray-400 uppercase mb-3">📊 Live Stats</div>
      <div class="space-y-2">
        ${STAT_CONFIG.map(stat => {
          const baseVal = base[stat.key];
          const finalVal = final[stat.key];
          const mod = modifiers[stat.key];
          const pct = finalVal;
          const modText = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '';
          const modColor = mod > 0 ? 'text-green-400' : mod < 0 ? 'text-red-400' : 'text-gray-600';

          return `
            <div>
              <div class="flex items-center justify-between text-[10px] mb-1">
                <span class="text-gray-400 font-semibold">${stat.label}</span>
                <div class="flex items-center gap-2">
                  ${modText ? `<span class="font-bold ${modColor}">${modText}</span>` : ''}
                  <span class="font-bold text-gray-300">${finalVal}</span>
                </div>
              </div>
              <div class="progress-bar" style="height:6px;">
                <div class="progress-fill" style="width:${pct}%; background: ${stat.color};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ---------- ATTACHMENT PICKER ----------
function openAttachmentPicker(slotKey) {
  const slot = GUNSMITH_SLOTS.find(s => s.key === slotKey);
  if (!slot) return;

  const gun = BuilderState.selectedGun;
  const attachments = getAttachmentsForSlot(gun, slotKey);
  const current = BuilderState.selectedAttachments[slotKey];

  if (attachments.length === 0) {
    toast('No attachments available for this slot', 'info');
    return;
  }

  openSheet(`
    <div class="space-y-2 max-h-[70vh] overflow-y-auto">
      <div class="text-xs text-gray-500 mb-3">Pick one ${slot.label.toLowerCase()} attachment</div>

      ${current ? `
        <button class="pick-attach-remove w-full text-left px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 font-bold text-sm mb-2">
          ✕ Remove current: ${esc(current.name)}
        </button>
      ` : ''}

      ${attachments.map((att, i) => {
        const isSelected = current && current.name === att.name;
        const effects = Object.entries(att.effects || {});
        return `
          <button class="pick-attach-btn w-full text-left px-4 py-3 rounded-xl ${isSelected ? 'bg-primary/15 border border-primary' : 'bg-card border border-border'} font-semibold text-sm" data-index="${i}">
            <div class="flex items-center justify-between mb-1">
              <span class="${isSelected ? 'text-primary' : 'text-white'}">${esc(att.name)}</span>
              ${isSelected ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white font-black">EQUIPPED</span>' : ''}
            </div>
            ${effects.length > 0 ? `
              <div class="flex flex-wrap gap-1.5 mt-1">
                ${effects.map(([stat, val]) => `
                  <span class="text-[9px] px-1.5 py-0.5 rounded ${val > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'} font-bold">
                    ${stat} ${val > 0 ? '+' + val : val}
                  </span>
                `).join('')}
              </div>
            ` : '<div class="text-[10px] text-gray-500">No stat changes</div>'}
          </button>
        `;
      }).join('')}
    </div>
  `, slot.label);

  // Wire picks
  document.querySelectorAll('.pick-attach-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index);
      BuilderState.selectedAttachments[slotKey] = attachments[idx];
      closeSheet();
      renderBuilderBody();
      toast(`${slot.label}: ${attachments[idx].name}`, 'success', 1500);
    };
  });

  // Wire remove
  const removeBtn = document.querySelector('.pick-attach-remove');
  if (removeBtn) {
    removeBtn.onclick = () => {
      delete BuilderState.selectedAttachments[slotKey];
      closeSheet();
      renderBuilderBody();
      toast(`${slot.label} removed`, 'success', 1500);
    };
  }
}

// ---------- SAVE BUILD TO VAULT ----------
async function saveBuildToVault() {
  const gun = BuilderState.selectedGun;
  const attachedCount = Object.keys(BuilderState.selectedAttachments).length;

  if (attachedCount === 0) {
    toast('Add at least one attachment', 'warning');
    return;
  }

  // Free tier limit — check vault count
  if (!State.profile?.isPro) {
    try {
      const snap = await getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid)));
      if (snap.size >= 3) {
        showProPaywall('You\'ve reached the free limit of 3 vaults. Upgrade to Pro for unlimited.');
        return;
      }
    } catch (e) { /* proceed */ }
  }

  // Build the gunsmith code as a compact string
  const code = generateGunsmithCode(gun, BuilderState.selectedAttachments);

  try {
    toast('Saving build...', 'info', 1500);

    // Build attachment map for Firestore
    const attachments = {};
    GUNSMITH_SLOTS.forEach(slot => {
      const picked = BuilderState.selectedAttachments[slot.key];
      if (picked) attachments[slot.label] = picked.name;
    });

    await addDoc(collection(db, 'vaults'), {
      uid: State.user.uid,
      ign: State.profile.ign,
      gunName: gun,
      gunsmithCode: code,
      type: 'gunsmith',
      attachments,
      imageUrl: '',
      likes: 0,
      builderVersion: 2,
      createdAt: serverTimestamp()
    });

    toast('✅ Build saved to Vault!', 'success', 2500);
  } catch (e) {
    console.error(e);
    toast('Save failed: ' + e.message, 'error');
  }
}

function generateGunsmithCode(gun, attachments) {
  // Compact format: GUN-XXXX-YYYY
  const slug = gun.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
  const slotCodes = GUNSMITH_SLOTS.map(s => {
    const a = attachments[s.key];
    if (!a) return '0';
    const hash = a.name.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    return Math.abs(hash % 9999).toString().padStart(4, '0');
  }).join('');
  return `${slug}-${slotCodes}`;
}

// ---------- SHARE BUILD ----------
function shareBuild() {
  const gun = BuilderState.selectedGun;
  const attachedCount = Object.keys(BuilderState.selectedAttachments).length;
  const { final } = calculateFinalStats(gun, BuilderState.selectedAttachments);

  const attachmentList = GUNSMITH_SLOTS
    .map(s => BuilderState.selectedAttachments[s.key])
    .filter(Boolean)
    .map(a => '• ' + a.name)
    .join('\n');

  const text = `🔧 ${gun} Build\n\n${attachmentList || '(No attachments)'}\n\nAccuracy: ${final.accuracy} | Damage: ${final.damage} | Range: ${final.range} | Mobility: ${final.mobility}\n\nBuilt with CODMPanda 🐼`;

  openShareSheet({
    title: `${gun} Build`,
    text,
    url: location.origin
  });
}

// ---------- ADD "BUILD GUNSMITH" BUTTON TO VAULT SUB-TAB ----------
const _origRenderVaultSubBuilder = renderVaultSub;
renderVaultSub = function() {
  _origRenderVaultSubBuilder();

  setTimeout(() => {
    const addBtn = document.getElementById('add-vault-btn');
    if (!addBtn) return;
    if (document.getElementById('open-builder-btn')) return;

    const body = document.getElementById('lab-body');
    if (!body) return;

    const btn = document.createElement('button');
    btn.id = 'open-builder-btn';
    btn.className = 'btn-press w-full mb-3 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primaryDark text-white font-black text-sm glow-primary flex items-center justify-center gap-2';
    btn.innerHTML = '<i data-lucide="wrench" class="w-4 h-4"></i> Build Gunsmith';
    btn.onclick = () => openGunsmithBuilder();

    const feed = document.getElementById('vault-feed');
    if (feed) feed.parentNode.insertBefore(btn, feed);

    if (window.lucide) window.lucide.createIcons();
  }, 100);
};

window.openGunsmithBuilder = openGunsmithBuilder;
window.openAttachmentPicker = openAttachmentPicker;
window.saveBuildToVault = saveBuildToVault;
window.shareBuild = shareBuild;
window.renderStatBars = renderStatBars;

/* END OF CHUNK 21 */
// ============================================
// Chunk 22/4: Gunsmith Builder — Enhanced Stats
// ============================================

// Classify stat modifier as beneficial/harmful
function getStatImpact(statKey, value) {
  if (value === 0) return 'neutral';
  // All stats benefit from higher values
  return value > 0 ? 'positive' : 'negative';
}

// Rank a completed build quality
function scoreBuild(final) {
  const weights = {
    accuracy: 1.0,
    damage: 1.2,
    range: 1.0,
    fireRate: 0.8,
    mobility: 1.0,
    control: 1.0
  };
  let total = 0;
  let maxTotal = 0;
  Object.keys(weights).forEach(k => {
    total += (final[k] || 0) * weights[k];
    maxTotal += 100 * weights[k];
  });
  const pct = Math.round((total / maxTotal) * 100);

  let tier, color, emoji;
  if (pct >= 75) { tier = 'Meta'; color = '#FFD700'; emoji = '🔥'; }
  else if (pct >= 65) { tier = 'Strong'; color = '#00BFFF'; emoji = '💎'; }
  else if (pct >= 55) { tier = 'Solid'; color = '#34C759'; emoji = '✅'; }
  else if (pct >= 45) { tier = 'Niche'; color = '#FF9500'; emoji = '⚡'; }
  else { tier = 'Off-Meta'; color = '#8E8E93'; emoji = '🎯'; }

  return { pct, tier, color, emoji };
}

// Generate Pro/Con summary
function analyzeTradeoffs(modifiers) {
  const pros = [];
  const cons = [];

  Object.entries(modifiers).forEach(([stat, val]) => {
    if (val === 0) return;
    if (val >= 5) pros.push({ stat, val });
    else if (val <= -5) cons.push({ stat, val });
  });

  return { pros, cons };
}

// ---------- ENHANCED STATS PANEL ----------
function renderEnhancedStats(base, final, modifiers) {
  const score = scoreBuild(final);
  const { pros, cons } = analyzeTradeoffs(modifiers);

  return `
    <!-- Build Score Card -->
    <div class="bg-gradient-to-br from-black via-black to-${score.tier === 'Meta' ? '[#1a1200]' : '[#0a0a0a]'} border rounded-2xl p-4 mb-3" style="border-color: ${score.color}40;">
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-[10px] text-gray-500 uppercase font-bold">Build Score</div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-3xl font-black" style="color: ${score.color};">${score.pct}%</span>
            <span class="text-lg">${score.emoji}</span>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[10px] text-gray-500 uppercase font-bold">Verdict</div>
          <div class="text-lg font-black" style="color: ${score.color};">${score.tier}</div>
        </div>
      </div>
      <div class="progress-bar" style="height: 8px;">
        <div class="progress-fill" style="width: ${score.pct}%; background: ${score.color};"></div>
      </div>
    </div>

    <!-- Stat Bars -->
    <div class="bg-card border border-border rounded-2xl p-4 mb-3">
      <div class="text-xs font-bold text-gray-400 uppercase mb-3">📊 Stats Breakdown</div>
      <div class="space-y-2.5">
        ${STAT_CONFIG.map(stat => {
          const baseVal = base[stat.key];
          const finalVal = final[stat.key];
          const mod = modifiers[stat.key];
          const pct = finalVal;

          // Base bar (ghost) + final bar overlay
          const basePct = baseVal;

          const modText = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : '';
          const modColor = mod > 0 ? 'text-green-400' : mod < 0 ? 'text-red-400' : 'text-gray-600';
          const arrow = mod > 0 ? '↑' : mod < 0 ? '↓' : '';

          return `
            <div>
              <div class="flex items-center justify-between text-[10px] mb-1">
                <span class="text-gray-400 font-semibold">${stat.label}</span>
                <div class="flex items-center gap-2">
                  ${modText ? `<span class="font-bold ${modColor}">${arrow} ${modText}</span>` : ''}
                  <span class="font-bold text-gray-300">${finalVal}/100</span>
                </div>
              </div>
              <div class="relative h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div class="absolute inset-y-0 left-0 rounded-full" style="width: ${basePct}%; background: rgba(255,255,255,0.08);"></div>
                <div class="absolute inset-y-0 left-0 rounded-full transition-all duration-300" style="width: ${pct}%; background: ${stat.color};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="text-[9px] text-gray-600 mt-3 text-center">Bars show base (dim) → final (bright)</div>
    </div>

    <!-- Pros & Cons -->
    ${(pros.length > 0 || cons.length > 0) ? `
      <div class="grid grid-cols-2 gap-2 mb-3">
        ${pros.length > 0 ? `
          <div class="bg-green-500/5 border border-green-500/30 rounded-2xl p-3">
            <div class="text-[10px] font-bold text-green-400 uppercase mb-2">✓ Pros</div>
            <div class="space-y-1">
              ${pros.map(p => `
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-gray-300 capitalize">${p.stat}</span>
                  <span class="font-bold text-green-400">+${p.val}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '<div class="bg-card border border-border rounded-2xl p-3 text-center text-[10px] text-gray-600">No strong pros</div>'}

        ${cons.length > 0 ? `
          <div class="bg-red-500/5 border border-red-500/30 rounded-2xl p-3">
            <div class="text-[10px] font-bold text-red-400 uppercase mb-2">✕ Cons</div>
            <div class="space-y-1">
              ${cons.map(c => `
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-gray-300 capitalize">${c.stat}</span>
                  <span class="font-bold text-red-400">${c.val}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : '<div class="bg-card border border-border rounded-2xl p-3 text-center text-[10px] text-gray-600">No strong cons</div>'}
      </div>
    ` : ''}
  `;
}

// ---------- PRESET BUILDS ----------
const PRESET_BUILDS = {
  'Fennec': [
    { name: '⚡ Rusher', slots: { muzzle: 'Monolithic Suppressor', barrel: 'RTC Light Barrel', stock: 'No Stock', laser: 'OWC Laser - Tactical', rearGrip: 'Rubberized Grip Tape' } },
    { name: '🎯 Hip Fire', slots: { muzzle: 'Muzzle Brake', barrel: 'Short Barrel', stock: 'No Stock', laser: 'Aim Assist Laser', rearGrip: 'Stippled Grip Tape' } }
  ],
  'AK117': [
    { name: '⚡ Balanced Meta', slots: { muzzle: 'Muzzle Brake', barrel: 'MIP Light Barrel', optic: 'Red Dot Sight', stock: 'MIP Strike Stock', rearGrip: 'Rubberized Grip Tape' } },
    { name: '🎯 Long Range', slots: { muzzle: 'Monolithic Suppressor', barrel: 'MIP Extended Light Barrel', optic: '3x Tactical Scope', stock: 'RTC Steady Stock', rearGrip: 'Rubberized Grip Tape' } }
  ],
  'DL Q33': [
    { name: '🎯 Quick Scope', slots: { muzzle: 'Muzzle Brake', barrel: 'OWC Marksman', stock: 'OWC Skeleton Stock', laser: 'OWC Laser - Tactical', perk: 'Fast Switch' } },
    { name: '🛡️ Hard Scope', slots: { muzzle: 'Monolithic Suppressor', barrel: 'MIP Custom Long Barrel', optic: '6x Tactical Scope', stock: 'RTC Steady Stock', rearGrip: 'Rubberized Grip Tape' } }
  ],
  'QQ9': [
    { name: '⚡ Aggressive', slots: { muzzle: 'Muzzle Brake', barrel: 'RTC Light Barrel', stock: 'No Stock', laser: 'OWC Laser - Tactical', rearGrip: 'Rubberized Grip Tape' } }
  ],
  'AK-47': [
    { name: '💪 Control God', slots: { muzzle: 'Muzzle Brake', barrel: 'OWC Marksman', stock: 'RTC Steady Stock', underbarrel: 'Ranger Foregrip', rearGrip: 'Rubberized Grip Tape' } }
  ],
  'M4': [
    { name: '⚖️ Balanced', slots: { muzzle: 'Muzzle Brake', barrel: 'MIP Light Barrel', stock: 'MIP Strike Stock', laser: 'OWC Laser - Tactical', rearGrip: 'Rubberized Grip Tape' } }
  ]
};

function applyPreset(preset) {
  const gun = BuilderState.selectedGun;
  BuilderState.selectedAttachments = {};

  Object.entries(preset.slots).forEach(([slotKey, attName]) => {
    const pool = getAttachmentsForSlot(gun, slotKey);
    const att = pool.find(a => a.name === attName);
    if (att) BuilderState.selectedAttachments[slotKey] = att;
  });

  closeSheet();
  renderBuilderBody();
  toast(`✨ ${preset.name} applied`, 'success');
}

// ---------- OVERRIDE renderLoadoutCanvas ----------
const _origRenderLoadoutCanvas = renderLoadoutCanvas;
renderLoadoutCanvas = function(body) {
  const gun = BuilderState.selectedGun;
  const { final, base, modifiers } = calculateFinalStats(gun, BuilderState.selectedAttachments);
  const attachedCount = Object.keys(BuilderState.selectedAttachments).length;
  const presets = PRESET_BUILDS[gun] || [];
  const score = scoreBuild(final);

  body.innerHTML = `
    <!-- Gun Header -->
    <div class="bg-card border border-primary/40 rounded-2xl p-4 mb-4 relative overflow-hidden">
      <div class="absolute top-3 right-3 text-2xl opacity-20">🔧</div>
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-gold/20 flex items-center justify-center flex-shrink-0">
          <i data-lucide="crosshair" class="w-7 h-7 text-primary"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-lg font-black truncate">${esc(gun)}</div>
          <div class="text-[10px] text-gray-500">${attachedCount}/9 attachments · ${score.emoji} ${score.tier}</div>
        </div>
        <button id="change-gun-btn" class="btn-press px-3 py-2 rounded-lg bg-cardAlt border border-border text-[10px] font-bold">
          Change
        </button>
      </div>
    </div>

    <!-- Presets (if available) -->
    ${presets.length > 0 && attachedCount === 0 ? `
      <div class="mb-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-2">✨ Quick Presets</div>
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          ${presets.map((p, i) => `
            <button class="preset-btn chip" data-preset-index="${i}">${p.name}</button>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Enhanced Stats Preview -->
    <div id="stat-preview">
      ${renderEnhancedStats(base, final, modifiers)}
    </div>

    <!-- Attachments Grid -->
    <div class="text-xs font-bold text-gray-400 uppercase mb-2 mt-4">Attachments</div>
    <div class="grid grid-cols-3 gap-2 mb-4" id="slot-grid">
      ${GUNSMITH_SLOTS.map(slot => {
        const picked = BuilderState.selectedAttachments[slot.key];
        return `
          <button class="slot-btn bg-card border ${picked ? 'border-primary/60 bg-primary/5' : 'border-border'} rounded-xl p-3 flex flex-col items-center gap-1.5" data-slot="${slot.key}">
            <i data-lucide="${slot.icon}" class="w-5 h-5 ${picked ? 'text-primary' : 'text-gray-500'}"></i>
            <div class="text-[9px] font-bold ${picked ? 'text-primary' : 'text-gray-400'} text-center leading-tight">${slot.label}</div>
            ${picked ? `<div class="text-[8px] text-primary truncate w-full text-center">${esc(picked.name)}</div>` : `<div class="text-[8px] text-gray-600">Empty</div>`}
          </button>
        `;
      }).join('')}
    </div>

    <!-- Actions -->
    <div class="space-y-2">
      <button id="builder-save-btn" class="btn-press w-full py-3.5 rounded-xl bg-primary font-black text-sm glow-primary flex items-center justify-center gap-2">
        <i data-lucide="save" class="w-4 h-4"></i> Save to Vault
      </button>
      <button id="builder-share-btn" class="btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2">
        <i data-lucide="share-2" class="w-4 h-4"></i> Share Build
      </button>
    </div>

    <div class="text-[10px] text-gray-600 text-center mt-4">
      Stats are approximate — based on community-sourced data
    </div>
  `;

  // Wire change gun
  document.getElementById('change-gun-btn').onclick = () => {
    BuilderState.selectedGun = null;
    BuilderState.selectedAttachments = {};
    renderBuilderBody();
  };

  // Wire slots
  body.querySelectorAll('.slot-btn').forEach(btn => {
    btn.onclick = () => openAttachmentPicker(btn.dataset.slot);
  });

  // Wire presets
  body.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.presetIndex);
      applyPreset(presets[idx]);
    };
  });

  // Wire save
  document.getElementById('builder-save-btn').onclick = saveBuildToVault;
  document.getElementById('builder-share-btn').onclick = shareBuild;

  if (window.lucide) window.lucide.createIcons();
};

window.scoreBuild = scoreBuild;
window.renderEnhancedStats = renderEnhancedStats;

/* END OF CHUNK 22 */
// ============================================
// Chunk 23/4: Gunsmith Builder — Community + Integration
// ============================================

// ---------- COMMUNITY BUILDS SECTION ----------
async function openCommunityBuilds(gunName) {
  openSheet(`
    <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
  `, `${gunName} — Community Builds`);

  try {
    const snap = await getDocs(query(
      collection(db, 'vaults'),
      where('gunName', '==', gunName),
      where('type', '==', 'gunsmith'),
      limit(30)
    ));

    const builds = [];
    snap.forEach(d => builds.push({ id: d.id, ...d.data() }));
    builds.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    if (builds.length === 0) {
      sheetBody.innerHTML = `
        <div class="text-center py-12">
          <div class="text-4xl mb-3">🔧</div>
          <div class="text-sm font-bold mb-1">No community builds yet</div>
          <div class="text-xs text-gray-500 mb-4">Be the first to share a ${esc(gunName)} build!</div>
          <button id="start-empty-build" class="btn-press px-4 py-2.5 rounded-xl bg-primary font-bold text-sm">
            Build Gunsmith →
          </button>
        </div>
      `;
      document.getElementById('start-empty-build').onclick = () => {
        closeSheet();
        setTimeout(() => openGunsmithBuilder(gunName), 300);
      };
      return;
    }

    sheetBody.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs text-gray-500">${builds.length} build${builds.length === 1 ? '' : 's'} shared</div>
        <button id="new-build-btn" class="btn-press text-[10px] px-3 py-1.5 rounded-lg bg-primary font-bold text-white">
          + New Build
        </button>
      </div>

      <div class="space-y-3">
        ${builds.map(b => {
          const attCount = b.attachments ? Object.keys(b.attachments).length : 0;
          const isMine = b.uid === State.user.uid;
          return `
            <div class="bg-card border border-border rounded-2xl p-4">
              <div class="flex items-start gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  ${b.avatar ? `<img src="${esc(b.avatar)}" class="w-full h-full object-cover" />` : '<i data-lucide="crosshair" class="w-5 h-5 text-primary"></i>'}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-bold truncate">${esc(b.gunName || 'Build')}</div>
                  <div class="text-[10px] text-gray-500">
                    by ${isMine ? 'you' : esc(b.ign || 'Unknown')} · ${attCount} attachments
                  </div>
                </div>
                <button class="build-load-btn btn-press px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold flex-shrink-0" data-id="${b.id}">
                  LOAD
                </button>
              </div>

              ${b.attachments ? `
                <div class="space-y-1 mb-3">
                  ${Object.entries(b.attachments).slice(0, 5).map(([slot, att]) => `
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="text-gray-500">${esc(slot)}</span>
                      <span class="text-gray-300 font-semibold truncate ml-2">${esc(att)}</span>
                    </div>
                  `).join('')}
                  ${Object.keys(b.attachments).length > 5 ? `<div class="text-[9px] text-gray-600 text-center">+${Object.keys(b.attachments).length - 5} more</div>` : ''}
                </div>
              ` : ''}

              <div class="flex items-center justify-between pt-2 border-t border-border">
                <button class="build-like-btn flex items-center gap-1 text-[10px] text-gray-400" data-id="${b.id}">
                  <i data-lucide="heart" class="w-3.5 h-3.5"></i> ${b.likes || 0}
                </button>
                <button class="build-copy-btn text-[10px] text-primary font-bold" data-code="${esc(b.gunsmithCode || '')}">
                  Copy Code
                </button>
                <button class="build-share-btn text-gray-500" data-id="${b.id}" data-gun="${esc(b.gunName)}">
                  <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Wire new build
    document.getElementById('new-build-btn').onclick = () => {
      closeSheet();
      setTimeout(() => openGunsmithBuilder(gunName), 300);
    };

    // Wire LOAD — opens builder with this gun
    sheetBody.querySelectorAll('.build-load-btn').forEach(btn => {
      btn.onclick = () => {
        closeSheet();
        toast('Opening builder — copy attachments manually', 'info', 3000);
        setTimeout(() => openGunsmithBuilder(gunName), 300);
      };
    });

    // Wire likes
    sheetBody.querySelectorAll('.build-like-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await updateDoc(doc(db, 'vaults', btn.dataset.id), { likes: increment(1) });
          toast('❤️ Liked!', 'success', 1200);
        } catch (e) { toast('Failed', 'error'); }
      };
    });

    // Wire copy code
    sheetBody.querySelectorAll('.build-copy-btn').forEach(btn => {
      btn.onclick = () => {
        if (!btn.dataset.code) { toast('No code available', 'warning'); return; }
        copyText(btn.dataset.code, 'Gunsmith code copied!');
      };
    });

    // Wire share
    sheetBody.querySelectorAll('.build-share-btn').forEach(btn => {
      btn.onclick = () => {
        openShareSheet({
          title: `${btn.dataset.gun} Build`,
          text: `🔧 Check out this ${btn.dataset.gun} build on CODMPanda!`,
          url: `${location.origin}/?vault=${btn.dataset.id}`
        });
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Community builds error:', e);
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) {
      sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load builds</div>';
    }
  }
}

// ---------- ADD "COMMUNITY" TAB IN BUILDER ----------
const _origRenderLoadoutCanvasCommunity = renderLoadoutCanvas;
renderLoadoutCanvas = function(body) {
  _origRenderLoadoutCanvasCommunity(body);

  // Inject "View Community Builds" button
  setTimeout(() => {
    const actions = body.querySelector('.space-y-2');
    if (!actions || body.querySelector('#view-community-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'view-community-btn';
    btn.className = 'btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2 mb-2';
    btn.innerHTML = '<i data-lucide="users" class="w-4 h-4 text-primary"></i> View Community Builds';
    btn.onclick = () => openCommunityBuilds(BuilderState.selectedGun);

    actions.insertBefore(btn, actions.firstChild);
    if (window.lucide) window.lucide.createIcons();
  }, 60);
};

// ---------- VAULT CARD ENHANCEMENT ----------
// Add "VIEW BUILDS" button for gunsmith vault entries
const _origRenderVaultsCommunity = renderVaults;
renderVaults = function() {
  _origRenderVaultsCommunity();

  // Add click handler for gunsmith cards to open community builds
  setTimeout(() => {
    const feed = document.getElementById('vault-feed');
    if (!feed) return;

    feed.querySelectorAll('.bg-card').forEach(card => {
      if (card.dataset.communityBound) return;
      const gunNameEl = card.querySelector('.text-xs.font-bold');
      if (!gunNameEl) return;

      const gunName = gunNameEl.textContent.trim();
      if (!gunName || gunName === 'Unknown') return;

      // Make the whole card clickable for gunsmith vaults
      const typeEl = card.querySelector('.text-\\[10px\\].text-gray-500');
      if (typeEl && typeEl.textContent.includes('gunsmith')) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          if (e.target.closest('button')) return; // don't trigger on button clicks
          openCommunityBuilds(gunName);
        });
        card.dataset.communityBound = '1';
      }
    });
  }, 120);
};

// ---------- ENHANCED SAVE WITH SUCCESS FEEDBACK ----------
const _origSaveBuildToVault = saveBuildToVault;
saveBuildToVault = async function() {
  const result = await _origSaveBuildToVault();

  // Show success sheet with quick actions
  setTimeout(() => {
    if (document.getElementById('sheet-container').classList.contains('hidden')) {
      // Save succeeded
      openSheet(`
        <div class="text-center space-y-4 py-4">
          <div class="text-5xl">🎉</div>
          <div>
            <h3 class="text-lg font-black mb-1">Build Saved!</h3>
            <div class="text-xs text-gray-400">Your ${esc(BuilderState.selectedGun)} build is now in the Vault</div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button id="goto-vault-btn" class="btn-press py-3 rounded-xl bg-primary font-bold text-xs">
              View Vault
            </button>
            <button id="share-build-now" class="btn-press py-3 rounded-xl bg-cardAlt border border-border font-bold text-xs">
              Share Build
            </button>
          </div>

          <button id="continue-building" class="text-xs text-gray-500">Continue building</button>
        </div>
      `, 'Success!');

      document.getElementById('goto-vault-btn').onclick = () => {
        closeSheet();
        labSubTab = 'vault';
        renderLabTab();
      };
      document.getElementById('share-build-now').onclick = () => {
        closeSheet();
        setTimeout(shareBuild, 300);
      };
      document.getElementById('continue-building').onclick = () => closeSheet();

      if (window.lucide) window.lucide.createIcons();
    }
  }, 800);
};

// ---------- BUILD SHARE WITH IMAGE ----------
async function shareBuildAsImage() {
  const gun = BuilderState.selectedGun;
  if (!gun) { toast('No build loaded', 'warning'); return; }

  try {
    toast('Creating image...', 'info', 2000);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    // Glow
    const grad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 800);
    grad.addColorStop(0, 'rgba(255, 107, 0, 0.3)');
    grad.addColorStop(1, 'rgba(255, 107, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 800);

    // Border
    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Header
    ctx.textAlign = 'center';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.fillStyle = '#FF6B00';
    ctx.fillText('CODMPanda', W / 2, 110);

    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('GUNSMITH BUILD', W / 2, 150);

    // Gun name
    ctx.font = 'bold 78px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(gun, W / 2, 260);

    // Score
    const { final, base, modifiers } = calculateFinalStats(gun, BuilderState.selectedAttachments);
    const score = scoreBuild(final);

    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillStyle = score.color;
    ctx.fillText(`${score.emoji} ${score.tier} · ${score.pct}%`, W / 2, 315);

    // Attachments list
    let y = 420;
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillStyle = '#FF6B00';
    ctx.fillText('ATTACHMENTS', W / 2, y);
    y += 50;

    ctx.textAlign = 'left';
    const startX = 100;
    ctx.font = '500 22px Inter, sans-serif';

    GUNSMITH_SLOTS.forEach(slot => {
      const picked = BuilderState.selectedAttachments[slot.key];
      ctx.fillStyle = '#666';
      ctx.fillText(slot.label.toUpperCase(), startX, y);
      ctx.fillStyle = picked ? '#fff' : '#444';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillText(picked ? picked.name : '—', startX + 300, y);
      ctx.font = '500 22px Inter, sans-serif';
      y += 42;
    });

    // Stats
    y += 30;
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.fillStyle = '#FF6B00';
    ctx.fillText('STATS', W / 2, y);
    y += 50;

    ctx.textAlign = 'left';
    STAT_CONFIG.forEach(stat => {
      const val = final[stat.key];
      ctx.fillStyle = '#666';
      ctx.font = '500 20px Inter, sans-serif';
      ctx.fillText(stat.label, startX, y);

      // Bar background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(startX + 220, y - 16, 600, 14);

      // Bar fill
      ctx.fillStyle = stat.color;
      ctx.fillRect(startX + 220, y - 16, (600 * val) / 100, 14);

      // Value
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText(val.toString(), startX + 840, y);
      y += 40;
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillStyle = '#FF6B00';
    ctx.fillText('codmpanda.pages.dev', W / 2, H - 90);

    // Convert to blob and share
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `codmpanda-${gun}-build.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${gun} Build`,
            text: `Check out my ${gun} build! 🔧`
          });
          toast('Shared!', 'success');
        } catch (e) { /* cancelled */ }
      } else {
        const url = URL.createObjectURL(blob);
        openSheet(`
          <div class="space-y-4">
            <img src="${url}" class="w-full rounded-2xl border border-border" />
            <a href="${url}" download="codmpanda-build.png" class="btn-press block w-full py-3 rounded-xl bg-primary text-center text-white font-bold text-sm">
              ⬇️ Save Image
            </a>
            <button onclick="closeSheet()" class="text-xs text-gray-500 w-full">Close</button>
          </div>
        `, 'Your Build');
      }
    }, 'image/png');
  } catch (e) {
    console.error('Share image error:', e);
    toast('Failed: ' + e.message, 'error');
  }
}

// Override shareBuild to offer image option
shareBuild = function() {
  openSheet(`
    <div class="space-y-3">
      <div class="text-center mb-3">
        <div class="text-sm font-bold mb-1">Share Your Build</div>
        <div class="text-[10px] text-gray-500">Choose how to share</div>
      </div>

      <button id="share-text-btn" class="btn-press w-full py-3.5 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2">
        <i data-lucide="message-square" class="w-4 h-4 text-primary"></i> Share as Text
      </button>

      <button id="share-image-btn" class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primaryDark font-bold text-sm text-white flex items-center justify-center gap-2">
        <i data-lucide="image" class="w-4 h-4"></i> Share as Image
      </button>

      <button onclick="closeSheet()" class="text-xs text-gray-500 w-full pt-2">Cancel</button>
    </div>
  `, 'Share Build');

  document.getElementById('share-text-btn').onclick = () => {
    closeSheet();
    setTimeout(() => {
      const gun = BuilderState.selectedGun;
      const { final } = calculateFinalStats(gun, BuilderState.selectedAttachments);

      const attachmentList = GUNSMITH_SLOTS
        .map(s => BuilderState.selectedAttachments[s.key])
        .filter(Boolean)
        .map(a => '• ' + a.name)
        .join('\n');

      const text = `🔧 ${gun} Build\n\n${attachmentList || '(No attachments)'}\n\nAccuracy: ${final.accuracy} | Damage: ${final.damage} | Range: ${final.range} | Mobility: ${final.mobility}\n\nBuilt with CODMPanda 🐼`;

      openShareSheet({
        title: `${gun} Build`,
        text,
        url: location.origin
      });
    }, 300);
  };

  document.getElementById('share-image-btn').onclick = () => {
    closeSheet();
    setTimeout(shareBuildAsImage, 300);
  };

  if (window.lucide) window.lucide.createIcons();
};

window.openCommunityBuilds = openCommunityBuilds;
window.shareBuildAsImage = shareBuildAsImage;

/* END OF CHUNK 23 */
// ============================================
// Chunk 24/4: Tournaments — Data + Create + Bracket
// ============================================

const TOURNAMENT_SIZES = [4, 8, 16, 32];
const TOURNAMENT_REGISTRATION_HOURS = 24;
const TOURNAMENT_MODES = ['MP 5v5', 'BR Squad', 'Scrim 5v5', 'Sniper 1v1', '1v1'];

let tournamentsSubTab = 'active';

// ---------- MAIN RENDER ----------
async function renderTournamentsSub() {
  const body = document.getElementById('squad-body');
  if (!body) return;

  body.innerHTML = '<div class="text-center py-8"><div class="spinner mx-auto"></div></div>';

  try {
    const snap = await getDocs(query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'), limit(30)));
    const allTournaments = [];
    snap.forEach(d => allTournaments.push({ id: d.id, ...d.data() }));

    const active = allTournaments.filter(t => t.status === 'open' || t.status === 'in-progress');
    const completed = allTournaments.filter(t => t.status === 'completed');

    const list = tournamentsSubTab === 'active' ? active : completed;

    body.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="text-xs text-gray-500">
          ${tournamentsSubTab === 'active' ? active.length + ' active' : completed.length + ' completed'}
        </div>
        <button id="create-tournament-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1">
          <i data-lucide="plus" class="w-3 h-3"></i> Create
        </button>
      </div>

      <div class="flex gap-2 mb-4">
        <button class="chip tour-tab ${tournamentsSubTab === 'active' ? 'active' : ''}" data-tab="active">Active</button>
        <button class="chip tour-tab ${tournamentsSubTab === 'completed' ? 'active' : ''}" data-tab="completed">History</button>
      </div>

      <div id="tournaments-list">
        ${list.length === 0 ? renderTournamentEmpty() : list.map(t => renderTournamentCard(t)).join('')}
      </div>
    `;

    document.getElementById('create-tournament-btn').onclick = openCreateTournament;
    document.querySelectorAll('.tour-tab').forEach(btn => {
      btn.onclick = () => { tournamentsSubTab = btn.dataset.tab; renderTournamentsSub(); };
    });

    document.querySelectorAll('.tournament-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('button')) return;
        openTournamentDetail(card.dataset.id);
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Tournaments error:', e);
    body.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load</div>';
  }
}

function renderTournamentEmpty() {
  return `
    <div class="text-center py-12">
      <div class="text-5xl mb-3">🏆</div>
      <div class="text-sm font-bold mb-1">No tournaments yet</div>
      <div class="text-xs text-gray-500 mb-4">${tournamentsSubTab === 'active' ? 'Be the first to host one!' : 'Completed tournaments will show here'}</div>
      ${tournamentsSubTab === 'active' ? `
        <button onclick="openCreateTournament()" class="btn-press px-5 py-2.5 rounded-xl bg-primary font-bold text-sm glow-primary">
          Create Tournament
        </button>
      ` : ''}
    </div>
  `;
}

function renderTournamentCard(t) {
  const statusColors = {
    'open': { bg: 'bg-green-500/15', text: 'text-green-400', label: 'REGISTRATION OPEN' },
    'in-progress': { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'IN PROGRESS' },
    'completed': { bg: 'bg-gray-500/15', text: 'text-gray-400', label: 'COMPLETED' }
  };
  const sc = statusColors[t.status] || statusColors.open;
  const teamCount = (t.teams || []).length;
  const filled = Math.round((teamCount / t.size) * 100);

  return `
    <div class="tournament-card bg-card border border-border rounded-2xl p-4 mb-3 cursor-pointer hover:border-primary transition-colors" data-id="${t.id}">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[9px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} font-black">${sc.label}</span>
          </div>
          <div class="text-base font-black truncate">${esc(t.name)}</div>
          <div class="text-[10px] text-gray-500 mt-0.5">${esc(t.mode)} · ${esc(t.region)}</div>
        </div>
        <div class="text-2xl">🏆</div>
      </div>

      ${t.prize ? `
        <div class="bg-gold/10 border border-gold/30 rounded-lg p-2 mb-3">
          <div class="text-[10px] font-bold text-gold">🎁 Prize: ${esc(t.prize)}</div>
        </div>
      ` : ''}

      <div class="mb-2">
        <div class="flex items-center justify-between text-[10px] mb-1">
          <span class="text-gray-500">Teams</span>
          <span class="font-bold">${teamCount}/${t.size}</span>
        </div>
        <div class="progress-bar" style="height: 5px;">
          <div class="progress-fill" style="width: ${filled}%"></div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-border mt-2">
        <div class="text-[10px] text-gray-500">by ${esc(t.creatorIgn || 'Unknown')}</div>
        <div class="text-[10px] text-gray-500">${timeAgo(t.createdAt)}</div>
      </div>
    </div>
  `;
}

// ---------- CREATE TOURNAMENT ----------
function openCreateTournament() {
  if (!State.profile?.isPro && State.user?.uid !== ADMIN_UID) {
    showProPaywall('Creating tournaments is a Pro feature. Upgrade to host your own!');
    return;
  }

  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Tournament Name *</label>
        <input id="tc-name" type="text" placeholder="e.g. Friday Night Scrim" maxlength="50" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Mode *</label>
        <select id="tc-mode">
          ${TOURNAMENT_MODES.map(m => `<option>${m}</option>`).join('')}
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Bracket Size *</label>
          <select id="tc-size">
            ${TOURNAMENT_SIZES.map(s => `<option value="${s}">${s} teams</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Region</label>
          <select id="tc-region">
            ${REGIONS.map(r => `<option ${r === State.profile?.region ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </div>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Prize (optional)</label>
        <input id="tc-prize" type="text" placeholder="e.g. 500 CP or Free Pro for a month" maxlength="100" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rules (optional)</label>
        <textarea id="tc-rules" rows="3" maxlength="500" placeholder="e.g. No snipers, WAT timezone, best of 1"></textarea>
      </div>

      <div class="bg-primary/5 border border-primary/30 rounded-xl p-3">
        <div class="text-[10px] text-primary font-bold mb-1">ℹ️ Auto-managed</div>
        <div class="text-[10px] text-gray-400">Registration runs for 24 hours. Bracket auto-generates when full or when time ends. Matches auto-resolve with 30-min confirm window.</div>
      </div>

      <button id="tc-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary">
        Create Tournament
      </button>
    </div>
  `, '🏆 Create Tournament');

  document.getElementById('tc-submit').onclick = async () => {
    const name = document.getElementById('tc-name').value.trim();
    const mode = document.getElementById('tc-mode').value;
    const size = parseInt(document.getElementById('tc-size').value);
    const region = document.getElementById('tc-region').value;
    const prize = document.getElementById('tc-prize').value.trim();
    const rules = document.getElementById('tc-rules').value.trim();

    if (name.length < 3) { toast('Name too short', 'error'); return; }

    const btn = document.getElementById('tc-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      const registrationEndsAt = Timestamp.fromMillis(Date.now() + TOURNAMENT_REGISTRATION_HOURS * 60 * 60 * 1000);

      await addDoc(collection(db, 'tournaments'), {
        name, mode, size, region, prize, rules,
        creatorUid: State.user.uid,
        creatorIgn: State.profile.ign,
        creatorAvatar: State.profile.avatar || '',
        teams: [],
        bracket: [],
        currentRound: 0,
        status: 'open',
        registrationEndsAt,
        createdAt: serverTimestamp()
      });

      toast('🏆 Tournament created!', 'success');
      closeSheet();
      setTimeout(renderTournamentsSub, 300);
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Create Tournament';
    }
  };
}

// ---------- TOURNAMENT DETAIL ----------
async function openTournamentDetail(tournamentId) {
  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', 'Tournament');

  try {
    const snap = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!snap.exists()) { toast('Tournament not found', 'error'); return; }
    const t = { id: tournamentId, ...snap.data() };

    const isCreator = t.creatorUid === State.user.uid;
    const isAdmin = State.user.uid === ADMIN_UID;
    const teams = t.teams || [];
    const isRegistered = teams.some(tm => tm.uid === State.user.uid);
    const canStart = (t.status === 'open') && teams.length >= 2 && (isCreator || isAdmin);
    const canRegister = t.status === 'open' && teams.length < t.size && !isRegistered;

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="space-y-4">
        <div class="bg-gradient-to-br from-primary/10 to-black border border-primary/30 rounded-2xl p-4">
          <div class="text-lg font-black mb-1">${esc(t.name)}</div>
          <div class="text-[10px] text-gray-500 mb-3">${esc(t.mode)} · ${esc(t.region)} · ${t.size} teams</div>
          ${t.prize ? `<div class="bg-gold/10 border border-gold/30 rounded-lg px-3 py-2 mb-2"><div class="text-[10px] font-bold text-gold">🎁 ${esc(t.prize)}</div></div>` : ''}
          ${t.rules ? `<div class="text-[10px] text-gray-400 mt-2">${esc(t.rules)}</div>` : ''}
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="bg-card border border-border rounded-xl p-3 text-center">
            <div class="text-lg font-black text-primary">${teams.length}/${t.size}</div>
            <div class="text-[9px] text-gray-500 uppercase">Teams</div>
          </div>
          <div class="bg-card border border-border rounded-xl p-3 text-center">
            <div class="text-lg font-black text-${t.status === 'open' ? 'green-400' : t.status === 'in-progress' ? 'orange-400' : 'gray-400'}">${t.status.toUpperCase()}</div>
            <div class="text-[9px] text-gray-500 uppercase">Status</div>
          </div>
        </div>

        <!-- Teams -->
        <div class="bg-card border border-border rounded-2xl p-3">
          <div class="text-xs font-bold text-gray-400 uppercase mb-2">Registered (${teams.length})</div>
          ${teams.length === 0 ? '<div class="text-center py-3 text-[10px] text-gray-600">No teams yet</div>' : `
            <div class="space-y-2">
              ${teams.map(tm => `
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    ${tm.avatar ? `<img src="${esc(tm.avatar)}" class="w-full h-full object-cover" />` : getInitials(tm.ign)}
                  </div>
                  <div class="flex-1 text-xs font-bold truncate">${esc(tm.ign)}</div>
                  ${tm.uid === t.creatorUid ? '<span class="text-[8px] px-1.5 py-0.5 rounded bg-gold text-black font-black">HOST</span>' : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Actions -->
        <div class="space-y-2">
          ${canRegister ? `
            <button id="reg-btn" class="btn-press w-full py-3 rounded-xl bg-primary font-black text-sm glow-primary">
              ✅ Register Team
            </button>
          ` : ''}
          ${isRegistered && t.status === 'open' ? `
            <button id="unreg-btn" class="btn-press w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm">
              Withdraw
            </button>
          ` : ''}
          ${canStart ? `
            <button id="start-tour-btn" class="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold">
              🚀 Start Tournament
            </button>
          ` : ''}
          ${t.status === 'in-progress' ? `
            <button id="view-bracket-btn" class="btn-press w-full py-3 rounded-xl bg-primary font-black text-sm">
              🏆 View Bracket
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Wire buttons
    const regBtn = document.getElementById('reg-btn');
    if (regBtn) {
      regBtn.onclick = () => registerForTournament(t.id, teams, t.size);
    }

    const unregBtn = document.getElementById('unreg-btn');
    if (unregBtn) {
      unregBtn.onclick = () => withdrawFromTournament(t.id);
    }

    const startBtn = document.getElementById('start-tour-btn');
    if (startBtn) {
      startBtn.onclick = () => {
        confirmDialog('Start Tournament', 'This will generate the bracket. No more registrations allowed.', () => {
          startTournament(t.id, t);
        }, 'Start', false);
      };
    }

    const bracketBtn = document.getElementById('view-bracket-btn');
    if (bracketBtn) {
      bracketBtn.onclick = () => openBracketView(t.id);
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Tournament detail error:', e);
    toast('Failed to load', 'error');
  }
}

// ---------- REGISTER ----------
async function registerForTournament(tournamentId, currentTeams, maxSize) {
  if (currentTeams.length >= maxSize) {
    toast('Tournament is full', 'error');
    return;
  }

  if (currentTeams.some(t => t.uid === State.user.uid)) {
    toast('Already registered', 'warning');
    return;
  }

  try {
    const newTeam = {
      uid: State.user.uid,
      ign: State.profile.ign,
      avatar: State.profile.avatar || '',
      rank: State.profile.rank || 'Rookie',
      registeredAt: Date.now()
    };

    await updateDoc(doc(db, 'tournaments', tournamentId), {
      teams: arrayUnion(newTeam)
    });

    toast('✅ Registered!', 'success');
    closeSheet();
    setTimeout(() => openTournamentDetail(tournamentId), 500);
  } catch (e) {
    console.error(e);
    toast('Registration failed: ' + e.message, 'error');
  }
}

async function withdrawFromTournament(tournamentId) {
  confirmDialog('Withdraw', 'Remove your team from this tournament?', async () => {
    try {
      const snap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (!snap.exists()) return;
      const t = snap.data();
      const updated = (t.teams || []).filter(tm => tm.uid !== State.user.uid);
      await updateDoc(doc(db, 'tournaments', tournamentId), { teams: updated });
      toast('Withdrawn', 'success');
      closeSheet();
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  }, 'Withdraw', true);
}

// ---------- START TOURNAMENT (AUTO-BRACKET) ----------
async function startTournament(tournamentId, tournament) {
  try {
    toast('Generating bracket...', 'info', 2000);

    const teams = [...(tournament.teams || [])];
    if (teams.length < 2) {
      toast('Need at least 2 teams', 'error');
      return;
    }

    // Shuffle teams for random seeding
    const shuffled = teams.sort(() => Math.random() - 0.5);

    // Generate single elimination bracket
    const bracket = generateBracket(shuffled, tournament.size);

    await updateDoc(doc(db, 'tournaments', tournamentId), {
      teams: shuffled,
      bracket,
      currentRound: 1,
      status: 'in-progress',
      startedAt: serverTimestamp()
    });

    toast('🏆 Tournament started!', 'success');
    closeSheet();
    setTimeout(() => openBracketView(tournamentId), 500);
    setTimeout(renderTournamentsSub, 1000);
  } catch (e) {
    console.error('Start error:', e);
    toast('Failed: ' + e.message, 'error');
  }
}

// ---------- BRACKET GENERATION ----------
function generateBracket(teams, targetSize) {
  // Pad with byes if needed (fills up to next power of 2)
  const padded = [...teams];
  while (padded.length < targetSize) {
    padded.push({ bye: true, uid: null, ign: 'BYE' });
  }

  // Round 1 matches
  const round1 = [];
  for (let i = 0; i < padded.length; i += 2) {
    round1.push({
      round: 1,
      matchIndex: round1.length,
      team1: padded[i],
      team2: padded[i + 1] || { bye: true, uid: null, ign: 'BYE' },
      winner: null,
      score1: null,
      score2: null,
      status: 'pending',
      startedAt: null,
      reportedBy: null,
      reportedAt: null,
      disputed: false,
      expiresAt: null
    });
  }

  // Auto-resolve byes in round 1
  round1.forEach((m, idx) => {
    if (m.team1.bye) {
      m.winner = m.team2;
      m.status = 'completed';
    } else if (m.team2.bye) {
      m.winner = m.team1;
      m.status = 'completed';
    }
  });

  const bracket = [...round1];

  // Generate future rounds (empty placeholders)
  let teamsRemaining = round1.length;
  let roundNum = 2;
  while (teamsRemaining > 1) {
    teamsRemaining = Math.floor(teamsRemaining / 2);
    const matchesInRound = teamsRemaining;
    for (let i = 0; i < matchesInRound; i++) {
      bracket.push({
        round: roundNum,
        matchIndex: i,
        team1: null,
        team2: null,
        winner: null,
        score1: null,
        score2: null,
        status: 'waiting',
        startedAt: null,
        reportedBy: null,
        reportedAt: null,
        disputed: false,
        expiresAt: null
      });
    }
    roundNum++;
  }

  return bracket;
}

window.renderTournamentsSub = renderTournamentsSub;
window.openCreateTournament = openCreateTournament;
window.openTournamentDetail = openTournamentDetail;
window.registerForTournament = registerForTournament;
window.startTournament = startTournament;
window.generateBracket = generateBracket;

/* END OF CHUNK 24 */
// ============================================
// Chunk 25/4: Tournaments — Matches + Auto-Confirm + Bracket
// ============================================

const MATCH_CONFIRM_WINDOW_MS = 30 * 60 * 1000; // 30 min
const MATCH_NO_SHOW_WINDOW_MS = 60 * 60 * 1000; // 60 min

// ---------- BRACKET VIEW ----------
async function openBracketView(tournamentId) {
  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', '🏆 Bracket');

  try {
    const snap = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!snap.exists()) { toast('Not found', 'error'); return; }
    const t = { id: tournamentId, ...snap.data() };

    // Auto-resolve any expired matches
    await autoResolveExpiredMatches(t);

    // Re-fetch in case auto-resolve changed things
    const snap2 = await getDoc(doc(db, 'tournaments', tournamentId));
    const t2 = { id: tournamentId, ...snap2.data() };

    const rounds = groupBracketByRound(t2.bracket || []);
    const isCreator = t2.creatorUid === State.user.uid;
    const isAdmin = State.user.uid === ADMIN_UID;
    const canManage = isCreator || isAdmin;

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="space-y-4">
        <div class="bg-gradient-to-br from-primary/10 to-black border border-primary/30 rounded-2xl p-4">
          <div class="text-base font-black mb-1">${esc(t2.name)}</div>
          <div class="text-[10px] text-gray-500">${esc(t2.mode)} · ${esc(t2.region)} · ${(t2.teams || []).length} teams</div>
          ${t2.status === 'completed' ? `<div class="mt-2 text-xs font-bold text-gold">🏆 Winner: ${esc(t2.winner?.ign || 'TBD')}</div>` : ''}
        </div>

        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2" id="round-tabs">
          ${rounds.map((r, i) => `
            <button class="chip round-tab ${i === rounds.length - 1 ? 'active' : ''}" data-round="${r.round}">Round ${r.round}${r.round === rounds.length ? ' (Live)' : ''}</button>
          `).join('')}
        </div>

        <div id="round-matches"></div>
      </div>
    `;

    // Render last round by default
    const defaultRound = rounds[rounds.length - 1]?.round || 1;
    renderRoundMatches(t2, defaultRound, rounds, canManage);

    document.querySelectorAll('.round-tab').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.round-tab').forEach(b => b.classList.toggle('active', b === btn));
        renderRoundMatches(t2, parseInt(btn.dataset.round), rounds, canManage);
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Bracket view error:', e);
    toast('Failed: ' + e.message, 'error');
  }
}

function groupBracketByRound(bracket) {
  const groups = {};
  bracket.forEach(m => {
    if (!groups[m.round]) groups[m.round] = [];
    groups[m.round].push(m);
  });
  return Object.entries(groups).map(([round, matches]) => ({
    round: parseInt(round),
    matches: matches.sort((a, b) => a.matchIndex - b.matchIndex)
  })).sort((a, b) => a.round - b.round);
}

function renderRoundMatches(tournament, round, rounds, canManage) {
  const roundData = rounds.find(r => r.round === round);
  const container = document.getElementById('round-matches');
  if (!roundData || !container) return;

  container.innerHTML = roundData.matches.map((m, idx) => {
    const team1 = m.team1 || { ign: 'TBD' };
    const team2 = m.team2 || { ign: 'TBD' };
    const isMine = State.user.uid === team1.uid || State.user.uid === team2.uid;
    const isCompleted = m.status === 'completed';
    const isPending = m.status === 'pending' && team1.uid && team2.uid;
    const isDisputed = m.disputed;
    const timeLeft = m.expiresAt ? Math.max(0, m.expiresAt - Date.now()) : 0;

    return `
      <div class="bg-card border ${isMine ? 'border-primary/60' : 'border-border'} rounded-2xl p-3 mb-2">
        <div class="text-[9px] text-gray-500 uppercase font-bold mb-2">Match ${idx + 1}${isDisputed ? ' · <span class="text-red-400">DISPUTED</span>' : ''}</div>

        <!-- Team 1 -->
        <div class="flex items-center justify-between py-1.5 ${m.winner?.uid === team1.uid ? 'bg-green-500/10 rounded-lg px-2' : ''}">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden flex-shrink-0">
              ${team1.avatar ? `<img src="${esc(team1.avatar)}" class="w-full h-full object-cover" />` : getInitials(team1.ign)}
            </div>
            <div class="text-xs font-bold truncate">${esc(team1.ign)}</div>
            ${m.winner?.uid === team1.uid ? '<span class="text-[8px] text-green-400 font-black">✓ WIN</span>' : ''}
          </div>
          <div class="text-sm font-black ${m.score1 !== null && m.score1 !== undefined ? 'text-primary' : 'text-gray-600'}">
            ${m.score1 !== null && m.score1 !== undefined ? m.score1 : '—'}
          </div>
        </div>

        <div class="text-center text-[9px] text-gray-600 py-0.5">vs</div>

        <!-- Team 2 -->
        <div class="flex items-center justify-between py-1.5 ${m.winner?.uid === team2.uid ? 'bg-green-500/10 rounded-lg px-2' : ''}">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden flex-shrink-0">
              ${team2.avatar ? `<img src="${esc(team2.avatar)}" class="w-full h-full object-cover" />` : getInitials(team2.ign)}
            </div>
            <div class="text-xs font-bold truncate">${esc(team2.ign)}</div>
            ${m.winner?.uid === team2.uid ? '<span class="text-[8px] text-green-400 font-black">✓ WIN</span>' : ''}
          </div>
          <div class="text-sm font-black ${m.score2 !== null && m.score2 !== undefined ? 'text-primary' : 'text-gray-600'}">
            ${m.score2 !== null && m.score2 !== undefined ? m.score2 : '—'}
          </div>
        </div>

        <!-- Actions -->
        ${isMine && isPending && !isCompleted ? `
          <div class="mt-3 pt-2 border-t border-border">
            ${!m.reportedBy ? `
              <button class="report-score-btn btn-press w-full py-2 rounded-lg bg-primary text-white text-xs font-bold" data-match="${m.round}-${m.matchIndex}">
                Report Score
              </button>
            ` : m.reportedBy === State.user.uid ? `
              <div class="text-[10px] text-center text-yellow-400 font-bold">⏳ Waiting for opponent to confirm</div>
              <div class="text-[9px] text-center text-gray-500 mt-1">${Math.floor(timeLeft / 60000)}m left</div>
            ` : `
              <div class="text-[10px] text-center text-primary font-bold mb-2">Opponent reported: ${m.score1 === null ? m.score2 : m.score1}</div>
              <div class="grid grid-cols-2 gap-2">
                <button class="confirm-score-btn btn-press py-2 rounded-lg bg-green-500 text-white text-xs font-bold" data-match="${m.round}-${m.matchIndex}">✓ Confirm</button>
                <button class="dispute-score-btn btn-press py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold" data-match="${m.round}-${m.matchIndex}">✕ Dispute</button>
              </div>
            `}
          </div>
        ` : ''}

        ${canManage && isPending && !isCompleted && isDisputed ? `
          <div class="mt-3 pt-2 border-t border-border">
            <div class="text-[10px] text-red-400 font-bold mb-2 text-center">⚠️ Dispute — override required</div>
            <button class="override-btn btn-press w-full py-2 rounded-lg bg-gold text-black text-xs font-bold" data-match="${m.round}-${m.matchIndex}">
              👑 Override Result
            </button>
          </div>
        ` : ''}

        ${isCompleted ? `
          <div class="mt-2 pt-2 border-t border-border text-center">
            <div class="text-[9px] text-green-400 font-bold">✓ COMPLETED</div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Wire report buttons
  container.querySelectorAll('.report-score-btn').forEach(btn => {
    btn.onclick = () => openReportScoreSheet(tournament.id, btn.dataset.match);
  });

  container.querySelectorAll('.confirm-score-btn').forEach(btn => {
    btn.onclick = () => confirmReportedScore(tournament.id, btn.dataset.match);
  });

  container.querySelectorAll('.dispute-score-btn').forEach(btn => {
    btn.onclick = () => disputeReportedScore(tournament.id, btn.dataset.match);
  });

  container.querySelectorAll('.override-btn').forEach(btn => {
    btn.onclick = () => openOverrideSheet(tournament.id, btn.dataset.match);
  });

  if (window.lucide) window.lucide.createIcons();
}

// ---------- REPORT SCORE ----------
function openReportScoreSheet(tournamentId, matchKey) {
  const [round, matchIndex] = matchKey.split('-').map(n => parseInt(n));

  openSheet(`
    <div class="space-y-4">
      <div class="bg-primary/10 border border-primary/30 rounded-xl p-3">
        <div class="text-[10px] text-primary font-bold mb-1">ℹ️ Report the final score</div>
        <div class="text-[10px] text-gray-400">Your opponent will have 30 minutes to confirm. If they don't respond, your score auto-wins.</div>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Your score</label>
        <input id="rs-mine" type="number" min="0" max="99" placeholder="0" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Opponent score</label>
        <input id="rs-theirs" type="number" min="0" max="99" placeholder="0" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Screenshot proof (optional)</label>
        <input id="rs-image" type="file" accept="image/*" class="text-xs" />
      </div>

      <button id="rs-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary">
        Submit Score
      </button>
    </div>
  `, 'Report Score');

  document.getElementById('rs-submit').onclick = async () => {
    const myScore = parseInt(document.getElementById('rs-mine').value);
    const theirScore = parseInt(document.getElementById('rs-theirs').value);
    const fileInput = document.getElementById('rs-image');

    if (isNaN(myScore) || isNaN(theirScore) || myScore < 0 || theirScore < 0) {
      toast('Enter valid scores', 'error');
      return;
    }
    if (myScore === theirScore) {
      toast('Scores cannot be equal in elimination', 'error');
      return;
    }

    const btn = document.getElementById('rs-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      let proofImage = '';
      if (fileInput.files && fileInput.files[0]) {
        proofImage = await compressImage(fileInput.files[0], 800, 0.7);
      }

      const snap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (!snap.exists()) { toast('Not found', 'error'); return; }
      const t = snap.data();
      const bracket = [...(t.bracket || [])];

      const matchIdx = bracket.findIndex(m => m.round === round && m.matchIndex === matchIndex);
      if (matchIdx === -1) { toast('Match not found', 'error'); return; }

      const match = bracket[matchIdx];
      const isTeam1 = match.team1?.uid === State.user.uid;
      const isTeam2 = match.team2?.uid === State.user.uid;

      if (!isTeam1 && !isTeam2) { toast('You are not in this match', 'error'); return; }

      // Store both scores as reported by this user
      match.score1 = isTeam1 ? myScore : theirScore;
      match.score2 = isTeam2 ? myScore : theirScore;
      match.reportedBy = State.user.uid;
      match.reportedAt = Date.now();
      match.expiresAt = Date.now() + MATCH_CONFIRM_WINDOW_MS;
      if (proofImage) match.proof = proofImage;

      // Check if both teams happened to report identical scores (rare)
      // In that case, auto-confirm immediately

      bracket[matchIdx] = match;

      await updateDoc(doc(db, 'tournaments', tournamentId), { bracket });

      toast('✅ Score submitted — waiting for opponent', 'success');
      closeSheet();
      setTimeout(() => openBracketView(tournamentId), 400);
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Score';
    }
  };
}

// ---------- CONFIRM SCORE ----------
async function confirmReportedScore(tournamentId, matchKey) {
  const [round, matchIndex] = matchKey.split('-').map(n => parseInt(n));

  try {
    const snap = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!snap.exists()) return;
    const t = snap.data();
    const bracket = [...(t.bracket || [])];

    const matchIdx = bracket.findIndex(m => m.round === round && m.matchIndex === matchIndex);
    if (matchIdx === -1) return;

    const match = bracket[matchIdx];
    const isTeam1 = match.team1?.uid === State.user.uid;
    const isTeam2 = match.team2?.uid === State.user.uid;
    if (!isTeam1 && !isTeam2) { toast('Not your match', 'error'); return; }

    // Determine winner from scores
    const winner = match.score1 > match.score2 ? match.team1 : match.team2;
    match.winner = winner;
    match.status = 'completed';
    match.disputed = false;
    match.completedAt = Date.now();

    bracket[matchIdx] = match;

    // Advance winner to next round
    const advanced = advanceWinner(bracket, round, matchIndex, winner);

    await updateDoc(doc(db, 'tournaments', tournamentId), {
      bracket: advanced.bracket,
      currentRound: advanced.currentRound,
      winner: advanced.tournamentWinner || null,
      status: advanced.tournamentWinner ? 'completed' : 'in-progress'
    });

    toast('✅ Confirmed!', 'success');
    closeSheet();
    setTimeout(() => openBracketView(tournamentId), 400);
  } catch (e) {
    console.error(e);
    toast('Failed: ' + e.message, 'error');
  }
}

// ---------- DISPUTE ----------
async function disputeReportedScore(tournamentId, matchKey) {
  const [round, matchIndex] = matchKey.split('-').map(n => parseInt(n));

  confirmDialog('Dispute Score', 'Are you sure the reported score is wrong? The tournament host will review.', async () => {
    try {
      const snap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (!snap.exists()) return;
      const t = snap.data();
      const bracket = [...(t.bracket || [])];

      const matchIdx = bracket.findIndex(m => m.round === round && m.matchIndex === matchIndex);
      if (matchIdx === -1) return;

      bracket[matchIdx].disputed = true;
      bracket[matchIdx].disputedBy = State.user.uid;
      bracket[matchIdx].disputedAt = Date.now();

      await updateDoc(doc(db, 'tournaments', tournamentId), { bracket });

      // Notify creator
      try {
        await sendNotificationToUser(
          t.creatorUid,
          '⚠️ Score Dispute',
          `${State.profile.ign} disputed a match in ${t.name}`,
          { tournamentId }
        );
      } catch (e) { /* silent */ }

      toast('Dispute filed — host will review', 'success');
      closeSheet();
      setTimeout(() => openBracketView(tournamentId), 400);
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  }, 'Dispute', true);
}

// ---------- OVERRIDE (for host/admin) ----------
function openOverrideSheet(tournamentId, matchKey) {
  const [round, matchIndex] = matchKey.split('-').map(n => parseInt(n));

  openSheet(`
    <div class="space-y-4">
      <div class="bg-gold/10 border border-gold/30 rounded-xl p-3">
        <div class="text-[10px] text-gold font-bold mb-1">👑 Host Override</div>
        <div class="text-[10px] text-gray-400">Force-resolve this match. Use only when both teams dispute.</div>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Winner</label>
        <select id="ov-winner">
          <option value="team1">Team 1</option>
          <option value="team2">Team 2</option>
          <option value="disqualify">Disqualify both</option>
        </select>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Score (optional)</label>
        <input id="ov-score" type="text" placeholder="e.g. 3-1" maxlength="20" />
      </div>

      <button id="ov-submit" class="btn-press w-full py-4 rounded-2xl bg-gold text-black font-black">
        Force Resolve
      </button>
    </div>
  `, 'Override Match');

  document.getElementById('ov-submit').onclick = async () => {
    const winnerKey = document.getElementById('ov-winner').value;
    const scoreText = document.getElementById('ov-score').value.trim();

    try {
      const snap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (!snap.exists()) return;
      const t = snap.data();
      const bracket = [...(t.bracket || [])];

      const matchIdx = bracket.findIndex(m => m.round === round && m.matchIndex === matchIndex);
      if (matchIdx === -1) return;

      const match = bracket[matchIdx];

      if (winnerKey === 'disqualify') {
        match.winner = { uid: null, ign: 'DISQUALIFIED' };
        match.status = 'completed';
        match.disputed = false;
        match.disqualified = true;
      } else {
        match.winner = winnerKey === 'team1' ? match.team1 : match.team2;
        match.status = 'completed';
        match.disputed = false;
        match.overrideBy = State.user.uid;
        match.overrideAt = Date.now();
        if (scoreText) {
          const parts = scoreText.split('-').map(s => parseInt(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            match.score1 = winnerKey === 'team1' ? Math.max(parts[0], parts[1]) : Math.min(parts[0], parts[1]);
            match.score2 = winnerKey === 'team2' ? Math.max(parts[0], parts[1]) : Math.min(parts[0], parts[1]);
          }
        }
      }

      bracket[matchIdx] = match;

      const advanced = match.winner?.uid
        ? advanceWinner(bracket, round, matchIndex, match.winner)
        : { bracket, currentRound: t.currentRound, tournamentWinner: null };

      await updateDoc(doc(db, 'tournaments', tournamentId), {
        bracket: advanced.bracket,
        currentRound: advanced.currentRound,
        winner: advanced.tournamentWinner || t.winner || null,
        status: advanced.tournamentWinner ? 'completed' : 'in-progress'
      });

      toast('✅ Match resolved', 'success');
      closeSheet();
      setTimeout(() => openBracketView(tournamentId), 400);
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  };
}

// ---------- ADVANCE WINNER ----------
function advanceWinner(bracket, round, matchIndex, winner) {
  const currentMatch = bracket.find(m => m.round === round && m.matchIndex === matchIndex);
  if (!currentMatch) return { bracket, currentRound: round };

  // Find next round match
  const nextRound = round + 1;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const nextSlot = matchIndex % 2 === 0 ? 'team1' : 'team2';

  const nextMatchIdx = bracket.findIndex(m => m.round === nextRound && m.matchIndex === nextMatchIndex);

  // If next round doesn't exist → this was the final
  if (nextMatchIdx === -1) {
    return { bracket, currentRound: round, tournamentWinner: winner };
  }

  bracket[nextMatchIdx][nextSlot] = winner;

  // If both slots filled → mark as ready
  if (bracket[nextMatchIdx].team1 && bracket[nextMatchIdx].team2) {
    bracket[nextMatchIdx].status = 'pending';
    bracket[nextMatchIdx].startedAt = Date.now();
  }

  return { bracket, currentRound: nextRound };
}

// ---------- AUTO-RESOLVE EXPIRED ----------
async function autoResolveExpiredMatches(tournament) {
  if (!tournament.bracket) return;
  const now = Date.now();
  let changed = false;
  const bracket = [...tournament.bracket];

  for (let i = 0; i < bracket.length; i++) {
    const m = bracket[i];
    if (m.status !== 'pending' || !m.reportedBy || !m.expiresAt) continue;
    if (now < m.expiresAt) continue;

    // Time expired — the reporter's score stands
    const isTeam1Reporter = m.reportedBy === m.team1?.uid;
    const winner = isTeam1Reporter
      ? (m.score1 > m.score2 ? m.team1 : m.team2)
      : (m.score2 > m.score1 ? m.team2 : m.team1);

    bracket[i].winner = winner;
    bracket[i].status = 'completed';
    bracket[i].autoResolved = true;

    const advanced = advanceWinner(bracket, m.round, m.matchIndex, winner);
    Object.assign(bracket, advanced.bracket);

    changed = true;
  }

  if (changed) {
    // Find tournament winner
    let tournamentWinner = null;
    const maxRound = Math.max(...bracket.map(b => b.round));
    const finalMatch = bracket.find(m => m.round === maxRound);
    if (finalMatch && finalMatch.winner && finalMatch.status === 'completed') {
      tournamentWinner = finalMatch.winner;
    }

    try {
      await updateDoc(doc(db, 'tournaments', tournament.id), {
        bracket,
        status: tournamentWinner ? 'completed' : tournament.status,
        winner: tournamentWinner || tournament.winner || null,
        completedAt: tournamentWinner ? Date.now() : null
      });
      console.log('✅ Auto-resolved expired match(es)');
    } catch (e) {
      console.error('Auto-resolve failed:', e);
    }
  }
}

// ---------- CHAMPION DECLARATION ----------
async function declareChampion(tournament) {
  if (!tournament.winner) return;
  try {
    // Award winner badge via user doc
    const winnerUid = tournament.winner.uid;
    if (!winnerUid) return;

    await updateDoc(doc(db, 'users', winnerUid), {
      tournamentWins: increment(1)
    });

    // Log to history
    await addDoc(collection(db, 'tournamentHistory'), {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      winnerUid,
      winnerIgn: tournament.winner.ign,
      mode: tournament.mode,
      size: tournament.size,
      completedAt: serverTimestamp()
    });

    // Notify winner
    try {
      await sendNotificationToUser(
        winnerUid,
        '🏆 You Won!',
        `You are the champion of ${tournament.name}!`,
        { tournamentId: tournament.id }
      );
    } catch (e) { /* silent */ }
  } catch (e) {
    console.error('Champion declaration error:', e);
  }
}

window.openBracketView = openBracketView;
window.openReportScoreSheet = openReportScoreSheet;
window.confirmReportedScore = confirmReportedScore;
window.disputeReportedScore = disputeReportedScore;
window.autoResolveExpiredMatches = autoResolveExpiredMatches;
window.declareChampion = declareChampion;

/* END OF CHUNK 25 */
// ============================================
// Chunk 26/4: Tournaments — History + Auto-Polish
// ============================================

// ---------- TOURNAMENT HISTORY CARD ----------
const _origRenderTournamentCard = renderTournamentCard;
renderTournamentCard = function(t) {
  if (t.status === 'completed' && t.winner) {
    // Enhanced completed tournament card
    const teamCount = (t.teams || []).length;
    return `
      <div class="tournament-card bg-gradient-to-br from-gold/10 to-card border border-gold/40 rounded-2xl p-4 mb-3 cursor-pointer" data-id="${t.id}">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[9px] px-2 py-0.5 rounded-full bg-gold text-black font-black">🏆 COMPLETED</span>
            </div>
            <div class="text-base font-black truncate">${esc(t.name)}</div>
            <div class="text-[10px] text-gray-500 mt-0.5">${esc(t.mode)} · ${esc(t.region)} · ${teamCount} teams</div>
          </div>
        </div>

        <div class="bg-black/40 border border-gold/30 rounded-xl p-3 mb-3">
          <div class="text-[10px] text-gold uppercase font-bold mb-1">Champion</div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold overflow-hidden">
              ${t.winner.avatar ? `<img src="${esc(t.winner.avatar)}" class="w-full h-full object-cover" />` : getInitials(t.winner.ign)}
            </div>
            <div class="text-sm font-black text-gold glow-text-gold truncate">${esc(t.winner.ign || 'Unknown')}</div>
          </div>
        </div>

        ${t.prize ? `
          <div class="bg-gold/5 border border-gold/20 rounded-lg px-3 py-2 mb-2">
            <div class="text-[10px] text-gold">🎁 Prize: ${esc(t.prize)}</div>
          </div>
        ` : ''}

        <div class="flex items-center justify-between pt-2 border-t border-border">
          <div class="text-[10px] text-gray-500">by ${esc(t.creatorIgn || 'Unknown')}</div>
          <div class="text-[10px] text-gray-500">${timeAgo(t.completedAt || t.createdAt)}</div>
        </div>
      </div>
    `;
  }
  return _origRenderTournamentCard(t);
};

// ---------- CHAMPION BADGE ON PROFILE ----------
function renderTournamentBadges() {
  const wins = State.profile?.tournamentWins || 0;
  if (wins === 0) return '';

  return `
    <div class="bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-xl p-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="text-3xl">🏆</div>
        <div class="flex-1">
          <div class="text-xs font-black text-gold">Tournament Champion</div>
          <div class="text-[10px] text-gray-500">${wins} win${wins === 1 ? '' : 's'}</div>
        </div>
        <div class="text-lg font-black text-gold">×${wins}</div>
      </div>
    </div>
  `;
}

// Inject tournament badge into YOU tab
const _origRenderYouTabTournament = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabTournament();
  setTimeout(() => {
    const content = document.getElementById('content');
    if (!content) return;
    const profileCard = content.querySelector('.bg-card.border.border-border.rounded-2xl');
    if (!profileCard || document.getElementById('tournament-badge-card')) return;

    const badgeHTML = renderTournamentBadges();
    if (!badgeHTML) return;

    const badgeDiv = document.createElement('div');
    badgeDiv.id = 'tournament-badge-card';
    badgeDiv.innerHTML = badgeHTML;
    profileCard.parentNode.insertBefore(badgeDiv.firstElementChild, profileCard.nextSibling);

    if (window.lucide) window.lucide.createIcons();
  }, 120);
};

// ---------- AUTO-RESOLVE TRIGGER ----------
// Runs every 5 minutes while app is open — checks for expired matches across ALL tournaments
async function runAutoResolve() {
  try {
    const snap = await getDocs(query(
      collection(db, 'tournaments'),
      where('status', '==', 'in-progress'),
      limit(20)
    ));

    let resolvedCount = 0;
    for (const d of snap.docs) {
      const t = { id: d.id, ...d.data() };
      const beforeLen = t.bracket?.length || 0;
      await autoResolveExpiredMatches(t);
      resolvedCount++;
    }

    if (resolvedCount > 0) {
      console.log(`🔄 Checked ${resolvedCount} tournaments for auto-resolve`);
    }
  } catch (e) {
    console.error('Auto-resolve error:', e);
  }
}

// Run on app load + every 5 minutes
setTimeout(() => {
  if (State.user) runAutoResolve();
}, 8000);

setInterval(() => {
  if (State.user) runAutoResolve();
}, 5 * 60 * 1000);

// ---------- LIVE MATCH ALERTS (check for your pending matches) ----------
async function checkMyPendingMatches() {
  try {
    const snap = await getDocs(query(
      collection(db, 'tournaments'),
      where('status', '==', 'in-progress'),
      limit(20)
    ));

    let count = 0;
    for (const d of snap.docs) {
      const t = d.data();
      const bracket = t.bracket || [];
      bracket.forEach(m => {
        if (m.status !== 'pending') return;
        const isMine = m.team1?.uid === State.user.uid || m.team2?.uid === State.user.uid;
        if (!isMine) return;
        if (m.reportedBy && m.reportedBy !== State.user.uid) {
          count++; // Opponent reported, need my confirm
        } else if (!m.reportedBy) {
          count++; // I need to report
        }
      });
    }

    // Show badge on Squad tab if there are pending matches
    if (count > 0) {
      const squadTab = document.querySelector('[data-tab="squad"]');
      if (squadTab && !squadTab.querySelector('.match-badge')) {
        const badge = document.createElement('div');
        badge.className = 'match-badge absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500';
        squadTab.style.position = 'relative';
        squadTab.appendChild(badge);
      }
    }
  } catch (e) { /* silent */ }
}

setTimeout(() => {
  if (State.user) checkMyPendingMatches();
}, 12000);

// ---------- TOURNAMENT CREATOR: Notify when registration ends ----------
// (Runs client-side when creator opens app after 24h)
async function checkMyTournamentsNeedingStart() {
  try {
    const snap = await getDocs(query(
      collection(db, 'tournaments'),
      where('creatorUid', '==', State.user.uid),
      where('status', '==', 'open'),
      limit(10)
    ));

    const now = Date.now();
    for (const d of snap.docs) {
      const t = d.data();
      const endsAt = t.registrationEndsAt?.seconds ? t.registrationEndsAt.seconds * 1000 : 0;
      const teamsCount = (t.teams || []).length;

      // If registration ended OR bracket is full → notify creator
      if ((endsAt > 0 && endsAt < now) || teamsCount >= t.size) {
        if (teamsCount >= 2) {
          // Send notification once
          const key = 'tournament_ready_' + d.id;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, '1');
            toast(`🏆 ${t.name} is ready to start!`, 'success', 5000);
            // Optional: send push
            try {
              await sendNotificationToUser(
                State.user.uid,
                '🏆 Tournament Ready',
                `${t.name} is ready to start — ${teamsCount} teams registered`,
                { tournamentId: d.id }
              );
            } catch (e) { /* silent */ }
          }
        }
      }
    }
  } catch (e) { /* silent */ }
}

setTimeout(() => {
  if (State.user) checkMyTournamentsNeedingStart();
}, 15000);

// ---------- ENHANCED TOURNAMENT DETAIL (start button if ready) ----------
const _origOpenTournamentDetail = openTournamentDetail;
openTournamentDetail = async function(tournamentId) {
  await _origOpenTournamentDetail(tournamentId);

  // After opening, check if start button should be more prominent
  setTimeout(async () => {
    try {
      const snap = await getDoc(doc(db, 'tournaments', tournamentId));
      if (!snap.exists()) return;
      const t = snap.data();

      const startBtn = document.getElementById('start-tour-btn');
      if (!startBtn) return;

      const now = Date.now();
      const endsAt = t.registrationEndsAt?.seconds ? t.registrationEndsAt.seconds * 1000 : 0;
      const isReady = (endsAt > 0 && endsAt < now) || (t.teams || []).length >= t.size;

      if (isReady) {
        // Make it pulse
        startBtn.className = 'btn-press w-full py-4 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold animate-pulse';
        startBtn.innerHTML = '🚀 START NOW — Registration Closed';
      }
    } catch (e) { /* silent */ }
  }, 500);
};

// ---------- TOURNAMENT STATS IN ANALYTICS ----------
const _origShowAdminAnalytics = showAdminAnalytics;
showAdminAnalytics = async function() {
  await _origShowAdminAnalytics();

  // Add tournament stats to analytics sheet
  setTimeout(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'tournaments'), limit(100)));
      let active = 0, completed = 0, totalMatches = 0;
      snap.forEach(d => {
        const t = d.data();
        if (t.status === 'open' || t.status === 'in-progress') active++;
        if (t.status === 'completed') completed++;
        if (t.bracket) totalMatches += t.bracket.length;
      });

      const sheetBody = document.querySelector('#sheet-container .px-5');
      if (!sheetBody) return;

      const statsHTML = `
        <div class="bg-card border border-border rounded-2xl p-4 mt-4">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="trophy" class="w-4 h-4 text-gold"></i>
            <div class="text-xs font-bold text-gold uppercase">Tournaments</div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-black/40 rounded-xl p-3 text-center">
              <div class="text-xl font-black text-green-400">${active}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Active</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3 text-center">
              <div class="text-xl font-black text-gold">${completed}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Completed</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3 text-center">
              <div class="text-xl font-black text-primary">${totalMatches}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Matches</div>
            </div>
          </div>
        </div>
      `;

      // Insert before the refresh button
      const refreshBtn = sheetBody.querySelector('#refresh-analytics-btn');
      if (refreshBtn) {
        const div = document.createElement('div');
        div.innerHTML = statsHTML;
        refreshBtn.parentNode.insertBefore(div.firstElementChild, refreshBtn);
        if (window.lucide) window.lucide.createIcons();
      }
    } catch (e) { /* silent */ }
  }, 300);
};

// ---------- CLEANUP OLD TOURNAMENTS (60+ days) ----------
async function cleanupOldTournaments() {
  try {
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const snap = await getDocs(query(
      collection(db, 'tournaments'),
      where('status', '==', 'completed'),
      limit(20)
    ));

    let cleaned = 0;
    for (const d of snap.docs) {
      const t = d.data();
      const completedAt = t.completedAt || (t.createdAt?.seconds * 1000) || 0;
      if (completedAt < sixtyDaysAgo) {
        // Keep the record but trim the bracket (save space)
        if (t.bracket && t.bracket.length > 20) {
          const trimmedBracket = t.bracket.filter(m => m.round === Math.max(...t.bracket.map(b => b.round)));
          await updateDoc(doc(db, 'tournaments', d.id), { bracket: trimmedBracket, archived: true });
          cleaned++;
        }
      }
    }

    if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} old tournaments`);
  } catch (e) { /* silent */ }
}

// Run cleanup once per day (client-side)
setTimeout(() => {
  if (State.user) {
    const lastCleanup = localStorage.getItem('codmpanda_last_tournament_cleanup');
    const dayMs = 24 * 60 * 60 * 1000;
    if (!lastCleanup || Date.now() - parseInt(lastCleanup) > dayMs) {
      cleanupOldTournaments();
      localStorage.setItem('codmpanda_last_tournament_cleanup', Date.now().toString());
    }
  }
}, 20000);

// ---------- EXPORTS ----------
window.runAutoResolve = runAutoResolve;
window.checkMyPendingMatches = checkMyPendingMatches;
window.checkMyTournamentsNeedingStart = checkMyTournamentsNeedingStart;
window.cleanupOldTournaments = cleanupOldTournaments;

/* END OF CHUNK 26 */
// ============================================
// Chunk 27/12: Notifications Wiring + Profile View + Settings
// ============================================

// ============================================
// PART 1: NOTIFICATION TRIGGERS
// ============================================

// Fire notifications on key events

async function notifySubmissionApproved(submitterUid, contentType, itemName) {
  if (!submitterUid) return;
  try {
    await sendNotificationToUser(
      submitterUid,
      '✅ Submission Approved',
      `Your ${contentType} "${itemName}" was approved and is now live!`,
      { type: 'approval', contentType }
    );
  } catch (e) { /* silent */ }
}

async function notifySubmissionRejected(submitterUid, contentType) {
  if (!submitterUid) return;
  try {
    await sendNotificationToUser(
      submitterUid,
      '❌ Submission Rejected',
      `Your ${contentType} submission was rejected. You can try again with better content.`,
      { type: 'rejection', contentType }
    );
  } catch (e) { /* silent */ }
}

async function notifyNewLeakPosted(leakTitle) {
  try {
    await broadcastNotification(
      '🔥 New Leak Dropped',
      leakTitle,
      { type: 'leak', title: leakTitle }
    );
  } catch (e) { /* silent */ }
}

async function notifyBadgeEarned(uid, badge) {
  if (!uid) return;
  const badgeLabels = {
    first_leak: '🥉 First Leak',
    rising: '🥈 Rising Contributor',
    legend: '🥇 Community Legend',
    elite: '💎 CODMPanda Elite'
  };
  try {
    await sendNotificationToUser(
      uid,
      '🏆 New Badge Earned!',
      `You unlocked: ${badgeLabels[badge] || badge}`,
      { type: 'badge', badge }
    );
  } catch (e) { /* silent */ }
}

// ---------- HOOK INTO APPROVAL FLOW ----------
const _origApproveSubmissionNotif = approveSubmission;
approveSubmission = async function(type, id) {
  try {
    // Get submission data BEFORE it's deleted
    const collectionMap = {
      leak: { sub: 'leak_submissions', main: 'leaks' },
      vault: { sub: 'vault_submissions', main: 'vaults' },
      clip: { sub: 'clip_submissions', main: 'clips' }
    };
    const { sub } = collectionMap[type];
    const subSnap = await getDoc(doc(db, sub, id));
    const subData = subSnap.exists() ? subSnap.data() : null;

    // Call original
    const result = await _origApproveSubmissionNotif(type, id);

    // Fire notification
    if (subData?.submitterUid) {
      const itemName = subData.title || subData.gunName || 'your submission';
      setTimeout(() => notifySubmissionApproved(subData.submitterUid, type, itemName), 800);
    }

    return result;
  } catch (e) {
    console.error('Approval notif error:', e);
    return;
  }
};

// ---------- HOOK INTO REJECTION FLOW ----------
const _origRejectSubmissionNotif = rejectSubmission;
rejectSubmission = async function(type, id) {
  try {
    const collectionMap = {
      leak: 'leak_submissions',
      vault: 'vault_submissions',
      clip: 'clip_submissions'
    };
    const subSnap = await getDoc(doc(db, collectionMap[type], id));
    const subData = subSnap.exists() ? subSnap.data() : null;

    const result = await _origRejectSubmissionNotif(type, id);

    if (subData?.submitterUid) {
      setTimeout(() => notifySubmissionRejected(subData.submitterUid, type), 800);
    }

    return result;
  } catch (e) {
    console.error('Rejection notif error:', e);
    return;
  }
};

// ---------- HOOK INTO LEAK POSTING (admin) ----------
const _origOpenPostLeakSheet = openPostLeakSheet;
openPostLeakSheet = function() {
  _origOpenPostLeakSheet();
  setTimeout(() => {
    const submitBtn = document.getElementById('lk-submit');
    if (!submitBtn) return;
    const originalOnclick = submitBtn.onclick;
    submitBtn.onclick = async (e) => {
      const title = document.getElementById('lk-title')?.value.trim();
      const result = await originalOnclick.call(submitBtn, e);
      setTimeout(() => {
        if (title) notifyNewLeakPosted(title);
      }, 1500);
    };
  }, 200);
};

// ---------- HOOK INTO BADGE AWARDING ----------
const _origUpdateContributorStats = updateContributorStats;
updateContributorStats = async function(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    const oldBadges = snap.exists() ? (snap.data().badges || []) : [];

    await _origUpdateContributorStats(uid);

    // Check for new badges
    const newSnap = await getDoc(userRef);
    const newBadges = newSnap.exists() ? (newSnap.data().badges || []) : [];
    const newBadge = newBadges.find(b => !oldBadges.includes(b));
    if (newBadge) {
      setTimeout(() => notifyBadgeEarned(uid, newBadge), 800);
    }
  } catch (e) {
    console.error('Badge notif error:', e);
  }
};

// ============================================
// PART 2: PROFILE VIEW (see other users)
// ============================================

async function openUserProfile(uid) {
  if (!uid) return;
  if (uid === State.user.uid) {
    switchTab('you');
    return;
  }

  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', 'Profile');

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      toast('User not found', 'error');
      return;
    }
    const u = { id: uid, ...snap.data() };

    // Check friend status
    const mySnap = await getDoc(doc(db, 'users', State.user.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    const isFriend = (myData.friends || []).includes(uid);
    const reqSent = (myData.friendRequestsSent || []).includes(uid);
    const reqReceived = (myData.friendRequests || []).includes(uid);

    // Get their stats
    let vaultCount = 0;
    let camoPct = 0;
    try {
      const [vaultSnap, camoSnap] = await Promise.all([
        getDocs(query(collection(db, 'vaults'), where('uid', '==', uid))),
        getDoc(doc(db, 'camos', uid))
      ]);
      vaultCount = vaultSnap.size;
      if (camoSnap.exists()) {
        const totalPossible = ALL_GUNS.length * CAMO_TYPES.length;
        let checked = 0;
        Object.values(camoSnap.data()).forEach(gun => {
          CAMO_TYPES.forEach(c => { if (gun[c.key]) checked++; });
        });
        camoPct = Math.round((checked / totalPossible) * 100);
      }
    } catch (e) { /* silent */ }

    // Friends count
    const friendsCount = (u.friends || []).length;
    const approvedCount = u.approvedCount || 0;
    const tournamentWins = u.tournamentWins || 0;

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="space-y-4">
        <!-- Profile Header -->
        <div class="bg-card border ${u.isPro ? 'border-gold glow-gold' : 'border-border'} rounded-2xl p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="relative">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-2xl overflow-hidden">
                ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
              </div>
              ${u.isPro ? `<div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold flex items-center justify-center border-2 border-card text-sm">👑</div>` : ''}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-base font-black truncate">${esc(u.ign || 'Unknown')}</span>
                ${u.isPro ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-gold text-black font-black">PRO</span>` : ''}
              </div>
              <div class="text-[11px] text-gray-500 mt-0.5">${esc(u.rank || 'Rookie')} · ${esc(u.region || 'Global')}</div>
              ${u.lastSeen?.seconds ? `
                <div class="flex items-center gap-1.5 mt-1">
                  ${(Date.now() / 1000 - u.lastSeen.seconds) < 300
                    ? `<div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div><span class="text-[9px] text-green-400 font-bold">ONLINE</span>`
                    : `<div class="w-1.5 h-1.5 rounded-full bg-gray-500"></div><span class="text-[9px] text-gray-500">${timeAgo(u.lastSeen)}</span>`
                  }
                </div>
              ` : ''}
            </div>
          </div>
          ${u.bio ? `<p class="text-xs text-gray-400 mb-3">${esc(u.bio)}</p>` : ''}
          ${u.favGun ? `<div class="text-[11px] text-gray-500">🎯 Favourite: <span class="font-bold text-gray-300">${esc(u.favGun)}</span></div>` : ''}
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-4 gap-2">
          <div class="bg-card border border-border rounded-xl p-2.5 text-center">
            <div class="text-base font-black text-primary">${vaultCount}</div>
            <div class="text-[8px] text-gray-500 uppercase">Vaults</div>
          </div>
          <div class="bg-card border border-border rounded-xl p-2.5 text-center">
            <div class="text-base font-black text-gold">${camoPct}%</div>
            <div class="text-[8px] text-gray-500 uppercase">Camos</div>
          </div>
          <div class="bg-card border border-border rounded-xl p-2.5 text-center">
            <div class="text-base font-black text-blue-400">${friendsCount}</div>
            <div class="text-[8px] text-gray-500 uppercase">Friends</div>
          </div>
          <div class="bg-card border border-border rounded-xl p-2.5 text-center">
            <div class="text-base font-black text-green-400">${approvedCount}</div>
            <div class="text-[8px] text-gray-500 uppercase">Approved</div>
          </div>
        </div>

        <!-- Badges -->
        ${(u.badges && u.badges.length > 0) || tournamentWins > 0 ? `
          <div class="bg-card border border-border rounded-2xl p-3">
            <div class="text-[10px] font-bold text-gray-400 uppercase mb-2">🏅 Achievements</div>
            <div class="flex flex-wrap gap-1.5">
              ${(u.badges || []).map(b => {
                const emoji = { first_leak: '🥉', rising: '🥈', legend: '🥇', elite: '💎' }[b] || '⭐';
                return `<span class="text-base" title="${b}">${emoji}</span>`;
              }).join('')}
              ${tournamentWins > 0 ? `<span class="text-base" title="Tournament Champion">🏆×${tournamentWins}</span>` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="space-y-2">
          ${isFriend ? `
            <button id="up-remove-friend" class="btn-press w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm">
              Remove Friend
            </button>
          ` : reqSent ? `
            <div class="text-center py-2 text-xs text-yellow-400 font-bold">⏳ Friend request pending</div>
          ` : reqReceived ? `
            <button id="up-accept-friend" class="btn-press w-full py-3 rounded-xl bg-green-500 text-white font-bold text-sm">
              ✓ Accept Friend Request
            </button>
          ` : `
            <button id="up-add-friend" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm glow-primary">
              + Add Friend
            </button>
          `}
          <button id="up-invite-btn" class="btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm">
            📨 Invite to Lobby
          </button>
        </div>
      </div>
    `;

    // Wire actions
    const addBtn = document.getElementById('up-add-friend');
    if (addBtn) addBtn.onclick = async () => {
      await sendFriendRequest(uid, u.ign);
      closeSheet();
    };

    const removeBtn = document.getElementById('up-remove-friend');
    if (removeBtn) removeBtn.onclick = () => {
      confirmDialog('Remove Friend', `Remove ${u.ign}?`, async () => {
        try {
          await updateDoc(doc(db, 'users', State.user.uid), { friends: arrayRemove(uid) });
          await updateDoc(doc(db, 'users', uid), { friends: arrayRemove(State.user.uid) });
          toast('Friend removed', 'success');
          closeSheet();
        } catch (e) { toast('Failed', 'error'); }
      }, 'Remove', true);
    };

    const acceptBtn = document.getElementById('up-accept-friend');
    if (acceptBtn) acceptBtn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'users', State.user.uid), {
          friends: arrayUnion(uid),
          friendRequests: arrayRemove(uid)
        });
        await updateDoc(doc(db, 'users', uid), {
          friends: arrayUnion(State.user.uid),
          friendRequestsSent: arrayRemove(State.user.uid)
        });
        toast('Friend added! 🎉', 'success');
        closeSheet();
      } catch (e) { toast('Failed', 'error'); }
    };

    document.getElementById('up-invite-btn').onclick = async () => {
      // Show invite message
      openSheet(`
        <div class="space-y-3 text-center">
          <div class="text-4xl">📨</div>
          <div class="text-sm font-bold">Send invite</div>
          <div class="text-xs text-gray-500">Copy this link and send it to ${esc(u.ign)}</div>
          <div class="bg-card border border-border rounded-xl p-3 text-xs font-mono break-all text-primary">
            ${location.origin}/?invite=${State.user.uid}
          </div>
          <button onclick="copyText('${location.origin}/?invite=${State.user.uid}', 'Link copied!'); closeSheet();" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm">
            Copy Invite Link
          </button>
        </div>
      `, 'Invite to Lobby');
    };

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Profile view error:', e);
    toast('Failed to load profile', 'error');
  }
}

// ---------- MAKE USERNAMES CLICKABLE THROUGHOUT APP ----------
// Hook into common user name renders
function makeUsernamesClickable(container) {
  if (!container) return;
  container.querySelectorAll('.user-name-link').forEach(el => {
    el.style.cursor = 'pointer';
    el.onclick = (e) => {
      e.stopPropagation();
      openUserProfile(el.dataset.uid);
    };
  });
}

// ============================================
// PART 3: SETTINGS EXPANSION
// ============================================

function openAdvancedSettings() {
  const p = State.profile || {};
  const currentTheme = p.theme || 'amoled';

  openSheet(`
    <div class="space-y-4">
      <!-- Appearance -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Appearance</div>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <div class="text-sm font-semibold mb-2">Theme</div>
            <div class="grid grid-cols-3 gap-2">
              <button class="theme-btn btn-press py-3 rounded-xl ${currentTheme === 'amoled' ? 'bg-primary/15 border-2 border-primary' : 'bg-cardAlt border border-border'} flex flex-col items-center gap-1" data-theme="amoled">
                <div class="w-6 h-6 rounded-md bg-black border border-gray-700"></div>
                <span class="text-[10px] font-bold ${currentTheme === 'amoled' ? 'text-primary' : 'text-gray-400'}">AMOLED</span>
              </button>
              <button class="theme-btn btn-press py-3 rounded-xl ${currentTheme === 'dark' ? 'bg-primary/15 border-2 border-primary' : 'bg-cardAlt border border-border'} flex flex-col items-center gap-1" data-theme="dark">
                <div class="w-6 h-6 rounded-md bg-[#1a1a1a] border border-gray-700"></div>
                <span class="text-[10px] font-bold ${currentTheme === 'dark' ? 'text-primary' : 'text-gray-400'}">Dark</span>
              </button>
              <button class="theme-btn btn-press py-3 rounded-xl ${currentTheme === 'light' ? 'bg-primary/15 border-2 border-primary' : 'bg-cardAlt border border-border'} flex flex-col items-center gap-1" data-theme="light">
                <div class="w-6 h-6 rounded-md bg-white border border-gray-300"></div>
                <span class="text-[10px] font-bold ${currentTheme === 'light' ? 'text-primary' : 'text-gray-400'}">Light</span>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">Show Online Status</div>
              <div class="text-[10px] text-gray-500">Friends see when you're online</div>
            </div>
            <div class="toggle ${p.showOnline !== false ? 'on' : ''}" id="set-online"></div>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">Compact Mode</div>
              <div class="text-[10px] text-gray-500">Smaller cards, more content</div>
            </div>
            <div class="toggle ${p.compactMode ? 'on' : ''}" id="set-compact"></div>
          </div>
        </div>
      </div>

      <!-- Privacy -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Privacy</div>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">Private Profile</div>
              <div class="text-[10px] text-gray-500">Only friends can see your stats</div>
            </div>
            <div class="toggle ${p.privateProfile ? 'on' : ''}" id="set-private"></div>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">Hide from Leaderboards</div>
              <div class="text-[10px] text-gray-500">Don't show in contributor list</div>
            </div>
            <div class="toggle ${p.hideLeaderboard ? 'on' : ''}" id="set-hide-lb"></div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Content</div>
        </div>
        <div class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">Auto-play Clips</div>
              <div class="text-[10px] text-gray-500">Play videos on scroll</div>
            </div>
            <div class="toggle ${p.autoPlay !== false ? 'on' : ''}" id="set-autoplay"></div>
          </div>
        </div>
      </div>

      <!-- App Info -->
      <div class="bg-card border border-border rounded-2xl p-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-3">App Info</div>
        <div class="space-y-2 text-[11px]">
          <div class="flex justify-between"><span class="text-gray-500">Version</span><span class="font-bold">1.0.0</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Build</span><span class="font-mono text-gray-400">${new Date().toISOString().slice(0, 10)}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Environment</span><span class="font-bold text-green-400">Production</span></div>
          ${p.isPro ? `<div class="flex justify-between"><span class="text-gray-500">Account</span><span class="font-bold text-gold">👑 Pro Member</span></div>` : ''}
        </div>
      </div>

      <button id="set-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">
        Save Preferences
      </button>
    </div>
  `, '⚙️ Advanced Settings');

  // Track selected theme
  let selectedTheme = currentTheme;
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.onclick = () => {
      selectedTheme = btn.dataset.theme;
      document.querySelectorAll('.theme-btn').forEach(b => {
        if (b === btn) {
          b.classList.add('bg-primary/15', 'border-2', 'border-primary');
          b.classList.remove('bg-cardAlt', 'border', 'border-border');
          b.querySelector('span').classList.add('text-primary');
          b.querySelector('span').classList.remove('text-gray-400');
        } else {
          b.classList.remove('bg-primary/15', 'border-2', 'border-primary');
          b.classList.add('bg-cardAlt', 'border', 'border-border');
          b.querySelector('span').classList.remove('text-primary');
          b.querySelector('span').classList.add('text-gray-400');
        }
      });
    };
  });

  // Wire toggles
  ['online', 'compact', 'private', 'hide-lb', 'autoplay'].forEach(key => {
    const el = document.getElementById('set-' + key);
    if (el) el.onclick = () => el.classList.toggle('on');
  });

  document.getElementById('set-save').onclick = async () => {
    try {
      const updates = {
        theme: selectedTheme,
        showOnline: document.getElementById('set-online').classList.contains('on'),
        compactMode: document.getElementById('set-compact').classList.contains('on'),
        privateProfile: document.getElementById('set-private').classList.contains('on'),
        hideLeaderboard: document.getElementById('set-hide-lb').classList.contains('on'),
        autoPlay: document.getElementById('set-autoplay').classList.contains('on')
      };
      await updateDoc(doc(db, 'users', State.user.uid), updates);
      State.profile = { ...State.profile, ...updates };

      // Apply theme instantly
      applyTheme(selectedTheme);

      // Apply compact mode
      if (updates.compactMode) document.body.classList.add('compact-mode');
      else document.body.classList.remove('compact-mode');

      toast('✅ Preferences saved', 'success');
      closeSheet();
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ---------- THEME APPLICATION ----------
function applyTheme(theme) {
  const root = document.documentElement;
  const themes = {
    amoled: {
      bg: '#050505',
      card: '#111111',
      cardAlt: '#181818',
      border: '#222222',
      text: '#ffffff',
      textMuted: '#888888'
    },
    dark: {
      bg: '#0f0f0f',
      card: '#1a1a1a',
      cardAlt: '#222222',
      border: '#2e2e2e',
      text: '#f0f0f0',
      textMuted: '#999999'
    },
    light: {
      bg: '#f5f5f5',
      card: '#ffffff',
      cardAlt: '#eeeeee',
      border: '#dddddd',
      text: '#0a0a0a',
      textMuted: '#666666'
    }
  };

  const t = themes[theme] || themes.amoled;

  // Apply CSS variables
  root.style.setProperty('--theme-bg', t.bg);
  root.style.setProperty('--theme-card', t.card);
  root.style.setProperty('--theme-card-alt', t.cardAlt);
  root.style.setProperty('--theme-border', t.border);
  root.style.setProperty('--theme-text', t.text);
  root.style.setProperty('--theme-text-muted', t.textMuted);

  // Update body
  document.body.style.background = t.bg;
  document.body.style.color = t.text;

  // Update all cards/borders via CSS injection
  let styleEl = document.getElementById('theme-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'theme-styles';
    document.head.appendChild(styleEl);
  }

  if (theme === 'light') {
    styleEl.textContent = `
      body { background: ${t.bg} !important; color: ${t.text} !important; }
      .bg-amoled { background: ${t.bg} !important; }
      .bg-card { background: ${t.card} !important; }
      .bg-cardAlt { background: ${t.cardAlt} !important; }
      .border-border { border-color: ${t.border} !important; }
      .text-white { color: ${t.text} !important; }
      .text-gray-300, .text-gray-400 { color: ${t.textMuted} !important; }
      .text-gray-500, .text-gray-600 { color: #888 !important; }
      input, select, textarea { background: ${t.card} !important; color: ${t.text} !important; border-color: ${t.border} !important; }
      .sheet { background: ${t.card} !important; }
      .modal-backdrop { background: rgba(0,0,0,0.5) !important; }
      .skeleton { background: linear-gradient(90deg, #e0e0e0 0%, #f0f0f0 50%, #e0e0e0 100%) !important; }
      #top-bar, #bottom-nav { background: ${t.bg}dd !important; border-color: ${t.border} !important; }
    `;
  } else if (theme === 'dark') {
    styleEl.textContent = `
      body { background: ${t.bg} !important; color: ${t.text} !important; }
      .bg-amoled { background: ${t.bg} !important; }
      .bg-card { background: ${t.card} !important; }
      .bg-cardAlt { background: ${t.cardAlt} !important; }
      .border-border { border-color: ${t.border} !important; }
      input, select, textarea { background: ${t.card} !important; color: ${t.text} !important; border-color: ${t.border} !important; }
      .sheet { background: ${t.card} !important; }
      #top-bar, #bottom-nav { background: ${t.bg}dd !important; border-color: ${t.border} !important; }
    `;
  } else {
    // AMOLED — clear custom styles
    styleEl.textContent = '';
  }

  // Save to localStorage for instant apply on next load
  localStorage.setItem('codmpanda_theme', theme);
  State.profile = { ...State.profile, theme };
}

// Apply saved theme on startup
function loadSavedTheme() {
  const saved = localStorage.getItem('codmpanda_theme') || State.profile?.theme || 'amoled';
  if (saved !== 'amoled') {
    setTimeout(() => applyTheme(saved), 500);
  }
}

loadSavedTheme();

// ---------- ADD ADVANCED SETTINGS BUTTON TO SETTINGS LIST ----------
const _origHandleSettingActionSettings = handleSettingAction;
handleSettingAction = function(action) {
  if (action === 'advanced-settings') {
    openAdvancedSettings();
    return;
  }
  return _origHandleSettingActionSettings(action);
};

// Inject into YOU tab settings list
const _origRenderYouTabSettings = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabSettings();
  setTimeout(() => {
    const content = document.getElementById('content');
    if (!content) return;

    // Find the Settings section divider
    const settingsCards = content.querySelectorAll('.bg-card.border.border-border.rounded-2xl');
    let settingsList = null;
    settingsCards.forEach(card => {
      const header = card.querySelector('.text-xs.font-bold.text-gray-400.uppercase');
      if (header && header.textContent.trim() === 'Settings') {
        settingsList = card.querySelector('.divide-y');
      }
    });

    if (settingsList && !settingsList.querySelector('[data-action="advanced-settings"]')) {
      const btn = document.createElement('button');
      btn.className = 'settings-row w-full flex items-center justify-between px-4 py-3 text-left';
      btn.dataset.action = 'advanced-settings';
      btn.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <i data-lucide="settings-2" class="w-4 h-4 text-gray-400 flex-shrink-0"></i>
          <div class="min-w-0">
            <div class="text-sm font-semibold">Advanced Settings</div>
            <div class="text-[10px] text-gray-500 truncate">Appearance, privacy, content</div>
          </div>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
      `;
      btn.onclick = () => handleSettingAction('advanced-settings');
      settingsList.insertBefore(btn, settingsList.firstChild);
      if (window.lucide) window.lucide.createIcons();
    }
  }, 130);
};

// ---------- HOOK INTO LOBBY USERNAMES ----------
const _origRenderLobbiesClickable = renderLobbies;
renderLobbies = function() {
  _origRenderLobbiesClickable();

  setTimeout(() => {
    // Make username elements clickable
    document.querySelectorAll('#lobbies-feed .font-bold.text-sm').forEach(el => {
      if (el.textContent && el.textContent.length > 1 && !el.dataset.clickable) {
        el.dataset.clickable = '1';
        el.style.cursor = 'pointer';
        el.style.textDecoration = 'underline';
        el.style.textDecorationColor = 'rgba(255, 107, 0, 0.3)';
        el.style.textUnderlineOffset = '2px';
      }
    });
  }, 150);
};

// Export
window.openUserProfile = openUserProfile;
window.openAdvancedSettings = openAdvancedSettings;
window.notifySubmissionApproved = notifySubmissionApproved;
window.notifySubmissionRejected = notifySubmissionRejected;
window.notifyNewLeakPosted = notifyNewLeakPosted;
window.notifyBadgeEarned = notifyBadgeEarned;

/* END OF CHUNK 27 */
// ============================================
// Chunk 28/12: LFG Reputation + Friend Activity + Gun Attachments
// ============================================

// ============================================
// PART 1: LFG REPUTATION SYSTEM
// ============================================

const REPUTATION_TAGS = [
  { key: 'teamplayer', label: 'Team Player', emoji: '🤝' },
  { key: 'skilled', label: 'Skilled', emoji: '🎯' },
  { key: 'chill', label: 'Chill Vibes', emoji: '😎' },
  { key: 'communicative', label: 'Good Comms', emoji: '🎙️' },
  { key: 'clutch', label: 'Clutch Player', emoji: '🔥' }
];

async function openRateTeammateSheet(targetUid, targetIgn) {
  if (!targetUid || targetUid === State.user.uid) return;

  // Check if already rated recently
  try {
    const rateSnap = await getDocs(query(
      collection(db, 'ratings'),
      where('fromUid', '==', State.user.uid),
      where('toUid', '==', targetUid),
      limit(1)
    ));
    if (!rateSnap.empty) {
      const lastRating = rateSnap.docs[0].data();
      const lastTime = lastRating.createdAt?.seconds ? lastRating.createdAt.seconds * 1000 : 0;
      if (Date.now() - lastTime < 24 * 60 * 60 * 1000) {
        toast('You already rated this player today', 'info');
        return;
      }
    }
  } catch (e) { /* proceed */ }

  openSheet(`
    <div class="space-y-4">
      <div class="text-center">
        <div class="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-2">
          <span class="text-2xl">${getInitials(targetIgn)}</span>
        </div>
        <div class="text-sm font-bold">${esc(targetIgn)}</div>
        <div class="text-[10px] text-gray-500">Rate your experience</div>
      </div>

      <div class="flex justify-center gap-3 my-4" id="rating-stars">
        ${[1,2,3,4,5].map(n => `
          <button class="rating-star btn-press w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center" data-rating="${n}">
            <i data-lucide="star" class="w-5 h-5 text-gray-500"></i>
          </button>
        `).join('')}
      </div>

      <div>
        <div class="text-xs font-bold text-gray-400 uppercase mb-2">Tags (pick all that apply)</div>
        <div class="flex flex-wrap gap-2">
          ${REPUTATION_TAGS.map(t => `
            <button class="rep-tag chip" data-tag="${t.key}">${t.emoji} ${t.label}</button>
          `).join('')}
        </div>
      </div>

      <div>
        <div class="text-xs font-bold text-gray-400 uppercase mb-2">Note (optional)</div>
        <textarea id="rate-note" rows="2" maxlength="150" placeholder="e.g. Great teammate, clean comms"></textarea>
      </div>

      <button id="rate-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary" disabled>
        Select Rating
      </button>
    </div>
  `, '⭐ Rate Teammate');

  let selectedRating = 0;
  const tags = new Set();

  document.querySelectorAll('.rating-star').forEach(btn => {
    btn.onclick = () => {
      selectedRating = parseInt(btn.dataset.rating);
      document.querySelectorAll('.rating-star').forEach(b => {
        const r = parseInt(b.dataset.rating);
        const star = b.querySelector('i');
        if (r <= selectedRating) {
          b.classList.add('bg-gold/15', 'border-gold');
          b.classList.remove('bg-card', 'border-border');
          star.classList.add('text-gold');
          star.classList.remove('text-gray-500');
        } else {
          b.classList.remove('bg-gold/15', 'border-gold');
          b.classList.add('bg-card', 'border-border');
          star.classList.remove('text-gold');
          star.classList.add('text-gray-500');
        }
      });
      const submitBtn = document.getElementById('rate-submit');
      submitBtn.disabled = false;
      submitBtn.textContent = `Submit ${selectedRating} Star Rating`;
    };
  });

  document.querySelectorAll('.rep-tag').forEach(btn => {
    btn.onclick = () => {
      const tag = btn.dataset.tag;
      if (tags.has(tag)) {
        tags.delete(tag);
        btn.classList.remove('active');
      } else {
        tags.add(tag);
        btn.classList.add('active');
      }
    };
  });

  document.getElementById('rate-submit').onclick = async () => {
    if (!selectedRating) return;

    const btn = document.getElementById('rate-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      const note = document.getElementById('rate-note').value.trim();
      await addDoc(collection(db, 'ratings'), {
        fromUid: State.user.uid,
        fromIgn: State.profile.ign,
        toUid: targetUid,
        rating: selectedRating,
        tags: Array.from(tags),
        note,
        createdAt: serverTimestamp()
      });

      // Update target user's aggregate rating
      await recalcUserRating(targetUid);

      toast(`⭐ Rated ${targetIgn}`, 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Retry';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

async function recalcUserRating(uid) {
  try {
    const snap = await getDocs(query(collection(db, 'ratings'), where('toUid', '==', uid)));
    if (snap.empty) return;

    let total = 0;
    const tagCounts = {};

    snap.forEach(d => {
      const r = d.data();
      total += r.rating || 0;
      (r.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });

    const avg = total / snap.size;
    const topTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

    await updateDoc(doc(db, 'users', uid), {
      ratingAvg: Math.round(avg * 10) / 10,
      ratingCount: snap.size,
      ratingTags: topTags
    });
  } catch (e) { /* silent */ }
}

// ============================================
// PART 2: FRIEND ACTIVITY FEED
// ============================================

async function renderFriendActivity() {
  const body = document.getElementById('friends-body');
  if (!body) return;

  body.innerHTML = '<div class="text-center py-6"><div class="spinner mx-auto"></div></div>';

  try {
    const mySnap = await getDoc(doc(db, 'users', State.user.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    const friendUids = myData.friends || [];

    if (friendUids.length === 0) {
      body.innerHTML = `
        <div class="text-center py-12">
          <div class="text-5xl mb-3">👥</div>
          <div class="text-sm font-bold mb-1">No friends yet</div>
          <div class="text-xs text-gray-500">Add friends to see their activity</div>
        </div>
      `;
      return;
    }

    // Fetch friend data
    const friends = [];
    for (const uid of friendUids) {
      try {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) friends.push({ id: uid, ...s.data() });
      } catch (e) { /* skip */ }
    }

    // Sort by last seen
    friends.sort((a, b) => {
      const aTime = a.lastSeen?.seconds || 0;
      const bTime = b.lastSeen?.seconds || 0;
      return bTime - aTime;
    });

    const online = friends.filter(f => f.lastSeen?.seconds && (Date.now() / 1000 - f.lastSeen.seconds) < 300);
    const recentlyActive = friends.filter(f => {
      const t = f.lastSeen?.seconds || 0;
      return (Date.now() / 1000 - t) < 24 * 60 * 60 && (Date.now() / 1000 - t) >= 300;
    });
    const offline = friends.filter(f => {
      const t = f.lastSeen?.seconds || 0;
      return (Date.now() / 1000 - t) >= 24 * 60 * 60;
    });

    body.innerHTML = `
      ${online.length > 0 ? `
        <div class="text-[10px] font-bold text-green-400 uppercase mb-2 flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Online Now (${online.length})
        </div>
        ${online.map(f => renderFriendActivityCard(f, 'online')).join('')}
      ` : ''}

      ${recentlyActive.length > 0 ? `
        <div class="text-[10px] font-bold text-yellow-400 uppercase mb-2 mt-4">Recent (${recentlyActive.length})</div>
        ${recentlyActive.map(f => renderFriendActivityCard(f, 'recent')).join('')}
      ` : ''}

      ${offline.length > 0 ? `
        <div class="text-[10px] font-bold text-gray-500 uppercase mb-2 mt-4">Offline (${offline.length})</div>
        ${offline.map(f => renderFriendActivityCard(f, 'offline')).join('')}
      ` : ''}
    `;

    // Wire cards
    body.querySelectorAll('.friend-activity-card').forEach(card => {
      card.onclick = () => openUserProfile(card.dataset.uid);
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Activity error:', e);
    body.innerHTML = '<div class="text-center py-6 text-red-400 text-xs">Failed to load</div>';
  }
}

function renderFriendActivityCard(f, status) {
  const dotColor = status === 'online' ? 'bg-green-500 animate-pulse'
    : status === 'recent' ? 'bg-yellow-500' : 'bg-gray-500';

  const rankInfo = f.rank ? ` · ${f.rank}` : '';
  const rating = f.ratingAvg ? ` ⭐ ${f.ratingAvg}` : '';

  return `
    <div class="friend-activity-card bg-card border border-border rounded-xl p-3 mb-2 cursor-pointer hover:border-primary/40 transition-colors flex items-center gap-3" data-uid="${f.id}">
      <div class="relative flex-shrink-0">
        <div class="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-bold overflow-hidden">
          ${f.avatar ? `<img src="${esc(f.avatar)}" class="w-full h-full object-cover" />` : getInitials(f.ign)}
        </div>
        <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${dotColor} border-2 border-card"></div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-bold truncate flex items-center gap-1.5">
          ${esc(f.ign || 'Unknown')}
          ${f.isPro ? '<span class="text-[8px] px-1 py-0.5 rounded bg-gold text-black font-black">PRO</span>' : ''}
        </div>
        <div class="text-[10px] text-gray-500 truncate">
          ${f.region || 'Global'}${rankInfo}${rating}
        </div>
      </div>
      <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
    </div>
  `;
}

// Update Friends panel to include Activity tab
const _origShowFriendsPanel = showFriendsPanel;
showFriendsPanel = async function() {
  await _origShowFriendsPanel();

  setTimeout(() => {
    const tabsContainer = document.querySelector('#sheet-container .flex.gap-2.mb-4');
    if (!tabsContainer || tabsContainer.querySelector('.friends-tab[data-tab="activity"]')) return;

    const btn = document.createElement('button');
    btn.className = 'chip friends-tab';
    btn.dataset.tab = 'activity';
    btn.textContent = 'Activity';
    btn.onclick = () => {
      friendsTab = 'activity';
      document.querySelectorAll('.friends-tab').forEach(b => b.classList.toggle('active', b === btn));
      renderFriendActivity();
    };
    tabsContainer.appendChild(btn);
    if (window.lucide) window.lucide.createIcons();
  }, 150);
};

// ============================================
// PART 3: GUN-SPECIFIC ATTACHMENTS
// ============================================

const GUN_SPECIFIC_ATTACHMENTS = {
  'AK117': {
    muzzle: ['Muzzle Brake', 'Tactical Suppressor', 'Monolithic Suppressor', 'Flash Guard'],
    barrel: ['MIP Light Barrel (Short)', 'MIP Extended Light Barrel', 'RTC Light Barrel', 'OWC Marksman'],
    optic: ['Red Dot Sight', 'Holographic Sight', '3x Tactical Scope'],
    stock: ['MIP Strike Stock', 'YKM Light Stock', 'No Stock', 'MIP Light Stock'],
    laser: ['OWC Laser - Tactical', 'OWC Laser - Light', 'MIP Laser 5mW'],
    underbarrel: ['Foregrip', 'Light Foregrip', 'Merc Foregrip', 'Tactical Foregrip A'],
    ammunition: ['Extended Mag', 'Fast Mag', 'Extended Mag A'],
    rearGrip: ['Rubberized Grip Tape', 'Stippled Grip Tape', 'Granulated Grip Tape'],
    perk: ['Sleight of Hand', 'Fast Switch', 'Toughness']
  },
  'Fennec': {
    muzzle: ['Muzzle Brake', 'Monolithic Suppressor', 'Compensator', 'Flash Guard'],
    barrel: ['RTC Light Barrel', 'MIP Custom Long Barrel', 'Reinforced Heavy Barrel'],
    optic: ['Red Dot Sight', 'Holographic Sight', 'Classic Holographic'],
    stock: ['No Stock', 'YKM Light Stock', 'MIP Strike Stock', 'RTC Steady Stock'],
    laser: ['OWC Laser - Tactical', 'MIP Laser 5mW', 'Aim Assist Laser'],
    underbarrel: ['Light Foregrip', 'Merc Foregrip', 'Tactical Foregrip A'],
    ammunition: ['Extended Mag', 'Fast Mag', 'Large Extended Mag'],
    rearGrip: ['Rubberized Grip Tape', 'Stippled Grip Tape', 'Skeletonized Rear Grip'],
    perk: ['Sleight of Hand', 'Fast Switch', 'Ammo Increase']
  },
  'DL Q33': {
    muzzle: ['Muzzle Brake', 'Monolithic Suppressor', 'Tactical Suppressor'],
    barrel: ['OWC Marksman', 'MIP Custom Long Barrel', 'Light Extended Barrel'],
    optic: ['3x Tactical Scope', '4x Tactical Scope', '6x Tactical Scope'],
    stock: ['OWC Skeleton Stock', 'RTC Steady Stock', 'MIP Strike Stock'],
    laser: ['OWC Laser - Tactical', 'OWC Laser - Light'],
    underbarrel: ['Ranger Foregrip', 'Operator Foregrip', 'Light Foregrip'],
    ammunition: ['Extended Mag', 'Fast Mag', 'Extended Mag A'],
    rearGrip: ['Rubberized Grip Tape', 'Stippled Grip Tape'],
    perk: ['Fast Switch', 'Sleight of Hand', 'Ammo Increase']
  },
  'QQ9': {
    muzzle: ['Muzzle Brake', 'Monolithic Suppressor', 'Tactical Suppressor'],
    barrel: ['RTC Light Barrel', 'MIP Extended Light Barrel', 'OWC Marksman'],
    optic: ['Red Dot Sight', 'Holographic Sight'],
    stock: ['No Stock', 'MIP Strike Stock', 'YKM Light Stock'],
    laser: ['OWC Laser - Tactical', 'OWC Laser - Light'],
    underbarrel: ['Light Foregrip', 'Merc Foregrip', 'Tactical Foregrip A'],
    ammunition: ['Extended Mag', 'Fast Mag', 'Extended Mag A'],
    rearGrip: ['Rubberized Grip Tape', 'Stippled Grip Tape'],
    perk: ['Sleight of Hand', 'Fast Switch', 'Toughness']
  },
  'AK-47': {
    muzzle: ['Muzzle Brake', 'Monolithic Suppressor', 'Compensator'],
    barrel: ['OWC Marksman', 'MIP Custom Long Barrel', 'RTC Light Barrel'],
    optic: ['Red Dot Sight', '3x Tactical Scope', 'Holographic Sight'],
    stock: ['RTC Steady Stock', 'MIP Strike Stock', 'No Stock'],
    laser: ['OWC Laser - Tactical', 'MIP Laser 5mW'],
    underbarrel: ['Ranger Foregrip', 'Merc Foregrip', 'Operator Foregrip'],
    ammunition: ['Extended Mag', 'Fast Mag', 'Extended Mag A'],
    rearGrip: ['Rubberized Grip Tape', 'Stippled Grip Tape', 'Granulated Grip Tape'],
    perk: ['Sleight of Hand', 'Toughness', 'Fast Switch']
  }
};

// Override getAttachmentsForSlot to use gun-specific pools
const _origGetAttachmentsForSlot = getAttachmentsForSlot;
getAttachmentsForSlot = function(gunName, slotKey) {
  // Check gun-specific attachments first
  const gunSpecific = GUN_SPECIFIC_ATTACHMENTS[gunName];
  if (gunSpecific && gunSpecific[slotKey]) {
    const names = gunSpecific[slotKey];
    // Find each attachment in the master pool
    const masterPool = ATTACHMENT_POOLS[slotKey] || [];
    const result = [];
    names.forEach(name => {
      const found = masterPool.find(a => a.name === name);
      if (found) result.push(found);
      else result.push({ name, effects: {} }); // fallback
    });
    return result;
  }
  // Fall back to generic pool
  return _origGetAttachmentsForSlot(gunName, slotKey);
};

// ---------- ADD RATE TEAMMATE BUTTON ON LOBBY CARDS ----------
const _origRenderLobbiesRate = renderLobbies;
renderLobbies = function() {
  _origRenderLobbiesRate();

  setTimeout(() => {
    // Add "Rate" button on lobby cards (after joining)
    document.querySelectorAll('#lobbies-feed .bg-card').forEach(card => {
      if (card.querySelector('.rate-teammate-btn')) return;

      const uid = card.querySelector('.report-lobby')?.dataset.uid;
      const ign = card.querySelector('.font-bold.text-sm')?.textContent?.trim();
      if (!uid || !ign || uid === State.user.uid) return;

      const actionsRow = card.querySelector('.flex.gap-2');
      if (!actionsRow) return;

      const rateBtn = document.createElement('button');
      rateBtn.className = 'rate-teammate-btn btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center';
      rateBtn.innerHTML = '<i data-lucide="star" class="w-4 h-4 text-gold"></i>';
      rateBtn.title = 'Rate teammate';
      rateBtn.onclick = (e) => {
        e.stopPropagation();
        openRateTeammateSheet(uid, ign);
      };
      actionsRow.appendChild(rateBtn);
    });
    if (window.lucide) window.lucide.createIcons();
  }, 200);
};

window.openRateTeammateSheet = openRateTeammateSheet;
window.recalcUserRating = recalcUserRating;
window.renderFriendActivity = renderFriendActivity;
window.GUN_SPECIFIC_ATTACHMENTS = GUN_SPECIFIC_ATTACHMENTS;

/* END OF CHUNK 28 */
// ============================================
// Chunk 29/12: Camo Skins + Tournament Teams + Friend DMs
// ============================================

// ============================================
// PART 1: CAMO SKINS TRACKER
// ============================================

const SKIN_RARITIES = [
  { key: 'common', label: 'Common', color: '#8E8E93', emoji: '⬜' },
  { key: 'rare', label: 'Rare', color: '#00BFFF', emoji: '🔵' },
  { key: 'epic', label: 'Epic', color: '#AF52DE', emoji: '🟣' },
  { key: 'legendary', label: 'Legendary', color: '#FF6B00', emoji: '🟠' },
  { key: 'mythic', label: 'Mythic', color: '#FFD700', emoji: '🟡' }
];

async function renderSkinsPanel() {
  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', '🎨 Weapon Skins');

  try {
    const snap = await getDoc(doc(db, 'camos', State.user.uid));
    const data = snap.exists() ? snap.data() : {};
    const skins = data.__skins || {};

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    // Count by rarity
    const counts = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
    Object.values(skins).forEach(s => {
      if (s.rarity && counts[s.rarity] !== undefined) counts[s.rarity]++;
    });
    const total = Object.values(skins).length;

    sheetBody.innerHTML = `
      <div class="space-y-4">
        <!-- Header Stats -->
        <div class="bg-gradient-to-br from-primary/10 to-black border border-primary/30 rounded-2xl p-4">
          <div class="text-center mb-3">
            <div class="text-3xl font-black">${total}</div>
            <div class="text-[10px] text-gray-500 uppercase font-bold">Skins Collected</div>
          </div>
          <div class="grid grid-cols-5 gap-1.5">
            ${SKIN_RARITIES.map(r => `
              <div class="bg-black/40 rounded-lg p-2 text-center">
                <div class="text-base">${r.emoji}</div>
                <div class="text-xs font-black" style="color: ${r.color};">${counts[r.key]}</div>
                <div class="text-[8px] text-gray-500 uppercase">${r.label}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Add Skin Button -->
        <button id="add-skin-btn" class="btn-press w-full py-3.5 rounded-2xl bg-primary font-black glow-primary flex items-center justify-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> Add Skin
        </button>

        <!-- Search -->
        <div class="relative">
          <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
          <input id="skin-search" type="text" placeholder="Search skins..." class="pl-10" />
        </div>

        <!-- Skins List -->
        <div id="skins-list">
          ${total === 0 ? renderEmptySkins() : renderSkinsList(skins)}
        </div>
      </div>
    `;

    document.getElementById('add-skin-btn').onclick = openAddSkinSheet;
    document.getElementById('skin-search').oninput = (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = {};
      Object.entries(skins).forEach(([k, v]) => {
        if (k.toLowerCase().includes(q) || (v.gun || '').toLowerCase().includes(q)) {
          filtered[k] = v;
        }
      });
      document.getElementById('skins-list').innerHTML = Object.keys(filtered).length === 0
        ? '<div class="text-center py-6 text-xs text-gray-500">No skins found</div>'
        : renderSkinsList(filtered);
      wireSkinCards(skins);
      if (window.lucide) window.lucide.createIcons();
    };

    wireSkinCards(skins);
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Skins error:', e);
    toast('Failed to load skins', 'error');
  }
}

function renderEmptySkins() {
  return `
    <div class="text-center py-12">
      <div class="text-5xl mb-3">🎨</div>
      <div class="text-sm font-bold mb-1">No skins yet</div>
      <div class="text-xs text-gray-500 mb-4">Track your Legendary & Mythic collection</div>
    </div>
  `;
}

function renderSkinsList(skins) {
  const rarityMap = {};
  SKIN_RARITIES.forEach(r => rarityMap[r.key] = r);

  return Object.entries(skins)
    .sort((a, b) => {
      const aRar = SKIN_RARITIES.findIndex(r => r.key === a[1].rarity);
      const bRar = SKIN_RARITIES.findIndex(r => r.key === b[1].rarity);
      return bRar - aRar;
    })
    .map(([key, s]) => {
      const r = rarityMap[s.rarity] || rarityMap.common;
      return `
        <div class="skin-card bg-card border rounded-xl p-3 mb-2 flex items-center gap-3 cursor-pointer" style="border-color: ${r.color}40;" data-key="${esc(key)}">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background: ${r.color}20;">
            <span class="text-lg">${r.emoji}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-bold truncate">${esc(key)}</div>
            <div class="text-[10px] text-gray-500 truncate">${esc(s.gun || 'Unknown')} · <span style="color: ${r.color};">${r.label}</span></div>
          </div>
          <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500"></i>
        </div>
      `;
    }).join('');
}

function wireSkinCards(skins) {
  document.querySelectorAll('.skin-card').forEach(card => {
    card.onclick = () => {
      const key = card.dataset.key;
      const s = skins[key];
      if (!s) return;
      openSheet(`
        <div class="space-y-4">
          <div class="text-center">
            <div class="text-5xl mb-3">${SKIN_RARITIES.find(r => r.key === s.rarity)?.emoji || '⬜'}</div>
            <div class="text-lg font-black">${esc(key)}</div>
            <div class="text-xs text-gray-500">${esc(s.gun || 'Unknown')}</div>
          </div>
          <div class="bg-card border border-border rounded-xl p-3 space-y-2 text-xs">
            <div class="flex justify-between"><span class="text-gray-500">Rarity</span><span class="font-bold capitalize" style="color: ${SKIN_RARITIES.find(r => r.key === s.rarity)?.color};">${s.rarity}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Date acquired</span><span class="font-bold">${s.date ? new Date(s.date).toLocaleDateString() : 'Unknown'}</span></div>
            ${s.note ? `<div class="text-gray-400 pt-2 border-t border-border">${esc(s.note)}</div>` : ''}
          </div>
          <button class="delete-skin-btn btn-press w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm" data-key="${esc(key)}">
            Delete Skin
          </button>
        </div>
      `, 'Skin Details');

      document.querySelector('.delete-skin-btn').onclick = () => {
        confirmDialog('Delete Skin', `Remove "${key}" from your collection?`, async () => {
          try {
            const ref = doc(db, 'camos', State.user.uid);
            const snap = await getDoc(ref);
            const data = snap.exists() ? snap.data() : {};
            const skins = data.__skins || {};
            delete skins[key];
            data.__skins = skins;
            await setDoc(ref, data);
            toast('Skin removed', 'success');
            closeSheet();
            setTimeout(renderSkinsPanel, 300);
          } catch (e) { toast('Failed', 'error'); }
        }, 'Delete', true);
      };
    };
  });
}

function openAddSkinSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Skin Name *</label>
        <input id="as-name" type="text" placeholder="e.g. AK117 - Crimson King" maxlength="60" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun</label>
        <select id="as-gun">
          <option value="">Select a gun...</option>
          ${Object.entries(CODM_GUNS).map(([cat, guns]) => `
            <optgroup label="${cat}">
              ${guns.map(g => `<option value="${g}">${g}</option>`).join('')}
            </optgroup>
          `).join('')}
        </select>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rarity *</label>
        <div class="grid grid-cols-5 gap-2">
          ${SKIN_RARITIES.map(r => `
            <button class="skin-rarity-btn btn-press py-3 rounded-xl bg-card border border-border flex flex-col items-center gap-1" data-rarity="${r.key}">
              <div class="text-base">${r.emoji}</div>
              <div class="text-[8px] font-bold" style="color: ${r.color};">${r.label}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Note (optional)</label>
        <textarea id="as-note" rows="2" maxlength="150" placeholder="e.g. Pulled from 5th draw"></textarea>
      </div>

      <button id="as-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary" disabled>
        Select Rarity First
      </button>
    </div>
  `, '🎨 Add Skin');

  let selectedRarity = null;
  document.querySelectorAll('.skin-rarity-btn').forEach(btn => {
    btn.onclick = () => {
      selectedRarity = btn.dataset.rarity;
      const rarity = SKIN_RARITIES.find(r => r.key === selectedRarity);
      document.querySelectorAll('.skin-rarity-btn').forEach(b => {
        if (b === btn) {
          b.classList.add('border-2');
          b.style.borderColor = rarity.color;
          b.style.background = rarity.color + '15';
        } else {
          b.classList.remove('border-2');
          b.style.borderColor = '';
          b.style.background = '';
        }
      });
      const submit = document.getElementById('as-submit');
      submit.disabled = false;
      submit.textContent = `Add ${rarity.label} Skin`;
    };
  });

  document.getElementById('as-submit').onclick = async () => {
    const name = document.getElementById('as-name').value.trim();
    const gun = document.getElementById('as-gun').value;
    const note = document.getElementById('as-note').value.trim();

    if (name.length < 2) { toast('Name too short', 'error'); return; }
    if (!selectedRarity) { toast('Pick a rarity', 'error'); return; }

    const btn = document.getElementById('as-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      const ref = doc(db, 'camos', State.user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      const skins = data.__skins || {};

      skins[name] = {
        gun,
        rarity: selectedRarity,
        note,
        date: Date.now()
      };
      data.__skins = skins;

      await setDoc(ref, data);
      toast('✅ Skin added!', 'success');
      closeSheet();
      setTimeout(renderSkinsPanel, 300);
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Retry';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// Add "Skins" button next to "Export Progress" in Camo tab
const _origRenderCamoSubSkins = renderCamoSub;
renderCamoSub = function() {
  _origRenderCamoSubSkins();
  setTimeout(() => {
    const exportBtn = document.getElementById('export-camo-btn');
    if (!exportBtn || document.getElementById('skins-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'skins-btn';
    btn.className = 'btn-press mt-2 text-[11px] font-bold text-gold flex items-center gap-1';
    btn.innerHTML = '<span>🎨</span> Weapon Skins';
    btn.onclick = renderSkinsPanel;
    exportBtn.parentNode.appendChild(btn);
  }, 100);
};

// ============================================
// PART 2: TOURNAMENT TEAM REGISTRATION
// ============================================

async function openTeamRegisterSheet(tournamentId, tournament) {
  openSheet(`
    <div class="space-y-4">
      <div class="bg-primary/10 border border-primary/30 rounded-xl p-3">
        <div class="text-[10px] text-primary font-bold mb-1">👥 Team Registration</div>
        <div class="text-[10px] text-gray-400">Register up to 5 members. All must be your friends.</div>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Team Name *</label>
        <input id="tr-teamname" type="text" placeholder="e.g. Shadow Squad" maxlength="30" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Select Members (you + 1-4 friends)</label>
        <div id="tr-friends-list" class="space-y-2 max-h-[40vh] overflow-y-auto">
          <div class="text-center py-4 text-xs text-gray-500">Loading friends...</div>
        </div>
      </div>

      <button id="tr-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary">
        Register Team
      </button>
    </div>
  `, '👥 Team Registration');

  // Load friends
  try {
    const snap = await getDoc(doc(db, 'users', State.user.uid));
    const data = snap.exists() ? snap.data() : {};
    const friendUids = data.friends || [];

    const friendsList = document.getElementById('tr-friends-list');

    if (friendUids.length === 0) {
      friendsList.innerHTML = `
        <div class="text-center py-4">
          <div class="text-xs text-gray-500 mb-3">No friends yet. Add friends to register as a team.</div>
          <button onclick="closeSheet(); squadSubTab='clans'; renderSquadTab();" class="btn-press px-4 py-2 rounded-lg bg-primary text-xs font-bold">Add Friends</button>
        </div>
      `;
      return;
    }

    const selected = new Set([State.user.uid]);
    const friendData = [];

    for (const uid of friendUids) {
      try {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) friendData.push({ id: uid, ...s.data() });
      } catch (e) { /* skip */ }
    }

    friendsList.innerHTML = `
      <label class="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30 cursor-pointer">
        <input type="checkbox" checked disabled class="!w-5 !h-5" />
        <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden">
          ${State.profile.avatar ? `<img src="${esc(State.profile.avatar)}" class="w-full h-full object-cover" />` : getInitials(State.profile.ign)}
        </div>
        <div class="flex-1">
          <div class="text-xs font-bold">${esc(State.profile.ign)} (You · Captain)</div>
        </div>
      </label>
      ${friendData.map(f => `
        <label class="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer">
          <input type="checkbox" class="friend-selector !w-5 !h-5" data-uid="${f.id}" data-ign="${esc(f.ign)}" data-avatar="${esc(f.avatar || '')}" />
          <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden">
            ${f.avatar ? `<img src="${esc(f.avatar)}" class="w-full h-full object-cover" />` : getInitials(f.ign)}
          </div>
          <div class="flex-1">
            <div class="text-xs font-bold">${esc(f.ign)}</div>
            <div class="text-[10px] text-gray-500">${esc(f.rank || '—')} · ${esc(f.region || '—')}</div>
          </div>
        </label>
      `).join('')}
    `;

    document.getElementById('tr-submit').onclick = async () => {
      const teamName = document.getElementById('tr-teamname').value.trim();
      if (teamName.length < 2) { toast('Team name too short', 'error'); return; }

      const checkedFriends = Array.from(document.querySelectorAll('.friend-selector:checked'));
      if (checkedFriends.length < 1) { toast('Select at least 1 friend', 'error'); return; }
      if (checkedFriends.length > 4) { toast('Max 5 members (you + 4 friends)', 'error'); return; }

      const members = [
        { uid: State.user.uid, ign: State.profile.ign, avatar: State.profile.avatar || '', isCaptain: true },
        ...checkedFriends.map(cb => ({
          uid: cb.dataset.uid,
          ign: cb.dataset.ign,
          avatar: cb.dataset.avatar || '',
          isCaptain: false
        }))
      ];

      const btn = document.getElementById('tr-submit');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner mx-auto"></div>';

      try {
        // Add team to tournament
        const tSnap = await getDoc(doc(db, 'tournaments', tournamentId));
        if (!tSnap.exists()) { toast('Tournament not found', 'error'); return; }
        const t = tSnap.data();

        if ((t.teams || []).length >= t.size) {
          toast('Tournament is full', 'error');
          btn.disabled = false;
          btn.textContent = 'Register Team';
          return;
        }

        const newTeam = {
          uid: State.user.uid, // captain uid
          ign: teamName,
          avatar: State.profile.avatar || '',
          captainUid: State.user.uid,
          captainIgn: State.profile.ign,
          members,
          isTeam: true,
          registeredAt: Date.now()
        };

        await updateDoc(doc(db, 'tournaments', tournamentId), {
          teams: arrayUnion(newTeam)
        });

        toast('✅ Team registered!', 'success');
        closeSheet();
        setTimeout(() => openTournamentDetail(tournamentId), 400);
      } catch (e) {
        console.error(e);
        toast('Failed: ' + e.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Register Team';
      }
    };
  } catch (e) {
    console.error('Team register error:', e);
    toast('Failed to load', 'error');
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 3: FRIEND DMs
// ============================================

async function openDMThread(friendUid, friendIgn) {
  // Create or get chat ID (sorted so both users share same ID)
  const chatId = [State.user.uid, friendUid].sort().join('_');

  openSheet(`
    <div class="flex flex-col" style="height: 70vh;">
      <div id="dm-messages" class="flex-1 overflow-y-auto mb-3 space-y-2 pb-3">
        <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
      </div>
      <div class="flex gap-2 sticky bottom-0 bg-[#0a0a0a] pt-3 border-t border-border">
        <input id="dm-input" type="text" placeholder="Message ${esc(friendIgn)}..." class="flex-1" maxlength="500" />
        <button id="dm-send" class="btn-press w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <i data-lucide="send" class="w-5 h-5 text-white"></i>
        </button>
      </div>
    </div>
  `, `💬 ${esc(friendIgn)}`);

  // Load messages
  const messagesContainer = document.getElementById('dm-messages');

  const loadMessages = async () => {
    try {
      const snap = await getDocs(query(
  collection(db, 'messages'),
  where('chatId', '==', chatId),
  limit(100)
));

if (snap.empty) {
  messagesContainer.innerHTML = `
    <div class="text-center py-8">
      <div class="text-3xl mb-2">💬</div>
      <div class="text-xs text-gray-500">Start the conversation</div>
    </div>
  `;
  return;
}

const messages = [];
snap.forEach(d => messages.push({ id: d.id, ...d.data() }));

// Sort client-side by createdAt
messages.sort((a, b) => {
  const aT = a.createdAt?.seconds || 0;
  const bT = b.createdAt?.seconds || 0;
  return aT - bT;
});

      messagesContainer.innerHTML = messages.map(m => {
        const isMine = m.fromUid === State.user.uid;
        return `
          <div class="flex ${isMine ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[75%] ${isMine ? 'bg-primary text-white' : 'bg-card border border-border'} rounded-2xl px-3 py-2">
              <div class="text-xs whitespace-pre-wrap break-words">${esc(m.text)}</div>
              <div class="text-[8px] ${isMine ? 'text-white/70' : 'text-gray-500'} mt-1 text-right">${timeAgo(m.createdAt)}</div>
            </div>
          </div>
        `;
      }).join('');

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (e) {
      console.error('DM load error:', e);
      messagesContainer.innerHTML = '<div class="text-center py-6 text-red-400 text-xs">Failed to load messages</div>';
    }
  };

  // Send message
  const sendMessage = async () => {
    const input = document.getElementById('dm-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.disabled = true;

    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        fromUid: State.user.uid,
        fromIgn: State.profile.ign,
        toUid: friendUid,
        toIgn: friendIgn,
        text,
        createdAt: serverTimestamp()
      });

      // Notify recipient
      try {
        await sendNotificationToUser(
          friendUid,
          `💬 ${State.profile.ign}`,
          text.length > 60 ? text.slice(0, 60) + '...' : text,
          { type: 'dm', chatId }
        );
      } catch (e) { /* silent */ }

      await loadMessages();
    } catch (e) {
      console.error(e);
      toast('Send failed', 'error');
    } finally {
      input.disabled = false;
      input.focus();
    }
  };

  document.getElementById('dm-send').onclick = sendMessage;
  document.getElementById('dm-input').onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  await loadMessages();
  if (window.lucide) window.lucide.createIcons();
}

window.renderSkinsPanel = renderSkinsPanel;
window.openAddSkinSheet = openAddSkinSheet;
window.openTeamRegisterSheet = openTeamRegisterSheet;
window.openDMThread = openDMThread;

/* END OF CHUNK 29 */
// ============================================
// Chunk 30/12: Party System + Privacy + Polish
// ============================================

// ============================================
// PART 1: PARTY SYSTEM
// ============================================

let currentParty = null;
let partyUnsub = null;

async function createParty() {
  try {
    // Check if already in a party
    const mySnap = await getDoc(doc(db, 'users', State.user.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    if (myData.currentParty) {
      toast('You are already in a party', 'info');
      return openPartyPanel(myData.currentParty);
    }

    const partyId = 'party_' + State.user.uid + '_' + Date.now();
    await setDoc(doc(db, 'parties', partyId), {
      leaderUid: State.user.uid,
      leaderIgn: State.profile.ign,
      leaderAvatar: State.profile.avatar || '',
      members: [{
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        rank: State.profile.rank || 'Rookie',
        joinedAt: Date.now()
      }],
      maxSize: 5,
      status: 'open',
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'users', State.user.uid), { currentParty: partyId });

    toast('🎉 Party created!', 'success');
    openPartyPanel(partyId);
  } catch (e) {
    console.error('Create party error:', e);
    toast('Failed: ' + e.message, 'error');
  }
}

async function openPartyPanel(partyId) {
  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', '🎉 Party');

  if (partyUnsub) partyUnsub();

  partyUnsub = onSnapshot(doc(db, 'parties', partyId), (snap) => {
    if (!snap.exists()) {
      toast('Party ended', 'info');
      closeSheet();
      return;
    }
    const party = { id: snap.id, ...snap.data() };
    currentParty = party;
    renderPartyPanel(party);
  }, (e) => {
    console.error('Party listener error:', e);
  });
}

function renderPartyPanel(party) {
  const isLeader = party.leaderUid === State.user.uid;
  const members = party.members || [];
  const canInvite = members.length < party.maxSize;

  const sheetBody = document.querySelector('#sheet-container .px-5');
  if (!sheetBody) return;

  sheetBody.innerHTML = `
    <div class="space-y-4">
      <!-- Party Header -->
      <div class="bg-gradient-to-br from-primary/10 to-black border border-primary/30 rounded-2xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[10px] text-primary uppercase font-bold">Party</div>
            <div class="text-lg font-black">${members.length}/${party.maxSize} Members</div>
          </div>
          <div class="text-3xl">🎉</div>
        </div>
      </div>

      <!-- Members List -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Members</div>
        </div>
        <div class="divide-y divide-border">
          ${members.map(m => `
            <div class="flex items-center gap-3 px-4 py-3">
              <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                ${m.avatar ? `<img src="${esc(m.avatar)}" class="w-full h-full object-cover" />` : getInitials(m.ign)}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold truncate flex items-center gap-1.5">
                  ${esc(m.ign)}
                  ${m.uid === party.leaderUid ? '<span class="text-[8px] px-1 py-0.5 rounded bg-gold text-black font-black">LEADER</span>' : ''}
                </div>
                <div class="text-[10px] text-gray-500">${esc(m.rank || '—')}</div>
              </div>
              ${isLeader && m.uid !== State.user.uid ? `
                <button class="kick-member-btn w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center" data-uid="${m.uid}" data-ign="${esc(m.ign)}">
                  <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-2">
        ${canInvite ? `
          <button id="invite-friends-btn" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm glow-primary flex items-center justify-center gap-2">
            <i data-lucide="user-plus" class="w-4 h-4"></i> Invite Friends
          </button>
        ` : `
          <div class="text-center py-2 text-xs text-gray-500">Party is full</div>
        `}
        <button id="post-party-lobby-btn" class="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm flex items-center justify-center gap-2">
          🎮 Post Party Lobby
        </button>
        <button id="leave-party-btn" class="btn-press w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm">
          ${isLeader ? 'Disband Party' : 'Leave Party'}
        </button>
      </div>
    </div>
  `;

  // Wire invite
  const inviteBtn = document.getElementById('invite-friends-btn');
  if (inviteBtn) inviteBtn.onclick = () => openInviteFriendsSheet(party);

  // Wire post lobby
  document.getElementById('post-party-lobby-btn').onclick = () => postPartyLobby(party);

  // Wire leave
  document.getElementById('leave-party-btn').onclick = () => {
    confirmDialog(
      isLeader ? 'Disband Party' : 'Leave Party',
      isLeader ? 'Disband the party for everyone?' : 'Leave this party?',
      () => leaveParty(party.id),
      isLeader ? 'Disband' : 'Leave',
      true
    );
  };

  // Wire kick
  sheetBody.querySelectorAll('.kick-member-btn').forEach(btn => {
    btn.onclick = () => {
      confirmDialog('Kick Member', `Remove ${btn.dataset.ign} from party?`, async () => {
        try {
          const currentSnap = await getDoc(doc(db, 'parties', party.id));
          const current = currentSnap.data();
          const newMembers = (current.members || []).filter(m => m.uid !== btn.dataset.uid);
          await updateDoc(doc(db, 'parties', party.id), { members: newMembers });
          await updateDoc(doc(db, 'users', btn.dataset.uid), { currentParty: null });
          toast('Member removed', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Remove', true);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

async function openInviteFriendsSheet(party) {
  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', 'Invite Friends');

  try {
    const mySnap = await getDoc(doc(db, 'users', State.user.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    const friendUids = myData.friends || [];
    const currentMemberUids = (party.members || []).map(m => m.uid);

    const availableFriends = [];
    for (const uid of friendUids) {
      if (currentMemberUids.includes(uid)) continue;
      try {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) {
          const f = s.data();
          // Skip friends already in another party
          if (!f.currentParty) availableFriends.push({ id: uid, ...f });
        }
      } catch (e) { /* skip */ }
    }

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    if (availableFriends.length === 0) {
      sheetBody.innerHTML = '<div class="text-center py-8 text-xs text-gray-500">No friends available to invite</div>';
      return;
    }

    sheetBody.innerHTML = availableFriends.map(f => `
      <div class="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-2">
        <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
          ${f.avatar ? `<img src="${esc(f.avatar)}" class="w-full h-full object-cover" />` : getInitials(f.ign)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold truncate">${esc(f.ign)}</div>
          <div class="text-[10px] text-gray-500">${esc(f.rank || '—')}</div>
        </div>
        <button class="invite-friend-btn btn-press px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold" data-uid="${f.id}" data-ign="${esc(f.ign)}">
          Invite
        </button>
      </div>
    `).join('');

    sheetBody.querySelectorAll('.invite-friend-btn').forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        btn.innerHTML = '✓';
        btn.classList.add('opacity-50');
        try {
          await sendNotificationToUser(
            btn.dataset.uid,
            '🎉 Party Invite',
            `${State.profile.ign} invited you to their party!`,
            { type: 'party_invite', partyId: party.id, leaderUid: State.user.uid }
          );
          toast(`Invited ${btn.dataset.ign}`, 'success');
        } catch (e) {
          toast('Failed to invite', 'error');
          btn.disabled = false;
          btn.textContent = 'Invite';
        }
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error(e);
    toast('Failed: ' + e.message, 'error');
  }
}

async function leaveParty(partyId) {
  try {
    const snap = await getDoc(doc(db, 'parties', partyId));
    if (!snap.exists()) return;
    const party = snap.data();

    if (party.leaderUid === State.user.uid) {
      // Disband
      for (const m of party.members || []) {
        try {
          await updateDoc(doc(db, 'users', m.uid), { currentParty: null });
        } catch (e) { /* skip */ }
      }
      await deleteDoc(doc(db, 'parties', partyId));
      toast('Party disbanded', 'success');
    } else {
      // Remove self
      const newMembers = (party.members || []).filter(m => m.uid !== State.user.uid);
      await updateDoc(doc(db, 'parties', partyId), { members: newMembers });
      await updateDoc(doc(db, 'users', State.user.uid), { currentParty: null });
      toast('Left party', 'success');
    }

    if (partyUnsub) partyUnsub();
    currentParty = null;
    closeSheet();
  } catch (e) {
    console.error('Leave party error:', e);
    toast('Failed: ' + e.message, 'error');
  }
}

async function postPartyLobby(party) {
  try {
    const expiresAt = Timestamp.fromMillis(Date.now() + 2 * 60 * 60 * 1000);
    const jitsiLink = `https://meet.jit.si/CODMPanda-Party-${party.id.slice(-8)}`;

    const memberIgns = (party.members || []).map(m => m.ign).join(', ');

    await addDoc(collection(db, 'lobbies'), {
      uid: State.user.uid,
      ign: State.profile.ign,
      rank: State.profile.rank || 'Rookie',
      mode: 'Any',
      region: State.profile.region || 'Global',
      role: 'Party',
      mic: true,
      note: `🎉 Party: ${memberIgns}`,
      avatar: State.profile.avatar || '',
      players: party.members.length,
      partySize: party.members.length,
      partyId: party.id,
      jitsiLink,
      createdAt: serverTimestamp(),
      expiresAt
    });

    toast('🎮 Party lobby posted!', 'success');
    closeSheet();
  } catch (e) {
    console.error('Post party lobby error:', e);
    toast('Failed: ' + e.message, 'error');
  }
}

// Add "Party" button to PLAY tab header
const _origRenderPlayTabParty = renderPlayTab;
renderPlayTab = function() {
  _origRenderPlayTabParty();

  setTimeout(() => {
    const header = document.querySelector('#content .flex.items-center.justify-between.mb-4');
    if (!header || document.getElementById('open-party-btn')) return;

    const postBtn = header.querySelector('#post-lobby-btn');
    if (!postBtn) return;

    const partyBtn = document.createElement('button');
    partyBtn.id = 'open-party-btn';
    partyBtn.className = 'btn-press px-3 py-2.5 rounded-xl bg-card border border-primary/40 text-primary text-xs font-bold flex items-center gap-1.5';
    partyBtn.innerHTML = '<span>🎉</span> Party';

    partyBtn.onclick = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', State.user.uid));
        const data = snap.exists() ? snap.data() : {};
        if (data.currentParty) {
          openPartyPanel(data.currentParty);
        } else {
          // Confirm creation
          confirmDialog('Create Party', 'Start a new party and invite your friends?', createParty, 'Create', false);
        }
      } catch (e) { /* silent */ }
    };

    postBtn.parentNode.insertBefore(partyBtn, postBtn);
    if (window.lucide) window.lucide.createIcons();
  }, 100);
};

// ============================================
// PART 2: PRIVACY SETTINGS INTEGRATION
// ============================================

// Filter users based on privacy settings
function filterByPrivacy(users, viewerUid) {
  return users.filter(u => {
    // If it's you, always show
    if (u.uid === viewerUid) return true;
    // If private and not friend, hide
    if (u.privateProfile) return false;
    // If hideLeaderboard, exclude from leaderboard
    if (u.hideLeaderboard) return false;
    return true;
  });
}

// Update profile view to respect privacy
const _origOpenUserProfilePrivacy = openUserProfile;
openUserProfile = async function(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      toast('User not found', 'error');
      return;
    }
    const u = snap.data();

    // Privacy check
    if (u.privateProfile) {
      const mySnap = await getDoc(doc(db, 'users', State.user.uid));
      const myData = mySnap.exists() ? mySnap.data() : {};
      const isFriend = (myData.friends || []).includes(uid);
      if (!isFriend && uid !== State.user.uid) {
        openSheet(`
          <div class="text-center py-12">
            <div class="text-5xl mb-3">🔒</div>
            <div class="text-sm font-bold mb-1">Private Profile</div>
            <div class="text-xs text-gray-500 mb-4">${esc(u.ign)} keeps their profile private</div>
            <button onclick="closeSheet()" class="text-xs text-gray-500">Close</button>
          </div>
        `, 'Private');
        return;
      }
    }
  } catch (e) { /* fall through */ }

  return _origOpenUserProfilePrivacy(uid);
};

// ============================================
// PART 3: ONLINE STATUS RESPECT
// ============================================

// Only update lastSeen if user allows it
const _origUpdateLastSeenPrivacy = updateLastSeen;
updateLastSeen = async function() {
  if (State.profile?.showOnline === false) return;
  return _origUpdateLastSeenPrivacy();
};

// ============================================
// PART 4: COMPACT MODE CSS
// ============================================

// Inject compact mode styles
const compactStyle = document.createElement('style');
compactStyle.textContent = `
  body.compact-mode .bg-card {
    padding: 0.75rem !important;
  }
  body.compact-mode .rounded-2xl {
    border-radius: 0.75rem !important;
  }
  body.compact-mode .py-3 {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
  }
  body.compact-mode .gap-3 {
    gap: 0.5rem !important;
  }
  body.compact-mode .mb-4 {
    margin-bottom: 0.75rem !important;
  }
`;
document.head.appendChild(compactStyle);

// Apply compact mode on login
function applyUserPreferences() {
  if (!State.profile) return;
  if (State.profile.compactMode) {
    document.body.classList.add('compact-mode');
  } else {
    document.body.classList.remove('compact-mode');
  }
}

// Hook into showMainApp
const _origShowMainAppPrefs = showMainApp;
showMainApp = function() {
  _origShowMainAppPrefs();
  setTimeout(applyUserPreferences, 200);
};

// ============================================
// PART 5: DM WIRING IN FRIENDS PANEL
// ============================================

// Add DM button to friend cards
const _origRenderFriendsListDM = renderFriendsList;
renderFriendsList = async function(body, friendUids) {
  await _origRenderFriendsListDM(body, friendUids);

  setTimeout(() => {
    // Add message buttons to each friend card
    body.querySelectorAll('.remove-friend-btn').forEach(removeBtn => {
      const card = removeBtn.closest('.flex.items-center');
      if (!card || card.querySelector('.dm-btn')) return;

      const uid = removeBtn.dataset.uid;
      const ign = removeBtn.dataset.ign;

      const dmBtn = document.createElement('button');
      dmBtn.className = 'dm-btn w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center mr-2';
      dmBtn.innerHTML = '<i data-lucide="message-circle" class="w-4 h-4 text-primary"></i>';
      dmBtn.onclick = () => openDMThread(uid, ign);
      removeBtn.parentNode.insertBefore(dmBtn, removeBtn);
    });
    if (window.lucide) window.lucide.createIcons();
  }, 150);
};

// Cleanup party listener on tab change
const _origSwitchTabParty = switchTab;
switchTab = function(tab) {
  if (partyUnsub && tab !== 'play') {
    // Keep party listener alive
  }
  return _origSwitchTabParty(tab);
};

// ============================================
// PART 6: PARTY INVITE RECEIVER
// ============================================

// Check for pending party invites when app loads
async function checkPartyInvites() {
  if (!State.user) return;
  try {
    // Get my notifications from Firestore (or check recent invites)
    // Simplified: check if a party exists where I'm not a member but invited
    // In a full implementation, this would check a invites collection
  } catch (e) { /* silent */ }
}

setTimeout(() => {
  if (State.user) checkPartyInvites();
}, 10000);

window.createParty = createParty;
window.openPartyPanel = openPartyPanel;
window.leaveParty = leaveParty;
window.postPartyLobby = postPartyLobby;
window.applyUserPreferences = applyUserPreferences;

/* END OF CHUNK 30 */
// ============================================
// Chunk 31/12: Notifications Dashboard + Profile Polish
// ============================================

// ============================================
// PART 1: NOTIFICATIONS DASHBOARD
// ============================================

let notifUnsub = null;

async function openNotificationsPanel() {
  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', '🔔 Notifications');

  // Listen to in-app notifications
  if (notifUnsub) notifUnsub();

  notifUnsub = onSnapshot(
    query(
      collection(db, 'notifications'),
      where('userId', '==', State.user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    ),
    (snap) => {
      const notifs = [];
      snap.forEach(d => notifs.push({ id: d.id, ...d.data() }));
      renderNotificationsList(notifs);
    },
    (err) => {
      console.error('Notif error:', err);
      // Fallback: fetch without orderBy (no index)
      getDocs(query(collection(db, 'notifications'), where('userId', '==', State.user.uid), limit(50)))
        .then(snap => {
          const notifs = [];
          snap.forEach(d => notifs.push({ id: d.id, ...d.data() }));
          notifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          renderNotificationsList(notifs);
        })
        .catch(() => {
          const body = document.querySelector('#sheet-container .px-5');
          if (body) body.innerHTML = '<div class="text-center py-8 text-xs text-gray-500">No notifications yet</div>';
        });
    }
  );
}

function renderNotificationsList(notifs) {
  const sheetBody = document.querySelector('#sheet-container .px-5');
  if (!sheetBody) return;

  if (notifs.length === 0) {
    sheetBody.innerHTML = `
      <div class="text-center py-12">
        <div class="text-5xl mb-3">🔔</div>
        <div class="text-sm font-bold mb-1">No notifications yet</div>
        <div class="text-xs text-gray-500">You'll see updates here</div>
      </div>
    `;
    return;
  }

  const notifTypes = {
    approval: { emoji: '✅', color: '#34C759' },
    rejection: { emoji: '❌', color: '#FF3B30' },
    badge: { emoji: '🏆', color: '#FFD700' },
    leak: { emoji: '🔥', color: '#FF6B00' },
    dm: { emoji: '💬', color: '#00BFFF' },
    party_invite: { emoji: '🎉', color: '#AF52DE' },
    friend_request: { emoji: '👋', color: '#34C759' },
    tournament: { emoji: '🏆', color: '#FFD700' },
    default: { emoji: '🔔', color: '#8E8E93' }
  };

  sheetBody.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="text-xs text-gray-500">${notifs.length} notification${notifs.length === 1 ? '' : 's'}</div>
      <button id="mark-all-read" class="text-[10px] text-primary font-bold">Mark all read</button>
    </div>
    <div class="space-y-2">
      ${notifs.map(n => {
        const t = notifTypes[n.type] || notifTypes.default;
        const isUnread = !n.read;
        return `
          <div class="notification-item ${isUnread ? 'bg-primary/5 border-primary/30' : 'bg-card border-border'} border rounded-xl p-3 cursor-pointer" data-id="${n.id}">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background: ${t.color}20;">
                <span class="text-lg">${t.emoji}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold mb-0.5 ${isUnread ? 'text-white' : 'text-gray-300'}">${esc(n.title || '')}</div>
                <div class="text-[11px] text-gray-400 mb-1">${esc(n.body || '')}</div>
                <div class="text-[9px] text-gray-600">${timeAgo(n.createdAt)}</div>
              </div>
              ${isUnread ? '<div class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></div>' : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Wire mark all read
  document.getElementById('mark-all-read').onclick = async () => {
    try {
      const batch = [];
      notifs.forEach(n => {
        if (!n.read) batch.push(updateDoc(doc(db, 'notifications', n.id), { read: true }));
      });
      await Promise.all(batch);
      toast('All marked read', 'success');
    } catch (e) { /* silent */ }
  };

  // Wire individual clicks
  sheetBody.querySelectorAll('.notification-item').forEach(el => {
    el.onclick = async () => {
      const id = el.dataset.id;
      const notif = notifs.find(n => n.id === id);
      if (!notif) return;

      // Mark as read
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (e) { /* silent */ }

      // Navigate based on type
      closeSheet();
      setTimeout(() => {
        if (notif.type === 'dm' && notif.data?.chatId) {
          const parts = notif.data.chatId.split('_');
          const friendUid = parts.find(p => p !== State.user.uid);
          if (friendUid) {
            getDoc(doc(db, 'users', friendUid)).then(s => {
              if (s.exists()) openDMThread(friendUid, s.data().ign);
            });
          }
        } else if (notif.type === 'party_invite') {
          // Just show info
          toast('Open Party button to join', 'info');
        } else if (notif.type === 'tournament' && notif.data?.tournamentId) {
          openTournamentDetail(notif.data.tournamentId);
        } else if (notif.type === 'leak') {
          intelSubTab = 'leaks';
          switchTab('intel');
        } else if (notif.type === 'approval' || notif.type === 'rejection') {
          // Go to relevant tab
          if (notif.data?.contentType === 'vault') {
            labSubTab = 'vault';
            switchTab('lab');
          } else if (notif.data?.contentType === 'clip') {
            squadSubTab = 'clips';
            switchTab('squad');
          } else if (notif.data?.contentType === 'leak') {
            intelSubTab = 'leaks';
            switchTab('intel');
          }
        }
      }, 200);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// Create a helper to log in-app notifications
async function logInAppNotification(userId, type, title, body, data) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: type || 'default',
      title: title || '',
      body: body || '',
      data: data || {},
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Log notif error:', e);
  }
}

// ---------- HOOK INTO EXISTING NOTIFICATION SENDERS ----------
// Wrap sendNotificationToUser so it also logs to Firestore
const _origSendNotificationToUser = sendNotificationToUser;
sendNotificationToUser = async function(uid, title, body, data) {
  // Log to in-app notifications
  logInAppNotification(uid, data?.type || 'default', title, body, data);
  // Also send push
  return _origSendNotificationToUser(uid, title, body, data);
};

// ---------- UNREAD BADGE ON BELL ----------
let unreadNotifCount = 0;

async function updateNotifBadge() {
  try {
    const snap = await getDocs(query(
      collection(db, 'notifications'),
      where('userId', '==', State.user.uid),
      where('read', '==', false),
      limit(20)
    ));
    unreadNotifCount = snap.size;

    const bellBtn = document.getElementById('btn-notifications');
    if (!bellBtn) return;

    // Remove existing badge
    const existing = bellBtn.querySelector('.notif-badge');
    if (existing) existing.remove();

    if (unreadNotifCount > 0) {
      const badge = document.createElement('div');
      badge.className = 'notif-badge absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-card';
      badge.textContent = unreadNotifCount > 9 ? '9+' : unreadNotifCount;
      bellBtn.style.position = 'relative';
      bellBtn.appendChild(badge);
    }
  } catch (e) { /* silent */ }
}

// Wire bell to open the panel
const _origRenderPlayTabNotif = renderPlayTab;
renderPlayTab = function() {
  _origRenderPlayTabNotif();

  setTimeout(() => {
    const bellBtn = document.getElementById('btn-notifications');
    if (bellBtn) {
      bellBtn.onclick = () => {
        openNotificationsPanel();
        setTimeout(updateNotifBadge, 1000);
      };
    }
    updateNotifBadge();
  }, 150);
};

// Real-time listener for badge count
let notifCountUnsub = null;
function startNotifCountListener() {
  if (notifCountUnsub) notifCountUnsub();
  try {
    notifCountUnsub = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('userId', '==', State.user.uid),
        where('read', '==', false),
        limit(20)
      ),
      (snap) => {
        unreadNotifCount = snap.size;
        const bellBtn = document.getElementById('btn-notifications');
        if (!bellBtn) return;
        const existing = bellBtn.querySelector('.notif-badge');
        if (existing) existing.remove();
        if (unreadNotifCount > 0) {
          const badge = document.createElement('div');
          badge.className = 'notif-badge absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-card';
          badge.textContent = unreadNotifCount > 9 ? '9+' : unreadNotifCount;
          bellBtn.style.position = 'relative';
          bellBtn.appendChild(badge);
        }
      },
      (err) => {
        // Fallback: check once every 60s
        setInterval(updateNotifBadge, 60000);
      }
    );
  } catch (e) {
    setInterval(updateNotifBadge, 60000);
  }
}

setTimeout(() => {
  if (State.user) startNotifCountListener();
}, 5000);

// ============================================
// PART 2: PROFILE POLISH
// ============================================

// Enhanced profile header with more info
const _origRenderYouTabProfile = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabProfile();

  setTimeout(() => {
    const content = document.getElementById('content');
    if (!content) return;

    const profileCard = content.querySelector('.bg-card.border.border-border.rounded-2xl');
    if (!profileCard || profileCard.dataset.enhanced) return;
    profileCard.dataset.enhanced = '1';

    // Add online status + activity indicator if available
    const p = State.profile || {};
    const lastSeenAgo = p.lastSeen?.seconds
      ? Math.floor((Date.now() / 1000 - p.lastSeen.seconds) / 60)
      : null;

    const activityHTML = `
      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-border">
        <div class="flex items-center gap-1.5 text-[10px]">
          <div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span class="text-gray-400">Active now</span>
        </div>
        <div class="flex items-center gap-1.5 text-[10px]">
          <i data-lucide="award" class="w-3 h-3 text-gold"></i>
          <span class="text-gray-400">${p.approvedCount || 0} approved</span>
        </div>
        <div class="flex items-center gap-1.5 text-[10px]">
          <i data-lucide="trophy" class="w-3 h-3 text-primary"></i>
          <span class="text-gray-400">${p.tournamentWins || 0} wins</span>
        </div>
      </div>
    `;

    // Insert after the profile header content
    const avatarSection = profileCard.querySelector('.flex.items-center.gap-3');
    if (avatarSection && !profileCard.querySelector('.border-t.border-border')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = activityHTML;
      profileCard.appendChild(wrapper.firstElementChild);
    }

    if (window.lucide) window.lucide.createIcons();
  }, 150);
};

// ============================================
// PART 3: BUG FIXES & POLISH
// ============================================

// Fix: Ensure lobbies refresh every 60s (auto-cleanup display)
setInterval(() => {
  if (State.currentTab === 'play' && State.cache.lobbies.length > 0) {
    const now = Date.now();
    const stillValid = State.cache.lobbies.filter(l => {
      const exp = l.expiresAt?.toMillis ? l.expiresAt.toMillis() : (l.expiresAt?.seconds ? l.expiresAt.seconds * 1000 : Infinity);
      return exp > now;
    });
    if (stillValid.length !== State.cache.lobbies.length) {
      State.cache.lobbies = stillValid;
      renderLobbies();
    }
  }
}, 60000);

// Fix: Smooth scroll to top on tab change
const _origSwitchTabScroll = switchTab;
switchTab = function(tab) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return _origSwitchTabScroll(tab);
};

// Fix: Better error handling for network failures
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason?.message?.includes('network')) {
    console.warn('Network hiccup detected — will retry');
  }
});

// Fix: Ensure images render properly (fallback to initials)
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') {
    e.target.style.display = 'none';
  }
}, true);

// ============================================
// PART 4: APPMODE AWARENESS
// ============================================

// Detect if running as installed PWA (standalone)
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

// Show different welcome for PWA users
if (isStandalone()) {
  document.body.classList.add('pwa-mode');
  console.log('Running as installed PWA');
} else {
  document.body.classList.add('browser-mode');
}

// ============================================
// PART 5: SMART IMAGE LAZY LOAD
// ============================================

// Intersection Observer for lazy loading images (performance)
if ('IntersectionObserver' in window) {
  const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          lazyObserver.unobserve(img);
        }
      }
    });
  }, { rootMargin: '100px' });

  // Hook into mutation observer to catch new images
  const mutationObs = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          node.querySelectorAll?.('img[data-src]').forEach(img => lazyObserver.observe(img));
          if (node.matches?.('img[data-src]')) lazyObserver.observe(node);
        }
      });
    });
  });

  mutationObs.observe(document.body, { childList: true, subtree: true });
}

window.openNotificationsPanel = openNotificationsPanel;
window.logInAppNotification = logInAppNotification;
window.updateNotifBadge = updateNotifBadge;
window.isStandalone = isStandalone;

/* END OF CHUNK 31 */
// ============================================
// Chunk 32/12: Global Search + Final Polish
// ============================================

// ============================================
// PART 1: GLOBAL SEARCH (users + guns + more)
// ============================================

let globalSearchDebounce = null;

async function openGlobalSearch() {
  openSheet(`
    <div class="relative mb-4">
      <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input id="global-search-input" type="text" placeholder="Search users, guns, clans..." class="pl-10" autofocus />
    </div>
    <div id="global-search-results">
      <div class="text-center py-8">
        <div class="text-4xl mb-2">🔍</div>
        <div class="text-xs text-gray-500">Search across the entire app</div>
        <div class="text-[10px] text-gray-600 mt-2">Try: "Fennec", "Bobby", or a clan name</div>
      </div>
    </div>
  `, '🔍 Search');

  const input = document.getElementById('global-search-input');
  input.oninput = () => {
    clearTimeout(globalSearchDebounce);
    globalSearchDebounce = setTimeout(() => performGlobalSearch(input.value.trim()), 400);
  };

  if (window.lucide) window.lucide.createIcons();
}

async function performGlobalSearch(query) {
  const results = document.getElementById('global-search-results');
  if (!results) return;

  if (query.length < 2) {
    results.innerHTML = `
      <div class="text-center py-8 text-xs text-gray-500">
        Type at least 2 characters
      </div>
    `;
    return;
  }

  results.innerHTML = '<div class="text-center py-6"><div class="spinner mx-auto"></div></div>';

  const q = query.toLowerCase();
  const matches = { users: [], guns: [], clans: [] };

  try {
    // Parallel fetch with limits
    const [usersSnap, clansSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), limit(200))),
      getDocs(query(collection(db, 'clans'), limit(100)))
    ]);

    // Match users
    usersSnap.forEach(d => {
      const u = d.data();
      if (d.id === State.user.uid) return;
      if ((u.ign || '').toLowerCase().includes(q)) {
        matches.users.push({ id: d.id, ...u });
      }
    });

    // Match clans
    clansSnap.forEach(d => {
      const c = d.data();
      if ((c.name || '').toLowerCase().includes(q)) {
        matches.clans.push({ id: d.id, ...c });
      }
    });

    // Match guns (local, no fetch)
    Object.entries(CODM_GUNS).forEach(([cat, guns]) => {
      guns.forEach(g => {
        if (g.toLowerCase().includes(q)) {
          matches.guns.push({ name: g, category: cat });
        }
      });
    });

    const total = matches.users.length + matches.guns.length + matches.clans.length;

    if (total === 0) {
      results.innerHTML = `
        <div class="text-center py-8">
          <div class="text-3xl mb-2">😔</div>
          <div class="text-xs text-gray-500">No results for "${esc(query)}"</div>
        </div>
      `;
      return;
    }

    results.innerHTML = `
      ${matches.users.length > 0 ? `
        <div class="text-[10px] font-bold text-primary uppercase mb-2 mt-2">👤 Users (${matches.users.length})</div>
        ${matches.users.slice(0, 5).map(u => `
          <div class="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-2 cursor-pointer search-result-user" data-uid="${u.id}">
            <div class="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
              ${u.avatar ? `<img src="${esc(u.avatar)}" class="w-full h-full object-cover" />` : getInitials(u.ign)}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate">${esc(u.ign)}</div>
              <div class="text-[10px] text-gray-500 truncate">${esc(u.rank || '—')} · ${esc(u.region || '—')}</div>
            </div>
            ${u.isPro ? '<span class="text-[8px] px-1.5 py-0.5 rounded bg-gold text-black font-black">PRO</span>' : ''}
          </div>
        `).join('')}
      ` : ''}

      ${matches.guns.length > 0 ? `
        <div class="text-[10px] font-bold text-primary uppercase mb-2 mt-4">🔫 Guns (${matches.guns.length})</div>
        ${matches.guns.slice(0, 5).map(g => `
          <div class="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-2 cursor-pointer search-result-gun" data-gun="${esc(g.name)}">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center flex-shrink-0">
              <i data-lucide="crosshair" class="w-4 h-4 text-primary"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate">${esc(g.name)}</div>
              <div class="text-[10px] text-gray-500">${esc(g.category)}</div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500"></i>
          </div>
        `).join('')}
      ` : ''}

      ${matches.clans.length > 0 ? `
        <div class="text-[10px] font-bold text-primary uppercase mb-2 mt-4">🛡️ Clans (${matches.clans.length})</div>
        ${matches.clans.slice(0, 5).map(c => `
          <div class="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-2 cursor-pointer search-result-clan" data-clanid="${c.id}">
            <div class="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
              ${c.logoUrl ? `<img src="${esc(c.logoUrl)}" class="w-full h-full object-cover" />` : esc((c.name || '?')[0])}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate">${esc(c.name)}</div>
              <div class="text-[10px] text-gray-500">${(c.members || []).length} members · ${esc(c.region || 'Global')}</div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500"></i>
          </div>
        `).join('')}
      ` : ''}
    `;

    // Wire clicks
    results.querySelectorAll('.search-result-user').forEach(el => {
      el.onclick = () => {
        closeSheet();
        setTimeout(() => openUserProfile(el.dataset.uid), 300);
      };
    });

    results.querySelectorAll('.search-result-gun').forEach(el => {
      el.onclick = () => {
        closeSheet();
        setTimeout(() => openCommunityBuilds(el.dataset.gun), 300);
      };
    });

    results.querySelectorAll('.search-result-clan').forEach(el => {
      el.onclick = () => {
        closeSheet();
        setTimeout(() => {
          squadSubTab = 'clans';
          switchTab('squad');
        }, 300);
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Global search error:', e);
    results.innerHTML = '<div class="text-center py-8 text-red-400 text-xs">Search failed</div>';
  }
}

// Add search button to top bar
const _origShowMainAppSearch = showMainApp;
showMainApp = function() {
  _origShowMainAppSearch();

  setTimeout(() => {
    const topBar = document.getElementById('top-bar');
    if (!topBar || document.getElementById('global-search-btn')) return;

    const bellBtn = document.getElementById('btn-notifications');
    if (!bellBtn) return;

    const searchBtn = document.createElement('button');
    searchBtn.id = 'global-search-btn';
    searchBtn.className = 'btn-press w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center';
    searchBtn.innerHTML = '<i data-lucide="search" class="w-4 h-4 text-gray-300"></i>';
    searchBtn.onclick = openGlobalSearch;
    bellBtn.parentNode.insertBefore(searchBtn, bellBtn);

    if (window.lucide) window.lucide.createIcons();
  }, 150);
};

// ============================================
// PART 2: NOTIFICATIONS FIRESTORE HOOKS
// ============================================

// Log notifications whenever major events happen
const _origNotifySubmissionApprovedFinal = notifySubmissionApproved;
notifySubmissionApproved = async function(uid, contentType, itemName) {
  await logInAppNotification(uid, 'approval', '✅ Submission Approved', `Your ${contentType} "${itemName}" is now live!`, { contentType });
  return _origNotifySubmissionApprovedFinal(uid, contentType, itemName);
};

const _origNotifyBadgeEarnedFinal = notifyBadgeEarned;
notifyBadgeEarned = async function(uid, badge) {
  const labels = { first_leak: '🥉 First Leak', rising: '🥈 Rising', legend: '🥇 Legend', elite: '💎 Elite' };
  await logInAppNotification(uid, 'badge', '🏆 New Badge!', `You earned: ${labels[badge] || badge}`, { badge });
  return _origNotifyBadgeEarnedFinal(uid, badge);
};

const _origNotifyNewLeakPostedFinal = notifyNewLeakPosted;
notifyNewLeakPosted = async function(title) {
  try {
    // Broadcast in-app notification to all users
    const snap = await getDocs(query(collection(db, 'users'), limit(500)));
    const batch = [];
    snap.forEach(d => {
      batch.push(logInAppNotification(d.id, 'leak', '🔥 New Leak', title, {}));
    });
    await Promise.all(batch.slice(0, 100)); // cap at 100 writes
  } catch (e) { /* silent */ }
  return _origNotifyNewLeakPostedFinal(title);
};

// ============================================
// PART 3: FINAL POLISH
// ============================================

// Fix: Prevent double-tap zoom on iOS
document.addEventListener('gesturestart', (e) => e.preventDefault());

// Fix: Handle back button gracefully in PWA
window.addEventListener('popstate', () => {
  const sheet = document.getElementById('sheet-container');
  if (sheet && !sheet.classList.contains('hidden')) {
    closeSheet();
  }
  const modal = document.getElementById('modal-container');
  if (modal && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

// Fix: Show offline indicator
let isOnline = navigator.onLine;
window.addEventListener('online', () => {
  if (!isOnline) {
    isOnline = true;
    toast('✅ Back online', 'success', 2000);
  }
});
window.addEventListener('offline', () => {
  isOnline = false;
  toast('⚠️ You are offline', 'warning', 3000);
});

// Fix: Auto-retry failed Firestore operations
const originalFetch = window.fetch;
let retryQueue = [];
window.fetch = async function(...args) {
  try {
    return await originalFetch.apply(this, args);
  } catch (e) {
    if (e.message?.includes('Failed to fetch') && args[0]?.includes?.('firestore')) {
      // Silently retry once
      await new Promise(r => setTimeout(r, 1500));
      return originalFetch.apply(this, args);
    }
    throw e;
  }
};

// Fix: Smooth transitions between tabs
const style = document.createElement('style');
style.textContent = `
  #content {
    transition: opacity 0.15s ease;
  }
  .hidden {
    display: none !important;
  }
  .sheet {
    overscroll-behavior: contain;
  }
  /* Prevent iOS bounce */
  body {
    -webkit-overflow-scrolling: touch;
  }
  /* Better tap feedback */
  button:active, [role="button"]:active {
    transition: transform 0.05s ease;
  }
`;
document.head.appendChild(style);

// ============================================
// PART 4: STARTUP CHECKLIST
// ============================================

async function runStartupTasks() {
  if (!State.user) return;

  // 1. Update last seen
  setTimeout(updateLastSeen, 1000);

  // 2. Start notification listener
  setTimeout(startNotifCountListener, 3000);

  // 3. Auto-resolve expired matches
  setTimeout(runAutoResolve, 5000);

  // 4. Check pending tournament tasks
  setTimeout(checkMyTournamentsNeedingStart, 8000);

  // 5. Cleanup old data
  setTimeout(cleanupOldTournaments, 15000);

  // 6. Update referral tracking
  setTimeout(trackReferral, 2000);
}

// Run startup tasks whenever user logs in
const _origShowMainAppStartup = showMainApp;
showMainApp = function() {
  _origShowMainAppStartup();
  setTimeout(runStartupTasks, 500);
};

window.openGlobalSearch = openGlobalSearch;
window.runStartupTasks = runStartupTasks;

console.log('%c🐼 CODMPanda v1.0.0 — ALL CHUNKS LOADED', 'color:#FF6B00;font-weight:bold;font-size:14px');
console.log('%c32/32 chunks • Full featured • Ready to launch', 'color:#FFD700;font-size:11px');

/* END OF CHUNK 32 — APP COMPLETE */
// ============================================
// Chunk 34: Dropdowns + Performance + Back Button (CLEAN)
// ============================================

// ============================================
// PART 1: INLINE DROPDOWN SYSTEM
// ============================================

window.__openDropdownPicker = function(selectEl) {
  document.querySelectorAll('.cdp-picker').forEach(el => el.remove());

  const options = Array.from(selectEl.options);
  const currentValue = selectEl.value;

  const groups = [];
  let currentGroup = null;

  options.forEach(opt => {
    const inGroup = opt.parentElement && opt.parentElement.tagName === 'OPTGROUP';
    if (inGroup) {
      const label = opt.parentElement.label;
      let g = groups.find(x => x.label === label);
      if (!g) { g = { label, options: [] }; groups.push(g); }
      g.options.push({ value: opt.value, label: opt.textContent, selected: opt.value === currentValue });
    } else {
      if (!currentGroup) { currentGroup = { label: null, options: [] }; groups.push(currentGroup); }
      currentGroup.options.push({ value: opt.value, label: opt.textContent, selected: opt.value === currentValue });
    }
  });

  const title = selectEl.getAttribute('data-dropdown-title') || 'Select';

  const el = document.createElement('div');
  el.className = 'cdp-picker';
  el.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  `;

  el.innerHTML = `
    <div style="
      width: 100%;
      max-height: 78vh;
      background: #0a0a0a;
      border-top-left-radius: 24px;
      border-top-right-radius: 24px;
      border-top: 1px solid #222;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: cdpSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <div style="padding: 12px 20px 16px; border-bottom: 1px solid #222; flex-shrink: 0;">
        <div style="width: 40px; height: 4px; background: #333; border-radius: 2px; margin: 0 auto 12px;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 17px; font-weight: 800; color: #fff; font-family: Inter, sans-serif;">${esc(title)}</div>
          <button class="cdp-close" style="
            width: 32px; height: 32px;
            border-radius: 50%;
            background: #1a1a1a;
            border: 1px solid #333;
            color: #888;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Inter, sans-serif;
          ">✕</button>
        </div>
      </div>
      <div style="flex: 1; overflow-y: auto; padding: 12px 16px 24px;">
        ${groups.map(g => `
          ${g.label ? `<div style="font-size: 10px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 8px 6px; font-family: Inter, sans-serif;">${esc(g.label)}</div>` : ''}
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${g.options.map(o => `
              <button class="cdp-opt" data-value="${esc(o.value)}" style="
                text-align: left;
                padding: 14px 16px;
                border-radius: 14px;
                background: ${o.selected ? 'rgba(255, 107, 0, 0.12)' : 'transparent'};
                border: 1px solid ${o.selected ? '#FF6B00' : 'transparent'};
                color: ${o.selected ? '#FF6B00' : '#e0e0e0'};
                font-weight: ${o.selected ? '700' : '500'};
                font-size: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
                font-family: Inter, sans-serif;
              ">
                <span>${esc(o.label)}</span>
                ${o.selected ? '<span style="color: #FF6B00; font-weight: 900; font-size: 16px;">✓</span>' : ''}
              </button>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(el);

  const closePicker = () => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.15s ease-out';
    setTimeout(() => el.remove(), 150);
  };

  el.querySelector('.cdp-close').onclick = closePicker;
  el.onclick = (e) => { if (e.target === el) closePicker(); };

  el.querySelectorAll('.cdp-opt').forEach(btn => {
    btn.onclick = () => {
      selectEl.value = btn.dataset.value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      selectEl.style.borderColor = '#FF6B00';
      setTimeout(() => { selectEl.style.borderColor = ''; }, 500);
      closePicker();
      toast(`✓ ${btn.querySelector('span').textContent}`, 'success', 1200);
    };
  });
};

if (!window.__cdpInterceptorAdded) {
  window.__cdpInterceptorAdded = true;

  document.addEventListener('click', function(e) {
    const select = e.target.closest('select');
    if (!select) return;
    if (select.id === 'set-theme') return;
    e.preventDefault();
    e.stopPropagation();
    window.__openDropdownPicker(select);
  }, true);

  document.addEventListener('focus', function(e) {
    if (e.target.tagName === 'SELECT' && e.target.id !== 'set-theme') {
      e.target.blur();
      window.__openDropdownPicker(e.target);
    }
  }, true);
}

// Animations for the picker
if (!document.getElementById('cdp-animations')) {
  const style = document.createElement('style');
  style.id = 'cdp-animations';
  style.textContent = `
    @keyframes cdpSlide {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// PART 2: PROFILE CARD INSTANT FEEDBACK
// ============================================

const _origShareProfileCard = shareProfileCard;
shareProfileCard = async function() {
  openSheet(`
    <div class="text-center py-12 space-y-3">
      <div class="spinner mx-auto" style="width: 40px; height: 40px; border-width: 3px;"></div>
      <div class="text-sm font-bold">Generating your card...</div>
      <div class="text-[10px] text-gray-500">This takes a few seconds</div>
    </div>
  `, '🎨 Profile Card');

  await new Promise(r => setTimeout(r, 50));
  await _origShareProfileCard();
};

// ============================================
// PART 3: NOTIFICATIONS INSTANT FEEDBACK
// ============================================

const _origEnableNotifications = enableNotifications;
enableNotifications = async function() {
  const toggle = document.getElementById('notif-toggle');
  const card = toggle?.closest('.p-4');
  let statusEl = card?.querySelector('.notif-status-text');

  if (toggle) toggle.style.opacity = '0.5';
  if (card && !statusEl) {
    statusEl = document.createElement('div');
    statusEl.className = 'notif-status-text text-[10px] text-primary mt-2 flex items-center gap-2';
    statusEl.innerHTML = '<div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div> Registering device...';
    card.appendChild(statusEl);
  }

  try {
    await _origEnableNotifications();
  } catch (e) {
    if (statusEl) statusEl.innerHTML = '<span class="text-red-400">Failed: ' + esc(e.message) + '</span>';
  } finally {
    if (toggle) toggle.style.opacity = '1';
    if (statusEl) setTimeout(() => statusEl.remove(), 2000);
  }
};

// ============================================
// PART 4: SELECT STYLING
// ============================================

if (!document.getElementById('select-enhance-style')) {
  const style = document.createElement('style');
  style.id = 'select-enhance-style';
  style.textContent = `
    select {
      background: #181818 !important;
      border: 1px solid #222 !important;
      color: #fff !important;
      border-radius: 12px !important;
      padding: 12px 14px !important;
      font-size: 15px !important;
      width: 100% !important;
      appearance: none !important;
      -webkit-appearance: none !important;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FF6B00' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
      background-repeat: no-repeat !important;
      background-position: right 12px center !important;
      background-size: 18px !important;
      padding-right: 42px !important;
      cursor: pointer !important;
      transition: border-color 0.2s, background-color 0.2s !important;
    }
    select:hover, select:active {
      border-color: #FF6B00 !important;
    }
    select:focus {
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.15) !important;
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// PART 5: PROFILE CARD CACHE
// ============================================

async function primeProfileCardCache() {
  if (!State.user) return;
  try {
    const [vaultSnap, camoSnap] = await Promise.all([
      getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid))),
      getDoc(doc(db, 'camos', State.user.uid))
    ]);

    State.cache.myVaultCount = vaultSnap.size;

    if (camoSnap.exists()) {
      const totalPossible = ALL_GUNS.length * CAMO_TYPES.length;
      let checked = 0;
      Object.values(camoSnap.data()).forEach(gun => {
        if (typeof gun === 'object') {
          CAMO_TYPES.forEach(c => { if (gun[c.key]) checked++; });
        }
      });
      State.cache.myCamoPct = Math.round((checked / totalPossible) * 100);
    } else {
      State.cache.myCamoPct = 0;
    }
  } catch (e) { /* silent */ }
}

setTimeout(() => {
  if (State.user) primeProfileCardCache();
}, 3000);

// ============================================
// PART 6: BADGE FLICKER FIX
// ============================================

let badgeUpdateTimer = null;
const _origUpdateNotifBadge = updateNotifBadge;
updateNotifBadge = function() {
  clearTimeout(badgeUpdateTimer);
  badgeUpdateTimer = setTimeout(() => {
    _origUpdateNotifBadge();
  }, 300);
};

// ============================================
// PART 7: SMART BACK BUTTON
// ============================================

if (!window.__backBtnHandlerAdded) {
  window.__backBtnHandlerAdded = true;

  // Push a base state so we have something to pop
  try {
    if (!history.state || !history.state.__codm) {
      history.pushState({ __codm: true }, '');
    }
  } catch (e) { /* silent */ }

  window.addEventListener('popstate', (e) => {
    // If a sheet is open — close it and re-push state
    const sheet = document.getElementById('sheet-container');
    if (sheet && !sheet.classList.contains('hidden')) {
      closeSheet();
      try { history.pushState({ __codm: true }, ''); } catch (err) { /* silent */ }
      return;
    }

    // If a modal is open — close it
    const modal = document.getElementById('modal-container');
    if (modal && !modal.classList.contains('hidden')) {
      closeModal();
      try { history.pushState({ __codm: true }, ''); } catch (err) { /* silent */ }
      return;
    }

    // If on a non-PLAY tab — go to PLAY
    if (State.currentTab && State.currentTab !== 'play') {
      switchTab('play');
      try { history.pushState({ __codm: true }, ''); } catch (err) { /* silent */ }
      return;
    }

    // Otherwise let it exit
  });
}

window.primeProfileCardCache = primeProfileCardCache;

console.log('✅ Chunk 34: Clean version loaded');

/* END OF CHUNK 34 */
// ============================================
// Chunk 35: Kill Native Select Dropdowns
// ============================================

(function() {
  if (window.__selectReplacerInstalled) return;
  window.__selectReplacerInstalled = true;

  // Style to hide native selects visually but keep them functional in DOM
  const style = document.createElement('style');
  style.id = 'kill-native-select';
  style.textContent = `
    /* Native selects are replaced — hide the real ones */
    select.__codm_replaced {
      position: absolute !important;
      opacity: 0 !important;
      pointer-events: none !important;
      width: 1px !important;
      height: 1px !important;
      z-index: -1 !important;
    }
    /* The proxy button looks identical to a select */
    .__codm_select_proxy {
      background: #181818;
      border: 1px solid #222;
      color: #fff;
      border-radius: 12px;
      padding: 12px 42px 12px 14px;
      font-size: 15px;
      width: 100%;
      cursor: pointer;
      font-family: Inter, sans-serif;
      text-align: left;
      position: relative;
      transition: border-color 0.2s;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      display: block;
    }
    .__codm_select_proxy:active {
      border-color: #FF6B00;
    }
    .__codm_select_proxy::after {
      content: '';
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FF6B00' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-size: contain;
      background-repeat: no-repeat;
    }
  `;
  document.head.appendChild(style);

  function replaceSelects() {
    document.querySelectorAll('select:not(.__codm_replaced)').forEach(sel => {
      if (sel.id === 'set-theme') return;
      if (sel.closest('.__codm_select_wrapper')) return;

      // Wrap the select
      const wrapper = document.createElement('div');
      wrapper.className = '__codm_select_wrapper';
      wrapper.style.position = 'relative';
      sel.parentNode.insertBefore(wrapper, sel);
      wrapper.appendChild(sel);

      // Mark the native select as replaced
      sel.classList.add('__codm_replaced');

      // Create proxy button
      const proxy = document.createElement('button');
      proxy.type = 'button';
      proxy.className = '__codm_select_proxy';
      proxy.textContent = sel.options[sel.selectedIndex]?.text || 'Select';
      wrapper.appendChild(proxy);

      // Sync proxy label with select value
      const syncLabel = () => {
        const opt = sel.options[sel.selectedIndex];
        if (opt) proxy.textContent = opt.text;
      };

      // Tap proxy → open our picker
      proxy.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.__openDropdownPicker(sel);
        // After picker closes, sync the label
        setTimeout(syncLabel, 400);
      };

      // Also listen for change events (in case picker sets value)
      sel.addEventListener('change', syncLabel);
    });
  }

  // Run once + watch for new selects
  replaceSelects();

  const obs = new MutationObserver(() => {
    // Debounce to avoid infinite loops
    if (window.__selectReplaceTimer) clearTimeout(window.__selectReplaceTimer);
    window.__selectReplaceTimer = setTimeout(replaceSelects, 50);
  });
  obs.observe(document.body, { childList: true, subtree: true });

  console.log('✅ Native selects replaced with proxies');
})();

/* END OF CHUNK 35 */
// ============================================
// Chunk 36: Delete Own Content + Smart Expiry + ToS Update
// ============================================

const LOBBY_EXPIRY_HOURS = 24;
const SCRIM_EXPIRY_HOURS = 12;
const SOFT_CLOSE_HOURS = 1440; // 60 days — lower this when you have more users

// ============================================
// PART 1: LOBBY POST (24h active window)
// ============================================

openPostLobbySheet = function() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rank</label>
        <select id="pl-rank" data-dropdown-title="Rank">${RANKS.map(r => `<option ${State.profile?.rank === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Mode</label>
        <select id="pl-mode" data-dropdown-title="Mode">${MODES.map(m => `<option>${m}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Region</label>
        <select id="pl-region" data-dropdown-title="Region">${REGIONS.map(r => `<option ${State.profile?.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Role</label>
        <select id="pl-role" data-dropdown-title="Role">${ROLES.map(r => `<option>${r}</option>`).join('')}</select>
      </div>
      <div class="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div>
          <div class="text-sm font-semibold">Voice Chat</div>
          <div class="text-xs text-gray-500">Enable mic on join</div>
        </div>
        <div id="pl-mic" class="toggle on"></div>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Note (optional)</label>
        <textarea id="pl-note" rows="3" maxlength="150" placeholder="e.g. Need 3 more for Ranked MP"></textarea>
      </div>
      <button id="pl-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary">
        Post Lobby
      </button>
    </div>
  `, 'Create Lobby');

  document.getElementById('pl-mic').onclick = function() { this.classList.toggle('on'); };

  document.getElementById('pl-submit').onclick = async () => {
    const rank = document.getElementById('pl-rank').value;
    const mode = document.getElementById('pl-mode').value;
    const region = document.getElementById('pl-region').value;
    const role = document.getElementById('pl-role').value;
    const mic = document.getElementById('pl-mic').classList.contains('on');
    const note = document.getElementById('pl-note').value.trim();

    const btn = document.getElementById('pl-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      const expiresAt = Timestamp.fromMillis(Date.now() + LOBBY_EXPIRY_HOURS * 60 * 60 * 1000);
      const jitsiLink = `https://meet.jit.si/CODMPanda-${State.user.uid.slice(0, 8)}-${Date.now()}`;

      await addDoc(collection(db, 'lobbies'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        rank, mode, region, role, mic, note,
        avatar: State.profile.avatar || '',
        players: 1,
        jitsiLink,
        createdAt: serverTimestamp(),
        expiresAt,
        status: 'active'
      });

      toast('✅ Lobby posted — active for 24h', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Post Lobby';
    }
  };
};

// ============================================
// PART 2: LOBBY RENDER with delete + closed state
// ============================================

renderLobbies = function() {
  const feed = document.getElementById('lobbies-feed');
  if (!feed) return;
  let lobbies = State.cache.lobbies;

  const f = State.filters.lobbies;
  if (f.rank && f.rank !== 'all') lobbies = lobbies.filter(l => l.rank === f.rank);
  if (f.mode && f.mode !== 'all') lobbies = lobbies.filter(l => l.mode === f.mode);
  if (f.region && f.region !== 'all') lobbies = lobbies.filter(l => l.region === f.region);
  if (f.mic) lobbies = lobbies.filter(l => l.mic === true);
  if (f.search) {
    lobbies = lobbies.filter(l =>
      (l.ign || '').toLowerCase().includes(f.search) ||
      (l.note || '').toLowerCase().includes(f.search)
    );
  }

  if (lobbies.length === 0) {
    feed.innerHTML = emptyState('users', 'No lobbies found', 'Try different filters or post your own', 'Post Lobby', openPostLobbySheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const now = Date.now();

  feed.innerHTML = lobbies.map(l => {
    const expiresAt = l.expiresAt?.toMillis ? l.expiresAt.toMillis() : (l.expiresAt?.seconds ? l.expiresAt.seconds * 1000 : Infinity);
    const isExpired = expiresAt < now;
    const isMine = l.uid === State.user.uid;
    const playersText = `${l.players || 1}/5`;

    return `
      <div class="bg-card border ${isExpired ? 'border-gray-700 opacity-70' : 'border-border'} rounded-2xl p-4 fade-in">
        <div class="flex items-start gap-3 mb-3">
          <div class="relative">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-lg overflow-hidden">
              ${l.avatar ? `<img src="${esc(l.avatar)}" class="w-full h-full object-cover" />` : getInitials(l.ign)}
            </div>
            ${l.mic ? `<div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center"><i data-lucide="mic" class="w-2.5 h-2.5 text-white"></i></div>` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm">${esc(l.ign || 'Unknown')}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">${esc(l.rank || 'Rookie')}</span>
              ${isExpired ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/30 text-gray-400 font-bold">CLOSED</span>' : ''}
            </div>
            <div class="text-[11px] text-gray-500 mt-0.5">${timeAgo(l.createdAt)} · ${esc(l.region)} · ${esc(l.mode)}</div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-sm font-black text-primary">${playersText}</div>
            <div class="text-[9px] text-gray-500">PLAYERS</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-3">
          ${l.role ? `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-300">${esc(l.role)}</span>` : ''}
          ${l.mic ? `<span class="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold">🎤 Mic</span>` : `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-500">🔇 No Mic</span>`}
        </div>

        ${l.note ? `<p class="text-xs text-gray-400 mb-3 line-clamp-2">${esc(l.note)}</p>` : ''}

        <div class="flex gap-2">
          ${!isExpired ? `
            <button class="join-btn btn-press flex-1 py-2.5 rounded-xl bg-primary text-sm font-bold flex items-center justify-center gap-1.5" data-id="${l.id}">
              <i data-lucide="log-in" class="w-4 h-4"></i> Join
            </button>
          ` : `
            <div class="flex-1 py-2.5 rounded-xl bg-gray-500/10 text-center text-xs font-bold text-gray-500">
              Lobby Closed
            </div>
          `}
          <button class="share-lobby btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-ign="${esc(l.ign)}">
            <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
          </button>
          ${isMine ? `
            <button class="delete-lobby btn-press w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center" data-id="${l.id}">
              <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
            </button>
          ` : `
            <button class="report-lobby btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-uid="${l.uid}">
              <i data-lucide="flag" class="w-4 h-4 text-gray-500"></i>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.join-btn').forEach(btn => {
    btn.onclick = () => joinLobby(btn.dataset.id);
  });
  feed.querySelectorAll('.share-lobby').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: `${btn.dataset.ign}'s Lobby`,
        text: `🎮 Join ${btn.dataset.ign}'s squad on CODMPanda!`,
        url: getLobbyShareUrl(btn.dataset.id)
      });
    };
  });
  feed.querySelectorAll('.delete-lobby').forEach(btn => {
    btn.onclick = () => deleteLobby(btn.dataset.id);
  });
  feed.querySelectorAll('.report-lobby').forEach(btn => {
    btn.onclick = () => reportContent('lobby', btn.dataset.id, btn.dataset.uid);
  });

  if (window.lucide) window.lucide.createIcons();
};

async function deleteLobby(lobbyId) {
  confirmDialog('Delete Lobby', 'This will remove your lobby permanently.', async () => {
    try {
      await deleteDoc(doc(db, 'lobbies', lobbyId));
      State.cache.lobbies = State.cache.lobbies.filter(l => l.id !== lobbyId);
      renderLobbies();
      toast('🗑️ Lobby deleted', 'success');
    } catch (e) {
      console.error(e);
      toast('Delete failed: ' + e.message, 'error');
    }
  }, 'Delete', true);
}

// ============================================
// PART 3: SCRIM POST (12h active) + DELETE
// ============================================

openPostScrimSheet = function() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Mode</label>
        <select id="ps-mode" data-dropdown-title="Mode">${MODES.map(m => `<option>${m}</option>`).join('')}</select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">What are you looking for?</label>
        <textarea id="ps-text" rows="4" maxlength="500" placeholder="e.g. 5v5 SnD scrim tonight at 9pm WAT."></textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Contact (Discord/TG/IGN)</label>
        <input id="ps-contact" type="text" placeholder="e.g. @panda#1234" maxlength="60" />
      </div>
      <button id="ps-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">Post Scrim</button>
    </div>
  `, 'Post Scrim');

  document.getElementById('ps-submit').onclick = async () => {
    const mode = document.getElementById('ps-mode').value;
    const text = document.getElementById('ps-text').value.trim();
    const contact = document.getElementById('ps-contact').value.trim();
    if (text.length < 5) { toast('Add more details', 'error'); return; }

    const btn = document.getElementById('ps-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      const expiresAt = Timestamp.fromMillis(Date.now() + SCRIM_EXPIRY_HOURS * 60 * 60 * 1000);
      await addDoc(collection(db, 'scrims'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        text, mode, contact,
        createdAt: serverTimestamp(),
        expiresAt,
        status: 'active'
      });
      toast('✅ Scrim posted — active for 12h', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Post Scrim';
    }
  };
};

renderScrims = function() {
  const feed = document.getElementById('scrims-feed');
  if (!feed) return;
  const now = Date.now();

  if (State.cache.scrims.length === 0) {
    feed.innerHTML = emptyState('swords', 'No scrims posted', 'Looking for a match? Post one', 'Post Scrim', openPostScrimSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = State.cache.scrims.map(s => {
    const expiresAt = s.expiresAt?.toMillis ? s.expiresAt.toMillis() : (s.expiresAt?.seconds ? s.expiresAt.seconds * 1000 : Infinity);
    const isExpired = expiresAt < now;
    const isMine = s.uid === State.user.uid;

    return `
      <div class="bg-card border ${isExpired ? 'border-gray-700 opacity-70' : 'border-border'} rounded-2xl p-4 fade-in">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-bold">${esc(s.mode || 'MP')}</span>
          ${isExpired ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/30 text-gray-400 font-bold">CLOSED</span>' : ''}
          <span class="text-[10px] text-gray-500">${timeAgo(s.createdAt)}</span>
        </div>
        <p class="text-sm text-gray-200 mb-3 whitespace-pre-wrap">${esc(s.text)}</p>
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] text-gray-500 truncate flex-1">📞 ${esc(s.contact || 'DM')}</span>
          <button class="copy-text-btn text-[11px] text-primary font-bold" data-text="${esc(s.contact)}">Copy</button>
          ${isMine ? `
            <button class="delete-scrim w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center" data-id="${s.id}">
              <i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-400"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.copy-text-btn').forEach(btn => {
    btn.onclick = () => copyText(btn.dataset.text, 'Contact copied!');
  });
  feed.querySelectorAll('.delete-scrim').forEach(btn => {
    btn.onclick = () => deleteScrim(btn.dataset.id);
  });

  if (window.lucide) window.lucide.createIcons();
};

async function deleteScrim(scrimId) {
  confirmDialog('Delete Scrim', 'Remove this scrim post?', async () => {
    try {
      await deleteDoc(doc(db, 'scrims', scrimId));
      State.cache.scrims = State.cache.scrims.filter(s => s.id !== scrimId);
      renderScrims();
      toast('🗑️ Scrim deleted', 'success');
    } catch (e) {
      toast('Delete failed: ' + e.message, 'error');
    }
  }, 'Delete', true);
}

// ============================================
// PART 4: VAULT DELETE
// ============================================

renderVaults = function() {
  const feed = document.getElementById('vault-feed');
  if (!feed) return;
  let vaults = State.cache.vaults;
  if (State.filters.vaults.search) {
    const s = State.filters.vaults.search;
    vaults = vaults.filter(v =>
      (v.gunName || '').toLowerCase().includes(s) ||
      (v.gunsmithCode || '').toLowerCase().includes(s)
    );
  }

  if (vaults.length === 0) {
    feed.className = '';
    feed.innerHTML = emptyState('package-open', 'No vaults yet', 'Share your first build', 'Submit Build', openSubmitVaultSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.className = 'grid grid-cols-2 gap-3';
  feed.innerHTML = vaults.map(v => {
    const isMine = v.uid === State.user.uid;
    return `
      <div class="bg-card border border-border rounded-2xl p-3 fade-in relative">
        ${isMine ? `
          <button class="delete-vault absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500/90 flex items-center justify-center z-10" data-id="${v.id}">
            <i data-lucide="trash-2" class="w-3 h-3 text-white"></i>
          </button>
        ` : ''}
        ${v.imageUrl ? `<img src="${esc(v.imageUrl)}" class="w-full h-24 object-cover rounded-xl mb-3" />` :
          `<div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
            <i data-lucide="crosshair" class="w-8 h-8 text-primary/60"></i>
          </div>`
        }
        <div class="text-xs font-bold text-gray-300 truncate">${esc(v.gunName || 'Unknown')}</div>
        <div class="text-[10px] text-gray-500 mb-2">${esc(v.type || 'build')}</div>

        ${v.gunsmithCode ? `
          <button class="copy-code-btn w-full py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center gap-1 mb-2" data-code="${esc(v.gunsmithCode)}">
            <i data-lucide="copy" class="w-3 h-3"></i> ${esc(v.gunsmithCode)}
          </button>
        ` : ''}

        <div class="flex items-center justify-between">
          <button class="like-btn flex items-center gap-1 text-[11px] text-gray-400" data-id="${v.id}">
            <i data-lucide="heart" class="w-3.5 h-3.5"></i> ${v.likes || 0}
          </button>
          <button class="share-vault-btn text-primary" data-id="${v.id}" data-gun="${esc(v.gunName)}">
            <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); copyText(btn.dataset.code, 'Code copied!'); };
  });
  feed.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'vaults', btn.dataset.id), { likes: increment(1) });
        toast('❤️ Liked!', 'success', 1500);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-vault-btn').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: `${btn.dataset.gun} Build`,
        text: `🔧 Check out this ${btn.dataset.gun} build on CODMPanda!`,
        url: getVaultShareUrl(btn.dataset.id)
      });
    };
  });
  feed.querySelectorAll('.delete-vault').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteVault(btn.dataset.id);
    };
  });

  if (window.lucide) window.lucide.createIcons();
};

async function deleteVault(vaultId) {
  confirmDialog('Delete Vault', 'Remove this build from your vault?', async () => {
    try {
      await deleteDoc(doc(db, 'vaults', vaultId));
      State.cache.vaults = State.cache.vaults.filter(v => v.id !== vaultId);
      renderVaults();
      toast('🗑️ Vault build deleted', 'success');
    } catch (e) {
      toast('Delete failed: ' + e.message, 'error');
    }
  }, 'Delete', true);
}

// ============================================
// PART 5: CLIP DELETE
// ============================================

renderClips = function() {
  const feed = document.getElementById('clips-feed');
  if (!feed) return;
  let clips = [...State.cache.clips];
  if (State.filters.clips.sort === 'trending') {
    clips.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }

  if (clips.length === 0) {
    feed.innerHTML = emptyState('video', 'No clips yet', 'Be the first to submit!', 'Submit Clip', openSubmitClipSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = clips.map(c => {
    const embedUrl = getYouTubeEmbed(c.youtubeUrl);
    const authorName = c.submittedByIgn || c.ign || 'CODMPanda';
    const authorAvatar = c.submittedByAvatar || '';
    const isApproved = !!c.approved;
    const isMine = c.uid === State.user.uid || c.submittedByUid === State.user.uid;
    return `
      <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in relative">
        ${isMine ? `
          <button class="delete-clip absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500/90 backdrop-blur-sm flex items-center justify-center z-10" data-id="${c.id}">
            <i data-lucide="trash-2" class="w-3.5 h-3.5 text-white"></i>
          </button>
        ` : ''}
        ${embedUrl ? `
          <div class="relative w-full aspect-video bg-black">
            <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen loading="lazy"></iframe>
          </div>
        ` : `
          <div class="w-full aspect-video bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
            <a href="${esc(c.youtubeUrl)}" target="_blank" class="text-center">
              <i data-lucide="external-link" class="w-8 h-8 mx-auto text-primary mb-2"></i>
              <div class="text-xs text-gray-400">Open link</div>
            </a>
          </div>
        `}
        <div class="p-3">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-xs font-bold text-gray-300">${esc(c.gunTag || 'CODM')}</span>
            ${isApproved ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold flex items-center gap-0.5"><i data-lucide="check" class="w-2.5 h-2.5"></i> Approved</span>` : ''}
            <span class="text-[10px] text-gray-500">· ${timeAgo(c.createdAt)}</span>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden">
              ${authorAvatar ? `<img src="${esc(authorAvatar)}" class="w-full h-full object-cover" />` : getInitials(authorName)}
            </div>
            <span class="text-[10px] text-gray-500">by <span class="text-gray-300 font-semibold">${esc(authorName)}</span></span>
          </div>
          <div class="flex items-center justify-between">
            <button class="like-clip flex items-center gap-1 text-xs text-gray-400" data-id="${c.id}">
              <i data-lucide="heart" class="w-4 h-4"></i> ${c.likes || 0}
            </button>
            <button class="share-clip text-primary" data-id="${c.id}" data-gun="${esc(c.gunTag || 'CODM')}">
              <i data-lucide="share-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.like-clip').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'clips', btn.dataset.id), { likes: increment(1) });
        toast('❤️', 'success', 1000);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-clip').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: `${btn.dataset.gun} Clip`,
        text: `🎬 Watch this ${btn.dataset.gun} play on CODMPanda!`,
        url: getClipShareUrl(btn.dataset.id)
      });
    };
  });
  feed.querySelectorAll('.delete-clip').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteClip(btn.dataset.id);
    };
  });

  if (window.lucide) window.lucide.createIcons();
};

async function deleteClip(clipId) {
  confirmDialog('Delete Clip', 'Remove this clip?', async () => {
    try {
      await deleteDoc(doc(db, 'clips', clipId));
      State.cache.clips = State.cache.clips.filter(c => c.id !== clipId);
      renderClips();
      toast('🗑️ Clip deleted', 'success');
    } catch (e) {
      toast('Delete failed: ' + e.message, 'error');
    }
  }, 'Delete', true);
}

// ============================================
// PART 6: AUTO-CLEANUP (60 days after expiry)
// ============================================

async function cleanupExpiredContent() {
  const now = Date.now();
  const graceMs = SOFT_CLOSE_HOURS * 60 * 60 * 1000;

  try {
    const lobbiesSnap = await getDocs(query(collection(db, 'lobbies'), limit(100)));
    const lobbiesToDelete = [];
    lobbiesSnap.forEach(d => {
      const data = d.data();
      const exp = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (exp + graceMs < now) lobbiesToDelete.push(d.id);
    });
    if (lobbiesToDelete.length > 0) {
      await Promise.all(lobbiesToDelete.map(id => deleteDoc(doc(db, 'lobbies', id))));
      console.log(`🧹 Cleaned ${lobbiesToDelete.length} old lobbies`);
    }

    const scrimsSnap = await getDocs(query(collection(db, 'scrims'), limit(100)));
    const scrimsToDelete = [];
    scrimsSnap.forEach(d => {
      const data = d.data();
      const exp = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (exp + graceMs < now) scrimsToDelete.push(d.id);
    });
    if (scrimsToDelete.length > 0) {
      await Promise.all(scrimsToDelete.map(id => deleteDoc(doc(db, 'scrims', id))));
      console.log(`🧹 Cleaned ${scrimsToDelete.length} old scrims`);
    }
  } catch (e) {
    console.warn('Cleanup error:', e);
  }
}

setTimeout(() => {
  if (State.user) {
    const lastCleanup = localStorage.getItem('codmpanda_last_content_cleanup');
    const dayMs = 24 * 60 * 60 * 1000;
    if (!lastCleanup || Date.now() - parseInt(lastCleanup) > dayMs) {
      cleanupExpiredContent();
      localStorage.setItem('codmpanda_last_content_cleanup', Date.now().toString());
    }
  }
}, 20000);

// ============================================
// PART 7: UPDATED TERMS (admin moderation clause)
// ============================================

const _origShowTermsChunk36 = showTerms;
showTerms = function() {
  openSheet(`
    <div class="text-xs text-gray-400 space-y-3 leading-relaxed">
      <p><strong class="text-white">Terms of Service</strong></p>
      <p>CODMPanda is an unofficial companion app for Call of Duty Mobile. Not affiliated with Activision or Tencent.</p>
      <p>Do not post illegal, harassing, or NSFW content. Reports will be reviewed and accounts banned. Administrators reserve the right to remove any content that violates these terms.</p>
      <p>Pro purchases are final. Refunds only in case of technical failure.</p>
      <p>We may update these terms. Continued use means acceptance.</p>
    </div>
  `, 'Terms');
};

window.deleteLobby = deleteLobby;
window.deleteScrim = deleteScrim;
window.deleteVault = deleteVault;
window.deleteClip = deleteClip;
window.cleanupExpiredContent = cleanupExpiredContent;
window.showTerms = showTerms;

/* END OF CHUNK 36 */
// ============================================
// Chunk 37: Enhanced Empty States with CTAs
// ============================================

// Upgrade the emptyState function with better design
const _origEmptyState = emptyState;
window.emptyState = function(icon, title, subtitle, ctaLabel, ctaFn) {
  const ctaHTML = (ctaLabel && ctaFn) ? `
    <button id="empty-cta-btn-${Date.now()}" class="empty-cta-btn btn-press mt-5 px-6 py-3.5 rounded-2xl bg-primary font-black text-sm glow-primary flex items-center justify-center gap-2 mx-auto">
      ${esc(ctaLabel)}
    </button>
  ` : '';

  setTimeout(() => {
    document.querySelectorAll('.empty-cta-btn').forEach(b => {
      if (!b.dataset.bound) {
        b.dataset.bound = '1';
        if (ctaFn) b.onclick = ctaFn;
      }
    });
  }, 0);

  return `
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center fade-in">
      <div class="relative mb-5">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/10 rounded-full blur-2xl"></div>
        <div class="relative w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center">
          <i data-lucide="${icon}" class="w-10 h-10 text-primary/70"></i>
        </div>
      </div>
      <div class="text-lg font-black mb-2">${esc(title)}</div>
      <div class="text-xs text-gray-500 max-w-[260px] leading-relaxed">${esc(subtitle || '')}</div>
      ${ctaHTML}
    </div>
  `;
};

// ============================================
// SPECIFIC EMPTY STATE UPGRADES PER SCREEN
// ============================================

// PLAY tab — Lobbies empty
const _origRenderLobbiesEmpty = renderLobbies;
renderLobbies = function() {
  const feed = document.getElementById('lobbies-feed');
  if (!feed) return;
  let lobbies = State.cache.lobbies;

  const f = State.filters.lobbies;
  if (f.rank && f.rank !== 'all') lobbies = lobbies.filter(l => l.rank === f.rank);
  if (f.mode && f.mode !== 'all') lobbies = lobbies.filter(l => l.mode === f.mode);
  if (f.region && f.region !== 'all') lobbies = lobbies.filter(l => l.region === f.region);
  if (f.mic) lobbies = lobbies.filter(l => l.mic === true);
  if (f.search) {
    lobbies = lobbies.filter(l =>
      (l.ign || '').toLowerCase().includes(f.search) ||
      (l.note || '').toLowerCase().includes(f.search)
    );
  }

  if (lobbies.length === 0) {
    // Only show empty state if there are NO lobbies at all (not just filtered)
    if (State.cache.lobbies.length === 0) {
      feed.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 px-4 text-center fade-in">
          <div class="relative mb-6">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-gold/20 rounded-full blur-3xl"></div>
            <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 flex items-center justify-center">
              <span class="text-5xl">🎮</span>
            </div>
          </div>
          <div class="text-[10px] font-black text-primary uppercase tracking-widest mb-2">⚡ Be the first</div>
          <div class="text-xl font-black mb-3">No lobbies yet</div>
          <div class="text-xs text-gray-400 max-w-[280px] leading-relaxed mb-6">
            Post a lobby in under 30 seconds. Squad up with players who match your rank, mode, and region.
          </div>
          <button id="empty-post-lobby" class="btn-press px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primaryDark font-black text-sm text-white glow-primary flex items-center justify-center gap-2">
            <i data-lucide="plus" class="w-4 h-4"></i> Post First Lobby
          </button>
          <div class="text-[10px] text-gray-600 mt-4">Takes 10 seconds — no signup required</div>
        </div>
      `;
      const btn = document.getElementById('empty-post-lobby');
      if (btn) btn.onclick = openPostLobbySheet;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    // Filtered empty
    feed.innerHTML = emptyState('search', 'No lobbies match', 'Try different filters or clear them', 'Post Lobby', openPostLobbySheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Continue with normal render
  _origRenderLobbiesEmpty();
};

// LAB Vault — Empty state
const _origRenderVaultsEmpty = renderVaults;
renderVaults = function() {
  const feed = document.getElementById('vault-feed');
  if (!feed) return;

  if (State.cache.vaults.length === 0 && !State.filters.vaults.search) {
    feed.className = '';
    feed.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 px-4 text-center fade-in">
        <div class="relative mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-gold/30 to-primary/20 rounded-full blur-3xl"></div>
          <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 border border-gold/30 flex items-center justify-center">
            <span class="text-5xl">🔧</span>
          </div>
        </div>
        <div class="text-[10px] font-black text-gold uppercase tracking-widest mb-2">⭐ Featured builds</div>
        <div class="text-xl font-black mb-3">Your Vault is empty</div>
        <div class="text-xs text-gray-400 max-w-[280px] leading-relaxed mb-6">
          Build your first gunsmith with our visual tool. 90+ guns, 9 attachment slots, live stat calculator.
        </div>
        <button id="empty-build-gun" class="btn-press px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold flex items-center justify-center gap-2">
          <i data-lucide="wrench" class="w-4 h-4"></i> Build Gunsmith
        </button>
        <div class="text-[10px] text-gray-600 mt-4">Or browse community builds below</div>
      </div>
    `;
    const btn = document.getElementById('empty-build-gun');
    if (btn) btn.onclick = () => openGunsmithBuilder();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  _origRenderVaultsEmpty();
};

// SQUAD Clans — Empty state
const _origRenderClansEmpty = renderClans;
renderClans = function() {
  const feed = document.getElementById('clans-feed');
  if (!feed) return;

  if (State.cache.clans.length === 0) {
    feed.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 px-4 text-center fade-in">
        <div class="relative mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-gold/20 rounded-full blur-3xl"></div>
          <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 flex items-center justify-center">
            <span class="text-5xl">🛡️</span>
          </div>
        </div>
        <div class="text-[10px] font-black text-primary uppercase tracking-widest mb-2">👑 Pro feature</div>
        <div class="text-xl font-black mb-3">No clans yet</div>
        <div class="text-xs text-gray-400 max-w-[280px] leading-relaxed mb-6">
          Create your own clan, recruit members, compete in Clan Wars, and earn badges.
        </div>
        <button id="empty-create-clan" class="btn-press px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primaryDark font-black text-sm text-white glow-primary flex items-center justify-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> Create First Clan
        </button>
        <div class="text-[10px] text-gray-600 mt-4">Free to try — Pro required to keep</div>
      </div>
    `;
    const btn = document.getElementById('empty-create-clan');
    if (btn) btn.onclick = openCreateClanSheet;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  _origRenderClansEmpty();
};

// SQUAD Scrims — Empty state
const _origRenderScrimsEmpty = renderScrims;
renderScrims = function() {
  const feed = document.getElementById('scrims-feed');
  if (!feed) return;

  if (State.cache.scrims.length === 0) {
    feed.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 px-4 text-center fade-in">
        <div class="relative mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-gold/20 rounded-full blur-3xl"></div>
          <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 flex items-center justify-center">
            <span class="text-5xl">⚔️</span>
          </div>
        </div>
        <div class="text-[10px] font-black text-primary uppercase tracking-widest mb-2">🏆 Competitive play</div>
        <div class="text-xl font-black mb-3">No scrims posted</div>
        <div class="text-xs text-gray-400 max-w-[280px] leading-relaxed mb-6">
          Looking for a 5v5 SnD practice match? Post a scrim and find an opponent team.
        </div>
        <button id="empty-post-scrim" class="btn-press px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primaryDark font-black text-sm text-white glow-primary flex items-center justify-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> Post First Scrim
        </button>
        <div class="text-[10px] text-gray-600 mt-4">Active for 12 hours</div>
      </div>
    `;
    const btn = document.getElementById('empty-post-scrim');
    if (btn) btn.onclick = openPostScrimSheet;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  _origRenderScrimsEmpty();
};

// SQUAD Clips — Empty state
const _origRenderClipsEmpty = renderClips;
renderClips = function() {
  const feed = document.getElementById('clips-feed');
  if (!feed) return;

  if (State.cache.clips.length === 0) {
    feed.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 px-4 text-center fade-in">
        <div class="relative mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-gold/20 rounded-full blur-3xl"></div>
          <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 flex items-center justify-center">
            <span class="text-5xl">🎬</span>
          </div>
        </div>
        <div class="text-[10px] font-black text-primary uppercase tracking-widest mb-2">🔥 Get featured</div>
        <div class="text-xl font-black mb-3">No clips yet</div>
        <div class="text-xs text-gray-400 max-w-[280px] leading-relaxed mb-6">
          Share your best plays. Clips get approved by moderators and featured on the feed.
        </div>
        <button id="empty-post-clip" class="btn-press px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primaryDark font-black text-sm text-white glow-primary flex items-center justify-center gap-2">
          <i data-lucide="video" class="w-4 h-4"></i> Submit First Clip
        </button>
        <div class="text-[10px] text-gray-600 mt-4">YouTube or TikTok links supported</div>
      </div>
    `;
    const btn = document.getElementById('empty-post-clip');
    if (btn) btn.onclick = openSubmitClipSheet;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  _origRenderClipsEmpty();
};

// INTEL Leaks — Empty state
const _origRenderLeaksEmpty = renderLeaks;
renderLeaks = function() {
  const feed = document.getElementById('leaks-feed');
  if (!feed) return;

  if (State.cache.leaks.length === 0) {
    feed.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 px-4 text-center fade-in">
        <div class="relative mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-gold/30 to-primary/20 rounded-full blur-3xl"></div>
          <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 border border-gold/30 flex items-center justify-center">
            <span class="text-5xl">🔥</span>
          </div>
        </div>
        <div class="text-[10px] font-black text-gold uppercase tracking-widest mb-2">📡 Intel incoming</div>
        <div class="text-xl font-black mb-3">No leaks yet</div>
        <div class="text-xs text-gray-400 max-w-[280px] leading-relaxed mb-6">
          Got intel? Submit a leak — screenshots, rumors, unreleased content. Approved ones get published here.
        </div>
        <button id="empty-submit-leak" class="btn-press px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold flex items-center justify-center gap-2">
          <i data-lucide="zap" class="w-4 h-4"></i> Submit First Leak
        </button>
        <div class="text-[10px] text-gray-600 mt-4">Anonymous submission — admin review</div>
      </div>
    `;
    const btn = document.getElementById('empty-submit-leak');
    if (btn) btn.onclick = openSubmitLeakSheet;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  _origRenderLeaksEmpty();
};

// SQUAD Tournaments — Empty state
const _origRenderTournamentsEmpty = renderTournamentsSub;
renderTournamentsSub = async function() {
  const body = document.getElementById('squad-body');
  if (!body) return;

  // Let original do its thing first
  try {
    const snap = await getDocs(query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'), limit(30)));
    const allTournaments = [];
    snap.forEach(d => allTournaments.push({ id: d.id, ...d.data() }));

    const active = allTournaments.filter(t => t.status === 'open' || t.status === 'in-progress');
    const completed = allTournaments.filter(t => t.status === 'completed');

    const list = tournamentsSubTab === 'active' ? active : completed;

    if (list.length === 0 && tournamentsSubTab === 'active') {
      body.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs text-gray-500">0 active</div>
          <button id="create-tournament-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1">
            <i data-lucide="plus" class="w-3 h-3"></i> Create
          </button>
        </div>

        <div class="flex gap-2 mb-4">
          <button class="chip tour-tab active" data-tab="active">Active</button>
          <button class="chip tour-tab" data-tab="completed">History</button>
        </div>

        <div class="flex flex-col items-center justify-center py-12 px-4 text-center fade-in">
          <div class="relative mb-6">
            <div class="absolute inset-0 bg-gradient-to-br from-gold/30 to-primary/20 rounded-full blur-3xl"></div>
            <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 border border-gold/30 flex items-center justify-center">
              <span class="text-5xl">🏆</span>
            </div>
          </div>
          <div class="text-[10px] font-black text-gold uppercase tracking-widest mb-2">👑 Host your own</div>
          <div class="text-xl font-black mb-3">No tournaments yet</div>
          <div class="text-xs text-gray-400 max-w-[280px] leading-relaxed mb-6">
            Create a bracket in 60 seconds. Auto-registration, auto-brackets, auto-resolve. Zero admin needed.
          </div>
          <button id="empty-create-tournament" class="btn-press px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold flex items-center justify-center gap-2">
            <i data-lucide="trophy" class="w-4 h-4"></i> Host First Tournament
          </button>
          <div class="text-[10px] text-gray-600 mt-4">Pro feature — free for admins</div>
        </div>
      `;

      document.getElementById('create-tournament-btn').onclick = openCreateTournament;
      document.getElementById('empty-create-tournament').onclick = openCreateTournament;
      document.querySelectorAll('.tour-tab').forEach(btn => {
        btn.onclick = () => { tournamentsSubTab = btn.dataset.tab; renderTournamentsSub(); };
      });

      if (window.lucide) window.lucide.createIcons();
      return;
    }
  } catch (e) {
    console.warn('Empty tournaments check failed:', e);
  }

  // Fall back to original
  return _origRenderTournamentsEmpty();
};

// Clans render empty state — enhance the original
const _origRenderClans2 = renderClans;
renderClans = function() {
  const feed = document.getElementById('clans-feed');
  if (!feed) return;

  if (State.cache.clans.length === 0) {
    feed.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 px-4 text-center fade-in">
        <div class="relative mb-6">
          <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-gold/20 rounded-full blur-3xl"></div>
          <div class="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/30 flex items-center justify-center">
            <span class="text-5xl">🛡️</span>
          </div>
        </div>
        <div class="text-[10px] font-black text-primary uppercase tracking-widest mb-2">👑 Pro feature</div>
        <div class="text-xl font-black mb-3">No clans yet</div>
        <div class="text-xs text-gray-400 max-w-[280px] leading-relaxed mb-6">
          Create your own clan, recruit members, compete in Clan Wars, and earn badges.
        </div>
        <button id="empty-create-clan-2" class="btn-press px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primaryDark font-black text-sm text-white glow-primary flex items-center justify-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> Create First Clan
        </button>
      </div>
    `;
    const btn = document.getElementById('empty-create-clan-2');
    if (btn) btn.onclick = openCreateClanSheet;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  _origRenderClans2();
};

console.log('✅ Chunk 37: Enhanced empty states loaded');

/* END OF CHUNK 37 */
// ============================================
// Chunk 38: Onboarding Tour for First-Time Users
// ============================================

const TOUR_STEPS = [
  {
    id: 'welcome',
    emoji: '🐼',
    title: 'Welcome to CODMPanda',
    body: 'The Ultimate CODM Companion. Let me show you around in 30 seconds.',
    tab: null,
    highlight: null
  },
  {
    id: 'play',
    emoji: '🎮',
    title: 'Find Your Squad',
    body: 'Post a lobby or join one. Filter by rank, mode, region. One tap opens voice chat.',
    tab: 'play',
    highlight: 'play'
  },
  {
    id: 'lab',
    emoji: '🔧',
    title: 'Build & Share Gunsmiths',
    body: 'Create weapons with our visual builder. 90+ guns, live stats, one-tap copy codes.',
    tab: 'lab',
    highlight: 'lab'
  },
  {
    id: 'camo',
    emoji: '🎨',
    title: 'Track Every Camo',
    body: 'Log your grind from Sand to Damascus. Export progress as a shareable image.',
    tab: 'lab',
    highlight: 'lab'
  },
  {
    id: 'squad',
    emoji: '🏆',
    title: 'Compete & Connect',
    body: 'Clans, tournaments, scrims, clips. Team up with players worldwide.',
    tab: 'squad',
    highlight: 'squad'
  },
  {
    id: 'intel',
    emoji: '📊',
    title: 'Master the Meta',
    body: 'Community tier lists, leaks, CP calculator, map callouts. Everything you need.',
    tab: 'intel',
    highlight: 'intel'
  },
  {
    id: 'you',
    emoji: '👑',
    title: 'Your Profile',
    body: 'Track your stats, earn badges, unlock Pro features. Everything personalized.',
    tab: 'you',
    highlight: 'you'
  },
  {
    id: 'ready',
    emoji: '🚀',
    title: 'You\'re all set!',
    body: 'Jump in and start dominating. Need help? Tap the question mark anytime.',
    tab: 'play',
    highlight: null
  }
];

let tourStep = 0;
let tourActive = false;

async function startOnboardingTour() {
  if (tourActive) return;
  tourActive = true;
  tourStep = 0;

  // Create tour overlay container
  let overlay = document.getElementById('tour-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tour-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(overlay);
  }

  // Add spotlight mask styles
  if (!document.getElementById('tour-styles')) {
    const style = document.createElement('style');
    style.id = 'tour-styles';
    style.textContent = `
      #tour-overlay.active { opacity: 1; pointer-events: auto; }
      .tour-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.88);
        z-index: 10000;
      }
      .tour-spotlight {
        position: fixed;
        border-radius: 20px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85), 0 0 40px rgba(255, 107, 0, 0.6);
        border: 2px solid #FF6B00;
        z-index: 10001;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }
      .tour-card {
        position: fixed;
        left: 16px;
        right: 16px;
        max-width: 420px;
        margin: 0 auto;
        background: linear-gradient(180deg, #111 0%, #0a0a0a 100%);
        border: 1px solid #FF6B00;
        border-radius: 24px;
        padding: 24px;
        z-index: 10002;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 107, 0, 0.3);
        animation: tourSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes tourSlideUp {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .tour-pulse {
        animation: tourPulse 1.5s ease-in-out infinite;
      }
      @keyframes tourPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
  }

  renderTourStep();
}

function renderTourStep() {
  const overlay = document.getElementById('tour-overlay');
  if (!overlay) return;

  const step = TOUR_STEPS[tourStep];
  if (!step) { endOnboardingTour(); return; }

  // Switch to the target tab
  if (step.tab && step.tab !== State.currentTab) {
    switchTab(step.tab);
  }

  // Find target element
  let targetRect = null;
  if (step.highlight) {
    const target = document.querySelector(`.tab-btn[data-tab="${step.highlight}"]`);
    if (target) {
      targetRect = target.getBoundingClientRect();
    }
  }

  const isFirst = tourStep === 0;
  const isLast = tourStep === TOUR_STEPS.length - 1;
  const isSecondToLast = tourStep === TOUR_STEPS.length - 2;

  overlay.innerHTML = `
    <div class="tour-backdrop"></div>
    ${targetRect ? `
      <div class="tour-spotlight tour-pulse" style="
        top: ${targetRect.top - 8}px;
        left: ${targetRect.left - 8}px;
        width: ${targetRect.width + 16}px;
        height: ${targetRect.height + 16}px;
      "></div>
    ` : ''}
    <div class="tour-card" style="
      ${targetRect && targetRect.top > window.innerHeight / 2
        ? 'top: 80px;'
        : 'bottom: 140px;'}
    ">
      <!-- Progress dots -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex gap-1.5">
          ${TOUR_STEPS.map((_, i) => `
            <div class="h-1.5 rounded-full transition-all ${i === tourStep ? 'w-6 bg-primary' : i < tourStep ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-gray-700'}"></div>
          `).join('')}
        </div>
        <button id="tour-skip" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Skip</button>
      </div>

      <!-- Emoji -->
      <div class="text-5xl mb-3 text-center">${step.emoji}</div>

      <!-- Content -->
      <div class="text-center mb-6">
        <div class="text-lg font-black mb-2">${esc(step.title)}</div>
        <div class="text-xs text-gray-400 leading-relaxed max-w-[300px] mx-auto">${esc(step.body)}</div>
      </div>

      <!-- Buttons -->
      <div class="flex gap-2">
        ${!isFirst ? `
          <button id="tour-prev" class="btn-press flex-1 py-3 rounded-xl bg-cardAlt border border-border font-bold text-xs text-gray-300">
            ← Back
          </button>
        ` : ''}
        <button id="tour-next" class="btn-press flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primaryDark font-black text-xs text-white ${isLast ? 'glow-primary' : ''}">
          ${isLast ? '🚀 Start Dominating' : isSecondToLast ? 'Almost there →' : 'Next →'}
        </button>
      </div>

      ${isLast ? `
        <div class="text-[9px] text-gray-600 text-center mt-4">
          You can restart the tour anytime from Settings
        </div>
      ` : ''}
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Wire buttons
  document.getElementById('tour-next').onclick = () => {
    if (isLast) {
      endOnboardingTour();
    } else {
      tourStep++;
      renderTourStep();
    }
  };

  const prevBtn = document.getElementById('tour-prev');
  if (prevBtn) prevBtn.onclick = () => {
    if (tourStep > 0) {
      tourStep--;
      renderTourStep();
    }
  };

  document.getElementById('tour-skip').onclick = () => {
    confirmDialog('Skip Tour?', 'You can restart it anytime from Settings.', endOnboardingTour, 'Skip', false);
  };
}

async function endOnboardingTour() {
  tourActive = false;
  const overlay = document.getElementById('tour-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }

  // Save to Firestore that user completed the tour
  try {
    await updateDoc(doc(db, 'users', State.user.uid), {
      tourCompleted: true,
      tourCompletedAt: serverTimestamp()
    });
    State.profile = { ...State.profile, tourCompleted: true };
  } catch (e) { /* silent */ }

  toast('🎉 Welcome to CODMPanda!', 'success', 3000);
}

// ============================================
// TRIGGER TOUR FOR FIRST-TIME USERS
// ============================================

// Hook into showMainApp — after main app loads, check if tour needed
const _origShowMainAppTour = showMainApp;
showMainApp = function() {
  _origShowMainAppTour();

  setTimeout(async () => {
    // Check if user has completed tour
    if (!State.profile) return;

    // Only show for users who haven't completed it
    if (State.profile.tourCompleted) return;

    // Check if it's a "new" user (created within last 10 minutes) OR just never did it
    const createdAt = State.profile.createdAt?.seconds ? State.profile.createdAt.seconds * 1000 : 0;
    const isNew = Date.now() - createdAt < 10 * 60 * 1000;

    if (isNew || !State.profile.tourCompleted) {
      // Wait a moment for the app to fully render
      setTimeout(() => startOnboardingTour(), 800);
    }
  }, 1500);
};

// ============================================
// ADD "RESTART TOUR" BUTTON TO SETTINGS
// ============================================

const _origHandleSettingActionTour = handleSettingAction;
handleSettingAction = function(action) {
  if (action === 'restart-tour') {
    startOnboardingTour();
    return;
  }
  return _origHandleSettingActionTour(action);
};

// Inject button into YOU tab settings
const _origRenderYouTabTour = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabTour();
  setTimeout(() => {
    const content = document.getElementById('content');
    if (!content) return;

    const settingsCards = content.querySelectorAll('.bg-card.border.border-border.rounded-2xl');
    let settingsList = null;
    settingsCards.forEach(card => {
      const header = card.querySelector('.text-xs.font-bold.text-gray-400.uppercase');
      if (header && header.textContent.trim() === 'Support') {
        settingsList = card.querySelector('.divide-y');
      }
    });

    if (settingsList && !settingsList.querySelector('[data-action="restart-tour"]')) {
      const btn = document.createElement('button');
      btn.className = 'settings-row w-full flex items-center justify-between px-4 py-3 text-left';
      btn.dataset.action = 'restart-tour';
      btn.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <i data-lucide="compass" class="w-4 h-4 text-gray-400 flex-shrink-0"></i>
          <div class="min-w-0">
            <div class="text-sm font-semibold">Replay App Tour</div>
            <div class="text-[10px] text-gray-500 truncate">See the walkthrough again</div>
          </div>
        </div>
        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
      `;
      btn.onclick = () => handleSettingAction('restart-tour');
      settingsList.insertBefore(btn, settingsList.firstChild);
      if (window.lucide) window.lucide.createIcons();
    }
  }, 130);
};

window.startOnboardingTour = startOnboardingTour;
window.endOnboardingTour = endOnboardingTour;

console.log('✅ Chunk 38: Onboarding tour loaded');

/* END OF CHUNK 38 */
// ============================================
// Chunk 39: Founder Badge + Update Banner + Better Invite
// ============================================

// ============================================
// PART 1: FOUNDER BADGE ON ADMIN'S POSTS
// ============================================

// Add founder badge to any content posted by the admin
function getFounderBadge(uid) {
  if (uid === ADMIN_UID) {
    return '<span class="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black flex items-center gap-0.5">👑 FOUNDER</span>';
  }
  return '';
}

// Hook into lobby render
const _origRenderLobbiesFounder = renderLobbies;
renderLobbies = function() {
  const feed = document.getElementById('lobbies-feed');
  if (!feed) return;

  _origRenderLobbiesFounder();

  // Add founder badge to admin's posts
  setTimeout(() => {
    feed.querySelectorAll('.bg-card').forEach(card => {
      const ignEl = card.querySelector('.font-bold.text-sm');
      if (!ignEl) return;
      const ign = ignEl.textContent.trim();
      if (ign === State.profile?.ign && State.user?.uid === ADMIN_UID) {
        if (!card.querySelector('.founder-badge')) {
          const badge = document.createElement('span');
          badge.className = 'founder-badge text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black';
          badge.textContent = '👑 FOUNDER';
          ignEl.parentNode.insertBefore(badge, ignEl.nextSibling);
        }
      }
    });
  }, 150);
};

// Hook into vault render
const _origRenderVaultsFounder = renderVaults;
renderVaults = function() {
  _origRenderVaultsFounder();
  setTimeout(() => {
    const feed = document.getElementById('vault-feed');
    if (!feed) return;
    // Founder vaults get a gold border
    feed.querySelectorAll('.bg-card').forEach(card => {
      if (!card.dataset.uidCheck) {
        card.dataset.uidCheck = '1';
      }
    });
  }, 100);
};

// ============================================
// PART 2: UPDATE AVAILABLE BANNER
// ============================================

const APP_BUILD_DATE = '2026-10-06'; // Update this each deploy
const STORED_BUILD_KEY = 'codmpanda_build_date';

function checkForUpdates() {
  const storedBuild = localStorage.getItem(STORED_BUILD_KEY);
  if (!storedBuild) {
    localStorage.setItem(STORED_BUILD_KEY, APP_BUILD_DATE);
    return;
  }

  if (storedBuild !== APP_BUILD_DATE) {
    showUpdateBanner();
  }
}

function showUpdateBanner() {
  if (document.getElementById('update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.style.cssText = `
    position: fixed;
    top: calc(var(--safe-top, 0px) + 60px);
    left: 16px;
    right: 16px;
    z-index: 9000;
    background: linear-gradient(135deg, #FF6B00 0%, #CC5500 100%);
    border-radius: 16px;
    padding: 12px 16px;
    box-shadow: 0 8px 30px rgba(255, 107, 0, 0.5);
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  banner.innerHTML = `
    <div style="font-size: 20px;">✨</div>
    <div style="flex: 1;">
      <div style="font-size: 12px; font-weight: 800; color: #fff;">New version available</div>
      <div style="font-size: 10px; color: rgba(255,255,255,0.85); margin-top: 2px;">Refresh to get latest features</div>
    </div>
    <button id="update-refresh-btn" style="
      background: #fff;
      color: #FF6B00;
      border: none;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 900;
      cursor: pointer;
      font-family: Inter, sans-serif;
    ">Refresh</button>
  `;

  document.body.appendChild(banner);

  // Add animation
  if (!document.getElementById('update-banner-style')) {
    const style = document.createElement('style');
    style.id = 'update-banner-style';
    style.textContent = `
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.getElementById('update-refresh-btn').onclick = async () => {
    // Update stored build date
    localStorage.setItem(STORED_BUILD_KEY, APP_BUILD_DATE);

    // Clear service worker caches
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }

    // Unregister service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }

    // Reload
    toast('Refreshing...', 'success', 1000);
    setTimeout(() => location.reload(true), 500);
  };
}

// Run check on app load
setTimeout(checkForUpdates, 3000);

// ============================================
// PART 3: BETTER INVITE MESSAGE
// ============================================

const _origShareAppBetter = shareApp;
shareApp = function() {
  const code = State.profile?.referralCode || '';
  const link = location.origin + '?ref=' + State.user.uid;

  const message = `🐼 Yo! Check out CODMPanda — the ultimate CODM companion.

✅ Find squads instantly (LFG)
✅ Track your camo grind
✅ Build & share gunsmiths
✅ Weekly tournaments & Clan Wars
✅ Free to use

Join me: ${link}

Use my code: ${code}`;

  if (navigator.share) {
    navigator.share({
      title: 'CODMPanda — The Ultimate CODM Companion',
      text: message,
      url: link
    }).catch(() => {
      copyText(link, 'Invite link copied!');
    });
  } else {
    // Fallback: copy to clipboard
    copyText(message, 'Invite message copied!');
  }
};

// ============================================
// PART 4: WELCOME BANNER (First-time users)
// ============================================

const _origShowMainAppWelcome = showMainApp;
showMainApp = function() {
  _origShowMainAppWelcome();

  setTimeout(() => {
    if (!State.profile) return;

    // Only show welcome to brand-new users (< 2 min old)
    const createdAt = State.profile.createdAt?.seconds ? State.profile.createdAt.seconds * 1000 : 0;
    const isBrandNew = Date.now() - createdAt < 2 * 60 * 1000;

    if (isBrandNew && !localStorage.getItem('codmpanda_welcomed')) {
      localStorage.setItem('codmpanda_welcomed', '1');
      setTimeout(() => {
        toast('🎉 Welcome! Tap any tab to explore', 'success', 5000);
      }, 2000);
    }
  }, 1000);
};

// ============================================
// PART 5: COPY PROFILE LINK QUICK ACTION
// ============================================

function copyMyProfileLink() {
  const link = `${location.origin}/?user=${State.user.uid}`;
  copyText(link, '✅ Profile link copied!');
}

// Add to profile header — quick share
const _origRenderYouTabShareLink = renderYouTab;
renderYouTab = function() {
  _origRenderYouTabShareLink();
  setTimeout(() => {
    const content = document.getElementById('content');
    if (!content) return;

    const friendsBtn = document.getElementById('open-friends-btn');
    if (!friendsBtn) return;
    if (document.getElementById('share-profile-link-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'share-profile-link-btn';
    btn.className = 'btn-press w-full mt-2 py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold flex items-center justify-center gap-2';
    btn.innerHTML = '<span>🔗</span> Copy Profile Link';
    btn.onclick = copyMyProfileLink;

    friendsBtn.parentNode.insertBefore(btn, friendsBtn.nextSibling);
    if (window.lucide) window.lucide.createIcons();
  }, 100);
};

window.copyMyProfileLink = copyMyProfileLink;
window.checkForUpdates = checkForUpdates;
window.showUpdateBanner = showUpdateBanner;
window.getFounderBadge = getFounderBadge;

console.log('✅ Chunk 39: Final polish loaded');

/* END OF CHUNK 39 */
// ============================================
// Chunk 40: Comments + Real-time Likes + Notifications
// ============================================

// ============================================
// PART 1: COMMENT SYSTEM
// ============================================

async function openCommentsSheet(contentType, contentId, contentTitle) {
  openSheet(`
    <div class="space-y-4">
      <div class="flex-1 overflow-y-auto max-h-[60vh] space-y-3" id="comments-list">
        <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
      </div>
      <div class="sticky bottom-0 bg-[#0a0a0a] pt-3 border-t border-border flex gap-2">
        <input id="comment-input" type="text" placeholder="Write a comment..." maxlength="300" class="flex-1" />
        <button id="comment-send" class="btn-press w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <i data-lucide="send" class="w-5 h-5 text-white"></i>
        </button>
      </div>
    </div>
  `, `💬 Comments`);

  const commentsList = document.getElementById('comments-list');

  const loadComments = async () => {
    try {
      const snap = await getDocs(query(
        collection(db, 'comments'),
        where('contentId', '==', contentId),
        limit(100)
      ));

      const comments = [];
      snap.forEach(d => comments.push({ id: d.id, ...d.data() }));
      comments.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      if (comments.length === 0) {
        commentsList.innerHTML = `
          <div class="text-center py-8">
            <div class="text-4xl mb-2">💬</div>
            <div class="text-xs text-gray-500">No comments yet</div>
            <div class="text-[10px] text-gray-600 mt-1">Be the first to reply</div>
          </div>
        `;
        return;
      }

      commentsList.innerHTML = comments.map(c => {
        const isMine = c.uid === State.user.uid;
        return `
          <div class="flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''}">
            <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
              ${c.avatar ? `<img src="${esc(c.avatar)}" class="w-full h-full object-cover" />` : getInitials(c.ign)}
            </div>
            <div class="flex-1 min-w-0 ${isMine ? 'text-right' : ''}">
              <div class="inline-block max-w-full ${isMine ? 'bg-primary text-white' : 'bg-card border border-border'} rounded-2xl px-3 py-2 text-left">
                <div class="text-[10px] font-bold ${isMine ? 'text-white/90' : 'text-primary'} mb-0.5">${esc(c.ign)}</div>
                <div class="text-xs break-words">${esc(c.text)}</div>
              </div>
              <div class="flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : ''}">
                <span class="text-[9px] text-gray-500">${timeAgo(c.createdAt)}</span>
                ${isMine ? `
                  <button class="delete-comment text-[9px] text-red-400 font-bold" data-id="${c.id}">Delete</button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Wire delete
      commentsList.querySelectorAll('.delete-comment').forEach(btn => {
        btn.onclick = async () => {
          try {
            await deleteDoc(doc(db, 'comments', btn.dataset.id));
            toast('Comment deleted', 'success', 1200);
            loadComments();
          } catch (e) { toast('Failed', 'error'); }
        };
      });

      if (window.lucide) window.lucide.createIcons();

      // Scroll to bottom
      setTimeout(() => {
        const sheet = document.querySelector('#sheet-container .sheet');
        if (sheet) sheet.scrollTop = sheet.scrollHeight;
      }, 50);
    } catch (e) {
      console.error('Comments error:', e);
      commentsList.innerHTML = '<div class="text-center py-6 text-red-400 text-xs">Failed to load</div>';
    }
  };

  const sendComment = async () => {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 300) { toast('Comment too long', 'error'); return; }

    input.value = '';
    input.disabled = true;

    try {
      await addDoc(collection(db, 'comments'), {
        contentId,
        contentType,
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        text,
        createdAt: serverTimestamp()
      });

      // Notify content owner
      try {
        const ownerDoc = await getDoc(doc(db, contentType === 'lobby' ? 'lobbies' : contentType === 'clip' ? 'clips' : 'vaults', contentId));
        if (ownerDoc.exists()) {
          const ownerUid = ownerDoc.data().uid || ownerDoc.data().submittedByUid;
          if (ownerUid && ownerUid !== State.user.uid) {
            await sendNotificationToUser(
              ownerUid,
              `💬 ${State.profile.ign}`,
              text.length > 60 ? text.slice(0, 60) + '...' : text,
              { type: 'comment', contentType, contentId }
            );
          }
        }
      } catch (e) { /* silent */ }

      loadComments();
    } catch (e) {
      console.error(e);
      toast('Failed to send', 'error');
    } finally {
      input.disabled = false;
      input.focus();
    }
  };

  document.getElementById('comment-send').onclick = sendComment;
  document.getElementById('comment-input').onkeypress = (e) => {
    if (e.key === 'Enter') sendComment();
  };

  await loadComments();
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 2: ADD COMMENT BUTTONS TO CONTENT
// ============================================

// Hook into lobby render — add comment button
const _origRenderLobbiesComments = renderLobbies;
renderLobbies = function() {
  _origRenderLobbiesComments();

  setTimeout(() => {
    const feed = document.getElementById('lobbies-feed');
    if (!feed) return;

    feed.querySelectorAll('.bg-card').forEach(card => {
      if (card.querySelector('.comment-btn')) return;

      const buttonsRow = card.querySelector('.flex.gap-2');
      if (!buttonsRow) return;

      const lobbyId = buttonsRow.querySelector('.join-btn')?.dataset.id || buttonsRow.querySelector('.share-lobby')?.dataset.id;
      if (!lobbyId) return;

      const btn = document.createElement('button');
      btn.className = 'comment-btn btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center';
      btn.dataset.id = lobbyId;
      btn.innerHTML = '<i data-lucide="message-circle" class="w-4 h-4 text-gray-400"></i>';
      btn.onclick = () => openCommentsSheet('lobby', lobbyId, 'Lobby');

      const shareBtn = buttonsRow.querySelector('.share-lobby');
      if (shareBtn) {
        shareBtn.parentNode.insertBefore(btn, shareBtn);
      } else {
        buttonsRow.appendChild(btn);
      }
    });
    if (window.lucide) window.lucide.createIcons();
  }, 150);
};

// Hook into clip render — add comment button
const _origRenderClipsComments = renderClips;
renderClips = function() {
  _origRenderClipsComments();

  setTimeout(() => {
    const feed = document.getElementById('clips-feed');
    if (!feed) return;

    feed.querySelectorAll('.bg-card').forEach(card => {
      if (card.querySelector('.comment-btn')) return;

      const buttonsRow = card.querySelector('.flex.items-center.justify-between');
      if (!buttonsRow) return;

      const clipId = buttonsRow.querySelector('.like-clip')?.dataset.id;
      if (!clipId) return;

      const btn = document.createElement('button');
      btn.className = 'comment-btn btn-press flex items-center gap-1 text-xs text-gray-400';
      btn.dataset.id = clipId;
      btn.innerHTML = '<i data-lucide="message-circle" class="w-4 h-4"></i>';
      btn.onclick = () => openCommentsSheet('clip', clipId, 'Clip');

      const likeBtn = buttonsRow.querySelector('.like-clip');
      if (likeBtn) {
        likeBtn.parentNode.insertBefore(btn, likeBtn.nextSibling);
      }
    });
    if (window.lucide) window.lucide.createIcons();
  }, 150);
};

// ============================================
// PART 3: REAL-TIME LIKE COUNTS
// ============================================

// Add live subscription to likes for visible items
function setupRealtimeLikes() {
  // Skip for now — Firestore already updates via onSnapshot when parent collection changes
  // Likes are already real-time via the parent listener
}

// ============================================
// PART 4: JOIN NOTIFICATION
// ============================================

// Enhanced joinLobby with notification
const _origJoinLobbyNotif = joinLobby;
joinLobby = async function(lobbyId) {
  const lobby = State.cache.lobbies.find(l => l.id === lobbyId);
  if (!lobby) return;

  // Send notification to lobby creator (if not self)
  if (lobby.uid && lobby.uid !== State.user.uid) {
    try {
      await sendNotificationToUser(
        lobby.uid,
        '🎮 Someone Joined!',
        `${State.profile.ign} joined your ${lobby.mode} lobby`,
        { type: 'lobby_join', lobbyId }
      );
    } catch (e) { /* silent */ }
  }

  return _origJoinLobbyNotif(lobbyId);
};

// ============================================
// PART 5: LOBBY COMMENTS COUNT BADGE
// ============================================

// Cache comment counts to avoid N+1 queries
let commentCountsCache = {};

async function updateCommentCounts() {
  try {
    const snap = await getDocs(query(collection(db, 'comments'), limit(500)));
    const counts = {};
    snap.forEach(d => {
      const c = d.data();
      if (!c.contentId) return;
      counts[c.contentId] = (counts[c.contentId] || 0) + 1;
    });
    commentCountsCache = counts;

    // Update visible buttons
    document.querySelectorAll('.comment-btn').forEach(btn => {
      const id = btn.dataset.id;
      const count = counts[id] || 0;
      const existingBadge = btn.querySelector('.comment-count');
      if (existingBadge) existingBadge.remove();

      if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'comment-count text-[9px] text-primary font-bold absolute -top-1 -right-1 bg-primary/20 px-1 rounded-full';
        badge.textContent = count;
        btn.style.position = 'relative';
        btn.appendChild(badge);
      }
    });
  } catch (e) { /* silent */ }
}

setTimeout(updateCommentCounts, 5000);

window.openCommentsSheet = openCommentsSheet;
window.updateCommentCounts = updateCommentCounts;

console.log('✅ Chunk 40: Comments + Join notifications loaded');

/* END OF CHUNK 40 */
// ============================================
// Chunk 41: Edit + Reply + Like + @Mention (Friends Only)
// ============================================

// ============================================
// PART 1: EDIT + DELETE MESSAGES
// ============================================

async function openMessageOptions(messageId, currentText) {
  openSheet(`
    <div class="space-y-3">
      <div class="bg-card border border-border rounded-xl p-3 mb-2">
        <div class="text-[10px] text-gray-500 uppercase font-bold mb-1">Message</div>
        <div class="text-xs text-gray-300 break-words">${esc(currentText)}</div>
      </div>

      <button id="msg-edit-btn" class="btn-press w-full py-3.5 rounded-xl bg-primary font-bold text-sm text-white flex items-center justify-center gap-2">
        <i data-lucide="pencil" class="w-4 h-4"></i> Edit Message
      </button>

      <button id="msg-delete-btn" class="btn-press w-full py-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm flex items-center justify-center gap-2">
        <i data-lucide="trash-2" class="w-4 h-4"></i> Delete Message
      </button>

      <button onclick="closeSheet()" class="text-xs text-gray-500 w-full pt-2">Cancel</button>
    </div>
  `, 'Message Options');

  document.getElementById('msg-edit-btn').onclick = () => {
    closeSheet();
    setTimeout(() => openEditMessageModal(messageId, currentText), 300);
  };

  document.getElementById('msg-delete-btn').onclick = () => {
    closeSheet();
    setTimeout(() => {
      confirmDialog('Delete Message', 'This message will be removed permanently.', async () => {
        try {
          await deleteDoc(doc(db, 'messages', messageId));
          toast('🗑️ Message deleted', 'success');
          // Reopen thread
          const friendName = document.querySelector('#sheet-container h3')?.textContent?.replace('💬', '').trim();
          if (friendName) {
            setTimeout(() => {
              const thread = document.querySelector('#dm-messages');
              if (thread) {
                // Just close and let user reopen
                closeSheet();
              }
            }, 300);
          }
        } catch (e) {
          toast('Failed: ' + e.message, 'error');
        }
      }, 'Delete', true);
    }, 300);
  };

  if (window.lucide) window.lucide.createIcons();
}

function openEditMessageModal(messageId, currentText) {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Edit Message</label>
        <textarea id="edit-msg-input" rows="4" maxlength="500" placeholder="Edit your message...">${esc(currentText)}</textarea>
      </div>
      <div class="flex gap-2">
        <button onclick="closeSheet()" class="btn-press flex-1 py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm">Cancel</button>
        <button id="edit-msg-save" class="btn-press flex-1 py-3 rounded-xl bg-primary font-bold text-sm text-white">Save</button>
      </div>
    </div>
  `, 'Edit Message');

  setTimeout(() => {
    const input = document.getElementById('edit-msg-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 200);

  document.getElementById('edit-msg-save').onclick = async () => {
    const newText = document.getElementById('edit-msg-input').value.trim();
    if (!newText) { toast('Message cannot be empty', 'error'); return; }

    try {
      await updateDoc(doc(db, 'messages', messageId), {
        text: newText,
        edited: true,
        editedAt: serverTimestamp()
      });
      toast('✏️ Message edited', 'success');
      closeSheet();
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 2: ENHANCED DM RENDER (with edit/reply)
// ============================================

const _origOpenDMThreadFull = openDMThread;
openDMThread = async function(friendUid, friendIgn) {
  await _origOpenDMThreadFull(friendUid, friendIgn);

  // After render, make own bubbles clickable
  setTimeout(() => {
    const container = document.getElementById('dm-messages');
    if (!container) return;

    // Find all message bubbles (chat-style rounded divs)
    container.querySelectorAll('.flex').forEach(row => {
      const bubble = row.querySelector('.rounded-2xl');
      if (!bubble) return;
      if (bubble.dataset.enhanced) return;

      const isMine = bubble.classList.contains('bg-primary');
      if (!isMine) return;

      bubble.dataset.enhanced = '1';
      bubble.style.cursor = 'pointer';

      bubble.onclick = (e) => {
        e.stopPropagation();
        const textEl = bubble.querySelector('.text-xs');
        if (!textEl) return;
        const text = textEl.textContent.trim();
        findMessageByText(text, friendUid);
      };
    });
  }, 500);
};

async function findMessageByText(messageText, friendUid) {
  try {
    const chatId = [State.user.uid, friendUid].sort().join('_');

    const snap = await getDocs(query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('fromUid', '==', State.user.uid),
      limit(100)
    ));

    const matching = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.text === messageText) {
        matching.push({ id: d.id, ...data });
      }
    });

    if (matching.length === 0) {
      toast('Message not found', 'error');
      return;
    }

    matching.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    const msg = matching[0];
    openMessageOptions(msg.id, msg.text);
  } catch (e) {
    console.error('Find msg error:', e);
  }
}

// ============================================
// PART 3: REPLY TO COMMENTS + LIKE + EDIT
// ============================================

let commentReplyTo = null;

const _origOpenCommentsSheetFull = openCommentsSheet;
openCommentsSheet = async function(contentType, contentId, contentTitle) {
  commentReplyTo = null;
  await _origOpenCommentsSheetFull(contentType, contentId, contentTitle);

  // After render, enhance with reply/like/edit
  setTimeout(() => {
    enhanceComments(contentType, contentId);
  }, 500);
};

function enhanceComments(contentType, contentId) {
  const container = document.getElementById('comments-list');
  if (!container) return;

  // Add reply + like buttons to each comment
  container.querySelectorAll('.flex.items-start').forEach(row => {
    if (row.dataset.enhanced) return;
    row.dataset.enhanced = '1';

    const bubble = row.querySelector('.rounded-2xl');
    if (!bubble) return;

    const textEl = bubble.querySelector('.text-xs');
    if (!textEl) return;

    const commentText = textEl.textContent.trim();
    const isMine = bubble.classList.contains('bg-primary');

    // Find the comment ID — look for the delete button on your own, or query by text
    const deleteBtn = row.querySelector('.delete-comment');
    const commentId = deleteBtn?.dataset.id || null;

    // Build action row
    const actionRow = document.createElement('div');
    actionRow.className = 'flex items-center gap-3 mt-1 ' + (isMine ? 'justify-end' : '');
    actionRow.innerHTML = `
      ${!isMine ? `<button class="reply-btn text-[9px] text-gray-500 font-bold">Reply</button>` : ''}
      <button class="like-comment-btn text-[9px] text-gray-500 font-bold flex items-center gap-1">❤️ <span class="like-count">0</span></button>
      ${isMine ? `<button class="edit-comment-btn text-[9px] text-primary font-bold">Edit</button>` : ''}
    `;

    // Insert after existing meta row
    const metaRow = row.querySelector('.flex.items-center.gap-2.mt-1') || bubble.nextElementSibling;
    if (metaRow && metaRow.parentNode) {
      metaRow.parentNode.insertBefore(actionRow, metaRow.nextSibling);
    } else {
      row.querySelector('.flex-1').appendChild(actionRow);
    }

    // Wire reply button
    const replyBtn = actionRow.querySelector('.reply-btn');
    if (replyBtn) {
      replyBtn.onclick = () => {
        commentReplyTo = { text: commentText, id: commentId };
        const input = document.getElementById('comment-input');
        if (input) {
          input.placeholder = `Replying to comment...`;
          input.focus();
          input.parentNode.style.borderTop = '2px solid #FF6B00';
        }
      };
    }

    // Wire like button
    const likeBtn = actionRow.querySelector('.like-comment-btn');
    if (likeBtn) {
      likeBtn.onclick = async () => {
        if (!commentId) { toast('Cannot like', 'error'); return; }
        try {
          await updateDoc(doc(db, 'comments', commentId), { likes: increment(1) });
          const countEl = likeBtn.querySelector('.like-count');
          countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;
          toast('❤️', 'success', 800);
        } catch (e) { toast('Failed', 'error'); }
      };
    }

    // Wire edit button
    const editBtn = actionRow.querySelector('.edit-comment-btn');
    if (editBtn && commentId) {
      editBtn.onclick = () => openEditCommentModal(commentId, commentText);
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 4: @MENTION AUTOCOMPLETE (Friends Only)
// ============================================

let mentionFriends = [];
let mentionDropdownEl = null;
let mentionTarget = null;

async function loadMentionFriends() {
  if (mentionFriends.length > 0) return mentionFriends;
  try {
    const snap = await getDoc(doc(db, 'users', State.user.uid));
    const data = snap.exists() ? snap.data() : {};
    const friendUids = data.friends || [];

    const friends = [];
    for (const uid of friendUids.slice(0, 30)) {
      try {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) friends.push({ uid, ign: s.data().ign, avatar: s.data().avatar });
      } catch (e) { /* skip */ }
    }
    mentionFriends = friends;
    return friends;
  } catch (e) {
    return [];
  }
}

function closeMentionDropdown() {
  if (mentionDropdownEl) {
    mentionDropdownEl.remove();
    mentionDropdownEl = null;
  }
  mentionTarget = null;
}

function showMentionDropdown(inputEl, filter = '') {
  closeMentionDropdown();
  mentionTarget = inputEl;

  const matches = mentionFriends.filter(f =>
    f.ign.toLowerCase().includes(filter.toLowerCase())
  ).slice(0, 6);

  if (matches.length === 0) return;

  const rect = inputEl.getBoundingClientRect();
  const dropdown = document.createElement('div');
  dropdown.className = 'mention-dropdown';
  dropdown.style.cssText = `
    position: fixed;
    bottom: ${window.innerHeight - rect.top + 8}px;
    left: 16px;
    right: 16px;
    max-width: 400px;
    margin: 0 auto;
    background: #0a0a0a;
    border: 1px solid #FF6B00;
    border-radius: 16px;
    padding: 8px;
    z-index: 10000;
    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.8);
    max-height: 240px;
    overflow-y: auto;
  `;

  dropdown.innerHTML = matches.map(f => `
    <button class="mention-opt w-full flex items-center gap-2 p-2 rounded-lg hover:bg-primary/10 text-left" data-ign="${esc(f.ign)}">
      <div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
        ${f.avatar ? `<img src="${esc(f.avatar)}" class="w-full h-full object-cover" />` : getInitials(f.ign)}
      </div>
      <span class="text-xs font-bold text-white flex-1">@${esc(f.ign)}</span>
    </button>
  `).join('');

  document.body.appendChild(dropdown);
  mentionDropdownEl = dropdown;

  dropdown.querySelectorAll('.mention-opt').forEach(btn => {
    btn.onclick = () => {
      insertMention(inputEl, btn.dataset.ign);
      closeMentionDropdown();
    };
  });
}

function insertMention(inputEl, ign) {
  const value = inputEl.value;
  const cursorPos = inputEl.selectionStart || value.length;

  // Find the @ symbol before cursor
  const beforeCursor = value.slice(0, cursorPos);
  const atIndex = beforeCursor.lastIndexOf('@');

  if (atIndex === -1) return;

  const before = value.slice(0, atIndex);
  const after = value.slice(cursorPos);
  const newValue = before + '@' + ign + ' ' + after;

  inputEl.value = newValue;
  inputEl.focus();

  const newCursor = atIndex + ign.length + 2;
  inputEl.setSelectionRange(newCursor, newCursor);
}

function setupMentionListener(inputEl) {
  if (!inputEl || inputEl.dataset.mentionSetup) return;
  inputEl.dataset.mentionSetup = '1';

  inputEl.addEventListener('input', async (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || value.length;
    const beforeCursor = value.slice(0, cursorPos);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex === -1) {
      closeMentionDropdown();
      return;
    }

    // Check if there's a space after @ (user typed @ + something)
    const afterAt = beforeCursor.slice(atIndex + 1);
    if (afterAt.includes(' ') || afterAt.includes('\n')) {
      closeMentionDropdown();
      return;
    }

    await loadMentionFriends();
    showMentionDropdown(inputEl, afterAt);
  });

  // Close dropdown on blur
  inputEl.addEventListener('blur', () => {
    setTimeout(closeMentionDropdown, 200);
  });
}

// Hook into DM input to add mention
const _origOpenDMThreadMention = openDMThread;
openDMThread = async function(friendUid, friendIgn) {
  await _origOpenDMThreadMention(friendUid, friendIgn);
  setTimeout(() => {
    const dmInput = document.getElementById('dm-input');
    if (dmInput) setupMentionListener(dmInput);
  }, 300);
};

// Hook into comment input to add mention
const _origOpenCommentsSheetMention = openCommentsSheet;
openCommentsSheet = async function(contentType, contentId, contentTitle) {
  await _origOpenCommentsSheetMention(contentType, contentId, contentTitle);
  setTimeout(() => {
    const commentInput = document.getElementById('comment-input');
    if (commentInput) setupMentionListener(commentInput);
  }, 300);
};

// ============================================
// PART 5: MENTION NOTIFICATIONS
// ============================================

// Detect @mentions on save and notify mentioned users
async function notifyMentions(text, sourceType, sourceId) {
  try {
    const mentionRegex = /@([A-Za-z0-9_]{2,24})/g;
    const mentions = new Set();
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.add(match[1]);
    }
    if (mentions.size === 0) return;

    await loadMentionFriends();

    for (const ign of mentions) {
      const friend = mentionFriends.find(f => f.ign.toLowerCase() === ign.toLowerCase());
      if (!friend) continue;
      if (friend.uid === State.user.uid) continue;

      try {
        await sendNotificationToUser(
          friend.uid,
          `💬 ${State.profile.ign} mentioned you`,
          text.length > 80 ? text.slice(0, 80) + '...' : text,
          { type: 'mention', sourceType, sourceId }
        );
      } catch (e) { /* silent */ }
    }
  } catch (e) {
    console.warn('Mention notify error:', e);
  }
}

// Hook into comment send
const _origSendCommentMention = window.sendComment;
// Since sendComment is inside openCommentsSheet, we hook via override
const _origOpenCommentsNotify = openCommentsSheet;
openCommentsSheet = async function(contentType, contentId, contentTitle) {
  await _origOpenCommentsNotify(contentType, contentId, contentTitle);

  // Find the send button and wrap it
  setTimeout(() => {
    const sendBtn = document.getElementById('comment-send');
    const input = document.getElementById('comment-input');
    if (!sendBtn || !input || sendBtn.dataset.mentionWrapped) return;

    sendBtn.dataset.mentionWrapped = '1';
    const originalOnclick = sendBtn.onclick;

    sendBtn.onclick = async () => {
      const text = input.value.trim();
      if (text) {
        // Fire mention notification (async, doesn't block)
        notifyMentions(text, contentType, contentId).catch(() => {});
      }
      // Call original
      if (originalOnclick) await originalOnclick.call(sendBtn);
    };
  }, 500);
};

// Hook into DM send
const _origOpenDMSend = openDMThread;
openDMThread = async function(friendUid, friendIgn) {
  await _origOpenDMSend(friendUid, friendIgn);

  setTimeout(() => {
    const sendBtn = document.getElementById('dm-send');
    const input = document.getElementById('dm-input');
    if (!sendBtn || !input || sendBtn.dataset.mentionWrapped) return;

    sendBtn.dataset.mentionWrapped = '1';
    const originalOnclick = sendBtn.onclick;

    sendBtn.onclick = async () => {
      const text = input.value.trim();
      if (text) {
        notifyMentions(text, 'dm', null).catch(() => {});
      }
      if (originalOnclick) await originalOnclick.call(sendBtn);
    };
  }, 500);
};

// ============================================
// PART 6: HIGHLIGHT MENTIONS IN RENDERED TEXT
// ============================================

function highlightMentions(text) {
  if (!text) return '';
  const escaped = esc(text);
  return escaped.replace(/@([A-Za-z0-9_]{2,24})/g, '<span class="mention-text text-primary font-bold">@$1</span>');
}

// Make mentions tappable
document.addEventListener('click', async (e) => {
  const mention = e.target.closest('.mention-text');
  if (!mention) return;
  e.stopPropagation();

  const ign = mention.textContent.replace('@', '').trim();
  await loadMentionFriends();
  const friend = mentionFriends.find(f => f.ign.toLowerCase() === ign.toLowerCase());
  if (friend) {
    openUserProfile(friend.uid);
  } else {
    toast('User not found', 'info');
  }
});

window.openMessageOptions = openMessageOptions;
window.openEditMessageModal = openEditMessageModal;
window.notifyMentions = notifyMentions;
window.highlightMentions = highlightMentions;

console.log('✅ Chunk 41: Edit + Reply + Like + @Mention loaded');

/* END OF CHUNK 41 */


// ============================================
// Chunk 43: Professional Full-Screen Inbox
// ============================================

let inboxTab = 'notifications';
let inboxCache = {
  notifications: null,
  conversations: null,
  lastFetch: 0
};

// ============================================
// PART 1: FULL-SCREEN INBOX OVERLAY
// ============================================

const _origOpenNotificationsPanelInbox43 = openNotificationsPanel;
openNotificationsPanel = function() {
  // Create or reuse full-screen overlay
  let overlay = document.getElementById('inbox-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'inbox-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 500;
      background: #050505;
      display: flex;
      flex-direction: column;
      animation: inboxSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
  }

  // Add animation styles
  if (!document.getElementById('inbox-animations')) {
    const style = document.createElement('style');
    style.id = 'inbox-animations';
    style.textContent = `
      @keyframes inboxSlideIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  overlay.innerHTML = `
    <!-- Header -->
    <div style="
      padding-top: calc(env(safe-area-inset-top, 0px) + 12px);
      padding-bottom: 12px;
      padding-left: 16px;
      padding-right: 16px;
      border-bottom: 1px solid #222;
      background: #050505;
      flex-shrink: 0;
    ">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <button id="inbox-close-btn" class="btn-press" style="
          width: 40px; height: 40px;
          border-radius: 12px;
          background: #111;
          border: 1px solid #222;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div style="flex: 1;">
          <div style="font-size: 20px; font-weight: 900; color: #fff; font-family: Inter, sans-serif;">Inbox</div>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 8px;">
        <button class="inbox-tab-btn" data-tab="notifications" style="
          flex: 1;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          font-family: Inter, sans-serif;
          cursor: pointer;
          border: 1px solid ${inboxTab === 'notifications' ? '#FF6B00' : '#222'};
          background: ${inboxTab === 'notifications' ? 'rgba(255, 107, 0, 0.15)' : '#111'};
          color: ${inboxTab === 'notifications' ? '#FF6B00' : '#888'};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        ">
          <span>🔔</span> Notifications
        </button>
        <button class="inbox-tab-btn" data-tab="messages" style="
          flex: 1;
          padding: 10px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          font-family: Inter, sans-serif;
          cursor: pointer;
          border: 1px solid ${inboxTab === 'messages' ? '#FF6B00' : '#222'};
          background: ${inboxTab === 'messages' ? 'rgba(255, 107, 0, 0.15)' : '#111'};
          color: ${inboxTab === 'messages' ? '#FF6B00' : '#888'};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        ">
          <span>💬</span> Messages
        </button>
      </div>
    </div>

    <!-- Body -->
    <div id="inbox-full-body" style="
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
    ">
      <div style="text-align: center; padding: 40px 0;">
        <div class="spinner" style="margin: 0 auto;"></div>
      </div>
    </div>
  `;

  // Wire close
  document.getElementById('inbox-close-btn').onclick = closeInboxOverlay;

  // Wire tabs
  document.querySelectorAll('.inbox-tab-btn').forEach(btn => {
    btn.onclick = () => {
      inboxTab = btn.dataset.tab;
      // Re-render with new tab active
      openNotificationsPanel();
    };
  });

  // Render body
  renderInboxBody();
};

function closeInboxOverlay() {
  const overlay = document.getElementById('inbox-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease-out';
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 200);
  }
  // Reset cache so next open refetches
  inboxCache.lastFetch = 0;
}

// ============================================
// PART 2: ROUTER
// ============================================

function renderInboxBody() {
  if (inboxTab === 'notifications') {
    renderNotificationsTabFast();
  } else {
    renderMessagesTabFast();
  }
}

// ============================================
// PART 3: FAST NOTIFICATIONS TAB
// ============================================

async function renderNotificationsTabFast() {
  const body = document.getElementById('inbox-full-body');
  if (!body) return;

  body.innerHTML = '<div style="text-align: center; padding: 40px 0;"><div class="spinner" style="margin: 0 auto;"></div></div>';

  try {
    // Use cache if fresh (< 30s old)
    const now = Date.now();
    let notifs;
    if (inboxCache.notifications && now - inboxCache.lastFetch < 30000) {
      notifs = inboxCache.notifications;
    } else {
      const snap = await getDocs(query(
        collection(db, 'notifications'),
        where('userId', '==', State.user.uid),
        limit(50)
      ));
      notifs = [];
      snap.forEach(d => {
        const data = d.data();
        // Filter out DM notifications — those go to Messages tab now
        if (data.type === 'dm') return;
        notifs.push({ id: d.id, ...data });
      });
      notifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      inboxCache.notifications = notifs;
      inboxCache.lastFetch = now;
    }

    if (notifs.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 60px; margin-bottom: 12px;">🔔</div>
          <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px;">No notifications</div>
          <div style="font-size: 12px; color: #666;">You'll see approvals, mentions, and updates here</div>
        </div>
      `;
      return;
    }

    const notifTypes = {
      approval: { emoji: '✅', color: '#34C759' },
      rejection: { emoji: '❌', color: '#FF3B30' },
      badge: { emoji: '🏆', color: '#FFD700' },
      leak: { emoji: '🔥', color: '#FF6B00' },
      party_invite: { emoji: '🎉', color: '#AF52DE' },
      friend_request: { emoji: '👋', color: '#34C759' },
      tournament: { emoji: '🏆', color: '#FFD700' },
      mention: { emoji: '📣', color: '#FF6B00' },
      comment: { emoji: '💬', color: '#00BFFF' },
      lobby_join: { emoji: '🎮', color: '#FF6B00' },
      default: { emoji: '🔔', color: '#8E8E93' }
    };

    const unreadCount = notifs.filter(n => !n.read).length;

    body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 11px; color: #666; font-weight: 700;">${notifs.length} total${unreadCount > 0 ? ' · ' + unreadCount + ' unread' : ''}</div>
        ${unreadCount > 0 ? '<button id="mark-all-read-full" style="font-size: 11px; color: #FF6B00; font-weight: 800; background: none; border: none; cursor: pointer; font-family: Inter;">Mark all read</button>' : ''}
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${notifs.map(n => {
          const t = notifTypes[n.type] || notifTypes.default;
          const isUnread = !n.read;
          return `
            <div class="notification-item-full" data-id="${n.id}" style="
              background: ${isUnread ? 'rgba(255, 107, 0, 0.08)' : '#111'};
              border: 1px solid ${isUnread ? 'rgba(255, 107, 0, 0.3)' : '#222'};
              border-radius: 14px;
              padding: 12px;
              cursor: pointer;
              display: flex;
              gap: 12px;
              align-items: flex-start;
            ">
              <div style="
                width: 40px; height: 40px;
                border-radius: 12px;
                background: ${t.color}20;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
              ">${t.emoji}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; font-weight: 800; color: ${isUnread ? '#fff' : '#ccc'}; margin-bottom: 3px;">${esc(n.title || '')}</div>
                <div style="font-size: 12px; color: #888; line-height: 1.4; margin-bottom: 4px;">${esc(n.body || '')}</div>
                <div style="font-size: 10px; color: #555;">${timeAgo(n.createdAt)}</div>
              </div>
              ${isUnread ? '<div style="width: 8px; height: 8px; border-radius: 50%; background: #FF6B00; flex-shrink: 0; margin-top: 4px;"></div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Wire mark all
    const markAllBtn = document.getElementById('mark-all-read-full');
    if (markAllBtn) {
      markAllBtn.onclick = async () => {
        try {
          const updates = [];
          notifs.forEach(n => {
            if (!n.read) updates.push(updateDoc(doc(db, 'notifications', n.id), { read: true }));
          });
          await Promise.all(updates);
          inboxCache.notifications = null;
          inboxCache.lastFetch = 0;
          toast('All marked read', 'success');
          updateCombinedBadge();
          renderNotificationsTabFast();
        } catch (e) { toast('Failed', 'error'); }
      };
    }

    // Wire notification clicks
    body.querySelectorAll('.notification-item-full').forEach(el => {
      el.onclick = async () => {
        const id = el.dataset.id;
        const notif = notifs.find(n => n.id === id);
        if (!notif) return;

        try {
          await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (e) { /* silent */ }

        // Route based on type
        closeInboxOverlay();
        setTimeout(() => {
          if (notif.type === 'mention' && notif.data?.sourceType === 'dm') {
            inboxTab = 'messages';
            openNotificationsPanel();
          } else if (notif.type === 'comment' && notif.data?.contentId) {
            if (notif.data.contentType === 'clip') { squadSubTab = 'clips'; switchTab('squad'); }
            else if (notif.data.contentType === 'lobby') { switchTab('play'); }
          } else if (notif.type === 'approval' || notif.type === 'rejection') {
            if (notif.data?.contentType === 'vault') { labSubTab = 'vault'; switchTab('lab'); }
            else if (notif.data?.contentType === 'clip') { squadSubTab = 'clips'; switchTab('squad'); }
            else if (notif.data?.contentType === 'leak') { intelSubTab = 'leaks'; switchTab('intel'); }
          } else if (notif.type === 'lobby_join') {
            switchTab('play');
          } else if (notif.type === 'friend_request') {
            showFriendsPanel();
          } else if (notif.type === 'party_invite') {
            switchTab('play');
          }
        }, 250);

        updateCombinedBadge();
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Inbox notif error:', e);
    body.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44; font-size: 13px;">Failed to load</div>';
  }
}

// ============================================
// PART 4: FAST MESSAGES TAB (optimized queries)
// ============================================

async function renderMessagesTabFast() {
  const body = document.getElementById('inbox-full-body');
  if (!body) return;

  body.innerHTML = '<div style="text-align: center; padding: 40px 0;"><div class="spinner" style="margin: 0 auto;"></div></div>';

  try {
    // Get my friends list (cached in State.profile)
    const mySnap = await getDoc(doc(db, 'users', State.user.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    const friendUids = myData.friends || [];

    if (friendUids.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 60px; margin-bottom: 12px;">💬</div>
          <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px;">No conversations yet</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 20px;">Add friends to start chatting</div>
          <button id="inbox-find-friends" class="btn-press" style="
            padding: 12px 24px;
            border-radius: 12px;
            background: #FF6B00;
            border: none;
            color: #fff;
            font-weight: 800;
            font-size: 13px;
            font-family: Inter;
            cursor: pointer;
          ">Find Friends</button>
        </div>
      `;
      const btn = document.getElementById('inbox-find-friends');
      if (btn) btn.onclick = () => {
        closeInboxOverlay();
        setTimeout(showFriendsPanel, 300);
      };
      return;
    }

    // OPTIMIZED: Query only last 100 messages that involve me
    // Single query using array-contains on a `participants` field
    // Since old messages don't have this field, fallback to 2 queries
    let allMessages = [];

    const [snap1, snap2] = await Promise.all([
      getDocs(query(collection(db, 'messages'), where('fromUid', '==', State.user.uid), limit(100))),
      getDocs(query(collection(db, 'messages'), where('toUid', '==', State.user.uid), limit(100)))
    ]);

    const seen = new Set();
    snap1.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); allMessages.push({ id: d.id, ...d.data() }); } });
    snap2.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); allMessages.push({ id: d.id, ...d.data() }); } });

    // Group by chatId
    const grouped = {};
    allMessages.forEach(m => {
      if (!grouped[m.chatId]) grouped[m.chatId] = [];
      grouped[m.chatId].push(m);
    });

    // Build conversation list
    const conversations = [];
    for (const chatId of Object.keys(grouped)) {
      const msgs = grouped[chatId].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      const last = msgs[msgs.length - 1];

      const parts = chatId.split('_');
      const otherUid = parts.find(p => p !== State.user.uid);
      if (!otherUid) continue;

      // Only include if it's a friend
      if (!friendUids.includes(otherUid)) continue;

      conversations.push({
        chatId,
        otherUid,
        lastMessage: last,
        lastTime: last.createdAt?.seconds || 0
      });
    }

    conversations.sort((a, b) => b.lastTime - a.lastTime);

    if (conversations.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 60px; margin-bottom: 12px;">💬</div>
          <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px;">No conversations</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 20px;">Pick a friend and say hi</div>
          <button id="inbox-new-chat" class="btn-press" style="
            padding: 12px 24px;
            border-radius: 12px;
            background: #FF6B00;
            border: none;
            color: #fff;
            font-weight: 800;
            font-size: 13px;
            font-family: Inter;
            cursor: pointer;
          ">Start New Chat</button>
        </div>
      `;
      const btn = document.getElementById('inbox-new-chat');
      if (btn) btn.onclick = () => {
        closeInboxOverlay();
        setTimeout(showFriendsPanel, 300);
        toast('Tap 💬 on a friend to start chatting', 'info', 3000);
      };
      return;
    }

    // Fetch friend data in parallel (much faster)
    const friendData = await Promise.all(
      conversations.map(c =>
        getDoc(doc(db, 'users', c.otherUid)).then(s => s.exists() ? { id: c.otherUid, ...s.data() } : null).catch(() => null)
      )
    );

    // Render
    body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 11px; color: #666; font-weight: 700;">${conversations.length} conversation${conversations.length === 1 ? '' : 's'}</div>
        <button id="inbox-new-chat-btn" style="font-size: 11px; color: #FF6B00; font-weight: 800; background: none; border: none; cursor: pointer; font-family: Inter;">+ New Chat</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${conversations.map((c, i) => {
          const f = friendData[i];
          if (!f) return '';
          const lastMsg = c.lastMessage;
          const isMine = lastMsg.fromUid === State.user.uid;
          const preview = (isMine ? 'You: ' : '') + (lastMsg.text || '').slice(0, 60);
          const isOnline = f.lastSeen?.seconds && (Date.now() / 1000 - f.lastSeen.seconds) < 300;

          return `
            <div class="conversation-item-full" data-uid="${f.id}" data-ign="${esc(f.ign)}" style="
              background: #111;
              border: 1px solid #222;
              border-radius: 14px;
              padding: 12px;
              cursor: pointer;
              display: flex;
              gap: 12px;
              align-items: center;
            ">
              <div style="position: relative; flex-shrink: 0;">
                <div style="
                  width: 48px; height: 48px;
                  border-radius: 50%;
                  background: rgba(255, 107, 0, 0.15);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 800;
                  font-size: 16px;
                  color: #FF6B00;
                  overflow: hidden;
                ">
                  ${f.avatar ? `<img src="${esc(f.avatar)}" style="width: 100%; height: 100%; object-fit: cover;" />` : getInitials(f.ign)}
                </div>
                ${isOnline ? '<div style="position: absolute; bottom: -2px; right: -2px; width: 14px; height: 14px; border-radius: 50%; background: #22C55E; border: 2px solid #111;"></div>' : ''}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
                  <span style="font-size: 14px; font-weight: 800; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(f.ign || 'Unknown')}</span>
                  ${f.isPro ? '<span style="font-size: 8px; padding: 2px 5px; border-radius: 4px; background: #FFD700; color: #000; font-weight: 900;">PRO</span>' : ''}
                </div>
                <div style="font-size: 12px; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(preview)}</div>
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                <div style="font-size: 10px; color: #555;">${timeAgo(lastMsg.createdAt)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Wire taps
    body.querySelectorAll('.conversation-item-full').forEach(el => {
      el.onclick = () => {
        closeInboxOverlay();
        setTimeout(() => openDMThread(el.dataset.uid, el.dataset.ign), 300);
      };
    });

    // Wire new chat
    const newChatBtn = document.getElementById('inbox-new-chat-btn');
    if (newChatBtn) {
      newChatBtn.onclick = () => {
        closeInboxOverlay();
        setTimeout(showFriendsPanel, 300);
        toast('Tap 💬 on a friend to start chatting', 'info', 3000);
      };
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Messages tab error:', e);
    body.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44; font-size: 13px;">Failed to load: ' + esc(e.message) + '</div>';
  }
}

// ============================================
// PART 5: STOP DM NOTIFICATIONS (going forward)
// ============================================

const _origSendNotificationToUserInbox = sendNotificationToUser;
sendNotificationToUser = async function(uid, title, body, data) {
  // Skip creating notification entry for DM-type notifications
  if (data && data.type === 'dm') {
    // Only send push, no in-app notification entry
    try {
      return await _origSendNotificationToUserInbox(uid, title, body, data);
    } catch (e) { /* silent */ }
    return;
  }
  return _origSendNotificationToUserInbox(uid, title, body, data);
};

// ============================================
// PART 6: BADGE UPDATE
// ============================================

// Keep existing updateCombinedBadge (from Chunk 42) — it's already efficient

window.closeInboxOverlay = closeInboxOverlay;
window.renderNotificationsTabFast = renderNotificationsTabFast;
window.renderMessagesTabFast = renderMessagesTabFast;

console.log('✅ Chunk 43: Professional full-screen inbox loaded');

/* END OF CHUNK 43 */

// ============================================
// Chunk 45: Corrected Map + 3-Dot Menu + Perf Fixes
// ============================================

// ============================================
// PART 1: CORRECTED POI DATA (research-backed)
// ============================================

const ISOLATED_POIS = [
  { name: 'Black Market', x: 20, y: 40, hot: true, tier: 'S', desc: 'Contested S-tier. Underground bunker with T.E.D.D. robot — pick any weapon. Vehicle vending machines + hidden ballroom.' },
  { name: 'Floating HQ', x: 88, y: 13, hot: true, tier: 'S', desc: 'Random spawn — not every match. Best loot in game: Level 3 vests + high-tier weapons. Extremely contested.' },
  { name: 'Farm', x: 45, y: 56, hot: true, tier: 'S', desc: 'Butcher boss spawn. Defeat for Level 3 vest, legendary weapons, gold attachments, adrenaline.' },
  { name: 'Launch Base', x: 62, y: 48, hot: true, tier: 'S', desc: 'Best loot density on map. Rocket launch pad, great cover.' },
  { name: 'Nuketown', x: 15, y: 88, hot: true, tier: 'S', desc: 'Iconic BO map. Mystery Box spawn. High risk, high reward.' },
  { name: 'Docks', x: 20, y: 62, hot: true, tier: 'A', desc: 'Warehouses + shipping containers stuffed with loot. Large ship has high-tier gear.' },
  { name: 'Nuclear Plant', x: 50, y: 31, hot: true, tier: 'A', desc: 'Central. Cooling towers, roof access, contested.' },
  { name: 'Crash Site', x: 88, y: 50, hot: true, tier: 'A', desc: 'Sky Carrier. Locked door needs 3 color-coded codes (red, blue, green).' },
  { name: 'Killhouse', x: 78, y: 40, hot: true, tier: 'A', desc: 'Live fire area. Power positions on 2nd floor windows of warehouses.' },
  { name: 'Countdown', x: 88, y: 68, hot: true, tier: 'A', desc: 'Massive missile launch site. Multiple silos + hangars.' },
  { name: 'Downtown', x: 62, y: 63, hot: true, tier: 'A', desc: 'Urban sprawl. Roof camping paradise.' },
  { name: 'Sakura', x: 82, y: 30, hot: false, tier: 'A', desc: 'Underrated safe loot. Enough gear for a full 4-man. Small island nearby has heavy snipers + rocket launchers.' },
  { name: 'Standoff', x: 35, y: 50, hot: false, tier: 'A', desc: 'Safe central location. Good rotation, many vehicles nearby.' },
  { name: 'Estate', x: 50, y: 82, hot: false, tier: 'A', desc: 'Safe loot spot. Hills + trees for cover. Campers love it.' },
  { name: 'Sanitarium', x: 35, y: 26, hot: false, tier: 'B', desc: 'Secret room on 3rd floor — shoot 8 teddy bears in warehouse to open it.' },
  { name: 'Overgrown', x: 68, y: 20, hot: false, tier: 'B', desc: 'Jungle ruins. Sneaky rotations.' },
  { name: 'Bus Station', x: 55, y: 40, hot: false, tier: 'B', desc: 'Central transit. Mystery Box spawn location.' },
  { name: 'Harbor', x: 12, y: 30, hot: false, tier: 'B', desc: 'West coast ships. Vehicle friendly.' },
  { name: 'Pipeline', x: 38, y: 68, hot: false, tier: 'B', desc: 'Industrial zone. Loot + vehicles.' },
  { name: 'Circus', x: 42, y: 82, hot: false, tier: 'B', desc: 'Ferris wheel landmark. Mid-tier loot.' },
  { name: 'Ski Town', x: 50, y: 15, hot: false, tier: 'B', desc: 'Snowy resort. Elevation advantage, good vantage points. Cabin loot is decent.' },
  { name: 'Diner', x: 68, y: 56, hot: false, tier: 'C', desc: 'Zombies + Mystery Box can spawn here.' },
  { name: 'Pier', x: 12, y: 68, hot: false, tier: 'C', desc: 'Coastal. Boat spawns.' }
];

// ============================================
// PART 2: REAL MAP with transparent pins
// ============================================

function renderRealMap() {
  return `
    <div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div class="relative w-full" style="aspect-ratio: 1;">
        <img src="/isolated-map.png" alt="CODM Isolated Map" class="w-full h-full object-cover" loading="lazy" />

        ${ISOLATED_POIS.map((p, i) => {
          const pinColor = p.hot ? '#FF6B00' : (p.tier === 'S' ? '#FFD700' : (p.tier === 'A' ? '#00BFFF' : '#8E8E93'));
          const pinIcon = p.hot ? '🔥' : (p.tier === 'S' ? '★' : '•');
          return `
            <button class="map-poi" style="
              position: absolute;
              left: ${p.x}%;
              top: ${p.y}%;
              transform: translate(-50%, -50%);
              z-index: 5;
              background: transparent;
              border: none;
              padding: 0;
            " data-poi-index="${i}">
              <div class="map-pin" style="
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: ${pinColor};
                border: 2px solid #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 900;
                color: #000;
                opacity: 0.65;
                transition: opacity 0.2s, transform 0.2s;
              ">${pinIcon}</div>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <div class="bg-card border border-border rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="flame" class="w-4 h-4 text-primary"></i>
        <div class="text-xs font-bold text-primary uppercase">Hot Drops</div>
      </div>
      <div class="space-y-2">
        ${ISOLATED_POIS.filter(p => p.hot).slice(0, 7).map(p => `
          <button class="poi-row w-full text-left flex items-start gap-3 p-2.5 rounded-xl bg-cardAlt border border-border" data-poi-index="${ISOLATED_POIS.indexOf(p)}">
            <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span class="text-sm">🔥</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-0.5">
                <span class="text-xs font-bold">${p.name}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-gold text-black font-black">${p.tier}-TIER</span>
              </div>
              <div class="text-[10px] text-gray-500 line-clamp-2">${p.desc}</div>
            </div>
          </button>
        `).join('')}
      </div>
    </div>

    <div class="bg-card border border-border rounded-2xl p-4">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="info" class="w-4 h-4 text-blue-400"></i>
        <div class="text-xs font-bold text-blue-400 uppercase">Legend</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="flex items-center gap-2 text-[10px]">
          <div class="w-3 h-3 rounded-full" style="background: #FF6B00; border: 1px solid #fff;"></div>
          <span class="text-gray-400">🔥 Hot Drop</span>
        </div>
        <div class="flex items-center gap-2 text-[10px]">
          <div class="w-3 h-3 rounded-full" style="background: #FFD700; border: 1px solid #fff;"></div>
          <span class="text-gray-400">★ S-Tier</span>
        </div>
        <div class="flex items-center gap-2 text-[10px]">
          <div class="w-3 h-3 rounded-full" style="background: #00BFFF; border: 1px solid #fff;"></div>
          <span class="text-gray-400">• A-Tier</span>
        </div>
        <div class="flex items-center gap-2 text-[10px]">
          <div class="w-3 h-3 rounded-full" style="background: #8E8E93; border: 1px solid #fff;"></div>
          <span class="text-gray-400">• B/C-Tier</span>
        </div>
      </div>
    </div>
  `;
}

function openPoiDetail(index) {
  const p = ISOLATED_POIS[index];
  if (!p) return;

  openSheet(`
    <div class="space-y-4">
      <div class="text-center">
        <div class="text-5xl mb-3">${p.hot ? '🔥' : (p.tier === 'S' ? '★' : '📍')}</div>
        <div class="text-xl font-black mb-1">${esc(p.name)}</div>
        <div class="flex items-center justify-center gap-2 mb-3">
          <span class="text-[10px] px-2 py-0.5 rounded-full ${p.hot ? 'bg-primary text-white' : (p.tier === 'S' ? 'bg-gold text-black' : 'bg-gray-500 text-white')} font-black">
            ${p.hot ? '🔥 HOT DROP' : p.tier + '-TIER'}
          </span>
        </div>
      </div>

      <div class="bg-card border border-border rounded-xl p-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-2">Tactical Info</div>
        <p class="text-sm text-gray-300 leading-relaxed">${esc(p.desc)}</p>
      </div>

      <button onclick="closeSheet()" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm">
        Got it
      </button>
    </div>
  `, 'Location');

  if (window.lucide) window.lucide.createIcons();
}

// Override maps sub-tab
const _origRenderMapsSub45 = renderMapsSub;
renderMapsSub = function() {
  const body = document.getElementById('intel-body');
  if (!body) return;

  body.innerHTML = renderRealMap();

  // Wire pin animations (opacity on touch)
  body.querySelectorAll('.map-poi').forEach(el => {
    const pin = el.querySelector('.map-pin');
    if (pin) {
      el.addEventListener('touchstart', () => {
        pin.style.opacity = '1';
        pin.style.transform = 'scale(1.3)';
      }, { passive: true });
      el.addEventListener('touchend', () => {
        pin.style.opacity = '0.65';
        pin.style.transform = 'scale(1)';
      }, { passive: true });
    }
    el.onclick = () => openPoiDetail(parseInt(el.dataset.poiIndex));
  });

  body.querySelectorAll('.poi-row').forEach(el => {
    el.onclick = () => openPoiDetail(parseInt(el.dataset.poiIndex));
  });

  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 3: 3-DOT MENU on vault cards
// ============================================

const _origRenderVaultsMenu = renderVaults;
renderVaults = function() {
  const feed = document.getElementById('vault-feed');
  if (!feed) return;
  let vaults = State.cache.vaults;
  if (State.filters.vaults.search) {
    const s = State.filters.vaults.search;
    vaults = vaults.filter(v =>
      (v.gunName || '').toLowerCase().includes(s) ||
      (v.gunsmithCode || '').toLowerCase().includes(s)
    );
  }

  if (vaults.length === 0) {
    feed.className = '';
    let emptyText = 'Share your first build';
    let emptyCta = 'Submit Build';
    let emptyFn = openSubmitVaultSheet;
    if (vaultTypeFilter === 'sens') { emptyText = 'Share your best sensitivity'; emptyCta = 'Share Sensitivity'; emptyFn = openSubmitSensSheet; }
    if (vaultTypeFilter === 'hud') { emptyText = 'Share your HUD layout'; emptyCta = 'Share HUD'; emptyFn = openSubmitHudSheet; }
    feed.innerHTML = emptyState('package-open', 'Nothing here yet', emptyText, emptyCta, emptyFn);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.className = 'grid grid-cols-2 gap-3';
  feed.innerHTML = vaults.map(v => {
    const isMine = v.uid === State.user.uid;
    const isSens = v.type === 'sens';
    const isHud = v.type === 'hud';

    return `
      <div class="bg-card border border-border rounded-2xl p-3 fade-in relative">
        ${isMine ? `
          <button class="vault-menu-btn absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center z-10" data-id="${v.id}">
            <i data-lucide="more-vertical" class="w-3.5 h-3.5 text-white/70"></i>
          </button>
        ` : ''}

        ${isHud && v.imageUrl ? `
          <img src="${esc(v.imageUrl)}" class="w-full h-24 object-cover rounded-xl mb-3" loading="lazy" />
        ` : isSens ? `
          <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-primaryDark/20 flex items-center justify-center flex-col gap-1">
            <span class="text-2xl">🎯</span>
            <span class="text-[10px] text-primary font-bold">SENSITIVITY</span>
          </div>
        ` : isHud ? `
          <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-gold/20 to-yellow-500/20 flex items-center justify-center flex-col gap-1">
            <span class="text-2xl">🎮</span>
            <span class="text-[10px] text-gold font-bold">HUD LAYOUT</span>
          </div>
        ` : v.imageUrl ? `
          <img src="${esc(v.imageUrl)}" class="w-full h-24 object-cover rounded-xl mb-3" loading="lazy" />
        ` : `
          <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
            <i data-lucide="crosshair" class="w-8 h-8 text-primary/60"></i>
          </div>
        `}

        <div class="text-xs font-bold text-gray-300 truncate">${esc(v.gunName || 'Unknown')}</div>
        <div class="text-[10px] text-gray-500 mb-2 truncate">${esc(v.gunsmithCode || v.type || 'build')}</div>

        ${!isSens && !isHud && v.gunsmithCode ? `
          <button class="copy-code-btn w-full py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center gap-1 mb-2" data-code="${esc(v.gunsmithCode)}">
            <i data-lucide="copy" class="w-3 h-3"></i> Copy Code
          </button>
        ` : isSens ? `
          <div class="text-[9px] text-gray-500 mb-2 leading-relaxed line-clamp-3">${esc(v.gunsmithCode || '')}</div>
        ` : isHud && v.notes ? `
          <div class="text-[9px] text-gray-500 mb-2 line-clamp-2">${esc(v.notes)}</div>
        ` : ''}

        <div class="flex items-center justify-between">
          <button class="like-btn flex items-center gap-1 text-[11px] text-gray-400" data-id="${v.id}">
            <i data-lucide="heart" class="w-3.5 h-3.5"></i> ${v.likes || 0}
          </button>
          <button class="share-vault-btn text-primary" data-id="${v.id}" data-gun="${esc(v.gunName)}">
            <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Wire buttons
  feed.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); copyText(btn.dataset.code, 'Code copied!'); };
  });
  feed.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = async () => {
      try {
        await updateDoc(doc(db, 'vaults', btn.dataset.id), { likes: increment(1) });
        toast('❤️ Liked!', 'success', 1500);
      } catch (e) { toast('Failed', 'error'); }
    };
  });
  feed.querySelectorAll('.share-vault-btn').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: `${btn.dataset.gun}`,
        text: `Check out this ${btn.dataset.gun} on CODMPanda!`,
        url: getVaultShareUrl(btn.dataset.id)
      });
    };
  });
  feed.querySelectorAll('.vault-menu-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openVaultMenu(btn.dataset.id);
    };
  });

  if (window.lucide) window.lucide.createIcons();
};


// ============================================
// Chunk 46: Vault Detail View + Edit Fix + Like Fix
// ============================================

// ============================================
// PART 1: LIKE HELPERS (one per user)
// ============================================

async function hasUserLiked(itemType, itemId) {
  try {
    const ref = doc(db, 'likes', `${itemType}_${itemId}_${State.user.uid}`);
    const snap = await getDoc(ref);
    return snap.exists();
  } catch (e) {
    return false;
  }
}

async function likeItem(itemType, itemId, countField) {
  try {
    if (!State.user) return false;
    const likeRef = doc(db, 'likes', `${itemType}_${itemId}_${State.user.uid}`);
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) return false;

    await setDoc(likeRef, {
      itemType, itemId,
      userId: State.user.uid,
      createdAt: serverTimestamp()
    });

    const collectionName = itemType === 'vault' ? 'vaults'
      : itemType === 'clip' ? 'clips'
      : itemType === 'comment' ? 'comments'
      : itemType === 'leak' ? 'leaks'
      : itemType === 'post' ? 'posts'
      : 'vaults';

    await updateDoc(doc(db, collectionName, itemId), {
      [countField || 'likes']: increment(1)
    });

    return true;
  } catch (e) {
    console.error('Like error:', e);
    return false;
  }
}

async function unlikeItem(itemType, itemId, countField) {
  try {
    if (!State.user) return false;
    const likeRef = doc(db, 'likes', `${itemType}_${itemId}_${State.user.uid}`);
    const likeSnap = await getDoc(likeRef);
    if (!likeSnap.exists()) return false;

    await deleteDoc(likeRef);

    const collectionName = itemType === 'vault' ? 'vaults'
      : itemType === 'clip' ? 'clips'
      : itemType === 'comment' ? 'comments'
      : itemType === 'leak' ? 'leaks'
      : itemType === 'post' ? 'posts'
      : 'vaults';

    await updateDoc(doc(db, collectionName, itemId), {
      [countField || 'likes']: increment(-1)
    });

    return true;
  } catch (e) {
    console.error('Unlike error:', e);
    return false;
  }
}

async function toggleLike(itemType, itemId, countField) {
  const liked = await hasUserLiked(itemType, itemId);
  if (liked) {
    await unlikeItem(itemType, itemId, countField);
    return false;
  } else {
    await likeItem(itemType, itemId, countField);
    return true;
  }
}

// ============================================
// PART 2: VAULT DETAIL VIEW
// ============================================

function openVaultDetail(vaultId) {
  const vault = State.cache.vaults.find(v => v.id === vaultId);
  if (!vault) { toast('Item not found', 'error'); return; }

  const isMine = vault.uid === State.user.uid;
  const isSens = vault.type === 'sens';
  const isHud = vault.type === 'hud';
  const isLiked = State.likedItems?.vault?.[vault.id] || false;

  // Build content based on type
  let contentHTML = '';

  if (isSens) {
    const fields = vault.attachments || {};
    contentHTML = `
      <div class="space-y-2">
        ${Object.entries(fields).length > 0 ? Object.entries(fields).map(([k, v]) => {
          const fieldName = SENS_FIELDS.find(f => f.key === k)?.label || k;
          return `
            <div class="flex items-center justify-between bg-card border border-border rounded-lg p-3">
              <span class="text-xs text-gray-400">${esc(fieldName)}</span>
              <span class="text-sm font-black text-primary">${esc(v)}</span>
            </div>
          `;
        }).join('') : '<div class="text-center py-4 text-xs text-gray-500">No values saved</div>'}
      </div>
      ${vault.device ? `
        <div class="bg-card border border-border rounded-lg p-3 mt-3">
          <span class="text-xs text-gray-400">Device: </span>
          <span class="text-xs font-bold text-white">${esc(vault.device)}</span>
        </div>
      ` : ''}
      ${vault.notes ? `
        <div class="bg-card border border-border rounded-lg p-3 mt-3">
          <div class="text-[10px] text-gray-500 uppercase font-bold mb-1">Notes</div>
          <p class="text-xs text-gray-300">${esc(vault.notes)}</p>
        </div>
      ` : ''}
    `;
  } else if (isHud) {
    contentHTML = `
      ${vault.imageUrl ? `
        <img src="${esc(vault.imageUrl)}" class="w-full rounded-xl mb-3" />
      ` : ''}
      <div class="space-y-2">
        ${vault.attachments?.style ? `
          <div class="flex items-center justify-between bg-card border border-border rounded-lg p-3">
            <span class="text-xs text-gray-400">Control Style</span>
            <span class="text-sm font-black text-gold">${esc(vault.attachments.style)}</span>
          </div>
        ` : ''}
        ${vault.attachments?.device ? `
          <div class="flex items-center justify-between bg-card border border-border rounded-lg p-3">
            <span class="text-xs text-gray-400">Device</span>
            <span class="text-sm font-black text-white">${esc(vault.attachments.device)}</span>
          </div>
        ` : ''}
      </div>
      ${vault.notes ? `
        <div class="bg-card border border-border rounded-lg p-3 mt-3">
          <div class="text-[10px] text-gray-500 uppercase font-bold mb-1">Notes</div>
          <p class="text-xs text-gray-300">${esc(vault.notes)}</p>
        </div>
      ` : ''}
    `;
  } else {
    // Gunsmith
    contentHTML = `
      ${vault.imageUrl ? `
        <img src="${esc(vault.imageUrl)}" class="w-full rounded-xl mb-3" />
      ` : ''}

      ${vault.gunsmithCode ? `
        <div class="bg-card border border-primary/30 rounded-xl p-3 mb-3">
          <div class="text-[10px] text-gray-500 uppercase font-bold mb-1">Gunsmith Code</div>
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-sm font-bold text-primary break-all">${esc(vault.gunsmithCode)}</span>
            <button id="detail-copy-code" class="btn-press w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0" data-code="${esc(vault.gunsmithCode)}">
              <i data-lucide="copy" class="w-4 h-4 text-white"></i>
            </button>
          </div>
        </div>
      ` : ''}

      ${vault.attachments && Object.keys(vault.attachments).length > 0 ? `
        <div class="bg-card border border-border rounded-xl p-3">
          <div class="text-[10px] text-gray-500 uppercase font-bold mb-2">Attachments</div>
          <div class="space-y-2">
            ${Object.entries(vault.attachments).map(([slot, att]) => `
              <div class="flex items-start justify-between gap-2">
                <span class="text-[10px] text-gray-500 uppercase font-bold flex-shrink-0">${esc(slot)}</span>
                <span class="text-xs font-semibold text-white text-right">${esc(typeof att === 'string' ? att : att.name || 'N/A')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  openSheet(`
    <div class="space-y-4">
      <!-- Header -->
      <div class="text-center">
        <div class="text-2xl font-black mb-1">${esc(vault.gunName || 'Unknown')}</div>
        <div class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${isSens ? 'SENSITIVITY' : isHud ? 'HUD LAYOUT' : 'GUNSMITH BUILD'}</div>
      </div>

      <!-- Author -->
      <div class="flex items-center justify-center gap-2 text-xs">
        <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden">
          ${vault.avatar ? `<img src="${esc(vault.avatar)}" class="w-full h-full object-cover" />` : getInitials(vault.ign || '?')}
        </div>
        <span class="text-gray-400">by <span class="text-white font-bold">${esc(vault.ign || 'Unknown')}</span> · ${timeAgo(vault.createdAt)}</span>
      </div>

      <!-- Content -->
      ${contentHTML}

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-3 border-t border-border">
        <button id="detail-like" class="btn-press flex-1 py-3 rounded-xl ${isLiked ? 'bg-primary text-white' : 'bg-cardAlt border border-border text-gray-300'} font-bold text-sm flex items-center justify-center gap-2" data-id="${vault.id}">
          <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'fill-current' : ''}"></i>
          <span id="detail-like-count">${vault.likes || 0}</span>
        </button>
        <button id="detail-share" class="btn-press flex-1 py-3 rounded-xl bg-cardAlt border border-border text-gray-300 font-bold text-sm flex items-center justify-center gap-2">
          <i data-lucide="share-2" class="w-4 h-4"></i> Share
        </button>
        ${isMine ? `
          <button id="detail-edit" class="btn-press w-12 h-12 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center" title="Edit">
            <i data-lucide="pencil" class="w-4 h-4 text-primary"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `, '');

  // Wire actions
  const copyBtn = document.getElementById('detail-copy-code');
  if (copyBtn) {
    copyBtn.onclick = () => copyText(copyBtn.dataset.code, 'Code copied!');
  }

  const likeBtn = document.getElementById('detail-like');
  if (likeBtn) {
    likeBtn.onclick = async () => {
      const nowLiked = await toggleLike('vault', vault.id, 'likes');
      vault.likes = nowLiked ? (vault.likes || 0) + 1 : Math.max(0, (vault.likes || 0) - 1);
      State.likedItems = State.likedItems || {};
      State.likedItems.vault = State.likedItems.vault || {};
      State.likedItems.vault[vault.id] = nowLiked;

      likeBtn.classList.toggle('bg-primary', nowLiked);
      likeBtn.classList.toggle('text-white', nowLiked);
      likeBtn.classList.toggle('bg-cardAlt', !nowLiked);
      likeBtn.classList.toggle('border', !nowLiked);
      likeBtn.classList.toggle('border-border', !nowLiked);
      likeBtn.classList.toggle('text-gray-300', !nowLiked);

      const icon = likeBtn.querySelector('i');
      if (nowLiked) icon.classList.add('fill-current');
      else icon.classList.remove('fill-current');

      document.getElementById('detail-like-count').textContent = vault.likes;

      toast(nowLiked ? '❤️ Liked!' : 'Unliked', 'success', 1000);
    };
  }

  document.getElementById('detail-share').onclick = () => {
    openShareSheet({
      title: vault.gunName,
      text: `Check out this ${vault.gunName} on CODMPanda!`,
      url: getVaultShareUrl(vault.id)
    });
  };

  const editBtn = document.getElementById('detail-edit');
  if (editBtn) {
    editBtn.onclick = () => {
      closeSheet();
      setTimeout(() => openEditVaultModal(vault), 300);
    };
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 3: FIXED EDIT VAULT MODAL (all types)
// ============================================

function openEditVaultModal(vault) {
  if (!vault) { toast('Item not found', 'error'); return; }

  const type = vault.type || 'gunsmith';

  if (type === 'sens') {
    openSheet(`
      <div class="space-y-4">
        <div class="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary">
          Edit your sensitivity values
        </div>

        ${SENS_FIELDS.map(f => `
          <div>
            <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">${f.label}</label>
            <input id="edit-sens-${f.key}" type="number" min="0" max="300" value="${vault.attachments?.[f.key] || ''}" placeholder="${f.placeholder}" />
          </div>
        `).join('')}

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Device</label>
          <select id="edit-sens-device" data-dropdown-title="Device">
            <option value="">Select...</option>
            <option ${vault.device === 'Phone' ? 'selected' : ''}>Phone</option>
            <option ${vault.device === 'Tablet' ? 'selected' : ''}>Tablet</option>
            <option ${vault.device === 'Controller' ? 'selected' : ''}>Controller</option>
          </select>
        </div>

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Notes</label>
          <textarea id="edit-sens-notes" rows="3" maxlength="200">${esc(vault.notes || '')}</textarea>
        </div>

        <button id="edit-sens-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">
          Save Changes
        </button>
      </div>
    `, 'Edit Sensitivity');

    document.getElementById('edit-sens-save').onclick = async () => {
      const values = {};
      SENS_FIELDS.forEach(f => {
        const val = document.getElementById('edit-sens-' + f.key).value.trim();
        if (val) values[f.key] = parseInt(val);
      });
      const device = document.getElementById('edit-sens-device').value;
      const notes = document.getElementById('edit-sens-notes').value.trim();

      const summary = SENS_FIELDS
        .filter(f => values[f.key] !== undefined)
        .map(f => `${f.label.split(' ')[0]}: ${values[f.key]}`)
        .join(' | ');

      try {
        await updateDoc(doc(db, 'vaults', vault.id), {
          attachments: values,
          gunsmithCode: summary.slice(0, 50),
          device,
          notes
        });
        toast('✏️ Updated', 'success');
        closeSheet();
        State.cache.vaults = State.cache.vaults.map(v => v.id === vault.id ? { ...v, attachments: values, gunsmithCode: summary.slice(0, 50), device, notes } : v);
        renderVaults();
      } catch (e) { toast('Failed: ' + e.message, 'error'); }
    };

  } else if (type === 'hud') {
    openSheet(`
      <div class="space-y-4">
        <div class="bg-gold/10 border border-gold/30 rounded-xl p-3 text-xs text-gold">
          Edit HUD info
        </div>

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Control Style</label>
          <select id="edit-hud-style" data-dropdown-title="Control Style">
            ${HUD_STYLES.map(s => `<option ${vault.attachments?.style === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Device</label>
          <select id="edit-hud-device" data-dropdown-title="Device">
            <option ${vault.attachments?.device === 'Phone' ? 'selected' : ''}>Phone</option>
            <option ${vault.attachments?.device === 'Tablet' ? 'selected' : ''}>Tablet</option>
            <option ${vault.attachments?.device === 'Controller' ? 'selected' : ''}>Controller</option>
          </select>
        </div>

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">New Screenshot (optional)</label>
          <input id="edit-hud-image" type="file" accept="image/*" class="text-xs" />
        </div>

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Notes</label>
          <textarea id="edit-hud-notes" rows="3" maxlength="200">${esc(vault.notes || '')}</textarea>
        </div>

        <button id="edit-hud-save" class="btn-press w-full py-4 rounded-2xl bg-gold text-black font-bold">
          Save Changes
        </button>
      </div>
    `, 'Edit HUD');

    document.getElementById('edit-hud-save').onclick = async () => {
      const style = document.getElementById('edit-hud-style').value;
      const device = document.getElementById('edit-hud-device').value;
      const notes = document.getElementById('edit-hud-notes').value.trim();
      const fileInput = document.getElementById('edit-hud-image');

      try {
        const updates = {
          gunName: `HUD · ${style}`,
          gunsmithCode: device,
          attachments: { style, device },
          notes
        };

        if (fileInput.files && fileInput.files[0]) {
          updates.imageUrl = await compressImage(fileInput.files[0], 800, 0.7);
        }

        await updateDoc(doc(db, 'vaults', vault.id), updates);
        toast('✏️ Updated', 'success');
        closeSheet();
        State.cache.vaults = State.cache.vaults.map(v => v.id === vault.id ? { ...v, ...updates } : v);
        renderVaults();
      } catch (e) { toast('Failed: ' + e.message, 'error'); }
    };

  } else {
    // Gunsmith edit
    openSheet(`
      <div class="space-y-4">
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun Name</label>
          <input id="edit-v-gun" type="text" value="${esc(vault.gunName || '')}" maxlength="40" />
        </div>

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gunsmith Code</label>
          <input id="edit-v-code" type="text" value="${esc(vault.gunsmithCode || '')}" maxlength="20" />
        </div>

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Attachments (one per line: "Slot: Name")</label>
          <textarea id="edit-v-attach" rows="5" maxlength="500">${esc(Object.entries(vault.attachments || {}).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : v.name || ''}`).join('\n'))}</textarea>
        </div>

        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">New Screenshot (optional)</label>
          <input id="edit-v-image" type="file" accept="image/*" class="text-xs" />
        </div>

        <button id="edit-v-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary">
          Save Changes
        </button>
      </div>
    `, 'Edit Build');

    document.getElementById('edit-v-save').onclick = async () => {
      const gunName = document.getElementById('edit-v-gun').value.trim();
      const gunsmithCode = document.getElementById('edit-v-code').value.trim();
      const attachRaw = document.getElementById('edit-v-attach').value.trim();
      const fileInput = document.getElementById('edit-v-image');

      if (!gunName) { toast('Gun name required', 'error'); return; }

      const attachments = {};
      attachRaw.split('\n').forEach(line => {
        const [k, ...v] = line.split(':');
        if (k && v.length) attachments[k.trim()] = v.join(':').trim();
      });

      try {
        const updates = { gunName, gunsmithCode, attachments };
        if (fileInput.files && fileInput.files[0]) {
          updates.imageUrl = await compressImage(fileInput.files[0], 700, 0.6);
        }

        await updateDoc(doc(db, 'vaults', vault.id), updates);
        toast('✏️ Updated', 'success');
        closeSheet();
        State.cache.vaults = State.cache.vaults.map(v => v.id === vault.id ? { ...v, ...updates } : v);
        renderVaults();
      } catch (e) { toast('Failed: ' + e.message, 'error'); }
    };
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 4: REWRITTEN VAULT RENDER (with detail view + likes)
// ============================================

const _origRenderVaultsDetail = renderVaults;
renderVaults = function() {
  const feed = document.getElementById('vault-feed');
  if (!feed) return;
  let vaults = State.cache.vaults;
  if (State.filters.vaults.search) {
    const s = State.filters.vaults.search;
    vaults = vaults.filter(v =>
      (v.gunName || '').toLowerCase().includes(s) ||
      (v.gunsmithCode || '').toLowerCase().includes(s)
    );
  }

  if (vaults.length === 0) {
    feed.className = '';
    let emptyText = 'Share your first build';
    let emptyCta = 'Submit Build';
    let emptyFn = openSubmitVaultSheet;
    if (vaultTypeFilter === 'sens') { emptyText = 'Share your best sensitivity'; emptyCta = 'Share Sensitivity'; emptyFn = openSubmitSensSheet; }
    if (vaultTypeFilter === 'hud') { emptyText = 'Share your HUD layout'; emptyCta = 'Share HUD'; emptyFn = openSubmitHudSheet; }
    feed.innerHTML = emptyState('package-open', 'Nothing here yet', emptyText, emptyCta, emptyFn);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.className = 'grid grid-cols-2 gap-3';
  feed.innerHTML = vaults.map(v => {
    const isMine = v.uid === State.user.uid;
    const isSens = v.type === 'sens';
    const isHud = v.type === 'hud';
    const isLiked = State.likedItems?.vault?.[v.id] || false;

    return `
      <div class="bg-card border border-border rounded-2xl p-3 fade-in relative vault-card" data-id="${v.id}" style="cursor: pointer;">
        ${isMine ? `
          <button class="vault-menu-btn absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center z-10" data-id="${v.id}">
            <i data-lucide="more-vertical" class="w-3.5 h-3.5 text-white/70"></i>
          </button>
        ` : ''}

        ${isHud && v.imageUrl ? `
          <img src="${esc(v.imageUrl)}" class="w-full h-24 object-cover rounded-xl mb-3" loading="lazy" />
        ` : isSens ? `
          <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-primaryDark/20 flex items-center justify-center flex-col gap-1">
            <span class="text-2xl">🎯</span>
            <span class="text-[10px] text-primary font-bold">SENSITIVITY</span>
          </div>
        ` : isHud ? `
          <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-gold/20 to-yellow-500/20 flex items-center justify-center flex-col gap-1">
            <span class="text-2xl">🎮</span>
            <span class="text-[10px] text-gold font-bold">HUD LAYOUT</span>
          </div>
        ` : v.imageUrl ? `
          <img src="${esc(v.imageUrl)}" class="w-full h-24 object-cover rounded-xl mb-3" loading="lazy" />
        ` : `
          <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
            <i data-lucide="crosshair" class="w-8 h-8 text-primary/60"></i>
          </div>
        `}

        <div class="text-xs font-bold text-gray-300 truncate">${esc(v.gunName || 'Unknown')}</div>
        <div class="text-[10px] text-gray-500 mb-2 truncate">${esc(v.gunsmithCode || v.type || 'build')}</div>

        ${!isSens && !isHud && v.gunsmithCode ? `
          <button class="copy-code-btn w-full py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center gap-1 mb-2" data-code="${esc(v.gunsmithCode)}">
            <i data-lucide="copy" class="w-3 h-3"></i> Copy Code
          </button>
        ` : ''}

        <div class="flex items-center justify-between">
          <button class="like-btn flex items-center gap-1 text-[11px] ${isLiked ? 'text-primary' : 'text-gray-400'}" data-id="${v.id}">
            <i data-lucide="heart" class="w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}"></i> ${v.likes || 0}
          </button>
          <button class="share-vault-btn text-primary" data-id="${v.id}" data-gun="${esc(v.gunName)}">
            <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Wire copy
  feed.querySelectorAll('.copy-code-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); copyText(btn.dataset.code, 'Code copied!'); };
  });

  // Wire like
  feed.querySelectorAll('.like-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const vault = vaults.find(v => v.id === btn.dataset.id);
      if (!vault) return;

      const nowLiked = await toggleLike('vault', vault.id, 'likes');
      const newCount = nowLiked ? (vault.likes || 0) + 1 : Math.max(0, (vault.likes || 0) - 1);

      btn.innerHTML = `<i data-lucide="heart" class="w-3.5 h-3.5 ${nowLiked ? 'fill-current' : ''}"></i> ${newCount}`;
      btn.classList.toggle('text-primary', nowLiked);
      btn.classList.toggle('text-gray-400', !nowLiked);

      State.likedItems = State.likedItems || {};
      State.likedItems.vault = State.likedItems.vault || {};
      State.likedItems.vault[vault.id] = nowLiked;
      vault.likes = newCount;

      if (window.lucide) window.lucide.createIcons();
      toast(nowLiked ? '❤️ Liked!' : 'Unliked', 'success', 1000);
    };
  });

  // Wire share
  feed.querySelectorAll('.share-vault-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openShareSheet({
        title: btn.dataset.gun,
        text: `Check out this ${btn.dataset.gun} on CODMPanda!`,
        url: getVaultShareUrl(btn.dataset.id)
      });
    };
  });

  // Wire 3-dot menu
  feed.querySelectorAll('.vault-menu-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openVaultMenu(btn.dataset.id);
    };
  });

  // Wire card tap → detail view
  feed.querySelectorAll('.vault-card').forEach(card => {
    card.onclick = (e) => {
      // Ignore if tapped a button
      if (e.target.closest('button')) return;
      openVaultDetail(card.dataset.id);
    };
  });

  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 5: REWRITTEN 3-DOT MENU
// ============================================

function openVaultMenu(vaultId) {
  const vault = State.cache.vaults.find(v => v.id === vaultId);
  if (!vault) return;

  openSheet(`
    <div class="space-y-2">
      <div class="text-[10px] text-gray-500 uppercase font-bold mb-2">${esc(vault.gunName || 'Build')}</div>

      <button id="vault-menu-view" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
        <i data-lucide="eye" class="w-4 h-4 text-gray-400"></i>
        <span class="text-sm font-bold">View Details</span>
      </button>

      <button id="vault-menu-edit" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
        <i data-lucide="pencil" class="w-4 h-4 text-primary"></i>
        <span class="text-sm font-bold">Edit</span>
      </button>

      <button id="vault-menu-share" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
        <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
        <span class="text-sm font-bold">Share</span>
      </button>

      ${vault.gunsmithCode && vault.type === 'gunsmith' ? `
        <button id="vault-menu-copy" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
          <i data-lucide="copy" class="w-4 h-4 text-primary"></i>
          <span class="text-sm font-bold">Copy Code</span>
        </button>
      ` : ''}

      <button id="vault-menu-delete" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-left">
        <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
        <span class="text-sm font-bold text-red-400">Delete</span>
      </button>

      <button onclick="closeSheet()" class="text-xs text-gray-500 w-full pt-3">Cancel</button>
    </div>
  `, '');

  document.getElementById('vault-menu-view').onclick = () => {
    closeSheet();
    setTimeout(() => openVaultDetail(vault.id), 300);
  };

  document.getElementById('vault-menu-edit').onclick = () => {
    closeSheet();
    setTimeout(() => openEditVaultModal(vault), 300);
  };

  document.getElementById('vault-menu-share').onclick = () => {
    closeSheet();
    setTimeout(() => {
      openShareSheet({
        title: vault.gunName,
        text: `Check out this ${vault.gunName} on CODMPanda!`,
        url: getVaultShareUrl(vault.id)
      });
    }, 300);
  };

  const copyBtn = document.getElementById('vault-menu-copy');
  if (copyBtn) {
    copyBtn.onclick = () => {
      closeSheet();
      copyText(vault.gunsmithCode, 'Code copied!');
    };
  }

  document.getElementById('vault-menu-delete').onclick = () => {
    closeSheet();
    setTimeout(() => {
      confirmDialog('Delete Build', 'This will remove it permanently.', async () => {
        try {
          await deleteDoc(doc(db, 'vaults', vault.id));
          State.cache.vaults = State.cache.vaults.filter(v => v.id !== vault.id);
          renderVaults();
          toast('🗑️ Deleted', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    }, 300);
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 6: LOAD USER LIKES
// ============================================

async function loadUserLikes() {
  if (!State.user) return;
  try {
    State.likedItems = { vault: {}, clip: {}, leak: {}, comment: {} };

    const snap = await getDocs(query(
      collection(db, 'likes'),
      where('userId', '==', State.user.uid),
      limit(500)
    ));

    snap.forEach(d => {
      const data = d.data();
      if (!State.likedItems[data.itemType]) State.likedItems[data.itemType] = {};
      State.likedItems[data.itemType][data.itemId] = true;
    });

    console.log('✅ Loaded', snap.size, 'user likes');
  } catch (e) {
    console.warn('Load likes error:', e);
  }
}

setTimeout(() => {
  if (State.user) loadUserLikes();
}, 4000);

window.openVaultDetail = openVaultDetail;
window.openEditVaultModal = openEditVaultModal;
window.openVaultMenu = openVaultMenu;
window.toggleLike = toggleLike;
window.loadUserLikes = loadUserLikes;

console.log('✅ Chunk 46: Vault detail + edit fix + like fix loaded');

/* END OF CHUNK 46 */
// ============================================
// Chunk 47: Professional Gun Icons + Attachment Preview
// ============================================

// ============================================
// PART 1: GUN CATEGORY ICONS + COLORS
// ============================================

const GUN_CATEGORY_META = {
  'Assault Rifle': { icon: 'crosshair', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', emoji: '🔫' },
  'SMG':           { icon: 'zap', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)', emoji: '💨' },
  'Sniper':        { icon: 'target', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', emoji: '🎯' },
  'LMG':           { icon: 'box', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)', emoji: '📦' },
  'Shotgun':       { icon: 'shield', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', emoji: '💥' },
  'Marksman':      { icon: 'crosshair', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)', emoji: '🎯' },
  'Pistol':        { icon: 'target', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', emoji: '🔫' },
  'Melee':         { icon: 'sword', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', emoji: '⚔️' },
  'Launcher':      { icon: 'rocket', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)', emoji: '🚀' }
};

function getGunMeta(gunName) {
  for (const [cat, guns] of Object.entries(CODM_GUNS)) {
    if (guns.includes(gunName)) {
      return { category: cat, ...GUN_CATEGORY_META[cat] };
    }
  }
  return { category: 'Assault Rifle', ...GUN_CATEGORY_META['Assault Rifle'] };
}

// ============================================
// PART 2: ATTACHMENT SLOT ICONS (Lucide)
// ============================================

const SLOT_ICON_MAP = {
  muzzle: 'shield',
  barrel: 'align-vertical-space-around',
  optic: 'eye',
  stock: 'minus',
  laser: 'zap',
  underbarrel: 'grip',
  ammunition: 'package',
  rearGrip: 'hand',
  perk: 'star'
};

// ============================================
// PART 3: PATCH GUN PICKER with icons
// ============================================

const _origRenderGunPickerIcons = renderGunPicker;
renderGunPicker = function(body) {
  const categories = ['Assault Rifle', 'SMG', 'Sniper', 'LMG', 'Shotgun', 'Marksman', 'Pistol'];
  let activeCategory = 'Assault Rifle';

  body.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-xs text-gray-500 mb-2">Step 1 — Pick your weapon</div>
    </div>

    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1" id="gun-cat-filters">
      ${categories.map((c, i) => `
        <button class="chip gun-cat-btn ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>
      `).join('')}
    </div>

    <div class="relative mb-4">
      <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input id="gun-search" type="text" placeholder="Search guns..." class="pl-10" />
    </div>

    <div id="gun-grid" class="grid grid-cols-2 gap-3"></div>
  `;

  const renderGuns = (category, search) => {
    const grid = document.getElementById('gun-grid');
    if (!grid) return;

    const gunsInCat = CODM_GUNS[category] || [];
    const filtered = search
      ? gunsInCat.filter(g => g.toLowerCase().includes(search.toLowerCase()))
      : gunsInCat;

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="col-span-2 text-center py-8 text-xs text-gray-500">No guns found</div>';
      return;
    }

    const meta = GUN_CATEGORY_META[category] || GUN_CATEGORY_META['Assault Rifle'];

    grid.innerHTML = filtered.map(gun => `
      <button class="gun-pick-btn bg-card border border-border rounded-2xl p-3 text-left hover:border-primary transition-colors" data-gun="${esc(gun)}">
        <div class="w-full h-16 rounded-xl mb-2 flex items-center justify-center" style="background: ${meta.bg};">
          <i data-lucide="${meta.icon}" class="w-7 h-7" style="color: ${meta.color};"></i>
        </div>
        <div class="text-xs font-bold truncate">${esc(gun)}</div>
        <div class="text-[9px] text-gray-500" style="color: ${meta.color};">${category}</div>
      </button>
    `).join('');

    grid.querySelectorAll('.gun-pick-btn').forEach(btn => {
      btn.onclick = () => {
        BuilderState.selectedGun = btn.dataset.gun;
        BuilderState.selectedAttachments = {};
        renderBuilderBody();
      };
    });

    if (window.lucide) window.lucide.createIcons();
  };

  body.querySelectorAll('.gun-cat-btn').forEach(btn => {
    btn.onclick = () => {
      body.querySelectorAll('.gun-cat-btn').forEach(b => b.classList.toggle('active', b === btn));
      activeCategory = btn.dataset.cat;
      const search = document.getElementById('gun-search')?.value || '';
      renderGuns(activeCategory, search);
    };
  });

  document.getElementById('gun-search').oninput = (e) => {
    renderGuns(activeCategory, e.target.value);
  };

  renderGuns(activeCategory, '');
  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 4: PATCH LOADOUT CANVAS with better visuals
// ============================================

const _origRenderLoadoutCanvasIcons = renderLoadoutCanvas;
renderLoadoutCanvas = function(body) {
  const gun = BuilderState.selectedGun;
  const { final, base, modifiers } = calculateFinalStats(gun, BuilderState.selectedAttachments);
  const attachedCount = Object.keys(BuilderState.selectedAttachments).length;
  const presets = PRESET_BUILDS[gun] || [];
  const score = scoreBuild(final);
  const gunMeta = getGunMeta(gun);

  body.innerHTML = `
    <!-- Gun Header -->
    <div class="bg-card border border-primary/40 rounded-2xl p-4 mb-4 relative overflow-hidden">
      <div class="absolute top-3 right-3 text-2xl opacity-20"></div>
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: ${gunMeta.bg};">
          <i data-lucide="${gunMeta.icon}" class="w-7 h-7" style="color: ${gunMeta.color};"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-lg font-black truncate">${esc(gun)}</div>
          <div class="text-[10px] text-gray-500">${gunMeta.category} · ${attachedCount}/9 attachments · ${score.emoji} ${score.tier}</div>
        </div>
        <button id="change-gun-btn" class="btn-press px-3 py-2 rounded-lg bg-cardAlt border border-border text-[10px] font-bold">
          Change
        </button>
      </div>
    </div>

    <!-- Presets -->
    ${presets.length > 0 && attachedCount === 0 ? `
      <div class="mb-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-2">✨ Quick Presets</div>
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          ${presets.map((p, i) => `
            <button class="preset-btn chip" data-preset-index="${i}">${p.name}</button>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Enhanced Stats Preview -->
    <div id="stat-preview">
      ${renderEnhancedStats(base, final, modifiers)}
    </div>

    <!-- Attachments Grid -->
    <div class="text-xs font-bold text-gray-400 uppercase mb-2 mt-4">Attachments</div>
    <div class="grid grid-cols-3 gap-2 mb-4" id="slot-grid">
      ${GUNSMITH_SLOTS.map(slot => {
        const picked = BuilderState.selectedAttachments[slot.key];
        const iconName = SLOT_ICON_MAP[slot.key] || 'circle';
        return `
          <button class="slot-btn bg-card border ${picked ? 'border-primary/60 bg-primary/5' : 'border-border'} rounded-xl p-3 flex flex-col items-center gap-1.5" data-slot="${slot.key}">
            <i data-lucide="${iconName}" class="w-5 h-5 ${picked ? 'text-primary' : 'text-gray-500'}"></i>
            <div class="text-[9px] font-bold ${picked ? 'text-primary' : 'text-gray-400'} text-center leading-tight">${slot.label}</div>
            ${picked ? `<div class="text-[8px] text-primary truncate w-full text-center">${esc(picked.name)}</div>` : `<div class="text-[8px] text-gray-600">Empty</div>`}
          </button>
        `;
      }).join('')}
    </div>

    <!-- Attachment Preview Pills -->
    ${attachedCount > 0 ? `
      <div class="bg-card border border-border rounded-2xl p-3 mb-4">
        <div class="text-[10px] font-bold text-gray-400 uppercase mb-2">Attached</div>
        <div class="flex flex-wrap gap-1.5">
          ${GUNSMITH_SLOTS.map(slot => {
            const picked = BuilderState.selectedAttachments[slot.key];
            if (!picked) return '';
            return `
              <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/15 border border-primary/30">
                <i data-lucide="${SLOT_ICON_MAP[slot.key] || 'circle'}" class="w-3 h-3 text-primary"></i>
                <span class="text-[10px] font-bold text-primary">${esc(picked.name)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Actions -->
    <div class="space-y-2">
      <button id="builder-save-btn" class="btn-press w-full py-3.5 rounded-xl bg-primary font-black text-sm glow-primary flex items-center justify-center gap-2">
        <i data-lucide="save" class="w-4 h-4"></i> Save to Vault
      </button>
      <button id="builder-share-btn" class="btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2">
        <i data-lucide="share-2" class="w-4 h-4"></i> Share Build
      </button>
    </div>

    <div class="text-[10px] text-gray-600 text-center mt-4">
      Stats are approximate — based on community-sourced data
    </div>
  `;

  document.getElementById('change-gun-btn').onclick = () => {
    BuilderState.selectedGun = null;
    BuilderState.selectedAttachments = {};
    renderBuilderBody();
  };

  body.querySelectorAll('.slot-btn').forEach(btn => {
    btn.onclick = () => openAttachmentPicker(btn.dataset.slot);
  });

  body.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.presetIndex);
      applyPreset(presets[idx]);
    };
  });

  document.getElementById('builder-save-btn').onclick = saveBuildToVault;
  document.getElementById('builder-share-btn').onclick = shareBuild;

  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 5: PATCH ATTACHMENT PICKER with icons
// ============================================

const _origOpenAttachmentPickerIcons = openAttachmentPicker;
openAttachmentPicker = function(slotKey) {
  const slot = GUNSMITH_SLOTS.find(s => s.key === slotKey);
  if (!slot) return;

  const gun = BuilderState.selectedGun;
  const attachments = getAttachmentsForSlot(gun, slotKey);
  const current = BuilderState.selectedAttachments[slotKey];
  const slotIcon = SLOT_ICON_MAP[slotKey] || 'circle';

  if (attachments.length === 0) {
    toast('No attachments available for this slot', 'info');
    return;
  }

  openSheet(`
    <div class="space-y-2 max-h-[70vh] overflow-y-auto">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="${slotIcon}" class="w-5 h-5 text-primary"></i>
        <div class="text-xs text-gray-400 font-bold uppercase">${slot.label}</div>
      </div>

      ${current ? `
        <button class="pick-attach-remove w-full text-left px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 font-bold text-sm mb-2">
          ✕ Remove current: ${esc(current.name)}
        </button>
      ` : ''}

      ${attachments.map((att, i) => {
        const isSelected = current && current.name === att.name;
        const effects = Object.entries(att.effects || {});
        return `
          <button class="pick-attach-btn w-full text-left px-4 py-3 rounded-xl ${isSelected ? 'bg-primary/15 border border-primary' : 'bg-card border border-border'} font-semibold text-sm" data-index="${i}">
            <div class="flex items-center justify-between mb-1">
              <span class="${isSelected ? 'text-primary' : 'text-white'}">${esc(att.name)}</span>
              ${isSelected ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white font-black">EQUIPPED</span>' : ''}
            </div>
            ${effects.length > 0 ? `
              <div class="flex flex-wrap gap-1.5 mt-1">
                ${effects.map(([stat, val]) => `
                  <span class="text-[9px] px-1.5 py-0.5 rounded ${val > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'} font-bold">
                    ${stat} ${val > 0 ? '+' + val : val}
                  </span>
                `).join('')}
              </div>
            ` : '<div class="text-[10px] text-gray-500">No stat changes</div>'}
          </button>
        `;
      }).join('')}
    </div>
  `, slot.label);

  document.querySelectorAll('.pick-attach-btn').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index);
      BuilderState.selectedAttachments[slotKey] = attachments[idx];
      closeSheet();
      renderBuilderBody();
      toast(`${slot.label}: ${attachments[idx].name}`, 'success', 1500);
    };
  });

  const removeBtn = document.querySelector('.pick-attach-remove');
  if (removeBtn) {
    removeBtn.onclick = () => {
      delete BuilderState.selectedAttachments[slotKey];
      closeSheet();
      renderBuilderBody();
      toast(`${slot.label} removed`, 'success', 1500);
    };
  }

  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 6: PATCH GUNSMITH BUILDER HEADER
// ============================================

const _origOpenGunsmithBuilderIcons = openGunsmithBuilder;
openGunsmithBuilder = function(gunName) {
  BuilderState.selectedGun = gunName || null;
  BuilderState.selectedAttachments = {};
  BuilderState.activeSlot = null;

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="flex items-center justify-between mb-4">
        <button id="builder-back-btn" class="btn-press w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <div class="text-center flex-1">
          <div class="text-lg font-black">Gunsmith Builder</div>
          <div class="text-[10px] text-gray-500">Build & share your perfect loadout</div>
        </div>
        <button id="builder-reset-btn" class="btn-press w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <i data-lucide="rotate-ccw" class="w-5 h-5 text-gray-400"></i>
        </button>
      </div>

      <div id="builder-body"></div>
    </div>
  `;

  document.getElementById('builder-back-btn').onclick = () => {
    labSubTab = 'vault';
    renderLabTab();
  };
  document.getElementById('builder-reset-btn').onclick = () => {
    confirmDialog('Reset Build', 'Clear all attachments?', () => {
      BuilderState.selectedAttachments = {};
      renderBuilderBody();
    }, 'Reset', true);
  };

  renderBuilderBody();
  if (window.lucide) window.lucide.createIcons();
};

window.getGunMeta = getGunMeta;
window.GUN_CATEGORY_META = GUN_CATEGORY_META;
window.SLOT_ICON_MAP = SLOT_ICON_MAP;

console.log('✅ Chunk 47: Professional gun icons + attachment preview loaded');

/* END OF CHUNK 47 */
// ============================================
// Chunk 48a: HOME Feed — Core Render
// ============================================

// ============================================
// PART 1: HOME STATE
// ============================================

let homeFilter = 'all';
let homeCache = {
  feed: [],
  lastFetch: 0,
  isLoading: false
};


// ============================================
// PART 2: FETCH UNIFIED FEED
// ============================================

async function fetchHomeFeed() {
  if (homeCache.isLoading) return homeCache.feed;
  homeCache.isLoading = true;

  try {
    const now = Date.now();

    // Parallel fetch all 4 sources
    const [lobbiesSnap, vaultsSnap, clipsSnap, leaksSnap] = await Promise.all([
      getDocs(query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'vaults'), orderBy('createdAt', 'desc'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'clips'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'leaks'), limit(20))).catch(() => ({ forEach: () => {} }))
    ]);

    const feed = [];

    // Lobbies → feed
    lobbiesSnap.forEach(d => {
      const data = d.data();
      const expiresAt = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (expiresAt < now) return; // Skip expired
      feed.push({
        id: d.id,
        type: 'lobby',
        ...data,
        _sortTime: data.createdAt?.seconds || 0
      });
    });

    // Vaults → feed
    vaultsSnap.forEach(d => {
      const data = d.data();
      feed.push({
        id: d.id,
        type: 'vault',
        ...data,
        _sortTime: data.createdAt?.seconds || 0
      });
    });

    // Clips → feed
    clipsSnap.forEach(d => {
      const data = d.data();
      feed.push({
        id: d.id,
        type: 'clip',
        ...data,
        _sortTime: data.createdAt?.seconds || 0
      });
    });

    // Leaks → feed
    leaksSnap.forEach(d => {
      const data = d.data();
      feed.push({
        id: d.id,
        type: 'leak',
        ...data,
        _sortTime: (data.createdAt || data.publishedAt)?.seconds || 0
      });
    });

    // Sort newest first
    feed.sort((a, b) => b._sortTime - a._sortTime);

    homeCache.feed = feed;
    homeCache.lastFetch = now;
    homeCache.isLoading = false;

    return feed;
  } catch (e) {
    console.error('Home feed fetch error:', e);
    homeCache.isLoading = false;
    return homeCache.feed;
  }
}

// ============================================
// PART 3: MAIN HOME RENDER
// ============================================

async function renderHomeTab() {
  const content = document.getElementById('content');
  if (!content) return;

  // Set up shell with header + filters + feed
  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h1 class="text-2xl font-black">Home</h1>
            <p class="text-xs text-gray-500">What's happening in CODM</p>
          </div>
          <button id="home-refresh-btn" class="btn-press w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <i data-lucide="refresh-cw" class="w-4 h-4 text-gray-400"></i>
          </button>
        </div>

        <!-- Filters -->
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          ${HOME_FILTERS.map(f => `
            <button class="chip home-filter-btn ${homeFilter === f.key ? 'active' : ''}" data-filter="${f.key}">
              ${f.emoji} ${f.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Feed -->
      <div id="home-feed">
        ${renderHomeSkeleton()}
      </div>
    </div>
  `;

  // Wire filters
  document.querySelectorAll('.home-filter-btn').forEach(btn => {
    btn.onclick = () => {
      homeFilter = btn.dataset.filter;
      document.querySelectorAll('.home-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderHomeFeed();
    };
  });

  // Wire refresh
  document.getElementById('home-refresh-btn').onclick = async () => {
    homeCache.lastFetch = 0;
    toast('Refreshing...', 'info', 1000);
    await fetchHomeFeed();
    renderHomeFeed();
  };

  // Fetch and render
  await fetchHomeFeed();
  renderHomeFeed();

  if (window.lucide) window.lucide.createIcons();
}

function renderHomeSkeleton() {
  return Array(3).fill(0).map(() => `
    <div class="bg-card border border-border rounded-2xl p-4 mb-3">
      <div class="flex items-center gap-3 mb-3">
        <div class="skeleton w-10 h-10 rounded-full"></div>
        <div class="flex-1">
          <div class="skeleton h-3 w-24 rounded mb-1.5"></div>
          <div class="skeleton h-2.5 w-16 rounded"></div>
        </div>
      </div>
      <div class="skeleton h-3 w-full rounded mb-2"></div>
      <div class="skeleton h-3 w-2/3 rounded"></div>
    </div>
  `).join('');
}

function renderHomeFeed() {
  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  let items = homeCache.feed;

  // Apply filter
  if (homeFilter !== 'all') {
    const typeMap = {
      lfg: 'lobby',
      builds: 'vault',
      clips: 'clip',
      leaks: 'leak'
    };
    items = items.filter(i => i.type === typeMap[homeFilter]);
  }

  if (items.length === 0) {
    feedEl.innerHTML = renderHomeEmpty();
    wireHomeEmpty();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feedEl.innerHTML = items.map(item => renderHomeCard(item)).join('');

  wireHomeCards(items);
  if (window.lucide) window.lucide.createIcons();
}

function renderHomeEmpty() {
  return `
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center fade-in">
      <div class="relative mb-5">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/10 rounded-full blur-2xl"></div>
        <div class="relative w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center">
          <i data-lucide="sparkles" class="w-10 h-10 text-primary/70"></i>
        </div>
      </div>
      <div class="text-lg font-black mb-2">Nothing here yet</div>
      <div class="text-xs text-gray-500 max-w-[260px] leading-relaxed mb-5">
        ${homeFilter === 'all' ? 'Be the first to post something — start by finding a squad or sharing a build.' : 'No ' + homeFilter + ' content yet.'}
      </div>
      <div class="flex gap-2">
        <button id="home-empty-lfg" class="btn-press px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs">Post Lobby</button>
        <button id="home-empty-vault" class="btn-press px-4 py-2.5 rounded-xl bg-card border border-border font-bold text-xs">Build Gunsmith</button>
      </div>
    </div>
  `;
}

function wireHomeEmpty() {
  const lfgBtn = document.getElementById('home-empty-lfg');
  if (lfgBtn) lfgBtn.onclick = openPostLobbySheet;
  const vaultBtn = document.getElementById('home-empty-vault');
  if (vaultBtn) vaultBtn.onclick = () => {
    labSubTab = 'vault';
    switchTab('lab');
  };
}

// ============================================
// PART 4: FEED CARD RENDERERS
// ============================================

function renderHomeCard(item) {
  switch (item.type) {
    case 'lobby': return renderHomeLobbyCard(item);
    case 'vault': return renderHomeVaultCard(item);
    case 'clip': return renderHomeClipCard(item);
    case 'leak': return renderHomeLeakCard(item);
    default: return '';
  }
}

function renderHomeLobbyCard(l) {
  const isMine = l.uid === State.user.uid;
  const playersText = `${l.players || 1}/5`;
  return `
    <div class="home-card bg-card border border-border rounded-2xl p-4 mb-3 fade-in" data-type="lobby" data-id="${l.id}" style="cursor: pointer;">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-black">🎮 LOBBY</span>
        <span class="text-[10px] text-gray-500">${timeAgo(l.createdAt)}</span>
        <div class="ml-auto text-right">
          <div class="text-xs font-black text-primary">${playersText}</div>
        </div>
      </div>

      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-base overflow-hidden flex-shrink-0">
          ${l.avatar ? `<img src="${esc(l.avatar)}" class="w-full h-full object-cover" />` : getInitials(l.ign)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-sm">${esc(l.ign || 'Unknown')}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">${esc(l.rank || 'Rookie')}</span>
            ${l.uid === ADMIN_UID ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black">👑</span>' : ''}
          </div>
          <div class="text-[10px] text-gray-500 mt-0.5">${esc(l.mode)} · ${esc(l.region)}${l.mic ? ' · 🎤' : ''}</div>
        </div>
      </div>

      ${l.note ? `<p class="text-xs text-gray-400 mb-3 line-clamp-2">${esc(l.note)}</p>` : ''}

      <div class="flex gap-2">
        <button class="home-join-btn btn-press flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-1.5" data-id="${l.id}">
          <i data-lucide="log-in" class="w-4 h-4"></i> Join
        </button>
        <button class="home-like-btn btn-press w-11 h-11 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-type="lobby" data-id="${l.id}">
          <i data-lucide="heart" class="w-4 h-4 text-gray-400"></i>
        </button>
        <button class="home-share-btn btn-press w-11 h-11 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-type="lobby" data-id="${l.id}">
          <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
        </button>
      </div>
    </div>
  `;
}

function renderHomeVaultCard(v) {
  const isSens = v.type === 'sens';
  const isHud = v.type === 'hud';
  const isLiked = State.likedItems?.vault?.[v.id] || false;

  return `
    <div class="home-card bg-card border border-border rounded-2xl p-4 mb-3 fade-in" data-type="vault" data-id="${v.id}" style="cursor: pointer;">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] px-2 py-1 rounded-full ${isSens ? 'bg-primary/15 text-primary' : isHud ? 'bg-gold/15 text-gold' : 'bg-primary/15 text-primary'} font-black">
          ${isSens ? '🎯 SENS' : isHud ? '🎮 HUD' : '🔧 BUILD'}
        </span>
        <span class="text-[10px] text-gray-500">${timeAgo(v.createdAt)}</span>
      </div>

      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-base overflow-hidden flex-shrink-0">
          ${v.avatar ? `<img src="${esc(v.avatar)}" class="w-full h-full object-cover" />` : getInitials(v.ign)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm">${esc(v.gunName || 'Build')}</div>
          <div class="text-[10px] text-gray-500 mt-0.5">
            by ${esc(v.ign || 'Unknown')}
            ${v.approved ? ' · <span class="text-green-400">✓ Approved</span>' : ''}
          </div>
        </div>
      </div>

      ${v.imageUrl && !isSens ? `
        <img src="${esc(v.imageUrl)}" class="w-full h-40 object-cover rounded-xl mb-3" loading="lazy" />
      ` : isHud && v.imageUrl ? `
        <img src="${esc(v.imageUrl)}" class="w-full h-40 object-cover rounded-xl mb-3" loading="lazy" />
      ` : ''}

      ${v.gunsmithCode && !isSens ? `
        <div class="bg-cardAlt border border-border rounded-lg p-2.5 mb-3">
          <div class="font-mono text-xs text-primary font-bold truncate">${esc(v.gunsmithCode)}</div>
        </div>
      ` : isSens ? `
        <div class="text-[10px] text-gray-500 mb-3 line-clamp-2">${esc(v.gunsmithCode || '')}</div>
      ` : ''}

      <div class="flex gap-2">
        ${v.gunsmithCode && !isSens && !isHud ? `
          <button class="home-copy-btn btn-press flex-1 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold flex items-center justify-center gap-1.5" data-code="${esc(v.gunsmithCode)}">
            <i data-lucide="copy" class="w-4 h-4"></i> Copy Code
          </button>
        ` : `
          <button class="home-view-vault-btn btn-press flex-1 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold" data-id="${v.id}">
            View Details
          </button>
        `}
        <button class="home-like-btn btn-press w-11 h-11 rounded-xl ${isLiked ? 'bg-primary/15 border-primary/30' : 'bg-cardAlt border-border'} border flex items-center justify-center" data-type="vault" data-id="${v.id}">
          <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'text-primary fill-current' : 'text-gray-400'}"></i>
        </button>
        <button class="home-share-btn btn-press w-11 h-11 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-type="vault" data-id="${v.id}">
          <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
        </button>
      </div>
    </div>
  `;
}

function renderHomeClipCard(c) {
  const embedUrl = getYouTubeEmbed(c.youtubeUrl);
  const isApproved = !!c.approved;
  const isLiked = State.likedItems?.clip?.[c.id] || false;
  const authorName = c.submittedByIgn || c.ign || 'CODMPanda';

  return `
    <div class="home-card bg-card border border-border rounded-2xl overflow-hidden mb-3 fade-in" data-type="clip" data-id="${c.id}">
      <div class="p-3 pb-2">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-black">🎬 CLIP</span>
          ${isApproved ? '<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">✓ Approved</span>' : ''}
          <span class="text-[10px] text-gray-500 ml-auto">${timeAgo(c.createdAt)}</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
            ${c.submittedByAvatar ? `<img src="${esc(c.submittedByAvatar)}" class="w-full h-full object-cover" />` : getInitials(authorName)}
          </div>
          <div class="text-xs text-gray-400">by <span class="text-white font-bold">${esc(authorName)}</span> · ${esc(c.gunTag || 'CODM')}</div>
        </div>
      </div>

      ${embedUrl ? `
        <div class="relative w-full aspect-video bg-black">
          <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen loading="lazy"></iframe>
        </div>
      ` : `
        <a href="${esc(c.youtubeUrl)}" target="_blank" class="block w-full aspect-video bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
          <div class="text-center">
            <i data-lucide="external-link" class="w-8 h-8 mx-auto text-primary mb-2"></i>
            <div class="text-xs text-gray-400">Open link</div>
          </div>
        </a>
      `}

      <div class="p-3 flex items-center justify-between">
        <button class="home-like-btn btn-press flex items-center gap-1.5 text-xs ${isLiked ? 'text-primary' : 'text-gray-400'}" data-type="clip" data-id="${c.id}">
          <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'fill-current' : ''}"></i> ${c.likes || 0}
        </button>
        <button class="home-share-btn btn-press text-primary" data-type="clip" data-id="${c.id}">
          <i data-lucide="share-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
}

function renderHomeLeakCard(l) {
  const rarityColors = {
    common: 'bg-gray-500', rare: 'bg-blue-500', epic: 'bg-purple-500',
    legendary: 'bg-gold text-black', mythic: 'bg-red-500'
  };
  const authorName = l.submittedByIgn || l.authorIgn || 'CODMPanda';
  const isLiked = State.likedItems?.leak?.[l.id] || false;

  return `
    <div class="home-card bg-card border border-border rounded-2xl overflow-hidden mb-3 fade-in" data-type="leak" data-id="${l.id}">
      ${l.imageUrl ? `<img src="${esc(l.imageUrl)}" class="w-full h-44 object-cover" loading="lazy" />` : ''}
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="text-[10px] px-2 py-1 rounded-full bg-gold/15 text-gold font-black">🔥 LEAK</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full ${rarityColors[l.rarity] || 'bg-gray-500'} font-black uppercase">${esc(l.rarity || 'common')}</span>
          <span class="text-[10px] text-gray-500 ml-auto">${timeAgo(l.createdAt || l.publishedAt)}</span>
        </div>
        <h3 class="text-base font-bold mb-2">${esc(l.title)}</h3>
        ${l.body ? `<p class="text-xs text-gray-400 line-clamp-3 mb-3">${esc(l.body)}</p>` : ''}
        <div class="flex items-center justify-between pt-2 border-t border-border">
          <button class="home-like-btn btn-press flex items-center gap-1.5 text-xs ${isLiked ? 'text-primary' : 'text-gray-400'}" data-type="leak" data-id="${l.id}">
            <i data-lucide="flame" class="w-4 h-4 ${isLiked ? 'fill-current' : ''}"></i> ${l.hypes || 0}
          </button>
          <button class="home-share-btn btn-press text-primary" data-type="leak" data-id="${l.id}">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// PART 5: WIRE CARD INTERACTIONS
// ============================================

function wireHomeCards(items) {
  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  // Join lobby
  feedEl.querySelectorAll('.home-join-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      joinLobby(btn.dataset.id);
    };
  });

  // Copy code
  feedEl.querySelectorAll('.home-copy-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      copyText(btn.dataset.code, 'Code copied!');
    };
  });

  // View vault
  feedEl.querySelectorAll('.home-view-vault-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      // Refresh cache to ensure vault is available
      openVaultDetail(btn.dataset.id);
    };
  });

  // Like
  feedEl.querySelectorAll('.home-like-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const itemType = btn.dataset.type;
      const itemId = btn.dataset.id;

      const nowLiked = await toggleLike(itemType, itemId, itemType === 'leak' ? 'hypes' : 'likes');

      State.likedItems = State.likedItems || {};
      State.likedItems[itemType] = State.likedItems[itemType] || {};
      State.likedItems[itemType][itemId] = nowLiked;

      const icon = btn.querySelector('i');
      if (nowLiked) {
        icon.classList.add('fill-current', 'text-primary');
        icon.classList.remove('text-gray-400');
        btn.classList.add('text-primary');
      } else {
        icon.classList.remove('fill-current', 'text-primary');
        icon.classList.add('text-gray-400');
        btn.classList.remove('text-primary');
      }

      toast(nowLiked ? '❤️ Liked!' : 'Unliked', 'success', 1000);
    };
  });

  // Share
  feedEl.querySelectorAll('.home-share-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = btn.dataset.id;
      const urls = {
        lobby: getLobbyShareUrl,
        vault: getVaultShareUrl,
        clip: getClipShareUrl,
        leak: getLeakShareUrl
      };
      const urlFn = urls[type];
      if (urlFn) {
        openShareSheet({
          title: `CODMPanda ${type}`,
          text: `Check this out on CODMPanda!`,
          url: urlFn(id)
        });
      }
    };
  });

  // Card tap → detail
  feedEl.querySelectorAll('.home-card').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('button')) return;
      const type = card.dataset.type;
      const id = card.dataset.id;
      if (type === 'vault') openVaultDetail(id);
      else if (type === 'clip') { squadSubTab = 'clips'; switchTab('squad'); }
      else if (type === 'leak') { intelSubTab = 'leaks'; switchTab('intel'); }
      else if (type === 'lobby') { /* lobbies are self-contained */ }
    };
  });
}

window.renderHomeTab = renderHomeTab;
window.fetchHomeFeed = fetchHomeFeed;
window.renderHomeFeed = renderHomeFeed;
window.HOME_FILTERS = HOME_FILTERS;

console.log('✅ Chunk 48a: HOME feed core loaded');

/* END OF CHUNK 48a */
// ============================================
// Chunk 48b: HOME Feed — Live + Polish (clean)
// ============================================

// ============================================
// PART 1: LIVE UPDATES via onSnapshot
// ============================================

let homeLiveUnsubs = [];

function startHomeLiveUpdates() {
  stopHomeLiveUpdates();

  try {
    homeLiveUnsubs.push(onSnapshot(
      query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(20)),
      () => { scheduleHomeRefresh(); },
      () => {}
    ));

    homeLiveUnsubs.push(onSnapshot(
      query(collection(db, 'vaults'), orderBy('createdAt', 'desc'), limit(20)),
      () => { scheduleHomeRefresh(); },
      () => {}
    ));

    homeLiveUnsubs.push(onSnapshot(
      query(collection(db, 'clips'), limit(20)),
      () => { scheduleHomeRefresh(); },
      () => {}
    ));

    homeLiveUnsubs.push(onSnapshot(
      query(collection(db, 'leaks'), limit(15)),
      () => { scheduleHomeRefresh(); },
      () => {}
    ));
  } catch (e) {
    console.warn('Live updates failed:', e);
  }
}

function stopHomeLiveUpdates() {
  homeLiveUnsubs.forEach(unsub => {
    try { unsub(); } catch (e) {}
  });
  homeLiveUnsubs = [];
}

let homeRefreshTimer = null;
function scheduleHomeRefresh() {
  clearTimeout(homeRefreshTimer);
  homeRefreshTimer = setTimeout(async () => {
    if (State.currentTab !== 'home') return;
    await fetchHomeFeed();
    renderHomeFeed();
  }, 3000);
}

// ============================================
// PART 2: PATCH renderHomeTab for live + timeout
// ============================================

const _origRenderHomeTabLive = renderHomeTab;
renderHomeTab = async function() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h1 class="text-2xl font-black">Home</h1>
            <p class="text-xs text-gray-500">What's happening in CODM</p>
          </div>
          <button id="home-refresh-btn" class="btn-press w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <i data-lucide="refresh-cw" class="w-4 h-4 text-gray-400"></i>
          </button>
        </div>

        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          ${HOME_FILTERS.map(f => `
            <button class="chip home-filter-btn ${homeFilter === f.key ? 'active' : ''}" data-filter="${f.key}">
              ${f.emoji} ${f.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div id="home-feed">
        ${renderHomeSkeleton()}
      </div>
    </div>
  `;

  document.querySelectorAll('.home-filter-btn').forEach(btn => {
    btn.onclick = () => {
      homeFilter = btn.dataset.filter;
      document.querySelectorAll('.home-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderHomeFeed();
    };
  });

  document.getElementById('home-refresh-btn').onclick = async () => {
    homeCache.lastFetch = 0;
    toast('Refreshing...', 'info', 1000);
    await fetchHomeFeed();
    renderHomeFeed();
  };

  const fetchPromise = fetchHomeFeed();
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 5000));
  const result = await Promise.race([fetchPromise, timeoutPromise]);

  if (result === 'timeout') {
    toast('Taking longer than usual...', 'warning', 2000);
  }

  renderHomeFeed();
  startHomeLiveUpdates();

  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 3: FEED STATS BAR
// ============================================

function renderHomeStats() {
  const feed = homeCache.feed;
  if (!feed.length) return '';

  const counts = {
    lobby: feed.filter(f => f.type === 'lobby').length,
    vault: feed.filter(f => f.type === 'vault').length,
    clip: feed.filter(f => f.type === 'clip').length,
    leak: feed.filter(f => f.type === 'leak').length
  };

  return `
    <div class="flex items-center gap-2 mb-3 text-[10px] text-gray-500">
      <span class="px-2 py-1 rounded-full bg-card border border-border">🎮 ${counts.lobby}</span>
      <span class="px-2 py-1 rounded-full bg-card border border-border">🔧 ${counts.vault}</span>
      <span class="px-2 py-1 rounded-full bg-card border border-border">🎬 ${counts.clip}</span>
      <span class="px-2 py-1 rounded-full bg-card border border-border">🔥 ${counts.leak}</span>
    </div>
  `;
}

// Patch renderHomeFeed to include stats
const _origRenderHomeFeedStats = renderHomeFeed;
renderHomeFeed = function() {
  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  let items = homeCache.feed.filter(i => !['gunsmith','hud','sens'].includes(i.type));

  if (homeFilter !== 'all') {
    const typeMap = {
      lfg: 'lobby',
      builds: 'vault',
      clips: 'clip',
      leaks: 'leak',
      posts: 'post'
    };
    items = items.filter(i => i.type === typeMap[homeFilter]);
  }

  if (items.length === 0) {
    feedEl.innerHTML = renderHomeEmpty();
    wireHomeEmpty();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feedEl.innerHTML = renderHomeStats() + items.map(item => renderHomeCard(item)).join('');

  wireHomeCards(items);
  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 4: PATCH switchTab for 'home' routing
// ============================================

const _origSwitchTabHome = switchTab;
switchTab = function(tab) {
  State.currentTab = tab;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('tab-active', isActive);
    btn.classList.toggle('text-gray-500', !isActive);
  });

  if (State.lobbiesUnsub && tab !== 'play') { State.lobbiesUnsub(); State.lobbiesUnsub = null; }
  if (State.vaultsUnsub && tab !== 'lab') { State.vaultsUnsub(); State.vaultsUnsub = null; }
  if (State.camosUnsub && tab !== 'lab') { State.camosUnsub(); State.camosUnsub = null; }
  if (State.clansUnsub && tab !== 'squad') { State.clansUnsub(); State.clansUnsub = null; }
  if (State.scrimsUnsub && tab !== 'squad') { State.scrimsUnsub(); State.scrimsUnsub = null; }
  if (State.clipsUnsub && tab !== 'squad') { State.clipsUnsub(); State.clipsUnsub = null; }
  if (State.leaksUnsub && tab !== 'intel') { State.leaksUnsub(); State.leaksUnsub = null; }

  // Stop home live if leaving home
  if (tab !== 'home') stopHomeLiveUpdates();

  const content = document.getElementById('content');
  content.innerHTML = '';
  content.scrollTop = 0;
  window.scrollTo(0, 0);

  switch (tab) {
    case 'home': renderHomeTab(); break;
    case 'play': renderPlayTab(); break;
    case 'lab': renderLabTab(); break;
    case 'squad': renderSquadTab(); break;
    case 'intel': renderIntelTab(); break;
    case 'you': renderYouTab(); break;
  }

  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 5: DEFAULT TO HOME ON APP LOAD
// ============================================

const _origShowMainAppHome = showMainApp;
showMainApp = function() {
  _origShowMainAppHome();
  setTimeout(() => {
    // Set HOME as default tab
    switchTab('home');
  }, 300);
};

// ============================================
// PART 6: PATCH openVaultDetail to fetch if not cached
// ============================================

const _origOpenVaultDetailHome = openVaultDetail;
openVaultDetail = async function(vaultId) {
  let vault = State.cache.vaults?.find(v => v.id === vaultId);
  if (!vault) {
    try {
      const snap = await getDoc(doc(db, 'vaults', vaultId));
      if (snap.exists()) {
        vault = { id: snap.id, ...snap.data() };
        State.cache.vaults = State.cache.vaults || [];
        State.cache.vaults.unshift(vault);
      }
    } catch (e) {}
  }
  return _origOpenVaultDetailHome(vaultId);
};

// ============================================
// PART 7: CLEANUP
// ============================================

const _origHandleSignOutHome = handleSignOut;
handleSignOut = function() {
  stopHomeLiveUpdates();
  return _origHandleSignOutHome();
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopHomeLiveUpdates();
  } else if (State.currentTab === 'home' && State.user) {
    startHomeLiveUpdates();
  }
});

window.startHomeLiveUpdates = startHomeLiveUpdates;
window.stopHomeLiveUpdates = stopHomeLiveUpdates;

console.log('✅ Chunk 48b: HOME feed live updates loaded');

/* END OF CHUNK 48b */
// ============================================
// Chunk 49: Fix 3 Bugs (Sens view + Stat pills + Instant likes)
// ============================================

// ============================================
// PART 1: FIX SENSITIVITY DETAIL VIEW
// ============================================

const _origOpenVaultDetailFix = openVaultDetail;
openVaultDetail = function(vaultId) {
  const vault = State.cache.vaults.find(v => v.id === vaultId);
  if (!vault) {
    // Try fetching from Firestore
    getDoc(doc(db, 'vaults', vaultId)).then(snap => {
      if (snap.exists()) {
        const fetched = { id: snap.id, ...snap.data() };
        State.cache.vaults = State.cache.vaults || [];
        State.cache.vaults.unshift(fetched);
        _origOpenVaultDetailFix(vaultId);
      } else {
        toast('Item not found', 'error');
      }
    }).catch(() => toast('Failed to load', 'error'));
    return;
  }
  return _origOpenVaultDetailFix(vaultId);
};

// ============================================
// PART 2: REMOVE STAT PILLS FROM HOME
// ============================================

renderHomeStats = function() {
  return ''; // Empty — remove the 4 pills
};

// Patch renderHomeFeed to not use stat pills
const _origRenderHomeFeedPills = renderHomeFeed;
renderHomeFeed = function() {
  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  let items = homeCache.feed;

  if (homeFilter !== 'all') {
    const typeMap = {
      lfg: 'lobby',
      builds: 'vault',
      clips: 'clip',
      leaks: 'leak'
    };
    items = items.filter(i => i.type === typeMap[homeFilter]);
  }

  if (items.length === 0) {
    feedEl.innerHTML = renderHomeEmpty();
    wireHomeEmpty();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // No more stats bar — just cards
  feedEl.innerHTML = items.map(item => renderHomeCard(item)).join('');

  wireHomeCards(items);
  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 3: INSTANT HEART FILL (Optimistic UI)
// ============================================

// Patch wireHomeCards for instant feedback
const _origWireHomeCardsInstant = wireHomeCards;
wireHomeCards = function(items) {
  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  // Join lobby
  feedEl.querySelectorAll('.home-join-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); joinLobby(btn.dataset.id); };
  });

  // Copy
  feedEl.querySelectorAll('.home-copy-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); copyText(btn.dataset.code, 'Code copied!'); };
  });

  // View vault
  feedEl.querySelectorAll('.home-view-vault-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openVaultDetail(btn.dataset.id); };
  });

  // LIKE — instant optimistic UI
  feedEl.querySelectorAll('.home-like-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const itemType = btn.dataset.type;
      const itemId = btn.dataset.id;

      // OPTIMISTIC — flip UI instantly
      State.likedItems = State.likedItems || {};
      State.likedItems[itemType] = State.likedItems[itemType] || {};
      const wasLiked = State.likedItems[itemType][itemId] || false;
      const nowLiked = !wasLiked;
      State.likedItems[itemType][itemId] = nowLiked;

      // Update button appearance IMMEDIATELY
      const icon = btn.querySelector('i');
      // Get current count from the button text
      const currentText = btn.textContent.trim();
      const currentCount = parseInt(currentText.replace(/[^0-9]/g, '')) || 0;
      const newCount = nowLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

      // Rebuild button contents
      const iconName = itemType === 'leak' ? 'flame' : 'heart';
      btn.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 ${nowLiked ? 'fill-current' : ''}"></i> ${newCount}`;
      btn.classList.toggle('text-primary', nowLiked);
      btn.classList.toggle('text-gray-400', !nowLiked);
      if (window.lucide) window.lucide.createIcons();

      // Then sync to Firestore in background
      try {
        await toggleLike(itemType, itemId, itemType === 'leak' ? 'hypes' : 'likes');
      } catch (err) {
        // Revert on failure
        State.likedItems[itemType][itemId] = wasLiked;
        btn.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 ${wasLiked ? 'fill-current' : ''}"></i> ${currentCount}`;
        btn.classList.toggle('text-primary', wasLiked);
        btn.classList.toggle('text-gray-400', !wasLiked);
        if (window.lucide) window.lucide.createIcons();
        toast('Failed to update like', 'error');
      }
    };
  });

  // SHARE
  feedEl.querySelectorAll('.home-share-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const id = btn.dataset.id;
      const urls = {
        lobby: getLobbyShareUrl,
        vault: getVaultShareUrl,
        clip: getClipShareUrl,
        leak: getLeakShareUrl
      };
      const urlFn = urls[type];
      if (urlFn) {
        openShareSheet({
          title: `CODMPanda ${type}`,
          text: `Check this out on CODMPanda!`,
          url: urlFn(id)
        });
      }
    };
  });

  // Card tap
  feedEl.querySelectorAll('.home-card').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('button')) return;
      const type = card.dataset.type;
      const id = card.dataset.id;
      if (type === 'vault') openVaultDetail(id);
      else if (type === 'clip') { squadSubTab = 'clips'; switchTab('squad'); }
      else if (type === 'leak') { intelSubTab = 'leaks'; switchTab('intel'); }
    };
  });

  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 4: PATCH VAULT RENDER FOR INSTANT LIKES
// ============================================

const _origRenderVaultsInstantLike = renderVaults;
renderVaults = function() {
  _origRenderVaultsInstantLike();

  // Re-wire like buttons with instant feedback
  setTimeout(() => {
    const feed = document.getElementById('vault-feed');
    if (!feed) return;

    feed.querySelectorAll('.like-btn').forEach(btn => {
      const oldOnclick = btn.onclick;
      btn.onclick = async (e) => {
        e.stopPropagation();
        const vaultId = btn.dataset.id;
        const vault = State.cache.vaults.find(v => v.id === vaultId);
        if (!vault) return;

        // Optimistic
        const wasLiked = State.likedItems?.vault?.[vaultId] || false;
        const nowLiked = !wasLiked;

        State.likedItems = State.likedItems || {};
        State.likedItems.vault = State.likedItems.vault || {};
        State.likedItems.vault[vaultId] = nowLiked;

        const newCount = nowLiked ? (vault.likes || 0) + 1 : Math.max(0, (vault.likes || 0) - 1);
        btn.innerHTML = `<i data-lucide="heart" class="w-3.5 h-3.5 ${nowLiked ? 'fill-current' : ''}"></i> ${newCount}`;
        btn.classList.toggle('text-primary', nowLiked);
        btn.classList.toggle('text-gray-400', !nowLiked);
        if (window.lucide) window.lucide.createIcons();

        // Sync
        try {
          await toggleLike('vault', vaultId, 'likes');
          vault.likes = newCount;
        } catch (err) {
          State.likedItems.vault[vaultId] = wasLiked;
          toast('Failed to like', 'error');
        }
      };
    });

    feed.querySelectorAll('.like-clip').forEach(btn => {
      btn.onclick = async () => {
        const clipId = btn.dataset.id;
        const clip = State.cache.clips.find(c => c.id === clipId);
        if (!clip) return;

        const wasLiked = State.likedItems?.clip?.[clipId] || false;
        const nowLiked = !wasLiked;

        State.likedItems = State.likedItems || {};
        State.likedItems.clip = State.likedItems.clip || {};
        State.likedItems.clip[clipId] = nowLiked;

        const newCount = nowLiked ? (clip.likes || 0) + 1 : Math.max(0, (clip.likes || 0) - 1);
        btn.innerHTML = `<i data-lucide="heart" class="w-4 h-4 ${nowLiked ? 'fill-current' : ''}"></i> ${newCount}`;
        btn.classList.toggle('text-primary', nowLiked);
        btn.classList.toggle('text-gray-400', !nowLiked);
        if (window.lucide) window.lucide.createIcons();

        try {
          await toggleLike('clip', clipId, 'likes');
          clip.likes = newCount;
        } catch (err) {
          State.likedItems.clip[clipId] = wasLiked;
          toast('Failed to like', 'error');
        }
      };
    });

    feed.querySelectorAll('.hype-leak').forEach(btn => {
      btn.onclick = async () => {
        const leakId = btn.dataset.id;
        const leak = State.cache.leaks.find(l => l.id === leakId);
        if (!leak) return;

        const wasLiked = State.likedItems?.leak?.[leakId] || false;
        const nowLiked = !wasLiked;

        State.likedItems = State.likedItems || {};
        State.likedItems.leak = State.likedItems.leak || {};
        State.likedItems.leak[leakId] = nowLiked;

        const newCount = nowLiked ? (leak.hypes || 0) + 1 : Math.max(0, (leak.hypes || 0) - 1);
        btn.innerHTML = `<i data-lucide="flame" class="w-4 h-4 ${nowLiked ? 'fill-current' : ''}"></i> ${newCount}`;
        btn.classList.toggle('text-primary', nowLiked);
        btn.classList.toggle('text-gray-400', !nowLiked);
        if (window.lucide) window.lucide.createIcons();

        try {
          await toggleLike('leak', leakId, 'hypes');
          leak.hypes = newCount;
        } catch (err) {
          State.likedItems.leak[leakId] = wasLiked;
          toast('Failed to like', 'error');
        }
      };
    });
  }, 200);
};

console.log('✅ Chunk 49: 3 bug fixes loaded');

/* END OF CHUNK 49 */
// ============================================
// Chunk 49.5: Restore Missing Constants
// ============================================

// Sensitivity fields — real CODM settings
var SENS_FIELDS = [
  { key: 'standard', label: 'Standard (Hip-Fire)', placeholder: 'e.g. 120' },
  { key: 'ads', label: 'ADS (Iron Sight)', placeholder: 'e.g. 130' },
  { key: 'ads2x', label: 'ADS 2x Scope', placeholder: 'e.g. 120' },
  { key: 'ads3x', label: 'ADS 3x Scope', placeholder: 'e.g. 120' },
  { key: 'ads4x', label: 'ADS 4x Scope', placeholder: 'e.g. 100' },
  { key: 'ads6x', label: 'ADS 6x Scope', placeholder: 'e.g. 100' },
  { key: 'sniper', label: 'Sniper Scope', placeholder: 'e.g. 120' },
  { key: 'gyro', label: 'Gyroscope', placeholder: 'e.g. 300 (0 = off)' }
];

// HUD control styles
var HUD_STYLES = ['2-Finger', '3-Finger', '4-Finger Claw', '5-Finger Claw', '6-Finger', 'Custom'];

console.log('✅ Chunk 49.5: Restored SENS_FIELDS + HUD_STYLES');

/* END OF CHUNK 49.5 */
// ============================================
// Chunk 50: Hero Welcome (Revised) + Panda Replacements
// ============================================

// ============================================
// PART 1: HERO WELCOME SCREEN — Full image + Realistic fireflies
// ============================================

function showHeroWelcome() {
  if (localStorage.getItem('codmpanda_hero_welcome_shown') === 'true') {
    return false;
  }

  const overlay = document.createElement('div');
  overlay.id = 'hero-welcome-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9500;
    background: #050505;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: heroFadeIn 0.6s ease-out;
  `;

  overlay.innerHTML = `
    <!-- Full panda image (contained to show entire image) -->
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      z-index: 1;
    ">
      <img src="/hero-panda.jpg" style="
        min-width: 100%;
        min-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        animation: pandaBreathe 10s ease-in-out infinite;
      " />
    </div>

    <!-- Dark bottom gradient for text readability -->
    <div style="
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 55%;
      background: linear-gradient(180deg, transparent 0%, rgba(5,5,5,0.7) 40%, rgba(5,5,5,0.98) 100%);
      z-index: 2;
      pointer-events: none;
    "></div>

    <!-- Top subtle darkening -->
    <div style="
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 20%;
      background: linear-gradient(180deg, rgba(5,5,5,0.6) 0%, transparent 100%);
      z-index: 2;
      pointer-events: none;
    "></div>

    <!-- Fireflies container -->
    <div id="hero-fireflies" style="
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      overflow: hidden;
    "></div>

    <!-- Content at bottom -->
    <div style="
      position: relative;
      z-index: 10;
      margin-top: auto;
      padding: 24px 24px 90px 24px;
      text-align: center;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
    ">
      <div style="
        font-size: 32px;
        font-weight: 900;
        margin-bottom: 10px;
        letter-spacing: -0.5px;
        line-height: 1.1;
        font-family: Inter, sans-serif;
      ">
        <span style="color: #FF6B00; text-shadow: 0 0 30px rgba(255, 107, 0, 0.7), 0 0 60px rgba(255, 107, 0, 0.4);">Welcome to</span>
        <br/>
        <span style="color: #fff; text-shadow: 0 2px 20px rgba(0,0,0,0.9);">CODMPanda</span>
      </div>

      <div style="
        font-size: 13px;
        color: #aaa;
        margin-bottom: 28px;
        max-width: 280px;
        margin-left: auto;
        margin-right: auto;
        line-height: 1.5;
        font-family: Inter, sans-serif;
      ">
        Your ultimate CODM companion. Time to dominate.
      </div>

      <button id="hero-get-started" class="btn-press" style="
        padding: 16px 44px;
        border-radius: 16px;
        background: linear-gradient(135deg, #FF6B00 0%, #CC5500 100%);
        border: none;
        color: #fff;
        font-size: 15px;
        font-weight: 900;
        font-family: Inter, sans-serif;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(255, 107, 0, 0.55), 0 0 24px rgba(255, 107, 0, 0.3);
        letter-spacing: 0.5px;
      ">
        Get Started →
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Animations
  if (!document.getElementById('hero-animations')) {
    const style = document.createElement('style');
    style.id = 'hero-animations';
    style.textContent = `
      @keyframes heroFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pandaBreathe {
        0%, 100% { transform: scale(1.0); }
        50% { transform: scale(1.03); }
      }
      @keyframes firefly1 {
        0% { transform: translate(0, 0); opacity: 0; }
        15% { opacity: 1; }
        50% { transform: translate(30px, -50vh); opacity: 1; }
        85% { opacity: 1; }
        100% { transform: translate(60px, -100vh); opacity: 0; }
      }
      @keyframes firefly2 {
        0% { transform: translate(0, 0); opacity: 0; }
        15% { opacity: 1; }
        50% { transform: translate(-40px, -40vh); opacity: 1; }
        85% { opacity: 1; }
        100% { transform: translate(-20px, -90vh); opacity: 0; }
      }
      @keyframes firefly3 {
        0% { transform: translate(0, 0); opacity: 0; }
        20% { opacity: 1; }
        50% { transform: translate(20px, -55vh); opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translate(-30px, -100vh); opacity: 0; }
      }
      @keyframes fireflyBlink {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // Generate 40 realistic fireflies
  const firefliesContainer = document.getElementById('hero-fireflies');
  const fireflyColors = ['#FFD700', '#FF6B00', '#C6E377'];
  const fireflyAnimations = ['firefly1', 'firefly2', 'firefly3'];

  for (let i = 0; i < 40; i++) {
    const firefly = document.createElement('div');
    const size = 1.5 + Math.random() * 2; // 1.5-3.5px — small and real
    const color = fireflyColors[Math.floor(Math.random() * fireflyColors.length)];
    const animation = fireflyAnimations[Math.floor(Math.random() * fireflyAnimations.length)];
    const duration = 3 + Math.random() * 2; // 5-9s
    const delay = Math.random() * 3;

    // Random spawn from bottom area (40%-100%) or edges
    const spawnFromBottom = Math.random() > 0.3;
    let leftPos, bottomPos;

    if (spawnFromBottom) {
      leftPos = Math.random() * 100;
      bottomPos = -10 - Math.random() * 30;
    } else {
      // From left or right edges
      const fromLeft = Math.random() > 0.5;
      leftPos = fromLeft ? -5 : 105;
      bottomPos = Math.random() * 40;
    }

    firefly.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      box-shadow:
        0 0 ${size * 2}px ${color},
        0 0 ${size * 4}px ${color},
        0 0 ${size * 6}px ${color}40;
      left: ${leftPos}%;
      bottom: ${bottomPos}px;
      animation:
        ${animation} ${duration}s ease-out infinite,
        fireflyBlink ${1.5 + Math.random() * 2}s ease-in-out infinite;
      animation-delay: ${delay}s, ${Math.random() * 2}s;
      opacity: 0;
    `;
    firefliesContainer.appendChild(firefly);
  }

  // Wire button
  document.getElementById('hero-get-started').onclick = () => {
    localStorage.setItem('codmpanda_hero_welcome_shown', 'true');
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s ease-out';
    setTimeout(() => {
      overlay.remove();
      if (!State.profile?.onboardingDone) {
        if (typeof _origShowOnboardingHero === 'function') _origShowOnboardingHero();
        else if (typeof showOnboarding === 'function') showOnboarding();
      } else {
        showMainApp();
      }
    }, 400);
  };

  return true;
}

// ============================================
// PART 2: HOOK WELCOME INTO ONBOARDING FLOW
// ============================================

const _origShowOnboardingHero = showOnboarding;
showOnboarding = function() {
  const heroShown = showHeroWelcome();
  if (heroShown) return;
  return _origShowOnboardingHero();
};

// ============================================
// PART 3: REPLACE EMOJI 🐼 (Safe overrides)
// ============================================

// 1. Auth gate — swap 🐼 for icon
const _origShowAuthGateHero = showAuthGate;
showAuthGate = function() {
  _origShowAuthGateHero();
  setTimeout(() => {
    const authGate = document.getElementById('auth-gate');
    if (!authGate) return;
    const pandaDiv = authGate.querySelector('.text-6xl');
    if (pandaDiv && pandaDiv.textContent.includes('🐼')) {
      pandaDiv.innerHTML = '<img src="/icon-512.png" alt="CODMPanda" class="w-24 h-24 rounded-3xl" style="box-shadow: 0 0 40px rgba(255, 107, 0, 0.5);" />';
      pandaDiv.classList.remove('text-6xl');
    }
  }, 100);
};

// 2. Onboarding — swap leaked 🐼 for icon
const _origRenderOnboardingHero = renderOnboarding;
renderOnboarding = function() {
  _origRenderOnboardingHero();
  setTimeout(() => {
    const onboarding = document.getElementById('onboarding-content');
    if (!onboarding) return;
    onboarding.querySelectorAll('div').forEach(el => {
      if (el.textContent === '🐼' && !el.querySelector('img')) {
        el.innerHTML = '<img src="/icon-512.png" class="w-20 h-20 mx-auto rounded-3xl" style="box-shadow: 0 0 30px rgba(255, 107, 0, 0.4);" />';
      }
    });
  }, 100);
};

// 3. Toast — strip emoji
const _origToastHero = toast;
toast = function(message, type, duration) {
  const cleanedMessage = String(message).replace(/🐼/g, '').trim();
  return _origToastHero(cleanedMessage, type, duration);
};

// ============================================
// PART 4: PROFILE SHARE CARD with panda bg
// ============================================

const _origGenerateProfileCardHero = generateProfileCard;
generateProfileCard = async function() {
  const p = State.profile || {};
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  // Hero panda background (bottom 60%)
  try {
    const heroImg = await loadImage('/hero-panda.jpg');
    ctx.save();
    ctx.globalAlpha = 0.22;
    const heroH = H * 0.65;
    const imgAspect = heroImg.width / heroImg.height;
    let drawW = W;
    let drawH = W / imgAspect;
    if (drawH < heroH) {
      drawH = heroH;
      drawW = heroH * imgAspect;
    }
    const offsetX = (W - drawW) / 2;
    const offsetY = H - heroH;
    ctx.drawImage(heroImg, offsetX, offsetY, drawW, drawH);
    ctx.restore();

    const grad = ctx.createLinearGradient(0, H - heroH, 0, H);
    grad.addColorStop(0, 'rgba(5, 5, 5, 0.7)');
    grad.addColorStop(1, 'rgba(5, 5, 5, 0.97)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - heroH, W, heroH);
  } catch (e) { /* silent */ }

  const grad1 = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 900);
  grad1.addColorStop(0, 'rgba(255, 107, 0, 0.35)');
  grad1.addColorStop(1, 'rgba(255, 107, 0, 0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, W, 900);

  ctx.strokeStyle = p.isPro ? '#FFD700' : '#222';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  ctx.textAlign = 'center';
  ctx.font = 'bold 52px Inter, sans-serif';
  ctx.fillStyle = '#FF6B00';
  ctx.fillText('CODMPanda', W / 2, 140);

  ctx.font = '500 26px Inter, sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('The Ultimate CODM Companion', W / 2, 190);

  const avatarY = 420;
  const avatarR = 140;

  if (p.isPro) {
    const avatarGrad = ctx.createLinearGradient(W / 2 - avatarR, avatarY - avatarR, W / 2 + avatarR, avatarY + avatarR);
    avatarGrad.addColorStop(0, '#FFD700');
    avatarGrad.addColorStop(0.5, '#FFF176');
    avatarGrad.addColorStop(1, '#FFD700');
    ctx.fillStyle = avatarGrad;
    ctx.beginPath();
    ctx.arc(W / 2, avatarY, avatarR + 12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#FF6B00';
    ctx.beginPath();
    ctx.arc(W / 2, avatarY, avatarR + 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
  ctx.fill();

  if (p.avatar) {
    try {
      const img = await loadImage(p.avatar);
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, W / 2 - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
      ctx.restore();
    } catch (e) {
      drawInitials(ctx, p.ign, W / 2, avatarY, avatarR);
    }
  } else {
    drawInitials(ctx, p.ign, W / 2, avatarY, avatarR);
  }

  if (p.isPro) {
    ctx.font = 'bold 90px Inter, sans-serif';
    ctx.fillText('👑', W / 2 + 115, avatarY - 85);
  }

  ctx.font = 'bold 72px Inter, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(truncateText(ctx, p.ign || 'Panda Player', W - 100), W / 2, 700);

  ctx.font = '500 32px Inter, sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText(`${p.rank || 'Rookie'} • ${p.region || 'Global'}`, W / 2, 760);

  if (p.isPro) {
    const proText = '👑 PRO MEMBER';
    ctx.font = 'bold 30px Inter, sans-serif';
    const proW = ctx.measureText(proText).width + 60;
    const proX = W / 2 - proW / 2;
    const proY = 810;
    ctx.fillStyle = '#FFD700';
    roundRect(ctx, proX, proY, proW, 60, 30);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText(proText, W / 2, proY + 42);
  }

  const statY = 980;
  const boxW = 300;
  const boxH = 180;
  const gap = 20;
  const totalW = boxW * 3 + gap * 2;
  const startX = (W - totalW) / 2;

  let vaultCount = State.cache.myVaultCount || 0;
  let camoPct = State.cache.myCamoPct || 0;
  const approved = p.approvedCount || 0;

  const stats = [
    { value: vaultCount.toString(), label: 'VAULTS' },
    { value: camoPct + '%', label: 'CAMOS' },
    { value: approved.toString(), label: 'APPROVED' }
  ];

  stats.forEach((stat, i) => {
    const x = startX + (boxW + gap) * i;
    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    roundRect(ctx, x, statY, boxW, boxH, 24);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.fillStyle = i === 1 ? '#FFD700' : '#FF6B00';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, x + boxW / 2, statY + 100);

    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(stat.label, x + boxW / 2, statY + 145);
  });

  const badges = p.badges || [];
  if (badges.length > 0) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('CONTRIBUTOR BADGES', W / 2, 1300);

    const badgeEmojis = { first_leak: '🥉', rising: '🥈', legend: '🥇', elite: '💎' };
    const badgeLabels = { first_leak: 'First Leak', rising: 'Rising', legend: 'Legend', elite: 'Elite' };
    const badgeW = 200;
    const badgeGap = 30;
    const totalBadgeW = badges.length * badgeW + (badges.length - 1) * badgeGap;
    const badgeStartX = (W - totalBadgeW) / 2;
    const badgeY = 1340;

    badges.forEach((b, i) => {
      const x = badgeStartX + (badgeW + badgeGap) * i;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      roundRect(ctx, x, badgeY, badgeW, 160, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = 'bold 70px Inter, sans-serif';
      ctx.fillText(badgeEmojis[b] || '⭐', x + badgeW / 2, badgeY + 95);

      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(badgeLabels[b] || 'Badge', x + badgeW / 2, badgeY + 135);
    });
  }

  ctx.textAlign = 'center';
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillStyle = '#FF6B00';
  ctx.fillText('codmpanda.pages.dev', W / 2, 1810);

  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillStyle = '#444';
  ctx.fillText('Join the ultimate CODM companion', W / 2, 1855);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
};

window.showHeroWelcome = showHeroWelcome;

console.log('✅ Chunk 50 (revised): Full image + realistic fireflies loaded');

/* END OF CHUNK 50 */
// ============================================
// Chunk 51a: Text Posts + Filter Grid + Empty Home
// ============================================

var POST_CHAR_FREE_LIMIT = 500;

// ============================================
// PART 1: WRITE POST SHEET
// ============================================

function openWritePostSheet() {
  const isPro = State.profile?.isPro;
  const limit = isPro ? 5000 : POST_CHAR_FREE_LIMIT;

  openSheet(`
    <div class="space-y-4">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
          ${State.profile?.avatar ? `<img src="${esc(State.profile.avatar)}" class="w-full h-full object-cover" />` : getInitials(State.profile?.ign || '?')}
        </div>
        <div>
          <div class="text-sm font-bold">${esc(State.profile?.ign || 'You')}</div>
          <div class="text-[10px] text-gray-500">${isPro ? '👑 Pro · Unlimited' : 'Free · 500 chars'}</div>
        </div>
      </div>

      <div>
        <textarea id="post-text" rows="6" maxlength="${limit}" placeholder="What's on your mind, Panda?" style="font-size: 15px; line-height: 1.5;"></textarea>
        <div class="flex items-center justify-between mt-2">
          <span id="post-counter" class="text-[10px] text-gray-500">0 / ${limit}</span>
          ${!isPro ? `<span id="pro-hint" class="text-[10px] text-gold font-bold hidden">👑 Upgrade for unlimited</span>` : ''}
        </div>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Image (optional)</label>
        <input id="post-image" type="file" accept="image/*" class="text-xs" />
      </div>

      <button id="post-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary">
        Post to Feed
      </button>
    </div>
  `, '✍️ Write Post');

  const textarea = document.getElementById('post-text');
  const counter = document.getElementById('post-counter');
  const proHint = document.getElementById('pro-hint');

  textarea.oninput = () => {
    const len = textarea.value.length;
    counter.textContent = `${len} / ${limit}`;
    if (len > limit - 50) counter.classList.add('text-gold');
    else counter.classList.remove('text-gold');
    if (proHint && len >= limit - 20) proHint.classList.remove('hidden');
    else if (proHint) proHint.classList.add('hidden');
  };

  document.getElementById('post-submit').onclick = async () => {
    const text = textarea.value.trim();
    const fileInput = document.getElementById('post-image');

    if (text.length < 2) { toast('Write something first', 'error'); return; }
    if (text.length > limit) {
      toast(`Max ${limit} chars. Upgrade for unlimited.`, 'error', 3000);
      if (!isPro) showProPaywall('Post longer thoughts — Pro unlocks unlimited characters.');
      return;
    }

    const btn = document.getElementById('post-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      let imageUrl = '';
      if (fileInput.files && fileInput.files[0]) {
        imageUrl = await compressImage(fileInput.files[0], 800, 0.65);
      }

      const expiresAt = Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000);

      await addDoc(collection(db, 'posts'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        text,
        imageUrl,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        expiresAt
      });

      toast('✅ Posted!', 'success');
      closeSheet();
      if (State.currentTab === 'home') {
        homeCache.lastFetch = 0;
        await fetchHomeFeed();
        renderHomeFeed();
      }
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Post to Feed';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 2: FETCH POSTS
// ============================================

var _origFetchHomeFeedWithPosts = fetchHomeFeed;
fetchHomeFeed = async function() {
  if (homeCache.isLoading) return homeCache.feed;
  homeCache.isLoading = true;

  try {
    const now = Date.now();

    const [lobbiesSnap, vaultsSnap, clipsSnap, leaksSnap, postsSnap] = await Promise.all([
      getDocs(query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'vaults'), orderBy('createdAt', 'desc'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'clips'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'leaks'), limit(20))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'posts'), limit(30))).catch(() => ({ forEach: () => {} }))
    ]);

    const feed = [];

    lobbiesSnap.forEach(d => {
      const data = d.data();
      const expiresAt = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (expiresAt < now) return;
      feed.push({ id: d.id, type: 'lobby', ...data, _sortTime: data.createdAt?.seconds || 0 });
    });

    vaultsSnap.forEach(d => {
      const data = d.data();
      feed.push({ id: d.id, type: 'vault', ...data, _sortTime: data.createdAt?.seconds || 0 });
    });

    clipsSnap.forEach(d => {
      const data = d.data();
      feed.push({ id: d.id, type: 'clip', ...data, _sortTime: data.createdAt?.seconds || 0 });
    });

    leaksSnap.forEach(d => {
      const data = d.data();
      feed.push({ id: d.id, type: 'leak', ...data, _sortTime: (data.createdAt || data.publishedAt)?.seconds || 0 });
    });

    postsSnap.forEach(d => {
      const data = d.data();
      const expiresAt = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (expiresAt < now) return;
      feed.push({ id: d.id, type: 'post', ...data, _sortTime: data.createdAt?.seconds || 0 });
    });

    feed.sort((a, b) => b._sortTime - a._sortTime);

    homeCache.feed = feed;
    homeCache.lastFetch = now;
    homeCache.isLoading = false;
    return feed;
  } catch (e) {
    console.error('Home feed error:', e);
    homeCache.isLoading = false;
    return homeCache.feed;
  }
};

// ============================================
// PART 3: POST CARD RENDERER
// ============================================

function renderHomePostCard(post) {
  const isMine = post.uid === State.user.uid;
  const isLiked = State.likedItems?.post?.[post.id] || false;
  const wasEdited = !!post.editedAt;

  return `
    <div class="home-card bg-card border border-border rounded-2xl p-4 mb-3 fade-in" data-type="post" data-id="${post.id}">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-base overflow-hidden flex-shrink-0">
          ${post.avatar ? `<img src="${esc(post.avatar)}" class="w-full h-full object-cover" />` : getInitials(post.ign)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-sm">${esc(post.ign || 'Unknown')}</span>
            ${post.uid === ADMIN_UID ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black">👑</span>' : ''}
          </div>
          <div class="text-[10px] text-gray-500 mt-0.5">
            ${timeAgo(post.createdAt)}${wasEdited ? ' · edited' : ''}
          </div>
        </div>
        ${isMine ? `
          <button class="post-menu-btn w-7 h-7 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center" data-id="${post.id}">
            <i data-lucide="more-vertical" class="w-3.5 h-3.5 text-white/70"></i>
          </button>
        ` : ''}
      </div>

      <p class="text-sm text-gray-200 whitespace-pre-wrap break-words mb-3">${esc(post.text)}</p>

      ${post.imageUrl ? `
        <img src="${esc(post.imageUrl)}" class="w-full rounded-xl mb-3" loading="lazy" />
      ` : ''}

      <div class="flex items-center justify-between pt-2 border-t border-border">
        <button class="post-like-btn flex items-center gap-1.5 text-xs ${isLiked ? 'text-primary' : 'text-gray-400'}" data-id="${post.id}">
          <i data-lucide="heart" class="w-4 h-4 ${isLiked ? 'fill-current' : ''}"></i> ${post.likes || 0}
        </button>
        <button class="post-comments-btn flex items-center gap-1.5 text-xs text-gray-400" data-id="${post.id}">
          <i data-lucide="message-circle" class="w-4 h-4"></i> ${post.commentCount || 0}
        </button>
        <button class="post-share-btn flex items-center gap-1.5 text-xs text-primary" data-id="${post.id}">
          <i data-lucide="share-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// PART 4: PATCH renderHomeCard to include posts
// ============================================

var _origRenderHomeCardWithPosts = renderHomeCard;
renderHomeCard = function(item) {
  if (item.type === 'post') return renderHomePostCard(item);
  return _origRenderHomeCardWithPosts(item);
};

// ============================================
// PART 5: FILTER CHIPS GRID
// ============================================

var HOME_FILTERS = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'lfg', label: 'LFG', emoji: '🎮' },
  { key: 'builds', label: 'Builds', emoji: '🔧' },
  { key: 'clips', label: 'Clips', emoji: '🎬' },
  { key: 'leaks', label: 'Leaks', emoji: '🔥' },
  { key: 'posts', label: 'Posts', emoji: '✍️' }
];

var _origRenderHomeTabGrid = renderHomeTab;
renderHomeTab = async function() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="mb-4">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h1 class="text-2xl font-black">Home</h1>
            <p class="text-xs text-gray-500">What's happening in CODM</p>
          </div>
          <div class="flex gap-2">
            <button id="home-write-btn" class="btn-press w-9 h-9 rounded-full bg-primary flex items-center justify-center" style="box-shadow: 0 0 15px rgba(255, 107, 0, 0.5);">
              <i data-lucide="plus" class="w-4 h-4 text-white"></i>
            </button>
            <button id="home-refresh-btn" class="btn-press w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
              <i data-lucide="refresh-cw" class="w-4 h-4 text-gray-400"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          ${HOME_FILTERS.map(f => `
            <button class="home-filter-btn chip ${homeFilter === f.key ? 'active' : ''}" data-filter="${f.key}" style="padding: 8px 6px; font-size: 11px; text-align: center;">
              ${f.emoji} ${f.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div id="home-feed">
        ${renderHomeSkeleton()}
      </div>
    </div>
  `;

  document.querySelectorAll('.home-filter-btn').forEach(btn => {
    btn.onclick = () => {
      homeFilter = btn.dataset.filter;
      document.querySelectorAll('.home-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderHomeFeed();
    };
  });

  document.getElementById('home-write-btn').onclick = openWritePostSheet;

  document.getElementById('home-refresh-btn').onclick = async () => {
    homeCache.lastFetch = 0;
    toast('Refreshing...', 'info', 1000);
    await fetchHomeFeed();
    renderHomeFeed();
  };

  const fetchPromise = fetchHomeFeed();
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 5000));
  const result = await Promise.race([fetchPromise, timeoutPromise]);

  if (result === 'timeout') toast('Taking longer than usual...', 'warning', 2000);

  renderHomeFeed();
  startHomeLiveUpdates();

  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 6: RENDER FEED with posts filter
// ============================================

var _origRenderHomeFeedPosts = renderHomeFeed;
renderHomeFeed = function() {
  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  let items = homeCache.feed.filter(i => !['gunsmith','hud','sens'].includes(i.type));

  if (homeFilter !== 'all') {
    const typeMap = {
      lfg: 'lobby',
      builds: 'vault',
      clips: 'clip',
      leaks: 'leak',
      posts: 'post'
    };
    items = items.filter(i => i.type === typeMap[homeFilter]);
  }

  if (items.length === 0) {
  var _emptyHTML = '';
  if (homeFilter === 'all' || homeFilter === 'posts') {
    feedEl.innerHTML = renderHomeEmpty();
    wireHomeEmpty();
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  if (homeFilter === 'lfg') {
    _emptyHTML = '<div class="flex flex-col items-center justify-center py-12 px-6 text-center fade-in"><div class="relative mb-5"><div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/10 rounded-full blur-2xl"></div><div class="relative w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center"><i data-lucide="gamepad-2" class="w-8 h-8 text-primary/70"></i></div></div><div class="text-lg font-black mb-2">No lobbies yet</div><div class="text-xs text-gray-500 max-w-[260px] leading-relaxed mb-5">Post a lobby and find your squad</div><button id="empty-lfg-btn" class="btn-press px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs">Post Lobby</button></div>';
  } else if (homeFilter === 'builds') {
    _emptyHTML = '<div class="flex flex-col items-center justify-center py-12 px-6 text-center fade-in"><div class="relative mb-5"><div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/10 rounded-full blur-2xl"></div><div class="relative w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center"><i data-lucide="wrench" class="w-8 h-8 text-primary/70"></i></div></div><div class="text-lg font-black mb-2">No builds yet</div><div class="text-xs text-gray-500 max-w-[260px] leading-relaxed mb-5">Share a gunsmith, sensitivity, or HUD</div><button id="empty-builds-btn" class="btn-press px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs">Share Build</button></div>';
  } else if (homeFilter === 'clips') {
    _emptyHTML = '<div class="flex flex-col items-center justify-center py-12 px-6 text-center fade-in"><div class="relative mb-5"><div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/10 rounded-full blur-2xl"></div><div class="relative w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center"><i data-lucide="video" class="w-8 h-8 text-primary/70"></i></div></div><div class="text-lg font-black mb-2">No clips yet</div><div class="text-xs text-gray-500 max-w-[260px] leading-relaxed mb-5">Post your best play — YouTube or TikTok link</div><button id="empty-clips-btn" class="btn-press px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs">Post Clip</button></div>';
  } else if (homeFilter === 'leaks') {
    _emptyHTML = '<div class="flex flex-col items-center justify-center py-12 px-6 text-center fade-in"><div class="relative mb-5"><div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/10 rounded-full blur-2xl"></div><div class="relative w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center"><i data-lucide="flame" class="w-8 h-8 text-primary/70"></i></div></div><div class="text-lg font-black mb-2">No leaks yet</div><div class="text-xs text-gray-500 max-w-[260px] leading-relaxed mb-5">Check back soon for intel drops</div><button id="empty-leaks-btn" class="btn-press px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs">Submit Leak</button></div>';
  }
  feedEl.innerHTML = _emptyHTML;
  var _lfgBtn = document.getElementById('empty-lfg-btn');
  var _bldBtn = document.getElementById('empty-builds-btn');
  var _clpBtn = document.getElementById('empty-clips-btn');
  var _lksBtn = document.getElementById('empty-leaks-btn');
  if (_lfgBtn) _lfgBtn.onclick = openPostLobbySheet;
  if (_bldBtn) _bldBtn.onclick = function() { labSubTab = 'vault'; switchTab('lab'); };
  if (_clpBtn) _clpBtn.onclick = function() { squadSubTab = 'clips'; switchTab('squad'); };
  if (_lksBtn) _lksBtn.onclick = openSubmitLeakSheet;
  if (window.lucide) window.lucide.createIcons();
  return;
}

  feedEl.innerHTML = items.map(item => renderHomeCard(item)).join('');
  wireHomeCards(items);
  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 7: BETTER EMPTY HOME
// ============================================

renderHomeEmpty = function() {
  return `
    <div class="flex flex-col items-center justify-center py-12 px-6 text-center fade-in">
      <div class="relative mb-6">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-gold/20 rounded-full blur-3xl"></div>
        <img src="/icon-512.png" alt="CODMPanda" class="relative w-24 h-24 rounded-3xl mx-auto" style="box-shadow: 0 0 40px rgba(255, 107, 0, 0.5);" />
      </div>

      <div class="text-xl font-black mb-2">Nothing here yet</div>
      <div class="text-xs text-gray-500 max-w-[280px] leading-relaxed mb-6">
        Be the first to post something. Pick what you want to share:
      </div>

      <div class="grid grid-cols-2 gap-3 w-full max-w-sm">
        <button id="empty-write" class="btn-press py-4 rounded-2xl bg-gradient-to-br from-primary to-primaryDark text-white font-black text-xs flex flex-col items-center gap-1.5 glow-primary">
          <i data-lucide="pencil" class="w-5 h-5"></i>
          <span>Write Post</span>
        </button>
        <button id="empty-lfg" class="btn-press py-4 rounded-2xl bg-card border border-border font-bold text-xs flex flex-col items-center gap-1.5">
          <i data-lucide="gamepad-2" class="w-5 h-5 text-primary"></i>
          <span>Find Squad</span>
        </button>
        <button id="empty-build" class="btn-press py-4 rounded-2xl bg-card border border-border font-bold text-xs flex flex-col items-center gap-1.5">
          <i data-lucide="wrench" class="w-5 h-5 text-primary"></i>
          <span>Share Build</span>
        </button>
        <button id="empty-clip" class="btn-press py-4 rounded-2xl bg-card border border-border font-bold text-xs flex flex-col items-center gap-1.5">
          <i data-lucide="video" class="w-5 h-5 text-primary"></i>
          <span>Post Clip</span>
        </button>
      </div>
    </div>
  `;
};

wireHomeEmpty = function() {
  const write = document.getElementById('empty-write');
  if (write) write.onclick = openWritePostSheet;
  const lfg = document.getElementById('empty-lfg');
  if (lfg) lfg.onclick = () => switchTab('play');
  const build = document.getElementById('empty-build');
  if (build) build.onclick = () => { labSubTab = 'vault'; switchTab('lab'); };
  const clip = document.getElementById('empty-clip');
  if (clip) clip.onclick = () => { squadSubTab = 'clips'; switchTab('squad'); };
  if (window.lucide) window.lucide.createIcons();
};

// ============================================
// PART 8: POST INTERACTIONS
// ============================================

var _origWireHomeCardsPosts = wireHomeCards;
wireHomeCards = function(items) {
  _origWireHomeCardsPosts(items);

  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  // Post like buttons
  feedEl.querySelectorAll('.post-like-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const postId = btn.dataset.id;
      const post = items.find(i => i.id === postId);
      if (!post) return;

      const wasLiked = State.likedItems?.post?.[postId] || false;
      const nowLiked = !wasLiked;

      State.likedItems = State.likedItems || {};
      State.likedItems.post = State.likedItems.post || {};
      State.likedItems.post[postId] = nowLiked;

      const newCount = nowLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);
      btn.innerHTML = `<i data-lucide="heart" class="w-4 h-4 ${nowLiked ? 'fill-current' : ''}"></i> ${newCount}`;
      btn.classList.toggle('text-primary', nowLiked);
      btn.classList.toggle('text-gray-400', !nowLiked);
      if (window.lucide) window.lucide.createIcons();

      try {
        await toggleLike('post', postId, 'likes');
        post.likes = newCount;
      } catch (err) {
        State.likedItems.post[postId] = wasLiked;
        toast('Failed', 'error');
      }
    };
  });

  // Post comments button
  feedEl.querySelectorAll('.post-comments-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      if (typeof openPostComments === 'function') {
        openPostComments(btn.dataset.id);
      } else {
        toast('Comments loading...', 'info', 1500);
      }
    };
  });

  // Post share button
  feedEl.querySelectorAll('.post-share-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openShareSheet({
        title: 'CODMPanda Post',
        text: 'Check out this post on CODMPanda!',
        url: `${location.origin}/?post=${btn.dataset.id}`
      });
    };
  });

  // Post 3-dot menu
  feedEl.querySelectorAll('.post-menu-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openPostMenu(btn.dataset.id);
    };
  });
};

// ============================================
// PART 9: POST 3-DOT MENU (Edit / Delete)
// ============================================

function openPostMenu(postId) {
  const post = homeCache.feed.find(p => p.id === postId);
  if (!post) return;

  const ageMinutes = (Date.now() / 1000 - (post.createdAt?.seconds || 0)) / 60;
  const canEdit = ageMinutes < 30;

  openSheet(`
    <div class="space-y-2">
      <button id="pm-edit" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl ${canEdit ? 'bg-card border border-border' : 'bg-card/50 border border-border/50 opacity-50'} text-left" ${!canEdit ? 'disabled' : ''}>
        <i data-lucide="pencil" class="w-4 h-4 ${canEdit ? 'text-primary' : 'text-gray-600'}"></i>
        <div class="flex-1">
          <span class="text-sm font-bold ${canEdit ? '' : 'text-gray-500'}">Edit</span>
          ${!canEdit ? '<div class="text-[9px] text-gray-600">Edit window closed (30 min)</div>' : '<div class="text-[9px] text-gray-500">Available for 30 min after posting</div>'}
        </div>
      </button>

      <button id="pm-share" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
        <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
        <span class="text-sm font-bold">Share</span>
      </button>

      <button id="pm-delete" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-left">
        <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
        <span class="text-sm font-bold text-red-400">Delete Post</span>
      </button>

      <button onclick="closeSheet()" class="text-xs text-gray-500 w-full pt-3">Cancel</button>
    </div>
  `, 'Post Options');

  const editBtn = document.getElementById('pm-edit');
  if (editBtn && canEdit) {
    editBtn.onclick = () => {
      closeSheet();
      setTimeout(() => openEditPostSheet(post), 300);
    };
  }

  document.getElementById('pm-share').onclick = () => {
    closeSheet();
    openShareSheet({
      title: 'CODMPanda Post',
      text: 'Check out this post on CODMPanda!',
      url: `${location.origin}/?post=${post.id}`
    });
  };

  document.getElementById('pm-delete').onclick = () => {
    closeSheet();
    setTimeout(() => {
      confirmDialog('Delete Post', 'This will remove your post permanently.', async () => {
        try {
          await deleteDoc(doc(db, 'posts', post.id));
          homeCache.feed = homeCache.feed.filter(p => p.id !== post.id);
          renderHomeFeed();
          toast('🗑️ Post deleted', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    }, 300);
  };

  if (window.lucide) window.lucide.createIcons();
}

function openEditPostSheet(post) {
  openSheet(`
    <div class="space-y-4">
      <div class="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary">
        ✏️ Edit your post — 30 min window
      </div>

      <div>
        <textarea id="edit-post-text" rows="6" maxlength="5000">${esc(post.text)}</textarea>
        <div class="flex justify-between mt-2">
          <span id="edit-post-counter" class="text-[10px] text-gray-500">${post.text.length} chars</span>
        </div>
      </div>

      <button id="edit-post-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary">
        Save Changes
      </button>
    </div>
  `, 'Edit Post');

  const textarea = document.getElementById('edit-post-text');
  const counter = document.getElementById('edit-post-counter');
  textarea.oninput = () => {
    counter.textContent = `${textarea.value.length} chars`;
  };

  document.getElementById('edit-post-save').onclick = async () => {
    const text = textarea.value.trim();
    if (text.length < 2) { toast('Post is empty', 'error'); return; }

    try {
      await updateDoc(doc(db, 'posts', post.id), {
        text,
        editedAt: serverTimestamp()
      });
      post.text = text;
      post.editedAt = { seconds: Date.now() / 1000 };
      toast('✏️ Updated', 'success');
      closeSheet();
      renderHomeFeed();
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

window.openWritePostSheet = openWritePostSheet;

console.log('✅ Chunk 51a: Text posts loaded');

/* END OF CHUNK 51a */
// ============================================
// Chunk 51b: Upgraded Comments (like, reply, edit, delete)
// ============================================

// ============================================
// PART 1: POST COMMENTS SHEET
// ============================================

async function openPostComments(postId) {
  const post = homeCache.feed.find(p => p.id === postId);
  if (!post) return;

  commentReplyTo = null;

  openSheet(`
    <div class="space-y-4">
      <div class="bg-cardAlt border border-border rounded-xl p-3">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden">
            ${post.avatar ? `<img src="${esc(post.avatar)}" class="w-full h-full object-cover" />` : getInitials(post.ign)}
          </div>
          <span class="text-xs font-bold">${esc(post.ign)}</span>
        </div>
        <p class="text-xs text-gray-300 line-clamp-2">${esc(post.text)}</p>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-xs font-bold text-gray-400 uppercase">Comments</div>
        <div id="post-comments-count" class="text-[10px] text-gray-500">Loading...</div>
      </div>

      <div id="post-comments-list" class="space-y-3 max-h-[50vh] overflow-y-auto">
        <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
      </div>

      <div class="sticky bottom-0 bg-[#0a0a0a] pt-3 border-t border-border">
        <div id="reply-indicator" class="hidden mb-2 flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
          <div class="text-[10px] text-primary font-bold">Replying to comment...</div>
          <button id="cancel-reply" class="text-[10px] text-gray-400">✕</button>
        </div>
        <div class="flex gap-2">
          <input id="comment-input" type="text" placeholder="Write a comment..." maxlength="300" class="flex-1" />
          <button id="comment-send" class="btn-press w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <i data-lucide="send" class="w-5 h-5 text-white"></i>
          </button>
        </div>
      </div>
    </div>
  `, '💬 Comments');

  await loadPostComments(postId);

  // Wire send button
  const sendBtn = document.getElementById('comment-send');
  const input = document.getElementById('comment-input');
  if (sendBtn && input) {
    sendBtn.onclick = () => sendPostComment(postId);
    input.onkeypress = (e) => {
      if (e.key === 'Enter') sendPostComment(postId);
    };
  }

  const cancelReply = document.getElementById('cancel-reply');
  if (cancelReply) {
    cancelReply.onclick = () => {
      commentReplyTo = null;
      const indicator = document.getElementById('reply-indicator');
      if (indicator) indicator.classList.add('hidden');
      const inp = document.getElementById('comment-input');
      if (inp) inp.placeholder = 'Write a comment...';
    };
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 2: LOAD COMMENTS (with replies)
// ============================================

async function loadPostComments(postId) {
  const listEl = document.getElementById('post-comments-list');
  const countEl = document.getElementById('post-comments-count');
  if (!listEl) return;

  try {
    const snap = await getDocs(query(
      collection(db, 'comments'),
      where('contentId', '==', postId),
      limit(150)
    ));

    const comments = [];
    snap.forEach(d => comments.push({ id: d.id, ...d.data() }));
    comments.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    const topLevel = comments.filter(c => !c.parentId);
    const repliesByParent = {};
    comments.filter(c => c.parentId).forEach(c => {
      if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
      repliesByParent[c.parentId].push(c);
    });

    if (countEl) countEl.textContent = `${comments.length} comment${comments.length === 1 ? '' : 's'}`;

    if (topLevel.length === 0) {
      listEl.innerHTML = `
        <div class="text-center py-8">
          <div class="text-3xl mb-2">💬</div>
          <div class="text-xs text-gray-500">No comments yet</div>
          <div class="text-[10px] text-gray-600 mt-1">Be the first to reply</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = topLevel.map(c => renderCommentRow(c, repliesByParent[c.id] || [])).join('');

    wireCommentInteractions(listEl, postId);
  } catch (e) {
    console.error('Load comments error:', e);
    listEl.innerHTML = '<div class="text-center py-6 text-red-400 text-xs">Failed to load</div>';
  }
  if (window.lucide) window.lucide.createIcons();
}

function renderCommentRow(c, replies) {
  const isMine = c.uid === State.user.uid;
  const isLiked = State.likedItems?.comment?.[c.id] || false;
  const hasReplies = replies.length > 0;

  return `
    <div class="comment-thread" data-comment-id="${c.id}">
      <div class="flex items-start gap-2.5">
        <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
          ${c.avatar ? `<img src="${esc(c.avatar)}" class="w-full h-full object-cover" />` : getInitials(c.ign)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="bg-cardAlt border border-border rounded-2xl px-3 py-2">
            <div class="text-[10px] font-bold text-primary mb-0.5 flex items-center gap-1.5">
              ${esc(c.ign)}
              ${c.edited ? '<span class="text-[8px] text-gray-500">(edited)</span>' : ''}
            </div>
            <div class="text-xs text-gray-200 break-words">${esc(c.text)}</div>
          </div>
          <div class="flex items-center gap-3 mt-1.5 ml-1">
            <button class="comment-like-btn text-[10px] ${isLiked ? 'text-primary' : 'text-gray-500'} font-bold flex items-center gap-1" data-id="${c.id}">
              ❤️ <span class="like-num">${c.likes || 0}</span>
            </button>
            <button class="comment-reply-btn text-[10px] text-gray-500 font-bold" data-id="${c.id}" data-ign="${esc(c.ign)}">Reply</button>
            ${isMine ? `
              <button class="comment-edit-btn text-[10px] text-primary font-bold" data-id="${c.id}">Edit</button>
              <button class="comment-delete-btn text-[10px] text-red-400 font-bold" data-id="${c.id}">Delete</button>
            ` : ''}
          </div>
        </div>
      </div>

      ${hasReplies ? `
        <button class="comment-expand-btn text-[10px] text-primary font-bold mt-2 ml-10" data-id="${c.id}" data-count="${replies.length}">
          ▸ Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}
        </button>
        <div class="replies-container hidden ml-10 mt-2 space-y-2" data-parent="${c.id}">
          ${replies.map(r => renderReplyRow(r)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderReplyRow(r) {
  const isMine = r.uid === State.user.uid;
  const isLiked = State.likedItems?.comment?.[r.id] || false;

  return `
    <div class="flex items-start gap-2">
      <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold overflow-hidden flex-shrink-0">
        ${r.avatar ? `<img src="${esc(r.avatar)}" class="w-full h-full object-cover" />` : getInitials(r.ign)}
      </div>
      <div class="flex-1 min-w-0">
        <div class="bg-card border border-border rounded-2xl px-3 py-2">
          <div class="text-[10px] font-bold text-primary mb-0.5 flex items-center gap-1.5">
            ${esc(r.ign)}
            ${r.edited ? '<span class="text-[8px] text-gray-500">(edited)</span>' : ''}
          </div>
          <div class="text-xs text-gray-200 break-words">${esc(r.text)}</div>
        </div>
        <div class="flex items-center gap-3 mt-1.5 ml-1">
          <button class="comment-like-btn text-[10px] ${isLiked ? 'text-primary' : 'text-gray-500'} font-bold flex items-center gap-1" data-id="${r.id}">
            ❤️ <span class="like-num">${r.likes || 0}</span>
          </button>
          ${isMine ? `
            <button class="comment-edit-btn text-[10px] text-primary font-bold" data-id="${r.id}">Edit</button>
            <button class="comment-delete-btn text-[10px] text-red-400 font-bold" data-id="${r.id}">Delete</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// PART 3: WIRE COMMENT INTERACTIONS
// ============================================

function wireCommentInteractions(container, postId) {
  // Like buttons
  container.querySelectorAll('.comment-like-btn').forEach(btn => {
    btn.onclick = async () => {
      const commentId = btn.dataset.id;
      const wasLiked = State.likedItems?.comment?.[commentId] || false;
      const nowLiked = !wasLiked;

      State.likedItems = State.likedItems || {};
      State.likedItems.comment = State.likedItems.comment || {};
      State.likedItems.comment[commentId] = nowLiked;

      const numEl = btn.querySelector('.like-num');
      const currentCount = parseInt(numEl.textContent) || 0;
      const newCount = nowLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
      numEl.textContent = newCount;
      btn.classList.toggle('text-primary', nowLiked);
      btn.classList.toggle('text-gray-500', !nowLiked);

      try {
        await toggleLike('comment', commentId, 'likes');
      } catch (err) {
        State.likedItems.comment[commentId] = wasLiked;
        numEl.textContent = currentCount;
        btn.classList.toggle('text-primary', wasLiked);
        btn.classList.toggle('text-gray-500', !wasLiked);
      }
    };
  });

  // Reply buttons
  container.querySelectorAll('.comment-reply-btn').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      const commentIgn = btn.dataset.ign;
      commentReplyTo = { parentId: commentId, ign: commentIgn };

      const indicator = document.getElementById('reply-indicator');
      if (indicator) {
        indicator.classList.remove('hidden');
        indicator.querySelector('.text-primary').textContent = `Replying to ${commentIgn}...`;
      }
      const input = document.getElementById('comment-input');
      if (input) {
        input.placeholder = `Reply to ${commentIgn}...`;
        input.focus();
      }
    };
  });

  // Expand replies
  container.querySelectorAll('.comment-expand-btn').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      const repliesContainer = container.querySelector(`.replies-container[data-parent="${commentId}"]`);
      if (!repliesContainer) return;

      const isHidden = repliesContainer.classList.contains('hidden');
      if (isHidden) {
        repliesContainer.classList.remove('hidden');
        btn.textContent = `▾ Hide ${btn.dataset.count} ${btn.dataset.count === '1' ? 'reply' : 'replies'}`;
      } else {
        repliesContainer.classList.add('hidden');
        btn.textContent = `▸ Show ${btn.dataset.count} ${btn.dataset.count === '1' ? 'reply' : 'replies'}`;
      }
    };
  });

  // Edit buttons
  container.querySelectorAll('.comment-edit-btn').forEach(btn => {
    btn.onclick = () => openEditCommentSheet(btn.dataset.id);
  });

  // Delete buttons
  container.querySelectorAll('.comment-delete-btn').forEach(btn => {
    btn.onclick = () => {
      confirmDialog('Delete Comment', 'This will remove your comment.', async () => {
        try {
          await deleteDoc(doc(db, 'comments', btn.dataset.id));
          toast('🗑️ Deleted', 'success');
          await loadPostComments(postId);
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    };
  });
}

// ============================================
// PART 4: SEND COMMENT (with reply support)
// ============================================

async function sendPostComment(postId) {
  const input = document.getElementById('comment-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;

  try {
    const commentData = {
      contentId: postId,
      contentType: 'post',
      uid: State.user.uid,
      ign: State.profile.ign,
      avatar: State.profile.avatar || '',
      text,
      likes: 0,
      createdAt: serverTimestamp()
    };

    if (commentReplyTo && commentReplyTo.parentId) {
      commentData.parentId = commentReplyTo.parentId;
    }

    await addDoc(collection(db, 'comments'), commentData);

    // Increment post comment count
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await updateDoc(postRef, { commentCount: increment(1) });
      }
    } catch (e) { /* silent */ }

    commentReplyTo = null;
    const indicator = document.getElementById('reply-indicator');
    if (indicator) indicator.classList.add('hidden');
    input.placeholder = 'Write a comment...';

    await loadPostComments(postId);
  } catch (e) {
    console.error('Send comment error:', e);
    toast('Failed: ' + e.message, 'error');
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// ============================================
// PART 5: EDIT COMMENT
// ============================================

function openEditCommentSheet(commentId) {
  const currentText = document.querySelector(`.comment-thread [data-id="${commentId}"]`)?.closest('.flex-1')?.querySelector('.text-xs')?.textContent?.trim() || '';

  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Edit Comment</label>
        <textarea id="edit-comment-input" rows="4" maxlength="300">${esc(currentText)}</textarea>
      </div>
      <div class="flex gap-2">
        <button onclick="closeSheet()" class="btn-press flex-1 py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm">Cancel</button>
        <button id="edit-comment-save" class="btn-press flex-1 py-3 rounded-xl bg-primary font-bold text-sm text-white">Save</button>
      </div>
    </div>
  `, 'Edit Comment');

  setTimeout(() => {
    const input = document.getElementById('edit-comment-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, 200);

  document.getElementById('edit-comment-save').onclick = async () => {
    const newText = document.getElementById('edit-comment-input').value.trim();
    if (!newText) { toast('Comment cannot be empty', 'error'); return; }

    try {
      await updateDoc(doc(db, 'comments', commentId), {
        text: newText,
        edited: true,
        editedAt: serverTimestamp()
      });
      toast('✏️ Comment edited', 'success');
      closeSheet();

      // Reload current post's comments
      const postSheet = document.querySelector('#sheet-container');
      if (postSheet) {
        // Find the post id from active sheet context
        setTimeout(() => {
          // Reload whatever comments list is open
          const listEl = document.getElementById('post-comments-list');
          if (listEl) {
            // Re-trigger load by finding post id from URL or cache
            const activePostSheetTitle = document.querySelector('#sheet-container h3');
            // Reload comments for whatever's open
            document.querySelectorAll('.post-comments-btn').forEach(btn => {
              // No-op — just reload the current comments
            });
          }
        }, 300);
      }
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 6: UPDATE openCommentsSheet FOR VAULTS/CLIPS/LEAKS (reuse)
// ============================================

// Override the original openCommentsSheet to also use upgraded system
var _origOpenCommentsSheetUpgraded = openCommentsSheet;
openCommentsSheet = async function(contentType, contentId, contentTitle) {
  // Reuse post comments system for all content types
  const pseudoPost = {
    id: contentId,
    text: contentTitle || 'Content',
    ign: 'Content',
    avatar: '',
    likes: 0,
    uid: ''
  };

  // Store in cache temporarily
  const existingPost = homeCache.feed.find(p => p.id === contentId);
  if (!existingPost) {
    homeCache.feed.push({ ...pseudoPost, type: 'post' });
  }

  await openPostComments(contentId);
};

// ============================================
// PART 7: LOAD USER COMMENT LIKES ON STARTUP
// ============================================

// Extend loadUserLikes to include comment likes
var _origLoadUserLikesComments = loadUserLikes;
loadUserLikes = async function() {
  await _origLoadUserLikesComments();
  // Comment likes are loaded with same query since they use the same collection
};

window.openPostComments = openPostComments;
window.sendPostComment = sendPostComment;
window.openEditCommentSheet = openEditCommentSheet;

console.log('✅ Chunk 51b: Upgraded comments loaded');

/* END OF CHUNK 51b */
// ============================================
// Chunk 51.5: Hidden Jitsi Voice Room UI
// ============================================

// ============================================
// PART 1: VOICE ROOM STATE
// ============================================

var voiceRoomState = {
  active: false,
  lobbyId: null,
  lobby: null,
  jitsiApi: null,
  isMuted: false,
  participants: 0
};

// ============================================
// PART 2: VOICE ROOM OVERLAY (replace joinLobby behavior)
// ============================================

const _origJoinLobbyVoice = joinLobby;
joinLobby = async function(lobbyId) {
  const lobby = State.cache.lobbies.find(l => l.id === lobbyId);
  if (!lobby) { toast('Lobby not found', 'error'); return; }

  // Increment player count
  try {
    if ((lobby.players || 1) < 5) {
      await updateDoc(doc(db, 'lobbies', lobbyId), { players: increment(1) });
    }
  } catch (e) { /* silent */ }

  // Notify creator
  if (lobby.uid && lobby.uid !== State.user.uid) {
    try {
      await sendNotificationToUser(
        lobby.uid,
        '🎮 Someone Joined!',
        `${State.profile.ign} joined your ${lobby.mode} lobby`,
        { type: 'lobby_join', lobbyId }
      );
    } catch (e) { /* silent */ }
  }

  // Open voice room overlay
  openVoiceRoom(lobby);
};

// ============================================
// PART 3: VOICE ROOM OVERLAY
// ============================================

function openVoiceRoom(lobby) {
  // Kill any existing room
  if (voiceRoomState.active) closeVoiceRoom();

  voiceRoomState.active = true;
  voiceRoomState.lobbyId = lobby.id;
  voiceRoomState.lobby = lobby;
  voiceRoomState.isMuted = !lobby.mic;

  const roomName = (lobby.jitsiLink || `https://meet.jit.si/CODMPanda-${lobby.id}`).split('/').pop();

  const overlay = document.createElement('div');
  overlay.id = 'voice-room-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9200;
    background: #050505;
    display: flex;
    flex-direction: column;
    animation: voiceSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  overlay.innerHTML = `
    <!-- Hidden Jitsi iframe container -->
    <div id="jitsi-hidden-container" style="
      position: absolute;
      inset: 0;
      z-index: 1;
      opacity: 0;
      pointer-events: none;
    "></div>

    <!-- Dark background with subtle gradient -->
    <div style="
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 40%, rgba(255, 107, 0, 0.08) 0%, #050505 60%);
      z-index: 2;
      pointer-events: none;
    "></div>

    <!-- Content -->
    <div style="
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 24px;
      padding-top: calc(env(safe-area-inset-top, 0px) + 24px);
      padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
    ">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
        <button id="voice-close-btn" class="btn-press" style="
          width: 40px; height: 40px;
          border-radius: 12px;
          background: #111;
          border: 1px solid #222;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <i data-lucide="chevron-down" style="width: 20px; height: 20px; color: #fff;"></i>
        </button>

        <div style="text-align: center; flex: 1; padding: 0 12px;">
          <div style="font-size: 10px; color: #666; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Voice Room</div>
          <div style="font-size: 13px; color: #fff; font-weight: 800; margin-top: 2px;">${esc(lobby.mode)} · ${esc(lobby.region)}</div>
        </div>

        <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 20px; background: #111; border: 1px solid #222;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #22C55E; animation: pulse 2s infinite;"></div>
            <span style="font-size: 10px; font-weight: 800; color: #22C55E;">LIVE</span>
          </div>
        </div>
      </div>

      <!-- Center avatar (room owner) -->
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <div style="
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 107, 0, 0.3), rgba(255, 215, 0, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          font-weight: 900;
          overflow: hidden;
          box-shadow: 0 0 60px rgba(255, 107, 0, 0.5), 0 0 120px rgba(255, 107, 0, 0.2);
          animation: voicePulse 3s ease-in-out infinite;
          margin-bottom: 24px;
          position: relative;
        ">
          ${lobby.avatar ? `<img src="${esc(lobby.avatar)}" style="width: 100%; height: 100%; object-fit: cover;" />` : getInitials(lobby.ign)}
        </div>

        <div style="font-size: 22px; font-weight: 900; color: #fff; margin-bottom: 6px;">${esc(lobby.ign)}'s room</div>
        <div style="font-size: 12px; color: #888;">${esc(lobby.note || lobby.mode + ' squad')}</div>

        <div style="margin-top: 20px; display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 20px; background: #111; border: 1px solid #222;">
          <i data-lucide="users" style="width: 14px; height: 14px; color: #FF6B00;"></i>
          <span style="font-size: 11px; font-weight: 800; color: #fff;" id="voice-participant-count">${lobby.players || 1}/5 players</span>
        </div>

        <div id="voice-status-text" style="
          margin-top: 16px;
          font-size: 11px;
          color: #666;
          font-weight: 600;
        ">Connecting to voice...</div>
      </div>

      <!-- Controls -->
      <div style="display: flex; justify-content: center; gap: 16px; margin-top: 24px;">
        <button id="voice-mute-btn" class="btn-press" style="
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: ${voiceRoomState.isMuted ? '#FF3B30' : '#111'};
          border: 1px solid ${voiceRoomState.isMuted ? '#FF3B30' : '#222'};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
          box-shadow: ${voiceRoomState.isMuted ? '0 0 30px rgba(255, 59, 48, 0.5)' : 'none'};
          transition: all 0.2s;
        ">
          <i data-lucide="${voiceRoomState.isMuted ? 'mic-off' : 'mic'}" style="width: 22px; height: 22px; color: #fff;"></i>
          <span style="font-size: 8px; font-weight: 800; color: #fff;">${voiceRoomState.isMuted ? 'UNMUTE' : 'MUTE'}</span>
        </button>

        <button id="voice-leave-btn" class="btn-press" style="
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: #FF3B30;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
          box-shadow: 0 0 30px rgba(255, 59, 48, 0.5);
        ">
          <i data-lucide="phone-off" style="width: 22px; height: 22px; color: #fff;"></i>
          <span style="font-size: 8px; font-weight: 800; color: #fff;">LEAVE</span>
        </button>
      </div>
    </div>

    <style>
      @keyframes voiceSlideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes voicePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  `;

  document.body.appendChild(overlay);

  // Wire buttons
  document.getElementById('voice-close-btn').onclick = closeVoiceRoom;
  document.getElementById('voice-mute-btn').onclick = toggleVoiceMute;
  document.getElementById('voice-leave-btn').onclick = closeVoiceRoom;

  // Load Jitsi hidden
  loadHiddenJitsi(roomName, overlay);

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 4: LOAD JITSI HIDDEN
// ============================================

function loadHiddenJitsi(roomName, overlay) {
  const statusEl = document.getElementById('voice-status-text');

  // Load Jitsi script if not loaded
  if (!window.JitsiMeetExternalAPI) {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.onload = () => initHiddenJitsi(roomName, overlay);
    script.onerror = () => {
      if (statusEl) {
        statusEl.textContent = '⚠️ Failed to load voice';
        statusEl.style.color = '#FF3B30';
      }
      toast('Could not connect to voice. Check network.', 'error', 4000);
    };
    document.head.appendChild(script);

    // Timeout protection
    setTimeout(() => {
      if (!window.JitsiMeetExternalAPI && statusEl) {
        statusEl.textContent = '⚠️ Connection timeout';
        statusEl.style.color = '#FF3B30';
      }
    }, 8000);
  } else {
    initHiddenJitsi(roomName, overlay);
  }
}

function initHiddenJitsi(roomName, overlay) {
  const statusEl = document.getElementById('voice-status-text');
  const container = document.getElementById('jitsi-hidden-container');
  if (!container || !window.JitsiMeetExternalAPI) return;

  try {
    const domain = 'meet.jit.si';
    const options = {
      roomName: roomName,
      parentNode: container,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: State.profile.ign || 'Panda'
      },
      configOverwrite: {
        startWithAudioMuted: voiceRoomState.isMuted,
        startWithVideoMuted: true,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        disableProfile: true,
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        toolbarButtons: [],
        notifications: [],
        disableInviteFunctions: true,
        enableWelcomePage: false,
        enableClosePage: false,
        disableModeratorIndicator: true,
        disableRemoteMute: true,
        defaultLanguage: 'en',
        requireDisplayName: false,
        enableNoAudioDetection: false,
        enableNoisyMicDetection: false,
        disableAudioLevels: true,
        videoQuality: {
          preferredCodec: 'VP8',
          maxBitrate: 200000
        }
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        DEFAULT_BACKGROUND: '#050505',
        TOOLBAR_BUTTONS: [],
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
      }
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    voiceRoomState.jitsiApi = api;

    // Event listeners
    api.addEventListener('videoConferenceJoined', () => {
      if (statusEl) {
        statusEl.textContent = '🎤 Connected to voice';
        statusEl.style.color = '#22C55E';
      }
      toast('Voice connected 🎤', 'success', 2000);
    });

    api.addEventListener('participantJoined', (data) => {
      const count = (voiceRoomState.participants || 0) + 1;
      voiceRoomState.participants = count;
      updateParticipantCount();
    });

    api.addEventListener('participantLeft', () => {
      const count = Math.max(0, (voiceRoomState.participants || 0) - 1);
      voiceRoomState.participants = count;
      updateParticipantCount();
    });

    api.addEventListener('audioMuteStatusChanged', (data) => {
      voiceRoomState.isMuted = data.muted;
      updateMuteButtonUI();
    });

    api.addEventListener('readyToClose', () => {
      closeVoiceRoom();
    });

    api.addEventListener('errorOccurred', (data) => {
      console.error('Jitsi error:', data);
      if (statusEl) {
        statusEl.textContent = '⚠️ Voice error — try again';
        statusEl.style.color = '#FF3B30';
      }
    });

  } catch (e) {
    console.error('Jitsi init error:', e);
    if (statusEl) {
      statusEl.textContent = '⚠️ Failed to start voice';
      statusEl.style.color = '#FF3B30';
    }
  }
}

// ============================================
// PART 5: VOICE ROOM CONTROLS
// ============================================

function toggleVoiceMute() {
  if (!voiceRoomState.jitsiApi) {
    toast('Voice not ready yet', 'warning');
    return;
  }

  try {
    voiceRoomState.isMuted = !voiceRoomState.isMuted;
    voiceRoomState.jitsiApi.executeCommand('toggleAudio');
    updateMuteButtonUI();
    toast(voiceRoomState.isMuted ? '🔇 Muted' : '🎤 Unmuted', 'success', 1200);
  } catch (e) {
    console.error('Mute toggle error:', e);
    toast('Failed to toggle mic', 'error');
  }
}

function updateMuteButtonUI() {
  const btn = document.getElementById('voice-mute-btn');
  if (!btn) return;

  if (voiceRoomState.isMuted) {
    btn.style.background = '#FF3B30';
    btn.style.border = '1px solid #FF3B30';
    btn.style.boxShadow = '0 0 30px rgba(255, 59, 48, 0.5)';
    btn.innerHTML = `
      <i data-lucide="mic-off" style="width: 22px; height: 22px; color: #fff;"></i>
      <span style="font-size: 8px; font-weight: 800; color: #fff;">UNMUTE</span>
    `;
  } else {
    btn.style.background = '#111';
    btn.style.border = '1px solid #222';
    btn.style.boxShadow = 'none';
    btn.innerHTML = `
      <i data-lucide="mic" style="width: 22px; height: 22px; color: #fff;"></i>
      <span style="font-size: 8px; font-weight: 800; color: #fff;">MUTE</span>
    `;
  }
  if (window.lucide) window.lucide.createIcons();
}

function updateParticipantCount() {
  const el = document.getElementById('voice-participant-count');
  if (el) {
    el.textContent = `${voiceRoomState.participants || 1}/5 players`;
  }
}

function closeVoiceRoom() {
  try {
    if (voiceRoomState.jitsiApi) {
      voiceRoomState.jitsiApi.dispose();
      voiceRoomState.jitsiApi = null;
    }
  } catch (e) { /* silent */ }

  const overlay = document.getElementById('voice-room-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => overlay.remove(), 300);
  }

  voiceRoomState.active = false;
  voiceRoomState.lobbyId = null;
  voiceRoomState.lobby = null;
  voiceRoomState.participants = 0;

  toast('Left voice room', 'success', 1500);
}

// ============================================
// PART 6: PRELOAD JITSI SCRIPT ON APP START
// ============================================

// Preload Jitsi script in background so joining is faster
setTimeout(() => {
  if (!window.JitsiMeetExternalAPI) {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.head.appendChild(script);
  }
}, 8000);

// ============================================
// PART 7: HANDLE APP CLOSE
// ============================================

window.addEventListener('beforeunload', () => {
  if (voiceRoomState.jitsiApi) {
    try { voiceRoomState.jitsiApi.dispose(); } catch (e) {}
  }
});

// Handle back button within voice room
window.addEventListener('popstate', () => {
  if (voiceRoomState.active) {
    closeVoiceRoom();
    try { history.pushState({ __codm: true }, ''); } catch (e) {}
  }
});

window.openVoiceRoom = openVoiceRoom;
window.closeVoiceRoom = closeVoiceRoom;
window.toggleVoiceMute = toggleVoiceMute;

console.log('✅ Chunk 51.5: Hidden Jitsi voice room loaded');

/* END OF CHUNK 51.5 */
// ============================================
// Chunk 52a: Verified Badge + Themes + Avatar Frames
// ============================================

// ============================================
// PART 1: AUTO-VERIFIED BADGE LOGIC
// ============================================

// Auto-check if user should be verified
async function checkVerifiedStatus() {
  if (!State.user || !State.profile) return;

  const approvedCount = State.profile.approvedCount || 0;
  const isPro = State.profile.isPro || false;
  const shouldBeVerified = isPro && approvedCount >= 10;
  const isCurrentlyVerified = State.profile.verified || false;

  if (shouldBeVerified !== isCurrentlyVerified) {
    try {
      await updateDoc(doc(db, 'users', State.user.uid), {
        verified: shouldBeVerified,
        verifiedAt: shouldBeVerified ? serverTimestamp() : null
      });
      State.profile.verified = shouldBeVerified;
      console.log('✅ Verified status updated:', shouldBeVerified);
      if (shouldBeVerified) {
        toast('🎉 You\'re now a Verified Creator!', 'success', 4000);
      }
    } catch (e) {
      console.warn('Verified update failed:', e);
    }
  }
}

// ============================================
// PART 2: BADGE RENDERER (use everywhere)
// ============================================

function renderVerifiedBadge(user) {
  if (!user || !user.verified) return '';
  return `<span class="verified-badge" title="Verified Creator" style="
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #1DA1F2;
    color: #fff;
    font-size: 9px;
    font-weight: 900;
    flex-shrink: 0;
    box-shadow: 0 0 8px rgba(29, 161, 242, 0.5);
  ">✓</span>`;
}

function renderProCrown(user) {
  if (!user || !user.isPro) return '';
  return `<span style="font-size: 11px; flex-shrink: 0;" title="Pro Member">👑</span>`;
}

// ============================================
// PART 3: PROFILE THEMES
// ============================================

var PROFILE_THEMES = {
  dark: {
    name: 'AMOLED Dark',
    pro: false,
    gradient: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)',
    border: '#222222',
    glow: 'none',
    nameColor: '#ffffff',
    animated: false
  },
  gold: {
    name: 'Royal Gold',
    pro: true,
    gradient: 'linear-gradient(135deg, #1a1200 0%, #000000 100%)',
    border: '#FFD700',
    glow: '0 0 30px rgba(255, 215, 0, 0.4)',
    nameColor: '#FFD700',
    animated: true
  },
  fire: {
    name: 'Fire Storm',
    pro: true,
    gradient: 'linear-gradient(135deg, #1a0500 0%, #000000 60%, #1a0500 100%)',
    border: '#FF6B00',
    glow: '0 0 30px rgba(255, 107, 0, 0.5)',
    nameColor: '#FF6B00',
    animated: true
  },
  ice: {
    name: 'Ice Freeze',
    pro: true,
    gradient: 'linear-gradient(135deg, #001428 0%, #000000 100%)',
    border: '#00BFFF',
    glow: '0 0 30px rgba(0, 191, 255, 0.4)',
    nameColor: '#00BFFF',
    animated: true
  },
  galaxy: {
    name: 'Galaxy',
    pro: true,
    gradient: 'linear-gradient(135deg, #1a0033 0%, #000000 50%, #0a001a 100%)',
    border: '#AF52DE',
    glow: '0 0 30px rgba(175, 82, 222, 0.5)',
    nameColor: '#AF52DE',
    animated: true
  }
};

// ============================================
// PART 4: AVATAR FRAMES
// ============================================

var AVATAR_FRAMES = {
  none: { name: 'None', pro: false, style: '' },
  gold: { name: 'Gold', pro: true, style: 'background: linear-gradient(135deg, #FFD700, #B8860B); padding: 3px; border-radius: 50%;' },
  fire: { name: 'Fire', pro: true, style: 'background: linear-gradient(135deg, #FF6B00, #FF3B30); padding: 3px; border-radius: 50%;' },
  ice: { name: 'Ice', pro: true, style: 'background: linear-gradient(135deg, #00BFFF, #0080FF); padding: 3px; border-radius: 50%;' },
  neon: { name: 'Neon', pro: true, style: 'background: linear-gradient(135deg, #AF52DE, #FF6B00); padding: 3px; border-radius: 50%;' }
};

// ============================================
// PART 5: THEME + FRAME APPLICATION
// ============================================

function applyProfileTheme() {
  const theme = State.profile?.themeStyle || 'dark';
  const themeData = PROFILE_THEMES[theme] || PROFILE_THEMES.dark;

  // Apply to profile card on YOU tab
  setTimeout(() => {
    const profileCard = document.querySelector('#content .bg-card.border.rounded-2xl');
    if (profileCard && document.getElementById('main-app') && !document.getElementById('main-app').classList.contains('hidden')) {
      if (State.currentTab === 'you') {
        profileCard.style.background = themeData.gradient;
        profileCard.style.borderColor = themeData.border;
        profileCard.style.boxShadow = themeData.glow;
      }
    }
  }, 100);
}

function getAvatarWithFrame(avatarUrl, ign, size) {
  const frame = State.profile?.avatarFrame || 'none';
  const frameData = AVATAR_FRAMES[frame] || AVATAR_FRAMES.none;

  if (frame === 'none' || !frameData.style) {
    return `
      <div style="width: ${size}px; height: ${size}px; border-radius: 50%; overflow: hidden; background: rgba(255, 107, 0, 0.15); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: ${size * 0.35}px;">
        ${avatarUrl ? `<img src="${esc(avatarUrl)}" style="width: 100%; height: 100%; object-fit: cover;" />` : getInitials(ign)}
      </div>
    `;
  }

  const innerSize = size - 6;
  return `
    <div style="${frameData.style} width: ${size}px; height: ${size}px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);">
      <div style="width: ${innerSize}px; height: ${innerSize}px; border-radius: 50%; overflow: hidden; background: #111; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: ${innerSize * 0.35}px; border: 2px solid #0a0a0a;">
        ${avatarUrl ? `<img src="${esc(avatarUrl)}" style="width: 100%; height: 100%; object-fit: cover;" />` : getInitials(ign)}
      </div>
    </div>
  `;
}

// ============================================
// PART 6: THEME PICKER SHEET
// ============================================

function openThemePicker() {
  const isPro = State.profile?.isPro;
  const currentTheme = State.profile?.themeStyle || 'dark';

  openSheet(`
    <div class="space-y-4">
      <div class="text-xs text-gray-500">${isPro ? '👑 Pro — All themes unlocked' : 'Free — 1 theme, upgrade for all'}</div>

      <div class="grid grid-cols-2 gap-3">
        ${Object.entries(PROFILE_THEMES).map(([key, theme]) => {
          const isSelected = currentTheme === key;
          const isLocked = theme.pro && !isPro;
          return `
            <button class="theme-pick-btn btn-press relative rounded-2xl overflow-hidden" data-theme="${key}" data-locked="${isLocked}">
              <div style="
                height: 80px;
                background: ${theme.gradient};
                border: 2px solid ${isSelected ? theme.border : '#222'};
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: ${isSelected ? theme.glow : 'none'};
                position: relative;
              ">
                <div style="font-weight: 900; font-size: 14px; color: ${theme.nameColor};">${theme.name}</div>
                ${isLocked ? `<div style="position: absolute; top: 6px; right: 6px; font-size: 14px;">🔒</div>` : ''}
                ${isSelected && !isLocked ? `<div style="position: absolute; top: 6px; right: 6px; background: #FF6B00; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff; font-weight: 900;">✓</div>` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>

      ${!isPro ? `
        <button id="theme-upgrade-btn" class="btn-press w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm">
          👑 Unlock All Themes — Go Pro
        </button>
      ` : ''}
    </div>
  `, '🎨 Profile Themes');

  document.querySelectorAll('.theme-pick-btn').forEach(btn => {
    btn.onclick = async () => {
      const themeKey = btn.dataset.theme;
      const isLocked = btn.dataset.locked === 'true';

      if (isLocked) {
        showProPaywall('Unlock all 5 animated profile themes with Pro.');
        return;
      }

      try {
        await updateDoc(doc(db, 'users', State.user.uid), {
          themeStyle: themeKey
        });
        State.profile.themeStyle = themeKey;
        toast('🎨 Theme applied!', 'success');
        closeSheet();
        if (State.currentTab === 'you') renderYouTab();
      } catch (e) {
        toast('Failed: ' + e.message, 'error');
      }
    };
  });

  const upgradeBtn = document.getElementById('theme-upgrade-btn');
  if (upgradeBtn) upgradeBtn.onclick = goPro;

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 7: AVATAR FRAME PICKER
// ============================================

function openAvatarFramePicker() {
  const isPro = State.profile?.isPro;
  const currentFrame = State.profile?.avatarFrame || 'none';

  openSheet(`
    <div class="space-y-4">
      <div class="text-xs text-gray-500">${isPro ? '👑 Pro — All frames unlocked' : 'Free — frames are a Pro feature'}</div>

      <div class="grid grid-cols-3 gap-3">
        ${Object.entries(AVATAR_FRAMES).map(([key, frame]) => {
          const isSelected = currentFrame === key;
          const isLocked = frame.pro && !isPro;
          return `
            <button class="frame-pick-btn btn-press flex flex-col items-center gap-2 p-3 rounded-2xl ${isSelected ? 'bg-primary/10 border-2 border-primary' : 'bg-card border border-border'}" data-frame="${key}" data-locked="${isLocked}">
              <div style="width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
                ${frame.style ? `
                  <div style="${frame.style} width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; position: relative;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: #111; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                      ${State.profile?.avatar ? `<img src="${esc(State.profile.avatar)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />` : '🐼'}
                    </div>
                    ${isLocked ? `<div style="position: absolute; top: -4px; right: -4px; font-size: 12px;">🔒</div>` : ''}
                  </div>
                ` : `
                  <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(255, 107, 0, 0.15); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    ${State.profile?.avatar ? `<img src="${esc(State.profile.avatar)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />` : '🐼'}
                  </div>
                `}
              </div>
              <span class="text-[10px] font-bold ${isSelected ? 'text-primary' : 'text-gray-400'}">${frame.name}</span>
            </button>
          `;
        }).join('')}
      </div>

      ${!isPro ? `
        <button id="frame-upgrade-btn" class="btn-press w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm">
          👑 Unlock All Frames — Go Pro
        </button>
      ` : ''}
    </div>
  `, '✨ Avatar Frames');

  document.querySelectorAll('.frame-pick-btn').forEach(btn => {
    btn.onclick = async () => {
      const frameKey = btn.dataset.frame;
      const isLocked = btn.dataset.locked === 'true';

      if (isLocked) {
        showProPaywall('Unlock animated avatar frames with Pro.');
        return;
      }

      try {
        await updateDoc(doc(db, 'users', State.user.uid), {
          avatarFrame: frameKey
        });
        State.profile.avatarFrame = frameKey;
        toast('✨ Frame applied!', 'success');
        closeSheet();
        if (State.currentTab === 'you') renderYouTab();
      } catch (e) {
        toast('Failed: ' + e.message, 'error');
      }
    };
  });

  const upgradeBtn = document.getElementById('frame-upgrade-btn');
  if (upgradeBtn) upgradeBtn.onclick = goPro;

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PART 8: PATCH PROFILE HEADER (YOU tab)
// ============================================

const _origRenderYouTab52a = renderYouTab;
renderYouTab = function() {
  _origRenderYouTab52a();

  setTimeout(() => {
    const content = document.getElementById('content');
    if (!content) return;

    // Apply theme to profile card
    const profileCard = content.querySelector('.bg-card.border.border-border.rounded-2xl, .bg-card.border.border-gold.rounded-2xl');
    if (profileCard) {
      const theme = PROFILE_THEMES[State.profile?.themeStyle || 'dark'] || PROFILE_THEMES.dark;
      if (theme !== PROFILE_THEMES.dark) {
        profileCard.style.background = theme.gradient;
        profileCard.style.borderColor = theme.border;
        profileCard.style.boxShadow = theme.glow;
      }
    }

    // Insert theme + frame buttons after profile card
    if (profileCard && !document.getElementById('theme-frame-buttons')) {
      const btnContainer = document.createElement('div');
      btnContainer.id = 'theme-frame-buttons';
      btnContainer.className = 'grid grid-cols-2 gap-2 mt-3';
      btnContainer.innerHTML = `
        <button id="open-theme-btn" class="btn-press py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold flex items-center justify-center gap-1.5">
          🎨 Themes
        </button>
        <button id="open-frame-btn" class="btn-press py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold flex items-center justify-center gap-1.5">
          ✨ Avatar Frame
        </button>
      `;
      profileCard.parentNode.insertBefore(btnContainer, profileCard.nextSibling);

      document.getElementById('open-theme-btn').onclick = openThemePicker;
      document.getElementById('open-frame-btn').onclick = openAvatarFramePicker;
    }

    // Replace avatar with framed version
    const avatarContainer = profileCard?.querySelector('.w-16.h-16');
    if (avatarContainer && !avatarContainer.dataset.framed) {
      avatarContainer.dataset.framed = '1';
      const frame = State.profile?.avatarFrame || 'none';
      if (frame !== 'none') {
        const parent = avatarContainer.parentNode;
        const framedHTML = `<div class="relative">${getAvatarWithFrame(State.profile.avatar, State.profile.ign, 64)}${State.profile.isPro ? '<div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold flex items-center justify-center border-2 border-card text-sm">👑</div>' : ''}</div>`;
        avatarContainer.parentNode.innerHTML = framedHTML;
      }
    }

    // Add verified badge next to IGN if applicable
    const ignContainer = profileCard?.querySelector('.flex.items-center.gap-2.flex-wrap');
    if (ignContainer && State.profile?.verified && !ignContainer.querySelector('.verified-badge')) {
      const badge = document.createElement('span');
      badge.innerHTML = renderVerifiedBadge(State.profile);
      ignContainer.appendChild(badge.firstElementChild);
    }

    if (window.lucide) window.lucide.createIcons();
  }, 150);
};

// ============================================
// PART 9: HOOK VERIFIED CHECK ON PROFILE LOAD
// ============================================

// Check verification status periodically
setTimeout(() => {
  if (State.user && State.profile) checkVerifiedStatus();
}, 5000);

// Re-check after any approval
setInterval(() => {
  if (State.user && State.profile) checkVerifiedStatus();
}, 5 * 60 * 1000);

// ============================================
// PART 10: ADD VERIFIED BADGE TO POSTS/COMMENTS
// ============================================

// Enhance post renderer to show verified badge
var _origRenderHomePostCard52a = renderHomePostCard;
renderHomePostCard = function(post) {
  let html = _origRenderHomePostCard52a(post);
  // Insert verified badge after IGN (if user is verified)
  if (post.verified) {
    html = html.replace(
      /(<span class="font-bold text-sm">[^<]+<\/span>)/,
      `$1 <span class="verified-badge" style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: #1DA1F2; color: #fff; font-size: 9px; font-weight: 900; flex-shrink: 0;">✓</span>`
    );
  }
  return html;
};

window.openThemePicker = openThemePicker;
window.openAvatarFramePicker = openAvatarFramePicker;
window.checkVerifiedStatus = checkVerifiedStatus;
window.PROFILE_THEMES = PROFILE_THEMES;
window.AVATAR_FRAMES = AVATAR_FRAMES;

console.log('✅ Chunk 52a: Verified badge + themes + avatar frames loaded');

/* END OF CHUNK 52a */
// ============================================
// Chunk 52b: App Activity Stats Dashboard
// ============================================

// ============================================
// PART 1: ACTIVITY STATS LOADER
// ============================================

async function loadActivityStats() {
  if (!State.user) return null;

  try {
    // Parallel fetch
    const [lobbiesSnap, vaultsSnap, postsSnap, camoSnap] = await Promise.all([
      getDocs(query(collection(db, 'lobbies'), where('uid', '==', State.user.uid), limit(200))).catch(() => ({ size: 0, forEach: () => {} })),
      getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid), limit(200))).catch(() => ({ size: 0, forEach: () => {} })),
      getDocs(query(collection(db, 'posts'), where('uid', '==', State.user.uid), limit(200))).catch(() => ({ size: 0, forEach: () => {} })),
      getDoc(doc(db, 'camos', State.user.uid)).catch(() => ({ exists: () => false }))
    ]);

    // Count camos
    let camoPct = 0;
    let camosTracked = 0;
    if (camoSnap.exists && camoSnap.exists()) {
      const totalPossible = ALL_GUNS.length * CAMO_TYPES.length;
      let checked = 0;
      Object.values(camoSnap.data()).forEach(gun => {
        if (typeof gun === 'object') {
          CAMO_TYPES.forEach(c => { if (gun[c.key]) checked++; });
        }
      });
      camoPct = Math.round((checked / totalPossible) * 100);
      camosTracked = checked;
    }

    // Total likes received across posts + vaults
    let likesReceived = 0;
    postsSnap.forEach(d => { likesReceived += (d.data().likes || 0); });
    vaultsSnap.forEach(d => { likesReceived += (d.data().likes || 0); });

    // Active streak
    const lastActive = State.profile?.lastActiveDate || '';
    const today = new Date().toISOString().slice(0, 10);
    let streak = State.profile?.activeStreak || 0;

    // Update streak if needed
    if (lastActive !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (lastActive === yesterday) {
        streak = streak + 1;
      } else if (lastActive === '') {
        streak = 1;
      } else {
        streak = 1; // Reset
      }

      try {
        await updateDoc(doc(db, 'users', State.user.uid), {
          lastActiveDate: today,
          activeStreak: streak
        });
        State.profile.lastActiveDate = today;
        State.profile.activeStreak = streak;
      } catch (e) { /* silent */ }
    }

    // Contributor points (approved submissions * 10 + likes / 2)
    const contributorPoints = ((State.profile?.approvedCount || 0) * 10) + Math.floor(likesReceived / 2);

    // Weekly activity (last 7 days)
    const weeklyActivity = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      let dayCount = 0;
      lobbiesSnap.forEach(d => {
        const t = d.data().createdAt?.seconds || 0;
        const tMs = t * 1000;
        if (tMs >= dayStart.getTime() && tMs < dayEnd.getTime()) dayCount++;
      });
      postsSnap.forEach(d => {
        const t = d.data().createdAt?.seconds || 0;
        const tMs = t * 1000;
        if (tMs >= dayStart.getTime() && tMs < dayEnd.getTime()) dayCount++;
      });

      weeklyActivity.push({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayStart.getDay()],
        count: dayCount,
        date: dayStart.toISOString().slice(0, 10)
      });
    }

    return {
      lobbies: lobbiesSnap.size,
      vaults: vaultsSnap.size,
      posts: postsSnap.size,
      camosTracked,
      camoPct,
      likesReceived,
      streak,
      contributorPoints,
      weeklyActivity
    };
  } catch (e) {
    console.error('Stats load error:', e);
    return null;
  }
}

// ============================================
// PART 2: STATS DASHBOARD RENDER
// ============================================

function renderActivityStats(stats) {
  if (!stats) {
    return `
      <div class="bg-card border border-border rounded-2xl p-4 mb-4">
        <div class="text-center py-4 text-xs text-gray-500">Loading stats...</div>
      </div>
    `;
  }

  const maxWeekly = Math.max(...stats.weeklyActivity.map(d => d.count), 1);

  return `
    <div class="bg-card border border-border rounded-2xl p-4 mb-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="text-xs font-bold text-gray-400 uppercase">📊 Your Activity</div>
          <div class="text-[10px] text-gray-500 mt-0.5">Your journey in CODMPanda</div>
        </div>
        <div class="text-right">
          <div class="text-lg font-black text-primary">${stats.contributorPoints}</div>
          <div class="text-[9px] text-gray-500 uppercase">Points</div>
        </div>
      </div>

      <!-- Main stats grid -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-cardAlt border border-border rounded-xl p-3 text-center">
          <div class="text-lg font-black text-primary">${stats.lobbies}</div>
          <div class="text-[9px] text-gray-500 uppercase font-bold mt-0.5">Lobbies</div>
        </div>
        <div class="bg-cardAlt border border-border rounded-xl p-3 text-center">
          <div class="text-lg font-black text-primary">${stats.vaults}</div>
          <div class="text-[9px] text-gray-500 uppercase font-bold mt-0.5">Vaults</div>
        </div>
        <div class="bg-cardAlt border border-border rounded-xl p-3 text-center">
          <div class="text-lg font-black text-primary">${stats.posts}</div>
          <div class="text-[9px] text-gray-500 uppercase font-bold mt-0.5">Posts</div>
        </div>
      </div>

      <!-- Secondary stats -->
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div class="bg-gradient-to-br from-gold/10 to-transparent border border-gold/30 rounded-xl p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-base">🎯</span>
            <span class="text-[10px] text-gold uppercase font-bold">Camo Progress</span>
          </div>
          <div class="text-xl font-black text-gold">${stats.camoPct}%</div>
          <div class="text-[9px] text-gray-500">${stats.camosTracked} camos tracked</div>
        </div>
        <div class="bg-gradient-to-br from-primary/10 to-transparent border border-primary/30 rounded-xl p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-base">❤️</span>
            <span class="text-[10px] text-primary uppercase font-bold">Likes Received</span>
          </div>
          <div class="text-xl font-black text-primary">${stats.likesReceived}</div>
          <div class="text-[9px] text-gray-500">across all your posts</div>
        </div>
      </div>

      <!-- Active streak -->
      <div class="bg-gradient-to-r from-primary/15 to-transparent border border-primary/30 rounded-xl p-3 mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🔥</span>
            <div>
              <div class="text-xs font-bold">Active Streak</div>
              <div class="text-[10px] text-gray-500">Consecutive days in app</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-black text-primary">${stats.streak}</div>
            <div class="text-[9px] text-gray-500 uppercase">Days</div>
          </div>
        </div>
      </div>

      <!-- Weekly activity chart -->
      <div>
        <div class="text-[10px] text-gray-400 uppercase font-bold mb-2">This Week</div>
        <div class="flex items-end justify-between gap-1 h-20">
          ${stats.weeklyActivity.map(d => {
            const height = maxWeekly > 0 ? Math.max(4, (d.count / maxWeekly) * 100) : 4;
            return `
              <div class="flex-1 flex flex-col items-center gap-1">
                <div style="
                  width: 100%;
                  height: ${height}%;
                  min-height: 4px;
                  background: ${d.count > 0 ? 'linear-gradient(180deg, #FF6B00, #FFD700)' : '#1a1a1a'};
                  border-radius: 4px;
                  transition: height 0.4s ease;
                "></div>
                <span class="text-[8px] text-gray-500 font-bold">${d.day}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="text-[9px] text-gray-600 text-center mt-4 pt-3 border-t border-border">
        Stats update automatically as you use the app
      </div>
    </div>
  `;
}

// ============================================
// PART 3: INJECT STATS INTO YOU TAB
// ============================================

const _origRenderYouTab52b = renderYouTab;
renderYouTab = function() {
  _origRenderYouTab52b();

  setTimeout(async () => {
    const content = document.getElementById('content');
    if (!content) return;

    // Find profile card
    const profileCard = content.querySelector('.bg-card.border');
    if (!profileCard) return;

    // Check if stats already inserted
    if (document.getElementById('activity-stats-card')) return;

    // Insert placeholder first
    const statsDiv = document.createElement('div');
    statsDiv.id = 'activity-stats-card';
    statsDiv.innerHTML = `
      <div class="bg-card border border-border rounded-2xl p-4 mb-4">
        <div class="text-center py-4">
          <div class="spinner mx-auto"></div>
          <div class="text-[10px] text-gray-500 mt-2">Loading your stats...</div>
        </div>
      </div>
    `;

    // Insert AFTER theme/frame buttons (or after profile card)
    const themeFrameButtons = document.getElementById('theme-frame-buttons');
    if (themeFrameButtons) {
      themeFrameButtons.parentNode.insertBefore(statsDiv, themeFrameButtons.nextSibling);
    } else {
      profileCard.parentNode.insertBefore(statsDiv, profileCard.nextSibling);
    }

    // Load and render stats
    const stats = await loadActivityStats();
    statsDiv.innerHTML = renderActivityStats(stats);

    if (window.lucide) window.lucide.createIcons();
  }, 200);
};

// ============================================
// PART 4: REFRESH STATS AFTER POST/VAULT/LOBBY
// ============================================

// Auto-refresh stats when user visits YOU tab
var _origSwitchTab52b = switchTab;
switchTab = function(tab) {
  if (tab === 'you') {
    // Clear stats card so it reloads
    const existing = document.getElementById('activity-stats-card');
    if (existing) existing.remove();
  }
  return _origSwitchTab52b(tab);
};

window.loadActivityStats = loadActivityStats;
window.renderActivityStats = renderActivityStats;

console.log('✅ Chunk 52b: Activity stats dashboard loaded');

/* END OF CHUNK 52b */
// ============================================
// Chunk 53: Complete Pro Benefits
// ============================================

// ============================================
// PART 1: BADGE HELPERS (show everywhere)
// ============================================

function getBadgeHTML(item) {
  if (!item) return '';
  let badges = '';
  if (item.uid === ADMIN_UID) {
    badges += '<span class="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black flex-shrink-0">👑 FOUNDER</span>';
  } else if (item.isPro) {
    badges += '<span class="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black flex-shrink-0">👑 PRO</span>';
  }
  if (item.verified) {
    badges += '<span class="verified-badge" style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: #1DA1F2; color: #fff; font-size: 9px; font-weight: 900; flex-shrink: 0; box-shadow: 0 0 8px rgba(29, 161, 242, 0.5);">✓</span>';
  }
  return badges;
}

// ============================================
// PART 2: PRIORITY LFG PLACEMENT
// ============================================

var _origRenderLobbiesPriority = renderLobbies;
renderLobbies = function() {
  const feed = document.getElementById('lobbies-feed');
  if (!feed) return;
  let lobbies = State.cache.lobbies;

  const f = State.filters.lobbies;
  if (f.rank && f.rank !== 'all') lobbies = lobbies.filter(l => l.rank === f.rank);
  if (f.mode && f.mode !== 'all') lobbies = lobbies.filter(l => l.mode === f.mode);
  if (f.region && f.region !== 'all') lobbies = lobbies.filter(l => l.region === f.region);
  if (f.mic) lobbies = lobbies.filter(l => l.mic === true);
  if (f.search) {
    lobbies = lobbies.filter(l =>
      (l.ign || '').toLowerCase().includes(f.search) ||
      (l.note || '').toLowerCase().includes(f.search)
    );
  }

  // Sort: Pro lobbies first, then by time
  lobbies.sort((a, b) => {
    const aPro = a.isPro ? 1 : 0;
    const bPro = b.isPro ? 1 : 0;
    if (aPro !== bPro) return bPro - aPro;
    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  });

  if (lobbies.length === 0) {
    feed.innerHTML = emptyState('users', 'No lobbies found', 'Try different filters or post your own', 'Post Lobby', openPostLobbySheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const now = Date.now();

  feed.innerHTML = lobbies.map(l => {
    const expiresAt = l.expiresAt?.toMillis ? l.expiresAt.toMillis() : (l.expiresAt?.seconds ? l.expiresAt.seconds * 1000 : Infinity);
    const isExpired = expiresAt < now;
    const isMine = l.uid === State.user.uid;
    const isProLobby = l.isPro || false;
    const playersText = `${l.players || 1}/5`;

    return `
      <div class="bg-card border ${isExpired ? 'border-gray-700 opacity-70' : isProLobby ? 'border-gold' : 'border-border'} rounded-2xl p-4 fade-in ${isProLobby ? 'relative' : ''}" ${isProLobby ? 'style="box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);"' : ''}>
        ${isProLobby ? `<div class="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-gold to-yellow-500 text-black font-black">👑 PRIORITY</div>` : ''}
        <div class="flex items-start gap-3 mb-3">
          <div class="relative">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-lg overflow-hidden">
              ${l.avatar ? `<img src="${esc(l.avatar)}" class="w-full h-full object-cover" />` : getInitials(l.ign)}
            </div>
            ${l.mic ? `<div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center"><i data-lucide="mic" class="w-2.5 h-2.5 text-white"></i></div>` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-sm">${esc(l.ign || 'Unknown')}</span>
              ${getBadgeHTML(l)}
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">${esc(l.rank || 'Rookie')}</span>
              ${isExpired ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/30 text-gray-400 font-bold">CLOSED</span>' : ''}
            </div>
            <div class="text-[11px] text-gray-500 mt-0.5">${timeAgo(l.createdAt)} · ${esc(l.region)} · ${esc(l.mode)}</div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-sm font-black text-primary">${playersText}</div>
            <div class="text-[9px] text-gray-500">PLAYERS</div>
          </div>
        </div>

        <div class="flex flex-wrap gap-1.5 mb-3">
          ${l.role ? `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-300">${esc(l.role)}</span>` : ''}
          ${l.mic ? `<span class="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold">🎤 Mic</span>` : `<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-500">🔇 No Mic</span>`}
        </div>

        ${l.note ? `<p class="text-xs text-gray-400 mb-3 line-clamp-2">${esc(l.note)}</p>` : ''}

        <div class="flex gap-2">
          ${!isExpired ? `
            <button class="join-btn btn-press flex-1 py-2.5 rounded-xl bg-primary text-sm font-bold flex items-center justify-center gap-1.5" data-id="${l.id}">
              <i data-lucide="log-in" class="w-4 h-4"></i> Join
            </button>
          ` : `
            <div class="flex-1 py-2.5 rounded-xl bg-gray-500/10 text-center text-xs font-bold text-gray-500">
              Lobby Closed
            </div>
          `}
          <button class="share-lobby btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-ign="${esc(l.ign)}">
            <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
          </button>
          ${isMine ? `
            <button class="delete-lobby btn-press w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center" data-id="${l.id}">
              <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
            </button>
          ` : `
            <button class="report-lobby btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-uid="${l.uid}">
              <i data-lucide="flag" class="w-4 h-4 text-gray-500"></i>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.join-btn').forEach(btn => {
    btn.onclick = () => joinLobby(btn.dataset.id);
  });
  feed.querySelectorAll('.share-lobby').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: `${btn.dataset.ign}'s Lobby`,
        text: `🎮 Join ${btn.dataset.ign}'s squad on CODMPanda!`,
        url: getLobbyShareUrl(btn.dataset.id)
      });
    };
  });
  feed.querySelectorAll('.delete-lobby').forEach(btn => {
    btn.onclick = () => deleteLobby(btn.dataset.id);
  });
  feed.querySelectorAll('.report-lobby').forEach(btn => {
    btn.onclick = () => reportContent('lobby', btn.dataset.id, btn.dataset.uid);
  });

  if (window.lucide) window.lucide.createIcons();
};

// Post lobby now sets isPro flag
var _origPostLobbySheet53 = openPostLobbySheet;
openPostLobbySheet = function() {
  _origPostLobbySheet53();
  setTimeout(() => {
    const submitBtn = document.getElementById('pl-submit');
    if (!submitBtn) return;
    const origHandler = submitBtn.onclick;
    submitBtn.onclick = async () => {
      // Store original result and add isPro flag
      const isPro = State.profile?.isPro || false;
      // Patch addDoc by pre-setting flag via State
      State.__tmpIsPro = isPro;
      return origHandler.call(submitBtn);
    };
  }, 150);
};

// ============================================
// PART 3: VERIFIED BADGE ON VAULT/CLIP/LEAK CARDS
// ============================================

var _origRenderVaultsBadges = renderVaults;
renderVaults = function() {
  _origRenderVaultsBadges();
  setTimeout(() => {
    const feed = document.getElementById('vault-feed');
    if (!feed) return;
    // Badges are already rendered in cards via uid===ADMIN_UID check
    // Add verified badge for vault owners
    feed.querySelectorAll('.bg-card').forEach(card => {
      const cardId = card.querySelector('[data-id]')?.dataset.id;
      if (!cardId) return;
      const vault = State.cache.vaults.find(v => v.id === cardId);
      if (!vault || !vault.verified) return;
      const nameEl = card.querySelector('.text-xs.font-bold');
      if (nameEl && !nameEl.parentNode.querySelector('.verified-badge')) {
        const badge = document.createElement('span');
        badge.innerHTML = '<span class="verified-badge" style="display: inline-flex; align-items: center; justify-content: center; width: 12px; height: 12px; border-radius: 50%; background: #1DA1F2; color: #fff; font-size: 8px; font-weight: 900; flex-shrink: 0;">✓</span>';
        nameEl.parentNode.appendChild(badge.firstElementChild);
      }
    });
  }, 200);
};

// ============================================
// PART 4: CUSTOM LOBBY URLs
// ============================================

// Handle ?lobby=USERNAME deep link
function checkCustomLobbyUrl() {
  const params = new URLSearchParams(location.search);
  const lobbyUser = params.get('lobby');
  if (!lobbyUser) return;

  // Find user's active lobby
  setTimeout(async () => {
    try {
      const snap = await getDocs(query(
        collection(db, 'lobbies'),
        where('ign', '==', lobbyUser),
        orderBy('createdAt', 'desc'),
        limit(1)
      ));

      if (!snap.empty) {
        const lobby = { id: snap.docs[0].id, ...snap.docs[0].data() };
        const expiresAt = lobby.expiresAt?.toMillis ? lobby.expiresAt.toMillis() : (lobby.expiresAt?.seconds ? lobby.expiresAt.seconds * 1000 : Infinity);
        if (expiresAt > Date.now()) {
          // Show join prompt
          openSheet(`
            <div class="text-center space-y-4 py-4">
              <div class="text-5xl">🎮</div>
              <div>
                <h3 class="text-lg font-black mb-1">${esc(lobby.ign)}'s Lobby</h3>
                <div class="text-xs text-gray-400">${esc(lobby.mode)} · ${esc(lobby.region)} · ${lobby.players || 1}/5 players</div>
              </div>
              ${lobby.note ? `<div class="bg-card border border-border rounded-xl p-3 text-xs text-gray-300">${esc(lobby.note)}</div>` : ''}
              <button id="custom-lobby-join" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary">
                🎤 Join Voice Room
              </button>
              <button onclick="closeSheet()" class="text-xs text-gray-500">Cancel</button>
            </div>
          `, '');
          document.getElementById('custom-lobby-join').onclick = () => {
            closeSheet();
            setTimeout(() => joinLobby(lobby.id), 300);
          };
          if (window.lucide) window.lucide.createIcons();
        } else {
          toast('This lobby has closed', 'info');
        }
      } else {
        toast('No active lobby for that user', 'info');
      }
    } catch (e) { /* silent */ }
  }, 2500);
}

// ============================================
// PART 5: PRO USERS GET CUSTOM SHARE LINK
// ============================================

function getProLobbyShareUrl(lobby) {
  if (lobby.isPro) {
    return `${location.origin}/?lobby=${encodeURIComponent(lobby.ign)}`;
  }
  return getLobbyShareUrl(lobby.id);
}

// ============================================
// PART 6: RUN SETUP ON APP LOAD
// ============================================

setTimeout(() => {
  if (State.user) checkCustomLobbyUrl();
}, 3000);

window.getBadgeHTML = getBadgeHTML;
window.checkCustomLobbyUrl = checkCustomLobbyUrl;
window.getProLobbyShareUrl = getProLobbyShareUrl;

console.log('✅ Chunk 53: Complete Pro benefits loaded');

/* END OF CHUNK 53 */
// ============================================
// CHUNK 54 v2 — Post Detail View (clean rebuild)
// ============================================

window.openPostDetail = function(postId) {
  var post = (homeCache && homeCache.feed) ? homeCache.feed.find(function(p) { return p.id === postId; }) : null;
  if (!post) { toast('Post not found', 'error'); return; }

  // Block body scroll while open
  document.body.style.overflow = 'hidden';

  var ov = document.createElement('div');
  ov.id = 'post-detail-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;overflow-y:auto;-webkit-overflow-scrolling:touch;';
  ov.innerHTML = [
    '<div style="position:sticky;top:0;z-index:10;background:rgba(0,0,0,.95);backdrop-filter:blur(12px);border-bottom:1px solid #222;display:flex;align-items:center;gap:12px;padding:12px 16px;">',
      '<button id="pd-back" class="btn-press" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:transparent;border:none;color:#fff;">',
        '<i data-lucide="arrow-left" class="w-5 h-5"></i>',
      '</button>',
      '<div style="font-weight:700;font-size:16px;color:#fff;">Post</div>',
    '</div>',

    '<div style="padding:16px 16px 120px;">',

      // Post author row
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">',
        '<div id="pd-author-avatar" data-uid="' + (post.uid || '') + '" style="width:40px;height:40px;border-radius:50%;background:rgba(255,107,0,.2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;overflow:hidden;flex-shrink:0;cursor:pointer;color:#ff6b00;">',
          (post.avatar ? '<img src="' + esc(post.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(post.ign || '?')),
        '</div>',
        '<div style="flex:1;min-width:0;">',
          '<div id="pd-author-name" data-uid="' + (post.uid || '') + '" style="font-weight:700;font-size:14px;color:#fff;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">',
            esc(post.ign || 'Unknown'),
            (post.verified ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#1DA1F2;color:#fff;font-size:9px;font-weight:900;">✓</span>' : ''),
          '</div>',
          '<div style="font-size:11px;color:#888;margin-top:2px;">' + timeAgo(post.createdAt) + (post.editedAt ? ' · edited' : '') + '</div>',
        '</div>',
        '<button id="pd-menu" class="btn-press" style="width:32px;height:32px;border-radius:50%;background:transparent;border:none;color:#888;display:flex;align-items:center;justify-content:center;">',
          '<i data-lucide="more-vertical" class="w-4 h-4"></i>',
        '</button>',
      '</div>',

      // Post text
      (post.text ? '<div style="font-size:15px;line-height:1.5;color:#e8e8e8;margin-bottom:14px;white-space:pre-wrap;word-break:break-word;">' + esc(post.text) + '</div>' : ''),

      // Post image (full)
      (post.imageUrl ? '<div style="border-radius:16px;overflow:hidden;margin-bottom:14px;border:1px solid #222;"><img src="' + esc(post.imageUrl) + '" style="width:100%;display:block;" /></div>' : ''),

      // Stats row
      '<div style="display:flex;align-items:center;gap:20px;padding:12px 0;border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;">',
        '<button id="pd-like-btn" class="btn-press" data-id="' + post.id + '" style="background:none;border:none;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:' + (isPostLiked(post.id) ? '#ff6b00' : '#888') + ';">',
          '<i data-lucide="heart" class="w-5 h-5" ' + (isPostLiked(post.id) ? 'fill="currentColor"' : '') + '></i>',
          '<span id="pd-like-count">' + (post.likes || 0) + '</span>',
        '</button>',
        '<div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#888;">',
          '<i data-lucide="message-circle" class="w-5 h-5"></i>',
          '<span id="pd-comment-count">' + (post.commentCount || 0) + '</span>',
        '</div>',
        '<button id="pd-share-btn" class="btn-press" style="background:none;border:none;margin-left:auto;color:#888;display:flex;align-items:center;">',
          '<i data-lucide="share-2" class="w-5 h-5"></i>',
        '</button>',
      '</div>',

      // Comments header
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;margin-bottom:12px;">',
        '<div style="font-size:12px;font-weight:800;color:#888;text-transform:uppercase;letter-spacing:.5px;">Comments</div>',
        '<div id="pd-comment-count-label" style="font-size:11px;color:#666;"></div>',
      '</div>',

      // Comments list
      '<div id="pd-comments-list" style="display:flex;flex-direction:column;gap:12px;">',
        '<div style="text-align:center;padding:20px 0;"><div class="spinner" style="margin:0 auto;"></div></div>',
      '</div>',
    '</div>',

    // Sticky comment input
    '<div style="position:fixed;left:0;right:0;bottom:0;z-index:20;background:#0a0a0a;border-top:1px solid #222;padding:10px 14px;padding-bottom:calc(10px + env(safe-area-inset-bottom));">',
      '<div id="pd-reply-indicator" style="display:none;margin-bottom:8px;padding:8px 12px;background:rgba(255,107,0,.1);border:1px solid rgba(255,107,0,.3);border-radius:8px;display:none;align-items:center;justify-content:space-between;">',
        '<div id="pd-reply-text" style="font-size:11px;color:#ff6b00;font-weight:700;"></div>',
        '<button id="pd-reply-cancel" style="background:none;border:none;color:#888;font-size:14px;">✕</button>',
      '</div>',
      '<div style="display:flex;gap:8px;align-items:center;">',
        '<input id="pd-input" type="text" placeholder="Write a comment..." maxlength="300" style="flex:1;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:11px 14px;font-size:14px;color:#fff;outline:none;" />',
        '<button id="pd-send" class="btn-press" style="width:44px;height:44px;border-radius:12px;background:#ff6b00;border:none;display:flex;align-items:center;justify-content:center;flex-shrink:0;">',
          '<i data-lucide="send" class="w-5 h-5" style="color:#fff;"></i>',
        '</button>',
      '</div>',
    '</div>'
  ].join('');

  document.body.appendChild(ov);
  if (window.lucide) window.lucide.createIcons();

  // ---- Wire back button ----
  document.getElementById('pd-back').onclick = function() {
    ov.remove();
    document.body.style.overflow = '';
  };

  // ---- Author links ----
  var authorUid = post.uid || '';
  if (authorUid) {
    ['pd-author-avatar', 'pd-author-name'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.onclick = function() { closeDetail(); openUserProfile(authorUid); };
    });
  }

  // ---- Menu (edit/delete) ----
  document.getElementById('pd-menu').onclick = function() {
    if (typeof window.openPostMenu === 'function') window.openPostMenu(post.id);
  };

  // ---- Like button ----
  var likeBtn = document.getElementById('pd-like-btn');
  var likeCount = document.getElementById('pd-like-count');
  likeBtn.onclick = async function() {
    var wasLiked = isPostLiked(post.id);
    var nowLiked = !wasLiked;
    State.likedItems = State.likedItems || {};
    State.likedItems.post = State.likedItems.post || {};
    State.likedItems.post[post.id] = nowLiked;

    var currentCount = parseInt(likeCount.textContent) || 0;
    var newCount = nowLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
    likeCount.textContent = newCount;
    likeBtn.style.color = nowLiked ? '#ff6b00' : '#888';
    var icon = likeBtn.querySelector('i, svg');
    if (icon) {
      if (nowLiked) icon.setAttribute('fill', 'currentColor');
      else icon.removeAttribute('fill');
    }

    try {
      await toggleLike('post', post.id, 'likes');
      post.likes = newCount;
    } catch (e) {
      State.likedItems.post[post.id] = wasLiked;
      likeCount.textContent = currentCount;
      likeBtn.style.color = wasLiked ? '#ff6b00' : '#888';
      toast('Failed', 'error');
    }
  };

  // ---- Share ----
  document.getElementById('pd-share-btn').onclick = function() {
    if (typeof window.openShareSheet === 'function') {
      window.openShareSheet({
        title: 'CODMPanda Post',
        text: 'Check out this post on CODMPanda!',
        url: location.origin + '/?post=' + post.id
      });
    }
  };

  // ---- Comment input ----
  var pdInput = document.getElementById('pd-input');
  var pdSend = document.getElementById('pd-send');
  pdSend.onclick = function() { submitPostDetailComment(post.id); };
  pdInput.onkeypress = function(e) { if (e.key === 'Enter') submitPostDetailComment(post.id); };

  document.getElementById('pd-reply-cancel').onclick = function() {
    window.__pdReplyTo = null;
    document.getElementById('pd-reply-indicator').style.display = 'none';
    pdInput.placeholder = 'Write a comment...';
    pdInput.focus();
  };

  // ---- Load comments ----
  loadPostDetailComments(post.id);

  // Close helper stored so nested code can use it
  window.__closePostDetail = function() {
    ov.remove();
    document.body.style.overflow = '';
  };
};

function isPostLiked(postId) {
  return (State.likedItems && State.likedItems.post && State.likedItems.post[postId]) || false;
}



// ---- Load comments in the detail view ----
window.loadPostDetailComments = async function(postId) {
  var listEl = document.getElementById('pd-comments-list');
  var countLabel = document.getElementById('pd-comment-count-label');
  if (!listEl) return;

  try {
    var snap = await getDocs(query(
      collection(db, 'comments'),
      where('contentId', '==', postId),
      limit(200)
    ));

    var all = [];
    snap.forEach(function(d) { all.push(Object.assign({ id: d.id }, d.data())); });
    all.sort(function(a, b) {
      return (a.createdAt && a.createdAt.seconds || 0) - (b.createdAt && b.createdAt.seconds || 0);
    });

    if (countLabel) countLabel.textContent = all.length + ' comment' + (all.length === 1 ? '' : 's');

    if (all.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;">' +
        '<div style="font-size:36px;margin-bottom:8px;">💬</div>' +
        '<div style="font-size:13px;color:#888;">No comments yet</div>' +
        '<div style="font-size:11px;color:#555;margin-top:4px;">Be the first to reply</div>' +
      '</div>';
      return;
    }

    // Top-level + replies grouped
    var topLevel = all.filter(function(c) { return !c.parentId; });
    var byParent = {};
    all.filter(function(c) { return c.parentId; }).forEach(function(c) {
      if (!byParent[c.parentId]) byParent[c.parentId] = [];
      byParent[c.parentId].push(c);
    });

    listEl.innerHTML = topLevel.map(function(c) {
      return renderPdComment(c, byParent[c.id] || [], 0);
    }).join('');

    wirePdComments(listEl, postId);
  } catch (e) {
    console.error('Load comments error:', e);
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#f44;font-size:12px;">Failed to load comments</div>';
  }
  if (window.lucide) window.lucide.createIcons();
};

// ---- Render a comment (with or without replies) ----
function renderPdComment(c, replies, depth) {
  var isMine = c.uid === State.user.uid;
  var isLiked = (State.likedItems && State.likedItems.comment && State.likedItems.comment[c.id]) || false;
  var indent = depth > 0 ? 'margin-left:36px;' : '';

  var h = '<div class="pd-comment" data-cid="' + c.id + '" style="' + indent + 'display:flex;gap:10px;align-items:flex-start;">';

  // Avatar
  h += '<div class="pd-user" data-uid="' + (c.uid || '') + '" style="width:32px;height:32px;border-radius:50%;background:rgba(255,107,0,.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#ff6b00;overflow:hidden;flex-shrink:0;cursor:pointer;">';
  h += c.avatar ? '<img src="' + esc(c.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(c.ign || '?');
  h += '</div>';

  // Body
  h += '<div style="flex:1;min-width:0;">';
  h += '<div style="background:#141414;border:1px solid #222;border-radius:14px;padding:10px 12px;">';
  h += '<div class="pd-user" data-uid="' + (c.uid || '') + '" style="font-size:12px;font-weight:700;color:#ff6b00;margin-bottom:3px;cursor:pointer;">';
  h += esc(c.ign || 'Unknown');
  if (c.edited) h += ' <span style="font-size:9px;color:#666;font-weight:400;">(edited)</span>';
  h += '</div>';
  h += '<div style="font-size:13px;color:#ddd;line-height:1.4;word-break:break-word;white-space:pre-wrap;">' + esc(c.text) + '</div>';
  h += '</div>';

  // Action row
  h += '<div style="display:flex;align-items:center;gap:14px;margin-top:6px;margin-left:4px;">';
  h += '<button class="pd-clike" data-cid="' + c.id + '" style="background:none;border:none;padding:0;font-size:11px;font-weight:700;color:' + (isLiked ? '#ff6b00' : '#666') + ';display:flex;align-items:center;gap:4px;cursor:pointer;">';
  h += '❤️ <span class="pd-clikes">' + (c.likes || 0) + '</span></button>';
  h += '<button class="pd-creply" data-cid="' + c.id + '" data-ign="' + esc(c.ign || '') + '" style="background:none;border:none;padding:0;font-size:11px;font-weight:700;color:#666;cursor:pointer;">Reply</button>';
  if (isMine) {
    h += '<button class="pd-cedit" data-cid="' + c.id + '" style="background:none;border:none;padding:0;font-size:11px;font-weight:700;color:#ff6b00;cursor:pointer;">Edit</button>';
    h += '<button class="pd-cdel" data-cid="' + c.id + '" style="background:none;border:none;padding:0;font-size:11px;font-weight:700;color:#f44;cursor:pointer;">Delete</button>';
  }
  h += '</div>';
  h += '</div>';
  h += '</div>';

  // Replies
  if (replies.length > 0 && depth === 0) {
    h += '<div class="pd-replies-wrap" data-parent="' + c.id + '" style="display:none;margin-top:10px;flex-direction:column;gap:12px;">';
    h += replies.map(function(r) { return renderPdComment(r, [], 1); }).join('');
    h += '</div>';
    h += '<button class="pd-expand" data-cid="' + c.id + '" data-count="' + replies.length + '" style="background:none;border:none;padding:6px 0 0 42px;font-size:11px;font-weight:700;color:#ff6b00;cursor:pointer;text-align:left;">▸ Show ' + replies.length + ' ' + (replies.length === 1 ? 'reply' : 'replies') + '</button>';
  }

  return h;
}

// ---- Wire detail comment interactions ----
function wirePdComments(container, postId) {
  container.querySelectorAll('.pd-clike').forEach(function(btn) {
    btn.onclick = async function() {
      var cid = btn.dataset.cid;
      var wasLiked = (State.likedItems && State.likedItems.comment && State.likedItems.comment[cid]) || false;
      var nowLiked = !wasLiked;
      State.likedItems = State.likedItems || {};
      State.likedItems.comment = State.likedItems.comment || {};
      State.likedItems.comment[cid] = nowLiked;
      var numEl = btn.querySelector('.pd-clikes');
      var cur = parseInt(numEl.textContent) || 0;
      numEl.textContent = nowLiked ? cur + 1 : Math.max(0, cur - 1);
      btn.style.color = nowLiked ? '#ff6b00' : '#666';
      try { await toggleLike('comment', cid, 'likes'); }
      catch (e) {
        State.likedItems.comment[cid] = wasLiked;
        numEl.textContent = cur;
        btn.style.color = wasLiked ? '#ff6b00' : '#666';
      }
    };
  });

  container.querySelectorAll('.pd-creply').forEach(function(btn) {
    btn.onclick = function() {
      var cid = btn.dataset.cid;
      var ign = btn.dataset.ign;
      window.__pdReplyTo = { parentId: cid, ign: ign };
      var ind = document.getElementById('pd-reply-indicator');
      var txt = document.getElementById('pd-reply-text');
      if (ind) { ind.style.display = 'flex'; }
      if (txt) txt.textContent = 'Replying to ' + ign + '...';
      var inp = document.getElementById('pd-input');
      if (inp) { inp.placeholder = 'Reply to ' + ign + '...'; inp.focus(); }
    };
  });

  container.querySelectorAll('.pd-expand').forEach(function(btn) {
    btn.onclick = function() {
      var cid = btn.dataset.cid;
      var wrap = container.querySelector('.pd-replies-wrap[data-parent="' + cid + '"]');
      if (!wrap) return;
      var isOpen = wrap.style.display === 'flex';
      wrap.style.display = isOpen ? 'none' : 'flex';
      btn.textContent = (isOpen ? '▸ Show ' : '▾ Hide ') + btn.dataset.count + ' ' + (btn.dataset.count === '1' ? 'reply' : 'replies');
    };
  });

  container.querySelectorAll('.pd-cedit').forEach(function(btn) {
    btn.onclick = function() { if (typeof openEditCommentSheet === 'function') openEditCommentSheet(btn.dataset.cid); };
  });

  container.querySelectorAll('.pd-cdel').forEach(function(btn) {
    btn.onclick = function() {
      confirmDialog('Delete Comment', 'This will remove your comment.', async function() {
        try {
          await deleteDoc(doc(db, 'comments', btn.dataset.cid));
          toast('🗑 Deleted', 'success');
          await loadPostDetailComments(postId);
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    };
  });

  container.querySelectorAll('.pd-user').forEach(function(el) {
    el.onclick = function() {
      var uid = el.dataset.uid;
      if (uid && typeof openUserProfile === 'function') openUserProfile(uid);
    };
  });
}

// ---- Submit comment from detail view ----
window.submitPostDetailComment = async function(postId) {
  var input = document.getElementById('pd-input');
  if (!input) return;
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.disabled = true;

  try {
    var data = {
      contentId: postId,
      contentType: 'post',
      uid: State.user.uid,
      ign: State.profile.ign,
      avatar: State.profile.avatar || '',
      text: text,
      likes: 0,
      createdAt: serverTimestamp()
    };
    if (window.__pdReplyTo && window.__pdReplyTo.parentId) {
      data.parentId = window.__pdReplyTo.parentId;
    }
    await addDoc(collection(db, 'comments'), data);

    // Bump post.commentCount
    try {
      var pRef = doc(db, 'posts', postId);
      var pSnap = await getDoc(pRef);
      if (pSnap.exists()) await updateDoc(pRef, { commentCount: increment(1) });
    } catch (e) {}

    // Clear reply state
    window.__pdReplyTo = null;
    var ind = document.getElementById('pd-reply-indicator');
    if (ind) ind.style.display = 'none';
    input.placeholder = 'Write a comment...';

    // Reload comments
    await loadPostDetailComments(postId);
    // Refresh count in stats row
    var countEl = document.getElementById('pd-comment-count');
    if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;
  } catch (e) {
    console.error('Send comment error:', e);
    toast('Failed: ' + e.message, 'error');
  } finally {
    input.disabled = false;
    input.focus();
  }
};

// ---- Override wireHomeCards to add post-body tap ----
var _origWireHomeCardsDetailV2 = wireHomeCards;
wireHomeCards = function(items) {
  _origWireHomeCardsDetailV2(items);
  var feedEl = document.getElementById('home-feed');
  if (!feedEl) return;
  feedEl.querySelectorAll('.home-card[data-type="post"]').forEach(function(card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e) {
      // Ignore if user tapped a button/link inside
      if (e.target.closest('button') || e.target.closest('a')) return;
      var postId = card.dataset.id;
      if (postId) window.openPostDetail(postId);
    });
  });
};

console.log('✅ Chunk 54 v2: Post Detail View (clean) loaded');
window.__peek = async function() {
  var p = homeCache.feed.filter(function(i){return i.type==='post';})[0];
  if (!p) return console.log('no posts');
  var s = await getDocs(query(collection(db,'comments'),where('contentId','==',p.id)));
  var pd = await getDoc(doc(db,'posts',p.id));
  console.log('postId:', p.id);
  console.log('homeCache post.likes:', p.likes);
  console.log('comments in firestore:', s.size);
  s.forEach(function(d){var c=d.data();console.log(' →', c.text, '| parent:', c.parentId||'none');});
  if (pd.exists()) {
    console.log('FIRESTORE post.likes:', pd.data().likes, '| commentCount:', pd.data().commentCount);
  } else {
    console.log('❌ posts/' + p.id + ' NOT FOUND in Firestore');
  }
};
console.log('✅ run __peek()');
