// ═══════════════════════════════════════════
// CODMPanda app.js — Chunk 1a/24
// Constants & Data (part 1)
// ═══════════════════════════════════════════

// ─────────── APP INFO ───────────
var APP_VERSION = '1.0.0';
var ADMIN_UID = 'ItqEYihqxYW4HGm7i8bBYky8XNw1';
var NOTIFY_WORKER_URL = 'https://codmpanda-notify.bobbyjohon8585.workers.dev';
var VAPID_KEY = 'BB38qRzf4R5T_szvw7SvPklifWz_PhM1e4XQ8KKjqaIcauiUeJAZUKmJpWSbzusdny75mzckpAKXB78qSBWdU8A';
var GOOGLE_CLIENT_ID = '604146891375-ae5bhcm2nd2f59f0npp3en6setthjg1s.apps.googleusercontent.com';

// ─────────── FIREBASE CONFIG ───────────
var firebaseConfig = {
  apiKey: 'AIzaSyC4wVCT-ITLRFPDtzENnDjxL_1aVCAqWHg',
  authDomain: 'codmpanda-app.firebaseapp.com',
  projectId: 'codmpanda-app',
  storageBucket: 'codmpanda-app.firebasestorage.app',
  messagingSenderId: '604146891375',
  appId: '1:604146891375:web:ae74f70c184fd89d572b9a'
};

// ─────────── PAYMENT LINKS ───────────
var PAYMENT_LINKS = {
  lemonMonthly: 'https://codmpanda.lemonsqueezy.com/checkout/buy/5213aceb-052a-415f-aec4-4f5167c91d5d',
  lemonLifetime: 'https://codmpanda.lemonsqueezy.com/checkout/buy/5a5be449-8af9-4f09-88c5-da31131e6bac'
};

// ─────────── CODM GUNS ───────────
var CODM_GUNS = {
  'Assault Rifle': [
    'AK117','AK-47','ASM10','BK57','DR-H','FR .556','HBRa3','HVK-30',
    'ICR-1','KN-44','LK24','M16','M4','Man-O-War','Oden',
    'Peacekeeper MK2','AKBP','AS VAL','CR-56 AMAX','EM2',
    'FARA 83','Grau 5.56','Kilo 141','M13','Maddox',
    'Swordfish','Type 25','Type 19','BP50','RAM-7'
  ],
  'SMG': [
    'QQ9','MP5','MP7','PDW-57','RUS-79U','Cordite','GKS',
    'HG 40','MSMC','Pharo','Razorback','QQ10','AGR 556',
    'Fennec','Striker 45','PP19 Bizon','PPSh-41','QXR',
    'MX9','CX-9','LAPA','Vaznev-9K','ISO 45'
  ],
  'Sniper': [
    'Arctic .50','DL Q33','Locus','M21 EBR','XPR-50',
    'NA-45','Rytec AMR','SP-R 208','Kilo Bolt-Action',
    'ZRG 20mm','HDR','LW3-Tundra','Koshka','Outlaw'
  ],
  'LMG': [
    'RPD','M4LMG','UL736','S36','Chopper','Holger 26',
    'PKM','Bruen MK9','FiNN LMG','RAAL MG','Hades','MG82'
  ],
  'Shotgun': [
    'BY15','HS0405','HS2126','Striker','KRM 262',
    'Echo','JAK-12','R9-0','Argus','VLK Rogue'
  ],
  'Marksman': [
    'SKS','SPR-208','MK2 Carbine','Kar98K','EBR-14','SVD','Type 63'
  ],
  'Pistol': [
    'J358','MW11','.50 GS','Renetti','L-CAR 9',
    'Shorty','Crossbow','Nail Gun','TEC-9'
  ],
  'Melee': [
    'Knife','Baseball Bat','Axe','Karambit','Machete',
    'Kali Sticks','Katana','Sickle','Wrench','Shovel'
  ],
  'Launcher': [
    'FHJ-18','SMRS','Thumper','Strela-P','RPG-7','D13 Sector','M79'
  ]
};

var ALL_GUNS = Object.values(CODM_GUNS).flat();

