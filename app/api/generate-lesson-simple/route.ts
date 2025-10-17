import { NextRequest, NextResponse } from 'next/server'
import { auth, adminDb } from '@/lib/firebase.admin'

// Force dynamic rendering for API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    const { topic, sport, level = 'intermediate', duration = '45 minutes', detailedInstructions } = await request.json()

    if (!topic || !sport) {
      return NextResponse.json(
        { error: 'Topic and sport are required' },
        { status: 400 }
      )
    }

    // Fetch coach's voice data from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const voiceData = userDoc.exists() ? userDoc.data()?.voiceCaptureData : null

    // Generate long-form content with coach's voice
    const content = generateLongFormContent(topic, sport, level, duration, detailedInstructions, voiceData)

    // Normalize sport name for display
    const displaySport = normalizeSportName(sport)

    // Parse duration string to number
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
        content: content  // Single long-form content field
      }
    })

  } catch (error) {
    console.error('Lesson generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson content' },
      { status: 500 }
    )
  }
}

function generateLongFormContent(
  topic: string,
  sport: string,
  level: string,
  duration: string,
  instructions?: string,
  voiceData?: any
): string {
  const displaySport = normalizeSportName(sport)

  // Extract voice characteristics
  const coachingPhilosophy = voiceData?.coachingPhilosophy || ''
  const communicationStyle = voiceData?.communicationStyle || ''
  const catchphrases = voiceData?.catchphrases || []
  const keyStories = voiceData?.keyStories || []

  // Add coach voice intro if available
  let voiceIntro = ''
  if (coachingPhilosophy) {
    voiceIntro = `\n**Coach's Perspective:**\n${coachingPhilosophy}\n\n`
  }

  // Add catchphrase if available
  let catchphrase = ''
  if (catchphrases.length > 0) {
    const randomCatchphrase = catchphrases[Math.floor(Math.random() * catchphrases.length)]
    catchphrase = `\n> **Remember:** ${randomCatchphrase}\n\n`
  }

  // Generate comprehensive long-form lesson
  return `# ${displaySport}: ${topic}

**Duration:** ${duration}
**Level:** ${level.charAt(0).toUpperCase() + level.slice(1)}
**Focus:** Mastering ${topic}

${voiceIntro}${instructions ? `**Special Instructions:** ${instructions}\n\n` : ''}---

## Learning Objectives

By the end of this session, you will be able to:
- Execute ${topic} techniques with proper form and timing
- Apply ${topic} principles in competitive game situations
- Understand the biomechanical foundations of ${topic}
- Integrate ${topic} seamlessly into your ${sport} strategy
- Recognize and capitalize on opportunities to use ${topic} effectively

${catchphrase}---

## Part 1: Warm-Up & Technical Foundation (10 minutes)

### Movement Preparation

Start with sport-specific movement patterns that activate the muscle groups essential for ${topic}. This isn't just about getting warm - it's about priming your neuromuscular system for the specific demands of ${topic}.

**Dynamic Warm-Up Sequence:**

${getSportSpecificWarmup(sport, topic)}

### Technical Foundation Review

Before diving into advanced ${topic} execution, let's ensure your fundamentals are rock solid. ${communicationStyle ? `As I always say, "${communicationStyle}" - ` : ''}the foundation is everything.

**Core Principles:**
1. **Body Positioning:** Proper stance, weight distribution, and alignment create the platform for success
2. **Breathing Pattern:** Coordinated breathing with movement execution - exhale on exertion
3. **Mental Focus:** Concentration points and awareness cues - where should your attention be?
4. **Safety Protocols:** Injury prevention and proper progression - train smart, not just hard

---

## Part 2: Deep Dive - Mastering ${topic} (25 minutes)

### The Setup Phase (Critical Foundation)

${getSetupPhase(sport, topic)}

This setup phase is non-negotiable. Rush it, and everything that follows will be compromised. Take your time here.

### Initial Movement & Positioning

${getInitialMovement(topic, sport)}

### Reading the Situation & Timing Your Execution

${getTransitionPoint(topic, sport)}

### Force Application & Execution

${getForceApplication(topic, sport)}

Your body should move as one coordinated unit. Power comes from the ground up - legs drive hips, hips drive core, core transfers energy to your point of contact.

### Follow-Through & Finish

${getFollowThrough(topic, sport)}

Never stop halfway. Complete every rep with full commitment to the movement pattern.

### Common Mistakes & Corrections

I've seen these mistakes hundreds of times. Let's make sure you avoid them:

${getCommonMistakes(sport, topic)}

The difference between good and great athletes is attention to these details. Good athletes know what to do. Great athletes know what NOT to do.

${keyStories.length > 0 ? `\n**Real-World Example:**\n${keyStories[0]}\n` : ''}

### Advanced Variations for ${level.charAt(0).toUpperCase() + level.slice(1)} Athletes

${getAdvancedVariation(topic, sport, 'A')}

${getAdvancedVariation(topic, sport, 'B')}

### Tactical Applications in Competition

Understanding the technique is one thing. Knowing WHEN to use it is what separates athletes who win from athletes who just train.

**Offensive Opportunities:**
${getOffensiveApplications(topic, sport)}

**Defensive Considerations:**
${getDefensiveApplications(topic, sport)}

**Transition Opportunities:**
${getTransitionOpportunities(topic, sport)}

---

## Part 3: Practice & Application (8 minutes)

### Progressive Drilling Sequence

${getSportSpecificDrills(sport, topic)}

### Live Competition Simulation

Now we take everything we've learned and apply it under pressure. This is where champions are made.

- Practice ${topic} with time constraints and fatigue
- Execute against multiple opponent styles/situations
- Make real-time decisions about when to use ${topic}
- Manage your energy and maintain technique quality under stress

The drill is the teacher. The game is the test. Train like you compete, compete like you train.

---

## Cool-Down & Integration (2 minutes)

### Key Takeaways - What to Remember

Your brain can only hold so much. Here are the three things I want you to remember from today:

1. **Primary Execution Cue:** ${getMainCue(topic, sport)}
2. **Most Common Mistake:** ${getMainMistake(sport)}
3. **Best Opportunity Signal:** ${getBestOpportunity(topic, sport)}

### Cool-Down Protocol

- Light stretching focusing on muscle groups used in ${topic}
- Breathing exercises for recovery (4-7-8 breathing pattern)
- Mental reflection: What felt good? What needs work?
- Hydration and nutrition within 30 minutes

### Practice Homework

Here's what I want you to work on before we meet again:

**Daily Practice (10 minutes):**
- 10 perfect repetitions of ${topic} setup phase - focus on quality, not speed
- Visualize ${topic} execution in 3 different game scenarios
- Watch video examples if available and identify the key moments

**Mental Preparation:**
- Before bed, mentally rehearse ${topic} execution 5 times
- See yourself succeeding, feel the movement, hear the sounds
- This mental practice is as important as physical reps

**Journal Prompt:**
Write down: "The one thing that clicked for me today about ${topic} was..."

${catchphrases.length > 1 ? `\n> **Closing thought:** ${catchphrases[1]}\n` : ''}

---

## Coach Notes & Adaptations

**Safety Reminders:**
- Monitor athletes for signs of fatigue - technique breaks down when tired
- Ensure proper hydration throughout session
- Watch for overexertion during live practice - ego can override good judgment

**Individual Adaptations:**
- Modify ${topic} technique for different body types and athletic backgrounds
- Adjust intensity based on experience level - push, don't break
- Provide additional support for struggling athletes - everyone learns at their own pace

**Assessment Criteria:**
- Technical execution accuracy (form first, speed second)
- Understanding of application principles (when to use it)
- Ability to adapt under pressure (can they adjust mid-execution?)
- Safety awareness and control (always)

---

**Final Word:**

${topic} is not just a technique - it's a weapon you add to your arsenal. Master it through deliberate practice, understand it through competition, and refine it through constant feedback.

${communicationStyle || 'Remember: Perfect practice makes perfect. See you at the next session.'}

---

*This lesson plan provides a comprehensive framework for mastering ${topic} in ${sport}. Adjust timing and intensity based on individual needs and facility constraints. The goal is not just to teach the technique, but to develop athletes who think, adapt, and excel under pressure.*
`
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
    'Brazilian Jiu-Jitsu': `- Guard pulling and hip mobility drills (2 min)\n- Bridging and shrimping movements (2 min)\n- Grip strength activation - dead hangs and gi grips (2 min)\n- Core stability exercises - planks and side planks (2 min)\n- Sport-specific movement patterns for ${topic} (2 min)`,
    'Wrestling': `- Stance and motion drills - forward, back, circle (2 min)\n- Penetration step practice without contact (2 min)\n- Hand fighting exercises with partner (2 min)\n- Mat awareness movements - sprawls and stand-ups (2 min)\n- Position-specific prep for ${topic} (2 min)`,
    'Boxing': `- Shadow boxing combinations - light and loose (3 min)\n- Footwork ladder patterns (2 min)\n- Hand speed activation - speed bag or air work (2 min)\n- Head movement drills - slip, roll, duck (2 min)\n- Combination flow preparing for ${topic} (1 min)`,
    'MMA': `- Mixed range movement patterns (2 min)\n- Stance switching drills - orthodox to southpaw (2 min)\n- Clinch position practice with partner (2 min)\n- Ground transition movements (2 min)\n- Flow drill incorporating ${topic} elements (2 min)`,
    'Baseball': `- Shoulder rotation and arm circles - forward and back (1 min)\n- Rotational core activation - med ball twists (2 min)\n- Throwing mechanics review - long toss progression (3 min)\n- Footwork and agility drills (2 min)\n- Position-specific movements for ${topic} (2 min)`,
    'Basketball': `- Dynamic stretching for legs and hips (2 min)\n- Jump activation exercises - pogos and broad jumps (2 min)\n- Ball handling warm-up (2 min)\n- Defensive stance movements and slides (2 min)\n- Movement patterns specific to ${topic} (2 min)`,
    'Football': `- Position-specific movement patterns (2 min)\n- Acceleration and deceleration drills (2 min)\n- Contact preparation exercises - pad level work (2 min)\n- Agility ladder work (2 min)\n- Formation-specific movements for ${topic} (2 min)`,
    'Soccer': `- Dynamic leg swings and stretches (2 min)\n- Footwork and ball control drills (2 min)\n- Acceleration and change of direction (2 min)\n- Passing accuracy warm-up (2 min)\n- Game-speed movements incorporating ${topic} (2 min)`
  }
  return warmups[normalizedSport] || `- Sport-specific movement patterns (2 min)\n- Range of motion exercises (2 min)\n- Activation drills (2 min)\n- Balance and coordination work (2 min)\n- Technique-specific prep for ${topic} (2 min)`
}

