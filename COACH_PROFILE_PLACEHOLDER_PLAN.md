# Coach Profile Placeholder/Default View Plan
**Date:** 2025-10-13
**Goal:** Create a beautiful, professional default view for new coach profiles

---

## 🎯 The Problem

**Current State:**
When a new coach has only basic info (name, photo), their public profile page shows:
- ✅ Profile header with photo/name/sport
- ❌ Empty stats (0 lessons, 0 athletes, 5.0 rating)
- ❌ Missing "About" section (no bio)
- ❌ Missing "Specialties" section
- ❌ Missing "Certifications" section
- ❌ Missing "Achievements" section
- ❌ Empty "Recent Lessons" section
- **Result:** Looks empty, unprofessional, and incomplete

**What Users Want:**
- A polished, professional-looking profile even before content is added
- Encouragement to fill out their profile
- Clear guidance on what to add
- Something that still looks good to potential athletes

---

## ✨ Proposed Solution: Smart Placeholder System

### Approach 1: **"Coming Soon" Placeholders** (Recommended)

Show elegant placeholder cards for empty sections that:
- Look intentional (not broken)
- Guide the coach to add content
- Still look professional to visitors

**Example Placeholders:**

```
┌─────────────────────────────────────────────┐
│  About                                       │
│  ────────────────────────────────────────   │
│                                              │
│  📝 This coach hasn't written their bio yet. │
│                                              │
│  Coming soon...                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Recent Lessons                              │
│  ────────────────────────────────────────   │
│                                              │
│  📚 No published lessons yet                 │
│                                              │
│  [Coach Name] is preparing awesome content!  │
│  Check back soon.                            │
└─────────────────────────────────────────────┘
```

### Approach 2: **Generic/Default Content**

Pre-fill sections with generic but professional content:

**Default Bio:**
```
"Welcome! [Coach Name] is a passionate [Sport] coach dedicated to
helping athletes reach their full potential. Stay tuned for more
details about their coaching philosophy and experience."
```

**Default Specialties:**
- List common specialties for the sport
- Example: For Baseball → "Pitching", "Hitting", "Fielding", "Base Running"

**Pros:** Profile looks complete immediately
**Cons:** Might feel generic, not personalized

### Approach 3: **Hybrid - Default with Call-to-Action** (Best UX)

Combine both approaches:
- Show minimal default content
- Add clear "Add Your Info" prompts (only visible to the coach)
- Use placeholder cards for truly empty sections

---

## 🎨 Detailed Design Plan

### 1. **Profile Header** (Always Shown)
```tsx
✅ Profile photo (or initial if no photo)
✅ Coach name
✅ Sport (default: "General Athletics")
✅ Years of experience (hide if 0, or show "New Coach")
✅ Contact button (always visible)
```

**Enhancement for new coaches:**
- If years < 1 or not set: Show "New to AthLeap" badge
- Looks intentional, not empty

### 2. **Stats Grid** (Always Shown)

**Current:** Shows 0/0 which looks bad
**New:** Smart defaults

```tsx
Lessons Created:
- If 0: Show "Coming Soon" instead of "0"
- Or: "Building Content" with building icon

Athletes Coached:
- If 0: Show "Ready to Coach" with checkmark icon
- Or: "Accepting Athletes"

Rating:
- If no reviews: "New Coach" badge
- Or: Hide rating section entirely for new coaches
```

### 3. **About Section** (Smart Placeholder)

**If no bio:**
```tsx
<div className="placeholder-section">
  <h2>About</h2>
  <div className="placeholder-content">
    <div className="placeholder-icon">📝</div>
    <p className="placeholder-text">
      {coachName} is setting up their profile.
    </p>
    <p className="placeholder-subtext">
      Check back soon to learn more about their coaching
      philosophy and experience!
    </p>
  </div>
</div>
```

**If has minimal bio (< 100 chars):**
- Show the bio
- Add note: "More coming soon..."

### 4. **Specialties Section** (Auto-generate or Hide)

**Option A:** Auto-generate based on sport
```tsx
If sport === "Baseball":
  defaultSpecialties = ["Pitching", "Hitting", "Fielding", "Base Running"]
  Show: "Primary Focus Areas" instead of "Specialties"
```

**Option B:** Hide entirely with placeholder
```tsx
<PlaceholderCard
  title="Specialties"
  icon={<Target />}
  message="Coming soon - specialized coaching areas"
/>
```

### 5. **Certifications & Achievements** (Conditional Display)

**If empty: Hide or show placeholder**

```tsx
// Only show if coach has added content
{hasContent && (
  <div className="grid sm:grid-cols-2 gap-6">
    {/* Show real content */}
  </div>
)}

// If no content, show single placeholder card
{!hasContent && (
  <div className="placeholder-section">
    <h2>Professional Background</h2>
    <p>{coachName} will be adding their certifications
       and achievements soon.</p>
  </div>
)}
```

### 6. **Recent Lessons Section** (Always Show with Placeholder)

**If no lessons:**
```tsx
<div className="lessons-placeholder">
  <div className="empty-state-icon">
    <BookOpen size={48} />
  </div>
  <h3>No Published Lessons Yet</h3>
  <p>{coachName} is preparing quality training content.</p>
  <p className="subtle">Check back soon for lessons!</p>

  {/* If viewing their own profile */}
  {isOwnProfile && (
    <button onClick={goToCreateLesson}>
      Create Your First Lesson →
    </button>
  )}
</div>
```

---

## 🎯 Implementation Strategy

### Phase 1: Add Placeholder Components (1-2 hours)

**Create reusable components:**

1. **`<PlaceholderCard>`** - Generic placeholder card
```tsx
interface PlaceholderCardProps {
  title: string
  icon: ReactNode
  message: string
  subMessage?: string
  actionButton?: ReactNode
}
```

