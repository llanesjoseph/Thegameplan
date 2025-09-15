// Script to update lesson with YouTube video
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

// Your Firebase config (you'll need to add this)
const firebaseConfig = {
  // Add your Firebase config here from .env.local or Firebase console
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateLessonVideo() {
  try {
    const lessonId = 'sBXisBRSzG4YUFd9zWnp';
    const youtubeVideoId = '8L0GzGKbZFQ'; // The video you want to add
    
    const lessonRef = doc(db, 'content', lessonId);
    
    await updateDoc(lessonRef, {
      youtubeVideoId: youtubeVideoId,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      hasMedia: true
    });
    
    console.log('✅ Successfully updated lesson with YouTube video:', youtubeVideoId);
  } catch (error) {
    console.error('❌ Error updating lesson:', error);
  }
}

updateLessonVideo();