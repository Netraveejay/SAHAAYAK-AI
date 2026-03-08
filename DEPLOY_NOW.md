# Manual Deployment Steps

You've already created S3 bucket: **sahaayak-ai-uploads-1772961977** ✅

## Next Steps:

### 1. Skip Bedrock Setup
✅ Bedrock is auto-enabled. No manual setup needed!

### 2. Deploy Backend to Elastic Beanstalk

```bash
# Install EB CLI (if not installed)
pip3 install awsebcli --user

# Or use homebrew on Mac
brew install awsebcli

# Navigate to backend
cd backend

# Initialize EB application
eb init -p node.js-18 sahaayak-ai --region ap-south-1

# Create environment
eb create sahaayak-env --instance-type t3.micro

# Set environment variables
eb setenv \
  AWS_REGION=ap-south-1 \
  S3_BUCKET=sahaayak-ai-uploads-1772961977 \
  NODE_ENV=production \
  PORT=8080

# Get your backend URL
eb status
```

Copy the CNAME from `eb status` output (e.g., `sahaayak-env.eba-xxxxx.ap-south-1.elasticbeanstalk.com`)

### 3. Deploy Frontend to Amplify

#### A. Push to GitHub:
```bash
cd ..
git init
git add .
git commit -m "Deploy to AWS"
git branch -M main
git remote add origin YOUR-GITHUB-REPO-URL
git push -u origin main
```

#### B. Deploy in Amplify Console:

1. Go to: https://console.aws.amazon.com/amplify/
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** → Authorize → Select your repo
4. Configure build:
   - **App name**: sahaayak-ai
   - **App root directory**: `frontend`
   - Build settings: (auto-detected)
5. Add **Environment variable**:
   - Key: `VITE_API_URL`
   - Value: `http://YOUR-BACKEND-CNAME` (from step 2)
6. Click **"Save and deploy"**

### 4. Update Backend CORS

After getting your Amplify URL (e.g., `https://main.xxxxx.amplifyapp.com`):

```bash
cd backend
eb setenv FRONTEND_URL=https://YOUR-AMPLIFY-URL
```

### 5. Test Your App

Visit your Amplify URL and test:
- Login: any 10-digit mobile
- OTP: `123456`
- Create profile
- Check schemes

## Troubleshooting:

**If `pip install awsebcli` fails:**
```bash
# Try with pip3
pip3 install awsebcli --user

# Or use homebrew (Mac)
brew install awsebcli

# Or use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install awsebcli
```

**If EB CLI not found after install:**
```bash
# Add to PATH
export PATH=$PATH:~/.local/bin
```

**Backend deployment fails:**
- Check IAM role exists: `sahaayak-ai-role`
- Verify role has Bedrock, Polly, Translate, S3 permissions
- Check AWS credentials: `aws configure`

## Your Configuration:
- ✅ S3 Bucket: `sahaayak-ai-uploads-1772961977`
- ✅ Region: `ap-south-1`
- ⏳ Backend URL: (get from `eb status`)
- ⏳ Frontend URL: (get from Amplify)
