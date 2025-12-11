/**
 * Comprehensive Sports Knowledge Base for AI-Powered Content Generation
 * Contains detailed sport-specific contexts, techniques, and expert knowledge
 */

export interface SportContext {
  name: string
  aliases: string[]
  coachingPhilosophy: string[]
  keyAreas: string[]
  technicalAspects: string[]
  mentalAspects: string[]
  physicalAspects: string[]
  commonTerminology: Record<string, string>
  skillProgression: {
    beginner: string[]
    intermediate: string[]
    advanced: string[]
    elite: string[]
  }
  safetyConsiderations: string[]
  equipmentEssentials: string[]
  commonMistakes: string[]
  expertTips: string[]
}

export const soccerContext: SportContext = {
  name: 'Soccer',
  aliases: ['soccer', 'futbol', 'association football', 'football (soccer)'],
  coachingPhilosophy: [
    'Technique over strength in all situations',
    'Intelligence and decision-making separate elite players',
    'Consistency in fundamentals leads to match success',
    'Mental preparation equals physical preparation',
    'Every touch should have purpose and intention',
    'Vision and scanning create time and space',
    'First touch determines quality of next action'
  ],
  keyAreas: [
    'Technical Skills (passing, shooting, dribbling, first touch)',
    'Tactical Awareness (positioning, decision-making, game reading)',
    'Physical Conditioning (endurance, speed, agility, strength)',
    'Mental Preparation (confidence, focus, pressure management)',
    'Set Piece Execution (corners, free kicks, penalties)',
    'Defensive Principles (marking, tackling, pressing)',
    'Transition Play (attack to defense, defense to attack)'
  ],
  technicalAspects: [
    'Ball Control and First Touch',
    'Passing Accuracy and Weight',
    'Shooting Technique and Placement',
    'Dribbling and 1v1 Skills',
    'Heading Technique and Timing',
    'Crossing and Wing Play',
    'Defensive Positioning and Tackling',
    'Goalkeeping Fundamentals'
  ],
  mentalAspects: [
    'Game Intelligence and Decision Making',
    'Pressure Management and Composure',
    'Leadership and Communication',
    'Confidence Building and Self-Belief',
    'Concentration and Focus',
    'Competitive Mindset',
    'Team Chemistry and Unity',
    'Adaptability and Problem Solving'
  ],
  physicalAspects: [
    'Cardiovascular Endurance',
    'Sprint Speed and Acceleration',
    'Agility and Change of Direction',
    'Balance and Coordination',
    'Core Strength and Stability',
    'Lower Body Power',
    'Flexibility and Mobility',
    'Injury Prevention and Recovery'
  ],
  commonTerminology: {
    'PK': 'Penalty Kick - Direct free kick from 12 yards',
    'FK': 'Free Kick - Awarded for fouls and misconduct',
    'Through ball': 'Pass played behind defensive line for teammate to run onto',
    'Cross': 'Ball played from wide area into penalty box',
    'Header': 'Using head to control, pass, or shoot the ball',
    'Volley': 'Striking ball while it\'s in the air',
    'Chip': 'Lofted ball over opponent, usually goalkeeper',
    'Nutmeg': 'Playing ball through opponent\'s legs',
    'Tackle': 'Dispossessing opponent of the ball',
    'Mark': 'Closely guard an opponent',
    'Press': 'Apply pressure to opponent with ball',
    'Switch play': 'Change direction of attack from one side to other',
    'Check run': 'Movement toward ball to receive pass',
    'Dummy': 'Fake movement to deceive opponent',
    'Jockey': 'Defensive positioning to contain attacker',
    'Scanning': 'Looking around to assess options before receiving ball'
  },
  skillProgression: {
    beginner: [
      'Basic ball control with inside of foot',
      'Simple passing over short distances',
      'Shooting with laces, aim for corners',
      'Running with ball using outside of foot',
      'Basic defensive stance and positioning',
      'Understanding offside rule',
      'Basic throw-in technique'
    ],
    intermediate: [
      'First touch in different directions',
      'Passing with both feet accurately',
      'Shooting on the turn and with weaker foot',
      'Step-over and cut moves',
      'Defensive tackling and interceptions',
      'Heading technique for clearances',
      'Basic set piece execution'
    ],
    advanced: [
      'Receiving under pressure and turning',
      'Long-range passing and switching play',
      'Finishing with various techniques (chip, placement, power)',
      'Complex dribbling combinations',
      'Reading the game and anticipating play',
      'Attacking and defensive headers',
      'Set piece specialization (corners, free kicks)'
    ],
    elite: [
      'Elite-level ball mastery and manipulation',
      'Vision and passing under intense pressure',
      'Clinical finishing in all situations',
      'Beating multiple opponents in tight spaces',
      'Tactical flexibility and position switching',
      'Leadership and game management',
      'Set piece innovation and execution'
    ]
  },
  safetyConsiderations: [
    'Always warm up with dynamic movements before training',
    'Use proper shin guards and appropriate footwear',
    'Stay hydrated, especially in hot conditions',
    'Learn proper heading technique to reduce injury risk',
    'Practice safe tackling - avoid studs-up challenges',
    'Communicate with teammates to avoid collisions',
    'Cool down and stretch after training sessions',
    'Report any head injuries immediately to coaches',
    'Use proper goal anchoring and equipment setup',
    'Train on appropriate surfaces for skill level'
  ],
  equipmentEssentials: [
    'Quality soccer ball (size 5 for adults)',
    'Shin guards (mandatory for matches)',
    'Soccer cleats appropriate for playing surface',
    'Comfortable athletic clothing',
    'Water bottle for hydration',
    'Training cones for drill setup',
    'Agility ladder for speed work',
    'Resistance bands for strength training',
    'First aid kit for training sessions',
    'Goal (full-size or portable for training)'
  ],
  commonMistakes: [
    'Looking down while dribbling instead of scanning field',
    'Passing with toe instead of inside of foot',
    'Leaning back when shooting (causes ball to go high)',
    'Ball watching instead of tracking nearby opponents',
    'Running straight at defender instead of using angles',
    'Poor first touch that gives ball away under pressure',
    'Hesitating too long before making decisions',
    'Not communicating with teammates during play',
    'Standing flat-footed instead of staying on toes',
    'Neglecting weaker foot development'
  ],
  expertTips: [
    'Your first touch should always take you away from pressure',
    'Scan the field 5-6 times during each possession cycle',
    'Plant foot position determines pass accuracy - point it at target',
    'Watch opponent\'s hips, not their feet or eyes, when defending',
    'Practice shooting with both power and placement from every angle',
    'Communication is a skill - practice calling for ball and directing teammates',
    'Master 2-3 moves perfectly rather than knowing 10 moves poorly',
    'Train your weak foot to 70% of strong foot ability minimum',
    'Penalties: pick your corner before approaching, never during run-up',
    'Reading the game: anticipate what will happen 2-3 seconds ahead'
  ]
}

