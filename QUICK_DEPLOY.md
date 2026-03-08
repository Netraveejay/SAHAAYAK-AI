# Quick Deployment Guide

## 🚀 Deploy to Production

### One-Command Deployment

```bash
./deploy.sh YOUR_CLOUDFRONT_DISTRIBUTION_ID
```

### Manual Steps

```bash
# 1. Build
cd frontend
npm run build

# 2. Upload to S3
aws s3 sync dist/ s3://sahaayak-ai-frontend --delete --region ap-south-1

# 3. Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## 🔧 First-Time Setup

### 1. Create S3 Bucket

```bash
aws s3 mb s3://sahaayak-ai-frontend --region ap-south-1

# Enable static website hosting
aws s3 website s3://sahaayak-ai-frontend \
  --index-document index.html \
  --error-document index.html

# Make bucket public (for CloudFront)
aws s3api put-bucket-policy --bucket sahaayak-ai-frontend --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::sahaayak-ai-frontend/*"
  }]
}'
```

### 2. Create CloudFront Distribution

**Via AWS Console:**
1. Go to CloudFront → Create Distribution
2. **Origin Domain**: sahaayak-ai-frontend.s3-website.ap-south-1.amazonaws.com
3. **Viewer Protocol Policy**: Redirect HTTP to HTTPS
4. **Cache Policy**: CachingOptimized
5. **Custom Error Responses**:
   - Error Code: 403 → Response: /index.html (200)
   - Error Code: 404 → Response: /index.html (200)

**Via CLI:**

```bash
aws cloudfront create-distribution \
  --origin-domain-name sahaayak-ai-frontend.s3-website.ap-south-1.amazonaws.com \
  --default-root-object index.html
```

### 3. Configure CORS for Audio Bucket

```bash
aws s3api put-bucket-cors --bucket sahaayak-audio-315084008628 --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }]
}'
```

## 🐛 Troubleshooting

### Old version showing after deployment?

```bash
# Hard refresh in browser
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### 404 on /recommendations route?

Check CloudFront error pages configuration (see setup step 2).

### Audio not playing?

Check CORS configuration on audio S3 bucket (see setup step 3).

## 📊 Monitor Deployment

```bash
# Check S3 upload
aws s3 ls s3://sahaayak-ai-frontend/

# Check CloudFront invalidation status
aws cloudfront get-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --id INVALIDATION_ID
```

## 💰 Cost Estimate

- **S3**: ~$0.50/month (10GB storage + 10K requests)
- **CloudFront**: ~$1.00/month (10GB transfer)
- **Invalidations**: Free (first 1,000/month)

**Total**: ~$1.50/month (covered by $200 credits)

## 🔐 Security Checklist

- [x] HTTPS enforced via CloudFront
- [x] S3 bucket CORS configured
- [x] Pre-signed URLs expire in 1 hour
- [x] API Gateway CORS enabled
- [x] CloudFront error pages for SPA routing

## 📱 Test on Mobile

1. Open CloudFront URL on mobile browser
2. Login with demo OTP: 123456
3. Navigate to Recommendations
4. Test audio playback (requires user interaction first)

---

**Need help?** See PRODUCTION_DEPLOYMENT.md for detailed guide.
