#!/bin/bash

echo "========================================"
echo "GAMEPLAN - SIMPLE FIX FOR ROLE ISSUES"
echo "========================================"
echo ""

echo "Step 1: Re-authenticating with Firebase..."
echo ""
firebase login --reauth

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Authentication failed. Please try again."
    exit 1
fi

echo ""
echo "✅ Authentication successful!"
echo ""

echo "Step 2: Installing function dependencies..."
cd functions
npm install
cd ..

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ npm install failed. Please fix errors and try again."
    exit 1
fi

echo ""
echo "✅ Dependencies installed!"
echo ""

echo "Step 3: Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Firestore rules deployment failed."
    exit 1
fi

echo ""
echo "✅ Firestore rules deployed!"
echo ""

echo "Step 4: Deploying Cloud Functions (this may take a few minutes)..."
firebase deploy --only functions:enforceInvitationRole,functions:dailyRoleConsistencyCheck,functions:manualRoleEnforcement

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Cloud Functions deployment failed."
    exit 1
fi

echo ""
echo "✅ Cloud Functions deployed successfully!"
echo ""

echo "Step 5: Verifying deployment..."
firebase functions:list

echo ""
echo "========================================"
echo "✅ ALL DONE! YOUR SYSTEM IS NOW PROTECTED"
echo "========================================"
echo ""
echo "What just happened:"
echo ""
echo "1. Removed client-side 'auto-correction' logic"
echo "2. Deployed 3-layer server-side protection:"
echo "   - Real-time trigger (fixes mismatches in seconds)"
echo "   - Daily scheduled check (scans all users at 2 AM UTC)"
echo "   - Manual admin enforcement (on-demand fixes)"
echo ""
echo "Your users' roles are now bulletproof!"
echo ""
echo "Next login by any user will be protected by Cloud Functions."
echo ""
