# Final Form Wiring Guide
## Invitations & Approvals Page - Complete Implementation

**Status**: 95% Complete - Only form input wiring remaining
**File**: `app/dashboard/admin/invitations-approvals/page.tsx`
**Est. Time**: 15-20 minutes

---

## What's Already Done ✅

1. ✅ All API endpoints created and tested
2. ✅ State management added (lines 111-134)
3. ✅ Handler functions created (lines 268-388):
   - `loadCoaches()` - Loads coaches for athlete assignment
   - `handleCoachInviteSubmit()` - Submits coach invitation
   - `handleAthleteInviteSubmit()` - Submits athlete invitation
4. ✅ useEffect hook updated to load coaches (line 143)
5. ✅ UI tabs created with proper layout
6. ✅ Email templates created
7. ✅ Storage schema designed
8. ✅ Comprehensive audit completed

---

## What's Left: Wire Form Inputs

### Option 1: Quick Fix (Copy & Paste)

Replace the entire COACH INVITES TAB section (lines 664-749) with this:

```tsx
        {/* COACH INVITES TAB */}
        {activeTab === 'coach-invites' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="w-6 h-6" style={{ color: '#20B2AA' }} />
                <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>Invite Coach</h2>
              </div>
              <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                Invite qualified coaches to join the platform and work with athletes
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Coach Email *
                  </label>
                  <input
                    type="email"
                    value={coachInviteForm.coachEmail}
                    onChange={(e) => setCoachInviteForm(prev => ({...prev, coachEmail: e.target.value}))}
                    placeholder="coach@example.com"
                    disabled={coachInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Coach Name *
                  </label>
                  <input
                    type="text"
                    value={coachInviteForm.coachName}
                    onChange={(e) => setCoachInviteForm(prev => ({...prev, coachName: e.target.value}))}
                    placeholder="John Smith"
                    disabled={coachInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Sport *
                  </label>
                  <select
                    value={coachInviteForm.sport}
                    onChange={(e) => setCoachInviteForm(prev => ({...prev, sport: e.target.value}))}
                    disabled={coachInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select sport...</option>
                    <option value="baseball">Baseball</option>
                    <option value="basketball">Basketball</option>
                    <option value="football">Football</option>
                    <option value="soccer">Soccer</option>
                    <option value="softball">Softball</option>
                    <option value="volleyball">Volleyball</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Link Expires In (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={coachInviteForm.expiresInDays}
                    onChange={(e) => setCoachInviteForm(prev => ({...prev, expiresInDays: parseInt(e.target.value) || 7}))}
                    disabled={coachInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Welcome Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={coachInviteForm.customMessage}
                  onChange={(e) => setCoachInviteForm(prev => ({...prev, customMessage: e.target.value}))}
                  placeholder="Welcome message for the coach..."
                  disabled={coachInviteLoading}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                onClick={handleCoachInviteSubmit}
                disabled={coachInviteLoading}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {coachInviteLoading ? 'Sending...' : 'Send Coach Invitation'}
              </button>
            </div>
          </div>
        )}
```

### Option 2: Replace Athlete Invites Tab

Replace the entire ATHLETE INVITES TAB section (lines 751-827) with this:

```tsx
        {/* ATHLETE INVITES TAB */}
        {activeTab === 'athlete-invites' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/50 p-6">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6" style={{ color: '#91A6EB' }} />
                <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>Invite Athlete</h2>
              </div>
              <p className="text-sm" style={{ color: '#000000', opacity: 0.7 }}>
                Invite athletes and assign them to a coach
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Athlete Email *
                  </label>
                  <input
                    type="email"
                    value={athleteInviteForm.athleteEmail}
                    onChange={(e) => setAthleteInviteForm(prev => ({...prev, athleteEmail: e.target.value}))}
                    placeholder="athlete@example.com"
                    disabled={athleteInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Athlete Name *
                  </label>
                  <input
                    type="text"
                    value={athleteInviteForm.athleteName}
                    onChange={(e) => setAthleteInviteForm(prev => ({...prev, athleteName: e.target.value}))}
                    placeholder="Jane Doe"
                    disabled={athleteInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Sport *
                  </label>
                  <select
                    value={athleteInviteForm.sport}
                    onChange={(e) => setAthleteInviteForm(prev => ({...prev, sport: e.target.value}))}
                    disabled={athleteInviteLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select sport...</option>
                    <option value="baseball">Baseball</option>
                    <option value="basketball">Basketball</option>
                    <option value="football">Football</option>
                    <option value="soccer">Soccer</option>
                    <option value="softball">Softball</option>
                    <option value="volleyball">Volleyball</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                    Assign to Coach *
                  </label>
                  <select
                    value={athleteInviteForm.coachId}
                    onChange={(e) => setAthleteInviteForm(prev => ({...prev, coachId: e.target.value}))}
                    disabled={athleteInviteLoading || coachesLoading}
                    className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {coachesLoading ? 'Loading coaches...' : coaches.length === 0 ? 'No coaches available' : 'Select coach...'}
                    </option>
                    {coaches.map(coach => (
                      <option key={coach.id} value={coach.id}>
                        {coach.name} - {coach.sport} ({coach.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Link Expires In (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={athleteInviteForm.expiresInDays}
                  onChange={(e) => setAthleteInviteForm(prev => ({...prev, expiresInDays: parseInt(e.target.value) || 14}))}
                  disabled={athleteInviteLoading}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#000000' }}>
                  Welcome Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={athleteInviteForm.customMessage}
                  onChange={(e) => setAthleteInviteForm(prev => ({...prev, customMessage: e.target.value}))}
                  placeholder="Welcome message for the athlete..."
                  disabled={athleteInviteLoading}
                  className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <button
                onClick={handleAthleteInviteSubmit}
                disabled={athleteInviteLoading || !athleteInviteForm.coachId}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {athleteInviteLoading ? 'Sending...' : 'Send Athlete Invitation'}
              </button>
            </div>
          </div>
        )}
```

---

## Testing Checklist

After wiring the forms, test:

1. **Coach Invitation**:
   - [ ] Fill form, click submit
   - [ ] Check console for API call
   - [ ] Verify invitation in Firestore `invitations` collection
   - [ ] Check email received

2. **Athlete Invitation**:
   - [ ] Tab loads coaches dropdown
   - [ ] Select coach from dropdown
   - [ ] Fill form, click submit
   - [ ] Verify invitation in Firestore with `coachId`
   - [ ] Check athlete email received
   - [ ] Check coach notification email received

3. **Error Handling**:
   - [ ] Try duplicate email (should error)
   - [ ] Try missing required fields (should error)
   - [ ] Try invalid email format (should error)

---

## Summary

**All backend logic is complete**. The forms just need their inputs wired to state (value + onChange). Copy the code blocks above to finish the implementation in <5 minutes.

See `INVITATIONS_SYSTEM_AUDIT.md` for complete system documentation.
