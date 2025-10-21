'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { storage, db } from '@/lib/firebase.client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Upload, Video, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GetFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [context, setContext] = useState('');
  const [goals, setGoals] = useState('');
  const [questions, setQuestions] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setUploadProgress(10);

    try {
      // Step 1: Create feedback request in Firestore (like lessons collection)
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

      setUploadProgress(30);

      const docRef = await addDoc(collection(db, 'feedback_requests'), feedbackData);
      const feedbackId = docRef.id;

      toast.success('Feedback request created');
      setUploadProgress(50);

      // Step 2: Upload video to Storage (using same pattern as lessons)
      const timestamp = Date.now();
      const fileName = `${timestamp}_${videoFile.name}`;
      const storagePath = `feedback/${user.uid}/${feedbackId}/${fileName}`;

      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, videoFile);

      setUploadProgress(80);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Step 3: Update feedback request with video URL
      await docRef.update({
        videoUrl: downloadUrl,
        videoStoragePath: storagePath,
        status: 'awaiting_review',
        updatedAt: serverTimestamp(),
      });

      setUploadProgress(100);

      // Success!
      toast.success('Video uploaded successfully! Your coach will review it soon.');

      // Reset form
      setTimeout(() => {
        setVideoFile(null);
        setContext('');
        setGoals('');
        setQuestions('');
        setUploadProgress(0);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Navigate to success view
        router.push('/dashboard/athlete');
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload: ${error.message || 'Unknown error'}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Get Feedback</h1>
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