var GUN_CATEGORY_META = {
  'Assault Rifle': { icon: 'crosshair', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  'SMG':           { icon: 'zap', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' },
  'Sniper':        { icon: 'target', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' },
  'LMG':           { icon: 'box', color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' },
  'Shotgun':       { icon: 'shield', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
  'Marksman':      { icon: 'crosshair', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' },
  'Pistol':        { icon: 'target', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)' },
  'Melee':         { icon: 'sword', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  'Launcher':      { icon: 'rocket', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)' }
};

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

var SKIN_RARITIES = [
  { key: 'common', label: 'Common', color: '#8E8E93', emoji: '⬜' },
  { key: 'rare', label: 'Rare', color: '#00BFFF', emoji: '🔵' },
  { key: 'epic', label: 'Epic', color: '#AF52DE', emoji: '🟣' },
  { key: 'legendary', label: 'Legendary', color: '#FF6B00', emoji: '🟠' },
  { key: 'mythic', label: 'Mythic', color: '#FFD700', emoji: '🟡' }
];

var RANKS = ['Rookie','Veteran','Elite','Pro','Master','Grandmaster','Legendary','Mythic','Legendary Rank','Top 500'];
var MODES = ['BR','MP','Ranked MP','Ranked BR','Zombies','Sniper Only','Scrim','Any'];
var REGIONS = ['Africa','EU','NA','SA','Asia','ME','Oceania','Global'];
var ROLES = ['Rusher','Sniper','Support','IGL','Anchor','Flex','Any'];

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

var HUD_STYLES = ['2-Finger','3-Finger','4-Finger Claw','5-Finger Claw','6-Finger','Custom'];

var REPUTATION_TAGS = [
  { key: 'teamplayer', label: 'Team Player', emoji: '🤝' },
  { key: 'skilled', label: 'Skilled', emoji: '🎯' },
  { key: 'chill', label: 'Chill Vibes', emoji: '😎' },
  { key: 'communicative', label: 'Good Comms', emoji: '🎙️' },
  { key: 'clutch', label: 'Clutch Player', emoji: '🔥' }
];

var HOME_FILTERS = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'lfg', label: 'LFG', emoji: '🎮' },
  { key: 'builds', label: 'Builds', emoji: '🔧' },
  { key: 'clips', label: 'Clips', emoji: '🎬' },
  { key: 'leaks', label: 'Leaks', emoji: '🔥' },
  { key: 'posts', label: 'Posts', emoji: '✍️' }
];

// ═══════════════════════════════════════════
// END CHUNK 1a/24
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// CODMPanda app.js — Chunk 1b/24
// Constants & Data (part 2) + Central State
// ═══════════════════════════════════════════

// ─────────── GUNSMITH SLOTS ───────────
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

var STAT_CONFIG = [
  { key: 'accuracy', label: 'Accuracy', color: '#00BFFF' },
  { key: 'damage', label: 'Damage', color: '#FF3B30' },
  { key: 'range', label: 'Range', color: '#FF9500' },
  { key: 'fireRate', label: 'Fire Rate', color: '#FFCC00' },
  { key: 'mobility', label: 'Mobility', color: '#34C759' },
  { key: 'control', label: 'Control', color: '#AF52DE' }
];

// ─────────── ATTACHMENT POOLS ───────────
var ATTACHMENT_POOLS = {
  muzzle: [
    { name: 'Muzzle Brake', effects: { control: 8, accuracy: 4 } },
    { name: 'Compensator', effects: { control: 10, accuracy: -2 } },
    { name: 'Flash Guard', effects: { control: 5 } },
    { name: 'Suppressor', effects: { range: -5, mobility: 3, control: 6 } },
    { name: 'Monolithic Suppressor', effects: { range: 5, control: 8, mobility: -3 } },
    { name: 'Tactical Suppressor', effects: { control: 6, mobility: 2 } },
    { name: 'Flash Hider', effects: { accuracy: 5, control: 3 } }
  ],
  barrel: [
    { name: 'RTC Light Barrel', effects: { mobility: 8, range: -4 } },
    { name: 'OWC Marksman', effects: { range: 8, control: 4, mobility: -4 } },
    { name: 'OWC Ranger', effects: { range: 12, accuracy: 5, mobility: -8, control: -3 } },
    { name: 'Light Extended Barrel', effects: { range: 4, mobility: 3 } },
    { name: 'MIP Extended Light Barrel', effects: { range: 6, mobility: 2 } },
    { name: 'MIP Custom Long Barrel', effects: { range: 10, accuracy: 4, mobility: -6 } },
    { name: 'Short Barrel', effects: { mobility: 10, accuracy: -4 } },
    { name: 'Tactical Barrel', effects: { accuracy: 6, control: 3 } },
    { name: 'Heavy Barrel', effects: { range: 9, damage: 3, mobility: -8 } },
    { name: 'RTC Heavy Long Barrel', effects: { range: 14, damage: 2, mobility: -12 } }
  ],
  optic: [
    { name: 'Red Dot Sight', effects: { accuracy: 4 } },
    { name: 'Holographic Sight', effects: { accuracy: 5 } },
    { name: '3x Tactical Scope', effects: { range: 4, accuracy: 6, mobility: -3 } },
    { name: '4x Tactical Scope', effects: { range: 6, accuracy: 8, mobility: -5 } },
    { name: '6x Tactical Scope', effects: { range: 8, accuracy: 10, mobility: -8 } },
    { name: 'Iron Sights', effects: { mobility: 3 } },
    { name: 'Classic Holographic', effects: { accuracy: 4 } }
  ],
  stock: [
    { name: 'No Stock', effects: { mobility: 10, control: -6, accuracy: -3 } },
    { name: 'MIP Strike Stock', effects: { accuracy: 5, control: 5, mobility: -3 } },
    { name: 'RTC Steady Stock', effects: { control: 8, accuracy: 6, mobility: -5 } },
    { name: 'YKM Light Stock', effects: { mobility: 6, control: 2 } },
    { name: 'OWC Skeleton Stock', effects: { mobility: 8, control: 3 } },
    { name: 'MIP Light Stock', effects: { mobility: 5, accuracy: 2 } },
    { name: 'Combat Stock', effects: { control: 6, accuracy: 4 } },
    { name: 'Tactical Stock', effects: { accuracy: 5, control: 4 } }
  ],
  laser: [
    { name: 'OWC Laser - Tactical', effects: { accuracy: 6, mobility: 4 } },
    { name: 'OWC Laser - Light', effects: { mobility: 6, accuracy: 3 } },
    { name: 'MIP Laser 5mW', effects: { mobility: 4, accuracy: 2 } },
    { name: 'Aim Assist Laser', effects: { accuracy: 8, mobility: 2 } },
    { name: 'Fast Switch Laser', effects: { mobility: 5, control: 2 } }
  ],
  underbarrel: [
    { name: 'Foregrip', effects: { control: 6, accuracy: 3 } },
    { name: 'Ranger Foregrip', effects: { control: 10, accuracy: 4, mobility: -3 } },
    { name: 'Strike Foregrip', effects: { mobility: 4, control: 3 } },
    { name: 'Tactical Foregrip A', effects: { control: 7, accuracy: 4 } },
    { name: 'Merc Foregrip', effects: { control: 8, accuracy: 3, mobility: -2 } },
    { name: 'Light Foregrip', effects: { control: 5, mobility: 2 } },
    { name: 'Operator Foregrip', effects: { control: 9, mobility: -3 } }
  ],
  ammunition: [
    { name: 'Extended Mag', effects: { mobility: -2 } },
    { name: 'Fast Mag', effects: { mobility: 3 } },
    { name: 'Extended Mag A', effects: { mobility: -3 } },
    { name: 'Large Extended Mag', effects: { mobility: -5 } },
    { name: 'Light Mag', effects: { mobility: 4 } }
  ],
  rearGrip: [
    { name: 'Rubberized Grip Tape', effects: { control: 5, accuracy: 3 } },
    { name: 'Stippled Grip Tape', effects: { accuracy: 4, control: 3 } },
    { name: 'Granulated Grip Tape', effects: { control: 6 } },
    { name: 'Skeletonized Rear Grip', effects: { mobility: 4, control: -2 } },
    { name: 'Tactical Rear Grip', effects: { accuracy: 4, mobility: 2 } }
  ],
  perk: [
    { name: 'Sleight of Hand', effects: {} },
    { name: 'Fast Switch', effects: {} },
    { name: 'Ammo Increase', effects: { mobility: -2 } },
    { name: 'Disable', effects: {} },
    { name: 'Long Shot', effects: { range: 3 } },
    { name: 'Hipfire', effects: { mobility: 3 } },
    { name: 'Toughness', effects: { control: 4 } }
  ]
};

var GUN_BASE_STATS = {
  'AK117': { accuracy: 65, damage: 70, range: 60, fireRate: 78, mobility: 68, control: 55 },
  'AK-47': { accuracy: 60, damage: 85, range: 75, fireRate: 55, mobility: 55, control: 45 },
  'M4': { accuracy: 78, damage: 62, range: 65, fireRate: 72, mobility: 70, control: 75 },
  'Fennec': { accuracy: 55, damage: 60, range: 55, fireRate: 92, mobility: 88, control: 40 },
  'QQ9': { accuracy: 65, damage: 62, range: 58, fireRate: 82, mobility: 82, control: 55 },
  'DL Q33': { accuracy: 88, damage: 92, range: 92, fireRate: 28, mobility: 40, control: 45 },
  'Locus': { accuracy: 82, damage: 88, range: 88, fireRate: 42, mobility: 55, control: 55 },
  'RPD': { accuracy: 68, damage: 78, range: 72, fireRate: 75, mobility: 35, control: 55 },
  'BY15': { accuracy: 60, damage: 92, range: 30, fireRate: 45, mobility: 72, control: 40 },
  'SKS': { accuracy: 82, damage: 75, range: 82, fireRate: 62, mobility: 58, control: 55 },
  'J358': { accuracy: 68, damage: 72, range: 55, fireRate: 62, mobility: 82, control: 55 },
  'Knife': { accuracy: 90, damage: 100, range: 5, fireRate: 90, mobility: 100, control: 80 }
};

var PRESET_BUILDS = {
  'Fennec': [
    { name: '⚡ Rusher', slots: { muzzle: 'Monolithic Suppressor', barrel: 'RTC Light Barrel', stock: 'No Stock', laser: 'OWC Laser - Tactical', rearGrip: 'Rubberized Grip Tape' } },
    { name: '🎯 Hip Fire', slots: { muzzle: 'Muzzle Brake', barrel: 'Short Barrel', stock: 'No Stock', laser: 'Aim Assist Laser', rearGrip: 'Stippled Grip Tape' } }
  ],
  'AK117': [
    { name: '⚡ Balanced', slots: { muzzle: 'Muzzle Brake', barrel: 'MIP Extended Light Barrel', optic: 'Red Dot Sight', stock: 'MIP Strike Stock', rearGrip: 'Rubberized Grip Tape' } }
  ],
  'DL Q33': [
    { name: '🎯 Quick Scope', slots: { muzzle: 'Muzzle Brake', barrel: 'OWC Marksman', stock: 'OWC Skeleton Stock', laser: 'OWC Laser - Tactical', perk: 'Fast Switch' } }
  ],
  'M4': [
    { name: '⚖️ Balanced', slots: { muzzle: 'Muzzle Brake', barrel: 'MIP Light Barrel', stock: 'MIP Strike Stock', laser: 'OWC Laser - Tactical', rearGrip: 'Rubberized Grip Tape' } }
  ]
};

// ─────────── PROFILE THEMES ───────────
var PROFILE_THEMES = {
  dark:   { name: 'AMOLED Dark', pro: false, gradient: 'linear-gradient(135deg,#111,#0a0a0a)', border: '#222222', glow: 'none', nameColor: '#ffffff' },
  gold:   { name: 'Royal Gold',  pro: true,  gradient: 'linear-gradient(135deg,#1a1200,#000)',   border: '#FFD700', glow: '0 0 30px rgba(255,215,0,0.4)', nameColor: '#FFD700' },
  fire:   { name: 'Fire Storm',  pro: true,  gradient: 'linear-gradient(135deg,#1a0500,#000,#1a0500)', border: '#FF6B00', glow: '0 0 30px rgba(255,107,0,0.5)', nameColor: '#FF6B00' },
  ice:    { name: 'Ice Freeze',  pro: true,  gradient: 'linear-gradient(135deg,#001428,#000)',   border: '#00BFFF', glow: '0 0 30px rgba(0,191,255,0.4)', nameColor: '#00BFFF' },
  galaxy: { name: 'Galaxy',      pro: true,  gradient: 'linear-gradient(135deg,#1a0033,#000,#0a001a)', border: '#AF52DE', glow: '0 0 30px rgba(175,82,222,0.5)', nameColor: '#AF52DE' }
};

var AVATAR_FRAMES = {
  none: { name: 'None', pro: false, style: '' },
  gold: { name: 'Gold', pro: true, style: 'background:linear-gradient(135deg,#FFD700,#B8860B);padding:3px;border-radius:50%;' },
  fire: { name: 'Fire', pro: true, style: 'background:linear-gradient(135deg,#FF6B00,#FF3B30);padding:3px;border-radius:50%;' },
  ice:  { name: 'Ice',  pro: true, style: 'background:linear-gradient(135deg,#00BFFF,#0080FF);padding:3px;border-radius:50%;' },
  neon: { name: 'Neon', pro: true, style: 'background:linear-gradient(135deg,#AF52DE,#FF6B00);padding:3px;border-radius:50%;' }
};

// ─────────── ISOLATED MAP POIs ───────────
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

// ─────────── CENTRAL STATE ───────────
var State = {
  user: null,
  profile: null,
  currentTab: 'home',
  likedItems: { vault: {}, clip: {}, leak: {}, post: {}, comment: {} },
  cache: {
    lobbies: [],
    vaults: [],
    camos: {},
    clans: [],
    scrims: [],
    clips: [],
    leaks: [],
    myVaultCount: 0,
    myCamoPct: 0
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
var homeRefreshTimer = null;

var labSubTab = 'vault';
var vaultTypeFilter = 'gunsmith';
var squadSubTab = 'clans';
var intelSubTab = 'cp';
var tournamentsSubTab = 'active';
var inboxTab = 'notifications';
var commentReplyTo = null;
var notifCountUnsub = null;
var badgeUpdateTimer = null;
var deferredPrompt = null;

var BuilderState = {
  selectedGun: null,
  selectedAttachments: {},
  activeSlot: null
};

var voiceRoomState = {
  active: false,
  lobbyId: null,
  lobby: null,
  jitsiApi: null,
  isMuted: false,
  participants: 0
};

var onboardingStep = 0;
var onboardingData = { rank: 'Rookie', region: 'Africa' };

var CLAN_WARS_RESET_DAY = 1;
var CLAN_WARS_MIN_SIZE = 3;
var CLAN_WARS_POINTS = { lobby: 2, submissionApproved: 10, dailyActive: 1, newMember: 5 };

var POST_CHAR_FREE_LIMIT = 500;

var LOBBY_EXPIRY_HOURS = 24;
var SCRIM_EXPIRY_HOURS = 12;
var SOFT_CLOSE_HOURS = 1440;
var MATCH_CONFIRM_WINDOW_MS = 30 * 60 * 1000;

var TOURNAMENT_SIZES = [4, 8, 16, 32];
var TOURNAMENT_REGISTRATION_HOURS = 24;
var TOURNAMENT_MODES = ['MP 5v5','BR Squad','Scrim 5v5','Sniper 1v1','1v1'];

var ONBOARDING_SLIDES = [
  { emoji: '🎮', title: 'Find Your Squad', desc: 'Real-time LFG board. Filter by rank, mode, region. Join lobbies with one tap via Jitsi voice.', color: 'from-primary/20 to-transparent' },
  { emoji: '🔬', title: 'Track Every Camo', desc: 'All 130+ guns. Sand → Damascus. Track progress, upload proofs, export your grind as an image.', color: 'from-gold/20 to-transparent' },
  { emoji: '⚔️', title: 'Build God Gunsmiths', desc: 'Share and discover the meta. Copy codes, browse attachments, like the best builds.', color: 'from-primary/20 to-transparent' }
];

// ─────────── EXPORTS TO WINDOW ───────────
window.APP_VERSION = APP_VERSION;
window.ADMIN_UID = ADMIN_UID;
window.NOTIFY_WORKER_URL = NOTIFY_WORKER_URL;
window.VAPID_KEY = VAPID_KEY;
window.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
window.PAYMENT_LINKS = PAYMENT_LINKS;
window.CODM_GUNS = CODM_GUNS;
window.ALL_GUNS = ALL_GUNS;
window.GUN_CATEGORY_META = GUN_CATEGORY_META;
window.CAMO_TYPES = CAMO_TYPES;
window.SKIN_RARITIES = SKIN_RARITIES;
window.RANKS = RANKS;
window.MODES = MODES;
window.REGIONS = REGIONS;
window.ROLES = ROLES;
window.SENS_FIELDS = SENS_FIELDS;
window.HUD_STYLES = HUD_STYLES;
window.REPUTATION_TAGS = REPUTATION_TAGS;
window.HOME_FILTERS = HOME_FILTERS;
window.GUNSMITH_SLOTS = GUNSMITH_SLOTS;
window.SLOT_ICON_MAP = SLOT_ICON_MAP;
window.STAT_CONFIG = STAT_CONFIG;
window.ATTACHMENT_POOLS = ATTACHMENT_POOLS;
window.GUN_BASE_STATS = GUN_BASE_STATS;
window.PRESET_BUILDS = PRESET_BUILDS;
window.PROFILE_THEMES = PROFILE_THEMES;
window.AVATAR_FRAMES = AVATAR_FRAMES;
window.ISOLATED_POIS = ISOLATED_POIS;
window.State = State;
window.homeCache = homeCache;

// ═══════════════════════════════════════════
// END CHUNK 1b/24 — Constants & Data COMPLETE
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// CODMPanda app.js — Chunk 2/24
// Utilities: toast, sheets, dialogs, helpers
// ═══════════════════════════════════════════

// ─────────── TOAST ───────────
function toast(message, type, duration) {
  type = type || 'success';
  duration = duration || 3000;
  var container = document.getElementById('toast-container');
  if (!container) return;
  var colors = {
    success: 'bg-green-500/10 border-green-500/40 text-green-400',
    error: 'bg-red-500/10 border-red-500/40 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/40 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'
  };
  var icons = {
    success: 'check-circle',
    error: 'x-circle',
    info: 'info',
    warning: 'alert-triangle'
  };
  var el = document.createElement('div');
  el.className = 'toast-enter flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg ' + colors[type] + ' pointer-events-auto';
  el.innerHTML = '<i data-lucide="' + icons[type] + '" class="w-5 h-5 flex-shrink-0"></i><span class="text-sm font-medium flex-1">' + message + '</span>';
  container.appendChild(el);
  if (window.lucide) window.lucide.createIcons();
  setTimeout(function() {
    el.classList.add('toast-exit');
    setTimeout(function() { el.remove(); }, 250);
  }, duration);
}

// ─────────── CONFIRM DIALOG ───────────
function confirmDialog(title, message, onConfirm, confirmText, danger) {
  confirmText = confirmText || 'Confirm';
  danger = !!danger;
  var container = document.getElementById('modal-container');
  container.classList.remove('hidden');
  container.innerHTML = 
    '<div class="modal-backdrop absolute inset-0 flex items-center justify-center p-6" onclick="if(event.target===this) closeModal()">' +
      '<div class="bg-card border border-border rounded-2xl p-6 max-w-sm w-full slide-up">' +
        '<h3 class="text-lg font-bold mb-2">' + title + '</h3>' +
        '<p class="text-sm text-gray-400 mb-6">' + message + '</p>' +
        '<div class="flex gap-3">' +
          '<button onclick="closeModal()" class="btn-press flex-1 py-3 rounded-xl bg-cardAlt border border-border text-sm font-semibold">Cancel</button>' +
          '<button id="confirm-btn" class="btn-press flex-1 py-3 rounded-xl ' + (danger ? 'bg-red-500' : 'bg-primary') + ' text-sm font-bold">' + confirmText + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.getElementById('confirm-btn').onclick = function() {
    closeModal();
    onConfirm();
  };
  if (window.lucide) window.lucide.createIcons();
}

function closeModal() {
  var c = document.getElementById('modal-container');
  c.classList.add('hidden');
  c.innerHTML = '';
}

// ─────────── BOTTOM SHEET ───────────
function openSheet(contentHTML, title) {
  title = title || '';
  var container = document.getElementById('sheet-container');
  container.classList.remove('hidden');
  container.innerHTML = 
    '<div class="modal-backdrop absolute inset-0" onclick="if(event.target===this) closeSheet()">' +
      '<div class="sheet absolute bottom-0 left-0 right-0 slide-up">' +
        '<div class="sticky top-0 z-10 bg-[#0a0a0a] pt-3 pb-3 px-5 border-b border-border">' +
          '<div class="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-3"></div>' +
          (title ? '<h3 class="text-lg font-bold">' + title + '</h3>' : '') +
        '</div>' +
        '<div class="px-5 pb-8 pt-4">' + contentHTML + '</div>' +
      '</div>' +
    '</div>';
  if (window.lucide) window.lucide.createIcons();
}

function closeSheet() {
  var c = document.getElementById('sheet-container');
  c.classList.add('hidden');
  c.innerHTML = '';
}

// ─────────── HELPERS ───────────
function timeAgo(timestamp) {
  if (!timestamp) return 'just now';
  var date;
  if (timestamp.toDate) date = timestamp.toDate();
  else if (timestamp.seconds) date = new Date(timestamp.seconds * 1000);
  else date = new Date(timestamp);
  var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  var minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  var days = Math.floor(hours / 24);
  if (days < 7) return days + 'd ago';
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

function copyText(text, label) {
  label = label || 'Copied!';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      toast(label, 'success');
    }).catch(function() {
      fallbackCopy(text, label);
    });
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast(label, 'success'); }
  catch (e) { toast('Copy failed', 'error'); }
  ta.remove();
}

function shareContent(title, text, url) {
  if (navigator.share) {
    navigator.share({ title: title, text: text, url: url }).catch(function() {});
  } else {
    copyText(url || text, 'Link copied!');
  }
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
}

function generateReferralCode(uid) {
  return 'PANDA' + uid.slice(0, 6).toUpperCase();
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  var truncated = text;
  while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
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
  var initials = getInitials(name);
  ctx.fillStyle = '#FF6B00';
  ctx.font = 'bold ' + r + 'px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, x, y);
  ctx.textBaseline = 'alphabetic';
}

function loadImage(src) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() { resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

// ─────────── IMAGE COMPRESSION ───────────
function compressImage(file, maxSize, quality) {
  maxSize = maxSize || 800;
  quality = quality || 0.7;
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var width = img.width;
        var height = img.height;
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
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

// ─────────── AD BANNER ───────────
function showAd() {
  if (State.profile && State.profile.isPro) return;
  var banner = document.getElementById('ad-banner');
  if (banner) banner.classList.remove('hidden');
}

function hideAd() {
  var banner = document.getElementById('ad-banner');
  if (banner) banner.classList.add('hidden');
}

function maybeShowInterstitial() {
  State.joinCount++;
  if (State.joinCount >= 3 && !State.interstitialShown && !(State.profile && State.profile.isPro)) {
    State.interstitialShown = true;
    var container = document.getElementById('modal-container');
    container.classList.remove('hidden');
    container.innerHTML = 
      '<div class="modal-backdrop absolute inset-0 flex items-center justify-center p-6">' +
        '<div class="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center slide-up">' +
          '<div class="text-xs text-gray-500 uppercase font-bold mb-2">Advertisement</div>' +
          '<div class="bg-gradient-to-br from-primary/20 to-gold/20 rounded-xl h-40 flex items-center justify-center mb-4">' +
            '<div class="text-center">' +
              '<div class="text-4xl mb-2">🎮</div>' +
              '<div class="text-sm font-bold">AdMob Placeholder</div>' +
              '<div class="text-xs text-gray-500">Interstitial Ad</div>' +
            '</div>' +
          '</div>' +
          '<button onclick="closeModal()" class="btn-press w-full py-3 rounded-xl bg-primary font-bold text-sm">Continue</button>' +
          '<button onclick="closeModal(); goPro();" class="text-xs text-gold mt-3">Remove ads with Pro →</button>' +
        '</div>' +
      '</div>';
  }
}

// ─────────── EMPTY STATE ───────────
function emptyState(icon, title, subtitle, ctaLabel, ctaFn) {
  var ctaHTML = (ctaLabel && ctaFn) ? 
    '<button id="empty-cta-' + Date.now() + '" class="empty-cta-btn btn-press mt-5 px-6 py-3.5 rounded-2xl bg-primary font-black text-sm glow-primary">' + esc(ctaLabel) + '</button>' 
    : '';
  if (ctaLabel && ctaFn) {
    setTimeout(function() {
      var btns = document.querySelectorAll('.empty-cta-btn');
      btns.forEach(function(b) {
        if (!b.dataset.bound) {
          b.dataset.bound = '1';
          b.onclick = ctaFn;
        }
      });
    }, 0);
  }
  return '<div class="flex flex-col items-center justify-center py-16 px-6 text-center fade-in">' +
    '<div class="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mb-4">' +
      '<i data-lucide="' + icon + '" class="w-8 h-8 text-gray-500"></i>' +
    '</div>' +
    '<div class="text-base font-bold mb-1">' + esc(title) + '</div>' +
    '<div class="text-xs text-gray-500 max-w-[240px]">' + esc(subtitle || '') + '</div>' +
    ctaHTML +
  '</div>';
}

// ─────────── EXPORTS ───────────
window.toast = toast;
window.confirmDialog = confirmDialog;
window.closeModal = closeModal;
window.closeSheet = closeSheet;
window.openSheet = openSheet;
window.copyText = copyText;
window.shareContent = shareContent;
window.getInitials = getInitials;
window.generateReferralCode = generateReferralCode;
window.truncateText = truncateText;
window.roundRect = roundRect;
window.drawInitials = drawInitials;
window.loadImage = loadImage;
window.compressImage = compressImage;
window.showAd = showAd;
window.hideAd = hideAd;
window.maybeShowInterstitial = maybeShowInterstitial;
window.emptyState = emptyState;
window.timeAgo = timeAgo;
window.esc = esc;

// ═══════════════════════════════════════════
// END CHUNK 2/24 — Utilities COMPLETE
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// CODMPanda app.js — Chunk 3/24
// Firebase Setup + Auth (GIS) + Profile
// ═══════════════════════════════════════════

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
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
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ─────────── INIT FIREBASE ───────────
var app = initializeApp(firebaseConfig);
var auth = getAuth(app);
var db = getFirestore(app);
var provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ─────────── GIS SIGN-IN ───────────
var gisInitialized = false;

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
  console.log('✅ GIS initialized');
}

async function handleSignIn() {
  try {
    toast('Opening Google...', 'info', 1500);
    if (!window.google || !window.google.accounts) {
      await new Promise(function(resolve, reject) {
        var attempts = 0;
        var check = setInterval(function() {
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
      if (notification.isNotDisplayed && notification.isNotDisplayed()) {
        fallbackRenderGISButton();
      }
      if (notification.isSkippedMoment && notification.isSkippedMoment()) {
        fallbackRenderGISButton();
      }
    });
  } catch (err) {
    console.error('GIS error:', err);
    toast('Sign-in failed: ' + err.message, 'error', 5000);
  }
}

function fallbackRenderGISButton() {
  openSheet(
    '<div class="text-center space-y-4">' +
      '<img src="/icon-512.png" class="w-20 h-20 mx-auto rounded-3xl" />' +
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
    var credential = GoogleAuthProvider.credential(response.credential);
    var result = await signInWithCredential(auth, credential);
    console.log('✅ Firebase sign-in success:', result.user.email);
    toast('Signed in!', 'success');
  } catch (err) {
    console.error('Firebase credential error:', err.code, err.message);
    toast('Sign-in failed: ' + err.message, 'error', 5000);
  }
}

async function checkRedirect() {
  try {
    await getRedirectResult(auth);
  } catch (e) {
    console.error('Redirect error:', e);
  }
}

async function handleSignOut() {
  confirmDialog('Sign Out', 'Are you sure you want to sign out?', async function() {
    try {
      if (State.lobbiesUnsub) State.lobbiesUnsub();
      if (State.vaultsUnsub) State.vaultsUnsub();
      if (State.camosUnsub) State.camosUnsub();
      if (State.clansUnsub) State.clansUnsub();
      if (State.scrimsUnsub) State.scrimsUnsub();
      if (State.clipsUnsub) State.clipsUnsub();
      if (State.leaksUnsub) State.leaksUnsub();
      if (typeof stopHomeLiveUpdates === 'function') stopHomeLiveUpdates();
      await signOut(auth);
      location.reload();
    } catch (e) {
      toast('Sign out failed', 'error');
    }
  }, 'Sign Out', true);
}

// ─────────── USER PROFILE ───────────
async function ensureUserProfile(firebaseUser) {
  var userRef = doc(db, 'users', firebaseUser.uid);
  var snap = await getDoc(userRef);
  if (!snap.exists()) {
    var defaultProfile = {
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
      approvedCount: 0,
      badges: [],
      friends: [],
      friendRequests: [],
      friendRequestsSent: [],
      fcmTokens: [],
      notificationsEnabled: false,
      tournamentWins: 0,
      verified: false,
      themeStyle: 'dark',
      avatarFrame: 'none',
      lastActiveDate: '',
      activeStreak: 0,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      onboardingDone: false,
      tourCompleted: false
    };
    await setDoc(userRef, defaultProfile);
    return Object.assign({}, defaultProfile, { isNew: true });
  }
  return Object.assign({}, snap.data(), { isNew: false });
}

async function updateLastSeen() {
  if (!State.user) return;
  try {
    await updateDoc(doc(db, 'users', State.user.uid), { lastSeen: serverTimestamp() });
  } catch (e) {}
}

// ─────────── AUTH STATE HANDLER ───────────
onAuthStateChanged(auth, async function(user) {
  var splash = document.getElementById('splash');
  if (splash) splash.classList.add('hidden');

  if (user) {
    State.user = user;
    try {
      var profile = await ensureUserProfile(user);
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

// ─────────── SCREENS ───────────
function showAuthGate() {
  document.getElementById('auth-gate').classList.remove('hidden');
  document.getElementById('auth-gate').classList.add('flex');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
  if (window.lucide) window.lucide.createIcons();
}

// ─────────── EXPORTS ───────────
window.auth = auth;
window.db = db;
window.provider = provider;
window.handleSignIn = handleSignIn;
window.handleSignOut = handleSignOut;
window.showAuthGate = showAuthGate;
window.updateLastSeen = updateLastSeen;
window.checkRedirect = checkRedirect;

// ═══════════════════════════════════════════
// END CHUNK 3/24 — Firebase + Auth COMPLETE
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
// CODMPanda app.js — Chunk 4/24
// Onboarding + Tour + Hero Welcome Screen
// ═══════════════════════════════════════════

// ─────────── HERO WELCOME SCREEN ───────────
function showHeroWelcome() {
  if (localStorage.getItem('codmpanda_hero_welcome_shown') === 'true') return false;

  var overlay = document.createElement('div');
  overlay.id = 'hero-welcome-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9500;background:#050505;display:flex;flex-direction:column;overflow:hidden;animation:heroFadeIn 0.6s ease-out;';

  overlay.innerHTML = 
    '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;overflow:hidden;z-index:1;">' +
      '<img src="/hero-panda.jpg" style="min-width:100%;min-height:100%;width:auto;height:auto;object-fit:contain;animation:pandaBreathe 10s ease-in-out infinite;" />' +
    '</div>' +
    '<div style="position:absolute;left:0;right:0;bottom:0;height:55%;background:linear-gradient(180deg,transparent 0%,rgba(5,5,5,0.7) 40%,rgba(5,5,5,0.98) 100%);z-index:2;pointer-events:none;"></div>' +
    '<div style="position:absolute;left:0;right:0;top:0;height:20%;background:linear-gradient(180deg,rgba(5,5,5,0.6) 0%,transparent 100%);z-index:2;pointer-events:none;"></div>' +
    '<div id="hero-fireflies" style="position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden;"></div>' +
    '<div style="position:relative;z-index:10;margin-top:auto;padding:24px 24px 90px 24px;text-align:center;max-width:500px;margin-left:auto;margin-right:auto;width:100%;">' +
      '<div style="font-size:32px;font-weight:900;margin-bottom:10px;letter-spacing:-0.5px;line-height:1.1;font-family:Inter,sans-serif;">' +
        '<span style="color:#FF6B00;text-shadow:0 0 30px rgba(255,107,0,0.7),0 0 60px rgba(255,107,0,0.4);">Welcome to</span><br/>' +
        '<span style="color:#fff;text-shadow:0 2px 20px rgba(0,0,0,0.9);">CODMPanda</span>' +
      '</div>' +
      '<div style="font-size:13px;color:#aaa;margin-bottom:28px;max-width:280px;margin-left:auto;margin-right:auto;line-height:1.5;font-family:Inter,sans-serif;">Your ultimate CODM companion. Time to dominate.</div>' +
      '<button id="hero-get-started" class="btn-press" style="padding:16px 44px;border-radius:16px;background:linear-gradient(135deg,#FF6B00 0%,#CC5500 100%);border:none;color:#fff;font-size:15px;font-weight:900;font-family:Inter,sans-serif;cursor:pointer;box-shadow:0 8px 32px rgba(255,107,0,0.55),0 0 24px rgba(255,107,0,0.3);letter-spacing:0.5px;">Get Started →</button>' +
    '</div>';

  document.body.appendChild(overlay);

  if (!document.getElementById('hero-animations')) {
    var style = document.createElement('style');
    style.id = 'hero-animations';
    style.textContent = 
      '@keyframes heroFadeIn{from{opacity:0}to{opacity:1}}' +
      '@keyframes pandaBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}' +
      '@keyframes firefly1{0%{transform:translate(0,0);opacity:0}15%{opacity:1}50%{transform:translate(30px,-50vh);opacity:1}85%{opacity:1}100%{transform:translate(60px,-100vh);opacity:0}}' +
      '@keyframes firefly2{0%{transform:translate(0,0);opacity:0}15%{opacity:1}50%{transform:translate(-40px,-40vh);opacity:1}85%{opacity:1}100%{transform:translate(-20px,-90vh);opacity:0}}' +
      '@keyframes firefly3{0%{transform:translate(0,0);opacity:0}20%{opacity:1}50%{transform:translate(20px,-55vh);opacity:1}80%{opacity:1}100%{transform:translate(-30px,-100vh);opacity:0}}' +
      '@keyframes fireflyBlink{0%,100%{opacity:0.3}50%{opacity:1}}';
    document.head.appendChild(style);
  }

  var firefliesContainer = document.getElementById('hero-fireflies');
  var fireflyColors = ['#FFD700', '#FF6B00', '#C6E377'];
  var fireflyAnims = ['firefly1', 'firefly2', 'firefly3'];
  for (var i = 0; i < 40; i++) {
    var firefly = document.createElement('div');
    var size = 1.5 + Math.random() * 2;
    var color = fireflyColors[Math.floor(Math.random() * fireflyColors.length)];
    var anim = fireflyAnims[Math.floor(Math.random() * fireflyAnims.length)];
    var duration = 3 + Math.random() * 2;
    var delay = Math.random() * 3;
    var spawnBottom = Math.random() > 0.3;
    var leftPos, bottomPos;
    if (spawnBottom) {
      leftPos = Math.random() * 100;
      bottomPos = -10 - Math.random() * 30;
    } else {
      var fromLeft = Math.random() > 0.5;
      leftPos = fromLeft ? -5 : 105;
      bottomPos = Math.random() * 40;
    }
    firefly.style.cssText = 
      'position:absolute;width:' + size + 'px;height:' + size + 'px;border-radius:50%;' +
      'background:' + color + ';' +
      'box-shadow:0 0 ' + (size * 2) + 'px ' + color + ',0 0 ' + (size * 4) + 'px ' + color + ',0 0 ' + (size * 6) + 'px ' + color + '40;' +
      'left:' + leftPos + '%;bottom:' + bottomPos + 'px;' +
      'animation:' + anim + ' ' + duration + 's ease-out infinite,fireflyBlink ' + (1.5 + Math.random() * 2) + 's ease-in-out infinite;' +
      'animation-delay:' + delay + 's,' + (Math.random() * 2) + 's;' +
      'opacity:0;';
    firefliesContainer.appendChild(firefly);
  }

  document.getElementById('hero-get-started').onclick = function() {
    localStorage.setItem('codmpanda_hero_welcome_shown', 'true');
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s ease-out';
    setTimeout(function() {
      overlay.remove();
      if (!State.profile || !State.profile.onboardingDone) {
        _origShowOnboarding();
      } else {
        showMainApp();
      }
    }, 400);
  };

  return true;
}

// ─────────── ONBOARDING ───────────
function showOnboarding() {
  document.getElementById('auth-gate').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('onboarding').classList.add('flex');
  onboardingStep = 0;
  renderOnboarding();
}

function _origShowOnboarding() {
  document.getElementById('auth-gate').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('onboarding').classList.add('flex');
  onboardingStep = 0;
  renderOnboarding();
}

function renderOnboarding() {
  var container = document.getElementById('onboarding-content');

  if (onboardingStep < ONBOARDING_SLIDES.length) {
    var slide = ONBOARDING_SLIDES[onboardingStep];
    container.innerHTML = 
      '<div class="flex-1 flex flex-col justify-center px-6 fade-in">' +
        '<div class="relative mb-12">' +
          '<div class="absolute inset-0 bg-gradient-to-br ' + slide.color + ' rounded-full blur-3xl"></div>' +
          '<div class="relative w-32 h-32 mx-auto rounded-full bg-card border border-border flex items-center justify-center">' +
            '<span class="text-6xl">' + slide.emoji + '</span>' +
          '</div>' +
        '</div>' +
        '<h2 class="text-3xl font-black text-center mb-4">' + slide.title + '</h2>' +
        '<p class="text-gray-400 text-center text-sm leading-relaxed max-w-xs mx-auto">' + slide.desc + '</p>' +
      '</div>' +
      '<div class="px-6 pb-10">' +
        '<div class="flex justify-center gap-2 mb-6">' +
          ONBOARDING_SLIDES.map(function(_, i) {
            return '<div class="h-1.5 rounded-full transition-all ' + (i === onboardingStep ? 'w-8 bg-primary' : 'w-1.5 bg-gray-700') + '"></div>';
          }).join('') +
        '</div>' +
        '<button id="onb-next" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary">' +
          (onboardingStep === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next') +
        '</button>' +
        (onboardingStep > 0 ? 
          '<button id="onb-back" class="w-full py-3 text-gray-500 text-sm mt-2">Back</button>' : 
          '<button id="onb-skip" class="w-full py-3 text-gray-500 text-sm mt-2">Skip intro</button>') +
      '</div>';
    document.getElementById('onb-next').onclick = function() { onboardingStep++; renderOnboarding(); };
    var backBtn = document.getElementById('onb-back');
    if (backBtn) backBtn.onclick = function() { onboardingStep--; renderOnboarding(); };
    var skipBtn = document.getElementById('onb-skip');
    if (skipBtn) skipBtn.onclick = function() { onboardingStep = ONBOARDING_SLIDES.length; renderOnboarding(); };
  } else {
    container.innerHTML = 
      '<div class="flex-1 flex flex-col justify-center px-6 fade-in">' +
        '<div class="text-center mb-6">' +
          '<img src="/icon-512.png" class="w-20 h-20 mx-auto rounded-3xl" style="box-shadow:0 0 30px rgba(255,107,0,0.4);" />' +
        '</div>' +
        '<h2 class="text-2xl font-black text-center mb-2">Almost there!</h2>' +
        '<p class="text-gray-400 text-center text-sm mb-8">Tell us about your playstyle</p>' +
        '<label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Your Rank</label>' +
        '<select id="onb-rank" class="mb-5">' +
          RANKS.map(function(r) { return '<option value="' + r + '"' + (onboardingData.rank === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
        '</select>' +
        '<label class="block mb-2 text-xs font-bold text-gray-400 uppercase">Your Region</label>' +
        '<select id="onb-region" class="mb-5">' +
          REGIONS.map(function(r) { return '<option value="' + r + '"' + (onboardingData.region === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') +
        '</select>' +
        '<label class="block mb-2 text-xs font-bold text-gray-400 uppercase">In-Game Name (IGN)</label>' +
        '<input id="onb-ign" type="text" placeholder="e.g. ShadowPanda" maxlength="24" value="' + esc(State.user && State.user.displayName || '') + '" class="mb-8" />' +
      '</div>' +
      '<div class="px-6 pb-10">' +
        '<button id="onb-finish" class="btn-press w-full py-4 rounded-2xl bg-primary font-bold text-base glow-primary">Start Dominating</button>' +
      '</div>';
    document.getElementById('onb-finish').onclick = async function() {
      var ign = document.getElementById('onb-ign').value.trim();
      var rank = document.getElementById('onb-rank').value;
      var region = document.getElementById('onb-region').value;
      if (!ign || ign.length < 2) { toast('IGN must be at least 2 characters', 'error'); return; }
      try {
        await updateDoc(doc(db, 'users', State.user.uid), { ign: ign, rank: rank, region: region, onboardingDone: true });
        State.profile = Object.assign({}, State.profile, { ign: ign, rank: rank, region: region, onboardingDone: true });
        toast('Welcome to CODMPanda!', 'success');
        showMainApp();
      } catch (e) {
        console.error(e);
        toast('Failed to save profile', 'error');
      }
    };
  }
  if (window.lucide) window.lucide.createIcons();
}

// ─────────── APP TOUR ───────────
var TOUR_STEPS = [
  { emoji: '🐼', title: 'Welcome to CODMPanda', body: 'The Ultimate CODM Companion. Let me show you around in 30 seconds.', tab: null, highlight: null },
  { emoji: '🎮', title: 'Find Your Squad', body: 'Post a lobby or join one. Filter by rank, mode, region.', tab: 'play', highlight: 'play' },
  { emoji: '🔧', title: 'Build & Share Gunsmiths', body: 'Create weapons with our visual builder. 90+ guns, live stats.', tab: 'lab', highlight: 'lab' },
  { emoji: '🎨', title: 'Track Every Camo', body: 'Log your grind from Sand to Damascus. Export progress as image.', tab: 'lab', highlight: 'lab' },
  { emoji: '🏆', title: 'Compete & Connect', body: 'Clans, tournaments, scrims, clips. Team up worldwide.', tab: 'squad', highlight: 'squad' },
  { emoji: '📊', title: 'Master the Meta', body: 'Tier lists, leaks, CP calculator, map callouts.', tab: 'intel', highlight: 'intel' },
  { emoji: '👑', title: 'Your Profile', body: 'Track stats, earn badges, unlock Pro features.', tab: 'you', highlight: 'you' },
  { emoji: '🚀', title: 'You are all set!', body: 'Jump in and start dominating.', tab: 'home', highlight: null }
];

var tourStep = 0;
var tourActive = false;

function startOnboardingTour() {
  if (tourActive) return;
  tourActive = true;
  tourStep = 0;

  if (!document.getElementById('tour-styles')) {
    var style = document.createElement('style');
    style.id = 'tour-styles';
    style.textContent = 
      '.tour-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10000}' +
      '.tour-card{position:fixed;left:16px;right:16px;max-width:420px;margin:0 auto;background:linear-gradient(180deg,#111 0%,#0a0a0a 100%);border:1px solid #FF6B00;border-radius:24px;padding:24px;z-index:10002;box-shadow:0 20px 60px rgba(0,0,0,0.9),0 0 30px rgba(255,107,0,0.3);animation:tourSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)}' +
      '@keyframes tourSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);
  }

  renderTourStep();
}

function renderTourStep() {
  var overlay = document.getElementById('tour-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tour-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;';
    document.body.appendChild(overlay);
  }

  var step = TOUR_STEPS[tourStep];
  if (!step) { endOnboardingTour(); return; }

  if (step.tab && step.tab !== State.currentTab) switchTab(step.tab);

  var isFirst = tourStep === 0;
  var isLast = tourStep === TOUR_STEPS.length - 1;

  overlay.innerHTML = 
    '<div class="tour-backdrop"></div>' +
    '<div class="tour-card" style="' + (tourStep > 4 ? 'bottom:140px;' : 'bottom:140px;') + '">' +
      '<div class="flex items-center justify-between mb-4">' +
        '<div class="flex gap-1.5">' +
          TOUR_STEPS.map(function(_, i) {
            return '<div class="h-1.5 rounded-full transition-all ' + (i === tourStep ? 'w-6 bg-primary' : i < tourStep ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-gray-700') + '"></div>';
          }).join('') +
        '</div>' +
        '<button id="tour-skip" class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Skip</button>' +
      '</div>' +
      '<div class="text-5xl mb-3 text-center">' + step.emoji + '</div>' +
      '<div class="text-center mb-6">' +
        '<div class="text-lg font-black mb-2">' + step.title + '</div>' +
        '<div class="text-xs text-gray-400 leading-relaxed max-w-[300px] mx-auto">' + step.body + '</div>' +
      '</div>' +
      '<div class="flex gap-2">' +
        (!isFirst ? '<button id="tour-prev" class="btn-press flex-1 py-3 rounded-xl bg-cardAlt border border-border font-bold text-xs text-gray-300">← Back</button>' : '') +
        '<button id="tour-next" class="btn-press flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primaryDark font-black text-xs text-white">' + (isLast ? '🚀 Start Dominating' : 'Next →') + '</button>' +
      '</div>' +
    '</div>';

  if (window.lucide) window.lucide.createIcons();

  document.getElementById('tour-next').onclick = function() {
    if (isLast) endOnboardingTour();
    else { tourStep++; renderTourStep(); }
  };
  var prevBtn = document.getElementById('tour-prev');
  if (prevBtn) prevBtn.onclick = function() { if (tourStep > 0) { tourStep--; renderTourStep(); } };
  document.getElementById('tour-skip').onclick = function() {
    confirmDialog('Skip Tour?', 'You can restart from Settings.', endOnboardingTour, 'Skip', false);
  };
}

async function endOnboardingTour() {
  tourActive = false;
  var overlay = document.getElementById('tour-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s';
    setTimeout(function() { overlay.remove(); }, 300);
  }
  try {
    await updateDoc(doc(db, 'users', State.user.uid), { tourCompleted: true });
    State.profile.tourCompleted = true;
  } catch (e) {}
  toast('Welcome to CODMPanda!', 'success', 3000);
}

// ─────────── EXPORTS ───────────
window.showHeroWelcome = showHeroWelcome;
window.showOnboarding = showOnboarding;
window.renderOnboarding = renderOnboarding;
window.startOnboardingTour = startOnboardingTour;
window.endOnboardingTour = endOnboardingTour;

// ═══════════════════════════════════════════
// END CHUNK 4/24 — Onboarding + Tour COMPLETE
// ═══════════════════════════════════════════
