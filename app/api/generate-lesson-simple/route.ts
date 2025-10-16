import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { topic, sport, level = 'intermediate', duration = '45 minutes', detailedInstructions } = await request.json()

    if (!topic || !sport) {
      return NextResponse.json(
        { error: 'Topic and sport are required' },
        { status: 400 }
      )
    }

    // Generate rich, detailed lesson content without external API dependency
    const markdownContent = generateRichLessonContent(topic, sport, level, duration, detailedInstructions)

    // Normalize sport name for display
    const displaySport = normalizeSportName(sport)

    // Parse duration string to number (e.g., "45 minutes" -> 45)
    const durationNumber = typeof duration === 'string'
      ? parseInt(duration.match(/\d+/)?.[0] || '60')
      : duration

    return NextResponse.json({
      success: true,
      lesson: {
        title: `${displaySport}: ${topic}`,
        sport: sport,
        level: level,
        duration: durationNumber,
        objectives: [
          `Execute ${topic} techniques with proper form and timing`,
          `Apply ${topic} principles in competitive scenarios`,
          `Understand the biomechanical foundations of ${topic}`,
          `Integrate ${topic} into overall ${sport} strategy`
        ],
        tags: [sport.toLowerCase(), topic.toLowerCase(), level, 'technique'],
        sections: [
          {
            title: "Dynamic Warm-Up & Technical Foundation",
            type: "text",
            content: `Start with sport-specific movement patterns that activate the muscle groups essential for ${topic}.\n\n**Movement Preparation:**\n${getSportSpecificWarmup(sport, topic)}\n\n**Technical Foundation Review:**\n- Body Positioning: Proper stance, weight distribution, and alignment\n- Breathing Pattern: Coordinated breathing with movement execution\n- Mental Focus: Concentration points and awareness cues\n- Safety Protocols: Injury prevention and proper progression`,
            duration: 10
          },
          {
            title: "Master-Level Technical Instruction",
            type: "text",
            content: `**Core Technique Breakdown**\n\n**Setup Phase:**\n${getSetupPhase(sport, topic)}\n\n**Execution Phase:**\n1. Initial Movement: ${getInitialMovement(topic, sport)}\n2. Transition Point: ${getTransitionPoint(topic, sport)}\n3. Force Application: ${getForceApplication(topic, sport)}\n4. Follow-Through: ${getFollowThrough(topic, sport)}\n\n**Common Mistakes & Corrections:**\n${getCommonMistakes(sport, topic)}${detailedInstructions ? `\n\n**Additional Focus:**\n${detailedInstructions}` : ''}`,
            duration: 25
          },
          {
            title: "Progressive Practice & Live Application",
            type: "drill",
            content: getSportSpecificDrills(sport, topic),
            duration: 8
          },
          {
            title: "Cool-Down & Review",
            type: "reflection",
            content: `**Key Points Review:**\n- Primary execution cues for ${topic}\n- Most common mistake to avoid\n- Best setup opportunities\n\n**Cool-Down Protocol:**\n- Light stretching focusing on muscle groups used\n- Breathing exercises for recovery\n- Mental reflection on lesson key points\n\n**Homework Assignment:**\nPractice ${topic} technique:\n- 10 repetitions daily focusing on setup phase\n- Visualize competition applications\n- Review video examples if available`,
            duration: 2
          }
        ]
      }
    })

  } catch (error) {
    console.error('Simple lesson generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson content' },
      { status: 500 }
    )
  }
}

