/* ================================================
   GreenTrail Analytics Platform v3 — app.js
   Socket.io + REST API + Advanced Analytics
   ================================================ */

const API = 'http://localhost:3000/api';
let socket = null;
let overviewChartInstance = null;
let optDoughnutInstance   = null;
let forecastChartInstance = null;
let chartsBuilt = {};
let campaignStoreLocal = [];
let attributionModel   = 'linear';
let optSliderAlloc     = {};
let notifOpen          = false;

// ── Chart Defaults ────────────────────────────
Chart.defaults.color       = '#8ba99a';
Chart.defaults.borderColor = '#1a2e1e';
Chart.defaults.font.family = "'Inter', sans-serif";

const C = {
  green:'#4ade80', green2:'#22c55e', lime:'#a3e635', teal:'#34d399',
  blue:'#38bdf8', purple:'#c084fc', amber:'#f59e0b',
  red:'#f87171', muted:'#567060',
  palette:['#4ade80','#38bdf8','#c084fc','#f59e0b','#34d399','#f87171','#a3e635','#22c55e']
};

// ── Utilities ──────────────────────────────────
function fmt(n) {
  if (n == null) return '—';
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + 'Cr';
  if (n >= 100000)   return (n/100000).toFixed(1) + 'L';
  if (n >= 1000)     return (n/1000).toFixed(1) + 'K';
  return n.toLocaleString('en-IN');
}
function fmtMoney(n) {
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + 'Cr';
  if (n >= 100000)   return '₹' + (n/100000).toFixed(1) + 'L';
  if (n >= 1000)     return '₹' + (n/1000).toFixed(0) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}
function sign(n) { return n >= 0 ? '+' : ''; }
function deltaClass(v, low=false) { return low ? (v <= 0 ? 'up' : 'down') : (v >= 0 ? 'up' : 'down'); }

async function apiFetch(path, opts={}) {
  try {
    const r = await fetch(API + path, opts);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch (e) { console.warn('[API]', path, e.message); return null; }
}

// ── Toast ─────────────────────────────────────
function showToast(msg, type='info', dur=3200) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${{success:'✓',error:'✕',info:'ℹ'}[type]||'ℹ'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.cssText += 'opacity:0;transform:translateX(40px);transition:all .3s'; setTimeout(() => t.remove(), 320); }, dur);
}

// ── Navigation ────────────────────────────────
function setActive(el, section) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(section);
  if (target) target.classList.add('active');
  document.getElementById('bc-page').textContent = el.querySelector('span:last-child').textContent;
  window.scrollTo({ top:0, behavior:'smooth' });
  if (section === 'market'     && !chartsBuilt.market)      loadMarketSection();
  if (section === 'campaigns'  && !chartsBuilt.campaigns)   loadCampaignsSection();
  if (section === 'funnel'     && !chartsBuilt.funnel)      loadFunnelSection();
  if (section === 'predictive' && !chartsBuilt.predictive)  loadPredictiveSection();
  if (section === 'abtest'     && !chartsBuilt.abtest)      loadAbTestSection();
  if (section === 'optimizer'  && !chartsBuilt.optimizer)   loadOptimizerSection();
  if (section === 'retention'  && !chartsBuilt.retention)   loadRetentionSection();
  if (section === 'kpi'        && !chartsBuilt.kpi)         loadKpiSection();
  if (section === 'insights'   && !chartsBuilt.insights)    loadInsightsSection();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function toggleTheme() {
  const html = document.documentElement;
  const dark  = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', dark ? 'light' : 'dark');
  document.getElementById('theme-toggle').textContent = dark ? '🌙' : '☀️';
}

// ── Command Palette ───────────────────────────
const CMD_ITEMS = [
  { icon:'📊', text:'Overview',              sub:'Dashboard KPIs',              action:() => setActive(document.getElementById('nav-overview'),   'overview')   },
  { icon:'🔍', text:'Market Research',        sub:'Segments & competitors',      action:() => setActive(document.getElementById('nav-market'),     'market')     },
  { icon:'🎯', text:'Campaigns',              sub:'Performance & CRUD',          action:() => setActive(document.getElementById('nav-campaigns'),  'campaigns')  },
  { icon:'⬇️', text:'Funnel & Geography',    sub:'Conversion & regional data',  action:() => setActive(document.getElementById('nav-funnel'),     'funnel')     },
  { icon:'🔮', text:'Predictive Analytics',  sub:'Forecasting & anomalies',     action:() => setActive(document.getElementById('nav-predictive'), 'predictive') },
  { icon:'🧪', text:'A/B Tests & Attribution',sub:'Statistical testing',        action:() => setActive(document.getElementById('nav-abtest'),     'abtest')     },
  { icon:'⚙️', text:'Budget Optimizer',      sub:'AI budget allocation',        action:() => setActive(document.getElementById('nav-optimizer'),  'optimizer')  },
  { icon:'🔄', text:'Retention',             sub:'Cohorts & churn',             action:() => setActive(document.getElementById('nav-retention'),  'retention')  },
  { icon:'📈', text:'KPI Report',            sub:'Scorecard & trend',           action:() => setActive(document.getElementById('nav-kpi'),        'kpi')        },
  { icon:'💡', text:'AI Insights',           sub:'Strategic recommendations',   action:() => setActive(document.getElementById('nav-insights'),   'insights')   },
  { icon:'➕', text:'New Campaign',          sub:'Launch a campaign',           action:() => openCampaignModal() },
  { icon:'📤', text:'Export Data',           sub:'CSV, JSON, API',              action:() => openExportModal()  },
];

function openCmdPalette() {
  document.getElementById('cmd-overlay').classList.add('open');
  setTimeout(() => document.getElementById('cmd-input').focus(), 50);
  cmdSearch('');
}
function closeCmdPalette() {
  document.getElementById('cmd-overlay').classList.remove('open');
  document.getElementById('cmd-input').value = '';
}
function cmdSearch(q) {
  const container = document.getElementById('cmd-results');
  const filtered  = CMD_ITEMS.filter(i => !q || i.text.toLowerCase().includes(q.toLowerCase()) || i.sub.toLowerCase().includes(q.toLowerCase()));
  if (!filtered.length) { container.innerHTML = '<div class="cmd-section-label">No results</div>'; return; }
  container.innerHTML = `<div class="cmd-section-label">Navigate</div>` + filtered.map((item, i) => `
    <div class="cmd-item" onclick="cmdRun(${CMD_ITEMS.indexOf(item)})">
      <div class="cmd-item-icon">${item.icon}</div>
      <div style="flex:1">
        <div class="cmd-item-text">${item.text}</div>
        <div class="cmd-item-sub">${item.sub}</div>
      </div>
    </div>
  `).join('');
}
function cmdRun(i) { CMD_ITEMS[i].action(); closeCmdPalette(); }

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openCmdPalette(); }
  if (e.key === 'Escape') { closeCmdPalette(); closeDrawer(); }
});

