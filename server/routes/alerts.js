const express = require('express');
const router  = express.Router();
const kpis    = require('../data/kpis.json');

let alertsData = require('../data/alerts.json');

// GET /api/alerts — all rules and notifications
router.get('/', (req, res) => {
  const unread = alertsData.notifications.filter(n => !n.read).length;
  res.json({
    success: true,
    unreadCount: unread,
    rules: alertsData.rules,
    notifications: alertsData.notifications
  });
});

// GET /api/alerts/notifications — notifications only (for bell dropdown)
router.get('/notifications', (req, res) => {
  const { limit } = req.query;
  let notifs = [...alertsData.notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (limit) notifs = notifs.slice(0, parseInt(limit));
  res.json({
    success: true,
    unreadCount: notifs.filter(n => !n.read).length,
    data: notifs
  });
});

// PUT /api/alerts/notifications/:id/read — mark as read
router.put('/notifications/:id/read', (req, res) => {
  const notif = alertsData.notifications.find(n => n.id === req.params.id);
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
  notif.read = true;
  res.json({ success: true, message: 'Marked as read' });
});

// PUT /api/alerts/notifications/read-all — mark all as read
router.put('/notifications/read-all', (req, res) => {
  alertsData.notifications.forEach(n => n.read = true);
  res.json({ success: true, message: 'All notifications marked as read' });
});

// GET /api/alerts/check — run alert rules against live KPIs
router.get('/check', (req, res) => {
  const q2 = kpis.quarters['Q2-2026'];
  const kpiMap = {
    cpa:           q2.cpa,
    retentionRate: q2.retentionRate,
    roi:           q2.promoROI,
    emailOpenRate: q2.emailOpenRate,
    npsScore:      q2.npsScore
  };

  const triggered = alertsData.rules.map(rule => {
    if (!rule.active) return null;
    const val     = kpiMap[rule.metric];
    let triggered = false;
    if (rule.condition === 'gt') triggered = val > rule.threshold;
    if (rule.condition === 'lt') triggered = val < rule.threshold;
    return { ...rule, currentValue: val, triggered };
  }).filter(Boolean);

  res.json({
    success: true,
    data: triggered,
    summary: {
      total: triggered.length,
      triggeredCount: triggered.filter(r => r.triggered).length
    }
  });
});

module.exports = router;
