'use client'

import { useState } from 'react'
import { Play, Pause, X, Settings, Zap, Download, CheckCircle, AlertCircle } from 'lucide-react'
import {
  VideoCompressionService,
  videoCompressionService,
  CompressionOptions,
  CompressionResult,
  formatFileSize,
  formatTime
} from '@/lib/video-compression'

interface InAppVideoCompressorProps {
  file: File
  onCompressed: (compressedFile: File) => void
  onCancel: () => void
  className?: string
}

type CompressionState = 'idle' | 'compressing' | 'completed' | 'error'
type CompressionPreset = 'fast' | 'balanced' | 'quality'

export default function InAppVideoCompressor({
  file,
  onCompressed,
  onCancel,
  className = ''
}: InAppVideoCompressorProps) {
  const [state, setState] = useState<CompressionState>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<CompressionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>('balanced')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customOptions, setCustomOptions] = useState<CompressionOptions>({
    quality: 0.7,
    maxWidth: 1920,
    maxHeight: 1080,
    frameRate: 30
  })

  const presets = VideoCompressionService.getPresets()
  const isSupported = VideoCompressionService.isSupported()

  const startCompression = async () => {
    if (!isSupported) {
      setError('Video compression is not supported in your browser')
      setState('error')
      return
    }

    setState('compressing')
    setProgress(0)
    setError(null)

    try {
      const options = showAdvanced ? customOptions : presets[selectedPreset]

      const compressionResult = await videoCompressionService.compressVideo(file, {
        ...options,
        onProgress: setProgress
      })

      setResult(compressionResult)
      setState('completed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed')
      setState('error')
    }
  }

  const useCompressedFile = () => {
    if (result) {
      onCompressed(result.compressedFile)
    }
  }

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold">Compression Not Supported</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Your browser doesn't support video compression. Please use a modern browser like Chrome, Firefox, or Safari.
          </p>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">In-App Video Compression</h2>
              <p className="text-gray-600 text-sm mt-1">
                Compress your video directly in the browser - no external tools needed!
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* File Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{file.name}</h3>
              <p className="text-sm text-gray-600">
                {formatFileSize(file.size)} •
                Estimated compression time: {VideoCompressionService.estimateCompressionTime(file.size / (1024 * 1024))}
              </p>
            </div>
          </div>
        </div>

        {/* Compression Options */}
        {state === 'idle' && (
          <div className="p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Compression Settings</h3>

            {/* Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Preset
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPreset(key as CompressionPreset)}
                    className={`p-3 text-center border rounded-lg ${
                      selectedPreset === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium capitalize">{key}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {preset.maxHeight}p • {preset.frameRate}fps
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality (0.1 - 1.0)
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={customOptions.quality}
                      onChange={(e) => setCustomOptions(prev => ({
                        ...prev,
                        quality: parseFloat(e.target.value)
                      }))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{customOptions.quality}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frame Rate
                    </label>
                    <select
                      value={customOptions.frameRate}
                      onChange={(e) => setCustomOptions(prev => ({
                        ...prev,
                        frameRate: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value={24}>24 fps</option>
                      <option value={30}>30 fps</option>
                      <option value={60}>60 fps</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Width (px)
                    </label>
                    <input
                      type="number"
                      value={customOptions.maxWidth}
                      onChange={(e) => setCustomOptions(prev => ({
                        ...prev,
                        maxWidth: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Height (px)
                    </label>
                    <input
                      type="number"
                      value={customOptions.maxHeight}
                      onChange={(e) => setCustomOptions(prev => ({
                        ...prev,
                        maxHeight: parseInt(e.target.value)
                      }))}
                      className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compression Progress */}
        {state === 'compressing' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Compressing Video</h3>
              <p className="text-gray-600">
                This may take a few minutes depending on your video size and device performance.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What's happening:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {progress < 20 && <li>• Analyzing video metadata...</li>}
                  {progress >= 20 && progress < 30 && <li>• Setting up compression pipeline...</li>}
                  {progress >= 30 && progress < 85 && <li>• Processing video frames...</li>}
                  {progress >= 85 && <li>• Finalizing compressed video...</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Compression Complete */}
        {state === 'completed' && result && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Compression Complete!</h3>
              <p className="text-gray-600">
                Your video has been successfully compressed.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Original Size:</span>
                <span className="font-medium">{formatFileSize(result.originalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Compressed Size:</span>
                <span className="font-medium text-green-600">{formatFileSize(result.compressedSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size Reduction:</span>
                <span className="font-medium text-green-600">{result.compressionRatio.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Taken:</span>
                <span className="font-medium">{formatTime(result.timeTaken / 1000)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={useCompressedFile}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Use Compressed Video
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Compression Failed</h3>
              <p className="text-gray-600 mb-4">
                {error || 'An unknown error occurred during compression.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setState('idle')
                  setError(null)
                  setProgress(0)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Start Compression Button */}
        {state === 'idle' && (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={startCompression}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Compression
            </button>
          </div>
        )}
      </div>
    </div>
  )
}