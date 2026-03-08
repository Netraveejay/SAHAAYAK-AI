const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SCHEMES_TABLE = process.env.SCHEMES_TABLE || 'SahaayakSchemes';
const SCHEMES_FILE = path.join(__dirname, 'data/schemes.json');

async function migrateSchemes() {
  console.log('Reading schemes from', SCHEMES_FILE);
  const data = fs.readFileSync(SCHEMES_FILE, 'utf8');
  const schemes = JSON.parse(data);
  
  console.log(`Found ${schemes.length} schemes to migrate`);
  
  for (const scheme of schemes) {
    const item = {
      schemeId: scheme.id,
      ...scheme,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: SCHEMES_TABLE,
      Item: item
    }));
    
    console.log(`Migrated: ${scheme.id}`);
  }
  
  console.log('Migration complete!');
}

migrateSchemes().catch(console.error);
