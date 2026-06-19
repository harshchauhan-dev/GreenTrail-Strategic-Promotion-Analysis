const express = require('express');
const router = express.Router();

// Lazy-require data so exports always reflect latest state
function getData() {
  const campaigns = require('../data/campaigns.json');
  const kpis = require('../data/kpis.json');
  const market = require('../data/market.json');
  const retention = require('../data/retention.json');
  return { campaigns, kpis, market, retention };
}

// GET /api/export/csv — all campaigns as CSV
router.get('/csv', (req, res) => {
  const { campaigns } = getData();
  const headers = ['ID', 'Name', 'Channel', 'Status', 'Budget (₹)', 'Spend (₹)', 'Revenue (₹)', 'Reach', 'Conversions', 'CTR (%)', 'CPA (₹)', 'ROI (×)', 'Region', 'Segment', 'Start Date', 'End Date'];
  const rows = campaigns.map(c => [
    c.id, `"${c.name}"`, c.channel, c.status,
    c.budget, c.spend, c.revenue, c.reach, c.conversions,
    c.ctr, c.cpa, c.roi, c.region, c.targetSegment,
    c.startDate, c.endDate || 'Ongoing'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="GreenTrail_Campaigns_Q2_2026.csv"');
  res.send(csv);
});

// GET /api/export/report — full JSON report
router.get('/report', (req, res) => {
  const { campaigns, kpis, market, retention } = getData();

  const q2 = kpis.quarters['Q2-2026'];
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);

  const report = {
    meta: {
      title: 'GreenTrail Strategic Promotion Analysis',
      quarter: 'Q2 2026',
      generated: new Date().toISOString(),
      generatedBy: 'GreenTrail Analytics Engine v2.0'
    },
    executiveSummary: {
      totalUsers: q2.totalUsers,
      campaignReach: q2.campaignReach,
      promoROI: q2.promoROI,
      retentionRate: q2.retentionRate,
      npsScore: q2.npsScore,
      greenScore: q2.greenScore,
      totalSpend,
      totalRevenue,
      netProfit: totalRevenue - totalSpend,
      topCampaign: campaigns.sort((a,b) => b.roi - a.roi)[0]?.name
    },
    campaigns,
    kpiScorecard: Object.entries(kpis.quarters).map(([q, d]) => ({ quarter: q, ...d })),
    marketInsights: {
      segments: market.segments,
      topMotivators: market.motivators.slice(0, 3),
      marketShare: market.competitors[0].share,
      funnel: market.funnel
    },
    retention: {
      cohorts: Object.values(retention.cohorts),
      loyaltyTiers: retention.loyaltyTiers,
      churnReasons: retention.churnReasons.slice(0, 3)
    },
    recommendations: [
      { priority: 1, action: 'Scale Influencer Program to Tier 2 cities', expectedImpact: '+18% user acquisition' },
      { priority: 2, action: 'Expand Trail Inventory — 15 new operators', expectedImpact: '+6,000 retained users' },
      { priority: 3, action: 'Social Content Acceleration — 5 reels/week', expectedImpact: '+15,000 followers' },
      { priority: 4, action: 'Loyalty Tier Gamification — badges & streaks', expectedImpact: '+22% tier upgrades' }
    ]
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="GreenTrail_Q2_2026_Full_Report.json"');
  res.json(report);
});

// GET /api/export/kpi-csv — KPI scorecard as CSV
router.get('/kpi-csv', (req, res) => {
  const { kpis } = getData();
  const quarters = Object.keys(kpis.quarters);
  const keys = ['totalUsers', 'campaignReach', 'promoROI', 'retentionRate', 'npsScore', 'greenScore', 'cpa', 'emailOpenRate', 'socialFollowerGrowth', 'totalRevenue', 'totalSpend'];
  const labels = ['Total Users', 'Campaign Reach', 'Promo ROI', 'Retention Rate', 'NPS Score', 'Green Score', 'CPA (₹)', 'Email Open Rate (%)', 'Social Follower Growth', 'Total Revenue (₹)', 'Total Spend (₹)'];

  const header = ['KPI', ...quarters].join(',');
  const rows = keys.map((key, i) => [labels[i], ...quarters.map(q => kpis.quarters[q][key] ?? '')].join(','));
  const csv = [header, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="GreenTrail_KPI_Trend.csv"');
  res.send(csv);
});

module.exports = router;
