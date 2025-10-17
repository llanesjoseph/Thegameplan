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
    'Football': `**Initial Setup & Stance:**\nBegin with a balanced athletic stance, feet shoulder-width apart with your weight evenly distributed on the balls of your feet. Your knees should be slightly bent (approximately 110-120 degrees) to maintain explosive power. For ${topic}, ensure your body position creates optimal leverage - your hips should be loaded and ready to fire, with your chest over your toes for forward explosion. Field awareness is critical: scan the defensive alignment, identify your target, and process the play call mentally before the snap. Your hands should be in position (3-point stance or ready position depending on your role) with fingers spread for maximum control. Mental preparation: visualize the execution of ${topic} from start to finish, anticipating defensive reactions and preparing your counter-moves.`,
    'Soccer': `**Initial Ball & Body Positioning:**\nApproach the ball with controlled acceleration, ensuring your final plant foot lands 6-8 inches beside the ball (for shooting/passing) or directly behind it (for dribbling moves). Your body orientation is crucial for ${topic} - align your hips and shoulders toward your target, maintaining balance through a low center of gravity. Your non-kicking foot should point exactly where you want the ball to go (your "compass foot"). Keep your head up to maintain field vision while using peripheral vision to monitor the ball. Arms should be out for balance, core engaged for stability. Before executing ${topic}, take a quick visual scan: Where are defenders? Where are your teammates? What passing lanes are open? This split-second awareness separates good players from great ones. Your first touch should set up ${topic} - control the ball into the perfect position for execution.`,
    'Basketball': `**Court Position & Body Mechanics:**\nEstablish your position with proper triple-threat stance if you have the ball: feet shoulder-width apart, knees bent, weight on balls of feet, ball protected at hip level. For ${topic}, your body alignment must create the optimal angle - if driving, your inside shoulder should be lower than your outside shoulder to protect the ball. If shooting, your shooting shoulder, elbow, and knee should form a vertical line to your target. Court awareness is paramount: use your peripheral vision to locate all five defenders, identify help-side positions, and recognize your teammates' spacing. Your grip on the ball for ${topic} should be firm but not tense - fingers spread wide, with space between your palm and the ball. Mental checklist before execution: Is my defender off-balance? Is help-side positioned correctly? What's my counter move if this gets cut off? Process these decisions in milliseconds.`,
    'Baseball': `**Stance & Setup Mechanics:**\nSet your stance in the batter's box with feet slightly wider than shoulder-width, weight balanced 50-50 or slightly back (60-40) depending on your swing preference. For ${topic}, your grip pressure should be firm but relaxed - think "holding a bird" - with the bat resting in your fingers, not your palms. Your back elbow should be raised to approximately shoulder height, creating the proper bat path angle. Your head must be perfectly level, eyes tracking the pitcher's release point. Before the pitch: identify the pitcher's grip (fastball vs. off-speed), anticipate pitch location based on count and situation, and commit mentally to your swing decision point. Your front shoulder should be closed slightly toward the pitcher, creating torque for the swing. Timing mechanism: use a small forward press or leg kick to sync your movement with the pitcher's delivery. This rhythm is crucial for ${topic} execution.`,
    'Brazilian Jiu-Jitsu': `**Positioning & Grip Fundamentals:**\nBegin by establishing positional dominance - your base should be rock solid with your feet positioned for maximum stability (typically one forward, one back in a staggered stance). For ${topic}, grip placement is everything: secure your primary grips with a firm but not exhausted grip (60-70% strength), positioning your hands on traditional control points (collar, sleeve, pants, belt). Your posture should create the proper angles - if on top, your hips should be heavy and forward; if on bottom, your frames should create space while your legs control distance. Before initiating ${topic}, scan for your opponent's weight distribution: Are they more weighted on their right or left? Where are their defensive grips? What's their base like? Process their positioning and identify the opening. Mental preparation: visualize the complete chain - if this works, where do I transition next? If they defend, what's my backup plan? This tactical thinking must be instant.`,
    'Wrestling': `**Control Position & Hand Fighting:**\nEstablish your stance with feet in an athletic position, one foot forward in a staggered stance that allows quick level changes. Your weight should be on the balls of your feet, hips slightly back, head up. For ${topic}, hand placement is critical: secure your grips on traditional control points (underhook, overhook, head position, wrist control) with approximately 70% strength - firm enough to control but not so tight that you gas out. Your hand fighting should be active and purposeful: constantly fight for inside position, deny your opponent's preferred grips, and create angles for ${topic} execution. Before initiating the technique, feel your opponent's pressure: Are they pushing into you or pulling away? Where is their weight distributed? What's their base like? Your body position should create the proper leverage for ${topic} - if you need to penetrate, your hips should be loaded; if you need to throw, your base should be wide and stable. Mental game: stay one move ahead - if this works, where do I go next? If they counter, what's my re-attack?`,
    'Boxing': `**Stance & Guard Position:**\nSet your boxing stance with feet shoulder-width apart, lead foot pointing toward your opponent, back foot at 45-degree angle. Weight distribution should be 60-40 (back leg to front leg) for maximum power generation. For ${topic}, your guard position is crucial: hands up protecting your chin and temples, elbows tight to your ribs protecting your liver and solar plexus. Your lead hand should be at eye level, slightly extended to control distance and set up jabs. Your back hand should be cocked at your chin, ready to fire. Chin tucked, looking through your eyebrows, creating a tight defensive frame. Before throwing ${topic} combination, assess your range: Am I close enough to land clean? Are we in punching range or kicking range? Read your opponent's patterns: Do they drop their guard after punching? Do they load up before throwing power? Are they expecting this combination? Your footwork should position you at the perfect angle - slightly off-center-line so you can land clean while minimizing their counter opportunities.`,
    'MMA': `**Range Management & Multi-Dimensional Setup:**\nEstablish your stance with versatility in mind - feet positioned for quick transitions between striking range, clinch range, and ground fighting. For ${topic}, your positioning must account for all possible exchanges: Are you in kicking range (fully extended leg reach)? Punching range (extended arm reach)? Clinch range (head-to-head)? Or grappling range (body contact)? Your stance should be slightly more square than pure boxing to defend takedowns, with hands high to protect against strikes but mobile enough to sprawl. Before executing ${topic}, scan all threats: Can they kick from here? Are they loading a takedown? Do they favor strikes or grappling? Your weight distribution should allow instant level changes - if you need to stuff a takedown, you can sprawl immediately; if you need to close distance, you can explode forward. Mental processing: if I throw ${topic} and they counter with [strike/takedown/clinch], what's my defensive response and follow-up? This multi-threat awareness is what separates MMA from single-discipline sports.`
  }
  return movements[normalizedSport] || `**Initial Movement Setup:**\nBegin with proper positioning and setup for ${topic} execution in ${sport}, ensuring your body mechanics, awareness, and mental preparation are all aligned for optimal performance.`
}

