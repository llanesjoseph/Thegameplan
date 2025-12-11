#!/usr/bin/env node

/**
 * Force create Firestore indexes using Firebase Admin SDK
 * This bypasses the CLI's broken deployment logic
 */

const { execSync } = require('child_process');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getAccessToken() {
  try {
    const result = execSync('firebase login:ci --no-localhost', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // Try to extract token from various possible formats
    const match = result.match(/[0-9]\/\/[A-Za-z0-9_-]+/);
    if (match) {
      return match[0];
    }

    // Alternative: get from gcloud
    try {
      const token = execSync('gcloud auth print-access-token', {
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      return token;
    } catch (e) {
      // Ignore gcloud error
    }

    throw new Error('Could not get access token');
  } catch (error) {
    log('Error getting access token. Using manual URL creation instead.', 'yellow');
    return null;
  }
}

async function main() {
  log('\n=== Force Create Firestore Indexes ===\n', 'cyan');

  const projectId = 'gameplan-787a2';

  // Read indexes
  const indexConfig = JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));

  log(`📦 Project: ${projectId}`, 'blue');
  log(`📖 Found ${indexConfig.indexes.length} indexes to create\n`, 'blue');

  log('🔧 SOLUTION: Manual Index Creation', 'yellow');
  log('The Firebase CLI has a bug where it says "Deploy complete" but doesn\'t create indexes.', 'yellow');
  log('We need to create them manually using the Firebase Console.\n', 'yellow');

  log('📋 Click each URL below to create the indexes:\n', 'cyan');

  // Generate URLs for each index
  indexConfig.indexes.forEach((index, i) => {
    const fields = index.fields.map(f => {
      if (f.order) {
        return `${f.fieldPath}:${f.order.toLowerCase()}`;
      } else if (f.arrayConfig) {
        return `${f.fieldPath}:array`;
      }
      return f.fieldPath;
    }).join(',');

    const queryScope = index.queryScope === 'COLLECTION_GROUP' ? 'COLLECTION_GROUP' : 'COLLECTION';
    const url = `https://console.firebase.google.com/v1/r/project/${projectId}/firestore/indexes?create_composite=${index.collectionGroup}:${fields}:${queryScope}`;

    const fieldsDisplay = index.fields
      .map(f => `${f.fieldPath} (${f.order || f.arrayConfig || 'ASC'})`)
      .join(', ');

    log(`${i + 1}. ${index.collectionGroup}: [${fieldsDisplay}]`, 'yellow');
    log(`   ${url}\n`, 'blue');
  });

  log('=== Priority Order ===\n', 'cyan');
  log('Create these indexes FIRST (most critical):\n', 'yellow');

  // Critical indexes
  const critical = [
    { num: 6, desc: 'content: [createdAt (DESCENDING)] - Fixes public lessons loading' },
    { num: 2, desc: 'users: [role (ASCENDING), createdAt (DESCENDING)] - User management' },
    { num: 3, desc: 'content: [status (ASCENDING), creatorUid (ASCENDING), createdAt (DESCENDING)] - Filtered content' }
  ];

  critical.forEach(item => {
    log(`   • Index #${item.num}: ${item.desc}`, 'green');
  });

  log('\n💡 How to create each index:', 'cyan');
  log('   1. Click the URL', 'blue');
  log('   2. Sign in to Firebase Console if needed', 'blue');
  log('   3. The form will be pre-filled with the index details', 'blue');
  log('   4. Click the "Create" button', 'blue');
  log('   5. Wait for "Building" → "Enabled" status', 'blue');

  log('\n⏱️  Expected time:', 'cyan');
  log('   • Each index takes 1-5 minutes to build', 'blue');
  log('   • You can create multiple at once', 'blue');
  log('   • Check status at: https://console.firebase.google.com/project/' + projectId + '/firestore/indexes', 'blue');

  log('\n📝 Alternative: Use .firebaserc to force re-deployment', 'cyan');
  log('   1. Delete .firebaserc file', 'blue');
  log('   2. Run: firebase use --add', 'blue');
  log('   3. Select gameplan-787a2', 'blue');
  log('   4. Run: firebase deploy --only firestore:indexes', 'blue');
  log('   5. This might force the CLI to actually deploy the indexes\n', 'blue');

  log('');
}

main().catch(error => {
  log('\n❌ Script error:', 'red');
  console.error(error);
  process.exit(1);
});
