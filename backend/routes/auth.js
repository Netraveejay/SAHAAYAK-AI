const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { createUser, getUserByMobile } = require('../services/dynamoService');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const USE_DYNAMODB = process.env.USE_DYNAMODB === 'true';
const MOCK_OTP = '123456';

function getUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

router.post('/send-otp', (req, res) => {
  const raw = req.body.mobile;
  const mobile = raw != null ? String(raw).trim() : '';
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number required' });
  }
  res.json({ success: true, message: 'OTP sent (use 123456 for demo)' });
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile and OTP required' });
    }
    if (otp !== MOCK_OTP) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    let user;
    if (USE_DYNAMODB) {
      user = await getUserByMobile(mobile);
      if (!user) {
        user = await createUser(mobile);
      }
    } else {
      const users = getUsers();
      user = users.find((u) => u.mobile === mobile);
      if (!user) {
        user = {
          id: 'user_' + Date.now(),
          mobile,
          profiles: [],
          createdAt: new Date().toISOString(),
        };
        users.push(user);
        saveUsers(users);
      }
    }

    res.json({
      success: true,
      token: 'token_' + (user.userId || user.id) + '_' + Date.now(),
      user: {
        id: user.userId || user.id,
        mobile: user.mobile,
        profiles: user.profiles || [],
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router;
