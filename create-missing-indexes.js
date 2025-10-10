#!/usr/bin/env node

/**
 * Script to programmatically create missing Firestore indexes
 * This script reads firestore.indexes.json and creates any missing indexes
 * using the Firebase CLI commands
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
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

function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.stderr || '';
  }
}

function getProjectId() {
  try {
    const output = execCommand('firebase use');
    const match = output.match(/Active project:\s+([^\s]+)/);
    if (match) {
      return match[1];
    }

    // Alternative: try to get from .firebaserc
    const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
    return firebaserc.projects?.default;
  } catch (error) {
    log('Error getting project ID', 'red');
    throw error;
  }
}

function readIndexesFromFile() {
  const indexPath = path.join(__dirname, 'firestore.indexes.json');
  if (!fs.existsSync(indexPath)) {
    log('firestore.indexes.json not found!', 'red');
    process.exit(1);
  }

  const content = fs.readFileSync(indexPath, 'utf8');
  return JSON.parse(content);
}

function getDeployedIndexes() {
  try {
    const output = execCommand('firebase firestore:indexes');
    return JSON.parse(output);
  } catch (error) {
    log('Error getting deployed indexes', 'red');
    return { indexes: [] };
  }
}

function formatIndexInfo(index) {
  const fields = index.fields
    .map(f => `${f.fieldPath} (${f.order || f.arrayConfig || 'ASCENDING'})`)
    .join(', ');
  return `${index.collectionGroup}: [${fields}]`;
}

function indexesMatch(index1, index2) {
  if (index1.collectionGroup !== index2.collectionGroup) return false;
  if (index1.queryScope !== index2.queryScope) return false;
  if (index1.fields.length !== index2.fields.length) return false;

  for (let i = 0; i < index1.fields.length; i++) {
    const f1 = index1.fields[i];
    const f2 = index2.fields[i];
    if (f1.fieldPath !== f2.fieldPath) return false;
    if (f1.order !== f2.order) return false;
    if (f1.arrayConfig !== f2.arrayConfig) return false;
  }

  return true;
}

function buildIndexCreationUrl(projectId, index) {
  const baseUrl = `https://console.firebase.google.com/v1/r/project/${projectId}/firestore/indexes`;

  const fields = index.fields.map(f => {
    if (f.order) {
      return `${f.fieldPath}:${f.order.toLowerCase()}`;
    } else if (f.arrayConfig) {
      return `${f.fieldPath}:array`;
    }
    return f.fieldPath;
  }).join(',');

  const queryScope = index.queryScope === 'COLLECTION_GROUP' ? 'COLLECTION_GROUP' : 'COLLECTION';

  return `${baseUrl}?create_composite=${index.collectionGroup}:${fields}:${queryScope}`;
}

async function main() {
  log('\n=== Firestore Index Manager ===\n', 'cyan');

  // Step 1: Get project ID
  const projectId = getProjectId();
  log(`📦 Project: ${projectId}`, 'blue');

  // Step 2: Read indexes from firestore.indexes.json
  log('\n📖 Reading firestore.indexes.json...', 'blue');
  const localIndexes = readIndexesFromFile();
  log(`   Found ${localIndexes.indexes.length} indexes defined`, 'green');

  // Step 3: Get deployed indexes
  log('\n🔍 Checking deployed indexes...', 'blue');
  const deployedIndexes = getDeployedIndexes();
  log(`   Found ${deployedIndexes.indexes.length} indexes deployed`, 'green');

  // Step 4: Compare and find missing indexes
  log('\n📊 Analyzing differences...\n', 'blue');

  const missingIndexes = [];

  localIndexes.indexes.forEach(localIndex => {
    const found = deployedIndexes.indexes.some(deployedIndex =>
      indexesMatch(localIndex, deployedIndex)
    );

    if (!found) {
      missingIndexes.push(localIndex);
    }
  });

  if (missingIndexes.length === 0) {
    log('✅ All indexes are deployed!', 'green');
    log(`\nTotal: ${localIndexes.indexes.length} indexes`, 'cyan');
    return;
  }

  // Step 5: Report missing indexes
  log(`⚠️  Found ${missingIndexes.length} missing indexes:\n`, 'yellow');

  missingIndexes.forEach((index, i) => {
    log(`${i + 1}. ${formatIndexInfo(index)}`, 'yellow');
    log(`   Query Scope: ${index.queryScope}`, 'yellow');
  });

  // Step 6: Attempt to deploy missing indexes
  log('\n🚀 Deploying missing indexes...', 'blue');

  try {
    log('   Running: firebase deploy --only firestore:indexes', 'cyan');
    const output = execCommand('firebase deploy --only firestore:indexes');
    log(output, 'green');
    log('✅ Index deployment command completed!', 'green');
  } catch (error) {
    log('❌ Error deploying indexes', 'red');
    console.error(error);
  }

  // Step 7: Provide manual creation URLs
  log('\n📋 Manual creation links (if auto-deploy failed):\n', 'blue');

  missingIndexes.forEach((index, i) => {
    log(`${i + 1}. ${formatIndexInfo(index)}`, 'yellow');
    const url = buildIndexCreationUrl(projectId, index);
    log(`   ${url}\n`, 'cyan');
  });

  // Step 8: Final summary
  log('\n=== Summary ===', 'cyan');
  log(`Total indexes defined: ${localIndexes.indexes.length}`, 'blue');
  log(`Deployed: ${deployedIndexes.indexes.length}`, 'green');
  log(`Missing: ${missingIndexes.length}`, missingIndexes.length > 0 ? 'yellow' : 'green');

  if (missingIndexes.length > 0) {
    log('\n💡 Next steps:', 'cyan');
    log('1. Wait a few minutes for indexes to build', 'blue');
    log('2. Run this script again to verify', 'blue');
    log('3. Or click the URLs above to create manually', 'blue');
    log('4. Check status at: https://console.firebase.google.com/project/' + projectId + '/firestore/indexes', 'blue');
  }

  log(''); // Empty line at the end
}

// Run the script
main().catch(error => {
  log('\n❌ Script failed:', 'red');
  console.error(error);
  process.exit(1);
});
