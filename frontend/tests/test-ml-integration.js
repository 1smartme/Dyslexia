// Comprehensive test for ML-enhanced neurological analysis
const API_BASE = 'http://localhost:5000/api'
const ML_API_BASE = 'http://localhost:5001'

async function testMLIntegration() {
  console.log('🧠 Testing ML-Enhanced Neurological Analysis System...\n')

  // Test 1: Check ML service availability
  console.log('1. Testing ML Service Availability...')
  try {
    const response = await fetch(`${ML_API_BASE}/health`)
    if (response.ok) {
      const data = await response.json()
      console.log('✅ ML Service Status:', data.status)
      console.log('   Models Loaded:', data.models_loaded)
      console.log('   Service:', data.service)
    } else {
      console.log('❌ ML Service not responding properly')
      console.log('   Make sure to start the ML service first:')
      console.log('   cd ml-analyzer && python start_ml_service.py')
      return
    }
  } catch (error) {
    console.log('❌ ML Service not available:', error.message)
    console.log('   Please start the ML service first')
    return
  }

  // Test 2: Test individual mistake analysis
  console.log('\n2. Testing Individual Mistake Analysis...')
  const testMistakes = [
    { expected: 'dog', actual: 'bog', metadata: { timeTakenMs: 3500 } },
    { expected: 'cat', actual: 'tac', metadata: { timeTakenMs: 4200 } },
    { expected: 'bird', actual: 'drib', metadata: { timeTakenMs: 2800 } },
    { expected: 'house', actual: 'hous', metadata: { timeTakenMs: 5200 } },
    { expected: 'book', actual: 'dook', metadata: { timeTakenMs: 3100 } }
  ]

  for (const mistake of testMistakes) {
    try {
      const response = await fetch(`${ML_API_BASE}/analyze/mistake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mistake)
      })

      if (response.ok) {
        const result = await response.json()
        const analysis = result.analysis
        console.log(`✅ ${mistake.expected} → ${mistake.actual}:`)
        console.log(`   Pattern: ${analysis.pattern} (${(analysis.confidence * 100).toFixed(1)}%)`)
        
        // Show top probabilities
        const topProbs = Object.entries(analysis.probabilities)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
        console.log(`   Top patterns: ${topProbs.map(([p, prob]) => `${p}(${(prob * 100).toFixed(1)}%)`).join(', ')}`)
      } else {
        console.log(`❌ Failed to analyze: ${mistake.expected} → ${mistake.actual}`)
      }
    } catch (error) {
      console.log(`❌ Error analyzing mistake: ${error.message}`)
    }
  }

  // Test 3: Test batch analysis
  console.log('\n3. Testing Batch Analysis...')
  try {
    const response = await fetch(`${ML_API_BASE}/analyze/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mistakes: testMistakes })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Batch analysis completed: ${result.total_analyzed} mistakes analyzed`)
      
      // Show pattern distribution
      const patterns = {}
      result.results.forEach(r => {
        const pattern = r.analysis.pattern
        patterns[pattern] = (patterns[pattern] || 0) + 1
      })
      console.log('   Pattern distribution:', patterns)
    } else {
      console.log('❌ Batch analysis failed')
    }
  } catch (error) {
    console.log('❌ Batch analysis error:', error.message)
  }

  // Test 4: Test user profile analysis
  console.log('\n4. Testing User Profile Analysis...')
  const userMistakes = testMistakes.map(m => ({
    expected: m.expected,
    actual: m.actual,
    metadata: m.metadata
  }))

  try {
    const response = await fetch(`${ML_API_BASE}/analyze/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_mistakes: userMistakes,
        user_id: 'test-user-ml'
      })
    })

    if (response.ok) {
      const result = await response.json()
      const profile = result.profile
      console.log('✅ User profile analysis completed:')
      console.log(`   Risk Level: ${profile.risk_level}`)
      console.log(`   Error Rate: ${(profile.error_rate * 100).toFixed(1)}%`)
      console.log(`   Confidence: ${(profile.confidence * 100).toFixed(1)}%`)
      console.log(`   Top Patterns: ${profile.patterns.map(p => `${p.pattern}(${p.frequency})`).join(', ')}`)
      console.log(`   Recommendations: ${profile.recommendations.length} generated`)
    } else {
      console.log('❌ User profile analysis failed')
    }
  } catch (error) {
    console.log('❌ Profile analysis error:', error.message)
  }

  // Test 5: Test game session analysis
  console.log('\n5. Testing Game Session Analysis...')
  const gameSession = {
    game_name: 'word_recognition',
    user_id: 'test-user-ml',
    mistakes: testMistakes,
    performance_metrics: {
      total_questions: 10,
      accuracy: 0.5,
      avg_response_time: 3500
    }
  }

  try {
    const response = await fetch(`${ML_API_BASE}/analyze/game-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameSession)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Game session analysis completed:')
      console.log(`   Session Risk: ${result.session_risk_level}`)
      console.log(`   Total Mistakes: ${result.session_insights.total_mistakes}`)
      console.log(`   ML Analyzed: ${result.session_insights.ml_analyzed_mistakes}`)
      console.log(`   Dominant Patterns: ${result.session_insights.dominant_patterns.map(p => `${p[0]}(${p[1]})`).join(', ')}`)
    } else {
      console.log('❌ Game session analysis failed')
    }
  } catch (error) {
    console.log('❌ Session analysis error:', error.message)
  }

  // Test 6: Test backend integration
  console.log('\n6. Testing Backend Integration...')
  try {
    const response = await fetch(`${API_BASE}/scores/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'test-user-ml-integration',
        game: 'word_recognition',
        score: 60,
        time_taken: 4000,
        mistakes: {
          q1: { expected: 'dog', actual: 'bog', timeTaken: 3500 },
          q2: { expected: 'cat', actual: 'tac', timeTaken: 4200 },
          q3: { expected: 'bird', actual: 'drib', timeTaken: 2800 }
        }
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Backend integration successful:')
      console.log(`   Analysis completed with ${result.analysis.neurologicalTags?.length || 0} neurological tags`)
      console.log(`   ML Enhanced: ${result.analysis.mlAnalysis?.available ? 'Yes' : 'No'}`)
      if (result.analysis.mlAnalysis?.available) {
        console.log(`   ML Confidence: ${(result.analysis.mlAnalysis.confidence * 100).toFixed(1)}%`)
        console.log(`   Enhanced Tags: ${result.analysis.mlAnalysis.enhancedTags}`)
      }
      console.log(`   Risk Level: ${result.analysis.riskLevel}`)
      console.log(`   Indicators: ${result.analysis.dyslexiaIndicators.join(', ')}`)
    } else {
      console.log('❌ Backend integration failed')
    }
  } catch (error) {
    console.log('❌ Backend integration error:', error.message)
  }

  // Test 7: Test model information
  console.log('\n7. Testing Model Information...')
  try {
    const response = await fetch(`${ML_API_BASE}/model/info`)
    if (response.ok) {
      const result = await response.json()
      const info = result.model_info
      console.log('✅ Model information retrieved:')
      console.log(`   Models: ${info.models_loaded?.join(', ') || 'None'}`)
      console.log(`   Scalers: ${info.scalers_loaded?.join(', ') || 'None'}`)
      console.log(`   Phonetic Dict: ${info.phonetic_dict_loaded ? 'Loaded' : 'Not loaded'}`)
      if (info.top_features) {
        console.log(`   Top Features: ${info.top_features.slice(0, 3).map(f => f.feature).join(', ')}`)
      }
    } else {
      console.log('❌ Failed to get model information')
    }
  } catch (error) {
    console.log('❌ Model info error:', error.message)
  }

  console.log('\n🎉 ML Integration Test Completed!')
  console.log('\n📋 Summary:')
  console.log('   - ML service provides advanced pattern recognition')
  console.log('   - Confidence scoring for each prediction')
  console.log('   - Comprehensive user profiling')
  console.log('   - Seamless backend integration')
  console.log('   - Fallback to rule-based analysis when ML unavailable')
}

// Run the test
testMLIntegration().catch(console.error)