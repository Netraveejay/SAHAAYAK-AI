# Migration Guide: Local JSON to AWS Cloud

## Overview

This guide helps you migrate from local JSON file storage to AWS cloud services without breaking your existing application.

## Migration Strategy: Gradual Rollout

The backend supports **dual mode** - it can run with local JSON files OR AWS services based on environment variables. This allows zero-downtime migration.

## Phase 1: Preparation (No Downtime)

### 1. Install AWS Dependencies

```bash
cd backend
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/client-bedrock-runtime @aws-sdk/client-translate @aws-sdk/client-polly serverless-http
```

### 2. Configure AWS Credentials

```bash
# Install AWS CLI
# Configure credentials
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

### 3. Deploy AWS Infrastructure

```bash
cd backend
sam build
sam deploy --guided
```

Note the outputs:
- API Gateway URL
- DynamoDB table names
- S3 bucket name

## Phase 2: Data Migration

### Migrate Users and Profiles

```bash
# Create migration script
node migrate-to-dynamodb.js
```

migrate-to-dynamodb.js:
```javascript
const fs = require('fs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function migrateUsers() {
  const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
  
  for (const user of users) {
    // Migrate user
    await docClient.send(new PutCommand({
      TableName: 'SahaayakUsers',
      Item: {
        userId: user.id,
        mobile: user.mobile,
        createdAt: user.createdAt
      }
    }));
    
    // Migrate profiles
    for (const profile of user.profiles || []) {
      await docClient.send(new PutCommand({
        TableName: 'SahaayakProfiles',
        Item: {
          profileId: profile.id,
          userId: user.id,
          ...profile
        }
      }));
    }
  }
  
  console.log(`Migrated ${users.length} users`);
}

migrateUsers().catch(console.error);
```

### Migrate Applications

```bash
node migrate-applications.js
```

migrate-applications.js:
```javascript
const fs = require('fs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function migrateApplications() {
  const apps = JSON.parse(fs.readFileSync('./data/applications.json', 'utf8'));
  
  for (const app of apps) {
    await docClient.send(new PutCommand({
      TableName: 'SahaayakApplications',
      Item: {
        applicationId: app.id,
        userId: app.userId,
        ...app
      }
    }));
  }
  
  console.log(`Migrated ${apps.length} applications`);
}

migrateApplications().catch(console.error);
```

### Migrate Uploaded Files to S3

```bash
node migrate-uploads-to-s3.js
```

migrate-uploads-to-s3.js:
```javascript
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET = 'sahaayak-ai-uploads-YOUR-ACCOUNT-ID';

async function migrateUploads() {
  const uploadsDir = './uploads';
  const files = fs.readdirSync(uploadsDir);
  
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const fileContent = fs.readFileSync(filePath);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `documents/${file}`,
      Body: fileContent
    }));
    
    console.log(`Uploaded ${file}`);
  }
  
  console.log(`Migrated ${files.length} files`);
}

migrateUploads().catch(console.error);
```

## Phase 3: Enable AWS Services (Gradual)

### Step 1: Enable DynamoDB Only

Backend .env:
```bash
USE_DYNAMODB=true
USE_S3=false
USE_BEDROCK=false
```

Restart backend:
```bash
npm start
```

Test:
- Login
- Create/edit profiles
- Verify data in DynamoDB console

### Step 2: Enable S3

Backend .env:
```bash
USE_DYNAMODB=true
USE_S3=true
USE_BEDROCK=false
```

Restart and test:
- Upload documents
- Verify files in S3 console

### Step 3: Enable Bedrock AI

Backend .env:
```bash
USE_DYNAMODB=true
USE_S3=true
USE_BEDROCK=true
```

Restart and test:
- Check eligible schemes
- Verify AI explanations appear

## Phase 4: Deploy to Lambda

### Update Frontend API URL

Frontend .env:
```bash
VITE_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/Prod/api
```

Rebuild frontend:
```bash
cd frontend
npm run build
```

### Deploy to Amplify

```bash
# Push to Git repository
git add .
git commit -m "AWS migration complete"
git push

# Amplify auto-deploys from Git
```

Or manual:
```bash
amplify publish
```

## Phase 5: Verification

### Test Checklist

- [ ] Login with mobile + OTP
- [ ] Create new profile
- [ ] Edit existing profile
- [ ] Delete profile
- [ ] View eligible schemes
- [ ] Upload document
- [ ] Create application
- [ ] Track application status
- [ ] Test voice features (if Polly enabled)
- [ ] Test offline mode (disconnect internet)
- [ ] Test sync (reconnect internet)

### Monitor CloudWatch

```bash
# View Lambda logs
aws logs tail /aws/lambda/sahaayak-ai-api --follow

# Check for errors
aws logs filter-pattern /aws/lambda/sahaayak-ai-api --filter-pattern "ERROR"
```

## Rollback Plan

If issues occur, rollback is instant:

### Rollback Backend to Local

Backend .env:
```bash
USE_DYNAMODB=false
USE_S3=false
USE_BEDROCK=false
```

Restart:
```bash
npm start
```

### Rollback Frontend

Frontend .env:
```bash
VITE_API_URL=http://localhost:5000/api
```

Rebuild:
```bash
npm run build
```

## Data Sync (Bidirectional)

If you need to keep local and AWS in sync during transition:

### Export from DynamoDB to JSON

```javascript
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const fs = require('fs');

async function exportUsers() {
  const client = new DynamoDBClient({ region: 'us-east-1' });
  const result = await client.send(new ScanCommand({
    TableName: 'SahaayakUsers'
  }));
  
  const users = result.Items.map(item => unmarshall(item));
  fs.writeFileSync('./data/users-backup.json', JSON.stringify(users, null, 2));
}
```

## Cost Monitoring

Set up billing alerts:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name sahaayak-ai-cost-alert \
  --alarm-description "Alert when estimated charges exceed $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Performance Comparison

| Metric | Local JSON | AWS Cloud |
|--------|-----------|-----------|
| **Latency** | 5-10ms | 50-100ms (API Gateway + Lambda) |
| **Throughput** | Limited by single server | Unlimited (auto-scales) |
| **Availability** | Single point of failure | 99.99% SLA |
| **Scalability** | Vertical only | Horizontal auto-scale |
| **Cost** | Server hosting | Pay-per-use |
| **Backup** | Manual | Automated |

## Troubleshooting

### Issue: Lambda timeout

**Solution**: Increase timeout in template.yaml
```yaml
Timeout: 60  # Increase from 30 to 60 seconds
```

### Issue: DynamoDB throttling

**Solution**: Use on-demand billing
```yaml
BillingMode: PAY_PER_REQUEST
```

### Issue: S3 CORS errors

**Solution**: Update CORS policy
```bash
aws s3api put-bucket-cors --bucket YOUR-BUCKET --cors-configuration file://cors.json
```

### Issue: Bedrock access denied

**Solution**: Enable model access in console
```
AWS Console > Bedrock > Model access > Request access
```

## Post-Migration Cleanup

After successful migration and verification:

1. **Backup local data**:
```bash
tar -czf sahaayak-local-backup.tar.gz backend/data backend/uploads
```

2. **Archive local files**:
```bash
mkdir -p backend/data-archive
mv backend/data/*.json backend/data-archive/
```

3. **Update documentation**:
- Update README.md with AWS instructions
- Archive local setup instructions

4. **Decommission local server** (if applicable)

## Support

For issues during migration:
1. Check CloudWatch logs
2. Verify IAM permissions
3. Test with AWS CLI commands
4. Review DynamoDB/S3 console
5. Enable debug logging in Lambda
