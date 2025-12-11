import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Drill } from '@/types/video-critique';

const COLLECTION_NAME = 'drills';

// ============================================================================
// CREATE & UPDATE
// ============================================================================

export async function createDrill(data: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const drillRef = doc(collection(db, COLLECTION_NAME));

  await setDoc(drillRef, {
    ...data,
    id: drillRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return drillRef.id;
}

export async function updateDrill(
  drillId: string,
  updates: Partial<Drill>
): Promise<void> {
  const drillRef = doc(db, COLLECTION_NAME, drillId);

  await updateDoc(drillRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// READ
// ============================================================================

export async function getDrill(drillId: string): Promise<Drill | null> {
  const drillRef = doc(db, COLLECTION_NAME, drillId);
  const drillDoc = await getDoc(drillRef);

  if (!drillDoc.exists()) {
    return null;
  }

  return drillDoc.data() as Drill;
}

export async function getDrillsByIds(drillIds: string[]): Promise<Drill[]> {
  if (drillIds.length === 0) return [];

  const drills: Drill[] = [];

  // Firestore 'in' query has a limit of 10 items
  const chunks = [];
  for (let i = 0; i < drillIds.length; i += 10) {
    chunks.push(drillIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('id', 'in', chunk)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      drills.push(doc.data() as Drill);
    });
  }

  return drills;
}

export async function searchDrills(params: {
  sport?: string;
  category?: string;
  skillFocusArea?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  searchTerm?: string;
  limitCount?: number;
  lastDoc?: QueryDocumentSnapshot;
}): Promise<{ drills: Drill[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = query(collection(db, COLLECTION_NAME));

  // Apply filters
  if (params.sport) {
    q = query(q, where('sport', '==', params.sport));
  }

  if (params.category) {
    q = query(q, where('category', '==', params.category));
  }

  if (params.skillFocusArea) {
    q = query(q, where('skillFocusAreas', 'array-contains', params.skillFocusArea));
  }

  if (params.difficultyLevel) {
    q = query(q, where('difficultyLevel', '==', params.difficultyLevel));
  }

  // Order and pagination
  q = query(q, orderBy('name', 'asc'), limit(params.limitCount || 20));

  if (params.lastDoc) {
    q = query(q, startAfter(params.lastDoc));
  }

  const snapshot = await getDocs(q);
  let drills = snapshot.docs.map(doc => doc.data() as Drill);

  // Client-side text search if searchTerm provided
  if (params.searchTerm) {
    const searchLower = params.searchTerm.toLowerCase();
    drills = drills.filter(drill =>
      drill.name.toLowerCase().includes(searchLower) ||
      drill.description.toLowerCase().includes(searchLower)
    );
  }

  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  return { drills, lastDoc: newLastDoc };
}

export async function getDrillsBySport(sport: string): Promise<Drill[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('sport', '==', sport),
    orderBy('category', 'asc'),
    orderBy('name', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Drill);
}

export async function getDrillsByCategory(
  sport: string,
  category: string
): Promise<Drill[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('sport', '==', sport),
    where('category', '==', category),
    orderBy('difficultyLevel', 'asc'),
    orderBy('name', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Drill);
}

// ============================================================================
// FAVORITES (stored in user preferences)
// ============================================================================

export async function addDrillToFavorites(
  userId: string,
  drillId: string
): Promise<void> {
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    favoriteDrills: arrayUnion(drillId),
    updatedAt: serverTimestamp(),
  });
}

export async function removeDrillFromFavorites(
  userId: string,
  drillId: string
): Promise<void> {
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    favoriteDrills: arrayRemove(drillId),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserFavoriteDrills(userId: string): Promise<Drill[]> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return [];
  }

  const userData = userDoc.data();
  const favoriteDrillIds = userData.favoriteDrills || [];

  if (favoriteDrillIds.length === 0) {
    return [];
  }

  return getDrillsByIds(favoriteDrillIds);
}

// ============================================================================
// CATEGORIES & SPORTS
// ============================================================================

export async function getAvailableSports(): Promise<string[]> {
  const q = query(collection(db, COLLECTION_NAME));
  const snapshot = await getDocs(q);

  const sports = new Set<string>();
  snapshot.docs.forEach(doc => {
    const drill = doc.data() as Drill;
    sports.add(drill.sport);
  });

  return Array.from(sports).sort();
}

export async function getCategoriesBySport(sport: string): Promise<string[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('sport', '==', sport)
  );
  const snapshot = await getDocs(q);

  const categories = new Set<string>();
  snapshot.docs.forEach(doc => {
    const drill = doc.data() as Drill;
    categories.add(drill.category);
  });

  return Array.from(categories).sort();
}

export async function getSkillFocusAreasBySport(sport: string): Promise<string[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('sport', '==', sport)
  );
  const snapshot = await getDocs(q);

  const skillAreas = new Set<string>();
  snapshot.docs.forEach(doc => {
    const drill = doc.data() as Drill;
    drill.skillFocusAreas.forEach(area => skillAreas.add(area));
  });

  return Array.from(skillAreas).sort();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function estimateDrillTime(drill: Drill): number {
  if (drill.duration) {
    return drill.duration;
  }

  // Estimate based on reps and sets
  if (drill.defaultReps && drill.defaultSets) {
    // Assume 3 seconds per rep, 30 seconds rest between sets
    const timePerSet = drill.defaultReps * 3;
    const restTime = (drill.defaultSets - 1) * 30;
    return Math.ceil((timePerSet * drill.defaultSets + restTime) / 60);
  }

  // Default estimate
  return 10;
}

export function formatDrillDifficulty(level: string): string {
  const labels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  return labels[level] || level;
}

export function getDrillDifficultyColor(level: string): string {
  const colors: Record<string, string> = {
    beginner: 'green',
    intermediate: 'yellow',
    advanced: 'red',
  };
  return colors[level] || 'gray';
}

// For importing
import { arrayUnion, arrayRemove } from 'firebase/firestore';