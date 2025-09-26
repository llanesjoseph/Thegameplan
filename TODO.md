# GAMEPLAN Codebase Standardization & AI Coach Enhancement
# GAMEPLAN Codebase Standardization & AI Coach Enhancement

## Current Issues Identified

### 1. Layout Inconsistencies
- Different page structures across dashboard pages
- Inconsistent styling patterns (some use Tailwind classes, others use CSS variables)
- Mixed layout approaches (some pages have proper containers, others don't)
- Role-based content not consistently implemented
- Different header/navigation patterns

### 2. AI Coach Feature Limitations
- Current AI service uses generic coaching context
- No martial arts lesson plan template implementation
- Missing the detailed structured lesson plan format requested
- AI responses are not formatted according to the specific template provided

## Plan Overview

### Phase 1: Standardize Page Layouts 🔄
- [ ] Create unified layout components
- [ ] Implement consistent role-based content system
- [ ] Standardize styling approach
- [ ] Update all dashboard pages to use consistent layout

### Phase 2: Enhance AI Coach Feature ✅
- [x] Implement martial arts lesson plan template
- [x] Update AI service to use the new template
- [x] Create structured lesson plan formatting
- [x] Add sport-specific coaching contexts
- [x] Create LessonPlanGenerator component
- [x] Update AI coaching API route

### Phase 3: Coach Management System ✅
- [x] Create coach types and interfaces
- [x] Build coach application form
- [x] Create admin panel for managing applications
- [x] Build "Become a Coach" landing page
- [x] Implement coach approval/rejection workflow

### Phase 4: Testing & Refinement 🔄
- [ ] Test all pages for consistency
- [ ] Verify AI coach functionality
- [ ] Ensure role-based content works properly
- [ ] Test coach application flow
- [ ] Final polish and bug fixes

## Detailed Implementation Plan

### Layout Standardization

#### 1. Create Base Layout Components
- [ ] `StandardPageLayout.tsx` - Main page wrapper
- [ ] `PageHeader.tsx` - Consistent page headers
- [ ] `RoleBasedContent.tsx` - Role-specific content wrapper
- [ ] `ActionCard.tsx` - Standardized action cards

#### 2. Update Dashboard Pages
- [ ] `/dashboard/overview/page.tsx` - Apply standard layout
- [ ] `/dashboard/coaching/page.tsx` - Apply standard layout
- [ ] `/dashboard/creator/page.tsx` - Apply standard layout
- [ ] `/dashboard/profile/page.tsx` - Apply standard layout
- [ ] `/dashboard/progress/page.tsx` - Apply standard layout
- [ ] All admin/creator/superadmin pages

#### 3. Styling Consistency
- [ ] Use consistent color scheme (clarity-* classes)
- [ ] Standardize spacing and typography
- [ ] Consistent button and form styles
- [ ] Unified card and container styles

### AI Coach Enhancement ✅

#### 1. Martial Arts Lesson Plan Template ✅
- [x] Create dynamic lesson plan prompt generator in `lib/ai-service.ts`
- [x] Implement structured lesson plan prompt template
- [x] Add formatting for professional lesson plans
- [x] Support for different martial arts (BJJ, MMA, Boxing, Wrestling, etc.)
- [x] Add sport-specific terminology and focus areas

#### 2. Enhanced AI Service ✅
- [x] Create `generateLessonPlanPrompt` function
- [x] Add lesson plan specific formatting
- [x] Implement the detailed structure requested:
  - [x] Header Section (sport, level, duration, class type)
  - [x] Lesson Objective
  - [x] Warm-Up & Introduction
  - [x] Technical Instruction & Demonstration
  - [x] Progressive Practice & Drilling
  - [x] Live Application & Cool-Down
  - [x] Lesson Review & Reflection
  - [x] Closing Safety & Training Reminder

#### 3. AI Coach Component Updates ✅
- [x] Create `LessonPlanGenerator.tsx` component
- [x] Add lesson plan formatting in responses
- [x] Implement sport selection for lesson plans
- [x] Add export/save functionality for lesson plans
- [x] Update API route to handle lesson plan requests

### Coach Management System ✅

#### 1. Coach Types and Data Models ✅
- [x] Create `types/coach.ts` with Coach, CoachApplication, CoachingSession interfaces
- [x] Define comprehensive coach data structure
- [x] Add application workflow types

#### 2. Coach Application System ✅
- [x] Create `CoachApplicationForm.tsx` component
- [x] Multi-step application form with validation
- [x] Support for sports, specialties, credentials, availability
- [x] Social links and coaching philosophy sections

#### 3. Admin Management Panel ✅
- [x] Create `app/dashboard/admin/coaches/page.tsx`
- [x] Application review and approval system
- [x] Coach status management
- [x] Statistics and filtering capabilities
- [x] Detailed application review modal

#### 4. Public Coach Application Page ✅
- [x] Create `app/become-coach/page.tsx`
- [x] Marketing landing page for potential coaches
- [x] Benefits, requirements, and process explanation
- [x] FAQ section and call-to-action

## Files to be Modified/Created

### New Components ✅
- [x] `components/ai/LessonPlanGenerator.tsx` - Dedicated lesson plan generator
- [x] `components/coach/CoachApplicationForm.tsx` - Multi-step coach application
- [ ] `components/layout/StandardPageLayout.tsx`
- [ ] `components/layout/PageHeader.tsx`
- [ ] `components/layout/RoleBasedContent.tsx`
- [ ] `components/ui/ActionCard.tsx`

### Modified Files ✅
- [x] `lib/ai-service.ts` - Added dynamic lesson plan generation
- [x] `app/api/ai-coaching/route.ts` - Support lesson plan generation
- [ ] `components/AIAssistant.tsx` - Enhanced for lesson plans
- [ ] All dashboard page files for layout consistency

### New Pages ✅
- [x] `app/become-coach/page.tsx` - Coach application landing page
- [x] `app/dashboard/admin/coaches/page.tsx` - Admin coach management

### New Types ✅
- [x] `types/coach.ts` - Coach, CoachApplication, CoachingSession types
- [ ] `types/lesson-plan.ts` - Lesson plan structure types (if needed)

## Success Criteria

### Layout Consistency 🔄
- [ ] All dashboard pages use the same layout structure
- [ ] Consistent styling across all pages
- [ ] Role-based content properly implemented
- [ ] Responsive design maintained

### AI Coach Enhancement ✅
- [x] AI generates detailed martial arts lesson plans
- [x] Lesson plans follow the exact structure requested
- [x] Support for multiple martial arts disciplines (BJJ, MMA, Boxing, Wrestling, Soccer, etc.)
- [x] Professional formatting with sections, headers, and bullet points
- [x] Proper time allocations and detailed explanations
- [x] Dynamic sport-specific terminology and focus areas

### Coach Management System ✅
- [x] Athletes can apply to become coaches
- [x] Multi-step application form with comprehensive information
- [x] Admin panel for reviewing and managing applications
- [x] Coach approval/rejection workflow
- [x] Coach status management (active/inactive)
- [x] Public-facing coach application page

## Completed Features

### ✅ AI Lesson Plan Generator
- Dynamic lesson plan generation for any sport
- Professional formatting with structured sections
- Sport-specific terminology and techniques
- Customizable duration, level, and topic
- Export and copy functionality

### ✅ Coach Management Flow
- Public application page with marketing content
- Multi-step application form with validation
- Admin review panel with detailed application view
- Approval workflow that creates coach records
- Coach status management for admins

### ✅ Enhanced AI Service
- Updated API route to handle lesson plan requests
- Higher token limits for detailed lesson plans
- Fallback providers for reliability
- Sport-specific prompt generation

## Next Steps
1. ✅ Phase 2: AI Coach enhancement - COMPLETED
2. ✅ Phase 3: Coach management system - COMPLETED  
3. 🔄 Phase 1: Layout standardization - IN PROGRESS
4. 🔄 Phase 4: Testing and refinement - PENDING