// ── Notification Center ───────────────────────
async function loadNotifications() {
  const res = await apiFetch('/alerts/notifications?limit=5');
  if (!res) return;
  const count = res.unreadCount;
  const countEl = document.getElementById('notif-count');
  if (count > 0) { countEl.textContent = count; countEl.style.display = 'block'; }
  else countEl.style.display = 'none';

  const list = document.getElementById('notif-list');
  if (!res.data.length) { list.innerHTML = '<div class="table-loading">No notifications</div>'; return; }

  const severityIcon = { warning:'⚠️', success:'✅', info:'ℹ️', critical:'🚨' };
  list.innerHTML = res.data.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead('${n.id}')">
      <span class="notif-icon">${severityIcon[n.severity] || '🔔'}</span>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-text">${n.body}</div>
        <div class="notif-time">${new Date(n.timestamp).toLocaleString('en-IN', {hour12:true})}</div>
      </div>
    </div>
  `).join('');
}

function toggleNotifDropdown() {
  const bell = document.getElementById('notif-bell');
  bell.classList.toggle('open');
  notifOpen = bell.classList.contains('open');
}

async function markRead(id) {
  await apiFetch(`/alerts/notifications/${id}/read`, { method:'PUT' });
  loadNotifications();
}

async function markAllRead(e) {
  e.stopPropagation();
  await apiFetch('/alerts/notifications/read-all', { method:'PUT' });
  loadNotifications();
  showToast('All notifications marked as read', 'success');
}

document.addEventListener('click', e => {
  if (notifOpen && !e.target.closest('#notif-bell')) {
    document.getElementById('notif-bell').classList.remove('open');
    notifOpen = false;
  }
});

// ── Socket.io ─────────────────────────────────
const feedItems = [];
const MAX_FEED  = 5;

function initSocket() {
  socket = io('http://localhost:3000');
  const wsEl = document.getElementById('ws-status');

  socket.on('connect', () => {
    wsEl.textContent = '⬤ Live';
    wsEl.className   = 'ti-val ws-status connected';
    console.log('[Socket.io] Connected:', socket.id);
    socket.emit('join-room', 'dashboard');
  });

  socket.on('disconnect', () => {
    wsEl.textContent = '⬤ Offline';
    wsEl.className   = 'ti-val ws-status disconnected';
  });

  socket.on('connected', d => console.log('[Socket.io]', d.message));

  socket.on('kpi-update', kpi => {
    animateTicker('tk-users',   kpi.activeUsers.toLocaleString('en-IN'));
    animateTicker('tk-booked',  kpi.trailsBooked.toLocaleString('en-IN'));
    animateTicker('tk-revenue', fmtMoney(kpi.revenueToday));
    animateTicker('tk-session', kpi.avgSessionMin + ' min');
  });

  socket.on('live-event', data => addFeedItem(data));

  socket.on('analytics-pulse', data => {
    if (data.anomaliesAlert > 0) showToast('⚠️ Anomaly detected in KPI stream', 'error', 4000);
  });

  socket.on('predictive-churn-result', data => {
    document.getElementById('res-churn-pct').textContent = data.predictedChurn + '%';
    const retainedEl = document.getElementById('res-retained');
    if (retainedEl) retainedEl.textContent = data.retainedUsers.toLocaleString('en-IN');
    
    const impactEl = document.getElementById('res-impact');
    if (impactEl) {
      impactEl.textContent = (data.financialImpact >= 0 ? '+' : '-') + fmtMoney(Math.abs(data.financialImpact));
      impactEl.className = `orc-value ${data.financialImpact >= 0 ? 'text-green' : 'text-red'}`;
    }
    
    const badge = document.getElementById('churn-risk-badge');
    if (badge) {
      badge.textContent = data.riskCategory;
      badge.style.background = data.riskColor + '22';
      badge.style.color = data.riskColor;
    }
  });

  socket.on('predictive-acquisition-result', data => {
    const roiEl = document.getElementById('res-sim-roi');
    if (roiEl) roiEl.textContent = data.projectedROI + 'x';
    
    const cpaEl = document.getElementById('res-sim-cpa');
    if (cpaEl) cpaEl.textContent = '₹' + data.projectedCPA;
    
    const reachConvEl = document.getElementById('res-sim-reach-conv');
    if (reachConvEl) {
      reachConvEl.innerHTML = `
        <div style="font-size:16px;font-weight:700;color:var(--text-primary)">${fmt(data.reach)} <span style="font-size:10px;color:var(--text-muted)">reach</span></div>
        <div style="font-size:13px;font-weight:600;color:#38bdf8">${data.conversions.toLocaleString('en-IN')} <span style="font-size:9px;color:var(--text-muted)">conv.</span></div>
      `;
    }
    
    const profitEl = document.getElementById('res-sim-profit');
    if (profitEl) {
      profitEl.textContent = (data.netProfit >= 0 ? '+' : '-') + fmtMoney(Math.abs(data.netProfit));
      profitEl.className = `orc-value ${data.netProfit >= 0 ? 'text-green' : 'text-red'}`;
    }
  });
}

function animateTicker(id, val) {
  const el = document.getElementById(id);
  if (!el || el.textContent === val) return;
  el.style.transform = 'translateY(-4px)'; el.style.opacity = '0';
  setTimeout(() => { el.textContent = val; el.style.transform = 'translateY(0)'; el.style.opacity = '1'; }, 150);
}

function addFeedItem(data) {
  const container = document.getElementById('lf-items');
  if (!container) return;
  container.querySelectorAll('.lf-skeleton').forEach(s => s.remove());

  const item = document.createElement('div');
  item.className = 'lf-item';
  item.innerHTML = `<span class="lf-icon">${data.icon||'🔔'}</span><div class="lf-msg">${data.message}</div><span class="lf-val">${data.detail||''}</span>`;
  container.insertBefore(item, container.firstChild);

  const all = container.querySelectorAll('.lf-item');
  if (all.length > MAX_FEED) all[all.length-1].remove();

  const clientEl = document.getElementById('lf-clients');
  if (clientEl && data.kpis) clientEl.textContent = data.kpis.activeUsers + ' online';
}

// ── Overview ──────────────────────────────────
async function loadOverview() {
  const res = await apiFetch('/overview');
  if (!res || !res.success) { showToast('Backend offline', 'error'); return; }
  const { kpis, campaigns, timeSeries, liveKPIs } = res.data;

  document.querySelectorAll('.skeleton-card').forEach(e => e.classList.remove('skeleton-card'));

  function setKpi(id, val, did, dval, suf='', low=false) {
    const el = document.getElementById(id); if (el) el.textContent = val;
    const de = document.getElementById(did); if (!de) return;
    const cls = deltaClass(dval, low);
    de.className = `kpi-delta ${cls}`;
    de.textContent = (cls==='up'?'▲ ':'▼ ') + Math.abs(dval) + suf;
  }

  setKpi('ov-users', fmt(kpis.totalUsers.value),    'ov-users-d', kpis.totalUsers.change,    '% vs Q1');
  setKpi('ov-reach', fmt(kpis.campaignReach.value),  'ov-reach-d', kpis.campaignReach.change,  '% vs Q1');
  setKpi('ov-roi',   kpis.promoROI.value + '×',      'ov-roi-d',   kpis.promoROI.change,       '× vs Q1');
  setKpi('ov-ret',   kpis.retentionRate.value + '%', 'ov-ret-d',   kpis.retentionRate.change,  '% vs Q1');
  setKpi('ov-nps',   kpis.npsScore.value,            'ov-nps-d',   kpis.npsScore.change,        ' pts');
  setKpi('ov-rev',   fmtMoney(kpis.totalRevenue.value), 'ov-rev-d', kpis.totalRevenue.change,  '% vs Q1');

  document.getElementById('active-camp-count').textContent = campaigns.active;

  buildOverviewLine(timeSeries, 'all');
  loadChannelDoughnut();
  loadBubbleChart();
  drawGauges(kpis.npsScore.value, kpis.greenScore.value, kpis.retentionRate.value);

  animateTicker('tk-users',   liveKPIs.activeUsers.toLocaleString('en-IN'));
  animateTicker('tk-booked',  liveKPIs.trailsBooked.toLocaleString('en-IN'));
  animateTicker('tk-revenue', fmtMoney(liveKPIs.revenueToday));
  animateTicker('tk-session', liveKPIs.avgSessionMin + ' min');
}

// SVG Gauge
function drawGauge(canvasId, value, max, color, strokeColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 70, cy = 70, r = 52;
  const startAngle = Math.PI * 0.75;
  const endAngle   = Math.PI * 2.25;
  const valAngle   = startAngle + (value / max) * (endAngle - startAngle);

  ctx.clearRect(0, 0, 140, 140);

  // Track
  ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.stroke();

  // Value arc
  ctx.beginPath(); ctx.arc(cx, cy, r, startAngle, valAngle);
  ctx.strokeStyle = strokeColor || color; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.shadowBlur = 15; ctx.shadowColor = strokeColor || color;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawGauges(nps, green, ret) {
  drawGauge('gauge-nps',   nps,   100, '#4ade80', '#4ade80');
  drawGauge('gauge-green', green, 100, '#38bdf8', '#38bdf8');
  drawGauge('gauge-ret',   ret,   100, '#c084fc', '#c084fc');
  const gv = document.getElementById('gauge-green-val');
  if (gv) gv.textContent = green + '/100';
}

let overviewTimeSeries = null;
function buildOverviewLine(ts, mode) {
  overviewTimeSeries = ts;
  const ctx = document.getElementById('overviewLineChart');
  if (!ctx) return;
  if (overviewChartInstance) overviewChartInstance.destroy();
  const datasets = [];
  if (mode==='all'||mode==='users') datasets.push({ label:'Users', data:ts.userGrowth, borderColor:C.green, backgroundColor:'rgba(74,222,128,0.07)', fill:true, tension:0.4, pointRadius:4 });
  if (mode==='all'||mode==='reach') datasets.push({ label:'Reach (×100K)', data:ts.reachGrowth.map(v=>+(v/100000).toFixed(1)), borderColor:C.blue, backgroundColor:'rgba(56,189,248,0.05)', fill:true, tension:0.4, pointRadius:4 });
  if (mode==='all') datasets.push({ label:'Conversions (K)', data:ts.convGrowth.map(v=>+(v/1000).toFixed(1)), borderColor:C.purple, backgroundColor:'rgba(192,132,252,0.04)', fill:true, tension:0.4, pointRadius:4 });
  overviewChartInstance = new Chart(ctx, {
    type:'line', data:{ labels:ts.labels, datasets },
    options:{ responsive:true, plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ grid:{ color:'#1a2e1e' }, ticks:{ color:'#567060' } } } }
  });
}

function switchOverviewChart(el, mode) {
  document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if (overviewTimeSeries) buildOverviewLine(overviewTimeSeries, mode);
}

async function loadChannelDoughnut() {
  const res = await apiFetch('/campaigns/channels');
  if (!res) return;
  const labels = res.data.map(d => d.channel);
  const values = res.data.map(d => d.sharePct);
  const colors = C.palette.slice(0, labels.length);
  new Chart(document.getElementById('channelDoughnut'), {
    type:'doughnut',
    data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderWidth:2, borderColor:'#0f1a12', hoverOffset:8 }] },
    options:{ cutout:'65%', plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:ctx=>` ${ctx.label}: ${ctx.parsed}%` } } } }
  });
  document.getElementById('channelLegend').innerHTML = labels.map((l,i) => `<div class="dl-item"><div class="dl-dot" style="background:${colors[i]}"></div>${l}</div>`).join('');
}

async function loadBubbleChart() {
  const res = await apiFetch('/analytics/bubble');
  if (!res || !res.success) return;
  const channelColors = { 'Social Media':C.purple,'Influencer':C.green,'Email':C.blue,'Search':C.amber,'Referral':C.teal,'Display Ads':C.red,'Content':C.lime };
  const datasets = res.data.map(c => ({
    label: c.label.substring(0, 28),
    data: [{ x:c.x, y:c.y, r:Math.max(6, Math.min(c.r, 28)) }],
    backgroundColor: (channelColors[c.channel] || C.muted) + 'BB',
    borderColor: channelColors[c.channel] || C.muted
  }));
  new Chart(document.getElementById('bubbleChart'), {
    type:'bubble',
    data:{ datasets },
    options:{
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label} — CPA: ₹${ctx.raw.x} | ROI: ${ctx.raw.y}×` } } },
      scales:{
        x:{ title:{ display:true, text:'CPA (₹)', color:'#567060' }, grid:{ color:'#1a2e1e' }, ticks:{ color:'#567060' } },
        y:{ title:{ display:true, text:'ROI (×)', color:'#567060' }, grid:{ color:'#1a2e1e' }, ticks:{ color:'#567060' } }
      }
    }
  });
}

