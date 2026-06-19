/* ================================================
   GreenTrail Analytics Engine v3.0
   Production-grade Express + Socket.io Backend
   ================================================ */

const express      = require('express');
const http         = require('http');
const cors         = require('cors');
const path         = require('path');
const compression  = require('compression');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const NodeCache    = require('node-cache');
const { Server }   = require('socket.io');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const cache  = new NodeCache({ stdTTL: 60, checkperiod: 30 });

const PORT = process.env.PORT || 3000;

// ─── Production Middleware ────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));  // security headers
app.use(compression());                              // gzip responses
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 200 req per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests — please slow down' }
});
app.use('/api/', limiter);

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js'))  res.setHeader('Content-Type', 'application/javascript');
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  }
}));

// Cache middleware for GET requests
function withCache(key) {
  return (req, res, next) => {
    const cacheKey = key + JSON.stringify(req.query);
    const cached   = cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
    res.sendCachedJSON = (data) => {
      cache.set(cacheKey, data);
      res.setHeader('X-Cache', 'MISS');
      res.json(data);
    };
    next();
  };
}

// Request logger
app.use((req, res, next) => {
  const ts = new Date().toISOString().replace('T',' ').split('.')[0];
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ─── Routes ──────────────────────────────────────
const campaignRoutes  = require('./routes/campaigns');
const kpiRoutes       = require('./routes/kpis');
const marketRoutes    = require('./routes/market');
const exportRoutes    = require('./routes/export');
const analyticsRoutes = require('./routes/analytics');
const abTestRoutes    = require('./routes/abtests');
const optimizerRoutes = require('./routes/optimizer');
const alertRoutes     = require('./routes/alerts');

app.use('/api/campaigns',  campaignRoutes);
app.use('/api/kpis',       kpiRoutes);
app.use('/api/market',     marketRoutes);
app.use('/api/export',     exportRoutes);
app.use('/api/analytics',  analyticsRoutes);
app.use('/api/abtests',    abTestRoutes);
app.use('/api/optimizer',  optimizerRoutes);
app.use('/api/alerts',     alertRoutes);

// ─── Data imports ─────────────────────────────────
const retentionData = require('./data/retention.json');
const kpisData      = require('./data/kpis.json');

// ─── Overview ─────────────────────────────────────
app.get('/api/overview', withCache('overview'), (req, res) => {
  const kpis      = require('./data/kpis.json');
  const campaigns = require('./data/campaigns.json');
  const q2 = kpis.quarters['Q2-2026'];
  const q1 = kpis.quarters['Q1-2026'];

  const active = campaigns.filter(c => c.status === 'active').length;
  const result = {
    success: true,
    data: {
      kpis: {
        totalUsers:    { value: q2.totalUsers,    prev: q1.totalUsers,    change: +(((q2.totalUsers    - q1.totalUsers)    / q1.totalUsers    ) * 100).toFixed(1) },
        campaignReach: { value: q2.campaignReach, prev: q1.campaignReach, change: +(((q2.campaignReach - q1.campaignReach) / q1.campaignReach ) * 100).toFixed(1) },
        promoROI:      { value: q2.promoROI,      prev: q1.promoROI,      change: +(q2.promoROI      - q1.promoROI     ).toFixed(1) },
        retentionRate: { value: q2.retentionRate, prev: q1.retentionRate, change: +(q2.retentionRate - q1.retentionRate).toFixed(1) },
        npsScore:      { value: q2.npsScore,      prev: q1.npsScore,      change: q2.npsScore       - q1.npsScore      },
        greenScore:    { value: q2.greenScore,     prev: q1.greenScore,    change: q2.greenScore      - q1.greenScore   },
        totalRevenue:  { value: q2.totalRevenue,   prev: q1.totalRevenue,  change: +(((q2.totalRevenue - q1.totalRevenue) / q1.totalRevenue) * 100).toFixed(1) },
        cpa:           { value: q2.cpa,            prev: q1.cpa,           change: +(q2.cpa            - q1.cpa         ).toFixed(0) }
      },
      campaigns: { total: campaigns.length, active },
      timeSeries: {
        labels:      ['Jan','Feb','Mar','Apr','May','Jun'],
        userGrowth:  [61200, 65400, 69800, 73500, 78900, 84320],
        reachGrowth: [1200000, 1480000, 1620000, 1950000, 2180000, 2400000],
        convGrowth:  [18000, 22000, 26000, 31000, 38000, 43000]
      },
      liveKPIs: kpis.liveKPIs
    }
  };
  if (res.sendCachedJSON) res.sendCachedJSON(result);
  else res.json(result);
});

// ─── Retention ────────────────────────────────────
app.get('/api/retention', withCache('retention'), (req, res) => {
  const data = { success: true, data: retentionData };
  if (res.sendCachedJSON) res.sendCachedJSON(data);
  else res.json(data);
});

// ─── Insights Engine ─────────────────────────────
app.get('/api/insights', withCache('insights'), (req, res) => {
  const campaigns = require('./data/campaigns.json');
  const market    = require('./data/market.json');
  const retention = require('./data/retention.json');
  const topCamp   = [...campaigns].sort((a, b) => b.roi - a.roi)[0];
  const topChurn  = retention.churnReasons[0];

  const insights = [
    { id:'ins-001', priority:1, type:'opportunity', icon:'🚀', title:'Scale Influencer Program',
      body:`${topCamp.name} delivered ${topCamp.roi}× ROI. Allocate 35% of Q3 budget to micro-influencer partnerships in Tier 2 cities.`,
      impact:'+18% user acquisition', confidence:92, metric:{label:'Best Channel ROI', value:`${topCamp.roi}×`}, color:'#4ade80' },
    { id:'ins-002', priority:2, type:'risk', icon:'🌿', title:'Expand Trail Inventory',
      body:`${topChurn.pct}% of churned users cited "${topChurn.reason}". Partner with 15 new trail operators in Northeast India.`,
      impact:'+6,000 retained users', confidence:88, metric:{label:'Top Churn Reason', value:`${topChurn.pct}%`}, color:'#a3e635' },
    { id:'ins-003', priority:3, type:'action', icon:'📱', title:'Social Content Acceleration',
      body:'Follower growth missed Q2 target by 18%. Introduce #MyGreenTrail UGC campaigns. Increase weekly Reel cadence to 5 posts.',
      impact:'+15,000 net followers', confidence:79, metric:{label:'Social Target Miss', value:'-18%'}, color:'#38bdf8' },
    { id:'ins-004', priority:4, type:'action', icon:'🎁', title:'Loyalty Tier Gamification',
      body:'Peer referral converts at 43%. Add milestone badges and streak rewards for Summit+ members to drive tier upgrades.',
      impact:'+22% tier upgrades', confidence:85, metric:{label:'Referral Conversion', value:'43%'}, color:'#c084fc' },
    { id:'ins-005', priority:5, type:'opportunity', icon:'🗺️', title:'Northeast India Expansion',
      body:'Northeast India shows +48.6% booking growth — fastest region. Target before monsoon peak with dedicated influencer partnerships.',
      impact:'+3,200 bookings Q3', confidence:76, metric:{label:'NE India Growth', value:'+48.6%'}, color:'#f59e0b' },
    { id:'ins-006', priority:6, type:'risk', icon:'⚠️', title:'CPA Optimization Required',
      body:'Google Ads CPA (₹890) is 11% above average. Reallocate to Referral (₹280 CPA) and Email (₹310 CPA).',
      impact:'-₹120 avg CPA', confidence:91, metric:{label:'Google Ads CPA', value:'₹890'}, color:'#f87171' }
  ];

  const result = { success: true, count: insights.length, data: insights };
  if (res.sendCachedJSON) res.sendCachedJSON(result);
  else res.json(result);
});

// ─── Health Check ─────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'GreenTrail Analytics Engine v3.0',
    version: '3.0.0',
    uptime: Math.floor(process.uptime()) + 's',
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount || 0,
    cacheStats: cache.getStats(),
    features: ['socket.io', 'rate-limiting', 'compression', 'helmet', 'node-cache', 'analytics-engine', 'ab-testing', 'budget-optimizer', 'alerts'],
    endpoints: {
      core:      ['/api/overview', '/api/campaigns', '/api/kpis', '/api/market', '/api/retention', '/api/insights'],
      analytics: ['/api/analytics/forecast', '/api/analytics/attribution', '/api/analytics/ltv', '/api/analytics/anomalies', '/api/analytics/heatmap', '/api/analytics/bubble', '/api/analytics/cohort-revenue'],
      advanced:  ['/api/abtests', '/api/optimizer/budget', '/api/optimizer/simulate', '/api/optimizer/scenarios', '/api/alerts'],
      export:    ['/api/export/csv', '/api/export/report', '/api/export/kpi-csv'],
      realtime:  ['WebSocket /socket.io']
    }
  });
});