function generateRichLessonContent(topic: string, sport: string, level: string, duration: string, instructions?: string): string {
  return `# ${sport} Masterclass: ${topic}

## Lesson Overview
**Duration:** ${duration}
**Level:** ${level.charAt(0).toUpperCase() + level.slice(1)}
**Focus:** ${topic}

${instructions ? `**Special Instructions:** ${instructions}\n` : ''}

## Learning Objectives
By the end of this session, athletes will be able to:
- Execute ${topic} techniques with proper form and timing
- Apply ${topic} principles in competitive scenarios
- Understand the biomechanical foundations of ${topic}
- Integrate ${topic} into their overall ${sport} strategy

---

## Part 1: Dynamic Warm-Up & Technical Foundation (10 minutes)

### Movement Preparation
Start with sport-specific movement patterns that activate the muscle groups essential for ${topic}. Focus on:

**Joint Mobility Sequence:**
- Shoulder circles and arm swings (30 seconds)
- Hip circles and leg swings (45 seconds)
- Spinal rotation and flexion (30 seconds)
- Ankle mobility and calf activation (15 seconds)

**${sport}-Specific Activation:**
${getSportSpecificWarmup(sport, topic)}

### Technical Foundation Review
Before diving into advanced ${topic} techniques, review the fundamental principles:

1. **Body Positioning:** Proper stance, weight distribution, and alignment
2. **Breathing Pattern:** Coordinated breathing with movement execution
3. **Mental Focus:** Concentration points and awareness cues
4. **Safety Protocols:** Injury prevention and proper progression

---

## Part 2: Master-Level Technical Instruction (25 minutes)

### Core Technique Breakdown

#### Primary ${topic} Technique
**Setup Phase (2-3 minutes):**
- Establish proper positioning relative to opponent/equipment
- Check grip placement and pressure points
- Verify foot positioning and weight distribution
- Ensure optimal body alignment for force generation

**Execution Phase (3-4 minutes):**
Step-by-step breakdown of the primary ${topic} movement:

1. **Initial Movement:** ${getInitialMovement(topic, sport)}
2. **Transition Point:** ${getTransitionPoint(topic, sport)}
3. **Force Application:** ${getForceApplication(topic, sport)}
4. **Follow-Through:** ${getFollowThrough(topic, sport)}

**Common Mistakes & Corrections:**
- ❌ **Mistake:** Rushing the setup phase
  ✅ **Correction:** Take 2-3 seconds to establish proper positioning
- ❌ **Mistake:** Using excessive force early
  ✅ **Correction:** Build pressure gradually through proper leverage
- ❌ **Mistake:** Neglecting opposite-side awareness
  ✅ **Correction:** Maintain peripheral vision and defensive positioning

### Advanced Variations
For ${level} level athletes, introduce these variations:

**Variation A: ${getAdvancedVariation(topic, sport, 'A')}**
**Variation B: ${getAdvancedVariation(topic, sport, 'B')}**

### Tactical Applications
Understanding when and how to apply ${topic} in competitive scenarios:

- **Offensive Opportunities:** ${getOffensiveApplications(topic, sport)}
- **Defensive Considerations:** ${getDefensiveApplications(topic, sport)}
- **Transition Opportunities:** ${getTransitionOpportunities(topic, sport)}

---

## Part 3: Progressive Practice & Live Application (8 minutes)

### Structured Drilling
**Drill 1: Technical Repetition (3 minutes)**
- Partners alternate executing ${topic} technique
- Focus on form over speed
- Coach provides individual corrections

**Drill 2: Resistance Training (3 minutes)**
- Add progressive resistance to ${topic} execution
- Build strength and muscle memory
- Emphasize proper breathing under pressure

**Drill 3: Live Application (2 minutes)**
- Integrate ${topic} into free-form practice
- Encourage experimentation with timing and setup
- Monitor for safety and proper execution

### Competition Simulation
Practice ${topic} under competition-like conditions:
- Time pressure scenarios
- Multiple opponent styles
- Fatigue management
- Strategic decision making

---

## Closing & Recovery (2 minutes)

### Technique Review
Quick review of key points:
- Primary execution cues for ${topic}
- Most common mistake to avoid
- Best setup opportunities

### Cool-Down Protocol
- Light stretching focusing on muscle groups used
- Breathing exercises for recovery
- Mental reflection on lesson key points

### Homework Assignment
Practice ${topic} technique:
- 10 repetitions daily focusing on setup phase
- Visualize competition applications
- Review video examples if available

---

## Coach Notes

**Safety Reminders:**
- Monitor athletes for signs of fatigue
- Ensure proper hydration throughout session
- Watch for overexertion during live practice

**Individual Adaptations:**
- Modify technique for different body types
- Adjust intensity based on experience level
- Provide additional support for struggling athletes

**Assessment Criteria:**
- Technical execution accuracy
- Understanding of application principles
- Ability to adapt under pressure
- Safety awareness and control

---

*This lesson plan provides a comprehensive framework for teaching ${topic} in ${sport}. Adjust timing and intensity based on group needs and facility constraints.*`
}

function normalizeSportName(sport: string): string {
  const sportMap: Record<string, string> = {
    'bjj': 'Brazilian Jiu-Jitsu',
    'brazilian jiu-jitsu': 'Brazilian Jiu-Jitsu',
    'wrestling': 'Wrestling',
    'boxing': 'Boxing',
    'mma': 'MMA',
    'baseball': 'Baseball',
    'basketball': 'Basketball',
    'football': 'Football',
    'soccer': 'Soccer',
    'softball': 'Softball',
    'volleyball': 'Volleyball'
  }
  return sportMap[sport.toLowerCase()] || sport
}

