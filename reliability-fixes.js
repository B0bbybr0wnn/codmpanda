/* CODMPanda reliability fixes: mention hydration only.
   Avatar rendering is left to the app's own renderer; no global frame/CSS overrides. */
(function () {
  'use strict';

  function hydrateMentionText(root) {
    if (!root || !document.createTreeWalker) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !/@[A-Za-z0-9_]{2,24}/.test(node.nodeValue || '')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('a,button,input,textarea,select,script,style,code,pre,[contenteditable="true"],.mention-dropdown,.mention-text')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const value = node.nodeValue || '';
      const regex = /(^|[^A-Za-z0-9._%+-])@([A-Za-z0-9_]{2,24})/g;
      const fragment = document.createDocumentFragment();
      let match, last = 0, changed = false;
      while ((match = regex.exec(value))) {
        const start = match.index + match[1].length;
        if (start < last) continue;
        if (start > last) fragment.appendChild(document.createTextNode(value.slice(last, start)));
        const anchor = document.createElement('a');
        anchor.href = '#';
        anchor.setAttribute('role', 'link');
        anchor.setAttribute('tabindex', '0');
        anchor.setAttribute('aria-label', 'Open @' + match[2] + ' profile');
        anchor.dataset.mentionName = match[2];
        const uid = window.__cpMentionUidByName && window.__cpMentionUidByName[match[2].toLowerCase()];
        if (uid) anchor.dataset.mentionUid = uid;
        anchor.className = 'mention-text';
        anchor.textContent = '@' + match[2];
        anchor.style.cssText = 'color:#38bdf8;font-weight:800;cursor:pointer;text-decoration:none;pointer-events:auto;touch-action:manipulation;';
        fragment.appendChild(anchor);
        last = start + match[2].length + 1;
        changed = true;
      }
      if (changed) {
        if (last < value.length) fragment.appendChild(document.createTextNode(value.slice(last)));
        node.parentNode && node.parentNode.replaceChild(fragment, node);
      }
    }
  }

  let timer = 0;
  function scheduleHydration() {
    clearTimeout(timer);
    timer = setTimeout(() => hydrateMentionText(document), 80);
  }
  const observer = new MutationObserver(records => {
    if (records.some(record => record.type === 'characterData' || (record.addedNodes && record.addedNodes.length))) scheduleHydration();
  });
  function start() {
    if (!observerStarted && document.documentElement) {
      observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
      observerStarted = true;
    }
    scheduleHydration();
  }
  let observerStarted = false;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();


/* Navigation preservation:
   Keep profile/post overlays above the existing screen so Back never rebuilds
   the feed or silently jumps to PLAY. This runs in capture phase before the
   older app-level popstate handlers. */
(function cpNavigationPreservationV1() {
  'use strict';
  if (window.__cpNavigationPreservationV1) return;
  window.__cpNavigationPreservationV1 = true;

  function pushAppBaseState() {
    try { history.pushState({ __codm: true }, '', location.href); } catch (_) {}
  }

  function isVisible(el) {
    return !!el && !el.classList.contains('hidden');
  }

  // A profile's own Back button must close only the overlay. Do not call the
  // legacy goBack(), which switches tabs and destroys the originating screen.
  document.addEventListener('click', function(event) {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const backButton = target?.closest('#cp-pp-back');
    if (!backButton) return;
    const root = document.getElementById('cp-public-profile-page');
    if (!root) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    root.__cpPPHistoryPushed = false;
    root.remove();
    try {
      const nextState = { ...(history.state || {}), __codm: true };
      delete nextState.cpPublicProfilePage;
      history.replaceState(nextState, '', location.href);
    } catch (_) {}
    // Live feed updates are deferred while the profile overlay is open. Flush after
    // closing it; the Home renderer restores the same visible card/scroll position.
    if (typeof window.__cpFlushHomeFeedRenderPending === 'function') {
      window.__cpFlushHomeFeedRenderPending();
    }
  }, true);

  // Intercept Android/PWA Back before the legacy listeners. Close only the
  // topmost overlay, preserving the underlying DOM and its current scroll.
  document.addEventListener('popstate', function(event) {
    const app = document.getElementById('main-app');
    if (!app || app.classList.contains('hidden')) return;

    const imageViewer = document.getElementById('image-viewer');
    if (imageViewer) {
      imageViewer.remove();
      pushAppBaseState();
      event.stopImmediatePropagation();
      return;
    }

    const sheet = document.getElementById('sheet-container');
    if (isVisible(sheet)) {
      if (typeof window.closeSheet === 'function') window.closeSheet();
      pushAppBaseState();
      event.stopImmediatePropagation();
      return;
    }

    const modal = document.getElementById('modal-container');
    if (isVisible(modal)) {
      if (typeof window.closeModal === 'function') window.closeModal();
      pushAppBaseState();
      event.stopImmediatePropagation();
      return;
    }

    const profile = document.getElementById('cp-public-profile-page');
    if (profile) {
      profile.__cpPPHistoryPushed = false;
      profile.remove();
      pushAppBaseState();
      event.stopImmediatePropagation();
      if (typeof window.__cpFlushHomeFeedRenderPending === 'function') {
        window.__cpFlushHomeFeedRenderPending();
      }
      return;
    }

    if (window.voiceRoomState?.active && typeof window.closeVoiceRoom === 'function') {
      window.closeVoiceRoom();
      pushAppBaseState();
      event.stopImmediatePropagation();
      return;
    }

    // The old smart-back handler incorrectly sends HOME to PLAY because it
    // treats every non-PLAY tab as a request to open PLAY.
    if (window.State?.currentTab === 'home') {
      pushAppBaseState();
      event.stopImmediatePropagation();
    }
  }, true);
})();
