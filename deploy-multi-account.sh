#!/usr/bin/env bash
# ==============================================================================
# AURA M&A Intelligence Platform - 3-Account Multi-Account Deployment Engine
# Deploys 20 AWS Services across 3 Accounts ($100 credits each / Triple Free Tier)
# ==============================================================================

set -e
export AWS_DEFAULT_OUTPUT=json

PROFILE1="${1:-aura-account1}"
PROFILE2="${2:-aura-account2}"
PROFILE3="${3:-aura-account3}"
DEFAULT_REGION="us-east-1"
REGION="${AWS_DEFAULT_REGION:-$DEFAULT_REGION}"
ALERT_EMAIL="${4:-deals@auramna.internal}"

echo "=========================================================================="
echo "  AURA M&A™ Platform - 3-Account Multi-Account Orchestration Engine"
echo "  Deploying 20 Enterprise AWS Services across 3 Linked Accounts"
echo "=========================================================================="
echo "  Account 1 (Edge/Frontend/Cognito): Profile [$PROFILE1]"
echo "  Account 2 (Core Engine/Data/GenAI): Profile [$PROFILE2]"
echo "  Account 3 (Pipelines/Alerts/Logs):   Profile [$PROFILE3]"
echo "  Region:                              [$REGION]"
echo "  Alert Email for Credit Safety:       [$ALERT_EMAIL]"
echo "=========================================================================="

# ------------------------------------------------------------------------------
# Preflight: Verify AWS CLI & Credentials for all 3 accounts
# ------------------------------------------------------------------------------
echo ""
echo "🔍 [Preflight] Verifying credentials across all 3 accounts..."

for P in "$PROFILE1" "$PROFILE2" "$PROFILE3"; do
    if ! aws sts get-caller-identity --profile "$P" &> /dev/null; then
        echo "❌ Error: Cannot authenticate with AWS profile '$P'."
        echo "   Please configure it with:"
        echo "     aws configure --profile $P"
        echo "   (Enter Access Key, Secret Key, and region: $REGION)"
        exit 1
    fi
    ACC_ID=$(aws sts get-caller-identity --profile "$P" --query "Account" --output text)
    echo "  ✅ Profile [$P] authenticated: Account ID $ACC_ID"
done

ACC1_ID=$(aws sts get-caller-identity --profile "$PROFILE1" --query "Account" --output text)
ACC2_ID=$(aws sts get-caller-identity --profile "$PROFILE2" --query "Account" --output text)
ACC3_ID=$(aws sts get-caller-identity --profile "$PROFILE3" --query "Account" --output text)

# ------------------------------------------------------------------------------
# STEP 1: Deploy Account 1 (Edge, Frontend, WAF, Cognito)
# ------------------------------------------------------------------------------
echo ""
echo "🚀 [Step 1/5] Deploying Account 1 (Edge, Frontend, WAF, Cognito User Pool)..."
STACK1_NAME="aura-mna-frontend-stack"

aws cloudformation deploy \
    --template-file infra/account1-frontend-edge.yaml \
    --stack-name "$STACK1_NAME" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --profile "$PROFILE1" \
    --region "$REGION"

