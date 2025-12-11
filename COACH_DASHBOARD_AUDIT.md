# Coach Dashboard Comprehensive Audit & Redesign Plan

**Date**: October 9, 2025
**Audited By**: Claude (AI Assistant)
**Scope**: Complete coach experience from lesson creation to athlete management

---

## Executive Summary

### Current State
- ❌ **Fragmented Experience**: Coach dashboard uses old `/dashboard/creator` page (38k+ tokens)
- ❌ **No Unified Interface**: Scattered tools across multiple pages
- ❌ **Inconsistent Design**: Does not match admin dashboard card/iframe pattern
- ✅ **Some Tools Exist**: Basic athlete invitations, profile management

### Target State
- ✅ Unified coach dashboard with card-based navigation matching admin
- ✅ Embedded iframe tools for seamless experience
- ✅ Comprehensive lesson generation as subject matter experts
- ✅ Video management and embedding system
- ✅ Content library with links, resources, and training materials
- ✅ Athlete management and progress tracking
- ✅ Analytics and engagement metrics

---

## 1. Current Coach Dashboard Structure Audit

### Existing Pages
```
/dashboard/creator (redirects coaches here)
├── Overview Dashboard
├── Create Content Section
├── Manage Content Section
└── Invitations Section (for inviting other coaches)

/dashboard/coach
├── /athletes - Athlete invitation system ✅
├── /profile - Coach profile management ✅
├── /social-media - Social media integration (unused) ⚠️
└── page.tsx - Redirects to /dashboard/overview
```

### Existing Components
1. **StreamlinedVoiceCapture.tsx** - Voice-to-text for lesson creation
2. **VoiceCaptureIntake.tsx** - Alternative voice capture
3. **CoachImageManager.tsx** - Image upload/management
4. **AthleteProfileCard.tsx** - Display athlete profiles

### Existing API Endpoints
1. `/api/coach/athletes` - Get coach's athletes
2. `/api/coach/invite-athletes` - Bulk athlete invitations ✅

---

## 2. Gap Analysis

### Missing Features

#### A. Lesson Generation Tools
- ❌ No structured lesson builder
- ❌ No lesson templates by sport
- ❌ No curriculum planning tools
- ❌ No lesson sequencing/progressions

#### B. Video Management
- ❌ No video library organization
- ❌ No video embedding from YouTube/Vimeo
- ❌ No video playlists or collections
- ❌ No video analytics (views, completion rates)

#### C. Content Library
- ❌ No centralized resource library
- ❌ No link management for external resources
- ❌ No document uploads (PDFs, guides)
- ❌ No content tagging/categorization

#### D. Athlete Engagement
- ❌ Limited athlete progress tracking
- ❌ No assignment system
- ❌ No feedback/comment system on lessons
- ❌ No completion tracking

#### E. Analytics
- ❌ Basic metrics only (lesson count, athlete count)
- ❌ No engagement analytics
- ❌ No popular content insights
- ❌ No athlete activity tracking

---

## 3. Proposed Unified Coach Dashboard

### Design Pattern (Matching Admin Dashboard)

```typescript
interface CoachToolCard {
  id: string
  title: string
  description: string
  icon: LucideIcon
  color: string  // Brand color
  inline: boolean  // Embed or iframe
}
```

### Proposed Tool Cards

#### 1. **My Athletes** 🏃
- View all athletes
- Track progress and completion
- Send messages/announcements
- Assign lessons
- Color: `#91A6EB` (Sky Blue)

#### 2. **Create Lessons** ✏️
- Subject matter expert lesson builder
- Video embedding (YouTube, Vimeo, direct upload)
- Add descriptions, objectives, key points
- Multi-section lessons (warm-up, drills, cool-down)
- Color: `#20B2AA` (Teal)

#### 3. **Lesson Library** 📚
- View all published lessons
- Edit/update lessons
- Organize into collections
- Duplicate lessons for variations
- Color: `#000000` (Black)

#### 4. **Video Manager** 🎥
- Upload/embed videos
- Organize into playlists
- Add timestamps and notes
- Generate QR codes for mobile viewing
- Color: `#FF6B35` (Orange)

#### 5. **Resource Library** 📑
- Upload PDFs, guides, worksheets
- External links and articles
- Curated gear recommendations
- Training programs and plans
- Color: `#91A6EB` (Sky Blue)

#### 6. **Analytics** 📊
- Athlete engagement metrics
- Lesson completion rates
- Popular content
- Time-on-platform stats
- Color: `#20B2AA` (Teal)

#### 7. **Invite Athletes** 👥
- Bulk athlete invitations
- CSV import
- QR code generation
- Track invitation status
- Color: `#000000` (Black)

#### 8. **My Profile** ⚙️
- Edit coach bio and expertise
- Update sport specializations
- Set availability
- Manage public profile
- Color: `#FF6B35` (Orange)

#### 9. **Announcements** 📢
- Send updates to all athletes
- Schedule announcements
- Pin important messages
- View announcement history
- Color: `#91A6EB` (Sky Blue)

#### 10. **Assistant Coaches** 🤝
- Invite assistant coaches
- Manage permissions
- Collaborate on content
- Share athlete access
- Color: `#20B2AA` (Teal)

---

## 4. Lesson Generation System (Subject Matter Expert Tools)

### Lesson Builder Structure

