/**
 * GreenTrail Analytics — Database Layer
 * Uses sql.js (pure JavaScript SQLite — no native compilation needed)
 * Data is persisted to greentrail.db binary file via fs.writeFileSync
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'greentrail.db');
let db = null;

// ===== SCHEMA =====
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    totalUsers INTEGER DEFAULT 0,
    campaignReach INTEGER DEFAULT 0,
    promoROI REAL DEFAULT 0,
    retentionRate REAL DEFAULT 0,
    npsScore INTEGER DEFAULT 0,
    greenScore INTEGER DEFAULT 88,
    activeUsers INTEGER DEFAULT 0,
    liveBookings INTEGER DEFAULT 0,
    cpa INTEGER DEFAULT 0,
    emailOpenRate REAL DEFAULT 0,
    revenueToday INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS live_events (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    company TEXT, companyId TEXT, companyIcon TEXT, companyColor TEXT,
    type TEXT, label TEXT, icon TEXT,
    location TEXT, trail TEXT, amount INTEGER, userId TEXT
  );
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, channel TEXT,
    reach INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0,
    cpa INTEGER DEFAULT 0, roi REAL DEFAULT 0, status TEXT DEFAULT 'active',
    spend REAL DEFAULT 0, revenue REAL DEFAULT 0, budget REAL DEFAULT 0,
    startDate TEXT, endDate TEXT, createdAt TEXT, description TEXT
  );
  CREATE TABLE IF NOT EXISTS ai_insights (
    id TEXT PRIMARY KEY, timestamp TEXT NOT NULL,
    type TEXT, msg TEXT, priority TEXT, metric TEXT, change REAL
  );
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, color TEXT,
    category TEXT, status TEXT DEFAULT 'active', joinedAt TEXT,
    eventsCount INTEGER DEFAULT 0, totalRevenue REAL DEFAULT 0,
    contactEmail TEXT, region TEXT
  );
`;

// ===== PERSIST =====
function persist() {
  if (!db) return;
  const data = db.export();
  const buf = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buf);
}

// ===== INIT (sync wrapper using top-level await via module) =====
let dbReady = false;
let dbReadyResolve = null;
const dbReadyPromise = new Promise(resolve => { dbReadyResolve = resolve; });

async function initDB() {
  const SQL = await initSqlJs();

  // Load existing DB or create fresh
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
    console.log('📂 Loaded existing SQLite database');
  } else {
    db = new SQL.Database();
    console.log('🆕 Created new SQLite database');
  }

  db.run(SCHEMA);
  seedDatabase();
  persist();
  dbReady = true;
  dbReadyResolve(true);
  console.log('✅ Database ready');

  // Auto-persist every 30 seconds
  setInterval(persist, 30000);
}

// ===== SEED =====
function seedDatabase() {
  const count = db.exec('SELECT COUNT(*) as c FROM kpi_snapshots')[0]?.values[0][0] || 0;
  if (count > 0) return;

  console.log('🌱 Seeding database...');

  run(`INSERT INTO kpi_snapshots VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [uuidv4(), new Date().toISOString(), 84320, 2400000, 3.8, 71.3, 67, 88, 623, 28, 812, 34.2, 182400]);

  const companies = [
    [uuidv4(),'TrailMasters India','🏔️','#4ade80','Trail Operator','active',new Date().toISOString(),142,2840000,'ops@trailmasters.in','North India'],
    [uuidv4(),'EcoRoutes Network','🌿','#34d399','Eco-Tourism','active',new Date().toISOString(),98,1960000,'data@ecoroutes.co','South India'],
    [uuidv4(),'WildExplore','🦅','#38bdf8','Adventure Travel','active',new Date().toISOString(),87,1740000,'api@wildexplore.io','Northeast'],
    [uuidv4(),'NatureHub','🌳','#a3e635','Nature Tourism','active',new Date().toISOString(),76,1520000,'live@naturehub.in','Central India'],
    [uuidv4(),'AdventureCo','⛺','#f59e0b','Camping & Trekking','active',new Date().toISOString(),65,1300000,'feeds@adventureco.in','West India'],
    [uuidv4(),'Summit Travels','🏕️','#c084fc','Mountain Tourism','active',new Date().toISOString(),54,1080000,'connect@summit.co','Himalayas'],
    [uuidv4(),'TrailBlazers Co.','🔥','#f87171','Trekking Experts','partner',new Date().toISOString(),43,860000,'api@trailblazers.co','West India'],
  ];
  companies.forEach(c => run('INSERT INTO companies VALUES (?,?,?,?,?,?,?,?,?,?,?)', c));

  const campaigns = [
    [uuidv4(),'#TrailsOfIndia Reel Campaign','Social Media',4200000,87400,620,4.1,'active',1200000,4920000,2000000,'2026-04-01','2026-06-30',new Date().toISOString(),'Instagram & YouTube short-form video series'],
    [uuidv4(),'EcoHiker Collab Series','Influencer',1800000,52000,540,5.6,'active',800000,4480000,1200000,'2026-04-15','2026-07-15',new Date().toISOString(),'Partnered with 12 eco-conscious micro-influencers'],
    [uuidv4(),'Monsoon Trail Escape Newsletter','Email',82000,14200,310,3.2,'active',300000,960000,500000,'2026-06-01','2026-08-31',new Date().toISOString(),'Seasonal email campaign for monsoon trail picks'],
    [uuidv4(),'Google Ads — Weekend Getaway','Search',620000,27300,890,2.9,'paused',1800000,5220000,2500000,'2026-03-01','2026-06-30',new Date().toISOString(),'Performance max campaigns for weekend travel'],
    [uuidv4(),'Summit Member Referral Drive','Referral',310000,19800,280,4.8,'active',500000,2400000,800000,'2026-05-01','2026-07-31',new Date().toISOString(),'Double-sided referral for Summit/Elite members'],
    [uuidv4(),'Earth Day Awareness Blitz','Display Ads',2100000,31000,740,3.0,'ended',900000,2700000,1000000,'2026-04-15','2026-04-22',new Date().toISOString(),'One-week Earth Day awareness campaign'],
    [uuidv4(),'Trail Safety Blog Series','Content',180000,8400,210,2.4,'active',200000,480000,400000,'2026-01-01','2026-12-31',new Date().toISOString(),'SEO-driven long-form trail safety content'],
  ];
  campaigns.forEach(c => run('INSERT INTO campaigns VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', c));

  const COMP_DATA = [
    { name:'TrailMasters India', id:'trailmasters_india', icon:'🏔️', color:'#4ade80' },
    { name:'EcoRoutes Network',  id:'ecoroutes_network',  icon:'🌿', color:'#34d399' },
    { name:'WildExplore',        id:'wildexplore',        icon:'🦅', color:'#38bdf8' },
    { name:'NatureHub',          id:'naturehub',          icon:'🌳', color:'#a3e635' },
    { name:'AdventureCo',        id:'adventureco',        icon:'⛺', color:'#f59e0b' },
  ];
  const EVTS  = [{type:'booking',label:'New Booking',icon:'🎫'},{type:'signup',label:'User Signup',icon:'👤'},{type:'review',label:'Review Posted',icon:'⭐'},{type:'referral',label:'Referral Converted',icon:'🔄'}];
  const LOCS  = ['Mumbai','Delhi','Bengaluru','Pune','Hyderabad','Chennai','Shimla','Manali'];
  const TRLS  = ['Western Ghats Trek','Roopkund Trail','Valley of Flowers','Kedarkantha','Triund Trek'];
  for (let i = 0; i < 25; i++) {
    const c = COMP_DATA[Math.floor(Math.random() * COMP_DATA.length)];
    const e = EVTS[Math.floor(Math.random() * EVTS.length)];
    run('INSERT INTO live_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [
      uuidv4(), new Date(Date.now() - Math.random() * 7200000).toISOString(),
      c.name, c.id, c.icon, c.color,
      e.type, e.label, e.icon,
      LOCS[Math.floor(Math.random() * LOCS.length)],
      TRLS[Math.floor(Math.random() * TRLS.length)],
      Math.floor(Math.random() * 8000) + 500,
      `USR${String(Math.floor(Math.random() * 99999)).padStart(5,'0')}`
    ]);
  }

  const insightsSeed = [
    [uuidv4(),new Date().toISOString(),'opportunity','Influencer campaigns delivering 5.6× ROI — highest across all channels. Allocate 35% of Q3 budget here.','high','roi',5.6],
    [uuidv4(),new Date(Date.now()-60000).toISOString(),'warning','Churn spike in Gen Z cohort — trigger gamification re-engagement flow immediately.','high','retention',-2.1],
    [uuidv4(),new Date(Date.now()-120000).toISOString(),'trend','Western Ghats bookings up 22% this hour — feature on homepage hero banner.','medium','bookings',22.0],
  ];
  insightsSeed.forEach(r => run('INSERT INTO ai_insights VALUES (?,?,?,?,?,?,?)', r));

  console.log('✅ Seeded successfully');
}

// ===== HELPERS =====
function run(sql, params = []) {
  db.run(sql, params);
}

function query(sql, params = []) {
  const result = db.exec(sql, params);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

// ===== EXPORTS =====
module.exports = {
  ready: () => dbReadyPromise,
  init:  initDB,

  insertKPISnapshot: (d) => {
    run('INSERT INTO kpi_snapshots VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [d.id, d.timestamp, d.totalUsers, d.campaignReach, d.promoROI, d.retentionRate,
       d.npsScore, d.greenScore||88, d.activeUsers, d.liveBookings, d.cpa||812, d.emailOpenRate||34.2, d.revenueToday||0]);
  },

  getLatestKPISnapshot: () => queryOne('SELECT * FROM kpi_snapshots ORDER BY timestamp DESC LIMIT 1')
    || { totalUsers:84320, campaignReach:2400000, promoROI:3.8, retentionRate:71.3, npsScore:67, greenScore:88, activeUsers:623, liveBookings:28, cpa:812, emailOpenRate:34.2, revenueToday:182400 },

  getKPIHistory: (limit) => query(`SELECT * FROM kpi_snapshots ORDER BY timestamp DESC LIMIT ${parseInt(limit)||50}`),

  getKPIScorecard: function() {
    const kpi = this.getLatestKPISnapshot();
    return [
      { kpi:'Total Users',       q1:74980,   target:80000,   actual:kpi.totalUsers,    unit:'',     field:'totalUsers' },
      { kpi:'Campaign Reach',    q1:1870000, target:2100000, actual:kpi.campaignReach, unit:'',     field:'campaignReach' },
      { kpi:'Promo ROI',         q1:3.2,     target:3.5,     actual:kpi.promoROI,      unit:'×',    field:'promoROI' },
      { kpi:'Retention Rate',    q1:67.1,    target:70.0,    actual:kpi.retentionRate, unit:'%',    field:'retentionRate' },
      { kpi:'NPS Score',         q1:62,      target:65,      actual:kpi.npsScore,      unit:'',     field:'npsScore' },
      { kpi:'CPA (lower=better)',q1:840,     target:800,     actual:kpi.cpa||812,      unit:'₹',    field:'cpa' },
      { kpi:'Email Open Rate',   q1:28.4,    target:35,      actual:kpi.emailOpenRate, unit:'%',    field:'emailOpenRate' },
      { kpi:'Social Growth',     q1:8200,    target:12000,   actual:9840,              unit:'',     field:null },
      { kpi:'Green Score',       q1:85,      target:87,      actual:kpi.greenScore||88,unit:'/100', field:'greenScore' },
    ];
  },

  getKPITrend: () => ({ labels:['Q3 25','Q4 25','Q1 26','Q2 26'], nps:[52,57,62,67], retention:[58.4,62.1,67.1,71.3], roi:[2.4,2.9,3.2,3.8] }),

  insertLiveEvent: (e) => {
    run('INSERT INTO live_events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [e.id, e.timestamp, e.company, e.companyId, e.companyIcon, e.companyColor,
       e.type, e.label, e.icon, e.location, e.trail, e.amount, e.userId]);
  },

  getRecentEvents: (limit) => query(`SELECT * FROM live_events ORDER BY timestamp DESC LIMIT ${parseInt(limit)||50}`),

  getCompanyEventCount: (id) => { const r = queryOne(`SELECT COUNT(*) as c FROM live_events WHERE companyId = ?`, [id]); return r ? r.c : 0; },

  getLiveFeedStats: function() {
    const s = queryOne('SELECT COUNT(*) as total, SUM(amount) as revenue FROM live_events') || {};
    const b = queryOne("SELECT COUNT(*) as c FROM live_events WHERE type = 'booking'") || {};
    const sg= queryOne("SELECT COUNT(*) as c FROM live_events WHERE type = 'signup'") || {};
    return { total:s.total||0, bookings:b.c||0, signups:sg.c||0, revenue:s.revenue||0 };
  },

  getCampaigns: () => query('SELECT * FROM campaigns ORDER BY createdAt DESC'),

  getCampaignById: (id) => queryOne('SELECT * FROM campaigns WHERE id = ?', [id]),

  insertCampaign: (c) => {
    run('INSERT INTO campaigns VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [c.id, c.name, c.channel, c.reach||0, c.conversions||0, c.cpa||0, c.roi||0,
       c.status||'active', c.spend||0, c.revenue||0, c.budget||0,
       c.startDate||null, c.endDate||null, c.createdAt, c.description||'']);
  },

  getCampaignStats: () => queryOne('SELECT COUNT(*) as total, SUM(reach) as totalReach, SUM(conversions) as totalConversions, AVG(roi) as avgROI, SUM(spend) as totalSpend, SUM(revenue) as totalRevenue FROM campaigns WHERE status != ?', ['ended']),

  getChannelAttribution: () => query("SELECT channel, COUNT(*) as count, SUM(reach) as reach, AVG(roi) as avgROI, SUM(revenue) as revenue FROM campaigns GROUP BY channel"),

  insertAIInsight: (i) => {
    run('INSERT INTO ai_insights VALUES (?,?,?,?,?,?,?)',
      [i.id, i.timestamp, i.type, i.msg, i.priority, i.metric||null, i.change||null]);
  },

  getInsights: (limit) => query(`SELECT * FROM ai_insights ORDER BY timestamp DESC LIMIT ${parseInt(limit)||30}`),

  getCompanies: () => query('SELECT * FROM companies'),

  getOverview: function() { return { kpi: this.getLatestKPISnapshot() }; },

  getSegments:    () => [{ label:'Millennials 25–38',value:54 },{ label:'Gen Z 18–24',value:18 },{ label:'Families',value:16 },{ label:'Seniors 50+',value:8 },{ label:'Corporate Groups',value:4 }],
  getMotivators:  () => [{ label:'Nature Experience',score:9.2 },{ label:'Health & Wellness',score:8.7 },{ label:'Eco-Consciousness',score:8.4 },{ label:'Adventure',score:7.9 },{ label:'Social Sharing',score:7.2 },{ label:'Value for Money',score:6.8 },{ label:'Unique Trails',score:8.1 }],
  getMarketShare: () => [{ company:'GreenTrail',share:31 },{ company:'TrailBlazers Co.',share:24 },{ company:'EcoRoutes',share:18 },{ company:'WildExplore',share:14 },{ company:'Others',share:13 }],
  getFunnel:      () => ({ labels:['Brand Awareness','Trial Conversion','Satisfaction','Loyalty','Advocacy','Re-Engagement'], greentrail:[88,62,79,71,67,58], competitor:[74,55,65,55,52,44] }),
  getCohorts:     () => ({ labels:['Jan','Feb','Mar','Apr','May','Jun'], cohorts:[{ label:'Jan Cohort',data:[100,72,65,61,58,55] },{ label:'Feb Cohort',data:[null,100,74,68,63,60] },{ label:'Mar Cohort',data:[null,null,100,76,70,66] },{ label:'Apr Cohort',data:[null,null,null,100,78,71] }] }),
  getChurnReasons:() => [{ reason:'Lack of Trail Variety',pct:28 },{ reason:'Price / Value',pct:21 },{ reason:'App UX Issues',pct:18 },{ reason:'No Social Features',pct:14 },{ reason:'Competitor Switch',pct:11 },{ reason:'Other',pct:8 }],
  getLoyaltyTiers:() => [{ tier:'🌱 Seedling (New)',pct:45,color:'#a3e635' },{ tier:'🌿 Trailblazer',pct:30,color:'#4ade80' },{ tier:'🏔️ Summit Member',pct:18,color:'#34d399' },{ tier:'⛰️ Peak Elite',pct:7,color:'#10b981' }],
};

// Start DB initialization
initDB().catch(err => { console.error('DB init error:', err); process.exit(1); });
