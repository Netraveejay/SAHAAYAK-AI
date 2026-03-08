const express = require('express');
const router = express.Router();
const { listPendingSchemes, approveScheme, rejectScheme } = require('../handlers/adminHandler');

// Simple admin auth (in production, use proper auth)
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin_secret_token';

function isAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

router.get('/pending-schemes', isAdmin, async (req, res) => {
  try {
    const result = await listPendingSchemes({ headers: req.headers });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/approve-scheme', isAdmin, async (req, res) => {
  try {
    const result = await approveScheme({ body: JSON.stringify(req.body) });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reject-scheme', isAdmin, async (req, res) => {
  try {
    const result = await rejectScheme({ body: JSON.stringify(req.body) });
    res.status(result.statusCode).json(JSON.parse(result.body));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
