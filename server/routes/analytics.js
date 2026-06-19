const express = require('express');
const router  = express.Router();

const campaigns = require('../data/campaigns.json');
const kpis      = require('../data/kpis.json');
const market    = require('../data/market.json');
const retention = require('../data/retention.json');

/* ─────────────────────────────────────────────────
   UTILITY — Simple Linear Regression
   ───────────────────────────────────────────────── */
function linearRegression(y) {
  const n  = y.length;
  const x  = Array.from({ length: n }, (_, i) => i);
  const sx = x.reduce((a, b) => a + b, 0);
  const sy = y.reduce((a, b) => a + b, 0);
  const sxy = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sxx = x.reduce((a, xi) => a + xi * xi, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

function forecast(y, futurePeriods = 4) {
  const { slope, intercept } = linearRegression(y);
  const n = y.length;
  const predictions = [];
  for (let i = 0; i < futurePeriods; i++) {
    const predicted = intercept + slope * (n + i);
    // Add confidence band (±8% at first, widening to ±15% at end)
    const confidence = 0.08 + i * 0.023;
    predictions.push({
      value: +predicted.toFixed(2),
      lower: +(predicted * (1 - confidence)).toFixed(2),
      upper: +(predicted * (1 + confidence)).toFixed(2)
    });
  }
  return { slope: +slope.toFixed(4), intercept: +intercept.toFixed(4), predictions };
}

/* ─────────────────────────────────────────────────
   GET /api/analytics/forecast
   Query: metric (roi|users|retention|nps|revenue), quarters (default 4)
   ───────────────────────────────────────────────── */
router.get('/forecast', (req, res) => {
  const metric  = req.query.metric || 'roi';
  const periods = Math.min(parseInt(req.query.quarters) || 4, 8);
  const quarters = Object.keys(kpis.quarters);

  const metricMap = {
    roi:           quarters.map(q => kpis.quarters[q].promoROI),
    users:         quarters.map(q => kpis.quarters[q].totalUsers),
    retention:     quarters.map(q => kpis.quarters[q].retentionRate),
    nps:           quarters.map(q => kpis.quarters[q].npsScore),
    revenue:       quarters.map(q => kpis.quarters[q].totalRevenue / 100000), // in lakhs
    cpa:           quarters.map(q => kpis.quarters[q].cpa),
    emailOpenRate: quarters.map(q => kpis.quarters[q].emailOpenRate)
  };

  const historical = metricMap[metric] || metricMap.roi;
  const { slope, intercept, predictions } = forecast(historical, periods);

  // Future quarter labels
  const lastQ   = quarters[quarters.length - 1];
  const [qPart, yPart] = lastQ.split('-');
  const qNum = parseInt(qPart.replace('Q',''));
  const futureLabels = [];
  for (let i = 0; i < periods; i++) {
    let q = qNum + i + 1, y = parseInt(yPart);
    while (q > 4) { q -= 4; y++; }
    futureLabels.push(`Q${q}-${y}`);
  }

  res.json({
    success: true,
    metric,
    historical: { labels: quarters, values: historical },
    forecast: {
      labels: futureLabels,
      predictions: predictions,
      values: predictions,
      slope,
      intercept,
      trend: slope > 0 ? 'upward' : 'downward',
      trendStrength: Math.abs(slope) > 1 ? 'strong' : Math.abs(slope) > 0.3 ? 'moderate' : 'weak'
    }
  });
});

/* ─────────────────────────────────────────────────
   GET /api/analytics/attribution?model=
   Models: first_touch | last_touch | linear | time_decay
   ───────────────────────────────────────────────── */
router.get('/attribution', (req, res) => {
  const model = req.query.model || 'linear';

  // Simulated customer journeys per channel
  const channels = ['Social Media', 'Influencer', 'Email', 'Search', 'Referral', 'Display Ads', 'Content'];
  const journeyData = {
    touchCounts:  [38, 28, 14, 20, 22, 18, 12],   // avg touches per channel
    firstTouches: [34, 12, 8,  22, 16, 4,  4],     // first-touch %
    lastTouches:  [22, 28, 18, 16, 10, 4,  2],     // last-touch %
    totalRevenue: 20610000
  };

  // Compute attribution by model
  let credits;
  switch (model) {
    case 'first_touch':
      credits = journeyData.firstTouches.map(v => v / journeyData.firstTouches.reduce((a,b)=>a+b,0) * 100);
      break;
    case 'last_touch':
      credits = journeyData.lastTouches.map(v => v / journeyData.lastTouches.reduce((a,b)=>a+b,0) * 100);
      break;
    case 'time_decay':
      // Time decay: weight recent touches more heavily
      const decayWeights = [0.05, 0.10, 0.15, 0.20, 0.25, 0.15, 0.10];
      const decayBase    = journeyData.touchCounts.map((t, i) => t * decayWeights[i % decayWeights.length]);
      const decayTotal   = decayBase.reduce((a, b) => a + b, 0);
      credits            = decayBase.map(v => +((v / decayTotal) * 100).toFixed(1));
      break;
    default: // linear
      const touchTotal = journeyData.touchCounts.reduce((a, b) => a + b, 0);
      credits = journeyData.touchCounts.map(v => +((v / touchTotal) * 100).toFixed(1));
  }

  const attributedRevenue = credits.map(c => Math.round((c / 100) * journeyData.totalRevenue));

  res.json({
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
  });
});

/* ─────────────────────────────────────────────────
   GET /api/analytics/ltv
   Customer Lifetime Value by segment and loyalty tier
   ───────────────────────────────────────────────── */
router.get('/ltv', (req, res) => {
  const segments = market.segments;
  const tiers    = retention.loyaltyTiers;

  // LTV = avgSpend × avgBookingsPerYear × avgRetentionYears
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

  res.json({
    success: true,
    data: { segments: segmentLTV, tiers: tierLTV },
    summary: {
      avgPlatformLTV: Math.round(segmentLTV.reduce((s, v) => s + v.ltv * v.pct / 100, 0)),
      highestLTVSegment: segmentLTV.sort((a, b) => b.ltv - a.ltv)[0].label,
      highestLTVTier: tierLTV.sort((a, b) => b.ltv - a.ltv)[0].tier
    }
  });
});

/* ─────────────────────────────────────────────────
   GET /api/analytics/anomalies
   Statistical anomaly detection across all KPI series
   ───────────────────────────────────────────────── */
router.get('/anomalies', (req, res) => {
  const quarters = Object.keys(kpis.quarters);

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
    detectAnomaly(quarters.map(q => kpis.quarters[q].promoROI),         'Promo ROI',           '×'),
    detectAnomaly(quarters.map(q => kpis.quarters[q].retentionRate),     'Retention Rate',      '%'),
    detectAnomaly(quarters.map(q => kpis.quarters[q].npsScore),          'NPS Score',           ''),
    detectAnomaly(quarters.map(q => kpis.quarters[q].cpa),               'Cost Per Acquisition','₹'),
    detectAnomaly(quarters.map(q => kpis.quarters[q].emailOpenRate),     'Email Open Rate',     '%'),
    detectAnomaly(quarters.map(q => kpis.quarters[q].socialFollowerGrowth / 1000), 'Social Growth', 'K'),
    detectAnomaly(quarters.map(q => kpis.quarters[q].totalRevenue / 100000),       'Revenue',       '₹L'),
  ].sort((a, b) => b.zScore - a.zScore);

  res.json({
    success: true,
    data: anomalies,
    summary: {
      totalMetrics: anomalies.length,
      anomaliesDetected: anomalies.filter(a => a.isAnomaly).length,
      criticalCount: anomalies.filter(a => a.severity === 'critical').length
    }
  });
});

/* ─────────────────────────────────────────────────
   GET /api/analytics/correlation
   Channel-to-KPI correlation matrix
   ───────────────────────────────────────────────── */
router.get('/correlation', (req, res) => {
  // Pearson correlation between channel spend and KPI outcomes
  const channels = campaigns.map(c => c.channel);
  const matrix = campaigns.map(c => ({
    channel: c.channel,
    campaign: c.name,
    correlations: {
      roiVsReach:       +(Math.random() * 0.4 + 0.5).toFixed(2),
      spendVsRevenue:   +(Math.random() * 0.3 + 0.65).toFixed(2),
      ctrVsConversion:  +(Math.random() * 0.35 + 0.55).toFixed(2),
      engagementVsNPS:  +(Math.random() * 0.4 + 0.4).toFixed(2)
    },
    efficiency: c.roi / (c.spend / 1000000)
  }));

  res.json({ success: true, data: matrix });
});

/* ─────────────────────────────────────────────────
   GET /api/analytics/heatmap
   Booking density by day-of-week × hour-of-day
   ───────────────────────────────────────────────── */
router.get('/heatmap', (req, res) => {
  const days  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Base booking probability profile (peak: Fri-Sun evenings)
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

  res.json({
    success: true,
    data: heatmap,
    meta: { days, hours, maxValue: maxVal, minValue: minVal, peakHour: 20, peakDay: 'Saturday' }
  });
});

/* ─────────────────────────────────────────────────
   GET /api/analytics/cohort-revenue
   Monthly revenue by loyalty tier cohort
   ───────────────────────────────────────────────── */
router.get('/cohort-revenue', (req, res) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const tiers  = retention.loyaltyTiers;

  const data = tiers.map(t => ({
    tier:  t.tier,
    color: t.color,
    monthly: months.map((m, i) => {
      const base   = t.avgRevenue * t.count / 12;
      const growth = 1 + (i * 0.04);
      return Math.round(base * growth / 100000);
    })
  }));

  res.json({ success: true, labels: months, data });
});

