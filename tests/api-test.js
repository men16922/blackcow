/**
 * API 테스트 스크립트
 * 로컬 서버에서 실행: node tests/api-test.js
 */

const API_BASE_URL = 'http://localhost:3000';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function makeRequest(method, path, body = null) {
  const url = `${API_BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 'ERROR', error: error.message };
  }
}

async function testHealthCheck() {
  logSection('1. Health Check Test');
  log('Testing GET /health', 'yellow');

  const result = await makeRequest('GET', '/health');

  if (result.status === 200) {
    log('✅ Health check passed', 'green');
    console.log('Response:', result.data);
  } else {
    log('❌ Health check failed', 'red');
    console.log('Error:', result);
  }

  return result.status === 200;
}

async function testProductAnalysis() {
  logSection('2. Product Analysis Test');
  log('Testing POST /api/analyze/product', 'yellow');

  const testProduct = '갤럭시 버즈2 프로';
  log(`Product: ${testProduct}`, 'blue');

  const result = await makeRequest('POST', '/api/analyze/product', {
    productName: testProduct,
  });

  if (result.status === 200) {
    log('✅ Product analysis passed', 'green');
    console.log('Session ID:', result.data.sessionId);
    console.log('Product Name:', result.data.productName);
    console.log('Processing Time:', result.data.processingTime, 'ms');
    console.log('Summary:', JSON.stringify(result.data.summary, null, 2));
    return result.data.sessionId;
  } else {
    log('❌ Product analysis failed', 'red');
    console.log('Error:', result);
    return null;
  }
}

async function testPriceComparison(sessionId) {
  logSection('3. Price Comparison Test');
  log('Testing POST /api/analyze/price', 'yellow');

  const testProduct = '갤럭시 버즈2 프로';
  log(`Product: ${testProduct}`, 'blue');

  const result = await makeRequest('POST', '/api/analyze/price', {
    productName: testProduct,
    sessionId,
  });

  if (result.status === 200) {
    log('✅ Price comparison passed', 'green');
    console.log('Price Comparison:', JSON.stringify(result.data.priceComparison, null, 2));
  } else {
    log('❌ Price comparison failed', 'red');
    console.log('Error:', result);
  }

  return result.status === 200;
}

async function testReviewAnalysis(sessionId) {
  logSection('4. Review Analysis Test');
  log('Testing POST /api/analyze/reviews', 'yellow');

  const testProduct = '갤럭시 버즈2 프로';
  log(`Product: ${testProduct}`, 'blue');

  const result = await makeRequest('POST', '/api/analyze/reviews', {
    productName: testProduct,
    sessionId,
  });

  if (result.status === 200) {
    log('✅ Review analysis passed', 'green');
    console.log('Review Digest:', JSON.stringify(result.data.reviewDigest, null, 2));
  } else {
    log('❌ Review analysis failed', 'red');
    console.log('Error:', result);
  }

  return result.status === 200;
}

async function testComprehensiveScore() {
  logSection('5. Comprehensive Score Test');
  log('Testing POST /api/analyze/score', 'yellow');

  const testProduct = '갤럭시 버즈2 프로';
  log(`Product: ${testProduct}`, 'blue');

  const result = await makeRequest('POST', '/api/analyze/score', {
    productName: testProduct,
    useCache: false, // 캐시 사용 안 함 (첫 테스트)
  });

  if (result.status === 200) {
    log('✅ Comprehensive score passed', 'green');
    console.log('Session ID:', result.data.sessionId);
    console.log('Risk Score:', result.data.riskScore.score);
    console.log('Risk Level:', result.data.riskScore.level);
    console.log('Recommendation:', result.data.riskScore.recommendation);
    console.log('Processing Time:', result.data.processingTime, 'ms');
    console.log('From Cache:', result.data.fromCache);
    return result.data.sessionId;
  } else {
    log('❌ Comprehensive score failed', 'red');
    console.log('Error:', result);
    return null;
  }
}

async function testCachedScore() {
  logSection('6. Cached Score Test');
  log('Testing POST /api/analyze/score (with cache)', 'yellow');

  const testProduct = '갤럭시 버즈2 프로';
  log(`Product: ${testProduct}`, 'blue');

  const result = await makeRequest('POST', '/api/analyze/score', {
    productName: testProduct,
    useCache: true, // 캐시 사용
  });

  if (result.status === 200) {
    if (result.data.fromCache) {
      log('✅ Cache hit! Score retrieved from cache', 'green');
    } else {
      log('⚠️  Cache miss. New analysis performed', 'yellow');
    }
    console.log('Processing Time:', result.data.processingTime, 'ms');
    console.log('From Cache:', result.data.fromCache);
  } else {
    log('❌ Cached score test failed', 'red');
    console.log('Error:', result);
  }

  return result.status === 200;
}

async function testSessionRetrieval(sessionId) {
  logSection('7. Session Retrieval Test');
  log(`Testing GET /api/analyze/session/${sessionId}`, 'yellow');

  const result = await makeRequest('GET', `/api/analyze/session/${sessionId}`);

  if (result.status === 200) {
    log('✅ Session retrieval passed', 'green');
    console.log('Session:', JSON.stringify(result.data.session, null, 2));
    console.log('History Count:', result.data.history?.length || 0);
  } else {
    log('❌ Session retrieval failed', 'red');
    console.log('Error:', result);
  }

  return result.status === 200;
}

async function runTests() {
  log('\n🚀 Starting API Tests...', 'cyan');
  log(`API Base URL: ${API_BASE_URL}`, 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // 1. Health Check
  results.total++;
  if (await testHealthCheck()) results.passed++;
  else results.failed++;

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Product Analysis
  results.total++;
  const sessionId1 = await testProductAnalysis();
  if (sessionId1) results.passed++;
  else results.failed++;

  if (!sessionId1) {
    log('\n⚠️  Skipping remaining tests due to product analysis failure', 'yellow');
  } else {
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Price Comparison
    results.total++;
    if (await testPriceComparison(sessionId1)) results.passed++;
    else results.failed++;

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Review Analysis
    results.total++;
    if (await testReviewAnalysis(sessionId1)) results.passed++;
    else results.failed++;

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Comprehensive Score
    results.total++;
    const sessionId2 = await testComprehensiveScore();
    if (sessionId2) results.passed++;
    else results.failed++;

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 6. Cached Score
    results.total++;
    if (await testCachedScore()) results.passed++;
    else results.failed++;

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 7. Session Retrieval
    if (sessionId2) {
      results.total++;
      if (await testSessionRetrieval(sessionId2)) results.passed++;
      else results.failed++;
    }
  }

  // 결과 요약
  logSection('Test Summary');
  console.log(`Total Tests: ${results.total}`);
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  log(`Success Rate: ${successRate}%`, successRate === '100.00' ? 'green' : 'yellow');

  console.log('\n' + '='.repeat(60) + '\n');
}

// 실행
runTests().catch(error => {
  log('Fatal error occurred:', 'red');
  console.error(error);
  process.exit(1);
});
