/**
 * Script to create a baked profile for Jasmine Aikey
 * 
 * Usage: node scripts/create-jasmine-baked-profile.js
 * 
 * This creates a pre-made profile that will transfer ownership
 * to Jasmine when she signs in.
 */

const admin = require('firebase-admin')
const path = require('path')

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json')

if (!require('fs').existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found. Please add it to the project root.')
  process.exit(1)
}

const serviceAccount = require(serviceAccountPath)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

async function createJasmineBakedProfile() {
  try {
    console.log('🍰 Creating baked profile for Jasmine Aikey...\n')
    
    // Jasmine's profile data
    const bakedProfile = {
      bakedProfileId: `baked-jasmine-${Date.now()}`,
      targetEmail: 'jasmine.aikey@stanford.edu', // Update with her actual email
      targetUid: null, // Will be set when she signs in
      
      // Profile data
      displayName: 'Jasmine Aikey',
      firstName: 'Jasmine',
      lastName: 'Aikey',
      email: 'jasmine.aikey@stanford.edu',
      sport: 'Soccer',
      tagline: 'Elite soccer player at Stanford University.',
      credentials: 'PAC-12 Champion and Midfielder of the Year',
      bio: 'Stanford University soccer player with expertise in midfield play, technical development, and mental preparation. I specialize in helping athletes develop their tactical awareness, ball control, and competitive mindset through proven training methodologies and personal experience at the highest collegiate level.',
      philosophy: 'I believe in developing the complete player - technically, tactically, physically, and mentally. Soccer is not just about individual skill, but about understanding the game, reading situations, and making smart decisions under pressure. My approach focuses on building confidence through mastery of fundamentals while encouraging creative expression on the field.',
      specialties: [
        'Midfield Play & Positioning',
        'Ball Control & First Touch',
        'Tactical Awareness',
        'Mental Preparation',
        'Competitive Mindset Development',
        'Technical Skill Development',
        'Game Reading & Decision Making'
      ],
      achievements: [
        'PAC-12 Champion (Stanford University)',
        'PAC-12 Midfielder of the Year',
        'Stanford University Varsity Soccer Team',
        'NCAA Division I Competitor',
        'All-PAC-12 Conference Selection'
      ],
      experience: '4+ years collegiate soccer',
      
      // Images
      heroImageUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865685/2025_05_2_graduation_vqvz1b.jpg',
      headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865683/2023_11_1_i2bx0r.jpg',
      actionPhotos: [
        'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_1_ysqlha.jpg',
        'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865678/2022_08_2_zhtbzx.jpg',
        'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865680/2025_08_3_the_Rainbow_sbl5rl.jpg',
        'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865677/2021_09_byctwr.jpg'
      ],
      highlightVideo: 'https://res.cloudinary.com/dr0jtjwlh/video/upload/v1758865568/Jasmine_Journey_Reel_odyfoj.mp4',
      
      // Social links
      socialLinks: {
        facebook: 'https://facebook.com/jasmineaikey',
        twitter: 'https://twitter.com/jasmineaikey',
        instagram: 'https://instagram.com/jasmineaikey',
        linkedin: 'https://linkedin.com/in/jasmineaikey'
      },
      
      // Metadata
      createdBy: 'admin', // Update with admin UID
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      profileCompleteness: 100,
      isVerified: true,
      isPlatformCoach: true
    }
    
    // Save to baked_profiles collection
    await db.collection('baked_profiles').doc(bakedProfile.bakedProfileId).set(bakedProfile)
    
    console.log('✅ Baked profile created successfully!')
    console.log(`   Profile ID: ${bakedProfile.bakedProfileId}`)
    console.log(`   Target Email: ${bakedProfile.targetEmail}`)
    console.log(`   Status: ${bakedProfile.status}`)
    console.log('\n📝 When Jasmine signs in with this email, the profile will automatically transfer to her account.')
    
  } catch (error) {
    console.error('❌ Error creating baked profile:', error)
    process.exit(1)
  }
}

// Run the script
createJasmineBakedProfile()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

