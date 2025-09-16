const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Next.js App to Firebase Hosting...\n');

// Step 1: Build the Next.js application
console.log('🔨 Step 1: Building Next.js application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Export the Next.js app for static hosting
console.log('\n📦 Step 2: Exporting Next.js app...');
try {
  execSync('npx next export', { stdio: 'inherit' });
  console.log('✅ Export successful!');
} catch (error) {
  console.error('❌ Export failed:', error.message);
  process.exit(1);
}

// Step 3: Deploy to Firebase Hosting
console.log('\n🚀 Step 3: Deploying to Firebase Hosting...');
try {
  execSync('firebase deploy --only hosting --project gameplan-787a2', { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Deployment completed successfully!');
console.log('🌐 Your app is live at: https://cruciblegameplan.web.app');
