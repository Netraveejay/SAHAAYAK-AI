const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const schemes = [
  {
    schemeId: 'pm-kisan',
    name: 'PM-KISAN',
    description: 'Direct income support of ₹6000/year to farmer families',
    benefits: '₹2000 every 4 months directly to bank account',
    eligibility: {
      occupation: ['Farmer'],
      landSize: ['any'],
      incomeLevel: ['Low', 'Medium'],
      states: ['all']
    }
  },
  {
    schemeId: 'pmay-gramin',
    name: 'Pradhan Mantri Awas Yojana - Gramin',
    description: 'Housing assistance for rural poor',
    benefits: '₹1.2 lakh assistance for house construction',
    eligibility: {
      occupation: ['any'],
      incomeLevel: ['Low'],
      states: ['all']
    }
  },
  {
    schemeId: 'ayushman-bharat',
    name: 'Ayushman Bharat PM-JAY',
    description: 'Free health insurance up to ₹5 lakh',
    benefits: 'Cashless treatment at empaneled hospitals',
    eligibility: {
      occupation: ['any'],
      incomeLevel: ['Low'],
      states: ['all']
    }
  }
];

async function populateSchemes() {
  for (const scheme of schemes) {
    await docClient.send(new PutCommand({
      TableName: 'SahaayakSchemes',
      Item: scheme
    }));
    console.log(`Added: ${scheme.name}`);
  }
  console.log('All schemes added!');
}

populateSchemes().catch(console.error);
