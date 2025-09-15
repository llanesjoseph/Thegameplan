// Medical Safety System for AI Coaching Platform
// Detects medical conditions, injuries, and safety concerns

export interface MedicalSafetyResult {
  isSafe: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  detectedConcerns: string[]
  safetyResponse: string
  shouldBlock: boolean
}

// Medical keywords and phrases that indicate potential medical issues
const MEDICAL_KEYWORDS = {
  injuries: [
    'broke', 'broken', 'fracture', 'fractured', 'sprain', 'sprained',
    'torn', 'tear', 'injury', 'injured', 'hurt', 'pain', 'painful',
    'swollen', 'swelling', 'bruised', 'bruise', 'bleeding', 'blood',
    'cut', 'wound', 'stitches', 'surgery', 'operation', 'hospital',
    'emergency', 'urgent', 'severe', 'intense', 'unbearable',
    'dislocated', 'dislocation', 'concussion', 'head injury'
  ],
  
  symptoms: [
    'dizzy', 'dizziness', 'nauseous', 'nausea', 'vomiting', 'fever',
    'chest pain', 'shortness of breath', 'breathing', 'breathe',
    'heart rate', 'pulse', 'faint', 'fainting', 'unconscious',
    'numbness', 'tingling', 'weakness', 'paralysis', 'seizure',
    'headache', 'migraine', 'vision', 'hearing', 'balance'
  ],
  
  medical_conditions: [
    'diabetes', 'heart condition', 'heart disease', 'asthma',
    'epilepsy', 'medication', 'prescription', 'doctor', 'physician',
    'medical', 'diagnosis', 'treatment', 'therapy', 'rehabilitation',
    'physical therapy', 'chronic', 'condition', 'syndrome', 'disorder'
  ],
  
  emergency_phrases: [
    'i think i broke', 'i broke my', 'i injured my', 'i hurt my',
    'something is wrong', 'need medical', 'should i see a doctor',
    'is this serious', 'am i okay', 'what should i do',
    'emergency room', 'urgent care', 'call 911', 'ambulance'
  ]
}

// Safety responses for different risk levels
const SAFETY_RESPONSES = {
  critical: `🚨 **IMPORTANT MEDICAL NOTICE** 🚨

I've detected that you may be describing a serious injury or medical condition. This platform is designed for sports training guidance only and cannot provide medical advice.

**Please seek immediate medical attention:**
- Call 911 for emergencies
- Visit your nearest emergency room
- Contact your doctor or urgent care

Your health and safety are the top priority. Please get proper medical evaluation before returning to any physical activity.`,

  high: `⚠️ **MEDICAL SAFETY NOTICE** ⚠️

It sounds like you may have an injury or medical concern. This platform cannot provide medical advice or injury assessment.

**Recommended actions:**
- Consult with a healthcare professional
- Get proper medical evaluation
- Follow your doctor's guidance for return to activity

Once you've been cleared by a medical professional, I'd be happy to help with training guidance that's appropriate for your situation.`,

  medium: `🏥 **HEALTH & SAFETY REMINDER** 🏥

I notice you mentioned something that might be injury or health-related. While I can provide general training advice, I cannot assess injuries or provide medical guidance.

**For any pain, injury, or health concerns:**
- Consult with a healthcare provider
- Get proper evaluation before continuing training
- Follow medical advice for safe return to activity

Is there a non-medical training question I can help you with instead?`,

  low: `💡 **Training Safety Note** 💡

I want to make sure you're training safely! If you're experiencing any pain, discomfort, or have concerns about an injury, please consult with a healthcare professional first.

I'm here to help with training techniques, strategy, and performance improvement for healthy athletes. What specific training aspect can I assist you with?`
}

export function analyzeMedicalSafety(userInput: string): MedicalSafetyResult {
  const input = userInput.toLowerCase()
  const detectedConcerns: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

  // Check for emergency phrases first (highest priority)
  for (const phrase of MEDICAL_KEYWORDS.emergency_phrases) {
    if (input.includes(phrase)) {
      detectedConcerns.push(`Emergency phrase: "${phrase}"`)
      riskLevel = 'critical'
    }
  }

  // Check for injury keywords
  for (const keyword of MEDICAL_KEYWORDS.injuries) {
    if (input.includes(keyword)) {
      detectedConcerns.push(`Injury keyword: "${keyword}"`)
      if (riskLevel === 'low') riskLevel = 'high'
    }
  }

  // Check for symptoms
  for (const symptom of MEDICAL_KEYWORDS.symptoms) {
    if (input.includes(symptom)) {
      detectedConcerns.push(`Symptom: "${symptom}"`)
      if (riskLevel === 'low') riskLevel = 'medium'
    }
  }

  // Check for medical conditions
  for (const condition of MEDICAL_KEYWORDS.medical_conditions) {
    if (input.includes(condition)) {
      detectedConcerns.push(`Medical reference: "${condition}"`)
      if (riskLevel === 'low') riskLevel = 'medium'
    }
  }

  // Determine if we should block the request
  const shouldBlock = riskLevel === 'critical' || riskLevel === 'high'
  const isSafe = riskLevel === 'low'

  return {
    isSafe,
    riskLevel,
    detectedConcerns,
    safetyResponse: SAFETY_RESPONSES[riskLevel],
    shouldBlock
  }
}

export function getMedicalDisclaimerResponse(riskLevel: 'low' | 'medium' | 'high' | 'critical'): string {
  return SAFETY_RESPONSES[riskLevel]
}

// Additional utility function to check if input contains medical content
export function containsMedicalContent(input: string): boolean {
  const analysis = analyzeMedicalSafety(input)
  return !analysis.isSafe
}

// Function to get a safe training response when medical content is detected
export function getSafeTrainingResponse(): string {
  return `I'm here to help with sports training, technique, strategy, and performance improvement for healthy athletes. 

Some areas I can assist with:
- Training techniques and form
- Practice drills and exercises
- Game strategy and tactics
- Mental preparation and confidence
- Nutrition for performance
- Recovery and rest strategies

What specific training topic would you like to explore?`
}
