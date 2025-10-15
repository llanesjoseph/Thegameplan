# Direct Message System Architecture

## Overview
Opt-in direct messaging system between coaches and athletes with real-time updates and notification support.

## Firestore Collections

### `conversations`
```
conversations/{conversationId}
  - participants: string[] (array of user IDs)
  - participantDetails: {
      [userId]: {
        displayName: string
        email: string
        photoURL: string | null
        role: 'coach' | 'athlete'
        messagingEnabled: boolean
      }
    }
  - lastMessage: {
      text: string
      senderId: string
      senderName: string
      timestamp: Timestamp
    }
  - unreadCount: {
      [userId]: number
    }
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

### `messages`
```
messages/{messageId}
  - conversationId: string
  - senderId: string
  - senderName: string
  - senderPhotoURL: string | null
  - text: string
  - createdAt: Timestamp
  - readBy: string[] (array of user IDs who have read this message)
```

### `users` (add fields)
```
users/{userId}
  - messagingEnabled: boolean (default: false, opt-in)
  - messagingPreferences: {
      allowMessages: boolean
      emailNotifications: boolean
      pushNotifications: boolean
    }
```

## API Endpoints

### GET `/api/messages/conversations`
- List all conversations for the current user
- Returns conversations with last message and unread counts

### GET `/api/messages/conversations/[id]`
- Get specific conversation with full message history
- Mark messages as read

### POST `/api/messages/send`
- Send a new message
- Creates conversation if it doesn't exist
- Updates lastMessage and unreadCount

### POST `/api/messages/start-conversation`
- Start a new conversation between coach and athlete
- Checks if both users have messaging enabled
- Returns conversation ID

### PATCH `/api/messages/settings`
- Update user's messaging preferences
- Enable/disable messaging

## UI Components

### ConversationsList
- Shows all active conversations
- Displays unread count badges
- Real-time updates for new messages
- Filter/search conversations

### MessageThread
- Display all messages in a conversation
- Real-time message updates
- Send new messages
- Typing indicators (optional future enhancement)

### MessageComposer
- Text input with send button
- Character limit (2000 chars)
- Auto-focus and keyboard shortcuts

### MessagingSettings
- Toggle messaging on/off
- Email notification preferences
- Privacy controls

## Security Rules

```javascript
match /conversations/{conversationId} {
  allow read: if request.auth != null &&
    request.auth.uid in resource.data.participants;
  allow create: if request.auth != null &&
    request.auth.uid in request.resource.data.participants;
  allow update: if request.auth != null &&
    request.auth.uid in resource.data.participants;
}

match /messages/{messageId} {
  allow read: if request.auth != null &&
    exists(/databases/$(database)/documents/conversations/$(resource.data.conversationId)) &&
    request.auth.uid in get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants;
  allow create: if request.auth != null;
}
```

## Features

### Phase 1 (MVP) ✅
- [x] Firestore structure
- [x] API endpoints
- [x] Basic UI components
- [x] Opt-in/opt-out settings
- [x] Real-time message updates

### Phase 2 (Future)
- [ ] Read receipts
- [ ] Typing indicators
- [ ] File attachments
- [ ] Message search
- [ ] Archive conversations
- [ ] Block users
- [ ] Report abuse

## Implementation Notes

1. **Privacy First**: Both users must have messaging enabled to start a conversation
2. **Real-time Updates**: Use Firestore onSnapshot listeners for live updates
3. **Notifications**: Email notifications when user receives message (if enabled)
4. **Performance**: Paginate message history (load 50 at a time)
5. **Security**: All API endpoints verify user permissions before allowing access