function getSetupPhase(sport: string, topic: string): string {
  const normalizedSport = normalizeSportName(sport)
  const setups: Record<string, string> = {
    'Football': `**Pre-Snap Preparation:**\n- Establish proper alignment and spacing based on your formation and assignment\n- Check your body position and balance - are you in your power position for ${topic}?\n- Verify field awareness - where are the threats? Where are your teammates?\n- Read the defensive alignment - what are they showing? What are they hiding?\n- Ensure proper hand placement (if applicable) and footwork for explosive first movement\n- Mental checklist: assignment, alignment, technique cues\n\nThe play starts before the snap. Your preparation in these seconds determines your success.`,
    'Soccer': `**Pre-Touch Positioning:**\n- Position yourself relative to the ball and field - angles are everything\n- Check your body orientation and balance - can you go multiple directions?\n- Verify foot positioning and weight distribution - loaded spring, not flat-footed\n- Ensure proper field vision and teammate awareness - scan before the ball arrives\n- Read defender positioning and pressure level - time and space available\n- Mental processing: Where's the space? Where's the threat? Where's my target?\n\nThe best players make decisions before receiving the ball, not after.`,
    'Basketball': `**Position Establishment:**\n- Establish proper court position and spacing - give yourself room to operate\n- Check ball security and hand placement - protect the ball in triple threat\n- Verify foot positioning and pivot foot (if applicable) - stay legal\n- Ensure awareness of defenders and teammates - use peripheral vision\n- Read your defender's positioning and balance - are they vulnerable?\n- Mental checklist: Where's help? Where's space? What's my best option?\n\nBasketball is a game of space and timing. Create space, recognize timing, execute decisively.`,
    'Baseball': `**Batter's Box Setup:**\n- Set your stance in the batter's box - find your power position\n- Check grip on bat and hand positioning - relaxed but ready\n- Verify foot positioning and weight distribution - balanced and athletic\n- Ensure proper eye tracking on pitcher - see the ball early\n- Mental preparation - know the count, know the situation, know the pitcher's tendencies\n- Timing mechanism ready - your trigger to start the swing\n\nHitting is about rhythm and timing. Find yours and trust it.`,
    'Brazilian Jiu-Jitsu': `**Position Before Submission:**\n- Establish proper positioning relative to opponent - position before submission\n- Check grip placement and pressure points - grips dictate attacks\n- Verify foot positioning and weight distribution - base equals power\n- Ensure optimal body alignment for force generation - use angles, not muscles\n- Read opponent's reactions and defensive posture - where are they vulnerable?\n- Mental chess: If they defend this, what's my next attack?\n\nJiu-jitsu is physical chess. Think two moves ahead.`,
    'Wrestling': `**Hand Fighting & Position:**\n- Establish control position and hand placement - inside control is gold\n- Check your base and balance - strong base stops their attacks\n- Verify proper pressure and leverage points - pressure creates openings\n- Ensure defensive awareness and positioning - attack and defend simultaneously\n- Read opponent's stance and pressure - are they reaching? Overextended?\n- Mental prep: Set up the setup. Chain your attacks.\n\nWrestling is won in the setup. Make them react to you.`,
    'Boxing': `**Ring Position & Stance:**\n- Set your stance with proper guard position - hands high, chin down\n- Check foot positioning and weight distribution - balanced but loaded\n- Verify range and distance management - can you hit without being hit?\n- Ensure proper defensive positioning and awareness - see punches coming\n- Read opponent's rhythm and patterns - timing beats speed\n- Mental focus: Setup, feint, execute\n\nBoxing is the sweet science. Technique over toughness.`,
    'MMA': `**Multi-Range Positioning:**\n- Establish proper range and stance - be ready for strikes and takedowns\n- Check positioning across all fighting ranges - stay versatile\n- Verify base, balance, and defensive readiness - never commit too much\n- Ensure proper setup for transition opportunities - from striking to grappling seamlessly\n- Read opponent's preferred range and style - force your game, deny theirs\n- Mental processing: What range am I in? What threats exist? What opportunities?\n\nMMA is about imposing your game while denying theirs. Be water, adapt constantly.`
  }
  return setups[normalizedSport] || `**Setup Fundamentals:**\n- Establish proper positioning for ${topic} - right place, right time\n- Check body alignment and balance - foundation is everything\n- Verify key contact points and placement - details matter\n- Ensure awareness of surroundings and timing - see the whole picture\n- Mental preparation: Know why you're doing what you're doing`
}

