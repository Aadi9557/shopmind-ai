// ─────────────────────────────────────────────────────
//  Search.js — Product search + results rendering
// ─────────────────────────────────────────────────────

const API_BASE = '/api';
let currentSessionId = localStorage.getItem('shopmind_session') || null;
let isSearching = false;

// ── SEARCH PRODUCTS ──────────────────────────────────
async function searchProducts(query, language = 'en') {
  const token = await getToken();
  if (!token) { window.location.href = '/'; return; }

  const response = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, language, session_id: currentSessionId })
  });

  const data = await response.json();

  if (response.status === 403 && data.error === 'limit_reached') {
    return { success: false, error: 'limit_reached', message: data.message, upgrade_url: data.upgrade_url };
  }

  if (!response.ok) throw new Error(data.error || 'Search failed');

  if (data.session_id) {
    currentSessionId = data.session_id;
    localStorage.setItem('shopmind_session', currentSessionId);
  }

  return data;
}

// ── START NEW CHAT SESSION ───────────────────────────
function startNewSession() {
  currentSessionId = null;
  localStorage.removeItem('shopmind_session');
}

// ── ESCAPE HTML ──────────────────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── RENDER PRODUCT CARD ──────────────────────────────
function renderProductCard(product, index) {
  const rankClass = ['rank-1','rank-2','rank-3','rank-n','rank-n'][index] || 'rank-n';
  const rankLabel = ['#1','#2','#3','#4','#5'][index] || `#${index+1}`;

  const sc = product.scores || {};
  const scoreRows = [
    ['Value',       sc.value       || 0],
    ['Performance', sc.performance || 0],
    ['Reviews',     sc.reviews     || 0],
    ['Brand',       sc.brand       || 0],
    ['Warranty',    sc.warranty    || 0],
    ['Delivery',    sc.delivery    || 0]
  ].map(([label, val]) => `
    <div class="score-row">
      <span class="score-label">${label}</span>
      <div class="score-track"><div class="score-fill" style="width:${(val/10)*100}%"></div></div>
      <span class="score-val">${Number(val).toFixed(1)}</span>
    </div>`).join('');

  const specs = (product.specs || []).map(s => `<span class="tag tag-spec">${esc(s)}</span>`).join('');
  const pros  = (product.pros  || []).map(p => `<span class="tag tag-pro">✓ ${esc(p)}</span>`).join('');
  const cons  = (product.cons  || []).map(c => `<span class="tag tag-con">✗ ${esc(c)}</span>`).join('');

  // ── BUY LINKS — all go to price-filtered search pages ──
  let buyLinksHTML = '';
  if (product.buy_links?.length) {
    buyLinksHTML = product.buy_links.slice(0, 3).map((link, i) => {
      const safeUrl      = link.url || '#';
      const safePlatform = esc(link.platform || '');
      const safePrice    = link.price ? esc(link.price) : '';
      const tooltip      = safePrice
        ? `See all similar products around ${safePrice} on ${safePlatform}`
        : `Browse ${safePlatform}`;
      return `<a class="link-buy ${i === 0 ? 'link-buy-primary' : 'link-buy-secondary'}"
           href="${safeUrl}" target="_blank" rel="noopener noreferrer"
           title="${tooltip}"
           onclick="event.stopPropagation();trackBuyClick('${safePlatform}','${esc(product.name||'')}','')">
          🛍️ ${safePlatform}${safePrice ? ` <span style="opacity:0.85;font-size:11px;font-weight:600">${safePrice}</span>` : ''}
        </a>`;
    }).join('');
  } else {
    const name = encodeURIComponent(product.name || '');
    buyLinksHTML = `
      <a class="link-buy link-buy-primary" href="https://www.amazon.in/s?k=${name}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
        🛍️ Amazon India
      </a>
      <a class="link-buy link-buy-secondary" href="https://www.flipkart.com/search?q=${name}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
        🛍️ Flipkart
      </a>`;
  }

  // Review links
  let reviewLinksHTML = '';
  if (product.review_links?.length) {
    reviewLinksHTML = `
      <div class="link-section-label">Expert Reviews</div>
      <div class="links-row">
        ${product.review_links.slice(0, 2).map(r => `
          <a class="link-review" href="${r.url || '#'}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">
            📰 ${esc(r.source || '')}
            ${r.rating ? `<span style="opacity:0.6">${esc(r.rating)}</span>` : ''}
            ${r.trusted ? '<span style="color:var(--emerald);font-size:9px">✓</span>' : ''}
          </a>`).join('')}
      </div>`;
  }

  const officialLink = product.official_site
    ? `<a class="link-official" href="${product.official_site}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">🏭 Official Site</a>`
    : '';

  return `
    <div class="product-card card card-hover anim-fade-up" style="animation-delay:${index * 0.08}s">
      <div class="product-card-header">
        <div class="rank ${rankClass}">${rankLabel}</div>
        <div class="product-card-title">
          <div class="product-name">${esc(product.name || '')}</div>
          <div class="product-brand">${esc(product.brand || '')}
            ${product.badge ? `<span class="badge badge-saffron">${esc(product.badge)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="product-price">
        <span class="price-main display">${esc(product.best_price || 'N/A')}</span>
        ${product.price_range ? `<span class="price-range">${esc(product.price_range)}</span>` : ''}
        <span class="price-platform">on ${esc(product.best_platform || 'Online')}</span>
      </div>
      ${specs ? `<div class="specs-row">${specs}</div>` : ''}
      <div class="scores-section">${scoreRows}</div>
      <div class="badge badge-saffron overall-score">⭐ ${Number(product.overall_score || 0).toFixed(1)} / 10</div>
      ${pros || cons ? `<div class="pros-cons">${pros ? `<div class="tags-row">${pros}</div>` : ''}${cons ? `<div class="tags-row">${cons}</div>` : ''}</div>` : ''}
      ${product.summary ? `<p class="product-summary">${esc(product.summary)}</p>` : ''}
      ${product.why_ranked_here ? `
        <div style="padding:8px 12px;background:rgba(255,153,51,0.05);border-left:3px solid rgba(255,153,51,0.3);border-radius:0 6px 6px 0;font-size:11.5px;color:var(--mist);line-height:1.6">
          💡 ${esc(product.why_ranked_here)}
        </div>` : ''}
      ${product.warranty ? `<div class="product-warranty">🛡️ ${esc(product.warranty)}</div>` : ''}
      <div class="buy-section">
        <div class="link-section-label">Shop On</div>
        <div class="links-row">${buyLinksHTML}</div>
        ${reviewLinksHTML}
        ${officialLink}
        <div style="display:flex;gap:8px;margin-top:6px">
          <button class="link-review"
            onclick="addToWatchlist('${esc(product.name||'')}','${esc(product.best_price||'')}','${esc(product.best_platform||'')}','${product.buy_links?.[0]?.url||''}')"
            style="cursor:pointer;border:none">
            🔔 Watch Price
          </button>
        </div>
      </div>
    </div>`;
}

// ── RENDER FULL RESULTS ──────────────────────────────
function renderResults(data) {
  const cards = (data.products || []).map((p, i) => renderProductCard(p, i)).join('');
  const cachedBadge   = data.cached      ? `<span class="badge badge-green">⚡ Instant result</span>` : '';
  const personalBadge = data.personalized ? `<span class="badge badge-blue" style="background:rgba(99,102,241,0.1);color:#6366f1;border-color:rgba(99,102,241,0.2)">👤 Personalized</span>` : '';

  const topPick = data.top_pick ? `
    <div class="top-pick-banner">
      <div class="label">🏆 Our Top Pick</div>
      <div class="top-pick-name">${esc(data.top_pick)}</div>
      <p class="top-pick-reason">${esc(data.top_pick_reason || '')}</p>
    </div>` : '';

  const insight = data.price_insight ? `
    <div class="insight-banner"><span>💡</span><span>${esc(data.price_insight)}</span></div>` : '';

  const sources = (data.sources_searched || []);
  const sourcesHTML = sources.length ? `
    <div class="sources-section">
      <div class="label" style="margin-bottom:8px">Sources Verified</div>
      <div class="sources-list">
        ${sources.map(s => `<span class="tag tag-spec">${esc(s)}</span>`).join('')}
        ${data.trusted_sources_used ? `<span class="badge badge-green">✓ ${data.trusted_sources_used} trusted</span>` : ''}
        ${data.fake_sites_ignored ? `<span class="badge badge-red">✗ ${data.fake_sites_ignored} ignored</span>` : ''}
      </div>
    </div>` : '';

  return `
    <div class="results-wrap anim-fade-in">
      <div class="results-header">
        <div class="results-title display">${esc(data.query_understood || 'Search Results')}</div>
        <div class="results-meta">
          <span class="badge badge-saffron">${data.products?.length || 0} products found</span>
          ${data.trusted_sources_used ? `<span class="badge badge-green">✓ ${data.trusted_sources_used} trusted sources</span>` : ''}
          ${cachedBadge}${personalBadge}
        </div>
      </div>
      ${data.search_summary ? `<p class="search-summary">${esc(data.search_summary)}</p>` : ''}
      <div class="products-grid">${cards}</div>
      ${topPick}${insight}${sourcesHTML}
    </div>`;
}

// ── SHOW TYPING INDICATOR ────────────────────────────
function showTyping(container) {
  const div = document.createElement('div');
  div.id = 'typing-indicator';
  div.className = 'msg msg-ai anim-fade-up';
  div.innerHTML = `
    <div class="msg-avatar ai-avatar">🛍️</div>
    <div class="msg-bubble ai-bubble">
      <div class="typing"><span></span><span></span><span></span></div>
      <div class="typing-text mono">Searching across the entire internet...</div>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

// ── SHOW TOAST ───────────────────────────────────────
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'💡'}</span><span>${esc(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── EVENT TRACKING ───────────────────────────────────
async function trackEvent(eventType, data = {}) {
  try {
    const token = await getToken();
    if (!token) return;
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ event_type: eventType, ...data })
    });
  } catch {}
}

function trackBuyClick(platform, productName, query) {
  trackEvent('buy_click', { platform, product_name: productName, query });
}

// ── WATCHLIST ────────────────────────────────────────
async function addToWatchlist(productName, bestPrice, platform, buyUrl) {
  try {
    const token = await getToken();
    if (!token) return;
    const numPrice = parseInt(String(bestPrice || '').replace(/[^0-9]/g, '')) || 0;
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        product_name:  productName,
        target_price:  Math.round(numPrice * 0.9),
        current_price: numPrice,
        platform,
        buy_url:       buyUrl
      })
    });
    const data = await res.json();
    if (data.error === 'pro_required') {
      showToast('⭐ Pro feature — Upgrade for ₹99/month!', 'info');
      setTimeout(() => window.location.href = '/pricing', 1500);
      return;
    }
    if (data.success) showToast(data.already_exists ? 'Already in watchlist!' : '🔔 Added to watchlist!', 'success');
  } catch { showToast('Could not add to watchlist', 'error'); }
}
