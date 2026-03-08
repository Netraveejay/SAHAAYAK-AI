#!/bin/bash

# Sahaayak AI - Production Deployment Script
# Usage: ./deploy.sh [CLOUDFRONT_DISTRIBUTION_ID]

set -e

BUCKET_NAME="sahaayak-ai-frontend"
REGION="ap-south-1"
DISTRIBUTION_ID=$1

echo "🚀 Starting deployment..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

# Upload to S3
echo "☁️  Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region $REGION

# Set cache headers for HTML files
echo "🔧 Setting cache headers..."
aws s3 cp s3://$BUCKET_NAME/index.html s3://$BUCKET_NAME/index.html \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html" \
  --region $REGION

# Invalidate CloudFront cache
if [ -n "$DISTRIBUTION_ID" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"
  echo "✅ Deployment complete! Cache invalidation in progress."
else
  echo "⚠️  No CloudFront distribution ID provided. Skipping cache invalidation."
  echo "✅ Deployment complete!"
fi

echo ""
echo "🌐 Your app will be live in 1-3 minutes."
