# PLAYBOOKD Testing Strategy

## 🎯 Goal
Catch bugs before users (coaches, athletes, admins) encounter them in production.

## 📊 Current Test Coverage

### ✅ Unit Tests (`tests/unit/`)
**Fast, isolated tests for individual functions and logic**

1. **phone-detection.test.ts** - CRITICAL SECURITY
   - Tests phone number detection in messages
   - Ensures safety system catches all phone number formats
   - Prevents false positives (dates, scores, times)
   - **Run before deploying message features**

2. **role-routing.test.ts** - ACCESS CONTROL
   - Tests admin/superadmin routing to correct dashboards
   - Prevents unauthorized access to admin features
   - Ensures users land on correct dashboard by role
   - **Run before deploying auth or routing changes**

3. **athlete-profile-data.test.ts** - DATA INTEGRITY
   - Tests athlete registration data appears on profile
   - Regression test for bug Lona found
   - Validates data mapping from registration to profile
   - **Run before deploying profile or registration changes**

### ✅ Integration Tests (`tests/integration/`)
**Tests for API validation logic and multi-component interactions**

1. **api-validation.test.ts** - API BUSINESS LOGIC
   - Athlete registration validation
   - Admin invitation validation
   - Feature flag validation
   - Message content validation
   - **Run before deploying any API changes**

### ✅ E2E Tests (`tests/e2e/`)
**Full user flow tests simulating real browser interactions**

1. **critical-flows.spec.ts** - USER JOURNEYS
   - Admin dashboard access and routing
   - Profile page visibility
   - Public page loading
   - Navigation and responsive design
   - Error handling
   - **Run before major releases**

## 🚀 How to Run Tests

### Run All Tests (Recommended before commits)
```bash
npm test
```

### Run Specific Test Types
```bash
npm run test:unit           # Fast unit tests only
npm run test:integration    # API validation tests
npm run test:e2e           # Full browser E2E tests
npm run test:all           # Run everything
```

### Development Workflow
```bash
npm run test:watch         # Auto-run tests on file changes
npm run test:ui            # Visual test UI (Vitest)
npm run test:e2e:ui        # Visual E2E test UI (Playwright)
```

### Coverage Reports
```bash
npm run test:coverage      # Generate code coverage report
```

## 📋 Testing Checklist

### Before Every Commit:
- [ ] Run `npm test` (unit + integration tests)
- [ ] All tests pass
- [ ] No console errors

### Before Deploying to Production:
- [ ] Run `npm run test:all`
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Critical E2E flows pass
- [ ] Check test coverage > 70%
- [ ] Manual smoke test of changed features

### After Fixing a Bug:
- [ ] Write a test that would have caught the bug
- [ ] Verify test fails without the fix
- [ ] Verify test passes with the fix
- [ ] Add test to appropriate test file

## 🎯 Test Priority Matrix

### HIGH Priority (Run on every deploy):
1. ✅ Phone number detection (security)
2. ✅ Role-based access control (security)
3. ✅ Admin routing (prevents getting stuck)
4. ✅ Athlete profile data loading (prevents user frustration)
5. ⏳ Authentication flows (TODO - needs Firebase emulator)
6. ⏳ Message sending/receiving (TODO - needs Firebase emulator)

### MEDIUM Priority (Run weekly or before major releases):
1. ✅ API validation logic
2. ✅ Form validation
3. ✅ Navigation and routing
4. ⏳ Feature flag toggling (TODO - needs Firebase emulator)
5. ⏳ Invitation system (TODO - needs Firebase emulator)

### LOW Priority (Run monthly or as needed):
1. ✅ Responsive design
2. ✅ Error handling
3. ✅ Performance benchmarks
4. UI component rendering
5. Styling consistency

## 🔧 Setup Instructions

### First Time Setup:
```bash
# Install dependencies (already done)
npm install

# Install Playwright browsers
npx playwright install
```

### Firebase Emulator Setup (for full integration tests):
```bash
# Install Firebase tools (already done)
npm install -g firebase-tools

# Start emulators
firebase emulators:start

# Run tests against emulator
FIREBASE_EMULATOR=true npm test
```

## 📝 Writing New Tests

### When to Write a Test:
1. ✅ **Before fixing a bug** - Write test that exposes the bug
2. ✅ **For new features** - Write tests for core functionality
3. ✅ **For security features** - Always test auth, permissions, data validation
4. ✅ **For critical user flows** - Test complete journeys (signup, onboarding, etc.)

### Test File Naming:
- `feature-name.test.ts` - Unit/integration tests
- `feature-name.spec.ts` - E2E tests

### Test Structure:
```typescript
describe('Feature Name', () => {
  describe('Specific Scenario', () => {
    it('should do expected behavior', () => {
      // Arrange - Set up test data
      // Act - Perform action
      // Assert - Verify result
    })
  })
})
```

## 🐛 Bug Found? Add a Test!

**Example: Athlete Profile Data Bug**

1. **Bug Report**: "Athlete registration data not showing on profile"
2. **Write Test**: Created `athlete-profile-data.test.ts`
3. **Test Fails**: ✅ Confirms bug exists
4. **Fix Bug**: Updated profile page to load from athletes collection
5. **Test Passes**: ✅ Bug fixed and protected from regression

## 📈 Coverage Goals

- **Critical Features**: 90%+ coverage
  - Authentication
  - Role-based access
  - Phone number detection
  - Payment flows (when implemented)

- **Important Features**: 70%+ coverage
  - Athlete registration
  - Coach content creation
  - Messaging system
  - Admin features

- **Nice-to-Have Features**: 50%+ coverage
  - UI components
  - Styling
  - Analytics

## 🚨 Failed Test? Don't Deploy!

**If tests fail:**
1. ❌ **DO NOT** deploy to production
2. ❌ **DO NOT** merge to main branch
3. ✅ **DO** investigate and fix the failing test
4. ✅ **DO** verify the fix locally
5. ✅ **DO** ensure all tests pass before deploying

## 📞 Need Help?

- Check test output for specific error messages
- Look at existing tests for examples
- Run `npm run test:ui` for visual debugging
- Run `npm run test:e2e:headed` to see E2E tests in browser

## 🔄 Continuous Improvement

As you find bugs:
1. Add tests to catch them
2. Update this document
3. Increase test coverage
4. Ship more confidently!

---

**Remember**: Tests are your safety net. They catch bugs before users do, save time debugging, and give you confidence to ship features faster! 🚀
