import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Skill } from '../types/video-critique';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const app = initializeApp({
  projectId: 'gameplan-787a2',
});

const db = getFirestore(app);

const basketballSkills: Omit<Skill, 'id'>[] = [
  {
    name: 'Jump Shot',
    sport: 'Basketball',
    category: 'Shooting',
    description: 'Basic jump shot technique and form',
    tags: ['shooting', 'fundamentals', 'scoring'],
    createdAt: Timestamp.now(),
  },
  {
    name: 'Layup',
    sport: 'Basketball',
    category: 'Shooting',
    description: 'Layup technique with both hands',
    tags: ['shooting', 'fundamentals', 'finishing'],
    createdAt: Timestamp.now(),
  },
  {
    name: 'Free Throw',
    sport: 'Basketball',
    category: 'Shooting',
    description: 'Free throw shooting form and routine',
    tags: ['shooting', 'fundamentals', 'free-throws'],
    createdAt: Timestamp.now(),
  },
  {
    name: 'Dribbling',
    sport: 'Basketball',
    category: 'Ball Handling',
    description: 'Basic dribbling and ball control',
    tags: ['ball-handling', 'fundamentals', 'control'],
    createdAt: Timestamp.now(),
  },
  {
    name: 'Crossover',
    sport: 'Basketball',
    category: 'Ball Handling',
    description: 'Crossover dribble move',
    tags: ['ball-handling', 'moves', 'advanced'],
    createdAt: Timestamp.now(),
  },
  {
    name: 'Defensive Stance',
    sport: 'Basketball',
    category: 'Defense',
    description: 'Proper defensive stance and footwork',
    tags: ['defense', 'fundamentals', 'footwork'],
    createdAt: Timestamp.now(),
  },
  {
    name: 'Boxing Out',
    sport: 'Basketball',
    category: 'Rebounding',
    description: 'Boxing out technique for rebounds',
    tags: ['rebounding', 'fundamentals', 'positioning'],
    createdAt: Timestamp.now(),
  },
  {
    name: 'Pick and Roll',
    sport: 'Basketball',
    category: 'Offense',
    description: 'Executing the pick and roll play',
    tags: ['offense', 'teamwork', 'screening'],
    createdAt: Timestamp.now(),
  },
];

async function seedSkills() {
  console.log('🏀 Seeding basketball skills...');

  const batch = db.batch();

  for (const skill of basketballSkills) {
    const docRef = db.collection('skills').doc();
    batch.set(docRef, skill);
    console.log(`  ✅ Added skill: ${skill.name}`);
  }

  await batch.commit();
  console.log('\n✨ Skills seeded successfully!');
}

async function main() {
  try {
    await seedSkills();
    console.log('\n🎉 Video critique seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

main();