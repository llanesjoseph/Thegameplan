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
  // Critical emergency indicators
  critical_emergencies: [
    'can\'t breathe', 'cannot breathe', 'trouble breathing', 'difficulty breathing',
    'chest pain', 'heart attack', 'stroke', 'seizure', 'unconscious',
    'not breathing', 'stopped breathing', 'choking', 'allergic reaction',
    'severe bleeding', 'heavy bleeding', 'losing blood', 'blood loss',
    'head trauma', 'severe head', 'skull', 'brain injury', 'coma',
    'overdose', 'poisoning', 'poisoned', 'toxic', 'collapsed',
    'cardiac arrest', 'heart stopped', 'no pulse', 'unresponsive',
    'convulsions', 'severe burns', 'electrocuted', 'drowning'
  ],

  emergency_phrases: [
    'call 911', 'call an ambulance', 'need ambulance', 'emergency room',
    'urgent care', 'hospital now', 'going to hospital', 'er visit',
    'i think i broke', 'i broke my', 'something is seriously wrong',
    'i need medical help', 'medical emergency', 'this is urgent',
    'should i call 911', 'need help now', 'am i dying',
    'is this life threatening', 'might be serious', 'very worried',
    'scared something is wrong', 'think i need a doctor'
  ],

  severe_injuries: [
    'broke', 'broken', 'fracture', 'fractured', 'dislocated', 'dislocation',
    'torn ligament', 'torn muscle', 'torn acl', 'torn mcl', 'torn rotator',
    'compound fracture', 'open fracture', 'bone sticking out',
    'severe sprain', 'grade 3 sprain', 'complete tear',
    'concussion', 'head injury', 'neck injury', 'spine injury',
    'can\'t move', 'cannot move', 'paralyzed', 'numb everywhere',
    'severe pain', 'excruciating', 'unbearable pain', 'worst pain',
    'deformed', 'bone is crooked', 'looks wrong', 'unnatural angle'
  ],

  concerning_symptoms: [
    'dizzy', 'dizziness', 'lightheaded', 'nauseous', 'nausea', 'vomiting',
    'fever', 'high temperature', 'chills', 'sweating profusely',
    'shortness of breath', 'breathless', 'winded', 'gasping',
    'heart racing', 'heart pounding', 'irregular heartbeat',
    'faint', 'fainting', 'passed out', 'blacked out',
    'numbness', 'tingling', 'pins and needles', 'weakness',
    'severe headache', 'migraine', 'blurred vision', 'double vision',
    'hearing loss', 'ringing ears', 'balance problems', 'vertigo',
    'confusion', 'disoriented', 'memory loss', 'slurred speech'
  ],

  injuries: [
    'injury', 'injured', 'hurt', 'pain', 'painful', 'aching',
    'swollen', 'swelling', 'bruised', 'bruise', 'bleeding', 'blood',
    'cut', 'wound', 'gash', 'laceration', 'puncture',
    'sprain', 'sprained', 'strain', 'strained', 'pulled muscle',
    'twisted', 'rolled ankle', 'jammed finger', 'hyperextended'
  ],

  medical_conditions: [
    'diabetes', 'diabetic', 'heart condition', 'heart disease', 'cardiac',
    'asthma', 'asthmatic', 'epilepsy', 'epileptic', 'hypertension',
    'blood pressure', 'medication', 'prescription', 'pills',
    'doctor', 'physician', 'specialist', 'medical', 'diagnosis',
    'treatment', 'therapy', 'rehabilitation', 'physical therapy',
    'chronic', 'condition', 'syndrome', 'disorder', 'disease'
  ],

  medical_procedures: [
    'surgery', 'operation', 'procedure', 'stitches', 'sutures',
    'hospital', 'hospitalized', 'admitted', 'x-ray', 'mri', 'ct scan',
    'ultrasound', 'blood test', 'biopsy', 'injection', 'iv'
  ]
}

