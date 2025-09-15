// Clean generateFullLesson function for replacement

const generateFullLesson = async (prompt, shouldSave = false) => {
  setGeneratingContent(true)
  try {
    // Use OpenAI to generate sport-specific content
    console.log(`🤖 Generating ${selectedSport} lesson for: ${prompt}`)
    
    const aiPrompt = `You are an expert ${selectedSport} instructor. Create a detailed lesson plan for "${prompt}" in ${selectedSport}. 

Please provide a comprehensive lesson in this exact JSON format:
{
  "title": "Engaging lesson title for ${prompt} in ${selectedSport}",
  "description": "Detailed description of what students will learn",
  "duration": "15 minutes",
  "difficulty": "Beginner",
  "objectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4"],
  "chapters": [
    {"title": "Chapter 1 Title", "duration": "3 min", "content": "What students learn in this chapter"},
    {"title": "Chapter 2 Title", "duration": "4 min", "content": "What students learn in this chapter"},
    {"title": "Chapter 3 Title", "duration": "5 min", "content": "What students learn in this chapter"},
    {"title": "Chapter 4 Title", "duration": "3 min", "content": "What students learn in this chapter"}
  ],
  "exercises": [
    {"name": "Exercise 1", "description": "Detailed exercise instructions", "duration": "5 minutes", "equipment": ["equipment needed"]},
    {"name": "Exercise 2", "description": "Detailed exercise instructions", "duration": "5 minutes", "equipment": ["equipment needed"]},
    {"name": "Exercise 3", "description": "Detailed exercise instructions", "duration": "5 minutes", "equipment": ["equipment needed"]}
  ]
}

Make sure all content is specifically relevant to ${selectedSport} and the topic "${prompt}". Use proper ${selectedSport} terminology and techniques.`

    const response = await fetch('/api/ai-coaching', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: aiPrompt }),
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'API call failed')
    }

    console.log('✅ AI Response received:', data.response.substring(0, 200) + '...')
    
    // Try to extract JSON from the response
    let suggestion
    try {
      // Look for JSON in the response
      const jsonMatch = data.response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.warn('❌ Failed to parse AI JSON, using fallback structure')
      // Fallback structure if JSON parsing fails
      suggestion = {
        title: `${selectedSport} - ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}`,
        description: data.response.substring(0, 200) + '...',
        duration: '15 minutes',
        difficulty: 'Beginner',
        objectives: ['Learn fundamental techniques', 'Practice key skills', 'Build confidence', 'Apply in game situations'],
        chapters: [
          { title: 'Introduction', duration: '3 min', content: 'Overview of key concepts' },
          { title: 'Technique Breakdown', duration: '5 min', content: 'Step-by-step instruction' },
          { title: 'Practice Drills', duration: '5 min', content: 'Guided practice exercises' },
          { title: 'Application', duration: '2 min', content: 'How to use in real situations' }
        ],
        exercises: [
          { name: 'Basic Drill', description: data.response.substring(0, 100), duration: '5 minutes', equipment: ['Basic equipment'] }
        ]
      }
    }
    
    console.log('✅ Using AI-generated lesson:', suggestion.title)

    // If shouldSave is true, save the complete lesson to Firebase
    if (shouldSave && authUser) {
      const completeLesson = {
        id: `lesson_${Date.now()}`,
        creatorUid: authUser.uid,
        creatorName: authUser.displayName || 'Creator',
        title: suggestion.title,
        description: suggestion.description,
        sport: selectedSport,
        duration: suggestion.duration,
        difficulty: suggestion.difficulty,
        objectives: suggestion.objectives,
        chapters: suggestion.chapters,
        exercises: suggestion.exercises,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      console.log('🔥 Saving lesson to Firebase:', completeLesson.title)
      await addDoc(collection(db, 'content'), completeLesson)
      setPublishedLessonId(completeLesson.id)
      console.log('✅ Lesson saved successfully!')
    }

    setAISuggestion(`
**Generated Lesson: ${suggestion.title}**

**Description:** ${suggestion.description}

**Duration:** ${suggestion.duration} | **Difficulty:** ${suggestion.difficulty}

**Learning Objectives:**
${suggestion.objectives.map(obj => `• ${obj}`).join('\n')}

**Lesson Chapters:**
${suggestion.chapters.map((chapter, i) => `${i+1}. **${chapter.title}** (${chapter.duration})\n   ${chapter.content}`).join('\n\n')}

**Practice Exercises:**
${suggestion.exercises.map((ex, i) => `${i+1}. **${ex.name}** (${ex.duration})\n   ${ex.description}\n   Equipment: ${ex.equipment.join(', ')}`).join('\n\n')}
    `)
    
  } catch (error) {
    console.error('AI generation error:', error instanceof Error ? error.message : String(error))
    setAISuggestion('')
  } finally {
    setGeneratingContent(false)
  }
}