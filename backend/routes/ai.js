const express = require('express');
const router = express.Router();
const pollyService = require('../services/pollyService');
const translateService = require('../services/translateService');

router.post('/text-to-speech', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    
    const audioBase64 = await pollyService.generateSpeech(text, language);
    res.json({ audio: audioBase64, format: 'mp3' });
  } catch (error) {
    console.error('Polly error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage = 'en', sourceLanguage = 'auto' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });
    
    const translated = await translateService.translateToUserLanguage(text, targetLanguage);
    res.json({ translatedText: translated });
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