// ── Campaign Table ────────────────────────────
async function loadTable(params={}) {
  const q = new URLSearchParams(params).toString();
  const res = await apiFetch('/campaigns' + (q ? '?' + q : ''));
  if (!res || !res.success) return;
  campaignStoreLocal = res.data;
  renderTable(res.data);
  const footer = document.getElementById('table-footer');
  if (footer) footer.textContent = `Showing ${res.data.length} of ${res.summary.total} campaigns · Avg ROI: ${res.summary.avgROI}×`;
}

function badgeClass(ch) {
  return ({'Social Media':'social','Influencer':'influencer','Email':'email','Search':'search','Referral':'referral','Display Ads':'display','Content':'content'}[ch]||'content');
}

function renderTable(data) {
  const tbody = document.getElementById('promoTableBody');
  if (!tbody) return;
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="9" class="table-loading">No results</td></tr>'; return; }
  tbody.innerHTML = data.map(row => `
    <tr onclick="openDrawer('${row.id}')">
      <td style="color:var(--text-primary);font-weight:600;max-width:200px">${row.name}</td>
      <td><span class="camp-badge ${badgeClass(row.channel)}">${row.channel}</span></td>
      <td>${fmt(row.reach)}</td>
      <td>${fmt(row.conversions)}</td>
      <td>₹${row.cpa}</td>
      <td style="color:#4ade80;font-weight:700">${row.roi}×</td>
      <td>${(row.revenue/100000).toFixed(1)}L</td>
      <td><span class="status-badge ${row.status}">${row.status.charAt(0).toUpperCase()+row.status.slice(1)}</span></td>
      <td onclick="event.stopPropagation()">
        <button class="action-btn" onclick="pauseToggle('${row.id}','${row.status}')">${row.status==='paused'?'▶':'⏸'}</button>
      </td>
    </tr>
  `).join('');
}

function filterTable() {
  const params = {};
  const q = document.getElementById('promoSearch')?.value;        if (q) params.q = q;
  const ch = document.getElementById('channelFilter')?.value;     if (ch) params.channel = ch;
  const st = document.getElementById('statusFilter')?.value;      if (st) params.status = st;
  const so = document.getElementById('sortFilter')?.value;        if (so) params.sort = so;
  loadTable(params);
}

async function pauseToggle(id, cur) {
  const newStatus = cur === 'paused' ? 'active' : 'paused';
  await fetch(`${API}/campaigns/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status:newStatus }) });
  showToast(`Campaign ${newStatus}`, 'success');
  filterTable();
}

// ── Campaign Drawer ───────────────────────────
async function openDrawer(id) {
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer-body').innerHTML = '<div class="drawer-loading">Loading campaign data…</div>';
  const res = await apiFetch(`/campaigns/${id}`);
  if (!res || !res.success) { document.getElementById('drawer-body').innerHTML = '<div class="drawer-loading">Error loading campaign.</div>'; return; }
  const c = res.data;
  document.getElementById('drawer-title').textContent = c.name;
  document.getElementById('drawer-body').innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span class="camp-badge ${badgeClass(c.channel)}">${c.channel}</span>
      <span class="status-badge ${c.status}">${c.status}</span>
      <span style="font-size:11px;color:var(--text-muted)">${c.region}</span>
    </div>
    <div class="drawer-stat-grid">
      <div class="drawer-stat"><div class="ds-label">ROI</div><div class="ds-value" style="color:#4ade80">${c.roi}×</div></div>
      <div class="drawer-stat"><div class="ds-label">CPA</div><div class="ds-value">₹${c.cpa}</div></div>
      <div class="drawer-stat"><div class="ds-label">Reach</div><div class="ds-value">${fmt(c.reach)}</div></div>
      <div class="drawer-stat"><div class="ds-label">Conversions</div><div class="ds-value">${fmt(c.conversions)}</div></div>
      <div class="drawer-stat"><div class="ds-label">Revenue</div><div class="ds-value">${fmtMoney(c.revenue)}</div></div>
      <div class="drawer-stat"><div class="ds-label">Spend</div><div class="ds-value">${fmtMoney(c.spend)}</div></div>
    </div>
    <div style="font-size:11.5px;color:var(--text-muted);margin-top:4px">
      📅 ${c.startDate} → ${c.endDate || 'Ongoing'}<br/>
      🎯 Segment: ${c.targetSegment} · Creative: ${c.creativeType}
    </div>
    <div class="drawer-mini-chart">
      <canvas id="drawer-mini-chart-${id}" height="80"></canvas>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-ghost btn-sm" style="flex:1" onclick="pauseToggle('${c.id}','${c.status}');closeDrawer()">
        ${c.status==='paused'?'▶ Resume':'⏸ Pause'}
      </button>
      <button class="btn-primary btn-sm" style="flex:1" onclick="closeDrawer()">Close</button>
    </div>
  `;
  // Draw mini sparkline
  if (c.timeSeries) {
    new Chart(document.getElementById(`drawer-mini-chart-${id}`), {
      type:'line',
      data:{ labels:c.timeSeries.labels, datasets:[
        { label:'Conversions', data:c.timeSeries.conversions, borderColor:C.green, backgroundColor:'rgba(74,222,128,0.08)', fill:true, tension:0.4, pointRadius:3 },
        { label:'Revenue (K)', data:c.timeSeries.revenue.map(v=>+(v/1000).toFixed(0)), borderColor:C.blue, fill:false, tension:0.4, pointRadius:3 }
      ]},
      options:{ plugins:{ legend:{ labels:{ font:{size:10} } } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ grid:{ color:'#1a2e1e' } } } }
    });
  }
}

