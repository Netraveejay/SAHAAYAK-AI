# Quick Reference - AWS Integration

## 🚀 Quick Commands

### Local Development (No AWS)
```bash
# Backend
cd backend
USE_DYNAMODB=false USE_S3=false USE_BEDROCK=false npm start

# Frontend
cd frontend
VITE_API_URL=http://localhost:5000/api npm run dev
```

### AWS Development (Local + AWS Services)
```bash
# Backend
cd backend
USE_DYNAMODB=true USE_S3=true USE_BEDROCK=true npm start

# Frontend
cd frontend
npm run dev
```

### Deploy to AWS
```bash
# Backend (Lambda + API Gateway + DynamoDB + S3)
cd backend
sam build && sam deploy --guided

# Frontend (Amplify)
cd frontend
amplify publish
```

## 📋 Environment Variables Cheat Sheet

### Backend (.env)
```bash
# Toggle AWS services
USE_DYNAMODB=true|false
USE_S3=true|false
USE_BEDROCK=true|false

# AWS Config
AWS_REGION=us-east-1
USERS_TABLE=SahaayakUsers
PROFILES_TABLE=SahaayakProfiles
APPLICATIONS_TABLE=SahaayakApplications
S3_BUCKET=sahaayak-ai-uploads-ACCOUNT-ID
```

### Frontend (.env)
```bash
# Local
VITE_API_URL=http://localhost:5000/api

# AWS
VITE_API_URL=https://API-ID.execute-api.REGION.amazonaws.com/Prod/api
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `backend/services/dynamoService.js` | DynamoDB CRUD operations |
| `backend/services/s3Service.js` | S3 file uploads |
| `backend/services/bedrockService.js` | AI explanations (Claude) |
| `backend/services/eligibilityService.js` | Hybrid rules + AI |
| `backend/handlers/userHandler.js` | Auth Lambda handler |
| `backend/lambda.js` | Lambda entry point |
| `backend/template.yaml` | SAM/CloudFormation template |
| `frontend/src/services/apiService.js` | API client |
| `frontend/src/services/authService.js` | Auth + offline sync |

## 🧪 Test Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9876543210","otp":"123456"}'

# Get schemes
curl http://localhost:5000/api/schemes

# Check eligibility
curl -X POST http://localhost:5000/api/schemes/eligible \
  -H "Content-Type: application/json" \
  -d '{"annualIncome":50000,"age":30,"category":"General","isFarmer":true,"hasDisability":false}'

# Upload file
curl -X POST http://localhost:5000/api/uploads \
  -F "file=@document.pdf"
```

## 🔧 AWS CLI Quick Commands

```bash
# Check credentials
aws sts get-caller-identity

# List DynamoDB tables
aws dynamodb list-tables

# Scan Users table
aws dynamodb scan --table-name SahaayakUsers

# List S3 buckets
aws s3 ls

# View Lambda logs
aws logs tail /aws/lambda/sahaayak-ai-api --follow

# Invoke Lambda directly
aws lambda invoke --function-name sahaayak-ai-api \
  --payload '{"httpMethod":"GET","path":"/api/health"}' \
  response.json
```

## 📊 DynamoDB Table Structure

### SahaayakUsers
```
Primary Key: userId (String)
GSI: MobileIndex (mobile)
Attributes: userId, mobile, createdAt
```

### SahaayakProfiles
```
Primary Key: profileId (String)
GSI: UserIdIndex (userId)
Attributes: profileId, userId, name, age, gender, state, 
           occupation, annualIncome, category, isFarmer, 
           hasDisability, createdAt, updatedAt
```

### SahaayakApplications
```
Primary Key: applicationId (String)
GSI: UserIdIndex (userId)
Attributes: applicationId, userId, schemeId, profileId, 
           status, dateApplied, createdAt, updatedAt
```

## 🎯 API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/send-otp` | No | Send OTP |
| POST | `/api/auth/verify-otp` | No | Verify OTP & login |
| GET | `/api/profiles` | Yes | List profiles |
| POST | `/api/profiles` | Yes | Create profile |
| PUT | `/api/profiles/:id` | Yes | Update profile |
| DELETE | `/api/profiles/:id` | Yes | Delete profile |
| GET | `/api/schemes` | No | List all schemes |
| POST | `/api/schemes/eligible` | No | Get eligible schemes |
| GET | `/api/applications` | Yes | List applications |
| POST | `/api/applications` | Yes | Create application |
| PATCH | `/api/applications/:id` | Yes | Update status |
| POST | `/api/uploads` | Yes | Upload file |
| POST | `/api/ai/chat` | No | Chat with AI |
| POST | `/api/ai/speech` | No | Text-to-speech |
| POST | `/api/ai/translate` | No | Translate text |

## 💡 Common Issues & Fixes

### Issue: "Cannot find module '@aws-sdk/...'"
```bash
cd backend
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/client-bedrock-runtime @aws-sdk/client-translate @aws-sdk/client-polly serverless-http
```

### Issue: "Access Denied" on DynamoDB
```bash
# Check IAM permissions
aws iam get-user
# Ensure user/role has DynamoDB permissions
```

### Issue: "Bedrock model not available"
```bash
# Enable model access in AWS Console
# Bedrock > Model access > Request access > Claude 3 Sonnet
```

### Issue: Lambda timeout
```yaml
# In template.yaml, increase timeout
Timeout: 60  # seconds
```

### Issue: CORS error
```bash
# Update API Gateway CORS or S3 bucket CORS
aws s3api put-bucket-cors --bucket YOUR-BUCKET --cors-configuration file://cors.json
```

## 📈 Monitoring

```bash
# Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=sahaayak-ai-api \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum

# DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=SahaayakUsers \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## 🔐 Security Checklist

- [ ] AWS credentials configured (not hardcoded)
- [ ] IAM roles use least privilege
- [ ] S3 bucket is private (no public access)
- [ ] API Gateway has CORS configured
- [ ] DynamoDB encryption at rest enabled
- [ ] CloudWatch logging enabled
- [ ] Environment variables in .env (not committed)
- [ ] HTTPS only (no HTTP)

## 💰 Cost Optimization

```bash
# Enable DynamoDB on-demand billing
aws dynamodb update-table \
  --table-name SahaayakUsers \
  --billing-mode PAY_PER_REQUEST

# Set S3 lifecycle policy (delete old files)
aws s3api put-bucket-lifecycle-configuration \
  --bucket YOUR-BUCKET \
  --lifecycle-configuration file://lifecycle.json

# Set Lambda reserved concurrency (limit costs)
aws lambda put-function-concurrency \
  --function-name sahaayak-ai-api \
  --reserved-concurrent-executions 10
```

## 📚 Documentation Links

- [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) - Full deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration steps
- [AWS_INTEGRATION_SUMMARY.md](./AWS_INTEGRATION_SUMMARY.md) - Complete summary

## 🎓 Learning Resources

- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)
- [S3 Docs](https://docs.aws.amazon.com/s3/)
- [Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [AWS SAM Docs](https://docs.aws.amazon.com/serverless-application-model/)

---

**Pro Tip**: Start with local mode, test AWS services locally, then deploy to Lambda. Use environment variables to toggle between modes.
