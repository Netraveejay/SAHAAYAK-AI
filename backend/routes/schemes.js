const express = require('express');
const router = express.Router();
const { getAllSchemes } = require('../services/dynamoService');
const { getEligibleSchemesWithExplanation } = require('../services/eligibilityService');

router.get('/', async (req, res) => {
  try {
    const schemes = await getAllSchemes();
    res.json({ schemes });
  } catch (error) {
    console.error('Get schemes error:', error);
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

router.post('/eligible', async (req, res) => {
  try {
    const profile = req.body;
    if (!profile || typeof profile.annualIncome !== 'number') {
      return res.status(400).json({ error: 'Profile with annualIncome required' });
    }

    const schemes = await getAllSchemes();
    const normalizedProfile = {
      ...profile,
      income: profile.annualIncome,
      farmer: profile.isFarmer,
      disability: profile.hasDisability
    };
    
    const result = await getEligibleSchemesWithExplanation(normalizedProfile, schemes);
    res.json({ schemes: result.schemes, explanation: result.explanation });
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

module.exports = router;
