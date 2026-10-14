// ============================================
// CHUNK 1/24 — Core: Firebase + State + Constants
// ============================================

// ---------- FIREBASE IMPORTS ----------
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

// ---------- FIREBASE CONFIG ----------
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
const APP_VERSION = "2.0.0";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ============================================
// PRO BENEFITS — SINGLE SOURCE OF TRUTH
// ============================================
const PRO = {
  price: {
    monthly: '$1.99',
    lifetime: '$9.99',
    currency: 'USD'
  },
  links: {
    monthly: 'https://codmpanda.lemonsqueezy.com/checkout/buy/5213aceb-052a-415f-aec4-4f5167c91d5d',
    lifetime: 'https://codmpanda.lemonsqueezy.com/checkout/buy/5a5be449-8af9-4f09-88c5-da31131e6bac'
  },
  limits: {
    freeVaults: 3,
    freeCamoGuns: 5,
    freePostChars: 500,
    freePartySize: 5,
    proPostChars: 5000,
    proPartySize: 10
  },
  benefits: [
    { icon: 'package',      text: 'Unlimited Vault builds' },
    { icon: 'target',       text: 'Full Camo Tracker (all 80+ guns)' },
    { icon: 'shield',       text: 'Create & lead Clans' },
    { icon: 'trophy',       text: 'Host Tournaments' },
    { icon: 'palette',      text: 'All 5 profile themes' },
    { icon: 'sparkles',     text: 'Avatar frames (Gold, Fire, Ice, Neon)' },
    { icon: 'image',        text: 'Custom profile banner' },
    { icon: 'file-text',    text: 'Unlimited post length (5000 chars)' },
    { icon: 'users',        text: 'Party size up to 10 players' },
    { icon: 'bar-chart-3',  text: 'Post analytics (views & engagement)' },
    { icon: 'crown',        text: 'Gold crown badge everywhere' },
    { icon: 'badge-check',  text: 'Verified badge (with 10+ approvals)' },
    { icon: 'zap',          text: 'Priority LFG placement' },
    { icon: 'link',         text: 'Custom share links (?lobby=YourName)' },
    { icon: 'bell',         text: 'Instant leak alerts' },
    { icon: 'ban',          text: 'Zero ads, forever' },
    { icon: 'rocket',       text: 'Early access to new features' }
  ],
  verifiedRequires: {
    isPro: true,
    minApprovedCount: 10
  }
};

// ============================================
// GLOBAL STATE
// ============================================
const State = {
  user: null,
  profile: null,
  currentTab: 'home',

  unsubs: {
    lobbies: null,
    vaults: null,
    camos: null,
    clans: null,
    scrims: null,
    clips: null,
    leaks: null,
    homeLive: null,
    notifications: null
  },

  likedItems: {},

  home: {
    feed: [],
    filter: 'all',
    loading: false,
    lastFetch: 0
  },

  filters: {
    lobbies: { rank: 'all', mode: 'all', region: 'all', mic: false, search: '' },
    vaults: { type: 'gunsmith', search: '' },
    clips: { sort: 'recent' }
  },

  cache: {
    lobbies: [],
    vaults: [],
    camos: {},
    clans: [],
    scrims: [],
    clips: [],
    leaks: [],
    posts: []
  },

  stats: {
    vaultCount: 0,
    camoPct: 0
  },

  joinCount: 0,
  interstitialShown: false
};

function isPro() {
  return !!(State.profile && State.profile.isPro);
}

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

// ============================================
// CAMO DATA
// ============================================
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

// ============================================
// PLAYER DATA
// ============================================
const RANKS = [
  'Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Grandmaster',
  'Legendary', 'Mythic', 'Legendary Rank', 'Top 500'
];
const MODES = ['BR', 'MP', 'Ranked MP', 'Ranked BR', 'Zombies', 'Sniper Only', 'Scrim', 'Any'];
const REGIONS = ['Africa', 'EU', 'NA', 'SA', 'Asia', 'ME', 'Oceania', 'Global'];
const ROLES = ['Rusher', 'Sniper', 'Support', 'IGL', 'Anchor', 'Flex', 'Any'];

// ============================================
// HOME FILTERS
// ============================================
const HOME_FILTERS = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'lfg', label: 'LFG', emoji: '🎮' },
  { key: 'builds', label: 'Builds', emoji: '🔧' },
  { key: 'clips', label: 'Clips', emoji: '🎬' },
  { key: 'leaks', label: 'Leaks', emoji: '🔥' },
  { key: 'posts', label: 'Posts', emoji: '✍️' }
];

// ============================================
// SENSITIVITY FIELDS
// ============================================
const SENS_FIELDS = [
  { key: 'standard', label: 'Standard (Hip-Fire)', placeholder: 'e.g. 120' },
  { key: 'ads', label: 'ADS (Iron Sight)', placeholder: 'e.g. 130' },
  { key: 'ads2x', label: 'ADS 2x Scope', placeholder: 'e.g. 120' },
  { key: 'ads3x', label: 'ADS 3x Scope', placeholder: 'e.g. 120' },
  { key: 'ads4x', label: 'ADS 4x Scope', placeholder: 'e.g. 100' },
  { key: 'ads6x', label: 'ADS 6x Scope', placeholder: 'e.g. 100' },
  { key: 'sniper', label: 'Sniper Scope', placeholder: 'e.g. 120' },
  { key: 'gyro', label: 'Gyroscope', placeholder: 'e.g. 300 (0 = off)' }
];

const HUD_STYLES = ['2-Finger', '3-Finger', '4-Finger Claw', '5-Finger Claw', '6-Finger', 'Custom'];

// ============================================
// SOCIAL CONSTANTS
// ============================================
const CONTENT_TYPES = {
  POST: 'post',
  VAULT: 'vault',
  CLIP: 'clip',
  LEAK: 'leak',
  LOBBY: 'lobby',
  COMMENT: 'comment'
};

const CONTENT_COLLECTIONS = {
  post: 'posts',
  vault: 'vaults',
  clip: 'clips',
  leak: 'leaks',
  lobby: 'lobbies',
  comment: 'comments'
};

const CONTENT_COUNT_FIELDS = {
  post: 'likes',
  vault: 'likes',
  clip: 'likes',
  leak: 'hypes',
  lobby: 'likes',
  comment: 'likes'
};

const POST_CHAR_LIMIT_FREE = PRO.limits.freePostChars;
const POST_CHAR_LIMIT_PRO = PRO.limits.proPostChars;

// ============================================
// PROFILE THEMES
// ============================================
const PROFILE_THEMES = {
  dark: {
    name: 'AMOLED Dark',
    pro: false,
    gradient: 'linear-gradient(135deg, #111 0%, #0a0a0a 100%)',
    border: '#222222',
    glow: 'none',
    nameColor: '#ffffff'
  },
  gold: {
    name: 'Royal Gold',
    pro: true,
    gradient: 'linear-gradient(135deg, #1a1200 0%, #000000 100%)',
    border: '#FFD700',
    glow: '0 0 30px rgba(255, 215, 0, 0.4)',
    nameColor: '#FFD700'
  },
  fire: {
    name: 'Fire Storm',
    pro: true,
    gradient: 'linear-gradient(135deg, #1a0500 0%, #000000 60%, #1a0500 100%)',
    border: '#FF6B00',
    glow: '0 0 30px rgba(255, 107, 0, 0.5)',
    nameColor: '#FF6B00'
  },
  ice: {
    name: 'Ice Freeze',
    pro: true,
    gradient: 'linear-gradient(135deg, #001428 0%, #000000 100%)',
    border: '#00BFFF',
    glow: '0 0 30px rgba(0, 191, 255, 0.4)',
    nameColor: '#00BFFF'
  },
  galaxy: {
    name: 'Galaxy',
    pro: true,
    gradient: 'linear-gradient(135deg, #1a0033 0%, #000000 50%, #0a001a 100%)',
    border: '#AF52DE',
    glow: '0 0 30px rgba(175, 82, 222, 0.5)',
    nameColor: '#AF52DE'
  }
};

// ============================================
// AVATAR FRAMES — CODM THEMED
// ============================================
// Each frame is an SVG overlay ring designed to look like in-game cosmetics.
// Types: reactor core (pulsing orange), dragon scale (red/gold), ice crystal,
// plasma neon (purple/pink), gold rank (metallic tier 3 look).
const AVATAR_FRAMES = {
  none: {
    name: 'None',
    pro: false,
    render: function(innerHTML, size) {
      return `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; overflow: hidden; background: rgba(255, 107, 0, 0.15); display: flex; align-items: center; justify-content: center;">${innerHTML}</div>`;
    }
  },
  gold: {
    name: 'Legendary Gold',
    pro: true,
    render: function(innerHTML, size) {
      return `
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg style="position: absolute; inset: 0; width: 100%; height: 100%; animation: spin-slow 8s linear infinite;" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFF176"/>
                <stop offset="50%" stop-color="#FFD700"/>
                <stop offset="100%" stop-color="#B8860B"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-dasharray="4 2" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.6" />
          </svg>
          <div style="position: absolute; inset: 6px; border-radius: 50%; overflow: hidden; border: 2px solid #FFD700; box-shadow: 0 0 12px rgba(255, 215, 0, 0.6); display: flex; align-items: center; justify-content: center; background: #111;">${innerHTML}</div>
          <div style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-size: 10px;">👑</div>
        </div>
      `;
    }
  },
  reactor: {
    name: 'Reactor Core',
    pro: true,
    render: function(innerHTML, size) {
      return `
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg style="position: absolute; inset: 0; width: 100%; height: 100%;" viewBox="0 0 100 100">
            <defs>
              <radialGradient id="reactorGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.9"/>
                <stop offset="70%" stop-color="#FF3B00" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#FF6B00" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#reactorGlow)" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#FF6B00" stroke-width="2" opacity="0.8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="#FF3B00" stroke-width="1" stroke-dasharray="8 4" opacity="0.6">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="6s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <div style="position: absolute; inset: 7px; border-radius: 50%; overflow: hidden; border: 2px solid #FF6B00; box-shadow: 0 0 15px rgba(255, 107, 0, 0.8), inset 0 0 15px rgba(255, 107, 0, 0.4); display: flex; align-items: center; justify-content: center; background: #111; animation: pulse-glow 2s ease-in-out infinite;">${innerHTML}</div>
        </div>
      `;
    }
  },
  dragon: {
    name: 'Dragon Scale',
    pro: true,
    render: function(innerHTML, size) {
      return `
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg style="position: absolute; inset: 0; width: 100%; height: 100%;" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#E63946"/>
                <stop offset="50%" stop-color="#8B0000"/>
                <stop offset="100%" stop-color="#FFD700"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#dragonGrad)" stroke-width="3" />
            <path d="M 50 4 L 55 12 L 50 10 L 45 12 Z" fill="#FFD700" />
            <path d="M 50 96 L 55 88 L 50 90 L 45 88 Z" fill="#FFD700" />
            <path d="M 4 50 L 12 45 L 10 50 L 12 55 Z" fill="#FFD700" />
            <path d="M 96 50 L 88 45 L 90 50 L 88 55 Z" fill="#FFD700" />
            <circle cx="50" cy="50" r="43" fill="none" stroke="#E63946" stroke-width="1" stroke-dasharray="2 4" opacity="0.7" />
          </svg>
          <div style="position: absolute; inset: 6px; border-radius: 50%; overflow: hidden; border: 2px solid #E63946; box-shadow: 0 0 14px rgba(230, 57, 70, 0.7); display: flex; align-items: center; justify-content: center; background: #111;">${innerHTML}</div>
          <div style="position: absolute; bottom: -2px; right: -2px; font-size: 14px;">🐉</div>
        </div>
      `;
    }
  },
  ice: {
    name: 'Ice Crystal',
    pro: true,
    render: function(innerHTML, size) {
      return `
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg style="position: absolute; inset: 0; width: 100%; height: 100%;" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="iceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00D9FF"/>
                <stop offset="100%" stop-color="#00BFFF"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#iceGrad)" stroke-width="2" />
            <g opacity="0.85">
              <path d="M 50 2 L 50 16 M 44 8 L 56 8" stroke="#00D9FF" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M 50 98 L 50 84 M 44 92 L 56 92" stroke="#00D9FF" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M 2 50 L 16 50 M 8 44 L 8 56" stroke="#00D9FF" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M 98 50 L 84 50 M 92 44 L 92 56" stroke="#00D9FF" stroke-width="1.5" stroke-linecap="round"/>
            </g>
            <circle cx="50" cy="50" r="43" fill="none" stroke="#00D9FF" stroke-width="1" opacity="0.5"/>
          </svg>
          <div style="position: absolute; inset: 7px; border-radius: 50%; overflow: hidden; border: 2px solid #00D9FF; box-shadow: 0 0 14px rgba(0, 217, 255, 0.7), inset 0 0 10px rgba(0, 217, 255, 0.3); display: flex; align-items: center; justify-content: center; background: #111;">${innerHTML}</div>
          <div style="position: absolute; top: -3px; right: -3px; font-size: 12px;">❄️</div>
        </div>
      `;
    }
  },
  plasma: {
    name: 'Plasma Mythic',
    pro: true,
    render: function(innerHTML, size) {
      return `
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg style="position: absolute; inset: 0; width: 100%; height: 100%;" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="plasmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#AF52DE"/>
                <stop offset="50%" stop-color="#FF00FF"/>
                <stop offset="100%" stop-color="#FF6B00"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#plasmaGrad)" stroke-width="3" stroke-dasharray="10 3">
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#FF00FF" stroke-width="1" opacity="0.5">
              <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="6s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <div style="position: absolute; inset: 7px; border-radius: 50%; overflow: hidden; border: 2px solid #AF52DE; box-shadow: 0 0 18px rgba(175, 82, 222, 0.8), inset 0 0 12px rgba(255, 0, 255, 0.3); display: flex; align-items: center; justify-content: center; background: #111; animation: pulse-glow 2.5s ease-in-out infinite;">${innerHTML}</div>
          <div style="position: absolute; top: 50%; left: -6px; width: 4px; height: 4px; border-radius: 50%; background: #FF00FF; box-shadow: 0 0 6px #FF00FF;"></div>
          <div style="position: absolute; top: 50%; right: -6px; width: 4px; height: 4px; border-radius: 50%; background: #AF52DE; box-shadow: 0 0 6px #AF52DE;"></div>
        </div>
      `;
    }
  }
};

// Global CSS animations used by frames
(function injectFrameStyles() {
  if (document.getElementById('avatar-frame-styles')) return;
  const style = document.createElement('style');
  style.id = 'avatar-frame-styles';
  style.textContent = `
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(255, 107, 0, 0.6); }
      50% { box-shadow: 0 0 25px rgba(255, 107, 0, 1); }
    }
  `;
  document.head.appendChild(style);
})();

// ============================================
// EXPORT TO WINDOW
// ============================================
window.db = db;
window.auth = auth;
window.State = State;
window.PRO = PRO;
window.isPro = isPro;
window.CODM_GUNS = CODM_GUNS;
window.ALL_GUNS = ALL_GUNS;
window.CAMO_TYPES = CAMO_TYPES;
window.RANKS = RANKS;
window.MODES = MODES;
window.REGIONS = REGIONS;
window.ROLES = ROLES;
window.SENS_FIELDS = SENS_FIELDS;
window.HUD_STYLES = HUD_STYLES;
window.HOME_FILTERS = HOME_FILTERS;
window.CONTENT_TYPES = CONTENT_TYPES;
window.CONTENT_COLLECTIONS = CONTENT_COLLECTIONS;
window.CONTENT_COUNT_FIELDS = CONTENT_COUNT_FIELDS;
window.POST_CHAR_LIMIT_FREE = POST_CHAR_LIMIT_FREE;
window.POST_CHAR_LIMIT_PRO = POST_CHAR_LIMIT_PRO;
window.PROFILE_THEMES = PROFILE_THEMES;
window.AVATAR_FRAMES = AVATAR_FRAMES;
window.ADMIN_UID = ADMIN_UID;
window.APP_VERSION = APP_VERSION;
window.NOTIFY_WORKER_URL = NOTIFY_WORKER_URL;

// ============================================
// END OF CHUNK 1/24
// ============================================
// ============================================
// CHUNK 2/24 — Utilities + UI Primitives
// ============================================

// ---------- SAFE HTML ESCAPE ----------
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- TIME AGO ----------
function timeAgo(timestamp) {
  if (!timestamp) return 'just now';
  let date;
  if (timestamp.toDate) date = timestamp.toDate();
  else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
  else if (typeof timestamp === 'number') date = new Date(timestamp);
  else date = new Date(timestamp);

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + 'd ago';
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return weeks + 'w ago';
  return date.toLocaleDateString();
}

// ---------- INITIALS ----------
function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ---------- COPY TO CLIPBOARD ----------
async function copyText(text, label = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    toast(label, 'success');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(label, 'success'); }
    catch (err) { toast('Copy failed', 'error'); }
    ta.remove();
  }
}

// ---------- SHARE ----------
async function shareContent(title, text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
    }
  }
  copyText(url || text, 'Link copied!');
  return true;
}

// ---------- IMAGE COMPRESSION ----------
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

// ---------- LOAD IMAGE (for canvas rendering) ----------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ---------- REFERRAL CODE ----------
function generateReferralCode(uid) {
  return 'PANDA' + uid.slice(0, 6).toUpperCase();
}

// ============================================
// TOAST NOTIFICATIONS
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
  el.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg ${colors[type] || colors.info} pointer-events-auto`;
  el.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 flex-shrink-0"></i>
    <span class="text-sm font-medium flex-1">${esc(message)}</span>
  `;
  container.appendChild(el);
  if (window.lucide) window.lucide.createIcons();
  setTimeout(() => {
    el.classList.add('toast-exit');
    setTimeout(() => el.remove(), 250);
  }, duration);
}

// ============================================
// MODAL + SHEET
// ============================================
function closeModal() {
  const c = document.getElementById('modal-container');
  if (!c) return;
  c.classList.add('hidden');
  c.innerHTML = '';
}

function confirmDialog(title, message, onConfirm, confirmText = 'Confirm', danger = false) {
  const container = document.getElementById('modal-container');
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="modal-backdrop absolute inset-0 flex items-center justify-center p-6" onclick="if(event.target===this) closeModal()">
      <div class="bg-card border border-border rounded-2xl p-6 max-w-sm w-full slide-up">
        <h3 class="text-lg font-bold mb-2">${esc(title)}</h3>
        <p class="text-sm text-gray-400 mb-6">${esc(message)}</p>
        <div class="flex gap-3">
          <button onclick="closeModal()" class="btn-press flex-1 py-3 rounded-xl bg-cardAlt border border-border text-sm font-semibold">Cancel</button>
          <button id="confirm-btn" class="btn-press flex-1 py-3 rounded-xl ${danger ? 'bg-red-500' : 'bg-primary'} text-sm font-bold text-white">${esc(confirmText)}</button>
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

function closeSheet() {
  const c = document.getElementById('sheet-container');
  if (!c) return;
  c.classList.add('hidden');
  c.innerHTML = '';
}

function openSheet(contentHTML, title = '') {
  const container = document.getElementById('sheet-container');
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="modal-backdrop absolute inset-0" onclick="if(event.target===this) closeSheet()">
      <div class="sheet absolute bottom-0 left-0 right-0 slide-up">
        <div class="sticky top-0 z-10 bg-[#0a0a0a] pt-3 pb-3 px-5 border-b border-border">
          <div class="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-3"></div>
          ${title ? `<h3 class="text-lg font-bold">${esc(title)}</h3>` : ''}
        </div>
        <div class="px-5 pb-8 pt-4">${contentHTML}</div>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PHOTO VIEWER — FULL-SCREEN ZOOM
// ============================================
function openPhotoViewer(imageUrl, caption = '') {
  if (!imageUrl) return;

  const existing = document.getElementById('photo-viewer');
  if (existing) existing.remove();

  const viewer = document.createElement('div');
  viewer.id = 'photo-viewer';
  viewer.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9800;
    background: rgba(0, 0, 0, 0.97);
    display: flex;
    flex-direction: column;
    animation: photoFadeIn 0.2s ease-out;
    touch-action: none;
  `;

  viewer.innerHTML = `
    <div style="
      position: absolute;
      top: 0; left: 0; right: 0;
      padding: calc(env(safe-area-inset-top, 0px) + 16px) 16px 16px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 2;
      background: linear-gradient(180deg, rgba(0,0,0,0.8), transparent);
    ">
      <div style="font-size: 12px; color: #fff; font-weight: 700; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(caption)}</div>
      <button id="photo-close-btn" class="btn-press" style="
        width: 40px; height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.15);
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backdrop-filter: blur(10px);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <div id="photo-zoom-container" style="
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      padding: 60px 0;
    ">
      <img id="photo-zoom-img" src="${esc(imageUrl)}" style="
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transform: scale(1);
        transition: transform 0.15s ease-out;
        will-change: transform;
        user-select: none;
        -webkit-user-drag: none;
      " />
    </div>

    <div style="
      padding: 16px 16px calc(env(safe-area-inset-bottom, 0px) + 20px) 16px;
      display: flex;
      justify-content: center;
      gap: 12px;
      z-index: 2;
      background: linear-gradient(0deg, rgba(0,0,0,0.8), transparent);
    ">
      <button id="photo-save-btn" class="btn-press" style="
        padding: 12px 24px;
        border-radius: 14px;
        background: rgba(255, 107, 0, 0.9);
        border: none;
        color: #fff;
        font-size: 13px;
        font-weight: 800;
        font-family: Inter, sans-serif;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Save
      </button>
    </div>
  `;

  if (!document.getElementById('photo-viewer-styles')) {
    const style = document.createElement('style');
    style.id = 'photo-viewer-styles';
    style.textContent = `
      @keyframes photoFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(viewer);

  const closeViewer = () => {
    viewer.style.opacity = '0';
    viewer.style.transition = 'opacity 0.2s';
    setTimeout(() => viewer.remove(), 200);
  };
  document.getElementById('photo-close-btn').onclick = closeViewer;

  document.getElementById('photo-save-btn').onclick = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'codmpanda-' + Date.now() + '.jpg';
    a.target = '_blank';
    a.click();
    toast('Opening image...', 'success', 1500);
  };

  setupZoomGestures(viewer, document.getElementById('photo-zoom-img'));

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeViewer();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function setupZoomGestures(viewer, img) {
  let scale = 1;
  let startDistance = 0;
  let startScale = 1;
  let lastTap = 0;

  const updateScale = (newScale) => {
    scale = Math.max(1, Math.min(4, newScale));
    img.style.transform = `scale(${scale})`;
  };

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  viewer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      startDistance = getDistance(e.touches);
      startScale = scale;
    }
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap < 300) {
        updateScale(scale > 1 ? 1 : 2.5);
      }
      lastTap = now;
    }
  }, { passive: true });

  viewer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(e.touches);
      const ratio = dist / startDistance;
      updateScale(startScale * ratio);
    }
  }, { passive: false });

  viewer.addEventListener('wheel', (e) => {
    e.preventDefault();
    updateScale(scale - e.deltaY * 0.005);
  }, { passive: false });
}

// ============================================
// BADGES (Pro / Founder / Verified)
// ============================================
function renderBadges(user) {
  if (!user) return '';
  const badges = [];

  if (user.uid === ADMIN_UID || user.id === ADMIN_UID) {
    badges.push('<span class="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black">👑 FOUNDER</span>');
  } else if (user.isPro) {
    badges.push('<span class="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black">👑 PRO</span>');
  }

  if (user.verified) {
    badges.push('<span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; background: #1DA1F2; color: #fff; font-size: 9px; font-weight: 900; box-shadow: 0 0 8px rgba(29, 161, 242, 0.5);">✓</span>');
  }

  return badges.join(' ');
}

// ============================================
// AVATAR (clickable → profile)
// ============================================
function renderAvatar(user, size = 40) {
  if (!user) return '';
  const uid = user.uid || user.id || '';
  const ign = user.ign || user.displayName || 'Unknown';
  const avatar = user.avatar || user.photoURL || '';
  const frameKey = user.avatarFrame || 'none';
  const frame = AVATAR_FRAMES[frameKey] || AVATAR_FRAMES.none;

  const inner = avatar
    ? `<img src="${esc(avatar)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" loading="lazy" />`
    : `<span style="font-weight: 900; color: #FF6B00; font-size: ${Math.round(size * 0.4)}px;">${getInitials(ign)}</span>`;

  const wrapped = frame.render ? frame.render(inner, size) : `
    <div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: rgba(255, 107, 0, 0.15); display: flex; align-items: center; justify-content: center; overflow: hidden;">${inner}</div>
  `;

  return `
    <div class="profile-link" data-uid="${esc(uid)}" style="
      flex-shrink: 0;
      cursor: pointer;
      transition: transform 0.15s;
      display: inline-flex;
    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      ${wrapped}
    </div>
  `;
}

// ============================================
// USERNAME (clickable → profile)
// ============================================
function renderUsername(user, classes = 'font-bold text-sm') {
  if (!user) return '';
  const uid = user.uid || user.id || '';
  const ign = user.ign || user.displayName || 'Unknown';
  return `<span class="profile-link ${classes}" data-uid="${esc(uid)}" style="cursor: pointer; transition: color 0.15s;" onmouseover="this.style.color='#FF6B00'" onmouseout="this.style.color=''">${esc(ign)}</span>`;
}

// ============================================
// EMPTY STATE
// ============================================
function emptyState(icon, title, subtitle, ctaLabel, ctaFn) {
  const ctaHTML = (ctaLabel && ctaFn) ? `
    <button class="empty-cta-btn btn-press mt-5 px-6 py-3.5 rounded-2xl bg-primary font-black text-sm glow-primary flex items-center justify-center gap-2 mx-auto text-white">
      ${esc(ctaLabel)}
    </button>
  ` : '';

  if (ctaLabel && ctaFn) {
    setTimeout(() => {
      document.querySelectorAll('.empty-cta-btn').forEach(b => {
        if (!b.dataset.bound) {
          b.dataset.bound = '1';
          b.onclick = ctaFn;
        }
      });
    }, 0);
  }

  return `
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center fade-in">
      <div class="relative mb-5">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-gold/10 rounded-full blur-2xl"></div>
        <div class="relative w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center">
          <i data-lucide="${esc(icon)}" class="w-10 h-10 text-primary/70"></i>
        </div>
      </div>
      <div class="text-lg font-black mb-2">${esc(title)}</div>
      <div class="text-xs text-gray-500 max-w-[260px] leading-relaxed">${esc(subtitle || '')}</div>
      ${ctaHTML}
    </div>
  `;
}

// ============================================
// SKELETON LOADERS
// ============================================
function skeletonCard() {
  return `
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
  `;
}

// ============================================
// GLOBAL PROFILE LINK HANDLER
// ============================================
document.addEventListener('click', (e) => {
  const link = e.target.closest('.profile-link');
  if (!link) return;
  const uid = link.dataset.uid;
  if (!uid) return;
  e.stopPropagation();
  e.preventDefault();

  if (State.user && uid === State.user.uid) {
    if (typeof switchTab === 'function') switchTab('you');
    return;
  }

  if (typeof openUserProfile === 'function') {
    openUserProfile(uid);
  } else {
    toast('Profile loading...', 'info', 1000);
  }
}, true);

// ============================================
// GLOBAL PHOTO ZOOM HANDLER
// ============================================
document.addEventListener('click', (e) => {
  const img = e.target.closest('img.zoomable, img[data-zoom]');
  if (!img) return;
  e.stopPropagation();
  e.preventDefault();
  const src = img.dataset.zoom || img.src;
  const caption = img.dataset.caption || img.alt || '';
  openPhotoViewer(src, caption);
}, true);

// ============================================
// ESCAPE KEY CLOSES EVERYTHING
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('photo-viewer')) return;
  const sheet = document.getElementById('sheet-container');
  if (sheet && !sheet.classList.contains('hidden')) { closeSheet(); return; }
  const modal = document.getElementById('modal-container');
  if (modal && !modal.classList.contains('hidden')) { closeModal(); return; }
});

// ============================================
// EXPORT TO WINDOW
// ============================================
window.esc = esc;
window.timeAgo = timeAgo;
window.getInitials = getInitials;
window.copyText = copyText;
window.shareContent = shareContent;
window.compressImage = compressImage;
window.loadImage = loadImage;
window.generateReferralCode = generateReferralCode;
window.toast = toast;
window.closeModal = closeModal;
window.confirmDialog = confirmDialog;
window.closeSheet = closeSheet;
window.openSheet = openSheet;
window.openPhotoViewer = openPhotoViewer;
window.renderBadges = renderBadges;
window.renderAvatar = renderAvatar;
window.renderUsername = renderUsername;
window.emptyState = emptyState;
window.skeletonCard = skeletonCard;

// ============================================
// END OF CHUNK 2/24
// ============================================
// ============================================
// CHUNK 3/24 — Auth + Onboarding + Tab Router
// ============================================

const GOOGLE_CLIENT_ID = "604146891375-ae5bhcm2nd2f59f0npp3en6setthjg1s.apps.googleusercontent.com";
let gisInitialized = false;

// ============================================
// SIGN IN (Google Identity Services)
// ============================================
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
            reject(new Error('Google sign-in failed to load'));
          }
        }, 100);
      });
    }

    initGIS();

    window.google.accounts.id.prompt(function(notification) {
      if (notification.isNotDisplayed && notification.isNotDisplayed()) {
        fallbackRenderGISButton();
      }
    });
  } catch (err) {
    console.error('GIS error:', err);
    toast('Sign-in failed: ' + err.message, 'error', 5000);
  }
}

function initGIS() {
  if (gisInitialized) return;
  if (!window.google || !window.google.accounts) return;
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGISResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  gisInitialized = true;
}

function fallbackRenderGISButton() {
  openSheet(
    '<div class="text-center space-y-4">' +
      '<div style="font-size: 48px;">🐼</div>' +
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
    closeSheet();
    const credential = GoogleAuthProvider.credential(response.credential);
    const result = await signInWithCredential(auth, credential);
    toast('Signed in!', 'success');
  } catch (err) {
    console.error('Firebase credential error:', err);
    toast('Sign-in failed: ' + err.message, 'error', 5000);
  }
}

// ============================================
// SIGN OUT
// ============================================
async function handleSignOut() {
  confirmDialog('Sign Out', 'Are you sure you want to sign out?', async () => {
    try {
      // Kill all live listeners
      Object.keys(State.unsubs).forEach(key => {
        if (State.unsubs[key]) {
          try { State.unsubs[key](); } catch (e) {}
          State.unsubs[key] = null;
        }
      });
      await signOut(auth);
      location.reload();
    } catch (e) {
      toast('Sign out failed', 'error');
    }
  }, 'Sign Out', true);
}

// ============================================
// REDIRECT RESULT (fallback sign-in method)
// ============================================
async function checkRedirect() {
  try {
    await getRedirectResult(auth);
  } catch (e) {
    console.error('Redirect error:', e);
  }
}

// ============================================
// ENSURE USER PROFILE (creates doc for new users)
// ============================================
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
      onboardingDone: false,
      // Social defaults
      friends: [],
      friendRequests: [],
      friendRequestsSent: [],
      themeStyle: 'dark',
      avatarFrame: 'none',
      approvedCount: 0,
      badges: [],
      tournamentWins: 0,
      // Notification prefs
      notificationsEnabled: false,
      fcmTokens: [],
      notifLfg: false,
      notifLeaks: false,
      // Privacy prefs
      showOnline: true,
      privateProfile: false,
      hideLeaderboard: false
    };
    await setDoc(userRef, defaultProfile);
    return { ...defaultProfile, isNew: true };
  }

  return { ...snap.data(), isNew: false };
}

// ============================================
// LAST SEEN UPDATER
// ============================================
async function updateLastSeen() {
  if (!State.user) return;
  if (State.profile && State.profile.showOnline === false) return;
  try {
    await updateDoc(doc(db, 'users', State.user.uid), { lastSeen: serverTimestamp() });
  } catch (e) { /* silent */ }
}

// ============================================
// AUTH STATE LISTENER
// ============================================
onAuthStateChanged(auth, async (user) => {
  const splash = document.getElementById('splash');
  if (splash) splash.classList.add('hidden');

  if (user) {
    State.user = user;
    try {
      const profile = await ensureUserProfile(user);
      State.profile = profile;

      // Load liked items in background
      setTimeout(loadLikedItems, 1000);

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

// ============================================
// SCREENS
// ============================================
function showAuthGate() {
  const gate = document.getElementById('auth-gate');
  gate.classList.remove('hidden');
  gate.classList.add('flex');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');

  const signBtn = document.getElementById('google-signin-btn');
  if (signBtn && !signBtn.dataset.bound) {
    signBtn.dataset.bound = '1';
    signBtn.onclick = handleSignIn;
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// ONBOARDING
// ============================================
let onboardingStep = 0;
const onboardingData = { rank: 'Rookie', region: 'Africa' };

const ONBOARDING_SLIDES = [
  { emoji: '🎮', title: 'Find Your Squad', desc: 'Real-time LFG board. Filter by rank, mode, region. Join lobbies with one tap via voice.' },
  { emoji: '🔬', title: 'Track Every Camo', desc: 'All 80+ guns. Sand to Damascus. Track progress, upload proofs, export your grind.' },
  { emoji: '⚔️', title: 'Build God Gunsmiths', desc: 'Share and discover the meta. Copy codes, browse attachments, like the best builds.' }
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
  if (!container) return;

  if (onboardingStep < ONBOARDING_SLIDES.length) {
    const slide = ONBOARDING_SLIDES[onboardingStep];
    container.innerHTML = `
      <div class="flex-1 flex flex-col justify-center px-6 fade-in">
        <div class="relative mb-12">
          <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
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
        <button id="onb-next" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary text-white">
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
        <div style="font-size: 48px; text-align: center; margin-bottom: 24px;">🐼</div>
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
        <button id="onb-finish" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary text-white">
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

// ============================================
// MAIN APP
// ============================================
function showMainApp() {
  document.getElementById('auth-gate').classList.add('hidden');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');

  const subtitle = document.getElementById('top-bar-subtitle');
  if (subtitle && State.profile) {
    subtitle.textContent = `${State.profile.rank || 'Rookie'} • ${State.profile.region || 'Global'}`;
  }

  // Wire tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  // Wire notifications bell
  const notifBtn = document.getElementById('btn-notifications');
  if (notifBtn) {
    notifBtn.onclick = () => {
      if (typeof openNotificationsPanel === 'function') openNotificationsPanel();
      else toast('Notifications loading...', 'info', 1000);
    };
  }

  // Track activity
  updateLastSeen();
  setInterval(updateLastSeen, 60000);

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // Default tab: Home
  switchTab('home');

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// TAB ROUTER
// ============================================
function switchTab(tab) {
  State.currentTab = tab;

  // Update tab button states
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('tab-active', isActive);
    btn.classList.toggle('text-gray-500', !isActive);
  });

  // Cleanup unsubs from other tabs
  if (State.unsubs.lobbies && tab !== 'play') { State.unsubs.lobbies(); State.unsubs.lobbies = null; }
  if (State.unsubs.vaults && tab !== 'lab') { State.unsubs.vaults(); State.unsubs.vaults = null; }
  if (State.unsubs.camos && tab !== 'lab') { State.unsubs.camos(); State.unsubs.camos = null; }
  if (State.unsubs.clans && tab !== 'squad') { State.unsubs.clans(); State.unsubs.clans = null; }
  if (State.unsubs.scrims && tab !== 'squad') { State.unsubs.scrims(); State.unsubs.scrims = null; }
  if (State.unsubs.clips && tab !== 'squad') { State.unsubs.clips(); State.unsubs.clips = null; }
  if (State.unsubs.leaks && tab !== 'intel') { State.unsubs.leaks(); State.unsubs.leaks = null; }
  if (State.unsubs.homeLive && tab !== 'home') {
    try { State.unsubs.homeLive(); } catch (e) {}
    State.unsubs.homeLive = null;
  }

  // Clear content area
  const content = document.getElementById('content');
  content.innerHTML = '';
  content.scrollTop = 0;
  window.scrollTo(0, 0);

  // Route to renderer
  const renderers = {
    home: typeof renderHomeTab === 'function' ? renderHomeTab : null,
    play: typeof renderPlayTab === 'function' ? renderPlayTab : null,
    lab: typeof renderLabTab === 'function' ? renderLabTab : null,
    squad: typeof renderSquadTab === 'function' ? renderSquadTab : null,
    intel: typeof renderIntelTab === 'function' ? renderIntelTab : null,
    you: typeof renderYouTab === 'function' ? renderYouTab : null
  };

  if (renderers[tab]) {
    try {
      renderers[tab]();
    } catch (e) {
      console.error('Tab render error:', tab, e);
      content.innerHTML = '<div class="p-8 text-center text-red-400 text-sm">Failed to load ' + tab + ' tab</div>';
    }
  } else {
    content.innerHTML = '<div class="p-8 text-center text-gray-500 text-sm">Coming soon...</div>';
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// LIKED ITEMS LOADER (used by all social features)
// ============================================
async function loadLikedItems() {
  if (!State.user) return;
  try {
    State.likedItems = {};
    const snap = await getDocs(query(
      collection(db, 'likes'),
      where('userId', '==', State.user.uid),
      limit(500)
    ));
    snap.forEach(d => {
      const data = d.data();
      if (!data.itemType || !data.itemId) return;
      if (!State.likedItems[data.itemType]) State.likedItems[data.itemType] = {};
      State.likedItems[data.itemType][data.itemId] = true;
    });
    console.log('✅ Loaded', snap.size, 'user likes');
  } catch (e) {
    console.warn('Load likes error:', e);
  }
}


// ========================================
// EXPORT
// ============================================
window.handleSignIn = handleSignIn;
window.handleSignOut = handleSignOut;
window.showAuthGate = showAuthGate;
window.showOnboarding = showOnboarding;
window.showMainApp = showMainApp;
window.switchTab = switchTab;
window.loadLikedItems = loadLikedItems;

// ============================================
// END OF CHUNK 3/24
// ============================================
// ============================================
// CHUNK 4/24 — Home Feed Core
// ============================================

// ============================================
// HOME TAB RENDERER
// ============================================
async function renderHomeTab() {
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
            <button class="home-filter-btn chip ${State.home.filter === f.key ? 'active' : ''}" data-filter="${f.key}" style="padding: 8px 6px; font-size: 11px; text-align: center;">
              ${f.emoji} ${f.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div id="home-feed">
        ${skeletonCard().repeat(3)}
      </div>
    </div>
  `;

  // Wire filter chips
  document.querySelectorAll('.home-filter-btn').forEach(btn => {
    btn.onclick = () => {
      State.home.filter = btn.dataset.filter;
      document.querySelectorAll('.home-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderHomeFeed();
    };
  });

  // Wire write button
  document.getElementById('home-write-btn').onclick = () => {
    if (typeof openWritePostSheet === 'function') openWritePostSheet();
    else toast('Composer loading...', 'info', 1000);
  };

  // Wire refresh button
  document.getElementById('home-refresh-btn').onclick = async () => {
    State.home.lastFetch = 0;
    toast('Refreshing...', 'info', 1000);
    await fetchHomeFeed();
    renderHomeFeed();
  };

  // Fetch with timeout guard
  const fetchPromise = fetchHomeFeed();
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 5000));
  const result = await Promise.race([fetchPromise, timeoutPromise]);

  if (result === 'timeout') {
    toast('Taking longer than usual...', 'warning', 2000);
  }

  renderHomeFeed();
  startHomeLiveUpdates();

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// FETCH UNIFIED FEED
// ============================================
async function fetchHomeFeed() {
  if (State.home.loading) return State.home.feed;
  State.home.loading = true;

  try {
    const now = Date.now();

    // Parallel fetch all content types
    const [lobbiesSnap, vaultsSnap, clipsSnap, leaksSnap, postsSnap] = await Promise.all([
      getDocs(query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'vaults'), orderBy('createdAt', 'desc'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'clips'), limit(30))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'leaks'), limit(20))).catch(() => ({ forEach: () => {} })),
      getDocs(query(collection(db, 'posts'), limit(30))).catch(() => ({ forEach: () => {} }))
    ]);

    const feed = [];

    // Lobbies (skip expired)
    lobbiesSnap.forEach(d => {
      const data = d.data();
      const expiresAt = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (expiresAt < now) return;
      feed.push({
        id: d.id,
        type: 'lobby',
        ...data,
        _sortTime: data.createdAt?.seconds || 0
      });
    });

    // Vaults
    vaultsSnap.forEach(d => {
      const data = d.data();
      feed.push({
        id: d.id,
        type: 'vault',
        ...data,
        _sortTime: data.createdAt?.seconds || 0
      });
    });

    // Clips
    clipsSnap.forEach(d => {
      const data = d.data();
      feed.push({
        id: d.id,
        type: 'clip',
        ...data,
        _sortTime: data.createdAt?.seconds || 0
      });
    });

    // Leaks
    leaksSnap.forEach(d => {
      const data = d.data();
      feed.push({
        id: d.id,
        type: 'leak',
        ...data,
        _sortTime: (data.createdAt || data.publishedAt)?.seconds || 0
      });
    });

    // Posts (skip expired)
    postsSnap.forEach(d => {
      const data = d.data();
      const expiresAt = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (expiresAt < now) return;
      feed.push({
        id: d.id,
        type: 'post',
        ...data,
        _sortTime: data.createdAt?.seconds || 0
      });
    });

    // Sort newest first
    feed.sort((a, b) => b._sortTime - a._sortTime);

    State.home.feed = feed;
    State.home.lastFetch = Date.now();
    State.home.loading = false;

    return feed;
  } catch (e) {
    console.error('Home feed fetch error:', e);
    State.home.loading = false;
    return State.home.feed;
  }
}

// ============================================
// RENDER FEED (with filter applied)
// ============================================
function renderHomeFeed() {
  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  let items = State.home.feed;

  // Apply filter
  if (State.home.filter !== 'all') {
    const typeMap = {
      lfg: 'lobby',
      builds: 'vault',
      clips: 'clip',
      leaks: 'leak',
      posts: 'post'
    };
    items = items.filter(i => i.type === typeMap[State.home.filter]);
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

// ============================================
// CARD ROUTER
// ============================================
function renderHomeCard(item) {
  switch (item.type) {
    case 'lobby': return renderHomeLobbyCard(item);
    case 'vault': return renderHomeVaultCard(item);
    case 'clip':  return renderHomeClipCard(item);
    case 'leak':  return renderHomeLeakCard(item);
    case 'post':  return renderHomePostCard(item);
    default: return '';
  }
}

// ============================================
// LOBBY CARD
// ============================================
function renderHomeLobbyCard(l) {
  const isMine = l.uid === State.user.uid;
  const playersText = `${l.players || 1}/5`;
  const isProLobby = l.isPro || false;

  return `
    <div class="home-card bg-card border ${isProLobby ? 'border-gold' : 'border-border'} rounded-2xl p-4 mb-3 fade-in" data-type="lobby" data-id="${l.id}" style="cursor: pointer;${isProLobby ? 'box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);' : ''}">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-black">🎮 LOBBY</span>
        ${isProLobby ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-gold to-yellow-500 text-black font-black">👑 PRIORITY</span>' : ''}
        <span class="text-[10px] text-gray-500">${timeAgo(l.createdAt)}</span>
        <div class="ml-auto text-right">
          <div class="text-xs font-black text-primary">${playersText}</div>
        </div>
      </div>

      <div class="flex items-start gap-3 mb-3">
        ${renderAvatar(l, 44)}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${renderUsername(l, 'font-bold text-sm')}
            ${renderBadges(l)}
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">${esc(l.rank || 'Rookie')}</span>
          </div>
          <div class="text-[10px] text-gray-500 mt-0.5">${esc(l.mode)} · ${esc(l.region)}${l.mic ? ' · 🎤' : ''}</div>
        </div>
      </div>

      ${l.note ? `<p class="text-xs text-gray-400 mb-3 line-clamp-2">${esc(l.note)}</p>` : ''}

      <div class="flex gap-2">
        <button class="home-join-btn btn-press flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-1.5" data-id="${l.id}">
          <i data-lucide="log-in" class="w-4 h-4"></i> Join
        </button>
        ${renderLikeButton('lobby', l.id, l.likes || 0)}
        <button class="home-share-btn btn-press w-11 h-11 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-type="lobby" data-id="${l.id}">
          <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// VAULT CARD
// ============================================
function renderHomeVaultCard(v) {
  const isSens = v.type === 'sens';
  const isHud = v.type === 'hud';

  return `
    <div class="home-card bg-card border border-border rounded-2xl p-4 mb-3 fade-in" data-type="vault" data-id="${v.id}" style="cursor: pointer;">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] px-2 py-1 rounded-full ${isSens ? 'bg-primary/15 text-primary' : isHud ? 'bg-gold/15 text-gold' : 'bg-primary/15 text-primary'} font-black">
          ${isSens ? '🎯 SENS' : isHud ? '🎮 HUD' : '🔧 BUILD'}
        </span>
        <span class="text-[10px] text-gray-500">${timeAgo(v.createdAt)}</span>
      </div>

      <div class="flex items-start gap-3 mb-3">
        ${renderAvatar(v, 44)}
        <div class="flex-1 min-w-0">
          <div class="font-bold text-sm">${esc(v.gunName || 'Build')}</div>
          <div class="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            by ${renderUsername(v, 'font-bold text-gray-400')}
            ${v.approved ? '<span class="text-green-400">· ✓ Approved</span>' : ''}
          </div>
        </div>
      </div>

      ${v.imageUrl ? `
        <img src="${esc(v.imageUrl)}" class="zoomable w-full h-40 object-cover rounded-xl mb-3" loading="lazy" />
      ` : ''}

      ${v.gunsmithCode && !isSens ? `
        <div class="bg-cardAlt border border-border rounded-lg p-2.5 mb-3">
          <div class="font-mono text-xs text-primary font-bold truncate">${esc(v.gunsmithCode)}</div>
        </div>
      ` : isSens ? `
        <div class="text-[10px] text-gray-500 mb-3 line-clamp-2">${esc(v.gunsmithCode || '')}</div>
      ` : ''}

      <div class="flex gap-2">
        <button class="home-view-vault-btn btn-press flex-1 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-bold" data-id="${v.id}">
          View Details
        </button>
        ${renderLikeButton('vault', v.id, v.likes || 0)}
        <button class="home-share-btn btn-press w-11 h-11 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-type="vault" data-id="${v.id}">
          <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// CLIP CARD
// ============================================
function renderHomeClipCard(c) {
  const embedUrl = getYouTubeEmbed(c.youtubeUrl);
  const isApproved = !!c.approved;
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
          ${renderAvatar(c, 32)}
          <div class="text-xs text-gray-400">by ${renderUsername({ uid: c.uid, ign: authorName }, 'text-white font-bold')} · ${esc(c.gunTag || 'CODM')}</div>
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
        ${renderLikeButton('clip', c.id, c.likes || 0)}
        <button class="home-share-btn btn-press text-primary" data-type="clip" data-id="${c.id}">
          <i data-lucide="share-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// LEAK CARD
// ============================================
function renderHomeLeakCard(l) {
  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-gold text-black',
    mythic: 'bg-red-500'
  };
  const authorName = l.submittedByIgn || l.authorIgn || 'CODMPanda';

  return `
    <div class="home-card bg-card border border-border rounded-2xl overflow-hidden mb-3 fade-in" data-type="leak" data-id="${l.id}">
      ${l.imageUrl ? `<img src="${esc(l.imageUrl)}" class="zoomable w-full h-44 object-cover" loading="lazy" />` : ''}
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="text-[10px] px-2 py-1 rounded-full bg-gold/15 text-gold font-black">🔥 LEAK</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full ${rarityColors[l.rarity] || 'bg-gray-500'} font-black uppercase">${esc(l.rarity || 'common')}</span>
          <span class="text-[10px] text-gray-500 ml-auto">${timeAgo(l.createdAt || l.publishedAt)}</span>
        </div>
        <h3 class="text-base font-bold mb-2">${esc(l.title)}</h3>
        ${l.body ? `<p class="text-xs text-gray-400 line-clamp-3 mb-3">${esc(l.body)}</p>` : ''}
        <div class="flex items-center justify-between pt-2 border-t border-border">
          ${renderLikeButton('leak', l.id, l.hypes || 0, 'flame')}
          <button class="home-share-btn btn-press text-primary" data-type="leak" data-id="${l.id}">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}


// ============================================
// EMPTY STATE
// ============================================
function renderHomeEmpty() {
  return `
    <div class="flex flex-col items-center justify-center py-12 px-6 text-center fade-in">
      <div class="relative mb-6">
        <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-gold/20 rounded-full blur-3xl"></div>
        <img src="/icon-512.png" alt="CODMPanda" class="relative w-24 h-24 rounded-3xl mx-auto" style="box-shadow: 0 0 40px rgba(255, 107, 0, 0.5);" onerror="this.style.display='none'" />
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
}

function wireHomeEmpty() {
  const write = document.getElementById('empty-write');
  if (write) write.onclick = () => {
    if (typeof openWritePostSheet === 'function') openWritePostSheet();
  };
  const lfg = document.getElementById('empty-lfg');
  if (lfg) lfg.onclick = () => switchTab('play');
  const build = document.getElementById('empty-build');
  if (build) build.onclick = () => { if (typeof labSubTab !== 'undefined') labSubTab = 'vault'; switchTab('lab'); };
  const clip = document.getElementById('empty-clip');
  if (clip) clip.onclick = () => { if (typeof squadSubTab !== 'undefined') squadSubTab = 'clips'; switchTab('squad'); };
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// LIVE UPDATES
// ============================================
let homeRefreshTimer = null;

function startHomeLiveUpdates() {
  stopHomeLiveUpdates();

  const subs = [];
  const schedule = () => {
    clearTimeout(homeRefreshTimer);
    homeRefreshTimer = setTimeout(async () => {
      if (State.currentTab !== 'home') return;
      await fetchHomeFeed();
      renderHomeFeed();
    }, 3000);
  };

  try {
    subs.push(onSnapshot(query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(15)), schedule, () => {}));
    subs.push(onSnapshot(query(collection(db, 'vaults'), orderBy('createdAt', 'desc'), limit(15)), schedule, () => {}));
    subs.push(onSnapshot(query(collection(db, 'clips'), limit(15)), schedule, () => {}));
    subs.push(onSnapshot(query(collection(db, 'leaks'), limit(10)), schedule, () => {}));
    subs.push(onSnapshot(query(collection(db, 'posts'), limit(15)), schedule, () => {}));
  } catch (e) {
    console.warn('Live updates failed:', e);
  }

  State.unsubs.homeLive = () => {
    subs.forEach(u => { try { u(); } catch (e) {} });
    clearTimeout(homeRefreshTimer);
  };
}

function stopHomeLiveUpdates() {
  if (State.unsubs.homeLive) {
    try { State.unsubs.homeLive(); } catch (e) {}
    State.unsubs.homeLive = null;
  }
}

// ============================================
// EXPORT
// ============================================
window.renderHomeTab = renderHomeTab;
window.fetchHomeFeed = fetchHomeFeed;
window.renderHomeFeed = renderHomeFeed;
window.renderHomeCard = renderHomeCard;
window.startHomeLiveUpdates = startHomeLiveUpdates;
window.stopHomeLiveUpdates = stopHomeLiveUpdates;

// ============================================
// END OF CHUNK 4/24
// ============================================
// ============================================
// CHUNK 5/24 — Post Cards + Composer
// ⚙️ UPDATE HERE: post card layout, character limits, edit window
// ============================================

// Post edit window — user can only edit their post within this time
const POST_EDIT_WINDOW_MINUTES = 30;

// Post lifespan — auto-cleanup after this
const POST_LIFESPAN_DAYS = 90;

// ============================================
// POST CARD RENDERER
// ============================================
function renderHomePostCard(post) {
  const isMine = post.uid === State.user.uid;
  const isEdited = !!post.editedAt;
  const isExpired = post.expiresAt
    ? (post.expiresAt.toMillis ? post.expiresAt.toMillis() : post.expiresAt.seconds * 1000) < Date.now()
    : false;

  return `
    <div class="home-card bg-card border border-border rounded-2xl p-4 mb-3 fade-in" data-type="post" data-id="${post.id}">
      <!-- Header -->
      <div class="flex items-start gap-3 mb-3">
        ${renderAvatar(post, 44)}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${renderUsername(post, 'font-bold text-sm')}
            ${renderBadges(post)}
          </div>
          <div class="text-[10px] text-gray-500 mt-0.5">
            ${timeAgo(post.createdAt)}${isEdited ? ' · edited' : ''}
          </div>
        </div>
        ${isMine ? `
          <button class="post-menu-btn w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0" data-id="${post.id}">
            <i data-lucide="more-vertical" class="w-3.5 h-3.5 text-white/70"></i>
          </button>
        ` : ''}
      </div>

      <!-- Body -->
      <p class="text-sm text-gray-200 whitespace-pre-wrap break-words mb-3">${esc(post.text)}</p>

      <!-- Image -->
      ${post.imageUrl ? `
        <img src="${esc(post.imageUrl)}" class="zoomable w-full rounded-xl mb-3" loading="lazy" data-caption="${esc(post.text.slice(0, 60))}" />
      ` : ''}

      <!-- Reactions row -->
      <div class="flex items-center justify-between pt-2 border-t border-border">
        <div class="flex items-center gap-3">
          ${renderReactionButton('post', post.id, post.reactions, post.myReaction)}
          ${renderCommentButton('post', post.id, post.commentCount || 0)}
        </div>
        <button class="post-share-btn btn-press text-primary" data-id="${post.id}">
          <i data-lucide="share-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// POST COMPOSER (WRITE)
// ============================================
function openWritePostSheet() {
  const pro = isPro();
  const limit = pro ? POST_CHAR_LIMIT_PRO : POST_CHAR_LIMIT_FREE;

  openSheet(`
    <div class="space-y-4">
      <!-- Author row -->
      <div class="flex items-center gap-3 mb-2">
        ${renderAvatar(State.profile, 44)}
        <div>
          <div class="text-sm font-bold">${esc(State.profile?.ign || 'You')}</div>
          <div class="text-[10px] text-gray-500">${pro ? '👑 Pro · Unlimited' : 'Free · ' + limit + ' chars'}</div>
        </div>
      </div>

      <!-- Textarea -->
      <div>
        <textarea id="post-text" rows="6" maxlength="${limit}" placeholder="What's on your mind, Panda?" style="font-size: 15px; line-height: 1.5;"></textarea>
        <div class="flex items-center justify-between mt-2">
          <span id="post-counter" class="text-[10px] text-gray-500">0 / ${limit}</span>
          ${!pro ? `<span id="pro-hint" class="text-[10px] text-gold font-bold hidden">👑 Upgrade for unlimited</span>` : ''}
        </div>
      </div>

      <!-- Image -->
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Image (optional)</label>
        <input id="post-image" type="file" accept="image/*" class="text-xs" />
      </div>

      <!-- Submit -->
      <button id="post-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary text-white">
        Post to Feed
      </button>
    </div>
  `, '✍️ Write Post');

  const textarea = document.getElementById('post-text');
  const counter = document.getElementById('post-counter');
  const proHint = document.getElementById('pro-hint');

  textarea.oninput = () => {
    const len = textarea.value.length;
    counter.textContent = len + ' / ' + limit;
    if (len > limit - 50) counter.classList.add('text-gold');
    else counter.classList.remove('text-gold');
    if (proHint) {
      if (len >= limit - 20) proHint.classList.remove('hidden');
      else proHint.classList.add('hidden');
    }
  };

  document.getElementById('post-submit').onclick = async () => {
    const text = textarea.value.trim();
    const fileInput = document.getElementById('post-image');

    if (text.length < 2) { toast('Write something first', 'error'); return; }
    if (text.length > limit) {
      toast('Max ' + limit + ' chars. Upgrade for unlimited.', 'error', 3000);
      if (!pro && typeof showProPaywall === 'function') showProPaywall('Post longer thoughts — Pro unlocks unlimited characters.');
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

      const expiresAt = Timestamp.fromMillis(Date.now() + POST_LIFESPAN_DAYS * 24 * 60 * 60 * 1000);

      await addDoc(collection(db, 'posts'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        isPro: isPro(),
        verified: !!State.profile.verified,
        text,
        imageUrl,
        reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
        reactionCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        expiresAt
      });

      toast('Posted!', 'success');
      closeSheet();
      State.home.lastFetch = 0;
      await fetchHomeFeed();
      renderHomeFeed();
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
// POST 3-DOT MENU (EDIT / DELETE / SHARE)
// ============================================
function openPostMenu(postId) {
  const post = State.home.feed.find(p => p.id === postId);
  if (!post) return;

  const createdMs = (post.createdAt?.seconds || 0) * 1000;
  const ageMinutes = (Date.now() - createdMs) / 60000;
  const canEdit = ageMinutes < POST_EDIT_WINDOW_MINUTES;

  openSheet(`
    <div class="space-y-2">
      <button id="pm-edit" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl ${canEdit ? 'bg-card border border-border' : 'bg-card/50 border border-border/50 opacity-50'} text-left" ${!canEdit ? 'disabled' : ''}>
        <i data-lucide="pencil" class="w-4 h-4 ${canEdit ? 'text-primary' : 'text-gray-600'}"></i>
        <div class="flex-1">
          <span class="text-sm font-bold ${canEdit ? '' : 'text-gray-500'}">Edit</span>
          ${!canEdit ? '<div class="text-[9px] text-gray-600">Edit window closed (' + POST_EDIT_WINDOW_MINUTES + ' min)</div>' : '<div class="text-[9px] text-gray-500">Available for ' + POST_EDIT_WINDOW_MINUTES + ' min after posting</div>'}
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
      url: location.origin + '/?post=' + post.id
    });
  };

  document.getElementById('pm-delete').onclick = () => {
    closeSheet();
    setTimeout(() => {
      confirmDialog('Delete Post', 'This will remove your post permanently.', async () => {
        try {
          await deleteDoc(doc(db, 'posts', post.id));
          State.home.feed = State.home.feed.filter(p => p.id !== post.id);
          renderHomeFeed();
          toast('Post deleted', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    }, 300);
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// EDIT POST
// ============================================
function openEditPostSheet(post) {
  const pro = isPro();
  const limit = pro ? POST_CHAR_LIMIT_PRO : POST_CHAR_LIMIT_FREE;

  openSheet(`
    <div class="space-y-4">
      <div class="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary">
        ✏️ Edit your post — window closes ${POST_EDIT_WINDOW_MINUTES} min after posting
      </div>

      <div>
        <textarea id="edit-post-text" rows="6" maxlength="${limit}">${esc(post.text)}</textarea>
        <div class="flex justify-between mt-2">
          <span id="edit-post-counter" class="text-[10px] text-gray-500">${post.text.length} / ${limit}</span>
        </div>
      </div>

      <button id="edit-post-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary text-white">
        Save Changes
      </button>
    </div>
  `, 'Edit Post');

  const textarea = document.getElementById('edit-post-text');
  const counter = document.getElementById('edit-post-counter');
  textarea.oninput = () => {
    counter.textContent = textarea.value.length + ' / ' + limit;
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
      toast('Updated', 'success');
      closeSheet();
      renderHomeFeed();
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// WIRE POST CARD INTERACTIONS
// ============================================
function wirePostCardInteractions(items) {
  const feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  // Post 3-dot menu
  feedEl.querySelectorAll('.post-menu-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openPostMenu(btn.dataset.id);
    };
  });

  // Post share
  feedEl.querySelectorAll('.post-share-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openShareSheet({
        title: 'CODMPanda Post',
        text: 'Check out this post on CODMPanda!',
        url: location.origin + '/?post=' + btn.dataset.id
      });
    };
  });
}

// ============================================
// EXPORT
// ============================================
window.renderHomePostCard = renderHomePostCard;
window.openWritePostSheet = openWritePostSheet;
window.openPostMenu = openPostMenu;
window.openEditPostSheet = openEditPostSheet;
window.wirePostCardInteractions = wirePostCardInteractions;
window.POST_EDIT_WINDOW_MINUTES = POST_EDIT_WINDOW_MINUTES;
window.POST_LIFESPAN_DAYS = POST_LIFESPAN_DAYS;

// ============================================
// END OF CHUNK 5/24
// ============================================
// ============================================
// CHUNK 6/24 — Likes + Reactions System
// ⚙️ UPDATE HERE: reaction types, pro gating, who-reacted sheet
// ============================================

// ============================================
// REACTION TYPES — SINGLE SOURCE OF TRUTH
// ============================================
// Free users can use the first 4. Pro unlocks the last 2.
const REACTIONS = [
  { key: 'like',   emoji: '❤️', label: 'Like',   free: true  },
  { key: 'fire',   emoji: '🔥', label: 'Fire',   free: true  },
  { key: 'dead',   emoji: '💀', label: 'Dead',   free: true  },
  { key: 'clutch', emoji: '⚡', label: 'Clutch', free: true  },
  { key: 'goat',   emoji: '🐐', label: 'GOAT',   free: false },
  { key: 'clown',  emoji: '🤡', label: 'Clown',  free: false }
];

// Quick lookup
const REACTIONS_BY_KEY = {};
REACTIONS.forEach(r => { REACTIONS_BY_KEY[r.key] = r; });

// ============================================
// LIKES COLLECTION — ONE DOC PER USER PER ITEM
// ============================================
// Doc ID: {contentType}_{contentId}_{userId}
// Example: post_abc123_USER456
// This ensures one reaction per user (switching replaces)
// ============================================

function reactionDocId(contentType, contentId, userId) {
  return contentType + '_' + contentId + '_' + userId;
}

// Get user's current reaction on an item
async function getUserReaction(contentType, contentId) {
  if (!State.user) return null;
  // Check cache first (fast)
  if (State.likedItems[contentType] && State.likedItems[contentType][contentId] !== undefined) {
    return State.likedItems[contentType][contentId] || null;
  }
  // Fetch from Firestore
  try {
    const ref = doc(db, 'likes', reactionDocId(contentType, contentId, State.user.uid));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      State.likedItems[contentType] = State.likedItems[contentType] || {};
      State.likedItems[contentType][contentId] = data.type || 'like';
      return data.type || 'like';
    }
  } catch (e) { /* silent */ }
  return null;
}

// ============================================
// TOGGLE REACTION
// ============================================
async function toggleReaction(contentType, contentId, reactionKey) {
  if (!State.user) return null;

  const reaction = REACTIONS_BY_KEY[reactionKey];
  if (!reaction) return null;

  // Pro gating
  if (!reaction.free && !isPro()) {
    if (typeof showProPaywall === 'function') {
      showProPaywall('🐐 GOAT and 🤡 Clown reactions are Pro-only.');
    } else {
      toast('Pro-only reaction', 'warning');
    }
    return null;
  }

  const docId = reactionDocId(contentType, contentId, State.user.uid);
  const ref = doc(db, 'likes', docId);

  // Get current state
  const current = State.likedItems[contentType]?.[contentId] || null;
  const collectionName = CONTENT_COLLECTIONS[contentType];
  const countField = CONTENT_COUNT_FIELDS[contentType] || 'likes';

  try {
    if (current === reactionKey) {
      // REMOVE — same reaction tapped again
      await deleteDoc(ref);
      State.likedItems[contentType] = State.likedItems[contentType] || {};
      delete State.likedItems[contentType][contentId];

      // Decrement counts on content doc
      const updates = {};
      updates['reactions.' + reactionKey] = increment(-1);
      updates['reactionCount'] = increment(-1);
      updates[countField] = increment(-1);
      await updateDoc(doc(db, collectionName, contentId), updates);

      return null;
    } else {
      // ADD or SWITCH
      const updates = {};
      updates['reactions.' + reactionKey] = increment(1);
      updates['reactionCount'] = increment(1);
      updates[countField] = increment(1);

      if (current) {
        // Switching — decrement old
        updates['reactions.' + current] = increment(-1);
        updates['reactionCount'] = increment(-1);
        updates[countField] = increment(-1);
      }

      await setDoc(ref, {
        userId: State.user.uid,
        contentType,
        contentId,
        type: reactionKey,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, collectionName, contentId), updates);

      State.likedItems[contentType] = State.likedItems[contentType] || {};
      State.likedItems[contentType][contentId] = reactionKey;

      return reactionKey;
    }
  } catch (e) {
    console.error('Reaction error:', e);
    toast('Failed: ' + e.message, 'error');
    return current;
  }
}

// ============================================
// RENDER REACTION BUTTON
// ============================================
function renderReactionButton(contentType, contentId, reactions, myReaction) {
  const currentReaction = myReaction || (State.likedItems[contentType]?.[contentId]) || null;
  const hasReacted = !!currentReaction;
  const currentEmoji = hasReacted ? REACTIONS_BY_KEY[currentReaction].emoji : '❤️';
  const total = (reactions && Object.values(reactions).reduce((a, b) => a + b, 0)) || 0;

  return `
    <button class="reaction-btn btn-press flex items-center gap-1.5 text-xs ${hasReacted ? 'text-primary' : 'text-gray-400'}"
      data-type="${esc(contentType)}"
      data-id="${esc(contentId)}"
      data-reaction="${esc(currentReaction || '')}">
      <span style="font-size: 15px;">${currentEmoji}</span>
      <span class="reaction-count">${total}</span>
    </button>
  `;
}

// ============================================
// REACTION PICKER SHEET
// ============================================
function openReactionPicker(contentType, contentId, currentReaction) {
  const pro = isPro();

  openSheet(`
    <div class="space-y-3">
      <div class="text-center">
        <div class="text-sm font-bold mb-1">React</div>
        <div class="text-[10px] text-gray-500">
          ${pro ? '👑 Pro — all reactions unlocked' : 'Free · 4 reactions. Pro unlocks 🐐 and 🤡'}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 pt-2">
        ${REACTIONS.map(r => {
          const isSelected = currentReaction === r.key;
          const isLocked = !r.free && !pro;
          return `
            <button class="reaction-pick btn-press flex flex-col items-center gap-1.5 p-3 rounded-2xl ${isSelected ? 'bg-primary/15 border-2 border-primary' : 'bg-card border border-border'} ${isLocked ? 'opacity-60' : ''}"
              data-type="${esc(contentType)}"
              data-id="${esc(contentId)}"
              data-key="${esc(r.key)}"
              data-locked="${isLocked}">
              <div style="font-size: 28px; position: relative;">
                ${r.emoji}
                ${isLocked ? '<div style="position: absolute; top: -4px; right: -8px; font-size: 12px;">👑</div>' : ''}
              </div>
              <span class="text-[10px] font-bold ${isSelected ? 'text-primary' : 'text-gray-400'}">${esc(r.label)}</span>
            </button>
          `;
        }).join('')}
      </div>

      ${currentReaction ? `
        <button id="remove-reaction-btn" class="btn-press w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs mt-2" data-type="${esc(contentType)}" data-id="${esc(contentId)}">
          Remove reaction
        </button>
      ` : ''}

      <button onclick="closeSheet()" class="text-xs text-gray-500 w-full pt-2">Cancel</button>
    </div>
  `, '');

  document.querySelectorAll('.reaction-pick').forEach(btn => {
    btn.onclick = async () => {
      const isLocked = btn.dataset.locked === 'true';
      if (isLocked) {
        closeSheet();
        setTimeout(() => {
          if (typeof showProPaywall === 'function') showProPaywall('Unlock 🐐 GOAT and 🤡 Clown reactions with Pro.');
        }, 300);
        return;
      }

      const cType = btn.dataset.type;
      const cId = btn.dataset.id;
      const key = btn.dataset.key;

      closeSheet();
      await applyReactionUpdate(cType, cId, key);
    };
  });

  const removeBtn = document.getElementById('remove-reaction-btn');
  if (removeBtn) {
    removeBtn.onclick = async () => {
      closeSheet();
      await applyReactionUpdate(removeBtn.dataset.type, removeBtn.dataset.id, currentReaction);
    };
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// APPLY REACTION + REFRESH UI
// ============================================
async function applyReactionUpdate(contentType, contentId, reactionKey) {
  const result = await toggleReaction(contentType, contentId, reactionKey);

  // Optimistic UI update — find the button in DOM
  const btn = document.querySelector(`.reaction-btn[data-type="${contentType}"][data-id="${contentId}"]`);
  if (btn) {
    const pro = isPro();
    const hasReacted = !!result;
    const emoji = hasReacted ? REACTIONS_BY_KEY[result].emoji : '❤️';

    btn.querySelector('span:first-child').textContent = emoji;
    btn.classList.toggle('text-primary', hasReacted);
    btn.classList.toggle('text-gray-400', !hasReacted);
    btn.dataset.reaction = result || '';

    // Bump count visually (best effort — will sync on next fetch)
    const countEl = btn.querySelector('.reaction-count');
    if (countEl) {
      let count = parseInt(countEl.textContent) || 0;
      // If switching or adding, +1; if removing, -1
      const wasReacted = !!btn.dataset.previousReaction;
      if (result) count += 1;
      else count = Math.max(0, count - 1);
      countEl.textContent = count;
    }
  }

  toast(result ? REACTIONS_BY_KEY[result].emoji + ' ' + REACTIONS_BY_KEY[result].label + '!' : 'Reaction removed', 'success', 1200);

  // Silent refresh in background
  setTimeout(() => {
    if (State.currentTab === 'home') {
      State.home.lastFetch = 0;
      fetchHomeFeed().then(() => renderHomeFeed());
    }
  }, 2000);
}

// ============================================
// WHO REACTED SHEET
// ============================================
async function openWhoReactedSheet(contentType, contentId) {
  openSheet(`
    <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
  `, 'Reactions');

  try {
    const snap = await getDocs(query(
      collection(db, 'likes'),
      where('contentType', '==', contentType),
      where('contentId', '==', contentId),
      limit(200)
    ));

    if (snap.empty) {
      const body = document.querySelector('#sheet-container .px-5');
      if (body) body.innerHTML = '<div class="text-center py-8 text-xs text-gray-500">No reactions yet</div>';
      return;
    }

    // Group by reaction type
    const grouped = {};
    REACTIONS.forEach(r => { grouped[r.key] = []; });

    const userIds = [];
    snap.forEach(d => {
      const data = d.data();
      if (!grouped[data.type]) return;
      grouped[data.type].push(data.userId);
      userIds.push(data.userId);
    });

    // Fetch user profiles in parallel
    const userProfiles = {};
    await Promise.all(userIds.slice(0, 50).map(async (uid) => {
      if (userProfiles[uid]) return;
      try {
        const s = await getDoc(doc(db, 'users', uid));
        if (s.exists()) userProfiles[uid] = { id: uid, ...s.data() };
      } catch (e) { /* skip */ }
    }));

    const totalCount = userIds.length;

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="text-[10px] text-gray-500 mb-3">${totalCount} reaction${totalCount === 1 ? '' : 's'}</div>

      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        ${REACTIONS.map(r => {
          const users = grouped[r.key] || [];
          if (users.length === 0) return '';
          return `
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span style="font-size: 18px;">${r.emoji}</span>
                <span class="text-xs font-bold">${esc(r.label)}</span>
                <span class="text-[10px] text-gray-500">· ${users.length}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                ${users.map(uid => {
                  const u = userProfiles[uid];
                  if (!u) return '';
                  return `
                    <button class="profile-link flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-card border border-border" data-uid="${esc(uid)}">
                      ${renderAvatar(u, 22)}
                      <span class="text-xs font-semibold">${esc(u.ign || 'Unknown')}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Who-reacted error:', e);
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-xs">Failed to load</div>';
  }
}

// ============================================
// GLOBAL REACTION CLICK HANDLER
// ============================================
// Short tap → opens picker
// Long press (>500ms) → opens who-reacted sheet
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.reaction-btn');
  if (!btn) return;
  e.stopPropagation();
  e.preventDefault();

  if (btn.dataset.longPressed === '1') {
    btn.dataset.longPressed = '0';
    return;
  }

  const contentType = btn.dataset.type;
  const contentId = btn.dataset.id;
  const currentReaction = btn.dataset.reaction || null;
  openReactionPicker(contentType, contentId, currentReaction);
}, true);

// Long press detection
document.addEventListener('touchstart', (e) => {
  const btn = e.target.closest('.reaction-btn');
  if (!btn) return;

  btn.dataset.longPressed = '0';
  const timer = setTimeout(() => {
    btn.dataset.longPressed = '1';
    // Vibrate if available
    if (navigator.vibrate) navigator.vibrate(30);
    const contentType = btn.dataset.type;
    const contentId = btn.dataset.id;
    openWhoReactedSheet(contentType, contentId);
  }, 550);

  const cancel = () => {
    clearTimeout(timer);
    btn.removeEventListener('touchend', cancel);
    btn.removeEventListener('touchmove', cancel);
    btn.removeEventListener('touchcancel', cancel);
  };
  btn.addEventListener('touchend', cancel);
  btn.addEventListener('touchmove', cancel);
  btn.addEventListener('touchcancel', cancel);
}, { passive: true });

// Desktop: right-click for who-reacted
document.addEventListener('contextmenu', (e) => {
  const btn = e.target.closest('.reaction-btn');
  if (!btn) return;
  e.preventDefault();
  openWhoReactedSheet(btn.dataset.type, btn.dataset.id);
});

// ============================================
// LOAD USER REACTIONS ON STARTUP
// ============================================
async function loadUserReactions() {
  if (!State.user) return;
  try {
    State.likedItems = {};
    const snap = await getDocs(query(
      collection(db, 'likes'),
      where('userId', '==', State.user.uid),
      limit(500)
    ));
    snap.forEach(d => {
      const data = d.data();
      if (!data.contentType || !data.contentId) return;
      if (!State.likedItems[data.contentType]) State.likedItems[data.contentType] = {};
      State.likedItems[data.contentType][data.contentId] = data.type || 'like';
    });
    console.log('Loaded', snap.size, 'user reactions');
  } catch (e) {
    console.warn('Load reactions error:', e);
  }
}

// ============================================
// EXPORT
// ============================================
window.REACTIONS = REACTIONS;
window.REACTIONS_BY_KEY = REACTIONS_BY_KEY;
window.renderReactionButton = renderReactionButton;
window.openReactionPicker = openReactionPicker;
window.openWhoReactedSheet = openWhoReactedSheet;
window.toggleReaction = toggleReaction;
window.loadUserReactions = loadUserReactions;

// ============================================
// END OF CHUNK 6/24
// ============================================
// ============================================
// CHUNK 7/24 — Comments System
// ⚙️ UPDATE HERE: comment layout, reply nesting, edit window
// ============================================

// Comment edit window
const COMMENT_EDIT_WINDOW_MINUTES = 15;

// ============================================
// COMMENT BUTTON RENDERER
// ============================================
function renderCommentButton(contentType, contentId, count) {
  return `
    <button class="comment-btn btn-press flex items-center gap-1.5 text-xs text-gray-400"
      data-type="${esc(contentType)}"
      data-id="${esc(contentId)}">
      <i data-lucide="message-circle" class="w-4 h-4"></i>
      <span class="comment-count">${count || 0}</span>
    </button>
  `;
}

// ============================================
// COMMENTS SHEET — MAIN ENTRY POINT
// ============================================
let commentReplyTo = null;

async function openCommentsSheet(contentType, contentId, title) {
  commentReplyTo = null;

  openSheet(`
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="text-xs font-bold text-gray-400 uppercase">Comments</div>
        <div id="comments-count" class="text-[10px] text-gray-500">Loading...</div>
      </div>

      <div id="comments-list" class="space-y-3 max-h-[55vh] overflow-y-auto pb-2">
        <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
      </div>

      <div class="sticky bottom-0 bg-[#0a0a0a] pt-3 border-t border-border">
        <div id="reply-indicator" class="hidden mb-2 flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
          <div id="reply-text" class="text-[10px] text-primary font-bold">Replying...</div>
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
  `, title || 'Comments');

  await loadComments(contentType, contentId);

  // Wire send
  const sendBtn = document.getElementById('comment-send');
  const input = document.getElementById('comment-input');
  if (sendBtn && input) {
    sendBtn.onclick = () => sendComment(contentType, contentId);
    input.onkeypress = (e) => {
      if (e.key === 'Enter') sendComment(contentType, contentId);
    };
  }

  // Wire cancel reply
  const cancelBtn = document.getElementById('cancel-reply');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      commentReplyTo = null;
      const indicator = document.getElementById('reply-indicator');
      if (indicator) indicator.classList.add('hidden');
      if (input) input.placeholder = 'Write a comment...';
    };
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// LOAD COMMENTS
// ============================================
async function loadComments(contentType, contentId) {
  const listEl = document.getElementById('comments-list');
  const countEl = document.getElementById('comments-count');
  if (!listEl) return;

  try {
    const snap = await getDocs(query(
      collection(db, 'comments'),
      where('contentType', '==', contentType),
      where('contentId', '==', contentId),
      limit(200)
    ));

    const comments = [];
    snap.forEach(d => comments.push({ id: d.id, ...d.data() }));
    comments.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    // Separate top-level vs replies
    const topLevel = comments.filter(c => !c.parentId);
    const repliesByParent = {};
    comments.filter(c => c.parentId).forEach(c => {
      if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
      repliesByParent[c.parentId].push(c);
    });

    if (countEl) countEl.textContent = comments.length + ' comment' + (comments.length === 1 ? '' : 's');

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

    wireCommentInteractions(listEl, contentType, contentId);

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Load comments error:', e);
    listEl.innerHTML = '<div class="text-center py-6 text-red-400 text-xs">Failed to load</div>';
  }
}

// ============================================
// COMMENT ROW
// ============================================
function renderCommentRow(c, replies) {
  const isMine = c.uid === State.user.uid;
  const createdMs = (c.createdAt?.seconds || 0) * 1000;
  const canEdit = isMine && (Date.now() - createdMs) < COMMENT_EDIT_WINDOW_MINUTES * 60000;
  const hasReplies = replies.length > 0;
  const myReaction = State.likedItems?.comment?.[c.id];
  const hasReacted = !!myReaction;

  return `
    <div class="comment-thread" data-comment-id="${c.id}">
      <div class="flex items-start gap-2.5">
        ${renderAvatar(c, 32)}
        <div class="flex-1 min-w-0">
          <div class="bg-cardAlt border border-border rounded-2xl px-3 py-2">
            <div class="flex items-center gap-1.5 mb-0.5 flex-wrap">
              ${renderUsername(c, 'text-[10px] font-bold text-primary')}
              ${renderBadges(c)}
              ${c.edited ? '<span class="text-[8px] text-gray-500">(edited)</span>' : ''}
            </div>
            <div class="text-xs text-gray-200 break-words whitespace-pre-wrap">${esc(c.text)}</div>
          </div>
          <div class="flex items-center gap-3 mt-1.5 ml-1">
            <button class="comment-reaction-btn text-[10px] ${hasReacted ? 'text-primary' : 'text-gray-500'} font-bold flex items-center gap-1"
              data-id="${c.id}">
              <span>${hasReacted ? '❤️' : '🤍'}</span>
              <span class="comment-like-count">${c.likes || 0}</span>
            </button>
            <button class="comment-reply-btn text-[10px] text-gray-500 font-bold" data-id="${c.id}" data-ign="${esc(c.ign)}">
              Reply
            </button>
            ${canEdit ? `
              <button class="comment-edit-btn text-[10px] text-primary font-bold" data-id="${c.id}">Edit</button>
            ` : ''}
            ${isMine ? `
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
  const createdMs = (r.createdAt?.seconds || 0) * 1000;
  const canEdit = isMine && (Date.now() - createdMs) < COMMENT_EDIT_WINDOW_MINUTES * 60000;

  return `
    <div class="flex items-start gap-2">
      ${renderAvatar(r, 26)}
      <div class="flex-1 min-w-0">
        <div class="bg-card border border-border rounded-2xl px-3 py-2">
          <div class="flex items-center gap-1.5 mb-0.5 flex-wrap">
            ${renderUsername(r, 'text-[10px] font-bold text-primary')}
            ${renderBadges(r)}
            ${r.edited ? '<span class="text-[8px] text-gray-500">(edited)</span>' : ''}
          </div>
          <div class="text-xs text-gray-200 break-words whitespace-pre-wrap">${esc(r.text)}</div>
        </div>
        <div class="flex items-center gap-3 mt-1.5 ml-1">
          <button class="comment-reaction-btn text-[10px] ${State.likedItems?.comment?.[r.id] ? 'text-primary' : 'text-gray-500'} font-bold flex items-center gap-1" data-id="${r.id}">
            <span>${State.likedItems?.comment?.[r.id] ? '❤️' : '🤍'}</span>
            <span class="comment-like-count">${r.likes || 0}</span>
          </button>
          ${canEdit ? `
            <button class="comment-edit-btn text-[10px] text-primary font-bold" data-id="${r.id}">Edit</button>
          ` : ''}
          ${isMine ? `
            <button class="comment-delete-btn text-[10px] text-red-400 font-bold" data-id="${r.id}">Delete</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// WIRE COMMENT INTERACTIONS
// ============================================
function wireCommentInteractions(container, contentType, contentId) {
  // Reaction (like)
  container.querySelectorAll('.comment-reaction-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const commentId = btn.dataset.id;
      const current = State.likedItems?.comment?.[commentId];

      try {
        const result = await toggleReaction('comment', commentId, 'like');

        // Update UI instantly
        const wasLiked = !!current;
        const nowLiked = !!result;
        const countEl = btn.querySelector('.comment-like-count');
        const iconEl = btn.querySelector('span:first-child');
        let count = parseInt(countEl.textContent) || 0;
        count = nowLiked ? count + 1 : Math.max(0, count - 1);
        countEl.textContent = count;
        iconEl.textContent = nowLiked ? '❤️' : '🤍';
        btn.classList.toggle('text-primary', nowLiked);
        btn.classList.toggle('text-gray-500', !nowLiked);
      } catch (e) {
        console.error('Comment like error:', e);
      }
    };
  });

  // Reply
  container.querySelectorAll('.comment-reply-btn').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      const commentIgn = btn.dataset.ign;
      commentReplyTo = { parentId: commentId, ign: commentIgn };

      const indicator = document.getElementById('reply-indicator');
      const replyText = document.getElementById('reply-text');
      if (indicator && replyText) {
        indicator.classList.remove('hidden');
        replyText.textContent = 'Replying to ' + commentIgn + '...';
      }
      const input = document.getElementById('comment-input');
      if (input) {
        input.placeholder = 'Reply to ' + commentIgn + '...';
        input.focus();
      }
    };
  });

  // Expand replies
  container.querySelectorAll('.comment-expand-btn').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      const repliesContainer = container.querySelector('.replies-container[data-parent="' + commentId + '"]');
      if (!repliesContainer) return;

      const isHidden = repliesContainer.classList.contains('hidden');
      if (isHidden) {
        repliesContainer.classList.remove('hidden');
        btn.textContent = '▾ Hide ' + btn.dataset.count + ' ' + (btn.dataset.count === '1' ? 'reply' : 'replies');
      } else {
        repliesContainer.classList.add('hidden');
        btn.textContent = '▸ Show ' + btn.dataset.count + ' ' + (btn.dataset.count === '1' ? 'reply' : 'replies');
      }
    };
  });

  // Edit
  container.querySelectorAll('.comment-edit-btn').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      // Find the text — walk up to bubble
      const thread = btn.closest('.comment-thread') || btn.closest('.flex');
      const bubble = thread?.querySelector('.text-xs.text-gray-200');
      const currentText = bubble ? bubble.textContent.trim() : '';
      openEditCommentSheet(commentId, currentText, contentType, contentId);
    };
  });

  // Delete
  container.querySelectorAll('.comment-delete-btn').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      confirmDialog('Delete Comment', 'This will remove your comment.', async () => {
        try {
          await deleteDoc(doc(db, 'comments', commentId));
          toast('Deleted', 'success');
          await loadComments(contentType, contentId);
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    };
  });
}

// ============================================
// SEND COMMENT
// ============================================
async function sendComment(contentType, contentId) {
  const input = document.getElementById('comment-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;

  try {
    const commentData = {
      contentType,
      contentId,
      uid: State.user.uid,
      ign: State.profile.ign,
      avatar: State.profile.avatar || '',
      isPro: isPro(),
      verified: !!State.profile.verified,
      text,
      likes: 0,
      createdAt: serverTimestamp()
    };

    if (commentReplyTo && commentReplyTo.parentId) {
      commentData.parentId = commentReplyTo.parentId;
    }

    await addDoc(collection(db, 'comments'), commentData);

    // Increment comment count on content doc
    const collectionName = CONTENT_COLLECTIONS[contentType];
    if (collectionName) {
      try {
        const contentRef = doc(db, collectionName, contentId);
        const contentSnap = await getDoc(contentRef);
        if (contentSnap.exists()) {
          await updateDoc(contentRef, { commentCount: increment(1) });
        }
      } catch (e) { /* silent */ }
    }

    // Notify content owner (if not self)
    notifyContentOwnerOfComment(contentType, contentId, text).catch(() => {});

    // Notify reply target (if replying)
    if (commentReplyTo && commentReplyTo.parentId) {
      notifyReplyTarget(commentReplyTo.parentId, text).catch(() => {});
    }

    commentReplyTo = null;
    const indicator = document.getElementById('reply-indicator');
    if (indicator) indicator.classList.add('hidden');
    input.placeholder = 'Write a comment...';

    await loadComments(contentType, contentId);
  } catch (e) {
    console.error('Send comment error:', e);
    toast('Failed: ' + e.message, 'error');
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// ============================================
// NOTIFICATIONS — CONTENT OWNER + REPLY TARGET
// ============================================
async function notifyContentOwnerOfComment(contentType, contentId, text) {
  try {
    const collectionName = CONTENT_COLLECTIONS[contentType];
    if (!collectionName) return;
    const snap = await getDoc(doc(db, collectionName, contentId));
    if (!snap.exists()) return;
    const data = snap.data();
    const ownerUid = data.uid || data.submittedByUid;
    if (!ownerUid || ownerUid === State.user.uid) return;

    if (typeof sendNotificationToUser === 'function') {
      await sendNotificationToUser(
        ownerUid,
        '💬 ' + State.profile.ign,
        text.length > 60 ? text.slice(0, 60) + '...' : text,
        { type: 'comment', contentType, contentId }
      );
    }
  } catch (e) { /* silent */ }
}

async function notifyReplyTarget(parentCommentId, text) {
  try {
    const snap = await getDoc(doc(db, 'comments', parentCommentId));
    if (!snap.exists()) return;
    const parent = snap.data();
    if (parent.uid === State.user.uid) return;

    if (typeof sendNotificationToUser === 'function') {
      await sendNotificationToUser(
        parent.uid,
        '💬 ' + State.profile.ign + ' replied',
        text.length > 60 ? text.slice(0, 60) + '...' : text,
        { type: 'reply' }
      );
    }
  } catch (e) { /* silent */ }
}

// ============================================
// EDIT COMMENT
// ============================================
function openEditCommentSheet(commentId, currentText, contentType, contentId) {
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
      toast('Comment edited', 'success');
      closeSheet();
      setTimeout(() => openCommentsSheet(contentType, contentId, 'Comments'), 300);
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// GLOBAL COMMENT BUTTON HANDLER
// ============================================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.comment-btn');
  if (!btn) return;
  e.stopPropagation();
  e.preventDefault();
  const contentType = btn.dataset.type;
  const contentId = btn.dataset.id;
  openCommentsSheet(contentType, contentId, 'Comments');
}, true);

// ============================================
// EXPORT
// ============================================
window.renderCommentButton = renderCommentButton;
window.openCommentsSheet = openCommentsSheet;
window.loadComments = loadComments;
window.sendComment = sendComment;
window.openEditCommentSheet = openEditCommentSheet;
window.COMMENT_EDIT_WINDOW_MINUTES = COMMENT_EDIT_WINDOW_MINUTES;

// ============================================
// END OF CHUNK 7/24
// ============================================
// ============================================
// CHUNK 8/24 — Post Detail View + Photo Zoom
// ⚙️ UPDATE HERE: detail view layout, related posts
// ============================================

// ============================================
// POST DETAIL — FULL SCREEN VIEW
// ============================================
async function openPostDetail(postId) {
  // Find post in cache first
  let post = State.home.feed.find(p => p.id === postId);

  // Fetch if not cached
  if (!post) {
    try {
      const snap = await getDoc(doc(db, 'posts', postId));
      if (!snap.exists()) {
        toast('Post not found', 'error');
        return;
      }
      post = { id: snap.id, type: 'post', ...snap.data() };
    } catch (e) {
      toast('Failed to load post', 'error');
      return;
    }
  }

  // Create overlay
  let overlay = document.getElementById('post-detail-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'post-detail-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 550;
    background: #050505;
    display: flex;
    flex-direction: column;
    animation: postDetailIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  `;

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
      display: flex;
      align-items: center;
      gap: 12px;
    ">
      <button id="detail-back-btn" class="btn-press" style="
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
      <div style="flex: 1; font-size: 15px; font-weight: 800; color: #fff;">Post</div>
    </div>

    <!-- Scrollable body -->
    <div id="post-detail-body" style="
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
    ">
      ${renderPostDetailContent(post)}
    </div>
  `;

  // Animation
  if (!document.getElementById('post-detail-styles')) {
    const style = document.createElement('style');
    style.id = 'post-detail-styles';
    style.textContent = `
      @keyframes postDetailIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  document.getElementById('detail-back-btn').onclick = () => closePostDetail();

  wirePostDetailInteractions(post);

  // Load comments inline
  await loadInlineComments(post.id);

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// CLOSE POST DETAIL
// ============================================
function closePostDetail() {
  const overlay = document.getElementById('post-detail-overlay');
  if (!overlay) return;
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.2s ease-out';
  setTimeout(() => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 200);
}

// ============================================
// POST DETAIL CONTENT
// ============================================
function renderPostDetailContent(post) {
  const isMine = post.uid === State.user.uid;
  const isEdited = !!post.editedAt;

  return `
    <!-- Author -->
    <div class="flex items-center gap-3 mb-4">
      ${renderAvatar(post, 48)}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          ${renderUsername(post, 'font-bold text-sm')}
          ${renderBadges(post)}
        </div>
        <div class="text-[10px] text-gray-500 mt-0.5">
          ${timeAgo(post.createdAt)}${isEdited ? ' · edited' : ''}
        </div>
      </div>
      ${isMine ? `
        <button id="detail-post-menu" class="btn-press w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
          <i data-lucide="more-vertical" class="w-4 h-4 text-gray-400"></i>
        </button>
      ` : ''}
    </div>

    <!-- Body -->
    <div class="text-base text-gray-100 whitespace-pre-wrap break-words mb-4 leading-relaxed">
      ${esc(post.text)}
    </div>

    <!-- Image (zoomable) -->
    ${post.imageUrl ? `
      <div class="mb-4 rounded-xl overflow-hidden bg-black">
        <img src="${esc(post.imageUrl)}"
             class="zoomable w-full cursor-zoom-in"
             loading="lazy"
             data-caption="${esc(post.text.slice(0, 80))}"
             data-zoom="${esc(post.imageUrl)}" />
      </div>
    ` : ''}

    <!-- Reactions bar -->
    <div class="flex items-center justify-between py-3 border-t border-b border-border mb-4">
      <div class="flex items-center gap-4">
        ${renderReactionButton('post', post.id, post.reactions, post.myReaction)}
        ${renderCommentButton('post', post.id, post.commentCount || 0)}
      </div>
      <button id="detail-share-btn" class="btn-press text-primary text-xs font-bold flex items-center gap-1.5">
        <i data-lucide="share-2" class="w-4 h-4"></i>
        Share
      </button>
    </div>

    <!-- Comments section -->
    <div class="mb-2">
      <div class="text-xs font-bold text-gray-400 uppercase mb-3">Comments</div>
      <div id="detail-comments-list" class="space-y-3">
        <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
      </div>
    </div>

    <!-- Comment input (sticky at bottom of detail) -->
    <div id="detail-comment-composer" class="sticky bottom-0 bg-[#050505] pt-3 border-t border-border mt-4">
      <div id="detail-reply-indicator" class="hidden mb-2 flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
        <div id="detail-reply-text" class="text-[10px] text-primary font-bold">Replying...</div>
        <button id="detail-cancel-reply" class="text-[10px] text-gray-400">✕</button>
      </div>
      <div class="flex gap-2">
        <input id="detail-comment-input" type="text" placeholder="Write a comment..." maxlength="300" class="flex-1" />
        <button id="detail-comment-send" class="btn-press w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <i data-lucide="send" class="w-5 h-5 text-white"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// WIRE POST DETAIL INTERACTIONS
// ============================================
function wirePostDetailInteractions(post) {
  const overlay = document.getElementById('post-detail-overlay');
  if (!overlay) return;

  // 3-dot menu
  const menuBtn = document.getElementById('detail-post-menu');
  if (menuBtn) {
    menuBtn.onclick = () => openPostMenu(post.id);
  }

  // Share
  const shareBtn = document.getElementById('detail-share-btn');
  if (shareBtn) {
    shareBtn.onclick = () => {
      openShareSheet({
        title: 'CODMPanda Post',
        text: 'Check out this post on CODMPanda!',
        url: location.origin + '/?post=' + post.id
      });
    };
  }

  // Reaction button — the global handler in Chunk 6 handles it
  // But we need to make sure the reaction reflects in feed after
  // That happens automatically on refresh

  // Comment input
  const sendBtn = document.getElementById('detail-comment-send');
  const input = document.getElementById('detail-comment-input');
  if (sendBtn && input) {
    sendBtn.onclick = () => sendDetailComment(post.id);
    input.onkeypress = (e) => {
      if (e.key === 'Enter') sendDetailComment(post.id);
    };
  }

  // Cancel reply
  const cancelBtn = document.getElementById('detail-cancel-reply');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      commentReplyTo = null;
      const ind = document.getElementById('detail-reply-indicator');
      if (ind) ind.classList.add('hidden');
      if (input) input.placeholder = 'Write a comment...';
    };
  }
}

// ============================================
// INLINE COMMENTS (in detail view)
// ============================================
async function loadInlineComments(postId) {
  const listEl = document.getElementById('detail-comments-list');
  if (!listEl) return;

  try {
    const snap = await getDocs(query(
      collection(db, 'comments'),
      where('contentType', '==', 'post'),
      where('contentId', '==', postId),
      limit(200)
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

    listEl.innerHTML = topLevel.map(c => renderInlineCommentRow(c, repliesByParent[c.id] || [])).join('');

    wireInlineCommentInteractions(listEl, postId);
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Inline comments error:', e);
    listEl.innerHTML = '<div class="text-center py-6 text-red-400 text-xs">Failed to load</div>';
  }
}

function renderInlineCommentRow(c, replies) {
  const isMine = c.uid === State.user.uid;
  const createdMs = (c.createdAt?.seconds || 0) * 1000;
  const canEdit = isMine && (Date.now() - createdMs) < COMMENT_EDIT_WINDOW_MINUTES * 60000;
  const hasReplies = replies.length > 0;
  const hasReacted = !!(State.likedItems?.comment?.[c.id]);

  return `
    <div class="inline-comment-thread" data-comment-id="${c.id}">
      <div class="flex items-start gap-2.5">
        ${renderAvatar(c, 34)}
        <div class="flex-1 min-w-0">
          <div class="bg-cardAlt border border-border rounded-2xl px-3 py-2">
            <div class="flex items-center gap-1.5 mb-0.5 flex-wrap">
              ${renderUsername(c, 'text-[11px] font-bold text-primary')}
              ${renderBadges(c)}
              ${c.edited ? '<span class="text-[8px] text-gray-500">(edited)</span>' : ''}
            </div>
            <div class="text-xs text-gray-200 break-words whitespace-pre-wrap">${esc(c.text)}</div>
          </div>
          <div class="flex items-center gap-3 mt-1.5 ml-1">
            <button class="inline-comment-reaction ${hasReacted ? 'text-primary' : 'text-gray-500'} text-[10px] font-bold flex items-center gap-1" data-id="${c.id}">
              <span>${hasReacted ? '❤️' : '🤍'}</span>
              <span class="inline-like-count">${c.likes || 0}</span>
            </button>
            <button class="inline-comment-reply text-[10px] text-gray-500 font-bold" data-id="${c.id}" data-ign="${esc(c.ign)}">
              Reply
            </button>
            ${canEdit ? `<button class="inline-comment-edit text-[10px] text-primary font-bold" data-id="${c.id}">Edit</button>` : ''}
            ${isMine ? `<button class="inline-comment-delete text-[10px] text-red-400 font-bold" data-id="${c.id}">Delete</button>` : ''}
          </div>
        </div>
      </div>

      ${hasReplies ? `
        <button class="inline-comment-expand text-[10px] text-primary font-bold mt-2 ml-10" data-id="${c.id}" data-count="${replies.length}">
          ▸ Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}
        </button>
        <div class="inline-replies hidden ml-10 mt-2 space-y-2" data-parent="${c.id}">
          ${replies.map(r => renderInlineReplyRow(r)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderInlineReplyRow(r) {
  const isMine = r.uid === State.user.uid;
  const createdMs = (r.createdAt?.seconds || 0) * 1000;
  const canEdit = isMine && (Date.now() - createdMs) < COMMENT_EDIT_WINDOW_MINUTES * 60000;

  return `
    <div class="flex items-start gap-2">
      ${renderAvatar(r, 26)}
      <div class="flex-1 min-w-0">
        <div class="bg-card border border-border rounded-2xl px-3 py-2">
          <div class="flex items-center gap-1.5 mb-0.5 flex-wrap">
            ${renderUsername(r, 'text-[10px] font-bold text-primary')}
            ${renderBadges(r)}
          </div>
          <div class="text-xs text-gray-200 break-words whitespace-pre-wrap">${esc(r.text)}</div>
        </div>
        <div class="flex items-center gap-3 mt-1.5 ml-1">
          <button class="inline-comment-reaction ${State.likedItems?.comment?.[r.id] ? 'text-primary' : 'text-gray-500'} text-[10px] font-bold flex items-center gap-1" data-id="${r.id}">
            <span>${State.likedItems?.comment?.[r.id] ? '❤️' : '🤍'}</span>
            <span class="inline-like-count">${r.likes || 0}</span>
          </button>
          ${canEdit ? `<button class="inline-comment-edit text-[10px] text-primary font-bold" data-id="${r.id}">Edit</button>` : ''}
          ${isMine ? `<button class="inline-comment-delete text-[10px] text-red-400 font-bold" data-id="${r.id}">Delete</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function wireInlineCommentInteractions(container, postId) {
  // Like
  container.querySelectorAll('.inline-comment-reaction').forEach(btn => {
    btn.onclick = async () => {
      const commentId = btn.dataset.id;
      try {
        const result = await toggleReaction('comment', commentId, 'like');
        const nowLiked = !!result;
        const countEl = btn.querySelector('.inline-like-count');
        const iconEl = btn.querySelector('span:first-child');
        let count = parseInt(countEl.textContent) || 0;
        count = nowLiked ? count + 1 : Math.max(0, count - 1);
        countEl.textContent = count;
        iconEl.textContent = nowLiked ? '❤️' : '🤍';
        btn.classList.toggle('text-primary', nowLiked);
        btn.classList.toggle('text-gray-500', !nowLiked);
      } catch (e) { toast('Failed', 'error'); }
    };
  });

  // Reply
  container.querySelectorAll('.inline-comment-reply').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      const ign = btn.dataset.ign;
      commentReplyTo = { parentId: commentId, ign };

      const ind = document.getElementById('detail-reply-indicator');
      const txt = document.getElementById('detail-reply-text');
      if (ind && txt) {
        ind.classList.remove('hidden');
        txt.textContent = 'Replying to ' + ign + '...';
      }
      const input = document.getElementById('detail-comment-input');
      if (input) {
        input.placeholder = 'Reply to ' + ign + '...';
        input.focus();
      }
    };
  });

  // Expand replies
  container.querySelectorAll('.inline-comment-expand').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const replies = container.querySelector('.inline-replies[data-parent="' + id + '"]');
      if (!replies) return;
      const isHidden = replies.classList.contains('hidden');
      if (isHidden) {
        replies.classList.remove('hidden');
        btn.textContent = '▾ Hide ' + btn.dataset.count + ' ' + (btn.dataset.count === '1' ? 'reply' : 'replies');
      } else {
        replies.classList.add('hidden');
        btn.textContent = '▸ Show ' + btn.dataset.count + ' ' + (btn.dataset.count === '1' ? 'reply' : 'replies');
      }
    };
  });

  // Edit
  container.querySelectorAll('.inline-comment-edit').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      const thread = btn.closest('.inline-comment-thread') || btn.closest('.flex.items-start');
      const bubble = thread?.querySelector('.text-xs.text-gray-200');
      const currentText = bubble ? bubble.textContent.trim() : '';
      openEditCommentSheet(commentId, currentText, 'post', postId);
    };
  });

  // Delete
  container.querySelectorAll('.inline-comment-delete').forEach(btn => {
    btn.onclick = () => {
      const commentId = btn.dataset.id;
      confirmDialog('Delete Comment', 'Remove this comment?', async () => {
        try {
          await deleteDoc(doc(db, 'comments', commentId));
          toast('Deleted', 'success');
          await loadInlineComments(postId);
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    };
  });
}

// ============================================
// SEND COMMENT FROM DETAIL VIEW
// ============================================
async function sendDetailComment(postId) {
  const input = document.getElementById('detail-comment-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;

  try {
    const data = {
      contentType: 'post',
      contentId: postId,
      uid: State.user.uid,
      ign: State.profile.ign,
      avatar: State.profile.avatar || '',
      isPro: isPro(),
      verified: !!State.profile.verified,
      text,
      likes: 0,
      createdAt: serverTimestamp()
    };

    if (commentReplyTo && commentReplyTo.parentId) {
      data.parentId = commentReplyTo.parentId;
    }

    await addDoc(collection(db, 'comments'), data);

    // Increment post comment count
    try {
      await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
    } catch (e) {}

    // Notify owner
    try {
      const postSnap = await getDoc(doc(db, 'posts', postId));
      if (postSnap.exists()) {
        const ownerUid = postSnap.data().uid;
        if (ownerUid && ownerUid !== State.user.uid && typeof sendNotificationToUser === 'function') {
          sendNotificationToUser(
            ownerUid,
            '💬 ' + State.profile.ign,
            text.length > 60 ? text.slice(0, 60) + '...' : text,
            { type: 'comment', contentType: 'post', contentId: postId }
          );
        }
      }
    } catch (e) {}

    commentReplyTo = null;
    const ind = document.getElementById('detail-reply-indicator');
    if (ind) ind.classList.add('hidden');
    input.placeholder = 'Write a comment...';

    await loadInlineComments(postId);
  } catch (e) {
    console.error('Send comment error:', e);
    toast('Failed: ' + e.message, 'error');
  } finally {
    input.disabled = false;
    input.focus();
  }
}

// ============================================
// DEEP LINK: ?post=xxx
// ============================================
function checkPostDeepLink() {
  const params = new URLSearchParams(location.search);
  const postId = params.get('post');
  if (!postId) return;
  setTimeout(() => openPostDetail(postId), 1500);
}

// ============================================
// ESCAPE KEY CLOSES DETAIL
// ============================================
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const detail = document.getElementById('post-detail-overlay');
  if (detail) {
    closePostDetail();
    return;
  }
});

// ============================================
// EXPORT
// ============================================
window.openPostDetail = openPostDetail;
window.closePostDetail = closePostDetail;
window.checkPostDeepLink = checkPostDeepLink;

// ============================================
// END OF CHUNK 8/24
// ============================================
// ============================================
// CHUNK 9/24 — Profile Links + User Viewer
// ⚙️ UPDATE HERE: profile view layout, action buttons
// ============================================

// ============================================
// USER PROFILE VIEWER
// ============================================
async function openUserProfile(uid) {
  if (!uid) return;

  // Self → go to You tab
  if (State.user && uid === State.user.uid) {
    switchTab('you');
    return;
  }

  openSheet(`
    <div class="text-center py-8"><div class="spinner mx-auto"></div></div>
  `, 'Profile');

  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      toast('User not found', 'error');
      return;
    }
    const u = { id: uid, ...snap.data() };

    // Privacy check
    if (u.privateProfile) {
      const mySnap = await getDoc(doc(db, 'users', State.user.uid));
      const myData = mySnap.exists() ? mySnap.data() : {};
      const isFriend = (myData.friends || []).includes(uid);
      if (!isFriend) {
        renderPrivateProfileSheet(u);
        return;
      }
    }

    // Fetch stats
    const [vaultSnap, camoSnap] = await Promise.all([
      getDocs(query(collection(db, 'vaults'), where('uid', '==', uid), limit(200))).catch(() => ({ size: 0 })),
      getDoc(doc(db, 'camos', uid)).catch(() => ({ exists: () => false }))
    ]);

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

    // Friend status
    const mySnap = await getDoc(doc(db, 'users', State.user.uid));
    const myData = mySnap.exists() ? mySnap.data() : {};
    const isFriend = (myData.friends || []).includes(uid);
    const reqSent = (myData.friendRequestsSent || []).includes(uid);
    const reqReceived = (myData.friendRequests || []).includes(uid);

    const friendsCount = (u.friends || []).length;
    const approvedCount = u.approvedCount || 0;
    const tournamentWins = u.tournamentWins || 0;
    const streak = u.activeStreak || 0;

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="space-y-4">
        ${renderProfileHeader(u)}

        <!-- Stats grid -->
        <div class="grid grid-cols-4 gap-2">
          ${renderStatCard('Vaults', vaultSnap.size, 'primary')}
          ${renderStatCard('Camos', camoPct + '%', 'gold')}
          ${renderStatCard('Friends', friendsCount, 'blue')}
          ${renderStatCard('Approved', approvedCount, 'green')}
        </div>

        ${streak > 0 ? `
          <div class="bg-gradient-to-r from-primary/15 to-transparent border border-primary/30 rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span style="font-size: 24px;">🔥</span>
              <div>
                <div class="text-xs font-bold">Active Streak</div>
                <div class="text-[10px] text-gray-500">Consecutive days in app</div>
              </div>
            </div>
            <div class="text-2xl font-black text-primary">${streak}</div>
          </div>
        ` : ''}

        ${(u.badges && u.badges.length > 0) || tournamentWins > 0 ? `
          <div class="bg-card border border-border rounded-2xl p-3">
            <div class="text-[10px] font-bold text-gray-400 uppercase mb-2">Achievements</div>
            <div class="flex flex-wrap gap-2">
              ${(u.badges || []).map(b => {
                const emoji = { first_leak: '🥉', rising: '🥈', legend: '🥇', elite: '💎' }[b] || '⭐';
                return '<span style="font-size: 22px;" title="' + esc(b) + '">' + emoji + '</span>';
              }).join('')}
              ${tournamentWins > 0 ? '<span style="font-size: 22px;" title="Tournament Champion">🏆×' + tournamentWins + '</span>' : ''}
            </div>
          </div>
        ` : ''}

        <!-- Action buttons -->
        <div class="space-y-2 pt-2">
          ${renderProfileActions(u, { isFriend, reqSent, reqReceived })}
        </div>
      </div>
    `;

    wireProfileActions(u, { isFriend, reqSent, reqReceived });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Profile view error:', e);
    toast('Failed to load profile', 'error');
  }
}

// ============================================
// PROFILE HEADER
// ============================================
function renderProfileHeader(u) {
  const isProUser = u.isPro || false;
  const theme = PROFILE_THEMES[u.themeStyle || 'dark'] || PROFILE_THEMES.dark;
  const lastSeenSec = u.lastSeen?.seconds || 0;
  const isOnline = (Date.now() / 1000 - lastSeenSec) < 300 && u.showOnline !== false;

  return `
    <div class="rounded-2xl p-4 border" style="background: ${theme.gradient}; border-color: ${theme.border}; ${theme.glow && theme.glow !== 'none' ? 'box-shadow: ' + theme.glow + ';' : ''}">
      <div class="flex items-center gap-3 mb-3">
        ${renderAvatar(u, 64)}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${renderUsername(u, 'text-base font-black')}
            ${renderBadges(u)}
          </div>
          <div class="text-[11px] text-gray-500 mt-0.5">${esc(u.rank || 'Rookie')} · ${esc(u.region || 'Global')}</div>
          ${u.showOnline !== false ? `
            <div class="flex items-center gap-1.5 mt-1">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: ${isOnline ? '#22C55E' : '#666'}; ${isOnline ? 'animation: pulse 2s infinite;' : ''}"></div>
              <span style="font-size: 9px; color: ${isOnline ? '#22C55E' : '#666'}; font-weight: 700;">${isOnline ? 'ONLINE' : timeAgo(u.lastSeen)}</span>
            </div>
          ` : ''}
        </div>
      </div>
      ${u.bio ? '<p class="text-xs text-gray-300 mb-2">' + esc(u.bio) + '</p>' : ''}
      ${u.favGun ? '<div class="text-[11px] text-gray-400">🎯 Favourite: <span class="font-bold text-gray-200">' + esc(u.favGun) + '</span></div>' : ''}
    </div>
  `;
}

// ============================================
// STAT CARD
// ============================================
function renderStatCard(label, value, colorKey) {
  const colorMap = {
    primary: 'text-primary',
    gold: 'text-gold',
    blue: 'text-blue-400',
    green: 'text-green-400'
  };
  return `
    <div class="bg-card border border-border rounded-xl p-2.5 text-center">
      <div class="text-base font-black ${colorMap[colorKey] || 'text-primary'}">${value}</div>
      <div class="text-[8px] text-gray-500 uppercase font-bold mt-0.5">${esc(label)}</div>
    </div>
  `;
}

// ============================================
// PROFILE ACTIONS
// ============================================
function renderProfileActions(u, status) {
  const { isFriend, reqSent, reqReceived } = status;

  if (isFriend) {
    return `
      <button class="profile-action-btn btn-press w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2" data-action="dm" data-uid="${esc(u.id)}" data-ign="${esc(u.ign)}">
        <i data-lucide="message-circle" class="w-4 h-4"></i> Message
      </button>
      <button class="profile-action-btn btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2" data-action="invite-lobby" data-uid="${esc(u.id)}" data-ign="${esc(u.ign)}">
        <i data-lucide="send" class="w-4 h-4 text-primary"></i> Invite to Lobby
      </button>
      <button class="profile-action-btn btn-press w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm flex items-center justify-center gap-2" data-action="remove-friend" data-uid="${esc(u.id)}" data-ign="${esc(u.ign)}">
        <i data-lucide="user-minus" class="w-4 h-4"></i> Remove Friend
      </button>
    `;
  }

  if (reqSent) {
    return `
      <div class="text-center py-3 text-xs text-yellow-400 font-bold">⏳ Friend request pending</div>
      <button class="profile-action-btn btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2" data-action="cancel-request" data-uid="${esc(u.id)}">
        Cancel Request
      </button>
    `;
  }

  if (reqReceived) {
    return `
      <button class="profile-action-btn btn-press w-full py-3.5 rounded-xl bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-2" data-action="accept-friend" data-uid="${esc(u.id)}" data-ign="${esc(u.ign)}">
        <i data-lucide="check" class="w-4 h-4"></i> Accept Friend Request
      </button>
      <button class="profile-action-btn btn-press w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm" data-action="decline-friend" data-uid="${esc(u.id)}">
        Decline
      </button>
    `;
  }

  return `
    <button class="profile-action-btn btn-press w-full py-3.5 rounded-xl bg-primary font-bold text-sm glow-primary text-white flex items-center justify-center gap-2" data-action="add-friend" data-uid="${esc(u.id)}" data-ign="${esc(u.ign)}">
      <i data-lucide="user-plus" class="w-4 h-4"></i> Add Friend
    </button>
    <button class="profile-action-btn btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2" data-action="invite-lobby" data-uid="${esc(u.id)}" data-ign="${esc(u.ign)}">
      <i data-lucide="send" class="w-4 h-4 text-primary"></i> Invite to Lobby
    </button>
  `;
}

// ============================================
// WIRE PROFILE ACTIONS
// ============================================
function wireProfileActions(u, status) {
  document.querySelectorAll('.profile-action-btn').forEach(btn => {
    btn.onclick = async () => {
      const action = btn.dataset.action;
      const uid = btn.dataset.uid;
      const ign = btn.dataset.ign;

      switch (action) {
        case 'add-friend':
          await sendFriendRequest(uid, ign);
          closeSheet();
          break;

        case 'accept-friend':
          await acceptFriendRequest(uid);
          closeSheet();
          break;

        case 'decline-friend':
          await declineFriendRequest(uid);
          closeSheet();
          break;

        case 'cancel-request':
          await cancelFriendRequest(uid);
          closeSheet();
          break;

        case 'remove-friend':
          confirmDialog('Remove Friend', 'Remove ' + esc(ign) + ' from your friends?', async () => {
            try {
              await updateDoc(doc(db, 'users', State.user.uid), { friends: arrayRemove(uid) });
              await updateDoc(doc(db, 'users', uid), { friends: arrayRemove(State.user.uid) });
              toast('Friend removed', 'success');
              closeSheet();
            } catch (e) { toast('Failed', 'error'); }
          }, 'Remove', true);
          break;

        case 'dm':
          closeSheet();
          setTimeout(() => {
            if (typeof openDMThread === 'function') openDMThread(uid, ign);
            else toast('Messages loading...', 'info', 1000);
          }, 300);
          break;

        case 'invite-lobby':
          // Show invite link
          openSheet(`
            <div class="space-y-3 text-center">
              <div style="font-size: 40px;">📨</div>
              <div class="text-sm font-bold">Invite ${esc(ign)}</div>
              <div class="text-xs text-gray-500">Share this link to invite them to your lobby</div>
              <div class="bg-card border border-border rounded-xl p-3 text-xs font-mono break-all text-primary">
                ${location.origin}/?invite=${State.user.uid}
              </div>
              <button id="copy-invite-btn" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm text-white">
                Copy Invite Link
              </button>
            </div>
          `, 'Invite to Lobby');
          document.getElementById('copy-invite-btn').onclick = () => {
            copyText(location.origin + '/?invite=' + State.user.uid, 'Link copied!');
            closeSheet();
          };
          if (window.lucide) window.lucide.createIcons();
          break;
      }
    };
  });
}

// ============================================
// PRIVATE PROFILE SHEET
// ============================================
function renderPrivateProfileSheet(u) {
  const sheetBody = document.querySelector('#sheet-container .px-5');
  if (!sheetBody) return;

  sheetBody.innerHTML = `
    <div class="text-center py-12">
      <div style="font-size: 56px; margin-bottom: 12px;">🔒</div>
      <div class="text-base font-black mb-1">Private Profile</div>
      <div class="text-xs text-gray-500 mb-4 max-w-[240px] mx-auto">${esc(u.ign || 'This user')} keeps their profile private</div>
      <div class="text-[10px] text-gray-600">Add them as a friend to see their profile</div>
    </div>
  `;
}

// ============================================
// FRIEND REQUEST HELPERS
// ============================================
async function sendFriendRequest(uid, ign) {
  try {
    await updateDoc(doc(db, 'users', State.user.uid), {
      friendRequestsSent: arrayUnion(uid)
    });
    await updateDoc(doc(db, 'users', uid), {
      friendRequests: arrayUnion(State.user.uid)
    });

    toast('Request sent to ' + (ign || 'user'), 'success');

    // Notify
    if (typeof sendNotificationToUser === 'function') {
      sendNotificationToUser(
        uid,
        '👋 New Friend Request',
        State.profile.ign + ' wants to be your friend',
        { type: 'friend_request' }
      ).catch(() => {});
    }
  } catch (e) {
    console.error(e);
    toast('Failed: ' + e.message, 'error');
  }
}

async function acceptFriendRequest(uid) {
  try {
    await updateDoc(doc(db, 'users', State.user.uid), {
      friends: arrayUnion(uid),
      friendRequests: arrayRemove(uid)
    });
    await updateDoc(doc(db, 'users', uid), {
      friends: arrayUnion(State.user.uid),
      friendRequestsSent: arrayRemove(State.user.uid)
    });
    toast('Friend added!', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function declineFriendRequest(uid) {
  try {
    await updateDoc(doc(db, 'users', State.user.uid), {
      friendRequests: arrayRemove(uid)
    });
    await updateDoc(doc(db, 'users', uid), {
      friendRequestsSent: arrayRemove(State.user.uid)
    });
    toast('Request declined', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

async function cancelFriendRequest(uid) {
  try {
    await updateDoc(doc(db, 'users', State.user.uid), {
      friendRequestsSent: arrayRemove(uid)
    });
    await updateDoc(doc(db, 'users', uid), {
      friendRequests: arrayRemove(State.user.uid)
    });
    toast('Request cancelled', 'success');
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ============================================
// DEEP LINK: ?user=xxx
// ============================================
function checkUserDeepLink() {
  const params = new URLSearchParams(location.search);
  const uid = params.get('user');
  if (!uid) return;
  setTimeout(() => openUserProfile(uid), 1500);
}

// ============================================
// EXPORT
// ============================================
window.openUserProfile = openUserProfile;
window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.cancelFriendRequest = cancelFriendRequest;
window.checkUserDeepLink = checkUserDeepLink;

// ============================================
// END OF CHUNK 9/24
// ============================================
// ============================================
// CHUNK 10/24 — Play Tab (LFG Board)
// ⚙️ UPDATE HERE: lobby card layout, filter options
// ============================================

const LOBBY_EXPIRY_HOURS = 24;

// ============================================
// PLAY TAB RENDERER
// ============================================
function renderPlayTab() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-black">Find Squad</h1>
          <p class="text-xs text-gray-500">Live LFG board — expires in 24h</p>
        </div>
        <div class="flex gap-2">
          <button id="open-party-btn" class="btn-press px-3 py-2.5 rounded-xl bg-card border border-primary/40 text-primary text-xs font-bold flex items-center gap-1.5">
            🎉 Party
          </button>
          <button id="post-lobby-btn" class="btn-press px-4 py-2.5 rounded-xl bg-primary text-sm font-bold glow-primary flex items-center gap-2 text-white">
            <i data-lucide="plus" class="w-4 h-4"></i> Post
          </button>
        </div>
      </div>

      <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        <button class="chip filter-rank ${State.filters.lobbies.rank !== 'all' ? 'active' : ''}" data-filter="rank">${State.filters.lobbies.rank === 'all' ? 'All Ranks' : State.filters.lobbies.rank}</button>
        <button class="chip filter-mode ${State.filters.lobbies.mode !== 'all' ? 'active' : ''}" data-filter="mode">${State.filters.lobbies.mode === 'all' ? 'All Modes' : State.filters.lobbies.mode}</button>
        <button class="chip filter-region ${State.filters.lobbies.region !== 'all' ? 'active' : ''}" data-filter="region">${State.filters.lobbies.region === 'all' ? 'All Regions' : State.filters.lobbies.region}</button>
        <button class="chip filter-mic ${State.filters.lobbies.mic ? 'active' : ''}">🎤 Mic Only</button>
      </div>

      <div class="relative mb-4">
        <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
        <input id="lobby-search" type="text" placeholder="Search by IGN or note..." class="pl-10" value="${esc(State.filters.lobbies.search)}" />
      </div>

      <div id="lobbies-feed" class="space-y-3">
        ${skeletonCard().repeat(3)}
      </div>
    </div>
  `;

  document.getElementById('post-lobby-btn').onclick = openPostLobbySheet;
  document.getElementById('open-party-btn').onclick = () => {
    if (typeof openPartySheet === 'function') openPartySheet();
    else toast('Party loading...', 'info', 1000);
  };

  document.querySelectorAll('.filter-rank, .filter-mode, .filter-region').forEach(btn => {
    btn.onclick = () => openFilterPicker(btn.dataset.filter, btn);
  });

  const micBtn = document.querySelector('.filter-mic');
  if (micBtn) {
    micBtn.onclick = () => {
      State.filters.lobbies.mic = !State.filters.lobbies.mic;
      micBtn.classList.toggle('active', State.filters.lobbies.mic);
      renderLobbies();
    };
  }

  const searchInput = document.getElementById('lobby-search');
  if (searchInput) {
    searchInput.oninput = (e) => {
      State.filters.lobbies.search = e.target.value.toLowerCase();
      renderLobbies();
    };
  }

  loadLobbies();
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// LOAD LOBBIES (real-time)
// ============================================
function loadLobbies() {
  if (State.unsubs.lobbies) {
    try { State.unsubs.lobbies(); } catch (e) {}
    State.unsubs.lobbies = null;
  }

  const q = query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(60));

  State.unsubs.lobbies = onSnapshot(q, (snap) => {
    const lobbies = [];
    const now = Date.now();

    snap.forEach(d => {
      const data = d.data();
      const expiresAt = data.expiresAt?.toMillis
        ? data.expiresAt.toMillis()
        : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (expiresAt > now) {
        lobbies.push({ id: d.id, ...data });
      }
    });

    State.cache.lobbies = lobbies;
    renderLobbies();
  }, (err) => {
    console.error('Lobbies error:', err);
    const feed = document.getElementById('lobbies-feed');
    if (feed) {
      feed.innerHTML = emptyState('users', 'No lobbies yet', 'Be the first to post!', 'Post Lobby', openPostLobbySheet);
    }
    if (window.lucide) window.lucide.createIcons();
  });
}

// ============================================
// RENDER LOBBIES (with filters + priority)
// ============================================
function renderLobbies() {
  const feed = document.getElementById('lobbies-feed');
  if (!feed) return;

  let lobbies = [...State.cache.lobbies];

  // Apply filters
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

  // Sort: Pro first, then newest
  lobbies.sort((a, b) => {
    const aPro = a.isPro ? 1 : 0;
    const bPro = b.isPro ? 1 : 0;
    if (aPro !== bPro) return bPro - aPro;
    return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
  });

  if (lobbies.length === 0) {
    if (State.cache.lobbies.length === 0) {
      feed.innerHTML = emptyState('users', 'No lobbies yet', 'Post a lobby and find your squad', 'Post Lobby', openPostLobbySheet);
    } else {
      feed.innerHTML = emptyState('search', 'No matching lobbies', 'Try different filters', 'Clear Search', () => {
        State.filters.lobbies = { rank: 'all', mode: 'all', region: 'all', mic: false, search: '' };
        renderPlayTab();
      });
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = lobbies.map(l => renderLobbyCard(l)).join('');
  wireLobbyCards();

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// LOBBY CARD
// ============================================
function renderLobbyCard(l) {
  const isMine = l.uid === State.user.uid;
  const isProLobby = l.isPro || false;
  const playersText = `${l.players || 1}/5`;
  const createdAt = l.createdAt?.seconds || 0;

  return `
    <div class="lobby-card bg-card border ${isProLobby ? 'border-gold' : 'border-border'} rounded-2xl p-4 fade-in" data-id="${l.id}" ${isProLobby ? 'style="box-shadow: 0 0 20px rgba(255, 215, 0, 0.15);"' : ''}>
      ${isProLobby ? '<div class="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-gold to-yellow-500 text-black font-black">👑 PRIORITY</div>' : ''}

      <div class="flex items-start gap-3 mb-3">
        <div class="relative">
          ${renderAvatar(l, 48)}
          ${l.mic ? '<div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center"><i data-lucide="mic" class="w-2.5 h-2.5 text-white"></i></div>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${renderUsername(l, 'font-bold text-sm')}
            ${renderBadges(l)}
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
        ${l.role ? '<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-300">' + esc(l.role) + '</span>' : ''}
        ${l.mic
          ? '<span class="text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 font-semibold">🎤 Mic</span>'
          : '<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-500">🔇 No Mic</span>'}
      </div>

      ${l.note ? '<p class="text-xs text-gray-400 mb-3 line-clamp-2">' + esc(l.note) + '</p>' : ''}

      <div class="flex gap-2">
        <button class="lobby-join-btn btn-press flex-1 py-2.5 rounded-xl bg-primary text-sm font-bold flex items-center justify-center gap-1.5 text-white" data-id="${l.id}">
          <i data-lucide="log-in" class="w-4 h-4"></i> Join
        </button>
        ${renderReactionButton('lobby', l.id, l.reactions, l.myReaction)}
        ${renderCommentButton('lobby', l.id, l.commentCount || 0)}
        <button class="lobby-share-btn btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-ign="${esc(l.ign)}" data-ispro="${isProLobby}">
          <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
        </button>
        ${isMine ? `
          <button class="lobby-delete-btn btn-press w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center" data-id="${l.id}">
            <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
          </button>
        ` : `
          <button class="lobby-report-btn btn-press w-10 h-10 rounded-xl bg-cardAlt border border-border flex items-center justify-center" data-id="${l.id}" data-uid="${l.uid}">
            <i data-lucide="flag" class="w-4 h-4 text-gray-500"></i>
          </button>
        `}
      </div>
    </div>
  `;
}

// ============================================
// WIRE LOBBY CARD ACTIONS
// ============================================
function wireLobbyCards() {
  const feed = document.getElementById('lobbies-feed');
  if (!feed) return;

  feed.querySelectorAll('.lobby-join-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      joinLobby(btn.dataset.id);
    };
  });

  feed.querySelectorAll('.lobby-share-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const isProLobby = btn.dataset.ispro === 'true';
      const lobby = State.cache.lobbies.find(l => l.id === btn.dataset.id);
      const shareUrl = (isProLobby && lobby)
        ? location.origin + '/?lobby=' + encodeURIComponent(lobby.ign)
        : location.origin + '/?lobby=' + btn.dataset.id;

      openShareSheet({
        title: btn.dataset.ign + "'s Lobby",
        text: '🎮 Join ' + btn.dataset.ign + "'s squad on CODMPanda!",
        url: shareUrl
      });
    };
  });

  feed.querySelectorAll('.lobby-delete-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteLobby(btn.dataset.id);
    };
  });

  feed.querySelectorAll('.lobby-report-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      reportContent('lobby', btn.dataset.id, btn.dataset.uid);
    };
  });
}

// ============================================
// JOIN LOBBY → VOICE ROOM
// ============================================
async function joinLobby(lobbyId) {
  const lobby = State.cache.lobbies.find(l => l.id === lobbyId);
  if (!lobby) { toast('Lobby not found', 'error'); return; }

  // Increment players
  try {
    if ((lobby.players || 1) < 5) {
      await updateDoc(doc(db, 'lobbies', lobbyId), { players: increment(1) });
    }
  } catch (e) {}

  // Notify owner
  if (lobby.uid && lobby.uid !== State.user.uid && typeof sendNotificationToUser === 'function') {
    sendNotificationToUser(
      lobby.uid,
      '🎮 Someone Joined!',
      State.profile.ign + ' joined your ' + lobby.mode + ' lobby',
      { type: 'lobby_join', lobbyId }
    ).catch(() => {});
  }

  // Open voice room
  if (typeof openVoiceRoom === 'function') {
    openVoiceRoom(lobby);
  } else {
    toast('Voice room loading...', 'info', 1500);
  }
}

// ============================================
// DELETE LOBBY
// ============================================
async function deleteLobby(lobbyId) {
  confirmDialog('Delete Lobby', 'This will remove your lobby permanently.', async () => {
    try {
      await deleteDoc(doc(db, 'lobbies', lobbyId));
      State.cache.lobbies = State.cache.lobbies.filter(l => l.id !== lobbyId);
      renderLobbies();
      toast('Lobby deleted', 'success');
    } catch (e) {
      toast('Delete failed: ' + e.message, 'error');
    }
  }, 'Delete', true);
}

// ============================================
// POST LOBBY SHEET
// ============================================
function openPostLobbySheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rank</label>
        <select id="pl-rank" data-dropdown-title="Rank">
          ${RANKS.map(r => '<option ' + (State.profile?.rank === r ? 'selected' : '') + '>' + r + '</option>').join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Mode</label>
        <select id="pl-mode" data-dropdown-title="Mode">
          ${MODES.map(m => '<option>' + m + '</option>').join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Region</label>
        <select id="pl-region" data-dropdown-title="Region">
          ${REGIONS.map(r => '<option ' + (State.profile?.region === r ? 'selected' : '') + '>' + r + '</option>').join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Role</label>
        <select id="pl-role" data-dropdown-title="Role">
          ${ROLES.map(r => '<option>' + r + '</option>').join('')}
        </select>
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
      <button id="pl-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary text-white">
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
      const jitsiLink = 'https://meet.jit.si/CODMPanda-' + State.user.uid.slice(0, 8) + '-' + Date.now();
      const partyCode = generatePartyCode();

      await addDoc(collection(db, 'lobbies'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        rank, mode, region, role, mic, note,
        avatar: State.profile.avatar || '',
        isPro: isPro(),
        verified: !!State.profile.verified,
        players: 1,
        jitsiLink,
        partyCode,
        reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
        reactionCount: 0,
        commentCount: 0,
        status: 'active',
        createdAt: serverTimestamp(),
        expiresAt
      });

      toast('Lobby posted! Active for 24h', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Post Lobby';
    }
  };
}

// ============================================
// PARTY CODE GENERATOR
// ============================================
function generatePartyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PANDA-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================
// FILTER PICKER
// ============================================
function openFilterPicker(type, chipEl) {
  const options = {
    rank: ['all', ...RANKS],
    mode: ['all', ...MODES],
    region: ['all', ...REGIONS]
  }[type];

  const labels = {
    rank: 'Rank',
    mode: 'Mode',
    region: 'Region'
  };

  openSheet(`
    <div class="space-y-2">
      ${options.map(opt => {
        const label = opt === 'all' ? 'All ' + labels[type] + 's' : opt;
        const selected = State.filters.lobbies[type] === opt;
        return '<button class="filter-opt w-full text-left px-4 py-3 rounded-xl ' + (selected ? 'bg-primary/15 border border-primary text-primary' : 'bg-card border border-border') + ' font-semibold text-sm" data-val="' + esc(opt) + '">' + esc(label) + '</button>';
      }).join('')}
    </div>
  `, 'Filter by ' + labels[type]);

  document.querySelectorAll('.filter-opt').forEach(btn => {
    btn.onclick = () => {
      State.filters.lobbies[type] = btn.dataset.val;
      closeSheet();
      renderPlayTab();
    };
  });
}

// ============================================
// REPORT CONTENT (generic — used everywhere)
// ============================================
function reportContent(contentType, contentId, targetUid) {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Why are you reporting this?</label>
        <textarea id="rp-reason" rows="4" maxlength="500" placeholder="Describe the issue..."></textarea>
      </div>
      <button id="rp-submit" class="btn-press w-full py-4 rounded-2xl bg-red-500 font-bold text-base text-white">
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
        reporterIgn: State.profile.ign,
        targetId: contentId,
        targetUid: targetUid || null,
        targetType: contentType,
        reason,
        type: 'user-report',
        status: 'open',
        createdAt: serverTimestamp()
      });
      toast('Report submitted', 'success');
      closeSheet();
    } catch (e) {
      toast('Failed', 'error');
    }
  };
}

// ============================================
// EXPORT
// ============================================
window.renderPlayTab = renderPlayTab;
window.loadLobbies = loadLobbies;
window.renderLobbies = renderLobbies;
window.renderLobbyCard = renderLobbyCard;
window.openPostLobbySheet = openPostLobbySheet;
window.joinLobby = joinLobby;
window.deleteLobby = deleteLobby;
window.reportContent = reportContent;
window.generatePartyCode = generatePartyCode;
window.LOBBY_EXPIRY_HOURS = LOBBY_EXPIRY_HOURS;

// ============================================
// END OF CHUNK 10/24
// ============================================
// ============================================
// CHUNK 11/24 — Voice Room UI
// ⚙️ UPDATE HERE: participant grid, controls layout
// ============================================

// ============================================
// VOICE ROOM STATE
// ============================================
var voiceRoomState = {
  active: false,
  minimized: false,
  lobbyId: null,
  lobby: null,
  jitsiApi: null,
  isMuted: false,
  participants: [],
  roomName: null
};

// ============================================
// OPEN VOICE ROOM
// ============================================
function openVoiceRoom(lobby) {
  // If already in a room, close first
  if (voiceRoomState.active) closeVoiceRoom(true);

  voiceRoomState.active = true;
  voiceRoomState.minimized = false;
  voiceRoomState.lobbyId = lobby.id;
  voiceRoomState.lobby = lobby;
  voiceRoomState.isMuted = !lobby.mic;
  voiceRoomState.roomName = (lobby.jitsiLink || 'https://meet.jit.si/CODMPanda-' + lobby.id).split('/').pop();
  voiceRoomState.participants = [
    {
      uid: lobby.uid,
      ign: lobby.ign,
      avatar: lobby.avatar || '',
      isHost: true,
      isMuted: !lobby.mic
    }
  ];

  renderVoiceRoomOverlay();
  loadHiddenJitsi(voiceRoomState.roomName);

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// RENDER VOICE ROOM OVERLAY (fullscreen)
// ============================================
function renderVoiceRoomOverlay() {
  let overlay = document.getElementById('voice-room-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'voice-room-overlay';
    document.body.appendChild(overlay);
  }

  const lobby = voiceRoomState.lobby;
  const participants = voiceRoomState.participants;

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
    <!-- Hidden Jitsi container (never visible) -->
    <div id="jitsi-hidden-container" style="
      position: absolute;
      inset: 0;
      z-index: 1;
      opacity: 0;
      pointer-events: none;
    "></div>

    <!-- Background gradient -->
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
      padding: 20px;
      padding-top: calc(env(safe-area-inset-top, 0px) + 20px);
      padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
    ">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-shrink: 0;">
        <button id="voice-minimize-btn" class="btn-press" style="
          width: 40px; height: 40px;
          border-radius: 12px;
          background: #111;
          border: 1px solid #222;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <div style="text-align: center; flex: 1; padding: 0 12px;">
          <div style="font-size: 10px; color: #666; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Voice Room</div>
          <div style="font-size: 13px; color: #fff; font-weight: 800; margin-top: 2px;">${esc(lobby.mode)} · ${esc(lobby.region)}</div>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 20px; background: #111; border: 1px solid #222;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #22C55E; animation: pulse 2s infinite;"></div>
          <span style="font-size: 10px; font-weight: 800; color: #22C55E;">LIVE</span>
        </div>
      </div>

      <!-- Party code -->
      <div style="background: rgba(255, 107, 0, 0.08); border: 1px solid rgba(255, 107, 0, 0.3); border-radius: 12px; padding: 10px 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
        <div>
          <div style="font-size: 9px; color: #888; text-transform: uppercase; font-weight: 800;">Party Code</div>
          <div style="font-size: 15px; color: #FF6B00; font-weight: 900; letter-spacing: 1px; font-family: monospace; margin-top: 2px;">${esc(lobby.partyCode || 'PANDA-XXXX')}</div>
        </div>
        <button id="voice-copy-code" class="btn-press" style="
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255, 107, 0, 0.15);
          border: 1px solid rgba(255, 107, 0, 0.4);
          color: #FF6B00;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          font-family: Inter;
        ">COPY</button>
      </div>

      <!-- Participant grid -->
      <div style="flex: 1; overflow-y: auto; margin-bottom: 20px;">
        <div style="font-size: 10px; color: #666; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 12px;">
          ${participants.length} in room
        </div>
        <div id="voice-participants-grid" style="
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        ">
          ${participants.map(p => renderVoiceParticipant(p)).join('')}
        </div>
      </div>

      <!-- Controls -->
      <div style="display: flex; justify-content: center; gap: 16px; flex-shrink: 0;">
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
          <span style="font-size: 8px; font-weight: 800; color: #fff; font-family: Inter;">${voiceRoomState.isMuted ? 'UNMUTE' : 'MUTE'}</span>
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
          <span style="font-size: 8px; font-weight: 800; color: #fff; font-family: Inter;">LEAVE</span>
        </button>
      </div>
    </div>

    <style>
      @keyframes voiceSlideIn {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    </style>
  `;

  wireVoiceRoomControls();

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PARTICIPANT CARD
// ============================================
function renderVoiceParticipant(p) {
  const isMe = p.uid === State.user?.uid;
  const isHost = p.isHost;
  const isMuted = p.isMuted;

  return `
    <button class="voice-participant-card profile-link btn-press" data-uid="${esc(p.uid)}" style="
      background: ${isMe ? 'rgba(255, 107, 0, 0.1)' : '#0d0d0d'};
      border: 1px solid ${isMe ? 'rgba(255, 107, 0, 0.4)' : '#1a1a1a'};
      border-radius: 16px;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      position: relative;
      transition: transform 0.15s;
    ">
      ${isHost ? '<div style="position: absolute; top: 8px; right: 8px; font-size: 12px;">👑</div>' : ''}
      ${isMe ? '<div style="position: absolute; top: 8px; left: 8px; padding: 2px 6px; border-radius: 6px; background: #FF6B00; font-size: 8px; font-weight: 900; color: #fff;">YOU</div>' : ''}

      <div style="position: relative;">
        ${renderAvatar(p, 56)}
        ${isMuted ? '<div style="position: absolute; bottom: -2px; right: -2px; width: 20px; height: 20px; border-radius: 50%; background: #FF3B30; border: 2px solid #0d0d0d; display: flex; align-items: center; justify-content: center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/></svg></div>' : ''}
      </div>

      <div style="text-align: center; max-width: 100%;">
        <div style="font-size: 11px; font-weight: 800; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(p.ign || 'Unknown')}</div>
        <div style="font-size: 9px; color: #666; margin-top: 2px;">${isHost ? 'Host' : (isMe ? 'You' : 'Member')}</div>
      </div>
    </button>
  `;
}

// ============================================
// WIRE VOICE ROOM CONTROLS
// ============================================
function wireVoiceRoomControls() {
  const minimizeBtn = document.getElementById('voice-minimize-btn');
  if (minimizeBtn) minimizeBtn.onclick = minimizeVoiceRoom;

  const leaveBtn = document.getElementById('voice-leave-btn');
  if (leaveBtn) leaveBtn.onclick = () => confirmDialog('Leave Voice', 'Leave the voice room?', () => closeVoiceRoom(), 'Leave', true);

  const muteBtn = document.getElementById('voice-mute-btn');
  if (muteBtn) muteBtn.onclick = toggleVoiceMute;

  const copyBtn = document.getElementById('voice-copy-code');
  if (copyBtn) {
    copyBtn.onclick = () => copyText(voiceRoomState.lobby?.partyCode || '', 'Party code copied!');
  }

  // Participant cards — profile-link handles tap automatically
}

// ============================================
// MINIMIZE → FLOATING PILL
// ============================================
function minimizeVoiceRoom() {
  voiceRoomState.minimized = true;

  const overlay = document.getElementById('voice-room-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transform = 'translateY(100%)';
    overlay.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.style.opacity = '1';
      overlay.style.transform = 'translateY(0)';
    }, 300);
  }

  renderVoicePill();
}

// ============================================
// FLOATING PILL (persists across tabs)
// ============================================
function renderVoicePill() {
  let pill = document.getElementById('voice-pill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'voice-pill';
    document.body.appendChild(pill);
  }

  const lobby = voiceRoomState.lobby;
  const participantCount = voiceRoomState.participants.length;

  pill.style.cssText = `
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 90px);
    z-index: 9000;
    animation: voicePillIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 500px;
    margin: 0 auto;
  `;

  pill.innerHTML = `
    <div style="
      background: linear-gradient(135deg, rgba(255, 107, 0, 0.15), rgba(0, 0, 0, 0.95));
      border: 1px solid rgba(255, 107, 0, 0.4);
      border-radius: 16px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 107, 0, 0.2);
    ">
      <div style="
        width: 36px; height: 36px;
        border-radius: 50%;
        background: rgba(255, 107, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        position: relative;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
        </svg>
        <div style="position: absolute; top: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; background: #22C55E; border: 2px solid #0a0a0a; animation: pulse 2s infinite;"></div>
      </div>

      <div id="voice-pill-open" style="flex: 1; min-width: 0; cursor: pointer;">
        <div style="font-size: 11px; font-weight: 800; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          Voice · ${participantCount}/${lobby?.players || 5}
        </div>
        <div style="font-size: 9px; color: #888; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${esc(lobby?.ign || 'Room')} · ${esc(lobby?.mode || '')}
        </div>
      </div>

      <button id="voice-pill-expand" class="btn-press" style="
        width: 32px; height: 32px;
        border-radius: 50%;
        background: rgba(255, 107, 0, 0.15);
        border: 1px solid rgba(255, 107, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>

      <button id="voice-pill-close" class="btn-press" style="
        width: 32px; height: 32px;
        border-radius: 50%;
        background: rgba(255, 59, 48, 0.15);
        border: 1px solid rgba(255, 59, 48, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `;

  if (!document.getElementById('voice-pill-styles')) {
    const style = document.createElement('style');
    style.id = 'voice-pill-styles';
    style.textContent = `
      @keyframes voicePillIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // Open
  const openBtn = document.getElementById('voice-pill-expand');
  if (openBtn) openBtn.onclick = expandVoiceRoom;
  const openArea = document.getElementById('voice-pill-open');
  if (openArea) openArea.onclick = expandVoiceRoom;

  // Close (leave)
  const closeBtn = document.getElementById('voice-pill-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      confirmDialog('Leave Voice', 'Leave the voice room?', () => closeVoiceRoom(), 'Leave', true);
    };
  }
}

// ============================================
// EXPAND (restore fullscreen)
// ============================================
function expandVoiceRoom() {
  voiceRoomState.minimized = false;

  const pill = document.getElementById('voice-pill');
  if (pill) pill.remove();

  const overlay = document.getElementById('voice-room-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.style.animation = 'voiceSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  }

  // Update participant grid in case new people joined
  updateVoiceParticipants();
}

// ============================================
// TOGGLE MUTE
// ============================================
function toggleVoiceMute() {
  if (!voiceRoomState.jitsiApi) {
    toast('Voice not ready yet', 'warning');
    return;
  }

  try {
    voiceRoomState.isMuted = !voiceRoomState.isMuted;
    voiceRoomState.jitsiApi.executeCommand('toggleAudio');

    // Update self in participants list
    const self = voiceRoomState.participants.find(p => p.uid === State.user.uid);
    if (self) self.isMuted = voiceRoomState.isMuted;

    updateMuteButtonUI();
    toast(voiceRoomState.isMuted ? 'Muted' : 'Unmuted', 'success', 1200);
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
    btn.innerHTML = '<i data-lucide="mic-off" style="width: 22px; height: 22px; color: #fff;"></i><span style="font-size: 8px; font-weight: 800; color: #fff; font-family: Inter;">UNMUTE</span>';
  } else {
    btn.style.background = '#111';
    btn.style.border = '1px solid #222';
    btn.style.boxShadow = 'none';
    btn.innerHTML = '<i data-lucide="mic" style="width: 22px; height: 22px; color: #fff;"></i><span style="font-size: 8px; font-weight: 800; color: #fff; font-family: Inter;">MUTE</span>';
  }
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// UPDATE PARTICIPANTS (called by Jitsi events)
// ============================================
function updateVoiceParticipants() {
  const grid = document.getElementById('voice-participants-grid');
  if (!grid) return;

  grid.innerHTML = voiceRoomState.participants.map(p => renderVoiceParticipant(p)).join('');
  if (window.lucide) window.lucide.createIcons();

  // Update pill count if minimized
  const pillCount = document.querySelector('#voice-pill #voice-pill-open div:first-child');
  if (pillCount) {
    pillCount.textContent = 'Voice · ' + voiceRoomState.participants.length + '/' + (voiceRoomState.lobby?.players || 5);
  }
}

// ============================================
// CLOSE VOICE ROOM
// ============================================
function closeVoiceRoom(silent) {
  try {
    if (voiceRoomState.jitsiApi) {
      voiceRoomState.jitsiApi.dispose();
      voiceRoomState.jitsiApi = null;
    }
  } catch (e) {}

  const overlay = document.getElementById('voice-room-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => overlay.remove(), 300);
  }

  const pill = document.getElementById('voice-pill');
  if (pill) pill.remove();

  voiceRoomState.active = false;
  voiceRoomState.minimized = false;
  voiceRoomState.lobbyId = null;
  voiceRoomState.lobby = null;
  voiceRoomState.participants = [];

  if (!silent) toast('Left voice room', 'success', 1500);
}

// ============================================
// EXPORT
// ============================================
window.openVoiceRoom = openVoiceRoom;
window.closeVoiceRoom = closeVoiceRoom;
window.minimizeVoiceRoom = minimizeVoiceRoom;
window.expandVoiceRoom = expandVoiceRoom;
window.toggleVoiceMute = toggleVoiceMute;
window.updateVoiceParticipants = updateVoiceParticipants;
window.voiceRoomState = voiceRoomState;

// ============================================
// END OF CHUNK 11/24
// ============================================
// ============================================
// CHUNK 12/24 — Voice Room Backend (Hidden Jitsi)
// ⚙️ UPDATE HERE: Jitsi config, room events, preload timing
// ============================================

// ============================================
// PRELOAD JITSI SCRIPT (for faster join)
// ============================================
setTimeout(() => {
  if (!window.JitsiMeetExternalAPI) {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.head.appendChild(script);
  }
}, 8000);

// ============================================
// LOAD HIDDEN JITSI (called from openVoiceRoom)
// ============================================
function loadHiddenJitsi(roomName) {
  const statusUpdate = (text, color) => {
    const el = document.querySelector('#voice-room-overlay div[style*="Connecting"]');
    // Best-effort status update via toast
    if (text) console.log('[Voice]', text);
  };

  // Wait for Jitsi script
  if (!window.JitsiMeetExternalAPI) {
    let attempts = 0;
    const check = setInterval(() => {
      attempts++;
      if (window.JitsiMeetExternalAPI) {
        clearInterval(check);
        initHiddenJitsi(roomName);
      } else if (attempts > 60) {
        clearInterval(check);
        toast('Voice failed to load. Check connection.', 'error', 4000);
        closeVoiceRoom(true);
      }
    }, 200);
  } else {
    initHiddenJitsi(roomName);
  }
}

// ============================================
// INIT HIDDEN JITSI IFRAME
// ============================================
function initHiddenJitsi(roomName) {
  const container = document.getElementById('jitsi-hidden-container');
  if (!container || !window.JitsiMeetExternalAPI) return;

  try {
    const options = {
      roomName: roomName,
      parentNode: container,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: State.profile?.ign || 'Panda'
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

    const api = new window.JitsiMeetExternalAPI('meet.jit.si', options);
    voiceRoomState.jitsiApi = api;

    // ============================================
    // JITSI EVENTS
    // ============================================

    // Connected successfully
    api.addEventListener('videoConferenceJoined', () => {
      console.log('[Voice] Joined conference');
      toast('Voice connected', 'success', 2000);
    });

    // Someone joined
    api.addEventListener('participantJoined', (data) => {
      console.log('[Voice] Participant joined:', data);
      handleParticipantJoined(data);
    });

    // Someone left
    api.addEventListener('participantLeft', (data) => {
      console.log('[Voice] Participant left:', data);
      handleParticipantLeft(data);
    });

    // Display name changed
    api.addEventListener('displayNameChanged', (data) => {
      console.log('[Voice] Display name changed:', data);
      handleDisplayNameChanged(data);
    });

    // Audio mute status changed (someone else)
    api.addEventListener('audioMuteStatusChanged', (data) => {
      console.log('[Voice] Audio mute changed:', data);
      if (data.id) {
        handleAudioMuteChanged(data.id, data.muted);
      }
    });

    // Our own mute changed (confirmation from Jitsi)
    api.addEventListener('audioAvailabilityChanged', (data) => {
      console.log('[Voice] Audio availability:', data);
    });

    // Ready to close
    api.addEventListener('readyToClose', () => {
      console.log('[Voice] Ready to close');
      closeVoiceRoom();
    });

    // Error
    api.addEventListener('errorOccurred', (data) => {
      console.error('[Voice] Error:', data);
      toast('Voice error — try leaving and rejoining', 'error', 4000);
    });

  } catch (e) {
    console.error('[Voice] Init error:', e);
    toast('Failed to start voice', 'error');
    closeVoiceRoom(true);
  }
}

// ============================================
// PARTICIPANT JOINED
// ============================================
function handleParticipantJoined(data) {
  const uid = data.id || '';
  const displayName = data.displayName || 'Guest';

  // Check if already in list (by display name for guests)
  const exists = voiceRoomState.participants.find(p => p.uid === uid);
  if (exists) return;

  // Try to find matching user in Firestore by IGN
  findUserByIgn(displayName).then(user => {
    voiceRoomState.participants.push({
      uid: user ? user.id : uid,
      ign: displayName,
      avatar: user ? (user.avatar || '') : '',
      isHost: false,
      isMuted: false,
      jitsiId: uid,
      isGuest: !user
    });

    updateVoiceParticipants();

    // Toast
    if (displayName !== State.profile?.ign) {
      toast(displayName + ' joined', 'success', 2000);
    }
  });
}

// ============================================
// PARTICIPANT LEFT
// ============================================
function handleParticipantLeft(data) {
  const uid = data.id || '';

  const idx = voiceRoomState.participants.findIndex(p => p.jitsiId === uid || p.uid === uid);
  if (idx !== -1) {
    const removed = voiceRoomState.participants.splice(idx, 1)[0];
    updateVoiceParticipants();
    if (removed.ign && removed.ign !== State.profile?.ign) {
      toast(removed.ign + ' left', 'info', 2000);
    }
  }
}

// ============================================
// DISPLAY NAME CHANGED
// ============================================
function handleDisplayNameChanged(data) {
  const uid = data.id || '';
  const newName = data.displayName || '';
  const p = voiceRoomState.participants.find(x => x.jitsiId === uid);
  if (p && newName) {
    p.ign = newName;
    updateVoiceParticipants();
  }
}

// ============================================
// AUDIO MUTE STATUS CHANGED
// ============================================
function handleAudioMuteChanged(jitsiId, muted) {
  const p = voiceRoomState.participants.find(x => x.jitsiId === jitsiId);
  if (p) {
    p.isMuted = muted;
    updateVoiceParticipants();
  }
}

// ============================================
// FIND USER BY IGN (for participant avatars)
// ============================================
async function findUserByIgn(ign) {
  if (!ign) return null;
  // Check cache first
  if (State.profile && State.profile.ign === ign) {
    return { id: State.user.uid, ...State.profile };
  }
  // Check lobby owner
  if (voiceRoomState.lobby && voiceRoomState.lobby.ign === ign) {
    return {
      id: voiceRoomState.lobby.uid,
      ign: voiceRoomState.lobby.ign,
      avatar: voiceRoomState.lobby.avatar
    };
  }
  // Query Firestore
  try {
    const snap = await getDocs(query(
      collection(db, 'users'),
      where('ign', '==', ign),
      limit(1)
    ));
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() };
    }
  } catch (e) { /* silent */ }
  return null;
}

// ============================================
// PERSIST ACROSS TABS
// ============================================
// The Jitsi container lives in body (not in the tab content),
// so switching tabs doesn't disconnect the voice session.
// The pill stays visible because it's also in body.

// Hook into switchTab to keep the pill visible
const _voiceOriginalSwitchTab = window.switchTab;
window.switchTab = function(tab) {
  // Ensure pill stays on top
  const pill = document.getElementById('voice-pill');
  if (pill && voiceRoomState.active && voiceRoomState.minimized) {
    pill.style.display = 'block';
  }
  return _voiceOriginalSwitchTab(tab);
};

// ============================================
// HANDLE APP BACKGROUND / FOREGROUND
// ============================================
document.addEventListener('visibilitychange', () => {
  if (!voiceRoomState.active) return;

  if (document.hidden) {
    console.log('[Voice] App backgrounded — voice stays connected');
  } else {
    console.log('[Voice] App foregrounded');
  }
});

// ============================================
// CLEANUP ON PAGE UNLOAD
// ============================================
window.addEventListener('beforeunload', () => {
  if (voiceRoomState.jitsiApi) {
    try { voiceRoomState.jitsiApi.dispose(); } catch (e) {}
  }
});

// ============================================
// BACK BUTTON HANDLER (within voice room)
// ============================================
window.addEventListener('popstate', () => {
  if (voiceRoomState.active && !voiceRoomState.minimized) {
    minimizeVoiceRoom();
    try { history.pushState({ __codm: true }, ''); } catch (e) {}
  }
});

// ============================================
// EXPORT
// ============================================
window.loadHiddenJitsi = loadHiddenJitsi;
window.initHiddenJitsi = initHiddenJitsi;
window.findUserByIgn = findUserByIgn;

// ============================================
// END OF CHUNK 12/24
// ============================================
// ============================================
// CHUNK 13/24 — Lab Tab (Vault: Gunsmith / Sens / HUD)
// ⚙️ UPDATE HERE: vault card layout, submission forms, OCR
// ============================================

let labSubTab = 'vault';
let vaultTypeFilter = 'gunsmith';

// ============================================
// LAB TAB RENDERER
// ============================================
function renderLabTab() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="mb-4">
        <h1 class="text-2xl font-black">The Lab</h1>
        <p class="text-xs text-gray-500">Gunsmiths, sensitivity, HUD, camo tracker</p>
      </div>

      <div class="flex gap-2 mb-4">
        <button id="sub-vault" class="sub-tab flex-1 py-2.5 rounded-xl font-bold text-sm ${labSubTab === 'vault' ? 'bg-primary text-white' : 'bg-card border border-border text-gray-400'}">Vault</button>
        <button id="sub-camo" class="sub-tab flex-1 py-2.5 rounded-xl font-bold text-sm ${labSubTab === 'camo' ? 'bg-primary text-white' : 'bg-card border border-border text-gray-400'}">Camo Tracker</button>
      </div>

      <div id="lab-body"></div>
    </div>
  `;

  document.getElementById('sub-vault').onclick = () => { labSubTab = 'vault'; renderLabTab(); };
  document.getElementById('sub-camo').onclick = () => { labSubTab = 'camo'; renderLabTab(); };

  if (labSubTab === 'vault') renderVaultSub();
  else if (typeof renderCamoSub === 'function') renderCamoSub();
  else document.getElementById('lab-body').innerHTML = '<div class="text-center py-8 text-gray-500 text-xs">Camo tracker loading...</div>';

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// VAULT SUB-TAB
// ============================================
function renderVaultSub() {
  const body = document.getElementById('lab-body');
  if (!body) return;

  body.innerHTML = `
    <div class="grid grid-cols-3 gap-2 mb-4">
      <button class="vault-type chip ${vaultTypeFilter === 'gunsmith' ? 'active' : ''}" data-type="gunsmith" style="padding: 10px 6px; font-size: 11px;">🔧 Gunsmith</button>
      <button class="vault-type chip ${vaultTypeFilter === 'sens' ? 'active' : ''}" data-type="sens" style="padding: 10px 6px; font-size: 11px;">🎯 Sens</button>
      <button class="vault-type chip ${vaultTypeFilter === 'hud' ? 'active' : ''}" data-type="hud" style="padding: 10px 6px; font-size: 11px;">🎮 HUD</button>
    </div>

    <div class="flex gap-2 mb-4">
      <button id="submit-vault-btn" class="btn-press flex-1 py-3 rounded-xl bg-primary font-bold text-sm glow-primary text-white flex items-center justify-center gap-2">
        <i data-lucide="upload" class="w-4 h-4"></i> Submit ${vaultTypeFilter === 'gunsmith' ? 'Build' : vaultTypeFilter === 'sens' ? 'Sensitivity' : 'HUD'}
      </button>
      ${vaultTypeFilter === 'gunsmith' ? `
        <button id="open-builder-btn" class="btn-press px-4 py-3 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm flex items-center justify-center gap-1.5">
          <i data-lucide="wrench" class="w-4 h-4"></i> Build
        </button>
      ` : ''}
    </div>

    <div class="relative mb-4">
      <i data-lucide="search" class="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"></i>
      <input id="vault-search" type="text" placeholder="Search by gun or code..." class="pl-10" value="${esc(State.filters.vaults.search || '')}" />
    </div>

    <div id="vault-feed" class="grid grid-cols-2 gap-3">
      ${skeletonCard().repeat(4)}
    </div>
  `;

  document.getElementById('submit-vault-btn').onclick = () => openSubmitVaultSheet(vaultTypeFilter);

  const builderBtn = document.getElementById('open-builder-btn');
  if (builderBtn) {
    builderBtn.onclick = () => {
      if (typeof openGunsmithBuilder === 'function') openGunsmithBuilder();
      else toast('Builder loading...', 'info', 1000);
    };
  }

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

// ============================================
// LOAD VAULTS (real-time)
// ============================================
function loadVaults() {
  if (State.unsubs.vaults) {
    try { State.unsubs.vaults(); } catch (e) {}
    State.unsubs.vaults = null;
  }

  const q = query(collection(db, 'vaults'), orderBy('createdAt', 'desc'), limit(80));

  State.unsubs.vaults = onSnapshot(q, (snap) => {
    const vaults = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.type === vaultTypeFilter) {
        vaults.push({ id: d.id, ...data });
      }
    });
    State.cache.vaults = vaults;
    renderVaults();
  }, (err) => {
    console.error('Vaults error:', err);
    const feed = document.getElementById('vault-feed');
    if (feed) {
      feed.className = '';
      feed.innerHTML = emptyState('package-open', 'No vaults yet', 'Share your first build', 'Submit Build', () => openSubmitVaultSheet(vaultTypeFilter));
    }
    if (window.lucide) window.lucide.createIcons();
  });
}

// ============================================
// RENDER VAULTS (grid)
// ============================================
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
    const typeLabel = vaultTypeFilter === 'sens' ? 'sensitivity' : vaultTypeFilter === 'hud' ? 'HUD layout' : 'build';
    feed.innerHTML = emptyState('package-open', 'No ' + typeLabel + 's yet', 'Share your first ' + typeLabel, 'Submit', () => openSubmitVaultSheet(vaultTypeFilter));
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.className = 'grid grid-cols-2 gap-3';
  feed.innerHTML = vaults.map(v => renderVaultCard(v)).join('');

  wireVaultCards();
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// VAULT CARD
// ============================================
function renderVaultCard(v) {
  const isMine = v.uid === State.user.uid;
  const isSens = v.type === 'sens';
  const isHud = v.type === 'hud';

  return `
    <div class="vault-card bg-card border border-border rounded-2xl p-3 fade-in relative" data-id="${v.id}" style="cursor: pointer;">
      ${isMine ? `
        <button class="vault-menu-btn absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center z-10" data-id="${v.id}">
          <i data-lucide="more-vertical" class="w-3.5 h-3.5 text-white/70"></i>
        </button>
      ` : ''}

      ${v.imageUrl && !isSens ? `
        <img src="${esc(v.imageUrl)}" class="w-full h-24 object-cover rounded-xl mb-3" loading="lazy" />
      ` : isSens ? `
        <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-primaryDark/20 flex items-center justify-center flex-col gap-1">
          <span style="font-size: 24px;">🎯</span>
          <span class="text-[10px] text-primary font-bold">SENSITIVITY</span>
        </div>
      ` : isHud ? `
        <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-gold/20 to-yellow-500/20 flex items-center justify-center flex-col gap-1">
          <span style="font-size: 24px;">🎮</span>
          <span class="text-[10px] text-gold font-bold">HUD LAYOUT</span>
        </div>
      ` : `
        <div class="w-full h-24 rounded-xl mb-3 bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center">
          <i data-lucide="crosshair" class="w-8 h-8 text-primary/60"></i>
        </div>
      `}

      <div class="text-xs font-bold text-gray-300 truncate">${esc(v.gunName || 'Unknown')}</div>
      <div class="text-[10px] text-gray-500 mb-2 truncate">${esc(v.gunsmithCode || v.type || 'build')}</div>

      <div class="flex items-center justify-between">
        ${renderReactionButton('vault', v.id, v.reactions, v.myReaction)}
        <button class="vault-share-btn btn-press text-primary" data-id="${v.id}" data-gun="${esc(v.gunName)}">
          <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// WIRE VAULT CARDS
// ============================================
function wireVaultCards() {
  const feed = document.getElementById('vault-feed');
  if (!feed) return;

  feed.querySelectorAll('.vault-share-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openShareSheet({
        title: btn.dataset.gun,
        text: 'Check out this ' + btn.dataset.gun + ' on CODMPanda!',
        url: location.origin + '/?vault=' + btn.dataset.id
      });
    };
  });

  feed.querySelectorAll('.vault-menu-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openVaultMenu(btn.dataset.id);
    };
  });

  feed.querySelectorAll('.vault-card').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('button')) return;
      openVaultDetail(card.dataset.id);
    };
  });
}

// ============================================
// VAULT 3-DOT MENU
// ============================================
function openVaultMenu(vaultId) {
  const vault = State.cache.vaults.find(v => v.id === vaultId);
  if (!vault) return;

  const isSens = vault.type === 'sens';
  const isHud = vault.type === 'hud';

  openSheet(`
    <div class="space-y-2">
      <div class="text-[10px] text-gray-500 uppercase font-bold mb-2">${esc(vault.gunName || 'Build')}</div>

      <button id="vm-view" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
        <i data-lucide="eye" class="w-4 h-4 text-gray-400"></i>
        <span class="text-sm font-bold">View Details</span>
      </button>

      <button id="vm-edit" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
        <i data-lucide="pencil" class="w-4 h-4 text-primary"></i>
        <span class="text-sm font-bold">Edit</span>
      </button>

      <button id="vm-share" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
        <i data-lucide="share-2" class="w-4 h-4 text-primary"></i>
        <span class="text-sm font-bold">Share</span>
      </button>

      ${!isSens && !isHud && vault.gunsmithCode ? `
        <button id="vm-copy" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border text-left">
          <i data-lucide="copy" class="w-4 h-4 text-primary"></i>
          <span class="text-sm font-bold">Copy Code</span>
        </button>
      ` : ''}

      <button id="vm-delete" class="btn-press w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-left">
        <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
        <span class="text-sm font-bold text-red-400">Delete</span>
      </button>

      <button onclick="closeSheet()" class="text-xs text-gray-500 w-full pt-3">Cancel</button>
    </div>
  `, '');

  document.getElementById('vm-view').onclick = () => {
    closeSheet();
    setTimeout(() => openVaultDetail(vault.id), 300);
  };

  document.getElementById('vm-edit').onclick = () => {
    closeSheet();
    setTimeout(() => openEditVaultModal(vault), 300);
  };

  document.getElementById('vm-share').onclick = () => {
    closeSheet();
    setTimeout(() => openShareSheet({
      title: vault.gunName,
      text: 'Check out this ' + vault.gunName + ' on CODMPanda!',
      url: location.origin + '/?vault=' + vault.id
    }), 300);
  };

  const copyBtn = document.getElementById('vm-copy');
  if (copyBtn) {
    copyBtn.onclick = () => {
      closeSheet();
      copyText(vault.gunsmithCode, 'Code copied!');
    };
  }

  document.getElementById('vm-delete').onclick = () => {
    closeSheet();
    setTimeout(() => {
      confirmDialog('Delete', 'Remove this permanently?', async () => {
        try {
          await deleteDoc(doc(db, 'vaults', vault.id));
          State.cache.vaults = State.cache.vaults.filter(v => v.id !== vault.id);
          renderVaults();
          toast('Deleted', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    }, 300);
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// VAULT DETAIL VIEW
// ============================================
function openVaultDetail(vaultId) {
  const vault = State.cache.vaults.find(v => v.id === vaultId);
  if (!vault) {
    toast('Not found', 'error');
    return;
  }

  const isMine = vault.uid === State.user.uid;
  const isSens = vault.type === 'sens';
  const isHud = vault.type === 'hud';

  let contentHTML = '';

  if (isSens) {
    const fields = vault.attachments || {};
    contentHTML = `
      <div class="space-y-2">
        ${Object.entries(fields).length > 0 ? Object.entries(fields).map(([k, v]) => {
          const fieldName = (window.SENS_FIELDS || []).find(f => f.key === k)?.label || k;
          return `
            <div class="flex items-center justify-between bg-card border border-border rounded-lg p-3">
              <span class="text-xs text-gray-400">${esc(fieldName)}</span>
              <span class="text-sm font-black text-primary">${esc(v)}</span>
            </div>
          `;
        }).join('') : '<div class="text-center py-4 text-xs text-gray-500">No values saved</div>'}
      </div>
      ${vault.device ? '<div class="bg-card border border-border rounded-lg p-3 mt-3"><span class="text-xs text-gray-400">Device: </span><span class="text-xs font-bold text-white">' + esc(vault.device) + '</span></div>' : ''}
      ${vault.notes ? '<div class="bg-card border border-border rounded-lg p-3 mt-3"><div class="text-[10px] text-gray-500 uppercase font-bold mb-1">Notes</div><p class="text-xs text-gray-300">' + esc(vault.notes) + '</p></div>' : ''}
    `;
  } else if (isHud) {
    contentHTML = `
      ${vault.imageUrl ? '<img src="' + esc(vault.imageUrl) + '" class="zoomable w-full rounded-xl mb-3" />' : ''}
      <div class="space-y-2">
        ${vault.attachments?.style ? '<div class="flex items-center justify-between bg-card border border-border rounded-lg p-3"><span class="text-xs text-gray-400">Control Style</span><span class="text-sm font-black text-gold">' + esc(vault.attachments.style) + '</span></div>' : ''}
        ${vault.attachments?.device ? '<div class="flex items-center justify-between bg-card border border-border rounded-lg p-3"><span class="text-xs text-gray-400">Device</span><span class="text-sm font-black text-white">' + esc(vault.attachments.device) + '</span></div>' : ''}
      </div>
      ${vault.notes ? '<div class="bg-card border border-border rounded-lg p-3 mt-3"><div class="text-[10px] text-gray-500 uppercase font-bold mb-1">Notes</div><p class="text-xs text-gray-300">' + esc(vault.notes) + '</p></div>' : ''}
    `;
  } else {
    contentHTML = `
      ${vault.imageUrl ? '<img src="' + esc(vault.imageUrl) + '" class="zoomable w-full rounded-xl mb-3" />' : ''}

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
      <div class="text-center">
        <div class="text-2xl font-black mb-1">${esc(vault.gunName || 'Unknown')}</div>
        <div class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">${isSens ? 'SENSITIVITY' : isHud ? 'HUD LAYOUT' : 'GUNSMITH BUILD'}</div>
      </div>

      <div class="flex items-center justify-center gap-2 text-xs">
        ${renderAvatar(vault, 24)}
        <span class="text-gray-400">by ${renderUsername(vault, 'text-white font-bold')} · ${timeAgo(vault.createdAt)}</span>
      </div>

      ${contentHTML}

      <div class="flex items-center gap-2 pt-3 border-t border-border">
        ${renderReactionButton('vault', vault.id, vault.reactions, vault.myReaction)}
        ${renderCommentButton('vault', vault.id, vault.commentCount || 0)}
        <button id="detail-share" class="btn-press flex-1 py-2.5 rounded-xl bg-cardAlt border border-border text-gray-300 font-bold text-sm flex items-center justify-center gap-2">
          <i data-lucide="share-2" class="w-4 h-4"></i> Share
        </button>
        ${isMine ? `
          <button id="detail-edit" class="btn-press w-11 h-11 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center">
            <i data-lucide="pencil" class="w-4 h-4 text-primary"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `, '');

  const copyBtn = document.getElementById('detail-copy-code');
  if (copyBtn) copyBtn.onclick = () => copyText(copyBtn.dataset.code, 'Code copied!');

  document.getElementById('detail-share').onclick = () => {
    openShareSheet({
      title: vault.gunName,
      text: 'Check out this ' + vault.gunName + ' on CODMPanda!',
      url: location.origin + '/?vault=' + vault.id
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
// SUBMIT VAULT SHEET (Gunsmith / Sens / HUD)
// ============================================
function openSubmitVaultSheet(type) {
  type = type || 'gunsmith';

  if (type === 'gunsmith') return openSubmitGunsmithSheet();
  if (type === 'sens') return openSubmitSensSheet();
  if (type === 'hud') return openSubmitHudSheet();
}

// ---------- GUNSMITH SUBMIT ----------
function openSubmitGunsmithSheet() {
  const pro = isPro();

  openSheet(`
    <div class="space-y-4">
      <div class="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary">
        Share a gunsmith build with the community
      </div>

      ${pro ? `
        <button id="ocr-scan-btn" class="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-xs flex items-center justify-center gap-2">
          📸 Auto-fill from Screenshot (Pro)
        </button>
      ` : ''}

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun Name *</label>
        <select id="sv-gun" data-dropdown-title="Select Gun">
          <option value="">Select a gun...</option>
          ${Object.entries(CODM_GUNS).map(([cat, guns]) => `
            <optgroup label="${cat}">
              ${guns.map(g => '<option value="' + g + '">' + g + '</option>').join('')}
            </optgroup>
          `).join('')}
        </select>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gunsmith Code</label>
        <input id="sv-code" type="text" placeholder="e.g. ABC123XYZ" maxlength="20" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Attachments (one per line: Slot: Name)</label>
        <textarea id="sv-attach" rows="4" maxlength="500" placeholder="Muzzle: Muzzle Brake&#10;Barrel: RTC Light Barrel&#10;Optic: Red Dot"></textarea>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Screenshot (optional)</label>
        <input id="sv-image" type="file" accept="image/*" class="text-xs" />
      </div>

      <button id="sv-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">
        Submit Build
      </button>
    </div>
  `, 'Submit Build');

  // OCR scan (Pro)
  const ocrBtn = document.getElementById('ocr-scan-btn');
  if (ocrBtn) {
    ocrBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        if (!input.files || !input.files[0]) return;
        toast('Scanning image...', 'info', 2000);
        const result = await runOCROnScreenshot(input.files[0]);
        if (result) {
          if (result.attachments) {
            document.getElementById('sv-attach').value = result.attachments;
          }
          if (result.gun && document.getElementById('sv-gun')) {
            document.getElementById('sv-gun').value = result.gun;
          }
          toast('Auto-filled! Check and adjust.', 'success', 3000);
        } else {
          toast('Could not read attachments. Fill manually.', 'warning', 3000);
        }
      };
      input.click();
    };
  }

  document.getElementById('sv-submit').onclick = async () => {
    const gunName = document.getElementById('sv-gun').value;
    const gunsmithCode = document.getElementById('sv-code').value.trim();
    const attachRaw = document.getElementById('sv-attach').value.trim();
    const fileInput = document.getElementById('sv-image');

    if (!gunName) { toast('Select a gun', 'error'); return; }
    if (!gunsmithCode && !attachRaw) { toast('Add code or attachments', 'error'); return; }

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

      await addDoc(collection(db, 'vaults'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        isPro: isPro(),
        verified: !!State.profile.verified,
        gunName, gunsmithCode, type: 'gunsmith',
        attachments, imageUrl,
        reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
        reactionCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });

      toast('Posted!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Build';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ---------- SENS SUBMIT ----------
function openSubmitSensSheet() {
  openSheet(`
    <div class="space-y-4">
      <div class="bg-primary/10 border border-primary/30 rounded-xl p-3 text-xs text-primary">
        Share your sensitivity settings
      </div>

      ${(window.SENS_FIELDS || []).map(f => `
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">${esc(f.label)}</label>
          <input id="sens-${f.key}" type="number" min="0" max="300" placeholder="${esc(f.placeholder)}" />
        </div>
      `).join('')}

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Device</label>
        <select id="sens-device" data-dropdown-title="Device">
          <option value="">Select...</option>
          <option>Phone</option>
          <option>Tablet</option>
          <option>Controller</option>
        </select>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Notes</label>
        <textarea id="sens-notes" rows="2" maxlength="200" placeholder="e.g. 4-finger claw, gyro off"></textarea>
      </div>

      <button id="sens-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">
        Submit Sensitivity
      </button>
    </div>
  `, 'Submit Sensitivity');

  document.getElementById('sens-submit').onclick = async () => {
    const values = {};
    (window.SENS_FIELDS || []).forEach(f => {
      const el = document.getElementById('sens-' + f.key);
      if (el && el.value.trim()) values[f.key] = parseInt(el.value);
    });
    const device = document.getElementById('sens-device').value;
    const notes = document.getElementById('sens-notes').value.trim();

    if (Object.keys(values).length === 0) { toast('Enter at least one value', 'error'); return; }

    const summary = (window.SENS_FIELDS || [])
      .filter(f => values[f.key] !== undefined)
      .map(f => f.label.split(' ')[0] + ': ' + values[f.key])
      .join(' | ');

    const btn = document.getElementById('sens-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      await addDoc(collection(db, 'vaults'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        isPro: isPro(),
        verified: !!State.profile.verified,
        gunName: 'Sensitivity · ' + (device || 'Custom'),
        gunsmithCode: summary.slice(0, 60),
        type: 'sens',
        attachments: values,
        device,
        notes,
        reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
        reactionCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });

      toast('Posted!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Sensitivity';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ---------- HUD SUBMIT ----------
function openSubmitHudSheet() {
  openSheet(`
    <div class="space-y-4">
      <div class="bg-gold/10 border border-gold/30 rounded-xl p-3 text-xs text-gold">
        Share your HUD layout — screenshot required
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Control Style *</label>
        <select id="hud-style" data-dropdown-title="Style">
          ${(window.HUD_STYLES || []).map(s => '<option>' + s + '</option>').join('')}
        </select>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Device</label>
        <select id="hud-device" data-dropdown-title="Device">
          <option>Phone</option>
          <option>Tablet</option>
          <option>Controller</option>
        </select>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Screenshot *</label>
        <input id="hud-image" type="file" accept="image/*" class="text-xs" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Notes</label>
        <textarea id="hud-notes" rows="2" maxlength="200" placeholder="e.g. Left-hand fire button, custom joystick"></textarea>
      </div>

      <button id="hud-submit" class="btn-press w-full py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black">
        Submit HUD
      </button>
    </div>
  `, 'Submit HUD');

  document.getElementById('hud-submit').onclick = async () => {
    const style = document.getElementById('hud-style').value;
    const device = document.getElementById('hud-device').value;
    const fileInput = document.getElementById('hud-image');
    const notes = document.getElementById('hud-notes').value.trim();

    if (!fileInput.files || !fileInput.files[0]) { toast('Screenshot required', 'error'); return; }

    const btn = document.getElementById('hud-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      const imageUrl = await compressImage(fileInput.files[0], 800, 0.7);

      await addDoc(collection(db, 'vaults'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        isPro: isPro(),
        verified: !!State.profile.verified,
        gunName: 'HUD · ' + style,
        gunsmithCode: device,
        type: 'hud',
        attachments: { style, device },
        imageUrl,
        notes,
        reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
        reactionCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });

      toast('Posted!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit HUD';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// EDIT VAULT MODAL
// ============================================
function openEditVaultModal(vault) {
  if (!vault) return;
  const type = vault.type || 'gunsmith';

  if (type === 'sens') return openEditSens(vault);
  if (type === 'hud') return openEditHud(vault);
  return openEditGunsmith(vault);
}

function openEditGunsmith(vault) {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun Name</label>
        <input id="ev-gun" type="text" value="${esc(vault.gunName || '')}" maxlength="40" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gunsmith Code</label>
        <input id="ev-code" type="text" value="${esc(vault.gunsmithCode || '')}" maxlength="20" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Attachments</label>
        <textarea id="ev-attach" rows="5" maxlength="500">${esc(Object.entries(vault.attachments || {}).map(([k, v]) => k + ': ' + (typeof v === 'string' ? v : v.name || '')).join('\n'))}</textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">New Screenshot (optional)</label>
        <input id="ev-image" type="file" accept="image/*" class="text-xs" />
      </div>
      <button id="ev-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">Save Changes</button>
    </div>
  `, 'Edit Build');

  document.getElementById('ev-save').onclick = async () => {
    const gunName = document.getElementById('ev-gun').value.trim();
    const gunsmithCode = document.getElementById('ev-code').value.trim();
    const attachRaw = document.getElementById('ev-attach').value.trim();
    const fileInput = document.getElementById('ev-image');

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
      toast('Updated', 'success');
      closeSheet();
      State.cache.vaults = State.cache.vaults.map(v => v.id === vault.id ? { ...v, ...updates } : v);
      renderVaults();
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

function openEditSens(vault) {
  openSheet(`
    <div class="space-y-4">
      ${(window.SENS_FIELDS || []).map(f => `
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">${esc(f.label)}</label>
          <input id="es-${f.key}" type="number" min="0" max="300" value="${vault.attachments?.[f.key] || ''}" placeholder="${esc(f.placeholder)}" />
        </div>
      `).join('')}
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Device</label>
        <select id="es-device" data-dropdown-title="Device">
          <option value="">Select...</option>
          <option ${vault.device === 'Phone' ? 'selected' : ''}>Phone</option>
          <option ${vault.device === 'Tablet' ? 'selected' : ''}>Tablet</option>
          <option ${vault.device === 'Controller' ? 'selected' : ''}>Controller</option>
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Notes</label>
        <textarea id="es-notes" rows="2" maxlength="200">${esc(vault.notes || '')}</textarea>
      </div>
      <button id="es-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">Save Changes</button>
    </div>
  `, 'Edit Sensitivity');

  document.getElementById('es-save').onclick = async () => {
    const values = {};
    (window.SENS_FIELDS || []).forEach(f => {
      const el = document.getElementById('es-' + f.key);
      if (el && el.value.trim()) values[f.key] = parseInt(el.value);
    });
    const device = document.getElementById('es-device').value;
    const notes = document.getElementById('es-notes').value.trim();

    const summary = (window.SENS_FIELDS || [])
      .filter(f => values[f.key] !== undefined)
      .map(f => f.label.split(' ')[0] + ': ' + values[f.key])
      .join(' | ');

    try {
      const updates = { attachments: values, gunsmithCode: summary.slice(0, 60), device, notes };
      await updateDoc(doc(db, 'vaults', vault.id), updates);
      toast('Updated', 'success');
      closeSheet();
      State.cache.vaults = State.cache.vaults.map(v => v.id === vault.id ? { ...v, ...updates } : v);
      renderVaults();
    } catch (e) { toast('Failed', 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

function openEditHud(vault) {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Control Style</label>
        <select id="eh-style" data-dropdown-title="Style">
          ${(window.HUD_STYLES || []).map(s => '<option ' + (vault.attachments?.style === s ? 'selected' : '') + '>' + s + '</option>').join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Device</label>
        <select id="eh-device" data-dropdown-title="Device">
          <option ${vault.attachments?.device === 'Phone' ? 'selected' : ''}>Phone</option>
          <option ${vault.attachments?.device === 'Tablet' ? 'selected' : ''}>Tablet</option>
          <option ${vault.attachments?.device === 'Controller' ? 'selected' : ''}>Controller</option>
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">New Screenshot (optional)</label>
        <input id="eh-image" type="file" accept="image/*" class="text-xs" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Notes</label>
        <textarea id="eh-notes" rows="2" maxlength="200">${esc(vault.notes || '')}</textarea>
      </div>
      <button id="eh-save" class="btn-press w-full py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-bold">Save Changes</button>
    </div>
  `, 'Edit HUD');

  document.getElementById('eh-save').onclick = async () => {
    const style = document.getElementById('eh-style').value;
    const device = document.getElementById('eh-device').value;
    const fileInput = document.getElementById('eh-image');
    const notes = document.getElementById('eh-notes').value.trim();

    try {
      const updates = {
        gunName: 'HUD · ' + style,
        gunsmithCode: device,
        attachments: { style, device },
        notes
      };
      if (fileInput.files && fileInput.files[0]) {
        updates.imageUrl = await compressImage(fileInput.files[0], 800, 0.7);
      }
      await updateDoc(doc(db, 'vaults', vault.id), updates);
      toast('Updated', 'success');
      closeSheet();
      State.cache.vaults = State.cache.vaults.map(v => v.id === vault.id ? { ...v, ...updates } : v);
      renderVaults();
    } catch (e) { toast('Failed', 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// OCR AUTO-FILL (Pro feature) — placeholder
// ============================================
async function runOCROnScreenshot(file) {
  try {
    // Placeholder — wire Tesseract.js later if you want
    // For now return null so users fall back to manual
    console.log('OCR placeholder — file:', file.name);
    return null;
  } catch (e) {
    console.error('OCR error:', e);
    return null;
  }
}

// ============================================
// EXPORT
// ============================================
window.renderLabTab = renderLabTab;
window.renderVaultSub = renderVaultSub;
window.loadVaults = loadVaults;
window.renderVaults = renderVaults;
window.renderVaultCard = renderVaultCard;
window.openVaultMenu = openVaultMenu;
window.openVaultDetail = openVaultDetail;
window.openSubmitVaultSheet = openSubmitVaultSheet;
window.openEditVaultModal = openEditVaultModal;

// ============================================
// END OF CHUNK 13/24
// ============================================
// ============================================
// CHUNK 14a/24 — Gunsmith Builder (Data + Picker + Canvas)
// ⚙️ UPDATE HERE: slots, stat config, base stats, attachment pools
// ============================================

// ============================================
// GUNSMITH SLOTS
// ============================================
const GUNSMITH_SLOTS = [
  { key: 'muzzle',      label: 'Muzzle',      icon: 'shield' },
  { key: 'barrel',      label: 'Barrel',      icon: 'align-vertical-space-around' },
  { key: 'optic',       label: 'Optic',       icon: 'eye' },
  { key: 'stock',       label: 'Stock',       icon: 'minus' },
  { key: 'laser',       label: 'Laser',       icon: 'zap' },
  { key: 'underbarrel', label: 'Underbarrel', icon: 'grip' },
  { key: 'ammunition',  label: 'Ammunition',  icon: 'package' },
  { key: 'rearGrip',    label: 'Rear Grip',   icon: 'hand' },
  { key: 'perk',        label: 'Perk',        icon: 'star' }
];

// ============================================
// STAT CONFIG
// ============================================
const STAT_CONFIG = [
  { key: 'accuracy', label: 'Accuracy',  color: '#00BFFF' },
  { key: 'damage',   label: 'Damage',    color: '#FF3B30' },
  { key: 'range',    label: 'Range',     color: '#FF9500' },
  { key: 'fireRate', label: 'Fire Rate', color: '#FFCC00' },
  { key: 'mobility', label: 'Mobility',  color: '#34C759' },
  { key: 'control',  label: 'Control',   color: '#AF52DE' }
];

// ============================================
// GUN CATEGORY META
// ============================================
const GUN_CATEGORY_META = {
  'Assault Rifle': { icon: 'crosshair', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  'SMG':           { icon: 'zap',       color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
  'Sniper':        { icon: 'target',    color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' },
  'LMG':           { icon: 'box',       color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' },
  'Shotgun':       { icon: 'shield',    color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
  'Marksman':      { icon: 'crosshair', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' },
  'Pistol':        { icon: 'target',    color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)' },
  'Melee':         { icon: 'sword',     color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  'Launcher':      { icon: 'rocket',    color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)' }
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
// 3D GUN MODEL MAP (for Chunk 25)
// ============================================
const GUN_MODEL_MAP = {
  'AK117': 'modern_tactical_carbine.glb',
  'M4': 'modern_tactical_carbine.glb',
  'M13': 'modern_tactical_carbine.glb',
  'Kilo 141': 'modern_tactical_carbine.glb',
  'Grau 5.56': 'modern_tactical_carbine.glb',
  'AK-47': 'wood_furniture_assault_rifle.glb',
  'ASM10': 'wood_furniture_assault_rifle.glb',
  'DR-H': 'wood_furniture_assault_rifle.glb',
  'RUS-79U': 'wood_furniture_assault_rifle.glb',
  'Type 25': 'wood_furniture_assault_rifle.glb',
  'Fennec': 'compact_submachine_gun.glb',
  'QQ9': 'compact_submachine_gun.glb',
  'MP5': 'compact_submachine_gun.glb',
  'Cordite': 'compact_submachine_gun.glb',
  'MX9': 'compact_submachine_gun.glb',
  'LAPA': 'compact_submachine_gun.glb',
  'PP19 Bizon': 'drum_magazine_submachine_gun.glb',
  'PPSh-41': 'drum_magazine_submachine_gun.glb',
  'DL Q33': 'bolt_action_sniper_rifle.glb',
  'Locus': 'bolt_action_sniper_rifle.glb',
  'Arctic .50': 'bolt_action_sniper_rifle.glb',
  'Koshka': 'bolt_action_sniper_rifle.glb',
  'Outlaw': 'lever_action_rifle.glb',
  'RPD': 'belt_fed_light_machine_gun.glb',
  'Holger 26': 'belt_fed_light_machine_gun.glb',
  'Chopper': 'handheld_minigun.glb',
  'BY15': 'pump_action_shotgun.glb',
  'KRM 262': 'pump_action_shotgun.glb',
  'J358': 'six_shot_revolver.glb',
  'MW11': 'compact_polymer_pistol.glb',
  '.50 GS': 'compact_polymer_pistol.glb',
  'Shorty': 'sawed_off_double_barrel.glb',
  'Crossbow': 'lever_action_rifle.glb',
  'FHJ-18': 'rocket_launcher.glb',
  'SMRS': 'rocket_launcher.glb',
  'Thumper': 'revolving_grenade_launcher.glb'
};

function getGunModel(gunName) {
  return GUN_MODEL_MAP[gunName] || 'modern_tactical_carbine.glb';
}

// ============================================
// BASE STATS
// ============================================
const GUN_BASE_STATS = {
  'AK117': { accuracy: 65, damage: 70, range: 60, fireRate: 78, mobility: 68, control: 55 },
  'AK-47': { accuracy: 60, damage: 85, range: 75, fireRate: 55, mobility: 55, control: 45 },
  'M4':    { accuracy: 78, damage: 62, range: 65, fireRate: 72, mobility: 70, control: 75 },
  'Fennec': { accuracy: 55, damage: 60, range: 55, fireRate: 92, mobility: 88, control: 40 },
  'QQ9':   { accuracy: 65, damage: 62, range: 58, fireRate: 82, mobility: 82, control: 55 },
  'MP5':   { accuracy: 70, damage: 62, range: 58, fireRate: 80, mobility: 80, control: 65 },
  'DL Q33': { accuracy: 88, damage: 92, range: 92, fireRate: 28, mobility: 40, control: 45 },
  'Locus': { accuracy: 82, damage: 88, range: 88, fireRate: 42, mobility: 55, control: 55 }
};

function getGunBaseStats(gunName) {
  return GUN_BASE_STATS[gunName] || { accuracy: 65, damage: 65, range: 65, fireRate: 65, mobility: 65, control: 65 };
}

// ============================================
// ATTACHMENT POOLS (GENERIC FALLBACK)
// ============================================
const ATTACHMENT_POOLS = {
  muzzle: [
    { name: 'Muzzle Brake', effects: { control: 8, accuracy: 4 } },
    { name: 'Compensator', effects: { control: 10, accuracy: -2 } },
    { name: 'Flash Guard', effects: { control: 5 } },
    { name: 'Suppressor', effects: { range: -5, mobility: 3, control: 6 } },
    { name: 'Monolithic Suppressor', effects: { range: 5, control: 8, mobility: -3 } },
    { name: 'Tactical Suppressor', effects: { control: 6, mobility: 2 } }
  ],
  barrel: [
    { name: 'RTC Light Barrel', effects: { mobility: 8, range: -4 } },
    { name: 'OWC Marksman', effects: { range: 8, control: 4, mobility: -4 } },
    { name: 'OWC Ranger', effects: { range: 12, accuracy: 5, mobility: -8, control: -3 } },
    { name: 'MIP Extended Light Barrel', effects: { range: 6, mobility: 2 } },
    { name: 'MIP Custom Long Barrel', effects: { range: 10, accuracy: 4, mobility: -6 } },
    { name: 'Short Barrel', effects: { mobility: 10, accuracy: -4 } },
    { name: 'Heavy Barrel', effects: { range: 9, damage: 3, mobility: -8 } }
  ],
  optic: [
    { name: 'Red Dot Sight', effects: { accuracy: 4 } },
    { name: 'Holographic Sight', effects: { accuracy: 5 } },
    { name: '3x Tactical Scope', effects: { range: 4, accuracy: 6, mobility: -3 } },
    { name: '4x Tactical Scope', effects: { range: 6, accuracy: 8, mobility: -5 } },
    { name: 'Iron Sights', effects: { mobility: 3 } }
  ],
  stock: [
    { name: 'No Stock', effects: { mobility: 10, control: -6, accuracy: -3 } },
    { name: 'MIP Strike Stock', effects: { accuracy: 5, control: 5, mobility: -3 } },
    { name: 'RTC Steady Stock', effects: { control: 8, accuracy: 6, mobility: -5 } },
    { name: 'YKM Light Stock', effects: { mobility: 6, control: 2 } },
    { name: 'OWC Skeleton Stock', effects: { mobility: 8, control: 3 } }
  ],
  laser: [
    { name: 'OWC Laser - Tactical', effects: { accuracy: 6, mobility: 4 } },
    { name: 'OWC Laser - Light', effects: { mobility: 6, accuracy: 3 } },
    { name: 'MIP Laser 5mW', effects: { mobility: 4, accuracy: 2 } },
    { name: 'Aim Assist Laser', effects: { accuracy: 8, mobility: 2 } }
  ],
  underbarrel: [
    { name: 'Foregrip', effects: { control: 6, accuracy: 3 } },
    { name: 'Ranger Foregrip', effects: { control: 10, accuracy: 4, mobility: -3 } },
    { name: 'Strike Foregrip', effects: { mobility: 4, control: 3 } },
    { name: 'Merc Foregrip', effects: { control: 8, accuracy: 3, mobility: -2 } },
    { name: 'Light Foregrip', effects: { control: 5, mobility: 2 } }
  ],
  ammunition: [
    { name: 'Extended Mag', effects: { mobility: -2 } },
    { name: 'Fast Mag', effects: { mobility: 3 } },
    { name: 'Extended Mag A', effects: { mobility: -3 } },
    { name: 'Large Extended Mag', effects: { mobility: -5 } }
  ],
  rearGrip: [
    { name: 'Rubberized Grip Tape', effects: { control: 5, accuracy: 3 } },
    { name: 'Stippled Grip Tape', effects: { accuracy: 4, control: 3 } },
    { name: 'Granulated Grip Tape', effects: { control: 6 } },
    { name: 'Skeletonized Rear Grip', effects: { mobility: 4, control: -2 } }
  ],
  perk: [
    { name: 'Sleight of Hand', effects: {} },
    { name: 'Fast Switch', effects: {} },
    { name: 'Ammo Increase', effects: { mobility: -2 } },
    { name: 'Long Shot', effects: { range: 3 } },
    { name: 'Toughness', effects: { control: 4 } }
  ]
};

// ============================================
// GUN-SPECIFIC ATTACHMENTS
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

function getAttachmentsForSlot(gunName, slotKey) {
  const gunSpecific = GUN_SPECIFIC_ATTACHMENTS[gunName];
  if (gunSpecific && gunSpecific[slotKey]) {
    const names = gunSpecific[slotKey];
    const masterPool = ATTACHMENT_POOLS[slotKey] || [];
    return names.map(name => {
      const found = masterPool.find(a => a.name === name);
      return found || { name, effects: {} };
    });
  }
  return ATTACHMENT_POOLS[slotKey] || [];
}

// ============================================
// PRESET BUILDS
// ============================================
const PRESET_BUILDS = {
  'Fennec': [
    { name: 'Rusher', slots: { muzzle: 'Monolithic Suppressor', barrel: 'RTC Light Barrel', stock: 'No Stock', laser: 'OWC Laser - Tactical', rearGrip: 'Rubberized Grip Tape' } },
    { name: 'Hip Fire', slots: { muzzle: 'Muzzle Brake', barrel: 'Short Barrel', stock: 'No Stock', laser: 'Aim Assist Laser', rearGrip: 'Stippled Grip Tape' } }
  ],
  'AK117': [
    { name: 'Balanced Meta', slots: { muzzle: 'Muzzle Brake', barrel: 'MIP Extended Light Barrel', optic: 'Red Dot Sight', stock: 'MIP Strike Stock', rearGrip: 'Rubberized Grip Tape' } },
    { name: 'Long Range', slots: { muzzle: 'Monolithic Suppressor', barrel: 'MIP Extended Light Barrel', optic: '3x Tactical Scope', stock: 'RTC Steady Stock', rearGrip: 'Rubberized Grip Tape' } }
  ],
  'DL Q33': [
    { name: 'Quick Scope', slots: { muzzle: 'Muzzle Brake', barrel: 'OWC Marksman', stock: 'OWC Skeleton Stock', laser: 'OWC Laser - Tactical', perk: 'Fast Switch' } },
    { name: 'Hard Scope', slots: { muzzle: 'Monolithic Suppressor', barrel: 'MIP Custom Long Barrel', optic: '4x Tactical Scope', stock: 'RTC Steady Stock', rearGrip: 'Rubberized Grip Tape' } }
  ]
};

// ============================================
// STATS CALC
// ============================================
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

function scoreBuild(final) {
  const weights = { accuracy: 1.0, damage: 1.2, range: 1.0, fireRate: 0.8, mobility: 1.0, control: 1.0 };
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

// ============================================
// BUILDER STATE
// ============================================
const BuilderState = {
  selectedGun: null,
  selectedAttachments: {},
  activeSlot: null
};

// ============================================
// OPEN GUNSMITH BUILDER
// ============================================
function openGunsmithBuilder(gunName) {
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
          <div class="text-[10px] text-gray-500">Build & share your loadout</div>
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
}

// ============================================
// RENDER BUILDER BODY
// ============================================
function renderBuilderBody() {
  const body = document.getElementById('builder-body');
  if (!body) return;

  if (!BuilderState.selectedGun) {
    renderGunPicker(body);
  } else {
    renderLoadoutCanvas(body);
  }
}

// ============================================
// GUN PICKER
// ============================================
function renderGunPicker(body) {
  const categories = ['Assault Rifle', 'SMG', 'Sniper', 'LMG', 'Shotgun', 'Marksman', 'Pistol'];
  let activeCategory = 'Assault Rifle';

  body.innerHTML = `
    <div class="text-center mb-4">
      <div class="text-xs text-gray-500 mb-2">Pick your weapon</div>
    </div>

    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1" id="gun-cat-filters">
      ${categories.map((c, i) => `<button class="chip gun-cat-btn ${i === 0 ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
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
        <div class="text-[9px] font-bold" style="color: ${meta.color};">${category}</div>
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

  document.getElementById('gun-search').oninput = (e) => renderGuns(activeCategory, e.target.value);

  renderGuns(activeCategory, '');
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// LOADOUT CANVAS
// ============================================
function renderLoadoutCanvas(body) {
  const gun = BuilderState.selectedGun;
  const { final, base, modifiers } = calculateFinalStats(gun, BuilderState.selectedAttachments);
  const attachedCount = Object.keys(BuilderState.selectedAttachments).length;
  const presets = PRESET_BUILDS[gun] || [];
  const score = scoreBuild(final);
  const gunMeta = getGunMeta(gun);

  body.innerHTML = `
    <div class="bg-card border border-primary/40 rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: ${gunMeta.bg};">
          <i data-lucide="${gunMeta.icon}" class="w-7 h-7" style="color: ${gunMeta.color};"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-lg font-black truncate">${esc(gun)}</div>
          <div class="text-[10px] text-gray-500">${gunMeta.category} · ${attachedCount}/9 · ${score.emoji} ${score.tier}</div>
        </div>
        <button id="change-gun-btn" class="btn-press px-3 py-2 rounded-lg bg-cardAlt border border-border text-[10px] font-bold">
          Change
        </button>
      </div>
    </div>

    ${presets.length > 0 && attachedCount === 0 ? `
      <div class="mb-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-2">Quick Presets</div>
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          ${presets.map((p, i) => `<button class="preset-btn chip" data-preset-index="${i}">${p.name}</button>`).join('')}
        </div>
      </div>
    ` : ''}

    <div id="stat-preview">${renderStatBars(base, final, modifiers)}</div>

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

    ${attachedCount > 0 ? `
      <div class="bg-card border border-border rounded-2xl p-3 mb-4">
        <div class="text-[10px] font-bold text-gray-400 uppercase mb-2">Attached</div>
        <div class="flex flex-wrap gap-1.5">
          ${GUNSMITH_SLOTS.map(slot => {
            const picked = BuilderState.selectedAttachments[slot.key];
            if (!picked) return '';
            return `<div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/15 border border-primary/30">
              <i data-lucide="${slot.icon}" class="w-3 h-3 text-primary"></i>
              <span class="text-[10px] font-bold text-primary">${esc(picked.name)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    ` : ''}

    <div class="space-y-2">
      <button id="open-3d-btn" class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold flex items-center justify-center gap-2">
        <i data-lucide="gamepad-2" class="w-4 h-4"></i> 3D Preview
      </button>
      <button id="builder-save-btn" class="btn-press w-full py-3.5 rounded-xl bg-primary font-black text-sm glow-primary flex items-center justify-center gap-2 text-white">
        <i data-lucide="save" class="w-4 h-4"></i> Save to Vault
      </button>
      <button id="builder-share-btn" class="btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm flex items-center justify-center gap-2">
        <i data-lucide="share-2" class="w-4 h-4"></i> Share Build
      </button>
    </div>

    <div class="bg-gradient-to-br from-gold/10 to-transparent border border-gold/30 rounded-2xl p-3 mt-4">
      <div class="flex items-start gap-2">
        <span style="font-size: 18px;">🎮</span>
        <div class="flex-1">
          <div class="text-[11px] font-black text-gold mb-1">REAL CODM 3D MODELS COMING SOON</div>
          <div class="text-[10px] text-gray-400 leading-relaxed">Authentic models with full attachment support in development. 👑 Pro users get early access.</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('change-gun-btn').onclick = () => {
    BuilderState.selectedGun = null;
    BuilderState.selectedAttachments = {};
    renderBuilderBody();
  };

  document.getElementById('open-3d-btn').onclick = () => {
    if (typeof open3DPreview === 'function') {
      open3DPreview(BuilderState.selectedGun, BuilderState.selectedAttachments);
    } else {
      toast('3D preview loading...', 'info', 1500);
    }
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
}

// ============================================
// STAT BARS
// ============================================
function renderStatBars(base, final, modifiers) {
  const score = scoreBuild(final);
  const pros = [];
  const cons = [];
  Object.entries(modifiers).forEach(([stat, val]) => {
    if (val >= 5) pros.push({ stat, val });
    else if (val <= -5) cons.push({ stat, val });
  });

  return `
    <div class="bg-gradient-to-br from-black to-[#0a0a0a] border rounded-2xl p-4 mb-3" style="border-color: ${score.color}40;">
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

    <div class="bg-card border border-border rounded-2xl p-4 mb-3">
      <div class="text-xs font-bold text-gray-400 uppercase mb-3">Stats Breakdown</div>
      <div class="space-y-2.5">
        ${STAT_CONFIG.map(stat => {
          const finalVal = final[stat.key];
          const mod = modifiers[stat.key];
          const modText = mod > 0 ? '+' + mod : mod < 0 ? '' + mod : '';
          const modColor = mod > 0 ? 'text-green-400' : mod < 0 ? 'text-red-400' : 'text-gray-600';
          return `
            <div>
              <div class="flex items-center justify-between text-[10px] mb-1">
                <span class="text-gray-400 font-semibold">${stat.label}</span>
                <div class="flex items-center gap-2">
                  ${modText ? '<span class="font-bold ' + modColor + '">' + modText + '</span>' : ''}
                  <span class="font-bold text-gray-300">${finalVal}/100</span>
                </div>
              </div>
              <div class="relative h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div class="absolute inset-y-0 left-0 rounded-full" style="width: ${base[stat.key]}%; background: rgba(255,255,255,0.08);"></div>
                <div class="absolute inset-y-0 left-0 rounded-full transition-all" style="width: ${finalVal}%; background: ${stat.color};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    ${(pros.length > 0 || cons.length > 0) ? `
      <div class="grid grid-cols-2 gap-2 mb-3">
        ${pros.length > 0 ? `
          <div class="bg-green-500/5 border border-green-500/30 rounded-2xl p-3">
            <div class="text-[10px] font-bold text-green-400 uppercase mb-2">Pros</div>
            ${pros.map(p => '<div class="flex justify-between text-[10px]"><span class="text-gray-300 capitalize">' + p.stat + '</span><span class="font-bold text-green-400">+' + p.val + '</span></div>').join('')}
          </div>
        ` : ''}
        ${cons.length > 0 ? `
          <div class="bg-red-500/5 border border-red-500/30 rounded-2xl p-3">
            <div class="text-[10px] font-bold text-red-400 uppercase mb-2">Cons</div>
            ${cons.map(c => '<div class="flex justify-between text-[10px]"><span class="text-gray-300 capitalize">' + c.stat + '</span><span class="font-bold text-red-400">' + c.val + '</span></div>').join('')}
          </div>
        ` : ''}
      </div>
    ` : ''}
  `;
}

// ============================================
// EXPORT 14a
// ============================================
window.GUNSMITH_SLOTS = GUNSMITH_SLOTS;
window.STAT_CONFIG = STAT_CONFIG;
window.GUN_CATEGORY_META = GUN_CATEGORY_META;
window.GUN_MODEL_MAP = GUN_MODEL_MAP;
window.GUN_BASE_STATS = GUN_BASE_STATS;
window.ATTACHMENT_POOLS = ATTACHMENT_POOLS;
window.GUN_SPECIFIC_ATTACHMENTS = GUN_SPECIFIC_ATTACHMENTS;
window.PRESET_BUILDS = PRESET_BUILDS;
window.BuilderState = BuilderState;
window.getGunMeta = getGunMeta;
window.getGunModel = getGunModel;
window.getGunBaseStats = getGunBaseStats;
window.getAttachmentsForSlot = getAttachmentsForSlot;
window.calculateFinalStats = calculateFinalStats;
window.scoreBuild = scoreBuild;
window.openGunsmithBuilder = openGunsmithBuilder;
window.renderBuilderBody = renderBuilderBody;
window.renderGunPicker = renderGunPicker;
window.renderLoadoutCanvas = renderLoadoutCanvas;
window.renderStatBars = renderStatBars;

// ============================================
// END OF CHUNK 14a/24
// ============================================
// ============================================
// CHUNK 14b/24 — Gunsmith Builder (Picker + Save + Share)
// ⚙️ UPDATE HERE: attachment picker, save logic, share text
// ============================================

// ============================================
// ATTACHMENT PICKER
// ============================================
function openAttachmentPicker(slotKey) {
  const slot = GUNSMITH_SLOTS.find(s => s.key === slotKey);
  if (!slot) return;

  const gun = BuilderState.selectedGun;
  const attachments = getAttachmentsForSlot(gun, slotKey);
  const current = BuilderState.selectedAttachments[slotKey];

  if (attachments.length === 0) {
    toast('No attachments for this slot', 'info');
    return;
  }

  openSheet(`
    <div class="space-y-2 max-h-[70vh] overflow-y-auto">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="${slot.icon}" class="w-5 h-5 text-primary"></i>
        <div class="text-xs text-gray-400 font-bold uppercase">${slot.label}</div>
      </div>

      ${current ? `
        <button class="pick-attach-remove w-full text-left px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 font-bold text-sm mb-2">
          ✕ Remove: ${esc(current.name)}
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
                ${effects.map(([stat, val]) => '<span class="text-[9px] px-1.5 py-0.5 rounded ' + (val > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400') + ' font-bold">' + stat + ' ' + (val > 0 ? '+' + val : val) + '</span>').join('')}
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
    };
  });

  const removeBtn = document.querySelector('.pick-attach-remove');
  if (removeBtn) {
    removeBtn.onclick = () => {
      delete BuilderState.selectedAttachments[slotKey];
      closeSheet();
      renderBuilderBody();
    };
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// APPLY PRESET
// ============================================
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
  toast(preset.name + ' applied', 'success');
}

// ============================================
// FREE USER GUN LIMIT (10 guns max)
// ============================================
const FREE_GUN_LIMIT = 10;

async function checkGunLimit() {
  if (isPro()) return true;
  try {
    const snap = await getDoc(doc(db, 'users', State.user.uid));
    if (!snap.exists()) return true;
    const data = snap.data();
    const usedGuns = data.savedGunPositions || [];
    return usedGuns.length < FREE_GUN_LIMIT;
  } catch (e) {
    return true;
  }
}

async function registerGunUse(gunName) {
  if (isPro()) return;
  try {
    const userRef = doc(db, 'users', State.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const usedGuns = data.savedGunPositions || [];
    if (!usedGuns.includes(gunName)) {
      usedGuns.push(gunName);
      await updateDoc(userRef, { savedGunPositions: usedGuns });
    }
  } catch (e) { /* silent */ }
}

// ============================================
// SAVE BUILD TO VAULT
// ============================================
async function saveBuildToVault() {
  const gun = BuilderState.selectedGun;
  const attachedCount = Object.keys(BuilderState.selectedAttachments).length;

  if (attachedCount === 0) {
    toast('Add at least one attachment', 'warning');
    return;
  }

  if (!isPro()) {
    try {
      const snap = await getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid)));
      if (snap.size >= PRO.limits.freeVaults) {
        showProPaywall('You\'ve reached the free limit of ' + PRO.limits.freeVaults + ' vaults. Upgrade to Pro for unlimited.');
        return;
      }
    } catch (e) {}
  }

  const code = generateGunsmithCode(gun, BuilderState.selectedAttachments);

  try {
    toast('Saving build...', 'info', 1500);

    const attachments = {};
    GUNSMITH_SLOTS.forEach(slot => {
      const picked = BuilderState.selectedAttachments[slot.key];
      if (picked) attachments[slot.label] = picked.name;
    });

    await addDoc(collection(db, 'vaults'), {
      uid: State.user.uid,
      ign: State.profile.ign,
      avatar: State.profile.avatar || '',
      isPro: isPro(),
      verified: !!State.profile.verified,
      gunName: gun,
      gunsmithCode: code,
      type: 'gunsmith',
      attachments,
      imageUrl: '',
      reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
      reactionCount: 0,
      commentCount: 0,
      builderVersion: 2,
      createdAt: serverTimestamp()
    });

    toast('Build saved to Vault!', 'success', 2500);

    openSheet(`
      <div class="text-center space-y-4 py-4">
        <div style="font-size: 56px;">🎉</div>
        <div>
          <div class="text-lg font-black mb-1">Build Saved!</div>
          <div class="text-xs text-gray-400">Your ${esc(gun)} build is in the Vault</div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <button id="goto-vault-btn" class="btn-press py-3 rounded-xl bg-primary font-bold text-xs text-white">View Vault</button>
          <button id="share-build-now" class="btn-press py-3 rounded-xl bg-cardAlt border border-border font-bold text-xs">Share</button>
        </div>
        <button id="continue-building" class="text-xs text-gray-500">Continue building</button>
      </div>
    `, '');

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
  } catch (e) {
    console.error(e);
    toast('Save failed: ' + e.message, 'error');
  }
}

// ============================================
// GENERATE GUNSMITH CODE
// ============================================
function generateGunsmithCode(gun, attachments) {
  const slug = gun.replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
  const slotCodes = GUNSMITH_SLOTS.map(s => {
    const a = attachments[s.key];
    if (!a) return '0';
    const hash = a.name.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    return Math.abs(hash % 9999).toString().padStart(4, '0');
  }).join('');
  return slug + '-' + slotCodes;
}

// ============================================
// SHARE BUILD
// ============================================
function shareBuild() {
  const gun = BuilderState.selectedGun;
  const { final } = calculateFinalStats(gun, BuilderState.selectedAttachments);

  const attachmentList = GUNSMITH_SLOTS
    .map(s => BuilderState.selectedAttachments[s.key])
    .filter(Boolean)
    .map(a => '• ' + a.name)
    .join('\n');

  const text = '🔧 ' + gun + ' Build\n\n' + (attachmentList || '(No attachments)') + '\n\nAccuracy: ' + final.accuracy + ' | Damage: ' + final.damage + ' | Range: ' + final.range + ' | Mobility: ' + final.mobility + '\n\nBuilt with CODMPanda';

  openShareSheet({
    title: gun + ' Build',
    text,
    url: location.origin
  });
}

// ============================================
// EXPORT 14b
// ============================================
window.openAttachmentPicker = openAttachmentPicker;
window.applyPreset = applyPreset;
window.saveBuildToVault = saveBuildToVault;
window.shareBuild = shareBuild;
window.generateGunsmithCode = generateGunsmithCode;
window.checkGunLimit = checkGunLimit;
window.registerGunUse = registerGunUse;
window.FREE_GUN_LIMIT = FREE_GUN_LIMIT;

// ============================================
// END OF CHUNK 14b/24
// ============================================
// ============================================
// CHUNK 15/24 — Camo Tracker
// ⚙️ UPDATE HERE: camo grid layout, export card design
// ============================================

let camoCategoryFilter = 'all';
let expandedGun = null;

// ============================================
// CAMO SUB-TAB RENDERER
// ============================================
function renderCamoSub() {
  const body = document.getElementById('lab-body');
  if (!body) return;

  const categories = ['all', ...Object.keys(CODM_GUNS)];

  body.innerHTML = `
    <!-- Progress card -->
    <div class="bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-4">
      <div class="relative" style="width: 80px; height: 80px; flex-shrink: 0;">
        <svg style="width: 80px; height: 80px;" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" stroke="#222" stroke-width="8" fill="none" />
          <circle id="camo-ring" cx="50" cy="50" r="42" stroke="url(#camoGradient)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="264" style="transition: stroke-dashoffset 0.6s ease;" />
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
        <div class="flex gap-3 mt-2">
          <button id="export-camo-btn" class="btn-press text-[11px] font-bold text-primary flex items-center gap-1">
            <i data-lucide="download" class="w-3 h-3"></i> Export
          </button>
          <button id="skins-btn" class="btn-press text-[11px] font-bold text-gold flex items-center gap-1">
            <span>🎨</span> Skins
          </button>
        </div>
      </div>
    </div>

    <!-- Category chips -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      ${categories.map(c => `<button class="chip camo-cat ${camoCategoryFilter === c ? 'active' : ''}" data-cat="${esc(c)}">${c === 'all' ? 'All' : esc(c)}</button>`).join('')}
    </div>

    <!-- Camo list -->
    <div id="camo-list" class="space-y-2">
      <div class="text-center py-6"><div class="spinner mx-auto"></div></div>
    </div>
  `;

  document.querySelectorAll('.camo-cat').forEach(btn => {
    btn.onclick = () => {
      camoCategoryFilter = btn.dataset.cat;
      renderCamoSub();
    };
  });

  document.getElementById('export-camo-btn').onclick = exportCamoProgress;
  document.getElementById('skins-btn').onclick = () => {
    if (typeof renderSkinsPanel === 'function') renderSkinsPanel();
    else toast('Skins loading...', 'info', 1000);
  };

  loadCamos();
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// LOAD CAMOS (real-time listener)
// ============================================
function loadCamos() {
  if (State.unsubs.camos) {
    try { State.unsubs.camos(); } catch (e) {}
    State.unsubs.camos = null;
  }

  State.unsubs.camos = onSnapshot(doc(db, 'camos', State.user.uid), (snap) => {
    State.cache.camos = snap.exists() ? snap.data() : {};
    renderCamoList();
  }, (err) => {
    console.error('Camos error:', err);
    State.cache.camos = {};
    renderCamoList();
  });
}

// ============================================
// RENDER CAMO LIST
// ============================================
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
  const pro = isPro();
  const freeLimit = PRO.limits.freeCamoGuns;

  const ring = document.getElementById('camo-ring');
  const pctEl = document.getElementById('camo-pct');
  const countsEl = document.getElementById('camo-counts');

  if (ring) {
    const dash = 264 - (264 * pct / 100);
    setTimeout(() => { ring.style.strokeDashoffset = dash; }, 100);
  }
  if (pctEl) pctEl.textContent = pct + '%';
  if (countsEl) {
    const goldCount = gunsToShow.filter(({ gun }) => camoData[gun]?.gold).length;
    countsEl.innerHTML = totalChecked + '/' + totalPossible + ' camos · ' + goldCount + ' gold';
  }

  list.innerHTML = gunsToShow.map(({ gun }, idx) => {
    const g = camoData[gun] || {};
    const checkedCount = CAMO_TYPES.filter(c => g[c.key]).length;
    const gunPct = Math.round((checkedCount / CAMO_TYPES.length) * 100);
    const isExpanded = expandedGun === gun;
    const isBlurred = !pro && idx >= freeLimit;

    return `
      <div class="bg-card border border-border rounded-xl overflow-hidden ${isBlurred ? 'relative' : ''}">
        <button class="gun-row w-full p-3 flex items-center gap-3 text-left ${isBlurred ? 'pointer-events-none' : ''}" data-gun="${esc(gun)}">
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

        ${isExpanded && !isBlurred ? `
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

        ${isBlurred ? `
          <div class="absolute inset-0 backdrop-blur-md bg-black/60 flex flex-col items-center justify-center text-center p-3">
            <div style="font-size: 22px; margin-bottom: 6px;">👑</div>
            <div class="text-xs font-bold text-gold mb-1">Pro Required</div>
            <div class="text-[10px] text-gray-400 mb-2">Free tier shows first ${freeLimit} guns</div>
            <button class="unlock-camo-btn btn-press px-4 py-2 rounded-lg bg-gradient-to-r from-gold to-yellow-500 text-black text-[10px] font-black" data-gun="${esc(gun)}">
              Unlock All Guns
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Wire expand
  list.querySelectorAll('.gun-row').forEach(btn => {
    btn.onclick = () => {
      expandedGun = expandedGun === btn.dataset.gun ? null : btn.dataset.gun;
      renderCamoList();
    };
  });

  // Wire checkboxes
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

  // Wire proof upload
  list.querySelectorAll('.proof-upload').forEach(btn => {
    btn.onclick = () => uploadCamoProof(btn.dataset.gun);
  });

  // Wire unlock
  list.querySelectorAll('.unlock-camo-btn').forEach(btn => {
    btn.onclick = () => {
      if (typeof showProPaywall === 'function') {
        showProPaywall('Track all ' + ALL_GUNS.length + ' guns with Pro.');
      }
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// UPLOAD CAMO PROOF
// ============================================
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

// ============================================
// EXPORT CAMO PROGRESS (share card)
// ============================================
async function exportCamoProgress() {
  const camoData = State.cache.camos || {};
  const p = State.profile || {};

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;

  // Base
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  // Hero background — try to load hero-panda.jpg at low opacity
  try {
    const heroImg = await loadImage('/hero-panda.jpg');
    ctx.save();
    ctx.globalAlpha = 0.15;
    const heroH = H * 0.7;
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
    grad.addColorStop(0, 'rgba(5, 5, 5, 0.6)');
    grad.addColorStop(1, 'rgba(5, 5, 5, 0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - heroH, W, heroH);
  } catch (e) { /* silent */ }

  // Top glow
  const grad1 = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 900);
  grad1.addColorStop(0, 'rgba(255, 107, 0, 0.35)');
  grad1.addColorStop(1, 'rgba(255, 107, 0, 0)');
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, W, 900);

  // Border
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // Header
  ctx.textAlign = 'center';
  ctx.font = 'bold 52px Inter, sans-serif';
  ctx.fillStyle = '#FF6B00';
  ctx.fillText('CODMPanda', W / 2, 120);

  ctx.font = '500 24px Inter, sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('CAMO PROGRESS', W / 2, 165);

  // Avatar
  const avatarY = 320;
  const avatarR = 90;
  ctx.fillStyle = '#FF6B00';
  ctx.beginPath();
  ctx.arc(W / 2, avatarY, avatarR + 8, 0, Math.PI * 2);
  ctx.fill();

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

  // Name
  ctx.font = 'bold 56px Inter, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(truncateText(ctx, p.ign || 'Panda Player', W - 100), W / 2, 500);

  ctx.font = '500 26px Inter, sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText((p.rank || 'Rookie') + ' · ' + (p.region || 'Global'), W / 2, 545);

  // Stats
  let totalChecked = 0;
  let totalPossible = ALL_GUNS.length * CAMO_TYPES.length;
  Object.values(camoData).forEach(gun => {
    if (typeof gun !== 'object') return;
    CAMO_TYPES.forEach(c => { if (gun[c.key]) totalChecked++; });
  });
  const pct = Math.round((totalChecked / totalPossible) * 100);
  const goldCount = Object.values(camoData).filter(g => g && g.gold).length;
  const damascusCount = Object.values(camoData).filter(g => g && g.damascus).length;

  // Progress box
  const boxY = 620;
  ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
  roundRect(ctx, 80, boxY, W - 160, 220, 24);
  ctx.fill();
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 96px Inter, sans-serif';
  ctx.fillStyle = '#FFD700';
  ctx.fillText(pct + '%', W / 2, boxY + 130);

  ctx.font = '600 22px Inter, sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText(totalChecked + ' / ' + totalPossible + ' CAMOS', W / 2, boxY + 180);

  // Milestone boxes
  const statY = 900;
  const boxW = 280;
  const boxH = 140;
  const gap = 30;
  const totalW = boxW * 3 + gap * 2;
  const startX = (W - totalW) / 2;

  const stats = [
    { emoji: '🥇', value: goldCount, label: 'GOLD' },
    { emoji: '💎', value: Object.values(camoData).filter(g => g && g.platinum).length, label: 'PLATINUM' },
    { emoji: '🔥', value: damascusCount, label: 'DAMASCUS' }
  ];

  stats.forEach((stat, i) => {
    const x = startX + (boxW + gap) * i;
    ctx.fillStyle = 'rgba(20, 20, 20, 0.9)';
    roundRect(ctx, x, statY, boxW, boxH, 20);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 44px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(stat.emoji, x + boxW / 2, statY + 60);

    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillStyle = '#FF6B00';
    ctx.fillText(String(stat.value), x + boxW / 2, statY + 105);

    ctx.font = '600 16px Inter, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(stat.label, x + boxW / 2, statY + 130);
  });

  // Top gold guns
  const goldGuns = Object.entries(camoData).filter(([_, g]) => g && g.gold).slice(0, 6);
  if (goldGuns.length > 0) {
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('GOLD GUNS', W / 2, 1150);

    let y = 1200;
    ctx.font = '500 26px Inter, sans-serif';
    goldGuns.forEach(([gun]) => {
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'left';
      ctx.fillText('★', 200, y);
      ctx.fillStyle = '#fff';
      ctx.fillText(gun, 240, y);
      y += 42;
    });
    ctx.textAlign = 'center';
  }

  // Footer
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillStyle = '#FF6B00';
  ctx.fillText('codmpanda.pages.dev', W / 2, H - 90);

  ctx.font = '500 20px Inter, sans-serif';
  ctx.fillStyle = '#444';
  ctx.fillText('Join the ultimate CODM companion', W / 2, H - 50);

  // Share or download
  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'codmpanda-camos.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My CODMPanda Camo Progress',
          text: 'Check out my camo grind!'
        });
        return;
      } catch (e) { /* cancelled */ }
    }

    const url = URL.createObjectURL(blob);
    openSheet(`
      <div class="space-y-4">
        <img src="${url}" class="w-full rounded-2xl border border-border" />
        <a href="${url}" download="codmpanda-camos.png" class="btn-press block w-full py-3 rounded-xl bg-primary text-center text-white font-bold text-sm">
          Save Image
        </a>
        <button onclick="closeSheet()" class="text-xs text-gray-500 w-full">Close</button>
      </div>
    `, 'Your Progress');
  }, 'image/png');
}

// ============================================
// EXPORT
// ============================================
window.renderCamoSub = renderCamoSub;
window.loadCamos = loadCamos;
window.renderCamoList = renderCamoList;
window.exportCamoProgress = exportCamoProgress;

// ============================================
// END OF CHUNK 15/24
// ============================================
// ============================================
// CHUNK 16/24 — Notifications (Permission + FCM + Logging)
// ⚙️ UPDATE HERE: notification types, when to prompt
// ============================================

// VAPID key for web push (from your Firebase project)
const VAPID_KEY = "BB38qRzf4R5T_szvw7SvPklifWz_PhM1e4XQ8KKjqaIcauiUeJAZUKmJpWSbzusdny75mzckpAKXB78qSBWdU8A";

// ============================================
// NOTIFICATION STATE
// ============================================
let notifUnreadCount = 0;
let notifCountUnsub = null;

// ============================================
// ENABLE NOTIFICATIONS (Permission + FCM token)
// ============================================
async function enableNotifications() {
  try {
    // Check support
    if (!('Notification' in window)) {
      toast('Notifications not supported on this browser', 'error');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      toast('Service worker not supported', 'error');
      return;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast('Permission denied. Enable in browser settings.', 'warning', 4000);
      return;
    }

    toast('Registering device...', 'info', 2000);

    // Wait for Firebase compat SDK
    let attempts = 0;
    while ((!window.firebase || !window.firebase.messaging) && attempts < 30) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (!window.firebase || !window.firebase.messaging) {
      // Fallback: mark as enabled even without FCM
      await updateDoc(doc(db, 'users', State.user.uid), {
        notificationsEnabled: true,
        notificationsEnabledAt: serverTimestamp()
      });
      State.profile.notificationsEnabled = true;
      toast('Notifications enabled!', 'success');
      return;
    }

    const messaging = window.firebase.messaging();

    // Register messaging service worker
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Get FCM token
    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (!token) {
      toast('Failed to get device token', 'error');
      return;
    }

    console.log('FCM token:', token.slice(0, 20) + '...');

    // Save token to user doc
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
      State.profile.fcmTokens = currentTokens;
      State.profile.notificationsEnabled = true;
    }

    toast('Notifications enabled!', 'success', 3000);

    // Refresh You tab if visible
    if (State.currentTab === 'you') {
      setTimeout(() => renderYouTab(), 500);
    }
  } catch (e) {
    console.error('FCM error:', e);
    toast('Failed: ' + e.message, 'error', 5000);
  }
}

// ============================================
// DISABLE NOTIFICATIONS
// ============================================
async function disableNotifications() {
  try {
    if (window.firebase && window.firebase.messaging) {
      const messaging = window.firebase.messaging();
      const token = await messaging.getToken({ vapidKey: VAPID_KEY }).catch(() => null);
      if (token) await messaging.deleteToken(token).catch(() => {});
    }

    await updateDoc(doc(db, 'users', State.user.uid), {
      fcmTokens: [],
      notificationsEnabled: false
    });
    State.profile.fcmTokens = [];
    State.profile.notificationsEnabled = false;

    toast('Notifications disabled', 'success');
    if (State.currentTab === 'you') setTimeout(() => renderYouTab(), 500);
  } catch (e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// ============================================
// SEND PUSH (via Cloudflare worker)
// ============================================
async function sendNotificationToUser(uid, title, body, data) {
  // Always log to in-app notifications
  logInAppNotification(uid, (data && data.type) || 'default', title, body, data).catch(() => {});

  // Skip push for DM notifications (per your spec)
  if (data && data.type === 'dm') {
    // Still send push but no in-app
  }

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
    console.log('Push sent:', result);
    return true;
  } catch (e) {
    console.error('Push error:', e);
    return false;
  }
}

// ============================================
// BROADCAST (admin only)
// ============================================
async function broadcastNotification(title, body, data) {
  try {
    const snap = await getDocs(query(
      collection(db, 'users'),
      where('notificationsEnabled', '==', true),
      limit(500)
    ));

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

// ============================================
// LOG IN-APP NOTIFICATION (Firestore)
// ============================================
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

// ============================================
// UNREAD BADGE
// ============================================
async function updateNotifBadge() {
  if (!State.user) return;
  try {
    const snap = await getDocs(query(
      collection(db, 'notifications'),
      where('userId', '==', State.user.uid),
      where('read', '==', false),
      limit(20)
    ));
    notifUnreadCount = snap.size;

    const bellBtn = document.getElementById('btn-notifications');
    if (!bellBtn) return;

    const existing = bellBtn.querySelector('.notif-badge');
    if (existing) existing.remove();

    if (notifUnreadCount > 0) {
      const badge = document.createElement('div');
      badge.className = 'notif-badge absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-card';
      badge.textContent = notifUnreadCount > 9 ? '9+' : notifUnreadCount;
      bellBtn.style.position = 'relative';
      bellBtn.appendChild(badge);
    }
  } catch (e) { /* silent */ }
}

// Real-time listener for badge count
function startNotifCountListener() {
  if (!State.user) return;
  if (notifCountUnsub) {
    try { notifCountUnsub(); } catch (e) {}
    notifCountUnsub = null;
  }

  try {
    notifCountUnsub = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('userId', '==', State.user.uid),
        where('read', '==', false),
        limit(20)
      ),
      (snap) => {
        notifUnreadCount = snap.size;
        const bellBtn = document.getElementById('btn-notifications');
        if (!bellBtn) return;

        const existing = bellBtn.querySelector('.notif-badge');
        if (existing) existing.remove();

        if (notifUnreadCount > 0) {
          const badge = document.createElement('div');
          badge.className = 'notif-badge absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-card';
          badge.textContent = notifUnreadCount > 9 ? '9+' : notifUnreadCount;
          bellBtn.style.position = 'relative';
          bellBtn.appendChild(badge);
        }
      },
      () => {
        // Fallback: poll every 60s
        setInterval(updateNotifBadge, 60000);
      }
    );
  } catch (e) {
    setInterval(updateNotifBadge, 60000);
  }
}

// ============================================
// PROMPT USER (first time after signup)
// ============================================
async function promptNotificationPermission() {
  if (!State.profile) return;
  if (State.profile.notificationsEnabled) return;
  if (Notification.permission === 'denied') return;

  // Wait a moment so app finishes rendering
  await new Promise(r => setTimeout(r, 2000));

  // Only prompt if never asked
  const askedKey = 'codmpanda_notif_prompted';
  if (localStorage.getItem(askedKey)) return;

  openSheet(`
    <div class="text-center space-y-4 py-4">
      <div style="font-size: 52px;">🔔</div>
      <div>
        <div class="text-lg font-black mb-1">Stay in the loop</div>
        <div class="text-xs text-gray-400 max-w-[260px] mx-auto">
          Get notified when someone joins your lobby, replies to your post, or when new leaks drop.
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-3 bg-card border border-border rounded-xl p-3 text-left">
          <div class="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span style="font-size: 14px;">🎮</span>
          </div>
          <div class="flex-1">
            <div class="text-xs font-bold">Lobby activity</div>
            <div class="text-[10px] text-gray-500">Know when someone joins</div>
          </div>
        </div>
        <div class="flex items-center gap-3 bg-card border border-border rounded-xl p-3 text-left">
          <div class="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span style="font-size: 14px;">💬</span>
          </div>
          <div class="flex-1">
            <div class="text-xs font-bold">Replies & mentions</div>
            <div class="text-[10px] text-gray-500">Never miss a conversation</div>
          </div>
        </div>
        <div class="flex items-center gap-3 bg-card border border-border rounded-xl p-3 text-left">
          <div class="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span style="font-size: 14px;">🔥</span>
          </div>
          <div class="flex-1">
            <div class="text-xs font-bold">Leaks & drops</div>
            <div class="text-[10px] text-gray-500">Be first to know</div>
          </div>
        </div>
      </div>

      <button id="enable-notif-btn" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary text-white">
        Enable Notifications
      </button>

      <button id="skip-notif-btn" class="text-xs text-gray-500 w-full">Maybe later</button>
    </div>
  `, '');

  document.getElementById('enable-notif-btn').onclick = async () => {
    localStorage.setItem(askedKey, '1');
    closeSheet();
    await enableNotifications();
  };

  document.getElementById('skip-notif-btn').onclick = () => {
    localStorage.setItem(askedKey, '1');
    closeSheet();
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// RENDER NOTIFICATIONS CARD (for You tab)
// ============================================
function renderNotificationsCard() {
  const enabled = State.profile && State.profile.notificationsEnabled;
  return `
    <div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div class="px-4 py-3 border-b border-border">
        <div class="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
          <i data-lucide="bell" class="w-4 h-4"></i> Push Notifications
        </div>
      </div>
      <div class="p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0 mr-3">
            <div class="text-sm font-semibold">${enabled ? 'Enabled' : 'Disabled'}</div>
            <div class="text-[10px] text-gray-500 mt-0.5">LFG alerts, replies, leaks, and more</div>
          </div>
          <div class="toggle ${enabled ? 'on' : ''}" id="notif-toggle"></div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// HOOK INTO MAIN APP (prompt after signup)
// ============================================
const _origShowMainApp16 = showMainApp;
showMainApp = function() {
  _origShowMainApp16();

  // Start notif count listener
  setTimeout(() => {
    if (State.user) startNotifCountListener();
  }, 3000);

  // Prompt for permission after delay
  setTimeout(() => {
    if (State.user && State.profile && !State.profile.notificationsEnabled) {
      promptNotificationPermission();
    }
  }, 8000);
};

// ============================================
// EXPORT
// ============================================
window.enableNotifications = enableNotifications;
window.disableNotifications = disableNotifications;
window.sendNotificationToUser = sendNotificationToUser;
window.broadcastNotification = broadcastNotification;
window.logInAppNotification = logInAppNotification;
window.updateNotifBadge = updateNotifBadge;
window.startNotifCountListener = startNotifCountListener;
window.promptNotificationPermission = promptNotificationPermission;
window.renderNotificationsCard = renderNotificationsCard;

// ============================================
// END OF CHUNK 16/24
// ============================================
// ============================================
// CHUNK 17/24 — Squad Tab (Clans + Scrims)
// ⚙️ UPDATE HERE: clan card layout, scrim board design
// ============================================

let squadSubTab = 'clans';

// ============================================
// SQUAD TAB RENDERER
// ============================================
function renderSquadTab() {
  const content = document.getElementById('content');
  if (!content) return;

  const subtabs = [
    { key: 'clans', label: 'Clans' },
    { key: 'scrims', label: 'Scrims' },
    { key: 'clips', label: 'Clips' },
    { key: 'top', label: 'Top' },
    { key: 'wars', label: 'Wars' },
    { key: 'tournaments', label: 'Events' }
  ];

  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <div class="mb-4">
        <h1 class="text-2xl font-black">Squad</h1>
        <p class="text-xs text-gray-500">Clans, scrims, clips, tournaments</p>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        ${subtabs.map(s => `
          <button class="squad-sub py-2.5 rounded-xl font-bold text-xs ${squadSubTab === s.key ? 'bg-primary text-white' : 'bg-card border border-border text-gray-400'}" data-sub="${s.key}">${s.label}</button>
        `).join('')}
      </div>

      <div id="squad-body"></div>
    </div>
  `;

  document.querySelectorAll('.squad-sub').forEach(btn => {
    btn.onclick = () => { squadSubTab = btn.dataset.sub; renderSquadTab(); };
  });

  const renderers = {
    clans: renderClansSub,
    scrims: renderScrimsSub,
    clips: typeof renderClipsSub === 'function' ? renderClipsSub : null,
    top: typeof renderLeaderboardSub === 'function' ? renderLeaderboardSub : null,
    wars: typeof renderClanWarsSub === 'function' ? renderClanWarsSub : null,
    tournaments: typeof renderTournamentsSub === 'function' ? renderTournamentsSub : null
  };

  const renderer = renderers[squadSubTab];
  if (renderer) {
    renderer();
  } else {
    document.getElementById('squad-body').innerHTML = '<div class="text-center py-8 text-gray-500 text-xs">Loading...</div>';
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// CLANS SUB-TAB
// ============================================
function renderClansSub() {
  const body = document.getElementById('squad-body');
  if (!body) return;

  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Find your tribe</div>
      <button id="create-clan-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1 text-white">
        <i data-lucide="plus" class="w-3 h-3"></i> Create
      </button>
    </div>
    <div id="clans-feed" class="space-y-3">
      ${skeletonCard().repeat(2)}
    </div>
  `;

  document.getElementById('create-clan-btn').onclick = openCreateClanSheet;
  loadClans();
}

// ============================================
// LOAD CLANS (real-time)
// ============================================
function loadClans() {
  if (State.unsubs.clans) {
    try { State.unsubs.clans(); } catch (e) {}
    State.unsubs.clans = null;
  }

  const q = query(collection(db, 'clans'), orderBy('createdAt', 'desc'), limit(60));

  State.unsubs.clans = onSnapshot(q, (snap) => {
    const clans = [];
    snap.forEach(d => clans.push({ id: d.id, ...d.data() }));
    State.cache.clans = clans;
    renderClans();
  }, (err) => {
    console.error('Clans error:', err);
    const feed = document.getElementById('clans-feed');
    if (feed) feed.innerHTML = emptyState('shield', 'No clans yet', 'Be the first to create one', 'Create Clan', openCreateClanSheet);
    if (window.lucide) window.lucide.createIcons();
  });
}

// ============================================
// RENDER CLANS
// ============================================
function renderClans() {
  const feed = document.getElementById('clans-feed');
  if (!feed) return;

  if (State.cache.clans.length === 0) {
    feed.innerHTML = emptyState('shield', 'No clans yet', 'Create your own clan and recruit members', 'Create Clan', openCreateClanSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = State.cache.clans.map(c => renderClanCard(c)).join('');
  wireClanCards();
  if (window.lucide) window.lucide.createIcons();
}

function renderClanCard(c) {
  const members = c.members || [];
  const memberCount = members.length;
  const isMember = members.includes(State.user.uid);
  const isOwner = c.ownerUid === State.user.uid;
  const isFull = memberCount >= 50;

  return `
    <div class="clan-card bg-card border border-border rounded-2xl p-4 fade-in" data-id="${c.id}">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-gold/30 flex items-center justify-center font-black text-xl flex-shrink-0 overflow-hidden">
          ${c.logoUrl ? '<img src="' + esc(c.logoUrl) + '" class="w-full h-full rounded-2xl object-cover" />' : esc((c.name || '?')[0])}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-sm truncate">${esc(c.name)}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-bold">Lv ${c.level || 1}</span>
          </div>
          <div class="text-[11px] text-gray-500 mt-0.5">
            ${memberCount}/50 members · ${esc(c.region || 'Global')} · KD ${c.kdReq || 'Any'}+
          </div>
          ${c.description ? '<div class="text-[10px] text-gray-500 mt-1 line-clamp-2">' + esc(c.description) + '</div>' : ''}
        </div>
      </div>

      ${(c.tags && c.tags.length) ? `
        <div class="flex flex-wrap gap-1.5 mb-3">
          ${c.tags.map(t => '<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold text-gray-300">' + esc(t) + '</span>').join('')}
        </div>
      ` : ''}

      <div class="flex gap-2">
        ${isOwner ? `
          <button class="clan-owner-badge flex-1 py-2.5 rounded-xl bg-gold/15 border border-gold/30 text-gold text-xs font-bold">
            👑 You own this
          </button>
        ` : isMember ? `
          <button class="clan-leave-btn flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold" data-id="${c.id}">
            Leave Clan
          </button>
        ` : isFull ? `
          <div class="flex-1 py-2.5 rounded-xl bg-gray-500/10 text-center text-xs font-bold text-gray-500">
            Clan Full
          </div>
        ` : `
          <button class="clan-join-btn flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold" data-id="${c.id}" data-name="${esc(c.name)}">
            Join Clan
          </button>
        `}
      </div>
    </div>
  `;
}

function wireClanCards() {
  const feed = document.getElementById('clans-feed');
  if (!feed) return;

  feed.querySelectorAll('.clan-join-btn').forEach(btn => {
    btn.onclick = async () => {
      const clanId = btn.dataset.id;
      const clanName = btn.dataset.name;
      try {
        await updateDoc(doc(db, 'clans', clanId), {
          members: arrayUnion(State.user.uid)
        });
        toast('Joined ' + clanName + '!', 'success');
      } catch (e) {
        toast('Failed: ' + e.message, 'error');
      }
    };
  });

  feed.querySelectorAll('.clan-leave-btn').forEach(btn => {
    btn.onclick = () => {
      confirmDialog('Leave Clan', 'Are you sure you want to leave?', async () => {
        try {
          await updateDoc(doc(db, 'clans', btn.dataset.id), {
            members: arrayRemove(State.user.uid)
          });
          toast('Left clan', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Leave', true);
    };
  });
}

// ============================================
// CREATE CLAN SHEET
// ============================================
function openCreateClanSheet() {
  if (!isPro()) {
    if (typeof showProPaywall === 'function') {
      showProPaywall('Creating clans is a Pro feature. Upgrade to lead your squad!');
    }
    return;
  }

  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Clan Name *</label>
        <input id="cc-name" type="text" placeholder="e.g. Shadow Pandas" maxlength="30" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Description</label>
        <textarea id="cc-desc" rows="2" maxlength="150" placeholder="What's your clan about?"></textarea>
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
        <select id="cc-region" data-dropdown-title="Region">
          ${REGIONS.map(r => '<option ' + (State.profile?.region === r ? 'selected' : '') + '>' + r + '</option>').join('')}
        </select>
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Tags (comma separated)</label>
        <input id="cc-tags" type="text" placeholder="e.g. Competitive, BR Mains, Active" maxlength="80" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Clan Logo (optional)</label>
        <input id="cc-logo" type="file" accept="image/*" class="text-xs" />
      </div>

      <button id="cc-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">
        Create Clan
      </button>
    </div>
  `, 'Create Clan');

  document.getElementById('cc-submit').onclick = async () => {
    const name = document.getElementById('cc-name').value.trim();
    const description = document.getElementById('cc-desc').value.trim();
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
        name, description, level,
        kdReq: kdReq ? parseFloat(kdReq) : 0,
        region, tags, logoUrl,
        ownerUid: State.user.uid,
        ownerIgn: State.profile.ign,
        members: [State.user.uid],
        createdAt: serverTimestamp()
      });

      toast('Clan created!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Create Clan';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// SCRIMS SUB-TAB
// ============================================
function renderScrimsSub() {
  const body = document.getElementById('squad-body');
  if (!body) return;

  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Match up · expires in 12h</div>
      <button id="post-scrim-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1 text-white">
        <i data-lucide="plus" class="w-3 h-3"></i> Post
      </button>
    </div>
    <div id="scrims-feed" class="space-y-3">
      ${skeletonCard().repeat(2)}
    </div>
  `;

  document.getElementById('post-scrim-btn').onclick = openPostScrimSheet;
  loadScrims();
}

// ============================================
// LOAD SCRIMS (real-time)
// ============================================
function loadScrims() {
  if (State.unsubs.scrims) {
    try { State.unsubs.scrims(); } catch (e) {}
    State.unsubs.scrims = null;
  }

  const q = query(collection(db, 'scrims'), orderBy('createdAt', 'desc'), limit(40));
  const now = Date.now();

  State.unsubs.scrims = onSnapshot(q, (snap) => {
    const scrims = [];
    snap.forEach(d => {
      const data = d.data();
      const expiresAt = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : Infinity);
      if (expiresAt > now) scrims.push({ id: d.id, ...data });
    });
    State.cache.scrims = scrims;
    renderScrims();
  }, (err) => console.error('Scrims error:', err));
}

// ============================================
// RENDER SCRIMS
// ============================================
function renderScrims() {
  const feed = document.getElementById('scrims-feed');
  if (!feed) return;

  if (State.cache.scrims.length === 0) {
    feed.innerHTML = emptyState('swords', 'No scrims posted', 'Looking for a match? Post one', 'Post Scrim', openPostScrimSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = State.cache.scrims.map(s => {
    const isMine = s.uid === State.user.uid;
    return `
      <div class="bg-card border border-border rounded-2xl p-4 fade-in" data-id="${s.id}">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-bold">${esc(s.mode || 'MP')}</span>
          <span class="text-[10px] text-gray-500">${timeAgo(s.createdAt)}</span>
        </div>
        <div class="flex items-start gap-3 mb-2">
          ${renderAvatar(s, 32)}
          <div class="flex-1 min-w-0">
            ${renderUsername(s, 'text-xs font-bold')}
          </div>
        </div>
        <p class="text-sm text-gray-200 mb-3 whitespace-pre-wrap">${esc(s.text)}</p>
        <div class="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <span class="text-[11px] text-gray-500 truncate flex-1">📞 ${esc(s.contact || 'DM')}</span>
          <button class="scrim-copy-btn text-[11px] text-primary font-bold" data-text="${esc(s.contact)}">Copy</button>
          ${isMine ? `
            <button class="scrim-delete-btn w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center" data-id="${s.id}">
              <i data-lucide="trash-2" class="w-3.5 h-3.5 text-red-400"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  feed.querySelectorAll('.scrim-copy-btn').forEach(btn => {
    btn.onclick = () => copyText(btn.dataset.text, 'Contact copied!');
  });
  feed.querySelectorAll('.scrim-delete-btn').forEach(btn => {
    btn.onclick = () => {
      confirmDialog('Delete Scrim', 'Remove this scrim post?', async () => {
        try {
          await deleteDoc(doc(db, 'scrims', btn.dataset.id));
          toast('Deleted', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// POST SCRIM SHEET
// ============================================
function openPostScrimSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Mode</label>
        <select id="ps-mode" data-dropdown-title="Mode">
          ${MODES.map(m => '<option>' + m + '</option>').join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">What are you looking for? *</label>
        <textarea id="ps-text" rows="4" maxlength="500" placeholder="e.g. 5v5 SnD scrim tonight at 9pm WAT."></textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Contact (Discord/TG/IGN)</label>
        <input id="ps-contact" type="text" placeholder="e.g. @panda#1234" maxlength="60" />
      </div>
      <button id="ps-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">
        Post Scrim
      </button>
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
      const expiresAt = Timestamp.fromMillis(Date.now() + 12 * 60 * 60 * 1000);
      await addDoc(collection(db, 'scrims'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        text, mode, contact,
        createdAt: serverTimestamp(),
        expiresAt
      });
      toast('Scrim posted!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Post Scrim';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// EXPORT
// ============================================
window.renderSquadTab = renderSquadTab;
window.renderClansSub = renderClansSub;
window.renderScrimsSub = renderScrimsSub;
window.openCreateClanSheet = openCreateClanSheet;
window.openPostScrimSheet = openPostScrimSheet;

// ============================================
// END OF CHUNK 17/24
// ============================================
// ============================================
// CHUNK 18/24 — Squad: Clips + Tournaments
// ⚙️ UPDATE HERE: clip layout, tournament bracket design
// ============================================

// ============================================
// CLIPS SUB-TAB
// ============================================
function renderClipsSub() {
  const body = document.getElementById('squad-body');
  if (!body) return;

  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Best plays from the community</div>
      <button id="add-clip-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1 text-white">
        <i data-lucide="plus" class="w-3 h-3"></i> Share
      </button>
    </div>
    <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
      <button class="chip clip-sort ${State.filters.clips.sort === 'recent' ? 'active' : ''}" data-sort="recent">Recent</button>
      <button class="chip clip-sort ${State.filters.clips.sort === 'trending' ? 'active' : ''}" data-sort="trending">Trending</button>
    </div>
    <div id="clips-feed" class="space-y-3">
      ${skeletonCard().repeat(2)}
    </div>
  `;

  document.getElementById('add-clip-btn').onclick = openAddClipSheet;

  document.querySelectorAll('.clip-sort').forEach(btn => {
    btn.onclick = () => {
      State.filters.clips.sort = btn.dataset.sort;
      document.querySelectorAll('.clip-sort').forEach(b => b.classList.toggle('active', b === btn));
      renderClips();
    };
  });

  loadClips();
}

// ============================================
// LOAD CLIPS (real-time)
// ============================================
function loadClips() {
  if (State.unsubs.clips) {
    try { State.unsubs.clips(); } catch (e) {}
    State.unsubs.clips = null;
  }

  const q = query(collection(db, 'clips'), limit(50));

  State.unsubs.clips = onSnapshot(q, (snap) => {
    const clips = [];
    snap.forEach(d => clips.push({ id: d.id, ...d.data() }));
    State.cache.clips = clips;
    renderClips();
  }, (err) => console.error('Clips error:', err));
}

// ============================================
// RENDER CLIPS
// ============================================
function renderClips() {
  const feed = document.getElementById('clips-feed');
  if (!feed) return;

  let clips = [...State.cache.clips];
  if (State.filters.clips.sort === 'trending') {
    clips.sort((a, b) => (b.reactionCount || 0) - (a.reactionCount || 0));
  } else {
    clips.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }

  if (clips.length === 0) {
    feed.innerHTML = emptyState('video', 'No clips yet', 'Share your best play', 'Share Clip', openAddClipSheet);
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feed.innerHTML = clips.map(c => renderClipCard(c)).join('');
  wireClipCards();
  if (window.lucide) window.lucide.createIcons();
}

function renderClipCard(c) {
  const embedUrl = getYouTubeEmbed(c.youtubeUrl);
  const authorName = c.ign || 'CODMPanda';

  return `
    <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in" data-id="${c.id}">
      <div class="p-3 pb-2">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary font-black">🎬 CLIP</span>
          <span class="text-[10px] text-gray-500 ml-auto">${timeAgo(c.createdAt)}</span>
        </div>
        <div class="flex items-center gap-2">
          ${renderAvatar(c, 32)}
          <div class="text-xs text-gray-400 flex items-center gap-1.5">
            by ${renderUsername(c, 'text-white font-bold')} · ${esc(c.gunTag || 'CODM')}
            ${renderBadges(c)}
          </div>
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
        <div class="flex items-center gap-3">
          ${renderReactionButton('clip', c.id, c.reactions, c.myReaction)}
          ${renderCommentButton('clip', c.id, c.commentCount || 0)}
        </div>
        <button class="clip-share-btn btn-press text-primary" data-id="${c.id}">
          <i data-lucide="share-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `;
}

function wireClipCards() {
  const feed = document.getElementById('clips-feed');
  if (!feed) return;

  feed.querySelectorAll('.clip-share-btn').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: 'CODMPanda Clip',
        text: 'Watch this play on CODMPanda!',
        url: location.origin + '/?clip=' + btn.dataset.id
      });
    };
  });
}

// ============================================
// YOUTUBE EMBED HELPER
// ============================================
function getYouTubeEmbed(url) {
  if (!url) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return 'https://www.youtube.com/embed/' + m[1];
  }
  return '';
}

// ============================================
// ADD CLIP SHEET
// ============================================
function openAddClipSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">YouTube / TikTok URL *</label>
        <input id="ac-url" type="url" placeholder="https://youtube.com/watch?v=..." />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Gun Tag</label>
        <select id="ac-gun" data-dropdown-title="Gun">
          <option value="">Any</option>
          ${ALL_GUNS.slice(0, 60).map(g => '<option>' + g + '</option>').join('')}
        </select>
      </div>
      <button id="ac-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">
        Share Clip
      </button>
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
        avatar: State.profile.avatar || '',
        isPro: isPro(),
        verified: !!State.profile.verified,
        youtubeUrl: url,
        gunTag: gunTag || 'CODM',
        reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
        reactionCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });
      toast('Clip shared!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Share Clip';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// TOURNAMENTS SUB-TAB
// ============================================
let tournamentsSubTab = 'active';

const TOURNAMENT_SIZES = [4, 8, 16, 32];
const TOURNAMENT_MODES = ['MP 5v5', 'BR Squad', 'Scrim 5v5', 'Sniper 1v1', '1v1'];

function renderTournamentsSub() {
  const body = document.getElementById('squad-body');
  if (!body) return;

  body.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="text-xs text-gray-500" id="tour-count">Loading...</div>
      <button id="create-tournament-btn" class="btn-press px-3 py-2 rounded-xl bg-primary text-xs font-bold flex items-center gap-1 text-white">
        <i data-lucide="plus" class="w-3 h-3"></i> Create
      </button>
    </div>

    <div class="flex gap-2 mb-4">
      <button class="chip tour-tab ${tournamentsSubTab === 'active' ? 'active' : ''}" data-tab="active">Active</button>
      <button class="chip tour-tab ${tournamentsSubTab === 'completed' ? 'active' : ''}" data-tab="completed">History</button>
    </div>

    <div id="tournaments-list">
      ${skeletonCard().repeat(2)}
    </div>
  `;

  document.getElementById('create-tournament-btn').onclick = openCreateTournament;

  document.querySelectorAll('.tour-tab').forEach(btn => {
    btn.onclick = () => { tournamentsSubTab = btn.dataset.tab; renderTournamentsSub(); };
  });

  loadTournaments();
}

// ============================================
// LOAD TOURNAMENTS
// ============================================
async function loadTournaments() {
  try {
    const snap = await getDocs(query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'), limit(30)));
    const all = [];
    snap.forEach(d => all.push({ id: d.id, ...d.data() }));

    const active = all.filter(t => t.status === 'open' || t.status === 'in-progress');
    const completed = all.filter(t => t.status === 'completed');

    const list = tournamentsSubTab === 'active' ? active : completed;

    const countEl = document.getElementById('tour-count');
    if (countEl) countEl.textContent = list.length + ' ' + tournamentsSubTab;

    const container = document.getElementById('tournaments-list');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = emptyState('trophy', 'No ' + tournamentsSubTab + ' tournaments', 'Host your own event', 'Create Tournament', openCreateTournament);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = list.map(t => renderTournamentCard(t)).join('');

    container.querySelectorAll('.tournament-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('button')) return;
        openTournamentDetail(card.dataset.id);
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Tournaments error:', e);
    const container = document.getElementById('tournaments-list');
    if (container) container.innerHTML = '<div class="text-center py-8 text-red-400 text-xs">Failed to load</div>';
  }
}

function renderTournamentCard(t) {
  const statusColors = {
    'open': { bg: 'bg-green-500/15', text: 'text-green-400', label: 'OPEN' },
    'in-progress': { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'LIVE' },
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
        <div style="font-size: 24px;">🏆</div>
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

// ============================================
// CREATE TOURNAMENT
// ============================================
function openCreateTournament() {
  if (!isPro() && State.user?.uid !== ADMIN_UID) {
    if (typeof showProPaywall === 'function') {
      showProPaywall('Creating tournaments is a Pro feature. Upgrade to host your own!');
    }
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
        <select id="tc-mode" data-dropdown-title="Mode">
          ${TOURNAMENT_MODES.map(m => '<option>' + m + '</option>').join('')}
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Bracket Size *</label>
          <select id="tc-size" data-dropdown-title="Size">
            ${TOURNAMENT_SIZES.map(s => '<option value="' + s + '">' + s + ' teams</option>').join('')}
          </select>
        </div>
        <div>
          <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Region</label>
          <select id="tc-region" data-dropdown-title="Region">
            ${REGIONS.map(r => '<option ' + (r === State.profile?.region ? 'selected' : '') + '>' + r + '</option>').join('')}
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
        <div class="text-[10px] text-primary font-bold mb-1">Auto-managed</div>
        <div class="text-[10px] text-gray-400">Registration runs for 24 hours. Bracket auto-generates when full or time ends.</div>
      </div>

      <button id="tc-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-black glow-primary text-white">
        Create Tournament
      </button>
    </div>
  `, 'Create Tournament');

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
      const registrationEndsAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);

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

      toast('Tournament created!', 'success');
      closeSheet();
      setTimeout(renderTournamentsSub, 300);
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Create Tournament';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// TOURNAMENT DETAIL
// ============================================
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
          ${t.prize ? '<div class="bg-gold/10 border border-gold/30 rounded-lg px-3 py-2 mb-2"><div class="text-[10px] font-bold text-gold">🎁 ' + esc(t.prize) + '</div></div>' : ''}
          ${t.rules ? '<div class="text-[10px] text-gray-400 mt-2">' + esc(t.rules) + '</div>' : ''}
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="bg-card border border-border rounded-xl p-3 text-center">
            <div class="text-lg font-black text-primary">${teams.length}/${t.size}</div>
            <div class="text-[9px] text-gray-500 uppercase">Teams</div>
          </div>
          <div class="bg-card border border-border rounded-xl p-3 text-center">
            <div class="text-lg font-black ${t.status === 'open' ? 'text-green-400' : t.status === 'in-progress' ? 'text-orange-400' : 'text-gray-400'}">${t.status.toUpperCase()}</div>
            <div class="text-[9px] text-gray-500 uppercase">Status</div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-2xl p-3">
          <div class="text-xs font-bold text-gray-400 uppercase mb-2">Registered (${teams.length})</div>
          ${teams.length === 0 ? '<div class="text-center py-3 text-[10px] text-gray-600">No teams yet</div>' : `
            <div class="space-y-2">
              ${teams.map(tm => `
                <div class="flex items-center gap-2">
                  ${renderAvatar(tm, 28)}
                  <div class="flex-1 text-xs font-bold truncate">${esc(tm.ign)}</div>
                  ${tm.uid === t.creatorUid ? '<span class="text-[8px] px-1.5 py-0.5 rounded bg-gold text-black font-black">HOST</span>' : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="space-y-2">
          ${canRegister ? `
            <button id="reg-btn" class="btn-press w-full py-3 rounded-xl bg-primary font-black text-sm glow-primary text-white">
              Register Team
            </button>
          ` : ''}
          ${isRegistered && t.status === 'open' ? `
            <button id="unreg-btn" class="btn-press w-full py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm">
              Withdraw
            </button>
          ` : ''}
          ${canStart ? `
            <button id="start-tour-btn" class="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold">
              Start Tournament
            </button>
          ` : ''}
          ${t.status === 'in-progress' ? `
            <button id="view-bracket-btn" class="btn-press w-full py-3 rounded-xl bg-primary font-black text-sm text-white">
              View Bracket
            </button>
          ` : ''}
        </div>
      </div>
    `;

    const regBtn = document.getElementById('reg-btn');
    if (regBtn) {
      regBtn.onclick = async () => {
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
          toast('Registered!', 'success');
          closeSheet();
          setTimeout(() => openTournamentDetail(tournamentId), 400);
        } catch (e) { toast('Failed', 'error'); }
      };
    }

    const unregBtn = document.getElementById('unreg-btn');
    if (unregBtn) {
      unregBtn.onclick = () => {
        confirmDialog('Withdraw', 'Remove your team from this tournament?', async () => {
          try {
            const updated = teams.filter(tm => tm.uid !== State.user.uid);
            await updateDoc(doc(db, 'tournaments', tournamentId), { teams: updated });
            toast('Withdrawn', 'success');
            closeSheet();
          } catch (e) { toast('Failed', 'error'); }
        }, 'Withdraw', true);
      };
    }

    const startBtn = document.getElementById('start-tour-btn');
    if (startBtn) {
      startBtn.onclick = () => {
        confirmDialog('Start Tournament', 'Generate the bracket?', async () => {
          try {
            const shuffled = [...teams].sort(() => Math.random() - 0.5);
            const bracket = generateBracket(shuffled, t.size);
            await updateDoc(doc(db, 'tournaments', tournamentId), {
              teams: shuffled,
              bracket,
              currentRound: 1,
              status: 'in-progress',
              startedAt: serverTimestamp()
            });
            toast('Tournament started!', 'success');
            closeSheet();
          } catch (e) { toast('Failed', 'error'); }
        }, 'Start', false);
      };
    }

    const bracketBtn = document.getElementById('view-bracket-btn');
    if (bracketBtn) {
      bracketBtn.onclick = () => openBracketView(tournamentId);
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Tournament detail error:', e);
    toast('Failed to load', 'error');
  }
}

// ============================================
// GENERATE BRACKET
// ============================================
function generateBracket(teams, targetSize) {
  const padded = [...teams];
  while (padded.length < targetSize) {
    padded.push({ bye: true, uid: null, ign: 'BYE' });
  }

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

  // Auto-resolve byes
  round1.forEach((m, idx) => {
    if (m.team1.bye) { m.winner = m.team2; m.status = 'completed'; }
    else if (m.team2.bye) { m.winner = m.team1; m.status = 'completed'; }
  });

  const bracket = [...round1];

  let teamsRemaining = round1.length;
  let roundNum = 2;
  while (teamsRemaining > 1) {
    teamsRemaining = Math.floor(teamsRemaining / 2);
    for (let i = 0; i < teamsRemaining; i++) {
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

// ============================================
// BRACKET VIEW
// ============================================
async function openBracketView(tournamentId) {
  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', 'Bracket');

  try {
    const snap = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!snap.exists()) { toast('Not found', 'error'); return; }
    const t = { id: tournamentId, ...snap.data() };

    const rounds = groupBracketByRound(t.bracket || []);
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="space-y-4">
        <div class="bg-gradient-to-br from-primary/10 to-black border border-primary/30 rounded-2xl p-4">
          <div class="text-base font-black mb-1">${esc(t.name)}</div>
          <div class="text-[10px] text-gray-500">${esc(t.mode)} · ${esc(t.region)} · ${(t.teams || []).length} teams</div>
          ${t.status === 'completed' ? '<div class="mt-2 text-xs font-bold text-gold">🏆 Winner: ' + esc(t.winner?.ign || 'TBD') + '</div>' : ''}
        </div>

        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          ${rounds.map((r, i) => `
            <button class="chip round-tab ${i === rounds.length - 1 ? 'active' : ''}" data-round="${r.round}">Round ${r.round}</button>
          `).join('')}
        </div>

        <div id="round-matches"></div>
      </div>
    `;

    const defaultRound = rounds[rounds.length - 1]?.round || 1;
    renderRoundMatches(t, defaultRound, rounds);

    sheetBody.querySelectorAll('.round-tab').forEach(btn => {
      btn.onclick = () => {
        sheetBody.querySelectorAll('.round-tab').forEach(b => b.classList.toggle('active', b === btn));
        renderRoundMatches(t, parseInt(btn.dataset.round), rounds);
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

function renderRoundMatches(tournament, round, rounds) {
  const roundData = rounds.find(r => r.round === round);
  const container = document.getElementById('round-matches');
  if (!roundData || !container) return;

  container.innerHTML = roundData.matches.map((m, idx) => {
    const team1 = m.team1 || { ign: 'TBD' };
    const team2 = m.team2 || { ign: 'TBD' };
    const isCompleted = m.status === 'completed';

    return `
      <div class="bg-card border border-border rounded-2xl p-3 mb-2">
        <div class="text-[9px] text-gray-500 uppercase font-bold mb-2">Match ${idx + 1}</div>

        <div class="flex items-center justify-between py-1.5 ${m.winner?.uid === team1.uid ? 'bg-green-500/10 rounded-lg px-2' : ''}">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            ${renderAvatar(team1, 24)}
            <div class="text-xs font-bold truncate">${esc(team1.ign)}</div>
          </div>
          <div class="text-sm font-black ${m.score1 !== null && m.score1 !== undefined ? 'text-primary' : 'text-gray-600'}">
            ${m.score1 !== null && m.score1 !== undefined ? m.score1 : '—'}
          </div>
        </div>

        <div class="text-center text-[9px] text-gray-600 py-0.5">vs</div>

        <div class="flex items-center justify-between py-1.5 ${m.winner?.uid === team2.uid ? 'bg-green-500/10 rounded-lg px-2' : ''}">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            ${renderAvatar(team2, 24)}
            <div class="text-xs font-bold truncate">${esc(team2.ign)}</div>
          </div>
          <div class="text-sm font-black ${m.score2 !== null && m.score2 !== undefined ? 'text-primary' : 'text-gray-600'}">
            ${m.score2 !== null && m.score2 !== undefined ? m.score2 : '—'}
          </div>
        </div>

        ${isCompleted ? '<div class="mt-2 pt-2 border-t border-border text-center"><div class="text-[9px] text-green-400 font-bold">✓ COMPLETED</div></div>' : ''}
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// EXPORT
// ============================================
window.renderClipsSub = renderClipsSub;
window.loadClips = loadClips;
window.renderClips = renderClips;
window.openAddClipSheet = openAddClipSheet;
window.getYouTubeEmbed = getYouTubeEmbed;
window.renderTournamentsSub = renderTournamentsSub;
window.loadTournaments = loadTournaments;
window.openCreateTournament = openCreateTournament;
window.openTournamentDetail = openTournamentDetail;
window.openBracketView = openBracketView;
window.generateBracket = generateBracket;

// ============================================
// END OF CHUNK 18/24
// ============================================
// ============================================
// CHUNK 19/24 — Squad: Leaderboard + Clan Wars
// ⚙️ UPDATE HERE: leaderboard period, clan war points, reset day
// ============================================

// ============================================
// LEADERBOARD SUB-TAB
// ============================================
let leaderboardPeriod = 'allTime';

async function renderLeaderboardSub() {
  const body = document.getElementById('squad-body');
  if (!body) return;

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
      loadLeaderboard().then(renderLeaderboard);
    };
  });

  await loadLeaderboard();
  renderLeaderboard();
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// LOAD LEADERBOARD DATA
// ============================================
async function loadLeaderboard() {
  try {
    let users = [];

    // Try primary query (requires index on approvedCount)
    try {
      const snap = await getDocs(query(
        collection(db, 'users'),
        where('approvedCount', '>', 0),
        orderBy('approvedCount', 'desc'),
        limit(50)
      ));
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
          verified: data.verified || false,
          lastSubmit: data.lastSubmitAt?.seconds || 0
        });
      });
    } catch (indexErr) {
      // Fallback: fetch all and filter client-side
      console.warn('Leaderboard query failed, using fallback');
      const snap = await getDocs(query(collection(db, 'users'), limit(150)));
      snap.forEach(d => {
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
            verified: data.verified || false,
            lastSubmit: data.lastSubmitAt?.seconds || 0
          });
        }
      });
      users.sort((a, b) => b.approvedCount - a.approvedCount);
    }

    State.cache.leaderboard = {
      allTime: users.slice(0, 10),
      weekly: users.filter(u => u.lastSubmit > Date.now() / 1000 - 7 * 24 * 60 * 60).slice(0, 10)
    };
  } catch (e) {
    console.error('Leaderboard load error:', e);
    State.cache.leaderboard = { allTime: [], weekly: [] };
  }
}

// ============================================
// RENDER LEADERBOARD
// ============================================
function renderLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  const list = leaderboardPeriod === 'weekly'
    ? (State.cache.leaderboard?.weekly || [])
    : (State.cache.leaderboard?.allTime || []);

  if (list.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <div style="font-size: 56px; margin-bottom: 12px;">🏆</div>
        <div class="text-sm font-bold mb-1">No contributors yet</div>
        <div class="text-xs text-gray-500">Be the first to submit and get approved</div>
      </div>
    `;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];

  container.innerHTML = list.map((u, i) => {
    const pos = i + 1;
    const medal = medals[i] || '#' + pos;
    const isTop3 = i < 3;
    const isMe = u.uid === State.user?.uid;

    return `
      <div class="profile-link flex items-center gap-3 p-3 rounded-2xl mb-2 ${isTop3 ? 'bg-gradient-to-r from-gold/10 to-transparent border border-gold/30' : 'bg-card border border-border'} ${isMe ? 'ring-1 ring-primary/40' : ''}" data-uid="${esc(u.uid)}" style="cursor: pointer;">
        <div class="w-10 h-10 rounded-full ${isTop3 ? 'bg-gold/20' : 'bg-cardAlt'} flex items-center justify-center font-black text-sm flex-shrink-0">
          ${pos <= 3 ? '<span style="font-size: 18px;">' + medal + '</span>' : '<span class="text-gray-400">' + pos + '</span>'}
        </div>
        <div class="relative flex-shrink-0">
          ${renderAvatar(u, 40)}
          ${u.isPro ? '<div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold flex items-center justify-center border-2 border-card" style="font-size: 10px;">👑</div>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-bold truncate">${esc(u.ign)}</span>
            ${isMe ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-primary text-white font-black">YOU</span>' : ''}
            ${renderBadges(u)}
          </div>
          <div class="text-[10px] text-gray-500 truncate">${esc(u.rank)} · ${esc(u.region)}</div>
          ${u.badges && u.badges.length > 0 ? `
            <div class="flex gap-1 mt-1">
              ${u.badges.slice(0, 4).map(b => {
                const badgeEmoji = { first_leak: '🥉', rising: '🥈', legend: '🥇', elite: '💎' }[b] || '⭐';
                return '<span style="font-size: 11px;">' + badgeEmoji + '</span>';
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
  }).join('');
}

// ============================================
// CLAN WARS SUB-TAB
// ============================================
const CLAN_WARS_RESET_DAY = 1; // Monday
const CLAN_WARS_MIN_SIZE = 3;
const CLAN_WARS_POINTS = {
  lobby: 2,
  submissionApproved: 10,
  dailyActive: 1,
  newMember: 5
};

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
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

// ============================================
// CLAN WARS MAIN
// ============================================
async function renderClanWarsSub() {
  const body = document.getElementById('squad-body');
  if (!body) return;

  body.innerHTML = '<div class="text-center py-8"><div class="spinner mx-auto"></div></div>';

  try {
    const { clans, champion } = await computeClanWars();
    const seasonNumber = getSeasonNumber();
    const countdown = getCountdown();

    // Find user's clan
    const myClansSnap = await getDocs(query(
      collection(db, 'clans'),
      where('members', 'array-contains', State.user.uid),
      limit(1)
    ));
    let myClan = null;
    if (!myClansSnap.empty) {
      myClan = { id: myClansSnap.docs[0].id, ...myClansSnap.docs[0].data() };
    }

    const medals = ['🥇', '🥈', '🥉'];

    body.innerHTML = `
      <!-- Header -->
      <div class="bg-gradient-to-br from-gold/20 to-black border border-gold/40 rounded-2xl p-4 mb-4 relative overflow-hidden">
        <div class="absolute top-3 right-3 opacity-30" style="font-size: 32px;">🏆</div>
        <div class="text-[10px] font-black text-gold uppercase tracking-wider mb-1">Clan Wars</div>
        <div class="text-2xl font-black mb-1">Season ${seasonNumber}</div>
        <div class="flex items-center gap-2 text-xs text-gray-400">
          <i data-lucide="clock" class="w-3.5 h-3.5"></i>
          <span>Resets in <span class="font-bold text-gold">${countdown}</span></span>
        </div>
      </div>

      ${champion ? `
        <div class="bg-gradient-to-r from-gold/10 to-transparent border border-gold/30 rounded-xl p-3 mb-4 flex items-center gap-3">
          <div style="font-size: 28px;">👑</div>
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
          <button id="join-clan-cta" class="btn-press px-4 py-2 rounded-lg bg-primary text-xs font-bold text-white">Join a Clan</button>
        </div>
      `}

      <!-- Leaderboard -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between">
          <div class="text-xs font-bold text-gray-400 uppercase">🏆 Leaderboard</div>
          <div class="text-[10px] text-gray-500">${clans.length} clan${clans.length === 1 ? '' : 's'}</div>
        </div>
        ${clans.length === 0 ? `
          <div class="text-center py-8">
            <div style="font-size: 32px; margin-bottom: 8px;">⏳</div>
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
                    ${c.logoUrl ? '<img src="' + esc(c.logoUrl) + '" class="w-full h-full object-cover" />' : esc(c.name.charAt(0))}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <div class="text-sm font-bold truncate ${pos === 1 ? 'text-gold' : ''}">${esc(c.name)}</div>
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

      <!-- How points work -->
      <div class="bg-card border border-border rounded-2xl p-4 mb-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-3">📊 How Points Work</div>
        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-gray-400">🎮 Post a lobby</span>
            <span class="font-bold text-primary">+${CLAN_WARS_POINTS.lobby}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-400">✅ Approved submission</span>
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

      <!-- Hall of Fame -->
      <div class="bg-card border border-border rounded-2xl p-4 mb-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-3">👑 Hall of Fame</div>
        <div id="hall-of-fame-list">
          <div class="text-center py-4 text-[10px] text-gray-600">Loading...</div>
        </div>
      </div>
    `;

    // Wire join clan CTA
    const joinCTA = document.getElementById('join-clan-cta');
    if (joinCTA) {
      joinCTA.onclick = () => { squadSubTab = 'clans'; renderSquadTab(); };
    }

    loadHallOfFame();
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Clan wars error:', e);
    body.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load</div>';
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

// ============================================
// COMPUTE CLAN WARS (aggregate logs)
// ============================================
async function computeClanWars() {
  const seasonStart = getCurrentSeasonStart();

  const logsSnap = await getDocs(query(collection(db, 'clanWarsLog'), limit(5000)));
  const clanPoints = {};

  logsSnap.forEach(d => {
    const log = d.data();
    const logSeason = log.season?.seconds ? log.season.seconds * 1000 : (log.season || 0);
    if (logSeason < seasonStart) return;

    if (!clanPoints[log.clanId]) {
      clanPoints[log.clanId] = { total: 0 };
    }
    clanPoints[log.clanId].total += log.points || 0;
  });

  const clansSnap = await getDocs(collection(db, 'clans'));
  const clans = [];
  clansSnap.forEach(d => {
    const c = d.data();
    const memberCount = (c.members || []).length;
    if (memberCount < CLAN_WARS_MIN_SIZE) return;
    clans.push({
      id: d.id,
      name: c.name,
      logoUrl: c.logoUrl || '',
      region: c.region || 'Global',
      memberCount,
      points: clanPoints[d.id]?.total || 0
    });
  });

  clans.sort((a, b) => b.points - a.points);

  // Get champion from history
  let champion = null;
  try {
    const lastSeasonStart = seasonStart - 7 * 24 * 60 * 60 * 1000;
    const historySnap = await getDocs(query(
      collection(db, 'clanWarsHistory'),
      where('season', '==', lastSeasonStart),
      limit(1)
    ));
    if (!historySnap.empty) {
      const data = historySnap.docs[0].data();
      champion = {
        clanId: data.clanId,
        clanName: data.clanName,
        season: data.seasonNumber
      };
    }
  } catch (e) { /* silent */ }

  return { clans, champion };
}

// ============================================
// HALL OF FAME
// ============================================
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
        <div style="font-size: 20px;">🏆</div>
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

// ============================================
// ADD CLAN POINTS (called from other features)
// ============================================
async function addClanPoints(clanId, points, reason) {
  if (!clanId || !points) return;
  try {
    await addDoc(collection(db, 'clanWarsLog'), {
      clanId,
      points,
      reason: reason || 'action',
      season: getCurrentSeasonStart(),
      createdAt: serverTimestamp(),
      byUid: State.user?.uid || null
    });
  } catch (e) {
    console.error('Clan points error:', e);
  }
}

// ============================================
// EXPORT
// ============================================
window.renderLeaderboardSub = renderLeaderboardSub;
window.renderClanWarsSub = renderClanWarsSub;
window.addClanPoints = addClanPoints;
window.getCurrentSeasonStart = getCurrentSeasonStart;
window.getSeasonNumber = getSeasonNumber;
window.CLAN_WARS_POINTS = CLAN_WARS_POINTS;

// ============================================
// END OF CHUNK 19/24
// ============================================
// ============================================
// CHUNK 20/24 — Intel Tab (CP Calc + Leaks + Tier + Maps)
// ⚙️ UPDATE HERE: POI data, tier gun lists, CP conversion rates
// ============================================

let intelSubTab = 'cp';

// ============================================
// INTEL TAB RENDERER
// ============================================
function renderIntelTab() {
  const content = document.getElementById('content');
  if (!content) return;

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

  const renderers = {
    cp: renderCPCalc,
    leaks: renderLeaksSub,
    tier: typeof renderTierSub === 'function' ? renderTierSub : null,
    maps: typeof renderMapsSub === 'function' ? renderMapsSub : null
  };

  const renderer = renderers[intelSubTab];
  if (renderer) {
    renderer();
  } else {
    document.getElementById('intel-body').innerHTML = '<div class="text-center py-8 text-gray-500 text-xs">Loading...</div>';
  }

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// CP CALCULATOR
// ============================================
const CP_CONVERSION = {
  usd: 0.001,
  ngn: 1.6,
  ghs: 0.014
};

function renderCPCalc() {
  const body = document.getElementById('intel-body');
  if (!body) return;

  const bundles = [
    { cp: 80, price: '₦1,500' },
    { cp: 420, price: '₦7,500' },
    { cp: 880, price: '₦14,500' },
    { cp: 2400, price: '₦38,000', best: true },
    { cp: 5000, price: '₦75,000' }
  ];

  const drawCosts = [10, 30, 50, 100, 200, 400, 800, 1200, 2000, 3000];

  body.innerHTML = `
    <!-- Input card -->
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

    <!-- Draw cost -->
    <div class="bg-card border border-border rounded-2xl p-4 mb-4">
      <div class="text-sm font-bold mb-3">🎰 Draw Cost Calculator</div>
      <div id="draw-list" class="space-y-2"></div>
      <div class="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <div class="text-xs text-gray-400 font-semibold">Full Draw Total</div>
        <div id="draw-total" class="text-base font-black text-gold">0 CP</div>
      </div>
    </div>

    <!-- Bundles -->
    <div class="bg-card border border-border rounded-2xl p-4">
      <div class="text-sm font-bold mb-3">💰 Best Value Bundles</div>
      <div class="space-y-2">
        ${bundles.map(b => `
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
    document.getElementById('cp-usd').textContent = '$' + (cp * CP_CONVERSION.usd).toFixed(2);
    document.getElementById('cp-ngn').textContent = '₦' + Math.round(cp * CP_CONVERSION.ngn).toLocaleString();
    document.getElementById('cp-ghs').textContent = '₵' + (cp * CP_CONVERSION.ghs).toFixed(2);
  };
  input.oninput = update;
  update();

  let total = 0;
  document.getElementById('draw-list').innerHTML = drawCosts.map((c, i) => {
    total += c;
    return `
      <div class="flex items-center justify-between text-xs">
        <span class="text-gray-500">Draw ${i + 1}</span>
        <span class="font-bold">${c} CP</span>
        <span class="text-gray-500 font-mono">${total.toLocaleString()}</span>
      </div>
    `;
  }).join('');
  document.getElementById('draw-total').textContent = total.toLocaleString() + ' CP';
}

// ============================================
// LEAKS SUB-TAB
// ============================================
function renderLeaksSub() {
  const body = document.getElementById('intel-body');
  if (!body) return;

  const isAdmin = State.user?.uid === ADMIN_UID;

  body.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="text-xs text-gray-500">Community intel drops</div>
      <div class="flex gap-2">
        <button id="submit-leak-btn" class="btn-press px-3 py-2 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold flex items-center gap-1">
          <i data-lucide="upload" class="w-3 h-3"></i> Submit
        </button>
        ${isAdmin ? `
          <button id="post-leak-btn" class="btn-press px-3 py-2 rounded-xl bg-gold text-black text-xs font-bold flex items-center gap-1">
            <i data-lucide="plus" class="w-3 h-3"></i> Post
          </button>
        ` : ''}
      </div>
    </div>
    <div id="leaks-feed" class="space-y-3">
      ${skeletonCard().repeat(2)}
    </div>
  `;

  document.getElementById('submit-leak-btn').onclick = openSubmitLeakSheet;
  const adminBtn = document.getElementById('post-leak-btn');
  if (adminBtn) adminBtn.onclick = openPostLeakSheet;

  loadLeaks();
}

// ============================================
// LOAD LEAKS (real-time)
// ============================================
function loadLeaks() {
  if (State.unsubs.leaks) {
    try { State.unsubs.leaks(); } catch (e) {}
    State.unsubs.leaks = null;
  }

  const q = query(collection(db, 'leaks'), orderBy('createdAt', 'desc'), limit(30));

  State.unsubs.leaks = onSnapshot(q, (snap) => {
    const leaks = [];
    snap.forEach(d => leaks.push({ id: d.id, ...d.data() }));
    State.cache.leaks = leaks;
    renderLeaks();
  }, (err) => {
    console.error('Leaks error:', err);
    // Fallback without orderBy
    getDocs(query(collection(db, 'leaks'), limit(30))).then(snap => {
      const leaks = [];
      snap.forEach(d => leaks.push({ id: d.id, ...d.data() }));
      leaks.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      State.cache.leaks = leaks;
      renderLeaks();
    }).catch(() => {});
  });
}

// ============================================
// RENDER LEAKS
// ============================================
function renderLeaks() {
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

  feed.innerHTML = State.cache.leaks.map(l => `
    <div class="bg-card border border-border rounded-2xl overflow-hidden fade-in" data-id="${l.id}">
      ${l.imageUrl ? `<img src="${esc(l.imageUrl)}" class="zoomable w-full h-44 object-cover" loading="lazy" data-caption="${esc(l.title)}" />` : ''}
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="text-[10px] px-2 py-1 rounded-full bg-gold/15 text-gold font-black">🔥 LEAK</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full ${rarityColors[l.rarity] || 'bg-gray-500'} font-black uppercase">${esc(l.rarity || 'common')}</span>
          <span class="text-[10px] text-gray-500 ml-auto">${timeAgo(l.createdAt)}</span>
        </div>
        <h3 class="text-base font-bold mb-2">${esc(l.title)}</h3>
        ${l.body ? `<p class="text-xs text-gray-400 line-clamp-3 mb-3">${esc(l.body)}</p>` : ''}
        <div class="flex items-center gap-2 mb-3">
          ${renderAvatar(l, 24)}
          <span class="text-[10px] text-gray-500">
            by ${renderUsername({ uid: l.uid || l.submitterUid, ign: l.ign || l.submitterIgn || 'CODMPanda' }, 'text-gray-300 font-semibold')}
          </span>
        </div>
        <div class="flex items-center justify-between pt-2 border-t border-border">
          ${renderReactionButton('leak', l.id, l.reactions, l.myReaction)}
          ${renderCommentButton('leak', l.id, l.commentCount || 0)}
          <button class="leak-share-btn btn-press text-primary" data-id="${l.id}" data-title="${esc(l.title)}">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  feed.querySelectorAll('.leak-share-btn').forEach(btn => {
    btn.onclick = () => {
      openShareSheet({
        title: btn.dataset.title,
        text: '🔥 New leak on CODMPanda: ' + btn.dataset.title,
        url: location.origin + '/?leak=' + btn.dataset.id
      });
    };
  });

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// SUBMIT LEAK (user)
// ============================================
function openSubmitLeakSheet() {
  openSheet(`
    <div class="space-y-4">
      <div class="bg-gold/10 border border-gold/30 rounded-xl p-3 text-xs text-gold">
        Share intel with the community
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Title *</label>
        <input id="sl-title" type="text" placeholder="e.g. New Mythic weapon teased" maxlength="100" />
      </div>

      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rarity</label>
        <select id="sl-rarity" data-dropdown-title="Rarity">
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

      <button id="sl-submit" class="btn-press w-full py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black">
        Submit Leak
      </button>
    </div>
  `, 'Submit Leak');

  document.getElementById('sl-submit').onclick = async () => {
    const title = document.getElementById('sl-title').value.trim();
    const rarity = document.getElementById('sl-rarity').value;
    const bodyText = document.getElementById('sl-body').value.trim();
    const fileInput = document.getElementById('sl-image');

    if (title.length < 3) { toast('Title too short', 'error'); return; }

    const btn = document.getElementById('sl-submit');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner mx-auto"></div>';

    try {
      let imageUrl = '';
      if (fileInput.files && fileInput.files[0]) {
        imageUrl = await compressImage(fileInput.files[0], 800, 0.7);
      }

      await addDoc(collection(db, 'leaks'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        isPro: isPro(),
        verified: !!State.profile.verified,
        title, rarity, body: bodyText, imageUrl,
        reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
        reactionCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });

      toast('Leak posted!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Leak';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// POST LEAK (admin only)
// ============================================
function openPostLeakSheet() {
  if (State.user?.uid !== ADMIN_UID) return;

  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Title</label>
        <input id="lk-title" type="text" placeholder="e.g. New Mythic weapon teased" maxlength="100" />
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Rarity</label>
        <select id="lk-rarity" data-dropdown-title="Rarity">
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
      if (fileInput.files && fileInput.files[0]) {
        imageUrl = await compressImage(fileInput.files[0], 800, 0.7);
      }

      await addDoc(collection(db, 'leaks'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        isPro: true,
        verified: true,
        title, rarity, body: bodyText, imageUrl,
        reactions: { like: 0, fire: 0, dead: 0, clutch: 0, goat: 0, clown: 0 },
        reactionCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });

      toast('Leak posted!', 'success');
      closeSheet();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Post Leak';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// TIER LIST
// ============================================
function renderTierSub() {
  const body = document.getElementById('intel-body');
  if (!body) return;

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
    <div class="text-xs text-gray-500 mb-4">Current community meta</div>
    <div class="space-y-2 mb-4">
      ${['S', 'A', 'B', 'C'].map(tier => `
        <div class="bg-card border border-border rounded-2xl p-3">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg ${tierColors[tier]} flex items-center justify-center font-black text-sm">${tier}</div>
            <span class="text-xs font-bold text-gray-400">Tier ${tier}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${TIER_GUNS[tier].map(g => '<span class="text-[10px] px-2 py-1 rounded-full bg-cardAlt border border-border font-semibold">' + esc(g) + '</span>').join('')}
          </div>
        </div>
      `).join('')}
    </div>
    <button id="vote-tier-btn" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">Vote on a Gun</button>
  `;

  document.getElementById('vote-tier-btn').onclick = () => {
    toast('Tier voting coming soon', 'info', 2000);
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// MAPS SUB-TAB — ISOLATED
// ============================================
const ISOLATED_POIS = [
  { name: 'Black Market', x: 20, y: 40, hot: true, tier: 'S', desc: 'Contested S-tier. Underground bunker with T.E.D.D. robot.' },
  { name: 'Floating HQ', x: 88, y: 13, hot: true, tier: 'S', desc: 'Random spawn. Best loot in game.' },
  { name: 'Farm', x: 45, y: 56, hot: true, tier: 'S', desc: 'Butcher boss spawn. Level 3 vests + legendary weapons.' },
  { name: 'Launch Base', x: 62, y: 48, hot: true, tier: 'S', desc: 'Best loot density. Rocket launch pad.' },
  { name: 'Nuketown', x: 15, y: 88, hot: true, tier: 'S', desc: 'Iconic BO map. Mystery Box spawn.' },
  { name: 'Docks', x: 20, y: 62, hot: true, tier: 'A', desc: 'Warehouses + shipping containers.' },
  { name: 'Nuclear Plant', x: 50, y: 31, hot: true, tier: 'A', desc: 'Central. Cooling towers, roof access.' },
  { name: 'Crash Site', x: 88, y: 50, hot: true, tier: 'A', desc: 'Sky Carrier. Locked door needs 3 codes.' },
  { name: 'Killhouse', x: 78, y: 40, hot: true, tier: 'A', desc: 'Live fire area. Power positions.' },
  { name: 'Countdown', x: 88, y: 68, hot: true, tier: 'A', desc: 'Massive missile launch site.' },
  { name: 'Downtown', x: 62, y: 63, hot: true, tier: 'A', desc: 'Urban sprawl. Roof camping.' },
  { name: 'Sakura', x: 82, y: 30, hot: false, tier: 'A', desc: 'Underrated safe loot.' },
  { name: 'Standoff', x: 35, y: 50, hot: false, tier: 'A', desc: 'Safe central location.' },
  { name: 'Estate', x: 50, y: 82, hot: false, tier: 'A', desc: 'Safe loot spot. Hills + trees.' },
  { name: 'Sanitarium', x: 35, y: 26, hot: false, tier: 'B', desc: 'Secret room on 3rd floor.' },
  { name: 'Overgrown', x: 68, y: 20, hot: false, tier: 'B', desc: 'Jungle ruins.' },
  { name: 'Bus Station', x: 55, y: 40, hot: false, tier: 'B', desc: 'Central transit. Mystery Box spawn.' },
  { name: 'Harbor', x: 12, y: 30, hot: false, tier: 'B', desc: 'West coast ships.' },
  { name: 'Pipeline', x: 38, y: 68, hot: false, tier: 'B', desc: 'Industrial zone.' },
  { name: 'Circus', x: 42, y: 82, hot: false, tier: 'B', desc: 'Ferris wheel landmark.' },
  { name: 'Ski Town', x: 50, y: 15, hot: false, tier: 'B', desc: 'Snowy resort.' },
  { name: 'Diner', x: 68, y: 56, hot: false, tier: 'C', desc: 'Zombies + Mystery Box can spawn.' },
  { name: 'Pier', x: 12, y: 68, hot: false, tier: 'C', desc: 'Coastal. Boat spawns.' }
];

function renderMapsSub() {
  const body = document.getElementById('intel-body');
  if (!body) return;

  body.innerHTML = `
    <div class="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div class="relative w-full" style="aspect-ratio: 1;">
        <img src="/isolated-map.png" alt="CODM Isolated Map" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'" />

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
                opacity: 0.75;
              ">${pinIcon}</div>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <div class="bg-card border border-border rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-2 mb-3">
        <span style="font-size: 16px;">🔥</span>
        <div class="text-xs font-bold text-primary uppercase">Hot Drops</div>
      </div>
      <div class="space-y-2">
        ${ISOLATED_POIS.filter(p => p.hot).slice(0, 7).map(p => `
          <button class="poi-row w-full text-left flex items-start gap-3 p-2.5 rounded-xl bg-cardAlt border border-border" data-poi-index="${ISOLATED_POIS.indexOf(p)}">
            <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span style="font-size: 14px;">🔥</span>
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
        <span style="font-size: 14px;">ℹ️</span>
        <div class="text-xs font-bold text-blue-400 uppercase">Legend</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div class="flex items-center gap-2 text-[10px]">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #FF6B00; border: 1px solid #fff;"></div>
          <span class="text-gray-400">🔥 Hot Drop</span>
        </div>
        <div class="flex items-center gap-2 text-[10px]">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #FFD700; border: 1px solid #fff;"></div>
          <span class="text-gray-400">★ S-Tier</span>
        </div>
        <div class="flex items-center gap-2 text-[10px]">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #00BFFF; border: 1px solid #fff;"></div>
          <span class="text-gray-400">• A-Tier</span>
        </div>
        <div class="flex items-center gap-2 text-[10px]">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: #8E8E93; border: 1px solid #fff;"></div>
          <span class="text-gray-400">• B/C-Tier</span>
        </div>
      </div>
    </div>
  `;

  body.querySelectorAll('.map-poi').forEach(el => {
    el.onclick = () => openPoiDetail(parseInt(el.dataset.poiIndex));
  });
  body.querySelectorAll('.poi-row').forEach(el => {
    el.onclick = () => openPoiDetail(parseInt(el.dataset.poiIndex));
  });

  if (window.lucide) window.lucide.createIcons();
}

function openPoiDetail(index) {
  const p = ISOLATED_POIS[index];
  if (!p) return;

  openSheet(`
    <div class="space-y-4">
      <div class="text-center">
        <div style="font-size: 48px; margin-bottom: 12px;">${p.hot ? '🔥' : (p.tier === 'S' ? '★' : '📍')}</div>
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

      <button onclick="closeSheet()" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm text-white">
        Got it
      </button>
    </div>
  `, 'Location');

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// EXPORT
// ============================================
window.renderIntelTab = renderIntelTab;
window.renderCPCalc = renderCPCalc;
window.renderLeaksSub = renderLeaksSub;
window.loadLeaks = loadLeaks;
window.renderLeaks = renderLeaks;
window.openSubmitLeakSheet = openSubmitLeakSheet;
window.openPostLeakSheet = openPostLeakSheet;
window.renderTierSub = renderTierSub;
window.renderMapsSub = renderMapsSub;
window.openPoiDetail = openPoiDetail;
window.ISOLATED_POIS = ISOLATED_POIS;

// ============================================
// END OF CHUNK 20/24
// ============================================
// ============================================
// CHUNK 21/24 — You Tab (Profile)
// ⚙️ UPDATE HERE: profile layout, stats, settings rows
// ============================================

// ============================================
// YOU TAB RENDERER
// ============================================
function renderYouTab() {
  const content = document.getElementById('content');
  if (!content) return;

  const p = State.profile || {};
  const pro = isPro();
  const theme = PROFILE_THEMES[p.themeStyle || 'dark'] || PROFILE_THEMES.dark;

  content.innerHTML = `
    <div class="px-4 pt-4 pb-24">
      <!-- Profile header -->
      <div class="rounded-2xl p-4 mb-3 border" style="background: ${theme.gradient}; border-color: ${theme.border}; ${theme.glow && theme.glow !== 'none' ? 'box-shadow: ' + theme.glow + ';' : ''}">
        <div class="flex items-center gap-3 mb-3">
          <div class="relative">
            ${renderAvatar(p, 64)}
            ${pro ? '<div class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold flex items-center justify-center border-2 border-card" style="font-size: 14px;">👑</div>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-base font-black truncate">${esc(p.ign || 'Set IGN')}</span>
              ${renderBadges(p)}
            </div>
            <div class="text-[11px] text-gray-500 mt-0.5">${esc(p.rank || 'Rookie')} · ${esc(p.region || 'Global')}</div>
            <button id="copy-uid-btn" class="text-[10px] text-primary font-bold mt-1 flex items-center gap-1">
              <i data-lucide="copy" class="w-3 h-3"></i> ${State.user.uid.slice(0, 16)}...
            </button>
          </div>
        </div>
        ${p.bio ? '<p class="text-xs text-gray-300 mb-2">' + esc(p.bio) + '</p>' : ''}
        ${p.favGun ? '<div class="text-[11px] text-gray-400 mb-2">🎯 Favourite: <span class="font-bold text-gray-200">' + esc(p.favGun) + '</span></div>' : ''}
        <div class="flex items-center gap-3 pt-3 border-t border-white/10">
          <div class="flex items-center gap-1.5 text-[10px]">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #22C55E; animation: pulse 2s infinite;"></div>
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
        <button id="edit-profile-btn" class="btn-press w-full mt-3 py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold">Edit Profile</button>
      </div>

      <!-- Theme + Frame buttons -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <button id="open-theme-btn" class="btn-press py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold flex items-center justify-center gap-1.5">
          🎨 Themes
        </button>
        <button id="open-frame-btn" class="btn-press py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold flex items-center justify-center gap-1.5">
          ✨ Avatar Frame
        </button>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-2 mb-3" id="profile-stats">
        <div class="bg-card border border-border rounded-2xl p-3 text-center">
          <div id="stat-vaults" class="text-lg font-black text-primary">—</div>
          <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Vaults</div>
        </div>
        <div class="bg-card border border-border rounded-2xl p-3 text-center">
          <div id="stat-camos" class="text-lg font-black text-gold">—</div>
          <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Camos</div>
        </div>
        <div class="bg-card border border-border rounded-2xl p-3 text-center">
          <div id="stat-friends" class="text-lg font-black text-green-400">—</div>
          <div class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Friends</div>
        </div>
      </div>

      <!-- Notifications card (injected by Chunk 16) -->
      <div id="notif-card-container"></div>

      <!-- Pro card -->
      ${pro ? renderProActiveCard(p) : renderProUpsellCard()}

      <!-- Settings -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden mb-3">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Settings</div>
        </div>
        <div class="divide-y divide-border">
          ${settingsRow('edit-profile', 'user', 'Edit Profile', 'Update IGN, bio, rank')}
          ${settingsRow('my-referral', 'gift', 'My Referral', 'Share & earn invites')}
          ${settingsRow('notifications', 'bell', 'Notifications', 'Manage push settings')}
          ${settingsRow('advanced-settings', 'settings-2', 'Advanced Settings', 'Appearance, privacy')}
          ${settingsRow('clear-cache', 'trash-2', 'Clear Cache', 'Free up space')}
          ${settingsRow('export-data', 'download', 'Export My Data', 'Download JSON')}
        </div>
      </div>

      <!-- Support -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden mb-3">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Support</div>
        </div>
        <div class="divide-y divide-border">
          ${settingsRow('bug-report', 'bug', 'Report a Bug', 'Help us improve')}
          ${settingsRow('feature-request', 'lightbulb', 'Request Feature', 'Got an idea?')}
          ${settingsRow('share-app', 'share-2', 'Share App', 'Invite your squad')}
          ${settingsRow('help-faq', 'help-circle', 'Help / FAQ', 'Common questions')}
          ${settingsRow('discord', 'message-circle', 'Join Discord', 'Coming soon', false, true)}
        </div>
      </div>

      <!-- Admin panel (only for admin) -->
      ${State.user.uid === ADMIN_UID ? `
        <div class="bg-card border border-gold/40 rounded-2xl overflow-hidden mb-3">
          <div class="px-4 py-3 border-b border-gold/30 bg-gold/5">
            <div class="text-xs font-bold text-gold uppercase flex items-center gap-2">
              <i data-lucide="shield-check" class="w-4 h-4"></i> Admin Panel
            </div>
          </div>
          <div class="divide-y divide-border">
            ${settingsRow('admin-analytics', 'bar-chart-3', 'Analytics', 'Users, content, activity')}
            ${settingsRow('admin-reports', 'flag', 'Manage Reports', 'Review user reports')}
            ${settingsRow('admin-users', 'users', 'List Users', 'View all users')}
          </div>
        </div>
      ` : ''}

      <!-- Danger zone -->
      <div class="bg-card border border-red-500/30 rounded-2xl overflow-hidden mb-3">
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

      <!-- Version -->
      <div class="text-center py-6">
        <div class="text-[10px] text-gray-600">Version ${APP_VERSION}</div>
        <div class="flex items-center justify-center gap-3 text-[10px] text-gray-500 mt-1">
          <button onclick="showPrivacy()">Privacy</button>
          <span>·</span>
          <button onclick="showTerms()">Terms</button>
        </div>
      </div>
    </div>
  `;

  // Wire actions
  document.querySelectorAll('.settings-row').forEach(el => {
    el.onclick = () => handleSettingAction(el.dataset.action);
  });

  document.getElementById('copy-uid-btn').onclick = () => copyText(State.user.uid, 'UID copied!');
  document.getElementById('edit-profile-btn').onclick = openEditProfileSheet;
  document.getElementById('open-theme-btn').onclick = openThemePicker;
  document.getElementById('open-frame-btn').onclick = openAvatarFramePicker;

  const proBtn = document.getElementById('unlock-pro-btn');
  if (proBtn) proBtn.onclick = openUpgradeSheet;
  const manageBtn = document.getElementById('manage-pro-btn');
  if (manageBtn) manageBtn.onclick = showManagePro;

  // Inject notification card from Chunk 16
  const notifContainer = document.getElementById('notif-card-container');
  if (notifContainer && typeof renderNotificationsCard === 'function') {
    notifContainer.innerHTML = renderNotificationsCard();
    const toggle = document.getElementById('notif-toggle');
    if (toggle) {
      toggle.onclick = () => {
        const enabled = State.profile && State.profile.notificationsEnabled;
        if (enabled) {
          if (typeof disableNotifications === 'function') disableNotifications();
        } else {
          if (typeof enableNotifications === 'function') enableNotifications();
        }
      };
    }
  }

  loadProfileStats();
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PRO CARDS
// ============================================
function renderProUpsellCard() {
  return `
    <div class="bg-gradient-to-br from-black via-black to-[#1a1200] border border-gold/40 rounded-2xl p-5 mb-3 relative overflow-hidden">
      <div class="absolute top-3 right-3" style="font-size: 28px;">👑</div>
      <div class="text-xs font-black text-gold uppercase tracking-wider mb-1">Upgrade</div>
      <h3 class="text-xl font-black mb-3">Go <span class="text-gold">Pro</span></h3>
      <div class="text-xs text-gray-300 mb-4">
        <div class="font-bold text-gold mb-2">${PRO.price.monthly}/mo · ${PRO.price.lifetime} lifetime</div>
        <ul class="space-y-1.5">
          ${PRO.benefits.slice(0, 7).map(b => '<li>✦ ' + esc(b.text) + '</li>').join('')}
        </ul>
      </div>
      <button id="unlock-pro-btn" class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold">
        Unlock Pro
      </button>
    </div>
  `;
}

function renderProActiveCard(p) {
  const expiry = p.proExpiry?.toDate ? p.proExpiry.toDate().toLocaleDateString() : 'Lifetime';
  return `
    <div class="bg-gradient-to-br from-[#1a1200] to-black border border-gold rounded-2xl p-5 mb-3" style="box-shadow: 0 0 30px rgba(255, 215, 0, 0.3);">
      <div class="flex items-center gap-2 mb-3">
        <span style="font-size: 28px;">👑</span>
        <div>
          <div class="text-sm font-black text-gold">PRO ACTIVE</div>
          <div class="text-[10px] text-gray-400">Expires: ${expiry}</div>
        </div>
      </div>
      <div class="text-xs text-gray-300 mb-3">Enjoy unlimited access & zero ads.</div>
      <button id="manage-pro-btn" class="btn-press w-full py-2.5 rounded-xl bg-cardAlt border border-gold/40 text-gold text-xs font-bold">Manage Subscription</button>
    </div>
  `;
}

// ============================================
// SETTINGS ROW HELPER
// ============================================
function settingsRow(action, icon, label, sub, danger, disabled) {
  return `
    <button class="settings-row w-full flex items-center justify-between px-4 py-3 text-left ${disabled ? 'opacity-60' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}>
      <div class="flex items-center gap-3 min-w-0">
        <i data-lucide="${icon}" class="w-4 h-4 ${danger ? 'text-red-400' : 'text-gray-400'} flex-shrink-0"></i>
        <div class="min-w-0">
          <div class="text-sm font-semibold ${danger ? 'text-red-400' : ''}">${esc(label)}</div>
          ${sub ? '<div class="text-[10px] text-gray-500 truncate">' + esc(sub) + '</div>' : ''}
        </div>
      </div>
      <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
    </button>
  `;
}

// ============================================
// LOAD PROFILE STATS
// ============================================
async function loadProfileStats() {
  try {
    const [vaultSnap, camoSnap, mySnap] = await Promise.all([
      getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid))).catch(() => ({ size: 0 })),
      getDoc(doc(db, 'camos', State.user.uid)).catch(() => ({ exists: () => false })),
      getDoc(doc(db, 'users', State.user.uid)).catch(() => ({ exists: () => false }))
    ]);

    const vaultEl = document.getElementById('stat-vaults');
    if (vaultEl) vaultEl.textContent = vaultSnap.size;

    let pct = 0;
    if (camoSnap.exists && camoSnap.exists()) {
      const totalPossible = ALL_GUNS.length * CAMO_TYPES.length;
      let checked = 0;
      Object.values(camoSnap.data()).forEach(gun => {
        if (typeof gun === 'object') {
          CAMO_TYPES.forEach(c => { if (gun[c.key]) checked++; });
        }
      });
      pct = Math.round((checked / totalPossible) * 100);
    }
    const camoEl = document.getElementById('stat-camos');
    if (camoEl) camoEl.textContent = pct + '%';

    const friendsEl = document.getElementById('stat-friends');
    if (friendsEl && mySnap.exists && mySnap.exists()) {
      friendsEl.textContent = (mySnap.data().friends || []).length;
    } else if (friendsEl) {
      friendsEl.textContent = '0';
    }

    // Cache for share card
    State.stats.vaultCount = vaultSnap.size;
    State.stats.camoPct = pct;
  } catch (e) {
    console.warn('Stats load error:', e);
  }
}

// ============================================
// SETTINGS ACTIONS
// ============================================
function handleSettingAction(action) {
  switch (action) {
    case 'edit-profile': openEditProfileSheet(); break;
    case 'my-referral': showReferral(); break;
    case 'notifications': showNotificationSettings(); break;
    case 'advanced-settings': openAdvancedSettings(); break;
    case 'clear-cache': clearCache(); break;
    case 'export-data': exportUserData(); break;
    case 'bug-report': openBugReportSheet(); break;
    case 'feature-request': openFeatureSheet(); break;
    case 'share-app': shareApp(); break;
    case 'help-faq': showFAQ(); break;
    case 'discord': toast('Discord coming soon', 'info', 2000); break;
    case 'logout': handleSignOut(); break;
    case 'delete-account': deleteAccount(); break;
    case 'admin-analytics': showAdminAnalytics(); break;
    case 'admin-reports': showAdminReports(); break;
    case 'admin-users': showAdminUsers(); break;
  }
}

// ============================================
// EDIT PROFILE SHEET
// ============================================
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
        <select id="ep-rank" data-dropdown-title="Rank">
          ${RANKS.map(r => '<option ' + (p.rank === r ? 'selected' : '') + '>' + r + '</option>').join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Region</label>
        <select id="ep-region" data-dropdown-title="Region">
          ${REGIONS.map(r => '<option ' + (p.region === r ? 'selected' : '') + '>' + r + '</option>').join('')}
        </select>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Bio</label>
        <textarea id="ep-bio" rows="3" maxlength="150" placeholder="Tell your squad about you...">${esc(p.bio || '')}</textarea>
      </div>
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Favourite Gun</label>
        <select id="ep-fav" data-dropdown-title="Favourite Gun">
          <option value="">None</option>
          ${ALL_GUNS.slice(0, 80).map(g => '<option ' + (p.favGun === g ? 'selected' : '') + '>' + g + '</option>').join('')}
        </select>
      </div>
      <button id="ep-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">Save Changes</button>
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
      if (fileInput.files && fileInput.files[0]) {
        updates.avatar = await compressImage(fileInput.files[0], 300, 0.7);
      }
      await updateDoc(doc(db, 'users', State.user.uid), updates);
      State.profile = { ...State.profile, ...updates };
      const subtitle = document.getElementById('top-bar-subtitle');
      if (subtitle) subtitle.textContent = rank + ' · ' + region;
      toast('Profile updated!', 'success');
      closeSheet();
      renderYouTab();
    } catch (e) {
      console.error(e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// REFERRAL
// ============================================
function showReferral() {
  const code = State.profile?.referralCode || generateReferralCode(State.user.uid);
  const link = location.origin + '/?ref=' + State.user.uid;

  openSheet(`
    <div class="text-center space-y-4">
      <div style="font-size: 48px;">🎁</div>
      <div>
        <div class="text-sm text-gray-400 mb-1">Your referral code</div>
        <div class="text-2xl font-black text-primary">${esc(code)}</div>
      </div>
      <div class="bg-cardAlt border border-border rounded-xl p-3">
        <div class="text-[10px] text-gray-500 mb-2">Invite link</div>
        <div class="text-xs text-primary font-mono break-all">${esc(link)}</div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button id="ref-copy" class="btn-press py-3 rounded-xl bg-primary font-bold text-sm text-white">Copy Link</button>
        <button id="ref-share" class="btn-press py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm">Share</button>
      </div>
      <div class="text-xs text-gray-500">Invites: <span class="font-bold text-white">${State.profile?.invites || 0}</span></div>
      <div class="text-[10px] text-gray-600">3 invites = 1 week of free Pro</div>
    </div>
  `, 'My Referral');

  document.getElementById('ref-copy').onclick = () => copyText(link, 'Link copied!');
  document.getElementById('ref-share').onclick = () => {
    shareContent('Join CODMPanda!', 'Use my code ' + code + ' to join the ultimate CODM companion.', link);
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// NOTIFICATION SETTINGS
// ============================================
function showNotificationSettings() {
  const p = State.profile || {};
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
        <div class="toggle ${p.notifLfg ? 'on' : ''}" onclick="toggleNotif('notifLfg', this)"></div>
      </div>
      <div class="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
        <div class="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
          <i data-lucide="zap" class="w-5 h-5 text-gold"></i>
        </div>
        <div class="flex-1">
          <div class="text-sm font-semibold">New Leaks</div>
          <div class="text-xs text-gray-500">Be first to know when intel drops</div>
        </div>
        <div class="toggle ${p.notifLeaks ? 'on' : ''}" onclick="toggleNotif('notifLeaks', this)"></div>
      </div>
    </div>
  `, 'Notifications');
  if (window.lucide) window.lucide.createIcons();
}

async function toggleNotif(key, el) {
  el.classList.toggle('on');
  const val = el.classList.contains('on');
  try {
    await updateDoc(doc(db, 'users', State.user.uid), { [key]: val });
    State.profile[key] = val;
  } catch (e) {
    toast('Failed', 'error');
    el.classList.toggle('on');
  }
}

// ============================================
// ADVANCED SETTINGS
// ============================================
function openAdvancedSettings() {
  const p = State.profile || {};
  const currentTheme = p.themeStyle || 'dark';

  openSheet(`
    <div class="space-y-4">
      <div class="bg-card border border-border rounded-2xl overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <div class="text-xs font-bold text-gray-400 uppercase">Privacy</div>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">Show Online Status</div>
              <div class="text-[10px] text-gray-500">Friends see when you're online</div>
            </div>
            <div class="toggle ${p.showOnline !== false ? 'on' : ''}" id="set-online"></div>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold">Private Profile</div>
              <div class="text-[10px] text-gray-500">Only friends see your stats</div>
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

      <div class="bg-card border border-border rounded-2xl p-4">
        <div class="text-xs font-bold text-gray-400 uppercase mb-3">App Info</div>
        <div class="space-y-2 text-[11px]">
          <div class="flex justify-between"><span class="text-gray-500">Version</span><span class="font-bold">${APP_VERSION}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">Environment</span><span class="font-bold text-green-400">Production</span></div>
          ${isPro() ? '<div class="flex justify-between"><span class="text-gray-500">Account</span><span class="font-bold text-gold">👑 Pro</span></div>' : ''}
        </div>
      </div>

      <button id="set-save" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">Save Preferences</button>
    </div>
  `, 'Advanced Settings');

  ['online', 'private', 'hide-lb'].forEach(key => {
    const el = document.getElementById('set-' + key);
    if (el) el.onclick = () => el.classList.toggle('on');
  });

  document.getElementById('set-save').onclick = async () => {
    try {
      const updates = {
        showOnline: document.getElementById('set-online').classList.contains('on'),
        privateProfile: document.getElementById('set-private').classList.contains('on'),
        hideLeaderboard: document.getElementById('set-hide-lb').classList.contains('on')
      };
      await updateDoc(doc(db, 'users', State.user.uid), updates);
      State.profile = { ...State.profile, ...updates };
      toast('Preferences saved', 'success');
      closeSheet();
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// CLEAR CACHE
// ============================================
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

// ============================================
// EXPORT DATA
// ============================================
function exportUserData() {
  const data = {
    profile: State.profile,
    camos: State.cache.camos,
    exportDate: new Date().toISOString(),
    version: APP_VERSION
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'codmpanda-' + State.user.uid.slice(0, 8) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported', 'success');
}

// ============================================
// BUG REPORT + FEATURE REQUEST
// ============================================
function openBugReportSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">What's wrong?</label>
        <textarea id="br-text" rows="5" maxlength="500" placeholder="Describe the bug in detail..."></textarea>
      </div>
      <button id="br-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">Send Report</button>
    </div>
  `, 'Report a Bug');

  document.getElementById('br-submit').onclick = async () => {
    const text = document.getElementById('br-text').value.trim();
    if (text.length < 5) { toast('Add more detail', 'error'); return; }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: State.user.uid,
        reporterIgn: State.profile.ign,
        reason: text,
        type: 'bug',
        status: 'open',
        createdAt: serverTimestamp()
      });
      toast('Bug report sent. Thanks!', 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

function openFeatureSheet() {
  openSheet(`
    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Your idea</label>
        <textarea id="fr-text" rows="5" maxlength="500" placeholder="What should we build?"></textarea>
      </div>
      <button id="fr-submit" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white">Send Request</button>
    </div>
  `, 'Request Feature');

  document.getElementById('fr-submit').onclick = async () => {
    const text = document.getElementById('fr-text').value.trim();
    if (text.length < 5) { toast('Add more detail', 'error'); return; }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: State.user.uid,
        reporterIgn: State.profile.ign,
        reason: text,
        type: 'feature',
        status: 'open',
        createdAt: serverTimestamp()
      });
      toast('Request sent. Thanks!', 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };

  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// SHARE APP
// ============================================
function shareApp() {
  const code = State.profile?.referralCode || '';
  const link = location.origin + '?ref=' + State.user.uid;
  const message = 'Check out CODMPanda — the ultimate CODM companion.\n\nFind squads, track camos, build gunsmiths.\n\n' + link + '\n\nUse my code: ' + code;

  if (navigator.share) {
    navigator.share({
      title: 'CODMPanda',
      text: message,
      url: link
    }).catch(() => copyText(message, 'Invite copied!'));
  } else {
    copyText(message, 'Invite copied!');
  }
}

// ============================================
// FAQ + TERMS + PRIVACY
// ============================================
function showFAQ() {
  const faqs = [
    { q: 'How do lobbies expire?', a: 'Lobbies auto-expire after 24 hours.' },
    { q: 'Is Pro worth it?', a: 'Unlimited vaults, full camo tracking, clans, tournaments, themes, zero ads.' },
    { q: 'How do referrals work?', a: 'Share your link. 3 invites = 1 week of free Pro.' },
    { q: 'Can I export my camo progress?', a: 'Yes! Lab → Camo Tracker → Export.' },
    { q: 'How do I report a bug?', a: 'Settings → Support → Report a Bug.' }
  ];
  openSheet(`
    <div class="space-y-3">
      ${faqs.map(f => `
        <div class="bg-card border border-border rounded-xl p-3">
          <div class="text-sm font-bold mb-1">${esc(f.q)}</div>
          <div class="text-xs text-gray-400">${esc(f.a)}</div>
        </div>
      `).join('')}
    </div>
  `, 'Help / FAQ');
  if (window.lucide) window.lucide.createIcons();
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
  if (window.lucide) window.lucide.createIcons();
}

function showTerms() {
  openSheet(`
    <div class="text-xs text-gray-400 space-y-3 leading-relaxed">
      <p><strong class="text-white">Terms of Service</strong></p>
      <p>CODMPanda is an unofficial companion app for Call of Duty Mobile. Not affiliated with Activision or Tencent.</p>
      <p>Do not post illegal, harassing, or NSFW content. Reports will be reviewed and accounts banned. Administrators reserve the right to remove any content that violates these terms.</p>
      <p>Pro purchases are final. Refunds only in case of technical failure.</p>
    </div>
  `, 'Terms');
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// DELETE ACCOUNT
// ============================================
function deleteAccount() {
  confirmDialog('Delete Account', 'This will permanently delete your profile, camos, vaults, and sign you out. Cannot be undone.', async () => {
    try {
      toast('Deleting...', 'info', 2000);
      await deleteDoc(doc(db, 'users', State.user.uid));
      await deleteDoc(doc(db, 'camos', State.user.uid));
      try { await deleteUser(State.user); } catch (e) { await signOut(auth); }
      location.reload();
    } catch (e) {
      console.error(e);
      toast('Delete failed: re-login and retry', 'error', 4000);
    }
  }, 'Delete Forever', true);
}

// ============================================
// EXPORT
// ============================================
window.renderYouTab = renderYouTab;
window.settingsRow = settingsRow;
window.handleSettingAction = handleSettingAction;
window.openEditProfileSheet = openEditProfileSheet;
window.showReferral = showReferral;
window.showNotificationSettings = showNotificationSettings;
window.toggleNotif = toggleNotif;
window.openAdvancedSettings = openAdvancedSettings;
window.clearCache = clearCache;
window.exportUserData = exportUserData;
window.openBugReportSheet = openBugReportSheet;
window.openFeatureSheet = openFeatureSheet;
window.shareApp = shareApp;
window.showFAQ = showFAQ;
window.showPrivacy = showPrivacy;
window.showTerms = showTerms;
window.deleteAccount = deleteAccount;

// ============================================
// END OF CHUNK 21/24
// ============================================
// ============================================
// CHUNK 22/24 — Inbox (Notifications + DMs)
// ⚙️ UPDATE HERE: inbox layout, DM thread design
// ============================================

let inboxTab = 'notifications';
let dmThreadUnsub = null;

// ============================================
// OPEN INBOX (full-screen overlay)
// ============================================
function openNotificationsPanel() {
  let overlay = document.getElementById('inbox-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'inbox-overlay';
    document.body.appendChild(overlay);

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
  } else {
    overlay.style.display = 'flex';
  }

  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 550;
    background: #050505;
    display: flex;
    flex-direction: column;
    animation: inboxSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  `;

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
        <div style="flex: 1; font-size: 20px; font-weight: 900; color: #fff;">Inbox</div>
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

  document.getElementById('inbox-close-btn').onclick = closeInboxOverlay;

  overlay.querySelectorAll('.inbox-tab-btn').forEach(btn => {
    btn.onclick = () => {
      inboxTab = btn.dataset.tab;
      openNotificationsPanel();
    };
  });

  renderInboxBody();
}

function closeInboxOverlay() {
  const overlay = document.getElementById('inbox-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease-out';
    setTimeout(() => overlay.remove(), 200);
  }
  if (dmThreadUnsub) {
    try { dmThreadUnsub(); } catch (e) {}
    dmThreadUnsub = null;
  }
}

function renderInboxBody() {
  if (inboxTab === 'notifications') renderNotificationsTab();
  else renderMessagesTab();
}

// ============================================
// NOTIFICATIONS TAB
// ============================================
async function renderNotificationsTab() {
  const body = document.getElementById('inbox-full-body');
  if (!body) return;

  body.innerHTML = '<div style="text-align: center; padding: 40px 0;"><div class="spinner" style="margin: 0 auto;"></div></div>';

  try {
    const snap = await getDocs(query(
      collection(db, 'notifications'),
      where('userId', '==', State.user.uid),
      limit(50)
    ));

    const notifs = [];
    snap.forEach(d => {
      const data = d.data();
      // Skip DM notifications — they go to Messages tab
      if (data.type === 'dm') return;
      notifs.push({ id: d.id, ...data });
    });
    notifs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (notifs.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 60px; margin-bottom: 12px;">🔔</div>
          <div style="font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 6px;">No notifications</div>
          <div style="font-size: 12px; color: #666;">You'll see updates here</div>
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
      reply: { emoji: '↩️', color: '#00BFFF' },
      lobby_join: { emoji: '🎮', color: '#FF6B00' },
      default: { emoji: '🔔', color: '#8E8E93' }
    };

    const unreadCount = notifs.filter(n => !n.read).length;

    body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 11px; color: #666; font-weight: 700;">${notifs.length} total${unreadCount > 0 ? ' · ' + unreadCount + ' unread' : ''}</div>
        ${unreadCount > 0 ? '<button id="mark-all-read" style="font-size: 11px; color: #FF6B00; font-weight: 800; background: none; border: none; cursor: pointer; font-family: Inter;">Mark all read</button>' : ''}
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${notifs.map(n => {
          const t = notifTypes[n.type] || notifTypes.default;
          const isUnread = !n.read;
          return `
            <div class="notif-item" data-id="${n.id}" data-type="${esc(n.type || '')}" data-data='${esc(JSON.stringify(n.data || {}))}' style="
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

    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) {
      markAllBtn.onclick = async () => {
        try {
          const updates = [];
          notifs.forEach(n => {
            if (!n.read) updates.push(updateDoc(doc(db, 'notifications', n.id), { read: true }));
          });
          await Promise.all(updates);
          toast('All marked read', 'success');
          if (typeof updateNotifBadge === 'function') updateNotifBadge();
          renderNotificationsTab();
        } catch (e) { toast('Failed', 'error'); }
      };
    }

    body.querySelectorAll('.notif-item').forEach(el => {
      el.onclick = async () => {
        const id = el.dataset.id;
        const type = el.dataset.type;
        let notifData = {};
        try { notifData = JSON.parse(el.dataset.data || '{}'); } catch (e) {}

        try {
          await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (e) {}

        if (typeof updateNotifBadge === 'function') updateNotifBadge();

        // Route based on type
        closeInboxOverlay();
        setTimeout(() => {
          if (type === 'comment' || type === 'reply' || type === 'mention') {
            if (notifData.contentType === 'post' && notifData.contentId) {
              if (typeof openPostDetail === 'function') openPostDetail(notifData.contentId);
            } else if (notifData.contentType === 'clip') {
              squadSubTab = 'clips';
              switchTab('squad');
            } else if (notifData.contentType === 'vault') {
              labSubTab = 'vault';
              switchTab('lab');
            } else if (notifData.contentType === 'lobby') {
              switchTab('play');
            }
          } else if (type === 'approval' || type === 'rejection') {
            if (notifData.contentType === 'vault') { labSubTab = 'vault'; switchTab('lab'); }
            else if (notifData.contentType === 'clip') { squadSubTab = 'clips'; switchTab('squad'); }
            else if (notifData.contentType === 'leak') { intelSubTab = 'leaks'; switchTab('intel'); }
          } else if (type === 'lobby_join' || type === 'party_invite') {
            switchTab('play');
          } else if (type === 'friend_request') {
            if (typeof showFriendsPanel === 'function') showFriendsPanel();
          } else if (type === 'leak') {
            intelSubTab = 'leaks';
            switchTab('intel');
          } else if (type === 'tournament' && notifData.tournamentId) {
            if (typeof openTournamentDetail === 'function') openTournamentDetail(notifData.tournamentId);
          }
        }, 250);
      };
    });
  } catch (e) {
    console.error('Notif tab error:', e);
    body.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44; font-size: 13px;">Failed to load</div>';
  }
}

// ============================================
// MESSAGES TAB (DMs)
// ============================================
async function renderMessagesTab() {
  const body = document.getElementById('inbox-full-body');
  if (!body) return;

  body.innerHTML = '<div style="text-align: center; padding: 40px 0;"><div class="spinner" style="margin: 0 auto;"></div></div>';

  try {
    // Get my friends
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
        setTimeout(() => { if (typeof showFriendsPanel === 'function') showFriendsPanel(); }, 300);
      };
      return;
    }

    // Fetch messages involving me
    const [snap1, snap2] = await Promise.all([
      getDocs(query(collection(db, 'messages'), where('fromUid', '==', State.user.uid), limit(100))),
      getDocs(query(collection(db, 'messages'), where('toUid', '==', State.user.uid), limit(100)))
    ]);

    const seen = new Set();
    const allMessages = [];
    snap1.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); allMessages.push({ id: d.id, ...d.data() }); } });
    snap2.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); allMessages.push({ id: d.id, ...d.data() }); } });

    // Group by chatId
    const grouped = {};
    allMessages.forEach(m => {
      if (!grouped[m.chatId]) grouped[m.chatId] = [];
      grouped[m.chatId].push(m);
    });

    const conversations = [];
    for (const chatId of Object.keys(grouped)) {
      const msgs = grouped[chatId].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      const last = msgs[msgs.length - 1];
      const parts = chatId.split('_');
      const otherUid = parts.find(p => p !== State.user.uid);
      if (!otherUid) continue;
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
        setTimeout(() => { if (typeof showFriendsPanel === 'function') showFriendsPanel(); }, 300);
        toast('Tap 💬 on a friend to start chatting', 'info', 3000);
      };
      return;
    }

    // Fetch friend data in parallel
    const friendData = await Promise.all(
      conversations.map(c => getDoc(doc(db, 'users', c.otherUid)).then(s => s.exists() ? { id: c.otherUid, ...s.data() } : null).catch(() => null))
    );

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
            <div class="conversation-item" data-uid="${f.id}" data-ign="${esc(f.ign)}" style="
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
                ${renderAvatar(f, 48)}
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

    body.querySelectorAll('.conversation-item').forEach(el => {
      el.onclick = () => {
        closeInboxOverlay();
        setTimeout(() => openDMThread(el.dataset.uid, el.dataset.ign), 300);
      };
    });

    const newChatBtn = document.getElementById('inbox-new-chat-btn');
    if (newChatBtn) {
      newChatBtn.onclick = () => {
        closeInboxOverlay();
        setTimeout(() => { if (typeof showFriendsPanel === 'function') showFriendsPanel(); }, 300);
        toast('Tap 💬 on a friend to start chatting', 'info', 3000);
      };
    }
  } catch (e) {
    console.error('Messages tab error:', e);
    body.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44; font-size: 13px;">Failed to load: ' + esc(e.message) + '</div>';
  }
}

// ============================================
// DM THREAD
// ============================================
async function openDMThread(friendUid, friendIgn) {
  const chatId = [State.user.uid, friendUid].sort().join('_');

  // Full-screen DM
  let overlay = document.getElementById('dm-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'dm-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 560;
    background: #050505;
    display: flex;
    flex-direction: column;
    animation: inboxSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  overlay.innerHTML = `
    <div style="
      padding-top: calc(env(safe-area-inset-top, 0px) + 12px);
      padding-bottom: 12px;
      padding-left: 16px;
      padding-right: 16px;
      border-bottom: 1px solid #222;
      background: #050505;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    ">
      <button id="dm-back-btn" class="btn-press" style="
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
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 15px; font-weight: 800; color: #fff;">${esc(friendIgn)}</div>
      </div>
    </div>

    <div id="dm-messages" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px;">
      <div style="text-align: center; padding: 40px 0;">
        <div class="spinner" style="margin: 0 auto;"></div>
      </div>
    </div>

    <div style="
      padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px) 16px;
      border-top: 1px solid #222;
      background: #050505;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    ">
      <input id="dm-input" type="text" placeholder="Message..." maxlength="500" style="
        flex: 1;
        background: #111;
        border: 1px solid #222;
        color: #fff;
        padding: 12px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-family: Inter;
        outline: none;
      " />
      <button id="dm-send" class="btn-press" style="
        width: 44px; height: 44px;
        border-radius: 50%;
        background: #FF6B00;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('dm-back-btn').onclick = closeDMThread;

  const messagesContainer = document.getElementById('dm-messages');

  const loadMessages = async () => {
    try {
      const snap = await getDocs(query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        limit(100)
      ));

      const messages = [];
      snap.forEach(d => messages.push({ id: d.id, ...d.data() }));
      messages.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      if (messages.length === 0) {
        messagesContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 40px; margin-bottom: 8px;">💬</div>
            <div style="font-size: 12px; color: #666;">Start the conversation</div>
          </div>
        `;
        return;
      }

      messagesContainer.innerHTML = messages.map(m => {
        const isMine = m.fromUid === State.user.uid;
        return `
          <div style="display: flex; justify-content: ${isMine ? 'flex-end' : 'flex-start'};">
            <div style="
              max-width: 75%;
              background: ${isMine ? '#FF6B00' : '#111'};
              border: ${isMine ? 'none' : '1px solid #222'};
              color: #fff;
              border-radius: 18px;
              padding: 10px 14px;
            ">
              <div style="font-size: 14px; word-break: break-word; white-space: pre-wrap;">${esc(m.text)}</div>
              <div style="font-size: 9px; margin-top: 4px; text-align: right; color: ${isMine ? 'rgba(255,255,255,0.7)' : '#666'};">${timeAgo(m.createdAt)}${m.edited ? ' · edited' : ''}</div>
            </div>
          </div>
        `;
      }).join('');

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (e) {
      console.error('DM load error:', e);
      messagesContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44; font-size: 12px;">Failed to load messages</div>';
    }
  };

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

      // Notify recipient (push only — DM doesn't log in-app)
      if (typeof sendNotificationToUser === 'function') {
        sendNotificationToUser(
          friendUid,
          '💬 ' + State.profile.ign,
          text.length > 60 ? text.slice(0, 60) + '...' : text,
          { type: 'dm', chatId }
        ).catch(() => {});
      }

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
}

function closeDMThread() {
  const overlay = document.getElementById('dm-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s';
    setTimeout(() => overlay.remove(), 200);
  }
}

// ============================================
// EXPORT
// ============================================
window.openNotificationsPanel = openNotificationsPanel;
window.closeInboxOverlay = closeInboxOverlay;
window.renderNotificationsTab = renderNotificationsTab;
window.renderMessagesTab = renderMessagesTab;
window.openDMThread = openDMThread;
window.closeDMThread = closeDMThread;

// ============================================
// END OF CHUNK 22/24
// ============================================
// ============================================
// CHUNK 23/24 — Admin Panel + Pro Payment
// ⚙️ UPDATE HERE: admin tools, report actions, paywall design
// ============================================

// ============================================
// PRO UPGRADE SHEET
// ============================================
function openUpgradeSheet() {
  const p = State.profile || {};
  if (p.isPro) { showManagePro(); return; }

  openSheet(`
    <div class="text-center space-y-4">
      <div style="font-size: 52px;">👑</div>
      <div>
        <h3 class="text-xl font-black text-gold mb-1">CODMPanda Pro</h3>
        <p class="text-xs text-gray-400">Unlock everything. Support the app.</p>
      </div>
    </div>

    <div class="bg-black/40 border border-gold/30 rounded-2xl p-4 mt-4 mb-4">
      <div class="text-xs text-gray-300 space-y-2">
        ${PRO.benefits.map(b => '<div class="flex items-center gap-2"><span class="text-gold">✦</span> ' + esc(b.text) + '</div>').join('')}
      </div>
    </div>

    <!-- Lifetime (best value) -->
    <div class="bg-gradient-to-br from-gold/10 to-black border border-gold/50 rounded-2xl p-4 mb-3 relative overflow-hidden">
      <div class="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded bg-gold text-black font-black z-10">BEST VALUE</div>
      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="text-sm font-black text-gold">Lifetime</div>
          <div class="text-[10px] text-gray-400">Pay once, Pro forever</div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-black text-gold">${PRO.price.lifetime}</div>
          <div class="text-[10px] text-gray-500">one-time</div>
        </div>
      </div>
      <button id="buy-lifetime-btn" class="btn-press w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black text-sm glow-gold">
        Unlock Lifetime
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
          <div class="text-xl font-black">${PRO.price.monthly}</div>
          <div class="text-[10px] text-gray-500">/ month</div>
        </div>
      </div>
      <button id="buy-monthly-btn" class="btn-press w-full py-3 rounded-xl bg-cardAlt border border-border font-bold text-sm">
        Subscribe Monthly
      </button>
    </div>

    <div class="text-[10px] text-gray-600 text-center">
      🔒 Secure payment via Lemon Squeezy<br>
      Cards · Apple Pay · Google Pay · PayPal
    </div>

    <div class="text-[10px] text-gray-600 text-center mt-3">
      Pro activates automatically within 1 minute
    </div>
  `, 'Upgrade to Pro');

  document.getElementById('buy-lifetime-btn').onclick = () => startPayment('lifetime');
  document.getElementById('buy-monthly-btn').onclick = () => startPayment('monthly');
  if (window.lucide) window.lucide.createIcons();
}

function startPayment(type) {
  const url = type === 'lifetime' ? PRO.links.lifetime : PRO.links.monthly;
  if (!url) { toast('Payment link missing', 'error'); return; }

  const uid = State.user.uid;
  const email = State.user.email || '';
  const sep = url.includes('?') ? '&' : '?';
  const finalUrl = url + sep + 'checkout[email]=' + encodeURIComponent(email) + '&checkout[custom][uid]=' + encodeURIComponent(uid);

  toast('Opening checkout...', 'info', 1500);
  window.open(finalUrl, '_blank');
  closeSheet();
  setTimeout(() => showPaymentPendingSheet(type), 500);
}

function showPaymentPendingSheet(type) {
  const isLifetime = type === 'lifetime';
  openSheet(`
    <div class="text-center space-y-4 py-4">
      <div style="font-size: 52px;">⏳</div>
      <div>
        <h3 class="text-lg font-black mb-1">Complete your payment</h3>
        <p class="text-xs text-gray-400">
          Finish checkout in the Lemon Squeezy tab. Your Pro activates automatically once payment confirms (30-60 seconds).
        </p>
      </div>

      <div class="bg-card border border-border rounded-xl p-3 text-left text-xs">
        <div class="text-gray-400 mb-1">Order summary:</div>
        <div class="flex justify-between">
          <span>CODMPanda Pro ${isLifetime ? 'Lifetime' : 'Monthly'}</span>
          <span class="font-bold text-gold">${isLifetime ? PRO.price.lifetime : PRO.price.monthly}</span>
        </div>
      </div>

      <button id="check-payment-btn" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold glow-primary text-white flex items-center justify-center gap-2">
        <i data-lucide="refresh-cw" class="w-4 h-4"></i> I've paid — check now
      </button>

      <button onclick="closeSheet()" class="text-xs text-gray-500">Cancel</button>

      <div class="text-[10px] text-gray-600 pt-2 border-t border-border">
        If your Pro doesn't activate instantly, it'll sync within 5 minutes.
      </div>
    </div>
  `, 'Awaiting Payment');

  document.getElementById('check-payment-btn').onclick = checkProStatus;
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
        toast('👑 Pro activated! Welcome.', 'success', 4000);
        closeSheet();
        if (State.currentTab === 'you') setTimeout(() => renderYouTab(), 500);
      } else {
        toast('Not confirmed yet. Wait 30s and try again.', 'warning', 4000);
      }
    }
  } catch (e) {
    toast('Check failed: ' + e.message, 'error');
  }
}

function showManagePro() {
  openSheet(`
    <div class="space-y-4">
      <div class="text-center">
        <div style="font-size: 52px; margin-bottom: 8px;">👑</div>
        <div class="text-lg font-black text-gold">Pro Member</div>
      </div>
      <div class="bg-cardAlt border border-border rounded-xl p-3 text-xs text-gray-400">
        Manage your subscription via Lemon Squeezy. Cancel anytime.
      </div>
      <button onclick="closeSheet()" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-white">Done</button>
    </div>
  `, 'Manage Pro');
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// PRO PAYWALL (shown when hitting a Pro feature)
// ============================================
function showProPaywall(message) {
  openSheet(`
    <div class="text-center space-y-4">
      <div style="font-size: 52px;">👑</div>
      <div>
        <h3 class="text-xl font-black text-gold mb-2">Pro Feature</h3>
        <p class="text-sm text-gray-400">${esc(message || 'Unlock this feature with Pro.')}</p>
      </div>
      <div class="bg-black/40 border border-gold/40 rounded-xl p-4 text-left">
        <div class="text-xs text-gray-300 space-y-1.5">
          ${PRO.benefits.slice(0, 6).map(b => '<div>✦ ' + esc(b.text) + '</div>').join('')}
        </div>
      </div>
      <button onclick="closeSheet(); openUpgradeSheet();" class="btn-press w-full py-4 rounded-2xl bg-gradient-to-r from-gold to-yellow-500 text-black font-black glow-gold">
        Go Pro — ${PRO.price.monthly}/mo
      </button>
      <button onclick="closeSheet()" class="text-xs text-gray-500">Maybe later</button>
    </div>
  `, '');
  if (window.lucide) window.lucide.createIcons();
}

// ============================================
// ADMIN — ANALYTICS DASHBOARD
// ============================================
async function showAdminAnalytics() {
  if (State.user?.uid !== ADMIN_UID) return;

  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', 'Analytics');

  try {
    const [
      usersSnap, lobbiesSnap, vaultsSnap, clipsSnap, leaksSnap,
      postsSnap, clansSnap, reportsSnap, subsSnap
    ] = await Promise.all([
      getDocs(collection(db, 'users')).catch(() => ({ size: 0, forEach: () => {} })),
      getDocs(collection(db, 'lobbies')).catch(() => ({ size: 0 })),
      getDocs(collection(db, 'vaults')).catch(() => ({ size: 0 })),
      getDocs(collection(db, 'clips')).catch(() => ({ size: 0 })),
      getDocs(collection(db, 'leaks')).catch(() => ({ size: 0 })),
      getDocs(collection(db, 'posts')).catch(() => ({ size: 0 })),
      getDocs(collection(db, 'clans')).catch(() => ({ size: 0 })),
      getDocs(query(collection(db, 'reports'), where('status', '==', 'open'))).catch(() => ({ size: 0 })),
      getDocs(collection(db, 'vault_submissions')).catch(() => ({ size: 0 }))
    ]);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let proCount = 0, dau = 0, wau = 0, mau = 0, newThisWeek = 0;
    const regionBreakdown = {};

    usersSnap.forEach(d => {
      const u = d.data();
      if (u.isPro) proCount++;
      const lastSeen = u.lastSeen?.seconds ? u.lastSeen.seconds * 1000 : 0;
      const createdAt = u.createdAt?.seconds ? u.createdAt.seconds * 1000 : 0;
      if (lastSeen > now - dayMs) dau++;
      if (lastSeen > now - 7 * dayMs) wau++;
      if (lastSeen > now - 30 * dayMs) mau++;
      if (createdAt > now - 7 * dayMs) newThisWeek++;
      const region = u.region || 'Unknown';
      regionBreakdown[region] = (regionBreakdown[region] || 0) + 1;
    });

    const sortedRegions = Object.entries(regionBreakdown).sort((a, b) => b[1] - a[1]);

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="space-y-4">
        <!-- Users -->
        <div class="bg-card border border-primary/40 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="users" class="w-4 h-4 text-primary"></i>
            <div class="text-xs font-bold text-primary uppercase">Users</div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-primary">${usersSnap.size}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Total</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-green-400">${dau}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Daily Active</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-blue-400">${wau}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Weekly</div>
            </div>
            <div class="bg-black/40 rounded-xl p-3">
              <div class="text-2xl font-black text-purple-400">${mau}</div>
              <div class="text-[10px] text-gray-500 font-bold uppercase">Monthly</div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div class="text-xs text-gray-400">New this week</div>
            <div class="text-sm font-bold text-green-400">+${newThisWeek}</div>
          </div>
        </div>

        <!-- Revenue -->
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

        <!-- Content -->
        <div class="bg-card border border-border rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <i data-lucide="database" class="w-4 h-4 text-orange-400"></i>
            <div class="text-xs font-bold text-orange-400 uppercase">Content</div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="bg-black/40 rounded-xl p-2.5 text-center">
              <div class="text-lg font-black text-orange-400">${lobbiesSnap.size}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase">Lobbies</div>
            </div>
            <div class="bg-black/40 rounded-xl p-2.5 text-center">
              <div class="text-lg font-black text-primary">${vaultsSnap.size}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase">Vaults</div>
            </div>
            <div class="bg-black/40 rounded-xl p-2.5 text-center">
              <div class="text-lg font-black text-blue-400">${postsSnap.size}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase">Posts</div>
            </div>
            <div class="bg-black/40 rounded-xl p-2.5 text-center">
              <div class="text-lg font-black text-purple-400">${clipsSnap.size}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase">Clips</div>
            </div>
            <div class="bg-black/40 rounded-xl p-2.5 text-center">
              <div class="text-lg font-black text-gold">${leaksSnap.size}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase">Leaks</div>
            </div>
            <div class="bg-black/40 rounded-xl p-2.5 text-center">
              <div class="text-lg font-black text-green-400">${clansSnap.size}</div>
              <div class="text-[9px] text-gray-500 font-bold uppercase">Clans</div>
            </div>
          </div>
        </div>

        <!-- Moderation -->
        <div class="bg-card border ${reportsSnap.size > 0 ? 'border-yellow-500/50' : 'border-border'} rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <i data-lucide="flag" class="w-4 h-4 text-yellow-400"></i>
              <div class="text-xs font-bold text-yellow-400 uppercase">Moderation</div>
            </div>
            ${reportsSnap.size > 0 ? '<span class="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500 text-black font-black">' + reportsSnap.size + '</span>' : ''}
          </div>
          <div class="text-xs text-gray-400 mb-3">${reportsSnap.size} open report${reportsSnap.size === 1 ? '' : 's'}</div>
          <button id="goto-reports-btn" class="btn-press w-full py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-xs">
            Review Reports
          </button>
        </div>

        <!-- Regions -->
        ${sortedRegions.length > 0 ? `
          <div class="bg-card border border-border rounded-2xl p-4">
            <div class="flex items-center gap-2 mb-3">
              <i data-lucide="globe" class="w-4 h-4 text-blue-400"></i>
              <div class="text-xs font-bold text-blue-400 uppercase">By Region</div>
            </div>
            <div class="space-y-2">
              ${sortedRegions.slice(0, 8).map(([region, count]) => {
                const pct = Math.round((count / usersSnap.size) * 100);
                return `
                  <div>
                    <div class="flex items-center justify-between text-[11px] mb-1">
                      <span class="text-gray-300">${esc(region)}</span>
                      <span class="font-bold">${count} (${pct}%)</span>
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

        <button id="refresh-analytics" class="btn-press w-full py-3 rounded-2xl bg-cardAlt border border-border font-bold text-xs">
          <i data-lucide="refresh-cw" class="w-3.5 h-3.5 inline mr-1"></i> Refresh
        </button>
      </div>
    `;

    const reportsBtn = document.getElementById('goto-reports-btn');
    if (reportsBtn) reportsBtn.onclick = () => { closeSheet(); setTimeout(showAdminReports, 300); };

    document.getElementById('refresh-analytics').onclick = () => { closeSheet(); setTimeout(showAdminAnalytics, 300); };

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Analytics error:', e);
    toast('Failed to load analytics', 'error');
  }
}

// ============================================
// ADMIN — REPORTS QUEUE
// ============================================
async function showAdminReports() {
  if (State.user?.uid !== ADMIN_UID) return;

  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', 'Reports');

  try {
    const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50)));
    const reports = [];
    snap.forEach(d => reports.push({ id: d.id, ...d.data() }));

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    if (reports.length === 0) {
      sheetBody.innerHTML = '<div class="text-center py-8 text-xs text-gray-500">No reports — clean slate</div>';
      return;
    }

    sheetBody.innerHTML = `
      <div class="text-xs text-gray-500 mb-4">${reports.length} total</div>
      <div class="space-y-3">
        ${reports.map(r => `
          <div class="bg-card border border-border rounded-xl p-3">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-bold uppercase">${esc(r.type || 'report')}</span>
              <span class="text-[10px] text-gray-500">${timeAgo(r.createdAt)}</span>
              ${r.status === 'resolved' ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-bold uppercase">RESOLVED</span>' : ''}
            </div>
            <div class="text-xs text-gray-300 mb-2">${esc(r.reason)}</div>
            <div class="text-[10px] text-gray-600 mb-3">
              ${r.targetType ? 'Type: ' + esc(r.targetType) + ' · ' : ''}
              ${r.targetUid ? 'UID: ' + esc(r.targetUid.slice(0, 12)) + '...' : ''}
            </div>
            ${r.status !== 'resolved' ? `
              <div class="flex gap-2">
                <button class="report-dismiss-btn flex-1 py-2 rounded-lg bg-gray-500/15 border border-gray-500/30 text-gray-400 text-xs font-bold" data-id="${r.id}">
                  Dismiss
                </button>
                ${r.targetId && r.targetType ? `
                  <button class="report-takedown-btn flex-1 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold" data-id="${r.id}" data-target-id="${esc(r.targetId)}" data-target-type="${esc(r.targetType)}">
                    Takedown
                  </button>
                ` : ''}
                ${r.targetUid ? `
                  <button class="report-ban-btn flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold" data-id="${r.id}" data-uid="${esc(r.targetUid)}" data-ign="${esc(r.reporterIgn || 'user')}">
                    Ban
                  </button>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    // Wire dismiss
    sheetBody.querySelectorAll('.report-dismiss-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await updateDoc(doc(db, 'reports', btn.dataset.id), { status: 'resolved', resolvedAt: serverTimestamp(), resolvedBy: State.user.uid });
          toast('Report dismissed', 'success');
          btn.closest('.bg-card').style.opacity = '0.5';
          btn.disabled = true;
        } catch (e) { toast('Failed', 'error'); }
      };
    });

    // Wire takedown
    sheetBody.querySelectorAll('.report-takedown-btn').forEach(btn => {
      btn.onclick = () => {
        confirmDialog('Takedown Content', 'Delete this content permanently?', async () => {
          try {
            const collectionMap = { post: 'posts', vault: 'vaults', clip: 'clips', leak: 'leaks', lobby: 'lobbies' };
            const collection = collectionMap[btn.dataset.targetType];
            if (collection) {
              await deleteDoc(doc(db, collection, btn.dataset.targetId));
            }
            await updateDoc(doc(db, 'reports', btn.dataset.id), { status: 'resolved', resolvedAt: serverTimestamp(), resolvedBy: State.user.uid });
            toast('Content taken down', 'success');
            btn.closest('.bg-card').style.opacity = '0.5';
          } catch (e) { toast('Failed: ' + e.message, 'error'); }
        }, 'Delete', true);
      };
    });

    // Wire ban
    sheetBody.querySelectorAll('.report-ban-btn').forEach(btn => {
      btn.onclick = () => {
        confirmDialog('Ban User', 'Ban this user permanently?', async () => {
          try {
            await updateDoc(doc(db, 'users', btn.dataset.uid), {
              banned: true,
              bannedAt: serverTimestamp(),
              bannedBy: State.user.uid,
              banReason: 'Reported violation'
            });
            await updateDoc(doc(db, 'reports', btn.dataset.id), { status: 'resolved', resolvedAt: serverTimestamp(), resolvedBy: State.user.uid });
            toast('User banned', 'success');
            btn.closest('.bg-card').style.opacity = '0.5';
          } catch (e) { toast('Failed: ' + e.message, 'error'); }
        }, 'Ban', true);
      };
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Reports error:', e);
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load</div>';
  }
}

// ============================================
// ADMIN — USERS LIST
// ============================================
async function showAdminUsers() {
  if (State.user?.uid !== ADMIN_UID) return;

  openSheet('<div class="text-center py-8"><div class="spinner mx-auto"></div></div>', 'Users');

  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100)));
    const users = [];
    snap.forEach(d => users.push({ id: d.id, ...d.data() }));

    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (!sheetBody) return;

    sheetBody.innerHTML = `
      <div class="text-xs text-gray-500 mb-3">${users.length} total users</div>
      <div class="space-y-2">
        ${users.map(u => `
          <div class="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            ${renderAvatar(u, 36)}
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold truncate flex items-center gap-1.5">
                ${esc(u.ign || 'Unknown')}
                ${u.isPro ? '<span class="text-[8px] px-1 py-0.5 rounded bg-gold text-black font-black">PRO</span>' : ''}
                ${u.banned ? '<span class="text-[8px] px-1 py-0.5 rounded bg-red-500 text-white font-black">BANNED</span>' : ''}
              </div>
              <div class="text-[10px] text-gray-500 truncate">${esc(u.rank || '—')} · ${esc(u.region || '—')} · ${u.approvedCount || 0} approved</div>
            </div>
            <div class="text-[9px] text-gray-600 font-mono">${u.id.slice(0, 6)}</div>
          </div>
        `).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.error('Users error:', e);
    const sheetBody = document.querySelector('#sheet-container .px-5');
    if (sheetBody) sheetBody.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Failed to load</div>';
  }
}

// ============================================
// EXPORT
// ============================================
window.openUpgradeSheet = openUpgradeSheet;
window.showProPaywall = showProPaywall;
window.showManagePro = showManagePro;
window.showAdminAnalytics = showAdminAnalytics;
window.showAdminReports = showAdminReports;
window.showAdminUsers = showAdminUsers;
window.startPayment = startPayment;
window.checkProStatus = checkProStatus;

// ============================================
// END OF CHUNK 23/24
// ============================================
// ============================================
// CHUNK 24/24 — Boot + Deep Links + Final Wiring
// ⚙️ UPDATE HERE: app boot sequence, deep links
// ============================================

// ============================================
// PRELOAD JITSI (for faster voice join)
// ============================================
setTimeout(() => {
  if (!window.JitsiMeetExternalAPI) {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    document.head.appendChild(script);
  }
}, 10000);

// ============================================
// DEEP LINKS
// ============================================
function handleDeepLinks() {
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab');
  const vault = params.get('vault');
  const post = params.get('post');
  const clip = params.get('clip');
  const leak = params.get('leak');
  const lobby = params.get('lobby');
  const user = params.get('user');

  // Route to tab
  if (tab && ['home', 'play', 'lab', 'squad', 'intel', 'you'].includes(tab)) {
    setTimeout(() => switchTab(tab), 800);
  }

  // Open specific content
  if (vault) {
    setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'vaults', vault));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          State.cache.vaults = State.cache.vaults || [];
          if (!State.cache.vaults.find(v => v.id === data.id)) {
            State.cache.vaults.unshift(data);
          }
          labSubTab = 'vault';
          switchTab('lab');
          setTimeout(() => {
            if (typeof openVaultDetail === 'function') openVaultDetail(vault);
          }, 800);
        } else {
          toast('Build not found', 'warning');
        }
      } catch (e) { console.error('Vault deep link error:', e); }
    }, 1500);
  }

  if (post) {
    setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'posts', post));
        if (snap.exists()) {
          switchTab('home');
          setTimeout(() => {
            if (typeof openPostDetail === 'function') openPostDetail(post);
          }, 800);
        }
      } catch (e) { /* silent */ }
    }, 1500);
  }

  if (user) {
    setTimeout(() => {
      if (typeof openUserProfile === 'function') openUserProfile(user);
    }, 1500);
  }
}

// ============================================
// REFERRAL TRACKING
// ============================================
async function trackReferral() {
  const params = new URLSearchParams(location.search);
  const ref = params.get('ref');
  if (!ref || !State.user || ref === State.user.uid) return;

  const key = 'codmpanda_ref_tracked_' + ref;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');

  try {
    // Increment inviter's invite count
    await updateDoc(doc(db, 'users', ref), { invites: increment(1) });

    // Check for Pro reward (3 invites = 1 week Pro)
    const refSnap = await getDoc(doc(db, 'users', ref));
    if (refSnap.exists()) {
      const currentInvites = (refSnap.data().invites || 0);
      if (currentInvites > 0 && currentInvites % 3 === 0) {
        await updateDoc(doc(db, 'users', ref), {
          isPro: true,
          proExpiry: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Notify the inviter
        if (typeof sendNotificationToUser === 'function') {
          sendNotificationToUser(
            ref,
            '👑 You Earned Pro!',
            'You got 3 invites — enjoy a free week of Pro!',
            { type: 'default' }
          ).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn('Referral tracking failed:', e);
  }
}

// ============================================
// STARTUP TASKS
// ============================================
async function runStartupTasks() {
  if (!State.user) return;

  // Update last seen
  setTimeout(updateLastSeen, 1000);

  // Load user likes
  setTimeout(() => {
    if (typeof loadUserReactions === 'function') loadUserReactions();
  }, 2000);

  // Start notification listener
  setTimeout(() => {
    if (typeof startNotifCountListener === 'function') startNotifCountListener();
  }, 3000);

  // Deep links
  setTimeout(handleDeepLinks, 1200);

  // Referral tracking
  setTimeout(trackReferral, 2000);

  // Prime profile stats cache (for share card)
  setTimeout(primeProfileStats, 4000);
}

async function primeProfileStats() {
  if (!State.user) return;
  try {
    const [vaultSnap, camoSnap] = await Promise.all([
      getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid))).catch(() => ({ size: 0 })),
      getDoc(doc(db, 'camos', State.user.uid)).catch(() => ({ exists: () => false }))
    ]);

    State.stats.vaultCount = vaultSnap.size;

    if (camoSnap.exists && camoSnap.exists()) {
      const totalPossible = ALL_GUNS.length * CAMO_TYPES.length;
      let checked = 0;
      Object.values(camoSnap.data()).forEach(gun => {
        if (typeof gun === 'object') {
          CAMO_TYPES.forEach(c => { if (gun[c.key]) checked++; });
        }
      });
      State.stats.camoPct = Math.round((checked / totalPossible) * 100);
    }
  } catch (e) { /* silent */ }
}

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

// ============================================
// NETWORK STATUS
// ============================================
let isOnline = navigator.onLine;

window.addEventListener('online', () => {
  if (!isOnline) {
    isOnline = true;
    toast('Back online', 'success', 2000);
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  toast('You are offline', 'warning', 3000);
});

// ============================================
// PREVENT DOUBLE-TAP ZOOM ON iOS
// ============================================
document.addEventListener('gesturestart', (e) => e.preventDefault());

// ============================================
// BACK BUTTON HANDLER
// ============================================
if (!window.__backBtnHandler) {
  window.__backBtnHandler = true;

  try {
    if (!history.state || !history.state.__codm) {
      history.pushState({ __codm: true }, '');
    }
  } catch (e) {}

  window.addEventListener('popstate', (e) => {
    // 1. Close photo viewer
    if (document.getElementById('photo-viewer')) return;

    // 2. Close post detail
    if (document.getElementById('post-detail-overlay')) {
      if (typeof closePostDetail === 'function') closePostDetail();
      try { history.pushState({ __codm: true }, ''); } catch (err) {}
      return;
    }

    // 3. Close DM thread
    if (document.getElementById('dm-overlay')) {
      if (typeof closeDMThread === 'function') closeDMThread();
      try { history.pushState({ __codm: true }, ''); } catch (err) {}
      return;
    }

    // 4. Close inbox
    if (document.getElementById('inbox-overlay')) {
      if (typeof closeInboxOverlay === 'function') closeInboxOverlay();
      try { history.pushState({ __codm: true }, ''); } catch (err) {}
      return;
    }

    // 5. Minimize voice room
    if (window.voiceRoomState && voiceRoomState.active && !voiceRoomState.minimized) {
      if (typeof minimizeVoiceRoom === 'function') minimizeVoiceRoom();
      try { history.pushState({ __codm: true }, ''); } catch (err) {}
      return;
    }

    // 6. Close sheet
    const sheet = document.getElementById('sheet-container');
    if (sheet && !sheet.classList.contains('hidden')) {
      closeSheet();
      try { history.pushState({ __codm: true }, ''); } catch (err) {}
      return;
    }

    // 7. Close modal
    const modal = document.getElementById('modal-container');
    if (modal && !modal.classList.contains('hidden')) {
      closeModal();
      try { history.pushState({ __codm: true }, ''); } catch (err) {}
      return;
    }

    // 8. If on non-home tab → go home
    if (State.currentTab && State.currentTab !== 'home') {
      switchTab('home');
      try { history.pushState({ __codm: true }, ''); } catch (err) {}
      return;
    }

    // 9. Otherwise allow exit
  });
}

// ============================================
// APP BOOT
// ============================================
async function boot() {
  // Splash timeout — hide after 3s regardless
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash && !splash.classList.contains('hidden')) {
      splash.classList.add('hidden');
    }
  }, 2000);

  // Wire sign-in button (in case auth-gate is visible)
  const signBtn = document.getElementById('google-signin-btn');
  if (signBtn && !signBtn.dataset.bound) {
    signBtn.dataset.bound = '1';
    signBtn.onclick = handleSignIn;
  }

  // Check for redirect sign-in result
  try {
    await checkRedirect();
  } catch (e) {}

  // Ensure Lucide icons render
  if (window.lucide) window.lucide.createIcons();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  }

  console.log('%c🐼 CODMPanda v' + APP_VERSION + ' loaded', 'color:#FF6B00;font-weight:bold;font-size:14px');
}

// ============================================
// HOOK STARTUP INTO SHOW MAIN APP
// ============================================
const _origShowMainApp24 = showMainApp;
showMainApp = function() {
  _origShowMainApp24();
  setTimeout(runStartupTasks, 500);
};

// ============================================
// INIT
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// ============================================
// EXPORT
// ============================================
window.handleDeepLinks = handleDeepLinks;
window.trackReferral = trackReferral;
window.runStartupTasks = runStartupTasks;

console.log('%c✅ CODMPanda loaded — 24/24 chunks complete', 'color:#FFD700;font-weight:bold;font-size:12px');

// ============================================
// END OF CHUNK 24/24
// ============================================
// 🎉 APP COMPLETE 🎉
// ============================================
// ============================================
// CHUNK 25a/24 — 3D Gunsmith Preview (Core Viewer)
// ⚙️ UPDATE HERE: model loading, camera, gestures
// ============================================

// ============================================
// 3D PREVIEW STATE
// ============================================
const Preview3DState = {
  gunName: null,
  attachments: {},
  activeSlot: null,
  three: null,
  scene: null,
  camera: null,
  renderer: null,
  gunModel: null,
  attachmentMeshes: {},
  controls: { theta: 0, phi: 0.25, dist: 4.4, target: { x: 0, y: 0, z: 0 } },
  loaded: false,
  dragged: false,
  lastTouchDist: 0,
  pointerX: 0,
  pointerY: 0
};

// ============================================
// CDN LOADER (Three.js)
// ============================================
const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const GLTF_LOADER_CDN = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ============================================
// MODEL URL RESOLVER
// ============================================
// Tries jsDelivr first (fast). Falls back to raw GitHub.
const GITHUB_USER = 'B0bbybr0wn';
const GITHUB_REPO = 'codmpanda';
const GITHUB_BRANCH = 'main';

function getModelUrls(filename) {
  return [
    'https://cdn.jsdelivr.net/gh/' + GITHUB_USER + '/' + GITHUB_REPO + '@' + GITHUB_BRANCH + '/' + filename,
    'https://raw.githubusercontent.com/' + GITHUB_USER + '/' + GITHUB_REPO + '/' + GITHUB_BRANCH + '/' + filename
  ];
}

// ============================================
// OPEN 3D PREVIEW
// ============================================
async function open3DPreview(gunName, attachments) {
  if (!gunName) {
    toast('Pick a gun first', 'warning');
    return;
  }

  Preview3DState.gunName = gunName;
  Preview3DState.attachments = attachments || {};
  Preview3DState.activeSlot = null;
  Preview3DState.attachmentMeshes = {};

  // Full-screen overlay
  let overlay = document.getElementById('preview3d-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'preview3d-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:600;background:#050505;display:flex;flex-direction:column;';

  overlay.innerHTML = `
    <div style="padding-top:calc(env(safe-area-inset-top,0px) + 12px);padding-bottom:12px;padding-left:16px;padding-right:16px;border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:12px;flex-shrink:0;">
      <button id="p3d-close-btn" class="btn-press" style="width:40px;height:40px;border-radius:12px;background:#111;border:1px solid #222;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      </button>
      <div style="flex:1;min-width:0;">
        <div style="font-size:15px;font-weight:800;color:#fff;">${esc(gunName)}</div>
        <div style="font-size:10px;color:#666;">3D Preview</div>
      </div>
      <div id="p3d-status" style="font-size:10px;color:#FF6B00;font-weight:700;">Loading...</div>
    </div>

    <div id="p3d-viewer" style="flex:1;position:relative;touch-action:none;background:radial-gradient(ellipse at 50% 40%, #1a2634 0%, #050505 70%);">
      <div id="p3d-loading" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
        <div class="spinner"></div>
        <div style="font-size:11px;color:#666;">Loading 3D model...</div>
      </div>
    </div>

    <div style="padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 12px) 16px;border-top:1px solid #1a1a1a;background:#050505;flex-shrink:0;">
      <div id="p3d-slots" style="display:flex;gap:8px;overflow-x:auto;margin-bottom:10px;" class="no-scrollbar">
        ${GUNSMITH_SLOTS.map(slot => {
          const picked = Preview3DState.attachments[slot.key];
          return `
            <button class="p3d-slot-btn chip ${picked ? 'active' : ''}" data-slot="${slot.key}" style="flex-shrink:0;">
              ${slot.label}${picked ? ' ✓' : ''}
            </button>
          `;
        }).join('')}
      </div>
      <div id="p3d-hint" style="font-size:10px;color:#666;text-align:center;">
        Drag to rotate · Pinch to zoom
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Wire close
  document.getElementById('p3d-close-btn').onclick = close3DPreview;

  // Wire slots
  overlay.querySelectorAll('.p3d-slot-btn').forEach(btn => {
    btn.onclick = () => {
      Preview3DState.activeSlot = btn.dataset.slot;
      openAttachmentPicker(btn.dataset.slot);
    };
  });

  // Start loading Three.js
  try {
    await loadScript(THREE_CDN);
    await loadScript(GLTF_LOADER_CDN);
  } catch (e) {
    document.getElementById('p3d-status').textContent = 'Failed to load 3D';
    console.error('Three.js load error:', e);
    return;
  }

  init3DScene(gunName);
}

// ============================================
// CLOSE 3D PREVIEW
// ============================================
function close3DPreview() {
  if (Preview3DState.renderer) {
    try {
      Preview3DState.renderer.dispose();
    } catch (e) {}
  }

  const overlay = document.getElementById('preview3d-overlay');
  if (overlay) overlay.remove();

  Preview3DState.three = null;
  Preview3DState.scene = null;
  Preview3DState.camera = null;
  Preview3DState.renderer = null;
  Preview3DState.gunModel = null;
  Preview3DState.attachmentMeshes = {};
  Preview3DState.loaded = false;
}

// ============================================
// INIT 3D SCENE
// ============================================
async function init3DScene(gunName) {
  const container = document.getElementById('p3d-viewer');
  if (!container || !window.THREE) return;

  const THREE = window.THREE;

  // Scene
  const scene = new THREE.Scene();
  scene.background = null;

  // Camera
  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.01, 100);
  camera.position.set(2.5, 1.55, 3.5);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.HemisphereLight(0xd8f2ff, 0x202733, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(2, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x45dfff, 1.6);
  rim.position.set(-3, 1, -3);
  scene.add(rim);

  // Floor grid
  const floor = new THREE.GridHelper(8, 24, 0x294554, 0x172a35);
  floor.position.y = -0.65;
  scene.add(floor);

  Preview3DState.three = THREE;
  Preview3DState.scene = scene;
  Preview3DState.camera = camera;
  Preview3DState.renderer = renderer;

  // Load model
  loadGunModel(gunName);

  // Wire gestures
  setup3DGestures(renderer.domElement, container);

  // Resize handler
  const onResize = () => {
    if (!container || !renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  // Animation loop
  function animate() {
    if (!Preview3DState.renderer) return;
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}

// ============================================
// LOAD GUN MODEL (jsDelivr → raw fallback)
// ============================================
async function loadGunModel(gunName) {
  const filename = getGunModel(gunName);
  const urls = getModelUrls(filename);

  const statusEl = document.getElementById('p3d-status');
  const loadingEl = document.getElementById('p3d-loading');

  const THREE = Preview3DState.three;
  const loader = new THREE.GLTFLoader();

  let loaded = false;
  for (const url of urls) {
    try {
      await new Promise((resolve, reject) => {
        loader.load(url,
          (gltf) => {
            installGunModel(gltf.scene);
            if (statusEl) statusEl.textContent = 'Ready';
            if (loadingEl) loadingEl.style.display = 'none';
            loaded = true;
            resolve();
          },
          undefined,
          (err) => {
            console.warn('Failed to load from:', url, err);
            reject(err);
          }
        );
      });
      if (loaded) break;
    } catch (e) {
      console.warn('Model URL failed, trying next...');
    }
  }

  if (!loaded) {
    if (statusEl) statusEl.textContent = 'Model not found';
    if (loadingEl) loadingEl.innerHTML = '<div style="font-size:12px;color:#f44;text-align:center;padding:20px;">Model not available<br><span style="color:#666;font-size:10px;">Check your connection</span></div>';
  }
}

// ============================================
// INSTALL GUN MODEL INTO SCENE
// ============================================
function installGunModel(obj) {
  const THREE = Preview3DState.three;
  const scene = Preview3DState.scene;
  if (!scene) return;

  // Normalize
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  const max = Math.max(size.x, size.y, size.z) || 1;
  obj.scale.setScalar(2.5 / max);

  scene.add(obj);
  Preview3DState.gunModel = obj;
  Preview3DState.loaded = true;

  // Apply finish
  applyFinishToModel(obj, false);
}

// ============================================
// APPLY FINISH TO MODEL
// ============================================
function applyFinishToModel(obj, mythic) {
  if (!obj) return;
  const THREE = Preview3DState.three;
  obj.traverse(o => {
    if (o.isMesh && o.material) {
      o.material = o.material.clone();
      if (mythic) {
        o.material.emissive = new THREE.Color(0x00bde5);
        o.material.emissiveIntensity = 0.45;
        o.material.metalness = 0.75;
        o.material.roughness = 0.25;
      } else {
        o.material.emissive = new THREE.Color(0x000000);
        o.material.emissiveIntensity = 0;
      }
    }
  });
}

// ============================================
// 3D GESTURES (rotate + zoom)
// ============================================
function setup3DGestures(canvas, container) {
  let drag = false;

  canvas.addEventListener('pointerdown', (e) => {
    drag = true;
    Preview3DState.pointerX = e.clientX;
    Preview3DState.pointerY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - Preview3DState.pointerX;
    const dy = e.clientY - Preview3DState.pointerY;
    Preview3DState.controls.theta -= dx * 0.009;
    Preview3DState.controls.phi += dy * 0.008;
    Preview3DState.controls.phi = Math.max(-0.9, Math.min(1.1, Preview3DState.controls.phi));
    Preview3DState.pointerX = e.clientX;
    Preview3DState.pointerY = e.clientY;
    update3DCamera();
  });

  canvas.addEventListener('pointerup', () => { drag = false; });
  canvas.addEventListener('pointercancel', () => { drag = false; });

  // Wheel zoom (desktop)
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    Preview3DState.controls.dist = Math.max(2.2, Math.min(9, Preview3DState.controls.dist + e.deltaY * 0.005));
    update3DCamera();
  }, { passive: false });

  // Pinch zoom
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (Preview3DState.lastTouchDist) {
        const diff = dist - Preview3DState.lastTouchDist;
        Preview3DState.controls.dist = Math.max(2.2, Math.min(9, Preview3DState.controls.dist - diff * 0.012));
        update3DCamera();
      }
      Preview3DState.lastTouchDist = dist;
    }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    Preview3DState.lastTouchDist = 0;
  });
}

// ============================================
// UPDATE 3D CAMERA FROM CONTROLS
// ============================================
function update3DCamera() {
  const { theta, phi, dist, target } = Preview3DState.controls;
  const cam = Preview3DState.camera;
  if (!cam) return;

  cam.position.set(
    target.x + dist * Math.sin(theta) * Math.cos(phi),
    target.y + dist * Math.sin(phi),
    target.z + dist * Math.cos(theta) * Math.cos(phi)
  );
  cam.lookAt(target.x, target.y, target.z);
}

// ============================================
// EXPORT 25a
// ============================================
window.Preview3DState = Preview3DState;
window.open3DPreview = open3DPreview;
window.close3DPreview = close3DPreview;
window.init3DScene = init3DScene;
window.loadGunModel = loadGunModel;
window.installGunModel = installGunModel;
window.setup3DGestures = setup3DGestures;
window.update3DCamera = update3DCamera;
window.applyFinishToModel = applyFinishToModel;
window.loadScript = loadScript;
window.getModelUrls = getModelUrls;

// ============================================
// END OF CHUNK 25a/24
// ============================================
// ============================================
// CHUNK 25b/24 — 3D Gunsmith Preview (Drag + Save)
// ⚙️ UPDATE HERE: attachment positions, drag sensitivity, save rules
// ============================================

// ============================================
// REAL ATTACHMENT 3D MODELS (embedded OBJ data)
// ============================================
const REAL_ATTACHMENT_OBJS = {
  "Reflex Sight": `# Blender v2.81 (sub 16) OBJ File: 'Low Poly assets.blend'
mtllib Reflex_Sight.mtl
o Reflex_Sight_Cube.028
v -0.021588 -0.011407 0.042829
v -0.021588 -0.011407 -0.050206
v 0.021588 -0.011407 0.042829
v 0.021588 -0.011407 -0.050206
v -0.021588 -0.011407 0.021575
v -0.020101 0.047497 0.021736
v 0.021588 -0.011407 0.021575
v 0.020101 0.047497 0.021736
v -0.021588 0.015293 -0.050206
v 0.021588 0.015293 -0.050206
v 0.021588 0.015293 0.025270
v -0.021588 0.015293 0.025270
v -0.020101 0.015293 0.042390
v -0.020101 0.047554 0.032798
v 0.020101 0.047554 0.032798
v 0.020101 0.015293 0.042390
v -0.021588 0.015293 0.042829
v -0.021588 0.048975 0.032359
v 0.021588 0.048975 0.032359
v -0.021588 0.048975 0.021575
v 0.021588 0.048975 0.021575
v 0.021588 0.015293 0.042829
v 0.020101 0.015293 0.025109
v -0.020101 0.015293 0.025109
v 0.020101 0.015293 0.030690
v 0.020101 0.015293 0.033598
v -0.020101 0.015293 0.030690
v -0.020101 0.015293 0.033598
v 0.020101 0.047535 0.028544
v 0.020101 0.047516 0.026682
v -0.020101 0.047535 0.028544
v -0.020101 0.047516 0.026682
vn 1.0000 0.0000 0.0000
vn 0.0000 -1.0000 0.0000
vn 0.0000 1.0000 0.0000
vn -1.0000 0.0000 0.0000
vn 0.0000 0.0000 1.0000
vn 0.0000 0.0000 -1.0000
usemtl Dark_Gray
s off
f 11//1 21//1 19//1 22//1
f 5//2 7//2 3//2 1//2
f 21//3 20//3 18//3 19//3
f 2//2 4//2 7//2 5//2
f 17//4 18//4 20//4 12//4
f 1//4 17//4 12//4 5//4
f 4//1 10//1 11//1 7//1
f 3//5 22//5 17//5 1//5
f 7//1 11//1 22//1 3//1
f 2//6 9//6 10//6 4//6
f 5//4 12//4 9//4 2//4
f 17//3 22//3 11//3 10//3 9//3 12//3
`,
  "Muzzle Brake": `# Muzzle
o Muzzle
v -0.05 -0.05 0.2
v 0.05 -0.05 0.2
v -0.05 0.05 0.2
v 0.05 0.05 0.2
v -0.05 -0.05 0.1
v 0.05 -0.05 0.1
v -0.05 0.05 0.1
v 0.05 0.05 0.1
f 1 2 4 3
f 5 7 8 6
f 1 3 7 5
f 2 6 8 4
f 1 5 6 2
f 3 4 8 7
`,
  "Suppressor": `# Suppressor
o Suppressor
v -0.04 -0.04 0.3
v 0.04 -0.04 0.3
v -0.04 0.04 0.3
v 0.04 0.04 0.3
v -0.04 -0.04 -0.3
v 0.04 -0.04 -0.3
v -0.04 0.04 -0.3
v 0.04 0.04 -0.3
f 1 2 4 3
f 5 7 8 6
f 1 3 7 5
f 2 6 8 4
f 1 5 6 2
f 3 4 8 7
`,
  "Vertical Grip": `# Vertical Grip
o Grip
v -0.02 -0.15 0.02
v 0.02 -0.15 0.02
v -0.02 -0.15 -0.02
v 0.02 -0.15 -0.02
v -0.02 0.05 0.02
v 0.02 0.05 0.02
v -0.02 0.05 -0.02
v 0.02 0.05 -0.02
f 1 2 4 3
f 5 7 8 6
f 1 3 7 5
f 2 6 8 4
f 1 5 6 2
f 3 4 8 7
`
};

// Rough default mount positions per slot (in normalized gun-space)
const DEFAULT_MOUNT_POSITIONS = {
  optic:       { x: -0.03, y:  0.22, z:  0.00, rotY: 0 },
  muzzle:      { x: -1.18, y:  0.00, z:  0.00, rotY: 0 },
  barrel:      { x: -0.60, y:  0.05, z:  0.00, rotY: 0 },
  stock:       { x:  0.80, y:  0.00, z:  0.00, rotY: 0 },
  laser:       { x: -0.35, y:  0.02, z:  0.15, rotY: 0 },
  underbarrel: { x: -0.18, y: -0.20, z:  0.02, rotY: 0 },
  ammunition:  { x:  0.05, y: -0.15, z:  0.00, rotY: 0 },
  rearGrip:    { x:  0.45, y: -0.15, z:  0.00, rotY: 0 },
  perk:        { x:  0.00, y:  0.00, z:  0.00, rotY: 0 }
};

// Attachment name → which 3D model to use (simple mapping)
function getAttachmentModel(name) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('red dot') || n.includes('holographic')) return REAL_ATTACHMENT_OBJS["Reflex Sight"];
  if (n.includes('muzzle') || n.includes('compensator') || n.includes('flash')) return REAL_ATTACHMENT_OBJS["Muzzle Brake"];
  if (n.includes('suppressor')) return REAL_ATTACHMENT_OBJS["Suppressor"];
  if (n.includes('foregrip') || n.includes('grip')) return REAL_ATTACHMENT_OBJS["Vertical Grip"];
  return null;
}

// ============================================
// POSITION MANAGER (Firestore private per-user)
// ============================================
async function loadUserPositions(gunName) {
  if (!State.user) return {};
  try {
    const ref = doc(db, 'users', State.user.uid, 'gunPositions', gunName);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data().positions || {};
    }
  } catch (e) {
    console.warn('Load positions error:', e);
  }
  return {};
}

async function saveUserPositions(gunName, positions) {
  if (!State.user) return;
  try {
    const ref = doc(db, 'users', State.user.uid, 'gunPositions', gunName);
    await setDoc(ref, {
      positions,
      gunName,
      updatedAt: serverTimestamp()
    }, { merge: true });
    toast('Positions saved!', 'success');
  } catch (e) {
    console.error('Save positions error:', e);
    toast('Failed to save: ' + e.message, 'error');
  }
}

async function trackFreeGunUsage(gunName) {
  if (isPro()) return true;
  try {
    const userRef = doc(db, 'users', State.user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return true;
    const data = snap.data();
    const usedGuns = data.savedGunPositions || [];
    if (usedGuns.includes(gunName)) return true;
    if (usedGuns.length >= FREE_GUN_LIMIT) {
      showProPaywall('Free users can tune up to ' + FREE_GUN_LIMIT + ' guns. Go Pro for unlimited.');
      return false;
    }
    usedGuns.push(gunName);
    await updateDoc(userRef, { savedGunPositions: usedGuns });
    return true;
  } catch (e) {
    console.warn('Track gun error:', e);
    return true;
  }
}

// ============================================
// ADD ATTACHMENT MESH TO 3D SCENE
// ============================================
function addAttachmentToScene(slotKey, attachmentName) {
  const THREE = Preview3DState.three;
  const scene = Preview3DState.scene;
  if (!THREE || !scene) return;

  // Remove existing
  removeAttachmentFromScene(slotKey);

  // Get model data
  const objData = getAttachmentModel(attachmentName);
  if (!objData || !THREE.OBJLoader) {
    // No model available — store slot as "exists" so save system knows
    Preview3DState.attachmentMeshes[slotKey] = { name: attachmentName, mesh: null };
    return;
  }

  try {
    const obj = new THREE.OBJLoader().parse(objData);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8a9aa6,
      metalness: 0.58,
      roughness: 0.38
    });
    obj.traverse(c => {
      if (c.isMesh) {
        c.material = mat;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    // Normalize size
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    obj.position.sub(center);

    // Scale to sensible size
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 0.25 / maxDim;
    obj.scale.setScalar(scale);

    // Apply saved or default position
    const savedPos = Preview3DState.attachments['__pos_' + slotKey] || DEFAULT_MOUNT_POSITIONS[slotKey] || { x: 0, y: 0, z: 0, rotY: 0 };
    obj.position.set(savedPos.x, savedPos.y, savedPos.z);
    obj.rotation.y = savedPos.rotY || 0;

    obj.userData.slotKey = slotKey;
    obj.userData.isAttachment = true;
    obj.userData.attachmentName = attachmentName;

    scene.add(obj);
    Preview3DState.attachmentMeshes[slotKey] = { name: attachmentName, mesh: obj };

    // Make draggable
    makeAttachmentDraggable(obj);
  } catch (e) {
    console.error('Add attachment error:', e);
  }
}

function removeAttachmentFromScene(slotKey) {
  const entry = Preview3DState.attachmentMeshes[slotKey];
  if (entry && entry.mesh && Preview3DState.scene) {
    Preview3DState.scene.remove(entry.mesh);
    entry.mesh.traverse(c => {
      if (c.geometry) c.geometry.dispose();
      if (c.material && c.material.dispose) c.material.dispose();
    });
  }
  delete Preview3DState.attachmentMeshes[slotKey];
}

// ============================================
// DRAG ATTACHMENT IN 3D SPACE
// ============================================
function makeAttachmentDraggable(mesh) {
  const THREE = Preview3DState.three;
  if (!THREE || !mesh) return;

  // We do XY drag on screen → simplified 3D drag
  // Better UX than raycasting for mobile
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const canvas = Preview3DState.renderer.domElement;

  // Attach tap detection
  canvas.addEventListener('pointerdown', (e) => {
    if (Preview3DState.activeSlot && mesh.userData.slotKey === Preview3DState.activeSlot) {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      Preview3DState.dragged = true;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Convert screen pixels → world units
    const scale = 0.01;
    mesh.position.x += dx * scale;
    mesh.position.y -= dy * scale;

    // Save draft position
    Preview3DState.attachments['__pos_' + mesh.userData.slotKey] = {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
      rotY: mesh.rotation.y
    };

    // Show save button
    showSaveButton();
  });

  canvas.addEventListener('pointerup', () => {
    isDragging = false;
  });
}

// ============================================
// SAVE BUTTON (appears after drag)
// ============================================
function showSaveButton() {
  let btn = document.getElementById('p3d-save-btn');
  if (btn) return;

  const footer = document.querySelector('#preview3d-overlay > div:last-child');
  if (!footer) return;

  btn = document.createElement('button');
  btn.id = 'p3d-save-btn';
  btn.className = 'btn-press';
  btn.style.cssText = 'width:100%;padding:12px;margin-top:8px;border-radius:12px;background:#FF6B00;border:none;color:#fff;font-weight:900;font-size:13px;cursor:pointer;';
  btn.textContent = '💾 Save Position';
  btn.onclick = savePositionsFromPreview;
  footer.appendChild(btn);
}

async function savePositionsFromPreview() {
  const gunName = Preview3DState.gunName;

  // Check free limit
  const allowed = await trackFreeGunUsage(gunName);
  if (!allowed) return;

  // Collect position data
  const positions = {};
  Object.entries(Preview3DState.attachments).forEach(([key, val]) => {
    if (key.startsWith('__pos_')) {
      const slotKey = key.replace('__pos_', '');
      positions[slotKey] = val;
    }
  });

  await saveUserPositions(gunName, positions);

  const btn = document.getElementById('p3d-save-btn');
  if (btn) btn.remove();
}

// ============================================
// PATCH: When user picks attachment in 3D preview, update the mesh
// ============================================
const _origOpenAttachmentPicker25b = openAttachmentPicker;
openAttachmentPicker = function(slotKey) {
  // If we're in 3D preview, use special flow
  if (document.getElementById('preview3d-overlay')) {
    return open3DAttachmentPicker(slotKey);
  }
  return _origOpenAttachmentPicker25b(slotKey);
};

async function open3DAttachmentPicker(slotKey) {
  const slot = GUNSMITH_SLOTS.find(s => s.key === slotKey);
  if (!slot) return;

  const gun = Preview3DState.gunName;
  const attachments = getAttachmentsForSlot(gun, slotKey);
  const current = Preview3DState.attachments[slotKey];

  if (attachments.length === 0) {
    toast('No attachments for this slot', 'info');
    return;
  }

  openSheet(`
    <div class="space-y-2 max-h-[60vh] overflow-y-auto">
      <div class="flex items-center gap-2 mb-3">
        <i data-lucide="${slot.icon}" class="w-5 h-5 text-primary"></i>
        <div class="text-xs text-gray-400 font-bold uppercase">${slot.label}</div>
      </div>

      ${current ? `
        <button class="pick3d-remove w-full text-left px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 font-bold text-sm mb-2">
          ✕ Remove
        </button>
      ` : ''}

      ${attachments.map((att, i) => {
        const isSelected = current && current.name === att.name;
        return `
          <button class="pick3d-attach w-full text-left px-4 py-3 rounded-xl ${isSelected ? 'bg-primary/15 border border-primary' : 'bg-card border border-border'} font-semibold text-sm" data-index="${i}">
            <span class="${isSelected ? 'text-primary' : 'text-white'}">${esc(att.name)}</span>
          </button>
        `;
      }).join('')}
    </div>
  `, slot.label);

  document.querySelectorAll('.pick3d-attach').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.index);
      Preview3DState.attachments[slotKey] = attachments[idx];
      closeSheet();
      addAttachmentToScene(slotKey, attachments[idx].name);
      refresh3DSlotButtons();
    };
  });

  const removeBtn = document.querySelector('.pick3d-remove');
  if (removeBtn) {
    removeBtn.onclick = () => {
      delete Preview3DState.attachments[slotKey];
      delete Preview3DState.attachments['__pos_' + slotKey];
      closeSheet();
      removeAttachmentFromScene(slotKey);
      refresh3DSlotButtons();
    };
  }

  if (window.lucide) window.lucide.createIcons();
}

function refresh3DSlotButtons() {
  const overlay = document.getElementById('preview3d-overlay');
  if (!overlay) return;
  overlay.querySelectorAll('.p3d-slot-btn').forEach(btn => {
    const slot = btn.dataset.slot;
    const picked = Preview3DState.attachments[slot];
    const baseLabel = GUNSMITH_SLOTS.find(s => s.key === slot)?.label || slot;
    btn.textContent = baseLabel + (picked ? ' ✓' : '');
    btn.classList.toggle('active', !!picked);
  });
}

// ============================================
// PATCH open3DPreview — install positions + attachments
// ============================================
const _origOpen3DPreview25b = open3DPreview;
open3DPreview = async function(gunName, attachments) {
  await _origOpen3DPreview25b(gunName, attachments);

  // Wait for scene to initialize
  setTimeout(async () => {
    // Load saved positions
    const savedPositions = await loadUserPositions(gunName);
    Object.entries(savedPositions).forEach(([slotKey, pos]) => {
      Preview3DState.attachments['__pos_' + slotKey] = pos;
    });

    // Add attachment meshes
    Object.entries(Preview3DState.attachments).forEach(([slotKey, att]) => {
      if (slotKey.startsWith('__pos_')) return;
      if (att && att.name) {
        addAttachmentToScene(slotKey, att.name);
      }
    });

    refresh3DSlotButtons();
  }, 800);
};

// ============================================
// EXPORT 25b
// ============================================
window.REAL_ATTACHMENT_OBJS = REAL_ATTACHMENT_OBJS;
window.DEFAULT_MOUNT_POSITIONS = DEFAULT_MOUNT_POSITIONS;
window.getAttachmentModel = getAttachmentModel;
window.loadUserPositions = loadUserPositions;
window.saveUserPositions = saveUserPositions;
window.addAttachmentToScene = addAttachmentToScene;
window.removeAttachmentFromScene = removeAttachmentFromScene;
window.makeAttachmentDraggable = makeAttachmentDraggable;
window.savePositionsFromPreview = savePositionsFromPreview;
window.refresh3DSlotButtons = refresh3DSlotButtons;

// ============================================
// END OF CHUNK 25b/24
// ============================================
// 🎉 APP + 3D GUNSMITH COMPLETE 🎉
// ============================================
