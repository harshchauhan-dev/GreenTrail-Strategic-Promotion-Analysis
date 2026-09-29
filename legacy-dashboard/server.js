/**
 * GreenTrail Analytics — Node.js Backend Server
 * Express REST API + WebSocket Live Data + AI Insights Engine + Data Simulation
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db/database');

const PORT = 3001;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===== WEBSOCKET CLIENT MANAGER =====
const clients = new Map(); // id -> ws
let clientCount = 0;

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);
  clientCount++;

  // Send initial full snapshot
  const snapshot = db.getLatestKPISnapshot();
  ws.send(JSON.stringify({ type: 'init', data: { kpi: snapshot, events: db.getRecentEvents(20), insights: db.getInsights(10) }, clientId }));

  ws.on('close', () => { clients.delete(clientId); clientCount--; });
  ws.on('error', () => { clients.delete(clientId); });
});

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

// ===== LIVE DATA CONSTANTS =====
const PARTNER_COMPANIES = [
  { id: 'trailmasters_india', name: 'TrailMasters India', icon: '🏔️', color: '#4ade80' },
  { id: 'ecoroutes_network',  name: 'EcoRoutes Network',  icon: '🌿', color: '#34d399' },
  { id: 'wildexplore',        name: 'WildExplore',        icon: '🦅', color: '#38bdf8' },
  { id: 'naturehub',          name: 'NatureHub',           icon: '🌳', color: '#a3e635' },
  { id: 'adventureco',        name: 'AdventureCo',         icon: '⛺', color: '#f59e0b' },
  { id: 'summit_travels',     name: 'Summit Travels',      icon: '🏕️', color: '#c084fc' },
  { id: 'trailblazers_co',    name: 'TrailBlazers Co.',    icon: '🔥', color: '#f87171' },
];

const EVENT_TYPES = [
  { type: 'booking',         label: 'New Booking',          icon: '🎫', valueRange: [800, 9500]  },
  { type: 'signup',          label: 'User Signup',           icon: '👤', valueRange: [0, 0]       },
  { type: 'campaign_click',  label: 'Campaign Click',        icon: '🖱️', valueRange: [0, 0]       },
  { type: 'review',          label: '5-Star Review',         icon: '⭐', valueRange: [0, 0]       },
  { type: 'referral',        label: 'Referral Converted',    icon: '🔄', valueRange: [300, 1200]  },
  { type: 'trail_completed', label: 'Trail Completed',       icon: '✅', valueRange: [0, 0]       },
  { type: 'loyalty_upgrade', label: 'Loyalty Tier Upgrade',  icon: '🏆', valueRange: [0, 0]       },
  { type: 'package_sale',    label: 'Package Sold',          icon: '📦', valueRange: [2000,15000] },
];

const LOCATIONS = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Jaipur', 'Shimla', 'Manali', 'Rishikesh', 'Coorg', 'Ooty'];
const TRAILS    = ['Western Ghats Trek', 'Roopkund Trail', 'Valley of Flowers', 'Kedarkantha Peak', 'Triund Trek', 'Chopta Chandrashila', 'Hampta Pass', 'Bali Pass', 'Sandakphu Trek', 'Brahmatal Trail'];

// ===== LIVE EVENT GENERATOR =====
function generateLiveEvent() {
  const company = PARTNER_COMPANIES[Math.floor(Math.random() * PARTNER_COMPANIES.length)];
  const evtType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const [minV, maxV] = evtType.valueRange;
  const amount = minV > 0 ? Math.floor(Math.random() * (maxV - minV) + minV) : 0;

  const event = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    company: company.name, companyId: company.id, companyIcon: company.icon, companyColor: company.color,
    type: evtType.type, label: evtType.label, icon: evtType.icon,
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    trail: TRAILS[Math.floor(Math.random() * TRAILS.length)],
    amount, userId: `USR${String(Math.floor(Math.random() * 99999)).padStart(5,'0')}`,
  };

  db.insertLiveEvent(event);
  return event;
}

// ===== KPI UPDATE GENERATOR =====
let kpiState = {
  totalUsers:84320, campaignReach:2400000, promoROI:3.8,
  retentionRate:71.3, npsScore:67, greenScore:88,
  activeUsers:623, liveBookings:28, cpa:812,
  emailOpenRate:34.2, revenueToday:182400
};

function generateKPIUpdate() {
  const prev = kpiState;
  const updated = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    totalUsers:    prev.totalUsers    + Math.floor(Math.random() * 8),
    campaignReach: prev.campaignReach + Math.floor(Math.random() * 3000),
    promoROI:      parseFloat(Math.min(6.5, Math.max(3.0, prev.promoROI + (Math.random()*0.04-0.02))).toFixed(2)),
    retentionRate: parseFloat(Math.min(85, Math.max(60, prev.retentionRate + (Math.random()*0.2-0.1))).toFixed(1)),
    npsScore:      Math.min(85, Math.max(55, prev.npsScore + (Math.random() > 0.7 ? 1 : 0))),
    greenScore:    prev.greenScore || 88,
    activeUsers:   Math.floor(Math.random() * 600) + 300,
    liveBookings:  Math.floor(Math.random() * 60) + 15,
    cpa:           Math.max(680, Math.min(950, (prev.cpa||812) + Math.floor(Math.random()*10-5))),
    emailOpenRate: parseFloat(Math.min(42, Math.max(28, (prev.emailOpenRate||34.2) + (Math.random()*0.3-0.15))).toFixed(1)),
    revenueToday:  (prev.revenueToday||182400) + Math.floor(Math.random() * 4000),
  };
  db.insertKPISnapshot(updated);
  kpiState = updated;
  return updated;
}

// ===== AI INSIGHT ENGINE =====
const INSIGHT_POOL = [
  (k,p) => ({ type:'opportunity', priority:'high',   metric:'roi',          change: k.promoROI-p.promoROI,    msg:`Promo ROI trending to ${k.promoROI}× — influencer content is the top driver. Recommend 20% budget increase.` }),
  (k,p) => ({ type:'trend',       priority:'high',   metric:'totalUsers',   change: k.totalUsers-p.totalUsers, msg:`+${k.totalUsers-p.totalUsers} new users in last 10 min. Viral organic traction detected — pin top-performing trail.` }),
  (k,p) => ({ type:'warning',     priority:'high',   metric:'retentionRate',change: k.retentionRate-p.retentionRate, msg:`Retention at ${k.retentionRate}% — ${k.retentionRate < p.retentionRate ? '⚠️ dip detected. Trigger win-back push now.' : '✅ holding strong. Sustain with loyalty nudges.'}` }),
  (k)   => ({ type:'anomaly',     priority:'medium', metric:'activeUsers',  change: null, msg:`${k.activeUsers} users active simultaneously — peak concurrent usage. Ensure trail booking capacity is not throttled.` }),
  (k)   => ({ type:'prediction',  priority:'medium', metric:'campaignReach',change: null, msg:`At current pace, Q3 campaign reach will exceed 3.2M — 28% above target. Allocate surplus budget to micro-influencers.` }),
  (k)   => ({ type:'achievement', priority:'low',    metric:'npsScore',     change: null, msg:`NPS at ${k.npsScore} — excellent. Capture testimonials from top-rated reviewers for social proof ads.` }),
  (k)   => ({ type:'recommendation',priority:'medium',metric:'cpa',         change: null, msg:`CPA at ₹${k.cpa} — near target. Pause low-performing Google Ad groups and shift spend to referral channel (₹280 CPA).` }),
];

function generateAIInsight() {
  const history = db.getKPIHistory(3);
  const current = history[0] || kpiState;
  const previous = history[1] || current;
  const fnPool = INSIGHT_POOL;
  const fn = fnPool[Math.floor(Math.random() * fnPool.length)];
  const raw = fn(current, previous);
  return { id: uuidv4(), timestamp: new Date().toISOString(), ...raw };
}

// Simulation loops are started inside db.ready() at the bottom of this file.

// ===== REST API ROUTES =====

// Overview
app.get('/api/overview', (req, res) => {
  res.json({
    kpi: db.getLatestKPISnapshot(),
    recentEvents: db.getRecentEvents(8),
    campaignStats: db.getCampaignStats(),
    channelAttribution: db.getChannelAttribution(),
  });
});

// Campaigns CRUD
app.get('/api/campaigns', (req, res) => res.json(db.getCampaigns()));

app.get('/api/campaigns/:id', (req, res) => {
  const c = db.getCampaignById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

app.post('/api/campaigns', (req, res) => {
  const campaign = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.insertCampaign(campaign);
  broadcast({ type: 'new_campaign', data: campaign });
  res.status(201).json(campaign);
});

// Market Research
app.get('/api/market', (req, res) => {
  res.json({
    segments: db.getSegments(),
    motivators: db.getMotivators(),
    marketShare: db.getMarketShare(),
    funnel: db.getFunnel(),
  });
});

// Retention
app.get('/api/retention', (req, res) => {
  res.json({
    cohorts: db.getCohorts(),
    churnReasons: db.getChurnReasons(),
    loyaltyTiers: db.getLoyaltyTiers(),
  });
});

// KPI
app.get('/api/kpi', (req, res) => {
  res.json({
    scorecard: db.getKPIScorecard(),
    history: db.getKPIHistory(6),
    trend: db.getKPITrend(),
    latest: db.getLatestKPISnapshot(),
  });
});

app.get('/api/kpi/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  res.json(db.getKPIHistory(limit));
});

// AI Insights
app.get('/api/insights', (req, res) => res.json(db.getInsights(30)));

// Generate insight on demand
app.post('/api/insights/generate', (req, res) => {
  const insight = generateAIInsight();
  db.insertAIInsight(insight);
  broadcast({ type: 'ai_insight', data: insight });
  res.json(insight);
});

// Live Feed
app.get('/api/livefeed', (req, res) => {
  res.json({
    events: db.getRecentEvents(60),
    companies: PARTNER_COMPANIES,
    stats: db.getLiveFeedStats(),
  });
});

// Companies
app.get('/api/companies', (req, res) => {
  const comps = db.getCompanies();
  const enriched = comps.map(c => ({
    ...c,
    eventsLive: db.getCompanyEventCount(c.id.replace(/\s+/g,'_').toLowerCase()),
  }));
  res.json(enriched);
});

// Server health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), clients: clients.size, ts: new Date().toISOString() });
});

// Start — wait for DB then launch everything
db.ready().then(() => {
  // Sync kpiState from DB now that it's ready
  const saved = db.getLatestKPISnapshot();
  if (saved) kpiState = saved;

  // Start simulation loops
  function scheduleNextEvent() {
    const delay = Math.random() * 5000 + 4000;
    setTimeout(() => {
      const event = generateLiveEvent();
      broadcast({ type: 'live_event', data: event });
      scheduleNextEvent();
    }, delay);
  }
  scheduleNextEvent();

  setInterval(() => {
    const kpi = generateKPIUpdate();
    broadcast({ type: 'kpi_update', data: kpi });
  }, 8000);

  function scheduleNextInsight() {
    const delay = Math.random() * 15000 + 20000;
    setTimeout(() => {
      const insight = generateAIInsight();
      db.insertAIInsight(insight);
      broadcast({ type: 'ai_insight', data: insight });
      scheduleNextInsight();
    }, delay);
  }
  scheduleNextInsight();

  setInterval(() => {
    broadcast({ type: 'ping', connectedClients: clients.size, ts: new Date().toISOString() });
  }, 30000);

  // Start HTTP server
  server.listen(PORT, () => {
    console.log(`\n🌿 GreenTrail Analytics v2.0 — LIVE`);
    console.log(`   🌐  http://localhost:${PORT}`);
    console.log(`   🔌  WebSocket: ws://localhost:${PORT}`);
    console.log(`   💾  SQLite database active (sql.js)`);
    console.log(`   🤖  AI Insights engine running`);
    console.log(`   📡  Live data simulation active\n`);
  });
});
