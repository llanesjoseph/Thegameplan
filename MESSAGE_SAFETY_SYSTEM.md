# Message Safety & Accountability System

## Overview

The PLAYBOOKD platform implements a comprehensive message safety and accountability system to ensure secure, monitored athlete-coach communications. All messages are recorded, moderated, and stored for legal compliance and safety.

## Core Principles

1. **Immutability**: Messages cannot be deleted or edited (except read status)
2. **Complete Audit Trail**: Every message is logged with full metadata
3. **Automated Moderation**: Content is automatically scanned for safety issues
4. **Admin Oversight**: Admins can monitor all communications
5. **7-Year Retention**: Messages retained for legal compliance
6. **User Reporting**: Users can report inappropriate content

## System Architecture

### 1. Message Audit Logging (`lib/message-audit-logger.ts`)

Every message creates an immutable audit log with:

```typescript
interface MessageAuditLog {
  // Identity
  messageId: string
  conversationId: string // athlete_coach pair

  // Participants
  senderId: string
  senderName: string
  senderRole: string
  recipientId: string
  recipientName: string
  recipientRole: string

  // Content
  content: string
  contentLength: number

  // Metadata
  timestamp: Timestamp
  clientIP: string
  userAgent: string

  // Safety
  flagged: boolean
  flaggedReasons: string[]
  moderationScore: {
    toxicity: number
    profanity: number
    threat: number
    inappropriate: number
  }

  // Audit
  retentionUntil: Timestamp // 7 years from creation
}
```

### 2. Automated Content Moderation

All messages are automatically scanned for:

#### Safety Categories

**Profanity Detection**
- Keywords: offensive language, swear words
- Action: Flagged, moderate severity

**Threat Detection** 🔴 CRITICAL
- Keywords: violence, harm, weapons
- Action: Immediate alert, high severity

**Inappropriate Content** ⚠️ HIGH PRIORITY
- Keywords: sexual content, romantic advances
- Special protection for minor athletes
- Action: High severity alert

**Bullying/Harassment**
- Keywords: insults, degrading language
- Action: Flagged for review

**Phone Number Exchange** 🚨🚨🚨 CRITICAL - IMMEDIATE ADMIN ALERT
- Detects: All phone number formats (US & International)
  - 123-456-7890
  - (123) 456-7890
  - 1234567890
  - 123 456 7890
  - +1 (123) 456-7890
  - International formats
- Severity: CRITICAL (0.9 threat score)
- Action:
  - Immediate console alert with full details
  - Admin dashboard critical notification
  - Requires immediate review
  - Potential grooming risk

**Email Sharing** ⚠️ HIGH PRIORITY
- Detects: Email addresses in any format
- Severity: HIGH (0.7 inappropriate score)
- Action: Immediate flag for review

**Social Media Handle Sharing** ⚠️ MEDIUM PRIORITY
- Detects: @username patterns
- Severity: MEDIUM (0.6 inappropriate score)
- Action: Flag for review

#### Severity Levels

```typescript
- CRITICAL: Phone numbers, threats, violence → IMMEDIATE admin notification
- HIGH: Email sharing, inappropriate content, grooming indicators
- MEDIUM: Social media handles, harassment, bullying
- LOW: Profanity, minor violations
```

#### Phone Number Detection - CRITICAL PRIORITY

When a phone number is detected:

```
Message sent with phone number
    ↓
Automated scan detects phone pattern
    ↓
🚨🚨🚨 CRITICAL ALERT
    ↓
Console logs:
  - "PHONE NUMBER EXCHANGE DETECTED"
  - Sender name and role
  - Recipient name and role
  - Message ID
  - "ADMIN REVIEW REQUIRED IMMEDIATELY"
    ↓
Moderation alert created with:
  - severity: 'critical'
  - requiresImmediateAttention: true
  - flaggedReasons: ['phone_number_exchange']
    ↓
Admin dashboard shows CRITICAL badge
    ↓
Admin must review within 1 hour
```

