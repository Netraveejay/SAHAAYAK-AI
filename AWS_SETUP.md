# AWS Services Setup for Sahaayak AI

Your app has AWS services coded but needs IAM permissions and environment variables.

## AWS Services Used:
- ✅ **Bedrock** (Claude AI) - AI chat & eligibility explanations
- ✅ **Polly** - Text-to-speech (multilingual)
- ✅ **Translate** - Language translation
- ✅ **S3** - File uploads storage
- ✅ **DynamoDB** - User/profile data (optional)

## Setup Steps:

### 1. Create IAM Role for Backend

Go to [IAM Console](https://console.aws.amazon.com/iam/) → Roles → Create Role

**For Elastic Beanstalk:**
- Select: AWS Service → Elastic Beanstalk → Elastic Beanstalk - Customizable
- Attach policies:
  - `AmazonBedrockFullAccess`
  - `AmazonPollyFullAccess`
  - `TranslateFullAccess`
  - `AmazonS3FullAccess`
  - `AmazonDynamoDBFullAccess` (optional)
- Name: `sahaayak-ai-backend-role`

**For App Runner:**
- Select: AWS Service → App Runner
- Attach same policies above
- Name: `sahaayak-ai-apprunner-role`

### 2. Create S3 Bucket

```bash
aws s3 mb s3://sahaayak-ai-uploads --region ap-south-1
```

Or via Console:
- Go to [S3 Console](https://s3.console.aws.amazon.com/)
- Create bucket: `sahaayak-ai-uploads`
- Region: `ap-south-1` (Mumbai)
- Block public access: OFF (for document viewing)
- Enable versioning: Optional

### 3. Bedrock Models (Auto-Enabled)

✅ **No manual setup needed!** Bedrock models are now automatically enabled when first invoked.

**Note:** For Anthropic Claude (first-time users), you may need to submit use case details on first API call.

### 4. Set Environment Variables

#### For Elastic Beanstalk:
```bash
eb setenv \
  AWS_REGION=ap-south-1 \
  S3_BUCKET=sahaayak-ai-uploads \
  NODE_ENV=production \
  PORT=8080 \
  FRONTEND_URL=https://your-app.amplifyapp.com
```

#### For App Runner (in Console):
```
AWS_REGION=ap-south-1
S3_BUCKET=sahaayak-ai-uploads
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-app.amplifyapp.com
```

#### For Amplify Frontend:
```
VITE_API_URL=https://your-backend-url.com
```

### 5. Test AWS Services

After deployment, test each service:

**Test Polly (Text-to-Speech):**
```bash
curl -X POST https://your-backend/api/ai/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from Sahaayak AI","language":"en"}'
```

**Test Translate:**
```bash
curl -X POST https://your-backend/api/ai/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","targetLanguage":"hi"}'
```

**Test File Upload:**
- Use the Documents page in your app
- Upload a file
- Check S3 bucket for the file

## Cost Estimates (Monthly):

- **Bedrock (Claude)**: ~$3-15 (1000-5000 requests)
- **Polly**: ~$4 per 1M characters
- **Translate**: ~$15 per 1M characters
- **S3**: ~$0.023 per GB stored + $0.09 per GB transfer
- **DynamoDB**: Free tier (25GB, 200M requests)

**Total**: ~$10-30/month for moderate usage

## Troubleshooting:

### "Access Denied" Errors
- Check IAM role has correct policies
- Verify role is attached to EB/App Runner
- Check AWS region matches

### Bedrock "Model not found"
- Request model access in Bedrock console
- Wait for approval
- Use correct model ID: `anthropic.claude-3-sonnet-20240229-v1:0`

### S3 Upload Fails
- Check bucket name in env vars
- Verify IAM role has S3 permissions
- Check bucket exists in correct region

### Polly "Voice not available"
- Check region supports neural voices
- Use `ap-south-1` for Indian languages
- Fallback to standard engine if needed

## Production Checklist:

- [ ] IAM role created with all permissions
- [ ] S3 bucket created
- [ ] Bedrock model access approved
- [ ] Environment variables set
- [ ] CORS configured for production domain
- [ ] Test all AWS services
- [ ] Monitor CloudWatch logs
- [ ] Set up billing alerts

## Optional: DynamoDB Setup

If you want to use DynamoDB instead of JSON files:

```bash
# Create users table
aws dynamodb create-table \
  --table-name sahaayak-users \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1

# Create profiles table
aws dynamodb create-table \
  --table-name sahaayak-profiles \
  --attribute-definitions AttributeName=profileId,AttributeType=S \
  --key-schema AttributeName=profileId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

Then update `backend/services/dynamoService.js` usage in routes.
