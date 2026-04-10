// Test script for neurological tagging and adaptive engine
const API_BASE = 'http://localhost:5000/api'

async function testNeurologicalSystem() {
  console.log('🧠 Testing Neurological Tagging and Adaptive Engine System...\n')

  // Test 1: Basic server health
  try {
    const response = await fetch(`${API_BASE.replace('/api', '')}/health`)
    const health = await response.json()
    console.log('✅ Server Health:', health.status)
  } catch (error) {
    console.log('❌ Server not running. Please start the backend first.')
    return
  }

  // Test 2: Test neurological tagging
  console.log('\n📝 Testing Neurological Tagging...')
  try {
    const mistakeResponse = await fetch(`${API_BASE}/mistakes/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: 'test-123',
        question_no: 1,
        expected_answer: 'dog',
        user_answer: 'bog',
        raw_data: { timeTakenMs: 3500 }
      })
    })
    
    if (mistakeResponse.ok) {
      const result = await mistakeResponse.json()
      console.log('✅ Mistake logged with tags:', result.tags.map(t => `${t.tag} (${(t.confidence * 100).toFixed(0)}%)`))
    } else {
      console.log('❌ Failed to log mistake')
    }
  } catch (error) {
    console.log('❌ Mistake logging error:', error.message)
  }

  // Test 3: Test score analysis
  console.log('\n📊 Testing Score Analysis...')
  try {
    const scoreResponse = await fetch(`${API_BASE}/scores/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'test-user-123',
        game: 'word_recognition',
        score: 65,
        time_taken: 4500,
        mistakes: {
          q1: { expected: 'cat', actual: 'bat', timeTaken: 2000 },
          q2: { expected: 'dog', actual: 'bog', timeTaken: 3000 }
        }
      })
    })
    
    if (scoreResponse.ok) {
      const result = await scoreResponse.json()
      console.log('✅ Score analyzed successfully')
      console.log('   - Difficulty Level:', result.analysis.difficulty)
      console.log('   - Risk Level:', result.analysis.riskLevel)
      console.log('   - Indicators:', result.analysis.dyslexiaIndicators)
      console.log('   - Neurological Tags:', result.analysis.neurologicalTags?.length || 0, 'tags found')
    } else {
      console.log('❌ Failed to analyze score')
    }
  } catch (error) {
    console.log('❌ Score analysis error:', error.message)
  }

  // Test 4: Test adaptive difficulty
  console.log('\n🎯 Testing Adaptive Difficulty...')
  try {
    const adaptiveResponse = await fetch(`${API_BASE}/adaptive/difficulty/word_recognition?user_id=test-user-123`)
    
    if (adaptiveResponse.ok) {
      const result = await adaptiveResponse.json()
      console.log('✅ Adaptive difficulty calculated:', result.difficulty, '-', result.reason)
    } else {
      console.log('❌ Failed to get adaptive difficulty')
    }
  } catch (error) {
    console.log('❌ Adaptive difficulty error:', error.message)
  }

  // Test 5: Test neurological assessment
  console.log('\n🧬 Testing Neurological Assessment...')
  try {
    const assessmentResponse = await fetch(`${API_BASE}/assessment/test-user-123`)
    
    if (assessmentResponse.ok) {
      const result = await assessmentResponse.json()
      console.log('✅ Assessment generated successfully')
      console.log('   - Overall Risk:', result.assessment.overallRisk)
      console.log('   - Needs Professional Assessment:', result.assessment.needsProfessionalAssessment)
      console.log('   - Top Indicators:', result.indicators.slice(0, 3).map(i => i.name))
    } else {
      console.log('❌ Failed to generate assessment')
    }
  } catch (error) {
    console.log('❌ Assessment error:', error.message)
  }

  console.log('\n🎉 Neurological system test completed!')
}

// Run the test
testNeurologicalSystem().catch(console.error)