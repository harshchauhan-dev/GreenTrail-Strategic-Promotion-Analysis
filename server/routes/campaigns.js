const express = require('express');
const router = express.Router();
const campaigns = require('../data/campaigns.json');

let campaignStore = [...campaigns];

// GET /api/campaigns — all campaigns with optional filters
router.get('/', (req, res) => {
  let result = [...campaignStore];
  const { channel, status, q, sort } = req.query;

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
    avgROI: +(result.reduce((s, c) => s + c.roi, 0) / result.length).toFixed(2)
  };

  res.json({ success: true, summary, data: result });
});

// GET /api/campaigns/channels — channel breakdown for doughnut
router.get('/channels', (req, res) => {
  const channelMap = {};
  campaignStore.forEach(c => {
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

  res.json({ success: true, data: result });
});

// GET /api/campaigns/:id — single campaign detail
router.get('/:id', (req, res) => {
  const camp = campaignStore.find(c => c.id === req.params.id);
  if (!camp) return res.status(404).json({ success: false, message: 'Campaign not found' });

  // Compute efficiency score
  const efficiencyScore = Math.round((camp.roi / 6) * 40 + (camp.engagementRate / 10) * 30 + (camp.performance / 100) * 30);

  res.json({ success: true, data: { ...camp, efficiencyScore } });
});

// POST /api/campaigns — create new campaign
router.post('/', (req, res) => {
  const { name, channel, budget, region, targetSegment, creativeType, startDate, endDate } = req.body;
  if (!name || !channel || !budget) {
    return res.status(400).json({ success: false, message: 'name, channel, and budget are required' });
  }

  const newCamp = {
    id: 'camp-' + String(campaignStore.length + 1).padStart(3, '0'),
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

  campaignStore.push(newCamp);
  res.status(201).json({ success: true, message: 'Campaign created', data: newCamp });
});

// PUT /api/campaigns/:id — update campaign
router.put('/:id', (req, res) => {
  const idx = campaignStore.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Campaign not found' });

  campaignStore[idx] = { ...campaignStore[idx], ...req.body, id: campaignStore[idx].id };
  res.json({ success: true, message: 'Campaign updated', data: campaignStore[idx] });
});

// DELETE /api/campaigns/:id
router.delete('/:id', (req, res) => {
  const idx = campaignStore.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Campaign not found' });
  campaignStore.splice(idx, 1);
  res.json({ success: true, message: 'Campaign deleted' });
});

module.exports = router;
module.exports.getCampaignStore = () => campaignStore;