function getInitialMovement(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  // Keeping the existing detailed movement descriptions from previous version
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
  // ... (keep existing detailed transition descriptions)
  return `The transition to ${topic} requires reading the situation and timing your execution perfectly.`
}

function getForceApplication(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const applications: Record<string, string> = {
    'Football': `Execute the movement with explosive power, driving through your target with proper body control. Power comes from the ground up - push through your legs, drive your hips, transfer energy through your core. Stay low, stay powerful.`,
    'Soccer': `Apply force through proper ball contact - strike through the ball, not at it. Use your entire body in the motion - plant foot firm, swing leg accelerating, follow through complete. Ball contact determines everything.`,
    'Basketball': `Execute with controlled explosion - soft hands for finesse, strong body for power. Whether shooting, passing, or driving, your body should move as one coordinated unit. Rhythm and timing over raw strength.`,
    'Baseball': `Generate power through rotational mechanics - legs drive hips, hips rotate torso, torso whips arms/bat. The chain must be fluid and connected. Break one link, lose all power.`,
    'Brazilian Jiu-Jitsu': `Apply controlled, progressive force using leverage, not strength. Small adjustments in angle multiply your effective force dramatically. Pressure should build like a vice, not explode like a bomb.`,
    'Wrestling': `Use penetration, elevation, and back arch to complete the technique. Your entire body drives through the movement. Power combined with technique equals unstoppable force.`,
    'Boxing': `Deliver power through hip rotation and weight transfer, not arm strength. Snap, don't push. Your whole body is behind every meaningful punch. Speed creates power.`,
    'MMA': `Apply technique with proper force generation appropriate to the range. Striking uses rotation and weight transfer, grappling uses leverage and position. Switch between them seamlessly.`
  }
  return applications[normalizedSport] || `Execute the technique using proper mechanics and force generation specific to ${sport}.`
}