// Safety responses for different risk levels
const SAFETY_RESPONSES = {
  critical: `🚨 **MEDICAL EMERGENCY - SEEK IMMEDIATE HELP** 🚨

**This sounds like a potential medical emergency. Please take immediate action:**

🏥 **EMERGENCY SERVICES:**
• **Call 911 immediately** if this is happening now
• Go to the nearest Emergency Room
• If unconscious/unresponsive, call 911 first

📞 **POISON CONTROL:** 1-800-222-1222 (if poisoning suspected)

**I am an AI sports coach and cannot provide medical advice or emergency care. This platform is designed only for sports training guidance for healthy individuals.**

**Your safety is the absolute priority. Please get immediate professional medical attention.**

---

*Once you've received proper medical care and been cleared by healthcare professionals, I'll be here to help with your safe return to training when appropriate.*`,

  high: `⚠️ **SERIOUS MEDICAL CONCERN - GET PROFESSIONAL HELP** ⚠️

**Based on what you've described, this needs medical attention from a qualified healthcare professional.**

🏥 **RECOMMENDED ACTIONS:**
• **See a doctor or healthcare provider today**
• Visit urgent care if your doctor isn't available
• Do not ignore severe symptoms or injuries
• Consider the emergency room if symptoms worsen

**IMPORTANT:** I'm an AI sports coach, not a medical professional. I cannot:
- Diagnose injuries or medical conditions
- Provide medical advice or treatment
- Assess whether something is "serious" or not

**Please get proper medical evaluation before continuing any physical activity.**

---

*After you've been medically evaluated and cleared, I'd be happy to help with appropriate training guidance for your situation.*`,

  medium: `🏃‍♂️ **SPORTS RECOVERY & MEDICAL CLEARANCE REQUIRED** 🏃‍♂️

I understand you're dealing with an injury or medical situation. As a sports coach, I want to help you return safely and confidently.

**FIRST PRIORITY - MEDICAL CLEARANCE:**
• Get evaluated by a healthcare professional
• Follow their treatment and recovery plan
• Obtain clearance before returning to training
• Ask about any activity restrictions or modifications

**ONCE MEDICALLY CLEARED, I CAN HELP WITH:**
• Mental strategies for confident return to sport
• Sport-specific conditioning and skill rebuilding
• Injury prevention techniques and strengthening
• Training modifications for gradual progression
• Confidence and focus techniques for comeback

**SAFETY REMINDER:** Always follow your healthcare provider's guidance. They know your specific situation and can provide medical advice that I cannot.

What specific aspect of your sports recovery journey would you like guidance on once you're medically cleared?`,

  low: `💡 **TRAINING SAFETY & INJURY PREVENTION** 💡

I want to make sure you're training safely and getting the most out of your athletic development!

**SAFETY FIRST APPROACH:**
• Any pain, discomfort, or injury concerns should be evaluated by a healthcare professional
• "Playing through pain" can lead to more serious injuries
• When in doubt, get it checked out

**I'M HERE TO HELP WITH:**
• Proper training techniques and form
• Injury prevention strategies
• Safe progression in your sport
• Performance improvement for healthy athletes
• Mental preparation and confidence building

**Remember:** I'm a sports coach, not a medical professional. For any health concerns, always consult with qualified healthcare providers.

What specific aspect of your training would you like to work on today?`
}

