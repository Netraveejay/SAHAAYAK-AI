const axios = require('axios');
const cheerio = require('cheerio');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const bedrockClient = new BedrockRuntimeClient({});
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PENDING_SCHEMES_TABLE = process.env.PENDING_SCHEMES_TABLE || 'SahaayakPendingSchemes';

// List of government websites to crawl
const SCHEME_SOURCES = [
  'https://www.india.gov.in/spotlight/pradhan-mantri-jan-dhan-yojana',
  'https://pmkisan.gov.in',
  'https://pmaymis.gov.in',
  'https://pmjay.gov.in'
];

async function crawlWebsite(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    // Extract text content
    const pageText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);
    
    return pageText;
  } catch (error) {
    console.error(`Failed to crawl ${url}:`, error.message);
    return null;
  }
}

async function extractSchemeWithAI(pageText, sourceUrl) {
  const prompt = `Extract government scheme details from this webpage text. Return JSON with:
{
  "name": "scheme name",
  "description": "brief description",
  "eligibility": {
    "maxIncome": number or null,
    "minAge": number or null,
    "categories": ["General", "OBC", "SC", "ST"] or null,
    "farmer": true/false or null,
    "disability": true/false or null
  },
  "benefits": "what beneficiary gets",
  "link": "official website"
}

Webpage text:
${pageText}

Return only valid JSON, no explanation.`;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  };

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  const schemeData = JSON.parse(result.content[0].text);
  
  return {
    ...schemeData,
    sourceUrl,
    extractedAt: new Date().toISOString(),
    status: 'pending'
  };
}

async function savePendingScheme(scheme) {
  const schemeId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await docClient.send(new PutCommand({
    TableName: PENDING_SCHEMES_TABLE,
    Item: {
      schemeId,
      ...scheme
    }
  }));
  
  return schemeId;
}

async function runCrawler() {
  console.log('Starting scheme crawler...');
  const results = [];
  
  for (const url of SCHEME_SOURCES) {
    console.log(`Crawling: ${url}`);
    
    const pageText = await crawlWebsite(url);
    if (!pageText) continue;
    
    try {
      const scheme = await extractSchemeWithAI(pageText, url);
      const schemeId = await savePendingScheme(scheme);
      
      results.push({ success: true, schemeId, url });
      console.log(`✓ Extracted scheme from ${url}`);
    } catch (error) {
      results.push({ success: false, url, error: error.message });
      console.error(`✗ Failed to extract from ${url}:`, error.message);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

module.exports = {
  runCrawler,
  crawlWebsite,
  extractSchemeWithAI
};
