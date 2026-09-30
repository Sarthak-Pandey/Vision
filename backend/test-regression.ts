process.env.ALLOW_DEMO_MODE = 'true';
process.env.USE_TEST_STORE = 'true';
import app from './src/app.js';
import { Server } from 'http';
import { AddressInfo } from 'net';

async function runRegressionTests() {
  process.env.NODE_ENV = 'test';
  console.log('====================================================');
  console.log('RUNNING REGRESSION TEST SUITE (PHASES 1 - 4)');
  console.log('====================================================');

  const server: Server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string) {
    if (cond) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await fetch(`${baseUrl}/health`).then((r) => r.json());
    assert(health.success === true, 'Phase 0: Health check endpoint responds');

    // 2. Phase 3: Project CRUD
    const projectsRes = await fetch(`${baseUrl}/projects`, {
      headers: { 'x-demo-user': 'user-demo-123' },
    }).then((r) => r.json());
    assert(projectsRes.success === true && projectsRes.data.length >= 1, 'Phase 3: Projects retrieval');

    // 3. Phase 1: Assets retrieval
    const assetsRes = await fetch(`${baseUrl}/assets?projectId=proj-1`, {
      headers: { 'x-demo-user': 'user-demo-123' },
    }).then((r) => r.json());
    assert(assetsRes.success === true && assetsRes.data.length >= 2, 'Phase 1: Assets retrieval');

    // 4. Phase 2: AI Vision Analysis
    const analysisRes = await fetch(`${baseUrl}/assets/asset-1/analysis`, {
      headers: { 'x-demo-user': 'user-demo-123' },
    }).then((r) => r.json());
    assert(analysisRes.success === true, 'Phase 2: AI analysis retrieval');

    // 5. Phase 4: Semantic Vector Search
    const searchRes = await fetch(`${baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        projectId: 'proj-1',
        query: 'river vegetation',
      }),
    }).then((r) => r.json());
    assert(searchRes.success === true && Array.isArray(searchRes.data.results), 'Phase 4: Semantic vector search');
  } catch (err: any) {
    console.error('Regression error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('====================================================');
  console.log(`REGRESSION RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runRegressionTests();
