import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, description, sport, existingContent, contentType, level, topic } = await request.json()

    // Support both old format (title/description) and new format (contentType/topic/level)
    const lessonTitle = title || topic || 'General Training'
    const lessonDescription = description || `Training session for ${sport}`
    const lessonSport = sport

    if (!lessonSport) {
      return NextResponse.json(
        { error: 'Sport is required' },
        { status: 400 }
      )
    }

    // If contentType is 'objectives', generate objectives specifically
    if (contentType === 'objectives') {
      const objectives = generateObjectives(lessonSport, level, lessonTitle)
      return NextResponse.json({
        success: true,
        objectives
      })
    }

    // Generate comprehensive lesson content using AI
    const lessonContent = await generateLessonContent(lessonTitle, lessonDescription, lessonSport, existingContent)

    return NextResponse.json({
      success: true,
      lessonContent
    })

  } catch (error) {
    console.error('Generate lesson content error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson content' },
      { status: 500 }
    )
  }
}

function generateObjectives(sport: string, level: string, topic: string) {
  const sportInfo = getSportSpecificInfo(sport)

  // Generate level-appropriate objectives
  const levelPrefix = level === 'beginner' ? 'Learn and practice' :
                     level === 'intermediate' ? 'Master and apply' :
                     'Refine and perfect'

  return [
    `${levelPrefix} fundamental ${topic.toLowerCase()} techniques in ${sportInfo.name}`,
    `Demonstrate proper form and technique during ${topic.toLowerCase()} drills`,
    `Apply ${topic.toLowerCase()} skills in realistic game scenarios`,
    `Understand the strategic importance of ${topic.toLowerCase()} in ${sportInfo.name}`
  ]
}