function getSportSpecificWarmup(sport: string, topic: string): string {
  const normalizedSport = normalizeSportName(sport)
  const warmups: Record<string, string> = {
    'Brazilian Jiu-Jitsu': `- Guard pulling and hip mobility drills\n- Bridging and shrimping movements\n- Grip strength activation\n- Core stability exercises`,
    'Wrestling': `- Stance and motion drills\n- Penetration step practice\n- Hand fighting exercises\n- Mat awareness movements`,
    'Boxing': `- Shadow boxing combinations\n- Footwork ladder patterns\n- Hand speed activation\n- Head movement drills`,
    'MMA': `- Mixed range movement patterns\n- Stance switching drills\n- Clinch position practice\n- Ground transition movements`,
    'Baseball': `- Shoulder rotation and arm circles\n- Rotational core activation\n- Throwing mechanics review\n- Footwork and agility drills`,
    'Basketball': `- Dynamic stretching for legs and hips\n- Jump activation exercises\n- Ball handling warm-up\n- Defensive stance movements`,
    'Football': `- Position-specific movement patterns\n- Acceleration and deceleration drills\n- Contact preparation exercises\n- Agility ladder work`,
    'Soccer': `- Dynamic leg swings and stretches\n- Footwork and ball control drills\n- Acceleration and change of direction\n- Passing accuracy warm-up`
  }
  return warmups[normalizedSport] || `- Sport-specific movement patterns\n- Range of motion exercises\n- Activation drills\n- Balance and coordination work`
}

function getInitialMovement(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const movements: Record<string, string> = {
    'Football': `Begin with proper stance and footwork, ensuring your body position and field awareness are optimal for ${topic} execution.`,
    'Soccer': `Start with proper ball positioning and body orientation, ensuring your balance and field vision support ${topic} technique.`,
    'Basketball': `Establish proper court position and body alignment, with the ball secured and ready for ${topic} execution.`,
    'Baseball': `Set up with proper batting/fielding stance, ensuring your grip, balance, and eyes are aligned for ${topic}.`,
    'Brazilian Jiu-Jitsu': `Begin with deliberate positioning, ensuring you have established the proper grip and stance for ${topic} execution.`,
    'Wrestling': `Establish control position with proper hand placement and body positioning for ${topic} execution.`,
    'Boxing': `Set your stance with proper guard position and footwork ready for ${topic} combination.`,
    'MMA': `Begin with proper range management and stance, ready to execute ${topic} across all fighting ranges.`
  }
  return movements[normalizedSport] || `Begin with proper positioning and setup for ${topic} execution in ${sport}.`
}

function getTransitionPoint(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const transitions: Record<string, string> = {
    'Football': `Identify the optimal moment based on defensive alignment or play development that allows for ${topic} execution.`,
    'Soccer': `Read the field situation and defender positioning to find the right moment for ${topic} application.`,
    'Basketball': `Recognize defensive gaps or offensive advantages that create opportunities for ${topic}.`,
    'Baseball': `Wait for the pitch location and timing that sets up ideal conditions for ${topic}.`,
    'Brazilian Jiu-Jitsu': `Identify the optimal moment when your opponent's balance or position allows for ${topic} application.`,
    'Wrestling': `Recognize when your opponent's weight distribution creates openings for ${topic}.`,
    'Boxing': `Time your entry when opponent's guard or movement patterns create opportunities for ${topic}.`,
    'MMA': `Identify transition opportunities across ranges that allow for ${topic} execution.`
  }
  return transitions[normalizedSport] || `Identify the optimal moment that allows for ${topic} application in ${sport}.`
}

function getForceApplication(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const applications: Record<string, string> = {
    'Football': `Execute the movement with proper speed, power, and body control using correct football mechanics for ${topic}.`,
    'Soccer': `Apply the technique with proper timing, ball contact, and body positioning specific to ${topic}.`,
    'Basketball': `Execute with proper footwork, hand placement, and body control using fundamental basketball mechanics.`,
    'Baseball': `Apply the technique with proper swing/throw mechanics, using your entire body for optimal ${topic} execution.`,
    'Brazilian Jiu-Jitsu': `Apply controlled, progressive force using proper body mechanics and leverage principles specific to ${topic}.`,
    'Wrestling': `Use proper wrestling pressure and technique, applying force through correct body positioning.`,
    'Boxing': `Deliver power through proper hip rotation and punch mechanics for ${topic}.`,
    'MMA': `Apply technique with proper force generation across striking, grappling, or clinch range.`
  }
  return applications[normalizedSport] || `Execute the technique using proper mechanics specific to ${sport}.`
}

