# Apple Sign-In Configuration Guide

## Overview
This guide walks through the complete setup process for Apple Sign-In authentication in your Firebase project.

## Prerequisites
- Active Apple Developer Account ($99/year membership)
- Access to Firebase Console with admin privileges
- Access to Apple Developer Console

---

## Step 1: Configure Apple Developer Console

### 1.1 Create an App ID (if not already created)

1. Go to [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list)
2. Click the **+** button to create a new identifier
3. Select **App IDs** and click **Continue**
4. Select **App** and click **Continue**
5. Fill in:
   - **Description**: Game Plan App
   - **Bundle ID**: `com.crucibleanalytics.gameplan` (or your existing Bundle ID)
6. In **Capabilities**, enable **Sign In with Apple**
7. Click **Continue** then **Register**

### 1.2 Create a Service ID

1. Go to [Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click **+** to create a new identifier
3. Select **Services IDs** and click **Continue**
4. Fill in:
   - **Description**: Game Plan Web Auth
   - **Identifier**: `com.crucibleanalytics.gameplan.web` (must be unique)
5. Check **Sign In with Apple** checkbox
6. Click **Configure** next to "Sign In with Apple"
7. In the configuration:
   - **Primary App ID**: Select your App ID from Step 1.1
   - **Web Domain**: `gameplan-787a2.firebaseapp.com` (your Firebase auth domain without https://)
   - **Return URLs**: Add these URLs:
     ```
     https://gameplan-787a2.firebaseapp.com/__/auth/handler
     https://playbookd.crucibleanalytics.dev/__/auth/handler
     https://yourdomain.com/__/auth/handler (if you have custom domain)
     ```
8. Click **Save** then **Continue** then **Register**

### 1.3 Create a Private Key (Optional - for Server-side Auth)

1. Go to [Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Click **+** to create a new key
3. Enter a name: "Game Plan Server Key"
4. Check **Sign In with Apple**
5. Click **Configure** and select your Primary App ID
6. Click **Save** then **Continue** then **Register**
7. **IMPORTANT**: Download the `.p8` file - you can only download it once!
8. Note the **Key ID** shown on the screen

---

## Step 2: Configure Firebase Console

### 2.1 Enable Apple Provider

1. Go to [Firebase Console](https://console.firebase.google.com/project/gameplan-787a2/authentication/providers)
2. Navigate to **Authentication** > **Sign-in method**
3. Click on **Apple** in the providers list
4. Click **Enable**
5. Fill in the required information:
   - **Service ID**: `com.crucibleanalytics.gameplan.web` (from Step 1.2)
   - **Apple Team ID**: Found in [Apple Developer Membership](https://developer.apple.com/account/#/membership)
   - **Key ID**: (if using private key from Step 1.3)
   - **Private Key**: (paste contents of .p8 file from Step 1.3)
6. Note the **OAuth redirect URI** shown - ensure this matches what you configured in Step 1.2
7. Click **Save**

### 2.2 Add Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** tab
2. Scroll to **Authorized domains** section
3. Ensure these domains are added:
   - `gameplan-787a2.firebaseapp.com` (default)
   - `localhost` (for local development)
   - `playbookd.crucibleanalytics.dev` (your production domain)
   - Any other custom domains you use
4. Click **Add domain** if you need to add new ones

---

## Step 3: Test the Integration

### 3.1 Check Configuration

1. Navigate to `/api/check-apple-auth` endpoint to see diagnostic information
2. Review the browser console when attempting Apple Sign-In
3. Look for specific error codes:
   - `auth/operation-not-allowed` → Apple not enabled in Firebase
   - `auth/unauthorized-domain` → Domain not in authorized list
   - `auth/auth-domain-config-required` → Auth domain misconfigured

### 3.2 Test Sign-In Flow

1. Clear browser cache and cookies
2. Go to your sign-in page
3. Click "Sign in with Apple"
4. Check browser console for detailed logs prefixed with `[AppleSignIn]`
5. Complete Apple authentication
6. Verify you're redirected to the correct page

---

## Common Issues & Solutions

### Issue: "Apple Sign-In is not enabled"
**Error Code**: `auth/operation-not-allowed`

**Solution**:
1. Go to Firebase Console > Authentication > Sign-in method
2. Find "Apple" in the list
3. Toggle it to **Enabled**
4. Ensure Service ID is properly configured

### Issue: "This domain is not authorized"
**Error Code**: `auth/unauthorized-domain`

**Solution**:
1. Go to Firebase Console > Authentication > Settings
2. Add your domain to **Authorized domains** list
3. Also verify in Apple Developer Console that Return URLs include your domain

### Issue: "Sign-in popup blocked"
**Error Code**: `auth/popup-blocked`

**Solution**:
- User's browser is blocking popups
- The code will automatically fallback to redirect method
- User can manually allow popups for your domain

### Issue: "Account exists with different credential"
**Error Code**: `auth/account-exists-with-different-credential`

**Solution**:
- User previously signed in with Google/Email using the same email
- User should sign in with their original method
- Or implement account linking (advanced)

---

## Environment Variables Checklist

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gameplan-787a2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gameplan-787a2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gameplan-787a2.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

---

## Debugging Tools

### Browser Console Logs
Look for logs with these prefixes:
- `[AppleSignIn]` - From AppleSignInButton component
- `[SimpleAuth:Apple]` - From SimpleAuth component

### Diagnostic API Endpoint
```bash
GET /api/check-apple-auth
```

Returns:
- Current Firebase configuration
- Common error solutions
- Direct links to Firebase and Apple consoles

### Firebase Auth Debug
```javascript
// In browser console
console.log('Auth:', auth.app.options)
console.log('Current user:', auth.currentUser)
```

---

## Quick Reference Links

- **Firebase Console**: https://console.firebase.google.com/project/gameplan-787a2/authentication/providers
- **Apple Developer Console**: https://developer.apple.com/account/resources/identifiers/list
- **Apple Service IDs**: https://developer.apple.com/account/resources/identifiers/list/serviceId
- **Apple Team ID**: https://developer.apple.com/account/#/membership
- **Firebase Auth Docs**: https://firebase.google.com/docs/auth/web/apple

---

## Security Best Practices

1. **Never commit private keys** to version control
2. **Use environment variables** for sensitive configuration
3. **Limit authorized domains** to only necessary domains
4. **Regularly rotate keys** (every 6-12 months)
5. **Monitor failed sign-in attempts** in Firebase Console
6. **Enable Firebase Security Rules** for Firestore/Storage

---

## Support

If you continue to experience issues after following this guide:

1. Check browser console for detailed error logs
2. Visit `/api/check-apple-auth` for diagnostic information
3. Verify all domains are authorized in both Firebase and Apple consoles
4. Contact Firebase Support or Apple Developer Support for platform-specific issues

Last updated: 2025-01-12
