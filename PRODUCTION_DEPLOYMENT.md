# Production Deployment Guide - Sahaayak AI Frontend

## Architecture Overview

```
User → CloudFront → S3 (Static React App) → API Gateway → Lambda (Bedrock/Polly/Translate)
                                                ↓
                                            DynamoDB
                                                ↓
                                            S3 (Audio Files)
```

## Folder Structure (Production-Ready)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   └── VoiceBar.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── LanguageContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Home.jsx
│   │   ├── Profiles.jsx
│   │   ├── Schemes.jsx
│   │   ├── Documents.jsx
│   │   └── Recommendations.jsx  ← NEW
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── _redirects  ← For SPA routing
├── .env.production
├── vite.config.js
└── package.json
```

## 1. S3 Pre-Signed URL Security Best Practices

### Backend Lambda Configuration

```javascript
// In your Lambda function that generates pre-signed URLs
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: 'ap-south-1' });

// Generate pre-signed URL with short expiration
const command = new PutObjectCommand({
  Bucket: 'sahaayak-audio-bucket',
  Key: `audio/${userId}/${timestamp}.mp3`,
  ContentType: 'audio/mpeg',
});

const audioUrl = await getSignedUrl(s3Client, command, {
  expiresIn: 3600, // 1 hour (adjust based on your needs)
});
```

### Security Recommendations

1. **Short Expiration**: Set pre-signed URLs to expire in 1-4 hours
2. **User-Specific Paths**: Include userId in S3 key to prevent unauthorized access
3. **HTTPS Only**: Ensure all S3 buckets enforce HTTPS
4. **CORS Configuration**: Restrict CORS to your CloudFront domain

```json
// S3 Bucket CORS Configuration
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["https://your-cloudfront-domain.cloudfront.net"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

5. **CloudFront Signed URLs** (Optional, for extra security):
   - Use CloudFront signed URLs instead of S3 pre-signed URLs
   - Provides additional layer of access control

## 2. CloudFront Cache Invalidation

### Problem
CloudFront caches static assets (JS, CSS, HTML) for 24 hours by default, causing users to see old versions after deployment.

### Solution A: Automated Invalidation (Recommended)

Add to your deployment script:

```bash
#!/bin/bash
# deploy.sh

# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete! Cache invalidated."
```

### Solution B: Versioned Assets (Best Practice)

Vite automatically adds content hashes to filenames (e.g., `main.a3f2b1c.js`). This means:
- JS/CSS files are automatically cache-busted
- Only need to invalidate `index.html` and `_redirects`

```bash
# Invalidate only HTML files (faster, cheaper)
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/index.html" "/_redirects"
```

### Solution C: Cache-Control Headers

Configure S3 bucket to set proper cache headers:

```bash
# Upload with cache headers
aws s3 sync dist/ s3://your-bucket-name \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable"

# HTML files with short cache
aws s3 sync dist/ s3://your-bucket-name \
  --exclude "*" \
  --include "*.html" \
  --cache-control "public, max-age=0, must-revalidate"
```

## 3. SPA Routing Configuration

### Problem
Direct navigation to `/recommendations` returns 404 from S3.

### Solution: CloudFront Error Pages

In CloudFront distribution settings:

1. Go to **Error Pages** tab
2. Create custom error response:
   - **HTTP Error Code**: 403, 404
   - **Customize Error Response**: Yes
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: 200

### Alternative: S3 Redirect Rules

In S3 bucket properties → Static website hosting:

```json
{
  "IndexDocument": {
    "Suffix": "index.html"
  },
  "ErrorDocument": {
    "Key": "index.html"
  },
  "RoutingRules": [
    {
      "Condition": {
        "HttpErrorCodeReturnedEquals": "404"
      },
      "Redirect": {
        "ReplaceKeyWith": "index.html"
      }
    }
  ]
}
```

## 4. Environment Variables

### `.env.production`

```env
VITE_API_URL=https://r8bzfdhqij.execute-api.ap-south-1.amazonaws.com/Prod/api
VITE_REGION=ap-south-1
```

### Build Command

```bash
npm run build
# Vite automatically uses .env.production during build
```

## 5. Complete Deployment Steps

### Step 1: Build Frontend

```bash
cd frontend
npm install
npm run build
```

### Step 2: Create S3 Bucket (if not exists)

```bash
aws s3 mb s3://sahaayak-ai-frontend --region ap-south-1

# Enable static website hosting
aws s3 website s3://sahaayak-ai-frontend \
  --index-document index.html \
  --error-document index.html
```

### Step 3: Upload to S3

```bash
aws s3 sync dist/ s3://sahaayak-ai-frontend --delete
```

### Step 4: Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name sahaayak-ai-frontend.s3.ap-south-1.amazonaws.com \
  --default-root-object index.html
```

Or use AWS Console:
1. Go to CloudFront → Create Distribution
2. **Origin Domain**: Select your S3 bucket
3. **Viewer Protocol Policy**: Redirect HTTP to HTTPS
4. **Allowed HTTP Methods**: GET, HEAD, OPTIONS
5. **Cache Policy**: CachingOptimized
6. **Custom Error Responses**: Add 403/404 → /index.html (200)

### Step 5: Invalidate Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## 6. Automated CI/CD (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1
      
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://sahaayak-ai-frontend --delete
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

## 7. Performance Optimization

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### Lazy Loading Routes

```javascript
// App.jsx
import { lazy, Suspense } from 'react';

const Recommendations = lazy(() => import('./pages/Recommendations'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/recommendations" element={<Recommendations />} />
      </Routes>
    </Suspense>
  );
}
```

## 8. Monitoring & Debugging

### CloudWatch Logs

- Lambda logs: `/aws/lambda/your-function-name`
- API Gateway logs: Enable in API Gateway settings

### CloudFront Access Logs

Enable in CloudFront distribution settings to track:
- Cache hit/miss rates
- Geographic distribution
- Error rates

### Frontend Error Tracking

Add to `main.jsx`:

```javascript
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to CloudWatch or monitoring service
});
```

## 9. Cost Optimization

- **CloudFront**: ~$0.085/GB (first 10TB)
- **S3**: ~$0.023/GB storage + $0.004/10,000 GET requests
- **Lambda**: Included in your $200 credits
- **Invalidations**: First 1,000/month free, then $0.005 each

**Tip**: Use versioned assets to minimize invalidations.

## 10. Security Checklist

- [ ] Enable HTTPS only (CloudFront)
- [ ] Set proper CORS headers (S3 + API Gateway)
- [ ] Use short-lived pre-signed URLs (1-4 hours)
- [ ] Enable CloudFront WAF (optional, for DDoS protection)
- [ ] Restrict S3 bucket to CloudFront only (Origin Access Identity)
- [ ] Enable CloudTrail for audit logs
- [ ] Use IAM roles with least privilege
- [ ] Enable MFA for AWS console access

## Troubleshooting

### Issue: Old version still showing
**Solution**: Hard refresh (Ctrl+Shift+R) or invalidate CloudFront cache

### Issue: 404 on direct route access
**Solution**: Configure CloudFront error pages (see Section 3)

### Issue: Audio not playing on mobile
**Solution**: Ensure S3 CORS allows your CloudFront domain

### Issue: API calls failing
**Solution**: Check API Gateway CORS settings and Lambda permissions

---

**Deployment Time**: ~5 minutes (after initial setup)
**Cache Invalidation Time**: 1-3 minutes
**Total Cost**: ~$2-5/month (within $200 credits)
