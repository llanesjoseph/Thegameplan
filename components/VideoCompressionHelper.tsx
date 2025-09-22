'use client'

import { useState } from 'react'
import { Archive, ExternalLink, Zap } from 'lucide-react'

interface VideoCompressionHelperProps {
  file: File
  onCompressed?: (compressedFile: File) => void
  className?: string
}

export default function VideoCompressionHelper({
  file,
  onCompressed,
  className = ''
}: VideoCompressionHelperProps) {
  const [isOpen, setIsOpen] = useState(false)

  const compressionTools = [
    {
      name: 'HandBrake',
      type: 'Desktop (Free)',
      url: 'https://handbrake.fr/',
      description: 'Professional video transcoder',
      features: ['Best quality control', 'Batch processing', 'Advanced settings'],
      recommended: true
    },
    {
      name: 'CloudConvert',
      type: 'Online (Free/Paid)',
      url: 'https://cloudconvert.com/',
      description: 'Online video converter',
      features: ['No download needed', 'Multiple formats', 'API available']
    },
    {
      name: 'VideoSmaller',
      type: 'Online (Free)',
      url: 'https://www.videosmaller.com/',
      description: 'Simple online compressor',
      features: ['One-click compression', 'Fast processing', 'No registration']
    }
  ]

  const estimatedSize = (file.size * 0.3)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm ${className}`}
      >
        <Archive className="w-4 h-4" />
        Compress Video ({(file.size / (1024 * 1024)).toFixed(1)} MB)
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Video Compression Helper</h2>
              <p className="text-gray-600 text-sm mt-1">
                Reduce file size from {(file.size / (1024 * 1024)).toFixed(1)} MB to ~{(estimatedSize / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Optimal Settings */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Recommended Settings
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><strong>Format:</strong> MP4 (H.264)</div>
              <div><strong>Resolution:</strong> 1080p (1920x1080)</div>
              <div><strong>Bitrate:</strong> 5-8 Mbps for HD content</div>
              <div><strong>Frame Rate:</strong> 30 fps (or original)</div>
              <div className="md:col-span-2"><strong>Audio:</strong> AAC, 128-192 kbps</div>
            </div>
          </div>

          {/* Compression Tools */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Compression Tools</h3>
            <div className="space-y-3">
              {compressionTools.map((tool, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${tool.recommended ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{tool.name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tool.type}
                        </span>
                        {tool.recommended && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{tool.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {tool.features.map((feature, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Open
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Guide */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Quick Guide</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                <span>Choose a compression tool (HandBrake recommended for best results)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                <span>Load your video file: <strong>{file.name}</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                <span>Apply the recommended settings above</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
                <span>Start compression (this may take 5-30 minutes depending on file size)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">5</span>
                <span>Upload the compressed file for faster, more reliable uploads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Tip: Compression typically reduces file size by 50-80% with minimal quality loss
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}