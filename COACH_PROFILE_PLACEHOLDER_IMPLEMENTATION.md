# Coach Profile Placeholder System - Implementation Guide

**Date:** 2025-10-13
**Status:** ✅ Implemented and Ready for Customization

---

## 🎯 What Was Implemented

A smart placeholder system that automatically displays professional default content for coach profiles that have minimal information (no bio, no lessons, no credentials).

### When Placeholder Shows:
The placeholder view appears when a coach profile has:
- ❌ No bio (or bio < 50 characters)
- ❌ No published lessons
- ❌ No certifications
- ❌ No achievements

### Smart Stats Display:
Even when showing full profiles, empty stats now display friendly text instead of zeros:
- **Lessons:** `Coming Soon` instead of `0`
- **Athletes:** `Ready to Coach` instead of `0`
- **Rating:** `New Coach` instead of `5.0` (when no athletes yet)

---

## 📁 Files Modified/Created

### New Components:
1. **`components/coach/CoachProfilePlaceholder.tsx`**
   - Complete placeholder component with professional design
   - Shows "Coming Soon" sections for About, Specialties, Professional Background, and Lessons
   - Includes welcome note explaining coach is setting up profile

### Updated Files:
2. **`app/coach/[id]/page.tsx`**
   - Added `isProfileMinimal()` helper function to detect incomplete profiles
   - Integrated placeholder component
   - Updated stats grid to show friendly text for zeros
   - Added conditional rendering: placeholder for minimal profiles, full content for complete profiles

---

## 🎨 Current Placeholder Design

The current placeholder includes these sections:

### 1. About Section
- Dashed border card
- FileText icon
- Message: "{Coach Name} is setting up their profile"
- Subtitle: "Check back soon to learn more..."

### 2. Primary Focus Areas (Specialties)
- Shows sport-specific message
- 3 generic badges: "Training & Skill Development", "Performance Enhancement", "Conditioning"
- Note: "Specific specialties will be added soon"

### 3. Professional Background
- Two-column grid with Certifications and Achievements
- Each shows icon and "Coming soon" message

### 4. Training Content (Lessons)
- Large empty state with BookOpen icon
- "No Published Lessons Yet"
- "{Coach Name} is preparing quality training content"

### 5. Welcome Note
- Teal gradient card at bottom
- Calendar icon
- Explains coach is new and setting up profile

---

## 🔧 How to Customize with Your HTML

You have two options for customization:

### Option 1: Replace the Entire Placeholder Component (Easiest)

Edit **`components/coach/CoachProfilePlaceholder.tsx`** and replace the return statement with your HTML.

**Example:**
```tsx
export default function CoachProfilePlaceholder({
  coachName,
  sport
}: CoachProfilePlaceholderProps) {

  return (
    <div className="space-y-6">
      {/* YOUR CUSTOM HTML HERE */}
      <div className="bg-white rounded-xl p-8">
        <h2>Welcome to {coachName}'s Profile</h2>
        <p>This {sport} coach is setting up their page.</p>
        {/* Add your custom design here */}
      </div>
    </div>
  )
}
```

### Option 2: Update Individual Sections

Keep the structure but customize each section individually:

**About Section:**
```tsx
<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-8">
  <h2 className="text-2xl font-heading mb-4">About</h2>
  {/* Your custom About placeholder HTML */}
</div>
```

**Specialties Section:**
```tsx
<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-8">
  <h2 className="text-2xl font-heading mb-4">Specialties</h2>
  {/* Your custom Specialties placeholder HTML */}
</div>
```

---

## 🎨 Using Your Specific HTML

When you're ready with your custom HTML, simply:

1. Open **`components/coach/CoachProfilePlaceholder.tsx`**
2. Replace the entire `return` statement content
3. Use the props available to you:
   - `coachName` - The coach's display name
   - `sport` - The coach's sport (e.g., "Baseball", "Basketball")

**Example with Props:**
```tsx
return (
  <div>
    <h1>Hello {coachName}!</h1>
    <p>You coach {sport}. Add your bio to get started!</p>
    {/* Your HTML continues here */}
  </div>
)
```

---

## 🎯 Design Tokens in Use

The placeholder uses your app's design system:

**Colors:**
- `#20B2AA` - Teal (primary actions)
- `#91A6EB` - Sky Blue (lessons/content)
- `#FF6B35` - Orange (achievements)
- `#E8E6D8` - Cream (backgrounds)
- `#000000` - Black (text)
- `#666666` - Gray (secondary text)

**Styling:**
- `backdrop-blur-sm` - Frosted glass effect
- `rounded-2xl` - Large rounded corners
- `shadow-lg` - Prominent shadows
- `border-dashed` - Indicates placeholder/temporary state

Feel free to use different colors or styles that match your design vision!

---

## 🧪 Testing the Placeholder

### To See the Placeholder View:
1. Visit a coach profile page: `/coach/[coachId]`
2. The placeholder shows if the coach has:
   - No bio or very short bio (< 50 chars)
   - Zero lessons
   - No certifications
   - No achievements

### To See the Full Profile View:
The full profile displays when a coach has:
- A bio with 50+ characters, OR
- At least one published lesson, OR
- Any certifications, OR
- Any achievements

---

## 🔍 How It Works

**Detection Logic:**
```typescript
function isProfileMinimal(coach, totalLessons, totalAthletes): boolean {
  const hasNoBio = !coach.bio || coach.bio.trim().length < 50
  const hasNoLessons = totalLessons === 0
  const hasNoCertifications = !coach.certifications || coach.certifications.length === 0
  const hasNoAchievements = !coach.achievements || coach.achievements.length === 0

  // Show placeholder if ALL are empty
  return hasNoBio && hasNoLessons && hasNoCertifications && hasNoAchievements
}
```

**Rendering Logic (in page.tsx):**
```tsx
{isProfileMinimal(coach, totalLessons, totalAthletes) ? (
  <CoachProfilePlaceholder
    coachName={coach.displayName}
    sport={coach.sport || 'General Athletics'}
  />
) : (
  <>
    {/* Full profile sections */}
  </>
)}
```

---

## 📝 Next Steps

1. **Review the current placeholder** - Visit a minimal coach profile to see it in action
2. **Prepare your HTML** - Design the exact placeholder you want
3. **Drop it in** - Replace the content in `CoachProfilePlaceholder.tsx`
4. **Test** - View a minimal profile to see your custom design
5. **Iterate** - Adjust styling/content as needed

---

## 💡 Pro Tips

### Make It Interactive:
Add action buttons for coaches viewing their own profile:
```tsx
{isOwnProfile && (
  <button onClick={() => router.push('/dashboard/profile')}>
    Complete Your Profile →
  </button>
)}
```

### Show Profile Completion:
Add a progress indicator:
```tsx
<div className="mb-4">
  <div className="bg-gray-200 rounded-full h-2">
    <div className="bg-teal-500 h-2 rounded-full" style={{ width: '30%' }} />
  </div>
  <p className="text-sm mt-2">Profile 30% Complete</p>
</div>
```

### Add Personality:
Use sport-specific messages:
```tsx
{sport === 'Baseball' && (
  <p>⚾ This baseball coach is preparing their roster...</p>
)}
```

---

## 🚀 Ready to Deploy

The system is fully functional and ready for production. When you have your custom HTML ready, just drop it into the placeholder component file and it will automatically appear for all minimal coach profiles!

**Questions or need help?** Just ask!
