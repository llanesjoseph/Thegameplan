'use client';

import { useState } from 'react';
import { auth, storage } from '@/lib/firebase.client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

export default function TestStoragePage() {
  const [status, setStatus] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const addStatus = (message: string) => {
    console.log(message);
    setStatus(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testDirectUpload = async () => {
    setStatus([]);
    setUploading(true);

    try {
      // Step 1: Check auth
      addStatus('Checking authentication...');
      const currentUser = auth.currentUser;

      if (!currentUser) {
        addStatus('ERROR: No user logged in');
        return;
      }

      addStatus(`User found: ${currentUser.email} (${currentUser.uid})`);

      // Step 2: Force token refresh
      addStatus('Refreshing auth token...');
      await currentUser.reload();
      const token = await currentUser.getIdToken(true);
      addStatus(`Token refreshed: ${token.substring(0, 20)}...`);

      // Step 3: Create a test file
      addStatus('Creating test file...');
      const testContent = 'Test upload at ' + new Date().toISOString();
      const blob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([blob], 'test.txt', { type: 'text/plain' });

      // Step 4: Try multiple paths
      const paths = [
        `test/${currentUser.uid}/test.txt`,
        `users/${currentUser.uid}/test.txt`,
        `videos/test.txt`,
        `test.txt`
      ];

      for (const path of paths) {
        try {
          addStatus(`Trying path: ${path}`);
          const storageRef = ref(storage, path);
          const snapshot = await uploadBytes(storageRef, testFile);
          addStatus(`✅ SUCCESS! Uploaded to: ${path}`);

          const url = await getDownloadURL(snapshot.ref);
          addStatus(`Download URL: ${url}`);
          break;
        } catch (error: any) {
          addStatus(`❌ FAILED for ${path}: ${error.code} - ${error.message}`);
        }
      }

      // Step 5: Log storage bucket
      addStatus(`Storage bucket: ${storage.app.options.storageBucket}`);
      addStatus(`Project ID: ${storage.app.options.projectId}`);

    } catch (error: any) {
      addStatus(`CRITICAL ERROR: ${error.message}`);
      console.error('Full error:', error);
    } finally {
      setUploading(false);
    }
  };

  const testAuthState = () => {
    addStatus('Testing auth state...');
    onAuthStateChanged(auth, (user) => {
      if (user) {
        addStatus(`Auth state changed: ${user.email} (${user.uid})`);
        user.getIdTokenResult().then((result) => {
          addStatus(`Token claims: ${JSON.stringify(result.claims)}`);
        });
      } else {
        addStatus('Auth state: No user');
      }
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Storage Test Page</h1>

      <div className="space-y-4">
        <button
          onClick={testDirectUpload}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Testing...' : 'Test Storage Upload'}
        </button>

        <button
          onClick={testAuthState}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-4"
        >
          Check Auth State
        </button>

        <button
          onClick={() => setStatus([])}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ml-4"
        >
          Clear Log
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Status Log:</h2>
        <pre className="text-xs whitespace-pre-wrap">
          {status.length === 0 ? 'No tests run yet...' : status.join('\n')}
        </pre>
      </div>
    </div>
  );
}