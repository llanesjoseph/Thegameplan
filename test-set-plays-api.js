/**
 * Manual Test Script for Set Plays API
 *
 * This script tests the teams API endpoints
 *
 * Usage:
 * 1. Start dev server: npm run dev
 * 2. Get your Firebase auth token from browser DevTools:
 *    - Login to the app
 *    - Open DevTools > Application > IndexedDB > firebaseLocalStorage
 *    - Copy the 'stsTokenManager.accessToken' value
 * 3. Run: node test-set-plays-api.js YOUR_TOKEN_HERE
 */

const BASE_URL = 'http://localhost:3000'

async function testSetPlaysAPI(token) {
  console.log('🧪 Testing Set Plays API\n')

  if (!token) {
    console.error('❌ ERROR: Please provide your Firebase auth token as argument')
    console.log('\nUsage: node test-set-plays-api.js YOUR_TOKEN_HERE\n')
    process.exit(1)
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  try {
    // Test 1: Create a new team
    console.log('📝 Test 1: Creating a new team...')
    const createResponse = await fetch(`${BASE_URL}/api/set-plays/teams`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Team Alpha',
        sport: 'Soccer',
        description: 'A test team for API validation',
        athleteIds: [],
        assistantIds: []
      })
    })

    const createData = await createResponse.json()

    if (createData.success) {
      console.log('✅ Team created successfully!')
      console.log('   Team ID:', createData.data.id)
      console.log('   Team Name:', createData.data.name)
      console.log('   Sport:', createData.data.sport)

      const teamId = createData.data.id

      // Test 2: Get the team by ID
      console.log('\n📖 Test 2: Fetching team by ID...')
      const getResponse = await fetch(`${BASE_URL}/api/set-plays/teams/${teamId}`, {
        method: 'GET',
        headers
      })

      const getData = await getResponse.json()

      if (getData.success) {
        console.log('✅ Team fetched successfully!')
        console.log('   Team:', getData.data.name)
      } else {
        console.log('❌ Failed to fetch team:', getData.error)
      }

      // Test 3: Update the team
      console.log('\n✏️  Test 3: Updating team...')
      const updateResponse = await fetch(`${BASE_URL}/api/set-plays/teams/${teamId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: 'Test Team Alpha (Updated)',
          description: 'Updated description'
        })
      })

      const updateData = await updateResponse.json()

      if (updateData.success) {
        console.log('✅ Team updated successfully!')
        console.log('   New Name:', updateData.data.name)
      } else {
        console.log('❌ Failed to update team:', updateData.error)
      }

      // Test 4: List all teams
      console.log('\n📋 Test 4: Listing all teams...')
      const listResponse = await fetch(`${BASE_URL}/api/set-plays/teams`, {
        method: 'GET',
        headers
      })

      const listData = await listResponse.json()

      if (listData.success) {
        console.log(`✅ Found ${listData.data.count} team(s)`)
        listData.data.teams.forEach(team => {
          console.log(`   - ${team.name} (${team.sport})`)
        })
      } else {
        console.log('❌ Failed to list teams:', listData.error)
      }

      // Test 5: Delete (archive) the team
      console.log('\n🗑️  Test 5: Archiving team...')
      const deleteResponse = await fetch(`${BASE_URL}/api/set-plays/teams/${teamId}`, {
        method: 'DELETE',
        headers
      })

      const deleteData = await deleteResponse.json()

      if (deleteData.success) {
        console.log('✅ Team archived successfully!')
      } else {
        console.log('❌ Failed to archive team:', deleteData.error)
      }

      // Test 6: Verify team is archived
      console.log('\n🔍 Test 6: Verifying team is archived...')
      const verifyResponse = await fetch(`${BASE_URL}/api/set-plays/teams`, {
        method: 'GET',
        headers
      })

      const verifyData = await verifyResponse.json()

      if (verifyData.success) {
        const archivedTeam = verifyData.data.teams.find(t => t.id === teamId)
        if (!archivedTeam) {
          console.log('✅ Team successfully excluded from active teams list')
        } else {
          console.log('⚠️  Team still appears in list (should be archived)')
        }
      }

      console.log('\n✨ All tests completed!\n')

    } else {
      console.log('❌ Failed to create team:', createData.error)
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Get token from command line argument
const token = process.argv[2]
testSetPlaysAPI(token)