function closeDrawer() { document.getElementById('drawer-overlay').classList.remove('open'); }

// ── Market Section ────────────────────────────
async function loadMarketSection() {
  chartsBuilt.market = true;
  const res = await apiFetch('/market');
  if (!res) return;
  const { segments, motivators, competitors } = res.data;

  new Chart(document.getElementById('segmentPie'), {
    type:'pie', data:{ labels:segments.map(s=>s.label), datasets:[{ data:segments.map(s=>s.pct), backgroundColor:C.palette, borderWidth:2, borderColor:'#0f1a12' }] },
    options:{ plugins:{ legend:{ position:'right', labels:{ color:'#8ba99a', font:{size:11}, boxWidth:12 } } } }
  });
  new Chart(document.getElementById('motivatorBar'), {
    type:'bar', data:{ labels:motivators.map(m=>m.label), datasets:[{ label:'Score', data:motivators.map(m=>m.score), backgroundColor:C.palette, borderRadius:6 }] },
    options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ min:0,max:10, grid:{ color:'#1a2e1e' } } } }
  });
  new Chart(document.getElementById('marketShareBar'), {
    type:'bar', data:{ labels:competitors.map(c=>c.name), datasets:[{ label:'Market Share (%)', data:competitors.map(c=>c.share), backgroundColor:C.palette, borderRadius:6 }] },
    options:{ indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ max:40, grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>v+'%' } }, y:{ grid:{ display:false } } } }
  });
  new Chart(document.getElementById('funnelRadar'), {
    type:'radar',
    data:{ labels:['Brand Awareness','Trial','Satisfaction','Loyalty','Advocacy','Re-Engagement'],
      datasets:[
        { label:'GreenTrail', data:[88,62,79,71,67,58], borderColor:C.green, backgroundColor:'rgba(74,222,128,0.1)', pointBackgroundColor:C.green },
        { label:'Competitor Avg', data:[74,55,65,55,52,44], borderColor:C.blue, backgroundColor:'rgba(56,189,248,0.06)', pointBackgroundColor:C.blue }
      ]},
    options:{ plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ r:{ grid:{ color:'#1a2e1e' }, pointLabels:{ color:'#8ba99a', font:{size:9} }, ticks:{ display:false } } } }
  });
  document.getElementById('segment-detail-cards').innerHTML = segments.map((s,i) => `
    <div class="seg-card" style="--accent-color:${C.palette[i]}">
      <div class="seg-label">${s.label}</div>
      <div class="seg-pct" style="color:${C.palette[i]}">${s.pct}%</div>
      <div class="seg-meta">Avg Spend: ₹${s.avgSpend.toLocaleString('en-IN')}</div>
      <div class="seg-meta">Top Channel: ${s.topChannel}</div>
      <div class="seg-grow">+${s.growth}% QoQ</div>
    </div>`).join('');
}

// ── Campaigns Section ─────────────────────────
async function loadCampaignsSection() {
  chartsBuilt.campaigns = true;
  const res = await apiFetch('/campaigns');
  if (!res) return;
  const camps = res.data;
  new Chart(document.getElementById('spendRevenueBar'), {
    type:'bar',
    data:{ labels:camps.slice(0,6).map(c=>c.name.split('—')[0].substring(0,22)+'…'),
      datasets:[
        { label:'Spend (₹L)', data:camps.slice(0,6).map(c=>+(c.spend/100000).toFixed(1)), backgroundColor:'rgba(56,189,248,0.6)', borderRadius:5 },
        { label:'Revenue (₹L)', data:camps.slice(0,6).map(c=>+(c.revenue/100000).toFixed(1)), backgroundColor:'rgba(74,222,128,0.6)', borderRadius:5 }
      ]},
    options:{ plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ grid:{ color:'#1a2e1e' } } } }
  });
  new Chart(document.getElementById('ctrDoughnut'), {
    type:'doughnut',
    data:{ labels:['Video Reels','Static Image','Carousel','UGC Reposts','Text/Blog'], datasets:[{ data:[38,22,18,14,8], backgroundColor:C.palette, borderWidth:2, borderColor:'#0f1a12', hoverOffset:8 }] },
    options:{ cutout:'60%', plugins:{ legend:{ position:'right', labels:{ color:'#8ba99a', font:{size:11}, boxWidth:12 } } } }
  });
  document.getElementById('campaign-cards-grid').innerHTML = camps.map(c => `
    <div class="camp-card" onclick="openDrawer('${c.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <span class="camp-badge ${badgeClass(c.channel)}">${c.channel}</span>
        <span class="camp-roi-badge">${c.roi}× ROI</span>
      </div>
      <div class="camp-name">${c.name}</div>
      <div class="camp-stats">
        <div class="camp-stat"><div class="cs-val">${fmt(c.reach)}</div><div class="cs-lab">Reach</div></div>
        <div class="camp-stat"><div class="cs-val">${fmt(c.conversions)}</div><div class="cs-lab">Conv.</div></div>
        <div class="camp-stat"><div class="cs-val">₹${c.cpa}</div><div class="cs-lab">CPA</div></div>
      </div>
      <div class="camp-progress-bar"><div class="cpb-fill" style="width:${c.performance}%;background:${C.palette[camps.indexOf(c)%C.palette.length]}"></div></div>
      <div class="camp-footer">
        <span class="camp-status ${c.status==='active'?'success':c.status==='paused'?'warning':'ended'}">● ${c.status} · ${c.region}</span>
        <span style="font-size:10px;color:var(--text-muted)">${c.startDate}</span>
      </div>
    </div>`).join('');
}

// ── Funnel & Geo ──────────────────────────────
async function loadFunnelSection() {
  chartsBuilt.funnel = true;
  const [fRes, gRes, cRes] = await Promise.all([apiFetch('/market/funnel'), apiFetch('/market/geography'), apiFetch('/campaigns')]);
  if (fRes?.success) {
    const maxU = fRes.data[0].users;
    document.getElementById('funnel-container').innerHTML = fRes.data.map((s, i) => `
      <div class="funnel-stage">
        <div class="funnel-stage-name">${s.stage}</div>
        <div class="funnel-bar-wrap"><div class="funnel-bar" style="width:${(s.users/maxU*100).toFixed(0)}%;background:${s.color};opacity:${0.6+i*0.07}"><span class="funnel-bar-label">${(s.users/maxU*100).toFixed(1)}%</span></div></div>
        <div class="funnel-stage-val">${fmt(s.users)}</div>
        <div class="funnel-drop">${i>0?'-'+s.dropOff+'%':''}</div>
      </div>`).join('');
  }
  if (cRes?.success) {
    const channels = [...new Set(cRes.data.map(c=>c.channel))];
    const roiData  = channels.map(ch => +(cRes.data.filter(c=>c.channel===ch).reduce((s,c)=>s+c.roi,0)/cRes.data.filter(c=>c.channel===ch).length).toFixed(1));
    new Chart(document.getElementById('spendRadar'), {
      type:'radar', data:{ labels:channels, datasets:[{ label:'Avg ROI', data:roiData, borderColor:C.green, backgroundColor:'rgba(74,222,128,0.1)', pointBackgroundColor:C.green }] },
      options:{ plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ r:{ grid:{ color:'#1a2e1e' }, pointLabels:{ color:'#8ba99a', font:{size:9} }, ticks:{ display:false } } } }
    });
  }
  if (gRes?.success) {
    const maxB = Math.max(...gRes.data.map(r=>r.bookings));
    document.getElementById('geo-cards-grid').innerHTML = gRes.data.map(r => `
      <div class="geo-card">
        <div class="geo-region">🗺️ ${r.region}</div>
        <div class="geo-bookings">${r.bookings.toLocaleString('en-IN')}</div>
        <div class="geo-meta"><span>bookings</span><span class="geo-growth">+${r.growth}%</span></div>
        <div class="geo-top">🏆 ${r.topTrail}</div>
        <div class="geo-meta"><span>${fmtMoney(r.revenue)}</span><span>${r.sharePct}% share</span></div>
        <div class="geo-bar"><div class="geo-bar-fill" style="width:${(r.bookings/maxB*100).toFixed(0)}%"></div></div>
      </div>`).join('');
  }
}

