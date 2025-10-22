'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { storage, db } from '@/lib/firebase.client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, updateDoc, serverTimestamp, doc, getDoc, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { ArrowLeft, Upload, Video, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GetFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if we're embedded in an iframe
  const isEmbedded = typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('embedded') === 'true' ||
     window.self !== window.top);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [context, setContext] = useState('');
  const [goals, setGoals] = useState('');
  const [questions, setQuestions] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Simple retry helper for fetch calls (exponential backoff)
  const fetchWithRetry = async (
    input: RequestInfo | URL,
    init: RequestInit,
    retries: number = 2,
    backoffMs: number = 400
  ): Promise<Response> => {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const resp = await fetch(input, init);
        if (resp.ok) return resp;
        lastErr = new Error(`HTTP ${resp.status}`);
      } catch (e) {
        lastErr = e;
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('request failed');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      if (file.size > 500 * 1024 * 1024) {
        toast.error('File too large. Maximum 500MB.');
        return;
      }
      setVideoFile(file);
      toast.success('Video selected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in');
      return;
    }

    if (!videoFile) {
      toast.error('Please select a video');
      return;
    }

    if (!context.trim()) {
      toast.error('Please provide context about your video');
      return;
    }

    setUploading(true);
    setUploadProgress(5);

    try {
      // Step 1: Create a server-side Submission so it shows up immediately
      let submissionId: string | null = null;
      let createClientSideSubmissionFallback = false;
      try {
        const token = (user as any)?.getIdToken ? await (user as any).getIdToken(true) : null;
        if (!token) throw new Error('Missing auth token');

        const resp = await fetchWithRetry('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            athleteContext: context.trim(),
            athleteGoals: goals.trim(),
            specificQuestions: questions.trim(),
            videoFileName: videoFile.name,
            videoFileSize: videoFile.size,
            videoDuration: 0,
          }),
        });

        const data = await resp.json();
        submissionId = data.submissionId;
        setUploadProgress(15);
      } catch (apiErr) {
        console.warn('Could not create submission via API; will create client-side after upload:', apiErr);
        createClientSideSubmissionFallback = true;
      }

      // Step 2: Create feedback request record (kept for compatibility/UI)
      const feedbackData = {
        athleteId: user.uid,
        athleteName: user.displayName || user.email,
        context: context.trim(),
        goals: goals.trim(),
        questions: questions.trim(),
        status: 'pending_upload',
        createdAt: serverTimestamp(),
        videoFileName: videoFile.name,
        videoFileSize: videoFile.size,
      };

      setUploadProgress(20);

      let docRef: DocumentReference<DocumentData> | null = null;
      let feedbackId: string;
      try {
        docRef = await addDoc(collection(db, 'feedback_requests'), feedbackData);
        feedbackId = docRef.id;
        toast.success('Feedback request created');
      } catch (frErr) {
        console.warn('Feedback request create failed (continuing):', frErr);
        // Continue without a feedback_request record (submission still created)
        feedbackId = `fallback_${Date.now()}`;
      }
      setUploadProgress(35);

      // Step 3: Upload video to Storage (resumable)
      const timestamp = Date.now();
      const fileName = `${timestamp}_${videoFile.name}`;
      // Prefer uploads path tied to submission when available, else fallback to feedback path
      const sanitized = (name: string) => name.replace(/\.{2,}/g, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
      const storagePath = submissionId
        ? `uploads/${user.uid}/submissions/${submissionId}/${sanitized(fileName)}`
        : `feedback/${user.uid}/${feedbackId}/${sanitized(fileName)}`;

      const storageRef = ref(storage, storagePath);
      // Use resumable upload for large files and real progress updates
      await new Promise<string>((resolve, reject) => {
        try {
          const uploadTask = uploadBytesResumable(storageRef, videoFile);

          uploadTask.on(
            'state_changed',
            (snap) => {
              const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              // Smooth progress steps mapped to UI checkpoints
              const uiPct = Math.max(40, Math.min(95, pct));
              setUploadProgress(uiPct);
            },
            (err) => {
              reject(err);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (e) {
                reject(e);
              }
            }
          );
        } catch (err) {
          reject(err);
        }
      }).then(async (downloadUrl) => {
        setUploadProgress(97);
        // Step 4: Update feedback request with video URL
        if (docRef) {
          await updateDoc(docRef, {
            videoUrl: downloadUrl,
            videoStoragePath: storagePath,
            status: 'awaiting_review',
            updatedAt: serverTimestamp(),
          });
        }

        setUploadProgress(100);

        // Step 5: If we created a server-side submission, patch it with the video URL
        if (submissionId) {
          try {
            const token = (user as any)?.getIdToken ? await (user as any).getIdToken(true) : null;
            if (token) {
              await fetchWithRetry(`/api/submissions/${submissionId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  videoDownloadUrl: downloadUrl,
                  videoStoragePath: storagePath,
                  status: 'awaiting_coach',
                  uploadProgress: 100,
                }),
              });
            }
          } catch (patchErr) {
            console.warn('Submission patch failed (upload succeeded):', patchErr);
          }
        } else if (createClientSideSubmissionFallback) {
          // Create the submission document on the client as a fallback so coaches can see it
          try {
            let coachId: string | null = null;
            try {
              const userSnap = await getDoc(doc(db, 'users', user.uid));
              const udata: any = userSnap.data();
              coachId = udata?.coachId || udata?.assignedCoachId || null;
            } catch {}

            await addDoc(collection(db, 'submissions'), {
              athleteUid: user.uid,
              athleteName: user.displayName || user.email,
              athletePhotoUrl: user.photoURL || null,
              teamId: user.uid,
              coachId: coachId || null,
              videoFileName: videoFile.name,
              videoFileSize: videoFile.size,
              videoStoragePath: storagePath,
              videoDuration: 0,
              thumbnailUrl: null,
              athleteContext: context.trim(),
              athleteGoals: goals.trim(),
              specificQuestions: questions.trim(),
              status: 'awaiting_coach',
              uploadProgress: 100,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              submittedAt: serverTimestamp(),
            });
            console.log('✅ Created client-side submission fallback');
          } catch (subErr) {
            console.warn('Client-side submission fallback failed:', subErr);
          }
        }

        // Success UI (avoid throwing / global error)
        toast.success('✅ Submission complete! Your coach will review it soon.');

        // Reset form safely and optionally redirect to reviews
        setTimeout(() => {
          setVideoFile(null);
          setContext('');
          setGoals('');
          setQuestions('');
          setUploadProgress(0);
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';

          if (!isEmbedded) {
            router.push('/dashboard/athlete/reviews?submitted=1');
          }
        }, 800);
      });
      return;

    } catch (error: any) {
      console.error('Upload error:', error);
      const message = typeof error?.message === 'string' ? error.message : 'Unknown error';
      toast.error(`Failed to upload: ${message}`);
      // Do not rethrow; keep UI on the page and allow retry
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isEmbedded ? 'p-4' : 'p-6'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {!isEmbedded && (
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          )}
          <h1 className={`${isEmbedded ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>Get Feedback</h1>
          <p className="mt-2 text-gray-600">
            Upload a video of your performance to receive personalized coaching feedback
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Your Video</h2>

            {!videoFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Select a video file (MP4, MOV, AVI, or WebM)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Choose Video
                </label>
                <p className="mt-4 text-sm text-gray-500">Maximum file size: 500MB</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium">{videoFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Context */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Tell Us About Your Video</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="What were you working on? When was this recorded? Any relevant details..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goals (Optional)
                </label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="What are you trying to achieve or improve?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Questions (Optional)
                </label>
                <textarea
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="Any specific areas you want feedback on?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!videoFile || !context.trim() || uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? `Uploading... ${uploadProgress}%` : 'Submit for Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}