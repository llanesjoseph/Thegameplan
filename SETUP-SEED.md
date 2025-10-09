# Firebase CLI Seed Setup

## Step 1: Download Service Account Key

1. Go to: https://console.firebase.google.com/project/gameplan-787a2/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Save the file as `serviceAccountKey.json` in this project root
4. Run the seed script

## Step 2: Run Seed Script

```powershell
node scripts/seed-cli.js
```

That's it!