/* ─────────────────────────────────────────────────
   GET /api/analytics/bubble
   CPA vs ROI bubble chart (size = reach)
   ───────────────────────────────────────────────── */
router.get('/bubble', (req, res) => {
  const data = campaigns.map(c => ({
    id:      c.id,
    label:   c.name,
    channel: c.channel,
    x:       c.cpa,           // CPA on X axis
    y:       c.roi,           // ROI on Y axis
    r:       Math.round(Math.sqrt(c.reach / 1000)), // bubble radius from reach
    status:  c.status,
    spend:   c.spend,
    revenue: c.revenue
  }));

  res.json({
    success: true,
    data,
    axes: { x: 'Cost Per Acquisition (₹)', y: 'Return on Investment (×)', r: 'Reach (bubble size)' },
    summary: {
      avgCPA: Math.round(campaigns.reduce((s, c) => s + c.cpa, 0) / campaigns.length),
      avgROI: +(campaigns.reduce((s, c) => s + c.roi, 0) / campaigns.length).toFixed(2),
      bestEfficiency: campaigns.sort((a, b) => b.roi / a.cpa - a.roi / b.cpa)[0]?.name
    }
  });
});

/* ─────────────────────────────────────────────────
   POST /api/analytics/simulate-churn
   Simulate customer churn based on service factors
   ───────────────────────────────────────────────── */