// ─── Socket.io Real-Time Engine ───────────────────
const rooms = { dashboard: 'dashboard', campaigns: 'campaigns-room', optimizer: 'optimizer-room' };

// Event pools for realism
const EVENT_POOLS = [
  () => ({ type:'booking',    icon:'🧭', message:`New booking: ${randomTrail()}`,          detail:`₹${(Math.random()*8000+2000).toFixed(0)} · ${randomRegion()}` }),
  () => ({ type:'conversion', icon:'🎯', message:`${randomCampaign()} converted`,           detail:`Channel: ${randomChannel()}` }),
  () => ({ type:'referral',   icon:'👥', message:`Summit Member referral activated`,         detail:`+1 user · ${randomRegion()}` }),
  () => ({ type:'signup',     icon:'🌱', message:`New Seedling signed up`,                   detail:`Via ${randomChannel()} · ${randomRegion()}` }),
  () => ({ type:'review',     icon:'⭐', message:`5-star review: ${randomTrail()}`,          detail:`NPS impact: +0.1` }),
  () => ({ type:'milestone',  icon:'🏆', message:`${randomCampaign()} hit 10K conversions`, detail:`ROI target exceeded` }),
  () => ({ type:'alert',      icon:'🔔', message:`CPA trending up — ${randomCampaign()}`,   detail:`Current: ₹${(Math.random()*200+700).toFixed(0)}` }),
  () => ({ type:'abtest',     icon:'🧪', message:`A/B test variant B gaining significance`, detail:`p < 0.05 reached` }),
];

