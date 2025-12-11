import { Rubric, RubricCriteria } from '@/types/video-critique';
import { createRubric } from '@/lib/data/rubrics';

// Basketball Shooting Form Rubric
const shootingFormRubric: Omit<Rubric, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Basketball Shooting Form',
  sport: 'basketball',
  skillIds: [],
  criteria: [
    {
      id: 'shooting-balance',
      name: 'Balance & Base',
      description: 'Feet shoulder-width apart, balanced stance throughout shot',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Poor balance, unstable base, feet too close or too wide',
        2: 'Inconsistent balance, feet positioning needs work',
        3: 'Generally balanced but minor adjustments needed',
        4: 'Good balance with occasional lapses',
        5: 'Excellent balance and consistent base throughout',
      },
      weight: 1,
    },
    {
      id: 'shooting-elbow',
      name: 'Elbow Alignment',
      description: 'Shooting elbow aligned under the ball, forms 90-degree angle',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Elbow flared out significantly, poor alignment',
        2: 'Elbow inconsistently aligned, needs major correction',
        3: 'Elbow generally aligned but drifts occasionally',
        4: 'Good elbow alignment with minor inconsistencies',
        5: 'Perfect elbow alignment, consistent 90-degree angle',
      },
      weight: 1.5,
    },
    {
      id: 'shooting-follow-through',
      name: 'Follow Through',
      description: 'Complete follow through with wrist snap and hold',
      maxScore: 5,
      scoreDescriptions: {
        1: 'No follow through, shot ends abruptly',
        2: 'Incomplete follow through, lacks wrist snap',
        3: 'Follow through present but inconsistent',
        4: 'Good follow through most of the time',
        5: 'Perfect follow through with wrist snap and hold',
      },
      weight: 1,
    },
    {
      id: 'shooting-arc',
      name: 'Shot Arc',
      description: 'Appropriate arc on shot trajectory (45-50 degrees)',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Flat shot with minimal arc',
        2: 'Arc too low or occasionally too high',
        3: 'Decent arc but needs more consistency',
        4: 'Good arc on most shots',
        5: 'Consistent optimal arc on all shots',
      },
      weight: 1,
    },
    {
      id: 'shooting-footwork',
      name: 'Footwork',
      description: 'Proper footwork on catch and shoot or off dribble',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Poor footwork, off balance on catch',
        2: 'Footwork needs significant improvement',
        3: 'Adequate footwork but lacks fluidity',
        4: 'Good footwork with minor issues',
        5: 'Excellent footwork, smooth and balanced',
      },
      weight: 1,
    },
  ],
};

// Basketball Ball Handling Rubric
const ballHandlingRubric: Omit<Rubric, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Basketball Ball Handling',
  sport: 'basketball',
  skillIds: [],
  criteria: [
    {
      id: 'handling-control',
      name: 'Ball Control',
      description: 'Maintains control of the ball while dribbling',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Frequently loses control of the ball',
        2: 'Struggles with control at speed',
        3: 'Generally maintains control',
        4: 'Good control with occasional losses',
        5: 'Excellent control in all situations',
      },
      weight: 1.5,
    },
    {
      id: 'handling-eyes',
      name: 'Court Vision',
      description: 'Keeps eyes up while dribbling',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Always looking at the ball',
        2: 'Occasionally looks up',
        3: 'Looks up about half the time',
        4: 'Usually maintains court vision',
        5: 'Always has eyes up and scanning',
      },
      weight: 1,
    },
    {
      id: 'handling-pace',
      name: 'Change of Pace',
      description: 'Ability to change speeds while dribbling',
      maxScore: 5,
      scoreDescriptions: {
        1: 'One speed only, no variation',
        2: 'Limited speed changes',
        3: 'Can change pace but telegraphs moves',
        4: 'Good pace changes',
        5: 'Excellent pace variation, very deceptive',
      },
      weight: 1,
    },
    {
      id: 'handling-protection',
      name: 'Ball Protection',
      description: 'Uses body and off-arm to protect the ball',
      maxScore: 5,
      scoreDescriptions: {
        1: 'No ball protection, easily stripped',
        2: 'Minimal protection techniques',
        3: 'Some protection but inconsistent',
        4: 'Good protection most of the time',
        5: 'Excellent protection, uses body effectively',
      },
      weight: 1,
    },
    {
      id: 'handling-moves',
      name: 'Crossover & Moves',
      description: 'Execution of crossover and other dribble moves',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Cannot execute basic moves',
        2: 'Basic moves but poor execution',
        3: 'Can execute moves but lacks fluidity',
        4: 'Good move execution',
        5: 'Excellent moves, smooth and effective',
      },
      weight: 1.5,
    },
  ],
};

