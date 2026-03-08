# Quick Start: Deploy to AWS Amplify

## ✅ What's Already Done:
- AWS services (Bedrock, Polly, Translate, S3) are coded
- Frontend & backend are ready
- Bedrock models auto-enable on first use

## 🚀 3-Step Deployment:

### Step 1: Create IAM Role (2 minutes)

1. Go to [IAM Console](https://console.aws.amazon.com/iam/home#/roles)
2. Click **Create role**
3. Select: **AWS Service** → **Elastic Beanstalk** → **Elastic Beanstalk - Customizable**
4. Add these policies:
   - `AmazonBedrockFullAccess`
   - `AmazonPollyFullAccess`
   - `TranslateFullAccess`
   - `AmazonS3FullAccess`
5. Name: `sahaayak-ai-role`
6. Click **Create role**

### Step 2: Create S3 Bucket (1 minute)

```bash
aws s3 mb s3://sahaayak-ai-uploads-$(date +%s) --region ap-south-1
```

Or in [S3 Console](https://s3.console.aws.amazon.com/):
- Click **Create bucket**
- Name: `sahaayak-ai-uploads-YOUR-NAME`
- Region: **ap-south-1**
- Uncheck "Block all public access"
- Click **Create**

### Step 3: Deploy

#### A. Deploy Backend (Elastic Beanstalk)

```bash
cd backend
pip install awsebcli
eb init -p node.js-18 sahaayak-ai --region ap-south-1
eb create sahaayak-env --instance-type t3.micro

# Set environment variables (replace YOUR-BUCKET-NAME)
eb setenv \
  AWS_REGION=ap-south-1 \
  S3_BUCKET=YOUR-BUCKET-NAME \
  NODE_ENV=production \
  PORT=8080

# Get backend URL
eb status
```

#### B. Deploy Frontend (Amplify)

1. Push to GitHub:
```bash
cd ..
git init
git add .
git commit -m "Deploy to Amplify"
git remote add origin YOUR-GITHUB-REPO
git push -u origin main
```

2. Go to [Amplify Console](https://console.aws.amazon.com/amplify/)
3. Click **New app** → **Host web app**
4. Connect **GitHub** → Select repo
5. Configure:
   - App root: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
6. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `http://YOUR-BACKEND-URL` (from eb status)
7. Click **Save and deploy**

## ✅ Done!

Visit your Amplify URL and test:
- Login with any 10-digit mobile
- OTP: `123456`
- Create profile
- Check eligible schemes

## 💰 Cost: ~$15-30/month

- Elastic Beanstalk: ~$10 (t3.micro)
- Amplify: ~$1-5
- AWS Services: ~$5-15 (usage-based)

## 🔧 Troubleshooting:

**Backend fails to start:**
- Check IAM role is attached to EB environment
- Verify environment variables are set

**Frontend can't connect:**
- Update `VITE_API_URL` in Amplify env vars
- Check CORS in backend allows your Amplify domain

**Bedrock errors:**
- First-time Anthropic users: Submit use case on first API call
- Check IAM role has `AmazonBedrockFullAccess`

## 📚 Full Docs:
- `DEPLOYMENT.md` - Complete deployment guide
- `AWS_SETUP.md` - Detailed AWS configuration
