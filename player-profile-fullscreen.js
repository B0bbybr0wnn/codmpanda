/* CODMPanda: full-screen player profile presentation.
   Keeps the existing profile data/actions, with reliable close and cleanup behavior. */
(() => {
  'use strict';

  const STYLE_ID = 'cp-player-profile-fullscreen-style';
  const CONTAINER_ID = 'sheet-container';
  const LOCK_CLASS = 'cp-player-profile-lock';
  const OPEN_CLASS = 'cp-player-profile-open';
  const SHEET_CLASS = 'cp-player-profile-fullscreen';

  function getContainer() {
    return document.getElementById(CONTAINER_ID);
  }

  function clearProfileMode() {
    document.body.classList.remove(LOCK_CLASS);
    const container = getContainer();
    if (container) {
      container.classList.remove(OPEN_CLASS);
      container.querySelectorAll('.' + SHEET_CLASS).forEach(node => node.classList.remove(SHEET_CLASS));
      container.querySelectorAll('.cp-player-profile-close').forEach(node => node.remove());
    }
  }

  function closeProfile() {
    const container = getContainer();
    if (container && !container.classList.contains('hidden')) {
      if (typeof window.closeSheet === 'function') window.closeSheet();
      else {
        container.classList.add('hidden');
        container.innerHTML = '';
      }
    }
    clearProfileMode();
  }

  function addStyles() {
    if (document.getElementById(STYLE_ID)) return;
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
        box-sizing: border-box !important;
      }
      #sheet-container.cp-player-profile-open .sticky {
        top: 0 !important; z-index: 12 !important;
      }
      body.cp-player-profile-lock { overflow: hidden !important; }
      #sheet-container.cp-player-profile-open .cp-player-profile-close {
        position: absolute; top: calc(env(safe-area-inset-top, 0px) + 8px);
        right: 12px; z-index: 30; width: 42px; height: 42px;
        min-width: 42px; min-height: 42px; display: flex;
        align-items: center; justify-content: center; border-radius: 9999px;
        border: 1px solid #343434; background: #171717; color: #fff;
        font-size: 30px; font-weight: 400; line-height: 1;
        cursor: pointer; -webkit-tap-highlight-color: transparent;
      }
      #sheet-container.cp-player-profile-open .cp-player-profile-close:focus-visible {
        outline: 2px solid #ff6b00; outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function makeCloseButton(sheet, header) {
    let button = sheet.querySelector('.cp-player-profile-close');
    if (button) return button;

    button = document.createElement('button');
    button.type = 'button';
    button.className = 'cp-player-profile-close';
    button.setAttribute('aria-label', 'Close player profile');
    button.title = 'Close profile';
    button.textContent = '×';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      closeProfile();
    });

    const host = header || sheet;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(button);
    return button;
  }

  function isProfileSheet(container, uid) {
    if (!container || container.classList.contains('hidden')) return false;
    const sheet = container.querySelector('.sheet');
    if (!sheet) return false;
    const text = (sheet.innerText || '').slice(0, 900);
    const profileSignals = /Add Friend|Remove Friend|Invite to Lobby|Friend Request/i.test(text);
    const hasProfileTitle = /Profile/i.test(text);
    const isLoadingProfile = !!sheet.querySelector('.spinner') && hasProfileTitle;
    return !!uid && hasProfileTitle && (profileSignals || isLoadingProfile);
  }

  function promoteToFullscreen(uid) {
    const container = getContainer();
    const currentUid = window.State?.user?.uid || window.__state?.user?.uid;
    if (!uid || uid === currentUid || !isProfileSheet(container, uid)) return;

    const sheet = container.querySelector('.sheet');
    if (!sheet) return;
    sheet.classList.add(SHEET_CLASS);
    container.classList.add(OPEN_CLASS);
    document.body.classList.add(LOCK_CLASS);

    const header = sheet.querySelector('.sticky');
    if (header) {
      header.style.position = 'sticky';
      header.style.paddingRight = '58px';
    }
    makeCloseButton(sheet, header);
  }

  function install() {
    const original = window.openUserProfile;
    if (typeof original !== 'function' || original.__cpFullscreenWrapped) return false;
    addStyles();

    const wrapped = async function(uid) {
      // Clear stale profile styling, then make the loading state dismissible too.
      clearProfileMode();
      const container = getContainer();
      const resultPromise = original.apply(this, arguments);
      // openUserProfile renders its loading sheet before its first Firestore await.
      // Promote that sheet immediately so a slow/offline request never traps the user.
      let attempts = 0;
      const promoteTimer = setInterval(() => {
        attempts++;
        promoteToFullscreen(uid);
        if ((container && container.classList.contains('hidden')) || attempts >= 80 ||
            (container && container.querySelector('.cp-player-profile-fullscreen') &&
             !container.querySelector('.spinner'))) {
          clearInterval(promoteTimer);
        }
      }, 100);
      try {
        const result = await resultPromise;
        promoteToFullscreen(uid);
        return result;
      } catch (error) {
        promoteToFullscreen(uid);
        throw error;
      } finally {
        // Keep polling briefly after completion in case a later profile wrapper
        // finishes injecting the final profile markup.
        setTimeout(() => clearInterval(promoteTimer), 1000);
      }
    };
    wrapped.__cpFullscreenWrapped = true;
    window.openUserProfile = wrapped;

    const container = getContainer();
    if (container && !container.__cpProfileObserver) {
      const observer = new MutationObserver(() => {
        const hasFullscreenProfile = !!container.querySelector('.' + SHEET_CLASS);
        if (container.classList.contains('hidden') || (!hasFullscreenProfile && container.classList.contains(OPEN_CLASS))) {
          clearProfileMode();
        }
      });
      observer.observe(container, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
      container.__cpProfileObserver = observer;
    }

    if (!window.__cpProfileBackBound) {
      window.__cpProfileBackBound = true;
      // Run before the app's generic popstate handlers. Those handlers otherwise
      // close the sheet and then immediately navigate to another tab in the same
      // event, which makes profile navigation feel stuck or unpredictable.
      window.addEventListener('popstate', event => {
        const activeContainer = getContainer();
        if (!activeContainer || !activeContainer.classList.contains(OPEN_CLASS)) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        closeProfile();
        try { history.pushState({ __codm: true }, ''); } catch (_) {}
      }, true);
    }

    if (!window.__cpProfileEscapeBound) {
      window.__cpProfileEscapeBound = true;
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && getContainer()?.classList.contains(OPEN_CLASS)) {
          event.preventDefault();
          closeProfile();
        }
      });
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
