/* CODMPanda Smart Feed v1
 * Ranks existing Home post cards using familiar social-feed signals:
 * recency, visible engagement, per-user interaction history, and author diversity.
 * It does not fetch or delete posts and leaves non-post Home cards in their slots.
 */
(function cpSmartFeedV1() {
  'use strict';
  if (window.__cpSmartFeedV1) return;
  window.__cpSmartFeedV1 = true;

  const feedSelector = '#home-feed';
  let scheduled = false;
  let ranking = false;
  const state = { authorSignals: {}, seen: {} };
  let loadedKey = '';

  function currentKey() {
    return String(window.State?.user?.uid || 'guest');
  }
  function loadSignals() {
    const key = 'cp_smart_feed_v1_' + currentKey();
    if (key === loadedKey) return;
    loadedKey = key;
    state.authorSignals = {};
    state.seen = {};
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      state.authorSignals = saved.authorSignals && typeof saved.authorSignals === 'object' ? saved.authorSignals : {};
      state.seen = saved.seen && typeof saved.seen === 'object' ? saved.seen : {};
    } catch (_) {}
  }
  function saveSignals() {
    try {
      const seenEntries = Object.entries(state.seen).sort((a,b) => b[1]-a[1]).slice(0, 300);
      localStorage.setItem('cp_smart_feed_v1_' + currentKey(), JSON.stringify({
        authorSignals: state.authorSignals,
        seen: Object.fromEntries(seenEntries)
      }));
    } catch (_) {}
  }
  function postCards(feed) {
    return Array.from(feed.querySelectorAll('.home-card[data-type="post"], .home-card[data-type="posts"], [data-feed-type="post"]'));
  }
  function authorId(card) {
    const authorNode = card.querySelector('[data-author-uid], [data-uid], [data-user-id]');
    return String(card.dataset.authorUid || card.dataset.uid || card.dataset.userId ||
      authorNode?.dataset.authorUid || authorNode?.dataset.uid || authorNode?.dataset.userId || '');
  }
  function postId(card) {
    return String(card.dataset.id || card.dataset.postId || card.id || '');
  }
  function timestamp(card) {
    const candidates = [
      card.dataset.createdAt, card.dataset.timestamp, card.dataset.createdat,
      card.querySelector('time[datetime]')?.dateTime,
      card.querySelector('time')?.getAttribute('datetime')
    ];
    for (const value of candidates) {
      if (!value) continue;
      const numeric = Number(value);
      const parsed = Number.isFinite(numeric) && numeric > 0
        ? (numeric < 1e12 ? numeric * 1000 : numeric)
        : Date.parse(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    const text = (card.innerText || '').toLowerCase();
    const match = text.match(/\b(\d+)\s*(s|sec|m|min|h|hr|d|day|w|wk)\s*(?:ago)?\b/);
    if (match) {
      const n = Number(match[1]);
      const unit = match[2];
      const ms = /^(s|sec)$/.test(unit) ? 1000 : /^(m|min)$/.test(unit) ? 60000 :
        /^(h|hr)$/.test(unit) ? 3600000 : /^(d|day)$/.test(unit) ? 86400000 : 604800000;
      return Date.now() - n * ms;
    }
    if (/\byesterday\b/.test(text)) return Date.now() - 86400000;
    return 0;
  }
  function engagement(card) {
    const text = (card.innerText || '').toLowerCase();
    let likes = Number(card.dataset.likes || card.dataset.likeCount || 0);
    let comments = Number(card.dataset.comments || card.dataset.commentCount || 0);
    const likeNode = card.querySelector('[data-like-count], .like-count, [aria-label*="like" i]');
    const commentNode = card.querySelector('[data-comment-count], .comment-count, [aria-label*="comment" i]');
    likes = Math.max(likes, Number(likeNode?.dataset.likeCount || parseInt(likeNode?.textContent || '', 10) || 0));
    comments = Math.max(comments, Number(commentNode?.dataset.commentCount || parseInt(commentNode?.textContent || '', 10) || 0));
    const numbers = text.match(/\b\d+(?:\.\d+)?\s*[km]?\b/g) || [];
    // Use visible engagement labels only as a fallback when structured counts are absent.
    if (!likes) {
      const m = text.match(/(\d+(?:\.\d+)?\s*[km]?)\s*(?:likes?|reactions?)\b/);
      if (m) likes = parseCount(m[1]);
    }
    if (!comments) {
      const m = text.match(/(\d+(?:\.\d+)?\s*[km]?)\s*comments?\b/);
      if (m) comments = parseCount(m[1]);
    }
    return Math.log1p(Math.max(0, likes)) * 1.1 + Math.log1p(Math.max(0, comments)) * 1.8;
  }
  function parseCount(value) {
    const m = String(value || '').trim().toLowerCase().match(/([\d.]+)\s*([km]?)/);
    if (!m) return 0;
    return Number(m[1]) * (m[2] === 'k' ? 1000 : m[2] === 'm' ? 1000000 : 1);
  }
  function score(card, now) {
    const id = postId(card);
    const author = authorId(card);
    const created = timestamp(card);
    const ageHours = created ? Math.max(0, (now - created) / 3600000) : 36;
    // Smooth recency decay: fresh posts get a chance, but strong conversations can last.
    const freshness = Math.exp(-ageHours / 30) * 5.2;
    const engagementScore = Math.min(5, engagement(card));
    const affinity = Number(state.authorSignals[author] || 0);
    const alreadySeen = id && state.seen[id] ? Math.min(2.4, (now - state.seen[id]) < 6 * 3600000 ? 1.6 : 0.5) : 0;
    const ownPost = author && author === currentKey() ? 0.25 : 0;
    return freshness + engagementScore + affinity + ownPost - alreadySeen;
  }
  function smartOrder(cards) {
    loadSignals();
    const now = Date.now();
    const remaining = cards.map((card, index) => ({ card, index, score: score(card, now), author: authorId(card) }));
    const ordered = [];
    const authorCounts = {};
    while (remaining.length) {
      remaining.sort((a,b) => b.score - a.score || a.index - b.index);
      let pickIndex = remaining.findIndex(item => !item.author || (authorCounts[item.author] || 0) < 2);
      if (pickIndex < 0) pickIndex = 0;
      const [picked] = remaining.splice(pickIndex, 1);
      ordered.push(picked.card);
      if (picked.author) authorCounts[picked.author] = (authorCounts[picked.author] || 0) + 1;
    }
    return ordered;
  }
  function rank() {
    scheduled = false;
    if (ranking) return;
    const feed = document.querySelector(feedSelector);
    if (!feed || !feed.isConnected) return;
    const cards = postCards(feed);
    if (cards.length < 2) return;
    const ordered = smartOrder(cards);
    if (ordered.every((card, i) => card === cards[i])) return;
    ranking = true;
    try {
      // Replace only the positions occupied by posts; lobbies/builds/clips keep their slots.
      const placeholders = cards.map(card => {
        const marker = document.createComment('codmpanda-smart-feed-slot');
        card.parentNode.insertBefore(marker, card);
        card.remove();
        return marker;
      });
      ordered.forEach((card, i) => placeholders[i].replaceWith(card));
    } catch (error) {
      console.warn('[CODMPanda Smart Feed] Could not reorder posts safely:', error);
    } finally {
      ranking = false;
    }
  }
  function scheduleRank() {
    if (scheduled || ranking) return;
    scheduled = true;
    setTimeout(rank, 90);
  }
  function recordInteraction(event) {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const card = target?.closest('.home-card[data-type="post"], .home-card[data-type="posts"], [data-feed-type="post"]');
    if (!card) return;
    loadSignals();
    const author = authorId(card);
    const id = postId(card);
    const label = ((target?.closest('button,[role="button"]')?.getAttribute('aria-label') || '') + ' ' +
      (target?.closest('button,[role="button"]')?.innerText || '')).toLowerCase();
    if (author && /like|react|comment|reply|share|save/.test(label)) {
      const weight = /comment|reply/.test(label) ? 1.5 : /share|save/.test(label) ? 1.8 : 1;
      state.authorSignals[author] = Math.max(-3, Math.min(8, Number(state.authorSignals[author] || 0) + weight));
      if (id) state.seen[id] = Date.now();
      saveSignals();
    }
    if (id) state.seen[id] = Date.now();
    saveSignals();
    scheduleRank();
  }
  document.addEventListener('click', recordInteraction, true);
  const observer = new MutationObserver(records => {
    if (ranking) return;
    if (records.some(record => record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length))) scheduleRank();
  });
  function start() {
    const feed = document.querySelector(feedSelector);
    if (feed && !feed.__cpSmartFeedObserved) {
      feed.__cpSmartFeedObserved = true;
      observer.observe(feed, { childList: true, subtree: true });
    }
    scheduleRank();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  // Watch for Home being replaced during tab changes without polling every second.
  const appObserver = new MutationObserver(records => {
    const feed = document.querySelector(feedSelector);
    if (!feed || feed.__cpSmartFeedObserved) return;
    const relevant = records.some(record => Array.from(record.addedNodes || []).some(node =>
      node.nodeType === 1 && (node.id === 'home-feed' || node.querySelector?.(feedSelector))
    ));
    if (relevant) start();
  });
  if (document.documentElement) appObserver.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('storage', event => {
    if (event.key && event.key.startsWith('cp_smart_feed_v1_')) {
      loadSignals();
      scheduleRank();
    }
  });
  window.__cpSmartFeedRank = scheduleRank;
})();
