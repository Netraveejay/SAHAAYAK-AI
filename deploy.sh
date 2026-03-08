#!/bin/bash

# Sahaayak AI - Quick AWS Deployment Script

echo "🚀 Sahaayak AI Deployment Helper"
echo "================================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install it first:"
    echo "   https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Set variables
REGION="ap-south-1"
BUCKET_NAME="sahaayak-ai-uploads-$(date +%s)"
APP_NAME="sahaayak-ai"

echo "📋 Configuration:"
echo "   Region: $REGION"
echo "   S3 Bucket: $BUCKET_NAME"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Create S3 bucket
echo "📦 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION
if [ $? -eq 0 ]; then
    echo "✅ S3 bucket created: $BUCKET_NAME"
else
    echo "❌ Failed to create S3 bucket"
    exit 1
fi

# Enable Bedrock (auto-enabled, no manual step needed)
echo ""
echo "✅ Bedrock models are auto-enabled on first use"
echo "   Note: First-time Anthropic users may need to submit use case details"
echo ""

# Deploy backend with Elastic Beanstalk
echo ""
echo "🔧 Deploying backend..."
cd backend

if ! command -v eb &> /dev/null; then
    echo "Installing EB CLI..."
    pip install awsebcli
fi

eb init -p node.js-18 $APP_NAME --region $REGION
eb create ${APP_NAME}-env --instance-type t3.micro

# Set environment variables
echo "Setting environment variables..."
eb setenv \
  AWS_REGION=$REGION \
  S3_BUCKET=$BUCKET_NAME \
  NODE_ENV=production \
  PORT=8080 \
  FRONTEND_URL=https://main.amplifyapp.com

echo "✅ Backend deployed!"
BACKEND_URL=$(eb status | grep "CNAME" | awk '{print $2}')
echo "   Backend URL: http://$BACKEND_URL"

cd ..

# Deploy frontend to Amplify (manual step)
echo ""
echo "📱 Frontend Deployment:"
echo "   1. Push code to GitHub"
echo "   2. Go to: https://console.aws.amazon.com/amplify/"
echo "   3. Click 'New app' → 'Host web app'"
echo "   4. Connect GitHub repository"
echo "   5. Set App root: 'frontend'"
echo "   6. Add environment variable:"
echo "      VITE_API_URL=http://$BACKEND_URL"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "📝 Save these values:"
echo "   S3 Bucket: $BUCKET_NAME"
echo "   Backend URL: http://$BACKEND_URL"
echo "   Region: $REGION"
