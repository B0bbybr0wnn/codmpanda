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

const ADMIN_UID = "PASTE_ADMIN_UID";
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
    // Redirect-first (mobile friendly, bypasses third-party cookie blocks)
    await signInWithRedirect(auth, provider);
  } catch (err) {
    console.error('Sign-in failed:', err);
    toast('Sign-in failed: ' + (err.message || 'Unknown error'), 'error');
  }
}

async function checkRedirect() {
  try {
    const result = await getRedirectResult(auth);
    console.log('=== REDIRECT RESULT ===');
    console.log('Result:', result);
    console.log('User:', result?.user);
    console.log('Current auth.currentUser:', auth.currentUser);
    if (result && result.user) {
      console.log('✅ Redirect login SUCCESS:', result.user.email);
    } else {
      console.log('❌ No redirect result — fresh load or failed');
    }
  } catch (e) {
    console.error('❌ Redirect error:', e.code, e.message);
    toast('Sign-in error: ' + e.message, 'error', 5000);
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
    window.open(room, '_blank');
    toast('Joined! Opening voice room...', 'success');
    maybeShowInterstitial();
  } catch (e) {
    console.error(e);
    window.open(lobby.jitsiLink || `https://meet.jit.si/CODMPanda-${lobbyId}`, '_blank');
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
