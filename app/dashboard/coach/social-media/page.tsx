'use client'

import { useState, useRef } from 'react'
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
  LinkedIn,
  Download,
  Copy,
  Camera,
  Users,
  Zap,
  Share2,
  MessageCircle,
  Heart,
  Send,
  Bookmark,
  MoreHorizontal,
  ThumbsUp
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'twitter' | 'facebook' | 'linkedin'>('instagram')
  const [postData, setPostData] = useState<PostData>({
    title: '',
    message: '',
    hashtags: '#PLAYBOOKD #CoachLife #TrainWithMe',
    platform: 'instagram',
    image: 'https://res.cloudinary.com/dr0jtjwlh/image/upload/v1758865671/2023_11_2_ze5r3n.jpg',
    coachName: 'Coach',
    sport: 'Soccer'
  })

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-black' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedIn, color: 'bg-blue-700' }
  ]

  const postTemplates = {
    announcement: {
      instagram: "🎉 Big announcement! I'm excited to share that I'm now offering personalized coaching through @playbookd_official! Ready to take your {sport} game to the next level? Let's work together! 💪",
      twitter: "🚀 Excited to announce: I'm now coaching on @playbookd! Bringing elite-level {sport} training directly to you. Ready to level up? Let's get to work! ⚽️",
      facebook: "I'm thrilled to announce a new chapter in my coaching career! I'm now offering personalized {sport} training through PLAYBOOKD. Whether you're just starting out or looking to reach the next level, I'm here to help you achieve your goals.",
      linkedin: "I'm excited to share that I've joined PLAYBOOKD as a coach, bringing my {sport} expertise to athletes worldwide. Looking forward to helping more athletes reach their potential through personalized, AI-enhanced training."
    },
    training: {
      instagram: "Just wrapped up an incredible training session! 🔥 The key to improvement? Consistency, dedication, and the right guidance. Who's ready to push their limits? 💯",
      twitter: "Training complete ✅ Remember: champions aren't made in the comfort zone. Every rep, every drill, every moment of focus gets you closer to your goals. #NoShortcuts",
      facebook: "Had an amazing training session today! It's incredible to see athletes push past their limits and discover what they're truly capable of. This is why I love coaching - witnessing those breakthrough moments.",
      linkedin: "Completed another successful training session with our athletes. It's remarkable how the right combination of technique, strategy, and mindset can unlock an athlete's true potential."
    },
    motivation: {
      instagram: "Your only limit is YOU! 🌟 Every champion was once a beginner who refused to give up. What's your next goal? Let's crush it together! 💪",
      twitter: "Success isn't about being perfect. It's about being persistent. Every setback is a setup for a comeback. Keep grinding! 🔥",
      facebook: "To all the athletes out there: remember that every expert was once a beginner. What matters isn't where you start, but how committed you are to growing every single day.",
      linkedin: "Athletic success is built on three pillars: skill development, mental resilience, and strategic planning. Master these, and you'll exceed your own expectations."
    }
  }

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

  const useTemplate = (type: keyof typeof postTemplates) => {
    const template = postTemplates[type][selectedPlatform]
    const message = template.replace('{sport}', postData.sport)
    setPostData(prev => ({ ...prev, message, platform: selectedPlatform }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const downloadImage = () => {
    alert('Image download functionality would be implemented here')
  }

  const renderPreview = () => {
    if (selectedPlatform === 'instagram') {
      return (
        <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center p-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="ml-3 font-semibold text-sm">{postData.coachName.toLowerCase().replace(' ', '.')}</span>
            <MoreHorizontal className="w-5 h-5 text-gray-700 ml-auto" />
          </div>
          {postData.image && (
            <img src={postData.image} alt="Post" className="w-full h-80 object-cover" />
          )}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-3">
                <Heart className="w-6 h-6 text-gray-700" />
                <MessageCircle className="w-6 h-6 text-gray-700" />
                <Send className="w-6 h-6 text-gray-700" />
              </div>
              <Bookmark className="w-6 h-6 text-gray-700" />
            </div>
            <div className="text-sm">
              <span className="font-semibold">{postData.coachName.toLowerCase().replace(' ', '.')}</span>
              <span className="ml-1">{postData.message}</span>
              {postData.hashtags && (
                <p className="text-blue-600 mt-1">{postData.hashtags}</p>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (selectedPlatform === 'twitter') {
      return (
        <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-bold">C</span>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center">
                <span className="font-bold text-gray-900">{postData.coachName}</span>
                <span className="text-gray-500 text-sm ml-2">@{postData.coachName.toLowerCase().replace(' ', '')}</span>
                <span className="text-gray-500 text-sm ml-2">· 2h</span>
              </div>
              <p className="mt-1 text-gray-800">{postData.message}</p>
              {postData.hashtags && (
                <p className="mt-1 text-blue-500">{postData.hashtags}</p>
              )}
              {postData.image && (
                <img src={postData.image} alt="Post" className="mt-3 rounded-2xl w-full h-48 object-cover" />
              )}
              <div className="flex justify-between items-center mt-3 text-gray-500 max-w-md">
                <MessageCircle className="w-5 h-5" />
                <Share2 className="w-5 h-5" />
                <Heart className="w-5 h-5" />
                <Bookmark className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (selectedPlatform === 'facebook') {
      return (
        <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <div className="ml-3">
                <p className="font-semibold text-gray-900">{postData.coachName}</p>
                <p className="text-xs text-gray-500">2h · 🌎</p>
              </div>
            </div>
            <p className="mt-4 text-gray-800 text-sm">{postData.message}</p>
            {postData.hashtags && (
              <p className="mt-2 text-blue-600 text-sm">{postData.hashtags}</p>
            )}
          </div>
          {postData.image && (
            <img src={postData.image} alt="Post" className="w-full h-64 object-cover" />
          )}
          <div className="flex justify-around items-center p-2 border-t border-gray-200 text-gray-600 text-sm">
            <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <ThumbsUp className="w-4 h-4" />
              <span>Like</span>
            </div>
            <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              <span>Comment</span>
            </div>
            <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </div>
          </div>
        </div>
      )
    }

    if (selectedPlatform === 'linkedin') {
      return (
        <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <div className="ml-3">
                <p className="font-semibold text-gray-900">{postData.coachName}</p>
                <p className="text-sm text-gray-600">Professional {postData.sport} Coach</p>
                <p className="text-xs text-gray-500">2h · 🌐</p>
              </div>
            </div>
            <p className="mt-4 text-gray-800">{postData.message}</p>
            {postData.hashtags && (
              <p className="mt-2 text-blue-700">{postData.hashtags}</p>
            )}
          </div>
          {postData.image && (
            <img src={postData.image} alt="Post" className="w-full h-64 object-cover" />
          )}
          <div className="flex justify-around items-center p-3 border-t border-gray-200 text-gray-600">
            <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <ThumbsUp className="w-5 h-5" />
              <span className="text-sm">Like</span>
            </div>
            <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">Comment</span>
            </div>
            <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <Share2 className="w-5 h-5" />
              <span className="text-sm">Share</span>
            </div>
          </div>
        </div>
      )
    }

    return null
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Platform</CardTitle>
                <CardDescription>Choose the social media platform for your post</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id as any)}
                      className={`flex items-center p-3 rounded-lg border-2 transition-all ${
                        selectedPlatform === platform.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${platform.color} flex items-center justify-center`}>
                        <platform.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="ml-2 font-medium">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
                <CardDescription>Get started with pre-written content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => useTemplate('announcement')}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Coaching Announcement
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => useTemplate('training')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Training Session
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => useTemplate('motivation')}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Motivational Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
                <CardDescription>Customize your message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      placeholder="Soccer, Basketball, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    value={postData.message}
                    onChange={(e) => setPostData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Write your post message..."
                    rows={4}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {postData.message.length} characters
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hashtags</label>
                  <Input
                    value={postData.hashtags}
                    onChange={(e) => setPostData(prev => ({ ...prev, hashtags: e.target.value }))}
                    placeholder="#PLAYBOOKD #CoachLife #TrainWithMe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image</label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {postData.image && (
                    <img
                      src={postData.image}
                      alt="Preview"
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex space-x-3">
                  <Button
                    onClick={() => copyToClipboard(postData.message + '\n\n' + postData.hashtags)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Text
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadImage}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className={`w-6 h-6 rounded ${platforms.find(p => p.id === selectedPlatform)?.color} flex items-center justify-center mr-2`}>
                    {platforms.find(p => p.id === selectedPlatform)?.icon && (
                      <platforms.find(p => p.id === selectedPlatform)!.icon className="w-3 h-3 text-white" />
                    )}
                  </div>
                  {platforms.find(p => p.id === selectedPlatform)?.name} Preview
                </CardTitle>
                <CardDescription>See how your post will look</CardDescription>
              </CardHeader>
              <CardContent>
                {renderPreview()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}