async function generateLessonContent(title: string, description: string, sport: string, existingContent: string = '') {
  // Get sport-specific information
  const sportInfo = getSportSpecificInfo(sport)

  // Determine if we're expanding existing content or creating new
  const isExpanding = existingContent.length > 0

  let enhancedContent = ''

  if (isExpanding) {
    // AI is expanding existing content - preserve what's there and enhance it
    enhancedContent = `## Lesson Plan: ${title}

This lesson focuses on ${description.toLowerCase()}, building on the foundation you've already established.

**Objective:** By the end of this session, students will be able to confidently ${description.toLowerCase()} and apply these skills in realistic scenarios.

**Materials Needed:** ${sportInfo.equipment.slice(0, 3).join(', ')}.

---

### Your Existing Content

${existingContent}

---

### Enhanced Structure & Drills

#### 1. Warm-Up & Introduction (10 minutes)

Start by explaining the core concepts of ${title.toLowerCase()}. The goal is to ${description.toLowerCase()} while maintaining proper ${sportInfo.name} fundamentals.

* **Key Concept:** "${sportInfo.name} is about precision and timing - every movement should have purpose."
* **Warm-up Drills:**
${sportInfo.warmup.slice(0, 3).map((drill: string) => `    * ${drill}`).join('\n')}

#### 2. Core Technique Development (20 minutes)

Break down the technique into manageable components.

**Step 1: Foundation Position**
* Establish proper ${sportInfo.terminology[0]} position
* Focus on ${sportInfo.techniques[0]} fundamentals
* **Drill:** Partner practice with controlled resistance (5 minutes)

**Step 2: Progressive Application**
* Add ${sportInfo.techniques[1]} elements
* Emphasize ${sportInfo.terminology[1]} principles
* **Drill:** Situational practice with increasing intensity (10 minutes)

**Step 3: Integration & Flow**
* Combine all elements smoothly
* Focus on timing and precision
* **Drill:** Live practice with feedback (5 minutes)

#### 3. Application & Sparring (15 minutes)

Apply the techniques in realistic scenarios.

* **Controlled Sparring:** 3-minute rounds focusing on the lesson technique
* **Reset & Feedback:** Quick coaching between rounds
* **Progressive Intensity:** Start at 50%, build to 80%

---

### Safety Notes
${sportInfo.safetyNotes.slice(0, 2).map((note: string) => `* ${note}`).join('\n')}

### Homework Assignment
1. Practice the foundation position for 10 minutes daily
2. Watch video examples of professional ${sportInfo.name} athletes
3. Journal about what felt most challenging

---

*This enhanced lesson plan builds on your existing content while adding structure and sport-specific elements.*`

  } else {
    // AI is creating new content from scratch - keep it simple and actionable
    enhancedContent = `## Lesson Plan: ${title}

This lesson focuses on ${description.toLowerCase()}, providing a clear path from basics to application.

**Objective:** By the end of this session, students will confidently ${description.toLowerCase()} and apply these skills in realistic ${sportInfo.name} scenarios.

**Materials Needed:** ${sportInfo.equipment.slice(0, 4).join(', ')}.

---

### 1. Introduction & Warm-Up (10 minutes)

Start by explaining why ${title.toLowerCase()} is crucial in ${sportInfo.name}. It's not just about technique - it's about **understanding when and how to apply it effectively**.

* **Key Concept:** "In ${sportInfo.name}, timing and positioning are everything. Master these fundamentals first."
* **Warm-up Drills:**
${sportInfo.warmup.slice(0, 3).map((drill: string) => `    * ${drill}`).join('\n')}
    * Mental focus and visualization

---

### 2. The Three Pillars of ${title} (20 minutes)

Break down the technique into three core components that students can master step by step.

#### **Pillar 1: Foundation & Setup**
Your success starts with proper positioning.
* **Action:** Establish correct ${sportInfo.terminology[0]} position
* **Focus:** ${sportInfo.techniques[0]} fundamentals
* **Drill:** Partner A establishes position, Partner B provides controlled resistance. Focus on stability and control for 3 minutes, then switch.

#### **Pillar 2: Execution & Timing**
The technique itself must be precise and well-timed. ⚡
* **Action:** Apply ${sportInfo.techniques[1]} with proper ${sportInfo.terminology[1]} principles
* **Focus:** Smooth execution and correct timing
* **Drill:**
    1. Partner A demonstrates the technique slowly
    2. Partner B offers progressive resistance
    3. Practice 10 repetitions, then switch roles

#### **Pillar 3: Follow-Through & Control**
Finish strong and maintain advantage.
* **Action:** Complete the technique and establish dominant position
* **Focus:** Control and next-step options
* **Drill:** **"Complete the Sequence"** - Execute the full technique from setup to finish, emphasizing smooth transitions and control.

---

### 3. Live Application (15 minutes)

Apply the concepts in controlled, realistic scenarios.

* **Goal for Active Player:** Successfully execute the lesson technique
* **Goal for Partner:** Provide realistic resistance while staying safe
* **Format:** 2-minute rounds with 30-second rest and feedback

Start at 60% intensity and gradually increase based on student comfort and skill level.

---

### Key Safety Reminders
${sportInfo.safetyNotes.slice(0, 3).map((note: string) => `* ${note}`).join('\n')}

### Practice Assignment
1. **Technical Practice:** 15 minutes daily focusing on Pillar 1 (foundation)
2. **Video Study:** Watch 2 professional examples of this technique
3. **Reflection:** Write one paragraph about what felt most challenging

---

**Next Lesson Preview:** We'll build on this foundation by adding variations and defensive counters.

*This lesson plan focuses on practical application while building solid fundamentals step by step.*`
  }

  return {
    content: enhancedContent,
    sections: [], // Simplified for now
    learningObjectives: sportInfo.objectives,
    prerequisites: sportInfo.prerequisites
  }
}

