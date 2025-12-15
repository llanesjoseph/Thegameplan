/**
 * Script to check Jasmine Aikey's photos in the database
 * Run with: node scripts/check-jasmine-photos.js
 */

const { initializeApp } = require('firebase/app')
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore')

const config = {
  apiKey: "AIzaSyDKgnOZaAZIBSR8e1OilhW-cp5TxY3ewxE",
  authDomain: "gameplan-787a2.firebaseapp.com",
  projectId: "gameplan-787a2",
}

const app = initializeApp(config)
const db = getFirestore(app)

async function checkJasminePhotos() {
  console.log('🔍 Checking Jasmine Aikey photos in database...\n')
  
  // Try to find Jasmine's UID by email
  const emails = [
    'jasmine.aikey@stanford.edu',
    'jasmine.aikey@gameplan.ai',
    'jasmine@gameplan.ai',
    'jaikey@stanford.edu',
    'jasmine.aikey@gmail.com'
  ]
  
  let jasmineUid = null
  
  // Search users collection
  for (const email of emails) {
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', email))
      const usersSnap = await getDocs(usersQuery)
      if (!usersSnap.empty) {
        jasmineUid = usersSnap.docs[0].id
        console.log(`✅ Found Jasmine with email: ${email}`)
        console.log(`   UID: ${jasmineUid}\n`)
        break
      }
    } catch (err) {
      console.warn(`Could not search for ${email}:`, err.message)
    }
  }
  
  if (!jasmineUid) {
    console.log('❌ Could not find Jasmine in users collection')
    console.log('   Trying to find in creator_profiles...\n')
    
    // Try creator_profiles
    try {
      const creatorQuery = query(collection(db, 'creator_profiles'), where('email', '==', emails[0]))
      const creatorSnap = await getDocs(creatorQuery)
      if (!creatorSnap.empty) {
        jasmineUid = creatorSnap.docs[0].data().uid || creatorSnap.docs[0].id
        console.log(`✅ Found Jasmine in creator_profiles`)
        console.log(`   UID: ${jasmineUid}\n`)
      }
    } catch (err) {
      console.warn('Could not search creator_profiles:', err.message)
    }
  }
  
  if (!jasmineUid) {
    console.log('❌ Could not find Jasmine. Please provide her UID manually.')
    process.exit(1)
  }
  
  // Check all collections
  const collections = ['users', 'creator_profiles', 'coach_profiles', 'creators_index']
  
  for (const collName of collections) {
    console.log(`\n📁 Checking ${collName}...`)
    try {
      let docData = null
      
      if (collName === 'creator_profiles') {
        const q = query(collection(db, collName), where('uid', '==', jasmineUid))
        const snap = await getDocs(q)
        if (!snap.empty) {
          docData = snap.docs[0].data()
        }
      } else {
        const docRef = doc(db, collName, jasmineUid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          docData = docSnap.data()
        }
      }
      
      if (docData) {
        console.log(`   ✅ Document exists`)
        
        // Check for photos
        const galleryPhotos = docData.galleryPhotos || []
        const actionPhotos = docData.actionPhotos || []
        const showcasePhoto1 = docData.showcasePhoto1 || ''
        const showcasePhoto2 = docData.showcasePhoto2 || ''
        const heroImageUrl = docData.heroImageUrl || ''
        const headshotUrl = docData.headshotUrl || ''
        
        console.log(`   📸 galleryPhotos: ${Array.isArray(galleryPhotos) ? galleryPhotos.length : 0} photos`)
        if (galleryPhotos.length > 0) {
          galleryPhotos.forEach((url, idx) => {
            console.log(`      ${idx + 1}. ${url}`)
          })
        }
        
        console.log(`   📸 actionPhotos: ${Array.isArray(actionPhotos) ? actionPhotos.length : 0} photos`)
        if (actionPhotos.length > 0) {
          actionPhotos.forEach((url, idx) => {
            console.log(`      ${idx + 1}. ${url}`)
          })
        }
        
        console.log(`   📸 showcasePhoto1: ${showcasePhoto1 ? 'SET' : 'MISSING'}`)
        if (showcasePhoto1) console.log(`      ${showcasePhoto1}`)
        
        console.log(`   📸 showcasePhoto2: ${showcasePhoto2 ? 'SET' : 'MISSING'}`)
        if (showcasePhoto2) console.log(`      ${showcasePhoto2}`)
        
        console.log(`   📸 heroImageUrl: ${heroImageUrl ? 'SET' : 'MISSING'}`)
        if (heroImageUrl) console.log(`      ${heroImageUrl}`)
        
        console.log(`   📸 headshotUrl: ${headshotUrl ? 'SET' : 'MISSING'}`)
        if (headshotUrl) console.log(`      ${headshotUrl}`)
      } else {
        console.log(`   ❌ Document not found`)
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`)
    }
  }
  
  console.log('\n✅ Check complete!')
  process.exit(0)
}

checkJasminePhotos().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})

