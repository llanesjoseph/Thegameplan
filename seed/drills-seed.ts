import { Drill } from '@/types/video-critique';
import { createDrill } from '@/lib/data/drills';

// Basketball Shooting Drills
const shootingDrills: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Form Shooting',
    description: 'Close-range shooting focusing on perfect form and technique',
    sport: 'basketball',
    category: 'shooting',
    skillFocusAreas: ['shooting form', 'follow through', 'consistency'],
    difficultyLevel: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=example1',
    defaultReps: 10,
    defaultSets: 5,
    equipment: ['basketball', 'hoop'],
    duration: 15,
    instructions: [
      'Start 3-5 feet from the basket',
      'Focus on perfect form, not distance',
      'One hand under ball, guide hand on side',
      'Full follow through with wrist snap',
      'Hold follow through until ball hits rim',
      'Make 10 shots before moving back',
    ],
  },
  {
    name: 'Spot Shooting',
    description: 'Shooting from 5 designated spots around the arc',
    sport: 'basketball',
    category: 'shooting',
    skillFocusAreas: ['shooting', 'consistency', 'footwork'],
    difficultyLevel: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=example2',
    defaultReps: 5,
    defaultSets: 5,
    equipment: ['basketball', 'hoop', 'cones'],
    duration: 20,
    instructions: [
      'Place 5 cones around the 3-point line',
      'Start at corner, shoot 5 shots',
      'Move to wing, then top, opposite wing, opposite corner',
      'Track makes at each spot',
      'Goal: Make 3/5 from each spot',
    ],
  },
  {
    name: 'Catch and Shoot',
    description: 'Receiving passes and shooting in rhythm',
    sport: 'basketball',
    category: 'shooting',
    skillFocusAreas: ['shooting', 'footwork', 'game speed'],
    difficultyLevel: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=example3',
    defaultReps: 10,
    defaultSets: 3,
    equipment: ['basketball', 'hoop', 'partner or rebounder'],
    duration: 15,
    instructions: [
      'Partner passes from different angles',
      'Focus on footwork when catching',
      'Shoot in one motion',
      'Vary distances and angles',
      'Work on both left and right side catches',
    ],
  },
  {
    name: 'Free Throw Routine',
    description: 'Develop consistent free throw routine and form',
    sport: 'basketball',
    category: 'shooting',
    skillFocusAreas: ['free throws', 'routine', 'mental focus'],
    difficultyLevel: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=example4',
    defaultReps: 10,
    defaultSets: 5,
    equipment: ['basketball', 'hoop'],
    duration: 15,
    instructions: [
      'Develop consistent pre-shot routine',
      'Same number of dribbles every time',
      'Focus on same target (front rim, back rim)',
      'Consistent breathing pattern',
      'Track percentage - goal: 70%+',
    ],
  },
];

// Basketball Ball Handling Drills
const ballHandlingDrills: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Stationary Ball Handling',
    description: 'Basic ball handling drills in place',
    sport: 'basketball',
    category: 'dribbling',
    skillFocusAreas: ['ball control', 'hand strength', 'coordination'],
    difficultyLevel: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=example5',
    defaultReps: 30,
    defaultSets: 3,
    equipment: ['basketball'],
    duration: 10,
    instructions: [
      'Pound dribbles - 30 seconds each hand',
      'Crossovers - 30 reps',
      'Between the legs - 30 reps',
      'Behind the back - 30 reps',
      'Figure 8 dribbles - 30 reps',
      'Keep eyes up throughout',
    ],
  },
  {
    name: 'Two Ball Dribbling',
    description: 'Dribbling two basketballs simultaneously',
    sport: 'basketball',
    category: 'dribbling',
    skillFocusAreas: ['coordination', 'ambidexterity', 'ball control'],
    difficultyLevel: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=example6',
    defaultReps: 30,
    defaultSets: 3,
    equipment: ['2 basketballs'],
    duration: 15,
    instructions: [
      'Same time pound dribbles',
      'Alternating pound dribbles',
      'High-low dribbles',
      'Crossovers with both balls',
      'One high, one crossover',
      'Focus on control, not speed initially',
    ],
  },
  {
    name: 'Cone Dribbling',
    description: 'Dribbling through cones with various moves',
    sport: 'basketball',
    category: 'dribbling',
    skillFocusAreas: ['change of direction', 'footwork', 'game moves'],
    difficultyLevel: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=example7',
    defaultReps: 5,
    defaultSets: 3,
    equipment: ['basketball', '5-6 cones'],
    duration: 15,
    instructions: [
      'Set up 5-6 cones in a line, 3 feet apart',
      'Crossover at each cone',
      'Second round: between the legs',
      'Third round: behind the back',
      'Fourth round: hesitation moves',
      'Increase speed with control',
    ],
  },
  {
    name: 'Full Court Dribbling',
    description: 'Dribbling variations up and down the court',
    sport: 'basketball',
    category: 'dribbling',
    skillFocusAreas: ['speed dribbling', 'control', 'conditioning'],
    difficultyLevel: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=example8',
    defaultReps: 1,
    defaultSets: 10,
    equipment: ['basketball', 'full court'],
    duration: 20,
    instructions: [
      'Speed dribble with right hand down and back',
      'Speed dribble with left hand down and back',
      'Crossover every 3 dribbles',
      'Retreat dribbles at half court',
      'Change of pace variations',
      'Sprint dribble to controlled dribble',
    ],
  },
];

