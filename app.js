/* ================================================
   GreenTrail Analytics Platform v3 — app.js
   Socket.io + REST API + Advanced Analytics
   ================================================ */

const API = (window.location.protocol === 'file:')
  ? 'http://localhost:3000/api'
  : window.location.origin + '/api';
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

// ── Client-Side Demo Engine Fallback ───────────
let isDemoMode = false;
const demoData = {
  campaigns: [],
  kpis: null,
  market: null,
  retention: null,
  abtests: [],
  alerts: null
};

const getBaseUrl = () => {
  const path = window.location.pathname;
  const directory = path.substring(0, path.lastIndexOf('/') + 1);
  return window.location.origin + directory;
};

async function initDemoMode() {
  isDemoMode = true;
  console.log('[DemoMode] Initializing client-side engine...');
  const baseUrl = getBaseUrl();
  try {
    const [c, k, m, r, ab, al] = await Promise.all([
      fetch(baseUrl + 'server/data/campaigns.json').then(res => res.json()),
      fetch(baseUrl + 'server/data/kpis.json').then(res => res.json()),
      fetch(baseUrl + 'server/data/market.json').then(res => res.json()),
      fetch(baseUrl + 'server/data/retention.json').then(res => res.json()),
      fetch(baseUrl + 'server/data/abtests.json').then(res => res.json()),
      fetch(baseUrl + 'server/data/alerts.json').then(res => res.json())
    ]);
    demoData.campaigns = c;
    demoData.kpis = k;
    demoData.market = m;
    demoData.retention = r;
    demoData.abtests = ab;
    demoData.alerts = al;
    
    campaignStoreLocal = [...c];

    console.log('[DemoMode] Loaded all static data successfully.');
    startDemoSocketSimulation();
    
    await loadOverview();
    loadTable();
    loadNotifications();
    showToast('🌿 Client-Side Analytics Engine (Demo) Online', 'success');
  } catch (err) {
    console.error('[DemoMode] Failed to load static files:', err);
    showToast('Error initializing client-side demo mode', 'error');
  }
}

let demoSocketInterval = null;
function startDemoSocketSimulation() {
  if (demoSocketInterval) clearInterval(demoSocketInterval);
  
  const wsEl = document.getElementById('ws-status');
  if (wsEl) {
    wsEl.textContent = '⬤ Demo';
    wsEl.className   = 'ti-val ws-status connected';
  }
  
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

  const randomTrail    = () => TRAILS[Math.floor(Math.random() * TRAILS.length)];
  const randomRegion   = () => REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const randomChannel  = () => CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
  const randomCampaign = () => CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)];

  let liveKPIState = { ...demoData.kpis.liveKPIs };
  
  const updateLiveKPIs = () => {
    liveKPIState.activeUsers   = Math.max(800, liveKPIState.activeUsers   + Math.floor(Math.random()*30 - 12));
    liveKPIState.trailsBooked  = Math.max(200, liveKPIState.trailsBooked  + Math.floor(Math.random()*8  - 3));
    liveKPIState.revenueToday  = Math.max(100000, liveKPIState.revenueToday + Math.floor(Math.random()*8000 - 3000));
    liveKPIState.avgSessionMin = Math.max(4, +(liveKPIState.avgSessionMin + (Math.random()*0.4 - 0.2)).toFixed(1));
    return { ...liveKPIState, timestamp: new Date().toISOString() };
  };

  demoSocketInterval = setInterval(() => {
    const kpi = updateLiveKPIs();
    animateTicker('tk-users',   kpi.activeUsers.toLocaleString('en-IN'));
    animateTicker('tk-booked',  kpi.trailsBooked.toLocaleString('en-IN'));
    animateTicker('tk-revenue', fmtMoney(kpi.revenueToday));
    animateTicker('tk-session', kpi.avgSessionMin + ' min');
    
    if (Math.random() > 0.4) {
      const idx = Math.floor(Math.random() * EVENT_POOLS.length);
      const eventData = EVENT_POOLS[idx]();
      addFeedItem(eventData);
      
      if (eventData.type === 'alert' && Math.random() > 0.7) {
        showToast('⚠️ Anomaly detected in KPI stream', 'error', 4000);
      }
    }
  }, 4000);
}

