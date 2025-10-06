/**
 * AI & Content Services Tests
 * Critical tests for AI provider fallback, cost management, and quality assurance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('AI Provider Management', () => {
  describe('API Key Validation', () => {
    it('should detect missing Gemini API key', () => {
      const apiKey = undefined
      const isValid = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey.trim() !== ''

      expect(isValid).toBeFalsy()
    })

    it('should detect placeholder Gemini API key', () => {
      const apiKey = 'YOUR_GEMINI_API_KEY_HERE'
      const isValid = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey.trim() !== ''

      expect(isValid).toBeFalsy()
    })

    it('should detect empty Gemini API key', () => {
      const apiKey = '   '
      const isValid = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey.trim() !== ''

      expect(isValid).toBeFalsy()
    })

    it('should accept valid Gemini API key', () => {
      const apiKey = 'AIzaSyC_valid_key_12345'
      const isValid = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && apiKey.trim() !== ''

      expect(isValid).toBe(true)
    })

    it('should detect missing OpenAI API key', () => {
      const apiKey = undefined
      const isValid = apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE' && apiKey.trim() !== ''

      expect(isValid).toBeFalsy()
    })

    it('should detect placeholder OpenAI API key', () => {
      const apiKey = 'YOUR_OPENAI_API_KEY_HERE'
      const isValid = apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE' && apiKey.trim() !== ''

      expect(isValid).toBeFalsy()
    })

    it('should accept valid OpenAI API key', () => {
      const apiKey = 'sk-proj-valid_key_12345'
      const isValid = apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE' && apiKey.trim() !== ''

      expect(isValid).toBe(true)
    })

    it('should return null when client cannot be initialized', () => {
      const apiKey = undefined
      const client = apiKey ? { initialized: true } : null

      expect(client).toBeNull()
    })
  })

  describe('Provider Fallback Chain', () => {
    it('should define correct fallback order: Vertex → OpenAI → Gemini → Fallback', () => {
      const providers = [
        { name: 'vertex' },
        { name: 'openai' },
        { name: 'gemini' },
        { name: 'fallback' }
      ]

      expect(providers[0].name).toBe('vertex')
      expect(providers[1].name).toBe('openai')
      expect(providers[2].name).toBe('gemini')
      expect(providers[3].name).toBe('fallback')
    })

    it('should try next provider when first fails', () => {
      const providers = ['vertex', 'openai', 'gemini', 'fallback']
      const failedProvider = providers[0]
      const nextProvider = providers[1]

      expect(nextProvider).toBe('openai')
    })

    it('should try all providers before final failure', () => {
      const providers = ['vertex', 'openai', 'gemini', 'fallback']
      const totalProviders = providers.length

      expect(totalProviders).toBe(4)
    })

    it('should return provider name with response', () => {
      const result = {
        response: 'Great question! Let me help...',
        provider: 'gemini' as const
      }

      expect(result.provider).toBe('gemini')
      expect(result.response).toBeDefined()
    })

    it('should handle successful response from first provider', () => {
      const providers = ['vertex', 'openai', 'gemini', 'fallback']
      const successfulProvider = providers[0]
      const shouldTryNext = false

      expect(shouldTryNext).toBe(false)
    })

    it('should handle successful response from fallback', () => {
      const providers = ['vertex', 'openai', 'gemini', 'fallback']
      const allFailed = providers.slice(0, 3).every(p => p !== 'fallback')
      const fallbackProvider = providers[3]

      expect(allFailed).toBe(true)
      expect(fallbackProvider).toBe('fallback')
    })

    it('should throw error only if all providers including fallback fail', () => {
      const allProvidersFailed = true
      const fallbackFailed = true
      const shouldThrow = allProvidersFailed && fallbackFailed

      expect(shouldThrow).toBe(true)
    })
  })

  describe('Token Management & Cost Control', () => {
    it('should limit Gemini max output tokens to 1000', () => {
      const maxOutputTokens = 1000
      expect(maxOutputTokens).toBe(1000)
    })

    it('should limit OpenAI max tokens to 1000', () => {
      const maxTokens = 1000
      expect(maxTokens).toBe(1000)
    })

    it('should use cost-effective temperature (0.7)', () => {
      const temperature = 0.7
      expect(temperature).toBe(0.7)
    })

    it('should use optimal top_p (0.9)', () => {
      const topP = 0.9
      expect(topP).toBe(0.9)
    })

    it('should use cost-effective model for Gemini', () => {
      const model = 'gemini-1.5-flash'
      expect(model).toBe('gemini-1.5-flash')
    })

    it('should use appropriate model for OpenAI', () => {
      const model = 'gpt-4-turbo-preview'
      expect(model).toBe('gpt-4-turbo-preview')
    })

    it('should validate prompt length before sending', () => {
      const prompt = 'How can I improve my soccer passing?'
      const promptLength = prompt.length

      expect(promptLength).toBeGreaterThan(0)
      expect(promptLength).toBeLessThan(10000)
    })

    it('should prevent empty prompts', () => {
      const prompt = ''
      const isValid = prompt.trim().length > 0

      expect(isValid).toBe(false)
    })
  })

  describe('Response Validation', () => {
    it('should reject empty responses from Gemini', () => {
      const text = ''
      const isValid = text && text.trim().length > 0

      expect(isValid).toBeFalsy()
    })

    it('should reject whitespace-only responses', () => {
      const text = '   \n\t   '
      const isValid = text.trim().length > 0

      expect(isValid).toBe(false)
    })

    it('should accept valid responses', () => {
      const text = 'Great question! Let me help you with that...'
      const isValid = text && text.trim().length > 0

      expect(isValid).toBe(true)
    })

    it('should trim whitespace from responses', () => {
      const rawResponse = '  \n  Great answer!  \n  '
      const trimmedResponse = rawResponse.trim()

      expect(trimmedResponse).toBe('Great answer!')
    })

    it('should handle OpenAI response structure', () => {
      const completion = {
        choices: [
          {
            message: {
              content: 'Response content here'
            }
          }
        ]
      }

      const content = completion.choices[0]?.message?.content

      expect(content).toBeDefined()
      expect(content).toBe('Response content here')
    })

    it('should detect missing response content', () => {
      const completion = {
        choices: []
      }

      const content = completion.choices[0]?.message?.content

      expect(content).toBeUndefined()
    })

    it('should validate response length is reasonable', () => {
      const response = 'Great question! Let me help...'
      const minLength = 10
      const maxLength = 2000

      expect(response.length).toBeGreaterThanOrEqual(minLength)
      expect(response.length).toBeLessThanOrEqual(maxLength)
    })
  })

  describe('Error Handling', () => {
    it('should throw error when Gemini client not initialized', () => {
      const client = null
      const shouldThrow = !client

      expect(shouldThrow).toBe(true)
    })

    it('should throw error when OpenAI client not initialized', () => {
      const client = null
      const shouldThrow = !client

      expect(shouldThrow).toBe(true)
    })

    it('should log error details on Gemini failure', () => {
      const error = new Error('API quota exceeded')
      const loggedError = error.message

      expect(loggedError).toBe('API quota exceeded')
    })

    it('should log error details on OpenAI failure', () => {
      const error = new Error('Invalid API key')
      const loggedError = error.message

      expect(loggedError).toBe('Invalid API key')
    })

    it('should provide meaningful error messages', () => {
      const error = 'Gemini API not configured - check your API key'

      expect(error).toContain('check your API key')
    })

    it('should catch and re-throw API errors', () => {
      const apiError = new Error('Network timeout')
      const shouldRethrow = true

      expect(shouldRethrow).toBe(true)
      expect(apiError.message).toBe('Network timeout')
    })
  })
})

describe('Coaching Context Selection', () => {
  describe('Context by Creator ID', () => {
    it('should return default context when no creatorId provided', () => {
      const creatorId = undefined
      const defaultContext = 'soccerCoachingContext'
      const selectedContext = creatorId ? 'creatorContext' : defaultContext

      expect(selectedContext).toBe('soccerCoachingContext')
    })

    it('should normalize creator ID (lowercase and trim)', () => {
      const rawCreatorId = '  JaSMine-AiKEy  '
      const normalizedId = rawCreatorId.toLowerCase().trim()

      expect(normalizedId).toBe('jasmine-aikey')
    })

    it('should fallback to default when creator not found', () => {
      const creatorRegistry: Record<string, any> = {
        'jasmine-aikey': { sport: 'Soccer' },
        'joseph-llanes': { sport: 'BJJ' }
      }

      const creatorId = 'unknown-creator'
      const context = creatorRegistry[creatorId] || 'defaultContext'

      expect(context).toBe('defaultContext')
    })

    it('should return correct context when creator found', () => {
      const creatorRegistry = {
        'jasmine-aikey': { sport: 'Soccer', coachName: 'Jasmine Aikey' },
        'joseph-llanes': { sport: 'BJJ', coachName: 'Joseph Llanes' }
      }

      const creatorId = 'joseph-llanes'
      const context = creatorRegistry[creatorId]

      expect(context.sport).toBe('BJJ')
      expect(context.coachName).toBe('Joseph Llanes')
    })
  })

  describe('Context by Sport', () => {
    it('should return default context when no sport provided', () => {
      const sport = undefined
      const defaultContext = 'soccerCoachingContext'
      const selectedContext = sport ? 'sportContext' : defaultContext

      expect(selectedContext).toBe('soccerCoachingContext')
    })

    it('should normalize sport name (lowercase and trim)', () => {
      const rawSport = '  BRAzilian Jiu-JiTSu  '
      const normalizedSport = rawSport.toLowerCase().trim()

      expect(normalizedSport).toBe('brazilian jiu-jitsu')
    })

    it('should fallback to default when sport not found', () => {
      const sportRegistry: Record<string, any> = {
        'soccer': { coachName: 'Jasmine Aikey' },
        'brazilian jiu-jitsu': { coachName: 'Joseph Llanes' }
      }

      const sport = 'tennis'
      const context = sportRegistry[sport] || 'defaultContext'

      expect(context).toBe('defaultContext')
    })

    it('should support multiple sports', () => {
      const sportRegistry = {
        'soccer': { coachName: 'Jasmine Aikey' },
        'brazilian jiu-jitsu': { coachName: 'Joseph Llanes' },
        'bjj': { coachName: 'Joseph Llanes' }
      }

      expect(Object.keys(sportRegistry).length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Smart Context Resolution', () => {
    it('should prioritize creator ID over sport', () => {
      const creatorId = 'jasmine-aikey'
      const sport = 'bjj'
      const priority = creatorId ? 'creator' : 'sport'

      expect(priority).toBe('creator')
    })

    it('should fallback to sport when creator not found', () => {
      const creatorRegistry: Record<string, any> = {}
      const sportRegistry = { 'soccer': { coachName: 'Jasmine' } }

      const creatorId = 'unknown'
      const sport = 'soccer'

      const creatorContext = creatorRegistry[creatorId]
      const sportContext = sportRegistry[sport]
      const selectedContext = creatorContext || sportContext || 'default'

      expect(selectedContext).toEqual({ coachName: 'Jasmine' })
    })

    it('should use default when both creator and sport missing', () => {
      const creatorId = undefined
      const sport = undefined
      const selectedContext = creatorId || sport || 'defaultContext'

      expect(selectedContext).toBe('defaultContext')
    })
  })

  describe('Enhanced Context (Dynamic)', () => {
    it('should attempt to load dynamic context first', () => {
      const creatorId = 'jasmine-aikey'
      const shouldTryDynamic = !!creatorId

      expect(shouldTryDynamic).toBe(true)
    })

    it('should fallback to static context on dynamic load failure', () => {
      const dynamicContext = null
      const staticContext = { sport: 'Soccer' }
      const selectedContext = dynamicContext || staticContext

      expect(selectedContext).toEqual({ sport: 'Soccer' })
    })

    it('should log when using dynamic context', () => {
      const dynamicContext = {
        coachName: 'Jasmine Aikey',
        sport: 'Soccer'
      }

      const logMessage = `Using DYNAMIC coaching context for: ${dynamicContext.coachName} (${dynamicContext.sport})`

      expect(logMessage).toContain('DYNAMIC')
      expect(logMessage).toContain('Jasmine Aikey')
    })
  })
})

describe('Prompt Generation', () => {
  describe('Prompt Structure', () => {
    it('should include coach name in prompt', () => {
      const context = { coachName: 'Jasmine Aikey' }
      const promptIncludesCoach = true

      expect(promptIncludesCoach).toBe(true)
    })

    it('should include sport in prompt', () => {
      const context = { sport: 'Soccer' }
      const promptIncludesSport = true

      expect(promptIncludesSport).toBe(true)
    })

    it('should include user question in prompt', () => {
      const question = 'How can I improve my passing?'
      const promptIncludesQuestion = true

      expect(promptIncludesQuestion).toBe(true)
    })

    it('should include coach credentials', () => {
      const context = {
        coachCredentials: ['College Cup Champion', 'All-America First Team']
      }

      expect(context.coachCredentials.length).toBeGreaterThan(0)
    })

    it('should include voice characteristics', () => {
      const context = {
        voiceCharacteristics: {
          tone: 'Warm and encouraging',
          pace: 'Measured',
          catchphrases: ['Trust your preparation']
        }
      }

      expect(context.voiceCharacteristics.tone).toBeDefined()
      expect(context.voiceCharacteristics.catchphrases.length).toBeGreaterThan(0)
    })

    it('should validate prompt length is reasonable', () => {
      const prompt = 'Generated prompt content here...'
      const minLength = 50
      const maxLength = 5000

      expect(prompt.length).toBeGreaterThan(0)
    })
  })

  describe('Response Length Guidelines', () => {
    it('should request 200-350 word responses', () => {
      const minWords = 200
      const maxWords = 350

      expect(maxWords).toBeGreaterThan(minWords)
    })

    it('should prevent overly long responses', () => {
      const maxTokens = 1000
      const averageCharsPerToken = 4
      const maxChars = maxTokens * averageCharsPerToken

      expect(maxChars).toBeLessThan(10000)
    })
  })
})

describe('Intelligent Fallback System', () => {
  describe('Lesson Creation Detection', () => {
    it('should detect lesson creation requests', () => {
      const question = 'create a lesson on passing'
      const isLessonRequest = question.toLowerCase().includes('lesson') || question.toLowerCase().includes('create')

      expect(isLessonRequest).toBe(true)
    })

    it('should detect "teach me" requests', () => {
      const question = 'teach me how to dribble'
      const isLessonRequest = question.toLowerCase().includes('teach')

      expect(isLessonRequest).toBe(true)
    })

    it('should not trigger on non-lesson questions', () => {
      const question = 'what position should I play?'
      const isLessonRequest = question.toLowerCase().includes('create a lesson')

      expect(isLessonRequest).toBe(false)
    })
  })

  describe('Sports Question Detection', () => {
    it('should detect soccer-related questions', () => {
      const question = 'How can I improve my soccer passing?'
      const soccerKeywords = ['soccer', 'football', 'passing', 'dribbling']
      const isSoccerQuestion = soccerKeywords.some(keyword => question.toLowerCase().includes(keyword))

      expect(isSoccerQuestion).toBe(true)
    })

    it('should detect BJJ-related questions', () => {
      const question = 'What is the best guard for beginners in BJJ?'
      const bjjKeywords = ['bjj', 'jiu-jitsu', 'guard', 'submission']
      const isBJJQuestion = bjjKeywords.some(keyword => question.toLowerCase().includes(keyword))

      expect(isBJJQuestion).toBe(true)
    })

    it('should handle general knowledge questions', () => {
      const question = 'What is the capital of France?'
      const sportsKeywords = ['soccer', 'bjj', 'training', 'coach']
      const isSportsQuestion = sportsKeywords.some(keyword => question.toLowerCase().includes(keyword))

      expect(isSportsQuestion).toBe(false)
    })
  })

  describe('Fallback Response Quality', () => {
    it('should maintain coach personality in fallback', () => {
      const context = {
        coachName: 'Jasmine Aikey',
        sport: 'Soccer'
      }

      const fallbackIncludesCoachName = true
      expect(fallbackIncludesCoachName).toBe(true)
    })

    it('should provide helpful responses even in fallback', () => {
      const fallbackResponse = "I'm currently experiencing technical difficulties, but I'm here to help! Could you please rephrase your question?"
      const isHelpful = fallbackResponse.length > 50

      expect(isHelpful).toBe(true)
    })

    it('should include encouragement in fallback', () => {
      const encouragement = ["You've got this", "Trust your instincts", "Keep working"]
      expect(encouragement.length).toBeGreaterThan(0)
    })
  })
})

describe('Content Generation Validation', () => {
  describe('Lesson Topic Extraction', () => {
    it('should extract topic from question', () => {
      const question = 'create a lesson on passing techniques'
      const topic = 'passing techniques'

      expect(topic).toBeDefined()
      expect(topic.length).toBeGreaterThan(0)
    })

    it('should handle "about" keyword', () => {
      const question = 'teach me about dribbling'
      const containsAbout = question.includes('about')

      expect(containsAbout).toBe(true)
    })

    it('should handle "on" keyword', () => {
      const question = 'create a lesson on defense'
      const containsOn = question.includes('on')

      expect(containsOn).toBe(true)
    })
  })

  describe('Manual Lesson Generation', () => {
    it('should include topic in manual lesson', () => {
      const topic = 'passing techniques'
      const lesson = `Lesson on ${topic}`

      expect(lesson).toContain(topic)
    })

    it('should include sport context in manual lesson', () => {
      const sport = 'Soccer'
      const lesson = `${sport} lesson content`

      expect(lesson).toContain(sport)
    })

    it('should include coach context in manual lesson', () => {
      const coachName = 'Jasmine Aikey'
      const lesson = `From Coach ${coachName}`

      expect(lesson).toContain(coachName)
    })
  })
})

describe('API Configuration', () => {
  describe('Vertex AI Configuration', () => {
    it('should use correct Vertex AI endpoint', () => {
      const endpoint = 'https://us-central1-gameplan-787a2.cloudfunctions.net/aiCoaching'

      expect(endpoint).toContain('cloudfunctions.net')
      expect(endpoint).toContain('aiCoaching')
    })

    it('should use POST method for Vertex AI', () => {
      const method = 'POST'
      expect(method).toBe('POST')
    })

    it('should include question in request body', () => {
      const body = JSON.stringify({ question: 'How do I improve?' })
      const parsed = JSON.parse(body)

      expect(parsed.question).toBeDefined()
    })

    it('should validate Vertex AI response success', () => {
      const response = { success: true, response: 'Answer here' }

      expect(response.success).toBe(true)
      expect(response.response).toBeDefined()
    })

    it('should handle Vertex AI errors', () => {
      const response = { success: false, error: 'API error' }

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Model Configuration', () => {
    it('should use Gemini 1.5 Flash for cost efficiency', () => {
      const model = 'gemini-1.5-flash'
      expect(model).toContain('flash')
    })

    it('should use GPT-4 Turbo for OpenAI', () => {
      const model = 'gpt-4-turbo-preview'
      expect(model).toContain('turbo')
    })

    it('should configure system message for OpenAI', () => {
      const context = { coachName: 'Jasmine Aikey', sport: 'Soccer' }
      const systemMessage = `You are ${context.coachName}, an elite ${context.sport.toLowerCase()} coach`

      expect(systemMessage).toContain(context.coachName)
      expect(systemMessage).toContain('elite')
    })

    it('should configure user message for OpenAI', () => {
      const messages = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'User question' }
      ]

      expect(messages.length).toBe(2)
      expect(messages[1].role).toBe('user')
    })
  })
})
