import { getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/*
 * CODMPanda YOU-tab navigation cleanup.
 * Keeps the existing activity summary card at the top, followed by Themes/Avatar
 * Frame, then Profile and Settings. Profile navigation stays inside #content:
 * no full-screen overlay, body scroll lock, or new profile interception.
 */
(() => {
  "use strict";

  const APP_ID = "cp-you-navigation-v1";
  if (window[APP_ID]) return;
  window[APP_ID] = true;

  let layoutTimer = 0;
  let activeProfileTab = "posts";
  let loadedPostsForUid = "";
  let postsCache = [];

  const esc = value => typeof window.esc === "function"
    ? window.esc(String(value ?? ""))
    : String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const state = () => window.State || window.__state || {};
  const contentEl = () => document.getElementById("content");
  const currentUser = () => state().user || null;
  const profile = () => state().profile || {};
  const isYouTab = () => state().currentTab === "you";

  // Do not show an upgrade pitch to users whose current account data marks
  // them as an active Pro/Premium member.
  function userHasProAccess() {
    const s = state();
    const u = s.user || {};
    const p = s.profile || {};
    const flags = [
      s.isPro, s.proActive, s.isPremium, s.hasPro,
      u.isPro, u.proActive, u.isPremium, u.hasPro,
      p.isPro, p.proActive, p.isPremium, p.hasPro
    ];
    if (flags.some(value => value === true)) return true;

    const plans = [
      s.plan, s.subscription?.plan, s.subscriptionPlan,
      u.plan, u.subscription?.plan, u.subscriptionPlan,
      p.plan, p.subscription?.plan, p.subscriptionPlan
    ];
    if (plans.some(value => typeof value === "string" && /^(pro|premium|paid)$/i.test(value.trim()))) return true;

    const expiryValues = [
      s.proUntil, s.proExpiresAt, s.premiumUntil, s.premiumExpiresAt,
      u.proUntil, u.proExpiresAt, u.premiumUntil, u.premiumExpiresAt,
      p.proUntil, p.proExpiresAt, p.premiumUntil, p.premiumExpiresAt
    ];
    return expiryValues.some(value => {
      const expiry = dateMillis(value);
      return expiry > Date.now();
    });
  }

  function elementWithHeader(root, title) {
    const header = [...root.querySelectorAll(".uppercase")]
      .find(el => el.textContent.trim().toLowerCase() === title.toLowerCase());
    return header ? header.closest(".bg-card") : null;
  }

  function dateMillis(value) {
    try {
      if (value && typeof value.toDate === "function") return value.toDate().getTime();
      if (value && typeof value.seconds === "number") return value.seconds * 1000;
      const parsed = new Date(value || 0).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (_) { return 0; }
  }

  function formatDate(value) {
    const millis = dateMillis(value);
    if (!millis) return "Recently";
    try {
      if (typeof window.timeAgo === "function") return window.timeAgo(value);
      return new Date(millis).toLocaleDateString();
    } catch (_) {
      return new Date(millis).toLocaleDateString();
    }
  }

  function profileHeaderHTML() {
    const p = profile();
    const name = p.ign || p.displayName || currentUser()?.displayName || "CODMPanda Player";
    const avatar = p.avatar || currentUser()?.photoURL || "";
    const rank = p.rank || "Rookie";
    const region = p.region || "Global";
    const bio = p.bio || "";
    const favourite = p.favGun || "";
    const userId = p.uid || p.userId || currentUser()?.uid || "Loading…";
    return `
      <section class="bg-card border border-border rounded-2xl p-4 mb-3">
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-cardAlt border border-border flex items-center justify-center text-xl font-black text-primary">
            ${avatar ? `<img alt="" src="${esc(avatar)}" class="w-full h-full object-cover">` : esc((name || "CP").slice(0, 2).toUpperCase())}
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-black text-base break-words">${esc(name)}</div>
            <div class="text-xs text-gray-500 mt-1">${esc(rank)} · ${esc(region)}</div>
            <div class="text-[10px] text-gray-600 mt-1">Your CODMPanda profile</div>
            <div class="text-[10px] text-gray-500 mt-1 break-all">User ID: ${esc(userId)}</div>
          </div>
        </div>
        ${bio ? `<p class="text-sm text-gray-300 mt-3 whitespace-pre-wrap break-words">${esc(bio)}</p>` : ""}
        ${favourite ? `<p class="text-xs text-gray-500 mt-2">🎯 Favourite: <span class="text-gray-300 font-semibold">${esc(favourite)}</span></p>` : ""}
        <button type="button" id="cp-profile-edit-fallback" class="btn-press w-full mt-3 py-2.5 rounded-xl bg-cardAlt border border-border text-xs font-bold">Edit Profile</button>
      </section>
    `;
  }

  function makeNavCard(icon, title, subtitle, id) {
    const button = document.createElement("button");
    button.type = "button";
    button.id = id;
    button.className = "btn-press w-full flex items-center gap-3 p-4 mb-2 text-left rounded-2xl bg-card border border-border";
    button.innerHTML = `
      <span class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">${icon}</span>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-bold">${title}</span>
        <span class="block text-[10px] text-gray-500 mt-0.5">${subtitle}</span>
      </span>
      <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 flex-shrink-0"></i>
    `;
    return button;
  }

  function makePageHeader(title, subtitle, onBack) {
    const header = document.createElement("div");
    header.className = "flex items-center gap-3 pt-3 pb-4";
    header.innerHTML = `
      <button type="button" class="cp-you-back btn-press w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center" aria-label="Back">
        <i data-lucide="arrow-left" class="w-5 h-5"></i>
      </button>
      <div class="min-w-0">
        <h1 class="text-xl font-black">${title}</h1>
        <p class="text-[11px] text-gray-500 mt-0.5">${subtitle}</p>
      </div>
    `;
    header.querySelector(".cp-you-back").addEventListener("click", onBack);
    return header;
  }

  function setPage(which) {
    const home = document.getElementById("cp-you-home");
    const profilePage = document.getElementById("cp-you-profile");
    const settingsPage = document.getElementById("cp-you-settings");
    if (!home || !profilePage || !settingsPage) return;
    home.classList.toggle("hidden", which !== "home");
    profilePage.classList.toggle("hidden", which !== "profile");
    settingsPage.classList.toggle("hidden", which !== "settings");
    const profileButton = document.getElementById("cp-open-profile");
    const settingsButton = document.getElementById("cp-open-settings");
    if (profileButton && settingsButton) {
      profileButton.className = "flex-1 text-sm font-bold rounded-lg px-4 py-2.5 transition " +
        (which !== "settings" ? "bg-primary text-white" : "text-gray-400");
      settingsButton.className = "flex-1 text-sm font-bold rounded-lg px-4 py-2.5 transition " +
        (which === "settings" ? "bg-primary text-white" : "text-gray-400");
    }
    if (which === "home") {
      activeProfileTab = "posts";
      const activity = document.getElementById("cp-you-activity-card");
      if (activity && activity.firstElementChild) activity.firstElementChild.scrollTop = 0;
    }
    const content = contentEl();
    if (content) content.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
    if (which === "profile") setProfileTab(activeProfileTab || "posts");
    if (window.lucide) window.lucide.createIcons();
  }

  function setProfileTab(tab) {
    activeProfileTab = tab;
    document.querySelectorAll("[data-cp-profile-tab]").forEach(button => {
      const active = button.dataset.cpProfileTab === tab;
      button.classList.toggle("bg-primary", active);
      button.classList.toggle("text-white", active);
      button.classList.toggle("bg-cardAlt", !active);
      button.classList.toggle("text-gray-400", !active);
      button.classList.toggle("border-primary", active);
    });
    document.querySelectorAll("[data-cp-profile-pane]").forEach(pane => {
      pane.classList.toggle("hidden", pane.dataset.cpProfilePane !== tab);
    });
    if (tab === "posts") loadMyPosts();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderPost(post) {
    const name = post.ign || profile().ign || currentUser()?.displayName || "You";
    const text = post.text || post.body || post.caption || "";
    const imageUrl = post.imageUrl || post.image || post.mediaUrl || "";
    const likes = Number(post.likes || post.likeCount || 0);
    const comments = Number(post.commentCount || post.commentsCount || 0);
    const image = imageUrl ? `<img src="${esc(imageUrl)}" alt="Post image" loading="lazy" class="block w-full max-h-[520px] object-contain rounded-xl mt-3 bg-black/20">` : "";
    return `
      <article class="bg-card border border-border rounded-2xl p-4 mb-3">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-9 h-9 rounded-full bg-primary/10 border border-border overflow-hidden flex items-center justify-center text-xs font-black">
            ${profile().avatar ? `<img src="${esc(profile().avatar)}" alt="" class="w-full h-full object-cover">` : esc((name || "CP").slice(0, 2).toUpperCase())}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-bold truncate">${esc(name)}</div>
            <div class="text-[10px] text-gray-500">${esc(formatDate(post.createdAt || post.updatedAt))}</div>
          </div>
          <span class="text-[9px] text-gray-600">POST</span>
        </div>
        ${text ? `<p class="text-sm text-gray-200 whitespace-pre-wrap break-words">${esc(text)}</p>` : ""}
        ${image}
        <div class="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[11px] text-gray-500">
          <span>♡ ${likes} likes</span><span>▢ ${comments} comments</span>
        </div>
      </article>
    `;
  }

  async function loadMyPosts(force = false) {
    const pane = document.getElementById("cp-profile-pane-posts");
    const user = currentUser();
    if (!pane || !user) return;
    if (!force && loadedPostsForUid === user.uid) {
      showCachedPosts(pane);
      return;
    }
    pane.innerHTML = '<div class="py-10 text-center"><div class="spinner mx-auto"></div><p class="text-xs text-gray-500 mt-3">Loading your posts…</p></div>';
    try {
      const db = getFirestore(getApp());
      const snapshot = await getDocs(query(collection(db, "posts"), where("uid", "==", user.uid), limit(100)));
      postsCache = [];
      snapshot.forEach(documentSnapshot => postsCache.push({ id: documentSnapshot.id, ...documentSnapshot.data() }));
      postsCache.sort((a, b) => dateMillis(b.createdAt || b.updatedAt) - dateMillis(a.createdAt || a.updatedAt));
      loadedPostsForUid = user.uid;
      showCachedPosts(pane);
    } catch (error) {
      console.warn("[CODMPanda] Could not load profile posts:", error);
      pane.innerHTML = '<div class="bg-card border border-border rounded-2xl p-5 text-center"><div class="text-2xl mb-2">⚠️</div><div class="text-sm font-bold">Posts could not be loaded</div><p class="text-xs text-gray-500 mt-2">Check your connection and try again.</p><button type="button" id="cp-retry-profile-posts" class="btn-press mt-3 px-4 py-2 rounded-xl bg-cardAlt border border-border text-xs font-bold">Try again</button></div>';
      pane.querySelector("#cp-retry-profile-posts")?.addEventListener("click", () => loadMyPosts(true));
    }
  }

  function showCachedPosts(pane) {
    if (!postsCache.length) {
      pane.innerHTML = '<div class="bg-card border border-border rounded-2xl p-5 text-center"><div class="text-3xl mb-2">✍️</div><div class="text-sm font-bold">No posts yet</div><p class="text-xs text-gray-500 mt-2">Posts you publish on Home will appear here.</p><button type="button" id="cp-go-home-post" class="btn-press mt-3 px-4 py-2 rounded-xl bg-primary text-xs font-bold">Go to Home</button></div>';
      pane.querySelector("#cp-go-home-post")?.addEventListener("click", () => {
        const switchTab = window.switchTab;
        if (typeof switchTab === "function") switchTab("home");
      });
      return;
    }
    pane.innerHTML = postsCache.map(renderPost).join("");
  }

  function createFallbackAchievements() {
    const container = document.createElement("div");
    container.className = "space-y-3";
    container.innerHTML = `
      <section class="bg-card border border-border rounded-2xl p-4">
        <div class="flex items-center justify-between mb-3"><div><h2 class="font-black">Community Achievements</h2><p class="text-[10px] text-gray-500">Milestones from your activity</p></div><span class="text-2xl">🏅</span></div>
        <p class="text-xs text-gray-500">Achievements appear here as you contribute to CODMPanda.</p>
      </section>
    `;
    return container;
  }

  function buildLayout() {
    const content = contentEl();
    if (!content || !isYouTab() || document.getElementById("cp-you-app")) return;
    const user = currentUser();
    if (!user) return;

    const activity = content.querySelector("#activity-stats-card");
    const themeFrames = content.querySelector("#theme-frame-buttons");
    const editButton = content.querySelector("#edit-profile-btn");
    const profileCard = editButton?.closest(".bg-card") || null;
    const statsGrid = [...content.querySelectorAll(".grid")].find(node =>
      node.querySelector("#stat-vaults") || node.querySelector("#stat-camos") || node.querySelector("#stat-clan")
    ) || null;

    const achievements = content.querySelector("#cp-v4-achievements");
    const tournamentBadges = content.querySelector("#tournament-badge-card");
    const contributor = content.querySelector("#contributor-card-injected");
    const notificationCard = content.querySelector("#notif-toggle")?.closest(".bg-card") || null;
    const proCard = content.querySelector("#unlock-pro-btn")?.closest(".bg-gradient-to-br") || null;
    if (proCard && userHasProAccess()) proCard.remove();

    // The Settings page already has its own page title. Keep the legacy
    // Settings options, but remove the inner legacy "Settings" card heading.
    const settingsRoot = elementWithHeader(content, "Settings");
    const settingSections = ["Support", "Admin Panel", "Danger Zone"]
      .map(title => elementWithHeader(content, title))
      .filter((node, index, list) => node && list.indexOf(node) === index);

    const legacyProfileExtras = [statsGrid, achievements, tournamentBadges, contributor]
      .filter((node, index, list) => node && list.indexOf(node) === index);
    // Pro is a home-screen promotion, not a Settings option.
    const settingsNodes = [...settingSections, notificationCard]
      .filter((node, index, list) => node && list.indexOf(node) === index);

    // Collect additional real settings cards from the legacy YOU markup before
    // it is replaced, but never carry its old Profile/Settings navigation wrapper.
    const excludedRoots = [profileCard, activity, themeFrames, statsGrid, achievements, tournamentBadges]
      .filter(Boolean);
    const knownSettingsRoots = [...settingsNodes, settingsRoot, contributor, proCard].filter(Boolean);
    const extraSettingsCandidates = [...content.querySelectorAll(".bg-card, .bg-gradient-to-br")]
      .filter(card => {
        if (excludedRoots.some(root => root === card || root.contains(card) || card.contains(root))) return false;
        // Never classify the Upgrade to Pro promotion (or its wrapper) as a setting.
        if (proCard && (card === proCard || card.contains(proCard) || proCard.contains(card))) return false;
        if (settingsRoot && (card === settingsRoot || card.contains(settingsRoot) || settingsRoot.contains(card))) return false;
        if (knownSettingsRoots.some(root => root === card || root.contains(card) || card.contains(root))) return false;
        if (card.querySelector("#cp-open-profile, #cp-open-settings, [data-cp-profile-tab], #cp-you-home-menu")) return false;
        const text = (card.innerText || card.textContent || "").toLowerCase();
        const hasAction = !!card.querySelector("button, a, input, select, [role='button']");
        return hasAction && /account|setting|support|report|bug|notification|sign out|signout|log out|logout|privacy|terms|contributor|admin|delete account|feedback|help|upgrade|pro/.test(text);
      });
    // Keep only the outermost matching settings cards. This preserves complete
    // settings groups and their options instead of filtering away the parent
    // because one of its child cards also contains a matching word.
    const extraSettingsCards = extraSettingsCandidates.filter(card =>
      !extraSettingsCandidates.some(other => other !== card && other.contains(card))
    );

    const app = document.createElement("div");
    app.id = "cp-you-app";
    app.className = "px-4 pt-3 pb-24";

    const home = document.createElement("section");
    home.id = "cp-you-home";

    const profileCardSlot = document.createElement("div");
    profileCardSlot.id = "cp-you-profile-card";
    profileCardSlot.className = "mb-3";

    const themeSlot = document.createElement("div");
    themeSlot.id = "cp-you-theme-frame";
    themeSlot.className = "mb-4";

    const menu = document.createElement("div");
    menu.id = "cp-you-home-menu";
    menu.className = "flex items-center gap-1 p-1 mb-3 rounded-xl bg-cardAlt border border-border";
    const profileButton = document.createElement("button");
    profileButton.type = "button";
    profileButton.id = "cp-open-profile";
    profileButton.className = "flex-1 text-sm font-bold rounded-lg px-4 py-2.5 transition bg-primary text-white";
    profileButton.textContent = "Profile";
    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.id = "cp-open-settings";
    settingsButton.className = "flex-1 text-sm font-bold rounded-lg px-4 py-2.5 transition text-gray-400";
    settingsButton.textContent = "Settings";
    profileButton.addEventListener("click", () => setPage("profile"));
    settingsButton.addEventListener("click", () => setPage("settings"));
    menu.append(profileButton, settingsButton);
    home.append(profileCardSlot, themeSlot, menu);
    // Keep the Upgrade to Pro promotion immediately below the Profile/Settings pills.
    const proSlot = document.createElement("div");
    proSlot.id = "cp-you-pro-promotion";
    proSlot.className = "mt-3 mb-3";
    if (proCard) proSlot.appendChild(proCard);
    if (proCard) home.appendChild(proSlot);

    const profilePage = document.createElement("section");
    profilePage.id = "cp-you-profile";
    profilePage.className = "hidden";
    profilePage.appendChild(makePageHeader("Profile", "Your community page", () => setPage("home")));

    // These are profile sub-tabs, shown only after opening the Profile screen.
    const profileTabs = document.createElement("div");
    profileTabs.id = "cp-you-profile-tabs";
    profileTabs.className = "flex items-center gap-2 py-3 border-b border-border mb-3";
    profileTabs.innerHTML = `
      <button type="button" data-cp-profile-tab="posts" class="flex-1 py-2 rounded-xl border text-xs font-bold">Posts</button>
      <button type="button" data-cp-profile-tab="achievements" class="flex-1 py-2 rounded-xl border text-xs font-bold">Achievements</button>
      <button type="button" data-cp-profile-tab="activity" class="flex-1 py-2 rounded-xl border text-xs font-bold">Activity</button>
    `;
    profileTabs.querySelectorAll("[data-cp-profile-tab]").forEach(button => {
      button.addEventListener("click", () => setProfileTab(button.dataset.cpProfileTab));
    });

    const postsPane = document.createElement("div");
    postsPane.id = "cp-profile-pane-posts";
    postsPane.dataset.cpProfilePane = "posts";

    const achievementsPane = document.createElement("div");
    achievementsPane.id = "cp-profile-pane-achievements";
    achievementsPane.dataset.cpProfilePane = "achievements";
    achievementsPane.className = "hidden space-y-3 mt-4";

    const activityPane = document.createElement("div");
    activityPane.id = "cp-profile-pane-activity";
    activityPane.dataset.cpProfilePane = "activity";
    activityPane.className = "hidden space-y-3 mt-4";

    const profileDetails = document.createElement("div");
    profileDetails.id = "cp-you-profile-details";
    profileDetails.className = "mb-4";
    if (profileCard) {
      // Show the real profile card on both the YOU landing screen and Profile,
      // preserving its avatar frame, badges, and original appearance.
      const profileCardCopy = profileCard.cloneNode(true);
      profileCardCopy.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
      profileCardCopy.querySelectorAll("button").forEach(button => {
        if (/edit profile/i.test(button.textContent || "")) {
          button.addEventListener("click", () => editButton?.click());
        }
      });
      profileDetails.appendChild(profileCardCopy);
    } else {
      profileDetails.innerHTML = profileHeaderHTML();
      const profileEditButton = profileDetails.querySelector("#cp-profile-edit-fallback");
      if (profileEditButton) {
        profileEditButton.id = "cp-profile-edit-on-profile";
        profileEditButton.addEventListener("click", () => {
          document.querySelector('#cp-you-settings [data-action="edit-profile"]')?.click();
        });
      }
    }

    profilePage.append(profileDetails, profileTabs, postsPane, achievementsPane, activityPane);

    const settingsPage = document.createElement("section");
    settingsPage.id = "cp-you-settings";
    settingsPage.className = "hidden";
    settingsPage.appendChild(makePageHeader("Settings", "Manage your account and app preferences", () => setPage("home")));
    const settingsBody = document.createElement("div");
    settingsBody.id = "cp-you-settings-body";
    settingsBody.className = "space-y-3";
    settingsPage.appendChild(settingsBody);

    // Move, rather than clone, existing controls so their click handlers continue to work.
    if (activity) activityPane.appendChild(activity);
    else {
      activityPane.innerHTML = '<div class="bg-card border border-border rounded-2xl p-4"><div class="text-sm font-black mb-1">Your Activity</div><p class="text-xs text-gray-500">Your CODMPanda activity summary will appear here.</p></div>';
    }

    if (themeFrames) themeSlot.appendChild(themeFrames);
    else {
      themeSlot.innerHTML = `
        <div id="theme-frame-buttons" class="grid grid-cols-2 gap-2">
          <button type="button" id="open-theme-btn" class="btn-press py-3 rounded-xl bg-cardAlt border border-border text-xs font-bold">🎨 Themes</button>
          <button type="button" id="open-frame-btn" class="btn-press py-3 rounded-xl bg-cardAlt border border-border text-xs font-bold">✨ Avatar Frame</button>
        </div>
      `;
      document.getElementById("open-theme-btn")?.addEventListener("click", () => window.openThemePicker?.());
      document.getElementById("open-frame-btn")?.addEventListener("click", () => window.openAvatarFramePicker?.());
    }

    if (profileCard) profileCardSlot.appendChild(profileCard);
    else {
      profileCardSlot.innerHTML = profileHeaderHTML();
      document.getElementById("cp-profile-edit-fallback")?.addEventListener("click", () => {
        settingsBody.querySelector('[data-action="edit-profile"]')?.click();
      });
    }

    if (statsGrid) profilePage.insertBefore(statsGrid, profileTabs);
    if (achievements) achievementsPane.appendChild(achievements);
    else achievementsPane.appendChild(createFallbackAchievements());
    if (tournamentBadges) achievementsPane.appendChild(tournamentBadges);

    // Contributor is an account/settings option, not a community achievement.
    if (contributor && !settingsNodes.includes(contributor)) settingsNodes.push(contributor);
    // Show the original Settings controls directly under the page title, without
    // nesting a second card titled "Settings" inside the Settings page.
    if (settingsRoot) {
      const legacySettingsHeading = [...settingsRoot.querySelectorAll(".uppercase")]
        .find(el => el.textContent.trim().toLowerCase() === "settings");
      if (legacySettingsHeading) legacySettingsHeading.remove();
      settingsRoot.classList.remove("bg-card", "border", "border-border", "rounded-2xl", "p-4", "mb-3");
      settingsBody.appendChild(settingsRoot);
    }

    [...settingsNodes, ...extraSettingsCards]
      .filter((node, index, list) => node && list.indexOf(node) === index && node !== settingsRoot && node !== proCard)
      .forEach(node => settingsBody.appendChild(node));

    // Recover settings controls that are rendered as rows or plain wrappers,
    // not as standalone .bg-card elements. Move the original DOM nodes so their
    // existing listeners/state survive; never copy the legacy navigation menu or
    // the Pro promotion into Settings.
    const alreadyMoved = new Set([
      app, profileCard, activity, themeFrames, statsGrid, achievements,
      tournamentBadges, contributor, notificationCard, proCard, settingsRoot,
      ...settingsNodes, ...extraSettingsCards
    ].filter(Boolean));
    const excludedIds = [
      "#activity-stats-card", "#theme-frame-buttons", "#tournament-badge-card",
      "#cp-v4-achievements", "#contributor-card-injected", "#unlock-pro-btn",
      "#edit-profile-btn", "#cp-open-profile", "#cp-open-settings",
      "#cp-you-home-menu", "[data-cp-profile-tab]"
    ].join(",");
    const legacyRoots = [...content.children].filter(root =>
      root !== app && !alreadyMoved.has(root) &&
      ![...alreadyMoved].some(moved => moved && root.contains(moved))
    );
    legacyRoots.forEach(root => {
      // Remove only known profile/promotion/navigation elements from the legacy
      // wrapper. Leave account, support, reporting, notifications, admin and
      // sign-out controls untouched.
      root.querySelectorAll(excludedIds).forEach(found => {
        if (found.id === "unlock-pro-btn") {
          const promo = found.closest(".bg-gradient-to-br") || found;
          if (promo.parentNode) promo.remove();
          return;
        }
        if (found.matches("#cp-open-profile, #cp-open-settings, #cp-you-home-menu")) {
          const nav = found.closest("#cp-you-home-menu") || found.parentElement;
          if (nav && nav !== root && nav.parentNode) nav.remove();
          else if (nav === root) [...root.querySelectorAll("#cp-open-profile, #cp-open-settings")].forEach(button => button.remove());
          return;
        }
        const removable = found.closest(".bg-card, .bg-gradient-to-br") || found;
        if (removable !== root && removable.parentNode) removable.remove();
      });
      const text = (root.innerText || root.textContent || "").toLowerCase();
      const hasAction = !!root.querySelector("button, a, input, select, [role='button']");
      if (hasAction && /account|setting|support|report|bug|notification|sign out|signout|log out|logout|privacy|terms|contributor|admin|delete account|feedback|help/.test(text)) {
        settingsBody.appendChild(root);
      }
    });

    // Preserve the old theme/frame button's event listeners if it was injected already.
    // Replace the old page only after all unhandled sections have been carried forward.
    content.replaceChildren(app);
    app.append(home, profilePage, settingsPage);

    if (window.lucide) window.lucide.createIcons();
    setPage("home");
    setProfileTab("posts");
  }

  function scheduleLayout() {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(() => {
      if (!isYouTab()) return;
      if (!document.getElementById("cp-you-app")) buildLayout();
    }, 450);
  }

  // Observe the actual tab content: the app has several legacy wrappers/injectors.
  // Debouncing lets the original profile, theme/frame and activity injectors finish first.
  const content = contentEl();
  if (content) {
    const observer = new MutationObserver(() => {
      if (!isYouTab() || document.getElementById("cp-you-app")) return;
      scheduleLayout();
    });
    observer.observe(content, { childList: true, subtree: true });
    scheduleLayout();
  }

  const originalSwitchTab = window.switchTab;
  if (typeof originalSwitchTab === "function" && !originalSwitchTab.__cpYouNavWrapped) {
    const wrappedSwitchTab = function(tab) {
      const result = originalSwitchTab.apply(this, arguments);
      if (tab === "you") scheduleLayout();
      return result;
    };
    wrappedSwitchTab.__cpYouNavWrapped = true;
    window.switchTab = wrappedSwitchTab;
  }

  const originalRenderYouTab = window.renderYouTab;
  if (typeof originalRenderYouTab === "function" && !originalRenderYouTab.__cpYouNavWrapped) {
    const wrappedRenderYouTab = function() {
      const result = originalRenderYouTab.apply(this, arguments);
      scheduleLayout();
      return result;
    };
    wrappedRenderYouTab.__cpYouNavWrapped = true;
    window.renderYouTab = wrappedRenderYouTab;
  }
})();