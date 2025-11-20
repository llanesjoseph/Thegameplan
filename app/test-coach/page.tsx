'use client'

import { useSearchParams } from 'next/navigation'
import HeroCoachProfile from '@/components/coach/HeroCoachProfile'

const MOCK_GALLERY = [
  'https://static.wixstatic.com/media/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg',
  'https://static.wixstatic.com/media/8bb438_734b8f436e944886b4185aa6f72b5cad~mv2_d_3000_2000_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_734b8f436e944886b4185aa6f72b5cad~mv2_d_3000_2000_s_2.jpg',
  'https://static.wixstatic.com/media/8bb438_b596f0cc1c134605b59843a052cd8f37~mv2_d_3000_2930_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_b596f0cc1c134605b59843a052cd8f37~mv2_d_3000_2930_s_4_2.jpg',
  'https://static.wixstatic.com/media/8bb438_288176fe374c49949c53917e808c1410~mv2_d_8192_7754_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_288176fe374c49949c53917e808c1410~mv2_d_8192_7754_s_4_2.jpg',
  'https://static.wixstatic.com/media/8bb438_ec9a72099f9648dfb08d9412804a464a~mv2_d_3000_2000_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_ec9a72099f9648dfb08d9412804a464a~mv2_d_3000_2000_s_2.jpg'
]

const MOCK_LESSONS = [
  {
    id: 'lesson-1',
    title: 'Footwork and Passing in Soccer',
    status: 'Ended',
    thumbnailUrl:
      'https://static.wixstatic.com/media/75fa07_7baff433f739445c80025eb9def66ea0~mv2.png/v1/fill/w_210,h_210,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/75fa07_7baff433f739445c80025eb9def66ea0~mv2.png'
  },
  {
    id: 'lesson-2',
    title: 'Soccer Drills for Beginners',
    status: 'Ended',
    thumbnailUrl:
      'https://static.wixstatic.com/media/75fa07_7baff433f739445c80025eb9def66ea0~mv2.png/v1/fill/w_210,h_210,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/75fa07_7baff433f739445c80025eb9def66ea0~mv2.png'
  }
]

const MOCK_GEAR = [
  {
    id: 'gear-1',
    name: "copy of I'm a product",
    price: '$40.00',
    imageUrl:
      'https://static.wixstatic.com/media/22e53e_7066c7318bb34be38d3a4f2e3a256021~mv2.jpg/v1/fill/w_180,h_180,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/22e53e_7066c7318bb34be38d3a4f2e3a256021~mv2.jpg'
  },
  {
    id: 'gear-2',
    name: "I'm a product",
    price: '$20.00',
    imageUrl:
      'https://static.wixstatic.com/media/75fa07_9e80f4f714ed4aa6af571767e94cd183~mv2.jpg/v1/fill/w_180,h_180,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/75fa07_9e80f4f714ed4aa6af571767e94cd183~mv2.jpg'
  },
  {
    id: 'gear-3',
    name: "I'm a product",
    price: '$120.00',
    imageUrl:
      'https://static.wixstatic.com/media/22e53e_8adb0d7018b047e0a998acf987fd3fd6~mv2.jpg/v1/fill/w_180,h_180,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/22e53e_8adb0d7018b047e0a998acf987fd3fd6~mv2.jpg'
  },
  {
    id: 'gear-4',
    name: "I'm a product",
    price: '$40.00',
    imageUrl:
      'https://static.wixstatic.com/media/22e53e_f2d6c005d04646fd8bed4cffbca35c1e~mv2.jpg/v1/fill/w_180,h_180,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/22e53e_f2d6c005d04646fd8bed4cffbca35c1e~mv2.jpg'
  }
]

const MOCK_COACH = {
  uid: '',
  email: '',
  displayName: 'Jasmine Aikey',
  bio: 'Elite soccer player at Stanford University with expertise in midfield play, technical development, and mental preparation. Focused on helping athletes build tactical awareness, ball control, and a competitive mindset using proven training methodologies and real game experience.',
  sport: 'Soccer',
  location: 'Silicon Valley, California',
  profileImageUrl:
    'https://static.wixstatic.com/media/11062b_0c31e11f36104a17b1637c2774331958~mv2.jpg/v1/crop/x_958,y_0,w_3350,h_3468/fill/w_347,h_359,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/11062b_0c31e11f36104a17b1637c2774331958~mv2.jpg',
  showcasePhoto1:
    'https://static.wixstatic.com/media/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_3ae04589aef4480e89a24d7283c69798~mv2_d_2869_3586_s_4_2.jpg',
  showcasePhoto2:
    'https://static.wixstatic.com/media/8bb438_734b8f436e944886b4185aa6f72b5cad~mv2_d_3000_2000_s_2.jpg/v1/fill/w_428,h_570,q_90,enc_avif,quality_auto/8bb438_734b8f436e944886b4185aa6f72b5cad~mv2_d_3000_2000_s_2.jpg',
  instagram: 'athleap',
  youtube: 'https://youtube.com/@athleap',
  linkedin: 'https://linkedin.com/company/athleap',
  facebook: 'https://facebook.com/athleap',
  socialLinks: {
    instagram: 'https://instagram.com/athleap',
    linkedin: 'https://linkedin.com/company/athleap',
    twitter: 'https://twitter.com/athleap'
  },
  galleryPhotos: MOCK_GALLERY
}

export default function CoachTestPage() {
  const searchParams = useSearchParams()
  const sportParam = (searchParams.get('sport') || 'Soccer').trim().toLowerCase()
  const sport = sportParam ? sportParam.charAt(0).toUpperCase() + sportParam.slice(1) : 'Soccer'

  const coach = {
    ...MOCK_COACH,
    sport
  }

  return (
    <HeroCoachProfile
      coach={coach}
      lessons={MOCK_LESSONS}
      totalLessons={MOCK_LESSONS.length}
      totalAthletes={24}
      initialGearItems={MOCK_GEAR}
    />
  )
}