function getSportSpecificInfo(sport: string) {
  const sportKey = sport.toLowerCase()

  const sportData: Record<string, any> = {
    'bjj': {
      name: 'Brazilian Jiu-Jitsu',
      equipment: ['Gi or No-Gi attire', 'BJJ belt', 'Grappling mats', 'Water bottle', 'Towel'],
      techniques: ['Guard work', 'Submissions', 'Escapes', 'Transitions', 'Takedowns', 'Sweeps'],
      terminology: ['Guard', 'Mount', 'Side control', 'Back control', 'Half guard', 'Butterfly guard', 'Submissions', 'Taps'],
      warmup: ['Joint mobility', 'Shrimping', 'Hip escapes', 'Forward/backward rolls', 'Bridging exercises'],
      objectives: [
        'Execute proper guard retention and recovery techniques',
        'Apply fundamental submission techniques with correct leverage',
        'Demonstrate effective escape techniques from dominant positions',
        'Understand and apply basic BJJ positional hierarchy'
      ],
      prerequisites: 'Basic understanding of BJJ positions, proper tapping etiquette, appropriate fitness level for ground work',
      safetyNotes: [
        'Always tap immediately when caught in submissions',
        'Communicate with partner about intensity level',
        'Proper hygiene and clean training attire required',
        'No shoes on mats, trim fingernails and toenails'
      ]
    },
    'soccer': {
      name: 'Soccer/Football',
      equipment: ['Soccer ball', 'Cleats', 'Shin guards', 'Cones', 'Goals', 'Pinnies/bibs'],
      techniques: ['Passing', 'Shooting', 'Dribbling', 'Defending', 'Heading', 'First touch'],
      terminology: ['Touch', 'Through ball', 'Cross', 'Tackle', 'Offside', 'Set piece'],
      warmup: ['Light jogging', 'Dynamic stretching', 'Ball touches', 'Passing in pairs'],
      objectives: [
        'Execute accurate passes under pressure',
        'Demonstrate proper shooting technique and placement',
        'Apply effective 1v1 defending principles',
        'Show improved first touch and ball control'
      ],
      prerequisites: 'Basic ball handling skills, understanding of field positions, appropriate fitness level',
      safetyNotes: [
        'Proper shin guard usage mandatory',
        'Check field for hazards before practice',
        'Stay hydrated especially in hot weather',
        'Communicate with teammates to avoid collisions'
      ]
    },
    'basketball': {
      name: 'Basketball',
      equipment: ['Basketball', 'Court', 'Hoops', 'Cones', 'Scrimmage vests'],
      techniques: ['Shooting', 'Dribbling', 'Passing', 'Defense', 'Rebounding', 'Footwork'],
      terminology: ['Pick and roll', 'Fast break', 'Zone defense', 'Triple threat', 'Box out'],
      warmup: ['Dynamic stretching', 'Layup lines', 'Ball handling drills', 'Light shooting'],
      objectives: [
        'Execute proper shooting form with consistent follow-through',
        'Demonstrate effective ball handling with both hands',
        'Apply fundamental defensive stance and positioning',
        'Show improved passing accuracy and decision-making'
      ],
      prerequisites: 'Basic dribbling ability, understanding of court positions, cardiovascular fitness',
      safetyNotes: [
        'Proper basketball shoes with ankle support',
        'Clear communication during scrimmages',
        'Controlled contact, avoid unnecessary fouls',
        'Stay aware of other players and court boundaries'
      ]
    },
    'football': {
      name: 'Football',
      equipment: ['Football', 'Helmet', 'Pads', 'Cleats', 'Cones', 'Blocking sleds'],
      techniques: ['Blocking', 'Tackling', 'Catching', 'Route running', 'Passing', 'Footwork'],
      terminology: ['Down', 'Blitz', 'Play action', 'Screen pass', 'Zone coverage', 'Man coverage'],
      warmup: ['Dynamic stretching', 'Agility ladder', 'Position-specific drills', 'Light catching'],
      objectives: [
        'Execute proper tackling technique with head safety',
        'Demonstrate effective blocking form and footwork',
        'Apply route running concepts with proper timing',
        'Show improved catching technique and hand-eye coordination'
      ],
      prerequisites: 'Understanding of basic positions, proper equipment fitting, cardiovascular fitness',
      safetyNotes: [
        'Proper helmet and pad fitting mandatory',
        'Practice proper tackling technique to avoid head injuries',
        'Clear communication during contact drills',
        'Stay hydrated and recognize heat exhaustion signs'
      ]
    },
    'baseball': {
      name: 'Baseball',
      equipment: ['Baseball', 'Glove', 'Bat', 'Helmet', 'Bases', 'Batting tee'],
      techniques: ['Hitting', 'Pitching', 'Fielding', 'Base running', 'Throwing', 'Catching'],
      terminology: ['Fastball', 'Curve', 'Slider', 'Bunt', 'Double play', 'Stolen base'],
      warmup: ['Arm circles', 'Light toss', 'Base running', 'Soft ground balls'],
      objectives: [
        'Execute proper batting stance and swing mechanics',
        'Demonstrate correct throwing and catching form',
        'Apply fundamental fielding techniques',
        'Show improved pitching mechanics and control'
      ],
      prerequisites: 'Basic throwing ability, understanding of field positions, hand-eye coordination',
      safetyNotes: [
        'Proper helmet usage when batting',
        'Clear communication on fly balls',
        'Watch for wild pitches and foul balls',
        'Proper sliding technique to avoid injuries'
      ]
    },
    'volleyball': {
      name: 'Volleyball',
      equipment: ['Volleyball', 'Net', 'Court', 'Knee pads', 'Ankle braces'],
      techniques: ['Serving', 'Passing', 'Setting', 'Hitting', 'Blocking', 'Digging'],
      terminology: ['Ace', 'Kill', 'Dig', 'Set', 'Rotation', 'Libero'],
      warmup: ['Light jogging', 'Shoulder circles', 'Passing pairs', 'Setting practice'],
      objectives: [
        'Execute consistent overhand serves with accuracy',
        'Demonstrate proper passing platform and form',
        'Apply effective hitting approach and arm swing',
        'Show improved defensive positioning and digging'
      ],
      prerequisites: 'Basic hand-eye coordination, understanding of court positions, jumping ability',
      safetyNotes: [
        'Proper knee pad usage recommended',
        'Clear communication to avoid collisions',
        'Watch for net contact violations',
        'Maintain awareness of other players'
      ]
    },
    'tennis': {
      name: 'Tennis',
      equipment: ['Tennis racquet', 'Tennis balls', 'Court', 'Net', 'Ball hopper'],
      techniques: ['Forehand', 'Backhand', 'Serve', 'Volley', 'Overhead', 'Footwork'],
      terminology: ['Ace', 'Deuce', 'Love', 'Rally', 'Topspin', 'Slice'],
      warmup: ['Light jogging', 'Arm circles', 'Shadow swings', 'Mini tennis'],
      objectives: [
        'Execute consistent groundstrokes with proper form',
        'Demonstrate effective serve technique and placement',
        'Apply net play fundamentals with volleys and overheads',
        'Show improved court positioning and movement'
      ],
      prerequisites: 'Basic racquet grip, understanding of court boundaries, cardiovascular fitness',
      safetyNotes: [
        'Proper court shoes to prevent slipping',
        'Stay hydrated especially in hot weather',
        'Clear balls from court to prevent tripping',
        'Communicate during doubles play'
      ]
    }
  }

  // Default to general if sport not found
  return sportData[sportKey] || {
    name: sport,
    equipment: ['Sport-specific equipment', 'Appropriate athletic wear', 'Water bottle'],
    techniques: ['Fundamental skills', 'Basic techniques', 'Game application'],
    terminology: ['Sport-specific terms'],
    warmup: ['Dynamic warm-up', 'Sport-specific movement prep'],
    objectives: [
      `Understand fundamental concepts of ${sport}`,
      'Apply proper technique and form',
      'Execute skills in practical scenarios',
      `Demonstrate improved ${sport} performance`
    ],
    prerequisites: `Basic understanding of ${sport} fundamentals, appropriate equipment, physical readiness`,
    safetyNotes: [
      'Follow all safety protocols',
      'Use appropriate protective equipment',
      'Communicate with teammates and coaches',
      'Stay hydrated and take breaks as needed'
    ]
  }
}