// ── Predictive Analytics ──────────────────────
async function loadPredictiveSection(metric='roi') {
  chartsBuilt.predictive = true;
  const [fRes, lRes, aRes, hmRes, crRes] = await Promise.all([
    apiFetch('/analytics/forecast?metric=' + metric + '&quarters=6'),
    apiFetch('/analytics/ltv'),
    apiFetch('/analytics/anomalies'),
    apiFetch('/analytics/heatmap'),
    apiFetch('/analytics/cohort-revenue')
  ]);

  // Forecast chart with confidence band
  if (fRes?.success) {
    const hist = fRes.historical;
    const fore = fRes.forecast;
    const allLabels = [...hist.labels, ...fore.labels];
    const histLen   = hist.values.length;
    const preds     = fore.predictions || fore.values || [];
    const vals      = [...hist.values, ...preds.map(p => p.value)];
    const upperBand = [...Array(histLen).fill(null), ...preds.map(p => p.upper)];
    const lowerBand = [...Array(histLen).fill(null), ...preds.map(p => p.lower)];

    const ctx = document.getElementById('forecastChart');
    if (forecastChartInstance) forecastChartInstance.destroy();
    forecastChartInstance = new Chart(ctx, {
      type:'line',
      data:{ labels:allLabels, datasets:[
        { label:'Historical', data:[...hist.values,...Array(fore.labels.length).fill(null)], borderColor:C.green, backgroundColor:'rgba(74,222,128,0.08)', fill:true, tension:0.4, pointRadius:4, borderWidth:2 },
        { label:'Forecast', data:[...Array(histLen).fill(null),...preds.map(p=>p.value)], borderColor:C.blue, borderDash:[5,4], backgroundColor:'rgba(56,189,248,0.04)', fill:true, tension:0.4, pointRadius:4, borderWidth:2 },
        { label:'Upper Band', data:upperBand, borderColor:'transparent', backgroundColor:'rgba(56,189,248,0.08)', fill:'+1', tension:0.4, pointRadius:0, borderWidth:0 },
        { label:'Lower Band', data:lowerBand, borderColor:'transparent', backgroundColor:'rgba(56,189,248,0.08)', fill:false, tension:0.4, pointRadius:0, borderWidth:0 }
      ]},
      options:{ plugins:{ legend:{ labels:{ filter:i=>i.text!=='Lower Band'&&i.text!=='Upper Band', color:'#8ba99a', font:{size:11} } } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ grid:{ color:'#1a2e1e' }, ticks:{ color:'#567060' } } } }
    });
    const meta = document.getElementById('forecast-meta');
    meta.innerHTML = `
      <span class="forecast-tag">Trend: ${fore.trend}</span>
      <span class="forecast-tag ${fore.trendStrength==='strong'?'':'muted'}">Strength: ${fore.trendStrength}</span>
      <span class="forecast-tag muted">Slope: ${fore.slope} per quarter</span>
    `;
  }

  // LTV chart
  if (lRes?.success) {
    const tiers = lRes.data.tiers.sort((a,b)=>b.ltv-a.ltv);
    new Chart(document.getElementById('ltvChart'), {
      type:'bar', data:{ labels:tiers.map(t=>t.tier), datasets:[{ label:'Lifetime Value (₹)', data:tiers.map(t=>t.ltv), backgroundColor:tiers.map((_,i)=>C.palette[i]), borderRadius:6 }] },
      options:{ indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>'₹'+Math.round(v/1000)+'K' } }, y:{ grid:{ display:false } } } }
    });
  }

  // Anomaly cards
  if (aRes?.success) {
    document.getElementById('anomaly-cards').innerHTML = aRes.data.map(a => {
      const barPct = Math.min(100, a.zScore / 3 * 100);
      const barColor = a.severity==='critical'?C.red:a.severity==='warning'?C.amber:C.green;
      return `
        <div class="anomaly-card ${a.severity}">
          <div class="ac-top">
            <div class="ac-metric">${a.metric}</div>
            <span class="ac-badge ${a.severity}">${a.severity}</span>
          </div>
          <div><span class="ac-val">${a.latest}</span><span class="ac-unit"> ${a.unit}</span></div>
          <div class="ac-bar"><div class="ac-bar-fill" style="width:${barPct}%;background:${barColor}"></div></div>
          <div class="ac-meta">
            <span class="ac-z">z=${a.zScore}</span>
            <span class="${a.direction==='up'?'ac-trend-up':'ac-trend-down'}">${a.direction==='up'?'↑':' ↓'} ${Math.abs(a.trend)} ${a.unit}</span>
          </div>
        </div>`;
    }).join('');
  }

  // Heatmap
  if (hmRes?.success) buildHeatmap(hmRes.data, hmRes.meta);

  // Cohort revenue
  if (crRes?.success) {
    new Chart(document.getElementById('cohortRevenueChart'), {
      type:'bar', data:{ labels:crRes.labels, datasets:crRes.data.map(t=>({ label:t.tier, data:t.monthly, backgroundColor:t.color+'AA', borderColor:t.color, borderRadius:4 })) },
      options:{ plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:10} } } }, scales:{ x:{ stacked:true, grid:{ color:'#1a2e1e' } }, y:{ stacked:true, grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>'₹'+v+'L' } } } }
    });
  }

  // Run initial ML Sandbox simulations
  simulateChurn();
  simulateAcquisition();
}

function buildHeatmap(data, meta) {
  const container = document.getElementById('heatmap-container');
  const maxV = meta.maxValue;
  const hours = [0,3,6,9,12,15,18,21];
  let html = `<div class="heatmap-hours">${hours.map(h=>`<span class="heatmap-hour-label" style="margin-left:${h===0?0:''}">${h}h</span>`).join('')}</div>`;
  data.forEach(d => {
    html += `<div class="heatmap-row"><div class="heatmap-day">${d.day}</div>`;
    d.hours.forEach(h => {
      const intensity = h.value / maxV;
      const alpha     = Math.max(0.04, intensity);
      const color     = intensity > 0.7 ? `rgba(74,222,128,${alpha})` : intensity > 0.4 ? `rgba(56,189,248,${alpha})` : `rgba(74,222,128,${alpha * 0.5})`;
      html += `<div class="heatmap-cell" style="background:${color}" title="${d.day} ${h.hour}h: ${h.value} bookings"></div>`;
    });
    html += '</div>';
  });
  html += `<div class="heatmap-legend"><span>Low</span><div class="hm-leg-bar">${['0.1','0.3','0.5','0.7','0.9'].map(a=>`<div class="hm-leg-cell" style="background:rgba(74,222,128,${a})"></div>`).join('')}</div><span>High</span></div>`;
  container.innerHTML = html;
}

function switchForecast(el, metric) {
  document.querySelectorAll('#predictive .chart-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  chartsBuilt.predictive = false;
  loadPredictiveSection(metric);
}

// ── A/B Tests & Attribution ───────────────────
async function loadAbTestSection() {
  chartsBuilt.abtest = true;
  const [abtRes, attrRes] = await Promise.all([apiFetch('/abtests'), apiFetch('/analytics/attribution?model=linear')]);

  // A/B Test cards
  if (abtRes?.success) {
    const sigColors = { high:'#4ade80', medium:'#f59e0b', low:'#f87171' };
    document.getElementById('abtest-grid').innerHTML = abtRes.data.map(t => `
      <div class="abtest-card">
        <div class="abt-header">
          <span class="abt-status ${t.status}">${t.status === 'running' ? '● Running' : '✓ Done'}</span>
          <span class="abt-channel">${t.channel}</span>
        </div>
        <div class="abt-name">${t.name}</div>
        <div class="abt-hypothesis">"${t.hypothesis}"</div>
        <div class="abt-variants">
          <div class="abt-variant ${t.stats.winner==='A'?'winner':''}">
            <div class="av-label">Variant A</div>
            <div class="av-name">${t.variants.A.name}</div>
            <div class="av-ctr">${t.variants.A.ctr}% CTR</div>
            <div class="av-convs">${t.variants.A.conversions.toLocaleString('en-IN')} conv.</div>
            ${t.stats.winner==='A'?'<span class="av-winner">🏆 Winner</span>':''}
          </div>
          <div class="abt-variant ${t.stats.winner==='B'?'winner':''}">
            <div class="av-label">Variant B</div>
            <div class="av-name">${t.variants.B.name}</div>
            <div class="av-ctr">${t.variants.B.ctr}% CTR</div>
            <div class="av-convs">${t.variants.B.conversions.toLocaleString('en-IN')} conv.</div>
            ${t.stats.winner==='B'?'<span class="av-winner">🏆 Winner</span>':''}
          </div>
        </div>
        <div class="abt-footer">
          <span class="abt-lift">+${t.stats.lift}% lift</span>
          <span class="abt-sig ${t.stats.significance}" style="color:${sigColors[t.stats.significance]}">● ${t.stats.confidence}% confidence</span>
        </div>
        <div class="abt-insight">${t.insight}</div>
      </div>`).join('');

    // Lift bar chart
    new Chart(document.getElementById('abtestLiftBar'), {
      type:'bar',
      data:{ labels:abtRes.data.map(t=>t.name.substring(0,22)+'…'), datasets:[{ label:'Conversion Lift (%)', data:abtRes.data.map(t=>t.stats.lift), backgroundColor:abtRes.data.map(t=>t.stats.significance==='high'?'rgba(74,222,128,0.7)':t.stats.significance==='medium'?'rgba(245,158,11,0.7)':'rgba(248,113,113,0.7)'), borderRadius:6 }] },
      options:{ plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>v+'%' } } } }
    });
  }

  // Attribution
  if (attrRes?.success) buildAttributionChart(attrRes.data);
}

