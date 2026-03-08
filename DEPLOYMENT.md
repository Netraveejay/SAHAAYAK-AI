# Deploy Sahaayak AI to AWS Amplify

## Prerequisites
- AWS Account
- GitHub repository with your code
- AWS CLI installed (optional)

## Deployment Steps

### 1. Push Code to GitHub
```bash
cd sahaayak-ai
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy Frontend to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"New app"** → **"Host web app"**
3. Select **GitHub** and authorize AWS Amplify
4. Select your repository: `sahaayak-ai`
5. Select branch: `main`
6. Configure build settings:
   - **App name**: sahaayak-ai-frontend
   - **Monorepo**: Yes
   - **App root directory**: `frontend`
   - Build settings will auto-detect from `amplify.yml`

7. **Environment variables** (Add these):
   ```
   VITE_API_URL=<your-backend-url>
   ```
   (You'll update this after deploying backend)

8. Click **"Save and deploy"**

### 3. Deploy Backend (Options)

#### Option A: AWS Elastic Beanstalk (Recommended for Express apps)

1. Install EB CLI:
   ```bash
   pip install awsebcli
   ```

2. Initialize and deploy:
   ```bash
   cd backend
   eb init -p node.js-18 sahaayak-ai-backend --region us-east-1
   eb create sahaayak-ai-backend-env
   ```

3. Set environment variables:
   ```bash
   eb setenv NODE_ENV=production PORT=8080
   ```

4. Get your backend URL:
   ```bash
   eb status
   ```

#### Option B: AWS App Runner

1. Go to [AWS App Runner Console](https://console.aws.amazon.com/apprunner/)
2. Click **"Create service"**
3. Select **"Source code repository"** → Connect to GitHub
4. Select repository and branch
5. Configure:
   - **Runtime**: Node.js 18
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Port**: 5000
6. Click **"Create & deploy"**

#### Option C: AWS Lambda + API Gateway (Serverless)

Create `backend/lambda.js`:
```javascript
const serverless = require('serverless-http');
const app = require('./server');
module.exports.handler = serverless(app);
```

Then deploy using AWS SAM or Serverless Framework.

### 4. Update Frontend with Backend URL

1. Go back to Amplify Console
2. Select your frontend app
3. Go to **"Environment variables"**
4. Update `VITE_API_URL` with your backend URL (from step 3)
5. Redeploy: **"Redeploy this version"**

### 5. Configure CORS in Backend

Update `backend/server.js` CORS settings:
```javascript
app.use(cors({
  origin: ['https://your-amplify-domain.amplifyapp.com'],
  credentials: true
}));
```

### 6. Create Required Directories

Ensure these exist in your backend:
```bash
mkdir -p backend/data
mkdir -p backend/uploads
```

### 7. Test Your Deployment

1. Visit your Amplify URL: `https://xxxxx.amplifyapp.com`
2. Test login with mobile: any 10-digit number
3. Test OTP: `123456`
4. Create profiles and check schemes

## Important Notes

- **Data Persistence**: Current setup uses local JSON files. For production, consider:
  - Amazon DynamoDB for user/profile data
  - Amazon S3 for file uploads
  - Amazon RDS for relational data

- **File Uploads**: Current setup stores files locally. For production:
  - Use Amazon S3 for document storage
  - Update upload routes to use S3 SDK

- **Environment Variables**:
  - Frontend: Prefix with `VITE_`
  - Backend: Set in Elastic Beanstalk/App Runner console

## Cost Optimization

- Amplify Hosting: ~$0.15/GB served + $0.01/build minute
- Elastic Beanstalk: Free tier available (t2.micro)
- App Runner: Pay per use (~$0.007/vCPU-hour)

## Troubleshooting

### Build Fails
- Check Node version (should be 18+)
- Verify `package.json` scripts
- Check build logs in Amplify console

### Backend Connection Issues
- Verify CORS settings
- Check backend URL in frontend env vars
- Ensure backend is running and accessible

### File Upload Issues
- For production, migrate to S3
- Check file size limits
- Verify multer configuration

## Next Steps for Production

1. **Database**: Migrate from JSON to DynamoDB
2. **Storage**: Use S3 for uploads
3. **Authentication**: Add AWS Cognito
4. **Monitoring**: Enable CloudWatch logs
5. **CDN**: CloudFront for better performance
6. **Domain**: Add custom domain in Amplify
