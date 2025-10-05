'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Mic,
  MessageCircle,
  Trophy,
  Target,
  Users,
  Heart,
  Brain,
  ChevronRight,
  CheckCircle,
  Star,
  Clock,
  MapPin,
  GraduationCap,
  Award
} from 'lucide-react'

interface VoiceCaptureData {
  // Biographical Deep Dive
  collegeExperience: {
    university: string
    yearsAttended: string
    major: string
    sportRole: string
    teamAchievements: string[]
    memorableGames: string[]
    coaches: string[]
    teammates: string[]
  }

  // Career Highlights
  careerMilestones: {
    biggestWin: string
    toughestLoss: string
    breakthrough: string
    proudestMoment: string
    definingGame: string
    championships: string[]
    records: string[]
  }

  // Coaching Philosophy Deep Dive
  philosophy: {
    coreBeliefs: string[]
    trainingApproach: string
    motivationStyle: string
    communicationPreferences: string
    valueSystem: string[]
    dealBreakers: string[]
  }

  // Voice & Personality
  voiceCharacteristics: {
    communicationStyle: string
    energyLevel: string
    humorStyle: string
    catchphrases: string[]
    favoriteQuotes: string[]
    speakingPatterns: string[]
    encouragementStyle: string
  }

  // Technical Expertise
  technicalKnowledge: {
    specialties: string[]
    innovations: string[]
    drillInventions: string[]
    uniqueApproaches: string[]
    technicalPhilosophy: string
    progressionMethods: string[]
  }

  // Story Bank
  storyBank: {
    inspirationalStories: string[]
    failureStories: string[]
    comebackStories: string[]
    funnyStories: string[]
    teachingMoments: string[]
    realWorldExamples: string[]
  }

  // Current Context
  currentContext: {
    currentTeam: string
    location: string
    facilityName: string
    seasonSchedule: string
    recentEvents: string[]
    upcoming: string[]
  }
}

interface VoiceCaptureIntakeProps {
  onComplete: (data: VoiceCaptureData) => void
  onProgress: (step: number, total: number) => void
  prePopulatedData?: () => Promise<any>
}

interface Section {
  title: string
  icon: any
  description: string
  progress: number
}

