import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
  onSnapshot,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Notification, NotificationType } from '@/types/video-critique';

const COLLECTION_NAME = 'notifications';

// ============================================================================
// CREATE
// ============================================================================

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link: string,
  relatedIds?: {
    submissionId?: string;
    reviewId?: string;
    commentId?: string;
  }
): Promise<string> {
  const notificationRef = doc(collection(db, COLLECTION_NAME));

  await setDoc(notificationRef, {
    id: notificationRef.id,
    userId,
    type,
    title,
    message,
    link,
    ...relatedIds,
    read: false,
    createdAt: serverTimestamp(),
  });

  return notificationRef.id;
}

export async function createBulkNotifications(
  notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link: string;
    submissionId?: string;
    reviewId?: string;
    commentId?: string;
  }>
): Promise<void> {
  const batch = writeBatch(db);

  notifications.forEach(notification => {
    const notificationRef = doc(collection(db, COLLECTION_NAME));
    batch.set(notificationRef, {
      id: notificationRef.id,
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

// ============================================================================
// READ
// ============================================================================

export async function getNotification(notificationId: string): Promise<Notification | null> {
  const notificationRef = doc(db, COLLECTION_NAME, notificationId);
  const notificationDoc = await getDoc(notificationRef);

  if (!notificationDoc.exists()) {
    return null;
  }

  return notificationDoc.data() as Notification;
}

export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false,
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ notifications: Notification[]; lastDoc: QueryDocumentSnapshot | null }> {
  let q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  if (unreadOnly) {
    q = query(q, where('read', '==', false));
  }

  q = query(q, orderBy('createdAt', 'desc'), limit(limitCount));

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const notifications = snapshot.docs.map(doc => doc.data() as Notification);
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  return { notifications, lastDoc: newLastDoc };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}

// ============================================================================
// UPDATE
// ============================================================================

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, COLLECTION_NAME, notificationId);

  await updateDoc(notificationRef, {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      read: true,
      readAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

// ============================================================================
// DELETE
// ============================================================================

export async function deleteNotification(notificationId: string): Promise<void> {
  const notificationRef = doc(db, COLLECTION_NAME, notificationId);
  await updateDoc(notificationRef, {
    deleted: true,
    deletedAt: serverTimestamp(),
  });
}

export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const q = query(
    collection(db, COLLECTION_NAME),
    where('createdAt', '<', Timestamp.fromDate(cutoffDate)),
    where('read', '==', true)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  unreadOnly: boolean = false
): () => void {
  let q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  if (unreadOnly) {
    q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => doc.data() as Notification);
    callback(notifications);
  });

  return unsubscribe;
}

export function subscribeToUnreadCount(
  userId: string,
  callback: (count: number) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });

  return unsubscribe;
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

export function createNotificationContent(
  type: NotificationType,
  data: Record<string, any>
): { title: string; message: string } {
  const templates: Record<NotificationType, (data: any) => { title: string; message: string }> = {
    new_submission: (data) => ({
      title: 'New Video Submission',
      message: `${data.athleteName} submitted a new video for ${data.skillName}`,
    }),
    submission_claimed: (data) => ({
      title: 'Coach Claimed Your Video',
      message: `${data.coachName} is reviewing your ${data.skillName} submission`,
    }),
    review_published: (data) => ({
      title: 'Review Published',
      message: `Your ${data.skillName} video has been reviewed by ${data.coachName}`,
    }),
    sla_breach: (data) => ({
      title: 'SLA Breach Alert',
      message: `Submission from ${data.athleteName} has exceeded the ${data.slaHours} hour SLA`,
    }),
    comment_added: (data) => ({
      title: 'New Comment',
      message: `${data.authorName} commented on your ${data.skillName} submission`,
    }),
    needs_resubmission: (data) => ({
      title: 'Resubmission Requested',
      message: `${data.coachName} has requested a resubmission for ${data.skillName}: ${data.reason}`,
    }),
    followup_requested: (data) => ({
      title: 'Follow-up Requested',
      message: `${data.athleteName} has requested a follow-up on their ${data.skillName} review`,
    }),
  };

  return templates[type](data);
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export async function getUserNotificationPreferences(userId: string): Promise<{
  emailEnabled: boolean;
  pushEnabled: boolean;
  types: Record<NotificationType, boolean>;
}> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // Return defaults
    return {
      emailEnabled: true,
      pushEnabled: true,
      types: {
        new_submission: true,
        submission_claimed: true,
        review_published: true,
        sla_breach: true,
        comment_added: true,
        needs_resubmission: true,
        followup_requested: true,
      },
    };
  }

  const userData = userDoc.data();
  return userData.notificationPreferences || {
    emailEnabled: true,
    pushEnabled: true,
    types: {
      new_submission: true,
      submission_claimed: true,
      review_published: true,
      sla_breach: true,
      comment_added: true,
      needs_resubmission: true,
      followup_requested: true,
    },
  };
}

export async function updateUserNotificationPreferences(
  userId: string,
  preferences: Partial<{
    emailEnabled: boolean;
    pushEnabled: boolean;
    types: Record<NotificationType, boolean>;
  }>
): Promise<void> {
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    notificationPreferences: preferences,
    updatedAt: serverTimestamp(),
  });
}