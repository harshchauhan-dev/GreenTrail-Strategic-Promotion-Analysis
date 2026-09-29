const express = require('express');
const router  = express.Router();

let abTests = require('../data/abtests.json');

// GET /api/abtests — all tests
router.get('/', (req, res) => {
  const { status } = req.query;
  let data = [...abTests];
  if (status) data = data.filter(t => t.status === status);

  const summary = {
    total:     data.length,
    running:   data.filter(t => t.status === 'running').length,
    completed: data.filter(t => t.status === 'completed').length,
    highSig:   data.filter(t => t.stats.significance === 'high').length,
    avgLift:   +(data.reduce((s, t) => s + t.stats.lift, 0) / data.length).toFixed(1)
  };

  res.json({ success: true, summary, data });
});

// GET /api/abtests/:id — single test with full detail
router.get('/:id', (req, res) => {
  const test = abTests.find(t => t.id === req.params.id);
  if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

  // Compute sample size needed for significance
  const sampleA    = test.variants.A.impressions;
  const sampleB    = test.variants.B.impressions;
  const convRateA  = test.variants.A.conversions / sampleA;
  const convRateB  = test.variants.B.conversions / sampleB;
  const relLift    = ((convRateB - convRateA) / convRateA * 100).toFixed(1);

  res.json({
    success: true,
    data: {
      ...test,
      analysis: {
        conversionRateA: +(convRateA * 100).toFixed(2),
        conversionRateB: +(convRateB * 100).toFixed(2),
        relativeLift:    +relLift,
        sampleA, sampleB,
        revenueUplift:   test.variants.B.revenue - test.variants.A.revenue,
        recommendation:  test.stats.winner === 'B'
          ? `Roll out Variant B (${test.variants.B.name}) to 100% of traffic`
          : `Continue with Variant A — insufficient evidence for B`
      }
    }
  });
});

// GET /api/abtests/summary/significance — significance distribution
router.get('/summary/significance', (req, res) => {
  const sigGroups = { high: [], medium: [], low: [] };
  abTests.forEach(t => {
    const group = t.stats.significance || 'low';
    (sigGroups[group] = sigGroups[group] || []).push(t);
  });

  res.json({
    success: true,
    data: {
      highSignificance:   sigGroups.high   || [],
      mediumSignificance: sigGroups.medium || [],
      lowSignificance:    sigGroups.low    || [],
      totalLift: +(abTests.reduce((s, t) => s + t.stats.lift, 0) / abTests.length).toFixed(1),
      totalRevenueUplift: abTests.reduce((s, t) => s + (t.variants.B.revenue - t.variants.A.revenue), 0)
    }
  });
});

module.exports = router;
