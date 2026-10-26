/* CODMPanda full-screen direct-message and Coach navigation.
   Keeps the Messages overlay mounted beneath chats and handles app/browser Back. */
(() => {
  'use strict';
  if (window.__cpDMFullscreenV1) return;
  window.__cpDMFullscreenV1 = true;

  const nav = window.__cpChatNavigation = {
    active: false,
    kind: null,
    historyPushed: false
  };

  function backIcon() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
  }

  function setNav(kind) {
    if (nav.active && nav.kind === kind) return;
    nav.active = true;
    nav.kind = kind;
    nav.historyPushed = false;
    try {
      history.pushState(Object.assign({}, history.state || {}, {
        __codm: true,
        cpChatScreen: true,
        cpChatKind: kind
      }), '', location.href);
      nav.historyPushed = true;
    } catch (_) {}
  }

  function ensureMessagesTab() {
    const inbox = document.getElementById('inbox-overlay');
    if (inbox) {
      const messagesTab = inbox.querySelector('.inbox-tab-btn[data-tab="messages"]');
      if (messagesTab) {
        const active = getComputedStyle(messagesTab).borderColor === 'rgb(255, 107, 0)';
        if (!active) messagesTab.click();
      }
      return;
    }

    if (typeof window.openNotificationsPanel === 'function') {
      try { window.openNotificationsPanel(); } catch (error) { console.warn('[DM navigation] Could not reopen Inbox', error); }
      const activateMessages = () => {
        const tab = document.querySelector('#inbox-overlay .inbox-tab-btn[data-tab="messages"]');
        if (tab) {
          const active = getComputedStyle(tab).borderColor === 'rgb(255, 107, 0)';
          if (!active) tab.click();
        }
      };
      setTimeout(activateMessages, 80);
      setTimeout(activateMessages, 300);
    }
  }

  function closeChatScreen() {
    const sheet = document.getElementById('sheet-container');
    if (sheet && sheet.dataset.cpDmFullscreen === '1') {
      sheet.classList.add('hidden');
      sheet.innerHTML = '';
      delete sheet.dataset.cpDmFullscreen;
      if (sheet.__cpDmOriginalStyle !== undefined) {
        sheet.setAttribute('style', sheet.__cpDmOriginalStyle);
        delete sheet.__cpDmOriginalStyle;
      }
    }

    const coach = document.getElementById('cp-ai-coach');
    if (coach) coach.remove();

    nav.active = false;
    nav.kind = null;
    nav.historyPushed = false;
    ensureMessagesTab();
  }

  function goBack() {
    if (nav.active && nav.historyPushed) {
      try {
        history.back();
        return;
      } catch (_) {}
    }
    closeChatScreen();
  }

  function styleDMFullScreen(friendIgn) {
    const container = document.getElementById('sheet-container');
    const messages = container?.querySelector('#dm-messages');
    if (!container || !messages || container.classList.contains('hidden')) return false;

    if (container.__cpDmOriginalStyle === undefined) {
      container.__cpDmOriginalStyle = container.getAttribute('style') || '';
    }
    container.dataset.cpDmFullscreen = '1';
    container.classList.remove('hidden');
    container.style.cssText = 'position:fixed;inset:0;z-index:100000;display:block;width:100%;height:100%;max-height:none;margin:0;padding:0;background:#050505;overflow:hidden;';

    const backdrop = container.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:flex;align-items:stretch;justify-content:stretch;background:#050505;overflow:hidden;';
    }

    const sheet = container.querySelector('.sheet');
    if (!sheet) return false;
    sheet.style.cssText = 'position:relative;inset:auto;left:auto;right:auto;bottom:auto;width:100%;height:100%;max-height:none;min-height:0;margin:0;padding:0;border:0;border-radius:0;box-shadow:none;background:#050505;color:#fff;display:flex;flex-direction:column;overflow:hidden;transform:none;';

    const header = sheet.firstElementChild;
    const content = header?.nextElementSibling;
    if (!header || !content) return false;

    let title = header.querySelector('h3')?.textContent?.trim() || friendIgn || 'Direct Message';
    title = title.replace(/^💬\s*/, '') || friendIgn || 'Direct Message';
    header.style.cssText = 'position:relative;top:auto;z-index:5;flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 12px;margin:0;border-bottom:1px solid #222;background:#050505;box-sizing:border-box;';
    header.innerHTML =
      '<button type="button" id="cp-dm-back" aria-label="Back to Messages" class="btn-press" style="width:40px;height:40px;flex:0 0 40px;border-radius:12px;background:#111;border:1px solid #222;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;">' + backIcon() + '</button>' +
      '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:900;letter-spacing:.16em;color:#ff7a2e;">DIRECT MESSAGE</div><div style="font-size:16px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">' + escapeHTML(title) + '</div></div>';
    header.querySelector('#cp-dm-back').addEventListener('click', goBack);

    content.style.cssText = 'position:relative;flex:1 1 auto;min-height:0;height:auto;overflow:hidden;padding:0;margin:0;display:flex;flex-direction:column;box-sizing:border-box;';
    const panel = content.firstElementChild;
    if (panel) {
      panel.style.setProperty('display', 'flex', 'important');
      panel.style.setProperty('flex-direction', 'column', 'important');
      panel.style.setProperty('flex', '1 1 auto', 'important');
      panel.style.setProperty('min-height', '0', 'important');
      panel.style.setProperty('height', '100%', 'important');
      panel.style.setProperty('box-sizing', 'border-box', 'important');
      panel.style.setProperty('padding', '12px 16px 0', 'important');
    }
    messages.style.cssText += ';flex:1 1 auto;min-height:0;height:auto;overflow-y:auto;overscroll-behavior:contain;margin-bottom:0;padding-bottom:12px;';
    const composer = messages.parentElement?.querySelector('#dm-input')?.parentElement;
    if (composer) {
      composer.style.position = 'relative';
      composer.style.bottom = 'auto';
      composer.style.flex = '0 0 auto';
      composer.style.margin = '0';
      composer.style.padding = '12px 0 calc(12px + env(safe-area-inset-bottom,0px))';
      composer.style.background = '#050505';
      composer.style.zIndex = '2';
    }

    if (window.lucide) window.lucide.createIcons();
    return true;
  }

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function normalizeCoachFullScreen() {
    const overlay = document.getElementById('cp-ai-coach');
    if (!overlay) return false;
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100001;width:100vw;height:100dvh;min-height:100%;padding:0;margin:0;background:#050505;display:flex;align-items:stretch;justify-content:stretch;overflow:hidden;box-sizing:border-box;';
    const section = overlay.querySelector('section');
    const header = section?.querySelector('header');
    const chat = overlay.querySelector('#cp-coach-chat');
    const form = overlay.querySelector('#cp-coach-form');
    if (!section || !header || !chat || !form) return false;

    section.style.cssText = 'position:relative;width:100%;height:100%;max-height:none;min-height:0;margin:0;padding:0;border:0;border-radius:0;background:#050505;display:flex;flex-direction:column;overflow:hidden;color:#fff;box-sizing:border-box;';
    header.style.cssText = 'flex:0 0 auto;display:flex;align-items:center;justify-content:flex-start;gap:12px;padding:calc(env(safe-area-inset-top,0px) + 10px) 16px 12px;margin:0;border-bottom:1px solid #222;background:#050505;box-sizing:border-box;';
    header.innerHTML =
      '<button type="button" id="cp-coach-close" aria-label="Back to Messages" class="btn-press" style="width:40px;height:40px;flex:0 0 40px;border-radius:12px;background:#111;border:1px solid #222;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;">' + backIcon() + '</button>' +
      '<div style="flex:1;min-width:0;"><div style="font-size:16px;font-weight:900;color:#fff;">CODMPanda Coach</div><div style="font-size:11px;color:#a1a1aa;margin-top:3px;">AI-powered CODM practice &amp; loadout coach</div></div>';
    header.querySelector('#cp-coach-close').addEventListener('click', goBack);

    chat.style.flex = '1 1 auto';
    chat.style.minHeight = '0';
    chat.style.height = 'auto';
    chat.style.overflowY = 'auto';
    chat.style.overscrollBehavior = 'contain';
    chat.style.padding = '14px 16px';
    chat.style.margin = '0';

    form.style.flex = '0 0 auto';
    form.style.margin = '0';
    form.style.padding = '12px 16px calc(12px + env(safe-area-inset-bottom,0px))';
    form.style.background = '#050505';
    form.style.borderTop = '1px solid #222';
    form.style.alignItems = 'center';
    return true;
  }

  function activateDM(uid, ign) {
    setNav('dm');
    const normalize = () => styleDMFullScreen(ign);
    normalize();
    setTimeout(normalize, 30);
    setTimeout(normalize, 120);
  }

  function activateCoach() {
    setNav('coach');
    normalizeCoachFullScreen();
    setTimeout(normalizeCoachFullScreen, 30);
    setTimeout(normalizeCoachFullScreen, 120);
  }

  // Wrap the app's real message functions so message loading, sending and saved
  // Coach history remain handled by the existing implementation.
  if (typeof window.openDMThread === 'function') {
    const originalOpenDMThread = window.openDMThread;
    window.openDMThread = function(uid, ign) {
      const result = originalOpenDMThread.apply(this, arguments);
      activateDM(uid, ign);
      return result;
    };
  }

  if (typeof window.openCODMPandaCoach === 'function') {
    const originalOpenCoach = window.openCODMPandaCoach;
    window.openCODMPandaCoach = function() {
      const result = originalOpenCoach.apply(this, arguments);
      activateCoach();
      return result;
    };
  }

  // This listener is loaded before the legacy navigation handlers so their
  // generic Back logic cannot switch tabs while a chat screen is open.
  document.addEventListener('popstate', function cpChatHandleBack(event) {
    const dmOpen = document.getElementById('sheet-container')?.dataset.cpDmFullscreen === '1';
    const coachOpen = !!document.getElementById('cp-ai-coach');
    if (!nav.active || (!dmOpen && !coachOpen)) {
      nav.active = false;
      nav.kind = null;
      nav.historyPushed = false;
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    closeChatScreen();
    try {
      history.pushState(Object.assign({}, history.state || {}, {
        __codm: true,
        cpChatScreen: false
      }), '', location.href);
    } catch (_) {}
  }, true);

  // Keyboard Back/Escape mirrors the native Back button.
  document.addEventListener('keydown', function cpChatEscapeBack(event) {
    if (event.key !== 'Escape' || !nav.active) return;
    const dmOpen = document.getElementById('sheet-container')?.dataset.cpDmFullscreen === '1';
    const coachOpen = !!document.getElementById('cp-ai-coach');
    if (!dmOpen && !coachOpen) return;
    event.preventDefault();
    goBack();
  }, true);
})();