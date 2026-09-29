const express = require('express');
const router  = express.Router();
const campaigns = require('../data/campaigns.json');

/* ─────────────────────────────────────────────────
   Optimizer Engine
   Uses a simplified Markowitz-style allocation based on ROI/CPA efficiency
   ───────────────────────────────────────────────── */
function computeOptimalAllocation(totalBudget, constraints = {}) {
  // Compute efficiency score per channel
  const channelMetrics = {};
  campaigns.forEach(c => {
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
    // Efficiency: higher ROI, lower CPA = better
    return { channel: ch, score: avgROI * 10 - avgCPA / 200 + avgR / 500000, avgROI, avgCPA };
  });

  const totalScore = scores.reduce((s, c) => s + Math.max(0, c.score), 0);

  const allocations = scores.map(ch => {
    const pct       = Math.max(3, Math.round((Math.max(0, ch.score) / totalScore) * 100));
    const amount    = Math.round((pct / 100) * totalBudget);
    const projROI   = +(ch.avgROI * (1 + pct * 0.002)).toFixed(2);
    const projRev   = Math.round(amount * projROI);
    return { channel: ch.channel, pct, amount, projROI, projRevenue: projRev, avgCPA: ch.avgCPA };
  });

  // Normalize to 100%
  const totalPct = allocations.reduce((s, a) => s + a.pct, 0);
  allocations[0].pct += (100 - totalPct);

  const projectedRevenue = allocations.reduce((s, a) => s + a.projRevenue, 0);
  const projectedROI     = +(projectedRevenue / totalBudget).toFixed(2);

  return { allocations: allocations.sort((a,b) => b.pct - a.pct), projectedRevenue, projectedROI, totalBudget };
}

/* ─────────────────────────────────────────────────
   GET /api/optimizer/budget?total=5420000
   Returns mathematically optimal channel allocation
   ───────────────────────────────────────────────── */
router.get('/budget', (req, res) => {
  const total    = parseInt(req.query.total) || 5420000;
  const result   = computeOptimalAllocation(total);
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

  res.json({ success: true, current, optimized: result, uplift });
});

/* ─────────────────────────────────────────────────
   POST /api/optimizer/simulate
   Body: { allocations: [{channel, pct}], totalBudget }
   Returns: projected ROI and revenue for custom mix
   ───────────────────────────────────────────────── */
router.post('/simulate', (req, res) => {
  const { allocations, totalBudget } = req.body;
  if (!allocations || !totalBudget) {
    return res.status(400).json({ success: false, message: 'allocations and totalBudget required' });
  }

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

  res.json({
    success: true,
    data: results,
    summary: { totalBudget, totalRevenue, weightedROI, totalConversions, blendedCPA: Math.round(totalBudget / totalConversions) }
  });
});

/* ─────────────────────────────────────────────────
   GET /api/optimizer/scenarios
   Returns 3 pre-computed scenarios (conservative/balanced/aggressive)
   ───────────────────────────────────────────────── */
router.get('/scenarios', (req, res) => {
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

  res.json({ success: true, data: withRevenue });
});

module.exports = router;