**Why Phone Numbers Are Critical:**
- Primary grooming tactic (move conversation off-platform)
- Enables direct contact with athlete
- Bypasses platform safety monitoring
- High risk for minors
- Legal liability for platform

### 3. Firestore Security Rules

**Messages Collection** - IMMUTABLE
```javascript
match /messages/{messageId} {
  // Read: Only sender, recipient, or admin
  allow read: if isAuthenticated() &&
                 (isSenderOrRecipient() || isAdmin())

  // Create: Users can send messages
  allow create: if isAuthenticated() &&
                   isSender() &&
                   validMessageStructure()

  // Update: ONLY read status can be updated
  allow update: if isRecipient() &&
                   onlyUpdatingReadStatus()

  // Delete: NEVER - permanent audit trail
  allow delete: if false
}
```

**Audit Logs** - ADMIN READ ONLY
```javascript
match /message_audit_logs/{logId} {
  allow read: if isAdmin()
  allow create, update, delete: if false
}
```

**Moderation Alerts** - ADMIN ONLY
```javascript
match /moderation_alerts/{alertId} {
  allow read: if isAdmin()
  allow update: if isAdmin() // Status updates only
  allow create, delete: if false
}
```

### 4. Admin Monitoring Dashboard

**Location**: `/dashboard/admin/message-monitoring`

**Features**:
- View all moderation alerts
- Filter by severity (Critical, High, Medium, Low)
- Filter by status (Pending, Reviewed, Action Taken, Dismissed)
- Search messages by content or participant
- View full conversation history
- Take action on flagged content

**Statistics**:
- Total alerts
- Pending reviews
- Critical alerts
- Total messages
- Flagged messages

### 5. User Reporting System

**API**: `/api/messages/report`

Users can report inappropriate messages with:
- Report reason (select from categories)
- Additional details
- Automatic high-severity alert creation

Reports are:
- Immutable (cannot be deleted)
- Visible to reporter and admins
- Automatically create moderation alerts

## Data Retention & Compliance

### Retention Policy

**7-Year Retention** (Legal Compliance)
- All messages stored for 7 years
- All audit logs stored for 7 years
- All moderation alerts stored permanently
- Reports stored permanently

**Automated Cleanup**
- Messages older than 7 years can be archived
- Audit logs retained for historical analysis
- Alerts never deleted (compliance)

### COPPA Compliance

**For Users Under 13**:
- Extra scrutiny on coach-athlete communications
- Parental notification for flagged content
- Mandatory admin review of all communications

**For Users 13-18**:
- Automated moderation
- Parent/guardian access to message history
- Enhanced reporting features

## Safety Workflows

### 1. Message Sending Flow

```
User sends message
    ↓
Validate content (length, structure)
    ↓
Create message in Firestore
    ↓
Run automated moderation
    ↓
Log to audit trail
    ↓
If flagged → Create moderation alert
    ↓
Deliver to recipient
```

### 2. Moderation Alert Flow

```
Content flagged
    ↓
Calculate severity
    ↓
Create moderation alert
    ↓
Admin dashboard notification
    ↓
Admin reviews
    ↓
Action taken:
  - Dismiss (false positive)
  - Warning to user
  - Suspend user
  - Contact authorities (critical)
```

### 3. User Report Flow

```
User reports message
    ↓
Create report record
    ↓
Create high-severity moderation alert
    ↓
Admin notified
    ↓
Expedited review
    ↓
Action taken
    ↓
Reporter notified of outcome
```

## API Endpoints

### Public Endpoints

**POST `/api/messages/send`**
- Sends message with audit logging
- Requires authentication
- Returns message ID and timestamp

**POST `/api/messages/report`**
- Reports inappropriate message
- Requires authentication
- Returns report ID

### Admin Endpoints

**GET `/api/admin/moderation-alerts`**
- Fetch moderation alerts
- Filter by status
- Admin only

**GET `/api/admin/flagged-messages`**
- Fetch all flagged messages
- Admin only

**GET `/api/admin/conversation-audit/:athleteId/:coachId`**
- Full conversation history
- Admin only

## Monitoring & Alerts

