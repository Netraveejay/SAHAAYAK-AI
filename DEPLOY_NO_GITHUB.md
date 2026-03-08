# Deploy WITHOUT GitHub

## Option 1: Amplify CLI (Recommended)

### 1. Install Amplify CLI:
```bash
npm install -g @aws-amplify/cli
amplify configure
```

### 2. Deploy Frontend:
```bash
cd frontend

# Build the app
npm run build

# Deploy to Amplify
amplify init
# Choose: Manual configuration
# Name: sahaayak-ai
# Environment: production
# Default editor: your choice
# App type: javascript
# Framework: react
# Source directory: src
# Distribution directory: dist
# Build command: npm run build
# Start command: npm run dev

# Add hosting
amplify add hosting
# Choose: Hosting with Amplify Console (Manual deployment)

# Publish
amplify publish
```

### 3. Set Environment Variable:
After deployment, go to Amplify Console:
- Click your app → Environment variables
- Add: `VITE_API_URL` = `http://YOUR-BACKEND-URL`
- Redeploy

---

## Option 2: Manual Upload (Easiest)

### 1. Build Frontend:
```bash
cd frontend
npm run build
```

### 2. Create ZIP:
```bash
cd dist
zip -r ../frontend-build.zip .
cd ..
```

### 3. Upload to Amplify:
1. Go to: https://console.aws.amazon.com/amplify/
2. Click **"New app"** → **"Deploy without Git provider"**
3. App name: `sahaayak-ai`
4. Environment: `production`
5. Drag and drop `frontend-build.zip`
6. Click **Deploy**

### 4. Set Environment Variable:
- Go to App settings → Environment variables
- Add: `VITE_API_URL` = `http://YOUR-BACKEND-URL`
- Rebuild: Click "Redeploy this version"

---

## Option 3: S3 + CloudFront (Static Hosting)

### 1. Build:
```bash
cd frontend
npm run build
```

### 2. Create S3 Bucket:
```bash
aws s3 mb s3://sahaayak-ai-frontend
aws s3 website s3://sahaayak-ai-frontend --index-document index.html
```

### 3. Upload:
```bash
cd dist
aws s3 sync . s3://sahaayak-ai-frontend --acl public-read
```

### 4. Get URL:
```bash
echo "http://sahaayak-ai-frontend.s3-website.ap-south-1.amazonaws.com"
```

---

## Backend Deployment (Same for all options)

### Install EB CLI:
```bash
brew install awsebcli
```

### Deploy:
```bash
cd backend

eb init -p node.js-18 sahaayak-ai --region ap-south-1
eb create sahaayak-env --instance-type t3.micro

eb setenv \
  AWS_REGION=ap-south-1 \
  S3_BUCKET=sahaayak-ai-uploads-1772961977 \
  NODE_ENV=production \
  PORT=8080

# Get backend URL
eb status
```

Copy the CNAME and use it as `VITE_API_URL` in frontend.

---

## Which Option?

- **Easiest**: Option 2 (Manual Upload)
- **Best for CI/CD**: Option 1 (Amplify CLI)
- **Cheapest**: Option 3 (S3 + CloudFront)

Choose one and follow the steps!
