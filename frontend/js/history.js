// ─────────────────────────────────────────────────────
//  History.js — Search History Functions
// ─────────────────────────────────────────────────────

const API_BASE_HIST = '/api';

// ── FETCH ALL HISTORY ────────────────────────────────
async function fetchHistory() {
  const token = await getToken();
  if (!token) { window.location.href = '/'; return []; }

  const response = await fetch(`${API_BASE_HIST}/history`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch history');
  return data.chats || [];
}

// ── FETCH SINGLE CHAT ────────────────────────────────
async function fetchChat(id) {
  const token = await getToken();
  const response = await fetch(`${API_BASE_HIST}/history/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch chat');
  return data.chat;
}

// ── DELETE ALL HISTORY ───────────────────────────────
async function clearAllHistory() {
  const token = await getToken();
  const response = await fetch(`${API_BASE_HIST}/history`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to clear history');
  return true;
}

// ── DELETE SINGLE CHAT ───────────────────────────────
async function deleteChat(id) {
  const token = await getToken();
  const response = await fetch(`${API_BASE_HIST}/history/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete chat');
  return true;
}

// ── TIME AGO ─────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

// ── RENDER HISTORY LIST ITEM ─────────────────────────
function renderHistoryItem(chat) {
  return `
    <div class="history-item card card-hover" data-id="${esc(chat.id)}" onclick="viewChat('${esc(chat.id)}')">
      <div class="history-item-icon">🔍</div>
      <div class="history-item-content">
        <div class="history-item-query">${esc(chat.query)}</div>
        <div class="history-item-time mono">${timeAgo(chat.created_at)}</div>
      </div>
      <button class="btn btn-icon btn-ghost btn-sm hide-on-hover-parent" onclick="event.stopPropagation(); deleteSingleChat('${esc(chat.id)}')" title="Delete">🗑️</button>
    </div>`;
}

// ── RENDER MINI PRODUCT CARD (for history view) ──────
function renderMiniCard(product, index) {
  const rankClass = ['rank-1','rank-2','rank-3','rank-n'][index] || 'rank-n';
  const rankLabel = ['#1','#2','#3','#4'][index] || `#${index+1}`;

  const buyLink = product.buy_links?.[0];

  return `
    <div class="mini-card card">
      <div class="mini-card-header">
        <div class="rank ${rankClass}">${rankLabel}</div>
        <div>
          <div class="mini-card-name">${esc(product.name || '')}</div>
          <div class="mini-card-brand">${esc(product.brand || '')}</div>
        </div>
        <div class="mini-card-price display">${esc(product.best_price || 'N/A')}</div>
      </div>
      <div class="badge badge-saffron" style="width:fit-content">
        ⭐ ${Number(product.overall_score || 0).toFixed(1)}/10
      </div>
      ${buyLink ? `
        <a class="link-buy link-buy-primary" style="width:fit-content"
           href="${esc(buyLink.url)}" target="_blank" rel="noopener">
          🛒 ${esc(buyLink.platform)}
        </a>` : ''}
    </div>`;
}