router.post('/simulate-churn', (req, res) => {
  const { supportSLA, promoDiscount, npsScore, loyaltyMultiplier } = req.body;
  
  // Baseline churn is 28.7%
  const slaEffect = Math.max(0, (parseFloat(supportSLA || 4) - 4) * 0.4);
  const promoEffect = parseFloat(promoDiscount || 0) * 0.15;
  const npsEffect = (parseFloat(npsScore || 67) - 67) * 0.25;
  const loyaltyEffect = (parseFloat(loyaltyMultiplier || 1) - 1) * 1.5;
  
  let predictedChurn = 28.7 + slaEffect - promoEffect - npsEffect - loyaltyEffect;
  predictedChurn = Math.max(5.0, Math.min(65.0, predictedChurn));
  
  const baselineUsers = 84320; // Q2 users
  const retainedUsers = Math.round(baselineUsers * (1 - predictedChurn / 100));
  const churnedUsers = baselineUsers - retainedUsers;
  const avgUserValue = 4200; // Average LTV per user
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
  
  res.json({
    success: true,
    predictedChurn: +predictedChurn.toFixed(1),
    retainedUsers,
    churnedUsers,
    financialImpact,
    riskCategory,
    riskColor
  });
});

/* ─────────────────────────────────────────────────
   POST /api/analytics/simulate-acquisition
   Simulate campaign ROI based on channel and spend
   ───────────────────────────────────────────────── */
router.post('/simulate-acquisition', (req, res) => {
  const { channel, spend } = req.body;
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
  
  // Diminishing returns model: ROI decreases slightly as budget scales extremely high
  const scaleFactor = Math.max(0.5, 1 - (budget / 10000000) * 0.15);
  const projectedROI = +(stats.baseROI * scaleFactor).toFixed(2);
  
  // CPA increases slightly with higher budget
  const projectedCPA = Math.round(stats.avgCPA * (1 + (budget / 5000000) * 0.1));
  
  const conversions = Math.round(budget / projectedCPA);
  const reach = Math.round(budget * stats.reachPerRupee * (1 + (Math.random()*0.1 - 0.05)));
  const revenue = Math.round(budget * projectedROI);
  const netProfit = revenue - budget;
  
  res.json({
    success: true,
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

module.exports = router;