function getTransitionPoint(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const transitions: Record<string, string> = {
    'Football': `**Recognizing the Execution Window:**\nThe transition to executing ${topic} depends on reading defensive tells and play development. Watch for these critical indicators: 1) **Defensive Line Alignment** - Are they in a gap, head-up, or shaded position? This dictates your angle of attack. 2) **Linebacker Flow** - Are they showing run-fill or dropping into coverage? Their movement creates or closes execution windows. 3) **Safety Positioning** - Are they playing deep, in the box, or rolling to one side? This affects deep-game opportunities. The optimal moment for ${topic} typically occurs when you see: defensive hesitation, overcommitment to one direction, or a breakdown in gap integrity. Timing is everything - execute too early and defenders can recover; too late and the opportunity closes. Process this in real-time: as the play develops, your eyes should be reading the defense while your body is already beginning the movement. Elite players make this decision within 0.5-1 second of the snap. The transition point is that split-second when defensive commitment becomes irreversible and your execution path is clear.`,
    'Soccer': `**Reading the Game Situation:**\nThe transition to ${topic} requires sophisticated field awareness and defender reading. Key indicators to process: 1) **Defender's Body Position** - Are their hips turned? Are they flat-footed or backpedaling? This tells you if they can react quickly. 2) **Passing Lane Availability** - Is there space behind the defense? Are teammates making runs? Can you exploit this space with ${topic}? 3) **Pressure Level** - How much time do you have? Is a defender closing down quickly? This dictates your decision speed. The optimal moment for ${topic} arrives when: defenders are off-balance, space appears in dangerous areas, or defensive organization breaks down. Elite players recognize "trigger moments" - situations that signal NOW is the time to execute. Examples: when a defender plants their foot to change direction (they're momentarily stuck), when two defenders both commit to the ball (gap appears between them), or when a defender's head turns away (blind-side opportunity). Process this in your first touch - use it to both control the ball AND scan the field. Your decision should be made before your second touch, allowing smooth execution without hesitation.`,
    'Basketball': `**Defensive Reading & Attack Windows:**\nThe transition to ${topic} hinges on defensive reading and recognizing scoring opportunities. Critical defensive reads: 1) **Defender's Balance** - Is their weight on their heels (vulnerable to drive) or on their toes (vulnerable to shot)? Are they upright (slow lateral movement) or in athletic stance? 2) **Help Defense Position** - Where is help-side? Are they one pass away or two passes away? Will they rotate quickly? 3) **Defensive Gaps** - Is there space to attack? Has the defense over-rotated? Are passing lanes open? The optimal window for ${topic} appears when: your defender is off-balance, help defense is occupied or out of position, or defensive rotations are late. Elite players create these opportunities through setup moves - use a jab step, shoulder fake, or ball fake to force defensive commitment, then exploit the opening. Timing markers: when a defender straightens their legs after being in stance (momentarily slow), when they reach for a steal (off-balance forward), or when help defenders look away to track cutters (attention split). Process this with your eyes while your body executes - look at the rim/target while using peripheral vision to track your defender. The decision point is when your defender reveals their intention through weight shift or positioning - at that moment, attack the weakness immediately.`,
    'Baseball': `**Pitch Recognition & Timing:**\nThe transition to ${topic} requires elite pitch recognition and timing precision. Your eyes must process: 1) **Pitch Grip at Release** - Four-seam fastball (tight spin), curveball (12-6 rotation), slider (tight dot), changeup (circle-change arm speed with slower velocity). This initial read happens in the first 10-15 feet after release. 2) **Pitch Trajectory** - Is it rising (high fastball), dropping (curve/change), or staying flat (slider)? This tells you what contact point to expect. 3) **Pitch Location** - Is it in your hitting zone? Can you drive it? Or should you take/protect? Process this with your "launch decision point" - the moment when you commit to swing or take. For most hitters, this is when the pitch is approximately 18-20 feet from the plate (about 0.15-0.18 seconds before contact). The optimal moment for ${topic} occurs when: the pitch enters your hitting zone at the ideal height/location, your timing mechanism syncs with the pitch speed, and your swing path matches the pitch plane. Elite hitters recognize their "happy zone" - that area where they can square up pitches consistently. When a pitch enters this zone, the transition is immediate and explosive. Key: your lower body should begin the swing slightly before your hands - this creates the kinetic chain that generates power. The transition point is when your front foot plants and your hips begin to rotate - at this instant, you're committed to the swing.`,
    'Brazilian Jiu-Jitsu': `**Reading Opponent's Balance & Position:**\nThe transition to ${topic} requires feeling and reacting to your opponent's weight distribution and defensive commitment. Process through touch: 1) **Weight Distribution** - Where is their weight? Are they heavy on one side, upright, or posting? Heavy pressure creates sweep opportunities; light pressure creates attack opportunities. 2) **Base Strength** - Are they solid or compromised? Test their base with small movements - push/pull to see if they react. 3) **Grip Fight Status** - Do you have your primary grips? Have they established defensive grips? Grip control often determines who can attack. The optimal moment for ${topic} appears when: your opponent's base is compromised, their weight shifts in a predictable pattern, or they overcommit to defending another attack. Elite grapplers create these moments through "setup attacks" - threaten one technique to force a specific defensive response, then exploit the opening created. Example: threaten a sweep to make them post their hand, then attack the exposed arm. Timing indicators: when you feel their weight shift (they're moving, not stable), when their frames collapse or extend fully (structural weakness), or when they're breathing hard and making tired decisions (mental fatigue). The transition point is that instant when you feel the opening - at that moment, your execution must be immediate and committed. Hesitation allows them to recover their position.`,
    'Wrestling': `**Opponent Pressure & Positioning Reads:**\nThe transition to ${topic} depends on reading your opponent's pressure, weight distribution, and defensive reactions. Key tactile reads: 1) **Pressure Direction** - Are they pushing into you (heavy forward pressure) or pulling away (creating space)? This dictates your attack angle. 2) **Weight Distribution** - Are they square with equal weight on both feet, or are they staggered/off-balance? Unequal weight creates takedown opportunities. 3) **Hand Fighting Response** - How do they react to your grip attempts? Do they immediately counter-grip? Do they post their hands wide? Their reactions reveal tendencies you can exploit. The optimal moment for ${topic} occurs when: their stance is compromised, they overextend reaching for grips, or they're transitioning between positions (momentarily unstable). Elite wrestlers create these moments through "setup sequences" - use penetration steps, head fakes, and snap-downs to force reactions, then capitalize on the opening. Timing tells: when they square up their stance (losing the advantage of a staggered stance), when they reach across their body for grips (overextended), or when they stand upright (reducing their base). The transition point is the instant you feel the opening through their positioning or pressure - immediately close distance and execute ${topic} with commitment. In wrestling, the difference between a scored takedown and a stuffed shot is often 0.2 seconds of reaction time.`,
    'Boxing': `**Reading Opponent Patterns & Creating Opportunities:**\nThe transition to ${topic} requires reading your opponent's defensive habits, guard position, and movement patterns. Visual processing: 1) **Guard Positioning** - Do they hold a high guard (head protected, body exposed)? Low guard (body protected, head exposed)? Wide guard (centerline open)? Each creates specific openings. 2) **Defensive Reactions** - How do they respond to your jab? Do they parry, slip, or shell up? Their habitual response creates the setup for ${topic}. 3) **Movement Patterns** - Do they move in straight lines or angles? Do they move head off center-line? Are they predictable in their footwork? The optimal moment for ${topic} appears when: their guard is out of position (dropped after punching, reaching for parries), they're moving in a predictable pattern (you can time their movement), or they're showing signs of fatigue (slower reactions, dropping hands). Elite boxers create these opportunities through feints and setups - use a double jab to get them reacting to your lead hand, then fire ${topic} with your power hand. Or fake the power hand to draw their guard high, then attack the body. Timing indicators: when they finish throwing a combination (brief moment of recovery where guard isn't set), when they're at the end of their backward movement (feet together, momentarily flat-footed), or when they blink or turn their head slightly (attention momentarily diverted). The transition point is that split-second when you see the opening - your body must react instantly, firing ${topic} before they can reset their defense. At elite level, this decision and execution happens in under 0.3 seconds.`,
    'MMA': `**Multi-Range Threat Assessment & Transition Recognition:**\nThe transition to ${topic} in MMA requires processing threats across multiple ranges simultaneously. Your awareness must span: 1) **Current Range** - Are you in striking range, clinch range, or grappling range? Each range has different ${topic} applications and risks. 2) **Opponent's Preferred Range** - Do they favor striking, clinch fighting, or ground work? This tells you which transitions they'll attempt and which they'll avoid. 3) **Physical Tells** - Level change signals (shoulders dip = potential takedown), stance changes (square up = potential kick), hand positioning (reaching = potential clinch attempt). The optimal moment for ${topic} appears when: your opponent is transitioning between ranges (vulnerable during movement), they're overcommitted to one range (striker only thinking striking, grappler only thinking grappling), or they show a clear weakness in one range you can exploit. Elite MMA fighters create opportunities through "range manipulation" - force your opponent into your preferred range while denying their preferred range. Example: pressure forward against a kicker to take away their distance, use angles against a clinch fighter to prevent them from closing. Timing windows: when they finish a combination and are resetting (brief vulnerability), when they're breathing heavily or showing fatigue (slower transitions, predictable patterns), or when they're reacting emotionally to previous exchanges (abandoning game plan). The transition point for ${topic} is that moment when range, timing, and opportunity align - you must commit fully because hesitation in MMA allows your opponent to shift ranges and nullify your attack. Process all threats before executing: if I throw ${topic}, what ranges am I vulnerable in? What's my counter to their likely response? This multi-threat awareness is executed subconsciously through training, but must be present in your decision-making.`
  }
  return transitions[normalizedSport] || `**Timing & Execution Window:**\nIdentify the optimal moment that allows for ${topic} application in ${sport} through careful reading of opponent positioning, movement patterns, and situational opportunities.`
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