function getFollowThrough(topic: string, sport: string): string {
  const normalizedSport = normalizeSportName(sport)
  const followThroughs: Record<string, string> = {
    'Football': `Complete the play with proper finish and immediate transition. Never stop moving until the whistle. Finish strong, recover fast, prepare for next play.`,
    'Soccer': `Finish the movement with body control and immediate game awareness. Where's the ball going? Where are you needed next? One play flows into another.`,
    'Basketball': `Complete with proper landing mechanics and instant transition. Offense to defense in 3 seconds. Defense to offense in 2 seconds. Always moving, always ready.`,
    'Baseball': `Follow through with complete extension and balance. Don't stop the swing/throw early. Full range of motion equals full power and accuracy.`,
    'Brazilian Jiu-Jitsu': `Complete with control and immediate position assessment. Did it work? Secure position. Didn't work? Transition immediately. Never stay static.`,
    'Wrestling': `Secure the position aggressively. Pin their hips, control their head, establish your next attack immediately. One move leads to the next.`,
    'Boxing': `Return to guard position immediately. Hands up, chin down, feet moving. Defense never sleeps.`,
    'MMA': `Complete and transition to optimal position for your next action. Every technique ends where the next one begins. Flow state.`
  }
  return followThroughs[normalizedSport] || `Complete the movement with proper control and transition to next action.`
}

