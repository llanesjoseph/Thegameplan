#!/bin/bash

# Test Script for Invitation Email System (Bash version)
# Run this script to send a test invitation to the super admin email

echo "🧪 PLAYBOOKD Invitation Email Test Script"
echo "=========================================="
echo ""

# Check if FIREBASE_TOKEN is set
if [ -z "$FIREBASE_TOKEN" ]; then
  echo "❌ ERROR: FIREBASE_TOKEN environment variable not set"
  echo ""
  echo "📋 INSTRUCTIONS:"
  echo "1. Open your browser and login to PLAYBOOKD"
  echo "2. Open Developer Tools (F12)"
  echo "3. Go to Console tab"
  echo "4. Run this command:"
  echo "   firebase.auth().currentUser.getIdToken().then(t => console.log(t))"
  echo "5. Copy the long token that appears"
  echo "6. Run this script with the token:"
  echo ""
  echo "   FIREBASE_TOKEN=\"your-token-here\" bash test-invitation-email.sh"
  echo ""
  exit 1
fi

# Configuration
BASE_URL="${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}"
SUPER_ADMIN_EMAIL="joseph@crucibleanalytics.dev"

echo "📧 Sending test invitation..."
echo "To: $SUPER_ADMIN_EMAIL"
echo "Sport: Soccer"
echo "Message: 🧪 Automated test from audit"
echo ""
echo "🌐 Making request to: $BASE_URL/api/coach/invite-athletes"
echo ""

# Send request using curl
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/api/coach/invite-athletes" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sport": "Soccer",
    "customMessage": "🧪 This is an AUTOMATED TEST invitation from the comprehensive audit. Please verify you received this email!",
    "athletes": [
      {
        "email": "'"$SUPER_ADMIN_EMAIL"'",
        "name": "Test Athlete - Audit Verification"
      }
    ]
  }')

# Extract HTTP status code
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')

echo "📡 Response Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ SUCCESS! Invitation sent successfully!"
  echo ""
  echo "📊 Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "📬 CHECK YOUR EMAIL:"
  echo "   Login to: $SUPER_ADMIN_EMAIL"
  echo "   Subject: \"🏆 You're Invited to Train with...\""
  echo "   From: PLAYBOOKD <noreply@mail.crucibleanalytics.dev>"
  echo ""
  echo "✅ TEST PASSED: Email delivery initiated"
  echo "⏱️  NEXT STEP: Check inbox within 5 seconds"
  echo ""
elif [ "$HTTP_STATUS" = "401" ]; then
  echo "❌ AUTHENTICATION FAILED"
  echo ""
  echo "Possible issues:"
  echo "  - Token expired (tokens expire after 1 hour)"
  echo "  - Invalid token"
  echo "  - User not logged in"
  echo ""
  echo "Solution: Get a fresh token from browser console"
  echo ""
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
elif [ "$HTTP_STATUS" = "403" ]; then
  echo "❌ PERMISSION DENIED"
  echo ""
  echo "Your account does not have coach/creator role"
  echo ""
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ REQUEST FAILED"
  echo ""
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi
