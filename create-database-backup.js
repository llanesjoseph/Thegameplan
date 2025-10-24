const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('./firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'gameplan-787a2'
  });
}

const db = admin.firestore();

console.log('💾 CREATING DATABASE BACKUP');
console.log('=' .repeat(40));

async function createDatabaseBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = `backups/backup-${timestamp}`;
    
    // Create backup directory
    if (!fs.existsSync('backups')) {
      fs.mkdirSync('backups');
    }
    fs.mkdirSync(backupDir);
    
    console.log(`📁 Created backup directory: ${backupDir}`);
    
    // Collections to backup
    const collections = [
      'users',
      'messages', 
      'submissions',
      'reviews',
      'invitations',
      'athlete_feed',
      'content',
      'notifications',
      'message_replies'
    ];
    
    let totalDocuments = 0;
    
    for (const collectionName of collections) {
      console.log(`\n📊 Backing up collection: ${collectionName}`);
      
      try {
        const snapshot = await db.collection(collectionName).get();
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Convert Firestore timestamps to ISO strings for JSON serialization
        const serializedDocuments = documents.map(doc => {
          const serialized = { ...doc };
          
          // Convert Firestore timestamps
          Object.keys(serialized).forEach(key => {
            if (serialized[key] && typeof serialized[key] === 'object') {
              if (serialized[key]._seconds !== undefined) {
                // Firestore timestamp
                serialized[key] = new Date(serialized[key]._seconds * 1000).toISOString();
              }
            }
          });
          
          return serialized;
        });
        
        // Save to file
        const filePath = path.join(backupDir, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(serializedDocuments, null, 2));
        
        console.log(`   ✅ Backed up ${documents.length} documents`);
        totalDocuments += documents.length;
        
      } catch (error) {
        console.log(`   ❌ Error backing up ${collectionName}: ${error.message}`);
      }
    }
    
    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      totalDocuments: totalDocuments,
      collections: collections,
      version: '1.0.0',
      description: 'Pre-fix database backup'
    };
    
    const metadataPath = path.join(backupDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('\n📊 BACKUP SUMMARY:');
    console.log(`   📁 Backup directory: ${backupDir}`);
    console.log(`   📄 Total documents: ${totalDocuments}`);
    console.log(`   📋 Collections backed up: ${collections.length}`);
    console.log(`   ⏰ Backup completed: ${new Date().toISOString()}`);
    
    // Create symlink to latest backup
    const latestBackupPath = 'backups/latest';
    if (fs.existsSync(latestBackupPath)) {
      fs.unlinkSync(latestBackupPath);
    }
    fs.symlinkSync(path.basename(backupDir), latestBackupPath);
    
    console.log(`   🔗 Latest backup symlink: ${latestBackupPath}`);
    
    console.log('\n✅ DATABASE BACKUP COMPLETE!');
    console.log('   Backup is ready for use if rollback is needed');
    
  } catch (error) {
    console.error('❌ Error creating database backup:', error);
  }
}

// Run the backup
createDatabaseBackup().then(() => {
  console.log('\n🎯 BACKUP PROCESS COMPLETE!');
  process.exit(0);
}).catch(error => {
  console.error('💥 FATAL ERROR:', error);
  process.exit(1);
});
