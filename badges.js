/* CODMPanda identity badges — blue verification + Obsidian Spike Pro.
   Converts existing, status-rendered Pro markers only; it never invents a user's Pro status. */
(function cpIdentityBadgeSystem(){
  'use strict';
  if (window.__cpIdentityBadgeSystemV1) return;
  window.__cpIdentityBadgeSystemV1 = true;

  const VERIFIED_SVG = '<svg class="cp-verified-emblem" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 1.2 14.6 2.6 17.5 2.4 18.7 5 21.3 6.5 21 9.4 22.5 12 21 14.6 21.3 17.5 18.7 19 17.5 21.6 14.6 21.4 12 22.8 9.4 21.4 6.5 21.6 5.3 19 2.7 17.5 3 14.6 1.5 12 3 9.4 2.7 6.5 5.3 5 6.5 2.4 9.4 2.6Z" fill="#1877F2"/>' +
    '<path d="M7.2 12.1 10.2 15.1 16.9 8.7" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  let proInstance = 0;
  function buildProSvg(){
    const id = 'cp-pro-metal-' + (++proInstance);
    return '<svg class="cp-pro-spike-svg" width="18" height="18" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="' + id + '-titanium" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#F4F0E8"/><stop offset="18%" stop-color="#777B80"/>' +
          '<stop offset="42%" stop-color="#24272B"/><stop offset="68%" stop-color="#090A0C"/>' +
          '<stop offset="100%" stop-color="#A9ADB0"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + id + '-ember" x1="0" y1="1" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="#8E310D"/><stop offset="48%" stop-color="#FF702B"/>' +
          '<stop offset="100%" stop-color="#FFD0A0"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + id + '-letter" x1="0" y1="0" x2="0.9" y2="1">' +
          '<stop offset="0%" stop-color="#FFFFFF"/><stop offset="45%" stop-color="#C8CBD0"/>' +
          '<stop offset="100%" stop-color="#737980"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<path d="M32 2 38 13 53 7 49 21 62 27 51 34 56 51 41 47 32 62 25 49 8 55 13 39 2 31 15 24 11 10 26 15Z" fill="url(#' + id + '-titanium)" stroke="#08090B" stroke-width="1.5" stroke-linejoin="bevel"/>' +
      '<path d="M32 8 37 18 49 13 45 25 55 29 45 36 49 46 38 43 32 54 26 43 14 48 18 37 9 31 20 25 17 16 28 20Z" fill="#101215" stroke="#4A4D50" stroke-width="0.7" stroke-linejoin="bevel"/>' +
      '<path d="M15 39 29 25 34 25 20 42Z" fill="url(#' + id + '-ember)"/>' +
      '<path d="M27 19H37C43 19 46 23 46 29 46 35 42 38 36 38H32V45H25V25H32V32H36C38 32 39 31 39 29 39 27 38 26 36 26H27Z" fill="url(#' + id + '-letter)" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="0.5" stroke-linejoin="bevel"/>' +
      '<path d="M32 3 36 11" fill="none" stroke="#FF8A49" stroke-width="1" stroke-linecap="square"/>' +
    '</svg>';
  }

  function removeFounderMarks(){
    document.querySelectorAll('.founder-badge,.cp-founder-badge,[class*="founder-badge"],[data-founder-badge]').forEach(function(el){
      el.remove();
    });
    document.querySelectorAll('span').forEach(function(el){
      const label = (el.textContent || '').trim();
      const classes = String(el.className || '');
      if (/^(?:👑\s*)?FOUNDER$/i.test(label)) {
        el.remove();
        return;
      }
      if (label === '👑' && /text-\[9px\]/.test(classes) && /(?:bg-gradient-to-r|bg-gold)/.test(classes)) {
        el.remove();
      }
    });
    document.querySelectorAll('div.absolute').forEach(function(el){
      const label = (el.textContent || '').trim();
      const classes = String(el.className || '');
      if (label === '👑' && /bg-gold/.test(classes) && /-right-/.test(classes)) el.remove();
    });
  }

  function isAvatarOverlay(el){
    if (el.closest('.cp-pro-avatar-badge,.cp-role-badges')) return true;
    const positioned = el.classList && el.classList.contains('absolute');
    if (!positioned) return false;
    const ancestor = el.parentElement;
    return !!(ancestor && ancestor.querySelector('img'));
  }

  function cleanProMarks(){
    const candidates = new Set();
    document.querySelectorAll('.cp-pro-badge,.pro-badge,.badge-pro,.premium-badge,.pro-member-badge,[data-pro-badge],[data-badge="pro"]').forEach(function(el){
      candidates.add(el);
    });
    // Support the existing tiny PRO pill used by older renderers, without touching buttons or plan cards.
    document.querySelectorAll('span').forEach(function(el){
      const label = (el.textContent || '').trim();
      const classes = String(el.className || '');
      if (/^(?:👑\s*)?PRO$/i.test(label) &&
          /(?:badge|rounded|bg-|gradient|text-\[9px\]|px-)/i.test(classes)) {
        candidates.add(el);
      }
    });

    candidates.forEach(function(el){
      if (!el.isConnected || isAvatarOverlay(el)) return;
      if (el.querySelector('.cp-pro-spike-svg')) {
        el.classList.add('cp-pro-spike-badge');
        return;
      }

      // Keep the existing per-user status marker; change only its visual treatment.
      el.classList.add('cp-pro-spike-badge');
      ['cp-pro-badge','pro-badge','badge-pro','premium-badge','pro-member-badge'].forEach(function(cls){
        el.classList.remove(cls);
      });
      el.innerHTML = buildProSvg();
      el.setAttribute('title','CODMPanda Pro');
      el.setAttribute('aria-label','CODMPanda Pro');
      el.setAttribute('role','img');
      el.style.removeProperty('background');
      el.style.removeProperty('background-color');
      el.style.removeProperty('background-image');
      el.style.removeProperty('border');
      el.style.removeProperty('border-radius');
      el.style.removeProperty('box-shadow');
      el.style.removeProperty('padding');
      el.style.removeProperty('color');
      el.style.removeProperty('font-size');
    });
  }

  function cleanVerifiedMarks(){
    document.querySelectorAll('.verified-badge').forEach(function(mark){
      mark.classList.remove('cp-gold-verified');
      mark.classList.add('cp-verified-blue');
      if (!mark.querySelector('.cp-verified-emblem')) mark.innerHTML = VERIFIED_SVG;
      mark.setAttribute('title','Verified Creator');
      mark.setAttribute('aria-label','Verified Creator');
      mark.setAttribute('role','img');
      ['background','background-color','background-image','color','border','border-radius','box-shadow','font-size','padding','width','height','min-width','flex'].forEach(function(prop){
        mark.style.removeProperty(prop);
      });
    });
    document.querySelectorAll('.verified-badge + .verified-badge').forEach(function(duplicate){
      duplicate.remove();
    });
  }

  const style = document.createElement('style');
  style.id = 'cp-identity-badge-style-v1';
  style.textContent = [
    '.verified-badge,.verified-badge.cp-gold-verified,.cp-verified-blue{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:16px!important;height:16px!important;min-width:16px!important;max-width:16px!important;flex:0 0 16px!important;box-sizing:border-box!important;padding:0!important;margin:0 2px!important;border:0!important;border-radius:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;color:transparent!important;box-shadow:none!important;font-size:0!important;line-height:1!important;vertical-align:middle!important;overflow:visible!important}',
    '.verified-badge .cp-verified-emblem,.cp-verified-blue .cp-verified-emblem{display:block!important;width:16px!important;height:16px!important;min-width:16px!important;max-width:16px!important;flex:none!important;background:transparent!important;filter:none!important}',
    '.verified-badge + .cp-pro-spike-badge{margin-left:0!important}',
    '.cp-pro-spike-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:18px!important;height:18px!important;min-width:18px!important;max-width:18px!important;flex:0 0 18px!important;box-sizing:border-box!important;padding:0!important;margin:0 0 0 2px!important;border:0!important;border-radius:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;color:transparent!important;box-shadow:none!important;font-size:0!important;line-height:1!important;vertical-align:middle!important;overflow:visible!important;white-space:nowrap!important}',
    '.cp-pro-spike-svg{display:block!important;width:18px!important;height:18px!important;min-width:18px!important;max-width:18px!important;flex:none!important;background:transparent!important;filter:none!important;overflow:visible!important}',
    '.cp-role-badges,.cp-pro-avatar-badge,.cp-founder-badge{display:none!important}',
    '.cp-pro-badge.cp-pro-spike-badge{display:inline-flex!important}',
    '@media(prefers-reduced-motion:reduce){.cp-verified-emblem,.cp-pro-spike-svg{animation:none!important}}'
  ].join('');
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  function clean(){
    // Convert Pro crown/PRO marks first, so Founder-only crown cleanup cannot remove a Pro mark.
    cleanProMarks();
    removeFounderMarks();
    cleanVerifiedMarks();
  }

  clean();
  let queued = false;
  const observer = new MutationObserver(function(records){
    if (!records.some(function(record){
      return record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length);
    })) return;
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){ queued = false; clean(); });
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();