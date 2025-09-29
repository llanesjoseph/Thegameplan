# Creator → Coach Migration Strategy

## Overview
The app currently uses both "creator" and "coach" terminology interchangeably. This document outlines the strategy to consolidate everything to use "coach" as the primary term.

## Current State
- **Role names**: Both `creator` and `coach` exist as separate roles in the type system
- **Database collections**: Use `creator_profiles`, `creators_index`, `contributorApplications`
- **File paths**: Mix of `/dashboard/creator/` and `/dashboard/coach/`
- **UI labels**: Inconsistent use of "Creator" and "Coach"
- **Storage paths**: Use `/creators/{id}/` prefix

## Migration Strategy

### Phase 1: Backward Compatibility Layer (COMPLETED)
✅ Added helper functions in `types/user.ts`:
- `normalizeRole(role)` - converts 'creator' to 'coach'
- `isCoachRole(role)` - checks if role is coach OR creator

### Phase 2: UI and Label Updates (TODO)
Update all user-facing text:
- [ ] Dashboard titles and headers
- [ ] Navigation menu items
- [ ] Button labels
- [ ] Page titles and descriptions
- [ ] Application forms

### Phase 3: Route Consolidation (TODO)
Consolidate routes to use `/coach/` prefix:
- [ ] Keep `/dashboard/creator/` as alias (redirect to `/dashboard/coach/`)
- [ ] Update all internal links to use `/dashboard/coach/`
- [ ] Add route redirects for backward compatibility

### Phase 4: Database Schema (FUTURE - DO NOT DO YET)
**WARNING**: This will require data migration and should be done carefully:
- [ ] Create migration script to copy `creator_profiles` → `coach_profiles`
- [ ] Update Firestore rules to support both collections during transition
- [ ] Update all code references to use new collection names
- [ ] Migrate storage paths from `/creators/` to `/coaches/`
- [ ] Update all API endpoints

### Phase 5: Role Unification (FUTURE)
- [ ] Update all new user registrations to use 'coach' role only
- [ ] Create background job to migrate existing 'creator' roles to 'coach'
- [ ] Update firestore.rules to treat 'creator' and 'coach' as equivalent
- [ ] Eventually deprecate 'creator' role entirely

## Key Principle
**ALWAYS maintain backward compatibility.** Never break existing data or functionality.

## Quick Reference

### Don't Break These:
- ❌ Database collection names (`creator_profiles`, `creators_index`)
- ❌ Storage paths (`/creators/{id}/`)
- ❌ Existing user roles in database
- ❌ API endpoints that external services depend on

### Safe to Change:
- ✅ UI labels and button text
- ✅ Page titles and descriptions
- ✅ Internal variable names
- ✅ Component names (with aliases)
- ✅ New code (use 'coach' for everything new)

## Implementation Notes

1. **Use `isCoachRole()` helper** instead of direct role comparisons
2. **Use `normalizeRole()` helper** when displaying roles to users
3. **Keep database schema unchanged** until Phase 4
4. **Add aliases/redirects** instead of removing old routes
5. **Test thoroughly** - role checks affect permissions everywhere

## Timeline
- Phase 1: ✅ Complete
- Phase 2: Can be done incrementally, file by file
- Phase 3: Can be done incrementally with redirects
- Phase 4-5: Requires careful planning and staging (months away)