function buildAttributionChart(data) {
  const ctx = document.getElementById('attributionBar');
  if (!ctx) return;
  if (ctx._chartInstance) ctx._chartInstance.destroy();
  ctx._chartInstance = new Chart(ctx, {
    type:'bar',
    data:{ labels:data.map(d=>d.channel), datasets:[{ label:'Attribution Credit (%)', data:data.map(d=>d.credit), backgroundColor:C.palette.slice(0,data.length), borderRadius:6 }] },
    options:{ indexAxis:'y', plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:ctx=>`${ctx.parsed.x}% → ${fmtMoney(data[ctx.dataIndex].revenue)}` } } }, scales:{ x:{ grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>v+'%' } }, y:{ grid:{ display:false } } } }
  });
}

async function switchAttribution(el, model) {
  document.querySelectorAll('#abtest .chart-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  attributionModel = model;
  const res = await apiFetch(`/analytics/attribution?model=${model}`);
  if (res?.success) { buildAttributionChart(res.data); showToast(`Attribution: ${model.replace('_',' ')} model`, 'info'); }
}

// ── Budget Optimizer ──────────────────────────
const OPT_CHANNELS = ['Influencer','Social Media','Referral','Email','Search','Content','Display Ads'];
const CHANNEL_COLORS_MAP = { 'Influencer':C.green,'Social Media':C.purple,'Referral':C.teal,'Email':C.blue,'Search':C.amber,'Content':C.lime,'Display Ads':C.red };

async function loadOptimizerSection() {
  chartsBuilt.optimizer = true;
  const [scRes, optRes] = await Promise.all([apiFetch('/optimizer/scenarios'), apiFetch('/optimizer/budget')]);

  // Scenario cards
  if (scRes?.success) {
    document.getElementById('scenario-cards').innerHTML = scRes.data.map(s => `
      <div class="scenario-card" style="--scenario-color:${s.color}" onclick="applyScenario(${JSON.stringify(s.mix).replace(/"/g,"'")})">
        <div class="sc-name">${s.name}</div>
        <div class="sc-desc">${s.description}</div>
        <div class="sc-roi" style="color:${s.color}">${s.projectedROI}× ROI</div>
        <span class="sc-risk ${s.risk}">${s.risk} risk</span>
      </div>`).join('');
  }

  // Init sliders with current allocation
  const currentAlloc = { 'Influencer':35,'Social Media':25,'Search':15,'Email':10,'Content':8,'Referral':7,'Display Ads':0 };
  OPT_CHANNELS.forEach(ch => { optSliderAlloc[ch] = currentAlloc[ch] || 0; });
  buildSliders();
  updateOptimizerResults();

  // Compare chart
  if (optRes?.success) buildCompareChart(optRes);
}

function buildSliders() {
  document.getElementById('opt-sliders').innerHTML = OPT_CHANNELS.map(ch => `
    <div class="opt-slider-row">
      <div class="opt-slider-label">
        <span class="opt-slider-name"><span style="color:${CHANNEL_COLORS_MAP[ch]}">●</span> ${ch}</span>
        <span class="opt-slider-pct" id="opt-pct-${ch.replace(/\s/g,'-')}">${optSliderAlloc[ch]}%</span>
      </div>
      <input type="range" class="opt-slider" min="0" max="60" value="${optSliderAlloc[ch]}" oninput="onSliderChange('${ch}',this.value)" style="accent-color:${CHANNEL_COLORS_MAP[ch]}" />
      <div class="opt-slider-amt" id="opt-amt-${ch.replace(/\s/g,'-')}"></div>
    </div>`).join('');
  updateSliderAmts();
}

function onSliderChange(ch, val) {
  optSliderAlloc[ch] = parseInt(val);
  document.getElementById(`opt-pct-${ch.replace(/\s/g,'-')}`).textContent = val + '%';
  updateSliderAmts();
  updateOptimizerResults();
  if (socket?.connected) {
    const budget = parseInt(document.getElementById('opt-total-budget').value) || 5420000;
    const allocs = OPT_CHANNELS.filter(c => optSliderAlloc[c] > 0).map(c => ({ channel:c, pct:optSliderAlloc[c] }));
    socket.emit('optimizer-simulate', { allocations:allocs, totalBudget:budget });
  }
}

function updateSliderAmts() {
  const budget = parseInt(document.getElementById('opt-total-budget').value) || 5420000;
  OPT_CHANNELS.forEach(ch => {
    const el = document.getElementById(`opt-amt-${ch.replace(/\s/g,'-')}`);
    if (el) el.textContent = fmtMoney(Math.round((optSliderAlloc[ch]/100) * budget));
  });
}

async function updateOptimizerResults() {
  const budget = parseInt(document.getElementById('opt-total-budget').value) || 5420000;
  const allocs = OPT_CHANNELS.filter(ch => optSliderAlloc[ch] > 0).map(ch => ({ channel:ch, pct:optSliderAlloc[ch] }));
  if (!allocs.length) return;

  const res = await apiFetch('/optimizer/simulate', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ allocations:allocs, totalBudget:budget })
  });
  if (!res?.success) return;
  const s = res.summary;
  document.getElementById('opt-proj-roi').textContent  = s.weightedROI + '×';
  document.getElementById('opt-proj-rev').textContent  = fmtMoney(s.totalRevenue);
  document.getElementById('opt-proj-conv').textContent = s.totalConversions.toLocaleString('en-IN');
  document.getElementById('opt-proj-cpa').textContent  = '₹' + s.blendedCPA;

  // Doughnut
  if (optDoughnutInstance) optDoughnutInstance.destroy();
  const labels = allocs.map(a => a.channel);
  const values = allocs.map(a => a.pct);
  const colors = labels.map(l => CHANNEL_COLORS_MAP[l] || C.muted);
  optDoughnutInstance = new Chart(document.getElementById('opt-doughnut'), {
    type:'doughnut', data:{ labels, datasets:[{ data:values, backgroundColor:colors, borderWidth:2, borderColor:'#0f1a12', hoverOffset:6 }] },
    options:{ cutout:'60%', plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:ctx=>` ${ctx.label}: ${ctx.parsed}%` } } } }
  });
  document.getElementById('opt-legend').innerHTML = labels.map((l,i)=>`<div class="dl-item"><div class="dl-dot" style="background:${colors[i]}"></div>${l}</div>`).join('');
}

function recalcOptimizer() { updateSliderAmts(); updateOptimizerResults(); }
function resetSliders() { OPT_CHANNELS.forEach(ch => optSliderAlloc[ch] = 0); buildSliders(); updateOptimizerResults(); }

async function getOptimalAllocation() {
  showToast('🤖 Computing optimal allocation…', 'info', 2000);
  const budget = parseInt(document.getElementById('opt-total-budget').value) || 5420000;
  const res = await apiFetch(`/optimizer/budget?total=${budget}`);
  if (!res?.success) return;
  OPT_CHANNELS.forEach(ch => { optSliderAlloc[ch] = 0; });
  res.optimized.allocations.forEach(a => { if (OPT_CHANNELS.includes(a.channel)) optSliderAlloc[a.channel] = a.pct; });
  buildSliders();
  updateOptimizerResults();
  showToast(`✨ AI optimized — projected ROI: ${res.optimized.projectedROI}×`, 'success');
}