// Basketball Defense Rubric
const defenseRubric: Omit<Rubric, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Basketball Defense',
  sport: 'basketball',
  skillIds: [],
  criteria: [
    {
      id: 'defense-stance',
      name: 'Defensive Stance',
      description: 'Proper defensive positioning and stance',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Standing straight up, poor positioning',
        2: 'Occasionally in stance',
        3: 'Generally in stance but high',
        4: 'Good stance most possessions',
        5: 'Perfect low stance throughout',
      },
      weight: 1,
    },
    {
      id: 'defense-footwork',
      name: 'Lateral Movement',
      description: 'Sliding and footwork to stay with offensive player',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Poor footwork, crossing feet frequently',
        2: 'Slow lateral movement',
        3: 'Adequate footwork but can improve',
        4: 'Good footwork with occasional lapses',
        5: 'Excellent footwork and positioning',
      },
      weight: 1.5,
    },
    {
      id: 'defense-positioning',
      name: 'Court Positioning',
      description: 'Understanding of help defense and positioning',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Poor positioning, often out of place',
        2: 'Limited understanding of positioning',
        3: 'Generally positioned correctly',
        4: 'Good positioning awareness',
        5: 'Excellent positioning and help defense',
      },
      weight: 1,
    },
    {
      id: 'defense-anticipation',
      name: 'Anticipation',
      description: 'Reading offensive player and anticipating moves',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Always reacting, never anticipating',
        2: 'Limited anticipation skills',
        3: 'Some anticipation but often late',
        4: 'Good anticipation most of the time',
        5: 'Excellent anticipation and reactions',
      },
      weight: 1,
    },
    {
      id: 'defense-communication',
      name: 'Communication',
      description: 'Talking on defense and calling out screens/help',
      maxScore: 5,
      scoreDescriptions: {
        1: 'No communication',
        2: 'Minimal communication',
        3: 'Some communication but needs more',
        4: 'Good communication',
        5: 'Excellent communication, vocal leader',
      },
      weight: 1,
    },
  ],
};

// Basketball Rebounding Rubric
const reboundingRubric: Omit<Rubric, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Basketball Rebounding',
  sport: 'basketball',
  skillIds: [],
  criteria: [
    {
      id: 'rebounding-positioning',
      name: 'Box Out Positioning',
      description: 'Getting into proper box out position',
      maxScore: 5,
      scoreDescriptions: {
        1: 'No box out attempt',
        2: 'Occasional box out attempts',
        3: 'Boxes out but technique needs work',
        4: 'Good box out technique',
        5: 'Excellent box out every time',
      },
      weight: 1.5,
    },
    {
      id: 'rebounding-timing',
      name: 'Timing',
      description: 'Timing the jump for the rebound',
      maxScore: 5,
      scoreDescriptions: {
        1: 'Poor timing, always early or late',
        2: 'Timing needs significant work',
        3: 'Generally good timing',
        4: 'Good timing most attempts',
        5: 'Perfect timing consistently',
      },
      weight: 1,
    },
    {
      id: 'rebounding-hands',
      name: 'Securing the Ball',
      description: 'Using both hands to secure rebounds',
      maxScore: 5,
      scoreDescriptions: {
        1: 'One-handed attempts, often loses ball',
        2: 'Inconsistent securing technique',
        3: 'Usually secures with two hands',
        4: 'Good securing technique',
        5: 'Always secures strongly with two hands',
      },
      weight: 1,
    },
    {
      id: 'rebounding-outlet',
      name: 'Outlet Pass',
      description: 'Making quick outlet pass after rebound',
      maxScore: 5,
      scoreDescriptions: {
        1: 'No outlet, holds ball too long',
        2: 'Slow outlet passes',
        3: 'Makes outlet but needs to be quicker',
        4: 'Good quick outlets',
        5: 'Excellent outlet passing immediately',
      },
      weight: 1,
    },
  ],
};

// Seed function
export async function seedRubrics() {
  try {
    console.log('Seeding rubrics...');

    const rubrics = [
      shootingFormRubric,
      ballHandlingRubric,
      defenseRubric,
      reboundingRubric,
    ];

    const createdIds: string[] = [];

    for (const rubric of rubrics) {
      const id = await createRubric(rubric);
      createdIds.push(id);
      console.log(`Created rubric: ${rubric.name} (${id})`);
    }

    console.log(`Successfully seeded ${createdIds.length} rubrics`);
    return createdIds;
  } catch (error) {
    console.error('Error seeding rubrics:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedRubrics()
    .then(() => {
      console.log('Rubrics seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed rubrics:', error);
      process.exit(1);
    });
}