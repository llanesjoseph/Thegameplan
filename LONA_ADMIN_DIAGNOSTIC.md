# Lona Admin Invitation Diagnostic Guide

## Check 1: Verify Invitation Was Created

1. Go to Firebase Console → Firestore Database
2. Look for collection: `admin_invitations`
3. Find invitation with `recipientEmail: "lona@aikeysaintil.com"`
4. Check these fields:
   - `status`: Should be "active" (not "used")
   - `expiresAt`: Should be future date (created + 7 days)
   - `code`: Should start with "admin-"
   - `role`: Should be "admin" or "superadmin"
   - `recipientEmail`: Should be "lona@aikeysaintil.com"

## Check 2: Verify User Doesn't Already Exist

1. Go to Firebase Console → Firestore Database
2. Look for collection: `users`
3. Search for document where `email == "lona@aikeysaintil.com"`
4. **If found:** Lona already has an account! See "Solution for Existing User" below

## Check 3: Verify Invitation Email Was Sent

1. Check if invitation has field: `emailSent: true`
2. If `false`, check `emailError` field for the reason
3. Common issues:
   - RESEND_API_KEY not configured
   - Email address invalid
   - Resend API limit reached

## Check 4: Test the Invitation Link

1. Get the invitation URL from Firebase:
   - Format: `https://[your-domain]/admin-onboard/[code]`
   - Example: `https://playbookd.crucibleanalytics.dev/admin-onboard/admin-1234567890-abc123`
2. Have Lona click the link or send it to her again
3. Note what page/error she sees

---

## Common Issues & Solutions

### Issue A: "Email already in use"

**Cause:** Lona has an existing account (athlete, coach, etc.)

**Solution:** Manually upgrade her existing account to admin:

1. Go to Firebase Firestore → `users` collection
2. Find Lona's user document (email: lona@aikeysaintil.com)
3. Edit the document:
   - Change `role` field to: `"admin"` (or `"superadmin"`)
4. Have Lona sign in with her existing credentials
5. She'll now have admin access!

**Command to do this via script:**
```typescript
// Update existing user to admin role
await adminDb.collection('users').doc('[LONA_UID]').update({
  role: 'admin',
  updatedAt: Timestamp.now()
})
```

---

### Issue B: "Invitation has expired"

**Cause:** More than 7 days passed since invitation was created

**Solution:** Create a new invitation with longer expiry:

1. Go to Admin Dashboard → Admin Invites
2. Create new invitation for lona@aikeysaintil.com
3. Set `expiresInDays: 30` for 30-day expiration
4. Send her the new link

---

### Issue C: "Invitation not found"

**Cause:** Invitation wasn't created in Firestore `admin_invitations` collection

**Possible reasons:**
- Wrong collection name (should be `admin_invitations` not `invitations`)
- Invitation creation failed silently
- Database permissions issue

**Solution:** Create a new invitation and verify it appears in Firestore

---

### Issue D: "Invitation already used"

**Cause:** The invitation status is "used"

**Possible reasons:**
- Someone else used the invitation
- Lona already created an account with it
- Invitation was accidentally marked as used

**Solution Option 1:** Check if Lona's account exists
- If yes → She can just sign in at `/sign-in`
- If no → Create a new invitation

**Solution Option 2:** Reset the invitation (not recommended):
```typescript
// ONLY if you're sure the account wasn't created
await adminDb.collection('admin_invitations').doc('[INVITATION_ID]').update({
  status: 'active',
  usedAt: null,
  usedBy: null
})
```

---

### Issue E: Can't access invitation link (404)

**Cause:** URL routing issue or wrong link format

**Solution:** Verify the URL format:
- Correct: `https://[domain]/admin-onboard/admin-1234567890-abc123`
- Wrong: `https://[domain]/admin-onboard?code=admin-123...`
- Wrong: `https://[domain]/admin-invite/admin-123...`

---

### Issue F: Redirect to wrong page after signup

**Cause:** After successful signup, redirects to wrong dashboard

**Current behavior:** Redirects to `/dashboard` which should auto-route based on role

**If this is the issue:** Check the `/dashboard/page.tsx` routing logic

---

## What To Ask Lona

Send Lona these questions to help diagnose:

1. **"When you click the invitation link, what do you see?"**
   - Describe the page or error message

2. **"Have you already created an account on PLAYBOOKD before?"**
   - If yes → We need to upgrade existing account instead

3. **"What email address are you trying to use?"**
   - Confirm it matches: lona@aikeysaintil.com

4. **"Can you send me a screenshot of what you're seeing?"**
   - This will help identify the exact issue

5. **"Did you receive the invitation email?"**
   - Check spam/junk folders

---

## Emergency Manual Admin Creation

If all else fails, manually create Lona's admin account:

```typescript
// 1. Create Firebase Auth user (do this in Firebase Console)
// Go to Authentication → Users → Add User
// Email: lona@aikeysaintil.com
// Password: [Set temporary password]

// 2. Create Firestore user document
await adminDb.collection('users').doc('[NEW_UID]').set({
  email: 'lona@aikeysaintil.com',
  displayName: 'Lona Vincent',
  role: 'admin',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  onboardedAt: Timestamp.now()
})

// 3. Tell Lona to sign in at /sign-in with the credentials
```

---

## Next Steps

1. Ask Lona the diagnostic questions above
2. Based on her answers, identify which issue matches
3. Apply the corresponding solution
4. Test by having Lona try again
5. If still not working, let me know her specific error message and I'll investigate further
