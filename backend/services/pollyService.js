const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const VOICE_MAP = {
  en: { VoiceId: 'Joanna', LanguageCode: 'en-US' },
  hi: { VoiceId: 'Aditi', LanguageCode: 'hi-IN' },
  ta: { VoiceId: 'Aditi', LanguageCode: 'ta-IN' },
  te: { VoiceId: 'Aditi', LanguageCode: 'te-IN' },
  bn: { VoiceId: 'Aditi', LanguageCode: 'bn-IN' }
};

async function generateSpeech(text, languageCode = 'en') {
  const voice = VOICE_MAP[languageCode] || VOICE_MAP.en;
  
  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: voice.VoiceId,
    LanguageCode: voice.LanguageCode,
    Engine: 'neural'
  });
  
  const response = await pollyClient.send(command);
  const audioBuffer = await streamToBuffer(response.AudioStream);
  
  return audioBuffer.toString('base64');
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = {
  generateSpeech
};
