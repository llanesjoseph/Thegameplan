# 🤖 Dynamic AI Coaching System Documentation

## Overview

The AI coaching system is **100% dynamic** and works for ANY coach on the platform - no hardcoding required. Each coach gets a personalized AI assistant based on their profile, lessons, sport, and voice characteristics.

---

## How It Works (Step-by-Step)

### 1. **Athlete Opens AI Assistant**
When an athlete clicks on their coach's AI Assistant card in the dashboard:

```typescript
// app/dashboard/progress/page.tsx (line 566-596)
<AIAssistant
  mode="inline"
  userId={user.uid}
  userEmail={user.email || ''}
  sport="Brazilian Jiu-Jitsu"
  creatorId={coachId}              // 👈 DYNAMIC: Coach's user ID
  creatorName={coachName}          // 👈 DYNAMIC: Coach's display name
  requireLegalConsent={true}
/>
```

**Key Points:**
- `creatorId` = Coach's unique Firebase user ID
- `creatorName` = Coach's display name from Firestore
- `sport` = Passed as "Brazilian Jiu-Jitsu" but system fetches actual sport from coach profile

---

### 2. **AI Assistant Sends Request to API**
The AIAssistant component sends a POST request with the coach's ID:

```typescript
// components/AIAssistant.tsx (line 285-300)
const response = await fetch('/api/ai-coaching', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: messageToSend,
    userId: userId,
    userEmail: userEmail,
    sessionId: sessionId,
    sport: sport,
    creatorId: creatorId,        // 👈 DYNAMIC: Coach ID
    creatorName: creatorName,    // 👈 DYNAMIC: Coach name
    disclaimerAccepted: hasAcceptedTerms,
    userConsent: hasAcceptedTerms
  }),
})
```

---

### 3. **API Fetches Coach-Specific Context**
The API endpoint dynamically builds context for that specific coach:

```typescript
// app/api/ai-coaching/route.ts (line 166)
const context = await getEnhancedCoachingContext(creatorId, sport)
console.log(`🎯 Using enhanced coaching context for: ${context.coachName} (${context.sport})`)
```

**What `getEnhancedCoachingContext` Does:**

#### **Priority 1: Try Dynamic Coach Profile from Firestore**
```typescript
// lib/ai-service.ts (line 430-435)
const { getDynamicCoachingContext } = await import('./dynamic-coach-context')
const dynamicContext = await getDynamicCoachingContext(creatorId)

if (dynamicContext) {
  console.log(`✨ Using DYNAMIC coaching context for: ${dynamicContext.coachName} (${dynamicContext.sport})`)
  return dynamicContext
}
```

#### **Priority 2: Fall Back to Static Registry**
If dynamic profile fails (rare), falls back to sport-based static context:
```typescript
// lib/ai-service.ts (line 443)
const baseContext = getCoachingContext(creatorId, sport)
```

#### **Priority 3: Enhance with Voice Profile**
```typescript
// lib/ai-service.ts (line 448-452)
const voiceProfile = await getVoiceProfile(creatorId)
if (voiceProfile && voiceProfile.completenessScore > 30) {
  return enhanceCoachingContextWithVoice(baseContext, voiceProfile)
}
```

---

### 4. **Building Dynamic Coach Context**

The system searches multiple Firestore collections to find the coach's profile:

```typescript
// lib/dynamic-coach-context.ts (line 365-392)
let coachDoc = await adminDb.collection('coaches').doc(coachId).get()

if (!coachDoc.exists) {
  coachDoc = await adminDb.collection('coach_profiles').doc(coachId).get()
}

if (!coachDoc.exists) {
  coachDoc = await adminDb.collection('creator_profiles').doc(coachId).get()
}

if (!coachDoc.exists) {
  coachDoc = await adminDb.collection('creatorPublic').doc(coachId).get()
}

// ⚡ CRITICAL: Also check users collection
if (!coachDoc.exists) {
  coachDoc = await adminDb.collection('users').doc(coachId).get()
}
```

**Coach Profile Data Extracted:**
```typescript
// lib/dynamic-coach-context.ts (line 263-268)
const displayName = coachData.displayName || coachData.name || 'Coach'
const sport = coachData.sport || 'General Coaching'
const bio = coachData.bio || coachData.tagline || ''
const credentials = coachData.certifications || coachData.credentials || []
const specialties = coachData.specialties || []
const experience = coachData.experience || ''
```

---

### 5. **Fetching Coach's Actual Lessons**

The system pulls the coach's real published content:

```typescript
// lib/dynamic-coach-context.ts (line 29-36)
const lessonsSnapshot = await adminDb
  .collection('content')
  .where('creatorUid', '==', coachId)     // 👈 DYNAMIC: Coach's lessons only
  .where('status', '==', 'published')
  .limit(15)
  .get()
```

**Extracts from Lessons:**
- ✅ Lesson titles (text and video)
- ✅ Techniques from sections
- ✅ Full content and descriptions
- ✅ Video metadata
- ✅ Tags and keywords

**Example Output:**
```javascript
{
  techniques: ["Guard Passing", "Triangle Choke", "Armbar"],
  lessonTitles: ["How to Pass Guard [Text]", "Triangle Setup [Video]"],
  fullContent: ["Step 1: Control the sleeve...", "From closed guard..."],
  videoLessons: 5,
  textLessons: 8,
  hasContent: true
}
```

---

### 6. **Sport-Specific Fallback System**

If a brand new coach has **no lessons yet**, the system uses sport-specific fundamentals:

