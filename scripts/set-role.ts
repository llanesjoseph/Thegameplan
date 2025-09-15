/*
  Admin utility to set a user's role via Firestore (Single Source of Truth).
  Usage examples:
    tsx scripts/set-role.ts --uid <UID> --role superadmin --project <PROJECT_ID>
    tsx scripts/set-role.ts --email <EMAIL> --role admin --project <PROJECT_ID>
    tsx scripts/set-role.ts --uid <UID> --role creator --project demo-gp --emulator

  Auth: For production, authenticate with GOOGLE_APPLICATION_CREDENTIALS pointing to a service account key.
*/

/* eslint-disable no-console */
import admin from 'firebase-admin'

type AppRole = 'guest' | 'user' | 'creator' | 'admin' | 'superadmin'

interface Args {
  uid?: string
  email?: string
  role?: AppRole
  project?: string
  emulator?: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i]
    const value = argv[i + 1]
    switch (key) {
      case '--uid': args.uid = value; i++; break
      case '--email': args.email = value; i++; break
      case '--role': args.role = value as AppRole; i++; break
      case '--project': args.project = value; i++; break
      case '--emulator': args.emulator = true; break
      default: break
    }
  }
  return args
}

async function main() {
  const { uid, email, role, project, emulator } = parseArgs(process.argv)

  if (!role) throw new Error('Missing --role. One of: guest|user|creator|admin|superadmin')
  if (!uid && !email) throw new Error('Provide --uid or --email')
  if (!project) throw new Error('Missing --project <PROJECT_ID>')

  if (emulator) {
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'
    console.log('Using Firebase Emulators:', {
      firestore: process.env.FIRESTORE_EMULATOR_HOST,
      auth: process.env.FIREBASE_AUTH_EMULATOR_HOST
    })
  }

  // Initialize Admin SDK
  const already = admin.apps.length > 0
  if (!already) {
    admin.initializeApp({ projectId: project })
  }

  // Resolve UID from email if needed
  let targetUid = uid
  if (!targetUid && email) {
    const userRecord = await admin.auth().getUserByEmail(email)
    targetUid = userRecord.uid
  }
  if (!targetUid) throw new Error('Failed to resolve UID')

  // Update Firestore users/{uid}.role (SSoT)
  const db = admin.firestore()
  const ref = db.collection('users').doc(targetUid)
  const now = admin.firestore.FieldValue.serverTimestamp()
  await ref.set({ role, lastUpdatedAt: now }, { merge: true })

  console.log(`Updated users/${targetUid}.role -> ${role}`)
}

main().catch((err) => {
  console.error('Failed to set role:', err)
  process.exit(1)
})


