/* CODMPanda shared identity badge styling.
   Account-backed rendering and deduplication live in app.js; this file only styles the marks. */
(function cpIdentityBadgeStyles(){
  'use strict';
  if (window.__cpIdentityBadgeStylesV3) return;
  window.__cpIdentityBadgeStylesV3 = true;
  const styleId = 'cp-identity-badge-style-v3';
  document.getElementById(styleId)?.remove();
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = [
    '.verified-badge,.cp-verified-blue{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:16px!important;height:16px!important;min-width:16px!important;max-width:16px!important;flex:0 0 16px!important;box-sizing:border-box!important;padding:0!important;margin:0 2px!important;border:0!important;border-radius:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;color:transparent!important;box-shadow:none!important;font-size:0!important;line-height:1!important;vertical-align:middle!important;overflow:visible!important;flex-shrink:0!important}',
    '.verified-badge .cp-verified-emblem,.cp-verified-blue .cp-verified-emblem{display:block!important;width:16px!important;height:16px!important;min-width:16px!important;max-width:16px!important;flex:none!important;background:transparent!important;filter:none!important}',
    '.cp-pro-spike-badge{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:18px!important;height:18px!important;min-width:18px!important;max-width:18px!important;flex:0 0 18px!important;box-sizing:border-box!important;padding:0!important;margin:0 0 0 2px!important;border:0!important;border-radius:0!important;background:transparent!important;background-color:transparent!important;background-image:none!important;color:transparent!important;box-shadow:none!important;font-size:0!important;line-height:1!important;vertical-align:middle!important;overflow:visible!important;white-space:nowrap!important}',
    '.cp-pro-spike-svg{display:block!important;width:18px!important;height:18px!important;min-width:18px!important;max-width:18px!important;flex:none!important;background:transparent!important;filter:none!important;overflow:visible!important}',
    '.verified-badge + .cp-pro-spike-badge{margin-left:0!important}',
    '@media(prefers-reduced-motion:reduce){.cp-verified-emblem,.cp-pro-spike-svg{animation:none!important}}'
  ].join('');
  document.head.appendChild(style);
})();
