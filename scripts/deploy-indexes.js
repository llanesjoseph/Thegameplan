#!/usr/bin/env node

/**
 * Automated Firestore Index Deployment Script
 * This script helps automate the creation of Firestore indexes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting automated Firestore index deployment...\n');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.error('❌ Firebase CLI not found. Please install it first:');
  console.error('npm install -g firebase-tools');
  process.exit(1);
}

// Check if indexes file exists
const indexesPath = path.join(__dirname, '..', 'firestore.indexes.json');
if (!fs.existsSync(indexesPath)) {
  console.error('❌ firestore.indexes.json not found');
  process.exit(1);
}

console.log('📋 Found firestore.indexes.json');

// Read and display indexes to be created
const indexes = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
console.log(`📊 Found ${indexes.indexes.length} index configurations:`);

indexes.indexes.forEach((index, i) => {
  console.log(`   ${i + 1}. Collection: ${index.collectionGroup}`);
  console.log(`      Fields: ${index.fields.map(f => `${f.fieldPath} (${f.order})`).join(', ')}`);
});

console.log('\n🔨 Deploying indexes to Firebase...');

try {
  // Deploy only Firestore indexes
  execSync('firebase deploy --only firestore:indexes', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Index deployment completed successfully!');
  console.log('⏰ Indexes may take a few minutes to build in Firebase Console');
  console.log('🔗 Monitor progress at: https://console.firebase.google.com/project/your-project/firestore/indexes');
  
} catch (error) {
  console.error('\n❌ Index deployment failed:', error.message);
  console.error('\n🔧 Troubleshooting:');
  console.error('1. Make sure you\'re authenticated: firebase login');
  console.error('2. Check your Firebase project ID in .firebaserc');
  console.error('3. Verify you have Firestore permissions');
  process.exit(1);
}

console.log('\n🎉 Firestore indexes are being deployed!');