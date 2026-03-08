const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: 'ap-south-1' });
const translateClient = new TranslateClient({ region: 'ap-south-1' });
const pollyClient = new PollyClient({ region: 'ap-south-1' });
const s3Client = new S3Client({ region: 'ap-south-1' });

const SCHEMES_TABLE = process.env.SCHEMES_TABLE || 'SahaayakSchemes';
const AUDIO_BUCKET = process.env.AUDIO_BUCKET || 'sahaayak-audio-output';

exports.handler = async (event) => {
  try {
    const input = JSON.parse(event.body);
    const { occupation, landSize, incomeLevel, state, preferredLanguage = 'en' } = input;

    // Step 1: Fetch all schemes from DynamoDB
    const schemes = await fetchSchemes();
    
    // Step 2: Use Bedrock to recommend and explain
    const recommendation = await getAIRecommendation(schemes, input);
    
    // Step 3: Translate if needed
    let explanationText = recommendation.explanation;
    if (preferredLanguage !== 'en') {
      explanationText = await translateText(explanationText, 'en', preferredLanguage);
    }
    
    // Step 4: Convert to speech with Polly
    const audioUrl = await textToSpeech(explanationText, preferredLanguage);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        schemeName: recommendation.schemeName,
        benefits: recommendation.benefits,
        explanationText,
        audioUrl,
        eligibilityReasons: recommendation.reasons
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function fetchSchemes() {
  const result = await docClient.send(new ScanCommand({
    TableName: SCHEMES_TABLE
  }));
  return result.Items || [];
}

async function getAIRecommendation(schemes, userInput) {
  const prompt = `You are an AI assistant helping rural Indian citizens find government schemes.

User Profile:
- Occupation: ${userInput.occupation}
- Land Size: ${userInput.landSize || 'Not specified'}
- Income Level: ${userInput.incomeLevel}
- State: ${userInput.state}

Available Schemes:
${schemes.map(s => `- ${s.name}: ${s.description} (Eligibility: ${JSON.stringify(s.eligibility)})`).join('\n')}

Task:
1. Recommend the MOST suitable scheme for this user
2. Explain in simple, rural-friendly language WHY they qualify
3. List specific eligibility criteria they meet

Respond in JSON format:
{
  "schemeName": "scheme name",
  "benefits": "brief benefits description",
  "explanation": "simple explanation in 2-3 sentences",
  "reasons": ["reason 1", "reason 2", "reason 3"]
}`;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: prompt
    }]
  };

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const aiResponse = JSON.parse(responseBody.content[0].text);
  
  return aiResponse;
}

async function translateText(text, sourceLang, targetLang) {
  const command = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: sourceLang,
    TargetLanguageCode: targetLang
  });
  
  const response = await translateClient.send(command);
  return response.TranslatedText;
}

async function textToSpeech(text, language) {
  const voiceMap = {
    en: 'Joanna',
    hi: 'Aditi',
    ta: 'Aditi',
    te: 'Aditi',
    bn: 'Aditi'
  };

  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: voiceMap[language] || 'Joanna',
    Engine: 'neural'
  });

  const response = await pollyClient.send(command);
  const audioBuffer = await streamToBuffer(response.AudioStream);
  
  // Upload to S3
  const key = `audio/${Date.now()}.mp3`;
  await s3Client.send(new PutObjectCommand({
    Bucket: AUDIO_BUCKET,
    Key: key,
    Body: audioBuffer,
    ContentType: 'audio/mpeg'
  }));

  return `https://${AUDIO_BUCKET}.s3.ap-south-1.amazonaws.com/${key}`;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
