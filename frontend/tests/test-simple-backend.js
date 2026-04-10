// Simple backend test without ML
const API_BASE = 'http://localhost:5000/api'

async function testSimpleBackend() {
  console.log('Testing Simple Backend...')
  
  try {
    // Test health endpoint first
    const healthResponse = await fetch(`${API_BASE.replace('/api', '')}/health`)
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ Backend health:', healthData.status)
    } else {
      console.log('❌ Backend health check failed')
      return
    }

    // Test a simple scores GET request
    const scoresResponse = await fetch(`${API_BASE}/scores?limit=1`)
    if (scoresResponse.ok) {
      const scoresData = await scoresResponse.json()
      console.log('✅ Scores GET works, got', scoresData.length, 'records')
    } else {
      console.log('❌ Scores GET failed:', scoresResponse.status)
      const errorText = await scoresResponse.text()
      console.log('   Error:', errorText)
    }

  } catch (error) {
    console.log('❌ Simple backend test error:', error.message)
  }
}

testSimpleBackend().catch(console.error)