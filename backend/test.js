const http = require('http');

async function runTests() {
  console.log('============================================');
  console.log('🧪 RUNNING SCHOLARSHIP FINDER TEST SUITE');
  console.log('============================================\n');

  process.env.PORT = 3001;
  const server = require('./server');

  await new Promise(r => setTimeout(r, 800));

  async function get(path) {
    const res = await fetch('http://localhost:3001' + path);
    const contentType = res.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await res.json() : await res.text();
    return { status: res.status, body, contentType };
  }

  async function post(path, data) {
    const res = await fetch('http://localhost:3001' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return { status: res.status, body: await res.json() };
  }

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} - Details:`, details);
      failed++;
    }
  }

  try {
    // 1. Health check
    const t1 = await get('/api/health');
    assert('Health Check (total >= 36)', t1.status === 200 && t1.body.totalScholarships === 36, t1.body);

    // 2. Static frontend HTML served by Express
    const t2 = await get('/');
    assert('Frontend index.html served at root', t2.status === 200 && t2.body.includes('Government Scholarship Finder'), t2.status);

    // 3. Favicon handler
    const t3 = await get('/favicon.ico');
    assert('Favicon handler (204 No Content)', t3.status === 204, t3.status);

    // 4. Problem 1 Fix: "Karnataka SSP" search
    const t4 = await get('/api/scholarships?q=Karnataka+SSP');
    assert('\"Karnataka SSP\" search returns all 10 SSP schemes', t4.body.total === 10, t4.body.total);

    // 5. Pre-Matric scholarships
    const t5 = await get('/api/scholarships?q=Pre-Matric');
    assert('Pre-Matric search returns 4 verified schemes', t5.body.total === 4, t5.body.total);

    // 6. Scope filter for Karnataka
    const t6 = await get('/api/scholarships?scope=karnataka');
    assert('Scope \"karnataka\" returns all Karnataka schemes', t6.body.total >= 10, t6.body.total);

    // 7. Central NSP filter
    const t7 = await get('/api/scholarships?q=Central+NSP');
    assert('\"Central NSP\" multi-keyword search matches Central schemes', t7.body.total >= 8, t7.body.total);

    // 8. Eligibility check for Pre-Matric SC
    const t8 = await post('/api/check-eligibility', {
      educationLevel: 'pre-matric',
      annualIncome: 150000,
      category: 'SC',
      domicileState: 'Karnataka',
      gender: 'ANY',
      isDisability: false,
      percentage: 75
    });
    const eligibleIds = (t8.body.results?.eligible || []).map(x => x.scheme.id);
    assert('Eligibility engine confirms Karnataka Pre-Matric SC eligibility', eligibleIds.includes('ssp-ka-pre-sc-23'), eligibleIds);

    console.log('\n============================================');
    console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('============================================\n');

  } finally {
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