export const americanFootballContext: SportContext = {
  name: 'American Football',
  aliases: ['football', 'american football', 'gridiron', 'NFL'],
  coachingPhilosophy: [
    'Execution under pressure defines championship teams',
    'Physical and mental toughness are equally important',
    'Preparation and film study create competitive advantages',
    'Team chemistry and trust enable complex schemes',
    'Fundamentals must be automatic in high-pressure situations',
    'Every position is critical to team success',
    'Adaptability and adjustments win games'
  ],
  keyAreas: [
    'Offensive Systems (run, pass, protection schemes)',
    'Defensive Concepts (coverage, pass rush, run stopping)',
    'Special Teams (kicking game, return coverage)',
    'Position-Specific Techniques (blocking, tackling, route running)',
    'Game Planning and Film Study',
    'Physical Conditioning (strength, speed, agility)',
    'Mental Preparation (reads, adjustments, communication)',
    'Leadership and Team Chemistry'
  ],
  technicalAspects: [
    'Blocking Techniques and Leverage',
    'Tackling Form and Safety',
    'Route Running and Timing',
    'Quarterback Mechanics and Reads',
    'Pass Coverage Principles',
    'Run Fit and Gap Control',
    'Special Teams Fundamentals',
    'Footwork and Body Positioning'
  ],
  mentalAspects: [
    'Pre-Snap Recognition and Reads',
    'Pressure Management and Composure',
    'Team Communication and Signals',
    'Competitive Drive and Resilience',
    'Focus and Concentration',
    'Leadership and Accountability',
    'Adaptability and Adjustments',
    'Game Situation Awareness'
  ],
  physicalAspects: [
    'Explosive Power and Strength',
    'Speed and Acceleration',
    'Agility and Change of Direction',
    'Hand-Eye Coordination',
    'Core Stability and Balance',
    'Cardiovascular Endurance',
    'Flexibility and Mobility',
    'Injury Prevention and Recovery'
  ],
  commonTerminology: {
    'Down and Distance': 'Current down (1-4) and yards needed for first down',
    'Snap Count': 'Cadence used to start the play',
    'Audible': 'Play change called at the line of scrimmage',
    'Blitz': 'Extra pass rushers beyond base defense',
    'Pick': 'Interception by the defense',
    'Sack': 'Tackling quarterback behind line of scrimmage',
    'Pocket': 'Protected area for quarterback to throw',
    'Red Zone': 'Area between 20-yard line and goal line',
    'Two-Minute Drill': 'Hurry-up offense to manage clock',
    'Hard Count': 'Varying snap count to draw offsides',
    'Hot Route': 'Quick pass option against blitz',
    'Coverage': 'Defensive pass protection scheme',
    'Gap': 'Space between offensive linemen',
    'Pursuit': 'Defensive players running to the ball',
    'Stunt': 'Coordinated pass rush move',
    'Play Action': 'Fake handoff to setup pass'
  },
  skillProgression: {
    beginner: [
      'Basic stance and alignment',
      'Fundamental blocking and tackling technique',
      'Simple route running and catching',
      'Basic defensive positioning',
      'Understanding down and distance',
      'Proper equipment fitting and safety',
      'Basic rules and penalties'
    ],
    intermediate: [
      'Position-specific techniques and responsibilities',
      'Reading basic offensive and defensive schemes',
      'Proper footwork and body mechanics',
      'Communication and signals',
      'Conditioning for game demands',
      'Film study and preparation habits',
      'Situational awareness and adjustments'
    ],
    advanced: [
      'Complex scheme recognition and adjustments',
      'Advanced technique refinement',
      'Leadership and field communication',
      'Game planning and strategy',
      'Mental toughness and pressure performance',
      'Coaching and teaching others',
      'Position versatility and special packages'
    ],
    elite: [
      'Professional-level technique mastery',
      'Advanced scheme innovation and adaptation',
      'Elite physical and mental preparation',
      'Leadership and team culture development',
      'Media and community responsibilities',
      'Long-term career and health management',
      'Mentoring and developing next generation'
    ]
  },
  safetyConsiderations: [
    'Proper helmet fitting and maintenance is critical',
    'Learn and practice proper tackling technique (head up, wrap up)',
    'Understand concussion protocols and symptoms',
    'Maintain proper hydration in all weather conditions',
    'Use all required protective equipment properly',
    'Report injuries immediately to coaching and medical staff',
    'Follow proper warm-up and conditioning protocols',
    'Never lead with the head when blocking or tackling',
    'Understand heat illness prevention and recognition',
    'Practice safe weight room and conditioning habits'
  ],
  equipmentEssentials: [
    'Properly fitted helmet with face mask',
    'Shoulder pads appropriate for position',
    'Hip pads and tailbone protection',
    'Thigh and knee pads',
    'Cleats appropriate for field conditions',
    'Mouthguard (required in most leagues)',
    'Practice jersey and pants',
    'Gloves for skill positions',
    'Rib protector (for certain positions)',
    'Proper athletic supporter and cup'
  ],
  commonMistakes: [
    'Poor tackling form leading to missed tackles and injuries',
    'Lack of proper pre-snap reads and preparation',
    'Inconsistent footwork and stance',
    'Poor communication and missed assignments',
    'Inadequate film study and preparation',
    'Playing too high or with poor leverage',
    'Not finishing plays through the whistle',
    'Mental errors and penalties at crucial times',
    'Inadequate conditioning for game demands',
    'Not protecting the football in traffic'
  ],
  expertTips: [
    'Master your stance and first step - everything builds from there',
    'Study film like your career depends on it - because it does',
    'Perfect practice makes perfect - train at game speed',
    'Communication prevents blown assignments and big plays',
    'Physical and mental toughness are developed, not born',
    'Know your job and everyone else\'s job around you',
    'Prepare for every situation before it happens in the game',
    'Take care of your body - nutrition, sleep, and recovery matter',
    'Leadership is about accountability and making others better',
    'Consistency in fundamentals separates good from great players'
  ]
}

