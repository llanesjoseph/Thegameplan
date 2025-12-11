'use client'

/**
 * Coach Profile Placeholder Component
 * Displays a complete-looking default profile when a coach profile has minimal content
 * This provides a professional appearance until coaches add their personalized content
 */

import {
  BookOpen,
  Award,
  Trophy,
  Target
} from 'lucide-react'

interface CoachProfilePlaceholderProps {
  coachName: string
  sport: string
}

// Sport-specific specialties
const getSportSpecialties = (sport: string): string[] => {
  const specialtiesMap: Record<string, string[]> = {
    'Baseball': ['Pitching Mechanics', 'Hitting Fundamentals', 'Defensive Positioning', 'Base Running Strategy', 'Mental Game Development'],
    'Basketball': ['Shooting Form', 'Ball Handling', 'Defensive Techniques', 'Court Vision', 'Conditioning & Agility'],
    'Soccer': ['Ball Control', 'Passing Accuracy', 'Defensive Strategy', 'Speed Training', 'Game Awareness'],
    'Football': ['Position-Specific Training', 'Speed & Agility', 'Strength Training', 'Game Strategy', 'Film Study'],
    'Volleyball': ['Serving Technique', 'Passing & Setting', 'Hitting Power', 'Defensive Positioning', 'Team Communication'],
    'Tennis': ['Serve Mechanics', 'Forehand & Backhand', 'Court Positioning', 'Mental Toughness', 'Match Strategy'],
    'Track & Field': ['Sprint Technique', 'Endurance Training', 'Form Analysis', 'Race Strategy', 'Injury Prevention'],
    'Swimming': ['Stroke Technique', 'Breathing Mechanics', 'Turn Efficiency', 'Race Pacing', 'Strength Training'],
    'Golf': ['Swing Mechanics', 'Short Game', 'Course Management', 'Mental Focus', 'Practice Routines'],
    'Softball': ['Pitching Mechanics', 'Hitting Fundamentals', 'Fielding Techniques', 'Base Running', 'Game Situations']
  }

  return specialtiesMap[sport] || [
    'Fundamental Skills',
    'Advanced Techniques',
    'Mental Preparation',
    'Performance Analysis',
    'Conditioning Programs'
  ]
}

// Generate professional bio
const generateBio = (coachName: string, sport: string): string => {
  const firstName = coachName.split(' ')[0]
  return `Coach ${firstName} brings a passion for ${sport} and a commitment to developing athletes at all levels. With a focus on building both technical skills and mental resilience, Coach ${firstName} creates personalized training programs that help athletes reach their full potential. Their coaching philosophy centers on fundamentals, consistent practice, and fostering a growth mindset. Whether you're just starting out or looking to take your game to the next level, Coach ${firstName} is dedicated to helping you achieve your athletic goals.`
}

// Generic professional certifications
const getDefaultCertifications = (sport: string): string[] => {
  return [
    `Certified ${sport} Coach`,
    'Sports Performance Training Certification',
    'Athlete Development Specialist',
    'First Aid & CPR Certified'
  ]
}

// Generic achievements
const getDefaultAchievements = (): string[] => {
  return [
    'Developed training programs for athletes of all skill levels',
    'Committed to continuous learning and coaching education',
    'Focused on building strong coach-athlete relationships',
    'Dedicated to creating positive training environments'
  ]
}

export default function CoachProfilePlaceholder({
  coachName,
  sport
}: CoachProfilePlaceholderProps) {
  const specialties = getSportSpecialties(sport)
  const bio = generateBio(coachName, sport)
  const certifications = getDefaultCertifications(sport)
  const achievements = getDefaultAchievements()

  return (
    <div className="space-y-6">
      {/* About Section - Full Bio */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
        <h2 className="text-2xl font-heading mb-4" style={{ color: '#000000' }}>
          About
        </h2>
        <p className="text-base leading-relaxed" style={{ color: '#000000', opacity: 0.8 }}>
          {bio}
        </p>
      </div>

      {/* Specialties Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
        <h2 className="text-2xl font-heading mb-4" style={{ color: '#000000' }}>
          Coaching Specialties
        </h2>
        <div className="flex flex-wrap gap-2">
          {specialties.map((specialty, index) => (
            <span
              key={index}
              className="px-4 py-2 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: index % 3 === 0 ? '#91A6EB' : index % 3 === 1 ? '#20B2AA' : '#FF6B35' }}
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>

      {/* Professional Background - Certifications & Achievements */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Certifications */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-6 h-6" style={{ color: '#20B2AA' }} />
            <h2 className="text-xl font-heading" style={{ color: '#000000' }}>
              Certifications
            </h2>
          </div>
          <ul className="space-y-2">
            {certifications.map((cert, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-xl" style={{ color: '#20B2AA' }}>•</span>
                <span style={{ color: '#000000', opacity: 0.8 }}>{cert}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Achievements */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6" style={{ color: '#FF6B35' }} />
            <h2 className="text-xl font-heading" style={{ color: '#000000' }}>
              Achievements
            </h2>
          </div>
          <ul className="space-y-2">
            {achievements.map((achievement, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-xl" style={{ color: '#FF6B35' }}>•</span>
                <span style={{ color: '#000000', opacity: 0.8 }}>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Training Content Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading" style={{ color: '#000000' }}>
            Training Content
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#E8E6D8' }}>
            <BookOpen className="w-10 h-10" style={{ color: '#91A6EB' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#000000' }}>
            Building Content Library
          </h3>
          <p className="text-sm mb-2" style={{ color: '#666666' }}>
            {coachName} is developing comprehensive training lessons and drills.
          </p>
          <p className="text-sm" style={{ color: '#666666' }}>
            New content will be published soon. Check back regularly for updates!
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-3">Ready to Train?</h3>
          <p className="text-teal-50 mb-6 text-lg">
            Coach {coachName.split(' ')[0]} is accepting new athletes for {sport} training.
            Personalized coaching programs available for all skill levels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex-1 max-w-xs">
              <div className="text-3xl font-bold mb-1">1-on-1</div>
              <div className="text-sm text-teal-100">Personal Training</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex-1 max-w-xs">
              <div className="text-3xl font-bold mb-1">Group</div>
              <div className="text-sm text-teal-100">Team Sessions</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex-1 max-w-xs">
              <div className="text-3xl font-bold mb-1">Online</div>
              <div className="text-sm text-teal-100">Virtual Coaching</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
