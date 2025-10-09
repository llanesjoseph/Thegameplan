# Sports Constants Migration Guide

## Problem
The codebase had **19+ different hardcoded sports lists** scattered across multiple files, leading to:
- ❌ Inconsistent sports available in different parts of the app
- ❌ BJJ (Brazilian Jiu-Jitsu) missing from some lists
- ❌ Different formatting (e.g., "Football" vs "American Football")
- ❌ Maintenance nightmare when adding new sports

## Solution
✅ Created centralized sports constants in `/lib/constants/sports.ts`

## Canonical Sports List
```typescript
export const SPORTS = [
  'Soccer',
  'Basketball',
  'Baseball',
  'Tennis',
  'Brazilian Jiu-Jitsu',  // ← BJJ now included!
  'Running',
  'Volleyball',
  'Swimming',
  'American Football',
  'Golf',
  'Boxing',
  'Track & Field',
  'Wrestling',
  'Softball',
  'Other'
] as const
```

## Files Already Updated ✅
1. **`app/dashboard/coach/invite/page.tsx`**
   - Single invite sport dropdown
   - Bulk invite sport dropdown
   - Status: ✅ Complete

## Files That Should Be Updated

### High Priority (User-Facing)
1. **`app/athlete-onboard/[id]/page.tsx`** (Line 37)
   - Current: Hardcoded `SPORTS_LIST`
   - Update: `import { SPORTS } from '@/lib/constants/sports'`

2. **`app/dashboard/profile/page.tsx`** (Line 43)
   - Current: Hardcoded `SPORTS_OPTIONS`
   - Update: `import { SPORTS } from '@/lib/constants/sports'`

3. **`app/dashboard/apply-coach/page.tsx`** (Line 13)
   - Current: Hardcoded `SPORTS_OPTIONS`
   - Update: `import { SPORTS } from '@/lib/constants/sports'`

4. **`app/onboarding/page.tsx`** (Line 32)
   - Current: Hardcoded `SPORTS_OPTIONS`
   - Update: `import { SPORTS } from '@/lib/constants/sports'`

5. **`app/dashboard/creator/athletes/page.tsx`** (Line 41)
   - Current: Hardcoded `SPORTS_LIST`
   - Update: `import { SPORTS } from '@/lib/constants/sports'`

### Medium Priority (Admin/Internal)
6. **`components/admin/CoachIngestionManager.tsx`** (Line 57)
   - Current: Hardcoded `sports` array
   - Update: `import { SPORTS } from '@/lib/constants/sports'`

7. **`components/gear/CreatorGearManager.tsx`** (Line 48)
   - Current: Hardcoded `sports` array
   - Update: `import { SPORTS } from '@/lib/constants/sports'`

8. **`app/contributors/page.tsx`** (Line 37)
   - Current: Hardcoded `SPORTS` array
   - Update: `import { SPORTS } from '@/lib/constants/sports'`

9. **`app/contributors/apply/page.tsx`** (Line 60)
   - Current: Hardcoded `SPORTS` array
   - **Note:** This file also has sport-specific specialties/content that should remain

10. **`app/dashboard/admin/sync-coaches/page.tsx`** (Line 93)
    - Current: Hardcoded `VALID_SPORTS`
    - Update: `import { SPORTS } from '@/lib/constants/sports'`

11. **`app/api/admin/fix-coach-sports/route.ts`** (Line 13)
    - Current: Hardcoded `VALID_SPORTS`
    - Update: `import { SPORTS } from '@/lib/constants/sports'`

12. **`scripts/fix-coach-sports.ts`** (Line 7)
    - Current: Hardcoded `VALID_SPORTS`
    - Update: `import { SPORTS } from '@/lib/constants/sports'`

### Low Priority (Dynamic/Derived Lists)
13. **`app/gear/page.tsx`** (Line 302)
    - Current: Dynamic list from gear items
    - Action: Keep as-is (dynamic based on available gear)

14. **`lib/ai-service.ts`** (Lines 535, 2572)
    - Current: `sportsKeywords` for AI matching
    - Action: Could reference SPORTS but currently serves different purpose

15. **`lib/medical-safety.ts`** (Line 173)
    - Current: `sportsRecoveryContext` for medical context
    - Action: Keep as-is (specific medical keywords)

## Migration Script Pattern

```typescript
// BEFORE
const SPORTS_OPTIONS = [
  'Baseball',
  'Basketball',
  // ... more sports
]

// AFTER
import { SPORTS } from '@/lib/constants/sports'

// Use SPORTS directly in map:
{SPORTS.map(sport => (
  <option key={sport} value={sport}>{sport}</option>
))}
```

## Benefits After Migration
✅ **Consistency**: All dropdowns show the same sports
✅ **Maintainability**: Add a sport once, it appears everywhere
✅ **Type Safety**: TypeScript knows exact sport values
✅ **BJJ Included**: Brazilian Jiu-Jitsu now available everywhere
✅ **Validation**: `isValidSport()` and `normalizeSportName()` helpers

## Testing Checklist
After updating each file:
- [ ] Build passes: `npm run build`
- [ ] Sports dropdown displays correctly
- [ ] BJJ appears in list
- [ ] Selected sport saves properly
- [ ] No TypeScript errors

## Rollout Plan
1. ✅ **Phase 1**: Create centralized constant (DONE)
2. ✅ **Phase 2**: Update invite athletes page (DONE)
3. **Phase 3**: Update high-priority user-facing pages
4. **Phase 4**: Update medium-priority admin pages
5. **Phase 5**: Review and update remaining files

## Notes
- Some files like `app/contributors/apply/page.tsx` have sport-specific data (specialties, content types) that should remain
- Dynamic lists (like gear categories) should remain dynamic
- AI keyword lists may need to stay separate for matching purposes

---
**Last Updated:** 2025-10-09
**Status:** Phase 2 Complete - Invite Athletes Page Updated