COGNITO_POOL_ARN=$(aws cloudformation describe-stacks --stack-name "$STACK1_NAME" --profile "$PROFILE1" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolArn'].OutputValue" --output text)
COGNITO_POOL_ID=$(aws cloudformation describe-stacks --stack-name "$STACK1_NAME" --profile "$PROFILE1" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" --output text)
COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name "$STACK1_NAME" --profile "$PROFILE1" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='CognitoClientId'].OutputValue" --output text)
S3_UI_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK1_NAME" --profile "$PROFILE1" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='WebAppBucketName'].OutputValue" --output text)
CF_DIST_ID=$(aws cloudformation describe-stacks --stack-name "$STACK1_NAME" --profile "$PROFILE1" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
CF_URL=$(aws cloudformation describe-stacks --stack-name "$STACK1_NAME" --profile "$PROFILE1" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)

echo "  ✅ Account 1 Ready! CloudFront: $CF_URL"

# ------------------------------------------------------------------------------
# STEP 2: Deploy Account 3 (Pipelines, SQS, Step Functions, SNS, CloudWatch, Budgets)
# ------------------------------------------------------------------------------
echo ""
echo "🚀 [Step 2/5] Deploying Account 3 (Orchestration, Step Functions, SQS, Alerts, Budgets)..."
STACK3_NAME="aura-mna-ops-stack"

aws cloudformation deploy \
    --template-file infra/account3-ops-governance.yaml \
    --stack-name "$STACK3_NAME" \
    --parameter-overrides AdminAlertEmail="$ALERT_EMAIL" BudgetLimitUSD=80 \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --profile "$PROFILE3" \
    --region "$REGION"

SNS_TOPIC_ARN=$(aws cloudformation describe-stacks --stack-name "$STACK3_NAME" --profile "$PROFILE3" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='DealAlertsTopicArn'].OutputValue" --output text)
echo "  ✅ Account 3 Ready! Deal Alerts Topic: $SNS_TOPIC_ARN"

# ------------------------------------------------------------------------------
# STEP 3: Deploy Account 2 (Core Deal Engine, DynamoDB, Lambda, API Gateway, Bedrock)
# ------------------------------------------------------------------------------
echo ""
echo "🚀 [Step 3/5] Deploying Account 2 (Core Engine, DynamoDB, Bedrock, API Gateway)..."
STACK2_NAME="aura-mna-core-stack"

aws cloudformation deploy \
    --template-file infra/account2-core-engine.yaml \
    --stack-name "$STACK2_NAME" \
    --parameter-overrides CognitoUserPoolArn="$COGNITO_POOL_ARN" Account3Id="$ACC3_ID" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --profile "$PROFILE2" \
    --region "$REGION"

API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$STACK2_NAME" --profile "$PROFILE2" --region "$REGION" --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)
echo "  ✅ Account 2 Ready! REST API: $API_ENDPOINT"

# ------------------------------------------------------------------------------
# STEP 4: Build Web Application with Cross-Account Environment Variables
# ------------------------------------------------------------------------------
echo ""
echo "📦 [Step 4/5] Building production frontend bundle configured for Account 2 API & Account 1 Cognito..."

cat <<EOF > .env.production
VITE_API_ENDPOINT=$API_ENDPOINT
VITE_COGNITO_USER_POOL_ID=$COGNITO_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_AWS_REGION=$REGION
EOF

npm run build

# ------------------------------------------------------------------------------
# STEP 5: Deploy Frontend to Account 1 S3 & Invalidate CloudFront CDN
# ------------------------------------------------------------------------------
echo ""
echo "🌐 [Step 5/5] Uploading web app to Account 1 S3 ($S3_UI_BUCKET) and purging CloudFront cache..."

aws s3 sync dist/ "s3://$S3_UI_BUCKET" --delete --profile "$PROFILE1" --region "$REGION"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/*" \
    --profile "$PROFILE1" \
    --query "Invalidation.Id" --output text)

echo "  ✅ Cache Invalidation Created: $INVALIDATION_ID"

# ------------------------------------------------------------------------------
# Complete!
# ------------------------------------------------------------------------------
echo ""
echo "=========================================================================="
echo "🎉 DEPLOYMENT COMPLETE! 20 SERVICES DEPLOYED ACROSS 3 ACCOUNTS"
echo "=========================================================================="
echo "  🔗 Live M&A Web Application URL: $CF_URL"
echo "  ⚡ Account 2 Core API Endpoint:   $API_ENDPOINT"
echo "  🛡️  Account 1 Cognito Pool ID:     $COGNITO_POOL_ID"
echo "  🔔 Account 3 SNS Deals Topic:     $SNS_TOPIC_ARN"
echo "  💰 $80 Credit Guard Active:       Email alert sent to $ALERT_EMAIL"
echo "=========================================================================="