function getFollowThrough(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const followThroughs: Record<string, string> = {
    'Football': `Complete the play with proper finish, maintaining balance and transitioning to the next play or defensive position.`,
    'Soccer': `Finish the movement with proper body control and immediate transition to next phase of play.`,
    'Basketball': `Complete the motion with proper landing and recovery, ready to transition on offense or defense.`,
    'Baseball': `Follow through with complete extension and rotation, maintaining balance throughout the finish.`,
    'Brazilian Jiu-Jitsu': `Complete the movement with proper control and transition to advantageous position or next technique sequence.`,
    'Wrestling': `Secure the position and prepare for your next offensive or defensive sequence.`,
    'Boxing': `Return to proper guard position, maintaining defensive awareness and ring control.`,
    'MMA': `Complete the technique and transition to optimal position for next offensive or defensive action.`
  }
  return followThroughs[normalizedSport] || `Complete the movement with proper control and transition to next action.`
}

function getSetupPhase(sport: string, topic: string): string {
  const normalizedSport = normalizeSportName(sport)
  const setups: Record<string, string> = {
    'Football': `- Establish proper alignment and spacing based on formation\n- Check body position and balance for ${topic}\n- Verify field awareness and read defensive alignment\n- Ensure proper hand placement (if applicable) and footwork`,
    'Soccer': `- Position yourself relative to the ball and field\n- Check your body orientation and balance\n- Verify foot positioning and weight distribution\n- Ensure proper field vision and teammate awareness`,
    'Basketball': `- Establish proper court position and spacing\n- Check ball security and hand placement\n- Verify foot positioning and pivot foot (if applicable)\n- Ensure awareness of defenders and teammates`,
    'Baseball': `- Set your stance in the batter's box or field position\n- Check grip on bat/glove and hand positioning\n- Verify foot positioning and weight distribution\n- Ensure proper eye tracking and mental preparation`,
    'Brazilian Jiu-Jitsu': `- Establish proper positioning relative to opponent\n- Check grip placement and pressure points\n- Verify foot positioning and weight distribution\n- Ensure optimal body alignment for force generation`,
    'Wrestling': `- Establish control position and hand placement\n- Check your base and balance\n- Verify proper pressure and leverage points\n- Ensure defensive awareness and positioning`,
    'Boxing': `- Set your stance with proper guard position\n- Check foot positioning and weight distribution\n- Verify range and distance management\n- Ensure proper defensive positioning and awareness`,
    'MMA': `- Establish proper range and stance\n- Check positioning across all fighting ranges\n- Verify base, balance, and defensive readiness\n- Ensure proper setup for transition opportunities`
  }
  return setups[normalizedSport] || `- Establish proper positioning for ${topic}\n- Check body alignment and balance\n- Verify key contact points and placement\n- Ensure awareness of surroundings and timing`
}

function getCommonMistakes(sport: string, topic: string): string {
  const normalizedSport = normalizeSportName(sport)
  const mistakes: Record<string, string> = {
    'Football': `❌ Poor initial stance → ✅ Establish proper three-point or two-point stance\n❌ Rushing the snap timing → ✅ Time your movement with the snap count\n❌ Losing field awareness → ✅ Keep your head on a swivel and read the play`,
    'Soccer': `❌ Poor ball positioning → ✅ Ensure ball is in optimal position before execution\n❌ Rushing the touch → ✅ Time your movement to maintain control\n❌ Losing field awareness → ✅ Check your surroundings before and during execution`,
    'Basketball': `❌ Traveling or carrying → ✅ Maintain proper footwork and ball control\n❌ Forcing the move → ✅ Read the defense and execute when timing is right\n❌ Poor body control → ✅ Stay balanced throughout the movement`,
    'Baseball': `❌ Dropping hands/elbow → ✅ Keep hands high and maintain proper bat path\n❌ Overstriding → ✅ Use controlled stride length for balance\n❌ Taking eyes off the ball → ✅ Track the ball all the way through contact`,
    'Brazilian Jiu-Jitsu': `❌ Rushing the setup phase → ✅ Take 2-3 seconds to establish proper positioning\n❌ Using excessive force early → ✅ Build pressure gradually through proper leverage\n❌ Neglecting opposite-side awareness → ✅ Maintain peripheral vision`,
    'Wrestling': `❌ Poor hand position → ✅ Secure proper grips before initiating movement\n❌ Weak base → ✅ Maintain strong stance and balance throughout\n❌ Telegraphing moves → ✅ Use setups and fakes to disguise intention`,
    'Boxing': `❌ Dropping guard → ✅ Return hands to defensive position immediately\n❌ Poor foot positioning → ✅ Maintain balanced stance throughout combination\n❌ Overextending punches → ✅ Stay within proper range and maintain control`,
    'MMA': `❌ Poor range management → ✅ Control distance and timing for technique execution\n❌ One-dimensional approach → ✅ Be ready to adapt across striking/grappling ranges\n❌ Neglecting defense → ✅ Maintain defensive awareness throughout`
  }
  return mistakes[normalizedSport] || `❌ Rushing the setup → ✅ Take time to establish proper positioning\n❌ Poor technique execution → ✅ Focus on form before adding speed\n❌ Losing awareness → ✅ Maintain situational awareness throughout`
}

