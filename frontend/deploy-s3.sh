#!/bin/bash

BUCKET_NAME="sahaayak-frontend-$(date +%s)"
REGION="ap-south-1"

echo "Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

echo "Configuring bucket for static website hosting"
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

echo "Setting bucket policy for public access"
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file:///tmp/bucket-policy.json

echo "Uploading files"
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

echo "Website URL: http://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
