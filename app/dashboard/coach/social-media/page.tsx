'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AppHeader from '@/components/ui/AppHeader'
import {
  Instagram,
  Twitter,
  Facebook,
  Download,
  Copy,
  Camera
} from 'lucide-react'

interface PostData {
  title: string
  message: string
  hashtags: string
  platform: 'instagram' | 'twitter' | 'facebook' | 'linkedin'
  image: string | null
  coachName: string
  sport: string
}

export default function SocialMediaGenerator() {
  const { user } = useAuth()
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'twitter' | 'facebook' | 'linkedin'>('instagram')
  const [postData, setPostData] = useState<PostData>({
    title: '',
    message: '',
    hashtags: '',
    platform: 'instagram',
    image: null,
    coachName: user?.displayName || 'Coach',
    sport: 'Basketball'
  })

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'bg-black' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Facebook, color: 'bg-blue-700' }
  ]

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPostData(prev => ({ ...prev, image: e.target?.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postData.message + (postData.hashtags ? '\n\n' + postData.hashtags : ''))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E8E6D8' }}>
      <AppHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Post Generator</h1>
          <p className="text-gray-600">Create engaging social media content for your coaching brand</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Creation Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Post</CardTitle>
              <CardDescription>Design content optimized for each platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Select Platform</label>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => {
                    const IconComponent = platform.icon
                    return (
                      <button
                        key={platform.id}
                        onClick={() => {
                          setSelectedPlatform(platform.id as any)
                          setPostData(prev => ({ ...prev, platform: platform.id as any }))
                        }}
                        className={`p-3 border-2 rounded-lg flex items-center space-x-2 transition-all ${
                          selectedPlatform === platform.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-8 h-8 ${platform.color} rounded flex items-center justify-center`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">{platform.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Coach Name</label>
                  <Input
                    value={postData.coachName}
                    onChange={(e) => setPostData(prev => ({ ...prev, coachName: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <Input
                    value={postData.sport}
                    onChange={(e) => setPostData(prev => ({ ...prev, sport: e.target.value }))}
                    placeholder="Basketball, Soccer, etc."
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  value={postData.message}
                  onChange={(e) => setPostData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Write your post message..."
                  rows={4}
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium mb-2">Hashtags</label>
                <Input
                  value={postData.hashtags}
                  onChange={(e) => setPostData(prev => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="#coaching #basketball #training"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Add Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Upload an image for your post</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Choose Image
                  </label>
                </div>
                {postData.image && (
                  <div className="mt-4">
                    <img src={postData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <Button onClick={copyToClipboard} variant="outline" className="flex items-center space-x-2">
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </Button>
                <Button className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>See how your post will look on {selectedPlatform}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                {selectedPlatform === 'instagram' && (
                  <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {postData.coachName ? postData.coachName.charAt(0).toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold text-gray-900">{postData.coachName || 'Coach'}</p>
                          <p className="text-sm text-gray-600">{postData.sport} Coach</p>
                        </div>
                      </div>

                      {postData.image && (
                        <img src={postData.image} alt="Post" className="w-full h-64 object-cover rounded-lg mb-4" />
                      )}

                      {postData.message && (
                        <p className="text-gray-800 mb-2">{postData.message}</p>
                      )}

                      {postData.hashtags && (
                        <p className="text-blue-600 text-sm">{postData.hashtags}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedPlatform === 'twitter' && (
                  <div className="max-w-lg bg-white border border-gray-200 rounded-2xl shadow-lg">
                    <div className="p-4">
                      <div className="flex items-start mb-3">
                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold">
                            {postData.coachName ? postData.coachName.charAt(0).toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <p className="font-bold text-gray-900 mr-2">{postData.coachName || 'Coach'}</p>
                            <p className="text-gray-500 text-sm">@{(postData.coachName || 'coach').toLowerCase().replace(/\s+/g, '')}</p>
                          </div>
                          <p className="text-gray-600 text-sm">{postData.sport} Coach</p>
                        </div>
                      </div>

                      {postData.message && (
                        <p className="text-gray-900 mb-3 text-sm leading-relaxed">{postData.message}</p>
                      )}

                      {postData.image && (
                        <img src={postData.image} alt="Post" className="w-full h-64 object-cover rounded-2xl mb-3" />
                      )}

                      {postData.hashtags && (
                        <p className="text-blue-500 text-sm">{postData.hashtags}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedPlatform === 'facebook' && (
                  <div className="max-w-lg bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {postData.coachName ? postData.coachName.charAt(0).toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold text-gray-900">{postData.coachName || 'Coach'}</p>
                          <p className="text-sm text-gray-500">{postData.sport} Coach • Just now</p>
                        </div>
                      </div>

                      {postData.message && (
                        <p className="text-gray-800 mb-3">{postData.message}</p>
                      )}

                      {postData.image && (
                        <img src={postData.image} alt="Post" className="w-full h-64 object-cover rounded-lg mb-3" />
                      )}

                      {postData.hashtags && (
                        <p className="text-blue-600 text-sm">{postData.hashtags}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedPlatform === 'linkedin' && (
                  <div className="max-w-lg bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-4">
                      <div className="flex items-start mb-4">
                        <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold">
                            {postData.coachName ? postData.coachName.charAt(0).toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{postData.coachName || 'Coach'}</p>
                          <p className="text-sm text-gray-600">{postData.sport} Coach</p>
                          <p className="text-xs text-gray-500">1m • 🌐</p>
                        </div>
                      </div>

                      {postData.message && (
                        <p className="text-gray-800 mb-3 leading-relaxed">{postData.message}</p>
                      )}

                      {postData.image && (
                        <img src={postData.image} alt="Post" className="w-full h-64 object-cover rounded-lg mb-3" />
                      )}

                      {postData.hashtags && (
                        <p className="text-blue-700 text-sm">{postData.hashtags}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}