```typescript
// lib/dynamic-coach-context.ts (line 142-177)
const sportContent = {
  'bjj': {
    techniques: [
      'Guard Passing Fundamentals', 'Escapes from Side Control',
      'Submission Defense', 'Positional Control', ...
    ],
    fundamentals: [
      'Position before submission', 'Base and posture management',
      'Breathing and energy conservation', ...
    ],
    commonTopics: [
      'How to improve guard retention', 'Dealing with bigger opponents',
      'Competition preparation', ...
    ]
  },
  'soccer': { ... },
  'basketball': { ... },
  // etc
}
```

**This means:**
- ✅ New coaches can use AI immediately
- ✅ AI gives sport-appropriate advice
- ✅ No generic responses
- ✅ Advice gets BETTER as coaches add lessons

---

### 7. **Final Context Structure**

The system builds a complete coaching context:

```typescript
// lib/dynamic-coach-context.ts (line 317-333)
const baseContext = {
  sport: "Brazilian Jiu-Jitsu",                    // 👈 From coach profile
  coachName: "Joseph Llanes",                     // 👈 From coach profile
  coachCredentials: ["3 Video Lessons", "5 Text Lessons"],
  expertise: ["Guard Passing", "Triangle Choke", ...],
  personalityTraits: ["technical", "patient", "philosophical"],
  voiceCharacteristics: {
    tone: "Calm and philosophical",
    pace: "Patient with technical emphasis",
    catchphrases: ["Technique over strength", "Position before submission"]
  },
  responseStyle: {
    greeting: "Joseph Llanes here - let's train!",
    signatureClosing: "Oss! Keep training"
  },
  lessonContent: {
    availableLessons: ["Guard Passing Basics", ...],
    techniques: ["Triangle Choke", "Armbar", ...],
    contentSamples: ["Step 1: Control their sleeve...", ...]
  }
}
```

---

## System Capabilities

### ✅ Works For Any Coach

| Coach Type | What Happens |
|------------|--------------|
| **Coach with 10+ lessons** | AI uses actual lesson content - highly specific |
| **Coach with 3 lessons** | AI uses those 3 lessons + sport fallback |
| **Brand new coach (0 lessons)** | AI uses sport-specific fundamentals |
| **Coach with voice profile** | AI adopts their speaking style and personality |

### ✅ Supports Any Sport

Pre-configured sports:
- Brazilian Jiu-Jitsu (BJJ)
- MMA
- Soccer
- Basketball
- Football
- Tennis
- Baseball
- Hockey

**AND** any custom sport - will use generic coaching fundamentals.

### ✅ Dynamic Caching

```typescript
// app/api/ai-coaching/route.ts (line 176)
const cacheKey = `v2_${context.coachName}|${creatorId}|${question}`
```

Each coach gets their own cache - responses are coach-specific!

---

## How to Add a New Coach

### Step 1: Create Coach Profile in Firestore

Add to `users` collection:
```json
{
  "displayName": "Mike Johnson",
  "email": "mike@example.com",
  "sport": "MMA",
  "bio": "10 years MMA coaching experience",
  "role": "creator"
}
```

### Step 2: Add Lessons (Optional)

Add to `content` collection:
```json
{
  "creatorUid": "mike-user-id",
  "title": "Jab-Cross Combination",
  "sport": "MMA",
  "content": "Step 1: Set up with your jab...",
  "status": "published"
}
```

### Step 3: That's It!

The AI automatically:
- ✅ Finds Mike's profile
- ✅ Uses his MMA sport
- ✅ Extracts his lesson content
- ✅ Uses MMA-specific voice characteristics
- ✅ Creates personalized responses

**No code changes needed!**

---

## Testing Multiple Coaches

Use the verification script:

```bash
node verify-joseph-profile.js
```

Modify it to test any coach:
```javascript
const usersSnap = await db.collection('users')
  .where('email', '==', 'any-coach@example.com')  // 👈 Change this
  .limit(1)
  .get()
```

---

## Cache Management

### Clear Cache for Specific Coach
```bash
curl -X POST http://localhost:3000/api/clear-coach-cache \
  -H "Content-Type: application/json" \
  -d '{"coachId": "coach-user-id"}'
```

### Clear All Caches
```bash
curl -X POST http://localhost:3000/api/clear-coach-cache \
  -H "Content-Type: application/json"
```

Or restart the dev server:
```bash
# Kill server, then:
npm run dev
```

---

## Verification Checklist

To verify the system is working for a coach:

1. ✅ Check coach profile exists in Firestore
2. ✅ Verify sport field is set correctly
3. ✅ Check if coach has published lessons
4. ✅ Test AI assistant from athlete dashboard
5. ✅ Verify AI uses correct sport terminology
6. ✅ Check console logs for "Using dynamic context"

**Console Output Should Show:**
```
✅ Found coach profile in users collection: [coach-id]
🔨 Building ENHANCED dynamic context for coach: John Doe
📚 Fetching ALL lesson content (text + video) for coach: [coach-id]
✅ Found 5 lessons (2 video, 3 text) with 10 content sections
🎯 Context built with 2 video + 3 text lessons, 15 techniques
✨ Using DYNAMIC coaching context for: John Doe (Basketball)
🎯 Using enhanced coaching context for: John Doe (Basketball)
```

---

## Summary

**The AI Coaching System is 100% Dynamic:**

1. ✅ Uses coach's unique ID from athlete's profile
2. ✅ Fetches coach profile from Firestore dynamically
3. ✅ Extracts coach's actual sport and lessons
4. ✅ Builds personalized context per coach
5. ✅ Uses sport-specific fallbacks when needed
6. ✅ Caches per-coach for performance
7. ✅ Works for ANY coach on the platform
8. ✅ NO hardcoding required

**Result:** Every coach gets a unique AI assistant that speaks in their sport's language, references their actual lessons, and provides specific technical advice - automatically! 🚀
