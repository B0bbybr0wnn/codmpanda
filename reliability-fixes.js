/* CODMPanda reliability fixes: normalize frame aliases, frame layering, and mention hydration. */
(function () {
  'use strict';

  function installFrameLayering() {
    if (document.getElementById('cp-frame-layering-fix')) return;
    const style = document.createElement('style');
    style.id = 'cp-frame-layering-fix';
    style.textContent = `
      .cp-avatar-shell { position:relative!important; overflow:visible!important; isolation:isolate!important; }
      .cp-avatar-shell > .cp-avatar-core {
        position:absolute!important; inset:20%!important; width:60%!important; height:60%!important;
        z-index:1!important; overflow:hidden!important; border-radius:50%!important;
      }
      .cp-avatar-shell > .cp-avatar-core img {
        position:relative!important; z-index:1!important; width:100%!important; height:100%!important;
        object-fit:cover!important; border-radius:50%!important; clip-path:circle(50% at 50% 50%)!important;
      }
      .cp-avatar-shell > .cp-war-artifact-frame,
      .cp-avatar-shell > .cp-frame-art {
        position:absolute!important; inset:-12%!important; width:124%!important; height:124%!important;
        max-width:none!important; max-height:none!important; object-fit:contain!important; object-position:center!important;
        z-index:20!important; display:block!important; pointer-events:none!important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function resolveFrame(user) {
    const registry = window.CODM_WAR_ARTIFACT_FRAMES || {};
    const normalize = typeof window.CODMNormalizeFrameKey === 'function'
      ? window.CODMNormalizeFrameKey
      : value => String(value || 'none').trim().toLowerCase().replace(/[\\s-]+/g, '_');
    const fields = ['avatarFrame', 'equippedAvatarFrame', 'equippedFrame', 'selectedFrame', 'frameId', 'frame', 'profileFrame'];
    for (const field of fields) {
      const key = normalize(user && user[field]);
      if (key !== 'none' && registry[key]) return key;
    }
    return 'none';
  }

  function installAvatarWrapper() {
    const original = window.CODMRenderFramedAvatar;
    if (typeof original !== 'function' || original.__cpAliasFix) return;
    const wrapped = function (user, size) {
      const normalized = resolveFrame(user || {});
      return original({ ...(user || {}), avatarFrame: normalized }, size);
    };
    wrapped.__cpAliasFix = true;
    window.CODMRenderFramedAvatar = wrapped;
  }

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
    installFrameLayering();
    installAvatarWrapper();
    if (!observerStarted && document.documentElement) {
      observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
      observerStarted = true;
    }
    scheduleHydration();
  }
  let observerStarted = false;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  let attempts = 0;
  const retry = setInterval(() => {
    installFrameLayering();
    installAvatarWrapper();
    if ((window.CODMRenderFramedAvatar && window.CODMRenderFramedAvatar.__cpAliasFix) || ++attempts >= 30) clearInterval(retry);
  }, 100);
})();