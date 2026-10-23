/* CODMPanda verified badge cleanup.
   Intentionally handles ONLY existing verification marks.
   No Pro/Founder injection, profile-card overlays, or duplicated badge creation. */
(function cpVerifiedBadgeCleanup(){
  'use strict';
  if (window.__cpVerifiedBadgeCleanup) return;
  window.__cpVerifiedBadgeCleanup = true;

  const svg = '<svg class="cp-verified-emblem" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 1.2 14.6 2.6 17.5 2.4 18.7 5 21.3 6.5 21 9.4 22.5 12 21 14.6 21.3 17.5 18.7 19 17.5 21.6 14.6 21.4 12 22.8 9.4 21.4 6.5 21.6 5.3 19 2.7 17.5 3 14.6 1.5 12 3 9.4 2.7 6.5 5.3 5 6.5 2.4 9.4 2.6Z" fill="#1877F2"/>' +
    '<path d="M7.2 12.1 10.2 15.1 16.9 8.7" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function clean(){
    document.querySelectorAll('.verified-badge').forEach(function(mark){
      // Keep the existing badge element in place; never append another badge.
      mark.classList.remove('cp-gold-verified');
      mark.classList.add('cp-verified-blue');
      mark.innerHTML = svg;
      mark.setAttribute('title','Verified Creator');
      mark.setAttribute('aria-label','Verified Creator');
      mark.setAttribute('role','img');
      ['background','background-color','background-image','color','border','border-radius','box-shadow','font-size','padding','width','height','min-width','flex'].forEach(function(prop){
        mark.style.removeProperty(prop);
      });
    });

    // Collapse only adjacent duplicate verification marks, never Pro/Founder labels.
    document.querySelectorAll('.verified-badge + .verified-badge').forEach(function(duplicate){
      duplicate.remove();
    });
  }

  const style = document.createElement('style');
  style.id = 'cp-verified-badge-clean-style';
  style.textContent = [
    '.verified-badge,.verified-badge.cp-gold-verified,.cp-verified-blue{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:16px!important;height:16px!important;min-width:16px!important;max-width:16px!important;flex:0 0 16px!important;box-sizing:border-box!important;padding:0!important;margin:0 0 0 3px!important;border:0!important;border-radius:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;color:transparent!important;box-shadow:none!important;font-size:0!important;line-height:1!important;vertical-align:middle!important;overflow:visible!important}',
    '.verified-badge .cp-verified-emblem,.cp-verified-blue .cp-verified-emblem{display:block!important;width:16px!important;height:16px!important;min-width:16px!important;max-width:16px!important;flex:none!important;background:transparent!important;filter:none!important}',
    '.cp-role-badges,.cp-pro-avatar-badge,.cp-pro-badge,.cp-founder-badge{display:none!important}',
    '@media(prefers-reduced-motion:reduce){.cp-verified-emblem{animation:none!important}}'
  ].join('');
  document.getElementById(style.id)?.remove();
  document.head.appendChild(style);

  clean();
  let queued = false;
  const observer = new MutationObserver(function(records){
    if (!records.some(function(record){
      return record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length);
    })) return;
    if (queued) return;
    queued = true;
    requestAnimationFrame(function(){queued=false;clean();});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();