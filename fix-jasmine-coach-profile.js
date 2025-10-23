/**
 * Fix Jasmine Aikey Coach Profile
 * Ensures Jasmine Aikey is properly set up in creators_index and has slug mapping
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

// Initialize Firebase Admin
const serviceAccount = require('./firebase-admin-key.json')
initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

async function fixJasmineProfile() {
  try {
    console.log('🔧 Fixing Jasmine Aikey coach profile...')

    // 1. Find Jasmine Aikey's user ID
    const usersSnapshot = await db.collection('users').get()
    let jasmineUser = null
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data()
      if (userData.email && (
        userData.email.toLowerCase().includes('jasmine') ||
        userData.email.toLowerCase().includes('aikey') ||
        userData.displayName?.toLowerCase().includes('jasmine')
      )) {
        jasmineUser = { id: doc.id, ...userData }
        break
      }
    }

    if (!jasmineUser) {
      console.log('❌ Jasmine Aikey user not found')
      return
    }

    console.log(`✅ Found Jasmine Aikey: ${jasmineUser.displayName} (${jasmineUser.email})`)

    // 2. Create/update creators_index entry
    const creatorsIndexData = {
      uid: jasmineUser.id,
      displayName: 'Jasmine Aikey',
      email: jasmineUser.email,
      sport: 'Soccer',
      bio: 'Stanford University soccer player with expertise in midfield play, technical development, and mental preparation. I specialize in helping athletes develop their tactical awareness, ball control, and competitive mindset through proven training methodologies and personal experience at the highest collegiate level.',
      tagline: 'Elite soccer player at Stanford University.',
      credentials: 'PAC-12 Champion and Midfielder of the Year',
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
      headshotUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865683/2023_11_1_i2bx0r.jpg',
      heroImageUrl: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865685/2025_05_2_graduation_vqvz1b.jpg',
      verified: true,
      featured: true,
      isActive: true,
      profileComplete: true,
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('creators_index').doc(jasmineUser.id).set(creatorsIndexData)
    console.log('✅ Updated creators_index for Jasmine Aikey')

    // 3. Create slug mapping
    const slug = 'jasmine-aikey--coach'
    const slugMappingData = {
      originalId: jasmineUser.id,
      slug: slug,
      entityType: 'coach',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('slug_mappings').doc(slug).set(slugMappingData)
    console.log(`✅ Created slug mapping: ${slug} -> ${jasmineUser.id}`)

    // 4. Update user role to coach if needed
    if (jasmineUser.role !== 'coach') {
      await db.collection('users').doc(jasmineUser.id).update({
        role: 'coach',
        updatedAt: new Date()
      })
      console.log('✅ Updated user role to coach')
    }

    console.log('🎉 Jasmine Aikey coach profile fixed successfully!')
    console.log(`   Profile URL: /coach-profile/${slug}`)

  } catch (error) {
    console.error('❌ Error fixing Jasmine profile:', error)
  }
}

fixJasmineProfile()