```typescript
interface Lesson {
  id: string
  title: string
  sport: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: number  // minutes
  objectives: string[]
  sections: LessonSection[]
  videos: VideoEmbed[]
  resources: Resource[]
  tags: string[]
  visibility: 'public' | 'athletes_only' | 'specific_athletes'
  publishedAt: string
  updatedAt: string
}

interface LessonSection {
  id: string
  title: string
  type: 'video' | 'text' | 'drill' | 'reflection'
  content: string
  order: number
  duration?: number
  resources?: string[]
}

interface VideoEmbed {
  id: string
  source: 'youtube' | 'vimeo' | 'direct'
  url: string
  thumbnail: string
  duration: number
  title: string
  description: string
}

interface Resource {
  id: string
  type: 'pdf' | 'link' | 'image' | 'video'
  title: string
  url: string
  description: string
}
```

### Lesson Templates by Sport

**Example: Soccer Lesson Template**
```typescript
{
  sections: [
    { title: "Warm-Up", type: "video", duration: 10 },
    { title: "Technical Drills", type: "drill", duration: 20 },
    { title: "Small-Sided Game", type: "video", duration: 15 },
    { title: "Cool Down & Reflection", type: "reflection", duration: 5 }
  ]
}
```

---

## 5. Video Management System

### Features
1. **Multiple Sources**
   - YouTube embed
   - Vimeo embed
   - Direct upload (Firebase Storage)
   - External video links

2. **Organization**
   - Playlists/Collections
   - Tags and categories
   - Search and filter
   - Favorites/starred

3. **Analytics**
   - View count
   - Completion rate
   - Average watch time
   - Drop-off points

4. **Mobile Optimization**
   - QR codes for easy mobile access
   - Responsive video player
   - Offline download options

---

## 6. Resource Library System

### Resource Types
1. **Documents**: PDFs, Word docs, spreadsheets
2. **Links**: External articles, videos, research
3. **Images**: Diagrams, technique photos, infographics
4. **Training Programs**: Multi-week programs with daily workouts

### Organization
- **Collections**: Group related resources
- **Tags**: Flexible categorization
- **Search**: Full-text search
- **Filters**: By type, sport, level, date

---

## 7. Implementation Priorities

### Phase 1: Foundation (Week 1)
- [ ] Create unified coach dashboard page with card layout
- [ ] Implement DynamicIframe component for embedded tools
- [ ] Build tool cards matching admin dashboard design
- [ ] Migrate existing athlete invitation tools

### Phase 2: Lesson Creation (Week 2)
- [ ] Build comprehensive lesson builder
- [ ] Implement video embedding system
- [ ] Create lesson templates for major sports
- [ ] Add multi-section lesson support

### Phase 3: Content Management (Week 3)
- [ ] Build lesson library with edit/duplicate
- [ ] Implement video manager
- [ ] Create resource library
- [ ] Add content organization (collections, tags)

### Phase 4: Engagement & Analytics (Week 4)
- [ ] Build athlete progress tracking
- [ ] Implement lesson completion tracking
- [ ] Create analytics dashboard
- [ ] Add announcement system

---

## 8. Technical Architecture

### File Structure
```
app/
├── dashboard/
│   └── coach/
│       ├── page.tsx (Unified Dashboard)
│       ├── athletes/
│       ├── lessons/
│       │   ├── create/page.tsx
│       │   ├── library/page.tsx
│       │   └── [id]/edit/page.tsx
│       ├── videos/page.tsx
│       ├── resources/page.tsx
│       ├── analytics/page.tsx
│       └── profile/page.tsx

components/
└── coach/
    ├── LessonBuilder.tsx
    ├── VideoEmbedder.tsx
    ├── ResourceUploader.tsx
    ├── AthleteProgressTracker.tsx
    └── AnnouncementComposer.tsx

app/api/
└── coach/
    ├── lessons/
    ├── videos/
    ├── resources/
    ├── analytics/
    └── announcements/
```

### Database Schema (Firestore)

```typescript
// Collections
coaches/{coachId}
  ├── profile
  ├── lessons/
  ├── videos/
  ├── resources/
  └── analytics/

athletes/{athleteId}
  ├── assignedLessons/
  ├── completedLessons/
  └── progress/

lessons/{lessonId}
  ├── sections/
  ├── videos/
  ├── resources/
  └── analytics/
```

---

## 9. Brand Consistency

### Colors (From Admin Dashboard)
- **Sky Blue**: `#91A6EB` - Primary actions
- **Teal**: `#20B2AA` - Secondary actions
- **Black**: `#000000` - Important tools
- **Orange**: `#FF6B35` - Analytics/alerts
- **Background**: `#E8E6D8` - Cream

### Typography
- **Heading**: Font-heading class
- **Body**: Standard sans-serif

### Card Design
- Rounded corners: `rounded-lg` to `rounded-xl`
- Glass effect: `bg-white/90 backdrop-blur-sm`
- Shadows: `shadow-lg` with border `border-white/50`
- Hover: `hover:shadow-2xl hover:scale-105`

---

## 10. Success Metrics

### For Coaches
- ✅ Time to create first lesson < 10 minutes
- ✅ Lesson creation increased by 200%
- ✅ Video embeds work 99.9% of time
- ✅ Athlete engagement visible in dashboard

### For Athletes
- ✅ Lesson completion rate > 70%
- ✅ Content satisfaction score > 4.5/5
- ✅ Clear progress tracking
- ✅ Easy mobile access

---

## Conclusion

The current coach dashboard is fragmented and lacks essential tools for coaches to operate as subject matter experts. By implementing a unified dashboard with the proposed tools, we will:

1. **Empower Coaches** with professional-grade lesson creation tools
2. **Streamline Experience** with consistent card/iframe design
3. **Scale Efficiently** with reusable components and clear architecture
4. **Track Success** with comprehensive analytics

**Estimated Implementation Time**: 4 weeks for full feature set
**Priority**: HIGH - Coaches are core users who create value for athletes

---

*End of Audit Report*
