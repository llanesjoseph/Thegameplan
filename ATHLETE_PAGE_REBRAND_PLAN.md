# Athlete Page Rebrand Plan

## Overview
Transform the athlete dashboard from an "enterprise dashboard" feel to a **social profile-style page** that serves as the "single point of truth" for the athlete journey.

## Design Principles (from feedback - LEFT SIDE DESIGN)
1. **Single point of truth** - Focus on athlete profile, similar to social engagement sites
2. **Eliminate dashboard concept** - Remove enterprise-style widgets
3. **Square images** - All profile images, coach images, and content cards use SQUARE format (NOT circular)
4. **Minimal data entry** - Seamless experience with clarity on core features
5. **3 core features max** - Keep it simple and focused
6. **Clean, card-based layout** - Square cards for all visual content

---

## Current Structure Analysis

### Files to Modify:
1. `app/dashboard/athlete/home/page.tsx` - Main home page (remove Daily Motivation)
2. `components/athlete/AthleteOverview.tsx` - Header/welcome section
3. `components/athlete/AthleteQuickActions.tsx` - Action buttons
4. `components/athlete/UpcomingActivities.tsx` - Progress section
5. `app/dashboard/athlete/page.tsx` - Main dashboard wrapper (may need layout changes)

### Components to Create/Update:
1. **Athlete Profile Section** - New component for athlete picture (SQUARE), bio, location, training goals
2. **Your Coaches Section** - Redesign with SQUARE profile images (not circular)
3. **Your Training Library** - Display training content with SQUARE image cards
4. **Recommended Gear** - Display gear recommendations with SQUARE product cards

---

## Required Sections (from design mockup)

### 1. Header Section ✅
**Current:** "Good Morning, [Name]!" with date
**New:** "Welcome to your game plan, [Name]!"
- Large, bold heading
- Subtitle: "This is where you can keep track of your coaches, upcoming training and events, and manage your progress, on and off the field."

### 2. Athlete Profile Section 🆕
**New Component Needed (LEFT SIDE DESIGN):**
- **Layout:** Two-column layout
  - **LEFT SIDE:** Text content
    - Athlete Name: Large, bold (e.g., "Lona Vincent")
    - Location: Below name (placeholder: "[Location]")
    - Bio: Paragraph text (capped at 100 words, lorem ipsum placeholder)
    - Training Goals: Heading + "[entered from pick list]"
  - **RIGHT SIDE:** Large SQUARE profile image (prominent, square format)
- **Style:** Same card-based style as coaches section, but with different content needs

### 3. Your Progress Section 🔄
**Current:** Shows stats cards
**New (LEFT SIDE DESIGN):** Three progress indicators with labels:
- **Trainings Complete** (with icon/metric)
- **Trainings In Progress** (with icon/metric)
- **Upcoming Event** (with icon/metric)
- Layout: Clean, card-based, square/rectangular format

### 4. Your Coaches Section 🔄
**Current:** Coach panel/sidebar
**New (LEFT SIDE DESIGN - Image 2 Style):** 
- Grid/row of SQUARE coach profile images (NOT circular)
- Each square image has "Title" and "Author" placeholders below
- Clean, card-based layout matching athlete profile style
- Same visual style as athlete profile section, just different content
- Clickable to view coach details

### 5. Your Training Library 🆕
**New Section (LEFT SIDE DESIGN):**
- Grid of SQUARE training content cards
- Each card: SQUARE image + Title + Description
- Clean card layout with square images
- Pagination controls (if needed)

### 6. Recommended Gear 🆕
**New Section (LEFT SIDE DESIGN):**
- Grid of SQUARE product cards
- Each card: SQUARE product image + Product name + Description + Price
- Clean card layout with square images
- Pagination controls (if needed)

### 7. Action Buttons 🔄
**Current:** Quick actions in cards
**New:** Three prominent buttons:
- **"Schedule 1-1 Session With a Coach"** (black button)
- **"Submit Training Video for Coach Feedback"** (black button)
- **"Ask a Question With Your Coach"** (black button)
- These should be clickable and trigger modals/hovers (per feedback)

---

## Removals

### ❌ Remove:
1. **Daily Motivation section** - Explicitly requested to be removed
2. **Enterprise dashboard widgets** - Replace with profile-style layout
3. **Complex sidebar navigation** - Simplify to profile-focused view

---

## Brand Colors to Apply

- **Primary Red:** `#FC0105`
- **Dark Brown:** `#440102`
- **White:** `#FFFFFF`
- **Background:** White (not `#E8E6D8`)

---

## Implementation Questions

Before proceeding, I need clarification on:

1. **Data Sources:**
   - Where does athlete bio/location come from? (Firestore `users` collection? `profiles`?)
   - Where are training goals stored?
   - Where does training library content come from? (Same as lessons?)
   - Where does recommended gear data come from? (Is there a gear collection?)

2. **Profile Image:**
   - Should we use the athlete's profile picture from Firestore?
   - What's the fallback if no image exists?

3. **Training Library:**
   - Should this show the same lessons from the coach?
   - Or is it a separate collection?

4. **Recommended Gear:**
   - Is there existing gear data in Firestore?
   - Or should we create placeholder structure for now?

5. **Action Buttons:**
   - Do modals/components already exist for:
     - Schedule 1-1 session?
     - Submit video (this exists: `/dashboard/athlete/submit-video`)?
     - Ask question (this exists: AI Assistant)?

6. **Layout:**
   - Should this be a single scrollable page?
   - Or keep the iframe structure but redesign the content?

7. **Navigation:**
   - Should we keep the sidebar navigation?
   - Or make it a single-page profile view?

---

## Proposed Implementation Order

1. ✅ **Remove Daily Motivation** (quick fix)
2. 🔄 **Update header/welcome message** (use new text)
3. 🆕 **Create Athlete Profile component** (picture, bio, location, goals)
4. 🔄 **Redesign Your Progress section** (card-based, clean layout)
5. 🔄 **Redesign Your Coaches section** (SQUARE images, card-based layout)
6. 🆕 **Create/Update Training Library section**
7. 🆕 **Create/Update Recommended Gear section**
8. 🔄 **Update action buttons** (three black buttons)
9. 🎨 **Apply brand colors throughout**
10. 🧹 **Clean up layout** (remove enterprise dashboard feel)

---

## Next Steps

1. **Review this plan** - Does this align with your vision?
2. **Answer questions** - Help me understand data sources and requirements
3. **Start implementation** - Begin with removals and header updates
4. **Iterate** - Test and refine as we go

---

## Notes

- **Preserve functionality** - All existing components work well, just change the look
- **Maintain responsiveness** - Ensure mobile-friendly design
- **Keep it simple** - Focus on 3 core features as per feedback
- **Square format** - ALL images use SQUARE format (profile, coaches, training, gear)
- **Clean cards** - Card-based layout throughout, no circular elements