async function handleDemoRequest(path, opts={}) {
  const url = new URL(path, 'http://mock');
  const pathname = url.pathname;
  const method = opts.method ? opts.method.toUpperCase() : 'GET';
  
  console.log(`[Demo API] ${method} ${pathname}`);
  
  if (method === 'GET') {
    if (pathname === '/health') {
      return {
        status: 'ok',
        server: 'GreenTrail Analytics Engine v3.0 (Demo Mode)',
        version: '3.0.0',
        uptime: '0s',
        timestamp: new Date().toISOString(),
        connectedClients: 0,
        cacheStats: {},
        features: ['client-side-simulation', 'budget-optimizer', 'predictive-forecasts'],
        endpoints: {}
      };
    }
    
    if (pathname === '/overview') {
      const q2 = demoData.kpis.quarters['Q2-2026'];
      const q1 = demoData.kpis.quarters['Q1-2026'];
      const active = demoData.campaigns.filter(c => c.status === 'active').length;
      return {
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
          campaigns: { total: demoData.campaigns.length, active },
          timeSeries: {
            labels:      ['Jan','Feb','Mar','Apr','May','Jun'],
            userGrowth:  [61200, 65400, 69800, 73500, 78900, 84320],
            reachGrowth: [1200000, 1480000, 1620000, 1950000, 2180000, 2400000],
            convGrowth:  [18000, 22000, 26000, 31000, 38000, 43000]
          },
          liveKPIs: demoData.kpis.liveKPIs
        }
      };
    }
    
    if (pathname === '/campaigns/channels') {
      const channelMap = {};
      demoData.campaigns.forEach(c => {
        if (!channelMap[c.channel]) channelMap[c.channel] = { reach: 0, spend: 0, conversions: 0, count: 0 };
        channelMap[c.channel].reach += c.reach;
        channelMap[c.channel].spend += c.spend;
        channelMap[c.channel].conversions += c.conversions;
        channelMap[c.channel].count += 1;
      });
      const totalReach = Object.values(channelMap).reduce((s, v) => s + v.reach, 0);
      const result = Object.entries(channelMap).map(([channel, v]) => ({
        channel,
        reach: v.reach,
        spend: v.spend,
        conversions: v.conversions,
        count: v.count,
        sharePct: +((v.reach / totalReach) * 100).toFixed(1)
      })).sort((a, b) => b.reach - a.reach);
      return { success: true, data: result };
    }
    
    if (pathname === '/analytics/bubble') {
      const data = demoData.campaigns.map(c => ({
        id:      c.id,
        label:   c.name,
        channel: c.channel,
        x:       c.cpa,
        y:       c.roi,
        r:       Math.round(Math.sqrt(c.reach / 1000)),
        status:  c.status,
        spend:   c.spend,
        revenue: c.revenue
      }));
      return {
        success: true,
        data,
        axes: { x: 'Cost Per Acquisition (₹)', y: 'Return on Investment (×)', r: 'Reach (bubble size)' },
        summary: {
          avgCPA: Math.round(demoData.campaigns.reduce((s, c) => s + c.cpa, 0) / demoData.campaigns.length),
          avgROI: +(demoData.campaigns.reduce((s, c) => s + c.roi, 0) / demoData.campaigns.length).toFixed(2),
          bestEfficiency: demoData.campaigns.sort((a, b) => b.roi / a.cpa - a.roi / b.cpa)[0]?.name
        }
      };
    }
    
    if (pathname === '/campaigns') {
      const channel = url.searchParams.get('channel');
      const status = url.searchParams.get('status');
      const q = url.searchParams.get('q');
      const sort = url.searchParams.get('sort');
      
      let result = [...demoData.campaigns];
      if (channel) result = result.filter(c => c.channel.toLowerCase() === channel.toLowerCase());
      if (status)  result = result.filter(c => c.status.toLowerCase() === status.toLowerCase());
      if (q)       result = result.filter(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.channel.toLowerCase().includes(q.toLowerCase()) ||
        (c.tags || []).some(t => t.includes(q.toLowerCase()))
      );

      if (sort === 'roi')          result.sort((a, b) => b.roi - a.roi);
      else if (sort === 'reach')   result.sort((a, b) => b.reach - a.reach);
      else if (sort === 'spend')   result.sort((a, b) => b.spend - a.spend);
      else if (sort === 'conv')    result.sort((a, b) => b.conversions - a.conversions);

      const summary = {
        total: result.length,
        totalSpend: result.reduce((s, c) => s + c.spend, 0),
        totalRevenue: result.reduce((s, c) => s + c.revenue, 0),
        totalReach: result.reduce((s, c) => s + c.reach, 0),
        totalConversions: result.reduce((s, c) => s + c.conversions, 0),
        avgROI: result.length ? +(result.reduce((s, c) => s + c.roi, 0) / result.length).toFixed(2) : 0
      };
      return { success: true, summary, data: result };
    }
    
    const campIdMatch = pathname.match(/^\/campaigns\/(camp-\d+)$/);
    if (campIdMatch) {
      const id = campIdMatch[1];
      const camp = demoData.campaigns.find(c => c.id === id);
      if (!camp) return { success: false, message: 'Campaign not found' };
      const efficiencyScore = Math.round((camp.roi / 6) * 40 + (camp.engagementRate / 10) * 30 + (camp.performance / 100) * 30);
      return { success: true, data: { ...camp, efficiencyScore } };
    }
    
    if (pathname === '/market') {
      const totalReach = demoData.market.funnel[0].users;
      const bookings = demoData.market.funnel[demoData.market.funnel.length - 1].users;
      return {
        success: true,
        data: {
          segments: demoData.market.segments,
          motivators: demoData.market.motivators,
          competitors: demoData.market.competitors,
          funnel: demoData.market.funnel,
          geography: demoData.market.geography,
          surveyMeta: demoData.market.surveyMeta
        },
        summary: {
          totalReach,
          bookings,
          overallConversionRate: +((bookings / totalReach) * 100).toFixed(2),
          marketLeader: 'GreenTrail',
          marketShare: demoData.market.competitors[0].share
        }
      };
    }
    
    if (pathname === '/market/funnel') {
      const funnel = demoData.market.funnel.map((stage, i) => ({
        ...stage,
        dropOff: i > 0
          ? +((1 - stage.users / demoData.market.funnel[i - 1].users) * 100).toFixed(1)
          : 0
      }));
      return { success: true, data: funnel };
    }
    
    if (pathname === '/market/geography') {
      const total = demoData.market.geography.reduce((s, r) => s + r.bookings, 0);
      const data = demoData.market.geography.map(r => ({
        ...r,
        sharePct: +((r.bookings / total) * 100).toFixed(1)
      })).sort((a, b) => b.bookings - a.bookings);
      return { success: true, data, totalBookings: total };
    }
    
    if (pathname === '/analytics/forecast') {
      const metric = url.searchParams.get('metric') || 'roi';
      const periods = Math.min(parseInt(url.searchParams.get('quarters')) || 4, 8);
      const quarters = Object.keys(demoData.kpis.quarters);

      const metricMap = {
        roi:           quarters.map(q => demoData.kpis.quarters[q].promoROI),
        users:         quarters.map(q => demoData.kpis.quarters[q].totalUsers),
        retention:     quarters.map(q => demoData.kpis.quarters[q].retentionRate),
        nps:           quarters.map(q => demoData.kpis.quarters[q].npsScore),
        revenue:       quarters.map(q => demoData.kpis.quarters[q].totalRevenue / 100000), // in lakhs
        cpa:           quarters.map(q => demoData.kpis.quarters[q].cpa),
        emailOpenRate: quarters.map(q => demoData.kpis.quarters[q].emailOpenRate)
      };

      const historical = metricMap[metric] || metricMap.roi;
      
      const lreg = (y) => {
        const n  = y.length;
        const x  = Array.from({ length: n }, (_, i) => i);
        const sx = x.reduce((a, b) => a + b, 0);
        const sy = y.reduce((a, b) => a + b, 0);
        const sxy = x.reduce((a, xi, i) => a + xi * y[i], 0);
        const sxx = x.reduce((a, xi) => a + xi * xi, 0);
        const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
        const intercept = (sy - slope * sx) / n;
        return { slope, intercept };
      };
      
      const { slope, intercept } = lreg(historical);
      const n = historical.length;
      const predictions = [];
      for (let i = 0; i < periods; i++) {
        const predicted = intercept + slope * (n + i);
        const confidence = 0.08 + i * 0.023;
        predictions.push({
          value: +predicted.toFixed(2),
          lower: +(predicted * (1 - confidence)).toFixed(2),
          upper: +(predicted * (1 + confidence)).toFixed(2)
        });
      }

      const futureLabels = [];
      const lastQ   = quarters[quarters.length - 1];
      const [qPart, yPart] = lastQ.split('-');
      const qNum = parseInt(qPart.replace('Q',''));
      for (let i = 0; i < periods; i++) {
        let q = qNum + i + 1, y = parseInt(yPart);
        while (q > 4) { q -= 4; y++; }
        futureLabels.push(`Q${q}-${y}`);
      }

      return {
        success: true,
        metric,
        historical: { labels: quarters, values: historical },
        forecast: {
          labels: futureLabels,
          predictions: predictions,
          values: predictions,
          slope: +slope.toFixed(4),
          intercept: +intercept.toFixed(4),
          trend: slope > 0 ? 'upward' : 'downward',
          trendStrength: Math.abs(slope) > 1 ? 'strong' : Math.abs(slope) > 0.3 ? 'moderate' : 'weak'
        }
      };
    }
    
    if (pathname === '/analytics/ltv') {
      const segments = demoData.market.segments;
      const tiers    = demoData.retention.loyaltyTiers;

      const segmentLTV = segments.map(s => {
        const bookingsPerYear  = s.avgSpend > 5000 ? 3.2 : s.avgSpend > 3000 ? 2.4 : 1.8;
        const retentionYears   = s.growth > 20 ? 2.1 : s.growth > 10 ? 1.8 : 1.4;
        const ltv              = Math.round(s.avgSpend * bookingsPerYear * retentionYears);
        const acquisitionCost  = Math.round(ltv * 0.18);
        return { label: s.label, pct: s.pct, avgSpend: s.avgSpend, ltv, acquisitionCost, ltvCacRatio: +(ltv / acquisitionCost).toFixed(1) };
      });

      const tierLTV = tiers.map(t => {
        const bookingsPerYear = t.tier.includes('Elite') ? 5.8 : t.tier.includes('Summit') ? 3.6 : t.tier.includes('Trailblazer') ? 2.2 : 1.2;
        const retentionYears  = t.tier.includes('Elite') ? 3.8 : t.tier.includes('Summit') ? 2.8 : t.tier.includes('Trailblazer') ? 2.1 : 1.3;
        const ltv             = Math.round(t.avgRevenue * bookingsPerYear * retentionYears);
        return { ...t, bookingsPerYear, retentionYears, ltv };
      });

      return {
        success: true,
        data: { segments: segmentLTV, tiers: tierLTV },
        summary: {
          avgPlatformLTV: Math.round(segmentLTV.reduce((s, v) => s + v.ltv * v.pct / 100, 0)),
          highestLTVSegment: segmentLTV.sort((a, b) => b.ltv - a.ltv)[0].label,
          highestLTVTier: tierLTV.sort((a, b) => b.ltv - a.ltv)[0].tier
        }
      };
    }
    
    if (pathname === '/analytics/anomalies') {
      const quarters = Object.keys(demoData.kpis.quarters);

      function detectAnomaly(values, metricName, unit = '') {
        const mean  = values.reduce((a, b) => a + b, 0) / values.length;
        const std   = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
        const zScores = values.map(v => Math.abs((v - mean) / (std || 1)));
        const latest = values[values.length - 1];
        const latestZ = zScores[zScores.length - 1];
        const trend  = values[values.length - 1] - values[values.length - 2];
        return {
          metric: metricName,
          unit,
          values,
          mean: +mean.toFixed(2),
          std: +std.toFixed(2),
          latest,
          zScore: +latestZ.toFixed(2),
          trend: +trend.toFixed(2),
          isAnomaly: latestZ > 1.5,
          severity: latestZ > 2.5 ? 'critical' : latestZ > 1.5 ? 'warning' : 'normal',
          direction: trend >= 0 ? 'up' : 'down'
        };
      }

      const anomalies = [
        detectAnomaly(quarters.map(q => demoData.kpis.quarters[q].promoROI),         'Promo ROI',           '×'),
        detectAnomaly(quarters.map(q => demoData.kpis.quarters[q].retentionRate),     'Retention Rate',      '%'),
        detectAnomaly(quarters.map(q => demoData.kpis.quarters[q].npsScore),          'NPS Score',           ''),
        detectAnomaly(quarters.map(q => demoData.kpis.quarters[q].cpa),               'Cost Per Acquisition','₹'),
        detectAnomaly(quarters.map(q => demoData.kpis.quarters[q].emailOpenRate),     'Email Open Rate',     '%'),
        detectAnomaly(quarters.map(q => demoData.kpis.quarters[q].socialFollowerGrowth / 1000), 'Social Growth', 'K'),
        detectAnomaly(quarters.map(q => demoData.kpis.quarters[q].totalRevenue / 100000),       'Revenue',       '₹L'),
      ].sort((a, b) => b.zScore - a.zScore);

      return {
        success: true,
        data: anomalies,
        summary: {
          totalMetrics: anomalies.length,
          anomaliesDetected: anomalies.filter(a => a.isAnomaly).length,
          criticalCount: anomalies.filter(a => a.severity === 'critical').length
        }
      };
    }
    
    if (pathname === '/analytics/heatmap') {
      const days  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const dayWeights  = [0.7, 0.75, 0.8, 0.85, 1.0, 1.4, 1.2];
      const hourWeights = hours.map(h => {
        if (h < 6)  return 0.05;
        if (h < 9)  return 0.4;
        if (h < 12) return 0.75;
        if (h < 14) return 0.8;
        if (h < 18) return 0.65;
        if (h < 22) return 1.0;
        return 0.3;
      });

      const heatmap = days.map((day, di) => ({
        day,
        hours: hours.map((h, hi) => {
          const base   = 120;
          const noise  = Math.random() * 20 - 10;
          const value  = Math.round(base * dayWeights[di] * hourWeights[hi] + noise);
          return { hour: h, value: Math.max(0, value) };
        })
      }));

      const flat   = heatmap.flatMap(d => d.hours.map(h => h.value));
      const maxVal = Math.max(...flat);
      const minVal = Math.min(...flat.filter(v => v > 0));

      return {
        success: true,
        data: heatmap,
        meta: { days, hours, maxValue: maxVal, minValue: minVal, peakHour: 20, peakDay: 'Saturday' }
      };
    }
    
    if (pathname === '/analytics/cohort-revenue') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const tiers  = demoData.retention.loyaltyTiers;
      const data = tiers.map(t => ({
        tier:  t.tier,
        color: t.color,
        monthly: months.map((m, i) => {
          const base   = t.avgRevenue * t.count / 12;
          const growth = 1 + (i * 0.04);
          return Math.round(base * growth / 100000);
        })
      }));
      return { success: true, labels: months, data };
    }
    
    if (pathname === '/analytics/attribution') {
      const model = url.searchParams.get('model') || 'linear';
      const channels = ['Social Media', 'Influencer', 'Email', 'Search', 'Referral', 'Display Ads', 'Content'];
      const journeyData = {
        touchCounts:  [38, 28, 14, 20, 22, 18, 12],
        firstTouches: [34, 12, 8,  22, 16, 4,  4],
        lastTouches:  [22, 28, 18, 16, 10, 4,  2],
        totalRevenue: 20610000
      };

      let credits;
      switch (model) {
        case 'first_touch':
          credits = journeyData.firstTouches.map(v => v / journeyData.firstTouches.reduce((a,b)=>a+b,0) * 100);
          break;
        case 'last_touch':
          credits = journeyData.lastTouches.map(v => v / journeyData.lastTouches.reduce((a,b)=>a+b,0) * 100);
          break;
        case 'time_decay':
          const decayWeights = [0.05, 0.10, 0.15, 0.20, 0.25, 0.15, 0.10];
          const decayBase    = journeyData.touchCounts.map((t, i) => t * decayWeights[i % decayWeights.length]);
          const decayTotal   = decayBase.reduce((a, b) => a + b, 0);
          credits            = decayBase.map(v => +((v / decayTotal) * 100).toFixed(1));
          break;
        default:
          const touchTotal = journeyData.touchCounts.reduce((a, b) => a + b, 0);
          credits = journeyData.touchCounts.map(v => +((v / touchTotal) * 100).toFixed(1));
      }

      const attributedRevenue = credits.map(c => Math.round((c / 100) * journeyData.totalRevenue));

      return {
        success: true,
        model,
        availableModels: ['first_touch', 'last_touch', 'linear', 'time_decay'],
        data: channels.map((ch, i) => ({
          channel: ch,
          credit: +credits[i].toFixed(1),
          revenue: attributedRevenue[i],
          touchCount: journeyData.touchCounts[i]
        })).sort((a, b) => b.credit - a.credit),
        summary: { totalRevenue: journeyData.totalRevenue, model }
      };
    }
    
    if (pathname === '/abtests') {
      return {
        success: true,
        summary: {
          total:     demoData.abtests.length,
          running:   demoData.abtests.filter(t => t.status === 'running').length,
          completed: demoData.abtests.filter(t => t.status === 'completed').length,
          highSig:   demoData.abtests.filter(t => t.stats.significance === 'high').length,
          avgLift:   +(demoData.abtests.reduce((s, t) => s + t.stats.lift, 0) / demoData.abtests.length).toFixed(1)
        },
        data: demoData.abtests
      };
    }
    
    if (pathname === '/optimizer/scenarios') {
      const base = 5420000;
      const scenarios = [
        {
          name: 'Conservative',
          description: 'Protect proven channels. Minimize risk.',
          totalBudget: base * 0.85,
          mix: [
            { channel: 'Email',        pct: 30 },
            { channel: 'Referral',     pct: 25 },
            { channel: 'Social Media', pct: 20 },
            { channel: 'Content',      pct: 15 },
            { channel: 'Influencer',   pct: 10 }
          ],
          projectedROI: 3.4, risk: 'low', color: '#38bdf8'
        },
        {
          name: 'Balanced',
          description: 'Data-driven allocation across all channels.',
          totalBudget: base,
          mix: [
            { channel: 'Influencer',   pct: 35 },
            { channel: 'Social Media', pct: 25 },
            { channel: 'Referral',     pct: 15 },
            { channel: 'Email',        pct: 12 },
            { channel: 'Search',       pct: 8  },
            { channel: 'Content',      pct: 5  }
          ],
          projectedROI: 4.1, risk: 'medium', color: '#4ade80'
        },
        {
          name: 'Aggressive',
          description: 'Double down on highest-ROI channels.',
          totalBudget: base * 1.3,
          mix: [
            { channel: 'Influencer',   pct: 50 },
            { channel: 'Referral',     pct: 25 },
            { channel: 'Social Media', pct: 15 },
            { channel: 'Email',        pct: 10 }
          ],
          projectedROI: 4.8, risk: 'high', color: '#c084fc'
        }
      ];
      const withRevenue = scenarios.map(s => ({
        ...s,
        projectedRevenue: Math.round(s.totalBudget * s.projectedROI)
      }));
      return { success: true, data: withRevenue };
    }
    
    if (pathname === '/optimizer/budget') {
      const total = parseInt(url.searchParams.get('total')) || 5420000;
      
      const channelMetrics = {};
      demoData.campaigns.forEach(c => {
        if (!channelMetrics[c.channel]) channelMetrics[c.channel] = { roi: [], cpa: [], reach: [], count: 0 };
        channelMetrics[c.channel].roi.push(c.roi);
        channelMetrics[c.channel].cpa.push(c.cpa);
        channelMetrics[c.channel].reach.push(c.reach);
        channelMetrics[c.channel].count++;
      });

      const channels = Object.keys(channelMetrics);
      const scores   = channels.map(ch => {
        const m      = channelMetrics[ch];
        const avgROI = m.roi.reduce((a,b)=>a+b,0) / m.count;
        const avgCPA = m.cpa.reduce((a,b)=>a+b,0) / m.count;
        const avgR   = m.reach.reduce((a,b)=>a+b,0) / m.count;
        return { channel: ch, score: avgROI * 10 - avgCPA / 200 + avgR / 500000, avgROI, avgCPA };
      });

      const totalScore = scores.reduce((s, c) => s + Math.max(0, c.score), 0);

      const allocations = scores.map(ch => {
        const pct       = Math.max(3, Math.round((Math.max(0, ch.score) / totalScore) * 100));
        const amount    = Math.round((pct / 100) * total);
        const projROI   = +(ch.avgROI * (1 + pct * 0.002)).toFixed(2);
        const projRev   = Math.round(amount * projROI);
        return { channel: ch.channel, pct, amount, projROI, projRevenue: projRev, avgCPA: ch.avgCPA };
      });

      const totalPct = allocations.reduce((s, a) => s + a.pct, 0);
      allocations[0].pct += (100 - totalPct);

      const projectedRevenue = allocations.reduce((s, a) => s + a.projRevenue, 0);
      const projectedROI     = +(projectedRevenue / total).toFixed(2);
      
      const result = { allocations: allocations.sort((a,b) => b.pct - a.pct), projectedRevenue, projectedROI, totalBudget: total };

      const current  = {
        allocations: [
          { channel: 'Influencer',   pct: 35, amount: Math.round(total*0.35), currentROI: 5.6 },
          { channel: 'Social Media', pct: 25, amount: Math.round(total*0.25), currentROI: 4.1 },
          { channel: 'Search',       pct: 15, amount: Math.round(total*0.15), currentROI: 2.9 },
          { channel: 'Email',        pct: 10, amount: Math.round(total*0.10), currentROI: 3.2 },
          { channel: 'Content',      pct: 8,  amount: Math.round(total*0.08), currentROI: 2.4 },
          { channel: 'Referral',     pct: 7,  amount: Math.round(total*0.07), currentROI: 4.8 }
        ],
        projectedROI: 3.8,
        projectedRevenue: Math.round(total * 3.8)
      };

      const uplift = {
        roi: +(result.projectedROI - current.projectedROI).toFixed(2),
        revenue: result.projectedRevenue - current.projectedRevenue,
        roiPct: +(((result.projectedROI - current.projectedROI) / current.projectedROI) * 100).toFixed(1)
      };

      return { success: true, current, optimized: result, uplift };
    }
    
    if (pathname === '/retention') {
      return { success: true, data: demoData.retention };
    }
    
    if (pathname === '/kpis') {
      const quarter = url.searchParams.get('quarter') || 'Q2-2026';
      const actual = demoData.kpis.quarters[quarter];
      const target = demoData.kpis.targets[quarter];

      if (!actual) return { success: false, message: `No data for quarter: ${quarter}` };

      const scorecard = [
        { kpi: 'Total Users', unit: '', actual: actual.totalUsers, target: target?.totalUsers, prev: demoData.kpis.quarters['Q1-2026']?.totalUsers },
        { kpi: 'Campaign Reach', unit: '', actual: actual.campaignReach, target: target?.campaignReach, prev: demoData.kpis.quarters['Q1-2026']?.campaignReach },
        { kpi: 'Promo ROI', unit: '×', actual: actual.promoROI, target: target?.promoROI, prev: demoData.kpis.quarters['Q1-2026']?.promoROI },
        { kpi: 'Retention Rate', unit: '%', actual: actual.retentionRate, target: target?.retentionRate, prev: demoData.kpis.quarters['Q1-2026']?.retentionRate },
        { kpi: 'NPS Score', unit: '', actual: actual.npsScore, target: target?.npsScore, prev: demoData.kpis.quarters['Q1-2026']?.npsScore },
        { kpi: 'Green Score', unit: '/100', actual: actual.greenScore, target: target?.greenScore, prev: demoData.kpis.quarters['Q1-2026']?.greenScore },
        { kpi: 'Cost Per Acquisition', unit: '₹', actual: actual.cpa, target: target?.cpa, prev: demoData.kpis.quarters['Q1-2026']?.cpa, lowerIsBetter: true },
        { kpi: 'Email Open Rate', unit: '%', actual: actual.emailOpenRate, target: target?.emailOpenRate, prev: demoData.kpis.quarters['Q1-2026']?.emailOpenRate },
        { kpi: 'Social Follower Growth', unit: '', actual: actual.socialFollowerGrowth, target: target?.socialFollowerGrowth, prev: demoData.kpis.quarters['Q1-2026']?.socialFollowerGrowth }
      ].map(row => {
        const variance = target ? (((row.actual - row.target) / row.target) * 100).toFixed(1) : null;
        const pctChange = row.prev ? (((row.actual - row.prev) / row.prev) * 100).toFixed(1) : null;
        let status = 'on-track';
        if (target) {
          const achieved = row.lowerIsBetter ? row.actual <= row.target : row.actual >= row.target;
          const near = row.lowerIsBetter
            ? row.actual <= row.target * 1.05
            : row.actual >= row.target * 0.95;
          status = achieved ? 'achieved' : near ? 'near' : 'miss';
        }
        return { ...row, variance, pctChange, status };
      });

      return {
        success: true,
        quarter,
        available: Object.keys(demoData.kpis.quarters),
        data: actual,
        scorecard,
        liveKPIs: demoData.kpis.liveKPIs
      };
    }
    
    if (pathname === '/kpis/trend') {
      const quarters = Object.keys(demoData.kpis.quarters);
      const trend = {
        labels: quarters,
        npsScore: quarters.map(q => demoData.kpis.quarters[q].npsScore),
        retentionRate: quarters.map(q => demoData.kpis.quarters[q].retentionRate),
        promoROI: quarters.map(q => demoData.kpis.quarters[q].promoROI),
        totalUsers: quarters.map(q => demoData.kpis.quarters[q].totalUsers),
        totalRevenue: quarters.map(q => demoData.kpis.quarters[q].totalRevenue),
        cpa: quarters.map(q => demoData.kpis.quarters[q].cpa),
        emailOpenRate: quarters.map(q => demoData.kpis.quarters[q].emailOpenRate)
      };
      return { success: true, data: trend };
    }
    
    if (pathname === '/insights') {
      const topCamp = [...demoData.campaigns].sort((a, b) => b.roi - a.roi)[0];
      const topChurn = demoData.retention.churnReasons[0];

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
      return { success: true, count: insights.length, data: insights };
    }
    
    if (pathname === '/alerts/notifications') {
      const limit = parseInt(url.searchParams.get('limit')) || 5;
      let notifs = [...demoData.alerts.notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (limit) notifs = notifs.slice(0, limit);
      return {
        success: true,
        unreadCount: notifs.filter(n => !n.read).length,
        data: notifs
      };
    }
  }
  
  if (method === 'POST') {
    const body = opts.body ? JSON.parse(opts.body) : {};
    
    if (pathname === '/campaigns') {
      const { name, channel, budget, region, targetSegment, creativeType, startDate, endDate } = body;
      if (!name || !channel || !budget) {
        return { success: false, message: 'name, channel, and budget are required' };
      }

      const newCamp = {
        id: 'camp-' + String(demoData.campaigns.length + 1).padStart(3, '0'),
        name,
        channel,
        status: 'active',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || '',
        budget: Number(budget),
        spend: 0,
        revenue: 0,
        reach: 0,
        impressions: 0,
        conversions: 0,
        ctr: 0,
        cpa: 0,
        roi: 0,
        engagementRate: 0,
        region: region || 'Pan India',
        targetSegment: targetSegment || 'Millennials',
        creativeType: creativeType || 'Static Image',
        performance: 0,
        monthlyData: { reach: [0,0,0,0,0,0], conversions: [0,0,0,0,0,0] },
        tags: ['new']
      };

      demoData.campaigns.push(newCamp);
      return { success: true, message: 'Campaign created', data: newCamp };
    }
    
    if (pathname === '/optimizer/simulate') {
      const { allocations, totalBudget } = body;
      const channelROI = { 'Social Media': 4.1, 'Influencer': 5.6, 'Email': 3.2, 'Search': 2.9, 'Referral': 4.8, 'Display Ads': 3.0, 'Content': 2.4 };
      const channelCPA = { 'Social Media': 620, 'Influencer': 540, 'Email': 310, 'Search': 890, 'Referral': 280, 'Display Ads': 740, 'Content': 210 };

      const results = allocations.map(a => {
        const roi      = channelROI[a.channel] || 3.0;
        const cpa      = channelCPA[a.channel] || 600;
        const amount   = Math.round((a.pct / 100) * totalBudget);
        const revenue  = Math.round(amount * roi);
        const convs    = Math.round(amount / cpa);
        return { channel: a.channel, pct: a.pct, amount, roi, revenue, conversions: convs, cpa };
      });

      const totalRevenue    = results.reduce((s, r) => s + r.revenue, 0);
      const weightedROI     = +(totalRevenue / totalBudget).toFixed(2);
      const totalConversions = results.reduce((s, r) => s + r.conversions, 0);

      return {
        success: true,
        data: results,
        summary: { totalBudget, totalRevenue, weightedROI, totalConversions, blendedCPA: Math.round(totalBudget / totalConversions) }
      };
    }
    
    if (pathname === '/analytics/simulate-churn') {
      const { supportSLA, promoDiscount, npsScore, loyaltyMultiplier } = body;
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

      return {
        success: true,
        predictedChurn: +predictedChurn.toFixed(1),
        retainedUsers,
        churnedUsers,
        financialImpact,
        riskCategory,
        riskColor
      };
    }
    
    if (pathname === '/analytics/simulate-acquisition') {
      const { channel, spend } = body;
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

      return {
        success: true,
        channel,
        spend: budget,
        projectedROI,
        projectedCPA,
        conversions,
        reach,
        revenue,
        netProfit
      };
    }
  }
  
  if (method === 'PUT') {
    const body = opts.body ? JSON.parse(opts.body) : {};
    
    const campIdMatch = pathname.match(/^\/campaigns\/(camp-\d+)$/);
    if (campIdMatch) {
      const id = campIdMatch[1];
      const idx = demoData.campaigns.findIndex(c => c.id === id);
      if (idx !== -1) {
        demoData.campaigns[idx] = { ...demoData.campaigns[idx], ...body, id: demoData.campaigns[idx].id };
        return { success: true, message: 'Campaign updated', data: demoData.campaigns[idx] };
      }
      return { success: false, message: 'Campaign not found' };
    }
    
    const notifIdMatch = pathname.match(/^\/alerts\/notifications\/(notif-\d+)\/read$/);
    if (notifIdMatch) {
      const id = notifIdMatch[1];
      const notif = demoData.alerts.notifications.find(n => n.id === id);
      if (notif) notif.read = true;
      return { success: true, message: 'Marked as read' };
    }
    
    if (pathname === '/alerts/notifications/read-all') {
      demoData.alerts.notifications.forEach(n => n.read = true);
      return { success: true, message: 'All notifications marked as read' };
    }
  }
  
  return null;
}

async function apiFetch(path, opts={}) {
  if (isDemoMode) {
    return await handleDemoRequest(path, opts);
  }
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
  const socketUrl = (window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : window.location.origin;
  socket = io(socketUrl);
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
  await apiFetch(`/campaigns/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ status:newStatus }) });
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
  const res = await apiFetch('/campaigns', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  if (res && res.success) { showToast('🚀 Campaign launched!', 'success'); closeCampaignModal(); loadTable(); }
  else showToast(res?.message || 'Error creating campaign', 'error');
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
  let isBackendLive = false;
  const urlParams = new URLSearchParams(window.location.search);
  const forceDemo = urlParams.get('demo') === 'true';

  if (!forceDemo) {
    try {
      const healthRes = await fetch(API + '/health');
      if (healthRes.ok) {
        const health = await healthRes.json();
        if (health && health.status === 'ok') {
          isBackendLive = true;
        }
      }
    } catch (err) {
      console.warn('Backend is offline or unreachable. Switching to client-side demo mode.', err);
    }
  }

  if (isBackendLive) {
    initSocket();
    await loadOverview();
    loadTable();
    loadNotifications();
    showToast('🌿 GreenTrail Analytics Engine v3 Online', 'success');
  } else {
    await initDemoMode();
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
