// ============================================
// CHUNK 1/8 — PART 1/3
// Foundation: Imports + Config + State + Constants
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
  Timestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ---------- FIREBASE INIT ----------
const firebaseConfig = {
  apiKey: "AIzaSyC4wVCT-ITLRFPDtzENnDjxL_1aVCAqWHg",
  authDomain: "codmpanda-app.firebaseapp.com",
  projectId: "codmpanda-app",
  storageBucket: "codmpanda-app.firebasestorage.app",
  messagingSenderId: "604146891375",
  appId: "1:604146891375:web:ae74f70c184fd89d572b9a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ---------- CONSTANTS ----------
const ADMIN_UID = "ItqEYihqxYW4HGm7i8bBYky8XNw1";
const NOTIFY_WORKER_URL = "https://codmpanda-notify.bobbyjohon8585.workers.dev";
const VAPID_KEY = "BB38qRzf4R5T_szvw7SvPklifWz_PhM1e4XQ8KKjqaIcauiUeJAZUKmJpWSbzusdny75mzckpAKXB78qSBWdU8A";
const APP_VERSION = "1.0.0";
const GOOGLE_CLIENT_ID = "604146891375-ae5bhcm2nd2f59f0npp3en6setthjg1s.apps.googleusercontent.com";

const LS_LINKS = {
  monthly: "https://codmpanda.lemonsqueezy.com/checkout/buy/5213aceb-052a-415f-aec4-4f5167c91d5d",
  lifetime: "https://codmpanda.lemonsqueezy.com/checkout/buy/5a5be449-8af9-4f09-88c5-da31131e6bac"
};

// ---------- GLOBAL STATE ----------
var State = {
  user: null,
  profile: null,
  currentTab: 'home',
  likedItems: { vault: {}, clip: {}, leak: {}, post: {}, comment: {}, lobby: {} },
  cache: {
    lobbies: [], vaults: [], camos: {}, clans: [],
    scrims: [], clips: [], leaks: [], tierVotes: {},
    myVaultCount: 0, myCamoPct: 0
  },
  filters: {
    lobbies: { rank: 'all', mode: 'all', region: 'all', mic: false, search: '' },
    vaults: { search: '', type: 'gunsmith' },
    clips: { sort: 'recent', gun: 'all' },
    camos: { category: 'all' }
  },
  lobbiesUnsub: null,
  vaultsUnsub: null,
  camosUnsub: null,
  clansUnsub: null,
  scrimsUnsub: null,
  clipsUnsub: null,
  leaksUnsub: null,
  joinCount: 0,
  interstitialShown: false
};

var homeCache = { feed: [], lastFetch: 0, isLoading: false };
var homeFilter = 'all';
var homeLiveUnsubs = [];
var commentReplyTo = null;
var voiceRoomState = { active: false, lobbyId: null, lobby: null, jitsiApi: null, isMuted: false, participants: 0 };
var BuilderState = { selectedGun: null, selectedAttachments: {}, activeSlot: null };
var labSubTab = 'vault';
var squadSubTab = 'clans';
var intelSubTab = 'cp';
var vaultTypeFilter = 'gunsmith';
var tournamentsSubTab = 'active';
var inboxTab = 'notifications';
var notifCountUnsub = null;

// ---------- CODM GUNS DATABASE ----------
var CODM_GUNS = {
  'Assault Rifle': ['AK117','AK-47','ASM10','BK57','DR-H','FR .556','HBRa3','HVK-30','ICR-1','KN-44','LK24','M16','M4','Man-O-War','Oden','Peacekeeper MK2','AKBP','AS VAL','CR-56 AMAX','EM2','FARA 83','Grau 5.56','Kilo 141','M13','Maddox','Swordfish','Type 25','Type 19','BP50','RAM-7'],
  'SMG': ['QQ9','MP5','MP7','PDW-57','RUS-79U','Cordite','GKS','HG 40','MSMC','Pharo','Razorback','QQ10','AGR 556','Fennec','Striker 45','PP19 Bizon','PPSh-41','QXR','MX9','CX-9','LAPA','Vaznev-9K','ISO 45'],
  'Sniper': ['Arctic .50','DL Q33','Locus','M21 EBR','XPR-50','NA-45','Rytec AMR','SP-R 208','Kilo Bolt-Action','ZRG 20mm','HDR','LW3-Tundra','Koshka','Outlaw'],
  'LMG': ['RPD','M4LMG','UL736','S36','Chopper','Holger 26','PKM','Bruen MK9','FiNN LMG','RAAL MG','Hades','MG82'],
  'Shotgun': ['BY15','HS0405','HS2126','Striker','KRM 262','Echo','JAK-12','R9-0','Argus','VLK Rogue'],
  'Marksman': ['SKS','SPR-208','MK2 Carbine','Kar98K','EBR-14','SVD','Type 63'],
  'Pistol': ['J358','MW11','.50 GS','Renetti','L-CAR 9','Shorty','Crossbow','Nail Gun','TEC-9'],
  'Melee': ['Knife','Baseball Bat','Axe','Karambit','Machete','Kali Sticks','Katana','Sickle','Wrench','Shovel'],
  'Launcher': ['FHJ-18','SMRS','Thumper','Strela-P','RPG-7','D13 Sector','M79']
};

var ALL_GUNS = [];
Object.values(CODM_GUNS).forEach(function(arr) { arr.forEach(function(g) { ALL_GUNS.push(g); }); });

// ---------- CAMO TYPES ----------
var CAMO_TYPES = [
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

// ---------- RANKS / MODES / REGIONS / ROLES ----------
var RANKS = ['Rookie','Veteran','Elite','Pro','Master','Grandmaster','Legendary','Mythic','Legendary Rank','Top 500'];
var MODES = ['BR','MP','Ranked MP','Ranked BR','Zombies','Sniper Only','Scrim','Any'];
var REGIONS = ['Africa','EU','NA','SA','Asia','ME','Oceania','Global'];
var ROLES = ['Rusher','Sniper','Support','IGL','Anchor','Flex','Any'];

// ---------- SENSITIVITY FIELDS ----------
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

// ---------- HUD STYLES ----------
var HUD_STYLES = ['2-Finger','3-Finger','4-Finger Claw','5-Finger Claw','6-Finger','Custom'];

// ---------- HOME FILTERS ----------
var HOME_FILTERS = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'lfg', label: 'LFG', emoji: '🎮' },
  { key: 'builds', label: 'Builds', emoji: '🔧' },
  { key: 'clips', label: 'Clips', emoji: '🎬' },
  { key: 'leaks', label: 'Leaks', emoji: '🔥' },
  { key: 'posts', label: 'Posts', emoji: '✍️' }
];

// ---------- GUN CATEGORY META ----------
var GUN_CATEGORY_META = {
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

// ---------- SLOT ICONS ----------
var SLOT_ICON_MAP = {
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

// ---------- GUNSMITH SLOTS ----------
var GUNSMITH_SLOTS = [
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

// ---------- WEAPON SKIN RARITIES ----------
var SKIN_RARITIES = [
  { key: 'common', label: 'Common', color: '#8E8E93', emoji: '⬜' },
  { key: 'rare', label: 'Rare', color: '#00BFFF', emoji: '🔵' },
  { key: 'epic', label: 'Epic', color: '#AF52DE', emoji: '🟣' },
  { key: 'legendary', label: 'Legendary', color: '#FF6B00', emoji: '🟠' },
  { key: 'mythic', label: 'Mythic', color: '#FFD700', emoji: '🟡' }
];

// ---------- REPUTATION TAGS ----------
var REPUTATION_TAGS = [
  { key: 'teamplayer', label: 'Team Player', emoji: '🤝' },
  { key: 'skilled', label: 'Skilled', emoji: '🎯' },
  { key: 'chill', label: 'Chill Vibes', emoji: '😎' },
  { key: 'communicative', label: 'Good Comms', emoji: '🎙️' },
  { key: 'clutch', label: 'Clutch Player', emoji: '🔥' }
];

// ---------- PROFILE THEMES ----------
var PROFILE_THEMES = {
  dark:   { name: 'AMOLED Dark', pro: false, gradient: 'linear-gradient(135deg,#111,#0a0a0a)', border: '#222222', glow: 'none', nameColor: '#fff', animated: false },
  gold:   { name: 'Royal Gold',  pro: true,  gradient: 'linear-gradient(135deg,#1a1200,#000)',   border: '#FFD700', glow: '0 0 30px rgba(255,215,0,0.4)', nameColor: '#FFD700', animated: true },
  fire:   { name: 'Fire Storm',  pro: true,  gradient: 'linear-gradient(135deg,#1a0500,#000,#1a0500)', border: '#FF6B00', glow: '0 0 30px rgba(255,107,0,0.5)', nameColor: '#FF6B00', animated: true },
  ice:    { name: 'Ice Freeze',  pro: true,  gradient: 'linear-gradient(135deg,#001428,#000)',   border: '#00BFFF', glow: '0 0 30px rgba(0,191,255,0.4)', nameColor: '#00BFFF', animated: true },
  galaxy: { name: 'Galaxy',      pro: true,  gradient: 'linear-gradient(135deg,#1a0033,#000,#0a001a)', border: '#AF52DE', glow: '0 0 30px rgba(175,82,222,0.5)', nameColor: '#AF52DE', animated: true }
};

// ---------- AVATAR FRAMES ----------
var AVATAR_FRAMES = {
  none: { name: 'None', pro: false, style: '' },
  gold: { name: 'Gold', pro: true, style: 'background:linear-gradient(135deg,#FFD700,#B8860B);padding:3px;border-radius:50%;' },
  fire: { name: 'Fire', pro: true, style: 'background:linear-gradient(135deg,#FF6B00,#FF3B30);padding:3px;border-radius:50%;' },
  ice:  { name: 'Ice',  pro: true, style: 'background:linear-gradient(135deg,#00BFFF,#0080FF);padding:3px;border-radius:50%;' },
  neon: { name: 'Neon', pro: true, style: 'background:linear-gradient(135deg,#AF52DE,#FF6B00);padding:3px;border-radius:50%;' }
};

console.log('✅ Chunk 1/8 Part 1/3 loaded — Config + State + Constants');
// ============================================
// END OF CHUNK 1/8 — PART 1/3
// ============================================
// ============================================
// CHUNK 1/8 — PART 2/3
// Foundation: Attachments + POIs + Presets + Stats
// ============================================

// ---------- ATTACHMENT POOLS ----------
var ATTACHMENT_POOLS = {
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
    { name: 'Toughness', effects: { control: +4 } }
  ]
};

// ---------- STAT CONFIG (display) ----------
var STAT_CONFIG = [
  { key: 'accuracy', label: 'Accuracy', color: '#00BFFF' },
  { key: 'damage', label: 'Damage', color: '#FF3B30' },
  { key: 'range', label: 'Range', color: '#FF9500' },
  { key: 'fireRate', label: 'Fire Rate', color: '#FFCC00' },
  { key: 'mobility', label: 'Mobility', color: '#34C759' },
  { key: 'control', label: 'Control', color: '#AF52DE' }
];

// ---------- BASE STATS PER GUN (0-100 scale) ----------
var GUN_BASE_STATS = {
  'AK117': { accuracy: 68, damage: 74, range: 62, fireRate: 76, mobility: 62, control: 60 },
  'AK-47': { accuracy: 62, damage: 82, range: 72, fireRate: 62, mobility: 55, control: 58 },
  'M4': { accuracy: 78, damage: 68, range: 68, fireRate: 72, mobility: 66, control: 74 },
  'Fennec': { accuracy: 58, damage: 66, range: 48, fireRate: 92, mobility: 84, control: 52 },
  'QQ9': { accuracy: 62, damage: 70, range: 56, fireRate: 84, mobility: 80, control: 58 },
  'DL Q33': { accuracy: 92, damage: 96, range: 92, fireRate: 24, mobility: 38, control: 66 },
  'Locus': { accuracy: 88, damage: 92, range: 88, fireRate: 28, mobility: 46, control: 62 },
  'Arctic .50': { accuracy: 86, damage: 90, range: 86, fireRate: 32, mobility: 42, control: 58 },
  'RPD': { accuracy: 68, damage: 78, range: 78, fireRate: 68, mobility: 38, control: 62 },
  'Chopper': { accuracy: 62, damage: 82, range: 72, fireRate: 74, mobility: 34, control: 56 },
  'BY15': { accuracy: 72, damage: 94, range: 28, fireRate: 44, mobility: 68, control: 58 },
  'KRM 262': { accuracy: 74, damage: 96, range: 32, fireRate: 38, mobility: 62, control: 60 },
  'Kar98K': { accuracy: 86, damage: 88, range: 82, fireRate: 46, mobility: 58, control: 62 },
  'SKS': { accuracy: 78, damage: 72, range: 78, fireRate: 62, mobility: 62, control: 68 },
  'J358': { accuracy: 70, damage: 66, range: 52, fireRate: 62, mobility: 84, control: 66 },
  'MW11': { accuracy: 66, damage: 58, range: 46, fireRate: 78, mobility: 88, control: 70 },
  // default
  '__default__': { accuracy: 65, damage: 70, range: 65, fireRate: 65, mobility: 60, control: 60 }
};

// ---------- PRESET BUILDS ----------
var PRESET_BUILDS = {
  'Fennec': [
    {
      name: '⚡ Rusher',
      description: 'Max speed + control',
      attachments: {
        muzzle: 'Monolithic Suppressor',
        barrel: 'RTC Light Barrel',
        stock: 'No Stock',
        laser: 'OWC Laser - Tactical',
        rearGrip: 'Rubberized Grip Tape'
      }
    },
    {
      name: '🎯 Hip Fire',
      description: 'Close-range beast',
      attachments: {
        muzzle: 'Muzzle Brake',
        barrel: 'Short Barrel',
        stock: 'No Stock',
        laser: 'Aim Assist Laser',
        rearGrip: 'Stippled Grip Tape'
      }
    }
  ],
  'AK117': [
    {
      name: '⚡ Balanced Meta',
      description: 'All-around competitive build',
      attachments: {
        muzzle: 'Compensator',
        barrel: 'OWC Marksman',
        stock: 'MIP Strike Stock',
        underbarrel: 'Foregrip',
        rearGrip: 'Rubberized Grip Tape'
      }
    },
    {
      name: '🎯 Long Range',
      description: 'Mid-far engagement',
      attachments: {
        muzzle: 'Monolithic Suppressor',
        barrel: 'RTC Heavy Long Barrel',
        optic: '3x Tactical Scope',
        stock: 'RTC Steady Stock',
        underbarrel: 'Ranger Foregrip'
      }
    }
  ],
  'DL Q33': [
    {
      name: '🎯 Quick Scope',
      description: 'Fast ADS sniper',
      attachments: {
        muzzle: 'Tactical Suppressor',
        barrel: 'Light Extended Barrel',
        laser: 'OWC Laser - Tactical',
        stock: 'No Stock',
        perk: 'Fast Switch'
      }
    },
    {
      name: '🛡️ Hard Scope',
      description: 'Long-range precision',
      attachments: {
        muzzle: 'Monolithic Suppressor',
        barrel: 'OWC Ranger',
        optic: '6x Tactical Scope',
        stock: 'RTC Steady Stock',
        underbarrel: 'Ranger Foregrip'
      }
    }
  ],
  'QQ9': [
    {
      name: '⚡ Aggressive',
      description: 'Close-quarters rush',
      attachments: {
        muzzle: 'Monolithic Suppressor',
        barrel: 'RTC Light Barrel',
        stock: 'No Stock',
        laser: 'OWC Laser - Tactical',
        rearGrip: 'Stippled Grip Tape'
      }
    }
  ],
  'AK-47': [
    {
      name: '💪 Control God',
      description: 'Zero recoil',
      attachments: {
        muzzle: 'Compensator',
        barrel: 'OWC Ranger',
        stock: 'RTC Steady Stock',
        underbarrel: 'Ranger Foregrip',
        rearGrip: 'Rubberized Grip Tape'
      }
    }
  ],
  'M4': [
    {
      name: '⚖️ Balanced',
      description: 'Beginner-friendly meta',
      attachments: {
        muzzle: 'Muzzle Brake',
        barrel: 'OWC Marksman',
        stock: 'MIP Strike Stock',
        underbarrel: 'Foregrip',
        rearGrip: 'Rubberized Grip Tape'
      }
    }
  ]
};

// ---------- ISOLATED MAP POIs (23 real points) ----------
var ISOLATED_POIS = [
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

// ---------- TIER ORDER ----------
var TIER_ORDER = ['S', 'A', 'B', 'C'];

console.log('✅ Chunk 1/8 Part 2/3 loaded — Attachments + POIs + Presets + Stats');
// ============================================
// END OF CHUNK 1/8 — PART 2/3
// ============================================
// ============================================
// CHUNK 1/8 — PART 3/3
// Foundation: Utilities (toast, modal, sheet, dropdown, esc, timeAgo, emptyState, compressImage)
// ============================================

// ---------- ESC (HTML escape) ----------
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- GET INITIALS ----------
function getInitials(name) {
  if (!name) return '?';
  var parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ---------- TIME AGO ----------
function timeAgo(timestamp) {
  if (!timestamp) return 'just now';
  var seconds;
  if (typeof timestamp === 'number') seconds = timestamp;
  else if (timestamp.seconds) seconds = timestamp.seconds;
  else if (timestamp.toMillis) seconds = timestamp.toMillis() / 1000;
  else if (timestamp instanceof Date) seconds = timestamp.getTime() / 1000;
  else return 'just now';

  var diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 30) return 'just now';
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  if (diff < 2592000) return Math.floor(diff / 604800) + 'w ago';
  return new Date(seconds * 1000).toLocaleDateString();
}

// ---------- FORMAT DATE ----------
function formatDate(timestamp) {
  if (!timestamp) return '—';
  var seconds;
  if (typeof timestamp === 'number') seconds = timestamp;
  else if (timestamp.seconds) seconds = timestamp.seconds;
  else if (timestamp.toMillis) seconds = timestamp.toMillis() / 1000;
  else if (timestamp instanceof Date) seconds = timestamp.getTime() / 1000;
  else return '—';
  return new Date(seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------- COPY TEXT ----------
function copyText(text, message) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(String(text)).then(function() {
        toast(message || 'Copied!', 'success');
      }).catch(function() {
        _fallbackCopy(text, message);
      });
    } else {
      _fallbackCopy(text, message);
    }
  } catch (e) {
    _fallbackCopy(text, message);
  }
}
function _fallbackCopy(text, message) {
  var ta = document.createElement('textarea');
  ta.value = String(text);
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast(message || 'Copied!', 'success'); }
  catch (e) { toast('Copy failed', 'error'); }
  ta.remove();
}

// ---------- TOAST ----------
function toast(message, type, duration) {
  type = type || 'info';
  duration = duration || 2200;
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,0) + 12px);left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;width:calc(100% - 32px);max-width:400px;';
    document.body.appendChild(container);
  }

  var colors = {
    success: 'background:#10b981;color:#fff;',
    error: 'background:#ef4444;color:#fff;',
    warning: 'background:#f59e0b;color:#fff;',
    info: 'background:#1f1f1f;color:#fff;border:1px solid #333;'
  };
  var el = document.createElement('div');
  el.style.cssText =
    'padding:12px 16px;border-radius:12px;font-size:13px;font-weight:600;' +
    'box-shadow:0 4px 16px rgba(0,0,0,.4);' +
    'opacity:0;transform:translateY(-8px);transition:all .2s ease;' +
    'pointer-events:auto;text-align:center;' +
    (colors[type] || colors.info);
  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(function() {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  setTimeout(function() {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(function() { el.remove(); }, 220);
  }, duration);
}

// ---------- MODAL / SHEET CONTAINERS ----------
function _ensureModalContainer() {
  var c = document.getElementById('modal-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'modal-container';
    c.style.cssText = 'position:fixed;inset:0;z-index:9000;display:none;';
    document.body.appendChild(c);
  }
  return c;
}
function _ensureSheetContainer() {
  var c = document.getElementById('sheet-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'sheet-container';
    c.style.cssText = 'position:fixed;inset:0;z-index:9000;display:none;';
    document.body.appendChild(c);
  }
  return c;
}

// ---------- CONFIRM DIALOG ----------
function confirmDialog(title, message, onConfirm, confirmText, danger) {
  confirmText = confirmText || 'Confirm';
  var container = _ensureModalContainer();
  container.style.display = 'block';
  container.innerHTML = '';

  var backdrop = document.createElement('div');
  backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);';

  var card = document.createElement('div');
  card.style.cssText =
    'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'background:#141414;border:1px solid #2a2a2a;border-radius:16px;' +
    'padding:20px;width:calc(100% - 40px);max-width:340px;';

  var confirmBg = danger ? '#ef4444' : '#ff6b00';

  card.innerHTML =
    '<div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:8px;">' + esc(title) + '</div>' +
    '<div style="font-size:13px;color:#aaa;margin-bottom:20px;line-height:1.5;">' + esc(message || '') + '</div>' +
    '<div style="display:flex;gap:10px;">' +
      '<button id="modal-cancel" style="flex:1;padding:11px;border-radius:10px;background:#222;border:1px solid #333;color:#ccc;font-weight:600;font-size:13px;cursor:pointer;">Cancel</button>' +
      '<button id="modal-confirm" style="flex:1;padding:11px;border-radius:10px;background:' + confirmBg + ';border:none;color:#fff;font-weight:700;font-size:13px;cursor:pointer;">' + esc(confirmText) + '</button>' +
    '</div>';

  container.appendChild(backdrop);
  container.appendChild(card);

  function close() {
    container.style.display = 'none';
    container.innerHTML = '';
  }

  document.getElementById('modal-cancel').onclick = close;
  document.getElementById('modal-confirm').onclick = function() {
    close();
    if (typeof onConfirm === 'function') onConfirm();
  };
  backdrop.onclick = close;
}

// ---------- CLOSE MODAL ----------
function closeModal() {
  var c = document.getElementById('modal-container');
  if (c) { c.style.display = 'none'; c.innerHTML = ''; }
}

// ---------- OPEN SHEET (bottom sheet) ----------
function openSheet(html, title) {
  var container = _ensureSheetContainer();
  container.style.display = 'block';
  container.innerHTML = '';

  var backdrop = document.createElement('div');
  backdrop.id = 'sheet-backdrop';
  backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);';

  var sheet = document.createElement('div');
  sheet.style.cssText =
    'position:absolute;bottom:0;left:0;right:0;' +
    'background:#0a0a0a;border-top-left-radius:20px;border-top-right-radius:20px;' +
    'max-height:90vh;overflow-y:auto;padding-bottom:calc(env(safe-area-inset-bottom,0) + 16px);' +
    'transform:translateY(100%);transition:transform .25s ease;';

  sheet.innerHTML =
    '<div style="position:sticky;top:0;background:#0a0a0a;z-index:2;padding:12px 20px 8px;border-bottom:1px solid #1a1a1a;">' +
      '<div style="width:40px;height:4px;background:#333;border-radius:999px;margin:0 auto 12px;"></div>' +
      (title ? '<div style="font-size:17px;font-weight:700;color:#fff;">' + esc(title) + '</div>' : '') +
    '</div>' +
    '<div style="padding:16px 20px;">' + html + '</div>';

  container.appendChild(backdrop);
  container.appendChild(sheet);

  requestAnimationFrame(function() {
    sheet.style.transform = 'translateY(0)';
  });

  backdrop.onclick = closeSheet;
  if (window.lucide) window.lucide.createIcons();
}

// ---------- CLOSE SHEET ----------
function closeSheet() {
  var c = document.getElementById('sheet-container');
  if (!c) return;
  var sheet = c.lastElementChild;
  if (sheet) sheet.style.transform = 'translateY(100%)';
  setTimeout(function() {
    c.style.display = 'none';
    c.innerHTML = '';
  }, 200);
}

// ---------- OPEN CUSTOM DROPDOWN (replaces native <select>) ----------
function openCustomDropdown(selectEl) {
  if (!selectEl) return;
  var options = Array.from(selectEl.options).map(function(o) {
    return { value: o.value, label: o.textContent };
  });
  var current = selectEl.value;

  var html = '<div style="display:flex;flex-direction:column;gap:6px;">';
  options.forEach(function(o) {
    var active = o.value === current;
    html += '<button class="dropdown-opt" data-value="' + esc(o.value) + '" style="' +
      'padding:14px 16px;border-radius:12px;text-align:left;font-size:14px;' +
      'background:' + (active ? 'rgba(255,107,0,.15)' : '#141414') + ';' +
      'border:1px solid ' + (active ? '#ff6b00' : '#222') + ';' +
      'color:' + (active ? '#ff6b00' : '#fff') + ';font-weight:' + (active ? '700' : '500') + ';cursor:pointer;">' +
      esc(o.label) + (active ? ' ✓' : '') + '</button>';
  });
  html += '</div>';

  openSheet(html, 'Select');
  document.querySelectorAll('.dropdown-opt').forEach(function(btn) {
    btn.onclick = function() {
      selectEl.value = btn.dataset.value;
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      closeSheet();
    };
  });
}

// ---------- EMPTY STATE ----------
function emptyState(icon, title, subtitle, ctaLabel, ctaFn) {
  var html =
    '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;">' +
      '<div style="width:80px;height:80px;border-radius:50%;background:rgba(255,107,0,.1);border:1px solid rgba(255,107,0,.25);display:flex;align-items:center;justify-content:center;margin-bottom:20px;">' +
        '<i data-lucide="' + (icon || 'inbox') + '" style="width:32px;height:32px;color:#ff6b00;"></i>' +
      '</div>' +
      '<div style="font-size:17px;font-weight:800;color:#fff;margin-bottom:8px;">' + esc(title) + '</div>' +
      (subtitle ? '<div style="font-size:13px;color:#888;max-width:280px;line-height:1.5;margin-bottom:20px;">' + esc(subtitle) + '</div>' : '') +
    '</div>';
  if (ctaLabel && typeof ctaFn === 'function') {
    html = html.replace('</div>', '</div>') + '';
  }
  return html;
}

// ---------- COMPRESS IMAGE ----------
function compressImage(file, maxSize, quality) {
  maxSize = maxSize || 800;
  quality = quality || 0.7;
  return new Promise(function(resolve, reject) {
    if (!file) return reject(new Error('No file'));
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
        else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- SHARE ----------
function shareContent(title, text, url) {
  var data = { title: title || 'CODMPanda', text: text || '', url: url || location.href };
  if (navigator.share) {
    navigator.share(data).catch(function() { _openShareSheet(data); });
  } else {
    _openShareSheet(data);
  }
}

function _openShareSheet(data) {
  var url = data.url || location.href;
  var text = data.text || '';
  var html =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<a href="https://wa.me/?text=' + encodeURIComponent(text + ' ' + url) + '" target="_blank" style="padding:14px;border-radius:12px;background:#25D366;color:#fff;font-weight:700;text-align:center;text-decoration:none;font-size:14px;">Share on WhatsApp</a>' +
      '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url) + '" target="_blank" style="padding:14px;border-radius:12px;background:#000;color:#fff;font-weight:700;text-align:center;text-decoration:none;font-size:14px;border:1px solid #333;">Share on X</a>' +
      '<a href="https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text) + '" target="_blank" style="padding:14px;border-radius:12px;background:#0088cc;color:#fff;font-weight:700;text-align:center;text-decoration:none;font-size:14px;">Share on Telegram</a>' +
      '<button id="copy-share" style="padding:14px;border-radius:12px;background:#222;color:#fff;font-weight:700;font-size:14px;border:1px solid #333;cursor:pointer;">Copy Link</button>' +
    '</div>';
  openSheet(html, 'Share');
  document.getElementById('copy-share').onclick = function() {
    copyText(url, 'Link copied!');
    closeSheet();
  };
}

// ---------- HIDE AD / INTERSTITIAL ----------
function hideAd() {
  var b = document.getElementById('ad-banner');
  if (b) b.style.display = 'none';
}
function maybeShowInterstitial() {
  // No-op placeholder (AdMob deferred)
}

// ---------- SKELETON LOADER ----------
function skeletonCard() {
  return '<div style="background:#111;border:1px solid #222;border-radius:16px;padding:16px;margin-bottom:12px;">' +
    '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:#1a1a1a;"></div>' +
      '<div style="flex:1;">' +
        '<div style="height:12px;background:#1a1a1a;border-radius:4px;width:60%;margin-bottom:8px;"></div>' +
        '<div style="height:10px;background:#1a1a1a;border-radius:4px;width:40%;"></div>' +
      '</div>' +
    '</div>' +
    '<div style="height:14px;background:#1a1a1a;border-radius:4px;margin-bottom:8px;"></div>' +
    '<div style="height:14px;background:#1a1a1a;border-radius:4px;width:80%;"></div>' +
  '</div>';
}

function skeletonLobby() {
  return skeletonCard();
}

// ---------- EXPOSE TO WINDOW ----------
window.__state = State;
window.toast = toast;
window.confirmDialog = confirmDialog;
window.closeModal = closeModal;
window.closeSheet = closeSheet;
window.openSheet = openSheet;
window.openCustomDropdown = openCustomDropdown;
window.copyText = copyText;
window.shareContent = shareContent;
window.esc = esc;
window.timeAgo = timeAgo;
window.formatDate = formatDate;
window.getInitials = getInitials;
window.emptyState = emptyState;
window.compressImage = compressImage;
window.skeletonCard = skeletonCard;
window.skeletonLobby = skeletonLobby;
window.hideAd = hideAd;
window.maybeShowInterstitial = maybeShowInterstitial;

console.log('✅ Chunk 1/8 Part 3/3 loaded — Utilities');
// ============================================
// END OF CHUNK 1/8 — PART 3/3
// ============================================
// ============================================
// CHUNK 2/8 — PART 1/3
// Auth + Boot Shell (splash, onboarding, auth-gate, main-app)
// ============================================

// ---------- SPLASH ----------
function showSplash() {
  var s = document.getElementById('splash');
  if (s) s.style.display = 'flex';
}
function hideSplash() {
  var s = document.getElementById('splash');
  if (s) s.style.display = 'none';
}

// ---------- AUTH GATE ----------
function showAuthGate() {
  var el = document.getElementById('auth-gate');
  if (el) el.style.display = 'flex';
  var main = document.getElementById('main-app');
  if (main) main.style.display = 'none';
  var ob = document.getElementById('onboarding');
  if (ob) ob.style.display = 'none';
}
function hideAuthGate() {
  var el = document.getElementById('auth-gate');
  if (el) el.style.display = 'none';
}

// ---------- ONBOARDING ----------
function showOnboarding() {
  var el = document.getElementById('onboarding');
  if (el) el.style.display = 'flex';
  var main = document.getElementById('main-app');
  if (main) main.style.display = 'none';
  var ag = document.getElementById('auth-gate');
  if (ag) ag.style.display = 'none';
}
function hideOnboarding() {
  var el = document.getElementById('onboarding');
  if (el) el.style.display = 'none';
}

// ---------- MAIN APP ----------
function showMainApp() {
  var el = document.getElementById('main-app');
  if (el) el.style.display = 'block';
  hideSplash();
  hideAuthGate();
  hideOnboarding();
}

// ---------- GIS SIGN-IN ----------
function handleSignIn() {
  if (typeof google === 'undefined' || !google.accounts) {
    toast('Google Sign-In not ready. Retry in a moment.', 'error');
    return;
  }
  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGISResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    google.accounts.id.prompt();
  } catch (e) {
    console.error('GIS init error:', e);
    toast('Sign-in failed. Try again.', 'error');
  }
}

async function handleGISResponse(response) {
  if (!response || !response.credential) {
    toast('Sign-in cancelled', 'info');
    return;
  }
  try {
    var credential = GoogleAuthProvider.credential(response.credential);
    var result = await signInWithCredential(auth, credential);
    console.log('Firebase sign-in success:', result.user.email);
  } catch (e) {
    console.error('Sign-in error:', e);
    toast('Sign-in failed: ' + e.message, 'error');
  }
}

// ---------- SIGN OUT ----------
async function handleSignOut() {
  confirmDialog('Sign Out', 'You will be signed out of CODMPanda.', async function() {
    try {
      await signOut(auth);
      location.reload();
    } catch (e) {
      toast('Sign out failed', 'error');
    }
  }, 'Sign Out', true);
}

// ---------- ENSURE USER PROFILE EXISTS ----------
async function ensureUserProfile(user) {
  if (!user) return null;
  var ref = doc(db, 'users', user.uid);
  var snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }
  // New user — create base profile
  var referralCode = 'PANDA' + user.uid.slice(0, 6).toUpperCase();
  var baseProfile = {
    uid: user.uid,
    ign: user.displayName || '',
    email: user.email || '',
    avatar: user.photoURL || '',
    rank: 'Rookie',
    region: 'Africa',
    bio: '',
    favGun: '',
    isPro: false,
    referralCode: referralCode,
    invites: 0,
    approvedCount: 0,
    badges: [],
    friends: [],
    friendRequests: [],
    friendRequestsSent: [],
    fcmTokens: [],
    notificationsEnabled: false,
    ratingAvg: 0,
    ratingCount: 0,
    ratingTags: [],
    tournamentWins: 0,
    verified: false,
    themeStyle: 'dark',
    avatarFrame: 'none',
    activeStreak: 1,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    onboardingDone: false,
    tourCompleted: false
  };
  await setDoc(ref, baseProfile);
  return baseProfile;
}

// ---------- UPDATE STREAK + LAST SEEN ----------
async function updateLastSeen(uid) {
  if (!uid) return;
  try {
    var ref = doc(db, 'users', uid);
    var snap = await getDoc(ref);
    if (!snap.exists()) return;
    var data = snap.data();
    var today = new Date().toISOString().slice(0, 10);
    var last = data.lastActiveDate || '';
    var streak = data.activeStreak || 0;
    if (last !== today) {
      // Check if consecutive
      var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (last === yesterday) streak++;
      else streak = 1;
      await updateDoc(ref, { lastActiveDate: today, activeStreak: streak, lastSeen: serverTimestamp() });
    } else {
      await updateDoc(ref, { lastSeen: serverTimestamp() });
    }
  } catch (e) { /* silent */ }
}

// ---------- AUTH STATE LISTENER ----------
onAuthStateChanged(auth, async function(user) {
  if (!user) {
    State.user = null;
    State.profile = null;
    showAuthGate();
    return;
  }

  State.user = user;
  try {
    var profile = await ensureUserProfile(user);
    State.profile = profile;

    // Update streak
    updateLastSeen(user.uid);

    // Load liked items into State
    await loadUserLikes(user.uid);

    if (!profile.onboardingDone || !profile.ign || profile.ign === 'Panda' || profile.ign === 'PandaPlayer') {
      showOnboarding();
    } else {
      showMainApp();
      switchTab(State.currentTab || 'home');
    }
  } catch (e) {
    console.error('Auth boot error:', e);
    toast('Failed to load profile', 'error');
    showAuthGate();
  }
});

// ---------- LOAD USER LIKES ----------
async function loadUserLikes(uid) {
  if (!uid) return;
  try {
    var snap = await getDocs(query(collection(db, 'likes'), where('userId', '==', uid)));
    State.likedItems = { vault: {}, clip: {}, leak: {}, post: {}, comment: {}, lobby: {} };
    snap.forEach(function(d) {
      var data = d.data();
      if (data.itemType && data.itemId != null) {
        if (!State.likedItems[data.itemType]) State.likedItems[data.itemType] = {};
        State.likedItems[data.itemType][data.itemId] = true;
      }
    });
    console.log('Loaded', snap.size, 'likes into State');
  } catch (e) {
    console.warn('Load likes failed:', e);
  }
}

console.log('✅ Chunk 2/8 Part 1/3 loaded — Auth + Boot');
// ============================================
// END OF CHUNK 2/8 — PART 1/3
// ============================================
// ============================================
// CHUNK 2/8 — PART 2/3
// Tab Router + Navigation + Back Button
// ============================================

// ---------- ROUTE REGISTRY ----------
var TAB_RENDERERS = {
  home:  function() { if (typeof renderHomeTab === 'function') renderHomeTab(); },
  play:  function() { if (typeof renderPlayTab === 'function') renderPlayTab(); },
  lab:   function() { if (typeof renderLabTab === 'function') renderLabTab(); },
  squad: function() { if (typeof renderSquadTab === 'function') renderSquadTab(); },
  intel: function() { if (typeof renderIntelTab === 'function') renderIntelTab(); },
  you:   function() { if (typeof renderYouTab === 'function') renderYouTab(); }
};

// ---------- SWITCH TAB ----------
function switchTab(tab) {
  if (!tab || !TAB_RENDERERS[tab]) tab = 'home';

  // Close any open sheet/modal
  closeSheet();
  closeModal();

  // Stop home live updates when leaving home
  if (State.currentTab === 'home' && tab !== 'home') {
    if (typeof stopHomeLiveUpdates === 'function') stopHomeLiveUpdates();
  }

  State.currentTab = tab;

  // Update nav bar active state
  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    var isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.style.color = isActive ? '#ff6b00' : '#666';
  });

  // Update history for back button
  try { history.pushState({ tab: tab }, '', '#' + tab); } catch (e) {}

  // Render
  var content = document.getElementById('content');
  if (content) content.innerHTML = '<div style="padding:32px 16px;"><div class="spinner" style="margin:0 auto;"></div></div>';

  try {
    TAB_RENDERERS[tab]();
  } catch (e) {
    console.error('Tab render error:', tab, e);
    if (content) content.innerHTML = '<div style="padding:32px 16px;text-align:center;color:#ef4444;font-size:13px;">Failed to load. Pull to refresh.</div>';
  }

  // Start home live updates
  if (tab === 'home' && typeof startHomeLiveUpdates === 'function') {
    startHomeLiveUpdates();
  }

  // Scroll to top
  if (content) content.scrollTop = 0;
}