function applyScenario(mixStr) {
  OPT_CHANNELS.forEach(ch => { optSliderAlloc[ch] = 0; });
  const mix = JSON.parse(mixStr.replace(/'/g, '"'));
  mix.forEach(m => { optSliderAlloc[m.channel] = m.pct; });
  buildSliders();
  updateOptimizerResults();
  showToast('Scenario applied!', 'success');
}

function buildCompareChart(optRes) {
  const current  = optRes.current.allocations.map(a => a.pct);
  const optimized= optRes.optimized.allocations.map(a => a.pct);
  const labels   = optRes.current.allocations.map(a => a.channel);
  new Chart(document.getElementById('opt-compare-bar'), {
    type:'bar',
    data:{ labels, datasets:[
      { label:'Current (%)', data:current, backgroundColor:'rgba(86,112,96,0.4)', borderRadius:4 },
      { label:'AI Optimized (%)', data:optimized.slice(0,labels.length), backgroundColor:'rgba(74,222,128,0.6)', borderRadius:4 }
    ]},
    options:{ plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>v+'%' } } } }
  });
}

// ── Retention ──────────────────────────────────
async function loadRetentionSection() {
  chartsBuilt.retention = true;
  const res = await apiFetch('/retention');
  if (!res?.success) return;
  const { cohorts, loyaltyTiers, churnReasons, reEngagementStats } = res.data;
  const cohortKeys = Object.keys(cohorts);
  const colors = [C.green,C.blue,C.purple,C.amber,C.teal];
  new Chart(document.getElementById('retentionLine'), {
    type:'line', data:{ labels:['Jan','Feb','Mar','Apr','May','Jun'], datasets:cohortKeys.map((k,i)=>({ label:cohorts[k].label, data:cohorts[k].monthly, borderColor:colors[i], tension:0.4, fill:false, pointRadius:4 })) },
    options:{ plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ min:0,max:100, grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>v+'%' } } } }
  });
  new Chart(document.getElementById('churnDoughnut'), {
    type:'doughnut', data:{ labels:churnReasons.map(r=>r.reason), datasets:[{ data:churnReasons.map(r=>r.pct), backgroundColor:churnReasons.map(r=>r.color), borderWidth:2, borderColor:'#0f1a12', hoverOffset:8 }] },
    options:{ cutout:'60%', plugins:{ legend:{ position:'right', labels:{ color:'#8ba99a', font:{size:11}, boxWidth:12 } } } }
  });
  new Chart(document.getElementById('churnBarH'), {
    type:'bar', data:{ labels:churnReasons.map(r=>r.reason), datasets:[{ label:'Churn %', data:churnReasons.map(r=>r.pct), backgroundColor:churnReasons.map(r=>r.color), borderRadius:5 }] },
    options:{ indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ max:35, grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>v+'%' } }, y:{ grid:{ display:false } } } }
  });
  document.getElementById('loyalty-bars').innerHTML = loyaltyTiers.map(t => `
    <div class="lb-row">
      <div class="lb-label">${t.tier}</div>
      <div class="lb-track"><div class="lb-fill" style="width:${t.pct}%;background:${t.color}"></div></div>
      <div class="lb-right"><div class="lb-val">${t.pct}%</div><div class="lb-count">${t.count.toLocaleString('en-IN')}</div></div>
    </div>`).join('');
  const s = reEngagementStats;
  document.getElementById('reengagement-stats').innerHTML = [
    { label:'Lapsed Users', value:s.lapsedUsers.toLocaleString('en-IN') },
    { label:'Re-Activated', value:s.reActivated.toLocaleString('en-IN') },
    { label:'Re-Activation Rate', value:s.reActivationRate+'%' },
    { label:'Avg Days Lapsed', value:s.avgDaysLapsed+' days' },
    { label:'Top Channel', value:s.topReEngagementChannel }
  ].map(r=>`<div class="stat-row"><span class="stat-label">${r.label}</span><span class="stat-value">${r.value}</span></div>`).join('');
}

// ── KPI Section ────────────────────────────────
async function loadKpiSection(quarter='Q2-2026') {
  chartsBuilt.kpi = true;
  const [kRes, tRes] = await Promise.all([apiFetch(`/kpis?quarter=${quarter}`), apiFetch('/kpis/trend')]);
  if (!kRes?.success) return;
  const { scorecard, data:q2 } = kRes;
  const banner = document.getElementById('comparison-banner');
  banner.innerHTML = [
    { label:'Total Users', value:fmt(q2.totalUsers), change:'+12.4%' },
    { label:'Campaign Reach', value:fmt(q2.campaignReach), change:'+28.4%' },
    { label:'Promo ROI', value:q2.promoROI+'×', change:'+0.6×' },
    { label:'Retention Rate', value:q2.retentionRate+'%', change:'+4.2%' },
    { label:'NPS Score', value:q2.npsScore, change:'+5 pts' },
    { label:'Green Score', value:q2.greenScore+'/100', change:'+3 pts' },
  ].map(i=>`<div class="cb-item"><div class="cb-label">${i.label}</div><div class="cb-value">${i.value}</div><div class="cb-change up">${i.change} QoQ</div></div>`).join('');

  document.getElementById('kpi-scorecard-body').innerHTML = scorecard.map(row => {
    const v = parseFloat(row.variance); const c = parseFloat(row.pctChange);
    const bc = row.status==='achieved'?'green':row.status==='near'?'amber':'red';
    const bt = row.status==='achieved'?'✓ Achieved':row.status==='near'?'⚡ Near':'✗ Miss';
    return `<tr><td style="color:var(--text-primary);font-weight:500">${row.kpi}</td><td>${row.prev??'—'}${row.unit}</td><td>${row.target??'—'}${row.unit}</td><td style="color:#e8f5ec;font-weight:600">${row.actual}${row.unit}</td><td class="${v>=0?(row.lowerIsBetter?'delta-down':'delta-up'):(row.lowerIsBetter?'delta-up':'delta-down')}">${row.variance!=null?(v>=0?'+':'')+row.variance+'%':'—'}</td><td class="${c>=0?(row.lowerIsBetter?'delta-down':'delta-up'):(row.lowerIsBetter?'delta-up':'delta-down')}">${row.pctChange!=null?(c>=0?'+':'')+row.pctChange+'%':'—'}</td><td><span class="badge ${bc}">${bt}</span></td></tr>`;
  }).join('');

  new Chart(document.getElementById('kpiBarH'), {
    type:'bar', data:{ labels:scorecard.slice(0,7).map(r=>r.kpi),
      datasets:[
        { label:'Target', data:scorecard.slice(0,7).map(r=>r.target), backgroundColor:'rgba(86,112,96,0.35)', borderRadius:4 },
        { label:'Actual', data:scorecard.slice(0,7).map(r=>r.actual), backgroundColor:'rgba(74,222,128,0.7)', borderRadius:4 }
      ]},
    options:{ indexAxis:'y', plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ grid:{ display:false } } } }
  });

  if (tRes?.success) {
    const t = tRes.data;
    new Chart(document.getElementById('kpiTrend'), {
      type:'line', data:{ labels:t.labels, datasets:[
        { label:'NPS', data:t.npsScore, borderColor:C.green, tension:0.4, fill:false, pointRadius:5 },
        { label:'Retention %', data:t.retentionRate, borderColor:C.blue, tension:0.4, fill:false, pointRadius:5 },
        { label:'ROI ×', data:t.promoROI, borderColor:C.amber, tension:0.4, fill:false, pointRadius:5 }
      ]},
      options:{ plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ grid:{ color:'#1a2e1e' } } } }
    });
  }
}

