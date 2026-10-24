/* CODMPanda: native full-screen player profile presentation.
   Keeps the existing profile data/actions intact and only changes the presentation. */
(() => {
  'use strict';
  const install = () => {
    const original = window.openUserProfile;
    if (typeof original !== 'function' || original.__cpFullscreenWrapped) return false;

    const wrapped = async function(uid) {
      const result = await original.apply(this, arguments);
      if (!uid || uid === window.__state?.user?.uid) return result;

      // Wait for the existing profile sheet to finish rendering.
      const container = document.getElementById('sheet-container');
      if (!container || container.classList.contains('hidden')) return result;
      const sheet = container.querySelector('.sheet');
      if (!sheet) return result;

      // Only promote the actual player profile sheet, not other sheets opened
      // during async profile loading.
      const heading = container.querySelector('[class*="text-"]');
      const text = (container.innerText || '').slice(0, 500);
      if (!/Profile|Add Friend|Remove Friend|Invite to Lobby/i.test(text)) return result;

      sheet.classList.add('cp-player-profile-fullscreen');
      container.classList.add('cp-player-profile-open');
      document.body.classList.add('cp-player-profile-lock');
      return result;
    };
    wrapped.__cpFullscreenWrapped = true;
    window.openUserProfile = wrapped;

    if (!document.getElementById('cp-player-profile-fullscreen-style')) {
      const style = document.createElement('style');
      style.id = 'cp-player-profile-fullscreen-style';
      style.textContent = `
        #sheet-container.cp-player-profile-open { z-index: 9500 !important; }
        #sheet-container .cp-player-profile-fullscreen {
          position: fixed !important; inset: 0 !important;
          width: 100vw !important; max-width: 100vw !important;
          height: 100dvh !important; max-height: 100dvh !important;
          min-height: 100dvh !important; margin: 0 !important;
          border-radius: 0 !important; border: 0 !important;
          padding-top: env(safe-area-inset-top, 0px) !important;
          padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          overflow-y: auto !important; overflow-x: hidden !important;
          overscroll-behavior: contain !important;
          -webkit-overflow-scrolling: touch !important;
        }
        body.cp-player-profile-lock { overflow: hidden !important; }
        #sheet-container.cp-player-profile-open .modal-backdrop {
          border-radius: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Existing closeSheet/popstate behavior remains authoritative. Clean up
    // the presentation class whenever the sheet closes.
    const observer = new MutationObserver(() => {
      const c = document.getElementById('sheet-container');
      if (!c || c.classList.contains('hidden')) {
        document.body.classList.remove('cp-player-profile-lock');
        if (c) c.classList.remove('cp-player-profile-open');
      }
    });
    const c = document.getElementById('sheet-container');
    if (c) observer.observe(c, { attributes: true, attributeFilter: ['class'] });
    return true;
  };

  if (!install()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (install() || attempts > 80) clearInterval(timer);
    }, 100);
  }
})();