// ---------- NAV BAR ----------
function renderNavBar() {
  var nav = document.getElementById('bottom-nav');
  if (!nav) return;
  var tabs = [
    { key: 'home',  icon: 'home',   label: 'HOME' },
    { key: 'play',  icon: 'gamepad-2', label: 'PLAY' },
    { key: 'lab',   icon: 'flask-conical', label: 'LAB' },
    { key: 'squad', icon: 'users',  label: 'SQUAD' },
    { key: 'intel', icon: 'radar',  label: 'INTEL' },
    { key: 'you',   icon: 'user',   label: 'YOU' }
  ];
  nav.innerHTML = tabs.map(function(t) {
    var active = State.currentTab === t.key;
    return '<button class="nav-btn" data-tab="' + t.key + '" style="' +
      'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;' +
      'background:transparent;border:none;padding:8px 0;cursor:pointer;' +
      'color:' + (active ? '#ff6b00' : '#666') + ';transition:color .15s;">' +
      '<i data-lucide="' + t.icon + '" style="width:22px;height:22px;"></i>' +
      '<span style="font-size:9px;font-weight:700;letter-spacing:.5px;">' + t.label + '</span>' +
    '</button>';
  }).join('');

  nav.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.onclick = function() { switchTab(btn.dataset.tab); };
  });
}

