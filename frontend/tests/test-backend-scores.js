// Quick test for backend scores endpoint
const API_BASE = 'http://localhost:5000/api'

async function testBackendScores() {
  console.log('Testing Backend Scores Endpoint...')
  
  try {
    const response = await fetch(`${API_BASE}/scores/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'test-user-backend',
        game: 'word_recognition',
        score: 65,
        time_taken: 4000,
        mistakes: {
          q1: { expected: 'dog', actual: 'bog', timeTaken: 3500 },
          q2: { expected: 'cat', actual: 'tac', timeTaken: 4200 }
        }
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Backend response received:')
      console.log('   Message:', result.message)
      console.log('   Analysis keys:', Object.keys(result.analysis || {}))
      console.log('   ML Analysis available:', result.analysis?.mlAnalysis?.available)
      console.log('   Neurological tags:', result.analysis?.neurologicalTags?.length || 0)
    } else {
      console.log('❌ Backend request failed:', response.status)
      const errorText = await response.text()
      console.log('   Error:', errorText)
    }
  } catch (error) {
    console.log('❌ Backend test error:', error.message)
  }
}

testBackendScores().catch(console.error)