export const bjjContext: SportContext = {
  name: 'Brazilian Jiu-Jitsu',
  aliases: ['BJJ', 'Brazilian Jiu Jitsu', 'Gracie Jiu-Jitsu', 'Jiu Jitsu', 'Submission Grappling'],
  coachingPhilosophy: [
    'Technique conquers strength in all situations',
    'Position before submission - control first, attack second',
    'Small daily improvements compound over time',
    'Mental chess game - think 2-3 moves ahead',
    'Train your mind like you train your body',
    'Systematic development over random technique collection',
    'Pressure and timing matter more than speed'
  ],
  keyAreas: [
    'Guard Systems (closed, open, half, butterfly)',
    'Positional Control (mount, side control, back control)',
    'Submission Chains (chokes, joint locks, transitions)',
    'Escapes and Defense (guard retention, submission defense)',
    'Takedowns and Throws (wrestling, judo applications)',
    'Transitions and Flow (positional advancement)',
    'Competition Strategy (game planning, mental preparation)'
  ],
  technicalAspects: [
    'Guard Retention and Recovery',
    'Pressure Passing Techniques',
    'Submission Setups and Finishes',
    'Sweep Mechanics and Timing',
    'Escape Fundamentals',
    'Grip Fighting and Control',
    'Base and Posture Management',
    'Hip Movement and Mobility'
  ],
  mentalAspects: [
    'Problem-Solving Under Pressure',
    'Emotional Control During Adversity',
    'Strategic Thinking and Planning',
    'Confidence in Technique',
    'Patience and Timing',
    'Learning from Defeat',
    'Focus and Concentration',
    'Competitive Mindset Development'
  ],
  physicalAspects: [
    'Core Strength and Stability',
    'Hip Flexibility and Mobility',
    'Grip Strength and Endurance',
    'Cardiovascular Conditioning',
    'Functional Movement Patterns',
    'Balance and Coordination',
    'Injury Prevention',
    'Recovery and Rest'
  ],
  commonTerminology: {
    'Guard': 'Position where bottom player controls top player with legs',
    'Mount': 'Dominant position sitting on opponent\'s torso',
    'Side Control': 'Pinning position perpendicular to opponent',
    'Back Control': 'Controlling opponent from behind with hooks',
    'Sweep': 'Reversing position from bottom to top',
    'Submission': 'Technique forcing opponent to tap or give up',
    'Escape': 'Getting out of bad position or submission attempt',
    'Transition': 'Moving from one position to another',
    'Grip': 'Hand placement on opponent or gi',
    'Base': 'Stable foundation to prevent being swept',
    'Posture': 'Upright position to avoid being controlled',
    'Frame': 'Creating distance with arms to prevent pressure',
    'Shrimp': 'Hip escape movement fundamental to BJJ',
    'Bridge': 'Hip thrust to create space or escape'
  },
  skillProgression: {
    beginner: [
      'Basic hip escape (shrimping) movement',
      'Closed guard control and basic attacks',
      'Mount escape (bridge and roll)',
      'Side control escape fundamentals',
      'Basic submissions (rear naked choke, armbar)',
      'Defensive posture and framing',
      'Introduction to takedowns'
    ],
    intermediate: [
      'Open guard variations (spider, de la riva)',
      'Guard passing fundamentals',
      'Submission chains and combinations',
      'Advanced escapes and recoveries',
      'Sweep techniques from various guards',
      'Positional control and pressure',
      'Competition basics and rules'
    ],
    advanced: [
      'Complex guard systems and retention',
      'Pressure passing and stack passing',
      'Advanced submission setups',
      'Transition flows and combinations',
      'Takedown integration with ground game',
      'Game planning and strategy',
      'Teaching and demonstrating techniques'
    ],
    elite: [
      'Innovation and personal style development',
      'High-level competition strategy',
      'Advanced grip fighting and control',
      'System building and integration',
      'Mental game mastery',
      'Coaching and technique refinement',
      'Cross-training and MMA applications'
    ]
  },
  safetyConsiderations: [
    'Tap early and often - ego has no place in training',
    'Warm up thoroughly, especially neck and shoulders',
    'Communicate with training partners about injuries',
    'Learn to fall safely (break-falling)',
    'Don\'t train through pain - rest when injured',
    'Keep fingernails and toenails trimmed short',
    'Maintain good hygiene for skin health',
    'Use proper mats and clean training environment',
    'Progress gradually - don\'t rush belt promotions',
    'Listen to your body and take rest days'
  ],
  equipmentEssentials: [
    'Quality BJJ gi (if training gi BJJ)',
    'Rash guards for no-gi training',
    'Grappling shorts (board shorts style)',
    'Mouth guard for protection',
    'BJJ mats or access to training facility',
    'Water bottle for hydration',
    'Athletic tape for finger protection',
    'Training journal for technique notes',
    'First aid supplies',
    'Proper hygiene products'
  ],
  commonMistakes: [
    'Using strength instead of technique',
    'Neglecting defense and escapes',
    'Learning too many techniques without mastering basics',
    'Poor hip movement and positioning',
    'Holding breath during rolling',
    'Not tapping to submissions early enough',
    'Focusing only on submissions, ignoring positions',
    'Training too hard every session',
    'Comparing progress to others instead of self',
    'Skipping warm-up and cool-down'
  ],
  expertTips: [
    'Master the basics before learning fancy techniques',
    'Develop your guard retention above all else',
    'Always have multiple submission options from each position',
    'Focus on principles, not just specific techniques',
    'Train consistently rather than intensely',
    'Study video of your rolling to identify weaknesses',
    'Drill movements slowly to build muscle memory',
    'Learn from higher belts but develop your own style',
    'Mental preparation is as important as physical',
    'Recovery and rest are part of training, not separate from it'
  ]
}

