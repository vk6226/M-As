#!/usr/bin/env bash
# ==============================================================================
# AURA M&A Intelligence Platform - Automated AWS Deployment Script
# Provisions Full 20-Service Serverless Stack + S3 + CloudFront CDN
# ==============================================================================

set -e
export AWS_DEFAULT_OUTPUT=json

echo "=========================================================="
echo "  AURA M&A Platform - AWS Deployment Engine"
echo "=========================================================="

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed or not in your PATH."
    exit 1
fi

# Check AWS credentials
echo "🔍 Checking AWS Credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Error: AWS credentials not configured or expired."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
DEFAULT_REGION="us-east-1"
REGION="${AWS_DEFAULT_REGION:-$DEFAULT_REGION}"
STACK_NAME="aura-mna-platform-stack"
ALERT_EMAIL="${1:-deals@auramna.internal}"

echo "✅ Authenticated to AWS Account: $ACCOUNT_ID (Region: $REGION)"
echo "   Alert & Credit Guard Email: $ALERT_EMAIL"

# Step 1: Build production app
echo ""
echo "📦 Step 1: Building production web application bundle..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: 'dist' folder was not created. Build failed."
    exit 1
fi
echo "✅ Build completed successfully in ./dist"

# Step 2: Deploy CloudFormation Stack
echo ""
echo "🚀 Step 2: Deploying CloudFormation Stack ($STACK_NAME)..."
echo "   (Provisions 20 Serverless Services: S3, CloudFront, DynamoDB, Lambda, Cognito, Step Functions, SQS, KMS, SNS, EventBridge, CloudWatch, Budgets)"

aws cloudformation deploy \
    --template-file cloudformation-template.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides ProjectName="aura-mna" AdminAlertEmail="$ALERT_EMAIL" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region "$REGION"

# Get outputs from CloudFormation
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text)
CF_DIST_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
LIVE_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='LiveApplicationURL'].OutputValue" --output text)

echo "✅ Infrastructure provisioned:"
echo "   - S3 Bucket: $BUCKET_NAME"
echo "   - CloudFront Distribution ID: $CF_DIST_ID"
echo "   - Public Live URL: $LIVE_URL"

# Step 3: Upload compiled files to S3
echo ""
echo "📤 Step 3: Syncing production files to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME/" --delete \
    --cache-control "max-age=31536000,public,immutable" \
    --exclude "index.html"

# Upload index.html with no-cache so updates reflect immediately
aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

echo "✅ S3 sync finished."

# Step 4: Invalidate CloudFront Cache (if enabled)
if [ -n "$CF_DIST_ID" ] && [ "$CF_DIST_ID" != "None" ]; then
    echo ""
    echo "🔄 Step 4: Invalidating CloudFront edge cache ($CF_DIST_ID)..."
    aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*" > /dev/null || true
else
    echo ""
    echo "ℹ️ Serving directly via high-speed S3 Website endpoint."
fi

echo "=========================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "   Your M&A Precision Target Discovery & Intelligence Platform"
echo "   is now live on AWS at:"
echo ""
echo "   👉 $LIVE_URL"
echo ""
echo "=========================================================="
