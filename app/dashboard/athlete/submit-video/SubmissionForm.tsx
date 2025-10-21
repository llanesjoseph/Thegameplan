'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase.client';
import {
  uploadToFirebaseStorage,
  generateVideoStoragePath,
  validateVideoFile,
  getVideoMetadata,
  formatFileSize,
} from '@/lib/upload/uppy-config';
import toast from 'react-hot-toast';

interface SubmissionFormProps {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
  };
}

export default function SubmissionForm({ user }: SubmissionFormProps) {
  const router = useRouter();
  const [athleteContext, setAthleteContext] = useState('');
  const [athleteGoals, setAthleteGoals] = useState('');
  const [specificQuestions, setSpecificQuestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  const uploadTaskRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Get auth token on mount and fix custom claims
  useEffect(() => {
    const setupAuth = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        setAuthToken(token);

        // Proactively fix custom claims to ensure Storage access works
        try {
          const response = await fetch('/api/fix-my-claims', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log('Custom claims fixed:', data);
            // Force token refresh to get new claims
            await currentUser.getIdToken(true);
            const newToken = await currentUser.getIdToken();
            setAuthToken(newToken);
          }
        } catch (error) {
          console.warn('Could not fix custom claims:', error);
        }
      }
    };
    setupAuth();
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateVideoFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const metadata = await getVideoMetadata(file);
      setVideoMetadata(metadata);
      setVideoFile(file);
      toast.success('Video selected successfully');
    } catch (error) {
      console.error('Error getting video metadata:', error);
      toast.error('Failed to process video');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // Clear file selection
  const clearFile = useCallback(() => {
    setVideoFile(null);
    setVideoMetadata(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!videoFile) {
        toast.error('Please select a video file');
        return;
      }

      if (!athleteContext.trim()) {
        toast.error('Please provide context about your performance');
        return;
      }

      setIsSubmitting(true);

      try {
        if (!authToken) {
          toast.error('Authentication required. Please refresh the page.');
          setIsSubmitting(false);
          return;
        }

        // Create submission in database
        const response = await fetch('/api/submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            athleteContext: athleteContext.trim(),
            athleteGoals: athleteGoals.trim(),
            specificQuestions: specificQuestions.trim(),
            videoFileName: videoFile.name,
            videoFileSize: videoFile.size,
            videoDuration: videoMetadata?.duration || 0,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create submission');
        }

        const { submissionId } = await response.json();

        // Generate storage path (using user ID as team identifier)
        const storagePath = generateVideoStoragePath(
          user.uid,
          submissionId,
          videoFile.name
        );

        // Upload video to Firebase Storage
        const uploadTask = uploadToFirebaseStorage(
          videoFile,
          storagePath,
          (progress) => {
            setUploadProgress(progress);
          },
          async (downloadUrl) => {
            // Update submission with video URL
            const updateResponse = await fetch(`/api/submissions/${submissionId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                videoDownloadUrl: downloadUrl,
                thumbnailUrl: videoMetadata?.thumbnail,
                status: 'awaiting_coach',
                uploadProgress: 100,
              }),
            });

            if (!updateResponse.ok) {
              console.error('Failed to update submission with video URL');
            }

            toast.success('Video submitted successfully!');

            // Reset form
            setTimeout(() => {
              setIsSubmitting(false);
              setUploadProgress(0);
              clearFile();
              setAthleteContext('');
              setAthleteGoals('');
              setSpecificQuestions('');
            }, 1000);
          },
          (error) => {
            console.error('Upload error:', error);
            toast.error('Failed to upload video');
            setIsSubmitting(false);
          }
        );

        uploadTaskRef.current = uploadTask;
      } catch (error) {
        console.error('Submission error:', error);
        toast.error('Failed to submit video');
        setIsSubmitting(false);
      }
    },
    [
      videoFile,
      athleteContext,
      athleteGoals,
      specificQuestions,
      videoMetadata,
      router,
    ]
  );

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
    }
    setIsSubmitting(false);
    setUploadProgress(0);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Submission Details</h2>

        {/* Context */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Context <span className="text-red-500">*</span>
          </label>
          <textarea
            value={athleteContext}
            onChange={(e) => setAthleteContext(e.target.value)}
            placeholder="Describe what you were working on, when this was recorded, and any relevant details..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            required
          />
        </div>

        {/* Goals */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goals (Optional)
          </label>
          <textarea
            value={athleteGoals}
            onChange={(e) => setAthleteGoals(e.target.value)}
            placeholder="What are you trying to achieve or improve?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={2}
          />
        </div>

        {/* Specific Questions */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specific Questions (Optional)
          </label>
          <textarea
            value={specificQuestions}
            onChange={(e) => setSpecificQuestions(e.target.value)}
            placeholder="Any specific areas you want feedback on?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={2}
          />
        </div>
      </div>

      {/* Video Upload */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Upload Video</h2>

        {!isSubmitting ? (
          <>
            {!videoFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  Select Video
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  MP4, MOV, AVI, or WebM • Max 500MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{videoFile.name}</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p><strong>Duration:</strong> {Math.round(videoMetadata?.duration || 0)}s</p>
                      <p><strong>Size:</strong> {formatFileSize(videoFile.size)}</p>
                      {videoMetadata && (
                        <p><strong>Resolution:</strong> {videoMetadata.width} x {videoMetadata.height}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="ml-4 text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                {videoMetadata?.thumbnail && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <img
                      src={videoMetadata.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uploading video...</span>
              <span className="text-sm font-medium">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <button
              type="button"
              onClick={cancelUpload}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Cancel Upload
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!videoFile || isSubmitting}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? `Uploading... ${uploadProgress}%` : 'Submit for Review'}
        </button>
      </div>
    </form>
  );
}