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
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Rubric, RubricCriteria } from '@/types/video-critique';

const COLLECTION_NAME = 'rubrics';

// ============================================================================
// CREATE & UPDATE
// ============================================================================

export async function createRubric(data: Omit<Rubric, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const rubricRef = doc(collection(db, COLLECTION_NAME));

  await setDoc(rubricRef, {
    ...data,
    id: rubricRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return rubricRef.id;
}

export async function updateRubric(
  rubricId: string,
  updates: Partial<Rubric>
): Promise<void> {
  const rubricRef = doc(db, COLLECTION_NAME, rubricId);

  await updateDoc(rubricRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function addSkillToRubric(
  rubricId: string,
  skillId: string
): Promise<void> {
  const rubricRef = doc(db, COLLECTION_NAME, rubricId);

  await updateDoc(rubricRef, {
    skillIds: arrayUnion(skillId),
    updatedAt: serverTimestamp(),
  });
}

export async function removeSkillFromRubric(
  rubricId: string,
  skillId: string
): Promise<void> {
  const rubricRef = doc(db, COLLECTION_NAME, rubricId);

  await updateDoc(rubricRef, {
    skillIds: arrayRemove(skillId),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// READ
// ============================================================================

export async function getRubric(rubricId: string): Promise<Rubric | null> {
  const rubricRef = doc(db, COLLECTION_NAME, rubricId);
  const rubricDoc = await getDoc(rubricRef);

  if (!rubricDoc.exists()) {
    return null;
  }

  return rubricDoc.data() as Rubric;
}

export async function getRubricBySkill(skillId: string): Promise<Rubric | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('skillIds', 'array-contains', skillId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as Rubric;
}

export async function getAllRubrics(sport?: string): Promise<Rubric[]> {
  let q = query(
    collection(db, COLLECTION_NAME),
    orderBy('name', 'asc')
  );

  if (sport) {
    q = query(
      collection(db, COLLECTION_NAME),
      where('sport', '==', sport),
      orderBy('name', 'asc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Rubric);
}

// ============================================================================
// CRITERIA MANAGEMENT
// ============================================================================

export async function addCriteriaToRubric(
  rubricId: string,
  criteria: RubricCriteria
): Promise<void> {
  const rubricRef = doc(db, COLLECTION_NAME, rubricId);
  const rubricDoc = await getDoc(rubricRef);

  if (!rubricDoc.exists()) {
    throw new Error('Rubric not found');
  }

  const rubric = rubricDoc.data() as Rubric;
  const updatedCriteria = [...rubric.criteria, criteria];

  await updateDoc(rubricRef, {
    criteria: updatedCriteria,
    updatedAt: serverTimestamp(),
  });
}

export async function updateCriteriaInRubric(
  rubricId: string,
  criteriaId: string,
  updates: Partial<RubricCriteria>
): Promise<void> {
  const rubricRef = doc(db, COLLECTION_NAME, rubricId);
  const rubricDoc = await getDoc(rubricRef);

  if (!rubricDoc.exists()) {
    throw new Error('Rubric not found');
  }

  const rubric = rubricDoc.data() as Rubric;
  const updatedCriteria = rubric.criteria.map(c =>
    c.id === criteriaId ? { ...c, ...updates } : c
  );

  await updateDoc(rubricRef, {
    criteria: updatedCriteria,
    updatedAt: serverTimestamp(),
  });
}

export async function removeCriteriaFromRubric(
  rubricId: string,
  criteriaId: string
): Promise<void> {
  const rubricRef = doc(db, COLLECTION_NAME, rubricId);
  const rubricDoc = await getDoc(rubricRef);

  if (!rubricDoc.exists()) {
    throw new Error('Rubric not found');
  }

  const rubric = rubricDoc.data() as Rubric;
  const updatedCriteria = rubric.criteria.filter(c => c.id !== criteriaId);

  await updateDoc(rubricRef, {
    criteria: updatedCriteria,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function calculateMaxPossibleScore(rubric: Rubric): number {
  return rubric.criteria.reduce((sum, criteria) => {
    const weight = criteria.weight || 1;
    return sum + (criteria.maxScore * weight);
  }, 0);
}

export function calculateWeightedScore(
  rubric: Rubric,
  scores: { criteriaId: string; score: number }[]
): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  rubric.criteria.forEach(criteria => {
    const score = scores.find(s => s.criteriaId === criteria.id);
    if (score) {
      const weight = criteria.weight || 1;
      totalWeightedScore += score.score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
}

export function generateDefaultRubricCriteria(skillCategory: string): RubricCriteria[] {
  const baseId = Date.now().toString();

  // Default criteria based on skill category
  const defaultCriteria: Record<string, RubricCriteria[]> = {
    shooting: [
      {
        id: `${baseId}-1`,
        name: 'Balance & Base',
        description: 'Feet shoulder-width apart, balanced stance',
        maxScore: 5,
        scoreDescriptions: {
          1: 'Poor balance, unstable base',
          2: 'Inconsistent balance, feet too close/wide',
          3: 'Generally balanced but needs minor adjustments',
          4: 'Good balance with occasional lapses',
          5: 'Excellent balance and consistent base',
        },
        weight: 1,
      },
      {
        id: `${baseId}-2`,
        name: 'Shooting Motion',
        description: 'Smooth, consistent shooting motion',
        maxScore: 5,
        scoreDescriptions: {
          1: 'Jerky, inconsistent motion',
          2: 'Motion lacks fluidity',
          3: 'Generally smooth with some hitches',
          4: 'Smooth motion with minor issues',
          5: 'Perfect fluid shooting motion',
        },
        weight: 1.5,
      },
      {
        id: `${baseId}-3`,
        name: 'Follow Through',
        description: 'Complete follow through with wrist snap',
        maxScore: 5,
        scoreDescriptions: {
          1: 'No follow through',
          2: 'Incomplete follow through',
          3: 'Follow through present but inconsistent',
          4: 'Good follow through most of the time',
          5: 'Perfect follow through every shot',
        },
        weight: 1,
      },
    ],
    dribbling: [
      {
        id: `${baseId}-1`,
        name: 'Ball Control',
        description: 'Maintaining control while dribbling',
        maxScore: 5,
        scoreDescriptions: {
          1: 'Frequently loses control',
          2: 'Struggles with control at speed',
          3: 'Generally maintains control',
          4: 'Good control with occasional losses',
          5: 'Excellent control in all situations',
        },
        weight: 1.5,
      },
      {
        id: `${baseId}-2`,
        name: 'Eyes Up',
        description: 'Maintaining court vision while dribbling',
        maxScore: 5,
        scoreDescriptions: {
          1: 'Always looking at ball',
          2: 'Occasionally looks up',
          3: 'Looks up about half the time',
          4: 'Usually maintains court vision',
          5: 'Always has eyes up and scanning',
        },
        weight: 1,
      },
    ],
    defense: [
      {
        id: `${baseId}-1`,
        name: 'Defensive Stance',
        description: 'Proper defensive positioning',
        maxScore: 5,
        scoreDescriptions: {
          1: 'Standing straight up',
          2: 'Occasionally in stance',
          3: 'Generally in stance but high',
          4: 'Good stance most possessions',
          5: 'Perfect low stance throughout',
        },
        weight: 1,
      },
      {
        id: `${baseId}-2`,
        name: 'Footwork',
        description: 'Lateral movement and positioning',
        maxScore: 5,
        scoreDescriptions: {
          1: 'Poor footwork, crossing feet',
          2: 'Slow lateral movement',
          3: 'Adequate footwork',
          4: 'Good footwork with occasional lapses',
          5: 'Excellent footwork and positioning',
        },
        weight: 1.5,
      },
    ],
  };

  return defaultCriteria[skillCategory] || [];
}