// ── Insights Section ──────────────────────────
async function loadInsightsSection() {
  chartsBuilt.insights = true;
  const [iRes, tRes] = await Promise.all([apiFetch('/insights'), apiFetch('/kpis/trend')]);
  document.getElementById('insights-ts').textContent = new Date().toLocaleString('en-IN', { hour12:true });

  if (iRes?.success) {
    document.getElementById('insights-grid').innerHTML = iRes.data.map((ins,i) => `
      <div class="priority-card p${i+1}">
        <div class="priority-meta"><div class="priority-label">Priority ${ins.priority}</div><div class="confidence-badge">${ins.confidence}% conf.</div></div>
        <div class="priority-title">${ins.icon} ${ins.title}</div>
        <div class="priority-body">${ins.body}</div>
        <div class="priority-footer"><div class="priority-impact">${ins.impact}</div><div class="priority-metric">${ins.metric.label}: ${ins.metric.value}</div></div>
      </div>`).join('');
  }

  const budgetLabels = ['Influencer (35%)','Social Ads (25%)','Search (15%)','Email (10%)','Content (8%)','Events (7%)'];
  const budgetVals   = [35,25,15,10,8,7];
  new Chart(document.getElementById('budgetDoughnut'), {
    type:'doughnut', data:{ labels:budgetLabels, datasets:[{ data:budgetVals, backgroundColor:C.palette, borderWidth:2, borderColor:'#0f1a12', hoverOffset:10 }] },
    options:{ cutout:'55%', plugins:{ legend:{ display:false } } }
  });
  document.getElementById('budgetLegend').innerHTML = budgetLabels.map((l,i)=>`<div class="dl-item"><div class="dl-dot" style="background:${C.palette[i]}"></div>${l}</div>`).join('');

  if (tRes?.success) {
    const t = tRes.data;
    new Chart(document.getElementById('revTrendLine'), {
      type:'line', data:{ labels:t.labels, datasets:[
        { label:'Revenue (₹L)', data:t.totalRevenue.map(v=>+(v/100000).toFixed(0)), borderColor:C.green, backgroundColor:'rgba(74,222,128,0.07)', fill:true, tension:0.4, pointRadius:5 },
        { label:'Spend (₹L)',   data:[35,38.6,45.6,54.2], borderColor:C.blue, backgroundColor:'rgba(56,189,248,0.04)', fill:true, tension:0.4, pointRadius:5 }
      ]},
      options:{ plugins:{ legend:{ labels:{ color:'#8ba99a', font:{size:11} } } }, scales:{ x:{ grid:{ color:'#1a2e1e' } }, y:{ grid:{ color:'#1a2e1e' }, ticks:{ callback:v=>'₹'+v+'L' } } } }
    });
  }
}

// ── Quarter & Quarter Change ───────────────────
async function onQuarterChange(quarter) {
  chartsBuilt.kpi = false;
  loadKpiSection(quarter);
  showToast(`Loaded ${quarter}`, 'success');
}

// ── Modals ────────────────────────────────────
function openCampaignModal()         { document.getElementById('campaign-modal').classList.add('open'); document.getElementById('form-start').value = new Date().toISOString().split('T')[0]; }
function closeCampaignModal(e)       { if (!e || e.target === document.getElementById('campaign-modal')) { document.getElementById('campaign-modal').classList.remove('open'); document.getElementById('campaign-form').reset(); } }
function openExportModal()           { document.getElementById('export-modal').classList.add('open'); }
function closeExportModal(e)         { if (!e || e.target === document.getElementById('export-modal')) document.getElementById('export-modal').classList.remove('open'); }

async function submitCampaign(e) {
  e.preventDefault();
  const payload = {
    name:          document.getElementById('form-name').value,
    channel:       document.getElementById('form-channel').value,
    budget:        document.getElementById('form-budget').value,
    targetSegment: document.getElementById('form-segment').value,
    creativeType:  document.getElementById('form-creative').value,
    region:        document.getElementById('form-region').value || 'Pan India',
    startDate:     document.getElementById('form-start').value,
    endDate:       document.getElementById('form-end').value,
  };
  const r = await fetch(`${API}/campaigns`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  const res = await r.json();
  if (res.success) { showToast('🚀 Campaign launched!', 'success'); closeCampaignModal(); loadTable(); }
  else showToast(res.message || 'Error creating campaign', 'error');
}

function doExport(type) {
  const map = { csv:'/export/csv', report:'/export/report', 'kpi-csv':'/export/kpi-csv' };
  if (!map[type]) return;
  const a = document.createElement('a'); a.href = API + map[type]; a.download = ''; a.click();
  showToast('Download started', 'success'); closeExportModal();
}

function copyApiEndpoints() {
  const text = ['GET /api/analytics/forecast?metric=roi\nGET /api/analytics/attribution?model=linear\nGET /api/analytics/ltv\nGET /api/analytics/heatmap\nGET /api/analytics/anomalies\nGET /api/abtests\nGET /api/optimizer/budget\nPOST /api/optimizer/simulate\nWS  /socket.io (bidirectional)'].join('');
  navigator.clipboard.writeText(text).then(() => { showToast('Endpoints copied!', 'info'); closeExportModal(); });
}

// ── Scroll Top ────────────────────────────────
window.addEventListener('scroll', () => {
  const btn = document.getElementById('scrollTop');
  btn.classList.toggle('visible', window.scrollY > 200);
});

// Socket: optimizer result handler
if (typeof io !== 'undefined') {
  // Handled below in initSocket already, but add here for safety
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSocket();
  await loadOverview();
  loadTable();
  loadNotifications();

  const health = await apiFetch('/health');
  if (health) {
    showToast('🌿 GreenTrail Analytics Engine v3 Online', 'success');
    console.log('[v3] Features:', health.features.join(', '));
    console.log('[v3] Connected clients:', health.connectedClients);
  } else {
    showToast('⚠️ Backend offline', 'error');
  }
});

/* ─── Predictive ML Sandbox Simulators ─── */
async function simulateChurn() {
  const supportSLA = document.getElementById('input-sla').value;
  const promoDiscount = document.getElementById('input-discount').value;
  const npsScore = document.getElementById('input-nps').value;
  const loyaltyMultiplier = document.getElementById('input-multiplier').value;

  document.getElementById('val-sla').textContent = supportSLA + 'h';
  document.getElementById('val-discount').textContent = promoDiscount + '%';
  document.getElementById('val-nps').textContent = npsScore;
  document.getElementById('val-multiplier').textContent = loyaltyMultiplier + 'x';

  const payload = { supportSLA: parseFloat(supportSLA), promoDiscount: parseFloat(promoDiscount), npsScore: parseFloat(npsScore), loyaltyMultiplier: parseFloat(loyaltyMultiplier) };

  if (socket && socket.connected) {
    socket.emit('predictive-churn-simulate', payload);
  } else {
    // REST fallback
    const res = await apiFetch('/analytics/simulate-churn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res && res.success) {
      document.getElementById('res-churn-pct').textContent = res.predictedChurn + '%';
      const retainedEl = document.getElementById('res-retained');
      if (retainedEl) retainedEl.textContent = res.retainedUsers.toLocaleString('en-IN');
      
      const impactEl = document.getElementById('res-impact');
      if (impactEl) {
        impactEl.textContent = (res.financialImpact >= 0 ? '+' : '-') + fmtMoney(Math.abs(res.financialImpact));
        impactEl.className = `orc-value ${res.financialImpact >= 0 ? 'text-green' : 'text-red'}`;
      }
      
      const badge = document.getElementById('churn-risk-badge');
      if (badge) {
        badge.textContent = res.riskCategory;
        badge.style.background = res.riskColor + '22';
        badge.style.color = res.riskColor;
      }
    }
  }
}

async function simulateAcquisition() {
  const channel = document.getElementById('sim-channel').value;
  const spend = document.getElementById('input-sim-spend').value;

  document.getElementById('val-sim-spend').textContent = fmtMoney(parseInt(spend));

  const payload = { channel, spend: parseFloat(spend) };

  if (socket && socket.connected) {
    socket.emit('predictive-acquisition-simulate', payload);
  } else {
    // REST fallback
    const res = await apiFetch('/analytics/simulate-acquisition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res && res.success) {
      document.getElementById('res-sim-roi').textContent = res.projectedROI + 'x';
      document.getElementById('res-sim-cpa').textContent = '₹' + res.projectedCPA;
      
      document.getElementById('res-sim-reach-conv').innerHTML = `
        <div style="font-size:16px;font-weight:700;color:var(--text-primary)">${fmt(res.reach)} <span style="font-size:10px;color:var(--text-muted)">reach</span></div>
        <div style="font-size:13px;font-weight:600;color:#38bdf8">${res.conversions.toLocaleString('en-IN')} <span style="font-size:9px;color:var(--text-muted)">conv.</span></div>
      `;
      
      const profitEl = document.getElementById('res-sim-profit');
      if (profitEl) {
        profitEl.textContent = (res.netProfit >= 0 ? '+' : '-') + fmtMoney(Math.abs(res.netProfit));
        profitEl.className = `orc-value ${res.netProfit >= 0 ? 'text-green' : 'text-red'}`;
      }
    }
  }
}