function getAdvancedVariation(topic: string, sport: string, variation: string): string {
  return `Advanced ${topic} variation focusing on ${variation === 'A' ? 'speed and timing' : 'power and precision'} for competitive application.`
}

function getOffensiveApplications(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const isCombatSport = ['Brazilian Jiu-Jitsu', 'Wrestling', 'Boxing', 'MMA'].includes(normalizedSport)

  if (isCombatSport) {
    return `Use ${topic} when opponent shows specific openings or defensive patterns common in ${sport} competition.`
  }
  return `Use ${topic} when you recognize opportunities based on game situation and defensive positioning in ${sport}.`
}

function getDefensiveApplications(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const isCombatSport = ['Brazilian Jiu-Jitsu', 'Wrestling', 'Boxing', 'MMA'].includes(normalizedSport)

  if (isCombatSport) {
    return `Recognize when opponents might attempt to counter ${topic} and maintain defensive awareness throughout execution.`
  }
  return `Understand defensive responsibilities and maintain awareness when executing ${topic} in game situations.`
}

function getTransitionOpportunities(topic: string, sport: string): string {
  return `Seamlessly connect ${topic} to follow-up actions and transitions typical in ${sport} flow.`
}

function getSportSpecificDrills(sport: string, topic: string): string {
  const normalizedSport = normalizeSportName(sport)
  const drills: Record<string, string> = {
    'Football': `**Drill 1: Technical Repetition (3 minutes)**\n- Execute ${topic} technique in controlled reps\n- Focus on footwork and body positioning\n- Coach provides individual feedback on form\n\n**Drill 2: Resistance & Conditioning (3 minutes)**\n- Practice ${topic} with resistance bands or against resistance\n- Build strength specific to the movement\n- Maintain proper form under increased load\n\n**Drill 3: Live Game Simulation (2 minutes)**\n- Execute ${topic} in game-like scenarios\n- Add defensive pressure and game speed\n- Monitor for proper technique under competition conditions\n\n**Competition Simulation:**\nPractice ${topic} in full-speed game situations with proper spacing, timing, and decision-making.`,

    'Soccer': `**Drill 1: Ball Control & Repetition (3 minutes)**\n- Practice ${topic} with stationary ball, then moving ball\n- Focus on proper foot placement and ball contact\n- Coach provides feedback on technique and form\n\n**Drill 2: Pressure Training (3 minutes)**\n- Add passive defender to increase difficulty\n- Practice ${topic} with time constraints\n- Maintain proper form with defensive pressure\n\n**Drill 3: Small-Sided Game (2 minutes)**\n- Apply ${topic} in 3v3 or 4v4 game situation\n- Encourage recognition of when to use technique\n- Monitor execution quality in game flow\n\n**Competition Simulation:**\nPractice ${topic} in full 11v11 or reduced game scenarios with proper spacing and game decision-making.`,

    'Basketball': `**Drill 1: Form Shooting & Repetition (3 minutes)**\n- Practice ${topic} with focus on proper mechanics\n- Start close, gradually increase distance/difficulty\n- Coach provides immediate feedback on form\n\n**Drill 2: Competitive Repetition (3 minutes)**\n- Add defender or game constraint\n- Practice ${topic} with time pressure\n- Maintain technique quality under pressure\n\n**Drill 3: Live Game Application (2 minutes)**\n- Execute ${topic} in 3v3 or 5v5 game\n- Encourage proper decision-making\n- Monitor for technique quality in competition\n\n**Competition Simulation:**\nFull-court scrimmage with emphasis on applying ${topic} in game situations.`,

    'Baseball': `**Drill 1: Technical Repetition (3 minutes)**\n- Practice ${topic} with focus on mechanics\n- Use tee, soft toss, or fielding setup\n- Coach provides feedback on form and timing\n\n**Drill 2: Live Pitching/Fielding (3 minutes)**\n- Add game-speed element to ${topic}\n- Practice with live pitches or hit balls\n- Focus on maintaining form under game conditions\n\n**Drill 3: Game Simulation (2 minutes)**\n- Execute ${topic} in simulated game situations\n- Add base runners or defensive scenarios\n- Monitor for proper execution under pressure\n\n**Competition Simulation:**\nLive batting practice or infield/outfield work with game-like intensity and decision-making.`,

    'Brazilian Jiu-Jitsu': `**Drill 1: Technical Repetition (3 minutes)**\n- Partners alternate executing ${topic} technique\n- Focus on form over speed\n- Coach provides individual corrections\n\n**Drill 2: Resistance Training (3 minutes)**\n- Add progressive resistance to ${topic} execution\n- Build strength and muscle memory\n- Emphasize proper breathing under pressure\n\n**Drill 3: Live Application (2 minutes)**\n- Integrate ${topic} into free-form practice\n- Encourage experimentation with timing and setup\n- Monitor for safety and proper execution\n\n**Competition Simulation:**\nPractice ${topic} under competition-like conditions with time pressure scenarios and strategic decision making.`,

    'Wrestling': `**Drill 1: Technical Drilling (3 minutes)**\n- Partners alternate practicing ${topic}\n- Focus on proper setup and execution\n- Coach provides feedback on technique\n\n**Drill 2: Live Resistance (3 minutes)**\n- Add progressive resistance from partner\n- Practice ${topic} against increasing defense\n- Maintain proper form under pressure\n\n**Drill 3: Live Wrestling (2 minutes)**\n- Integrate ${topic} into live wrestling\n- Encourage setups and timing\n- Monitor for safety and execution quality\n\n**Competition Simulation:**\nLive matches with focus on setting up and executing ${topic} in competition scenarios.`,

    'Boxing': `**Drill 1: Shadow Boxing (3 minutes)**\n- Practice ${topic} combination in shadow boxing\n- Focus on proper form, footwork, and balance\n- Coach provides feedback on technique\n\n**Drill 2: Heavy Bag Work (3 minutes)**\n- Execute ${topic} on heavy bag\n- Build power and timing\n- Maintain proper form with full force\n\n**Drill 3: Mitt Work or Sparring (2 minutes)**\n- Practice ${topic} with coach on mitts or in light sparring\n- Add movement and defensive responsibilities\n- Monitor for technique quality under pressure\n\n**Competition Simulation:**\nControlled sparring with emphasis on setting up and landing ${topic} in live situations.`,

    'MMA': `**Drill 1: Technical Drilling (3 minutes)**\n- Practice ${topic} across all ranges\n- Focus on proper form and transitions\n- Coach provides feedback on technique\n\n**Drill 2: Resistance Training (3 minutes)**\n- Add progressive resistance to ${topic}\n- Practice with partner defending\n- Maintain form under increased pressure\n\n**Drill 3: Live Training (2 minutes)**\n- Execute ${topic} in live grappling or sparring\n- Encourage proper setups and timing\n- Monitor for safety and execution\n\n**Competition Simulation:**\nMixed training (striking/grappling) with focus on applying ${topic} across all ranges in competition scenarios.`
  }

  return drills[normalizedSport] || `**Drill 1: Technical Repetition (3 minutes)**\n- Practice ${topic} with focus on proper form\n- Start slow, gradually increase speed\n- Coach provides individual feedback\n\n**Drill 2: Progressive Difficulty (3 minutes)**\n- Add complexity or resistance to ${topic}\n- Build strength and consistency\n- Maintain technique quality\n\n**Drill 3: Game Application (2 minutes)**\n- Execute ${topic} in game-like situations\n- Encourage proper timing and decision-making\n- Monitor for technique quality\n\n**Competition Simulation:**\nPractice ${topic} under game conditions with proper intensity and decision-making.`
}