export function analyzeMedicalSafety(userInput: string): MedicalSafetyResult {
  const input = userInput.toLowerCase()
  const detectedConcerns: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

  // Check for sports recovery context that should be allowed with lower risk
  const sportsRecoveryContext = [
    'coming back', 'returning', 'return to', 'recovery', 'recovered', 'mindset', 'routine',
    'training after', 'getting back', 'confidence after', 'mental preparation',
    'best practices', 'prevention', 'strengthening', 'conditioning',
    'cleared by doctor', 'doctor cleared', 'medically cleared', 'physical therapy',
    'rehab', 'rehabilitation', 'comeback', 'getting back into', 'back to training'
  ]

  const hasSportsContext = sportsRecoveryContext.some(phrase => input.includes(phrase))

  // Check for past tense vs present tense to distinguish current emergencies
  const pastTenseIndicators = [
    'had', 'was', 'were', 'did', 'used to', 'last week', 'last month', 'ago',
    'previously', 'before', 'earlier', 'history of', 'past', 'old injury'
  ]
  const isPastTense = pastTenseIndicators.some(indicator => input.includes(indicator))

  // CRITICAL EMERGENCY DETECTION (immediate medical attention needed)
  for (const emergency of MEDICAL_KEYWORDS.critical_emergencies) {
    if (input.includes(emergency)) {
      detectedConcerns.push(`CRITICAL EMERGENCY: "${emergency}"`)
      if (!isPastTense) { // Only if it's happening now
        riskLevel = 'critical'
      } else if (riskLevel < 'high') {
        riskLevel = 'high' // Past emergency still needs medical attention
      }
    }
  }

  // EMERGENCY PHRASES (high priority)
  for (const phrase of MEDICAL_KEYWORDS.emergency_phrases) {
    if (input.includes(phrase)) {
      detectedConcerns.push(`Emergency phrase: "${phrase}"`)
      if (!isPastTense && !hasSportsContext) {
        riskLevel = 'critical'
      } else if (riskLevel < 'high') {
        riskLevel = 'high'
      }
    }
  }

  // SEVERE INJURIES (high priority unless clearly in recovery context)
  for (const injury of MEDICAL_KEYWORDS.severe_injuries) {
    if (input.includes(injury)) {
      detectedConcerns.push(`Severe injury: "${injury}"`)

      if (hasSportsContext && isPastTense) {
        // Discussing past injury in sports context - medium risk
        if (riskLevel < 'medium') riskLevel = 'medium'
      } else if (!isPastTense) {
        // Current severe injury - high risk
        if (riskLevel < 'high') riskLevel = 'high'
      } else {
        // Past severe injury without sports context - high risk
        if (riskLevel < 'high') riskLevel = 'high'
      }
    }
  }

  // CONCERNING SYMPTOMS (medium to high priority)
  for (const symptom of MEDICAL_KEYWORDS.concerning_symptoms) {
    if (input.includes(symptom)) {
      detectedConcerns.push(`Concerning symptom: "${symptom}"`)

      if (!isPastTense && !hasSportsContext) {
        // Current symptoms need medical attention
        if (riskLevel < 'high') riskLevel = 'high'
      } else if (riskLevel < 'medium') {
        riskLevel = 'medium'
      }
    }
  }

  // GENERAL INJURIES (lower priority, context-dependent)
  for (const injury of MEDICAL_KEYWORDS.injuries) {
    if (input.includes(injury)) {
      detectedConcerns.push(`Injury keyword: "${injury}"`)

      if (hasSportsContext && (isPastTense || injury === 'injury' || injury === 'injured')) {
        // Sports recovery context - medium risk
        if (riskLevel < 'medium') riskLevel = 'medium'
      } else if (!isPastTense) {
        // Current injury - high risk
        if (riskLevel < 'high') riskLevel = 'high'
      } else {
        // Past injury without context - medium risk
        if (riskLevel < 'medium') riskLevel = 'medium'
      }
    }
  }

  // MEDICAL CONDITIONS (generally medium risk)
  for (const condition of MEDICAL_KEYWORDS.medical_conditions) {
    if (input.includes(condition)) {
      detectedConcerns.push(`Medical reference: "${condition}"`)
      if (riskLevel < 'medium') riskLevel = 'medium'
    }
  }

  // MEDICAL PROCEDURES (generally medium risk unless emergency)
  for (const procedure of MEDICAL_KEYWORDS.medical_procedures) {
    if (input.includes(procedure)) {
      detectedConcerns.push(`Medical procedure: "${procedure}"`)
      if (riskLevel < 'medium') riskLevel = 'medium'
    }
  }

  // INTELLIGENT CONTEXT ANALYSIS
  // Lower risk if clearly discussing sports recovery with medical clearance
  if (hasSportsContext && (input.includes('cleared') || input.includes('therapist') || input.includes('rehab'))) {
    if (riskLevel === 'high' && !detectedConcerns.some(c => c.includes('CRITICAL EMERGENCY'))) {
      riskLevel = 'medium' // Reduce to medium if in recovery context
    }
  }

  // Higher risk for urgent language - but ONLY if there's already medical content detected
  const urgentLanguage = [
    'call 911', 'need ambulance', 'emergency room', 'am i dying',
    'is this life threatening', 'should i go to hospital',
    'worried', 'scared', 'frightened', 'terrified'
  ]
  const hasUrgentLanguage = urgentLanguage.some(urgent => input.includes(urgent))

  // Only escalate if there's ACTUAL medical content AND urgent language
  // This prevents false positives: "I'm worried about motivation" = no warning
  // But: "I'm worried about this chest pain" = escalates to high risk
  if (hasUrgentLanguage && !isPastTense && riskLevel >= 'medium' && detectedConcerns.length > 0) {
    if (riskLevel === 'medium') riskLevel = 'high'
    else if (riskLevel === 'high') riskLevel = 'critical'
  }

  // Determine if we should block the request (provide safety response instead of coaching)
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
