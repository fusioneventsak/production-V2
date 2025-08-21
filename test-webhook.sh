#!/bin/bash

# Enhanced Test Script for Stripe Webhook
# This script provides multiple testing options for the Stripe webhook

# Configuration
WEBHOOK_URL="https://xqgtuvzlrvbwwesuvitp.supabase.co/functions/v1/stripe-webhook"
TIMESTAMP=$(date +%s)

# Default values
TEST_MODE="signature"
EVENT_TYPE="checkout.session.completed"
AUTH_HEADER=""

# Help function
show_help() {
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -m, --mode MODE       Test mode: signature, auth, or both (default: signature)"
  echo "  -e, --event TYPE      Event type to simulate (default: checkout.session.completed)"
  echo "  -s, --secret SECRET   Webhook secret for signature (default: whsec_test_secret_key)"
  echo "  -a, --auth TOKEN      Authorization token (default: none)"
  echo "  -h, --help            Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 --mode signature                   # Test with signature only"
  echo "  $0 --mode auth --auth 'Bearer xyz'    # Test with auth header only"
  echo "  $0 --mode both --secret 'whsec_real'  # Test with both signature and auth"
  echo "  $0 --event customer.subscription.updated  # Test different event type"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -m|--mode)
      TEST_MODE="$2"
      shift
      shift
      ;;
    -e|--event)
      EVENT_TYPE="$2"
      shift
      shift
      ;;
    -s|--secret)
      TEST_SECRET="$2"
      shift
      shift
      ;;
    -a|--auth)
      AUTH_HEADER="$2"
      shift
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Set default secret if not provided
if [ -z "$TEST_SECRET" ]; then
  TEST_SECRET="whsec_test_secret_key"
fi

# Create test payload based on event type
case $EVENT_TYPE in
  "checkout.session.completed")
    PAYLOAD='{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_123","customer":"cus_test_123","subscription":"sub_test_123","client_reference_id":"user_test_123","metadata":{"tier":"starter"}}}'
    ;;
  "customer.subscription.updated")
    PAYLOAD='{"type":"customer.subscription.updated","data":{"object":{"id":"sub_test_123","customer":"cus_test_123","status":"active","current_period_end":1755717537}}}'
    ;;
  "customer.subscription.deleted")
    PAYLOAD='{"type":"customer.subscription.deleted","data":{"object":{"id":"sub_test_123","customer":"cus_test_123","status":"canceled"}}}'
    ;;
  *)
    PAYLOAD='{"type":"'$EVENT_TYPE'","data":{"object":{"id":"evt_test_123"}}}'
    ;;
esac

# Generate test signature
SIGNED_PAYLOAD="${TIMESTAMP}.${PAYLOAD}"
SIGNATURE=$(echo -n "$SIGNED_PAYLOAD" | openssl dgst -sha256 -hmac "$TEST_SECRET" | cut -d' ' -f2)

# Prepare headers
HEADERS=()
HEADERS+=("Content-Type: application/json")

if [[ "$TEST_MODE" == "signature" || "$TEST_MODE" == "both" ]]; then
  HEADERS+=("stripe-signature: t=${TIMESTAMP},v1=${SIGNATURE}")
fi

if [[ "$TEST_MODE" == "auth" || "$TEST_MODE" == "both" ]]; then
  if [ -n "$AUTH_HEADER" ]; then
    HEADERS+=("Authorization: $AUTH_HEADER")
  else
    echo "⚠️ Warning: Auth mode selected but no auth token provided"
  fi
fi

# Print test information
echo "🔍 Testing webhook at: $WEBHOOK_URL"
echo "🔍 Test mode: $TEST_MODE"
echo "🔍 Event type: $EVENT_TYPE"
echo "🔍 Timestamp: $TIMESTAMP"

if [[ "$TEST_MODE" == "signature" || "$TEST_MODE" == "both" ]]; then
  echo "🔍 Signature: ${SIGNATURE:0:10}..."
  echo "🔍 Secret used: ${TEST_SECRET:0:5}..."
fi

if [[ "$TEST_MODE" == "auth" || "$TEST_MODE" == "both" ]]; then
  if [ -n "$AUTH_HEADER" ]; then
    echo "🔍 Auth header: ${AUTH_HEADER:0:10}..."
  fi
fi

# Build curl command with headers
CURL_CMD="curl -X POST \"$WEBHOOK_URL\" \\
"
for header in "${HEADERS[@]}"; do
  CURL_CMD+="  -H \"$header\" \\
"
done
CURL_CMD+="  -d \"$PAYLOAD\""

# Print curl command
echo "📋 Command:"
echo "$CURL_CMD"

# Send request
echo "📤 Sending webhook request..."
HEADER_ARGS=()
for header in "${HEADERS[@]}"; do
  HEADER_ARGS+=(-H "$header")
done

curl -X POST "$WEBHOOK_URL" \
  "${HEADER_ARGS[@]}" \
  -d "$PAYLOAD"

echo ""
echo "✅ Test complete. Check Supabase logs for results."
echo "Note: You may see a 401 error if JWT verification is enabled and no auth header was provided."
echo "📋 To view logs, go to the Supabase dashboard > Edge Functions > stripe-webhook > Logs"
