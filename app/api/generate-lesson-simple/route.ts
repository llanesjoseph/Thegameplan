import { NextRequest, NextResponse } from 'next/server'

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

    return NextResponse.json({
      success: true,
      markdownContent,
      lessonPlan: {
        title: `${sport}: ${topic}`,
        objective: `Master ${topic} techniques and application in ${sport}`,
        duration,
        sport,
        level,
        parts: [
          {
            partTitle: "Warm-Up & Fundamentals",
            description: `Comprehensive warm-up and fundamental review for ${topic}`,
            duration: "10 minutes"
          },
          {
            partTitle: "Technical Instruction",
            description: `Detailed technical breakdown of ${topic} techniques`,
            duration: "25 minutes"
          },
          {
            partTitle: "Practice & Application",
            description: `Live practice and real-world application of ${topic}`,
            duration: "8 minutes"
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

function getSportSpecificWarmup(sport: string, topic: string): string {
  const warmups = {
    'Brazilian Jiu-Jitsu': `- Guard pulling and hip mobility drills\n- Bridging and shrimping movements\n- Grip strength activation\n- Core stability exercises`,
    'Wrestling': `- Stance and motion drills\n- Penetration step practice\n- Hand fighting exercises\n- Mat awareness movements`,
    'Boxing': `- Shadow boxing combinations\n- Footwork ladder patterns\n- Hand speed activation\n- Head movement drills`,
    'MMA': `- Mixed range movement patterns\n- Stance switching drills\n- Clinch position practice\n- Ground transition movements`
  }
  return warmups[sport as keyof typeof warmups] || `- Sport-specific movement patterns\n- Range of motion exercises\n- Activation drills\n- Balance and coordination work`
}

function getInitialMovement(topic: string, sport: string): string {
  return `Begin with deliberate positioning, ensuring you have established the proper grip and stance for ${topic} execution in ${sport}.`
}

function getTransitionPoint(topic: string, sport: string): string {
  return `Identify the optimal moment when your opponent's balance or position allows for ${topic} application.`
}

function getForceApplication(topic: string, sport: string): string {
  return `Apply controlled, progressive force using proper body mechanics and leverage principles specific to ${topic}.`
}

function getFollowThrough(topic: string, sport: string): string {
  return `Complete the movement with proper control and transition to advantageous position or next technique sequence.`
}

function getAdvancedVariation(topic: string, sport: string, variation: string): string {
  return `Advanced ${topic} variation focusing on ${variation === 'A' ? 'speed and timing' : 'power and precision'} for competitive application.`
}

function getOffensiveApplications(topic: string, sport: string): string {
  return `Use ${topic} when opponent shows specific openings or defensive patterns common in ${sport} competition.`
}

function getDefensiveApplications(topic: string, sport: string): string {
  return `Recognize when opponents might attempt to counter ${topic} and maintain defensive awareness throughout execution.`
}

function getTransitionOpportunities(topic: string, sport: string): string {
  return `Seamlessly connect ${topic} to follow-up techniques and position transitions typical in ${sport} flow.`
}