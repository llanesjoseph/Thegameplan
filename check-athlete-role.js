// Quick script to check if athlete role is set properly
// Run this to verify the user's role in Firestore

const admin = require('firebase-admin');

// You would need to run this with your service account
// firebase use <your-project>
// node check-athlete-role.js <user-email>

console.log("To check athlete role:");
console.log("1. Go to Firebase Console > Firestore Database");
console.log("2. Open the 'users' collection");
console.log("3. Find your test athlete user");
console.log("4. Verify the 'role' field is set to 'athlete'");
console.log("");
console.log("If role is missing or wrong, update it to: athlete");
