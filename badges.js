/* CODMPanda premium badge integration.
   Verification is community recognition; Pro and Founder are separate statuses. */
(function cpPremiumBadges(){
  'use strict';
  if (window.__cpPremiumBadgesInstalled) return;
  window.__cpPremiumBadgesInstalled = true;

  function hasPro(user){
    return !!(user && (user.isPro === true || user.pro === true ||
      user.subscription === 'pro' || user.proStatus === 'active'));
  }
  function hasFounder(user){
    if (!user) return false;
    const list = Array.isArray(user.badges) ? user.badges : [];
    return user.uid === window.ADMIN_UID || user.isFounder === true || user.founder === true ||
      String(user.role || '').toLowerCase() === 'founder' ||
      list.some(function(item){ return String(item).toLowerCase() === 'founder'; });
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
      mark.className = 'verified-badge cp-verified-blue';
      ['background','color','border','border-radius','box-shadow','font-size','padding','width','height','min-width','flex'].forEach(function(prop){
        mark.style.removeProperty(prop);
      });
      if (!mark.querySelector('.cp-verified-emblem')) mark.innerHTML = verifiedSVG();
      mark.setAttribute('title','Verified Creator');
      mark.setAttribute('aria-label','Verified Creator');
      mark.setAttribute('role','img');
    });
  }
  function legacyRoleLabel(node){
    if (!node || !node.matches || !node.matches('span')) return false;
    const text = (node.textContent || '').replace(/\s+/g,' ').trim().replace(/^👑\s*/,'').toUpperCase();
    return text === 'PRO' || text === 'FOUNDER' || node.classList.contains('founder-badge');
  }
  function profileForName(nameEl, card){
    const state = window.State || {};
    const lobbies = Array.isArray(state.cache && state.cache.lobbies) ? state.cache.lobbies : [];
    const candidate = nameEl && nameEl.closest('[data-uid]');
    const uid = (nameEl && (nameEl.dataset.uid || nameEl.getAttribute('data-uid'))) ||
      (candidate && candidate.getAttribute('data-uid')) ||
      (card && card.querySelector('[data-uid]') && card.querySelector('[data-uid]').getAttribute('data-uid')) || '';
    const visible = (nameEl && nameEl.textContent || '').replace(/[✓👑]/g,'').trim();
    const lobby = lobbies.find(function(item){ return uid && String(item.uid) === String(uid); }) ||
      lobbies.find(function(item){ return visible && String(item.ign || '').trim() === visible; }) || null;
    const own = !!(uid && state.user && String(uid) === String(state.user.uid));
    const profile = own ? (state.profile || {}) : {};
    return {
      uid: uid || (lobby && lobby.uid) || '',
      isPro: hasPro(lobby) || hasPro(profile),
      isFounder: hasFounder(lobby) || hasFounder(profile) || (!!uid && uid === window.ADMIN_UID),
      verified: (lobby && lobby.verified === true) || profile.verified === true,
      explicitKnown: !!lobby || own,
      lobby: lobby,
      profile: profile
    };
  }
  function decorateNameRow(nameEl, user){
    if (!nameEl || !nameEl.parentElement) return;
    const line = nameEl.parentElement;
    const existingVerified = nameEl.querySelector('.verified-badge');
    if (user.verified || existingVerified) {
      if (!existingVerified) nameEl.insertAdjacentHTML('beforeend','<span class="verified-badge cp-verified-blue" title="Verified Creator" aria-label="Verified Creator" role="img">'+verifiedSVG()+'</span>');
    }
    const legacy = Array.from(line.children).filter(legacyRoleLabel);
    const roleKnown = !!(user.explicitKnown || legacy.length);
    const founder = !!user.isFounder || legacy.some(function(node){return /FOUNDER/i.test(node.textContent || '');});
    const pro = !!user.isPro || legacy.some(function(node){return /\bPRO\b/i.test(node.textContent || '');});
    legacy.forEach(function(node){ node.remove(); });
    const kinds = (founder ? 'founder' : '') + (pro ? '-pro' : '');
    let holder = Array.from(line.children).find(function(node){return node.classList && node.classList.contains('cp-role-badges');});
    if (!founder && !pro) {
      if (holder) holder.remove();
      return;
    }
    if (holder && holder.dataset.cpKinds === kinds) return;
    if (holder) holder.remove();
    const html = '<span class="cp-role-badges" data-cp-kinds="'+kinds+'">'+(founder ? founderSVG(18) : '')+(pro ? proSVG(18) : '')+'</span>';
    nameEl.insertAdjacentHTML('afterend',html);
  }
  function decorateLobbyCards(){
    const state = window.State || {};
    const feed = document.getElementById('lobbies-feed');
    if (!feed) return;
    feed.querySelectorAll('.bg-card').forEach(function(card){
      const nameEl = card.querySelector('.user-name-link, .font-bold.text-sm');
      if (!nameEl) return;
      const user = profileForName(nameEl,card);
      decorateNameRow(nameEl,user);
    });
  }
  function decorateOwnProfile(){
    const state = window.State || {};
    if (!state.profile || !state.user) return;
    const nameEl = document.querySelector('#content .text-base.font-black.truncate');
    if (!nameEl) return;
    const user = {
      uid: state.user.uid,
      isPro: hasPro(state.profile),
      isFounder: hasFounder(Object.assign({uid:state.user.uid},state.profile)),
      verified: state.profile.verified === true,
      explicitKnown: true
    };
    const card = nameEl.closest('.bg-card');
    if (card) {
      decorateNameRow(nameEl,user);
      const avatar = card.querySelector('.relative');
      const badge = avatar && Array.from(avatar.children).find(function(el){return el.classList.contains('absolute') && (el.classList.contains('bg-gold') || /👑/.test(el.textContent || ''));});
      if (badge && user.isPro) {
        badge.className = 'absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center border-2 border-card rounded-full';
        badge.innerHTML = proSVG(25);
        badge.setAttribute('aria-label','CODMPanda Pro');
      }
    }
  }
  function decorateAll(){
    normalizeVerifiedMarks(document);
    decorateLobbyCards();
    decorateOwnProfile();
  }

  const styles = document.createElement('style');
  styles.id = 'cp-premium-badges-styles';
  styles.textContent = [
    '.verified-badge,.verified-badge.cp-gold-verified{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:16px!important;height:16px!important;min-width:16px!important;flex:0 0 16px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:transparent!important;box-shadow:none!important;line-height:1!important;vertical-align:middle!important;overflow:visible!important}',
    '.verified-badge .cp-verified-emblem{display:block!important;width:16px!important;height:16px!important;min-width:16px!important;filter:drop-shadow(0 1px 2px rgba(24,119,242,.28))}',
    '.cp-role-badges{display:inline-flex;align-items:center;gap:3px;vertical-align:middle;flex-shrink:0;margin-left:2px}',
    '.cp-role-badge{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;flex:0 0 auto;width:18px;height:18px;overflow:visible;line-height:1}',
    '.cp-role-badge svg{display:block;overflow:visible}',
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

  const previousRender = window.renderLobbies;
  if (typeof previousRender === 'function' && !previousRender.__cpPremiumBadgeWrapper) {
    const wrapped = function(){
      const result = previousRender.apply(this,arguments);
      decorateAll();
      setTimeout(decorateAll,300);
      setTimeout(decorateAll,1150);
      return result;
    };
    wrapped.__cpPremiumBadgeWrapper = true;
    window.renderLobbies = wrapped;
  }
  const observer = new MutationObserver(function(records){
    if (records.some(function(record){return record.addedNodes && record.addedNodes.length;})) decorateAll();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)decorateAll();});
  decorateAll();
  setTimeout(decorateAll,700);
})();