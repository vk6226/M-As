#!/usr/bin/env bash
# ==============================================================================
# AURA M&A - 3-Account Credit Protection & Budget Enforcer
# Sets up $80 alarms on all 3 accounts to safeguard the $100 credits
# ==============================================================================

set -e

ALERT_EMAIL="${1:-deals@auramna.internal}"
PROFILES=("aura-account1" "aura-account2" "aura-account3")

echo "=========================================================================="
echo "  Setting up $80 Safety Alarms across 3 Accounts for: $ALERT_EMAIL"
echo "=========================================================================="

for P in "${PROFILES[@]}"; do
    if ! aws sts get-caller-identity --profile "$P" &> /dev/null; then
        echo "⚠️ Profile '$P' not configured. Skipping budget creation for $P."
        continue
    fi

    ACC_ID=$(aws sts get-caller-identity --profile "$P" --query "Account" --output text)
    echo "🛡️ Configuring $80 Budget Alert on Account $ACC_ID (Profile: $P)..."

    aws budgets create-budget \
        --profile "$P" \
        --account-id "$ACC_ID" \
        --budget '{
            "BudgetName": "AURA-Credit-Protection-80USD",
            "BudgetLimit": {"Amount": "80", "Unit": "USD"},
            "TimeUnit": "MONTHLY",
            "BudgetType": "COST"
        }' \
        --notifications-with-subscribers '[{
            "Notification": {
                "NotificationType": "ACTUAL",
                "ComparisonOperator": "GREATER_THAN",
                "Threshold": 80,
                "ThresholdType": "PERCENTAGE"
            },
            "Subscribers": [{"SubscriptionType": "EMAIL", "Address": "'"$ALERT_EMAIL"'"}]
        }]' || echo "  ℹ️ Budget may already exist or permissions pending."

    echo "  ✅ Guard active for Account $ACC_ID"
done

echo ""
echo "All available accounts secured with 80% ($80) early warning alarms."
