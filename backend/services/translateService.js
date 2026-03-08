const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate');

const translateClient = new TranslateClient({});

const LANG_MAP = {
  en: 'en',
  hi: 'hi',
  ta: 'ta',
  te: 'te',
  bn: 'bn'
};

async function translateToEnglish(text, sourceLanguage) {
  if (sourceLanguage === 'en') return text;
  
  const sourceLang = LANG_MAP[sourceLanguage] || sourceLanguage;
  
  const command = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: sourceLang,
    TargetLanguageCode: 'en'
  });
  
  const response = await translateClient.send(command);
  return response.TranslatedText;
}

async function translateToUserLanguage(text, targetLanguage) {
  if (targetLanguage === 'en') return text;
  
  const targetLang = LANG_MAP[targetLanguage] || targetLanguage;
  
  const command = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: 'en',
    TargetLanguageCode: targetLang
  });
  
  const response = await translateClient.send(command);
  return response.TranslatedText;
}

module.exports = {
  translateToEnglish,
  translateToUserLanguage
};
