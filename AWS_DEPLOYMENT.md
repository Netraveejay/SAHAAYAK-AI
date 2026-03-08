# AWS Deployment Guide - Sahaayak AI

## Architecture Overview

- **Frontend**: AWS Amplify Hosting (React + Vite)
- **Backend API**: AWS Lambda + API Gateway
- **Database**: Amazon DynamoDB (3 tables)
- **File Storage**: Amazon S3
- **AI Services**: Amazon Bedrock (Claude), Amazon Translate, Amazon Polly
- **Eligibility Engine**: Hybrid (Rules Engine + Bedrock AI)

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. AWS SAM CLI installed
4. Node.js 18+ and npm

## Step 1: Deploy Backend (Lambda + API Gateway + DynamoDB + S3)

### Using AWS SAM

```bash
cd backend

# Install dependencies
npm install

# Build and deploy
sam build
sam deploy --guided
```

During guided deployment, provide:
- Stack Name: `sahaayak-ai-backend`
- AWS Region: `us-east-1` (or your preferred region)
- Confirm changes: Y
- Allow SAM CLI IAM role creation: Y
- Save arguments to configuration file: Y

**Note the API Gateway URL from outputs** - you'll need this for frontend.

### Manual Deployment (Alternative)

If not using SAM:

1. **Create DynamoDB Tables**:
```bash
# Users Table
aws dynamodb create-table \
  --table-name SahaayakUsers \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=mobile,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "IndexName=MobileIndex,KeySchema=[{AttributeName=mobile,KeyType=HASH}],Projection={ProjectionType=ALL}"

# Profiles Table
aws dynamodb create-table \
  --table-name SahaayakProfiles \
  --attribute-definitions AttributeName=profileId,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=profileId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "IndexName=UserIdIndex,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL}"

# Applications Table
aws dynamodb create-table \
  --table-name SahaayakApplications \
  --attribute-definitions AttributeName=applicationId,AttributeType=S AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=applicationId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "IndexName=UserIdIndex,KeySchema=[{AttributeName=userId,KeyType=HASH}],Projection={ProjectionType=ALL}"
```

2. **Create S3 Bucket**:
```bash
aws s3 mb s3://sahaayak-ai-uploads-YOUR-ACCOUNT-ID
aws s3api put-bucket-cors --bucket sahaayak-ai-uploads-YOUR-ACCOUNT-ID --cors-configuration file://cors.json
```

cors.json:
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"]
  }]
}
```

3. **Create Lambda Function**:
```bash
# Package code
zip -r function.zip . -x "*.git*" "node_modules/*" "test/*"

# Create function
aws lambda create-function \
  --function-name sahaayak-ai-api \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR-ACCOUNT-ID:role/lambda-execution-role \
  --handler lambda.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{USE_DYNAMODB=true,USE_S3=true,USE_BEDROCK=true,USERS_TABLE=SahaayakUsers,PROFILES_TABLE=SahaayakProfiles,APPLICATIONS_TABLE=SahaayakApplications,S3_BUCKET=sahaayak-ai-uploads-YOUR-ACCOUNT-ID}"
```

4. **Create API Gateway** (REST API) and connect to Lambda

## Step 2: Enable Bedrock Model Access

```bash
# Request access to Claude model in AWS Console
# Go to: Amazon Bedrock > Model access > Request model access
# Select: Anthropic Claude 3 Sonnet
```

Or via CLI:
```bash
aws bedrock put-model-invocation-logging-configuration \
  --region us-east-1
```

## Step 3: Deploy Frontend (AWS Amplify)

### Option A: Amplify Console (Recommended)

1. Go to AWS Amplify Console
2. Click "New app" > "Host web app"
3. Connect your Git repository (GitHub/GitLab/Bitbucket)
4. Select branch: `main`
5. Build settings are auto-detected from `amplify.yml`
6. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/Prod/api`
7. Click "Save and deploy"

### Option B: Amplify CLI

```bash
cd frontend

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Publish
amplify publish
```

### Option C: Manual S3 + CloudFront

```bash
cd frontend

# Build
npm run build

# Create S3 bucket for hosting
aws s3 mb s3://sahaayak-ai-frontend

# Enable static website hosting
aws s3 website s3://sahaayak-ai-frontend --index-document index.html

# Upload build
aws s3 sync dist/ s3://sahaayak-ai-frontend --acl public-read

# Create CloudFront distribution (optional, for HTTPS)
```

## Step 4: Configure Environment Variables

### Backend (.env)
```bash
AWS_REGION=us-east-1
USE_DYNAMODB=true
USE_S3=true
USE_BEDROCK=true
USERS_TABLE=SahaayakUsers
PROFILES_TABLE=SahaayakProfiles
APPLICATIONS_TABLE=SahaayakApplications
S3_BUCKET=sahaayak-ai-uploads-YOUR-ACCOUNT-ID
```

### Frontend (.env)
```bash
VITE_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/Prod/api
```

## Step 5: Test Deployment

1. Open Amplify URL or CloudFront URL
2. Login with mobile: `9876543210`, OTP: `123456`
3. Create a profile
4. Check eligible schemes
5. Upload a document
6. Test voice features

## Cost Optimization

### Free Tier Usage:
- **DynamoDB**: 25 GB storage, 25 WCU, 25 RCU
- **Lambda**: 1M requests/month, 400,000 GB-seconds compute
- **S3**: 5 GB storage, 20,000 GET requests, 2,000 PUT requests
- **API Gateway**: 1M API calls/month (12 months)
- **Amplify**: 1,000 build minutes/month, 15 GB served/month

### Pay-as-you-go:
- **Bedrock**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **Translate**: $15 per million characters
- **Polly**: $4 per 1M characters (Neural voices)

### Recommendations:
1. Use DynamoDB on-demand billing for unpredictable traffic
2. Enable S3 Intelligent-Tiering for cost optimization
3. Set Lambda reserved concurrency to control costs
4. Use CloudWatch alarms for budget monitoring

## Local Development with AWS Services

To test AWS services locally:

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your AWS credentials and table names
npm install
npm start

# Frontend
cd frontend
cp .env.example .env
# Edit .env with local API URL
npm install
npm run dev
```

## Rollback to Local Mode

To switch back to local JSON storage:

Backend .env:
```bash
USE_DYNAMODB=false
USE_S3=false
USE_BEDROCK=false
```

## Monitoring and Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/sahaayak-ai-api --follow

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs_YOUR-API-ID/Prod --follow

# View DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=SahaayakUsers \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Security Best Practices

1. **IAM Roles**: Use least-privilege IAM roles for Lambda
2. **API Gateway**: Enable API keys and usage plans for production
3. **S3**: Enable bucket encryption and versioning
4. **DynamoDB**: Enable point-in-time recovery
5. **Secrets**: Use AWS Secrets Manager for sensitive data
6. **CORS**: Restrict CORS to your domain in production

## Troubleshooting

### Lambda timeout errors
- Increase timeout in template.yaml (max 900s)
- Optimize DynamoDB queries with proper indexes

### CORS errors
- Check API Gateway CORS configuration
- Verify S3 bucket CORS policy

### Bedrock access denied
- Ensure model access is enabled in Bedrock console
- Check IAM role has bedrock:InvokeModel permission

### DynamoDB throttling
- Switch to on-demand billing mode
- Or increase provisioned capacity

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions or AWS CodePipeline
2. Add custom domain with Route 53
3. Enable AWS WAF for API protection
4. Set up CloudWatch dashboards for monitoring
5. Implement backup strategy for DynamoDB
6. Add CloudFront CDN for global distribution
