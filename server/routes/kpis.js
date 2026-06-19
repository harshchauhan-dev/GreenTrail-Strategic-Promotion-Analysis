const express = require('express');
const router = express.Router();
const kpiData = require('../data/kpis.json');

// GET /api/kpis?quarter=Q2-2026
router.get('/', (req, res) => {
  const quarter = req.query.quarter || 'Q2-2026';
  const actual = kpiData.quarters[quarter];
  const target = kpiData.targets[quarter];

  if (!actual) {
    return res.status(404).json({ success: false, message: `No data for quarter: ${quarter}` });
  }

  // Build scorecard rows
  const scorecard = [
    { kpi: 'Total Users', unit: '', actual: actual.totalUsers, target: target?.totalUsers, prev: kpiData.quarters['Q1-2026']?.totalUsers },
    { kpi: 'Campaign Reach', unit: '', actual: actual.campaignReach, target: target?.campaignReach, prev: kpiData.quarters['Q1-2026']?.campaignReach },
    { kpi: 'Promo ROI', unit: '×', actual: actual.promoROI, target: target?.promoROI, prev: kpiData.quarters['Q1-2026']?.promoROI },
    { kpi: 'Retention Rate', unit: '%', actual: actual.retentionRate, target: target?.retentionRate, prev: kpiData.quarters['Q1-2026']?.retentionRate },
    { kpi: 'NPS Score', unit: '', actual: actual.npsScore, target: target?.npsScore, prev: kpiData.quarters['Q1-2026']?.npsScore },
    { kpi: 'Green Score', unit: '/100', actual: actual.greenScore, target: target?.greenScore, prev: kpiData.quarters['Q1-2026']?.greenScore },
    { kpi: 'Cost Per Acquisition', unit: '₹', actual: actual.cpa, target: target?.cpa, prev: kpiData.quarters['Q1-2026']?.cpa, lowerIsBetter: true },
    { kpi: 'Email Open Rate', unit: '%', actual: actual.emailOpenRate, target: target?.emailOpenRate, prev: kpiData.quarters['Q1-2026']?.emailOpenRate },
    { kpi: 'Social Follower Growth', unit: '', actual: actual.socialFollowerGrowth, target: target?.socialFollowerGrowth, prev: kpiData.quarters['Q1-2026']?.socialFollowerGrowth }
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

  res.json({
    success: true,
    quarter,
    available: Object.keys(kpiData.quarters),
    data: actual,
    scorecard,
    liveKPIs: kpiData.liveKPIs
  });
});

// GET /api/kpis/trend — all quarters trend data
router.get('/trend', (req, res) => {
  const quarters = Object.keys(kpiData.quarters);
  const trend = {
    labels: quarters,
    npsScore: quarters.map(q => kpiData.quarters[q].npsScore),
    retentionRate: quarters.map(q => kpiData.quarters[q].retentionRate),
    promoROI: quarters.map(q => kpiData.quarters[q].promoROI),
    totalUsers: quarters.map(q => kpiData.quarters[q].totalUsers),
    totalRevenue: quarters.map(q => kpiData.quarters[q].totalRevenue),
    cpa: quarters.map(q => kpiData.quarters[q].cpa),
    emailOpenRate: quarters.map(q => kpiData.quarters[q].emailOpenRate)
  };
  res.json({ success: true, data: trend });
});

// GET /api/kpis/live — simulate live KPI updates
router.get('/live', (req, res) => {
  const base = kpiData.liveKPIs;
  const live = {
    activeUsers: base.activeUsers + Math.floor(Math.random() * 80) - 40,
    trailsBooked: base.trailsBooked + Math.floor(Math.random() * 20) - 10,
    revenueToday: base.revenueToday + Math.floor(Math.random() * 10000) - 5000,
    avgSessionMin: +(base.avgSessionMin + (Math.random() * 0.6 - 0.3)).toFixed(1),
    timestamp: new Date().toISOString()
  };
  res.json({ success: true, data: live });
});

module.exports = router;
