# Data Model Patterns - Coach-Athlete Relationships

## CRITICAL: Dual-Field Pattern for Coach-Athlete Relationships

### Background
Due to historical reasons and backward compatibility, athlete documents may have the coach assigned using either `coachId` OR `assignedCoachId` fields. Some older records may only have one field set.

### ✅ REQUIRED PATTERN: Always Query BOTH Fields

When querying for athletes, submissions, or any coach-related data, **ALWAYS** query both `coachId` and `assignedCoachId` fields and deduplicate results.

### Examples

#### ❌ WRONG - Only querying one field:
```typescript
// DON'T DO THIS - Will miss records with only the other field set
const athletes = await adminDb
  .collection('users')
  .where('assignedCoachId', '==', coachId)
  .get()
```

#### ✅ CORRECT - Query both fields and deduplicate:
```typescript
// DO THIS - Catches all coach-athlete relationships
const [athletesByCoachId, athletesByAssignedCoachId] = await Promise.all([
  adminDb
    .collection('users')
    .where('coachId', '==', coachId)
    .get(),
  adminDb
    .collection('users')
    .where('assignedCoachId', '==', coachId)
    .get()
])

// Deduplicate using Set or Map
const athleteIds = new Set([
  ...athletesByCoachId.docs.map(doc => doc.id),
  ...athletesByAssignedCoachId.docs.map(doc => doc.id)
])

const totalAthletes = athleteIds.size
```

### When Creating/Updating Records

When creating or updating athlete records, **ALWAYS set BOTH fields** to the same value:

```typescript
const athleteData = {
  // ... other fields
  coachId: coachUid,
  assignedCoachId: coachUid,  // Set both to the same value
}

await adminDb.collection('users').doc(athleteId).set(athleteData)
```

### Files Using This Pattern Correctly

✅ **Reference implementations:**
- `app/api/coach/[id]/stats/route.ts` - Queries both fields for athlete count
- `app/api/coach/athletes/route.ts` - Queries coachId, assignedCoachId, AND creatorUid
- `app/api/coach/submissions/route.ts` - Queries both fields for submissions
- `app/api/complete-athlete-profile/route.ts` - Sets both fields when creating athletes

### Common Mistakes to Avoid

1. ❌ Only querying `assignedCoachId`
2. ❌ Only querying `coachId`
3. ❌ Setting only one field when creating records
4. ❌ Not deduplicating results after querying both fields

### Testing Checklist

When implementing or modifying coach-athlete queries:

- [ ] Queries both `coachId` AND `assignedCoachId` fields
- [ ] Deduplicates results (using Set or Map)
- [ ] Sets both fields when creating/updating records
- [ ] Tested with athletes that have only one field set
- [ ] Tested with athletes that have both fields set

### Future Goal

Eventually, we should:
1. Run a migration to ensure all records have both fields set consistently
2. Add database validation rules to require both fields
3. Potentially consolidate to a single field after migration is complete

Until then, **ALWAYS use the dual-field pattern**.

## Other Data Model Patterns

### Content/Lessons
Lessons use `creatorUid` to track the coach who created them:
- Field name: `creatorUid`
- Status: Use `status === 'published'` for public lessons

### Athlete Profiles
Athletes have data in TWO collections:
- `users` - Basic user account info (auth, role, coach assignment)
- `athletes` - Extended athlete profile (training goals, availability, etc.)

Both collections should have matching `coachId` and `assignedCoachId` fields.

---

**Last Updated:** 2025-10-31
**Related Issue:** Coach profiles showing 0 athletes/lessons due to single-field queries