function getCommonMistakes(sport: string, topic: string): string {
  const normalizedSport = normalizeSportName(sport)
  const mistakes: Record<string, string> = {
    'Football': `**Mistake #1:** Poor initial stance or alignment\n**Fix:** Set your feet, check your stance, establish leverage BEFORE the snap\n\n**Mistake #2:** Rushing the timing or play development  \n**Fix:** Be patient, let the play develop, trust your training\n\n**Mistake #3:** Losing field awareness mid-play\n**Fix:** Keep your head on a swivel, process information constantly`,
    'Soccer': `**Mistake #1:** Poor ball positioning before execution\n**Fix:** Take an extra touch to set up properly - quality over speed\n\n**Mistake #2:** Rushing the technique\n**Fix:** One more second of patience creates twice the opportunity\n\n**Mistake #3:** Tunnel vision on the ball\n**Fix:** Scan, touch, scan again - awareness is everything`,
    'Basketball': `**Mistake #1:** Traveling or poor footwork\n**Fix:** Establish pivot foot, know where your feet are at all times\n\n**Mistake #2:** Forcing the move into traffic\n**Fix:** Read the defense, take what they give you\n\n**Mistake #3:** Off-balance execution\n**Fix:** Stay low, stay balanced, power comes from stability`,
    'Baseball': `**Mistake #1:** Dropping hands or collapsing back elbow\n**Fix:** Keep hands high, maintain bat path angle\n\n**Mistake #2:** Overstriding or poor weight transfer\n**Fix:** Controlled stride, weight stays back until commitment\n\n**Mistake #3:** Taking eyes off the ball\n**Fix:** See it hit the bat - literally track it all the way`,
    'Brazilian Jiu-Jitsu': `**Mistake #1:** Rushing the setup\n**Fix:** Position before submission - take your time\n\n**Mistake #2:** Using muscle instead of leverage\n**Fix:** If you're using all your strength, your angle is wrong\n\n**Mistake #3:** Forgetting defense while attacking\n**Fix:** Attack and defend simultaneously - always`,
    'Wrestling': `**Mistake #1:** Weak hand position or poor grips\n**Fix:** Fight for inside control first, attack second\n\n**Mistake #2:** High stance or poor base\n**Fix:** Lower wins - stay low, stay powerful\n\n**Mistake #3:** Telegraphing your attacks\n**Fix:** Set up the setup - make them guess`,
    'Boxing': `**Mistake #1:** Dropping guard after punching\n**Fix:** Hands up immediately - defense never stops\n\n**Mistake #2:** Square stance or poor foot positioning\n**Fix:** Stay at an angle, stay mobile\n\n**Mistake #3:** Overextending punches\n**Fix:** Punching range = hitting distance without reaching`,
    'MMA': `**Mistake #1:** One-dimensional approach\n**Fix:** Strike to set up grappling, grapple to set up strikes\n\n**Mistake #2:** Poor range management\n**Fix:** Control distance, dictate range, impose your game\n\n**Mistake #3:** Neglecting defense\n**Fix:** Every attack must have a defensive contingency`
  }
  return mistakes[normalizedSport] || `**Mistake:** Rushing the technique\n**Fix:** Slow is smooth, smooth is fast - master the fundamentals`
}

