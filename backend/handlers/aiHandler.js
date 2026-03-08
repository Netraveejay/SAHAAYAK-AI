const { generateAssistantResponse } = require('../services/bedrockService');
const { translateToEnglish, translateToUserLanguage } = require('../services/translateService');
const { generateSpeech } = require('../services/pollyService');
const { getEligibleSchemesWithExplanation } = require('../services/eligibilityService');
const fs = require('fs');
const path = require('path');

async function chatWithAssistant(event) {
  const { query, language = 'en' } = JSON.parse(event.body);
  
  const englishQuery = await translateToEnglish(query, language);
  const response = await generateAssistantResponse(englishQuery);
  const translatedResponse = await translateToUserLanguage(response, language);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ response: translatedResponse })
  };
}

async function textToSpeech(event) {
  const { text, language = 'en' } = JSON.parse(event.body);
  
  const audioUrl = await generateSpeech(text, language);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ audioUrl })
  };
}

async function getEligibleSchemes(event) {
  const profile = JSON.parse(event.body);
  
  const schemesPath = path.join(__dirname, '../data/schemes.json');
  const schemes = JSON.parse(fs.readFileSync(schemesPath, 'utf-8'));
  
  const result = await getEligibleSchemesWithExplanation(profile, schemes);
  
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}

async function translateText(event) {
  const { text, sourceLanguage, targetLanguage } = JSON.parse(event.body);
  
  let translated = text;
  if (sourceLanguage !== 'en') {
    translated = await translateToEnglish(text, sourceLanguage);
  }
  if (targetLanguage !== 'en') {
    translated = await translateToUserLanguage(translated, targetLanguage);
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ translatedText: translated })
  };
}

module.exports = {
  chatWithAssistant,
  textToSpeech,
  getEligibleSchemes,
  translateText
};
