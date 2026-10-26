/* CODMPanda Inbox navigation + Coach row consistency fix. */
(() => {
  'use strict';

  const FIXED_ATTR = 'data-cp-inbox-row-fixed';

  function openProfileFromAvatar(event, avatar) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    avatar.click();
  }

  function normalizeConversationRow(row) {
    if (!row || row.hasAttribute(FIXED_ATTR)) return;

    const uid = String(row.dataset.uid || '').trim();
    const ign = String(row.dataset.ign || '').trim();
    if (!uid) return;

    // The row is a chat target, never a profile target.
    row.dataset.chatUid = uid;
    row.dataset.chatIgn = ign;
    row.removeAttribute('data-uid');
    row.querySelectorAll('[data-uid]').forEach(node => node.removeAttribute('data-uid'));

    // Only the avatar is a profile target for a real user.
    const avatar = row.children[0]?.querySelector('div');
    if (avatar) {
      avatar.dataset.uid = uid;
      avatar.setAttribute('data-profile-link', '');
      avatar.setAttribute('role', 'link');
      avatar.setAttribute('tabindex', '0');
      avatar.setAttribute('aria-label', 'Open ' + (ign || 'user') + ' profile');
      avatar.style.cursor = 'pointer';
      avatar.addEventListener('keydown', event => openProfileFromAvatar(event, avatar));
    }

    row.onclick = event => {
      // Avatar clicks are intercepted by the app's capture-phase profile router.
      if (event.target?.closest?.('[data-profile-link]')) return;
      event.preventDefault();
      event.stopPropagation();
      const chatUid = row.dataset.chatUid;
      const chatIgn = row.dataset.chatIgn || '';
      if (!chatUid) return;
      if (typeof window.closeInboxOverlay === 'function') window.closeInboxOverlay();
      setTimeout(() => {
        if (typeof window.openDMThread === 'function') window.openDMThread(chatUid, chatIgn);
      }, 300);
    };

    row.setAttribute(FIXED_ATTR, '1');
  }

  function normalizeCoachRow(row) {
    if (!row || row.dataset.cpCoachRowFixed === '1') return;

    // Match the normal conversation row's dimensions, surface and layout.
    row.style.cssText = [
      'width:100%',
      'box-sizing:border-box',
      'display:flex',
      'align-items:center',
      'gap:12px',
      'text-align:left',
      'padding:12px',
      'margin:0 0 8px',
      'background:#111',
      'border:1px solid #222',
      'border-radius:14px',
      'color:#fff',
      'cursor:pointer',
      'font-family:Inter,system-ui,sans-serif'
    ].join(';');

    row.innerHTML = `
      <span style="position:relative;flex:0 0 48px;width:48px;height:48px;border-radius:50%;overflow:hidden;background:rgba(255,107,0,.15);display:flex;align-items:center;justify-content:center">
        <img src="/icon-192.png" alt="CODMPanda Coach" style="display:block;width:100%;height:100%;border-radius:50%;object-fit:cover" />
      </span>
      <span style="flex:1;min-width:0">
        <span style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:14px;font-weight:800;color:#fff;white-space:nowrap">
          <span style="overflow:hidden;text-overflow:ellipsis">CODMPanda Coach</span>
          <span style="flex:0 0 auto;font-size:8px;padding:2px 5px;border-radius:4px;background:#FF6B00;color:#fff;font-weight:900">PINNED</span>
        </span>
        <span style="display:block;font-size:12px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Your CODM practice assistant</span>
      </span>
      <span aria-hidden="true" style="flex-shrink:0;text-align:right;font-size:10px;color:#555"></span>
    `;

    // The Coach has no player profile: both its avatar and row open Coach chat.
    row.dataset.cpCoachRowFixed = '1';
  }

  function normalizeInbox() {
    const body = document.getElementById('inbox-full-body');
    if (!body) return;

    body.querySelectorAll('.conversation-item-full').forEach(normalizeConversationRow);
    normalizeCoachRow(body.querySelector('#cp-coach-pinned-row'));
  }

  function install() {
    normalizeInbox();
    const observer = new MutationObserver(normalizeInbox);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