2. **`<EmptyStateCard>`** - For sections with no data
```tsx
interface EmptyStateCardProps {
  icon: ReactNode
  title: string
  description: string
  isOwnProfile?: boolean
  actionLink?: string
  actionLabel?: string
}
```

3. **`<DefaultContentCard>`** - Shows generic content
```tsx
interface DefaultContentCardProps {
  title: string
  defaultContent: string | string[]
  showAsDefault?: boolean // Visually indicates it's default
}
```

### Phase 2: Smart Logic for Empty Sections (30 mins)

**Add helper functions:**

```tsx
const isProfileComplete = (coach: CoachProfile) => {
  return Boolean(
    coach.bio && coach.bio.length > 50 &&
    coach.specialties && coach.specialties.length > 0 &&
    (coach.certifications?.length > 0 || coach.achievements?.length > 0)
  )
}

const shouldShowPlaceholder = (content: any) => {
  if (!content) return true
  if (Array.isArray(content) && content.length === 0) return true
  if (typeof content === 'string' && content.trim().length === 0) return true
  return false
}

const getDefaultSpecialties = (sport: string) => {
  const defaults: Record<string, string[]> = {
    'Baseball': ['Pitching', 'Hitting', 'Fielding', 'Base Running'],
    'Basketball': ['Shooting', 'Defense', 'Ball Handling', 'Conditioning'],
    'Soccer': ['Ball Control', 'Passing', 'Defending', 'Conditioning'],
    'Football': ['Offense', 'Defense', 'Special Teams', 'Conditioning'],
    // ... more sports
  }
  return defaults[sport] || ['Training', 'Skill Development', 'Performance']
}
```

### Phase 3: Update Profile Page (1 hour)

**Modify `/coach/[id]/page.tsx`:**

1. Detect empty sections
2. Show placeholders instead of hiding
3. Add "Profile Setup Progress" banner (only for own profile)
4. Smart stats display

```tsx
// Example: Smart stats
<div className="stat-card">
  <div className="stat-value">
    {totalLessons > 0 ? totalLessons : (
      <span className="placeholder-stat">
        <FileText className="w-5 h-5" />
        Coming Soon
      </span>
    )}
  </div>
  <p className="stat-label">Lessons</p>
</div>
```

### Phase 4: Coach-Only Features (30 mins)

**If viewing own profile, show:**
- Profile completion percentage
- "Complete Your Profile" banner at top
- Quick action buttons on placeholders

```tsx
{isOwnProfile && !isProfileComplete(coach) && (
  <div className="profile-completion-banner">
    <div className="progress-bar">
      <div style={{ width: `${completionPercentage}%` }} />
    </div>
    <p>Your profile is {completionPercentage}% complete</p>
    <Link href="/dashboard/profile">
      Complete Profile →
    </Link>
  </div>
)}
```

---

## 🎨 Design Specifications

### Colors & Styling

**Placeholder Cards:**
- Background: `#F9FAFB` (light gray)
- Border: `2px dashed #E5E7EB`
- Icon color: `#9CA3AF` (gray-400)
- Text: `#6B7280` (gray-500)

**Empty State:**
- Icon: Large (48px), light teal `#99F6E4`
- Title: `#111827` (gray-900)
- Description: `#6B7280` (gray-500)
- Background: White with subtle border

**Default Content (if used):**
- Subtle badge: "Default Info" in corner
- Slightly lower opacity (0.8)
- Italic text for generic content

### Mobile Responsive
- Cards stack on mobile
- Larger tap targets for action buttons
- Collapse less important placeholders

---

## ✅ Recommended Approach

**I recommend: Approach 3 (Hybrid)**

**Why:**
1. ✅ Professional appearance immediately
2. ✅ Clear expectations for visitors
3. ✅ Guides coaches to complete their profile
4. ✅ Doesn't look broken or empty
5. ✅ Still personalized (uses coach name, sport)

**Implementation Order:**
1. Start with placeholder cards for completely empty sections
2. Add smart defaults for stats (hide 0s, show "Coming Soon")
3. Auto-generate specialties based on sport
4. Add coach-only "Complete Your Profile" features
5. Polish with animations and micro-interactions

---

## 📊 Success Metrics

**Before:**
- Empty profiles look unprofessional
- Coaches might not know what to add
- Visitors leave due to lack of content

**After:**
- ✅ All profiles look complete and professional
- ✅ Coaches see clear guidance to fill out profile
- ✅ Visitors understand coach is new but legitimate
- ✅ Increased profile completion rate

---

## 🚀 Timeline

- **Phase 1:** Placeholder components (1-2 hours)
- **Phase 2:** Smart logic (30 mins)
- **Phase 3:** Update profile page (1 hour)
- **Phase 4:** Coach-only features (30 mins)
- **Total:** 3-4 hours of development

---

## 🎯 Next Steps

1. **Review this plan** - Approve approach
2. **Design mockups** - Create visual examples (optional)
3. **Implement Phase 1** - Build placeholder components
4. **Test with real data** - View profiles with varying completion
5. **Iterate based on feedback**

---

**Questions to Consider:**

1. Should we auto-generate default specialties, or leave empty with placeholder?
2. Should we hide the rating section entirely for new coaches, or show "New Coach"?
3. Do we want a "profile completion percentage" visible to the coach?
4. Should empty sections be hidden completely, or shown with placeholders?

**My Recommendation:**
- Show placeholders (don't hide)
- Use coach name + sport for personalization
- Add completion percentage for coach only
- Auto-generate specialties as "Primary Focus Areas"

This keeps profiles looking professional while encouraging coaches to add their unique content!
