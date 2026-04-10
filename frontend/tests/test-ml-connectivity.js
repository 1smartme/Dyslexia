// Test ML service connectivity from backend context
import fetch from 'node-fetch';

async function testMLConnectivity() {
  console.log('Testing ML Service Connectivity...')
  
  try {
    console.log('1. Testing health endpoint...')
    const healthResponse = await fetch('http://localhost:5001/health')
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('✅ Health check passed:', healthData.status)
    } else {
      console.log('❌ Health check failed:', healthResponse.status)
      return
    }

    console.log('2. Testing mistake analysis...')
    const analysisResponse = await fetch('http://localhost:5001/analyze/mistake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expected: 'dog',
        actual: 'bog',
        metadata: { timeTakenMs: 3500 }
      })
    })

    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json()
      console.log('✅ Analysis passed:', analysisData.analysis.pattern)
    } else {
      console.log('❌ Analysis failed:', analysisResponse.status)
    }

  } catch (error) {
    console.log('❌ Connectivity error:', error.message)
    console.log('   Error details:', error.code || 'Unknown')
  }
}

testMLConnectivity().catch(console.error)