// Basketball Defense Drills
const defenseDrills: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Defensive Slides',
    description: 'Lateral sliding drill for defensive footwork',
    sport: 'basketball',
    category: 'defense',
    skillFocusAreas: ['footwork', 'stance', 'conditioning'],
    difficultyLevel: 'beginner',
    videoUrl: 'https://www.youtube.com/watch?v=example9',
    defaultReps: 30,
    defaultSets: 3,
    equipment: ['cones or court lines'],
    duration: 10,
    instructions: [
      'Start in defensive stance',
      'Slide laterally to right for 5 slides',
      'Slide back to left for 5 slides',
      'Keep low stance throughout',
      'Don\'t cross feet',
      'Push off outside foot',
    ],
  },
  {
    name: 'Close Out Drill',
    description: 'Practice closing out on shooters',
    sport: 'basketball',
    category: 'defense',
    skillFocusAreas: ['close outs', 'footwork', 'contest'],
    difficultyLevel: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=example10',
    defaultReps: 10,
    defaultSets: 3,
    equipment: ['basketball', 'partner', 'cones'],
    duration: 15,
    instructions: [
      'Start under basket',
      'Sprint to cone/player with high hands',
      'Break down into defensive stance last 2 steps',
      'Contest shot without fouling',
      'Box out after shot',
      'Vary angles and distances',
    ],
  },
  {
    name: '1-on-1 Defense',
    description: 'Live 1-on-1 defensive practice',
    sport: 'basketball',
    category: 'defense',
    skillFocusAreas: ['on-ball defense', 'positioning', 'reaction'],
    difficultyLevel: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=example11',
    defaultReps: 5,
    defaultSets: 3,
    equipment: ['basketball', 'partner', 'hoop'],
    duration: 20,
    instructions: [
      'Offense starts at top of key',
      'Defense in stance, arm\'s length away',
      'Offense has 3 dribbles to score',
      'Defense focuses on staying in front',
      'Contest all shots',
      'Switch roles after 5 possessions',
    ],
  },
];

// Basketball Conditioning Drills
const conditioningDrills: Omit<Drill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Suicides',
    description: 'Sprint drill touching lines at various distances',
    sport: 'basketball',
    category: 'conditioning',
    skillFocusAreas: ['speed', 'endurance', 'change of direction'],
    difficultyLevel: 'intermediate',
    videoUrl: 'https://www.youtube.com/watch?v=example12',
    defaultReps: 1,
    defaultSets: 5,
    equipment: ['court with lines'],
    duration: 15,
    instructions: [
      'Start at baseline',
      'Sprint to free throw line and back',
      'Sprint to half court and back',
      'Sprint to opposite free throw and back',
      'Sprint to opposite baseline and back',
      'Rest 1-2 minutes between sets',
    ],
  },
  {
    name: '17s',
    description: 'Run sideline to sideline in 17 seconds or less',
    sport: 'basketball',
    category: 'conditioning',
    skillFocusAreas: ['endurance', 'mental toughness'],
    difficultyLevel: 'advanced',
    videoUrl: 'https://www.youtube.com/watch?v=example13',
    defaultReps: 1,
    defaultSets: 10,
    equipment: ['basketball court'],
    duration: 20,
    instructions: [
      'Start at sideline',
      'Sprint to opposite sideline and back',
      'Complete in 17 seconds or less',
      'Rest remainder of time until next minute',
      'Repeat for 10 minutes',
      'Maintain consistent times',
    ],
  },
];

// Seed function
export async function seedDrills() {
  try {
    console.log('Seeding drills...');

    const allDrills = [
      ...shootingDrills,
      ...ballHandlingDrills,
      ...defenseDrills,
      ...conditioningDrills,
    ];

    const createdIds: string[] = [];

    for (const drill of allDrills) {
      const id = await createDrill(drill);
      createdIds.push(id);
      console.log(`Created drill: ${drill.name} (${id})`);
    }

    console.log(`Successfully seeded ${createdIds.length} drills`);
    return createdIds;
  } catch (error) {
    console.error('Error seeding drills:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedDrills()
    .then(() => {
      console.log('Drills seeded successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed drills:', error);
      process.exit(1);
    });
}