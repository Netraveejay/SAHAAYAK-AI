const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({});
const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

async function explainEligibility(userProfile, eligibleSchemes) {
  const prompt = `You are a helpful government scheme assistant. Explain why the user is eligible for these schemes in simple language.

User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Income: ₹${userProfile.income}/year
- Category: ${userProfile.category}
- Farmer: ${userProfile.farmer ? 'Yes' : 'No'}
- Disability: ${userProfile.disability ? 'Yes' : 'No'}

Eligible Schemes:
${eligibleSchemes.map(s => `- ${s.name}: ${s.description}`).join('\n')}

Provide a brief, friendly explanation (2-3 sentences) of why they qualify.`;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}

async function generateAssistantResponse(userQuery, context = '') {
  const prompt = `You are a helpful assistant for Indian government schemes. Answer the user's question clearly and concisely.

${context ? `Context: ${context}\n\n` : ''}User Question: ${userQuery}`;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    body: JSON.stringify(payload)
  });

  const response = await bedrockClient.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}

module.exports = {
  explainEligibility,
  generateAssistantResponse
};
