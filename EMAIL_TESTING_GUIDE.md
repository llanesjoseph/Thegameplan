# Email Invitation Testing Guide

**Platform:** PLAYBOOKD
**Test Objective:** Verify email delivery reliability for invitation system
**Updated:** Post-Audit Implementation

---

## Prerequisites

Before running tests, ensure:

1. ✅ **Resend API Key** is configured in `.env`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```

2. ✅ **Verified Sender Domain** in Resend:
   - Current: `noreply@mail.crucibleanalytics.dev`
   - Verify at: https://resend.com/domains

3. ✅ **Super Admin Credentials**:
   - Email: `joseph@crucibleanalytics.dev` (from recent commits)
   - Role: `superadmin`

4. ✅ **Application Running**:
   ```bash
   npm run dev
   # or
   vercel dev
   ```

---

## Test Suite Overview

| Test # | Name | Objective | Expected Outcome |
|--------|------|-----------|------------------|
| 1 | Initial Invitation | Verify new athlete invitation email delivery | ✅ Email received in inbox |
| 2 | Standard Resend | Verify resend button functionality | ✅ Email received with resend count |
| 3 | Rapid Resend | Test idempotency & rate limiting | ⚠️ 429 Rate Limit after 2 attempts |

---

## Test Path 1: Initial Athlete Invitation

### Step-by-Step Instructions

1. **Login as Coach/Super Admin**
   ```
   URL: https://playbookd.crucibleanalytics.dev/
   Email: joseph@crucibleanalytics.dev
   Role: superadmin
   ```

2. **Navigate to Athletes Page**
   ```
   Dashboard > Coach > My Athletes
   or
   https://playbookd.crucibleanalytics.dev/dashboard/coach/athletes
   ```

3. **Create Test Invitation**
   - Click **"Invite Athletes"** button
   - Fill in form:
     ```
     Email: joseph@crucibleanalytics.dev (Super Admin's email for testing)
     Name: Test Athlete Alpha
     Sport: Soccer
     Custom Message: This is a test invitation for email delivery audit
     ```
   - Click **"Send 1 Invitation(s)"**

4. **Verify API Success**
   - Check console for: `✅ Athlete invitation sent to joseph@crucibleanalytics.dev`
   - Confirm success alert appears

5. **Check Email Inbox**
   - Login to `joseph@crucibleanalytics.dev` mailbox
   - Look for email from **PLAYBOOKD <noreply@mail.crucibleanalytics.dev>**
   - Subject: **"🏆 You're Invited to Train with [Coach Name] - PLAYBOOKD"**

6. **Email Content Verification**
   - ✅ Athlete name appears correctly ("Test Athlete Alpha")
   - ✅ Custom message displays
   - ✅ Invitation link is present
   - ✅ QR code renders
   - ✅ Expiration date shows (14 days from now)

### Expected Result

```
✅ PASS: Email delivered to inbox within 5 seconds
✅ PASS: Email content renders correctly
✅ PASS: Invitation URL is valid
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| No email received | Check spam folder, verify Resend API key |
| Email in spam | Add sender to contacts, check SPF/DKIM |
| 401 Unauthorized | Verify Firebase ID token is sent |
| 500 Server Error | Check logs: `npm run dev` console |

---

## Test Path 2: Standard Resend

### Step-by-Step Instructions

1. **Navigate to Invitations List**
   - Go to **Dashboard > Coach > My Athletes**
   - Locate the invitation created in Test Path 1

2. **Click Resend Button**
   - Find the **Mail icon** button (blue background)
   - Click and confirm: **"Resend this invitation?"**

3. **Verify Success Alert**
   - Expected: `✅ Invitation resent successfully!`
   - Shows: Email sent to, Resend count

4. **Check Email Inbox**
   - New email should arrive in `joseph@crucibleanalytics.dev`
   - Subject same as Test Path 1
   - Content identical to original invitation

5. **Verify Firestore Update**
   - Open Firebase Console > Firestore
   - Navigate to: `/invitations/{invitationId}`
   - Check fields:
     ```json
     {
       "lastResendAt": "2025-01-XX...",
       "resendCount": 1,
       "lastEmailSentAt": "2025-01-XX...",
       "status": "pending"
     }
     ```

### Expected Result

```
✅ PASS: Email delivered to inbox
✅ PASS: Resend count incremented to 1
✅ PASS: lastResendAt timestamp updated
✅ PASS: Audit log created with event "resend_invitation_success"
```

### API Endpoint

```http
POST /api/coach/resend-invitation
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json

{
  "invitationId": "athlete-invite-1234567890-abc123"
}
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Resend button does nothing | Check browser console for errors |
| "Invitation not found" | Verify invitationId exists in Firestore |
| Email not received | Check `lastEmailError` field in Firestore |

---

## Test Path 3: Rapid Resend (Idempotency Test)

### Step-by-Step Instructions

1. **Prepare Timing**
   - Open **My Athletes** page
   - Locate the same invitation from Tests 1 & 2
   - Have your mouse ready on the **Resend** button

2. **Execute Rapid Clicks**
   - Click **Resend** button
   - **IMMEDIATELY** click **Resend** button again (within 1 second)
   - **IMMEDIATELY** click **Resend** button a third time

3. **Verify Rate Limiting**
   - **First click:** ✅ Success alert
   - **Second click:** ✅ Success alert
   - **Third click:** ⚠️ Expected error:
     ```
     ⏱️ Too many resend attempts!
     Please wait XX seconds before trying again.
     ```

4. **Check Firestore**
   - `/invitations/{invitationId}` should show:
     ```json
     {
       "resendCount": 3  // or 2, depending on race condition
     }
     ```

5. **Verify Email Count**
   - Check inbox: Should have 2-3 emails total (NOT 100+)
   - Confirms idempotency protection

6. **Wait and Retry**
   - Wait 60 seconds
   - Click **Resend** again
   - Should succeed (rate limit window reset)

### Expected Result

```
✅ PASS: Rate limit triggered after 2 resends within 1 minute
✅ PASS: 429 status code returned
✅ PASS: retryAfter value provided
✅ PASS: No excessive emails sent (max 3 in rapid test)
```

### Rate Limiting Configuration

```typescript
const rateLimitWindow = 60000 // 1 minute
const maxResends = 2 // Max 2 resends per minute
```

Location: `app/api/coach/resend-invitation/route.ts:91-132`

---

## Automated Testing Script (Optional)

### Using `curl` for CLI Testing

**Test Path 1 & 2: Send Invitation and Resend**

```bash
#!/bin/bash

# 1. Get Firebase ID Token
# Login to Firebase and get token manually, or use Firebase Admin SDK

FIREBASE_TOKEN="<YOUR_FIREBASE_ID_TOKEN>"
BASE_URL="https://playbookd.crucibleanalytics.dev"

# 2. Create Initial Invitation
echo "Creating initial invitation..."
INVITE_RESPONSE=$(curl -X POST "$BASE_URL/api/coach/invite-athletes" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coachId": "<YOUR_UID>",
    "sport": "Soccer",
    "customMessage": "Automated test invitation",
    "athletes": [
      {
        "email": "joseph@crucibleanalytics.dev",
        "name": "Test Athlete Automated"
      }
    ]
  }')

echo $INVITE_RESPONSE

# Extract invitation ID from response
INVITATION_ID=$(echo $INVITE_RESPONSE | jq -r '.results[0].invitationId')

echo "Invitation ID: $INVITATION_ID"

# 3. Wait 5 seconds
echo "Waiting 5 seconds..."
sleep 5

# 4. Resend Invitation (Test Path 2)
echo "Resending invitation..."
curl -X POST "$BASE_URL/api/coach/resend-invitation" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"invitationId\": \"$INVITATION_ID\"}" \
  -w "\nStatus Code: %{http_code}\n"

# 5. Rapid Resend (Test Path 3)
echo "Testing rate limiting..."
for i in {1..3}; do
  echo "Resend attempt #$i"
  curl -X POST "$BASE_URL/api/coach/resend-invitation" \
    -H "Authorization: Bearer $FIREBASE_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"invitationId\": \"$INVITATION_ID\"}" \
    -w "\nStatus Code: %{http_code}\n"
  sleep 0.1
done
```

### Using Postman Collection

Import this collection for manual testing:

```json
{
  "info": { "name": "PLAYBOOKD Email Tests" },
  "item": [
    {
      "name": "Test 1: Create Invitation",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{firebaseToken}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"coachId\":\"{{userId}}\",\"sport\":\"Soccer\",\"athletes\":[{\"email\":\"joseph@crucibleanalytics.dev\",\"name\":\"Test Athlete\"}]}"
        },
        "url": "{{baseUrl}}/api/coach/invite-athletes"
      }
    },
    {
      "name": "Test 2: Resend Invitation",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{firebaseToken}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"invitationId\":\"{{invitationId}}\"}"
        },
        "url": "{{baseUrl}}/api/coach/resend-invitation"
      }
    }
  ]
}
```

---

## Email Delivery Checklist

After running all three test paths, verify:

- [ ] **Test 1 Email Received:** Initial invitation email delivered
- [ ] **Test 1 Content Valid:** All fields render correctly
- [ ] **Test 1 Link Works:** Invitation URL is accessible
- [ ] **Test 2 Email Received:** Resend email delivered
- [ ] **Test 2 Resend Count:** Firestore shows `resendCount: 1`
- [ ] **Test 3 Rate Limit:** 429 error after 2 resends
- [ ] **Test 3 No Spam:** Only 2-3 emails received, not excessive
- [ ] **Audit Logs Created:** All events logged in `/auditLogs`

---

## Success Criteria

### ✅ ALL TESTS PASS IF:

1. **Test 1 (Initial):**
   - Email delivered within 5 seconds
   - Email content matches template
   - Invitation link is valid

2. **Test 2 (Resend):**
   - Email delivered
   - `resendCount` incremented
   - `lastResendAt` timestamp updated

3. **Test 3 (Rapid):**
   - Rate limit enforced (429 status)
   - No excessive emails sent
   - `retryAfter` value returned

### Confirmation Messages

#### API Success (Test 1)
```
Successfully sent 1 invitation(s)!
```

#### API Success (Test 2)
```
✅ Invitation resent successfully!