export default function VoiceCaptureIntake({ onComplete, onProgress, prePopulatedData }: VoiceCaptureIntakeProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [data, setData] = useState<VoiceCaptureData>({
    collegeExperience: {
      university: '',
      yearsAttended: '',
      major: '',
      sportRole: '',
      teamAchievements: [],
      memorableGames: [],
      coaches: [],
      teammates: []
    },
    careerMilestones: {
      biggestWin: '',
      toughestLoss: '',
      breakthrough: '',
      proudestMoment: '',
      definingGame: '',
      championships: [],
      records: []
    },
    philosophy: {
      coreBeliefs: [],
      trainingApproach: '',
      motivationStyle: '',
      communicationPreferences: '',
      valueSystem: [],
      dealBreakers: []
    },
    voiceCharacteristics: {
      communicationStyle: '',
      energyLevel: '',
      humorStyle: '',
      catchphrases: [],
      favoriteQuotes: [],
      speakingPatterns: [],
      encouragementStyle: ''
    },
    technicalKnowledge: {
      specialties: [],
      innovations: [],
      drillInventions: [],
      uniqueApproaches: [],
      technicalPhilosophy: '',
      progressionMethods: []
    },
    storyBank: {
      inspirationalStories: [],
      failureStories: [],
      comebackStories: [],
      funnyStories: [],
      teachingMoments: [],
      realWorldExamples: []
    },
    currentContext: {
      currentTeam: '',
      location: '',
      facilityName: '',
      seasonSchedule: '',
      recentEvents: [],
      upcoming: []
    }
  })

  const sections: Section[] = [
    {
      title: "College & Background",
      icon: GraduationCap,
      description: "Tell us about your college experience and foundation",
      progress: 15
    },
    {
      title: "Career Highlights",
      icon: Trophy,
      description: "Share your biggest moments and achievements",
      progress: 30
    },
    {
      title: "Coaching Philosophy",
      icon: Brain,
      description: "Deep dive into your coaching beliefs and approach",
      progress: 45
    },
    {
      title: "Voice & Personality",
      icon: MessageCircle,
      description: "Capture your unique communication style",
      progress: 60
    },
    {
      title: "Technical Expertise",
      icon: Target,
      description: "Share your specialized knowledge and innovations",
      progress: 75
    },
    {
      title: "Story Bank",
      icon: Heart,
      description: "Build your library of teaching stories",
      progress: 90
    },
    {
      title: "Current Context",
      icon: MapPin,
      description: "Your current situation and recent events",
      progress: 100
    }
  ]

  const updateData = (section: keyof VoiceCaptureData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const addToArray = (section: keyof VoiceCaptureData, field: string, value: string) => {
    if (!value.trim()) return
    setData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: [...((prev[section] as any)[field] || []), value.trim()]
      }
    }))
  }

  const removeFromArray = (section: keyof VoiceCaptureData, field: string, index: number) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: (prev[section] as any)[field].filter((_: any, i: number) => i !== index)
      }
    }))
  }

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1)
      onProgress(currentSection + 1, sections.length)
    } else {
      onComplete(data)
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1)
      onProgress(currentSection - 1, sections.length)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Voice Capture Intake</h1>
        <p className="text-lg text-gray-600">
          The more detail you provide, the more authentic your AI coaching voice becomes
        </p>
        <Progress value={sections[currentSection].progress} className="w-full max-w-md mx-auto" />
        <p className="text-sm text-gray-500">
          Section {currentSection + 1} of {sections.length}: {sections[currentSection].title}
        </p>
      </div>

      {/* Section Navigation */}
      <div className="grid grid-cols-7 gap-2 mb-8">
        {sections.map((section, index) => {
          const Icon = section.icon
          const isActive = index === currentSection
          const isCompleted = index < currentSection

          return (
            <div
              key={index}
              className={`text-center p-2 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : isCompleted
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setCurrentSection(index)}
            >
              <Icon className={`w-6 h-6 mx-auto mb-1 ${
                isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`} />
              <p className={`text-xs font-medium ${
                isActive ? 'text-blue-900' : isCompleted ? 'text-green-800' : 'text-gray-600'
              }`}>
                {section.title}
              </p>
            </div>
          )
        })}
      </div>

      {/* Current Section Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {React.createElement(sections[currentSection].icon, { className: "w-6 h-6" })}
            {sections[currentSection].title}
          </CardTitle>
          <CardDescription>{sections[currentSection].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSection === 0 && <CollegeExperienceSection data={data.collegeExperience} updateData={updateData} addToArray={addToArray} removeFromArray={removeFromArray} />}
          {currentSection === 1 && <CareerHighlightsSection data={data.careerMilestones} updateData={updateData} addToArray={addToArray} removeFromArray={removeFromArray} />}
          {currentSection === 2 && <PhilosophySection data={data.philosophy} updateData={updateData} addToArray={addToArray} removeFromArray={removeFromArray} />}
          {currentSection === 3 && <VoiceCharacteristicsSection data={data.voiceCharacteristics} updateData={updateData} addToArray={addToArray} removeFromArray={removeFromArray} />}
          {currentSection === 4 && <TechnicalExpertiseSection data={data.technicalKnowledge} updateData={updateData} addToArray={addToArray} removeFromArray={removeFromArray} />}
          {currentSection === 5 && <StoryBankSection data={data.storyBank} updateData={updateData} addToArray={addToArray} removeFromArray={removeFromArray} />}
          {currentSection === 6 && <CurrentContextSection data={data.currentContext} updateData={updateData} addToArray={addToArray} removeFromArray={removeFromArray} />}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevSection}
              disabled={currentSection === 0}
            >
              Previous
            </Button>
            <Button onClick={nextSection}>
              {currentSection === sections.length - 1 ? 'Complete Voice Capture' : 'Next Section'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual Section Components
const CollegeExperienceSection = ({ data, updateData, addToArray, removeFromArray }: any) => {
  const [tempValue, setTempValue] = useState('')
  const [tempField, setTempField] = useState('')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="university">University/College</Label>
          <Input
            id="university"
            value={data.university}
            onChange={(e) => updateData('collegeExperience', 'university', e.target.value)}
            placeholder="e.g., Stanford University"
          />
        </div>
        <div>
          <Label htmlFor="yearsAttended">Years Attended</Label>
          <Input
            id="yearsAttended"
            value={data.yearsAttended}
            onChange={(e) => updateData('collegeExperience', 'yearsAttended', e.target.value)}
            placeholder="e.g., 2018-2022"
          />
        </div>
        <div>
          <Label htmlFor="major">Major/Field of Study</Label>
          <Input
            id="major"
            value={data.major}
            onChange={(e) => updateData('collegeExperience', 'major', e.target.value)}
            placeholder="e.g., Exercise Science"
          />
        </div>
        <div>
          <Label htmlFor="sportRole">Role in Sport</Label>
          <Input
            id="sportRole"
            value={data.sportRole}
            onChange={(e) => updateData('collegeExperience', 'sportRole', e.target.value)}
            placeholder="e.g., Team Captain, Starting Midfielder"
          />
        </div>
      </div>

      <div>
        <Label>Team Achievements (Conference titles, tournaments, etc.)</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={tempField === 'teamAchievements' ? tempValue : ''}
            onChange={(e) => {setTempValue(e.target.value); setTempField('teamAchievements')}}
            placeholder="e.g., Pac-12 Champions 2022"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('collegeExperience', 'teamAchievements', tempValue)
                setTempValue('')
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              addToArray('collegeExperience', 'teamAchievements', tempValue)
              setTempValue('')
            }}
            variant="outline"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.teamAchievements.map((achievement: string, index: number) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeFromArray('collegeExperience', 'teamAchievements', index)}
            >
              {achievement} ×
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>Memorable Games/Moments</Label>
        <p className="text-sm text-gray-600 mb-2">Share specific games or moments that shaped you</p>
        <Textarea
          value={tempField === 'memorableGames' ? tempValue : ''}
          onChange={(e) => {setTempValue(e.target.value); setTempField('memorableGames')}}
          placeholder="e.g., 'College Cup semifinal against UCLA - scored the winning goal in overtime'"
          rows={3}
        />
        <Button
          type="button"
          onClick={() => {
            if (tempValue.trim()) {
              addToArray('collegeExperience', 'memorableGames', tempValue)
              setTempValue('')
            }
          }}
          className="mt-2"
          variant="outline"
        >
          Add Memory
        </Button>
        <div className="space-y-2 mt-3">
          {data.memorableGames.map((game: string, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">{game}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFromArray('collegeExperience', 'memorableGames', index)}
                className="mt-1"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const CareerHighlightsSection = ({ data, updateData, addToArray, removeFromArray }: any) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="biggestWin">Biggest Win/Achievement</Label>
        <Textarea
          id="biggestWin"
          value={data.biggestWin}
          onChange={(e) => updateData('careerMilestones', 'biggestWin', e.target.value)}
          placeholder="Describe your biggest victory - what happened, how it felt, what it meant"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="toughestLoss">Toughest Loss/Setback</Label>
        <Textarea
          id="toughestLoss"
          value={data.toughestLoss}
          onChange={(e) => updateData('careerMilestones', 'toughestLoss', e.target.value)}
          placeholder="Describe a significant loss or setback - what you learned, how you grew"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="breakthrough">Breakthrough Moment</Label>
        <Textarea
          id="breakthrough"
          value={data.breakthrough}
          onChange={(e) => updateData('careerMilestones', 'breakthrough', e.target.value)}
          placeholder="When did you realize you had 'made it' or reached a new level?"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="definingGame">Most Defining Game/Performance</Label>
        <Textarea
          id="definingGame"
          value={data.definingGame}
          onChange={(e) => updateData('careerMilestones', 'definingGame', e.target.value)}
          placeholder="Describe the game or performance that best represents who you are as a competitor"
          rows={3}
        />
      </div>
    </div>
  )
}

const PhilosophySection = ({ data, updateData, addToArray, removeFromArray }: any) => {
  const [tempValue, setTempValue] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="trainingApproach">Training Approach</Label>
        <Textarea
          id="trainingApproach"
          value={data.trainingApproach}
          onChange={(e) => updateData('philosophy', 'trainingApproach', e.target.value)}
          placeholder="How do you structure training? What's your methodology?"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="motivationStyle">Motivation Style</Label>
        <Textarea
          id="motivationStyle"
          value={data.motivationStyle}
          onChange={(e) => updateData('philosophy', 'motivationStyle', e.target.value)}
          placeholder="How do you motivate athletes? Are you a fire-them-up coach or more analytical?"
          rows={3}
        />
      </div>

      <div>
        <Label>Core Beliefs</Label>
        <p className="text-sm text-gray-600 mb-2">What do you absolutely believe about coaching/training?</p>
        <div className="flex gap-2">
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="e.g., 'Fundamentals win championships'"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('philosophy', 'coreBeliefs', tempValue)
                setTempValue('')
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              addToArray('philosophy', 'coreBeliefs', tempValue)
              setTempValue('')
            }}
            variant="outline"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.coreBeliefs.map((belief: string, index: number) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeFromArray('philosophy', 'coreBeliefs', index)}
            >
              {belief} ×
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

const VoiceCharacteristicsSection = ({ data, updateData, addToArray, removeFromArray }: any) => {
  const [tempValue, setTempValue] = useState('')
  const [tempField, setTempField] = useState('')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="communicationStyle">Communication Style</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={data.communicationStyle}
            onChange={(e) => updateData('voiceCharacteristics', 'communicationStyle', e.target.value)}
          >
            <option value="">Select style...</option>
            <option value="direct">Direct & Straight-forward</option>
            <option value="encouraging">Encouraging & Supportive</option>
            <option value="analytical">Analytical & Technical</option>
            <option value="passionate">Passionate & Intense</option>
            <option value="calm">Calm & Measured</option>
            <option value="humorous">Humorous & Light</option>
          </select>
        </div>
        <div>
          <Label htmlFor="energyLevel">Energy Level</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={data.energyLevel}
            onChange={(e) => updateData('voiceCharacteristics', 'energyLevel', e.target.value)}
          >
            <option value="">Select energy...</option>
            <option value="high">High Energy & Animated</option>
            <option value="moderate">Moderate & Steady</option>
            <option value="calm">Calm & Composed</option>
            <option value="variable">Variable (adapts to situation)</option>
          </select>
        </div>
      </div>

      <div>
        <Label>Catchphrases & Favorite Sayings</Label>
        <p className="text-sm text-gray-600 mb-2">What phrases do you use repeatedly?</p>
        <div className="flex gap-2">
          <Input
            value={tempField === 'catchphrases' ? tempValue : ''}
            onChange={(e) => {setTempValue(e.target.value); setTempField('catchphrases')}}
            placeholder="e.g., 'Trust your preparation'"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('voiceCharacteristics', 'catchphrases', tempValue)
                setTempValue('')
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              addToArray('voiceCharacteristics', 'catchphrases', tempValue)
              setTempValue('')
            }}
            variant="outline"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {data.catchphrases.map((phrase: string, index: number) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeFromArray('voiceCharacteristics', 'catchphrases', index)}
            >
              {phrase} ×
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="encouragementStyle">How do you encourage athletes?</Label>
        <Textarea
          id="encouragementStyle"
          value={data.encouragementStyle}
          onChange={(e) => updateData('voiceCharacteristics', 'encouragementStyle', e.target.value)}
          placeholder="Describe how you encourage athletes when they're struggling or succeeding"
          rows={3}
        />
      </div>
    </div>
  )
}

const TechnicalExpertiseSection = ({ data, updateData, addToArray, removeFromArray }: any) => {
  const [tempValue, setTempValue] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="technicalPhilosophy">Technical Philosophy</Label>
        <Textarea
          id="technicalPhilosophy"
          value={data.technicalPhilosophy}
          onChange={(e) => updateData('technicalKnowledge', 'technicalPhilosophy', e.target.value)}
          placeholder="What's your approach to technical skill development?"
          rows={4}
        />
      </div>

      <div>
        <Label>Unique Drills or Innovations</Label>
        <p className="text-sm text-gray-600 mb-2">Drills you've created or unique training methods</p>
        <div className="flex gap-2">
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="e.g., 'Progressive pressure passing drill'"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addToArray('technicalKnowledge', 'drillInventions', tempValue)
                setTempValue('')
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              addToArray('technicalKnowledge', 'drillInventions', tempValue)
              setTempValue('')
            }}
            variant="outline"
          >
            Add
          </Button>
        </div>
        <div className="space-y-2 mt-3">
          {data.drillInventions.map((drill: string, index: number) => (
            <div key={index} className="p-2 bg-gray-50 rounded">
              <span className="text-sm">{drill}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFromArray('technicalKnowledge', 'drillInventions', index)}
                className="ml-2"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const StoryBankSection = ({ data, updateData, addToArray, removeFromArray }: any) => {
  const [tempStory, setTempStory] = useState('')
  const [activeCategory, setActiveCategory] = useState('inspirationalStories')

  const storyCategories = [
    { key: 'inspirationalStories', label: 'Inspirational Stories', icon: Star },
    { key: 'failureStories', label: 'Failure/Learning Stories', icon: Target },
    { key: 'comebackStories', label: 'Comeback Stories', icon: Trophy },
    { key: 'teachingMoments', label: 'Teaching Moments', icon: Brain },
    { key: 'realWorldExamples', label: 'Real-World Examples', icon: Users }
  ]

  return (
    <div className="space-y-6">
      <div>
        <Label>Story Categories</Label>
        <p className="text-sm text-gray-600 mb-4">Build your library of stories to use in coaching</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {storyCategories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  activeCategory === category.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{category.label}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {data[category.key].length} stories
                </p>
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          <Textarea
            value={tempStory}
            onChange={(e) => setTempStory(e.target.value)}
            placeholder={`Share a story for ${storyCategories.find(c => c.key === activeCategory)?.label}...`}
            rows={4}
          />
          <Button
            onClick={() => {
              if (tempStory.trim()) {
                addToArray('storyBank', activeCategory, tempStory)
                setTempStory('')
              }
            }}
            className="w-full"
          >
            Add Story to {storyCategories.find(c => c.key === activeCategory)?.label}
          </Button>
        </div>

        <div className="space-y-3 mt-4">
          {data[activeCategory].map((story: string, index: number) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm mb-2">{story}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFromArray('storyBank', activeCategory, index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const CurrentContextSection = ({ data, updateData, addToArray, removeFromArray }: any) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currentTeam">Current Team/Organization</Label>
          <Input
            id="currentTeam"
            value={data.currentTeam}
            onChange={(e) => updateData('currentContext', 'currentTeam', e.target.value)}
            placeholder="e.g., Stanford Women's Soccer"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={data.location}
            onChange={(e) => updateData('currentContext', 'location', e.target.value)}
            placeholder="e.g., Palo Alto, CA"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="facilityName">Primary Training Facility</Label>
        <Input
          id="facilityName"
          value={data.facilityName}
          onChange={(e) => updateData('currentContext', 'facilityName', e.target.value)}
          placeholder="e.g., Cagan Stadium"
        />
      </div>

      <div>
        <Label htmlFor="seasonSchedule">Current Season/Schedule</Label>
        <Textarea
          id="seasonSchedule"
          value={data.seasonSchedule}
          onChange={(e) => updateData('currentContext', 'seasonSchedule', e.target.value)}
          placeholder="Describe your current season, upcoming games, training schedule"
          rows={3}
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-800 mb-2">🎉 Voice Capture Complete!</h3>
        <p className="text-green-700 text-sm">
          You're building an incredibly detailed coaching voice. The more information you provide,
          the more authentic and personalized your AI coaching responses will become. Athletes will
          feel like they're talking directly to you!
        </p>
      </div>
    </div>
  )
}