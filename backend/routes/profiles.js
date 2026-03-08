const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { saveProfile, getProfiles, updateProfile, deleteProfile } = require('../services/dynamoService');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const APPLICATIONS_FILE = path.join(__dirname, '../data/applications.json');
const USE_DYNAMODB = process.env.USE_DYNAMODB === 'true';

function getApplications() {
  try {
    const data = fs.readFileSync(APPLICATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveApplications(applications) {
  fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(applications, null, 2));
}

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

function getUserId(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer token_')) return null;
  const parts = auth.replace('Bearer ', '').split('_');
  if (parts.length < 3) return null;
  return parts.slice(1, -1).join('_');
}

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let profiles;
    if (USE_DYNAMODB) {
      profiles = await getProfiles(userId);
    } else {
      const users = getUsers();
      const user = users.find((u) => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      profiles = user.profiles || [];
    }
    const byId = new Map();
    (Array.isArray(profiles) ? profiles : []).forEach((p) => {
      if (p && p.id && !byId.has(p.id)) byId.set(p.id, p);
    });
    profiles = Array.from(byId.values());

    res.json({ profiles });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = req.body;
    const required = ['name', 'age', 'gender', 'state', 'occupation', 'annualIncome', 'category', 'isFarmer', 'hasDisability'];
    for (const field of required) {
      if (profile[field] === undefined || profile[field] === null || profile[field] === '') {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    const newProfile = {
      id: 'profile_' + Date.now(),
      name: String(profile.name),
      age: Number(profile.age),
      gender: String(profile.gender),
      state: String(profile.state),
      occupation: String(profile.occupation),
      annualIncome: Number(profile.annualIncome),
      category: String(profile.category),
      isFarmer: Boolean(profile.isFarmer === true || profile.isFarmer === 'Yes' || profile.isFarmer === 'true'),
      hasDisability: Boolean(profile.hasDisability === true || profile.hasDisability === 'Yes' || profile.hasDisability === 'true'),
      createdAt: new Date().toISOString(),
    };

    if (USE_DYNAMODB) {
      await saveProfile(userId, newProfile);
    } else {
      const users = getUsers();
      const user = users.find((u) => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.profiles) user.profiles = [];
      user.profiles.push(newProfile);
      saveUsers(users);
    }

    res.json({ success: true, profile: newProfile });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

router.put('/:profileId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const body = req.body;
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.age !== undefined) updates.age = Number(body.age);
    if (body.gender !== undefined) updates.gender = body.gender;
    if (body.state !== undefined) updates.state = body.state;
    if (body.occupation !== undefined) updates.occupation = body.occupation;
    if (body.annualIncome !== undefined) updates.annualIncome = Number(body.annualIncome);
    if (body.category !== undefined) updates.category = body.category;
    if (body.isFarmer !== undefined) updates.isFarmer = Boolean(body.isFarmer === true || body.isFarmer === 'Yes' || body.isFarmer === 'true');
    if (body.hasDisability !== undefined) updates.hasDisability = Boolean(body.hasDisability === true || body.hasDisability === 'Yes' || body.hasDisability === 'true');

    if (USE_DYNAMODB) {
      await updateProfile(req.params.profileId, updates);
    } else {
      const users = getUsers();
      const user = users.find((u) => u.id === userId);
      if (!user || !user.profiles) return res.status(404).json({ error: 'User or profile not found' });
      const idx = user.profiles.findIndex((p) => p.id === req.params.profileId);
      if (idx === -1) return res.status(404).json({ error: 'Profile not found' });
      Object.assign(user.profiles[idx], updates);
      saveUsers(users);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.delete('/:profileId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profileId = req.params.profileId;

    if (USE_DYNAMODB) {
      await deleteProfile(profileId);
    } else {
      const users = getUsers();
      const user = users.find((u) => u.id === userId);
      if (!user || !user.profiles) return res.status(404).json({ error: 'User or profile not found' });
      user.profiles = user.profiles.filter((p) => p.id !== profileId);
      saveUsers(users);

      const applications = getApplications();
      let changed = false;
      for (const app of applications) {
        if (app.userId === userId && app.profileId === profileId) {
          app.profileId = null;
          app.profileName = '—';
          changed = true;
        }
      }
      if (changed) saveApplications(applications);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

module.exports = router;
