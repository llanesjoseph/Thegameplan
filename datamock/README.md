# Game Plan — Firestore Mock Data Seeder

This repo seeds a **complete mock database** for your Game Plan platform so you can **stress test** queries, security, and UI flows.

## What you get
- 12 sports × 3 creators each (36 creators total)
- 8 lessons per sport (96+ content docs)
- Coaching requests: **3 of each type** per sport (video_review, technique_help, training_plan, general)
- Sample events, sessions, availability, gear
- Users: 3 superadmins (joseph, lona, merline) + 5 regular users
- AI sessions/logs, notifications subcollection, progress + items subcollection
- Admin settings, disclaimers

## Quick start
1. Create or reuse a Firebase project and enable Firestore
2. Create a service account with **Editor** on Firestore and download JSON
3. Clone this repo or unzip it locally
4. Copy env and set credentials
   ```bash
   cp .env.example .env
   export GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/service-account.json
   ```
5. Install and run the seeder
   ```bash
   npm install
   npx ts-node src/seed.ts
   ```

The seeder:
- Converts ISO strings to Firestore **Timestamps**
- Writes documents with stable IDs (uid, slug, id) where applicable
- Creates subcollections for:
  - `notifications/{userId}/messages`
  - `progress/{userId}/items`

## Notes
- Data lives in `data/*.json` if you want to tweak or expand
- Adjust `SPORTS` in `src/sports.ts` to add/remove sports
- Safe example `firestore.rules` included (not deployed automatically)

Happy testing! 🏗️
