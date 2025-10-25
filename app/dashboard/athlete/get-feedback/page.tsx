'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { storage } from '@/lib/firebase.client';
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Upload, Video, Check, Camera, Play, Pause } from 'lucide-react';
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
  const [submitDone, setSubmitDone] = useState(false);
  const [createdSubmissionId, setCreatedSubmissionId] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Video scrubbing and thumbnail selection
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [showThumbnailSelector, setShowThumbnailSelector] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('');
  const [thumbnailCandidates, setThumbnailCandidates] = useState<string[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Video scrubbing and thumbnail generation functions
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const generateThumbnails = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const duration = video.duration || 10; // Default duration if not available
    const candidates: string[] = [];

    console.log('Starting thumbnail generation, video duration:', duration);

    // Try to capture current frame first (immediate)
    try {
      const immediateThumbnail = captureFrame();
      if (immediateThumbnail) {
        candidates.push(immediateThumbnail);
        setThumbnailCandidates([...candidates]);
        setSelectedThumbnail(immediateThumbnail);
        console.log('Generated immediate thumbnail');
      }
    } catch (error) {
      console.warn('Failed to generate immediate thumbnail:', error);
    }

    // Generate thumbnails at different timestamps
    const timestamps = [duration * 0.25, duration * 0.5, duration * 0.75];

    for (const timestamp of timestamps) {
      try {
        // Set video time
        video.currentTime = timestamp;

        // Wait for the video to seek and be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve(); // Don't reject, just resolve and continue
          }, 2000);

          const handleSeeked = () => {
            clearTimeout(timeout);
            video.removeEventListener('seeked', handleSeeked);
            resolve();
          };

          video.addEventListener('seeked', handleSeeked);
        });

        // Capture frame
        const thumbnail = captureFrame();
        if (thumbnail && !candidates.includes(thumbnail)) {
          candidates.push(thumbnail);
          setThumbnailCandidates([...candidates]);
          console.log(`Generated thumbnail at ${timestamp}s`);
        }
      } catch (error) {
        console.warn(`Failed to generate thumbnail at ${timestamp}:`, error);
      }
    }
  }, [captureFrame]);

  const handleVideoLoad = useCallback(async () => {
    if (videoRef.current) {
      console.log('Video metadata loaded, updating duration...');
      setVideoDuration(videoRef.current.duration);

      // If no thumbnails were generated yet, generate them now
      if (thumbnailCandidates.length === 0) {
        console.log('No thumbnails available, generating now...');
        try {
          await generateThumbnails();
        } catch (error) {
          console.error('Thumbnail generation failed:', error);
          // Generate a simple fallback thumbnail
          try {
            const fallbackThumbnail = captureFrame();
            if (fallbackThumbnail) {
              setThumbnailCandidates([fallbackThumbnail]);
              setSelectedThumbnail(fallbackThumbnail);
              console.log('Generated fallback thumbnail in handleVideoLoad');
            }
          } catch (fallbackError) {
            console.error('Fallback thumbnail generation failed:', fallbackError);
          }
        }
      }
    }
  }, [generateThumbnails, captureFrame, thumbnailCandidates.length]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation
      if (file.size > 500 * 1024 * 1024) {
        toast.error('File too large. Maximum 500MB.');
        return;
      }

      // Clean up previous video URL to prevent memory leaks
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setShowThumbnailSelector(false);
      setThumbnailCandidates([]);
      setSelectedThumbnail('');
      setVideoDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);

      // Generate thumbnails immediately
      setTimeout(() => {
        setShowThumbnailSelector(true);
        toast.success('Video selected - generating thumbnails...');
      }, 100);
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

    if (!selectedThumbnail) {
      toast.error('Please select a thumbnail for your video');
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
        setSubmissionId(submissionId);
        setCreatedSubmissionId(submissionId);
        setUploadProgress(15);
      } catch (apiErr) {
        console.warn('Could not create submission via API; will create client-side after upload:', apiErr);
        createClientSideSubmissionFallback = true;
      }

      // Step 2: Skip feedback_requests creation to avoid duplicates
      // We're using submissions collection as the primary source
      let feedbackId = `fallback_${Date.now()}`;
      setUploadProgress(35);

      // Step 3: Upload video to Storage (resumable)
      const timestamp = Date.now();
      const fileName = `${timestamp}_${videoFile.name}`;
      // Prefer uploads path tied to submission when available, else fallback to feedback path
      const sanitized = (name: string) => name.replace(/\.{2,}/g, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
      const storagePath = submissionId
        ? `uploads/${user.uid}/submissions/${submissionId}/${sanitized(fileName)}`
        : `feedback/${user.uid}/${feedbackId}/${sanitized(fileName)}`;

      // Use selected thumbnail or generate one
      let thumbnailUrl: string | null = null;
      try {
        if (selectedThumbnail) {
          // Use the user-selected thumbnail
          console.log('[UPLOAD] Using user-selected thumbnail...');
          const response = await fetch(selectedThumbnail);
          const blob = await response.blob();
          const thumbnailRef = ref(storage, `thumbnails/${submissionId || createdSubmissionId || 'temp'}.jpg`);
          await uploadBytes(thumbnailRef, blob);
          thumbnailUrl = await getDownloadURL(thumbnailRef);
          console.log('[UPLOAD] User thumbnail uploaded successfully:', thumbnailUrl);
        } else {
          // Fallback: Generate thumbnail automatically
          console.log('[UPLOAD] No thumbnail selected, generating automatically...');
          const canvas = document.createElement('canvas');
          const video = document.createElement('video');
          video.src = URL.createObjectURL(videoFile);

          await new Promise<void>((resolveThumb) => {
            video.onloadeddata = () => {
              console.log('[UPLOAD] Video data loaded, generating thumbnail...');
              video.currentTime = 1;
            };

            video.onseeked = () => {
              console.log('[UPLOAD] Video seeked to 1 second, capturing frame...');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                  if (blob) {
                    try {
                      const thumbnailRef = ref(storage, `thumbnails/${submissionId || createdSubmissionId || 'temp'}.jpg`);
                      await uploadBytes(thumbnailRef, blob);
                      thumbnailUrl = await getDownloadURL(thumbnailRef);
                      console.log('[UPLOAD] Thumbnail generated successfully:', thumbnailUrl);
                    } catch (err) {
                      console.warn('[UPLOAD] Thumbnail generation failed:', err);
                    }
                  }
                  URL.revokeObjectURL(video.src);
                  resolveThumb();
                }, 'image/jpeg', 0.9);
              } else {
                URL.revokeObjectURL(video.src);
                resolveThumb();
              }
            };

            video.onerror = () => {
              console.warn('[UPLOAD] Video failed to load');
              URL.revokeObjectURL(video.src);
              resolveThumb();
            };
          });
        }
      } catch (err) {
        console.warn('[UPLOAD] Thumbnail upload failed:', err);
      }

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
        // Step 4: Skip feedback_requests update (using submissions collection only)

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
                  thumbnailUrl: thumbnailUrl,
                  status: 'awaiting_coach',
                  uploadProgress: 100,
                }),
              });
            }
          } catch (patchErr) {
            console.warn('Submission patch failed (upload succeeded):', patchErr);
          }
        } else if (createClientSideSubmissionFallback) {
          // Create the submission document using secure API as a fallback
          try {
            const token = await user.getIdToken();
            const response = await fetch('/api/submissions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                videoFileName: videoFile.name,
                videoFileSize: videoFile.size,
                videoStoragePath: storagePath,
                videoDownloadUrl: downloadUrl,
                videoDuration: 0,
                thumbnailUrl: thumbnailUrl,
                athleteContext: context.trim(),
                athleteGoals: goals.trim(),
                specificQuestions: questions.trim(),
                status: 'awaiting_coach',
                uploadProgress: 100,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              setCreatedSubmissionId(data.submissionId);
              console.log('✅ Created client-side submission fallback via API');
            } else {
              console.warn('API submission fallback failed:', await response.text());
            }
          } catch (subErr) {
            console.warn('Client-side submission fallback failed:', subErr);
          }
        }

        // Send notification to coach via API
        try {
          const token = (user as any)?.getIdToken ? await (user as any).getIdToken(true) : null;
          if (token) {
            await fetchWithRetry('/api/notifications/video-submitted', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                submissionId: submissionId || createdSubmissionId,
                skillName: 'Video Submission', // Use default since we don't have skill selection yet
                context: context.trim()
              }),
            });
          }
        } catch (emailErr) {
          console.warn('Failed to send coach notification:', emailErr);
        }

        // Success UI (avoid throwing / global error)
        toast.success('✅ Submission complete! Your coach will review it soon.');

        // Show explicit success confirmation with actions
        setSubmitDone(true);
        setUploading(false);
        setUploadProgress(0);

        // Clean up video preview state
        setVideoUrl('');
        setShowThumbnailSelector(false);
        setThumbnailCandidates([]);
        setSelectedThumbnail('');
        setVideoDuration(0);
        setCurrentTime(0);
        setIsPlaying(false);

        if (fileInputRef.current) fileInputRef.current.value = '';
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

         {/* Success Modal */}
         {submitDone && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
               <div className="text-green-600 text-6xl mb-4">✓</div>
               <h3 className="text-2xl font-bold text-green-800 mb-2">Video Uploaded Successfully!</h3>
               <p className="text-gray-700 mb-4">
                 Your video has been submitted for review. Your coach will be notified and provide feedback soon.
               </p>
               <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                 <p className="text-sm text-gray-600">Submission ID:</p>
                 <p className="font-mono text-lg font-bold text-gray-800">{createdSubmissionId || submissionId}</p>
               </div>
               <div className="flex justify-center">
                 <button
                   onClick={() => {
                     // Clean up all state
                     setSubmitDone(false);
                     setCreatedSubmissionId(null);
                     setSubmissionId(null);
                     setVideoFile(null);
                     setVideoUrl('');
                     setContext('');
                     setGoals('');
                     setQuestions('');
                     setShowThumbnailSelector(false);
                     setThumbnailCandidates([]);
                     setSelectedThumbnail('');
                     setVideoDuration(0);
                     setCurrentTime(0);
                     setIsPlaying(false);
                     if (fileInputRef.current) fileInputRef.current.value = '';

                     // Navigate back to reviews
                     if (isEmbedded) {
                       window.parent.postMessage({ type: 'NAVIGATE_TO_VIDEO_REVIEW' }, '*');
                     } else {
                       router.push('/dashboard/athlete/reviews');
                     }
                   }}
                   className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                 >
                   OK
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Form */}
         {!submitDone && (
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
                      setVideoUrl('');
                      setShowThumbnailSelector(false);
                      setThumbnailCandidates([]);
                      setSelectedThumbnail('');
                      setVideoDuration(0);
                      setCurrentTime(0);
                      setIsPlaying(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Video Preview and Thumbnail Selection */}
            {videoUrl && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Choose Your Thumbnail</h3>

                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Video Player */}
                <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-64 object-contain"
                    onLoadedMetadata={handleVideoLoad}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handlePlayPause}
                        className="text-white hover:text-blue-400 transition-colors"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>

                      {/* Scrubber */}
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={videoDuration || 100}
                          value={currentTime}
                          onChange={handleScrub}
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / (videoDuration || 100)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (videoDuration || 100)) * 100}%, rgba(255,255,255,0.2) 100%)`
                          }}
                        />
                      </div>

                      {/* Time Display */}
                      <span className="text-white text-sm">
                        {Math.floor(currentTime)}s / {Math.floor(videoDuration)}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thumbnail Candidates */}
                {showThumbnailSelector && thumbnailCandidates.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Click on a thumbnail to select it:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {thumbnailCandidates.map((thumbnail, index) => (
                        <div key={index} className="relative">
                          <img
                            src={thumbnail}
                            alt={`Thumbnail ${index + 1}`}
                            className={`w-full h-20 object-cover rounded-lg cursor-pointer border-2 transition-colors ${
                              selectedThumbnail === thumbnail
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedThumbnail(thumbnail)}
                          />
                          {selectedThumbnail === thumbnail && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Custom Thumbnail Capture */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const customThumbnail = captureFrame();
                          if (customThumbnail) {
                            setSelectedThumbnail(customThumbnail);
                            setThumbnailCandidates(prev => [...prev, customThumbnail]);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Current Frame
                      </button>
                      <span className="text-sm text-gray-500">Use the scrubber above to find the perfect frame</span>
                    </div>
                  </div>
                )}
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
         )}
      </div>
    </div>
  );
}