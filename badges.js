import { getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* CODMPanda premium badges v2.
   Loads actual user subscription/Founder fields instead of relying on lobby snapshots.
   Verification is always blue; Pro and Founder are separate, combinable badges. */
(function cpPremiumBadgesV2(){
  'use strict';
  if (window.__cpPremiumBadgesV2Installed) return;
  window.__cpPremiumBadgesV2Installed = true;

  const profileCache = new Map();
  const pendingProfiles = new Map();
  let scheduleTimer = 0;
  let database = null;

  function getDatabase(){
    if (database) return database;
    try {
      if (!getApps().length) return null;
      database = getFirestore(getApp());
      return database;
    } catch (error) {
      console.warn('[CODMPanda badges] Firestore is not ready yet.', error);
      return null;
    }
  }
  function hasPro(user){
    return !!(user && (
      user.isPro === true || user.pro === true ||
      user.subscription === 'pro' || user.proStatus === 'active' ||
      user.subscriptionStatus === 'active' && String(user.plan || user.tier || '').toLowerCase() === 'pro'
    ));
  }
  function hasFounder(user){
    if (!user) return false;
    const badges = Array.isArray(user.badges) ? user.badges : [];
    return String(user.uid || user.id || '') === String(window.ADMIN_UID || '__no_admin__') ||
      user.isFounder === true || user.founder === true ||
      String(user.role || '').toLowerCase() === 'founder' ||
      badges.some(function(badge){return String(badge).toLowerCase() === 'founder';});
  }
  async function getUserProfile(uid){
    if (!uid) return null;
    const key = String(uid);
    const cached = profileCache.get(key);
    if (cached && Date.now() - cached.time < 30000) return cached.value;
    if (pendingProfiles.has(key)) return pendingProfiles.get(key);
    const promise = (async function(){
      try {
        const db = getDatabase();
        if (!db) return null;
        const snap = await getDoc(doc(db, 'users', key));
        const value = snap.exists() ? Object.assign({}, snap.data(), {uid:key, id:key}) : null;
        profileCache.set(key, {value:value, time:Date.now()});
        return value;
      } catch (error) {
        console.warn('[CODMPanda badges] Could not read profile status.', error);
        return null;
      } finally {
        pendingProfiles.delete(key);
      }
    })();
    pendingProfiles.set(key, promise);
    return promise;
  }
  function verifiedSVG(){
    return '<svg class="cp-verified-emblem" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M12 1.2 14.6 2.6 17.5 2.4 18.7 5 21.3 6.5 21 9.4 22.5 12 21 14.6 21.3 17.5 18.7 19 17.5 21.6 14.6 21.4 12 22.8 9.4 21.4 6.5 21.6 5.3 19 2.7 17.5 3 14.6 1.5 12 3 9.4 2.7 6.5 5.3 5 6.5 2.4 9.4 2.6Z" fill="#1877F2"/>' +
      '<path d="M7.2 12.1 10.2 15.1 16.9 8.7" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function founderSVG(size){
    size = Math.max(14, Number(size) || 18);
    return '<span class="cp-role-badge cp-founder-badge" title="Founder" aria-label="Founder" role="img"><svg class="cp-founder-emblem" width="'+size+'" height="'+size+'" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<path d="M32 3 57 13 60 36 47 54 32 62 17 54 4 36 7 13Z" fill="#08090C" stroke="#E8BD57" stroke-width="2.5"/>' +
      '<path d="M32 7 52 16 54 35 44 49 32 56 20 49 10 35 12 16Z" fill="#17130B" stroke="#8F6825" stroke-width="1.3"/>' +
      '<path class="cp-founder-orbit" d="M32 10 32 54 M11 32 53 32 M17 17 47 47 M47 17 17 47" fill="none" stroke="#D7A844" stroke-width=".9" opacity=".65"/>' +
      '<path d="M17 25 23 31 28 21 32 29 37 20 42 31 48 25 45 39 19 39Z" fill="#F4D27D" stroke="#FFF0B0" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M21 42H43L40 47H24Z" fill="#D39C35" stroke="#FFF0B0" stroke-width="1"/>' +
      '<path d="M32 30 39 37 32 45 25 37Z" fill="#FFF1BD" stroke="#B98126" stroke-width="1.5"/><path d="M32 33 36 37 32 42 28 37Z" fill="#8E5E14"/>' +
      '<circle class="cp-founder-spark" cx="13" cy="15" r="2" fill="#FFF1BD"/><circle class="cp-founder-spark cp-founder-spark-late" cx="51" cy="46" r="1.6" fill="#FFF1BD"/>' +
      '</svg></span>';
  }
  function proSVG(size){
    size = Math.max(14, Number(size) || 18);
    return '<span class="cp-role-badge cp-pro-badge" title="CODMPanda Pro" aria-label="CODMPanda Pro" role="img"><svg class="cp-pro-emblem" width="'+size+'" height="'+size+'" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<path d="M32 3 46 7 57 18 61 32 57 46 46 57 32 61 18 57 7 46 3 32 7 18 18 7Z" fill="#080A0D" stroke="#D7AC4D" stroke-width="2.4"/>' +
      '<path d="M32 7 44 11 53 20 57 32 53 44 44 53 32 57 20 53 11 44 7 32 11 20 20 11Z" fill="#171A1E" stroke="#76551F" stroke-width="1.5"/>' +
      '<g class="cp-pro-rotor" fill="none" stroke="#F1C76A" stroke-width="2.2" stroke-linecap="square"><circle cx="32" cy="32" r="21" stroke-dasharray="4 3"/><path d="M32 7V13 M32 51V57 M7 32H13 M51 32H57 M14.3 14.3 18.5 18.5 M45.5 45.5 49.7 49.7 M49.7 14.3 45.5 18.5 M18.5 45.5 14.3 49.7"/></g>' +
      '<circle cx="32" cy="32" r="15.5" fill="#07090B" stroke="#D5AA4D" stroke-width="2.2"/><circle class="cp-pro-core-pulse" cx="32" cy="32" r="11" fill="#29251A" stroke="#F4D27A" stroke-width="1.4"/>' +
      '<path d="M36 17 23 34H30L27.5 47 41 29H33.5Z" fill="#FFE7A0" stroke="#A87523" stroke-width="1.4" stroke-linejoin="round"/><path class="cp-pro-scan" d="M8 25H56" stroke="#FFF7D9" stroke-width="1.2" opacity=".7"/>' +
      '<circle class="cp-pro-light" cx="18" cy="12" r="2" fill="#FFE7A0"/><circle class="cp-pro-light cp-pro-light-delay" cx="46" cy="52" r="2" fill="#D99C35"/>' +
      '</svg></span>';
  }

  function normalizeVerifiedMarks(root){
    (root || document).querySelectorAll('.verified-badge').forEach(function(mark){
      if (!mark.classList.contains('cp-verified-blue') || mark.classList.contains('cp-gold-verified')) {
        mark.classList.remove('cp-gold-verified');
        mark.classList.add('cp-verified-blue');
      }
      if (!mark.querySelector('.cp-verified-emblem')) mark.innerHTML = verifiedSVG();
      ['background','background-color','background-image','color','border','border-radius','box-shadow','font-size','padding','width','height','min-width','flex'].forEach(function(prop){
        if (mark.style.getPropertyValue(prop)) mark.style.removeProperty(prop);
      });
      mark.setAttribute('title','Verified Creator');
      mark.setAttribute('aria-label','Verified Creator');
      mark.setAttribute('role','img');
    });
  }
  function isLegacyRoleLabel(node){
    if (!node || !node.matches || !node.matches('span')) return false;
    if (node.classList.contains('cp-role-badges')) return false;
    const text = (node.textContent || '').replace(/\s+/g,' ').trim().replace(/^👑\s*/,'').toUpperCase();
    return text === 'PRO' || text === 'FOUNDER' || node.classList.contains('founder-badge');
  }
  function paintRoleRow(nameEl, profile, uid){
    if (!nameEl || !nameEl.parentElement) return;
    const line = nameEl.parentElement;
    const verified = profile && profile.verified === true;
    if (verified && !nameEl.querySelector('.verified-badge')) {
      nameEl.insertAdjacentHTML('beforeend','<span class="verified-badge cp-verified-blue" title="Verified Creator" aria-label="Verified Creator" role="img">'+verifiedSVG()+'</span>');
    }
    const children = Array.from(line.children);
    const oldLabels = children.filter(isLegacyRoleLabel);
    let pro = hasPro(profile);
    let founder = hasFounder(Object.assign({}, profile || {}, {uid:uid || (profile && profile.uid)}));
    oldLabels.forEach(function(node){
      const label = (node.textContent || '').toUpperCase();
      if (label.indexOf('PRO') >= 0) pro = true;
      if (label.indexOf('FOUNDER') >= 0 || node.classList.contains('founder-badge')) founder = true;
      node.remove();
    });
    let holder = Array.from(line.children).find(function(node){return node.classList && node.classList.contains('cp-role-badges');});
    const kinds = (founder ? 'founder' : '') + (pro ? '-pro' : '');
    if (!founder && !pro) {
      if (holder) holder.remove();
      return;
    }
    if (holder && holder.dataset.cpKinds === kinds) return;
    if (holder) holder.remove();
    nameEl.insertAdjacentHTML('afterend','<span class="cp-role-badges" data-cp-kinds="'+kinds+'">'+(founder ? founderSVG(18) : '')+(pro ? proSVG(18) : '')+'</span>');
  }
  function setAvatarProBadge(card, profile){
    if (!card) return;
    const avatar = card.querySelector('.relative');
    if (!avatar) return;
    let badge = avatar.querySelector(':scope > .cp-pro-avatar-badge');
    if (!hasPro(profile)) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cp-pro-avatar-badge absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center border-2 border-card rounded-full';
      badge.setAttribute('aria-label','CODMPanda Pro');
      badge.innerHTML = proSVG(25);
      avatar.appendChild(badge);
    }
  }
  async function decorateLobbyCards(){
    const state = window.State || {};
    const feed = document.getElementById('lobbies-feed');
    if (!feed) return;
    const cards = Array.from(feed.querySelectorAll(':scope > .bg-card, .bg-card')).filter(function(card){
      return card.querySelector('.report-lobby[data-uid]') && card.querySelector('.font-bold.text-sm');
    });
    await Promise.all(cards.map(async function(card){
      const report = card.querySelector('.report-lobby[data-uid]');
      const join = card.querySelector('.join-btn[data-id]');
      const uid = report && report.dataset.uid;
      const nameEl = card.querySelector('.font-bold.text-sm');
      if (!nameEl || !uid) return;
      const lobby = (Array.isArray(state.cache && state.cache.lobbies) ? state.cache.lobbies : []).find(function(item){
        return String(item.id) === String(join && join.dataset.id);
      }) || {};
      const storedProfile = await getUserProfile(uid);
      if (!card.isConnected || !nameEl.isConnected) return;
      const profile = Object.assign({}, lobby, storedProfile || {}, {uid:uid});
      paintRoleRow(nameEl, profile, uid);
    }));
  }
  function decorateOwnProfile(){
    const state = window.State || {};
    if (!state.profile || !state.user) return;
    const nameEl = document.querySelector('#content .text-base.font-black.truncate');
    if (!nameEl) return;
    const profile = Object.assign({}, state.profile, {uid:state.user.uid});
    paintRoleRow(nameEl, profile, state.user.uid);
    setAvatarProBadge(nameEl.closest('.bg-card'), profile);
  }
  async function decorateExternalProfile(uid){
    if (!uid) return;
    const profile = await getUserProfile(uid);
    const root = document.querySelector('#sheet-container');
    if (!root || !root.isConnected) return;
    const nameEl = root.querySelector('.text-base.font-black.truncate');
    if (!nameEl) return;
    nameEl.dataset.cpProfileUid = String(uid);
    const effective = Object.assign({}, profile || {}, {uid:uid});
    paintRoleRow(nameEl, effective, uid);
    setAvatarProBadge(nameEl.closest('.bg-card'), effective);
  }
  function decorateAll(){
    normalizeVerifiedMarks(document);
    decorateLobbyCards().catch(function(error){console.warn('[CODMPanda badges] Lobby decoration failed.',error);});
    decorateOwnProfile();
  }
  function scheduleDecorate(){
    if (scheduleTimer) clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(function(){scheduleTimer=0;decorateAll();},60);
  }

  const styles = document.createElement('style');
  styles.id = 'cp-premium-badges-v2-styles';
  styles.textContent = [
    '#lobbies-feed .verified-badge,#content .verified-badge,#sheet-container .verified-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:16px!important;height:16px!important;min-width:16px!important;flex:0 0 16px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;color:transparent!important;box-shadow:none!important;font-size:0!important;line-height:1!important;vertical-align:middle!important;overflow:visible!important}',
    '.verified-badge .cp-verified-emblem{display:block!important;width:16px!important;height:16px!important;min-width:16px!important;filter:drop-shadow(0 1px 2px rgba(24,119,242,.22))}',
    '.cp-role-badges{display:inline-flex!important;align-items:center!important;gap:3px!important;vertical-align:middle!important;flex:0 0 auto!important;margin-left:2px!important}',
    '.cp-role-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;flex:0 0 auto!important;width:18px!important;height:18px!important;overflow:visible!important;line-height:1!important}',
    '.cp-role-badge svg{display:block!important;overflow:visible!important}',
    '.cp-pro-avatar-badge{z-index:3!important;background:#08090c!important;border-color:#d7ac4d!important;overflow:visible!important}',
    '.cp-pro-avatar-badge .cp-role-badge{width:26px!important;height:26px!important}',
    '.cp-pro-emblem{filter:drop-shadow(0 0 2px rgba(212,167,65,.25))}',
    '.cp-founder-emblem{filter:drop-shadow(0 0 2px rgba(238,193,83,.3))}',
    '.cp-pro-rotor{transform-box:fill-box;transform-origin:center;animation:cpProRotate 12s linear infinite}',
    '.cp-pro-scan{animation:cpProScan 2.5s ease-in-out infinite}',
    '.cp-pro-core-pulse{transform-box:fill-box;transform-origin:center;animation:cpProPulse 2s ease-in-out infinite}',
    '.cp-pro-light{animation:cpProLight 1.4s ease-in-out infinite}',
    '.cp-pro-light-delay{animation-delay:.7s}',
    '.cp-founder-orbit{transform-box:fill-box;transform-origin:center;animation:cpFounderRotate 18s linear infinite}',
    '.cp-founder-spark{animation:cpFounderSpark 1.8s ease-in-out infinite}',
    '.cp-founder-spark-late{animation-delay:.9s}',
    '.founder-badge:not(.cp-founder-badge){display:none!important}',
    '@keyframes cpProRotate{to{transform:rotate(360deg)}}',
    '@keyframes cpProScan{0%,100%{transform:translateY(-7px);opacity:.15}50%{transform:translateY(8px);opacity:.9}}',
    '@keyframes cpProPulse{0%,100%{transform:scale(.92);opacity:.82}50%{transform:scale(1.06);opacity:1}}',
    '@keyframes cpProLight{0%,100%{opacity:.35}50%{opacity:1}}',
    '@keyframes cpFounderRotate{to{transform:rotate(360deg)}}',
    '@keyframes cpFounderSpark{0%,100%{opacity:.35;transform:scale(.7)}50%{opacity:1;transform:scale(1.25)}}',
    '@media(prefers-reduced-motion:reduce){.cp-pro-rotor,.cp-pro-scan,.cp-pro-core-pulse,.cp-pro-light,.cp-founder-orbit,.cp-founder-spark{animation:none!important}}'
  ].join('');
  document.getElementById(styles.id)?.remove();
  document.head.appendChild(styles);

  // Replace any queued legacy renderer update that tries to recolor the verification mark gold.
  const existingRender = window.renderLobbies;
  if (typeof existingRender === 'function' && !existingRender.__cpPremiumBadgesV2Wrapper) {
    const wrapped = function(){
      const result = existingRender.apply(this,arguments);
      scheduleDecorate();
      setTimeout(scheduleDecorate,350);
      setTimeout(scheduleDecorate,1050);
      return result;
    };
    wrapped.__cpPremiumBadgesV2Wrapper = true;
    window.renderLobbies = wrapped;
  }
  // Attach the actual UID to the public-profile header after the app's asynchronous profile renderer.
  const openProfile = window.openUserProfile;
  if (typeof openProfile === 'function' && !openProfile.__cpPremiumBadgeWrapped) {
    const wrappedOpenProfile = async function(uid){
      const result = await openProfile.apply(this,arguments);
      setTimeout(function(){decorateExternalProfile(uid);},80);
      setTimeout(function(){decorateExternalProfile(uid);},400);
      return result;
    };
    wrappedOpenProfile.__cpPremiumBadgeWrapped = true;
    window.openUserProfile = wrappedOpenProfile;
  }
  const observer = new MutationObserver(function(records){
    if (records.some(function(record){return record.addedNodes && record.addedNodes.length || record.type === 'attributes';})) scheduleDecorate();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)scheduleDecorate();});
  scheduleDecorate();
})();