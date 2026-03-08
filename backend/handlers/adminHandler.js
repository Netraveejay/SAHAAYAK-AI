const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, UpdateCommand, DeleteCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const PENDING_SCHEMES_TABLE = process.env.PENDING_SCHEMES_TABLE || 'SahaayakPendingSchemes';
const SCHEMES_FILE = path.join(__dirname, '../data/schemes.json');

async function listPendingSchemes(event) {
  const result = await docClient.send(new ScanCommand({
    TableName: PENDING_SCHEMES_TABLE,
    FilterExpression: '#status = :pending',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':pending': 'pending' }
  }));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ schemes: result.Items || [] })
  };
}

async function approveScheme(event) {
  const { schemeId } = JSON.parse(event.body);
  
  const result = await docClient.send(new GetCommand({
    TableName: PENDING_SCHEMES_TABLE,
    Key: { schemeId }
  }));
  
  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Scheme not found' })
    };
  }
  
  const scheme = result.Item;
  
  // Add to schemes.json
  const schemes = JSON.parse(fs.readFileSync(SCHEMES_FILE, 'utf8'));
  const newScheme = {
    id: scheme.name.toLowerCase().replace(/\s+/g, '-'),
    name: scheme.name,
    description: scheme.description,
    eligibility: scheme.eligibility,
    benefits: scheme.benefits,
    link: scheme.link || scheme.sourceUrl
  };
  
  schemes.push(newScheme);
  fs.writeFileSync(SCHEMES_FILE, JSON.stringify(schemes, null, 2));
  
  // Update status to approved
  await docClient.send(new UpdateCommand({
    TableName: PENDING_SCHEMES_TABLE,
    Key: { schemeId },
    UpdateExpression: 'SET #status = :approved, approvedAt = :now',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':approved': 'approved',
      ':now': new Date().toISOString()
    }
  }));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Scheme approved', scheme: newScheme })
  };
}

async function rejectScheme(event) {
  const { schemeId, reason } = JSON.parse(event.body);
  
  await docClient.send(new UpdateCommand({
    TableName: PENDING_SCHEMES_TABLE,
    Key: { schemeId },
    UpdateExpression: 'SET #status = :rejected, rejectedAt = :now, rejectionReason = :reason',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':rejected': 'rejected',
      ':now': new Date().toISOString(),
      ':reason': reason || 'Not applicable'
    }
  }));
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Scheme rejected' })
  };
}

module.exports = {
  listPendingSchemes,
  approveScheme,
  rejectScheme
};
