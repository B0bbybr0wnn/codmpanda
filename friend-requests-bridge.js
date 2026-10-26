/*
 * CODMPanda friend-request click bridge.
 *
 * The You > Friends > Search UI is rendered dynamically. Delegate its
 * clicks from document capture so the existing shared Firebase sender is
 * still called if a re-render causes a per-button onclick binding to be lost.
 */
(() => {
  if (window.__cpFriendRequestBridgeInstalled) return;
  window.__cpFriendRequestBridgeInstalled = true;

  document.addEventListener('click', async (event) => {
    const origin = event.target;
    const button = origin instanceof Element ? origin.closest('.send-req-btn') : null;
    if (!button) return;

    // Own this click so a stale per-render onclick cannot send twice.
    event.preventDefault();
    event.stopImmediatePropagation();

    if (button.dataset.cpSending === '1') return;

    const targetUid = String(button.dataset.uid || button.getAttribute('data-uid') || '').trim();
    const targetIgn = String(button.dataset.ign || button.getAttribute('data-ign') || '').trim();
    const sendRequest = window.sendFriendRequest;

    if (!targetUid) {
      console.error('[CODMPanda] Friend search result has no target UID:', button);
      button.title = 'Could not identify this player. Search again and retry.';
      return;
    }
    if (typeof sendRequest !== 'function') {
      console.error('[CODMPanda] Shared sendFriendRequest function is not available.');
      button.title = 'Friend requests are unavailable. Refresh the page and retry.';
      return;
    }

    const originalText = button.textContent;
    const originallyDisabled = button.disabled;
    button.dataset.cpSending = '1';
    button.disabled = true;
    button.textContent = 'Sending…';
    button.classList.add('opacity-60');

    let sent = false;
    try {
      sent = await sendRequest(targetUid, targetIgn);
    } catch (error) {
      console.error('[CODMPanda] Delegated friend request failed:', error);
    }

    // performFriendSearch() may replace the result list after a successful write.
    if (!button.isConnected) return;

    if (sent) {
      button.textContent = 'Request Sent ✓';
      button.disabled = true;
      button.title = 'Friend request sent';
      button.classList.add('opacity-60');
      delete button.dataset.cpSending;
      return;
    }

    button.textContent = originalText;
    button.disabled = originallyDisabled;
    button.classList.remove('opacity-60');
    delete button.dataset.cpSending;
  }, true);

  console.info('[CODMPanda] Friend-request click bridge installed.');
})();
