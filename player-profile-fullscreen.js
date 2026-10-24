/* CODMPanda: full-screen player profile presentation.
   Preserves the existing profile data and actions; adds a clear close control. */
(() => {
  'use strict';
  const STYLE_ID = 'cp-player-profile-fullscreen-style';

  function clearProfileMode() {
    document.body.classList.remove('cp-player-profile-lock');
    const container = document.getElementById('sheet-container');
    if (container) container.classList.remove('cp-player-profile-open');
  }

  function install() {
    const original = window.openUserProfile;
    if (typeof original !== 'function' || original.__cpFullscreenWrapped) return false;

    const wrapped = async function(uid) {
      const result = await original.apply(this, arguments);
      if (!uid || uid === window.__state?.user?.uid) return result;

      const container = document.getElementById('sheet-container');
      if (!container || container.classList.contains('hidden')) return result;
      const sheet = container.querySelector('.sheet');
      if (!sheet) return result;
      const content = (container.innerText || '').slice(0, 700);
      if (!/Profile|Add Friend|Remove Friend|Invite to Lobby/i.test(content)) return result;

      sheet.classList.add('cp-player-profile-fullscreen');
      container.classList.add('cp-player-profile-open');
      document.body.classList.add('cp-player-profile-lock');

      // A full-screen sheet covers its backdrop, so provide an explicit close
      // button instead of relying on tapping outside the sheet.
      const header = sheet.querySelector('.sticky');
      if (header && !header.querySelector('.cp-player-profile-close')) {
        header.style.position = 'sticky';
        header.style.paddingRight = '56px';
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'cp-player-profile-close';
        close.setAttribute('aria-label', 'Close player profile');
        close.title = 'Close profile';
        close.textContent = '×';
        close.addEventListener('click', () => {
          if (typeof window.closeSheet === 'function') window.closeSheet();
          else {
            container.classList.add('hidden');
            container.innerHTML = '';
          }
          clearProfileMode();
        });
        header.appendChild(close);
      }
      return result;
    };
    wrapped.__cpFullscreenWrapped = true;
    window.openUserProfile = wrapped;

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        #sheet-container.cp-player-profile-open { z-index: 9500 !important; }
        #sheet-container .cp-player-profile-fullscreen {
          position: fixed !important; inset: 0 !important;
          width: 100vw !important; max-width: 100vw !important;
          height: 100vh !important; height: 100dvh !important;
          max-height: 100vh !important; max-height: 100dvh !important;
          min-height: 100vh !important; min-height: 100dvh !important;
          margin: 0 !important; border-radius: 0 !important; border: 0 !important;
          padding-top: env(safe-area-inset-top, 0px) !important;
          padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          overflow-y: auto !important; overflow-x: hidden !important;
          overscroll-behavior: contain !important;
          -webkit-overflow-scrolling: touch !important;
        }
        body.cp-player-profile-lock { overflow: hidden !important; }
        #sheet-container.cp-player-profile-open .cp-player-profile-close {
          position: absolute; top: 10px; right: 14px; z-index: 20;
          width: 40px; height: 40px; display: flex; align-items: center;
          justify-content: center; border-radius: 9999px;
          border: 1px solid #343434; background: #171717; color: #fff;
          font-size: 30px; line-height: 1; cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }

    // Clean up lock state whenever the sheet is closed or replaced.
    const container = document.getElementById('sheet-container');
    if (container && !container.__cpProfileObserver) {
      const observer = new MutationObserver(() => {
        if (container.classList.contains('hidden')) clearProfileMode();
      });
      observer.observe(container, { attributes: true, attributeFilter: ['class'] });
      container.__cpProfileObserver = observer;
    }
    return true;
  }

  if (!install()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (install() || attempts > 100) clearInterval(timer);
    }, 100);
  }
})();