const TRAILS    = ['Hampta Pass Trek', 'Valley of Flowers', 'Kudremukh Trek', 'Dzukou Valley', 'Aravalli Safari', 'Coorg Trail', 'Roopkund Trek'];
const REGIONS   = ['Mumbai', 'Bangalore', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad'];
const CHANNELS  = ['Instagram', 'YouTube', 'Google', 'Email', 'Referral Link', 'WhatsApp'];
const CAMPAIGNS = ['#TrailsOfIndia', 'EcoHiker Collab', 'Monsoon Newsletter', 'Summit Referral'];

function randomTrail()    { return TRAILS[Math.floor(Math.random() * TRAILS.length)]; }
function randomRegion()   { return REGIONS[Math.floor(Math.random() * REGIONS.length)]; }
function randomChannel()  { return CHANNELS[Math.floor(Math.random() * CHANNELS.length)]; }
function randomCampaign() { return CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)]; }

// Live KPI state machine
let liveKPIState = { ...kpisData.liveKPIs };
function updateLiveKPIs() {
  liveKPIState.activeUsers   = Math.max(800, liveKPIState.activeUsers   + Math.floor(Math.random()*30 - 12));
  liveKPIState.trailsBooked  = Math.max(200, liveKPIState.trailsBooked  + Math.floor(Math.random()*8  - 3));
  liveKPIState.revenueToday  = Math.max(100000, liveKPIState.revenueToday + Math.floor(Math.random()*8000 - 3000));
  liveKPIState.avgSessionMin = Math.max(4, +(liveKPIState.avgSessionMin + (Math.random()*0.4 - 0.2)).toFixed(1));
  return { ...liveKPIState, timestamp: new Date().toISOString() };
}