### Real-Time Monitoring

**Critical Alerts** → Immediate notification
- Email to admin team
- Dashboard banner
- Mobile push notification (future)

**High Severity** → Within 1 hour review
- Dashboard alert
- Email notification

**Medium Severity** → Daily review
- Dashboard queue
- Daily summary email

**Low Severity** → Weekly review
- Dashboard queue
- Weekly summary

### Metrics Tracked

- Total messages per day/week/month
- Flagged message rate
- Response time to alerts
- User reports per week
- Action taken breakdown

## Best Practices

### For Admins

1. **Review ALL critical alerts within 1 hour**
2. **Document all actions taken**
3. **Contact authorities for threats or abuse**
4. **Maintain confidentiality of reviewed content**
5. **Regular audits of conversation patterns**

### For Users

1. **Report suspicious or inappropriate messages immediately**
2. **Never share personal contact information**
3. **Keep all communication on-platform**
4. **Encourage athletes to involve parents/guardians**
5. **Use professional language at all times**

## Emergency Procedures

### Critical Threat Detected

1. Immediate admin notification
2. Message content reviewed
3. If credible threat:
   - Contact local authorities
   - Suspend sender account
   - Notify recipient's parent/guardian
   - Document all actions
   - Legal team notification

### Grooming Indicators Detected

1. Flag conversation for deep review
2. Review full conversation history
3. Contact parent/guardian
4. Suspend coach account pending investigation
5. Report to authorities if warranted
6. Legal team notification

### User Report of Abuse

1. Expedited review (< 1 hour)
2. Contact reporter for additional context
3. Review full conversation
4. Take immediate protective action
5. Notify authorities if required
6. Support resources provided to victim

## Technical Implementation

### Files

- `lib/message-audit-logger.ts` - Core audit logging
- `app/api/messages/send/route.ts` - Message sending with logging
- `app/api/messages/report/route.ts` - User reporting
- `app/dashboard/admin/message-monitoring/page.tsx` - Admin dashboard
- `firestore.rules` - Security rules

### Collections

- `messages` - User messages (immutable except read status)
- `message_audit_logs` - Complete audit trail (admin only)
- `moderation_alerts` - Flagged content for review
- `message_reports` - User-generated reports

## Current Status

**LIVE FEATURES:**
✅ Complete audit logging system
✅ Automated content moderation
✅ Phone number detection (CRITICAL alerts)
✅ Admin monitoring dashboard
✅ User reporting system
✅ Immutable message records
✅ AI Coach chat (active on athlete dashboard)

**COMING SOON:**
🔜 Direct messaging UI (built, disabled for testing)
🔜 Email/SMS notifications for critical alerts
🔜 Parent/guardian dashboard access

**Direct Messaging Status:**
- Backend fully built and tested
- Safety systems active and monitoring
- Frontend shows "Coming Soon" to users
- Will be enabled after other feature testing complete
- AI Coach chat available in the meantime

## Future Enhancements

1. **Email/SMS Admin Alerts**: Immediate notification for critical flags
2. **AI-Powered Moderation**: OpenAI Moderation API integration
3. **Parent Dashboard**: Real-time message visibility for guardians
4. **Behavioral Analysis**: Pattern detection for suspicious activity
5. **Video Call Monitoring**: Metadata logging for video sessions
6. **Encrypted Messages**: End-to-end encryption with escrow keys

## Legal Compliance

### Records Maintained

✅ Complete message history
✅ Participant identities
✅ Timestamps and IP addresses
✅ Content moderation results
✅ Admin actions and reviews
✅ User reports

### Disclosures

- All users notified that communications are monitored
- Terms of Service include monitoring clause
- Privacy Policy details data retention
- COPPA compliance for minors

### Audit Trail

Every action is logged:
- Message sent
- Message read
- Message flagged
- Alert created
- Admin review
- Action taken

**Result**: Complete accountability and legal protection

---

**IMPORTANT**: This system is designed to protect athletes (especially minors) while maintaining accountability for all participants. Regular audits and updates are essential.
