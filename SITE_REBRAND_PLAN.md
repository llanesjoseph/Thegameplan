# Site-wide Rebrand Plan (AthLeap)

Goal: Apply the new, clean, frameless layout and square-image visual language across all user roles (Athlete, Coach, Admin-lite where applicable) with minimal regression risk and fast iteration.

## Foundations
- Typography: Open Sans (400/700)
- Colors: Primary Red `#FC0105`, Dark `#440102`, Black `#000000`, White `#FFFFFF`, Greys for placeholders
- Cards: Frameless sections; square assets; consistent paddings (`py-3`, compact `gap-4`)
- Navigation: Simple header with logo left, context links right

## Scope
1) Athlete (done) – baseline reference
2) Coach (preview added: `/dashboard/coach-unified/rebrand`)
3) Shared components: buttons, inputs, placeholders, modal styles
4) Admin-light touch (only the areas visible to coaches/athletes)

## Coach Rebrand (Preview)
- New page: `/dashboard/coach-unified/rebrand` – read-only preview that mirrors athlete layout:
  - `CoachOverview` – welcome header
  - `CoachProfile` – text left, square image right, sport chips
  - `CoachAthletes` – square athlete cards (placeholder; link to existing pages)
  - `CoachLessonLibrary` – square lesson cards (route to current library)
  - `CoachRecommendedGear` – square gear cards

Implementation choices:
- Avoid SSR Firestore calls in preview to prevent build/runtime issues; hydrate with `useAuth` where possible and placeholders elsewhere.
- Keep existing coach tools intact (`/dashboard/coach-unified`) until design is approved.

## Rollout Steps
1. Validate coach preview with stakeholders
2. Replace `/dashboard/coach-unified` with the new frameless layout (behind feature flag)
3. Incrementally wire real data:
   - Coach profile: sports, bio, specialties from Firestore/claim-backed API
   - Athletes grid: list from `/api/coach/athletes`
   - Lesson library: list from `/api/coach/lessons`
   - Gear: curated list or affiliate products
4. Shared styling cleanup:
   - Consolidate Tailwind utility classes; build small style helpers
   - Ensure consistent square sizes (128/144/224 breakpoints)
5. Accessibility + QA:
   - Keyboard focus on interactive items
   - Color contrast checks
   - Mobile viewport tests
6. Performance:
   - Lazy-load heavy images
   - Cache GET endpoints; optimistic UI for updates

## Risks & Mitigations
- Data fetching across SSR/CSR: keep CSR in client components; route through secure API endpoints
- Route changes: preserve existing URLs; add previews first
- Regression: feature-flagged rollout, side-by-side testing

## Next Work Items
- Wire real data for coach preview (API stubs → real endpoints)
- Add “Schedule 1-1” entry point from coach page (navigates to live sessions)
- Align admin-facing coach profile editor to produce required fields for the new UI

---

Note on slide deck: The PPTX reference you shared is captured in our components and layout constraints (square imagery, frameless sections). If you have updates, drop the latest file and we’ll sync details into this plan before final rollout.


