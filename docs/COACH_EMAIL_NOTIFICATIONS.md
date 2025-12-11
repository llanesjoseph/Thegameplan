# Coach Email Notification System Documentation

## Overview

The Coach Email Notification System provides automated email notifications to coaches when they send invitations to athletes and when those invitations are acted upon. This ensures coaches stay informed about their athlete recruitment efforts without having to constantly check the platform.

## Features

### 1. Invitation Sent Confirmation
When a coach sends invitations to athletes, they receive a confirmation email containing:
- Number of invitations sent
- List of athlete names (up to 10 shown)
- Sport type
- Next steps information
- Direct link to view their athletes dashboard

### 2. Athlete Acceptance Notification
When an athlete accepts an invitation, the coach receives an immediate notification with:
- Athlete's name and email
- Sport they're joining for
- Actions the coach can now take (create training plans, share content, etc.)
- Link to the athletes dashboard

### 3. Invitation Decline Notification
When an athlete declines an invitation, the coach is notified with:
- Athlete's name who declined
- Encouragement and suggestions for next steps
- Link to invite more athletes

### 4. Invitation Expiry Notification
When an invitation expires without being accepted (after 14 days for athletes, 30 days for coaches), the inviting coach receives:
- Athlete's name whose invitation expired
- Suggestion to resend the invitation
- Link to the invitation management page

## Technical Implementation

### Email Service Functions

Located in `lib/email-service.ts`:

```typescript
// Main coach notification function
export async function sendCoachNotificationEmail({
  to,
  coachName,
  type,
  athleteInfo,
  invitationsSummary,
  timestamp
}: CoachNotificationEmailProps)
```

### API Endpoints

#### 1. **POST /api/coach/invite-athletes**
- Sends invitations to multiple athletes
- Automatically sends confirmation email to coach if successful
- Retrieves coach email from user profile

#### 2. **POST /api/submit-athlete**
- Processes athlete application/acceptance
- Sends acceptance notification to coach
- Updates invitation status to 'accepted'

#### 3. **POST /api/invitation-status**
- Updates invitation status (declined/expired)
- Sends appropriate notification to coach

#### 4. **GET /api/invitation-status**
- Checks for expired invitations
- Sends expiry notifications to coaches

#### 5. **GET /api/cron/check-expired-invitations**
- Scheduled job to check expired invitations
- Runs daily via Vercel Cron
- Processes up to 100 expired invitations per run

### Database Schema

#### Invitations Collection
```javascript
{
  id: string,
  coachId: string,
  athleteEmail: string,
  athleteName: string,
  sport: string,
  customMessage: string,
  status: 'pending' | 'accepted' | 'declined' | 'expired',
  createdAt: string,
  expiresAt: string,
  used: boolean,
  usedAt?: string,
  usedBy?: string,
  type: 'athlete_invitation' | 'coach_invitation'
}
```

### Email Templates

All coach notification emails include:
- PLAYBOOKD branding
- Clear status indicators (success/info/warning colors)
- Call-to-action buttons
- Mobile-responsive design
- Unsubscribe and privacy policy links

## Configuration

### Environment Variables

```env
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_BASE_URL=https://playbookd.crucibleanalytics.dev
CRON_SECRET=your_cron_secret_for_production
```

### Vercel Cron Configuration

Add to `vercel.json` for automatic expiry checking:

```json
{
  "crons": [{
    "path": "/api/cron/check-expired-invitations",
    "schedule": "0 0 * * *"
  }]
}
```

## Testing

### Manual Testing

Use the provided test script:

```bash
node test-coach-notifications.js
```

This script tests:
1. Sending invitations (coach receives confirmation)
2. Accepting invitations (coach receives acceptance notification)
3. Declining invitations (coach receives decline notification)
4. Checking expired invitations (coaches receive expiry notifications)

### Test Data

The test script uses mock data:
- Test coach: `test.coach@example.com`
- Test athletes: `athlete1@test.com`, `athlete2@test.com`

## Monitoring

### Logging

All email operations are logged with clear indicators:
- ✅ Successful operations
- ❌ Failed operations
- 📧 Email sent
- 💾 Data stored
- ⚠️ Warnings

### Error Handling

- Email send failures don't block the main operation
- All errors are logged but gracefully handled
- Users still receive success responses even if notifications fail

## Future Enhancements

### Potential Improvements

1. **Batch Notifications**: Combine multiple notifications into daily/weekly digests
2. **Notification Preferences**: Allow coaches to customize which notifications they receive
3. **SMS Notifications**: Add text message support for critical notifications
4. **In-App Notifications**: Mirror email notifications in the platform
5. **Analytics**: Track email open rates and engagement
6. **Templates Customization**: Allow organizations to customize email templates
7. **Reminder Emails**: Send reminders before invitations expire

### Performance Considerations

- Current implementation sends emails synchronously
- For high volume, consider implementing a queue system (e.g., using Vercel Queue or AWS SQS)
- Batch process expired invitation checks to avoid timeouts

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check RESEND_API_KEY is configured
   - Verify sender domain is verified in Resend
   - Check console logs for error messages

2. **Coach not receiving notifications**
   - Verify coach has email in user profile
   - Check if coach exists in users collection
   - Review invitation coachId field

3. **Expired invitations not processing**
   - Ensure cron job is configured
   - Check cron job logs in Vercel dashboard
   - Manually trigger via GET request to test

## Support

For issues or questions about the email notification system:
1. Check console logs for detailed error messages
2. Review this documentation
3. Check Resend dashboard for email delivery status
4. Contact the development team with specific error messages