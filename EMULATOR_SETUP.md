# Firebase Emulator Setup Guide

## Overview

The Firebase Firestore emulator is required to run the 40 security rules tests located in `tests/security/firestore-rules.test.ts`. These tests validate critical data access controls.

## Prerequisites

**Java Runtime Environment (JRE) 11 or higher is REQUIRED**

### Check if Java is installed:
```bash
java -version
```

### Install Java (if needed):

**Windows:**
```powershell
# Using Chocolatey
choco install openjdk11

# Or download from: https://adoptium.net/
```

**macOS:**
```bash
# Using Homebrew
brew install openjdk@11
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install openjdk-11-jre
```

## Emulator Configuration

The emulator is already configured in `firebase.json`:

```json
{
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## Running Security Tests

### Option 1: Run tests with emulator (Recommended)
```bash
npm run emulator:test
```

This command:
1. Starts the Firestore emulator on port 8080
2. Runs all security rules tests
3. Automatically shuts down the emulator when complete

### Option 2: Manual emulator control
```bash
# Start the emulator (runs in foreground)
npm run emulator:start

# In another terminal, run security tests
npm run test:security
```

### Option 3: Run all tests (requires emulator)
```bash
npm run test:all
```

This runs unit + integration + security + E2E tests.

## What the Security Tests Validate

The 40 security rules tests ensure:

### Users Collection
- ✅ Users can only read/write their own profile
- ✅ Users cannot modify their own role (prevents privilege escalation)
- ✅ Admins can access any user profile
- ✅ Only superadmins can delete users

### Messages Collection
- ✅ Users can only send messages as themselves
- ✅ Users can only read messages where they're sender/recipient
- ✅ Messages are immutable (cannot be deleted - 7-year retention)
- ✅ Recipients can mark messages as read (but not modify content)
- ✅ Message size limits enforced (max 2000 chars)
- ✅ Empty messages blocked

### Audit Logs
- ✅ Only admins can read audit logs
- ✅ Audit logs are immutable (no updates or deletes)

### Feature Flags
- ✅ All authenticated users can read flags
- ✅ Only admins can write/update flags

### Admin Invitations
- ✅ Only admins can create admin invitations
- ✅ Invitations cannot be deleted (audit trail)

### Athletes Collection
- ✅ Athletes can read their own profile
- ✅ Coaches can read their athletes' profiles
- ✅ Unrelated users cannot access athlete profiles
- ✅ Client-side creation blocked (server-side only)

### Moderation Alerts
- ✅ Only admins can read moderation alerts
- ✅ Client-side creation blocked (server-side only)
- ✅ Cannot be deleted (permanent record)

### Content Collection
- ✅ Only creators can create content
- ✅ Creators can only update their own content
- ✅ Regular users only see published content

## CI/CD Integration

For GitHub Actions, add Java setup to your workflow:

```yaml
# .github/workflows/test.yml
name: Tests
on: [pull_request, push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Java (for Firebase Emulator)
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'

      - name: Install dependencies
        run: npm install

      - name: Run unit and integration tests
        run: npm run test:unit && npm run test:integration

      - name: Run security tests with emulator
        run: npm run emulator:test

      - name: Generate coverage
        run: npm run test:coverage
```

## Troubleshooting

### Error: "Could not spawn java -version"
**Solution:** Install Java JRE 11+ (see Prerequisites above)

### Error: "Port 8080 already in use"
**Solution:** Stop any process using port 8080:
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8080 | xargs kill -9
```

### Error: "ECONNREFUSED ::1:8080"
**Solution:** Ensure the emulator is running before tests:
```bash
# Start emulator in one terminal
npm run emulator:start

# Run tests in another terminal
npm run test:security
```

## Current Status

- ✅ Firebase emulator configured (port 8080)
- ✅ Security rules tests written (40 tests)
- ✅ Test scripts configured
- ✅ Emulator UI enabled (port 4000)
- ⚠️ Requires Java JRE 11+ to run

## Running Tests Without Java

If Java is not available, you can:

1. **Run other test suites** (don't require emulator):
   ```bash
   npm run test:unit          # Unit tests
   npm run test:integration   # Integration tests
   npm test                   # All tests except security
   ```

2. **Skip security tests in CI** until Java is set up

3. **Review rules manually** in `firestore.rules`

## Next Steps

1. Install Java JRE 11+
2. Run `npm run emulator:test` to verify setup
3. All 40 security tests should pass
4. Add to CI/CD pipeline for automated validation