Email sent to: joseph@crucibleanalytics.dev
Resend count: 1
```

#### API Rate Limited (Test 3)
```
⏱️ Too many resend attempts!

Please wait 60 seconds before trying again.
```

---

## Firestore Audit Verification

After completing all tests, verify audit logs in Firebase Console:

**Path:** `/auditLogs`

**Expected Entries:**

1. `resend_invitation_success` (from Test 2)
2. `resend_invitation_success` (from Test 3, attempt 1)
3. `resend_invitation_success` (from Test 3, attempt 2)
4. `resend_invitation_rate_limited` (from Test 3, attempt 3)

**Sample Audit Log:**
```json
{
  "eventType": "resend_invitation_success",
  "metadata": {
    "requestId": "resend-1234567890-abc123",
    "userId": "coach-uid-xxx",
    "invitationId": "athlete-invite-xxx",
    "athleteEmail": "joseph@crucibleanalytics.dev",
    "emailSent": true,
    "emailId": "re_xxxxx",
    "resendCount": 1,
    "timestamp": "2025-01-XX..."
  },
  "severity": "low",
  "userId": "coach-uid-xxx",
  "createdAt": "<TIMESTAMP>"
}
```

---

## Troubleshooting Guide

### Issue: No Emails Received

**Checklist:**
1. Check Resend API key: `RESEND_API_KEY` in `.env`
2. Verify sender domain: https://resend.com/domains
3. Check spam/junk folder
4. Verify email address is correct
5. Check Resend dashboard: https://resend.com/emails

**Logs to Check:**
```bash
# Server logs
npm run dev
# Look for: "✅ Athlete invitation email sent to..."
# or "❌ Failed to send invitation to..."
```

**Firestore Fields to Check:**
- `emailSent`: Should be `true`
- `lastEmailError`: Should be `null` or missing
- `lastEmailSentAt`: Should have recent timestamp

---

### Issue: Rate Limiting Not Working

**Possible Causes:**
1. Server restarted (in-memory rate limit store cleared)
2. Multiple server instances (not distributed)
3. Timing issues (clicks too far apart)

**Solution:**
- Ensure clicks are within 1 second
- Check server logs for rate limit messages
- Verify `resendAttempts` Map has entry

---

### Issue: Resend Button Not Working

**Browser Console Check:**
```javascript
// Open DevTools (F12) > Console
// Look for errors when clicking Resend button
```

**Common Errors:**
- `Failed to fetch`: Network issue
- `401 Unauthorized`: Token expired or missing
- `404 Not Found`: Invitation ID invalid

**Fix:**
1. Refresh page to get new token
2. Verify invitation exists in Firestore
3. Check network tab for request details

---

## Contact & Support

**Issues Found During Testing:**
- Create GitHub issue: https://github.com/[your-repo]/issues
- Email: joseph@crucibleanalytics.dev
- Include: Screenshots, error messages, Firestore invitation ID

**Successful Test Results:**
- Email confirmation to: joseph@crucibleanalytics.dev
- Format: "Email Testing Complete - [Date] - [Pass/Fail]"

---

**End of Email Testing Guide**
**Version:** 1.0.0 (Post-Audit)
**Last Updated:** January 2025