function getAdvancedVariation(topic: string, sport: string, variation: string): string {
  if (variation === 'A') {
    return `**Speed & Timing Variation:** Execute ${topic} with increased tempo and sharper timing. This variation focuses on quick recognition and instant execution. Use this when opponents are slower to react or when you have a speed advantage. Key: maintain technique even as speed increases.`
  } else {
    return `**Power & Precision Variation:** Execute ${topic} with emphasis on maximum force and pinpoint accuracy. This variation sacrifices some speed for devastating effectiveness. Use this when you have position advantage or when one perfect rep is better than multiple good ones. Key: quality of execution over quantity of attempts.`
  }
}

function getOffensiveApplications(topic: string, sport: string): string {
  return `Use ${topic} when you recognize opponent vulnerability or situational opportunity. Look for: defensive overcommitment, positional advantages, timing windows, or pattern breaks. The best offense is opportunistic - recognize and capitalize instantly.`
}

function getDefensiveApplications(topic: string, sport: string): string {
  return `While executing ${topic}, maintain awareness of counter-attacks and defensive responsibilities. Every offensive action creates defensive vulnerability. Know what you're exposing and be ready to defend it. Attack smart, not reckless.`
}

function getTransitionOpportunities(topic: string, sport: string): string {
  return `${topic} should flow seamlessly into your next action. Chain techniques together - if this works, what's next? If they defend, what's my counter? Think three moves ahead. The technique is just one link in the chain.`
}

function getSportSpecificDrills(sport: string, topic: string): string {
  const normalizedSport = normalizeSportName(sport)
  const drills: Record<string, string> = {
    'Brazilian Jiu-Jitsu': `**Drill 1: Technical Repetition (3 min)**\nPartners alternate executing ${topic} - 10 reps each side. Focus on perfect form. Coach corrects immediately. Quality over quantity.\n\n**Drill 2: Progressive Resistance (3 min)**\nSame technique, add 25% resistance, then 50%, then 75%. Build your ability to execute under pressure. Form shouldn't change as resistance increases.\n\n**Drill 3: Live Application (2 min)**\nFree roll but hunt specifically for ${topic} opportunities. Set it up, see the opening, take it. Real-time recognition and execution.`,
    'Wrestling': `**Drill 1: Technical Drilling (3 min)**\nPartners alternate - 10 reps each. Perfect form, no resistance. Learn the pathway.\n\n**Drill 2: Live Resistance (3 min)**\nSame setup, now partner defends at 50-75%. Work through the defense. Adapt and overcome.\n\n**Drill 3: Live Wrestling (2 min)**\nOpen wrestling but actively hunt for ${topic}. Set it up with hand fighting and movement. Execute when you see it.`,
    'Boxing': `**Drill 1: Shadow Boxing (3 min)**\nFlow through ${topic} combinations. Perfect form, perfect rhythm. See the opponent in your mind.\n\n**Drill 2: Heavy Bag (3 min)**\nFull power ${topic} combinations on the bag. Build the muscle memory under resistance. Power with precision.\n\n**Drill 3: Mitt Work (2 min)**\nCoach calls for ${topic} at random moments. React instantly, execute perfectly. This builds real-time recognition.`,
    'MMA': `**Drill 1: Technical Flow (3 min)**\nDrill ${topic} across all ranges. Striking to clinch to ground. Learn the full spectrum.\n\n**Drill 2: Resistance Drilling (3 min)**\nAdd progressive resistance to ${topic}. Partner defends intelligently. Work the problem.\n\n**Drill 3: Live Training (2 min)**\nSpar/roll with focus on ${topic} application. Use it or lose it. Real speed, real pressure.`
  }
  return drills[normalizedSport] || `**Practice Progression:**\n\n1. Technical reps with zero resistance - learn the pattern\n2. Add progressive resistance - build under pressure\n3. Live application - execute in chaos\n\nThis is how champions are built.`
}

function getMainCue(topic: string, sport: string): string {
  return `Setup first, then execute - never rush the foundation of ${topic}`
}

function getMainMistake(sport: string): string {
  return `Rushing the technique instead of trusting the process`
}

function getBestOpportunity(topic: string, sport: string): string {
  return `When you see the opening clearly and your body position is optimal - that's your moment`
}