io.on('connection', (socket) => {
  const clientIP = socket.handshake.address;
  console.log(`[Socket.io] Client connected: ${socket.id} from ${clientIP}`);

  // Send initial data on connect
  socket.emit('connected', { message: '🌿 GreenTrail Real-Time Engine v3 Connected', socketId: socket.id, timestamp: new Date().toISOString() });
  socket.emit('kpi-update', updateLiveKPIs());

  // Allow client to join specific rooms
  socket.on('join-room', (room) => {
    socket.join(room);
    socket.emit('room-joined', { room, message: `Joined ${room}` });
  });

  // Handle client requesting a KPI refresh
  socket.on('request-kpi', () => {
    socket.emit('kpi-update', updateLiveKPIs());
  });

  // Handle optimizer simulation via socket
  socket.on('optimizer-simulate', (data) => {
    const { allocations, totalBudget } = data;
    if (!allocations || !totalBudget) return;
    const channelROI = { 'Social Media':4.1,'Influencer':5.6,'Email':3.2,'Search':2.9,'Referral':4.8,'Display Ads':3.0,'Content':2.4 };
    const results = allocations.map(a => {
      const roi = channelROI[a.channel] || 3.0;
      const amt = Math.round((a.pct / 100) * totalBudget);
      return { channel: a.channel, pct: a.pct, amount: amt, roi, projRevenue: Math.round(amt * roi) };
    });
    const totalRevenue = results.reduce((s, r) => s + r.projRevenue, 0);
    socket.emit('optimizer-result', { results, totalRevenue, projROI: +(totalRevenue / totalBudget).toFixed(2) });
  });

  // Handle churn simulation via socket
  socket.on('predictive-churn-simulate', (data) => {
    const { supportSLA, promoDiscount, npsScore, loyaltyMultiplier } = data;
    const slaEffect = Math.max(0, (parseFloat(supportSLA || 4) - 4) * 0.4);
    const promoEffect = parseFloat(promoDiscount || 0) * 0.15;
    const npsEffect = (parseFloat(npsScore || 67) - 67) * 0.25;
    const loyaltyEffect = (parseFloat(loyaltyMultiplier || 1) - 1) * 1.5;
    
    let predictedChurn = 28.7 + slaEffect - promoEffect - npsEffect - loyaltyEffect;
    predictedChurn = Math.max(5.0, Math.min(65.0, predictedChurn));
    
    const baselineUsers = 84320;
    const retainedUsers = Math.round(baselineUsers * (1 - predictedChurn / 100));
    const churnedUsers = baselineUsers - retainedUsers;
    const avgUserValue = 4200;
    const financialImpact = Math.round((retainedUsers - (baselineUsers * (1 - 0.287))) * avgUserValue);
    
    let riskCategory = 'Low Risk';
    let riskColor = '#4ade80';
    if (predictedChurn > 35) {
      riskCategory = 'High Risk';
      riskColor = '#f87171';
    } else if (predictedChurn > 20) {
      riskCategory = 'Medium Risk';
      riskColor = '#f59e0b';
    }
    
    socket.emit('predictive-churn-result', {
      predictedChurn: +predictedChurn.toFixed(1),
      retainedUsers,
      churnedUsers,
      financialImpact,
      riskCategory,
      riskColor
    });
  });

  // Handle acquisition simulation via socket
  socket.on('predictive-acquisition-simulate', (data) => {
    const { channel, spend } = data;
    const budget = parseFloat(spend || 500000);
    const channelStats = {
      'Influencer':   { baseROI: 5.6, avgCPA: 450, reachPerRupee: 0.65 },
      'Social Media': { baseROI: 4.1, avgCPA: 380, reachPerRupee: 0.85 },
      'Search':       { baseROI: 2.9, avgCPA: 680, reachPerRupee: 0.40 },
      'Email':        { baseROI: 3.2, avgCPA: 310, reachPerRupee: 0.50 },
      'Referral':     { baseROI: 4.8, avgCPA: 280, reachPerRupee: 0.35 },
      'Content':      { baseROI: 2.4, avgCPA: 210, reachPerRupee: 0.70 },
      'Display Ads':  { baseROI: 3.0, avgCPA: 740, reachPerRupee: 0.55 }
    };
    const stats = channelStats[channel] || channelStats['Social Media'];
    const scaleFactor = Math.max(0.5, 1 - (budget / 10000000) * 0.15);
    const projectedROI = +(stats.baseROI * scaleFactor).toFixed(2);
    const projectedCPA = Math.round(stats.avgCPA * (1 + (budget / 5000000) * 0.1));
    const conversions = Math.round(budget / projectedCPA);
    const reach = Math.round(budget * stats.reachPerRupee * (1 + (Math.random()*0.1 - 0.05)));
    const revenue = Math.round(budget * projectedROI);
    const netProfit = revenue - budget;
    
    socket.emit('predictive-acquisition-result', {
      channel,
      spend: budget,
      projectedROI,
      projectedCPA,
      conversions,
      reach,
      revenue,
      netProfit
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Broadcast events every 3 seconds
setInterval(() => {
  if (io.engine.clientsCount === 0) return;

  const kpis  = updateLiveKPIs();
  const evtFn = EVENT_POOLS[Math.floor(Math.random() * EVENT_POOLS.length)];
  const event = { ...evtFn(), kpis, timestamp: new Date().toISOString() };

  io.emit('live-event', event);
  io.emit('kpi-update', kpis);
}, 3000);

// Broadcast aggregated analytics every 30 seconds
setInterval(() => {
  if (io.engine.clientsCount === 0) return;
  io.emit('analytics-pulse', {
    type: 'pulse',
    timestamp: new Date().toISOString(),
    metrics: {
      activeTests:   4,
      optimizerROI:  4.6,
      anomaliesAlert: Math.random() > 0.7 ? 1 : 0,
      topChannel:    'Influencer'
    }
  });
}, 30000);

// ─── SSE fallback (for browsers without Socket.io support) ──
const sseClients = [];
app.get('/api/realtime', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  const client = { id: Date.now(), res };
  sseClients.push(client);
  res.write(`data: ${JSON.stringify({ type:'connected', message:'SSE fallback connected' })}\n\n`);
  req.on('close', () => { const i = sseClients.findIndex(c => c.id === client.id); if (i > -1) sseClients.splice(i, 1); });
});

// ─── 404 handler ─────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.path}` });
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ─── Error handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// ─── Start ───────────────────────────────────────
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🌿 GreenTrail Analytics Engine v3.0        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║   ✅  HTTP + Socket.io on port ${PORT}           ║`);
  console.log(`║   🌐  http://localhost:${PORT}                   ║`);
  console.log(`║   📡  API health: /api/health                 ║`);
  console.log('║   🔒  Helmet + Rate Limiting + Compression   ║');
  console.log('║   ⚡  node-cache + Socket.io + Analytics     ║');
  console.log('╚══════════════════════════════════════════════╝\n');
});

module.exports = { app, server, io };
