/**
 * Firebase Environment Configuration
 * This file provides secure access to environment variables for production
 */

// For client-side use (Next.js public env vars)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your_firebase_api_key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your_project.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your_sender_id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your_app_id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "your_measurement_id"
}

// For server-side use (these should be set in Firebase Functions config)
export const serverConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  vertexProjectId: process.env.VERTEX_PROJECT_ID || "your_project_id",
  vertexLocation: process.env.VERTEX_LOCATION || "us-central1",
  vertexApiKey: process.env.VERTEX_API_KEY
}

// For functions environment (accessing Firebase Functions config)
// This function is server-side only and should not be used in client builds
export function getFunctionsConfig() {
  if (typeof window !== 'undefined') {
    throw new Error('Functions config should only be accessed server-side')
  }

  // Always use environment variables for client builds
  return {
    geminiApiKey: process.env.GEMINI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    vertexProjectId: process.env.VERTEX_PROJECT_ID || "your_project_id",
    vertexLocation: process.env.VERTEX_LOCATION || "us-central1",
    vertexApiKey: process.env.VERTEX_API_KEY,
    adminSecret: process.env.ADMIN_SECRET
  }
}

// Environment validation
export function validateEnvironment() {
  const missing: string[] = []

  // Check public environment variables
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY')
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID')

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing)
    console.warn('Using fallback values for development')
  }

  return missing.length === 0
}