// ---------- TOP BAR ----------
function renderTopBar() {
  var top = document.getElementById('top-bar');
  if (!top) return;
  var ign = (State.profile && State.profile.ign) || '';
  var rank = (State.profile && State.profile.rank) || '';
  var region = (State.profile && State.profile.region) || '';
  var avatar = (State.profile && State.profile.avatar) || '';
  var isPro = State.profile && State.profile.isPro;
  var verified = State.profile && State.profile.verified;

  top.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#ff6b00;">' +
        (avatar ? '<img src="' + esc(avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : esc(getInitials(ign))) +
      '</div>' +
      '<div style="min-width:0;flex:1;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div style="font-weight:800;font-size:15px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(ign) + '</div>' +
          (isPro ? '<span style="font-size:14px;">👑</span>' : '') +
          (verified ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#1DA1F2;color:#fff;font-size:9px;font-weight:900;">✓</span>' : '') +
        '</div>' +
        '<div id="top-bar-subtitle" style="font-size:10px;color:#888;">' + esc(rank) + ' • ' + esc(region) + '</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
      '<button id="top-search-btn" style="width:36px;height:36px;border-radius:50%;background:#141414;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<i data-lucide="search" style="width:16px;height:16px;color:#fff;"></i>' +
      '</button>' +
      '<button id="top-bell-btn" style="position:relative;width:36px;height:36px;border-radius:50%;background:#141414;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<i data-lucide="bell" style="width:16px;height:16px;color:#fff;"></i>' +
        '<span id="top-notif-dot" style="display:none;position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:#ff6b00;border:2px solid #050505;"></span>' +
      '</button>' +
    '</div>';

  var searchBtn = document.getElementById('top-search-btn');
  if (searchBtn) searchBtn.onclick = function() { if (typeof openGlobalSearch === 'function') openGlobalSearch(); };
  var bellBtn = document.getElementById('top-bell-btn');
  if (bellBtn) bellBtn.onclick = function() { if (typeof openInbox === 'function') openInbox(); };

  if (window.lucide) window.lucide.createIcons();
}

// ---------- SMART BACK BUTTON ----------
function initBackButton() {
  window.addEventListener('popstate', function() {
    // Close any open sheet first
    var sheet = document.getElementById('sheet-container');
    if (sheet && sheet.style.display === 'block') { closeSheet(); return; }
    // Close any modal
    var modal = document.getElementById('modal-container');
    if (modal && modal.style.display === 'block') { closeModal(); return; }
    // Close voice room
    if (voiceRoomState && voiceRoomState.active) { if (typeof closeVoiceRoom === 'function') closeVoiceRoom(); return; }
    // Close post detail
    var pd = document.getElementById('post-detail-overlay');
    if (pd) { pd.remove(); document.body.style.overflow = ''; return; }
    // If not on home, go home
    if (State.currentTab !== 'home') { switchTab('home'); return; }
    // Else allow browser default (leave app)
  });
}

// ---------- INIT TOP-LEVEL UI ----------
function initAppShell() {
  renderNavBar();
  renderTopBar();
  initBackButton();
  if (window.lucide) window.lucide.createIcons();
}

// ---------- EXPOSE TO WINDOW ----------
window.switchTab = switchTab;
window.renderNavBar = renderNavBar;
window.renderTopBar = renderTopBar;
window.initAppShell = initAppShell;
window.showSplash = showSplash;
window.hideSplash = hideSplash;
window.showAuthGate = showAuthGate;
window.hideAuthGate = hideAuthGate;
window.showOnboarding = showOnboarding;
window.hideOnboarding = hideOnboarding;
window.showMainApp = showMainApp;
window.handleSignIn = handleSignIn;
window.handleSignOut = handleSignOut;
window.loadUserLikes = loadUserLikes;

console.log('✅ Chunk 2/8 Part 2/3 loaded — Tab Router + Nav');
// ============================================
// END OF CHUNK 2/8 — PART 2/3
// ============================================
// ============================================
// CHUNK 2/8 — PART 3/3
// Onboarding slides + User Profile form + Tour trigger
// ============================================

// ---------- RENDER ONBOARDING ----------
function renderOnboarding() {
  var el = document.getElementById('onboarding');
  if (!el) return;

  var slides = [
    {
      emoji: '🐼',
      title: 'Welcome to CODMPanda',
      text: 'Your ultimate Call of Duty Mobile companion. Find squads, share builds, track camos, and dominate with the community.'
    },
    {
      emoji: '🔧',
      title: 'Gunsmith Vault',
      text: 'Save and share gunsmith builds, sensitivities, and HUD layouts. Import community builds with one tap.'
    },
    {
      emoji: '🎯',
      title: 'Camo Tracker',
      text: 'Track your grind. Damascus, Gold, Diamond, Platinum — log every weapon and see your progress at a glance.'
    },
    {
      emoji: '👥',
      title: 'Find Your Squad',
      text: 'Post LFG lobbies, join voice rooms, form clans, and compete in tournaments with players worldwide.'
    }
  ];

  var currentSlide = 0;

  function renderSlide() {
    var s = slides[currentSlide];
    var isLast = currentSlide === slides.length - 1;
    el.innerHTML =
      '<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%;padding:40px 24px;padding-top:calc(env(safe-area-inset-top,0) + 40px);padding-bottom:calc(env(safe-area-inset-bottom,0) + 24px);">' +
        '<div style="text-align:center;">' +
          '<div style="font-size:14px;font-weight:700;color:#ff6b00;letter-spacing:2px;">CODMPANDA</div>' +
          '<div style="font-size:11px;color:#666;margin-top:4px;">The Ultimate CODM Companion</div>' +
        '</div>' +
        '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;max-width:400px;margin:0 auto;">' +
          '<div style="font-size:80px;margin-bottom:24px;">' + s.emoji + '</div>' +
          '<div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:12px;">' + esc(s.title) + '</div>' +
          '<div style="font-size:14px;color:#999;line-height:1.6;max-width:340px;">' + esc(s.text) + '</div>' +
        '</div>' +
        '<div>' +
          '<div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px;">' +
            slides.map(function(_, i) {
              return '<div style="width:' + (i === currentSlide ? '24' : '6') + 'px;height:6px;border-radius:999px;background:' + (i === currentSlide ? '#ff6b00' : '#333') + ';transition:all .2s;"></div>';
            }).join('') +
          '</div>' +
          '<button id="ob-next" style="width:100%;padding:16px;border-radius:14px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:15px;cursor:pointer;">' +
            (isLast ? 'Get Started' : 'Next') +
          '</button>' +
          (currentSlide > 0 ? '<button id="ob-skip" style="width:100%;padding:12px;margin-top:8px;background:transparent;border:none;color:#666;font-size:13px;font-weight:600;cursor:pointer;">Skip</button>' : '') +
        '</div>' +
      '</div>';

    document.getElementById('ob-next').onclick = function() {
      if (isLast) {
        currentSlide = 0;
        renderProfileForm();
      } else {
        currentSlide++;
        renderSlide();
      }
    };
    var skip = document.getElementById('ob-skip');
    if (skip) skip.onclick = function() { renderProfileForm(); };
  }

  renderSlide();
  el.style.display = 'flex';
}

// ---------- RENDER PROFILE FORM (after onboarding) ----------
function renderProfileForm() {
  var el = document.getElementById('onboarding');
  if (!el) return;

  el.innerHTML =
    '<div style="display:flex;flex-direction:column;height:100%;padding:40px 24px;padding-top:calc(env(safe-area-inset-top,0) + 40px);padding-bottom:calc(env(safe-area-inset-bottom,0) + 24px);overflow-y:auto;">' +
      '<div style="text-align:center;margin-bottom:24px;">' +
        '<div style="font-size:48px;margin-bottom:8px;">🐼</div>' +
        '<div style="font-size:20px;font-weight:800;color:#fff;">Set Up Your Profile</div>' +
        '<div style="font-size:12px;color:#888;margin-top:4px;">Tell us about you</div>' +
      '</div>' +
      '<div style="max-width:400px;margin:0 auto;width:100%;display:flex;flex-direction:column;gap:16px;">' +
        '<div>' +
          '<label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;">IGN (In-Game Name)</label>' +
          '<input id="pf-ign" type="text" maxlength="20" placeholder="Your CODM name" style="width:100%;margin-top:6px;padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:15px;outline:none;" />' +
        '</div>' +
        '<div>' +
          '<label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;">Rank</label>' +
          '<select id="pf-rank" style="width:100%;margin-top:6px;padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:15px;outline:none;">' +
            RANKS.map(function(r) { return '<option value="' + r + '">' + r + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;">Region</label>' +
          '<select id="pf-region" style="width:100%;margin-top:6px;padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:15px;outline:none;">' +
            REGIONS.map(function(r) { return '<option value="' + r + '">' + r + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<button id="pf-save" style="width:100%;padding:16px;border-radius:14px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:15px;cursor:pointer;margin-top:8px;">Save & Continue</button>' +
      '</div>' +
    '</div>';

  // Prefill IGN from Google display name
  var ignInput = document.getElementById('pf-ign');
  if (ignInput && State.user && State.user.displayName) {
    ignInput.value = State.user.displayName.split(' ')[0];
}

  document.getElementById('pf-save').onclick = async function() {
    var ign = document.getElementById('pf-ign').value.trim();
    var rank = document.getElementById('pf-rank').value;
    var region = document.getElementById('pf-region').value;
    if (ign.length < 3) { toast('IGN must be at least 3 characters', 'error'); return; }
    if (!State.user) { toast('Not signed in', 'error'); return; }

    try {
      await updateDoc(doc(db, 'users', State.user.uid), {
        ign: ign,
        rank: rank,
        region: region,
        onboardingDone: true
      });
      State.profile.ign = ign;
      State.profile.rank = rank;
      State.profile.region = region;
      State.profile.onboardingDone = true;

      hideOnboarding();
      renderTopBar();
      // Trigger hero welcome screen (Chunk 6)
      if (typeof showHeroWelcome === 'function') {
        showHeroWelcome(function() { showMainApp(); switchTab('home'); });
      } else {
        showMainApp();
        switchTab('home');
      }
    } catch (e) {
      console.error('Save profile error:', e);
      toast('Failed to save: ' + e.message, 'error');
    }
  };
}

// ---------- RENDER ONBOARDING BUTTON ----------
function renderOnboardingButton() {
  return '<button id="ob-next" class="btn-press">Next</button>';
}

console.log('✅ Chunk 2/8 Part 3/3 loaded — Onboarding + Profile');
// ============================================
// END OF CHUNK 2/8 — PART 3/3
// ============================================
// ============================================
// CHUNK 3/8 — PART 1/3
// Home Feed — Fetch + Filter + Card render
// ============================================

// ---------- FETCH UNIFIED HOME FEED ----------
async function fetchHomeFeed() {
  if (!State.user) return [];
  try {
    // Parallel fetch all 5 sources
    var [lobbiesSnap, vaultsSnap, clipsSnap, leaksSnap, postsSnap] = await Promise.all([
      getDocs(query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(30))).catch(function() { return { forEach: function() {} }; }),
      getDocs(query(collection(db, 'vaults'), orderBy('createdAt', 'desc'), limit(30))).catch(function() { return { forEach: function() {} }; }),
      getDocs(query(collection(db, 'clips'), limit(30))).catch(function() { return { forEach: function() {} }; }),
      getDocs(query(collection(db, 'leaks'), limit(20))).catch(function() { return { forEach: function() {} }; }),
      getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30))).catch(function() { return { forEach: function() {} }; })
    ]);

    var feed = [];
    var now = Date.now();

    // Lobbies
    lobbiesSnap.forEach(function(d) {
      var data = d.data();
      var expiresAt = data.expiresAt && data.expiresAt.toMillis ? data.expiresAt.toMillis() : (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() + 86400000 : now + 86400000);
      if (expiresAt < now) return;
      feed.push(Object.assign({ id: d.id, type: 'lobby', _sortTime: data.createdAt && data.createdAt.seconds ? data.createdAt.seconds : 0 }, data));
    });

    // Vaults — normalize sub-types to 'vault'
    vaultsSnap.forEach(function(d) {
      var data = d.data();
      feed.push(Object.assign({ id: d.id, type: 'vault', _sortTime: data.createdAt && data.createdAt.seconds ? data.createdAt.seconds : 0 }, data));
    });

    // Clips
    clipsSnap.forEach(function(d) {
      var data = d.data();
      if (!data.approved) return;
      feed.push(Object.assign({ id: d.id, type: 'clip', _sortTime: data.createdAt && data.createdAt.seconds ? data.createdAt.seconds : 0 }, data));
    });

    // Leaks
    leaksSnap.forEach(function(d) {
      var data = d.data();
      feed.push(Object.assign({ id: d.id, type: 'leak', _sortTime: data.createdAt && data.createdAt.seconds ? data.createdAt.seconds : 0 }, data));
    });

    // Posts
    postsSnap.forEach(function(d) {
      var data = d.data();
      var expiresAt = data.expiresAt && data.expiresAt.toMillis ? data.expiresAt.toMillis() : (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() + 90 * 86400000 : now + 90 * 86400000);
      if (expiresAt < now) return;
      feed.push(Object.assign({ id: d.id, type: 'post', _sortTime: data.createdAt && data.createdAt.seconds ? data.createdAt.seconds : 0 }, data));
    });

    feed.sort(function(a, b) { return (b._sortTime || 0) - (a._sortTime || 0); });
    homeCache.feed = feed;
    homeCache.lastFetch = now;
    return feed;
  } catch (e) {
    console.error('fetchHomeFeed error:', e);
    return [];
  }
}

// ---------- RENDER HOME TAB ----------
async function renderHomeTab() {
  var content = document.getElementById('content');
  if (!content) return;

  content.innerHTML =
    '<div style="padding:16px 16px 100px;">' +
      '<div style="margin-bottom:16px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
          '<div>' +
            '<h1 style="font-size:24px;font-weight:800;color:#fff;margin:0;">Home</h1>' +
            '<p style="font-size:12px;color:#888;margin:2px 0 0;">What\'s happening in CODM</p>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button id="home-write-btn" style="width:40px;height:40px;border-radius:50%;background:#ff6b00;border:none;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(255,107,0,.5);cursor:pointer;">' +
              '<i data-lucide="plus" style="width:18px;height:18px;color:#fff;"></i>' +
            '</button>' +
            '<button id="home-refresh-btn" style="width:40px;height:40px;border-radius:50%;background:#141414;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
              '<i data-lucide="refresh-cw" style="width:16px;height:16px;color:#888;"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">' +
          HOME_FILTERS.map(function(f) {
            var active = homeFilter === f.key;
            return '<button class="home-filter-btn" data-filter="' + f.key + '" style="' +
              'padding:10px 6px;border-radius:12px;font-size:11px;font-weight:700;' +
              'background:' + (active ? '#ff6b00' : '#141414') + ';' +
              'border:1px solid ' + (active ? '#ff6b00' : '#222') + ';' +
              'color:' + (active ? '#fff' : '#888') + ';cursor:pointer;">' +
              f.emoji + ' ' + f.label +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div id="home-feed">' + skeletonCard() + skeletonCard() + '</div>' +
    '</div>';

  // Wire filters
  document.querySelectorAll('.home-filter-btn').forEach(function(btn) {
    btn.onclick = function() {
      homeFilter = btn.dataset.filter;
      document.querySelectorAll('.home-filter-btn').forEach(function(b) {
        var a = b.dataset.filter === homeFilter;
        b.style.background = a ? '#ff6b00' : '#141414';
        b.style.borderColor = a ? '#ff6b00' : '#222';
        b.style.color = a ? '#fff' : '#888';
      });
      renderHomeFeed();
    };
  });

  document.getElementById('home-write-btn').onclick = function() {
    if (typeof openWritePostSheet === 'function') openWritePostSheet();
  };
  document.getElementById('home-refresh-btn').onclick = async function() {
    homeCache.lastFetch = 0;
    toast('Refreshing...', 'info', 1000);
    await fetchHomeFeed();
    renderHomeFeed();
  };

  await fetchHomeFeed();
  renderHomeFeed();

  if (window.lucide) window.lucide.createIcons();
}

// ---------- RENDER FEED (with filter) ----------
function renderHomeFeed() {
  var feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  var items = homeCache.feed.slice();

  // Strip phantom vault sub-types only when showing all or posts
  if (homeFilter === 'all' || homeFilter === 'posts') {
    items = items.filter(function(i) { return i.type !== 'gunsmith' && i.type !== 'hud' && i.type !== 'sens'; });
  }

  if (homeFilter !== 'all') {
    var typeMap = { lfg: 'lobby', builds: 'vault', clips: 'clip', leaks: 'leak', posts: 'post' };
    items = items.filter(function(i) { return i.type === typeMap[homeFilter]; });
  }

  if (items.length === 0) {
    if (homeFilter === 'all' || homeFilter === 'posts') {
      feedEl.innerHTML = renderHomeEmpty();
      wireHomeEmpty();
    } else if (homeFilter === 'lfg') {
      feedEl.innerHTML = renderEmptyTab('gamepad-2', 'No lobbies yet', 'Post a lobby and find your squad', 'Post Lobby', 'empty-lfg-btn');
      var l = document.getElementById('empty-lfg-btn');
      if (l) l.onclick = function() { if (typeof openPostLobbySheet === 'function') openPostLobbySheet(); };
    } else if (homeFilter === 'builds') {
      feedEl.innerHTML = renderEmptyTab('wrench', 'No builds yet', 'Share a gunsmith, sensitivity, or HUD', 'Share Build', 'empty-bld-btn');
      var b = document.getElementById('empty-bld-btn');
      if (b) b.onclick = function() { labSubTab = 'vault'; switchTab('lab'); };
    } else if (homeFilter === 'clips') {
      feedEl.innerHTML = renderEmptyTab('video', 'No clips yet', 'Post your best play — YouTube or TikTok link', 'Post Clip', 'empty-clip-btn');
      var c = document.getElementById('empty-clip-btn');
      if (c) c.onclick = function() { squadSubTab = 'clips'; switchTab('squad'); };
    } else if (homeFilter === 'leaks') {
      feedEl.innerHTML = renderEmptyTab('flame', 'No leaks yet', 'Check back soon for intel drops', 'Submit Leak', 'empty-leak-btn');
      var lk = document.getElementById('empty-leak-btn');
      if (lk) lk.onclick = function() { if (typeof openSubmitLeakSheet === 'function') openSubmitLeakSheet(); };
    }
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feedEl.innerHTML = items.map(function(item) { return renderHomeCard(item); }).join('');
  wireHomeCards(items);
  if (window.lucide) window.lucide.createIcons();
}

// ---------- EMPTY STATE ----------
function renderHomeEmpty() {
  return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;">' +
    '<div style="position:relative;margin-bottom:20px;">' +
      '<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,107,0,.3),rgba(255,215,0,.2));border-radius:50%;filter:blur(24px);"></div>' +
      '<img src="/icon-512.png" alt="CODMPanda" style="position:relative;width:96px;height:96px;border-radius:20px;box-shadow:0 0 40px rgba(255,107,0,.5);" />' +
    '</div>' +
    '<div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:8px;">Nothing here yet</div>' +
    '<div style="font-size:12px;color:#888;max-width:280px;line-height:1.5;margin-bottom:24px;">Be the first to post something. Pick what you want to share:</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:340px;">' +
      emptyBtn('pencil', 'Write Post', 'empty-write') +
      emptyBtn('gamepad-2', 'Find Squad', 'empty-lfg') +
      emptyBtn('wrench', 'Share Build', 'empty-build') +
      emptyBtn('video', 'Post Clip', 'empty-clip') +
    '</div>' +
  '</div>';
}

function renderEmptyTab(icon, title, subtitle, ctaLabel, id) {
  return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;">' +
    '<div style="position:relative;margin-bottom:20px;">' +
      '<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,107,0,.3),rgba(255,215,0,.2));border-radius:50%;filter:blur(24px);"></div>' +
      '<div style="position:relative;width:72px;height:72px;border-radius:50%;background:#141414;border:1px solid #222;display:flex;align-items:center;justify-content:center;">' +
        '<i data-lucide="' + icon + '" style="width:28px;height:28px;color:rgba(255,107,0,.7);"></i>' +
      '</div>' +
    '</div>' +
    '<div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:6px;">' + esc(title) + '</div>' +
    '<div style="font-size:12px;color:#888;max-width:260px;line-height:1.5;margin-bottom:20px;">' + esc(subtitle) + '</div>' +
    '<button id="' + id + '" style="padding:12px 20px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:700;font-size:13px;cursor:pointer;">' + esc(ctaLabel) + '</button>' +
  '</div>';
}

function emptyBtn(icon, label, id) {
  return '<button id="' + id + '" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 12px;border-radius:16px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:12px;cursor:pointer;">' +
    '<i data-lucide="' + icon + '" style="width:20px;height:20px;color:#ff6b00;"></i>' +
    '<span>' + esc(label) + '</span>' +
  '</button>';
}

function wireHomeEmpty() {
  var w = document.getElementById('empty-write'); if (w) w.onclick = function() { if (typeof openWritePostSheet === 'function') openWritePostSheet(); };
  var l = document.getElementById('empty-lfg'); if (l) l.onclick = function() { if (typeof openPostLobbySheet === 'function') openPostLobbySheet(); };
  var b = document.getElementById('empty-build'); if (b) b.onclick = function() { labSubTab = 'vault'; switchTab('lab'); };
  var c = document.getElementById('empty-clip'); if (c) c.onclick = function() { squadSubTab = 'clips'; switchTab('squad'); };
}

console.log('✅ Chunk 3/8 Part 1/3 loaded — Home Fetch + Filters');
// ============================================
// END OF CHUNK 3/8 — PART 1/3
// ============================================
// ============================================
// CHUNK 3/8 — PART 2/3
// Home Feed — Card renderers per item type
// ============================================

// ---------- MAIN DISPATCHER ----------
function renderHomeCard(item) {
  if (!item || !item.type) return '';
  switch (item.type) {
    case 'lobby': return renderLobbyCard(item);
    case 'vault': return renderVaultCard(item);
    case 'clip':  return renderClipCard(item);
    case 'leak':  return renderLeakCard(item);
    case 'post':  return renderPostCard(item);
    default: return '';
  }
}

// ---------- LOBBY CARD ----------
function renderLobbyCard(item) {
  var isMine = item.uid === State.user.uid;
  var avatar = item.avatar || '';
  var ign = item.ign || 'Player';
  var isPro = item.isPro || false;
  var players = item.players || 1;
  var maxPlayers = 5;

  return '<div class="home-card" data-type="lobby" data-id="' + item.id + '" style="background:#111;border:1px solid ' + (isPro ? '#FFD700' : '#222') + ';border-radius:16px;padding:16px;margin-bottom:12px;position:relative;">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
      '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(255,107,0,.15);color:#ff6b00;font-weight:800;">🎮 LOBBY</span>' +
      '<span style="font-size:10px;color:#888;">' + timeAgo(item.createdAt) + '</span>' +
      '<div style="margin-left:auto;font-size:12px;font-weight:800;color:#ff6b00;">' + players + '/' + maxPlayers + '</div>' +
    '</div>' +
    '<div class="post-author" data-uid="' + (item.uid || '') + '" style="display:flex;align-items:center;gap:10px;margin-bottom:12px;cursor:pointer;">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;">' +
        (avatar ? '<img src="' + esc(avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(ign)) +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div class="author-name" style="font-weight:800;font-size:15px;color:#fff;">' + esc(ign) + '</div>' +
          (isPro ? '<span style="font-size:13px;">👑</span>' : '') +
        '</div>' +
        '<div style="font-size:11px;color:#888;margin-top:2px;">' + esc(item.rank || 'Rookie') + ' • ' + esc(item.region || 'Africa') + (item.mic ? ' • 🎙️' : '') + '</div>' +
      '</div>' +
    '</div>' +
    (item.note ? '<div style="font-size:13px;color:#ddd;line-height:1.5;margin-bottom:12px;white-space:pre-wrap;">' + esc(item.note) + '</div>' : '') +
    '<div style="display:flex;gap:8px;">' +
      '<button class="lobby-join-btn" data-id="' + item.id + '" style="flex:1;padding:12px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="log-in" style="width:16px;height:16px;"></i> Join' +
      '</button>' +
      '<button class="home-like-btn" data-type="lobby" data-id="' + item.id + '" style="width:44px;height:44px;border-radius:12px;background:#181818;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<i data-lucide="heart" style="width:18px;height:18px;' + ((State.likedItems.lobby && State.likedItems.lobby[item.id]) ? 'fill:#ff6b00;color:#ff6b00;' : 'color:#888;') + '"></i>' +
      '</button>' +
      '<button class="home-share-btn" data-id="' + item.id + '" data-type="lobby" style="width:44px;height:44px;border-radius:12px;background:#181818;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<i data-lucide="share-2" style="width:18px;height:18px;color:#ff6b00;"></i>' +
      '</button>' +
    '</div>' +
  '</div>';
}

// ---------- VAULT CARD ----------
function renderVaultCard(item) {
  var vaultType = item.type || 'gunsmith';
  var mainType = 'vault';
  var label = vaultType === 'gunsmith' ? '🔧 GUNSMITH' : vaultType === 'sens' ? '🎯 SENSITIVITY' : '📱 HUD';
  var isMine = item.uid === State.user.uid;

  return '<div class="home-card" data-type="vault" data-id="' + item.id + '" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;margin-bottom:12px;">' +
    '<div style="padding:14px;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
        '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(0,191,255,.15);color:#00BFFF;font-weight:800;">' + label + '</span>' +
        '<span style="font-size:10px;color:#888;">' + timeAgo(item.createdAt) + '</span>' +
      '</div>' +
      (item.imageUrl ? '<div style="border-radius:12px;overflow:hidden;margin-bottom:10px;"><img class="home-image" src="' + esc(item.imageUrl) + '" style="width:100%;display:block;" /></div>' : '') +
      '<div style="font-weight:800;font-size:15px;color:#fff;margin-bottom:4px;">' + esc(item.gunName || item.title || 'Build') + '</div>' +
      (item.gunsmithCode ? '<div style="font-size:11px;color:#888;font-family:monospace;">' + esc(item.gunsmithCode) + '</div>' : '') +
    '</div>' +
    '<div style="display:flex;border-top:1px solid #1a1a1a;">' +
      '<button class="vault-like-btn home-like-btn" data-type="vault" data-id="' + item.id + '" style="flex:1;padding:12px;background:transparent;border:none;color:#888;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="heart" style="width:16px;height:16px;' + ((State.likedItems.vault && State.likedItems.vault[item.id]) ? 'fill:#ff6b00;color:#ff6b00;' : '') + '"></i> ' + (item.likes || 0) +
      '</button>' +
      '<div style="width:1px;background:#1a1a1a;"></div>' +
      '<button class="home-share-btn" data-id="' + item.id + '" data-type="vault" style="flex:1;padding:12px;background:transparent;border:none;color:#888;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="share-2" style="width:16px;height:16px;"></i> Share' +
      '</button>' +
    '</div>' +
  '</div>';
}

// ---------- CLIP CARD ----------
function renderClipCard(item) {
  var embedUrl = '';
  try {
    var u = item.youtubeUrl || '';
    var m = u.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
    if (m) embedUrl = 'https://www.youtube.com/embed/' + m[1];
  } catch (e) {}

  return '<div class="home-card" data-type="clip" data-id="' + item.id + '" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;margin-bottom:12px;">' +
    '<div style="padding:14px;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
        '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(255,0,100,.15);color:#ff0064;font-weight:800;">🎬 CLIP</span>' +
        '<span style="font-size:10px;color:#888;">' + timeAgo(item.createdAt) + '</span>' +
      '</div>' +
      (item.gunTag ? '<div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:8px;">' + esc(item.gunTag) + '</div>' : '') +
      (embedUrl ? '<div style="position:relative;padding-bottom:56.25%;border-radius:12px;overflow:hidden;margin-bottom:10px;"><iframe src="' + embedUrl + '" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe></div>' : '<a href="' + esc(item.youtubeUrl || '#') + '" target="_blank" style="display:block;padding:20px;background:#181818;border-radius:12px;text-align:center;color:#ff6b00;text-decoration:none;font-weight:700;">Watch Clip →</a>') +
    '</div>' +
    '<div style="display:flex;border-top:1px solid #1a1a1a;">' +
      '<button class="home-like-btn" data-type="clip" data-id="' + item.id + '" style="flex:1;padding:12px;background:transparent;border:none;color:#888;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="heart" style="width:16px;height:16px;' + ((State.likedItems.clip && State.likedItems.clip[item.id]) ? 'fill:#ff6b00;color:#ff6b00;' : '') + '"></i> ' + (item.likes || 0) +
      '</button>' +
      '<div style="width:1px;background:#1a1a1a;"></div>' +
      '<button class="home-share-btn" data-id="' + item.id + '" data-type="clip" style="flex:1;padding:12px;background:transparent;border:none;color:#888;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="share-2" style="width:16px;height:16px;"></i> Share' +
      '</button>' +
    '</div>' +
  '</div>';
}

// ---------- LEAK CARD ----------
function renderLeakCard(item) {
  var rarityColors = { common: '#8E8E93', rare: '#00BFFF', epic: '#AF52DE', legendary: '#FF6B00', mythic: '#FFD700' };
  var rarityColor = rarityColors[item.rarity] || '#8E8E93';

  return '<div class="home-card" data-type="leak" data-id="' + item.id + '" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;margin-bottom:12px;">' +
    '<div style="padding:14px;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
        '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(255,215,0,.15);color:#FFD700;font-weight:800;">🔥 LEAK</span>' +
        (item.rarity ? '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(0,0,0,.4);color:' + rarityColor + ';font-weight:800;border:1px solid ' + rarityColor + ';">' + esc(item.rarity.toUpperCase()) + '</span>' : '') +
        '<span style="font-size:10px;color:#888;">' + timeAgo(item.createdAt) + '</span>' +
      '</div>' +
      (item.imageUrl ? '<div style="border-radius:12px;overflow:hidden;margin-bottom:10px;"><img class="home-image" src="' + esc(item.imageUrl) + '" style="width:100%;display:block;" /></div>' : '') +
      '<div style="font-weight:800;font-size:15px;color:#fff;margin-bottom:6px;">' + esc(item.title) + '</div>' +
      (item.body ? '<div style="font-size:13px;color:#ccc;line-height:1.5;">' + esc(item.body) + '</div>' : '') +
    '</div>' +
    '<div style="display:flex;border-top:1px solid #1a1a1a;">' +
      '<button class="home-like-btn" data-type="leak" data-id="' + item.id + '" style="flex:1;padding:12px;background:transparent;border:none;color:#888;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="flame" style="width:16px;height:16px;' + ((State.likedItems.leak && State.likedItems.leak[item.id]) ? 'fill:#ff6b00;color:#ff6b00;' : '') + '"></i> ' + (item.hypes || item.likes || 0) +
      '</button>' +
      '<div style="width:1px;background:#1a1a1a;"></div>' +
      '<button class="home-share-btn" data-id="' + item.id + '" data-type="leak" style="flex:1;padding:12px;background:transparent;border:none;color:#888;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="share-2" style="width:16px;height:16px;"></i> Share' +
      '</button>' +
    '</div>' +
  '</div>';
}

// ---------- POST CARD ----------
function renderPostCard(item) {
  var isMine = item.uid === State.user.uid;
  var avatar = item.avatar || '';
  var ign = item.ign || 'Player';
  var verified = item.verified || false;
  var isPro = item.isPro || false;
  var isLiked = State.likedItems.post && State.likedItems.post[item.id];

  return '<div class="home-card" data-type="post" data-id="' + item.id + '" style="background:#111;border:1px solid #222;border-radius:16px;padding:16px;margin-bottom:12px;">' +
    '<div class="post-author" data-uid="' + (item.uid || '') + '" style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;cursor:pointer;">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;">' +
        (avatar ? '<img src="' + esc(avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(ign)) +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<div class="author-name" style="font-weight:800;font-size:15px;color:#fff;">' + esc(ign) + '</div>' +
          (isPro ? '<span style="font-size:13px;">👑</span>' : '') +
          (verified ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#1DA1F2;color:#fff;font-size:9px;font-weight:900;">✓</span>' : '') +
        '</div>' +
        '<div style="font-size:11px;color:#888;margin-top:2px;">' + timeAgo(item.createdAt) + (item.editedAt ? ' • edited' : '') + '</div>' +
      '</div>' +
      (isMine ? '<button class="post-menu-btn" data-id="' + item.id + '" style="width:32px;height:32px;border-radius:50%;background:transparent;border:none;color:#888;cursor:pointer;">⋮</button>' : '') +
    '</div>' +
    (item.text ? '<div style="font-size:14px;line-height:1.5;color:#e8e8e8;margin-bottom:12px;white-space:pre-wrap;word-break:break-word;">' + esc(item.text) + '</div>' : '') +
    (item.imageUrl ? '<div style="border-radius:12px;overflow:hidden;margin-bottom:12px;"><img class="home-image" src="' + esc(item.imageUrl) + '" style="width:100%;display:block;" /></div>' : '') +
    '<div style="display:flex;align-items:center;gap:8px;padding-top:12px;border-top:1px solid #1a1a1a;">' +
      '<button class="post-like-btn home-like-btn" data-type="post" data-id="' + item.id + '" style="flex:1;padding:8px;background:transparent;border:none;color:' + (isLiked ? '#ff6b00' : '#888') + ';font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="heart" style="width:18px;height:18px;' + (isLiked ? 'fill:#ff6b00;' : '') + '"></i> <span class="like-count">' + (item.likes || 0) + '</span>' +
      '</button>' +
      '<button class="post-comments-btn" data-id="' + item.id + '" style="flex:1;padding:8px;background:transparent;border:none;color:#888;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="message-circle" style="width:18px;height:18px;"></i> <span>' + (item.commentCount || 0) + '</span>' +
      '</button>' +
      '<button class="post-share-btn" data-id="' + item.id + '" style="flex:1;padding:8px;background:transparent;border:none;color:#888;font-weight:700;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="share-2" style="width:18px;height:18px;"></i>' +
      '</button>' +
    '</div>' +
  '</div>';
}

console.log('✅ Chunk 3/8 Part 2/3 loaded — Card Renderers');
// ============================================
// END OF CHUNK 3/8 — PART 2/3
// ============================================
// ============================================
// CHUNK 3/8 — PART 3/3
// Home Feed — Wire all card interactions
// ============================================

// ---------- WIRE HOME CARDS ----------
function wireHomeCards(items) {
  var feedEl = document.getElementById('home-feed');
  if (!feedEl) return;

  // ---- LIKE buttons (all types) ----
  feedEl.querySelectorAll('.home-like-btn').forEach(function(btn) {
    btn.onclick = async function(e) {
      e.stopPropagation();
      var type = btn.dataset.type;
      var id = btn.dataset.id;
      if (!type || !id) return;
      await handleLikeClick(btn, type, id);
    };
  });

  // ---- COMMENT buttons (posts only) ----
  feedEl.querySelectorAll('.post-comments-btn').forEach(function(btn) {
    btn.onclick = function(e) {
      e.stopPropagation();
      if (typeof openPostComments === 'function') openPostComments(btn.dataset.id);
    };
  });

  // ---- SHARE buttons ----
  feedEl.querySelectorAll('.home-share-btn').forEach(function(btn) {
    btn.onclick = function(e) {
      e.stopPropagation();
      var id = btn.dataset.id;
      var type = btn.dataset.type;
      var url = location.origin + '/?' + type + '=' + id;
      if (typeof shareContent === 'function') shareContent('CODMPanda', 'Check this out on CODMPanda!', url);
    };
  });

  // ---- 3-dot menu (posts) ----
  feedEl.querySelectorAll('.post-menu-btn').forEach(function(btn) {
    btn.onclick = function(e) {
      e.stopPropagation();
      if (typeof openPostMenu === 'function') openPostMenu(btn.dataset.id);
    };
  });

  // ---- LOBBY join buttons ----
  feedEl.querySelectorAll('.lobby-join-btn').forEach(function(btn) {
    btn.onclick = function(e) {
      e.stopPropagation();
      var lobby = items.find(function(i) { return i.id === btn.dataset.id; });
      if (!lobby) return;
      if (typeof openVoiceRoom === 'function') openVoiceRoom(lobby);
    };
  });

  // ---- POST BODY TAP → detail view ----
  feedEl.querySelectorAll('.home-card[data-type="post"]').forEach(function(card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function(e) {
      if (e.target.closest('button') || e.target.closest('a')) return;
      if (e.target.closest('.post-author')) return;
      if (e.target.closest('.home-image')) return;
      if (typeof openPostDetail === 'function') openPostDetail(card.dataset.id);
    });
  });

  // ---- AUTHOR TAP → profile ----
  feedEl.querySelectorAll('.post-author[data-uid]').forEach(function(el) {
    el.onclick = function(e) {
      e.stopPropagation();
      var uid = el.dataset.uid;
      if (uid && typeof openUserProfile === 'function') openUserProfile(uid);
    };
  });

  // ---- IMAGE ZOOM ----
  feedEl.querySelectorAll('img.home-image').forEach(function(img) {
    img.style.cursor = 'zoom-in';
    img.onclick = function(e) {
      e.stopPropagation();
      if (typeof openImageZoom === 'function') openImageZoom(img.src);
    };
  });
}

// ---------- LIKE HANDLER (unified) ----------
async function handleLikeClick(btn, type, id) {
  if (!State.user) return;

  var liked = State.likedItems[type] && State.likedItems[type][id];
  var newState = !liked;

  // Optimistic UI
  var icon = btn.querySelector('i, svg');
  var countEl = btn.querySelector('.like-count') || btn.querySelector('span');
  var oldCount = countEl ? (parseInt(countEl.textContent, 10) || 0) : 0;
  var newCount = newState ? oldCount + 1 : Math.max(0, oldCount - 1);

  if (!State.likedItems[type]) State.likedItems[type] = {};
  State.likedItems[type][id] = newState;

  if (icon) {
    if (newState) icon.setAttribute('fill', '#ff6b00');
    else icon.removeAttribute('fill');
    icon.style.color = newState ? '#ff6b00' : '';
  }
  btn.style.color = newState ? '#ff6b00' : '#888';
  if (countEl) countEl.textContent = newCount;

  // Firestore
  try {
    var uid = State.user.uid;
    var likeRef = doc(db, 'likes', type + '_' + id + '_' + uid);
    var collName = type === 'post' ? 'posts'
                 : type === 'lobby' ? 'lobbies'
                 : type === 'vault' ? 'vaults'
                 : type === 'clip' ? 'clips'
                 : type === 'leak' ? 'leaks'
                 : type === 'comment' ? 'comments'
                 : 'vaults';
    var itemRef = doc(db, collName, id);

    if (newState) {
      await setDoc(likeRef, {
        itemType: type, itemId: id, userId: uid, createdAt: serverTimestamp()
      });
      try { await updateDoc(itemRef, { likes: increment(1) }); } catch (e) {}
    } else {
      await deleteDoc(likeRef);
      try { await updateDoc(itemRef, { likes: increment(-1) }); } catch (e) {}
    }
  } catch (e) {
    console.warn('Like write failed:', e);
    // Rollback
    State.likedItems[type][id] = liked;
    if (icon) {
      if (liked) icon.setAttribute('fill', '#ff6b00');
      else icon.removeAttribute('fill');
      icon.style.color = liked ? '#ff6b00' : '';
    }
    btn.style.color = liked ? '#ff6b00' : '#888';
    if (countEl) countEl.textContent = oldCount;
  }
}

// ---------- EXPOSE TO WINDOW ----------
window.renderHomeCard = renderHomeCard;
window.renderLobbyCard = renderLobbyCard;
window.renderVaultCard = renderVaultCard;
window.renderClipCard = renderClipCard;
window.renderLeakCard = renderLeakCard;
window.renderPostCard = renderPostCard;
window.wireHomeCards = wireHomeCards;
window.handleLikeClick = handleLikeClick;
window.fetchHomeFeed = fetchHomeFeed;
window.renderHomeTab = renderHomeTab;
window.renderHomeFeed = renderHomeFeed;
window.renderHomeEmpty = renderHomeEmpty;
window.renderEmptyTab = renderEmptyTab;
window.wireHomeEmpty = wireHomeEmpty;

console.log('✅ Chunk 3/8 Part 3/3 loaded — Card Wiring');
// ============================================
// END OF CHUNK 3/8 — PART 3/3
// ============================================
// ============================================
// CHUNK 4/8 — PART 1/3
// Post Detail View + Comment system
// ============================================

// ---------- OPEN POST DETAIL ----------
async function openPostDetail(postId) {
  var post = homeCache.feed.find(function(p) { return p.id === postId; });
  if (!post) {
    try {
      var s = await getDoc(doc(db, 'posts', postId));
      if (s.exists()) post = Object.assign({ id: s.id }, s.data());
    } catch (e) {}
  }
  if (!post) { toast('Post not found', 'error'); return; }

  window.__currentDetailPostId = postId;
  document.body.style.overflow = 'hidden';

  var isLiked = State.likedItems.post && State.likedItems.post[post.id];
  var isMine = post.uid === State.user.uid;

  var ov = document.createElement('div');
  ov.id = 'post-detail-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:60;background:#050505;overflow-y:auto;-webkit-overflow-scrolling:touch;';
  ov.innerHTML =
    '<div style="position:sticky;top:0;z-index:10;background:rgba(5,5,5,.95);backdrop-filter:blur(12px);border-bottom:1px solid #1a1a1a;display:flex;align-items:center;gap:12px;padding:12px 16px;padding-top:calc(env(safe-area-inset-top,0) + 12px);">' +
      '<button id="pd-back" style="width:36px;height:36px;border-radius:50%;background:transparent;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<i data-lucide="arrow-left" style="width:20px;height:20px;color:#fff;"></i>' +
      '</button>' +
      '<div style="font-weight:800;font-size:16px;color:#fff;">Post</div>' +
      (isMine ? '<button id="pd-menu-btn" style="margin-left:auto;width:36px;height:36px;border-radius:50%;background:transparent;border:none;color:#888;font-size:20px;cursor:pointer;">⋮</button>' : '') +
    '</div>' +
    '<div style="padding:16px 16px 120px;">' +
      '<div id="pd-author" class="post-author" data-uid="' + (post.uid || '') + '" style="display:flex;align-items:center;gap:10px;margin-bottom:14px;cursor:pointer;">' +
        '<div style="width:44px;height:44px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;">' +
          (post.avatar ? '<img src="' + esc(post.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(post.ign || '?')) +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<div style="font-weight:800;font-size:15px;color:#fff;">' + esc(post.ign || 'Unknown') + '</div>' +
            (post.isPro ? '<span style="font-size:13px;">👑</span>' : '') +
            (post.verified ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#1DA1F2;color:#fff;font-size:9px;font-weight:900;">✓</span>' : '') +
          '</div>' +
          '<div style="font-size:11px;color:#888;margin-top:2px;">' + timeAgo(post.createdAt) + (post.editedAt ? ' • edited' : '') + '</div>' +
        '</div>' +
      '</div>' +
      (post.text ? '<div style="font-size:15px;line-height:1.55;color:#e8e8e8;margin-bottom:14px;white-space:pre-wrap;word-break:break-word;">' + esc(post.text) + '</div>' : '') +
      (post.imageUrl ? '<div style="border-radius:16px;overflow:hidden;margin-bottom:14px;border:1px solid #1a1a1a;"><img id="pd-image" src="' + esc(post.imageUrl) + '" style="width:100%;display:block;cursor:zoom-in;" /></div>' : '') +
      '<div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a;">' +
        '<button id="pd-like-btn" style="background:none;border:none;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:' + (isLiked ? '#ff6b00' : '#888') + ';cursor:pointer;">' +
          '<i data-lucide="heart" style="width:20px;height:20px;' + (isLiked ? 'fill:#ff6b00;' : '') + '"></i>' +
          '<span id="pd-like-count">' + (post.likes || 0) + '</span>' +
        '</button>' +
        '<div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#888;">' +
          '<i data-lucide="message-circle" style="width:20px;height:20px;"></i>' +
          '<span id="pd-comment-count">' + (post.commentCount || 0) + '</span>' +
        '</div>' +
        '<button id="pd-share-btn" style="background:none;border:none;margin-left:auto;color:#888;cursor:pointer;display:flex;align-items:center;">' +
          '<i data-lucide="share-2" style="width:20px;height:20px;"></i>' +
        '</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;margin-bottom:12px;">' +
        '<div style="font-size:12px;font-weight:800;color:#888;text-transform:uppercase;letter-spacing:.5px;">Comments</div>' +
        '<div id="pd-comment-label" style="font-size:11px;color:#666;"></div>' +
      '</div>' +
      '<div id="pd-comments-list" style="display:flex;flex-direction:column;gap:12px;">' +
        '<div style="text-align:center;padding:24px 0;"><div class="spinner" style="margin:0 auto;"></div></div>' +
      '</div>' +
    '</div>' +
    '<div style="position:fixed;left:0;right:0;bottom:0;z-index:20;background:#0a0a0a;border-top:1px solid #1a1a1a;padding:10px 14px;padding-bottom:calc(10px + env(safe-area-inset-bottom,0));">' +
      '<div id="pd-reply-indicator" style="display:none;margin-bottom:8px;padding:8px 12px;background:rgba(255,107,0,.1);border:1px solid rgba(255,107,0,.3);border-radius:8px;align-items:center;justify-content:space-between;">' +
        '<div id="pd-reply-text" style="font-size:11px;color:#ff6b00;font-weight:700;"></div>' +
        '<button id="pd-reply-cancel" style="background:none;border:none;color:#888;font-size:16px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;align-items:center;">' +
        '<input id="pd-input" type="text" placeholder="Write a comment..." maxlength="300" style="flex:1;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:11px 14px;font-size:14px;color:#fff;outline:none;" />' +
        '<button id="pd-send" style="width:44px;height:44px;border-radius:12px;background:#ff6b00;border:none;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;">' +
          '<i data-lucide="send" style="width:18px;height:18px;color:#fff;"></i>' +
        '</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(ov);
  if (window.lucide) window.lucide.createIcons();

  // ---------- WIRE BACK ----------
  document.getElementById('pd-back').onclick = function() {
    ov.remove();
    document.body.style.overflow = '';
  };

  // ---------- WIRE AUTHOR ----------
  var author = document.getElementById('pd-author');
  if (author) {
    author.onclick = function() {
      if (post.uid && typeof openUserProfile === 'function') openUserProfile(post.uid);
    };
  }

  // ---------- WIRE MENU (own post) ----------
  var menuBtn = document.getElementById('pd-menu-btn');
  if (menuBtn) {
    menuBtn.onclick = function() { if (typeof openPostMenu === 'function') openPostMenu(post.id); };
  }

  // ---------- WIRE LIKE ----------
  document.getElementById('pd-like-btn').onclick = async function() {
    var btn = document.getElementById('pd-like-btn');
    await handleLikeClick(btn, 'post', post.id);
    var cntEl = document.getElementById('pd-like-count');
    var liveLiked = State.likedItems.post && State.likedItems.post[post.id];
    btn.style.color = liveLiked ? '#ff6b00' : '#888';
    var icon = btn.querySelector('i, svg');
    if (icon) {
      if (liveLiked) icon.setAttribute('fill', '#ff6b00');
      else icon.removeAttribute('fill');
    }
  };

  // ---------- WIRE SHARE ----------
  document.getElementById('pd-share-btn').onclick = function() {
    if (typeof shareContent === 'function') {
      shareContent('CODMPanda Post', 'Check out this post!', location.origin + '/?post=' + post.id);
    }
  };

  // ---------- WIRE IMAGE ZOOM ----------
  var pdImg = document.getElementById('pd-image');
  if (pdImg) {
    pdImg.onclick = function() {
      if (typeof openImageZoom === 'function') openImageZoom(pdImg.src);
    };
  }

  // ---------- WIRE COMMENT SEND ----------
  var pdInput = document.getElementById('pd-input');
  var pdSend = document.getElementById('pd-send');
  pdSend.onclick = function() { submitPostComment(post.id); };
  pdInput.onkeypress = function(e) { if (e.key === 'Enter') submitPostComment(post.id); };

  // ---------- WIRE REPLY CANCEL ----------
  document.getElementById('pd-reply-cancel').onclick = function() {
    window.__pdReplyTo = null;
    document.getElementById('pd-reply-indicator').style.display = 'none';
    pdInput.placeholder = 'Write a comment...';
    pdInput.focus();
  };

  // ---------- WIRE MENTION AUTOCOMPLETE ----------
  pdInput.addEventListener('input', function() {
    _handleMentionInput(pdInput);
  });

  // ---------- LOAD COMMENTS ----------
  loadPostComments(post.id);
}

// ---------- LOAD COMMENTS ----------
async function loadPostComments(postId) {
  var listEl = document.getElementById('pd-comments-list');
  var countEl = document.getElementById('pd-comment-count');
  var labelEl = document.getElementById('pd-comment-label');
  if (!listEl) return;

  try {
    var snap = await getDocs(query(collection(db, 'comments'), where('contentId', '==', postId), limit(200)));
    var all = [];
    snap.forEach(function(d) { all.push(Object.assign({ id: d.id }, d.data())); });
    all.sort(function(a, b) {
      var sa = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
      var sb = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return sa - sb;
    });

    if (countEl) countEl.textContent = all.length;
    if (labelEl) labelEl.textContent = all.length + ' comment' + (all.length === 1 ? '' : 's');

    if (all.length === 0) {
      listEl.innerHTML =
        '<div style="text-align:center;padding:40px 20px;">' +
          '<div style="font-size:36px;margin-bottom:8px;">💬</div>' +
          '<div style="font-size:13px;color:#888;">No comments yet</div>' +
          '<div style="font-size:11px;color:#555;margin-top:4px;">Be the first to reply</div>' +
        '</div>';
      return;
    }

    // Separate top-level and replies (promote orphans)
    var ids = {};
    all.forEach(function(c) { ids[c.id] = true; });
    var topLevel = all.filter(function(c) { return !c.parentId || !ids[c.parentId]; });
    var byParent = {};
    all.filter(function(c) { return c.parentId && ids[c.parentId]; }).forEach(function(c) {
      if (!byParent[c.parentId]) byParent[c.parentId] = [];
      byParent[c.parentId].push(c);
    });

    listEl.innerHTML = topLevel.map(function(c) {
      return renderCommentRow(c, byParent[c.id] || [], 0);
    }).join('');

    wireCommentActions(listEl, postId);
  } catch (e) {
    console.error('Load comments error:', e);
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#ef4444;font-size:12px;">Failed to load comments</div>';
  }
  if (window.lucide) window.lucide.createIcons();
}

// ---------- RENDER COMMENT ----------
function renderCommentRow(c, replies, depth) {
  var isMine = c.uid === State.user.uid;
  var isLiked = State.likedItems.comment && State.likedItems.comment[c.id];
  var indent = depth > 0 ? 'margin-left:36px;' : '';

  var h = '<div class="pd-comment" data-cid="' + c.id + '" style="' + indent + 'display:flex;gap:10px;align-items:flex-start;">';

  h += '<div class="comment-author" data-uid="' + (c.uid || '') + '" style="width:32px;height:32px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#ff6b00;cursor:pointer;">';
  h += c.avatar ? '<img src="' + esc(c.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(c.ign || '?');
  h += '</div>';

  h += '<div style="flex:1;min-width:0;">';
  h += '<div style="background:#141414;border:1px solid #222;border-radius:14px;padding:10px 12px;">';
  h += '<div class="comment-author" data-uid="' + (c.uid || '') + '" style="font-size:12px;font-weight:800;color:#ff6b00;margin-bottom:3px;cursor:pointer;">' + esc(c.ign || 'Unknown');
  if (c.edited) h += ' <span style="font-size:9px;color:#666;font-weight:400;">(edited)</span>';
  h += '</div>';
  h += '<div style="font-size:13px;color:#ddd;line-height:1.4;word-break:break-word;white-space:pre-wrap;">' + esc(c.text) + '</div>';
  h += '</div>';

  h += '<div style="display:flex;align-items:center;gap:14px;margin-top:6px;margin-left:4px;">';
  h += '<button class="comment-like-btn" data-cid="' + c.id + '" style="background:none;border:none;padding:0;font-size:11px;font-weight:800;color:' + (isLiked ? '#ff6b00' : '#666') + ';display:flex;align-items:center;gap:4px;cursor:pointer;">❤️ <span class="like-num">' + (c.likes || 0) + '</span></button>';
  h += '<button class="comment-reply-btn" data-cid="' + c.id + '" data-ign="' + esc(c.ign || '') + '" style="background:none;border:none;padding:0;font-size:11px;font-weight:800;color:#666;cursor:pointer;">Reply</button>';
  if (isMine) {
    h += '<button class="comment-edit-btn" data-cid="' + c.id + '" style="background:none;border:none;padding:0;font-size:11px;font-weight:800;color:#ff6b00;cursor:pointer;">Edit</button>';
    h += '<button class="comment-delete-btn" data-cid="' + c.id + '" style="background:none;border:none;padding:0;font-size:11px;font-weight:800;color:#ef4444;cursor:pointer;">Delete</button>';
  }
  h += '</div></div></div>';

  if (replies.length > 0 && depth === 0) {
    h += '<div class="replies-wrap" data-parent="' + c.id + '" style="display:none;margin-top:10px;flex-direction:column;gap:12px;">';
    h += replies.map(function(r) { return renderCommentRow(r, [], 1); }).join('');
    h += '</div>';
    h += '<button class="comment-expand-btn" data-cid="' + c.id + '" data-count="' + replies.length + '" style="background:none;border:none;padding:6px 0 0 42px;font-size:11px;font-weight:800;color:#ff6b00;cursor:pointer;text-align:left;">▸ Show ' + replies.length + ' ' + (replies.length === 1 ? 'reply' : 'replies') + '</button>';
  }
  return h;
}

// ---------- SUBMIT COMMENT ----------
async function submitPostComment(postId) {
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
      ign: (State.profile && State.profile.ign) || 'Player',
      avatar: (State.profile && State.profile.avatar) || '',
      text: text,
      likes: 0,
      createdAt: serverTimestamp()
    };
    if (window.__pdReplyTo && window.__pdReplyTo.parentId) {
      data.parentId = window.__pdReplyTo.parentId;
    }
    await addDoc(collection(db, 'comments'), data);

    try {
      await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
    } catch (e) {}

    window.__pdReplyTo = null;
    var ind = document.getElementById('pd-reply-indicator');
    if (ind) ind.style.display = 'none';
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

console.log('✅ Chunk 4/8 Part 1/3 loaded — Post Detail + Comments');
// ============================================
// END OF CHUNK 4/8 — PART 1/3
// ============================================
// ============================================
// CHUNK 4/8 — PART 2/3
// Comment actions: like, reply, edit, delete + @mentions
// ============================================

// ---------- WIRE COMMENT ACTIONS ----------
function wireCommentActions(container, postId) {
  // Like
  container.querySelectorAll('.comment-like-btn').forEach(function(btn) {
    btn.onclick = async function() {
      var cid = btn.dataset.cid;
      await handleLikeClick(btn, 'comment', cid);
      // Re-sync visual from State
      var liked = State.likedItems.comment && State.likedItems.comment[cid];
      btn.style.color = liked ? '#ff6b00' : '#666';
    };
  });

  // Reply
  container.querySelectorAll('.comment-reply-btn').forEach(function(btn) {
    btn.onclick = function() {
      var cid = btn.dataset.cid;
      var ign = btn.dataset.ign;
      window.__pdReplyTo = { parentId: cid, ign: ign };
      var ind = document.getElementById('pd-reply-indicator');
      var txt = document.getElementById('pd-reply-text');
      if (ind) ind.style.display = 'flex';
      if (txt) txt.textContent = 'Replying to ' + ign + '...';
      var inp = document.getElementById('pd-input');
      if (inp) { inp.placeholder = 'Reply to ' + ign + '...'; inp.focus(); }
    };
  });

  // Expand replies
  container.querySelectorAll('.comment-expand-btn').forEach(function(btn) {
    btn.onclick = function() {
      var cid = btn.dataset.cid;
      var wrap = container.querySelector('.replies-wrap[data-parent="' + cid + '"]');
      if (!wrap) return;
      var isOpen = wrap.style.display === 'flex';
      wrap.style.display = isOpen ? 'none' : 'flex';
      var count = btn.dataset.count;
      btn.textContent = (isOpen ? '▸ Show ' : '▾ Hide ') + count + ' ' + (count === '1' ? 'reply' : 'replies');
    };
  });

  // Edit
  container.querySelectorAll('.comment-edit-btn').forEach(function(btn) {
    btn.onclick = function() { openEditCommentSheet(btn.dataset.cid, postId); };
  });

  // Delete
  container.querySelectorAll('.comment-delete-btn').forEach(function(btn) {
    btn.onclick = function() {
      var cid = btn.dataset.cid;
      confirmDialog('Delete Comment', 'This will remove your comment.', async function() {
        try {
          await deleteDoc(doc(db, 'comments', cid));
          toast('🗑 Deleted', 'success');
          await loadPostComments(postId);
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    };
  });

  // Author tap → profile
  container.querySelectorAll('.comment-author[data-uid]').forEach(function(el) {
    el.onclick = function(e) {
      e.stopPropagation();
      var uid = el.dataset.uid;
      if (uid && typeof openUserProfile === 'function') openUserProfile(uid);
    };
  });
}

// ---------- OPEN EDIT COMMENT SHEET ----------
async function openEditCommentSheet(commentId, postId) {
  try {
    var snap = await getDoc(doc(db, 'comments', commentId));
    if (!snap.exists()) { toast('Comment not found', 'error'); return; }
    var data = snap.data();
    if (data.uid !== State.user.uid) { toast('Not your comment', 'error'); return; }

    var html =
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<textarea id="edit-comment-text" maxlength="300" style="width:100%;min-height:100px;background:#141414;border:1px solid #222;border-radius:12px;padding:12px;font-size:14px;color:#fff;outline:none;resize:none;">' + esc(data.text) + '</textarea>' +
        '<button id="edit-comment-save" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Save Changes</button>' +
      '</div>';
    openSheet(html, 'Edit Comment');

    document.getElementById('edit-comment-save').onclick = async function() {
      var text = document.getElementById('edit-comment-text').value.trim();
      if (!text) { toast('Cannot be empty', 'error'); return; }
      try {
        await updateDoc(doc(db, 'comments', commentId), {
          text: text,
          edited: true,
          editedAt: serverTimestamp()
        });
        toast('✓ Updated', 'success');
        closeSheet();
        if (postId) await loadPostComments(postId);
      } catch (e) { toast('Failed', 'error'); }
    };
  } catch (e) {
    toast('Failed to open', 'error');
  }
}

// ---------- @ MENTION AUTOCOMPLETE ----------
var _mentionState = { popup: null, inputEl: null, cache: {} };

async function _handleMentionInput(inputEl) {
  var val = inputEl.value;
  var caret = inputEl.selectionStart || val.length;
  var before = val.slice(0, caret);
  var match = before.match(/@([a-zA-Z0-9_]*)$/);

  if (!match) { _closeMention(); return; }
  var query = match[1].toLowerCase();

  await _loadFriendProfilesForMention();
  var friends = (State.profile && State.profile.friends) || [];
  var results = [];

  friends.forEach(function(uid) {
    var p = _mentionState.cache[uid];
    if (p && p.ign && p.ign.toLowerCase().indexOf(query) === 0) {
      results.push({ uid: uid, ign: p.ign, avatar: p.avatar });
    }
  });

  // Include own name if matches
  var myIgn = State.profile && State.profile.ign;
  if (myIgn && myIgn.toLowerCase().indexOf(query) === 0) {
    var hasSelf = results.some(function(r) { return r.uid === State.user.uid; });
    if (!hasSelf) results.unshift({ uid: State.user.uid, ign: myIgn, avatar: State.profile.avatar || '' });
  }

  _renderMentionPopup(inputEl, results);
}

async function _loadFriendProfilesForMention() {
  var friends = (State.profile && State.profile.friends) || [];
  var need = friends.filter(function(uid) { return !_mentionState.cache[uid]; });
  if (!need.length) return;

  try {
    var results = await Promise.all(need.map(async function(uid) {
      try {
        var s = await getDoc(doc(db, 'users', uid));
        return s.exists() ? Object.assign({ uid: uid }, s.data()) : null;
      } catch (e) { return null; }
    }));
    results.forEach(function(u) {
      if (u && u.ign) _mentionState.cache[u.uid] = { ign: u.ign, avatar: u.avatar || '' };
    });
  } catch (e) {}
}

function _renderMentionPopup(inputEl, users) {
  _closeMention();
  if (!users.length) return;

  var popup = document.createElement('div');
  popup.id = 'mention-popup';
  popup.style.cssText =
    'position:fixed;left:12px;right:12px;background:#141414;border:1px solid #2a2a2a;' +
    'border-radius:12px;max-height:220px;overflow-y:auto;z-index:9999;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.6);';

  var rect = inputEl.getBoundingClientRect();
  popup.style.bottom = (window.innerHeight - rect.top + 6) + 'px';

  popup.innerHTML = users.slice(0, 8).map(function(u, i) {
    return '<div class="mention-item" data-ign="' + esc(u.ign || 'user') + '" style="' +
      'display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;' +
      'border-bottom:1px solid ' + (i < users.length - 1 ? '#1a1a1a' : 'transparent') + ';">' +
      '<div style="width:28px;height:28px;border-radius:50%;background:rgba(255,107,0,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#ff6b00;overflow:hidden;">' +
        (u.avatar ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(u.ign || '?')) +
      '</div>' +
      '<div style="font-size:13px;font-weight:700;color:#fff;">@' + esc(u.ign || 'user') + '</div>' +
    '</div>';
  }).join('');

  document.body.appendChild(popup);
  _mentionState.popup = popup;
  _mentionState.inputEl = inputEl;

  popup.querySelectorAll('.mention-item').forEach(function(item) {
    item.onclick = function(e) {
      e.preventDefault(); e.stopPropagation();
      _insertMention(inputEl, item.dataset.ign);
      _closeMention();
    };
  });
}

function _insertMention(inputEl, ign) {
  var val = inputEl.value;
  var caret = inputEl.selectionStart || val.length;
  var before = val.slice(0, caret);
  var atIdx = before.lastIndexOf('@');
  if (atIdx === -1) return;
  var after = val.slice(caret);
  var newVal = val.slice(0, atIdx) + '@' + ign + ' ' + after;
  inputEl.value = newVal;
  var nc = atIdx + ign.length + 2;
  inputEl.setSelectionRange(nc, nc);
  inputEl.focus();
}

function _closeMention() {
  if (_mentionState.popup && _mentionState.popup.parentNode) {
    _mentionState.popup.parentNode.removeChild(_mentionState.popup);
  }
  _mentionState.popup = null;
  _mentionState.inputEl = null;
}

document.addEventListener('click', function(e) {
  if (_mentionState.popup && !_mentionState.popup.contains(e.target) && e.target !== _mentionState.inputEl) {
    _closeMention();
  }
}, true);

// ---------- OPEN POST MENU (3-dot) ----------
function openPostMenu(postId) {
  var post = homeCache.feed.find(function(p) { return p.id === postId; });
  if (!post) { toast('Post not found', 'error'); return; }
  if (post.uid !== State.user.uid) { toast('Not your post', 'error'); return; }

  var html =
    '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<button id="pm-edit" style="padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;text-align:left;font-size:14px;cursor:pointer;">✏️ Edit Post</button>' +
      '<button id="pm-delete" style="padding:14px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:700;text-align:left;font-size:14px;cursor:pointer;">🗑️ Delete Post</button>' +
    '</div>';
  openSheet(html, 'Post Options');

  document.getElementById('pm-edit').onclick = function() {
    closeSheet();
    if (typeof openEditPostSheet === 'function') openEditPostSheet(postId);
  };

  document.getElementById('pm-delete').onclick = function() {
    closeSheet();
    confirmDialog('Delete Post', 'This will permanently remove your post and its comments.', async function() {
      try {
        // Delete comments first
        var cs = await getDocs(query(collection(db, 'comments'), where('contentId', '==', postId)));
        var batch = writeBatch(db);
        cs.forEach(function(c) { batch.delete(doc(db, 'comments', c.id)); });
        batch.delete(doc(db, 'posts', postId));
        await batch.commit();
        toast('🗑 Deleted', 'success');
        homeCache.feed = homeCache.feed.filter(function(p) { return p.id !== postId; });
        renderHomeFeed();
        var ov = document.getElementById('post-detail-overlay');
        if (ov) ov.remove();
        document.body.style.overflow = '';
      } catch (e) { toast('Failed: ' + e.message, 'error'); }
    }, 'Delete', true);
  };
}

// ---------- EXPOSE ----------
window.openPostDetail = openPostDetail;
window.loadPostComments = loadPostComments;
window.renderCommentRow = renderCommentRow;
window.submitPostComment = submitPostComment;
window.wireCommentActions = wireCommentActions;
window.openEditCommentSheet = openEditCommentSheet;
window.openPostMenu = openPostMenu;

console.log('✅ Chunk 4/8 Part 2/3 loaded — Comment Actions + Mentions');
// ============================================
// END OF CHUNK 4/8 — PART 2/3
// ============================================
// ============================================
// CHUNK 4/8 — PART 3/3
// Write Post + Edit Post + Image Zoom + Profile View
// ============================================

// ---------- WRITE POST SHEET ----------
function openWritePostSheet() {
  if (!State.user) return;
  var isPro = State.profile && State.profile.isPro;
  var maxChars = isPro ? 5000 : 500;

  var html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="display:flex;gap:10px;align-items:flex-start;">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;">' +
          (State.profile.avatar ? '<img src="' + esc(State.profile.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(State.profile.ign || '?')) +
        '</div>' +
        '<textarea id="wp-text" maxlength="' + maxChars + '" placeholder="What\'s on your mind?" style="flex:1;min-height:120px;background:#141414;border:1px solid #222;border-radius:14px;padding:12px;font-size:14px;color:#fff;outline:none;resize:none;font-family:inherit;"></textarea>' +
      '</div>' +
      '<div id="wp-image-preview" style="display:none;border-radius:14px;overflow:hidden;position:relative;">' +
        '<img id="wp-image-img" style="width:100%;display:block;" />' +
        '<button id="wp-image-remove" style="position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.7);border:none;color:#fff;font-size:16px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<label style="flex:1;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#ccc;font-weight:700;font-size:13px;text-align:center;cursor:pointer;">' +
          '📷 Add Image' +
          '<input id="wp-image-input" type="file" accept="image/*" style="display:none;" />' +
        '</label>' +
        '<div id="wp-char-count" style="font-size:11px;color:#888;font-weight:700;">0/' + maxChars + '</div>' +
      '</div>' +
      (isPro ? '' : '<div style="font-size:11px;color:#888;text-align:center;">💎 Upgrade to Pro for unlimited characters</div>') +
      '<button id="wp-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Post</button>' +
    '</div>';

  openSheet(html, 'Write Post');

  var imageBase64 = null;

  document.getElementById('wp-text').addEventListener('input', function(e) {
    document.getElementById('wp-char-count').textContent = e.target.value.length + '/' + maxChars;
  });

  document.getElementById('wp-image-input').addEventListener('change', async function(e) {
    var file = e.target.files[0];
    if (!file) return;
    try {
      var b64 = await compressImage(file, 800, 0.7);
      imageBase64 = b64;
      document.getElementById('wp-image-img').src = b64;
      document.getElementById('wp-image-preview').style.display = 'block';
    } catch (err) { toast('Image error', 'error'); }
  });

  document.getElementById('wp-image-remove').onclick = function() {
    imageBase64 = null;
    document.getElementById('wp-image-preview').style.display = 'none';
    document.getElementById('wp-image-input').value = '';
  };

  document.getElementById('wp-submit').onclick = async function() {
    var text = document.getElementById('wp-text').value.trim();
    if (!text && !imageBase64) { toast('Write something first', 'error'); return; }

    var btn = document.getElementById('wp-submit');
    btn.disabled = true;
    btn.textContent = 'Posting...';

    try {
      var postData = {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        text: text,
        imageUrl: imageBase64 || '',
        likes: 0,
        commentCount: 0,
        isPro: State.profile.isPro || false,
        verified: State.profile.verified || false,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 90 * 86400000)
      };
      await addDoc(collection(db, 'posts'), postData);
      toast('✓ Posted', 'success');
      closeSheet();
      await fetchHomeFeed();
      renderHomeFeed();
    } catch (e) {
      console.error('Post error:', e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Post';
    }
  };
}

// ---------- EDIT POST SHEET ----------
async function openEditPostSheet(postId) {
  try {
    var snap = await getDoc(doc(db, 'posts', postId));
    if (!snap.exists()) { toast('Post not found', 'error'); return; }
    var data = snap.data();
    if (data.uid !== State.user.uid) { toast('Not your post', 'error'); return; }

    var html =
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<textarea id="ep-text" maxlength="5000" style="width:100%;min-height:120px;background:#141414;border:1px solid #222;border-radius:14px;padding:12px;font-size:14px;color:#fff;outline:none;resize:none;">' + esc(data.text || '') + '</textarea>' +
        '<button id="ep-save" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Save Changes</button>' +
      '</div>';
    openSheet(html, 'Edit Post');

    document.getElementById('ep-save').onclick = async function() {
      var text = document.getElementById('ep-text').value.trim();
      if (!text) { toast('Cannot be empty', 'error'); return; }
      try {
        await updateDoc(doc(db, 'posts', postId), { text: text, editedAt: serverTimestamp() });
        toast('✓ Updated', 'success');
        closeSheet();
        await fetchHomeFeed();
        renderHomeFeed();
        var ov = document.getElementById('post-detail-overlay');
        if (ov) ov.remove();
        document.body.style.overflow = '';
      } catch (e) { toast('Failed', 'error'); }
    };
  } catch (e) { toast('Failed to open', 'error'); }
}

// ---------- IMAGE ZOOM ----------
function openImageZoom(src) {
  if (!src) return;
  var existing = document.getElementById('image-zoom-overlay');
  if (existing) existing.remove();

  var ov = document.createElement('div');
  ov.id = 'image-zoom-overlay';
  ov.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.98);' +
    'display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;';

  var img = document.createElement('img');
  img.id = 'zoom-img';
  img.src = src;
  img.draggable = false;
  img.style.cssText =
    'max-width:100%;max-height:100%;object-fit:contain;' +
    'transform-origin:center center;user-select:none;-webkit-user-drag:none;';

  var close = document.createElement('button');
  close.textContent = '✕';
  close.style.cssText =
    'position:absolute;top:calc(env(safe-area-inset-top,0) + 14px);right:14px;' +
    'width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.15);' +
    'border:none;color:#fff;font-size:20px;cursor:pointer;z-index:2;';

  ov.appendChild(img);
  ov.appendChild(close);
  document.body.appendChild(ov);
  document.body.style.overflow = 'hidden';

  var scale = 1, tx = 0, ty = 0;
  var startX = 0, startY = 0, startTX = 0, startTY = 0;
  var pinchStart = 0, pinchScale = 1, lastTap = 0, moved = false;
  var pointers = new Map();

  function apply() {
    img.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + scale + ')';
  }
  function dist(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  ov.addEventListener('pointerdown', function(e) {
    ov.setPointerCapture && ov.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    if (pointers.size === 1) {
      startX = e.clientX; startY = e.clientY;
      startTX = tx; startTY = ty;
    } else if (pointers.size === 2) {
      var p = Array.from(pointers.values());
      pinchStart = dist(p[0], p[1]);
      pinchScale = scale;
    }
  });

  ov.addEventListener('pointermove', function(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      var p = Array.from(pointers.values());
      var d = dist(p[0], p[1]);
      if (pinchStart > 0) {
        scale = Math.max(1, Math.min(5, pinchScale * d / pinchStart));
      }
      moved = true;
      apply();
    } else if (pointers.size === 1 && scale > 1) {
      tx = startTX + e.clientX - startX;
      ty = startTY + e.clientY - startY;
      moved = true;
      apply();
    }
  });

  ov.addEventListener('pointerup', function(e) {
    pointers.delete(e.pointerId);
    var now = Date.now();
    if (pointers.size === 0) {
      if (!moved && now - lastTap < 300) {
        if (scale > 1) { scale = 1; tx = 0; ty = 0; }
        else { scale = 2.5; }
        apply();
        lastTap = 0;
      } else {
        lastTap = now;
      }
    }
    if (pointers.size === 1) {
      var rem = Array.from(pointers.values())[0];
      startX = rem.x; startY = rem.y;
      startTX = tx; startTY = ty;
    }
  });

  ov.addEventListener('pointercancel', function(e) {
    pointers.delete(e.pointerId);
  });

  function closeZoom() {
    ov.remove();
    document.body.style.overflow = '';
  }
  close.onclick = closeZoom;
  ov.addEventListener('click', function(e) { if (e.target === ov) closeZoom(); });
}

// ---------- OPEN USER PROFILE ----------
async function openUserProfile(uid) {
  if (!uid) return;
  try {
    var snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) { toast('User not found', 'error'); return; }
    var u = snap.data();

    var isMe = uid === State.user.uid;
    var avatar = u.avatar || '';
    var ign = u.ign || 'Unknown';
    var rank = u.rank || 'Rookie';
    var region = u.region || 'Africa';
    var bio = u.bio || '';
    var favGun = u.favGun || '';
    var isPro = u.isPro || false;
    var verified = u.verified || false;
    var theme = PROFILE_THEMES[u.themeStyle] || PROFILE_THEMES.dark;
    var frame = AVATAR_FRAMES[u.avatarFrame] || AVATAR_FRAMES.none;

    var html =
      '<div style="background:' + theme.gradient + ';border:1px solid ' + theme.border + ';border-radius:20px;padding:20px;' + (theme.glow !== 'none' ? 'box-shadow:' + theme.glow + ';' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:16px;">' +
          '<div style="' + frame.style + '">' +
            '<div style="width:72px;height:72px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:24px;color:' + theme.nameColor + ';">' +
              (avatar ? '<img src="' + esc(avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(ign)) +
            '</div>' +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<div style="font-weight:800;font-size:18px;color:' + theme.nameColor + ';">' + esc(ign) + '</div>' +
              (isPro ? '<span style="font-size:15px;">👑</span>' : '') +
              (verified ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#1DA1F2;color:#fff;font-size:9px;font-weight:900;">✓</span>' : '') +
            '</div>' +
            '<div style="font-size:12px;color:#aaa;margin-top:3px;">' + esc(rank) + ' • ' + esc(region) + '</div>' +
          '</div>' +
        '</div>' +
        (bio ? '<div style="margin-top:14px;font-size:13px;color:#ccc;line-height:1.5;">' + esc(bio) + '</div>' : '') +
        (favGun ? '<div style="margin-top:10px;font-size:12px;color:#888;">🎯 Favorite: <span style="color:#fff;font-weight:700;">' + esc(favGun) + '</span></div>' : '') +
      '</div>' +
      '<div style="display:flex;gap:10px;margin-top:14px;">' +
        (isMe ? '' :
          '<button id="prof-friend-btn" style="flex:1;padding:12px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;">Add Friend</button>') +
        '<button id="prof-msg-btn" style="flex:1;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:800;font-size:13px;cursor:pointer;">' +
          (isMe ? '📷 Copy Link' : 'Message') +
        '</button>' +
      '</div>';

    openSheet(html, '');

    if (!isMe) {
      document.getElementById('prof-friend-btn').onclick = async function() {
        try {
          if ((State.profile.friends || []).includes(uid)) { toast('Already friends', 'info'); return; }
          if ((State.profile.friendRequestsSent || []).includes(uid)) { toast('Request already sent', 'info'); return; }
          await updateDoc(doc(db, 'users', State.user.uid), { friendRequestsSent: arrayUnion(uid) });
          await updateDoc(doc(db, 'users', uid), { friendRequests: arrayUnion(State.user.uid) });
          State.profile.friendRequestsSent = State.profile.friendRequestsSent || [];
          State.profile.friendRequestsSent.push(uid);
          toast('✓ Request sent', 'success');
        } catch (e) { toast('Failed', 'error'); }
      };
      document.getElementById('prof-msg-btn').onclick = function() {
        toast('DMs coming soon', 'info');
      };
    } else {
      document.getElementById('prof-msg-btn').onclick = function() {
        copyText(location.origin + '/?profile=' + uid, 'Profile link copied!');
        closeSheet();
      };
    }
  } catch (e) {
    console.error('Open profile error:', e);
    toast('Failed to open profile', 'error');
  }
}

// ---------- EXPOSE ----------
window.openWritePostSheet = openWritePostSheet;
window.openEditPostSheet = openEditPostSheet;
window.openImageZoom = openImageZoom;
window.openUserProfile = openUserProfile;

console.log('✅ Chunk 4/8 Part 3/3 loaded — Write Post + Zoom + Profile');
// ============================================
// END OF CHUNK 4/8 — PART 3/3
// ============================================
// ============================================
// CHUNK 5/8 — PART 1/3
// Play Tab — LFG board
// ============================================

// ---------- RENDER PLAY TAB ----------
async function renderPlayTab() {
  var content = document.getElementById('content');
  if (!content) return;

  var f = State.filters.lobbies;

  content.innerHTML =
    '<div style="padding:16px 16px 100px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '<div>' +
          '<h1 style="font-size:24px;font-weight:800;color:#fff;margin:0;">Find Squad</h1>' +
          '<p style="font-size:12px;color:#888;margin:2px 0 0;">Join a lobby and dominate</p>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button id="play-party-btn" style="width:40px;height:40px;border-radius:50%;background:#141414;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
            '<i data-lucide="users" style="width:16px;height:16px;color:#fff;"></i>' +
          '</button>' +
          '<button id="play-post-btn" style="height:40px;padding:0 16px;border-radius:20px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;">' +
            '<i data-lucide="plus" style="width:14px;height:14px;"></i> Post' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">' +
        '<button class="play-filter" data-key="rank" data-value="' + f.rank + '" style="padding:9px;border-radius:10px;background:#141414;border:1px solid #222;color:#ccc;font-size:11px;font-weight:700;cursor:pointer;">' + (f.rank === 'all' ? 'All Ranks' : f.rank) + '</button>' +
        '<button class="play-filter" data-key="mode" data-value="' + f.mode + '" style="padding:9px;border-radius:10px;background:#141414;border:1px solid #222;color:#ccc;font-size:11px;font-weight:700;cursor:pointer;">' + (f.mode === 'all' ? 'All Modes' : f.mode) + '</button>' +
        '<button class="play-filter" data-key="region" data-value="' + f.region + '" style="padding:9px;border-radius:10px;background:#141414;border:1px solid #222;color:#ccc;font-size:11px;font-weight:700;cursor:pointer;">' + (f.region === 'all' ? 'All Regions' : f.region) + '</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:14px;">' +
        '<input id="play-search" type="text" placeholder="Search by IGN or note..." value="' + esc(f.search) + '" style="flex:1;padding:11px 14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
        '<button id="play-mic-filter" style="padding:11px 14px;border-radius:12px;background:' + (f.mic ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (f.mic ? '#ff6b00' : '#222') + ';color:' + (f.mic ? '#ff6b00' : '#888') + ';font-weight:700;font-size:12px;cursor:pointer;">🎙️ Mic</button>' +
      '</div>' +
      '<div id="play-feed"><div class="spinner" style="margin:24px auto;"></div></div>' +
    '</div>';

  // Wire post button
  document.getElementById('play-post-btn').onclick = function() {
    if (typeof openPostLobbySheet === 'function') openPostLobbySheet();
  };
  document.getElementById('play-party-btn').onclick = function() {
    if (typeof openPartySheet === 'function') openPartySheet();
  };

  // Wire filters
  document.querySelectorAll('.play-filter').forEach(function(btn) {
    btn.onclick = function() {
      var key = btn.dataset.key;
      var options = key === 'rank' ? ['all'].concat(RANKS) : key === 'mode' ? ['all'].concat(MODES) : ['all'].concat(REGIONS);
      var html = '<div style="display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto;">';
      options.forEach(function(o) {
        var active = f[key] === o;
        html += '<button class="pick-opt" data-value="' + esc(o) + '" style="padding:12px;border-radius:10px;background:' + (active ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (active ? '#ff6b00' : '#222') + ';color:' + (active ? '#ff6b00' : '#fff') + ';text-align:left;font-size:13px;font-weight:700;cursor:pointer;">' + esc(o === 'all' ? 'All' : o) + '</button>';
      });
      html += '</div>';
      openSheet(html, 'Filter ' + key);
      document.querySelectorAll('.pick-opt').forEach(function(b) {
        b.onclick = function() {
          State.filters.lobbies[key] = b.dataset.value;
          closeSheet();
          renderPlayTab();
        };
      });
    };
  });

  // Search
  document.getElementById('play-search').addEventListener('input', function(e) {
    State.filters.lobbies.search = e.target.value;
    filterPlayFeed();
  });

  // Mic toggle
  document.getElementById('play-mic-filter').onclick = function() {
    State.filters.lobbies.mic = !State.filters.lobbies.mic;
    renderPlayTab();
  };

  // Load lobbies
  await loadLobbies();
  filterPlayFeed();

  if (window.lucide) window.lucide.createIcons();
}

// ---------- LOAD LOBBIES ----------
async function loadLobbies() {
  try {
    var snap = await getDocs(query(collection(db, 'lobbies'), orderBy('createdAt', 'desc'), limit(60)));
    var now = Date.now();
    var list = [];
    snap.forEach(function(d) {
      var data = d.data();
      var exp = data.expiresAt && data.expiresAt.toMillis ? data.expiresAt.toMillis() : (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() + 86400000 : now + 86400000);
      if (exp < now) return;
      list.push(Object.assign({ id: d.id }, data));
    });
    // Pro lobbies to top
    list.sort(function(a, b) {
      var ap = a.isPro ? 1 : 0, bp = b.isPro ? 1 : 0;
      if (ap !== bp) return bp - ap;
      var at = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
      var bt = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return bt - at;
    });
    State.cache.lobbies = list;
  } catch (e) {
    console.error('Load lobbies error:', e);
    State.cache.lobbies = [];
  }
}

// ---------- FILTER + RENDER FEED ----------
function filterPlayFeed() {
  var feedEl = document.getElementById('play-feed');
  if (!feedEl) return;
  var f = State.filters.lobbies;
  var items = State.cache.lobbies.slice();

  if (f.rank !== 'all') items = items.filter(function(i) { return i.rank === f.rank; });
  if (f.mode !== 'all') items = items.filter(function(i) { return i.mode === f.mode; });
  if (f.region !== 'all') items = items.filter(function(i) { return i.region === f.region; });
  if (f.mic) items = items.filter(function(i) { return i.mic === true; });
  if (f.search) {
    var q = f.search.toLowerCase();
    items = items.filter(function(i) {
      return (i.ign || '').toLowerCase().includes(q) || (i.note || '').toLowerCase().includes(q);
    });
  }

  if (!items.length) {
    feedEl.innerHTML = renderEmptyTab('gamepad-2', 'No lobbies found', 'Try adjusting filters or post your own', 'Post Lobby', 'play-empty-post');
    var b = document.getElementById('play-empty-post');
    if (b) b.onclick = function() { if (typeof openPostLobbySheet === 'function') openPostLobbySheet(); };
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  feedEl.innerHTML = items.map(renderPlayCard).join('');
  wirePlayCards(items);
  if (window.lucide) window.lucide.createIcons();
}

// ---------- RENDER LOBBY CARD ----------
function renderPlayCard(item) {
  var isMine = item.uid === State.user.uid;
  var avatar = item.avatar || '';
  var ign = item.ign || 'Player';
  var isPro = item.isPro || false;

  return '<div class="home-card" data-id="' + item.id + '" style="background:#111;border:1px solid ' + (isPro ? '#FFD700' : '#222') + ';border-radius:16px;padding:16px;margin-bottom:12px;">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
      '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(255,107,0,.15);color:#ff6b00;font-weight:800;">🎮 ' + esc(item.mode || 'ANY') + '</span>' +
      (isPro ? '<span style="font-size:9px;padding:3px 6px;border-radius:999px;background:rgba(255,215,0,.15);color:#FFD700;font-weight:800;">👑 PRIORITY</span>' : '') +
      '<span style="font-size:10px;color:#888;">' + timeAgo(item.createdAt) + '</span>' +
      '<div style="margin-left:auto;font-size:12px;font-weight:800;color:#ff6b00;">' + (item.players || 1) + '/5</div>' +
    '</div>' +
    '<div class="play-author" data-uid="' + (item.uid || '') + '" style="display:flex;align-items:center;gap:10px;margin-bottom:12px;cursor:pointer;">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;">' +
        (avatar ? '<img src="' + esc(avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(ign)) +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:800;font-size:15px;color:#fff;">' + esc(ign) + (isPro ? ' <span style="font-size:12px;">👑</span>' : '') + '</div>' +
        '<div style="font-size:11px;color:#888;margin-top:2px;">' + esc(item.rank || 'Rookie') + ' • ' + esc(item.region || 'Africa') + (item.mic ? ' • 🎙️' : '') + '</div>' +
      '</div>' +
    '</div>' +
    (item.note ? '<div style="font-size:13px;color:#ddd;line-height:1.5;margin-bottom:12px;white-space:pre-wrap;">' + esc(item.note) + '</div>' : '') +
    '<div style="display:flex;gap:8px;">' +
      '<button class="play-join-btn" data-id="' + item.id + '" style="flex:1;padding:12px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">' +
        '<i data-lucide="log-in" style="width:16px;height:16px;"></i> Join' +
      '</button>' +
      '<button class="play-share-btn" data-id="' + item.id + '" style="width:44px;height:44px;border-radius:12px;background:#181818;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<i data-lucide="share-2" style="width:16px;height:16px;color:#ff6b00;"></i>' +
      '</button>' +
      (isMine ?
        '<button class="play-delete-btn" data-id="' + item.id + '" style="width:44px;height:44px;border-radius:12px;background:#181818;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
          '<i data-lucide="trash-2" style="width:16px;height:16px;color:#ef4444;"></i>' +
        '</button>' :
        '<button class="play-report-btn" data-id="' + item.id + '" style="width:44px;height:44px;border-radius:12px;background:#181818;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
          '<i data-lucide="flag" style="width:16px;height:16px;color:#888;"></i>' +
        '</button>') +
    '</div>' +
  '</div>';
}

// ---------- WIRE PLAY CARDS ----------
function wirePlayCards(items) {
  var feedEl = document.getElementById('play-feed');
  if (!feedEl) return;

  feedEl.querySelectorAll('.play-join-btn').forEach(function(btn) {
    btn.onclick = function() {
      var lobby = State.cache.lobbies.find(function(l) { return l.id === btn.dataset.id; });
      if (lobby && typeof openVoiceRoom === 'function') openVoiceRoom(lobby);
    };
  });

  feedEl.querySelectorAll('.play-share-btn').forEach(function(btn) {
    btn.onclick = function() {
      var url = location.origin + '/?lobby=' + btn.dataset.id;
      if (typeof shareContent === 'function') shareContent('CODMPanda Lobby', 'Join my squad!', url);
    };
  });

  feedEl.querySelectorAll('.play-delete-btn').forEach(function(btn) {
    btn.onclick = function() {
      confirmDialog('Delete Lobby', 'This will close your lobby.', async function() {
        try {
          await deleteDoc(doc(db, 'lobbies', btn.dataset.id));
          toast('🗑 Deleted', 'success');
          State.cache.lobbies = State.cache.lobbies.filter(function(l) { return l.id !== btn.dataset.id; });
          filterPlayFeed();
        } catch (e) { toast('Failed', 'error'); }
      }, 'Delete', true);
    };
  });

  feedEl.querySelectorAll('.play-report-btn').forEach(function(btn) {
    btn.onclick = function() {
      confirmDialog('Report Lobby', 'Report this lobby for breaking rules?', async function() {
        try {
          await addDoc(collection(db, 'reports'), {
            reporterUid: State.user.uid,
            targetId: btn.dataset.id,
            targetType: 'lobby',
            reason: 'user-report',
            createdAt: serverTimestamp()
          });
          toast('✓ Reported', 'success');
        } catch (e) { toast('Failed', 'error'); }
      }, 'Report', true);
    };
  });

  feedEl.querySelectorAll('.play-author[data-uid]').forEach(function(el) {
    el.onclick = function() {
      var uid = el.dataset.uid;
      if (uid && typeof openUserProfile === 'function') openUserProfile(uid);
    };
  });
}

// ---------- POST LOBBY SHEET ----------
async function openPostLobbySheet() {
  if (!State.user) return;
  var isPro = State.profile && State.profile.isPro;

  var html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div>' +
        '<label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">Mode</label>' +
        '<select id="pl-mode" style="width:100%;margin-top:6px;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;">' +
          MODES.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">Rank</label>' +
        '<select id="pl-rank" style="width:100%;margin-top:6px;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;">' +
          RANKS.map(function(r) { return '<option value="' + r + '"' + (r === State.profile.rank ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">Region</label>' +
        '<select id="pl-region" style="width:100%;margin-top:6px;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;">' +
          REGIONS.map(function(r) { return '<option value="' + r + '"' + (r === State.profile.region ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">Role</label>' +
        '<select id="pl-role" style="width:100%;margin-top:6px;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;">' +
          ROLES.map(function(r) { return '<option value="' + r + '">' + r + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<label style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;cursor:pointer;">' +
        '<input id="pl-mic" type="checkbox" style="width:18px;height:18px;accent-color:#ff6b00;" />' +
        '<span style="font-size:13px;color:#fff;font-weight:700;">🎙️ Mic required</span>' +
      '</label>' +
      '<textarea id="pl-note" maxlength="200" placeholder="Note (optional)" style="width:100%;min-height:80px;background:#141414;border:1px solid #222;border-radius:12px;padding:12px;font-size:13px;color:#fff;outline:none;resize:none;"></textarea>' +
      '<button id="pl-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Post Lobby</button>' +
    '</div>';

  openSheet(html, 'Post Lobby');

  document.getElementById('pl-submit').onclick = async function() {
    var btn = document.getElementById('pl-submit');
    btn.disabled = true;
    btn.textContent = 'Posting...';
    try {
      await addDoc(collection(db, 'lobbies'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        rank: document.getElementById('pl-rank').value,
        mode: document.getElementById('pl-mode').value,
        region: document.getElementById('pl-region').value,
        role: document.getElementById('pl-role').value,
        mic: document.getElementById('pl-mic').checked,
        note: document.getElementById('pl-note').value.trim(),
        players: 1,
        isPro: isPro,
        jitsiLink: 'codmpanda-' + State.user.uid.slice(0, 8) + '-' + Date.now(),
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 86400000)
      });
      toast('✓ Lobby posted', 'success');
      closeSheet();
      if (State.currentTab === 'home') { await fetchHomeFeed(); renderHomeFeed(); }
      else if (State.currentTab === 'play') { await loadLobbies(); filterPlayFeed(); }
    } catch (e) {
      console.error('Post lobby error:', e);
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Post Lobby';
    }
  };
}

// ---------- EXPOSE ----------
window.renderPlayTab = renderPlayTab;
window.loadLobbies = loadLobbies;
window.openPostLobbySheet = openPostLobbySheet;

console.log('✅ Chunk 5/8 Part 1/3 loaded — Play Tab (LFG)');
// ============================================
// END OF CHUNK 5/8 — PART 1/3
// ============================================
// ============================================
// CHUNK 5/8 — PART 2/3
// Voice Room (Jitsi hidden UI) + Party System
// ============================================

// ---------- OPEN VOICE ROOM ----------
function openVoiceRoom(lobby) {
  if (!lobby) return;
  if (voiceRoomState.active) { toast('Already in a room', 'info'); return; }

  var ign = lobby.ign || 'Player';
  var avatar = lobby.avatar || '';
  var mode = lobby.mode || 'ANY';
  var region = lobby.region || 'Africa';
  var players = lobby.players || 1;

  // Build full-screen overlay
  var ov = document.createElement('div');
  ov.id = 'voice-room-overlay';
  ov.style.cssText =
    'position:fixed;inset:0;z-index:200;background:#050505;display:flex;flex-direction:column;' +
    'padding-top:calc(env(safe-area-inset-top,0) + 40px);' +
    'padding-bottom:calc(env(safe-area-inset-bottom,0) + 40px);';

  ov.innerHTML =
    '<div style="text-align:center;padding:0 24px;">' +
      '<div style="font-size:12px;color:#ff6b00;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Voice Room</div>' +
      '<div style="font-size:11px;color:#666;margin-top:4px;">Connected via Jitsi</div>' +
    '</div>' +
    '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:0 24px;">' +
      '<div style="position:relative;">' +
        '<div style="position:absolute;inset:-20px;background:radial-gradient(circle,rgba(255,107,0,.3),transparent 70%);border-radius:50%;animation:voicePulse 2s ease-in-out infinite;"></div>' +
        '<div style="width:120px;height:120px;border-radius:50%;background:rgba(255,107,0,.2);border:2px solid rgba(255,107,0,.5);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800;color:#ff6b00;position:relative;">' +
          (avatar ? '<img src="' + esc(avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(ign)) +
        '</div>' +
      '</div>' +
      '<div style="text-align:center;">' +
        '<div style="font-size:20px;font-weight:800;color:#fff;">' + esc(ign) + '</div>' +
        '<div style="font-size:12px;color:#888;margin-top:4px;">' + esc(mode) + ' • ' + esc(region) + ' • ' + players + '/5</div>' +
      '</div>' +
      '<div id="voice-status" style="font-size:12px;color:#666;text-align:center;">Connecting...</div>' +
    '</div>' +
    '<div style="padding:0 40px;display:flex;gap:20px;justify-content:center;">' +
      '<button id="voice-mute" style="width:64px;height:64px;border-radius:50%;background:#141414;border:1px solid #222;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<i data-lucide="mic" style="width:24px;height:24px;color:#fff;"></i>' +
      '</button>' +
      '<button id="voice-leave" style="width:64px;height:64px;border-radius:50%;background:#ef4444;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<i data-lucide="phone-off" style="width:24px;height:24px;color:#fff;"></i>' +
      '</button>' +
    '</div>';

  document.body.appendChild(ov);
  if (window.lucide) window.lucide.createIcons();

  // Hidden Jitsi iframe container
  var jitsiWrap = document.createElement('div');
  jitsiWrap.id = 'jitsi-wrap';
  jitsiWrap.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;';
  jitsiWrap.innerHTML = '<div id="jitsi-container"></div>';
  document.body.appendChild(jitsiWrap);

  // Update voice room state
  voiceRoomState = {
    active: true,
    lobbyId: lobby.id,
    lobby: lobby,
    jitsiApi: null,
    isMuted: false,
    participants: players
  };

  // Build Jitsi room name
  var room = 'codmpanda-' + (lobby.id || lobby.jitsiLink || 'room');

  // Load Jitsi
  loadJitsi().then(function() {
    if (typeof JitsiMeetExternalAPI === 'undefined') {
      document.getElementById('voice-status').textContent = 'Voice unavailable';
      return;
    }
    try {
      var api = new JitsiMeetExternalAPI('meet.jit.si', {
        roomName: room,
        parentNode: document.getElementById('jitsi-container'),
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          disableDeepLinking: true
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false
        }
      });
      voiceRoomState.jitsiApi = api;

      api.addEventListener('videoConferenceJoined', function() {
        var st = document.getElementById('voice-status');
        if (st) st.textContent = '✓ Connected';
      });
      api.addEventListener('audioMuteStatusChanged', function(d) {
        voiceRoomState.isMuted = d.muted;
        var btn = document.getElementById('voice-mute');
        if (btn) {
          var icon = btn.querySelector('i, svg');
          if (icon) icon.style.color = d.muted ? '#ef4444' : '#fff';
        }
      });
      api.addEventListener('participantJoined', function() {
        voiceRoomState.participants++;
        var st = document.getElementById('voice-status');
        if (st) st.textContent = '✓ ' + voiceRoomState.participants + ' in room';
      });
      api.addEventListener('participantLeft', function() {
        voiceRoomState.participants = Math.max(1, voiceRoomState.participants - 1);
      });
    } catch (e) {
      console.error('Jitsi init error:', e);
      var st = document.getElementById('voice-status');
      if (st) st.textContent = 'Connection failed';
    }
  }).catch(function() {
    var st = document.getElementById('voice-status');
    if (st) st.textContent = 'Voice unavailable';
  });

  // Mute toggle
  document.getElementById('voice-mute').onclick = function() {
    if (!voiceRoomState.jitsiApi) return;
    if (voiceRoomState.isMuted) {
      voiceRoomState.jitsiApi.executeCommand('unmuteAudio');
    } else {
      voiceRoomState.jitsiApi.executeCommand('muteAudio');
    }
  };

  // Leave
  document.getElementById('voice-leave').onclick = closeVoiceRoom;
}

// ---------- LOAD JITSI SCRIPT ----------
var _jitsiLoaded = false;
function loadJitsi() {
  return new Promise(function(resolve, reject) {
    if (_jitsiLoaded && typeof JitsiMeetExternalAPI !== 'undefined') { resolve(); return; }
    if (document.getElementById('jitsi-script')) {
      var iv = setInterval(function() {
        if (typeof JitsiMeetExternalAPI !== 'undefined') { clearInterval(iv); _jitsiLoaded = true; resolve(); }
      }, 200);
      setTimeout(function() { clearInterval(iv); reject(); }, 15000);
      return;
    }
    var s = document.createElement('script');
    s.id = 'jitsi-script';
    s.src = 'https://meet.jit.si/external_api.js';
    s.onload = function() { _jitsiLoaded = true; resolve(); };
    s.onerror = function() { reject(); };
    document.head.appendChild(s);
    setTimeout(function() { if (!_jitsiLoaded) reject(); }, 15000);
  });
}

// ---------- CLOSE VOICE ROOM ----------
function closeVoiceRoom() {
  if (voiceRoomState.jitsiApi) {
    try { voiceRoomState.jitsiApi.dispose(); } catch (e) {}
  }
  var ov = document.getElementById('voice-room-overlay');
  if (ov) ov.remove();
  var jw = document.getElementById('jitsi-wrap');
  if (jw) jw.remove();
  voiceRoomState = { active: false, lobbyId: null, lobby: null, jitsiApi: null, isMuted: false, participants: 0 };
}

// ---------- PARTY SYSTEM ----------
async function openPartySheet() {
  if (!State.user) return;

  var partyId = State.profile && State.profile.currentParty;
  var html;

  if (partyId) {
    // Show existing party
    try {
      var snap = await getDoc(doc(db, 'parties', partyId));
      if (snap.exists()) {
        var party = snap.data();
        var isLeader = party.leaderUid === State.user.uid;
        var members = party.members || [];
        html =
          '<div style="display:flex;flex-direction:column;gap:14px;">' +
            '<div style="display:flex;align-items:center;gap:10px;padding:14px;background:#141414;border:1px solid #222;border-radius:14px;">' +
              '<div style="font-size:24px;">🎉</div>' +
              '<div style="flex:1;">' +
                '<div style="font-weight:800;color:#fff;font-size:14px;">Your Party</div>' +
                '<div style="font-size:11px;color:#888;">' + members.length + ' member' + (members.length === 1 ? '' : 's') + '</div>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">' +
              members.map(function(m) {
                return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#141414;border:1px solid #222;border-radius:12px;">' +
                  '<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;font-size:12px;">' +
                    (m.avatar ? '<img src="' + esc(m.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(m.ign || '?')) +
                  '</div>' +
                  '<div style="flex:1;">' +
                    '<div style="font-weight:700;color:#fff;font-size:13px;">' + esc(m.ign || 'Player') + (m.uid === party.leaderUid ? ' 👑' : '') + '</div>' +
                    '<div style="font-size:10px;color:#888;">' + esc(m.rank || 'Rookie') + '</div>' +
                  '</div>' +
                  (isLeader && m.uid !== State.user.uid ?
                    '<button class="party-kick" data-uid="' + m.uid + '" style="padding:6px 10px;border-radius:8px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:700;font-size:11px;cursor:pointer;">Kick</button>' : '') +
                '</div>';
              }).join('') +
            '</div>' +
            '<button id="party-post-lobby" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">🎮 Post Party Lobby</button>' +
            '<button id="party-invite" style="padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">+ Invite Friends</button>' +
            (isLeader ?
              '<button id="party-disband" style="padding:12px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:700;font-size:13px;cursor:pointer;">Disband Party</button>' :
              '<button id="party-leave" style="padding:12px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:700;font-size:13px;cursor:pointer;">Leave Party</button>') +
          '</div>';

        openSheet(html, 'Party');
        wirePartySheet(partyId, party, isLeader);
        return;
      }
    } catch (e) {}
  }

  // No party — show create
  html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="text-align:center;padding:16px;">' +
        '<div style="font-size:48px;margin-bottom:12px;">🎉</div>' +
        '<div style="font-weight:800;color:#fff;font-size:16px;margin-bottom:6px;">Start a Party</div>' +
        '<div style="font-size:12px;color:#888;line-height:1.5;">Invite up to 5 friends and post a party lobby together.</div>' +
      '</div>' +
      '<button id="party-create" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Create Party</button>' +
    '</div>';

  openSheet(html, 'Party');
  document.getElementById('party-create').onclick = async function() {
    try {
      var pid = 'party_' + State.user.uid + '_' + Date.now();
      await setDoc(doc(db, 'parties', pid), {
        leaderUid: State.user.uid,
        leaderIgn: State.profile.ign,
        leaderAvatar: State.profile.avatar || '',
        members: [{
          uid: State.user.uid,
          ign: State.profile.ign,
          avatar: State.profile.avatar || '',
          rank: State.profile.rank || 'Rookie'
        }],
        maxSize: 5,
        status: 'open',
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', State.user.uid), { currentParty: pid });
      State.profile.currentParty = pid;
      toast('✓ Party created', 'success');
      closeSheet();
      openPartySheet();
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };
}

function wirePartySheet(partyId, party, isLeader) {
  var postBtn = document.getElementById('party-post-lobby');
  if (postBtn) postBtn.onclick = function() { closeSheet(); openPostLobbySheet(); };

  var inviteBtn = document.getElementById('party-invite');
  if (inviteBtn) inviteBtn.onclick = async function() {
    try {
      var friends = State.profile.friends || [];
      if (!friends.length) { toast('No friends yet', 'info'); return; }
      var loaded = await Promise.all(friends.slice(0, 20).map(async function(uid) {
        try {
          var s = await getDoc(doc(db, 'users', uid));
          return s.exists() ? Object.assign({ uid: uid }, s.data()) : null;
        } catch (e) { return null; }
      }));
      var valid = loaded.filter(function(u) { return u && !(party.members || []).some(function(m) { return m.uid === u.uid; }); });

      var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
      valid.forEach(function(f) {
        html += '<button class="party-invite-opt" data-uid="' + f.uid + '" data-ign="' + esc(f.ign || 'Player') + '" data-avatar="' + esc(f.avatar || '') + '" data-rank="' + esc(f.rank || 'Rookie') + '" style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;cursor:pointer;text-align:left;">' +
          '<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;font-size:12px;">' +
            (f.avatar ? '<img src="' + esc(f.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(f.ign || '?')) +
          '</div>' +
          '<div style="flex:1;color:#fff;font-weight:700;font-size:13px;">' + esc(f.ign || 'Player') + '</div>' +
          '<span style="color:#ff6b00;font-weight:800;font-size:16px;">+</span>' +
        '</button>';
      });
      html += '</div>';
      openSheet(html, 'Invite Friends');
      document.querySelectorAll('.party-invite-opt').forEach(function(btn) {
        btn.onclick = async function() {
          var newMember = {
            uid: btn.dataset.uid,
            ign: btn.dataset.ign,
            avatar: btn.dataset.avatar,
            rank: btn.dataset.rank
          };
          try {
            await updateDoc(doc(db, 'parties', partyId), { members: arrayUnion(newMember) });
            toast('✓ Invited', 'success');
            closeSheet();
            openPartySheet();
          } catch (e) { toast('Failed', 'error'); }
        };
      });
    } catch (e) { toast('Failed to load', 'error'); }
  };

  document.querySelectorAll('.party-kick').forEach(function(btn) {
    btn.onclick = async function() {
      var uid = btn.dataset.uid;
      var newMembers = (party.members || []).filter(function(m) { return m.uid !== uid; });
      try {
        await updateDoc(doc(db, 'parties', partyId), { members: newMembers });
        await updateDoc(doc(db, 'users', uid), { currentParty: '' });
        toast('✓ Kicked', 'success');
        closeSheet();
        openPartySheet();
      } catch (e) { toast('Failed', 'error'); }
    };
  });

  var disbandBtn = document.getElementById('party-disband');
  if (disbandBtn) disbandBtn.onclick = function() {
    confirmDialog('Disband Party', 'All members will be removed.', async function() {
      try {
        var members = party.members || [];
        for (var i = 0; i < members.length; i++) {
          try { await updateDoc(doc(db, 'users', members[i].uid), { currentParty: '' }); } catch (e) {}
        }
        await deleteDoc(doc(db, 'parties', partyId));
        State.profile.currentParty = '';
        toast('✓ Disbanded', 'success');
        closeSheet();
      } catch (e) { toast('Failed', 'error'); }
    }, 'Disband', true);
  };

  var leaveBtn = document.getElementById('party-leave');
  if (leaveBtn) leaveBtn.onclick = async function() {
    try {
      var newMembers = (party.members || []).filter(function(m) { return m.uid !== State.user.uid; });
      await updateDoc(doc(db, 'parties', partyId), { members: newMembers });
      await updateDoc(doc(db, 'users', State.user.uid), { currentParty: '' });
      State.profile.currentParty = '';
      toast('✓ Left', 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };
}

// ---------- EXPOSE ----------
window.openVoiceRoom = openVoiceRoom;
window.closeVoiceRoom = closeVoiceRoom;
window.openPartySheet = openPartySheet;

console.log('✅ Chunk 5/8 Part 2/3 loaded — Voice Room + Party');
// ============================================
// END OF CHUNK 5/8 — PART 2/3
// ============================================
// ============================================
// CHUNK 5/8 — PART 3/3
// Lab Tab — Vault (Gunsmith/Sens/HUD) + Gunsmith Builder
// ============================================

// ---------- RENDER LAB TAB ----------
async function renderLabTab() {
  var content = document.getElementById('content');
  if (!content) return;

  content.innerHTML =
    '<div style="padding:16px 16px 100px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
        '<div>' +
          '<h1 style="font-size:24px;font-weight:800;color:#fff;margin:0;">The Lab</h1>' +
          '<p style="font-size:12px;color:#888;margin:2px 0 0;">Builds, sens, HUD & camos</p>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">' +
        '<button class="lab-subtab" data-tab="vault" style="padding:12px;border-radius:12px;font-weight:800;font-size:13px;cursor:pointer;background:' + (labSubTab === 'vault' ? '#ff6b00' : '#141414') + ';border:1px solid ' + (labSubTab === 'vault' ? '#ff6b00' : '#222') + ';color:' + (labSubTab === 'vault' ? '#fff' : '#888') + ';">🔧 Vault</button>' +
        '<button class="lab-subtab" data-tab="camo" style="padding:12px;border-radius:12px;font-weight:800;font-size:13px;cursor:pointer;background:' + (labSubTab === 'camo' ? '#ff6b00' : '#141414') + ';border:1px solid ' + (labSubTab === 'camo' ? '#ff6b00' : '#222') + ';color:' + (labSubTab === 'camo' ? '#fff' : '#888') + ';">🎯 Camo Tracker</button>' +
      '</div>' +
      '<div id="lab-content"></div>' +
    '</div>';

  document.querySelectorAll('.lab-subtab').forEach(function(btn) {
    btn.onclick = function() {
      labSubTab = btn.dataset.tab;
      renderLabTab();
    };
  });

  if (labSubTab === 'vault') {
    await renderVaultSubTab();
  } else {
    await renderCamoSubTab();
  }
  if (window.lucide) window.lucide.createIcons();
}

// ---------- VAULT SUB-TAB ----------
async function renderVaultSubTab() {
  var wrap = document.getElementById('lab-content');
  if (!wrap) return;

  wrap.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;">' +
      ['gunsmith', 'sens', 'hud'].map(function(t) {
        var label = t === 'gunsmith' ? '🔧 Gunsmith' : t === 'sens' ? '🎯 Sensitivity' : '📱 HUD';
        var active = vaultTypeFilter === t;
        return '<button class="vault-filter-btn" data-type="' + t + '" style="padding:9px 6px;border-radius:10px;background:' + (active ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (active ? '#ff6b00' : '#222') + ';color:' + (active ? '#ff6b00' : '#888') + ';font-weight:700;font-size:11px;cursor:pointer;">' + label + '</button>';
      }).join('') +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:14px;">' +
      '<input id="vault-search" placeholder="Search builds..." value="' + esc(State.filters.vaults.search) + '" style="flex:1;padding:11px 14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
      (vaultTypeFilter === 'gunsmith' ?
        '<button id="vault-build-btn" style="padding:11px 14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:12px;cursor:pointer;">+ Build</button>' :
        '<button id="vault-submit-btn" style="padding:11px 14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:12px;cursor:pointer;">+ Submit</button>') +
    '</div>' +
    '<div id="vault-list"><div class="spinner" style="margin:24px auto;"></div></div>';

  document.querySelectorAll('.vault-filter-btn').forEach(function(btn) {
    btn.onclick = function() {
      vaultTypeFilter = btn.dataset.type;
      State.filters.vaults.type = vaultTypeFilter;
      renderVaultSubTab();
    };
  });

  document.getElementById('vault-search').addEventListener('input', function(e) {
    State.filters.vaults.search = e.target.value;
    filterVaultList();
  });

  var buildBtn = document.getElementById('vault-build-btn');
  if (buildBtn) buildBtn.onclick = function() { openGunsmithBuilder(); };

  var submitBtn = document.getElementById('vault-submit-btn');
  if (submitBtn) submitBtn.onclick = function() {
    if (vaultTypeFilter === 'sens') openSubmitSensSheet();
    else if (vaultTypeFilter === 'hud') openSubmitHudSheet();
  };

  await loadVaults();
  filterVaultList();
}

// ---------- LOAD VAULTS ----------
async function loadVaults() {
  try {
    var snap = await getDocs(query(collection(db, 'vaults'), orderBy('createdAt', 'desc'), limit(80)));
    var list = [];
    snap.forEach(function(d) { list.push(Object.assign({ id: d.id }, d.data())); });
    State.cache.vaults = list;
  } catch (e) {
    console.error('Load vaults error:', e);
    State.cache.vaults = [];
  }
}

// ---------- FILTER VAULT LIST ----------
function filterVaultList() {
  var wrap = document.getElementById('vault-list');
  if (!wrap) return;
  var items = State.cache.vaults.slice();
  items = items.filter(function(v) { return (v.type || 'gunsmith') === vaultTypeFilter; });

  if (State.filters.vaults.search) {
    var q = State.filters.vaults.search.toLowerCase();
    items = items.filter(function(v) {
      return (v.gunName || '').toLowerCase().includes(q) || (v.ign || '').toLowerCase().includes(q);
    });
  }

  if (!items.length) {
    wrap.innerHTML = renderEmptyTab('wrench', 'No ' + vaultTypeFilter + ' yet', 'Be the first to share', '+ Share Now', 'vault-empty-btn');
    var b = document.getElementById('vault-empty-btn');
    if (b) b.onclick = function() {
      if (vaultTypeFilter === 'gunsmith') openGunsmithBuilder();
      else if (vaultTypeFilter === 'sens') openSubmitSensSheet();
      else openSubmitHudSheet();
    };
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  wrap.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' + items.map(renderVaultTile).join('') + '</div>';
  wireVaultTiles(items);
  if (window.lucide) window.lucide.createIcons();
}

// ---------- RENDER VAULT TILE ----------
function renderVaultTile(v) {
  var isMine = v.uid === State.user.uid;
  var isLiked = State.likedItems.vault && State.likedItems.vault[v.id];
  var label = vaultTypeFilter === 'gunsmith' ? '🔧' : vaultTypeFilter === 'sens' ? '🎯' : '📱';

  return '<div class="vault-tile" data-id="' + v.id + '" style="background:#111;border:1px solid #222;border-radius:14px;overflow:hidden;cursor:pointer;">' +
    (v.imageUrl ?
      '<div style="aspect-ratio:1;background:#0a0a0a;overflow:hidden;"><img src="' + esc(v.imageUrl) + '" style="width:100%;height:100%;object-fit:cover;" /></div>' :
      '<div style="aspect-ratio:1;background:linear-gradient(135deg,#1a0a00,#000);display:flex;align-items:center;justify-content:center;font-size:32px;">' + label + '</div>') +
    '<div style="padding:10px;">' +
      '<div style="font-weight:800;color:#fff;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(v.gunName || 'Build') + '</div>' +
      '<div style="font-size:10px;color:#888;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">by ' + esc(v.ign || 'Player') + '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-top:8px;padding-top:8px;border-top:1px solid #1a1a1a;">' +
        '<div class="vault-like-inline" data-id="' + v.id + '" style="font-size:11px;font-weight:700;color:' + (isLiked ? '#ff6b00' : '#666') + ';cursor:pointer;">❤️ ' + (v.likes || 0) + '</div>' +
        (isMine ?
          '<button class="vault-menu-btn" data-id="' + v.id + '" style="margin-left:auto;background:none;border:none;color:#888;font-size:16px;cursor:pointer;">⋮</button>' : '') +
      '</div>' +
    '</div>' +
  '</div>';
}

// ---------- WIRE VAULT TILES ----------
function wireVaultTiles(items) {
  document.querySelectorAll('.vault-tile').forEach(function(tile) {
    tile.onclick = function(e) {
      if (e.target.closest('button') || e.target.closest('.vault-like-inline')) return;
      var v = items.find(function(x) { return x.id === tile.dataset.id; });
      if (v) openVaultDetail(v);
    };
  });

  document.querySelectorAll('.vault-like-inline').forEach(function(el) {
    el.onclick = async function(e) {
      e.stopPropagation();
      await handleLikeClick(el, 'vault', el.dataset.id);
      var liked = State.likedItems.vault && State.likedItems.vault[el.dataset.id];
      el.style.color = liked ? '#ff6b00' : '#666';
    };
  });

  document.querySelectorAll('.vault-menu-btn').forEach(function(btn) {
    btn.onclick = function(e) {
      e.stopPropagation();
      openVaultMenu(btn.dataset.id);
    };
  });
}

// ---------- OPEN VAULT DETAIL ----------
function openVaultDetail(v) {
  var isMine = v.uid === State.user.uid;
  var isLiked = State.likedItems.vault && State.likedItems.vault[v.id];

  var contentHTML = '';

  if (v.type === 'gunsmith') {
    var atts = v.attachments || {};
    contentHTML =
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        GUNSMITH_SLOTS.map(function(slot) {
          var att = atts[slot.key];
          if (!att) return '';
          return '<div style="display:flex;gap:10px;padding:10px;background:#141414;border:1px solid #222;border-radius:10px;">' +
            '<div style="width:32px;height:32px;border-radius:8px;background:rgba(255,107,0,.15);display:flex;align-items:center;justify-content:center;">' +
              '<i data-lucide="' + slot.icon + '" style="width:16px;height:16px;color:#ff6b00;"></i>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:700;">' + esc(slot.label) + '</div>' +
              '<div style="font-size:13px;color:#fff;font-weight:700;">' + esc(att) + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        (v.gunsmithCode ? '<div style="padding:12px;background:#141414;border:1px solid #222;border-radius:10px;margin-top:8px;">' +
          '<div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Gunsmith Code</div>' +
          '<div style="font-family:monospace;font-size:14px;color:#ff6b00;font-weight:800;word-break:break-all;">' + esc(v.gunsmithCode) + '</div>' +
          '<button id="vd-copy-code" style="width:100%;margin-top:10px;padding:9px;border-radius:8px;background:rgba(255,107,0,.15);border:1px solid rgba(255,107,0,.3);color:#ff6b00;font-weight:800;font-size:11px;cursor:pointer;">Copy Code</button>' +
        '</div>' : '') +
      '</div>';
  } else if (v.type === 'sens') {
    contentHTML =
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        SENS_FIELDS.map(function(s) {
          var val = (v.values || {})[s.key];
          if (val == null || val === '') return '';
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#141414;border:1px solid #222;border-radius:10px;">' +
            '<div style="font-size:12px;color:#ccc;font-weight:700;">' + esc(s.label) + '</div>' +
            '<div style="font-size:14px;color:#ff6b00;font-weight:800;">' + esc(val) + '</div>' +
          '</div>';
        }).join('') +
        (v.device ? '<div style="padding:12px;text-align:center;font-size:11px;color:#888;">Device: ' + esc(v.device) + '</div>' : '') +
      '</div>';
  } else if (v.type === 'hud') {
    contentHTML =
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<div style="padding:14px;background:#141414;border:1px solid #222;border-radius:10px;text-align:center;">' +
          '<div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Control Layout</div>' +
          '<div style="font-size:16px;color:#ff6b00;font-weight:800;">' + esc(v.hudStyle || 'Custom') + '</div>' +
        '</div>' +
        (v.notes ? '<div style="padding:12px;background:#141414;border:1px solid #222;border-radius:10px;font-size:13px;color:#ccc;line-height:1.5;">' + esc(v.notes) + '</div>' : '') +
      '</div>';
  }

  var html =
    (v.imageUrl ? '<div style="border-radius:14px;overflow:hidden;margin-bottom:14px;"><img src="' + esc(v.imageUrl) + '" style="width:100%;display:block;" /></div>' : '') +
    '<div style="margin-bottom:14px;">' +
      '<div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:4px;">' + esc(v.gunName || 'Build') + '</div>' +
      '<div style="font-size:11px;color:#888;">by ' + esc(v.ign || 'Player') + ' • ' + timeAgo(v.createdAt) + '</div>' +
    '</div>' +
    contentHTML +
    '<div style="display:flex;gap:8px;margin-top:16px;">' +
      '<button id="vd-like" style="flex:1;padding:12px;border-radius:12px;background:' + (isLiked ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (isLiked ? '#ff6b00' : '#222') + ';color:' + (isLiked ? '#ff6b00' : '#888') + ';font-weight:800;font-size:13px;cursor:pointer;">❤️ ' + (v.likes || 0) + '</button>' +
      '<button id="vd-share" style="flex:1;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:800;font-size:13px;cursor:pointer;">Share</button>' +
    '</div>';

  openSheet(html, 'Vault Detail');

  var copyBtn = document.getElementById('vd-copy-code');
  if (copyBtn) copyBtn.onclick = function() { copyText(v.gunsmithCode, 'Code copied!'); };

  document.getElementById('vd-like').onclick = async function() {
    var btn = document.getElementById('vd-like');
    await handleLikeClick(btn, 'vault', v.id);
    var liked = State.likedItems.vault && State.likedItems.vault[v.id];
    btn.style.background = liked ? 'rgba(255,107,0,.15)' : '#141414';
    btn.style.borderColor = liked ? '#ff6b00' : '#222';
    btn.style.color = liked ? '#ff6b00' : '#888';
  };

  document.getElementById('vd-share').onclick = function() {
    shareContent('CODMPanda Build', 'Check this build!', location.origin + '/?vault=' + v.id);
  };
}

// ---------- VAULT MENU ----------
function openVaultMenu(id) {
  var v = State.cache.vaults.find(function(x) { return x.id === id; });
  if (!v) return;
  var isMine = v.uid === State.user.uid;

  var html = '<div style="display:flex;flex-direction:column;gap:8px;">' +
    '<button id="vm-view" style="padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;text-align:left;font-size:14px;cursor:pointer;">👁️ View</button>' +
    '<button id="vm-share" style="padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;text-align:left;font-size:14px;cursor:pointer;">🔗 Share</button>' +
    (v.gunsmithCode ? '<button id="vm-copy" style="padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;text-align:left;font-size:14px;cursor:pointer;">📋 Copy Code</button>' : '') +
    (isMine ? '<button id="vm-delete" style="padding:14px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:700;text-align:left;font-size:14px;cursor:pointer;">🗑️ Delete</button>' : '') +
  '</div>';

  openSheet(html, 'Options');

  document.getElementById('vm-view').onclick = function() { closeSheet(); openVaultDetail(v); };
  document.getElementById('vm-share').onclick = function() {
    closeSheet();
    shareContent('CODMPanda Build', 'Check this build!', location.origin + '/?vault=' + v.id);
  };
  var c = document.getElementById('vm-copy');
  if (c) c.onclick = function() { copyText(v.gunsmithCode, 'Code copied!'); closeSheet(); };
  var d = document.getElementById('vm-delete');
  if (d) d.onclick = function() {
    closeSheet();
    confirmDialog('Delete Build', 'This will permanently remove your build.', async function() {
      try {
        await deleteDoc(doc(db, 'vaults', id));
        toast('🗑 Deleted', 'success');
        State.cache.vaults = State.cache.vaults.filter(function(x) { return x.id !== id; });
        filterVaultList();
      } catch (e) { toast('Failed', 'error'); }
    }, 'Delete', true);
  };
}

// ---------- EXPOSE ----------
window.renderLabTab = renderLabTab;
window.loadVaults = loadVaults;
window.openVaultDetail = openVaultDetail;
window.openVaultMenu = openVaultMenu;

console.log('✅ Chunk 5/8 Part 3/3 loaded — Lab Tab (Vault)');
// ============================================
// END OF CHUNK 5/8 — PART 3/3
// ============================================
// ============================================
// CHUNK 6/8 — PART 1/3
// Gunsmith Builder (90+ guns, 9 slots, live stats, presets)
// ============================================

// ---------- OPEN BUILDER ----------
function openGunsmithBuilder() {
  if (!State.user) return;
  BuilderState = { selectedGun: null, selectedAttachments: {}, activeSlot: null };
  showGunPicker();
}

// ---------- SCREEN 1: GUN PICKER ----------
function showGunPicker() {
  var cat = 'Assault Rifle';
  var contentHTML =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<input id="gp-search" placeholder="Search guns..." style="width:100%;padding:12px 14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" />' +
      '<div id="gp-cats" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none;">' +
        Object.keys(CODM_GUNS).map(function(c) {
          var meta = GUN_CATEGORY_META[c];
          var active = c === cat;
          return '<button class="gp-cat" data-cat="' + esc(c) + '" style="flex-shrink:0;padding:8px 12px;border-radius:10px;background:' + (active ? meta.bg : '#141414') + ';border:1px solid ' + (active ? meta.color : '#222') + ';color:' + (active ? meta.color : '#888') + ';font-weight:700;font-size:11px;cursor:pointer;white-space:nowrap;">' + meta.emoji + ' ' + c + '</button>';
        }).join('') +
      '</div>' +
      '<div id="gp-list" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"></div>' +
    '</div>';

  openSheet(contentHTML, 'Choose a Gun');

  function renderGunList(search) {
    var list = CODM_GUNS[cat] || [];
    if (search) {
      var q = search.toLowerCase();
      var all = [];
      Object.keys(CODM_GUNS).forEach(function(c) {
        CODM_GUNS[c].forEach(function(g) { if (g.toLowerCase().includes(q)) all.push({ gun: g, cat: c }); });
      });
      renderList(all.map(function(x) { return x.gun; }));
    } else {
      renderList(list);
    }
  }

  function renderList(guns) {
    var listEl = document.getElementById('gp-list');
    if (!listEl) return;
    var meta = GUN_CATEGORY_META[cat] || { color: '#ff6b00' };
    listEl.innerHTML = guns.map(function(g) {
      return '<button class="gp-gun" data-gun="' + esc(g) + '" style="padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:13px;cursor:pointer;text-align:center;transition:all .15s;">' + esc(g) + '</button>';
    }).join('');

    listEl.querySelectorAll('.gp-gun').forEach(function(btn) {
      btn.onmouseover = function() { btn.style.borderColor = meta.color; btn.style.color = meta.color; };
      btn.onmouseout = function() { btn.style.borderColor = '#222'; btn.style.color = '#fff'; };
      btn.onclick = function() {
        BuilderState.selectedGun = btn.dataset.gun;
        BuilderState.selectedAttachments = {};
        showBuilderSlots();
      };
    });
  }

  renderList(CODM_GUNS[cat]);

  document.querySelectorAll('.gp-cat').forEach(function(btn) {
    btn.onclick = function() {
      cat = btn.dataset.cat;
      showGunPicker();
    };
  });

  document.getElementById('gp-search').addEventListener('input', function(e) {
    renderGunList(e.target.value);
  });
}

// ---------- SCREEN 2: BUILDER SLOTS ----------
function showBuilderSlots() {
  var gun = BuilderState.selectedGun;
  if (!gun) return;

  var cat = null;
  Object.keys(CODM_GUNS).forEach(function(c) {
    if (CODM_GUNS[c].indexOf(gun) !== -1) cat = c;
  });
  var meta = GUN_CATEGORY_META[cat] || { color: '#ff6b00', emoji: '🔫' };

  function render() {
    var slotsHTML = GUNSMITH_SLOTS.map(function(slot) {
      var att = BuilderState.selectedAttachments[slot.key];
      return '<button class="builder-slot" data-slot="' + slot.key + '" style="display:flex;align-items:center;gap:10px;padding:12px;background:' + (att ? 'rgba(255,107,0,.08)' : '#141414') + ';border:1px solid ' + (att ? 'rgba(255,107,0,.4)' : '#222') + ';border-radius:12px;cursor:pointer;text-align:left;width:100%;">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:' + (att ? 'rgba(255,107,0,.2)' : '#1a1a1a') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          '<i data-lucide="' + slot.icon + '" style="width:16px;height:16px;color:' + (att ? '#ff6b00' : '#666') + ';"></i>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:700;">' + esc(slot.label) + '</div>' +
          '<div style="font-size:13px;color:' + (att ? '#ff6b00' : '#666') + ';font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(att || 'None') + '</div>' +
        '</div>' +
        '<i data-lucide="' + (att ? 'check-circle' : 'plus') + '" style="width:16px;height:16px;color:' + (att ? '#ff6b00' : '#444') + ';flex-shrink:0;"></i>' +
      '</button>';
    }).join('');

    var statsHTML = STAT_CONFIG.map(function(st) {
      var val = getGunStat(gun, st.key);
      return '<div>' +
        '<div style="display:flex;justify-content:space-between;font-size:10px;font-weight:700;color:#888;margin-bottom:3px;">' +
          '<span>' + st.label + '</span>' +
          '<span style="color:' + st.color + ';">' + val + '</span>' +
        '</div>' +
        '<div style="height:5px;background:#1a1a1a;border-radius:999px;overflow:hidden;">' +
          '<div style="width:' + val + '%;height:100%;background:' + st.color + ';border-radius:999px;transition:width .3s;"></div>' +
        '</div>' +
      '</div>';
    }).join('');

    var presets = PRESET_BUILDS[gun] || [];

    var html =
      '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:' + meta.bg + ';border:1px solid ' + meta.color + ';border-radius:14px;">' +
          '<div style="font-size:32px;">' + meta.emoji + '</div>' +
          '<div style="flex:1;">' +
            '<div style="font-size:16px;font-weight:800;color:#fff;">' + esc(gun) + '</div>' +
            '<div style="font-size:11px;color:#888;">' + esc(cat || '') + '</div>' +
          '</div>' +
          '<button id="builder-change-gun" style="padding:8px 12px;border-radius:10px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.15);color:#fff;font-weight:700;font-size:11px;cursor:pointer;">Change</button>' +
        '</div>' +

        (presets.length ?
          '<div>' +
            '<div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:8px;">⚡ Quick Presets</div>' +
            '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">' +
              presets.map(function(p) {
                return '<button class="builder-preset" data-name="' + esc(p.name) + '" style="flex-shrink:0;padding:10px 14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;">' + esc(p.name) + '</button>';
              }).join('') +
            '</div>' +
          '</div>' : '') +

        '<div>' +
          '<div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:8px;">Attachments</div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' + slotsHTML + '</div>' +
        '</div>' +

        '<div>' +
          '<div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:8px;">Live Stats</div>' +
          '<div style="display:grid;grid-template-columns:1fr;gap:8px;padding:14px;background:#141414;border:1px solid #222;border-radius:14px;">' + statsHTML + '</div>' +
        '</div>' +

        '<div style="display:flex;gap:8px;">' +
          '<button id="builder-save" style="flex:1;padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">💾 Save to Vault</button>' +
          '<button id="builder-share" style="flex:1;padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">📤 Share</button>' +
        '</div>' +
      '</div>';

    openSheet(html, '');

    document.getElementById('builder-change-gun').onclick = function() { showGunPicker(); };

    document.querySelectorAll('.builder-slot').forEach(function(btn) {
      btn.onclick = function() { showAttachmentPicker(btn.dataset.slot, render); };
    });

    document.querySelectorAll('.builder-preset').forEach(function(btn) {
      btn.onclick = function() {
        var preset = presets.find(function(p) { return p.name === btn.dataset.name; });
        if (preset) {
          BuilderState.selectedAttachments = Object.assign({}, preset.attachments);
          toast('✓ ' + preset.name + ' applied', 'success');
          render();
        }
      };
    });

    document.getElementById('builder-save').onclick = saveBuildToVault;
    document.getElementById('builder-share').onclick = shareBuild;
  }

  render();
}

// ---------- SCREEN 3: ATTACHMENT PICKER ----------
function showAttachmentPicker(slot, onBack) {
  var slotInfo = GUNSMITH_SLOTS.find(function(s) { return s.key === slot; });
  var options = ATTACHMENT_POOLS[slot] || [];

  var html =
    '<div style="display:flex;flex-direction:column;gap:8px;">' +
      (BuilderState.selectedAttachments[slot] ?
        '<button id="ap-clear" style="padding:12px;border-radius:12px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:700;font-size:13px;cursor:pointer;">✕ Remove Attachment</button>' : '') +
      options.map(function(opt) {
        var active = BuilderState.selectedAttachments[slot] === opt.name;
        var effects = Object.keys(opt.effects || {}).map(function(k) {
          var v = opt.effects[k];
          return '<span style="font-size:10px;color:' + (v > 0 ? '#10b981' : '#ef4444') + ';">' + k + ' ' + (v > 0 ? '+' : '') + v + '</span>';
        }).join(' ');
        return '<button class="ap-opt" data-name="' + esc(opt.name) + '" style="padding:14px;border-radius:12px;background:' + (active ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (active ? '#ff6b00' : '#222') + ';text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:4px;">' +
          '<div style="font-size:14px;color:' + (active ? '#ff6b00' : '#fff') + ';font-weight:700;">' + esc(opt.name) + (active ? ' ✓' : '') + '</div>' +
          (effects ? '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + effects + '</div>' : '') +
        '</button>';
      }).join('') +
    '</div>';

  openSheet(html, slotInfo ? slotInfo.label : 'Choose Attachment');

  var clear = document.getElementById('ap-clear');
  if (clear) clear.onclick = function() {
    delete BuilderState.selectedAttachments[slot];
    onBack && onBack();
  };

  document.querySelectorAll('.ap-opt').forEach(function(btn) {
    btn.onclick = function() {
      BuilderState.selectedAttachments[slot] = btn.dataset.name;
      onBack && onBack();
    };
  });
}

// ---------- GET LIVE GUN STAT ----------
function getGunStat(gunName, statKey) {
  var base = GUN_BASE_STATS[gunName] || GUN_BASE_STATS['__default__'];
  var val = base[statKey] || 50;

  GUNSMITH_SLOTS.forEach(function(slot) {
    var att = BuilderState.selectedAttachments[slot.key];
    if (!att) return;
    var pool = ATTACHMENT_POOLS[slot.key] || [];
    var found = pool.find(function(p) { return p.name === att; });
    if (found && found.effects && found.effects[statKey]) {
      val += found.effects[statKey];
    }
  });

  return Math.max(0, Math.min(100, Math.round(val)));
}

// ---------- SAVE BUILD ----------
async function saveBuildToVault() {
  var gun = BuilderState.selectedGun;
  if (!gun) return;

  var isPro = State.profile && State.profile.isPro;
  if (!isPro) {
    // Check vault count
    try {
      var snap = await getDocs(query(collection(db, 'vaults'), where('uid', '==', State.user.uid), where('type', '==', 'gunsmith')));
      if (snap.size >= 3) {
        toast('💎 Free plan: 3 builds max. Upgrade to Pro.', 'warning', 3000);
        return;
      }
    } catch (e) {}
  }

  // Generate gunsmith code from attachments
  var code = 'CP-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  try {
    await addDoc(collection(db, 'vaults'), {
      uid: State.user.uid,
      ign: State.profile.ign,
      avatar: State.profile.avatar || '',
      gunName: gun,
      gunsmithCode: code,
      type: 'gunsmith',
      attachments: BuilderState.selectedAttachments,
      likes: 0,
      approved: true,
      createdAt: serverTimestamp()
    });
    toast('✓ Saved to Vault', 'success');
    closeSheet();
    if (State.currentTab === 'home') { await fetchHomeFeed(); renderHomeFeed(); }
    else if (State.currentTab === 'lab') { await loadVaults(); filterVaultList(); }
  } catch (e) {
    console.error('Save build error:', e);
    toast('Failed: ' + e.message, 'error');
  }
}

// ---------- SHARE BUILD ----------
function shareBuild() {
  var gun = BuilderState.selectedGun;
  var atts = Object.keys(BuilderState.selectedAttachments).map(function(k) {
    return k + ': ' + BuilderState.selectedAttachments[k];
  }).join('\n');
  var text = '🎯 My ' + gun + ' build:\n' + atts;
  shareContent('CODMPanda Build', text, location.origin);
}

// ---------- EXPOSE ----------
window.openGunsmithBuilder = openGunsmithBuilder;
window.getGunStat = getGunStat;
window.saveBuildToVault = saveBuildToVault;
window.shareBuild = shareBuild;

console.log('✅ Chunk 6/8 Part 1/3 loaded — Gunsmith Builder');
// ============================================
// END OF CHUNK 6/8 — PART 1/3
// ============================================
// ============================================
// CHUNK 6/8 — PART 2/3
// Submit Sens + HUD sheets + Camo Tracker
// ============================================

// ---------- SUBMIT SENSITIVITY ----------
function openSubmitSensSheet() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<input id="ss-title" placeholder="Title (e.g. My best sens)" maxlength="40" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" />' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
        SENS_FIELDS.map(function(s) {
          return '<div>' +
            '<label style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;">' + esc(s.label) + '</label>' +
            '<input class="sens-input" data-key="' + s.key + '" type="number" min="0" max="500" placeholder="' + esc(s.placeholder) + '" style="width:100%;margin-top:4px;padding:10px;border-radius:10px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
          '</div>';
        }).join('') +
      '</div>' +
      '<input id="ss-device" placeholder="Device (optional)" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
      '<textarea id="ss-notes" placeholder="Notes (optional)" maxlength="200" style="width:100%;min-height:70px;background:#141414;border:1px solid #222;border-radius:12px;padding:12px;font-size:13px;color:#fff;outline:none;resize:none;"></textarea>' +
      '<button id="ss-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Submit Sensitivity</button>' +
    '</div>';

  openSheet(html, 'Submit Sensitivity');

  document.getElementById('ss-submit').onclick = async function() {
    var title = document.getElementById('ss-title').value.trim();
    if (!title) { toast('Title required', 'error'); return; }

    var values = {};
    document.querySelectorAll('.sens-input').forEach(function(inp) {
      if (inp.value) values[inp.dataset.key] = inp.value;
    });
    if (!Object.keys(values).length) { toast('Fill at least one field', 'error'); return; }

    var btn = document.getElementById('ss-submit');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      await addDoc(collection(db, 'vaults'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        gunName: title,
        type: 'sens',
        values: values,
        device: document.getElementById('ss-device').value.trim(),
        notes: document.getElementById('ss-notes').value.trim(),
        likes: 0,
        approved: true,
        createdAt: serverTimestamp()
      });
      toast('✓ Submitted', 'success');
      closeSheet();
      if (State.currentTab === 'lab') { await loadVaults(); filterVaultList(); }
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit Sensitivity';
    }
  };
}

// ---------- SUBMIT HUD ----------
function openSubmitHudSheet() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<input id="hs-title" placeholder="Title (e.g. 4-finger claw)" maxlength="40" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" />' +
      '<div>' +
        '<label style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;">HUD Layout</label>' +
        '<div id="hs-style-picker" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;">' +
          HUD_STYLES.map(function(s) {
            return '<button class="hud-style-opt" data-style="' + esc(s) + '" style="padding:10px;border-radius:10px;background:#141414;border:1px solid #222;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">' + esc(s) + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<textarea id="hs-notes" placeholder="Notes (button sizes, layout tips)" maxlength="300" style="width:100%;min-height:90px;background:#141414;border:1px solid #222;border-radius:12px;padding:12px;font-size:13px;color:#fff;outline:none;resize:none;"></textarea>' +
      '<button id="hs-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Submit HUD</button>' +
    '</div>';

  openSheet(html, 'Submit HUD Layout');

  var selectedStyle = HUD_STYLES[0];
  document.querySelectorAll('.hud-style-opt').forEach(function(btn) {
    btn.onclick = function() {
      selectedStyle = btn.dataset.style;
      document.querySelectorAll('.hud-style-opt').forEach(function(b) {
        var a = b.dataset.style === selectedStyle;
        b.style.background = a ? 'rgba(255,107,0,.15)' : '#141414';
        b.style.borderColor = a ? '#ff6b00' : '#222';
        b.style.color = a ? '#ff6b00' : '#fff';
      });
    };
  });
  document.querySelector('.hud-style-opt').click();

  document.getElementById('hs-submit').onclick = async function() {
    var title = document.getElementById('hs-title').value.trim();
    if (!title) { toast('Title required', 'error'); return; }

    var btn = document.getElementById('hs-submit');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      await addDoc(collection(db, 'vaults'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        avatar: State.profile.avatar || '',
        gunName: title,
        type: 'hud',
        hudStyle: selectedStyle,
        notes: document.getElementById('hs-notes').value.trim(),
        likes: 0,
        approved: true,
        createdAt: serverTimestamp()
      });
      toast('✓ Submitted', 'success');
      closeSheet();
      if (State.currentTab === 'lab') { await loadVaults(); filterVaultList(); }
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Submit HUD';
    }
  };
}

// ---------- CAMO TRACKER ----------
async function renderCamoSubTab() {
  var wrap = document.getElementById('lab-content');
  if (!wrap) return;

  var isPro = State.profile && State.profile.isPro;

  // Load camo data
  var camoData = {};
  try {
    var snap = await getDoc(doc(db, 'camos', State.user.uid));
    if (snap.exists()) camoData = snap.data();
  } catch (e) {}

  var trackedGuns = Object.keys(camoData).filter(function(k) { return k !== '__skins'; });
  var trackedCount = trackedGuns.length;
  var freeLimit = 5;
  var canAddMore = isPro || trackedCount < freeLimit;

  // Calculate overall progress
  var totalCamos = 0;
  var completedCamos = 0;
  trackedGuns.forEach(function(gun) {
    CAMO_TYPES.forEach(function(c) {
      totalCamos++;
      if (camoData[gun] && camoData[gun][c.key]) completedCamos++;
    });
  });
  var pct = totalCamos ? Math.round((completedCamos / totalCamos) * 100) : 0;

  var html =
    '<div style="background:linear-gradient(135deg,#1a0a00,#000);border:1px solid #222;border-radius:16px;padding:18px;margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;gap:14px;">' +
        '<div style="position:relative;width:80px;height:80px;">' +
          '<svg viewBox="0 0 100 100" style="transform:rotate(-90deg);width:100%;height:100%;">' +
            '<circle cx="50" cy="50" r="42" stroke="#222" stroke-width="8" fill="none" />' +
            '<circle cx="50" cy="50" r="42" stroke="#ff6b00" stroke-width="8" fill="none" stroke-dasharray="' + (2 * Math.PI * 42) + '" stroke-dashoffset="' + (2 * Math.PI * 42 * (1 - pct / 100)) + '" stroke-linecap="round" />' +
          '</svg>' +
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#ff6b00;">' + pct + '%</div>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:16px;font-weight:800;color:#fff;">Damascus Progress</div>' +
          '<div style="font-size:11px;color:#888;margin-top:4px;">' + completedCamos + '/' + totalCamos + ' camos unlocked</div>' +
          '<div style="font-size:11px;color:#888;">' + trackedCount + ' gun' + (trackedCount === 1 ? '' : 's') + ' tracked</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    (canAddMore ?
      '<button id="camo-add-btn" style="width:100%;padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;margin-bottom:14px;">+ Add Gun</button>' :
      '<div style="padding:14px;border-radius:12px;background:rgba(255,215,0,.1);border:1px solid rgba(255,215,0,.3);text-align:center;margin-bottom:14px;">' +
        '<div style="font-size:12px;color:#FFD700;font-weight:700;margin-bottom:8px;">💎 Free plan: ' + freeLimit + ' guns max</div>' +
        '<button style="padding:10px 20px;border-radius:10px;background:#FFD700;border:none;color:#000;font-weight:800;font-size:12px;cursor:pointer;">Upgrade to Pro</button>' +
      '</div>') +

    '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
      '<button id="camo-skins-btn" style="flex:1;padding:11px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:12px;cursor:pointer;">🎨 Weapon Skins</button>' +
      '<button id="camo-export-btn" style="flex:1;padding:11px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:12px;cursor:pointer;">📸 Export</button>' +
    '</div>' +

    '<div id="camo-list"></div>';

  wrap.innerHTML = html;

  document.getElementById('camo-add-btn') && (document.getElementById('camo-add-btn').onclick = openCamoAddSheet);
  document.getElementById('camo-skins-btn').onclick = openWeaponSkinsSheet;
  document.getElementById('camo-export-btn').onclick = function() { toast('Export coming soon', 'info'); };

  // Render gun list
  var listEl = document.getElementById('camo-list');
  if (trackedGuns.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#666;font-size:13px;">No guns tracked yet. Add one to start.</div>';
  } else {
    listEl.innerHTML = trackedGuns.map(function(gun) {
      var gunData = camoData[gun] || {};
      var done = 0;
      CAMO_TYPES.forEach(function(c) { if (gunData[c.key]) done++; });
      var gpct = Math.round((done / CAMO_TYPES.length) * 100);
      return '<div class="camo-gun-row" data-gun="' + esc(gun) + '" style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;color:#fff;font-size:14px;">' + esc(gun) + '</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px;">' + done + '/' + CAMO_TYPES.length + ' camos</div>' +
          '</div>' +
          '<div style="font-size:14px;font-weight:800;color:#ff6b00;">' + gpct + '%</div>' +
        '</div>' +
        '<div style="height:4px;background:#1a1a1a;border-radius:999px;overflow:hidden;margin-bottom:8px;">' +
          '<div style="width:' + gpct + '%;height:100%;background:#ff6b00;border-radius:999px;"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;">' +
          CAMO_TYPES.map(function(c) {
            var checked = gunData[c.key];
            return '<button class="camo-cell" data-gun="' + esc(gun) + '" data-camo="' + c.key + '" style="aspect-ratio:1;border-radius:8px;background:' + (checked ? c.color : '#1a1a1a') + ';border:1px solid ' + (checked ? c.color : '#222') + ';cursor:pointer;color:' + (checked ? '#000' : '#666') + ';font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;">' + (checked ? '✓' : c.label.substring(0, 3)) + '</button>';
          }).join('') +
        '</div>' +
      '</div>';
    }).join('');

    document.querySelectorAll('.camo-cell').forEach(function(btn) {
      btn.onclick = async function(e) {
        e.stopPropagation();
        var gun = btn.dataset.gun;
        var camo = btn.dataset.camo;
        var current = (camoData[gun] || {})[camo] || false;
        var newVal = !current;

        if (!camoData[gun]) camoData[gun] = {};
        camoData[gun][camo] = newVal;

        btn.style.background = newVal ? CAMO_TYPES.find(function(c) { return c.key === camo; }).color : '#1a1a1a';
        btn.style.borderColor = newVal ? CAMO_TYPES.find(function(c) { return c.key === camo; }).color : '#222';
        btn.style.color = newVal ? '#000' : '#666';
        btn.textContent = newVal ? '✓' : camo.substring(0, 3);

        try {
          await setDoc(doc(db, 'camos', State.user.uid), { [gun]: camoData[gun] }, { merge: true });
        } catch (err) {
          // Rollback on failure
          camoData[gun][camo] = current;
        }
      };
    });
  }

  if (window.lucide) window.lucide.createIcons();
}

// ---------- ADD CAMO GUN ----------
function openCamoAddSheet() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      Object.keys(CODM_GUNS).map(function(cat) {
        return '<div>' +
          '<div style="font-size:11px;color:#888;text-transform:uppercase;font-weight:800;margin-bottom:6px;">' + cat + '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
            CODM_GUNS[cat].map(function(g) {
              return '<button class="camo-add-gun" data-gun="' + esc(g) + '" style="padding:8px 12px;border-radius:10px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:12px;cursor:pointer;">' + esc(g) + '</button>';
            }).join('') +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';

  openSheet(html, 'Add Gun to Tracker');

  document.querySelectorAll('.camo-add-gun').forEach(function(btn) {
    btn.onclick = async function() {
      var gun = btn.dataset.gun;
      try {
        await setDoc(doc(db, 'camos', State.user.uid), { [gun]: {} }, { merge: true });
        toast('✓ Added ' + gun, 'success');
        closeSheet();
        renderCamoSubTab();
      } catch (e) { toast('Failed', 'error'); }
    };
  });
}

// ---------- WEAPON SKINS SHEET ----------
async function openWeaponSkinsSheet() {
  var snap = await getDoc(doc(db, 'camos', State.user.uid));
  var data = snap.exists() ? snap.data() : {};
  var skins = data.__skins || {};

  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<button id="ws-add" style="padding:12px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;">+ Add Skin</button>' +
      (Object.keys(skins).length === 0 ?
        '<div style="text-align:center;padding:32px 16px;color:#666;font-size:13px;">No skins tracked yet</div>' :
        Object.keys(skins).map(function(name) {
          var s = skins[name];
          var rar = SKIN_RARITIES.find(function(r) { return r.key === s.rarity; }) || SKIN_RARITIES[0];
          return '<div style="padding:12px;background:#141414;border:1px solid #222;border-radius:12px;border-left:3px solid ' + rar.color + ';">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;">' +
              '<div style="flex:1;">' +
                '<div style="font-weight:800;color:#fff;font-size:14px;">' + esc(name) + '</div>' +
                '<div style="font-size:11px;color:#888;">' + esc(s.gun || '') + ' • ' + rar.emoji + ' ' + rar.label + '</div>' +
              '</div>' +
              '<button class="ws-del" data-name="' + esc(name) + '" style="padding:6px 10px;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:700;font-size:11px;cursor:pointer;">✕</button>' +
            '</div>' +
          '</div>';
        }).join('')) +
    '</div>';

  openSheet(html, '🎨 Weapon Skins');

  document.getElementById('ws-add').onclick = function() {
    var addHtml =
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
        '<input id="ws-name" placeholder="Skin name" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" />' +
        '<input id="ws-gun" placeholder="Gun (optional)" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
        '<div>' +
          '<div style="font-size:11px;color:#888;text-transform:uppercase;font-weight:700;margin-bottom:6px;">Rarity</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
            SKIN_RARITIES.map(function(r) {
              return '<button class="ws-rar" data-rar="' + r.key + '" style="padding:10px;border-radius:10px;background:#141414;border:1px solid ' + r.color + ';color:' + r.color + ';font-weight:700;font-size:12px;cursor:pointer;">' + r.emoji + ' ' + r.label + '</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<button id="ws-save" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Save Skin</button>' +
      '</div>';
    openSheet(addHtml, 'Add Skin');

    var rarity = 'common';
    document.querySelectorAll('.ws-rar').forEach(function(b) {
      b.onclick = function() {
        rarity = b.dataset.rar;
        document.querySelectorAll('.ws-rar').forEach(function(x) {
          var a = x.dataset.rar === rarity;
          x.style.background = a ? 'rgba(255,107,0,.15)' : '#141414';
        });
      };
    });

    document.getElementById('ws-save').onclick = async function() {
      var name = document.getElementById('ws-name').value.trim();
      if (!name) { toast('Name required', 'error'); return; }
      try {
        await setDoc(doc(db, 'camos', State.user.uid), {
          __skins: Object.assign({}, skins, { [name]: { gun: document.getElementById('ws-gun').value.trim(), rarity: rarity, date: Date.now() } })
        }, { merge: true });
        toast('✓ Skin added', 'success');
        openWeaponSkinsSheet();
      } catch (e) { toast('Failed', 'error'); }
    };
  };

  document.querySelectorAll('.ws-del').forEach(function(btn) {
    btn.onclick = async function() {
      var name = btn.dataset.name;
      var newSkins = Object.assign({}, skins);
      delete newSkins[name];
      try {
        await setDoc(doc(db, 'camos', State.user.uid), { __skins: newSkins }, { merge: true });
        toast('✓ Removed', 'success');
        openWeaponSkinsSheet();
      } catch (e) { toast('Failed', 'error'); }
    };
  });
}

// ---------- EXPOSE ----------
window.openSubmitSensSheet = openSubmitSensSheet;
window.openSubmitHudSheet = openSubmitHudSheet;
window.renderCamoSubTab = renderCamoSubTab;
window.openCamoAddSheet = openCamoAddSheet;
window.openWeaponSkinsSheet = openWeaponSkinsSheet;

console.log('✅ Chunk 6/8 Part 2/3 loaded — Submit + Camo');
// ============================================
// END OF CHUNK 6/8 — PART 2/3
// ============================================
// ============================================
// CHUNK 6/8 — PART 3/3
// Squad Tab — Clans + Scrims + Clips + Top + Wars + Tournaments
// ============================================

// ---------- RENDER SQUAD TAB ----------
async function renderSquadTab() {
  var content = document.getElementById('content');
  if (!content) return;

  var subs = [
    { key: 'clans', label: 'Clans', icon: 'shield' },
    { key: 'scrims', label: 'Scrims', icon: 'swords' },
    { key: 'clips', label: 'Clips', icon: 'video' },
    { key: 'top', label: 'Top', icon: 'trophy' },
    { key: 'wars', label: 'Wars', icon: 'zap' },
    { key: 'tournaments', label: 'Events', icon: 'trophy' }
  ];

  content.innerHTML =
    '<div style="padding:16px 16px 100px;">' +
      '<h1 style="font-size:24px;font-weight:800;color:#fff;margin:0 0 4px;">Squad</h1>' +
      '<p style="font-size:12px;color:#888;margin:0 0 14px;">Clans, scrims, clips & tournaments</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:14px;">' +
        subs.map(function(s) {
          var active = squadSubTab === s.key;
          return '<button class="squad-subtab" data-tab="' + s.key + '" style="padding:10px 4px;border-radius:10px;background:' + (active ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (active ? '#ff6b00' : '#222') + ';color:' + (active ? '#ff6b00' : '#888') + ';font-weight:700;font-size:11px;cursor:pointer;">' + s.label + '</button>';
        }).join('') +
      '</div>' +
      '<div id="squad-content"></div>' +
    '</div>';

  document.querySelectorAll('.squad-subtab').forEach(function(btn) {
    btn.onclick = function() {
      squadSubTab = btn.dataset.tab;
      renderSquadTab();
    };
  });

  var fn = {
    clans: renderClansSub,
    scrims: renderScrimsSub,
    clips: renderClipsSub,
    top: renderTopSub,
    wars: renderWarsSub,
    tournaments: renderTournamentsSub
  }[squadSubTab];

  if (fn) await fn();
  if (window.lucide) window.lucide.createIcons();
}

// ---------- CLANS ----------
async function renderClansSub() {
  var wrap = document.getElementById('squad-content');
  wrap.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
    '<input id="clan-search" placeholder="Search clans..." style="flex:1;padding:11px 14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
    '<button id="clan-create-btn" style="padding:11px 14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:12px;cursor:pointer;">+ Create</button>' +
  '</div><div id="clan-list"><div class="spinner" style="margin:24px auto;"></div></div>';

  document.getElementById('clan-create-btn').onclick = openCreateClanSheet;

  try {
    var snap = await getDocs(query(collection(db, 'clans'), limit(50)));
    var clans = [];
    snap.forEach(function(d) { clans.push(Object.assign({ id: d.id }, d.data())); });
    State.cache.clans = clans;

    var list = document.getElementById('clan-list');
    if (!clans.length) {
      list.innerHTML = renderEmptyTab('shield', 'No clans yet', 'Create the first one', 'Create Clan', 'clan-empty-btn');
      var b = document.getElementById('clan-empty-btn');
      if (b) b.onclick = openCreateClanSheet;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    list.innerHTML = clans.map(function(c) {
      return '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">' +
        '<div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#ff6b00,#CC5500);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🛡️</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:800;color:#fff;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(c.name || 'Clan') + '</div>' +
          '<div style="font-size:11px;color:#888;">Lv ' + (c.level || 1) + ' • ' + (c.members || []).length + ' members • ' + esc(c.region || 'Global') + '</div>' +
        '</div>' +
        '<button class="clan-view-btn" data-id="' + c.id + '" style="padding:8px 14px;border-radius:10px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:11px;cursor:pointer;">View</button>' +
      '</div>';
    }).join('');

    document.querySelectorAll('.clan-view-btn').forEach(function(b) {
      b.onclick = function() {
        var c = clans.find(function(x) { return x.id === b.dataset.id; });
        if (c) toast(c.name + ' — ' + (c.members || []).length + ' members', 'info', 2500);
      };
    });

    var s = document.getElementById('clan-search');
    if (s) s.addEventListener('input', function(e) {
      var q = e.target.value.toLowerCase();
      document.querySelectorAll('#clan-list > div').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  } catch (e) {
    document.getElementById('clan-list').innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed to load</div>';
  }
}

function openCreateClanSheet() {
  var isPro = State.profile && State.profile.isPro;
  if (!isPro) { toast('💎 Pro required to create clans', 'warning', 2500); return; }

  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<input id="cc-name" placeholder="Clan name" maxlength="24" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" />' +
      '<input id="cc-kd" placeholder="Min KD requirement" type="number" step="0.1" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
      '<select id="cc-region" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;">' +
        REGIONS.map(function(r) { return '<option value="' + r + '">' + r + '</option>'; }).join('') +
      '</select>' +
      '<input id="cc-tags" placeholder="Tags (comma sep, e.g. competitive,english)" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
      '<button id="cc-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Create Clan</button>' +
    '</div>';
  openSheet(html, 'Create Clan');

  document.getElementById('cc-submit').onclick = async function() {
    var name = document.getElementById('cc-name').value.trim();
    if (name.length < 3) { toast('Name too short', 'error'); return; }
    try {
      await addDoc(collection(db, 'clans'), {
        name: name,
        level: 1,
        kdReq: parseFloat(document.getElementById('cc-kd').value) || 0,
        region: document.getElementById('cc-region').value,
        tags: document.getElementById('cc-tags').value.split(',').map(function(t) { return t.trim(); }).filter(Boolean),
        ownerUid: State.user.uid,
        members: [State.user.uid],
        createdAt: serverTimestamp()
      });
      toast('✓ Clan created', 'success');
      closeSheet();
      renderClansSub();
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };
}

// ---------- SCRIMS ----------
async function renderScrimsSub() {
  var wrap = document.getElementById('squad-content');
  wrap.innerHTML =
    '<button id="scrim-post-btn" style="width:100%;padding:12px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;margin-bottom:12px;">+ Post Scrim</button>' +
    '<div id="scrim-list"><div class="spinner" style="margin:24px auto;"></div></div>';

  document.getElementById('scrim-post-btn').onclick = openPostScrimSheet;

  try {
    var snap = await getDocs(query(collection(db, 'scrims'), limit(50)));
    var now = Date.now();
    var scrims = [];
    snap.forEach(function(d) {
      var data = d.data();
      var exp = data.expiresAt && data.expiresAt.toMillis ? data.expiresAt.toMillis() : (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() + 43200000 : now);
      if (exp < now) return;
      scrims.push(Object.assign({ id: d.id }, data));
    });
    scrims.sort(function(a, b) {
      var at = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
      var bt = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return bt - at;
    });

    var list = document.getElementById('scrim-list');
    if (!scrims.length) {
      list.innerHTML = renderEmptyTab('swords', 'No scrims', 'Post the first scrim challenge', 'Post Scrim', 'scrim-empty-btn');
      var b = document.getElementById('scrim-empty-btn');
      if (b) b.onclick = openPostScrimSheet;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    list.innerHTML = scrims.map(function(s) {
      var isMine = s.uid === State.user.uid;
      return '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
          '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(255,0,100,.15);color:#ff0064;font-weight:800;">⚔️ ' + esc(s.mode || 'SCRIM') + '</span>' +
          '<span style="font-size:10px;color:#888;">' + timeAgo(s.createdAt) + '</span>' +
        '</div>' +
        '<div style="font-weight:800;color:#fff;font-size:14px;margin-bottom:4px;">' + esc(s.ign || 'Player') + '</div>' +
        (s.text ? '<div style="font-size:13px;color:#ccc;line-height:1.5;margin-bottom:10px;">' + esc(s.text) + '</div>' : '') +
        (s.contact ? '<div style="font-size:11px;color:#888;">📞 ' + esc(s.contact) + '</div>' : '') +
        (isMine ? '<button class="scrim-del-btn" data-id="' + s.id + '" style="margin-top:10px;width:100%;padding:8px;border-radius:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:700;font-size:11px;cursor:pointer;">Delete</button>' : '') +
      '</div>';
    }).join('');

    document.querySelectorAll('.scrim-del-btn').forEach(function(b) {
      b.onclick = function() {
        confirmDialog('Delete Scrim', 'Remove your scrim post?', async function() {
          try {
            await deleteDoc(doc(db, 'scrims', b.dataset.id));
            toast('🗑 Deleted', 'success');
            renderScrimsSub();
          } catch (e) { toast('Failed', 'error'); }
        }, 'Delete', true);
      };
    });
  } catch (e) {
    document.getElementById('scrim-list').innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed</div>';
  }
}

function openPostScrimSheet() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<select id="ps-mode" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;">' +
        MODES.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('') +
      '</select>' +
      '<textarea id="ps-text" maxlength="200" placeholder="Describe your scrim (map, rules, time)" style="width:100%;min-height:100px;background:#141414;border:1px solid #222;border-radius:12px;padding:12px;font-size:13px;color:#fff;outline:none;resize:none;"></textarea>' +
      '<input id="ps-contact" placeholder="Contact (Discord, WhatsApp)" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
      '<button id="ps-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Post Scrim</button>' +
    '</div>';
  openSheet(html, 'Post Scrim');

  document.getElementById('ps-submit').onclick = async function() {
    var text = document.getElementById('ps-text').value.trim();
    if (!text) { toast('Add details', 'error'); return; }
    try {
      await addDoc(collection(db, 'scrims'), {
        uid: State.user.uid,
        ign: State.profile.ign,
        mode: document.getElementById('ps-mode').value,
        text: text,
        contact: document.getElementById('ps-contact').value.trim(),
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 43200000)
      });
      toast('✓ Scrim posted', 'success');
      closeSheet();
      renderScrimsSub();
    } catch (e) { toast('Failed', 'error'); }
  };
}

// ---------- CLIPS ----------
async function renderClipsSub() {
  var wrap = document.getElementById('squad-content');
  wrap.innerHTML =
    '<button id="clip-post-btn" style="width:100%;padding:12px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;margin-bottom:12px;">+ Submit Clip</button>' +
    '<div id="clip-list"><div class="spinner" style="margin:24px auto;"></div></div>';

  document.getElementById('clip-post-btn').onclick = openSubmitClipSheet;

  try {
    var snap = await getDocs(query(collection(db, 'clips'), limit(50)));
    var clips = [];
    snap.forEach(function(d) {
      var data = d.data();
      if (data.approved === false) return;
      clips.push(Object.assign({ id: d.id }, data));
    });

    var list = document.getElementById('clip-list');
    if (!clips.length) {
      list.innerHTML = renderEmptyTab('video', 'No clips yet', 'Share your best play', 'Post Clip', 'clip-empty-btn');
      var b = document.getElementById('clip-empty-btn');
      if (b) b.onclick = openSubmitClipSheet;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    list.innerHTML = clips.map(function(c) {
      var embedUrl = '';
      try {
        var m = (c.youtubeUrl || '').match(/(?:youtu\.be\/|v=)([\w-]{11})/);
        if (m) embedUrl = 'https://www.youtube.com/embed/' + m[1];
      } catch (e) {}
      var isLiked = State.likedItems.clip && State.likedItems.clip[c.id];

      return '<div style="background:#111;border:1px solid #222;border-radius:14px;overflow:hidden;margin-bottom:10px;">' +
        (embedUrl ? '<div style="position:relative;padding-bottom:56.25%;"><iframe src="' + embedUrl + '" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe></div>' : '') +
        '<div style="padding:12px;">' +
          '<div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:6px;">' + esc(c.gunTag || 'Clip') + '</div>' +
          '<div style="font-size:10px;color:#888;">by ' + esc(c.submittedByIgn || c.ign || 'Player') + ' • ' + timeAgo(c.createdAt) + '</div>' +
          '<div style="display:flex;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid #1a1a1a;">' +
            '<button class="clip-like-btn" data-id="' + c.id + '" style="background:none;border:none;font-size:12px;font-weight:700;color:' + (isLiked ? '#ff6b00' : '#666') + ';cursor:pointer;">❤️ ' + (c.likes || 0) + '</button>' +
            '<button class="clip-share-btn" data-id="' + c.id + '" style="background:none;border:none;font-size:12px;font-weight:700;color:#666;cursor:pointer;">🔗 Share</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    document.querySelectorAll('.clip-like-btn').forEach(function(b) {
      b.onclick = async function() {
        await handleLikeClick(b, 'clip', b.dataset.id);
        var liked = State.likedItems.clip && State.likedItems.clip[b.dataset.id];
        b.style.color = liked ? '#ff6b00' : '#666';
      };
    });
    document.querySelectorAll('.clip-share-btn').forEach(function(b) {
      b.onclick = function() { shareContent('CODMPanda Clip', 'Check this clip!', location.origin + '/?clip=' + b.dataset.id); };
    });
  } catch (e) {
    document.getElementById('clip-list').innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed</div>';
  }
}

function openSubmitClipSheet() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<input id="cp-url" placeholder="YouTube or TikTok URL" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" />' +
      '<input id="cp-tag" placeholder="Gun tag (e.g. Fennec)" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
      '<button id="cp-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Submit</button>' +
    '</div>';
  openSheet(html, 'Submit Clip');

  document.getElementById('cp-submit').onclick = async function() {
    var url = document.getElementById('cp-url').value.trim();
    if (!url) { toast('URL required', 'error'); return; }
    try {
      await addDoc(collection(db, 'clips'), {
        submittedByUid: State.user.uid,
        submittedByIgn: State.profile.ign,
        submittedByAvatar: State.profile.avatar || '',
        youtubeUrl: url,
        gunTag: document.getElementById('cp-tag').value.trim(),
        likes: 0,
        approved: true,
        createdAt: serverTimestamp()
      });
      toast('✓ Submitted', 'success');
      closeSheet();
      renderClipsSub();
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };
}

// ---------- TOP (Leaderboard) ----------
async function renderTopSub() {
  var wrap = document.getElementById('squad-content');
  wrap.innerHTML = '<div class="spinner" style="margin:24px auto;"></div>';
  try {
    var snap = await getDocs(query(collection(db, 'users'), orderBy('approvedCount', 'desc'), limit(30)));
    var users = [];
    snap.forEach(function(d) { users.push(Object.assign({ id: d.id }, d.data())); });

    if (!users.length) {
      wrap.innerHTML = '<div style="text-align:center;padding:40px;color:#888;font-size:13px;">No contributors yet</div>';
      return;
    }

    wrap.innerHTML = users.map(function(u, i) {
      var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
      return '<div style="background:#111;border:1px solid ' + (i < 3 ? '#ff6b00' : '#222') + ';border-radius:14px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">' +
        '<div style="font-size:20px;width:36px;text-align:center;">' + medal + '</div>' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;font-size:13px;">' +
          (u.avatar ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(u.ign || '?')) +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:800;color:#fff;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(u.ign || 'Player') + '</div>' +
          '<div style="font-size:11px;color:#888;">' + (u.approvedCount || 0) + ' approved</div>' +
        '</div>' +
      '</div>';
    }).join('');
  } catch (e) {
    wrap.innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed</div>';
  }
}

// ---------- WARS ----------
async function renderWarsSub() {
  var wrap = document.getElementById('squad-content');
  wrap.innerHTML =
    '<div style="background:linear-gradient(135deg,#1a0a00,#000);border:1px solid #222;border-radius:16px;padding:18px;margin-bottom:14px;text-align:center;">' +
      '<div style="font-size:44px;margin-bottom:8px;">⚔️</div>' +
      '<div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:4px;">Clan Wars</div>' +
      '<div style="font-size:11px;color:#888;">Weekly season · Resets Monday</div>' +
    '</div>' +
    '<div style="text-align:center;padding:24px;color:#888;font-size:13px;">Leaderboard coming soon</div>';
}

// ---------- TOURNAMENTS ----------
async function renderTournamentsSub() {
  var wrap = document.getElementById('squad-content');
  wrap.innerHTML =
    '<button id="tour-create-btn" style="width:100%;padding:12px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;margin-bottom:12px;">+ Create Tournament</button>' +
    '<div id="tour-list"><div class="spinner" style="margin:24px auto;"></div></div>';

  document.getElementById('tour-create-btn').onclick = openCreateTournamentSheet;

  try {
    var snap = await getDocs(query(collection(db, 'tournaments'), limit(30)));
    var tours = [];
    snap.forEach(function(d) { tours.push(Object.assign({ id: d.id }, d.data())); });
    tours.sort(function(a, b) {
      var at = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
      var bt = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return bt - at;
    });

    var list = document.getElementById('tour-list');
    if (!tours.length) {
      list.innerHTML = renderEmptyTab('trophy', 'No tournaments', 'Create the first one', 'Create', 'tour-empty-btn');
      var b = document.getElementById('tour-empty-btn');
      if (b) b.onclick = openCreateTournamentSheet;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    list.innerHTML = tours.map(function(t) {
      var statusColor = t.status === 'open' ? '#10b981' : t.status === 'in-progress' ? '#ff6b00' : '#888';
      return '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(255,107,0,.15);color:' + statusColor + ';font-weight:800;">' + esc((t.status || 'open').toUpperCase()) + '</span>' +
          '<span style="font-size:10px;color:#888;">' + esc(t.mode || 'MP') + ' • ' + (t.size || 8) + '-team</span>' +
        '</div>' +
        '<div style="font-weight:800;color:#fff;font-size:15px;margin-bottom:4px;">' + esc(t.name || 'Tournament') + '</div>' +
        (t.prize ? '<div style="font-size:11px;color:#FFD700;">🏆 ' + esc(t.prize) + '</div>' : '') +
        '<div style="font-size:11px;color:#888;margin-top:4px;">by ' + esc(t.creatorIgn || 'Admin') + '</div>' +
      '</div>';
    }).join('');
  } catch (e) {
    document.getElementById('tour-list').innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed</div>';
  }
}

function openCreateTournamentSheet() {
  var isPro = State.profile && State.profile.isPro;
  var isAdmin = State.user && State.user.uid === ADMIN_UID;
  if (!isPro && !isAdmin) { toast('💎 Pro required to create tournaments', 'warning', 2500); return; }

  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<input id="tc-name" placeholder="Tournament name" maxlength="40" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" />' +
      '<select id="tc-mode" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;">' +
        MODES.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('') +
      '</select>' +
      '<select id="tc-size" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;">' +
        [4, 8, 16, 32].map(function(s) { return '<option value="' + s + '">' + s + ' teams</option>'; }).join('') +
      '</select>' +
      '<input id="tc-prize" placeholder="Prize (optional)" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
      '<textarea id="tc-rules" placeholder="Rules" maxlength="500" style="width:100%;min-height:80px;background:#141414;border:1px solid #222;border-radius:12px;padding:12px;font-size:13px;color:#fff;outline:none;resize:none;"></textarea>' +
      '<button id="tc-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Create Tournament</button>' +
    '</div>';
  openSheet(html, 'Create Tournament');

  document.getElementById('tc-submit').onclick = async function() {
    var name = document.getElementById('tc-name').value.trim();
    if (!name) { toast('Name required', 'error'); return; }
    try {
      await addDoc(collection(db, 'tournaments'), {
        name: name,
        mode: document.getElementById('tc-mode').value,
        size: parseInt(document.getElementById('tc-size').value),
        prize: document.getElementById('tc-prize').value.trim(),
        rules: document.getElementById('tc-rules').value.trim(),
        creatorUid: State.user.uid,
        creatorIgn: State.profile.ign,
        creatorAvatar: State.profile.avatar || '',
        teams: [],
        bracket: [],
        currentRound: 0,
        status: 'open',
        createdAt: serverTimestamp()
      });
      toast('✓ Tournament created', 'success');
      closeSheet();
      renderTournamentsSub();
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };
}

// ---------- EXPOSE ----------
window.renderSquadTab = renderSquadTab;
window.openPostScrimSheet = openPostScrimSheet;
window.openSubmitClipSheet = openSubmitClipSheet;
window.openCreateClanSheet = openCreateClanSheet;
window.openCreateTournamentSheet = openCreateTournamentSheet;

console.log('✅ Chunk 6/8 Part 3/3 loaded — Squad Tab');
// ============================================
// END OF CHUNK 6/8 — PART 3/3
// ============================================
// ============================================
// CHUNK 7/8 — PART 1/3
// Intel Tab — CP Calc + Leaks + Tier + Maps
// ============================================

// ---------- RENDER INTEL TAB ----------
async function renderIntelTab() {
  var content = document.getElementById('content');
  if (!content) return;

  var subs = [
    { key: 'cp', label: 'CP Calc', icon: 'calculator' },
    { key: 'leaks', label: 'Leaks', icon: 'flame' },
    { key: 'tier', label: 'Tier', icon: 'list-ordered' },
    { key: 'maps', label: 'Maps', icon: 'map' }
  ];

  content.innerHTML =
    '<div style="padding:16px 16px 100px;">' +
      '<h1 style="font-size:24px;font-weight:800;color:#fff;margin:0 0 4px;">Intel</h1>' +
      '<p style="font-size:12px;color:#888;margin:0 0 14px;">CP, leaks, tier list & maps</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:14px;">' +
        subs.map(function(s) {
          var active = intelSubTab === s.key;
          return '<button class="intel-subtab" data-tab="' + s.key + '" style="padding:10px 4px;border-radius:10px;background:' + (active ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (active ? '#ff6b00' : '#222') + ';color:' + (active ? '#ff6b00' : '#888') + ';font-weight:700;font-size:11px;cursor:pointer;">' + s.label + '</button>';
        }).join('') +
      '</div>' +
      '<div id="intel-content"></div>' +
    '</div>';

  document.querySelectorAll('.intel-subtab').forEach(function(btn) {
    btn.onclick = function() {
      intelSubTab = btn.dataset.tab;
      renderIntelTab();
    };
  });

  var fn = { cp: renderCPSub, leaks: renderLeaksSub, tier: renderTierSub, maps: renderMapsSub }[intelSubTab];
  if (fn) await fn();
  if (window.lucide) window.lucide.createIcons();
}

// ---------- CP CALCULATOR ----------
async function renderCPSub() {
  var wrap = document.getElementById('intel-content');
  var rates = { USD: 0.0013, NGN: 2.0, GHS: 0.016 };

  wrap.innerHTML =
    '<div style="background:linear-gradient(135deg,#1a0a00,#000);border:1px solid #222;border-radius:16px;padding:18px;margin-bottom:14px;">' +
      '<div style="text-align:center;">' +
        '<div style="font-size:11px;color:#888;text-transform:uppercase;font-weight:800;">CP Calculator</div>' +
        '<div style="font-size:11px;color:#666;margin-top:4px;">Live exchange rates (approx)</div>' +
      '</div>' +
      '<div style="margin-top:14px;">' +
        '<input id="cp-input" type="number" placeholder="Enter CP amount" style="width:100%;padding:16px;border-radius:14px;background:#141414;border:1px solid #222;color:#fff;font-size:20px;font-weight:800;text-align:center;outline:none;" />' +
      '</div>' +
      '<div id="cp-results" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px;">' +
        '<div style="text-align:center;padding:12px;background:#141414;border-radius:12px;">' +
          '<div style="font-size:10px;color:#888;font-weight:800;">USD</div>' +
          '<div id="cp-usd" style="font-size:16px;font-weight:800;color:#ff6b00;margin-top:2px;">$0.00</div>' +
        '</div>' +
        '<div style="text-align:center;padding:12px;background:#141414;border-radius:12px;">' +
          '<div style="font-size:10px;color:#888;font-weight:800;">NGN</div>' +
          '<div id="cp-ngn" style="font-size:16px;font-weight:800;color:#ff6b00;margin-top:2px;">₦0</div>' +
        '</div>' +
        '<div style="text-align:center;padding:12px;background:#141414;border-radius:12px;">' +
          '<div style="font-size:10px;color:#888;font-weight:800;">GHS</div>' +
          '<div id="cp-ghs" style="font-size:16px;font-weight:800;color:#ff6b00;margin-top:2px;">₵0</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:14px;">' +
      '<div style="font-size:12px;font-weight:800;color:#fff;margin-bottom:10px;">🎲 Draw Cost Calculator</div>' +
      '<div style="font-size:11px;color:#888;margin-bottom:8px;">CP required per draw stage:</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        [10, 30, 50, 100, 200, 400, 800, 1200, 2000, 3000].map(function(cp, i) {
          return '<div style="padding:6px 10px;border-radius:8px;background:#1a1a1a;border:1px solid #222;font-size:11px;color:#ff6b00;font-weight:800;">' + (i + 1) + '. ' + cp + ' CP</div>';
        }).join('') +
      '</div>' +
      '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #1a1a1a;font-size:11px;color:#888;">' +
        'Total: <span style="color:#fff;font-weight:800;">7,790 CP</span> for full draw' +
      '</div>' +
    '</div>' +
    '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;">' +
      '<div style="font-size:12px;font-weight:800;color:#fff;margin-bottom:10px;">💎 Best Value Bundles</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        [['80 CP', '0.99', 'Best for quick buy'], ['420 CP', '4.99', 'Popular choice'], ['880 CP', '9.99', 'Best value'], ['2400 CP', '24.99', 'Bulk buyer']].map(function(b) {
          return '<div style="display:flex;justify-content:space-between;padding:10px;background:#1a1a1a;border-radius:10px;">' +
            '<div><div style="font-size:13px;font-weight:800;color:#fff;">' + b[0] + '</div><div style="font-size:10px;color:#888;">' + b[2] + '</div></div>' +
            '<div style="font-size:13px;font-weight:800;color:#ff6b00;">$' + b[1] + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';

  document.getElementById('cp-input').addEventListener('input', function(e) {
    var cp = parseFloat(e.target.value) || 0;
    document.getElementById('cp-usd').textContent = '$' + (cp * rates.USD).toFixed(2);
    document.getElementById('cp-ngn').textContent = '₦' + Math.round(cp * rates.NGN).toLocaleString();
    document.getElementById('cp-ghs').textContent = '₵' + (cp * rates.GHS).toFixed(2);
  });
}

// ---------- LEAKS ----------
async function renderLeaksSub() {
  var wrap = document.getElementById('intel-content');
  wrap.innerHTML = '<div class="spinner" style="margin:24px auto;"></div>';
  try {
    var snap = await getDocs(query(collection(db, 'leaks'), limit(30)));
    var leaks = [];
    snap.forEach(function(d) { leaks.push(Object.assign({ id: d.id }, d.data())); });
    leaks.sort(function(a, b) {
      var at = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
      var bt = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return bt - at;
    });

    if (!leaks.length) {
      wrap.innerHTML = renderEmptyTab('flame', 'No leaks yet', 'Check back soon for intel drops', '', '');
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    var rarityColors = { common: '#8E8E93', rare: '#00BFFF', epic: '#AF52DE', legendary: '#FF6B00', mythic: '#FFD700' };

    wrap.innerHTML = leaks.map(function(l) {
      var rc = rarityColors[l.rarity] || '#8E8E93';
      var isLiked = State.likedItems.leak && State.likedItems.leak[l.id];
      return '<div style="background:#111;border:1px solid #222;border-radius:14px;overflow:hidden;margin-bottom:10px;">' +
        (l.imageUrl ? '<img src="' + esc(l.imageUrl) + '" style="width:100%;display:block;" />' : '') +
        '<div style="padding:14px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            (l.rarity ? '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(0,0,0,.5);color:' + rc + ';font-weight:800;border:1px solid ' + rc + ';">' + esc(l.rarity.toUpperCase()) + '</span>' : '') +
            '<span style="font-size:10px;color:#888;">' + timeAgo(l.createdAt) + '</span>' +
          '</div>' +
          '<div style="font-weight:800;color:#fff;font-size:15px;margin-bottom:6px;">' + esc(l.title) + '</div>' +
          (l.body ? '<div style="font-size:13px;color:#ccc;line-height:1.5;">' + esc(l.body) + '</div>' : '') +
          '<div style="display:flex;gap:12px;margin-top:10px;padding-top:10px;border-top:1px solid #1a1a1a;">' +
            '<button class="leak-like-btn" data-id="' + l.id + '" style="background:none;border:none;font-size:12px;font-weight:700;color:' + (isLiked ? '#ff6b00' : '#666') + ';cursor:pointer;">🔥 ' + (l.hypes || 0) + '</button>' +
            '<button class="leak-share-btn" data-id="' + l.id + '" style="background:none;border:none;font-size:12px;font-weight:700;color:#666;cursor:pointer;">🔗 Share</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    document.querySelectorAll('.leak-like-btn').forEach(function(b) {
      b.onclick = async function() {
        await handleLikeClick(b, 'leak', b.dataset.id);
        var liked = State.likedItems.leak && State.likedItems.leak[b.dataset.id];
        b.style.color = liked ? '#ff6b00' : '#666';
      };
    });
    document.querySelectorAll('.leak-share-btn').forEach(function(b) {
      b.onclick = function() { shareContent('CODMPanda Leak', 'Check this leak!', location.origin + '/?leak=' + b.dataset.id); };
    });
  } catch (e) {
    wrap.innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed</div>';
  }
}

// ---------- TIER LIST ----------
async function renderTierSub() {
  var wrap = document.getElementById('intel-content');
  wrap.innerHTML = '<div class="spinner" style="margin:24px auto;"></div>';
  try {
    var snap = await getDocs(query(collection(db, 'tierVotes'), limit(200)));
    var votes = {};
    var total = 0;
    snap.forEach(function(d) {
      var data = d.data();
      Object.keys(data).forEach(function(gun) {
        if (!votes[gun]) votes[gun] = { S: 0, A: 0, B: 0, C: 0 };
        var tier = data[gun];
        if (votes[gun][tier] != null) votes[gun][tier]++;
        total++;
      });
    });

    // Calculate community tier for each gun
    var tierList = { S: [], A: [], B: [], C: [] };
    Object.keys(votes).forEach(function(gun) {
      var v = votes[gun];
      var best = 'C';
      var bestCount = 0;
      ['S', 'A', 'B', 'C'].forEach(function(t) {
        if (v[t] > bestCount) { bestCount = v[t]; best = t; }
      });
      tierList[best].push({ gun: gun, votes: v, total: v.S + v.A + v.B + v.C });
    });

    var tierColors = { S: '#FF3B30', A: '#FF9500', B: '#FFCC00', C: '#8E8E93' };

    wrap.innerHTML = ['S', 'A', 'B', 'C'].map(function(t) {
      if (!tierList[t].length) return '';
      return '<div style="margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<div style="width:32px;height:32px;border-radius:8px;background:' + tierColors[t] + ';display:flex;align-items:center;justify-content:center;font-weight:900;color:#000;font-size:14px;">' + t + '</div>' +
          '<div style="font-size:12px;color:#888;font-weight:700;">' + tierList[t].length + ' guns</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
          tierList[t].sort(function(a, b) { return b.total - a.total; }).map(function(x) {
            return '<button class="tier-gun" data-gun="' + esc(x.gun) + '" style="padding:10px;border-radius:10px;background:#141414;border:1px solid ' + tierColors[t] + '22;color:#fff;font-weight:700;font-size:12px;cursor:pointer;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(x.gun) + '</button>';
          }).join('') +
        '</div>' +
      '</div>';
    }).join('') + (Object.keys(votes).length === 0 ? renderEmptyTab('list-ordered', 'No votes yet', 'Community tier list is empty', '', '') : '');

    document.querySelectorAll('.tier-gun').forEach(function(btn) {
      btn.onclick = function() { openTierVoteSheet(btn.dataset.gun); };
    });
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    wrap.innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed</div>';
  }
}

function openTierVoteSheet(gun) {
  var html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="text-align:center;font-size:18px;font-weight:800;color:#fff;">' + esc(gun) + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
        [['S', '#FF3B30'], ['A', '#FF9500'], ['B', '#FFCC00'], ['C', '#8E8E93']].map(function(t) {
          return '<button class="tier-vote-btn" data-tier="' + t[0] + '" style="padding:20px;border-radius:14px;background:' + t[1] + '22;border:2px solid ' + t[1] + ';color:' + t[1] + ';font-weight:900;font-size:24px;cursor:pointer;">' + t[0] + '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  openSheet(html, 'Vote Tier');

  document.querySelectorAll('.tier-vote-btn').forEach(function(btn) {
    btn.onclick = async function() {
      var tier = btn.dataset.tier;
      try {
        await setDoc(doc(db, 'tierVotes', State.user.uid), { [gun]: tier }, { merge: true });
        toast('✓ Voted ' + tier, 'success');
        closeSheet();
        renderTierSub();
      } catch (e) { toast('Failed', 'error'); }
    };
  });
}

// ---------- MAPS ----------
async function renderMapsSub() {
  var wrap = document.getElementById('intel-content');
  var tierColors = { S: '#FFD700', A: '#00BFFF', B: '#8E8E93', C: '#8E8E93' };

  wrap.innerHTML =
    '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:12px;margin-bottom:12px;">' +
      '<div style="font-size:12px;font-weight:800;color:#fff;margin-bottom:10px;">🔥 Top Hot Drops</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        ISOLATED_POIS.filter(function(p) { return p.hot; }).slice(0, 6).map(function(p) {
          return '<button class="poi-chip" data-name="' + esc(p.name) + '" style="padding:6px 10px;border-radius:8px;background:rgba(255,107,0,.15);border:1px solid #ff6b00;color:#ff6b00;font-size:11px;font-weight:700;cursor:pointer;">' + esc(p.name) + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +

    '<div style="position:relative;width:100%;aspect-ratio:1;background:#0a0a0a;border:1px solid #222;border-radius:14px;overflow:hidden;">' +
      '<img src="/isolated-map.png" style="width:100%;height:100%;object-fit:cover;" alt="Isolated Map" />' +
      ISOLATED_POIS.map(function(p) {
        var c = p.hot ? '#FF6B00' : tierColors[p.tier] || '#8E8E93';
        return '<div class="poi-pin" data-name="' + esc(p.name) + '" style="position:absolute;left:' + p.x + '%;top:' + p.y + '%;transform:translate(-50%,-50%);width:22px;height:22px;border-radius:50%;background:' + c + ';opacity:.75;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#000;font-weight:900;font-size:9px;box-shadow:0 0 8px ' + c + '88;">' + (p.hot ? '🔥' : p.tier) + '</div>';
      }).join('') +
    '</div>' +

    '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;font-size:10px;color:#888;">' +
      '<div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#FF6B00;"></span> Hot</div>' +
      '<div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#FFD700;"></span> S-Tier</div>' +
      '<div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#00BFFF;"></span> A-Tier</div>' +
      '<div style="display:flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#8E8E93;"></span> B/C</div>' +
    '</div>' +

    '<div style="margin-top:14px;">' +
      '<div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:8px;">All POIs</div>' +
      '<div id="poi-list" style="display:flex;flex-direction:column;gap:6px;">' +
        ISOLATED_POIS.map(function(p) {
          return '<button class="poi-row" data-name="' + esc(p.name) + '" style="display:flex;align-items:center;gap:10px;padding:10px;background:#141414;border:1px solid #222;border-radius:10px;cursor:pointer;text-align:left;">' +
            '<div style="width:26px;height:26px;border-radius:50%;background:' + (p.hot ? '#FF6B00' : tierColors[p.tier] || '#8E8E93') + ';display:flex;align-items:center;justify-content:center;font-weight:900;color:#000;font-size:10px;flex-shrink:0;">' + (p.hot ? '🔥' : p.tier) + '</div>' +
            '<div style="flex:1;color:#fff;font-weight:700;font-size:13px;">' + esc(p.name) + '</div>' +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>';

  document.querySelectorAll('.poi-chip, .poi-pin, .poi-row').forEach(function(el) {
    el.onclick = function() { openPoiSheet(el.dataset.name); };
  });
}

function openPoiSheet(name) {
  var p = ISOLATED_POIS.find(function(x) { return x.name === name; });
  if (!p) return;
  var tierColors = { S: '#FFD700', A: '#00BFFF', B: '#8E8E93', C: '#8E8E93' };
  var c = p.hot ? '#FF6B00' : tierColors[p.tier] || '#8E8E93';
  var html =
    '<div style="padding:8px 0;">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' +
        '<div style="width:44px;height:44px;border-radius:50%;background:' + c + ';display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">' + (p.hot ? '🔥' : p.tier) + '</div>' +
        '<div>' +
          '<div style="font-size:18px;font-weight:800;color:#fff;">' + esc(p.name) + '</div>' +
          '<div style="font-size:11px;color:#888;">Tier ' + p.tier + (p.hot ? ' • Hot Drop' : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:13px;color:#ccc;line-height:1.6;">' + esc(p.desc) + '</div>' +
    '</div>';
  openSheet(html, '');
}

// ---------- EXPOSE ----------
window.renderIntelTab = renderIntelTab;
window.openTierVoteSheet = openTierVoteSheet;
window.openPoiSheet = openPoiSheet;

console.log('✅ Chunk 7/8 Part 1/3 loaded — Intel Tab');
// ============================================
// END OF CHUNK 7/8 — PART 1/3
// ============================================
// ============================================
// CHUNK 7/8 — PART 2/3
// You Tab — Profile + Stats + Settings
// ============================================

// ---------- RENDER YOU TAB ----------
async function renderYouTab() {
  var content = document.getElementById('content');
  if (!content) return;
  if (!State.profile) {
    content.innerHTML = '<div style="padding:32px;text-align:center;color:#888;">Loading profile...</div>';
    return;
  }

  var u = State.profile;
  var isPro = u.isPro;
  var verified = u.verified;
  var theme = PROFILE_THEMES[u.themeStyle] || PROFILE_THEMES.dark;
  var frame = AVATAR_FRAMES[u.avatarFrame] || AVATAR_FRAMES.none;
  var isAdmin = State.user.uid === ADMIN_UID;

  // Stats
  var myVaults = (State.cache.vaults || []).filter(function(v) { return v.uid === State.user.uid; }).length;
  var myPosts = (homeCache.feed || []).filter(function(p) { return p.uid === State.user.uid && p.type === 'post'; }).length;
  var myLikes = 0;
  try {
    for (var k in (State.likedItems.vault || {})) if (State.likedItems.vault[k]) myLikes++;
    for (var k2 in (State.likedItems.post || {})) if (State.likedItems.post[k2]) myLikes++;
  } catch (e) {}

  content.innerHTML =
    '<div style="padding:16px 16px 100px;">' +

      // Profile header
      '<div style="background:' + theme.gradient + ';border:1px solid ' + theme.border + ';border-radius:20px;padding:20px;margin-bottom:14px;' + (theme.glow !== 'none' ? 'box-shadow:' + theme.glow + ';' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:16px;">' +
          '<div style="' + frame.style + '">' +
            '<div style="width:72px;height:72px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;color:' + theme.nameColor + ';">' +
              (u.avatar ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(u.ign || '?')) +
            '</div>' +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<div style="font-weight:800;font-size:18px;color:' + theme.nameColor + ';">' + esc(u.ign || 'Panda') + '</div>' +
              (isPro ? '<span style="font-size:15px;">👑</span>' : '') +
              (verified ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:50%;background:#1DA1F2;color:#fff;font-size:9px;font-weight:900;">✓</span>' : '') +
            '</div>' +
            '<div style="font-size:12px;color:#aaa;margin-top:3px;">' + esc(u.rank || 'Rookie') + ' • ' + esc(u.region || 'Africa') + '</div>' +
            '<div style="font-size:10px;color:#666;margin-top:2px;">UID: ' + esc(State.user.uid.slice(0, 12)) + '...</div>' +
          '</div>' +
        '</div>' +
        (u.bio ? '<div style="margin-top:14px;font-size:13px;color:#ccc;line-height:1.5;">' + esc(u.bio) + '</div>' : '') +
        (u.favGun ? '<div style="margin-top:10px;font-size:12px;color:#888;">🎯 Favorite: <span style="color:#fff;font-weight:700;">' + esc(u.favGun) + '</span></div>' : '') +
      '</div>' +

      // Quick actions
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:14px;">' +
        quickAction('edit-3', 'Edit', 'you-edit') +
        quickAction('users', 'Friends', 'you-friends') +
        quickAction('copy', 'Copy ID', 'you-copy') +
        quickAction('share-2', 'Share', 'you-share') +
      '</div>' +

      // Pro banner
      (!isPro ?
        '<div style="background:linear-gradient(135deg,#1a0a00,#000);border:1px solid #FFD700;border-radius:16px;padding:16px;margin-bottom:14px;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="font-size:28px;">👑</div>' +
            '<div style="flex:1;">' +
              '<div style="font-weight:800;color:#FFD700;font-size:14px;">Unlock Pro</div>' +
              '<div style="font-size:11px;color:#888;margin-top:2px;">Unlimited vaults, priority LFG & more</div>' +
            '</div>' +
            '<button id="you-upgrade" style="padding:10px 16px;border-radius:10px;background:#FFD700;border:none;color:#000;font-weight:800;font-size:12px;cursor:pointer;">$1.99</button>' +
          '</div>' +
        '</div>' : '') +

      // Theme + Frame
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">' +
        '<button id="you-theme" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:12px;cursor:pointer;text-align:left;">🎨 Theme<br><span style="font-size:10px;color:#888;">' + esc(theme.name) + '</span></button>' +
        '<button id="you-frame" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:12px;cursor:pointer;text-align:left;">🖼️ Frame<br><span style="font-size:10px;color:#888;">' + esc(frame.name) + '</span></button>' +
      '</div>' +

      // Stats grid
      '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:14px;">' +
        '<div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:10px;">Activity</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">' +
          statBlock('📦', myVaults, 'Vaults') +
          statBlock('✍️', myPosts, 'Posts') +
          statBlock('❤️', myLikes, 'Likes') +
        '</div>' +
      '</div>' +

      // Contributor card
      '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:14px;">' +
        '<div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:10px;">🏆 Contributor</div>' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
          '<div style="font-size:28px;">' + getContributorEmoji(u.approvedCount || 0) + '</div>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:800;color:#fff;font-size:14px;">' + (u.approvedCount || 0) + ' approved submissions</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px;">' + nextMilestone(u.approvedCount || 0) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Settings sections
      section('Settings', [
        { icon: 'user', label: 'Edit Profile', id: 'you-edit2' },
        { icon: 'gift', label: 'Referral Program', id: 'you-referral' },
        { icon: 'bell', label: 'Notifications', id: 'you-notif' },
        { icon: 'settings', label: 'Defaults', id: 'you-defaults' },
        { icon: 'trash-2', label: 'Clear Cache', id: 'you-clearcache' }
      ]) +

      section('Support', [
        { icon: 'bug', label: 'Report a Bug', id: 'you-bug' },
        { icon: 'lightbulb', label: 'Feature Request', id: 'you-feature' },
        { icon: 'share-2', label: 'Share App', id: 'you-share2' },
        { icon: 'help-circle', label: 'FAQ', id: 'you-faq' }
      ]) +

      (isAdmin ?
        section('Admin', [
          { icon: 'bar-chart-3', label: 'Analytics', id: 'admin-analytics' },
          { icon: 'inbox', label: 'Pending Submissions', id: 'admin-pending' },
          { icon: 'flag', label: 'Reports', id: 'admin-reports' },
          { icon: 'users', label: 'Users', id: 'admin-users' }
        ]) : '') +

      '<div style="margin-top:14px;padding:14px;background:#111;border:1px solid #222;border-radius:14px;">' +
        '<button id="you-signout" style="width:100%;padding:12px;border-radius:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:800;font-size:13px;cursor:pointer;margin-bottom:8px;">Sign Out</button>' +
        '<button id="you-delete" style="width:100%;padding:12px;border-radius:10px;background:transparent;border:1px solid #333;color:#666;font-weight:700;font-size:12px;cursor:pointer;">Delete Account</button>' +
      '</div>' +

      '<div style="text-align:center;padding:20px;font-size:10px;color:#444;">CODMPanda v' + APP_VERSION + '</div>' +

    '</div>';

  if (window.lucide) window.lucide.createIcons();

  // Wire actions
  var wires = {
    'you-edit': openEditProfileSheet,
    'you-edit2': openEditProfileSheet,
    'you-friends': openFriendsSheet,
    'you-copy': function() { copyText(State.user.uid, 'UID copied!'); },
    'you-share': function() { shareContent('CODMPanda', 'Add me on CODMPanda!', location.origin + '/?profile=' + State.user.uid); },
    'you-share2': function() { shareContent('CODMPanda', 'The ultimate CODM companion!', location.origin); },
    'you-upgrade': openUpgradeSheet,
    'you-theme': openThemePicker,
    'you-frame': openAvatarFramePicker,
    'you-referral': openReferralSheet,
    'you-notif': openNotificationSettings,
    'you-defaults': openDefaultsSettings,
    'you-clearcache': function() {
      confirmDialog('Clear Cache', 'This will refresh data from the server.', function() { location.reload(); }, 'Clear', false);
    },
    'you-bug': function() { openReportSheet('bug'); },
    'you-feature': function() { openReportSheet('feature'); },
    'you-faq': openFAQSheet,
    'you-signout': handleSignOut,
    'you-delete': confirmDeleteAccount
  };
  if (isAdmin) {
    wires['admin-analytics'] = function() { toast('Analytics coming soon', 'info'); };
    wires['admin-pending'] = function() { toast('Pending list coming soon', 'info'); };
    wires['admin-reports'] = function() { toast('Reports list coming soon', 'info'); };
    wires['admin-users'] = function() { toast('User manager coming soon', 'info'); };
  }

  Object.keys(wires).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.onclick = wires[id];
  });
}

// ---------- HELPERS ----------
function quickAction(icon, label, id) {
  return '<button id="' + id + '" style="padding:12px 8px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:11px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;">' +
    '<i data-lucide="' + icon + '" style="width:18px;height:18px;color:#ff6b00;"></i>' +
    '<span>' + label + '</span>' +
  '</button>';
}

function statBlock(emoji, value, label) {
  return '<div style="text-align:center;padding:10px;background:#141414;border-radius:10px;">' +
    '<div style="font-size:20px;margin-bottom:4px;">' + emoji + '</div>' +
    '<div style="font-weight:800;color:#fff;font-size:16px;">' + value + '</div>' +
    '<div style="font-size:10px;color:#888;margin-top:2px;">' + label + '</div>' +
  '</div>';
}

function section(title, items) {
  return '<div style="background:#111;border:1px solid #222;border-radius:14px;overflow:hidden;margin-bottom:12px;">' +
    '<div style="padding:12px 14px;font-size:11px;font-weight:800;color:#888;text-transform:uppercase;border-bottom:1px solid #1a1a1a;">' + title + '</div>' +
    items.map(function(it) {
      return '<button id="' + it.id + '" style="width:100%;display:flex;align-items:center;gap:12px;padding:14px;background:transparent;border:none;border-bottom:1px solid #1a1a1a;color:#fff;font-size:13px;font-weight:600;cursor:pointer;text-align:left;">' +
        '<i data-lucide="' + it.icon + '" style="width:18px;height:18px;color:#ff6b00;flex-shrink:0;"></i>' +
        '<span style="flex:1;">' + it.label + '</span>' +
        '<i data-lucide="chevron-right" style="width:16px;height:16px;color:#444;"></i>' +
      '</button>';
    }).join('') +
  '</div>';
}

function getContributorEmoji(count) {
  if (count >= 25) return '💎';
  if (count >= 10) return '🥇';
  if (count >= 5) return '🥈';
  if (count >= 1) return '🥉';
  return '⭐';
}

function nextMilestone(count) {
  var milestones = [1, 5, 10, 25];
  for (var i = 0; i < milestones.length; i++) {
    if (count < milestones[i]) return (milestones[i] - count) + ' more to next milestone';
  }
  return 'Max tier reached!';
}

// ---------- EDIT PROFILE SHEET ----------
function openEditProfileSheet() {
  var u = State.profile;
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="text-align:center;">' +
        '<label for="ep-avatar-input" style="cursor:pointer;display:inline-block;">' +
          '<div style="width:80px;height:80px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;font-size:28px;margin:0 auto;">' +
            (u.avatar ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(u.ign || '?')) +
          '</div>' +
          '<div style="font-size:10px;color:#ff6b00;margin-top:6px;font-weight:800;">Tap to change</div>' +
        '</label>' +
        '<input id="ep-avatar-input" type="file" accept="image/*" style="display:none;" />' +
      '</div>' +
      '<input id="ep-ign" placeholder="IGN" maxlength="20" value="' + esc(u.ign || '') + '" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" />' +
      '<textarea id="ep-bio" placeholder="Bio" maxlength="150" style="width:100%;min-height:70px;background:#141414;border:1px solid #222;border-radius:12px;padding:12px;font-size:13px;color:#fff;outline:none;resize:none;">' + esc(u.bio || '') + '</textarea>' +
      '<input id="ep-favgun" placeholder="Favorite gun" value="' + esc(u.favGun || '') + '" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
      '<select id="ep-rank" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;">' +
        RANKS.map(function(r) { return '<option value="' + r + '"' + (r === u.rank ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
      '</select>' +
      '<select id="ep-region" style="padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;">' +
        REGIONS.map(function(r) { return '<option value="' + r + '"' + (r === u.region ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
      '</select>' +
      '<button id="ep-save" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Save Changes</button>' +
    '</div>';
  openSheet(html, 'Edit Profile');

  var newAvatar = null;
  document.getElementById('ep-avatar-input').addEventListener('change', async function(e) {
    var f = e.target.files[0];
    if (!f) return;
    try {
      newAvatar = await compressImage(f, 400, 0.6);
      toast('✓ Image selected', 'success');
    } catch (err) { toast('Image error', 'error'); }
  });

  document.getElementById('ep-save').onclick = async function() {
    var updates = {
      ign: document.getElementById('ep-ign').value.trim() || State.profile.ign,
      bio: document.getElementById('ep-bio').value.trim(),
      favGun: document.getElementById('ep-favgun').value.trim(),
      rank: document.getElementById('ep-rank').value,
      region: document.getElementById('ep-region').value
    };
    if (newAvatar) updates.avatar = newAvatar;
    try {
      await updateDoc(doc(db, 'users', State.user.uid), updates);
      Object.assign(State.profile, updates);
      toast('✓ Saved', 'success');
      closeSheet();
      renderYouTab();
    } catch (e) { toast('Failed', 'error'); }
  };
}

// ---------- FRIENDS SHEET ----------
async function openFriendsSheet() {
  var friends = State.profile.friends || [];
  var requests = State.profile.friendRequests || [];
  var sent = State.profile.friendRequestsSent || [];

  var html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="display:flex;gap:8px;">' +
        '<input id="fs-search" placeholder="Search by IGN or UID..." style="flex:1;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;" />' +
        '<button id="fs-search-btn" style="padding:12px 16px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:700;font-size:13px;cursor:pointer;">Find</button>' +
      '</div>' +
      (requests.length ? '<div><div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:8px;">Requests (' + requests.length + ')</div><div id="fs-requests"></div></div>' : '') +
      '<div><div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:8px;">Friends (' + friends.length + ')</div><div id="fs-friends"></div></div>' +
    '</div>';
  openSheet(html, 'Friends');

  async function loadUserList(uids, targetId) {
    var el = document.getElementById(targetId);
    if (!uids.length) { el.innerHTML = '<div style="padding:20px;text-align:center;color:#666;font-size:12px;">Empty</div>'; return; }
    var loaded = await Promise.all(uids.slice(0, 50).map(async function(uid) {
      try { var s = await getDoc(doc(db, 'users', uid)); return s.exists() ? Object.assign({ uid: uid }, s.data()) : null; }
      catch (e) { return null; }
    }));
    el.innerHTML = loaded.filter(Boolean).map(function(u) {
      var isReq = targetId === 'fs-requests';
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#141414;border:1px solid #222;border-radius:10px;margin-bottom:6px;">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,107,0,.2);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;font-size:13px;flex-shrink:0;">' +
          (u.avatar ? '<img src="' + esc(u.avatar) + '" style="width:100%;height:100%;object-fit:cover;" />' : getInitials(u.ign || '?')) +
        '</div>' +
        '<div style="flex:1;color:#fff;font-weight:700;font-size:13px;">' + esc(u.ign || 'Player') + '</div>' +
        (isReq ?
          '<button class="fs-accept" data-uid="' + u.uid + '" style="padding:6px 10px;border-radius:8px;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.4);color:#10b981;font-weight:800;font-size:11px;cursor:pointer;">✓</button>' +
          '<button class="fs-decline" data-uid="' + u.uid + '" style="padding:6px 10px;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;font-weight:800;font-size:11px;cursor:pointer;">✕</button>' :
          '<button class="fs-msg" data-uid="' + u.uid + '" style="padding:6px 10px;border-radius:8px;background:#222;border:1px solid #333;color:#fff;font-weight:700;font-size:11px;cursor:pointer;">Message</button>') +
      '</div>';
    }).join('');

    el.querySelectorAll('.fs-accept').forEach(function(b) {
      b.onclick = async function() {
        var uid = b.dataset.uid;
        try {
          await updateDoc(doc(db, 'users', State.user.uid), {
            friends: arrayUnion(uid),
            friendRequests: arrayRemove(uid)
          });
          await updateDoc(doc(db, 'users', uid), {
            friends: arrayUnion(State.user.uid),
            friendRequestsSent: arrayRemove(State.user.uid)
          });
          toast('✓ Friend added', 'success');
          // Refresh profile
          var ps = await getDoc(doc(db, 'users', State.user.uid));
          if (ps.exists()) State.profile = ps.data();
          closeSheet();
          openFriendsSheet();
        } catch (e) { toast('Failed', 'error'); }
      };
    });
    el.querySelectorAll('.fs-decline').forEach(function(b) {
      b.onclick = async function() {
        try {
          await updateDoc(doc(db, 'users', State.user.uid), { friendRequests: arrayRemove(b.dataset.uid) });
          toast('Declined', 'info');
          closeSheet();
          openFriendsSheet();
        } catch (e) {}
      };
    });
    el.querySelectorAll('.fs-msg').forEach(function(b) {
      b.onclick = function() { toast('DMs coming soon', 'info'); };
    });
  }

  if (requests.length) loadUserList(requests, 'fs-requests');
  loadUserList(friends, 'fs-friends');

  document.getElementById('fs-search-btn').onclick = async function() {
    var q = document.getElementById('fs-search').value.trim();
    if (!q) return;
    try {
      var snap = await getDocs(query(collection(db, 'users'), where('ign', '==', q), limit(5)));
      if (snap.empty) {
        // Try UID
        var s = await getDoc(doc(db, 'users', q));
        if (s.exists()) { openUserProfile(q); }
        else toast('Not found', 'error');
        return;
      }
      var first = snap.docs[0];
      openUserProfile(first.id);
    } catch (e) { toast('Search failed', 'error'); }
  };
}

// ---------- REFERRAL SHEET ----------
function openReferralSheet() {
  var code = State.profile.referralCode || ('PANDA' + State.user.uid.slice(0, 6).toUpperCase());
  var invites = State.profile.invites || 0;
  var link = location.origin + '/?ref=' + State.user.uid;

  var html =
    '<div style="display:flex;flex-direction:column;gap:14px;">' +
      '<div style="text-align:center;padding:14px;background:linear-gradient(135deg,#1a0a00,#000);border:1px solid #FFD700;border-radius:14px;">' +
        '<div style="font-size:32px;margin-bottom:8px;">🎁</div>' +
        '<div style="font-size:11px;color:#888;text-transform:uppercase;font-weight:800;">Your Code</div>' +
        '<div style="font-size:22px;font-weight:900;color:#FFD700;margin-top:6px;">' + esc(code) + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button id="rf-copy" style="flex:1;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-weight:700;font-size:13px;cursor:pointer;">Copy Code</button>' +
        '<button id="rf-share" style="flex:1;padding:12px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:13px;cursor:pointer;">Share Link</button>' +
      '</div>' +
      '<div style="padding:14px;background:#141414;border-radius:12px;text-align:center;">' +
        '<div style="font-size:24px;font-weight:900;color:#ff6b00;">' + invites + '</div>' +
        '<div style="font-size:11px;color:#888;margin-top:2px;">Friends invited</div>' +
        '<div style="font-size:10px;color:#666;margin-top:6px;">Every 3rd invite = 7-day Pro</div>' +
      '</div>' +
    '</div>';
  openSheet(html, 'Referrals');

  document.getElementById('rf-copy').onclick = function() { copyText(code, 'Code copied!'); };
  document.getElementById('rf-share').onclick = function() {
    shareContent('CODMPanda', 'Join CODMPanda with my code: ' + code, link);
  };
}

// ---------- OTHER SHEETS ----------
function openUpgradeSheet() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="text-align:center;padding:14px;">' +
        '<div style="font-size:44px;">👑</div>' +
        '<div style="font-size:18px;font-weight:800;color:#FFD700;margin-top:8px;">CODMPanda Pro</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:#ccc;">' +
        proBenefit('Unlimited vault builds') +
        proBenefit('Full camo tracker') +
        proBenefit('Create clans') +
        proBenefit('Priority LFG placement') +
        proBenefit('Zero ads forever') +
        proBenefit('All themes + avatar frames') +
        proBenefit('Unlimited post characters') +
        proBenefit('Verified badge at 10 approvals') +
      '</div>' +
      '<a href="' + LS_LINKS.monthly + '" target="_blank" style="padding:14px;border-radius:12px;background:#141414;border:1px solid #333;color:#fff;font-weight:800;text-align:center;text-decoration:none;font-size:14px;">Monthly — $1.99</a>' +
      '<a href="' + LS_LINKS.lifetime + '" target="_blank" style="padding:14px;border-radius:12px;background:#FFD700;border:none;color:#000;font-weight:900;text-align:center;text-decoration:none;font-size:14px;">Lifetime — $9.99</a>' +
    '</div>';
  openSheet(html, '');
}

function proBenefit(text) {
  return '<div style="display:flex;align-items:center;gap:8px;"><span style="color:#FFD700;font-weight:900;">✓</span><span>' + text + '</span></div>';
}

function openThemePicker() {
  var isPro = State.profile.isPro;
  var html = '<div style="display:flex;flex-direction:column;gap:10px;">' +
    Object.keys(PROFILE_THEMES).map(function(k) {
      var t = PROFILE_THEMES[k];
      var isActive = State.profile.themeStyle === k;
      var locked = t.pro && !isPro;
      return '<button class="theme-opt" data-key="' + k + '" style="padding:14px;border-radius:12px;background:' + t.gradient + ';border:2px solid ' + (isActive ? t.border : '#222') + ';color:' + t.nameColor + ';font-weight:800;font-size:14px;cursor:pointer;text-align:left;position:relative;' + (locked ? 'opacity:.6;' : '') + '">' +
        esc(t.name) + (t.pro ? ' 💎' : '') +
        (isActive ? '<span style="position:absolute;top:10px;right:10px;font-size:12px;">✓</span>' : '') +
        (locked ? '<div style="font-size:10px;color:#888;font-weight:400;margin-top:4px;">Upgrade to unlock</div>' : '') +
      '</button>';
    }).join('') + '</div>';
  openSheet(html, 'Choose Theme');

  document.querySelectorAll('.theme-opt').forEach(function(btn) {
    btn.onclick = async function() {
      var key = btn.dataset.key;
      var t = PROFILE_THEMES[key];
      if (t.pro && !State.profile.isPro) { toast('💎 Pro required', 'warning'); return; }
      try {
        await updateDoc(doc(db, 'users', State.user.uid), { themeStyle: key });
        State.profile.themeStyle = key;
        toast('✓ Theme applied', 'success');
        closeSheet();
        renderYouTab();
      } catch (e) { toast('Failed', 'error'); }
    };
  });
}

function openAvatarFramePicker() {
  var isPro = State.profile.isPro;
  var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
    Object.keys(AVATAR_FRAMES).map(function(k) {
      var f = AVATAR_FRAMES[k];
      var isActive = State.profile.avatarFrame === k;
      var locked = f.pro && !isPro;
      return '<button class="frame-opt" data-key="' + k + '" style="padding:14px;border-radius:12px;background:#141414;border:2px solid ' + (isActive ? '#ff6b00' : '#222') + ';cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;' + (locked ? 'opacity:.5;' : '') + '">' +
        '<div style="' + f.style + '">' +
          '<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,107,0,.2);display:flex;align-items:center;justify-content:center;font-weight:800;color:#ff6b00;font-size:14px;">🐼</div>' +
        '</div>' +
        '<div style="font-size:12px;color:#fff;font-weight:700;">' + esc(f.name) + (f.pro ? ' 💎' : '') + '</div>' +
      '</button>';
    }).join('') + '</div>';
  openSheet(html, 'Choose Frame');

  document.querySelectorAll('.frame-opt').forEach(function(btn) {
    btn.onclick = async function() {
      var key = btn.dataset.key;
      var f = AVATAR_FRAMES[key];
      if (f.pro && !State.profile.isPro) { toast('💎 Pro required', 'warning'); return; }
      try {
        await updateDoc(doc(db, 'users', State.user.uid), { avatarFrame: key });
        State.profile.avatarFrame = key;
        toast('✓ Frame applied', 'success');
        closeSheet();
        renderYouTab();
      } catch (e) { toast('Failed', 'error'); }
    };
  });
}

function openNotificationSettings() {
  var p = State.profile;
  var html =
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
      toggleRow('Master Toggle', 'Enable all notifications', 'ns-master', p.notificationsEnabled) +
      toggleRow('LFG Alerts', 'New lobbies near you', 'ns-lfg', p.notifLfg !== false) +
      toggleRow('Leak Alerts', 'New intel drops', 'ns-leaks', p.notifLeaks !== false) +
      toggleRow('Show Online Status', 'Others can see when you are online', 'ns-online', p.showOnline !== false) +
      toggleRow('Compact Mode', 'Smaller cards in feed', 'ns-compact', p.compactMode === true) +
    '</div>';
  openSheet(html, 'Notifications');

  ['master','lfg','leaks','online','compact'].forEach(function(k) {
    var el = document.getElementById('ns-' + k);
    if (el) el.onchange = async function() {
      var field = k === 'master' ? 'notificationsEnabled' : k === 'lfg' ? 'notifLfg' : k === 'leaks' ? 'notifLeaks' : k === 'online' ? 'showOnline' : 'compactMode';
      try {
        await updateDoc(doc(db, 'users', State.user.uid), { [field]: el.checked });
        State.profile[field] = el.checked;
      } catch (e) {}
    };
  });
}

function toggleRow(label, desc, id, checked) {
  return '<label style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#141414;border-radius:12px;cursor:pointer;">' +
    '<div>' +
      '<div style="font-size:13px;color:#fff;font-weight:700;">' + label + '</div>' +
      '<div style="font-size:10px;color:#888;margin-top:2px;">' + desc + '</div>' +
    '</div>' +
    '<input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:#ff6b00;" />' +
  '</label>';
}

function openDefaultsSettings() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div>' +
        '<label style="font-size:11px;color:#888;font-weight:800;text-transform:uppercase;">Default Region</label>' +
        '<select id="ds-region" style="width:100%;margin-top:6px;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;">' +
          REGIONS.map(function(r) { return '<option value="' + r + '"' + (State.profile.defaultRegion === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<div>' +
        '<label style="font-size:11px;color:#888;font-weight:800;text-transform:uppercase;">Default Mode</label>' +
        '<select id="ds-mode" style="width:100%;margin-top:6px;padding:12px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:13px;outline:none;">' +
          MODES.map(function(m) { return '<option value="' + m + '"' + (State.profile.defaultMode === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') +
        '</select>' +
      '</div>' +
      '<label style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:#141414;border-radius:12px;cursor:pointer;">' +
        '<span style="font-size:13px;color:#fff;font-weight:700;">Mic by default</span>' +
        '<input id="ds-mic" type="checkbox"' + (State.profile.defaultMic ? ' checked' : '') + ' style="width:20px;height:20px;accent-color:#ff6b00;" />' +
      '</label>' +
      '<button id="ds-save" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Save</button>' +
    '</div>';
  openSheet(html, 'Defaults');

  document.getElementById('ds-save').onclick = async function() {
    try {
      await updateDoc(doc(db, 'users', State.user.uid), {
        defaultRegion: document.getElementById('ds-region').value,
        defaultMode: document.getElementById('ds-mode').value,
        defaultMic: document.getElementById('ds-mic').checked
      });
      toast('✓ Saved', 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };
}

function openReportSheet(type) {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<textarea id="rp-text" placeholder="' + (type === 'bug' ? 'Describe the bug...' : 'Describe your idea...') + '" maxlength="500" style="width:100%;min-height:120px;background:#141414;border:1px solid #222;border-radius:12px;padding:12px;font-size:13px;color:#fff;outline:none;resize:none;"></textarea>' +
      '<button id="rp-submit" style="padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">Submit</button>' +
    '</div>';
  openSheet(html, type === 'bug' ? 'Report a Bug' : 'Feature Request');

  document.getElementById('rp-submit').onclick = async function() {
    var text = document.getElementById('rp-text').value.trim();
    if (!text) { toast('Write something', 'error'); return; }
    try {
      await addDoc(collection(db, 'reports'), {
        reporterUid: State.user.uid,
        type: type,
        reason: text,
        createdAt: serverTimestamp()
      });
      toast('✓ Submitted', 'success');
      closeSheet();
    } catch (e) { toast('Failed', 'error'); }
  };
}

function openFAQSheet() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      faqItem('How do I earn Pro?', 'Pro can be purchased for $1.99/month or $9.99 lifetime. You also get 7 days free Pro every 3rd referral.') +
      faqItem('What is the Verified badge?', 'Auto-earned at 10 approved community submissions + Pro subscription.') +
      faqItem('How do I report a bug?', 'Settings → Report a Bug. We read every submission.') +
      faqItem('When do posts expire?', 'Text posts expire after 90 days. Lobbies expire after 24 hours. Scrims after 12 hours.') +
      faqItem('Can I delete my account?', 'Yes, from Settings → Delete Account. This is permanent.') +
    '</div>';
  openSheet(html, 'FAQ');
}

function faqItem(q, a) {
  return '<div style="background:#141414;border-radius:12px;padding:14px;">' +
    '<div style="font-weight:800;color:#fff;font-size:13px;margin-bottom:6px;">' + esc(q) + '</div>' +
    '<div style="font-size:12px;color:#aaa;line-height:1.5;">' + esc(a) + '</div>' +
  '</div>';
}

function confirmDeleteAccount() {
  confirmDialog('Delete Account', 'This will permanently delete your profile, content, and all data. Cannot be undone.', async function() {
    try {
      await deleteDoc(doc(db, 'users', State.user.uid));
      await deleteUser(State.user);
      location.reload();
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  }, 'Delete Forever', true);
}

// ---------- EXPOSE ----------
window.renderYouTab = renderYouTab;
window.openEditProfileSheet = openEditProfileSheet;
window.openFriendsSheet = openFriendsSheet;
window.openReferralSheet = openReferralSheet;
window.openUpgradeSheet = openUpgradeSheet;
window.openThemePicker = openThemePicker;
window.openAvatarFramePicker = openAvatarFramePicker;
window.openNotificationSettings = openNotificationSettings;
window.openDefaultsSettings = openDefaultsSettings;
window.openReportSheet = openReportSheet;
window.openFAQSheet = openFAQSheet;
window.confirmDeleteAccount = confirmDeleteAccount;

console.log('✅ Chunk 7/8 Part 2/3 loaded — You Tab');
// ============================================
// END OF CHUNK 7/8 — PART 2/3
// ============================================
// ============================================
// CHUNK 7/8 — PART 3/3
// Global Search + Inbox + Live updates + Boot
// ============================================

// ---------- GLOBAL SEARCH ----------
async function openGlobalSearch() {
  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<input id="gs-input" placeholder="Search users, guns, clans..." style="padding:14px;border-radius:12px;background:#141414;border:1px solid #222;color:#fff;font-size:14px;outline:none;" autofocus />' +
      '<div id="gs-results"><div style="text-align:center;padding:24px;color:#666;font-size:12px;">Type to search</div></div>' +
    '</div>';
  openSheet(html, 'Search');

  var input = document.getElementById('gs-input');
  var timer = null;
  input.addEventListener('input', function() {
    clearTimeout(timer);
    timer = setTimeout(function() { runSearch(input.value.trim()); }, 300);
  });
  setTimeout(function() { input.focus(); }, 200);
}

async function runSearch(q) {
  var el = document.getElementById('gs-results');
  if (!el) return;
  if (!q) { el.innerHTML = '<div style="text-align:center;padding:24px;color:#666;font-size:12px;">Type to search</div>'; return; }

  el.innerHTML = '<div class="spinner" style="margin:24px auto;"></div>';

  var results = [];

  // Guns
  var gunMatches = ALL_GUNS.filter(function(g) { return g.toLowerCase().indexOf(q.toLowerCase()) !== -1; }).slice(0, 5);
  gunMatches.forEach(function(g) { results.push({ type: 'gun', label: g }); });

  // Users
  try {
    var uSnap = await getDocs(query(collection(db, 'users'), where('ign', '==', q), limit(5)));
    uSnap.forEach(function(d) { results.push({ type: 'user', uid: d.id, label: d.data().ign, avatar: d.data().avatar }); });
  } catch (e) {}

  // Clans
  try {
    var cSnap = await getDocs(query(collection(db, 'clans'), where('name', '==', q), limit(5)));
    cSnap.forEach(function(d) { results.push({ type: 'clan', label: d.data().name }); });
  } catch (e) {}

  if (!results.length) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:#666;font-size:12px;">No results</div>';
    return;
  }

  el.innerHTML = results.map(function(r, i) {
    var icon = r.type === 'gun' ? '🔫' : r.type === 'user' ? '👤' : '🛡️';
    return '<button class="gs-item" data-i="' + i + '" style="width:100%;display:flex;align-items:center;gap:12px;padding:12px;background:#141414;border:1px solid #222;border-radius:10px;margin-bottom:6px;color:#fff;font-weight:700;font-size:13px;text-align:left;cursor:pointer;">' +
      '<span style="font-size:18px;">' + icon + '</span>' +
      '<span style="flex:1;">' + esc(r.label) + '</span>' +
      '<span style="font-size:10px;color:#666;text-transform:uppercase;">' + r.type + '</span>' +
    '</button>';
  }).join('');

  el.querySelectorAll('.gs-item').forEach(function(btn) {
    btn.onclick = function() {
      var r = results[parseInt(btn.dataset.i)];
      closeSheet();
      if (r.type === 'user') setTimeout(function() { openUserProfile(r.uid); }, 250);
      else if (r.type === 'gun') { toast('Search "' + r.label + '" in Lab', 'info'); }
      else if (r.type === 'clan') { toast('Clan: ' + r.label, 'info'); }
    };
  });
}

// ---------- INBOX ----------
async function openInbox() {
  inboxTab = inboxTab || 'notifications';

  var html =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="display:flex;gap:6px;">' +
        '<button class="inbox-tab" data-tab="notifications" style="flex:1;padding:10px;border-radius:10px;background:' + (inboxTab === 'notifications' ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (inboxTab === 'notifications' ? '#ff6b00' : '#222') + ';color:' + (inboxTab === 'notifications' ? '#ff6b00' : '#888') + ';font-weight:800;font-size:12px;cursor:pointer;">🔔 Notifications</button>' +
        '<button class="inbox-tab" data-tab="messages" style="flex:1;padding:10px;border-radius:10px;background:' + (inboxTab === 'messages' ? 'rgba(255,107,0,.15)' : '#141414') + ';border:1px solid ' + (inboxTab === 'messages' ? '#ff6b00' : '#222') + ';color:' + (inboxTab === 'messages' ? '#ff6b00' : '#888') + ';font-weight:800;font-size:12px;cursor:pointer;">💬 Messages</button>' +
      '</div>' +
      '<div id="inbox-content"><div class="spinner" style="margin:24px auto;"></div></div>' +
    '</div>';
  openSheet(html, 'Inbox');

  document.querySelectorAll('.inbox-tab').forEach(function(btn) {
    btn.onclick = function() { inboxTab = btn.dataset.tab; openInbox(); };
  });

  loadInboxContent();
}

async function loadInboxContent() {
  var wrap = document.getElementById('inbox-content');
  if (!wrap) return;

  if (inboxTab === 'notifications') {
    try {
      var snap = await getDocs(query(collection(db, 'notifications'), where('userId', '==', State.user.uid), limit(50)));
      var notifs = [];
      snap.forEach(function(d) { notifs.push(Object.assign({ id: d.id }, d.data())); });
      notifs.sort(function(a, b) {
        var at = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
        var bt = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
        return bt - at;
      });

      if (!notifs.length) {
        wrap.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#666;font-size:13px;">No notifications yet</div>';
        return;
      }

      wrap.innerHTML = notifs.map(function(n) {
        return '<div style="padding:12px;background:#141414;border:1px solid #222;border-radius:12px;margin-bottom:8px;">' +
          '<div style="font-size:13px;color:#fff;font-weight:700;">' + esc(n.title || 'Notification') + '</div>' +
          '<div style="font-size:12px;color:#aaa;margin-top:4px;">' + esc(n.body || '') + '</div>' +
          '<div style="font-size:10px;color:#666;margin-top:6px;">' + timeAgo(n.createdAt) + '</div>' +
        '</div>';
      }).join('');
    } catch (e) {
      wrap.innerHTML = '<div style="text-align:center;padding:24px;color:#ef4444;font-size:12px;">Failed</div>';
    }
  } else {
    wrap.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#666;font-size:13px;">Messages coming soon</div>';
  }
}

// ---------- LIVE UPDATES ----------
function startHomeLiveUpdates() {
  stopHomeLiveUpdates();
  if (!State.user) return;
  try {
    var lobbiesUnsub = onSnapshot(query(collection(db, 'lobbies'), limit(30)), function() {
      debouncedHomeRefresh();
    });
    var postsUnsub = onSnapshot(query(collection(db, 'posts'), limit(30)), function() {
      debouncedHomeRefresh();
    });
    homeLiveUnsubs = [lobbiesUnsub, postsUnsub];
  } catch (e) {
    console.warn('Live updates error:', e);
  }
}

function stopHomeLiveUpdates() {
  homeLiveUnsubs.forEach(function(u) { try { u(); } catch (e) {} });
  homeLiveUnsubs = [];
}

var __homeRefreshTimer = null;
function debouncedHomeRefresh() {
  clearTimeout(__homeRefreshTimer);
  __homeRefreshTimer = setTimeout(async function() {
    if (State.currentTab !== 'home') return;
    await fetchHomeFeed();
    renderHomeFeed();
  }, 800);
}

// ---------- HERO WELCOME ----------
function showHeroWelcome(onDone) {
  var shown = localStorage.getItem('codmpanda_hero_shown_' + State.user.uid);
  if (shown === '1') { if (onDone) onDone(); return; }

  var ov = document.createElement('div');
  ov.id = 'hero-welcome';
  ov.style.cssText = 'position:fixed;inset:0;z-index:300;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;';

  var fireflies = '';
  for (var i = 0; i < 40; i++) {
    var x = Math.random() * 100;
    var y = Math.random() * 100;
    var delay = Math.random() * 3;
    var dur = 3 + Math.random() * 3;
    var color = i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF6B00' : '#00BFFF';
    fireflies += '<div style="position:absolute;left:' + x + '%;top:' + y + '%;width:3px;height:3px;border-radius:50%;background:' + color + ';box-shadow:0 0 8px ' + color + ';animation:fireflyFloat ' + dur + 's ease-in-out infinite;animation-delay:' + delay + 's;"></div>';
  }

  ov.innerHTML =
    '<div style="position:absolute;inset:0;">' + fireflies + '</div>' +
    '<img src="/hero-panda.jpg" alt="CODMPanda" style="width:220px;height:220px;border-radius:28px;position:relative;box-shadow:0 0 60px rgba(255,107,0,.7);" />' +
    '<div style="margin-top:24px;text-align:center;position:relative;">' +
      '<div style="font-size:32px;font-weight:900;background:linear-gradient(135deg,#FFD700,#FF6B00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">CODMPanda</div>' +
      '<div style="font-size:12px;color:#888;margin-top:6px;">The Ultimate CODM Companion</div>' +
      '<button id="hero-btn" style="margin-top:32px;padding:14px 40px;border-radius:14px;background:linear-gradient(135deg,#FF6B00,#CC5500);border:none;color:#fff;font-weight:900;font-size:15px;cursor:pointer;box-shadow:0 0 30px rgba(255,107,0,.6);">Get Started</button>' +
    '</div>';

  // Add keyframes if not present
  if (!document.getElementById('hero-keyframes')) {
    var style = document.createElement('style');
    style.id = 'hero-keyframes';
    style.textContent = '@keyframes fireflyFloat { 0%,100%{transform:translate(0,0);opacity:.3;} 50%{transform:translate(20px,-30px);opacity:1;} }';
    document.head.appendChild(style);
  }

  document.body.appendChild(ov);

  document.getElementById('hero-btn').onclick = function() {
    localStorage.setItem('codmpanda_hero_shown_' + State.user.uid, '1');
    ov.style.opacity = '0';
    ov.style.transition = 'opacity .4s';
    setTimeout(function() { ov.remove(); if (onDone) onDone(); }, 400);
  };
}

// ---------- BOOT ----------
async function boot() {
  console.log('🐼 CODMPanda booting...');

  // Init UI shell
  initAppShell();

  // Handle referral link
  try {
    var params = new URLSearchParams(location.search);
    var ref = params.get('ref');
    if (ref && State.user) {
      var tracked = localStorage.getItem('codmpanda_ref_tracked_' + State.user.uid);
      if (!tracked) {
        await updateDoc(doc(db, 'users', ref), { invites: increment(1) });
        localStorage.setItem('codmpanda_ref_tracked_' + State.user.uid, '1');
        toast('🎉 Referral applied!', 'success');
      }
    }
  } catch (e) {}

  // Handle custom lobby URL
  try {
    var lobbyParam = new URLSearchParams(location.search).get('lobby');
    if (lobbyParam) {
      var snap = await getDocs(query(collection(db, 'lobbies'), where('ign', '==', lobbyParam), limit(1)));
      if (!snap.empty) {
        var lobby = Object.assign({ id: snap.docs[0].id }, snap.docs[0].data());
        setTimeout(function() { openVoiceRoom(lobby); }, 1500);
      }
    }
  } catch (e) {}

  // Handle profile deep link
  try {
    var profileParam = new URLSearchParams(location.search).get('profile');
    if (profileParam) {
      setTimeout(function() { openUserProfile(profileParam); }, 1500);
    }
  } catch (e) {}
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// ---------- EXPOSE ----------
window.openGlobalSearch = openGlobalSearch;
window.openInbox = openInbox;
window.startHomeLiveUpdates = startHomeLiveUpdates;
window.stopHomeLiveUpdates = stopHomeLiveUpdates;
window.showHeroWelcome = showHeroWelcome;

console.log('✅ Chunk 7/8 Part 3/3 loaded — Search + Inbox + Boot');
// ============================================
// END OF CHUNK 7/8 — PART 3/3
// ============================================
// ============================================
// CHUNK 8/8 — PART 1/3
// Push Notifications (FCM + Cloudflare Worker)
// ============================================

// ---------- ENABLE NOTIFICATIONS ----------
async function enableNotifications() {
  if (!State.user) { toast('Sign in first', 'error'); return false; }
  if (!('Notification' in window)) { toast('Notifications not supported', 'error'); return false; }
  if (!('serviceWorker' in navigator)) { toast('Service worker not supported', 'error'); return false; }

  try {
    // Request permission
    var permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      toast('Permission denied', 'warning');
      return false;
    }

    // Get FCM token
    if (typeof firebase === 'undefined' || !firebase.messaging) {
      toast('FCM not loaded', 'error');
      return false;
    }

    var messaging = firebase.messaging();
    var token = await messaging.getToken({ vapidKey: VAPID_KEY });
    if (!token) {
      toast('Failed to get token', 'error');
      return false;
    }

    // Save token to user profile
    var tokens = (State.profile.fcmTokens || []).slice();
    if (tokens.indexOf(token) === -1) tokens.push(token);

    await updateDoc(doc(db, 'users', State.user.uid), {
      fcmTokens: tokens,
      notificationsEnabled: true
    });
    State.profile.fcmTokens = tokens;
    State.profile.notificationsEnabled = true;

    toast('✓ Notifications enabled', 'success');
    return true;
  } catch (e) {
    console.error('Enable notifications error:', e);
    toast('Failed: ' + (e.message || 'unknown'), 'error');
    return false;
  }
}

// ---------- DISABLE NOTIFICATIONS ----------
async function disableNotifications() {
  if (!State.user) return;
  try {
    if (typeof firebase !== 'undefined' && firebase.messaging) {
      var messaging = firebase.messaging();
      try {
        var token = await messaging.getToken({ vapidKey: VAPID_KEY });
        if (token) {
          try { await messaging.deleteToken(); } catch (e) {}
          var tokens = (State.profile.fcmTokens || []).filter(function(t) { return t !== token; });
          await updateDoc(doc(db, 'users', State.user.uid), {
            fcmTokens: tokens,
            notificationsEnabled: false
          });
          State.profile.fcmTokens = tokens;
        }
      } catch (e) {}
    }
    State.profile.notificationsEnabled = false;
    toast('Notifications disabled', 'info');
  } catch (e) {
    console.error('Disable notifications error:', e);
  }
}

// ---------- TOGGLE NOTIFICATIONS ----------
async function toggleNotif() {
  if (!State.profile) return;
  if (State.profile.notificationsEnabled) {
    await disableNotifications();
  } else {
    await enableNotifications();
  }
}

// ---------- SEND PUSH TO USER (via Cloudflare Worker) ----------
async function sendPushToUser(userId, title, body, data) {
  try {
    var userRef = doc(db, 'users', userId);
    var snap = await getDoc(userRef);
    if (!snap.exists()) return false;
    var user = snap.data();
    if (!user.fcmTokens || !user.fcmTokens.length) return false;
    if (user.notificationsEnabled === false) return false;

    var res = await fetch(NOTIFY_WORKER_URL + '/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokens: user.fcmTokens,
        title: title,
        body: body,
        data: data || {}
      })
    });

    if (!res.ok) {
      console.warn('Push failed:', await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Push error:', e);
    return false;
  }
}

// ---------- IN-APP NOTIFICATION ----------
async function createInAppNotification(userId, type, title, body, data) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: userId,
      type: type || 'info',
      title: title,
      body: body || '',
      data: data || {},
      read: false,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.warn('Notification create error:', e);
    return false;
  }
}

// ---------- FOREGROUND MESSAGE HANDLER ----------
function initFCMForegroundHandler() {
  if (typeof firebase === 'undefined' || !firebase.messaging) return;
  try {
    var messaging = firebase.messaging();
    messaging.onMessage(function(payload) {
      var title = (payload.notification && payload.notification.title) || 'CODMPanda';
      var body = (payload.notification && payload.notification.body) || '';
      toast(title + (body ? ': ' + body : ''), 'info', 4000);
    });
  } catch (e) {
    console.warn('FCM foreground handler error:', e);
  }
}

// ---------- WIRE INTO NOTIFICATION SETTINGS ----------
// This runs when the user opens the notification settings sheet
async function syncNotificationToggle() {
  var masterEl = document.getElementById('ns-master');
  if (!masterEl) return;
  masterEl.onchange = async function() {
    if (masterEl.checked) {
      var ok = await enableNotifications();
      if (!ok) masterEl.checked = false;
    } else {
      await disableNotifications();
    }
  };
}

// ---------- EXPOSE ----------
window.enableNotifications = enableNotifications;
window.disableNotifications = disableNotifications;
window.toggleNotif = toggleNotif;
window.sendPushToUser = sendPushToUser;
window.createInAppNotification = createInAppNotification;

console.log('✅ Chunk 8/8 Part 1/3 loaded — Push Notifications');
// ============================================
// END OF CHUNK 8/8 — PART 1/3
// ============================================
// ============================================
// CHUNK 8/8 — PART 2/3
// Notifications badge + Activity stats dashboard
// ============================================

// ---------- COMBINED BADGE (unread notifications + DMs) ----------
var notifBadgeUnsub = null;
var unreadNotifCount = 0;
var unreadMsgCount = 0;

function startNotifBadgeListener() {
  stopNotifBadgeListener();
  if (!State.user) return;
  try {
    notifBadgeUnsub = onSnapshot(query(
      collection(db, 'notifications'),
      where('userId', '==', State.user.uid),
      where('read', '==', false)
    ), function(snap) {
      unreadNotifCount = snap.size;
      updateCombinedBadge();
    });
  } catch (e) {
    console.warn('Notif badge listener error:', e);
  }
}

function stopNotifBadgeListener() {
  if (notifBadgeUnsub) { try { notifBadgeUnsub(); } catch (e) {} notifBadgeUnsub = null; }
  unreadNotifCount = 0;
  unreadMsgCount = 0;
  updateCombinedBadge();
}

function updateCombinedBadge() {
  var dot = document.getElementById('top-notif-dot');
  if (!dot) return;
  var total = unreadNotifCount + unreadMsgCount;
  if (total > 0) {
    dot.style.display = 'block';
    dot.textContent = total > 9 ? '9+' : String(total);
    dot.style.width = total > 9 ? '18px' : '10px';
    dot.style.height = total > 9 ? '18px' : '10px';
    dot.style.borderRadius = '999px';
    dot.style.fontSize = '9px';
    dot.style.fontWeight = '900';
    dot.style.color = '#fff';
    dot.style.display = 'flex';
    dot.style.alignItems = 'center';
    dot.style.justifyContent = 'center';
    dot.style.top = total > 9 ? '2px' : '6px';
    dot.style.right = total > 9 ? '2px' : '6px';
  } else {
    dot.style.display = 'none';
  }
}

// ---------- MARK NOTIFICATIONS READ ----------
async function markNotificationsRead() {
  if (!State.user) return;
  try {
    var snap = await getDocs(query(
      collection(db, 'notifications'),
      where('userId', '==', State.user.uid),
      where('read', '==', false)
    ));
    var batch = writeBatch(db);
    snap.forEach(function(d) { batch.update(d.ref, { read: true }); });
    await batch.commit();
  } catch (e) {
    console.warn('Mark read error:', e);
  }
}

// ---------- ACTIVITY STATS ----------
async function loadActivityStats() {
  if (!State.user) return null;
  var uid = State.user.uid;

  try {
    var results = await Promise.all([
      getDocs(query(collection(db, 'lobbies'), where('uid', '==', uid))).then(function(s) { return s.size; }).catch(function() { return 0; }),
      getDocs(query(collection(db, 'vaults'), where('uid', '==', uid))).then(function(s) { return s.size; }).catch(function() { return 0; }),
      getDocs(query(collection(db, 'posts'), where('uid', '==', uid))).then(function(s) { return s.size; }).catch(function() { return 0; }),
      getDoc(doc(db, 'camos', uid)).catch(function() { return null; }),
      getDocs(query(collection(db, 'likes'), where('userId', '==', uid))).then(function(s) { return s.size; }).catch(function() { return 0; })
    ]);

    var lobbies = results[0] || 0;
    var vaults = results[1] || 0;
    var posts = results[2] || 0;
    var camoSnap = results[3];
    var totalLikes = results[4] || 0;

    // Camo percentage
    var camoPct = 0;
    var camosTracked = 0;
    if (camoSnap && camoSnap.exists && camoSnap.exists()) {
      var data = camoSnap.data();
      var guns = Object.keys(data).filter(function(k) { return k !== '__skins'; });
      camosTracked = guns.length;
      var totalPossible = guns.length * CAMO_TYPES.length;
      var checked = 0;
      guns.forEach(function(g) {
        var gunData = data[g] || {};
        CAMO_TYPES.forEach(function(c) { if (gunData[c.key]) checked++; });
      });
      camoPct = totalPossible ? Math.round((checked / totalPossible) * 100) : 0;
    }

    return {
      lobbies: lobbies,
      vaults: vaults,
      posts: posts,
      likes: totalLikes,
      streak: (State.profile && State.profile.activeStreak) || 1,
      approvedCount: (State.profile && State.profile.approvedCount) || 0,
      camoPct: camoPct,
      camosTracked: camosTracked,
      weekly: generateWeeklyChart(posts + vaults + lobbies)
    };
  } catch (e) {
    console.warn('Stats load error:', e);
    return null;
  }
}

function generateWeeklyChart(seed) {
  // Deterministic-ish 7-day chart from seed
  var days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  var values = [];
  for (var i = 0; i < 7; i++) {
    var n = Math.max(0, Math.floor(((seed + i * 3) % 12)));
    values.push({ day: days[i], value: n });
  }
  return values;
}

function renderActivityStats(stats) {
  if (!stats) return '';
  var max = Math.max.apply(null, stats.weekly.map(function(w) { return w.value; }).concat([1]));

  var bars = stats.weekly.map(function(w) {
    var h = Math.round((w.value / max) * 100);
    return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
      '<div style="width:100%;height:50px;display:flex;align-items:flex-end;justify-content:center;">' +
        '<div style="width:70%;height:' + Math.max(4, h) + '%;background:linear-gradient(180deg,#ff6b00,#CC5500);border-radius:4px 4px 2px 2px;"></div>' +
      '</div>' +
      '<div style="font-size:9px;color:#666;font-weight:700;">' + w.day + '</div>' +
    '</div>';
  }).join('');

  return '<div style="background:#111;border:1px solid #222;border-radius:14px;padding:14px;margin-bottom:14px;">' +
    '<div style="font-size:11px;font-weight:800;color:#888;text-transform:uppercase;margin-bottom:12px;">Weekly Activity</div>' +
    '<div style="display:flex;gap:4px;align-items:flex-end;">' + bars + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid #1a1a1a;">' +
      '<div style="text-align:center;">' +
        '<div style="font-size:18px;font-weight:900;color:#ff6b00;">' + stats.streak + '</div>' +
        '<div style="font-size:9px;color:#666;text-transform:uppercase;font-weight:700;">Day Streak</div>' +
      '</div>' +
      '<div style="text-align:center;">' +
        '<div style="font-size:18px;font-weight:900;color:#FFD700;">' + stats.camoPct + '%</div>' +
        '<div style="font-size:9px;color:#666;text-transform:uppercase;font-weight:700;">Camós</div>' +
      '</div>' +
      '<div style="text-align:center;">' +
        '<div style="font-size:18px;font-weight:900;color:#00BFFF;">' + stats.approvedCount + '</div>' +
        '<div style="font-size:9px;color:#666;text-transform:uppercase;font-weight:700;">Approved</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// ---------- INBOX: MARK READ ON OPEN ----------
var _origOpenInbox = window.openInbox;
window.openInbox = async function() {
  await markNotificationsRead();
  if (typeof _origOpenInbox === 'function') _origOpenInbox();
};

// ---------- START BADGE LISTENER ON BOOT ----------
onAuthStateChanged(auth, function(user) {
  if (user) {
    setTimeout(startNotifBadgeListener, 1500);
  } else {
    stopNotifBadgeListener();
  }
});

// ---------- EXPOSE ----------
window.startNotifBadgeListener = startNotifBadgeListener;
window.stopNotifBadgeListener = stopNotifBadgeListener;
window.updateCombinedBadge = updateCombinedBadge;
window.markNotificationsRead = markNotificationsRead;
window.loadActivityStats = loadActivityStats;
window.renderActivityStats = renderActivityStats;

console.log('✅ Chunk 8/8 Part 2/3 loaded — Badge + Activity Stats');
// ============================================
// END OF CHUNK 8/8 — PART 2/3
// ============================================
// ============================================
// CHUNK 8/8 — PART 3/3
// Final helpers: share card, cleanup, welcome, boot orchestration
// ============================================

// ---------- SHARE PROFILE AS IMAGE ----------
async function shareProfileAsImage() {
  if (!State.profile) return;
  try {
    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    var ctx = canvas.getContext('2d');

    // Background gradient
    var grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, '#0a0500');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Border
    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1000, 1270);

    // Title
    ctx.font = 'bold 40px Inter, sans-serif';
    ctx.fillStyle = '#FF6B00';
    ctx.textAlign = 'center';
    ctx.fillText('CODMPanda', 540, 140);

    // Avatar circle
    ctx.beginPath();
    ctx.arc(540, 340, 120, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,107,0,0.2)';
    ctx.fill();
    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Initials
    ctx.font = 'bold 80px Inter, sans-serif';
    ctx.fillStyle = '#FF6B00';
    ctx.textAlign = 'center';
    ctx.fillText(getInitials(State.profile.ign || '?'), 540, 370);

    // Name
    ctx.font = 'bold 56px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(State.profile.ign || 'Panda', 540, 560);

    // Rank + region
    ctx.font = '28px Inter, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText((State.profile.rank || 'Rookie') + ' • ' + (State.profile.region || 'Africa'), 540, 615);

    // Stats grid
    var stats = [
      { label: 'Vaults', value: State.cache.vaults.filter(function(v) { return v.uid === State.user.uid; }).length },
      { label: 'Posts', value: (homeCache.feed || []).filter(function(p) { return p.uid === State.user.uid && p.type === 'post'; }).length },
      { label: 'Approved', value: State.profile.approvedCount || 0 },
      { label: 'Streak', value: (State.profile.activeStreak || 0) + 'd' }
    ];

    var startY = 780;
    var boxW = 200;
    var gap = 20;
    var totalW = boxW * 4 + gap * 3;
    var startX = (1080 - totalW) / 2;

    stats.forEach(function(s, i) {
      var x = startX + i * (boxW + gap);
      ctx.fillStyle = '#141414';
      ctx.fillRect(x, startY, boxW, 160);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, startY, boxW, 160);

      ctx.font = 'bold 44px Inter, sans-serif';
      ctx.fillStyle = '#FF6B00';
      ctx.fillText(String(s.value), x + boxW / 2, startY + 70);

      ctx.font = '20px Inter, sans-serif';
      ctx.fillStyle = '#888';
      ctx.fillText(s.label, x + boxW / 2, startY + 120);
    });

    // Bio
    if (State.profile.bio) {
      ctx.font = '26px Inter, sans-serif';
      ctx.fillStyle = '#ccc';
      var bio = State.profile.bio.length > 60 ? State.profile.bio.substring(0, 60) + '...' : State.profile.bio;
      ctx.fillText(bio, 540, 1040);
    }

    // Footer
    ctx.font = '22px Inter, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText('codmpanda.pages.dev', 540, 1230);

    // Convert to blob and share/download
    canvas.toBlob(async function(blob) {
      if (!blob) { toast('Failed to generate image', 'error'); return; }
      var file = new File([blob], 'codmpanda-profile.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'My CODMPanda Profile',
            text: 'Check out my CODMPanda profile!'
          });
        } catch (e) {
          if (e.name !== 'AbortError') downloadBlob(blob, 'codmpanda-profile.png');
        }
      } else {
        downloadBlob(blob, 'codmpanda-profile.png');
        toast('✓ Image saved', 'success');
      }
    }, 'image/png', 0.9);
  } catch (e) {
    console.error('Share card error:', e);
    toast('Failed to generate card', 'error');
  }
}

function downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// ---------- CLEAR EXPIRED CONTENT ----------
async function clearExpiredContent() {
  var now = Date.now();
  try {
    // Lobbies
    var lobbiesSnap = await getDocs(query(collection(db, 'lobbies'), limit(100)));
    var batch = writeBatch(db);
    var count = 0;
    lobbiesSnap.forEach(function(d) {
      var data = d.data();
      var exp = data.expiresAt && data.expiresAt.toMillis ? data.expiresAt.toMillis() : (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() + 86400000 : now);
      if (exp < now) { batch.delete(d.ref); count++; }
    });
    if (count > 0) await batch.commit();

    // Scrims
    var scrimsSnap = await getDocs(query(collection(db, 'scrims'), limit(100)));
    batch = writeBatch(db);
    count = 0;
    scrimsSnap.forEach(function(d) {
      var data = d.data();
      var exp = data.expiresAt && data.expiresAt.toMillis ? data.expiresAt.toMillis() : (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() + 43200000 : now);
      if (exp < now) { batch.delete(d.ref); count++; }
    });
    if (count > 0) await batch.commit();

    // Posts (90 days)
    var postsSnap = await getDocs(query(collection(db, 'posts'), limit(100)));
    batch = writeBatch(db);
    count = 0;
    postsSnap.forEach(function(d) {
      var data = d.data();
      var exp = data.expiresAt && data.expiresAt.toMillis ? data.expiresAt.toMillis() : (data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() + 90 * 86400000 : now);
      if (exp < now) { batch.delete(d.ref); count++; }
    });
    if (count > 0) await batch.commit();

    console.log('✓ Cleanup complete');
  } catch (e) {
    console.warn('Cleanup error:', e);
  }
}

// ---------- REFERRAL AUTO-GRANT ----------
async function checkReferralMilestones() {
  if (!State.profile) return;
  var invites = State.profile.invites || 0;
  var lastMilestone = State.profile.lastReferralMilestone || 0;
  var currentMilestone = Math.floor(invites / 3) * 3;

  if (currentMilestone > lastMilestone && currentMilestone > 0) {
    try {
      var expiry = new Date();
      expiry.setDate(expiry.getDate() + 7);

      await updateDoc(doc(db, 'users', State.user.uid), {
        isPro: true,
        proExpiry: Timestamp.fromDate(expiry),
        lastReferralMilestone: currentMilestone
      });
      State.profile.isPro = true;
      State.profile.lastReferralMilestone = currentMilestone;

      await createInAppNotification(State.user.uid, 'pro', '🎉 Pro Unlocked!', 'You earned 7 days of Pro from referrals!', {});
      toast('🎉 7 days Pro unlocked!', 'success', 4000);
    } catch (e) {
      console.warn('Referral grant error:', e);
    }
  }
}

// ---------- CHECK VERIFIED STATUS ----------
async function checkVerifiedStatus() {
  if (!State.profile) return false;
  var approved = State.profile.approvedCount || 0;
  var isPro = State.profile.isPro;
  var shouldBeVerified = approved >= 10 && isPro;
  var currentlyVerified = State.profile.verified || false;

  if (shouldBeVerified && !currentlyVerified) {
    try {
      await updateDoc(doc(db, 'users', State.user.uid), {
        verified: true,
        verifiedAt: serverTimestamp()
      });
      State.profile.verified = true;
      await createInAppNotification(State.user.uid, 'verified', '✓ Verified!', 'You earned the Verified Creator badge!', {});
      toast('✓ Verified Creator badge earned!', 'success', 4000);
      return true;
    } catch (e) {}
  }
  return currentlyVerified;
}

// ---------- APP TOUR ----------
function startAppTour() {
  var steps = [
    { icon: 'home', title: 'Home Feed', text: 'See what the community is posting — lobbies, builds, clips, and more.' },
    { icon: 'gamepad-2', title: 'Play', text: 'Find a squad. Post lobbies, join voice rooms, dominate together.' },
    { icon: 'flask-conical', title: 'The Lab', text: 'Save gunsmith builds, sensitivities, HUD layouts, and track camos.' },
    { icon: 'users', title: 'Squad', text: 'Clans, scrims, clips, tournaments — everything competitive.' },
    { icon: 'radar', title: 'Intel', text: 'CP calculator, leaks, tier list, and the Isolated map.' },
    { icon: 'user', title: 'You', text: 'Your profile, activity stats, and all settings.' }
  ];

  var current = 0;
  var ov = document.createElement('div');
  ov.id = 'tour-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:24px;';

  function render() {
    var s = steps[current];
    ov.innerHTML =
      '<div style="background:#141414;border:1px solid #2a2a2a;border-radius:20px;padding:28px;max-width:340px;text-align:center;">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:rgba(255,107,0,.15);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">' +
          '<i data-lucide="' + s.icon + '" style="width:28px;height:28px;color:#ff6b00;"></i>' +
        '</div>' +
        '<div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:8px;">' + esc(s.title) + '</div>' +
        '<div style="font-size:13px;color:#aaa;line-height:1.5;margin-bottom:20px;">' + esc(s.text) + '</div>' +
        '<div style="display:flex;justify-content:center;gap:4px;margin-bottom:16px;">' +
          steps.map(function(_, i) {
            return '<div style="width:' + (i === current ? '20' : '6') + 'px;height:6px;border-radius:999px;background:' + (i === current ? '#ff6b00' : '#333') + ';transition:all .2s;"></div>';
          }).join('') +
        '</div>' +
        '<button id="tour-next" style="width:100%;padding:14px;border-radius:12px;background:#ff6b00;border:none;color:#fff;font-weight:800;font-size:14px;cursor:pointer;">' +
          (current === steps.length - 1 ? 'Finish' : 'Next') +
        '</button>' +
        '<button id="tour-skip" style="width:100%;padding:10px;margin-top:8px;background:transparent;border:none;color:#666;font-size:12px;cursor:pointer;">Skip Tour</button>' +
      '</div>';

    if (window.lucide) window.lucide.createIcons();

    document.getElementById('tour-next').onclick = function() {
      if (current === steps.length - 1) finishTour();
      else { current++; render(); }
    };
    document.getElementById('tour-skip').onclick = finishTour;
  }

  async function finishTour() {
    ov.remove();
    try {
      await updateDoc(doc(db, 'users', State.user.uid), { tourCompleted: true });
      State.profile.tourCompleted = true;
    } catch (e) {}
  }

  document.body.appendChild(ov);
  render();
}

// ---------- RE-EXPOSE FINAL ----------
window.shareProfileAsImage = shareProfileAsImage;
window.startAppTour = startAppTour;
window.checkVerifiedStatus = checkVerifiedStatus;
window.clearExpiredContent = clearExpiredContent;
window.checkReferralMilestones = checkReferralMilestones;

console.log('✅ Chunk 8/8 Part 3/3 loaded — Final helpers');
// ============================================
// END OF CHUNK 8/8 — PART 3/3
// ============================================
// ============================================
// CHUNK 9 — Splash lifecycle fix
// ============================================

// Central splash controller
function hideSplashDelayed(callback) {
  var sp = document.getElementById('splash');
  if (!sp) { if (callback) callback(); return; }
  if (sp.dataset.hiding === '1') { if (callback) setTimeout(callback, 400); return; }
  sp.dataset.hiding = '1';
  sp.style.transition = 'opacity .35s ease';
  sp.style.opacity = '0';
  setTimeout(function() {
    sp.style.display = 'none';
    if (callback) callback();
  }, 380);
}

// Override showAuthGate — hide splash first, then show auth
var _origShowAuthGateV9 = window.showAuthGate;
window.showAuthGate = function() {
  hideSplashDelayed(function() {
    if (typeof _origShowAuthGateV9 === 'function') _origShowAuthGateV9();
  });
};

// Override showMainApp — hide splash first, then show main
var _origShowMainAppV9 = window.showMainApp;
window.showMainApp = function() {
  hideSplashDelayed(function() {
    if (typeof _origShowMainAppV9 === 'function') _origShowMainAppV9();
  });
};

// Override showOnboarding — hide splash first, then show onboarding
var _origShowOnboardingV9 = window.showOnboarding;
window.showOnboarding = function() {
  hideSplashDelayed(function() {
    if (typeof _origShowOnboardingV9 === 'function') _origShowOnboardingV9();
  });
};

// Failsafe: force-hide splash after 3s no matter what
setTimeout(function() {
  var sp = document.getElementById('splash');
  if (sp && sp.style.display !== 'none') {
    console.warn('⚠️ Splash failsafe triggered after 3s');
    hideSplashDelayed();
  }
}, 3000);

console.log('✅ Chunk 9 loaded — Splash lifecycle');
