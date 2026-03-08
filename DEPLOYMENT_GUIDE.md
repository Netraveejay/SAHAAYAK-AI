# Sahaayak AI - AWS Deployment Guide

## Architecture Overview

```
User → API Gateway → Lambda → {
  ├─ DynamoDB (fetch schemes)
  ├─ Bedrock (AI recommendation)
  ├─ Translate (multi-language)
  ├─ Polly (text-to-speech)
  └─ S3 (store audio)
}
```

## Prerequisites

1. AWS CLI configured
2. AWS SAM CLI installed
3. Node.js 18+
4. Bedrock model access enabled (Claude 3 Haiku)

## Deployment Steps

### 1. Install Dependencies
```bash
cd backend
cp recommendation-package.json package.json
npm install
```

### 2. Deploy Infrastructure
```bash
sam build -t recommendation-template.yaml
sam deploy --guided \
  --stack-name sahaayak-ai-recommendation \
  --region ap-south-1 \
  --capabilities CAPABILITY_IAM
```

### 3. Populate Schemes Data
```bash
node populateSchemes.js
```

### 4. Test the API
```bash
curl -X POST https://YOUR_API_URL/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "occupation": "Farmer",
    "landSize": "1 hectare",
    "incomeLevel": "Low",
    "state": "Tamil Nadu",
    "preferredLanguage": "ta"
  }'
```

## Response Format

```json
{
  "schemeName": "PM-KISAN",
  "benefits": "₹2000 every 4 months directly to bank account",
  "explanationText": "நீங்கள் PM-KISAN திட்டத்திற்கு தகுதியானவர்...",
  "audioUrl": "https://sahaayak-audio-123456.s3.ap-south-1.amazonaws.com/audio/1234567890.mp3",
  "eligibilityReasons": [
    "You are a farmer",
    "Your income level qualifies",
    "Available in your state"
  ]
}
```

## IAM Permissions Required

The Lambda function needs:
- `dynamodb:Scan` on SchemesTable
- `bedrock:InvokeModel` for Claude
- `translate:TranslateText` for translations
- `polly:SynthesizeSpeech` for audio
- `s3:PutObject` on AudioBucket

## Cost Estimate (Monthly)

- Lambda: ~$0.20 (1000 requests)
- DynamoDB: $0 (free tier)
- Bedrock: ~$0.50 (1000 requests)
- Translate: ~$0.15 (1000 requests)
- Polly: ~$0.40 (1000 requests)
- S3: ~$0.02 (storage)
- **Total: ~$1.27/month** for 1000 requests

## Production Optimizations

1. **Caching**: Cache schemes in Lambda memory
2. **Audio Reuse**: Check if audio exists before generating
3. **Batch Processing**: Process multiple users together
4. **CloudFront**: CDN for audio files
5. **Monitoring**: CloudWatch alarms for errors

## Troubleshooting

**Bedrock Access Denied:**
- Enable model access in Bedrock console
- Request access to Claude 3 Haiku

**Polly Voice Not Found:**
- Use 'Aditi' for Indian languages
- Fallback to 'Joanna' for English

**S3 403 Error:**
- Check bucket policy allows public read
- Verify CORS configuration

## Security Best Practices

1. Enable API Gateway throttling
2. Use AWS WAF for DDoS protection
3. Encrypt S3 bucket with KMS
4. Enable CloudTrail logging
5. Use VPC endpoints for private access

## Monitoring

```bash
# View Lambda logs
aws logs tail /aws/lambda/RecommendationFunction --follow

# Check DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=SahaayakSchemes
```

## Scaling

- Lambda: Auto-scales to 1000 concurrent executions
- DynamoDB: On-demand pricing scales automatically
- S3: Unlimited storage
- Bedrock: Request quota increase if needed

## Support

For issues, check:
1. CloudWatch Logs
2. X-Ray traces
3. AWS Support Center