export const mmaContext: SportContext = {
  name: 'Mixed Martial Arts',
  aliases: ['MMA', 'Mixed Martial Arts', 'cage fighting', 'ultimate fighting'],
  coachingPhilosophy: [
    'Adaptability across all ranges of combat',
    'Mental toughness determines fight outcomes',
    'Master fundamentals in all disciplines',
    'Game planning beats raw athleticism',
    'Recovery and injury prevention are paramount',
    'Pressure testing reveals true skill level',
    'Systematic skill development over flashy techniques'
  ],
  keyAreas: [
    'Striking (boxing, muay thai, kickboxing)',
    'Grappling (wrestling, BJJ, judo)',
    'Clinch Work (dirty boxing, knees, takedowns)',
    'Cage Wrestling (using fence for takedowns/defense)',
    'Ground and Pound (top position striking)',
    'Submission Defense and Escapes',
    'Cardio and Conditioning',
    'Mental Preparation and Fight IQ'
  ],
  technicalAspects: [
    'Stance and Footwork',
    'Punch Combinations and Timing',
    'Takedown Setups and Defense',
    'Guard Work and Submissions',
    'Clinch Control and Strikes',
    'Cage Positioning',
    'Transition Between Ranges',
    'Defensive Positioning'
  ],
  mentalAspects: [
    'Aggression Control and Channeling',
    'Pain Tolerance and Management',
    'Strategic Thinking Under Stress',
    'Confidence in All Situations',
    'Emotional Regulation',
    'Competitive Drive',
    'Fear Management',
    'Adaptability and Problem Solving'
  ],
  physicalAspects: [
    'Explosive Power Development',
    'Cardiovascular Endurance',
    'Strength and Conditioning',
    'Flexibility and Mobility',
    'Hand Speed and Reaction Time',
    'Recovery and Regeneration',
    'Weight Management',
    'Injury Prevention'
  ],
  commonTerminology: {
    'Sprawl': 'Defensive movement to avoid takedowns',
    'Ground and Pound': 'Striking from top position on ground',
    'Dirty Boxing': 'Close-range striking in clinch',
    'Cage Wrestling': 'Using fence for takedowns or defense',
    'Guard': 'Bottom position with legs controlling opponent',
    'Mount': 'Top position sitting on opponent',
    'Side Control': 'Pinning position from the side',
    'Back Control': 'Controlling opponent from behind',
    'Takedown Defense': 'Hip movement to defend takedowns (sprawling)',
    'Underhooks': 'Arms under opponent\'s arms for control',
    'Overhooks': 'Arms over opponent\'s arms for control',
    'Wall Walk': 'Getting up using cage/wall for support',
    'Sprawl and Brawl': 'Keep fight standing and strike',
    'Lay and Pray': 'Control on ground without advancing'
  },
  skillProgression: {
    beginner: [
      'Basic striking stance and movement',
      'Fundamental punches (jab, cross, hook, uppercut)',
      'Basic takedown defense (sprawling)',
      'Guard position and basic submissions',
      'Simple combinations and timing',
      'Defensive positioning and movement',
      'Basic conditioning and flexibility'
    ],
    intermediate: [
      'Advanced striking combinations',
      'Takedown setups and entries',
      'Guard passing and control',
      'Clinch work and dirty boxing',
      'Submission chains and escapes',
      'Cage awareness and positioning',
      'Sport-specific conditioning'
    ],
    advanced: [
      'Complex striking patterns and setups',
      'Advanced takedown and anti-wrestling',
      'Ground and pound techniques',
      'Submission transitions',
      'Fight strategy and game planning',
      'Mental preparation techniques',
      'Competition experience'
    ],
    elite: [
      'Professional-level skill integration',
      'Elite fight IQ and adaptability',
      'Advanced strategy and coaching',
      'Peak physical conditioning',
      'Mental toughness mastery',
      'Media and promotion skills',
      'Long-term career management'
    ]
  },
  safetyConsiderations: [
    'Always wear proper protective gear during sparring',
    'Start with light contact and gradually increase intensity',
    'Never train through head injuries or concussions',
    'Use qualified medical supervision for cuts',
    'Hydrate properly, especially during weight cuts',
    'Allow adequate recovery between hard training sessions',
    'Learn proper falling and impact techniques',
    'Communicate with partners about injury concerns',
    'Regular medical checkups for active competitors',
    'Mental health support for stress and anxiety'
  ],
  equipmentEssentials: [
    'MMA gloves (4oz fingerless gloves)',
    'Headgear for sparring protection',
    'Shin guards for kick training',
    'Mouth guard (custom-fitted preferred)',
    'Groin protection (cups)',
    'Hand wraps for wrist support',
    'MMA shorts (no pockets or zippers)',
    'Rash guards for grappling',
    'Heavy bag for striking practice',
    'Quality training mats'
  ],
  commonMistakes: [
    'Neglecting one aspect of MMA for others',
    'Training too hard too often without recovery',
    'Poor takedown defense fundamentals',
    'Panic and emotional fighting instead of strategic',
    'Inadequate cardio conditioning for fight pace',
    'Not adapting game plan during fights',
    'Focusing only on offense, ignoring defense',
    'Training without proper supervision',
    'Ignoring mental preparation aspects',
    'Unsafe weight cutting practices'
  ],
  expertTips: [
    'Master your defensive fundamentals before advancing offense',
    'Train all ranges but develop one as your specialty',
    'Cardio must be fight-specific, not just general fitness',
    'Mental visualization is as important as physical training',
    'Study your opponents thoroughly before competing',
    'Recovery and rest are when your body actually improves',
    'Learn to stay calm under pressure through experience',
    'Develop multiple game plans for different opponent types',
    'Train with people better than you whenever possible',
    'Consistency in training beats sporadic intense sessions'
  ]
}

// Main sports registry
export const sportsKnowledgeBase: Record<string, SportContext> = {
  'soccer': soccerContext,
  'futbol': soccerContext,
  'association-football': soccerContext,
  'football': americanFootballContext,
  'american-football': americanFootballContext,
  'gridiron': americanFootballContext,
  'nfl': americanFootballContext,
  'bjj': bjjContext,
  'brazilian-jiu-jitsu': bjjContext,
  'mma': mmaContext,
  'mixed-martial-arts': mmaContext
}

// Get sport context by name
export function getSportContext(sportName: string): SportContext {
  const key = sportName.toLowerCase().trim().replace(/\s+/g, '-')
  return sportsKnowledgeBase[key] || soccerContext // Default to soccer
}

// Check if sport is supported
export function isSportSupported(sportName: string): boolean {
  const key = sportName.toLowerCase().trim().replace(/\s+/g, '-')
  return key in sportsKnowledgeBase
}

// Get all supported sports
export function getSupportedSports(): string[] {
  return Object.keys(sportsKnowledgeBase)
}