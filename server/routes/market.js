const express = require('express');
const router = express.Router();
const market = require('../data/market.json');

// GET /api/market/segments
router.get('/segments', (req, res) => {
  res.json({ success: true, data: market.segments, meta: market.surveyMeta });
});

// GET /api/market/motivators
router.get('/motivators', (req, res) => {
  res.json({ success: true, data: market.motivators });
});

// GET /api/market/competitors
router.get('/competitors', (req, res) => {
  res.json({ success: true, data: market.competitors });
});

// GET /api/market/funnel
router.get('/funnel', (req, res) => {
  const funnel = market.funnel.map((stage, i) => ({
    ...stage,
    dropOff: i > 0
      ? +((1 - stage.users / market.funnel[i - 1].users) * 100).toFixed(1)
      : 0
  }));
  res.json({ success: true, data: funnel });
});

// GET /api/market/geography
router.get('/geography', (req, res) => {
  const total = market.geography.reduce((s, r) => s + r.bookings, 0);
  const data = market.geography.map(r => ({
    ...r,
    sharePct: +((r.bookings / total) * 100).toFixed(1)
  })).sort((a, b) => b.bookings - a.bookings);
  res.json({ success: true, data, totalBookings: total });
});

// GET /api/market — full market summary
router.get('/', (req, res) => {
  const totalReach = market.funnel[0].users;
  const bookings = market.funnel[market.funnel.length - 1].users;
  res.json({
    success: true,
    data: {
      segments: market.segments,
      motivators: market.motivators,
      competitors: market.competitors,
      funnel: market.funnel,
      geography: market.geography,
      surveyMeta: market.surveyMeta
    },
    summary: {
      totalReach,
      bookings,
      overallConversionRate: +((bookings / totalReach) * 100).toFixed(2),
      marketLeader: 'GreenTrail',
      marketShare: market.competitors[0].share
    }
  });
});

module.exports = router;
