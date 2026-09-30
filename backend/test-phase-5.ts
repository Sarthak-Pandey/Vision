import app from './src/app.js';
import { Server } from 'http';
import { AddressInfo } from 'net';

async function runTests() {
  process.env.NODE_ENV = 'test';
  console.log('====================================================');
  console.log('RUNNING PHASE 5 BEFORE/AFTER INTELLIGENCE TEST SUITE');
  console.log('====================================================');

  const server: Server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failedCount++;
    }
  }

  try {
    // ----------------------------------------------------
    // Test 1: No authentication -> 401 Unauthorized
    // ----------------------------------------------------
    const resNoAuth = await fetch(`${baseUrl}/projects/proj-1/comparisons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beforeAssetId: 'asset-1', afterAssetId: 'asset-2' }),
    });
    assert(resNoAuth.status === 401, 'No authentication rejected with 401');

    // ----------------------------------------------------
    // Test 2: User A accesses own project -> Allowed
    // ----------------------------------------------------
    const resGetComparisons = await fetch(`${baseUrl}/projects/proj-1/comparisons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    const comparisonsData = await resGetComparisons.json();
    assert(
      resGetComparisons.status === 200 && comparisonsData.success === true,
      'User A can access comparisons for own project (proj-1)'
    );

    // ----------------------------------------------------
    // Test 3: User A accesses User B project -> Denied (404/403)
    // ----------------------------------------------------
    // proj-3 is owned by user-demo-456 in mock store
    const resForbiddenProject = await fetch(`${baseUrl}/projects/proj-3/comparisons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    assert(
      resForbiddenProject.status === 404 || resForbiddenProject.status === 403,
      "User A denied accessing User B's project (proj-3)"
    );

    // ----------------------------------------------------
    // Test 4: Cross-project assets -> Denied
    // ----------------------------------------------------
    // asset-3 belongs to proj-2, attempting to compare in proj-1
    const resCrossProject = await fetch(`${baseUrl}/projects/proj-1/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({ beforeAssetId: 'asset-1', afterAssetId: 'asset-3' }),
    });
    const crossProjData = await resCrossProject.json();
    assert(
      resCrossProject.status === 400 && !crossProjData.success,
      'Cross-project asset rejected with 400'
    );

    // ----------------------------------------------------
    // Test 5: Same asset comparison -> Rejected
    // ----------------------------------------------------
    const resSameAsset = await fetch(`${baseUrl}/projects/proj-1/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({ beforeAssetId: 'asset-1', afterAssetId: 'asset-1' }),
    });
    assert(resSameAsset.status === 400, 'Same asset comparison rejected with 400');

    // ----------------------------------------------------
    // Test 6: Duplicate comparison prevention -> Reused without duplicate
    // ----------------------------------------------------
    // comp-seed-1 is between asset-1 and asset-2 on proj-1
    const resDuplicate = await fetch(`${baseUrl}/projects/proj-1/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({ beforeAssetId: 'asset-1', afterAssetId: 'asset-2' }),
    });
    const duplicateData = await resDuplicate.json();
    assert(
      resDuplicate.status === 201 && duplicateData.data.id === 'comp-seed-1',
      'Existing comparison pair reused without duplicate AI invocation'
    );

    // ----------------------------------------------------
    // Test 7: Reverse chronological dates -> Rejected
    // ----------------------------------------------------
    // asset-2 is 2025-02-15, asset-1 is 2025-02-10 (before > after)
    const resReversedDates = await fetch(`${baseUrl}/projects/proj-1/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({ beforeAssetId: 'asset-2', afterAssetId: 'asset-1' }),
    });
    const revData = await resReversedDates.json();
    assert(
      resReversedDates.status === 400 &&
        revData.error?.message?.includes('Chronological mismatch'),
      'Reverse chronological dates rejected with clear error message'
    );

    // ----------------------------------------------------
    // Test 8: Client attempts fake ownership -> Ignored
    // ----------------------------------------------------
    const resFakeOwnership = await fetch(`${baseUrl}/projects/proj-1/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        beforeAssetId: 'asset-1',
        afterAssetId: 'asset-2',
        createdBy: 'malicious-attacker',
      }),
    });
    const fakeOwnData = await resFakeOwnership.json();
    assert(
      fakeOwnData.data.created_by === 'user-demo-123',
      'Client-supplied createdBy safely ignored and set to authenticated user'
    );

    // ----------------------------------------------------
    // Test 9: Output validation & traceability
    // ----------------------------------------------------
    const comparison = duplicateData.data;
    assert(
      typeof comparison.comparison_result.summary === 'string' &&
        Array.isArray(comparison.comparison_result.changes) &&
        comparison.confidence >= 0 &&
        comparison.confidence <= 1,
      'Structured comparison result satisfies schema and confidence bounds (0 <= confidence <= 1)'
    );

    assert(
      comparison.before_asset?.id === 'asset-1' &&
        comparison.after_asset?.id === 'asset-2',
      'Comparison result remains traceable to both source assets with hydrated metadata'
    );
  } catch (err: any) {
    console.error('Unexpected test error:', err);
    failedCount++;
  } finally {
    server.close();
  }

  console.log('====================================================');
  console.log(`TEST RESULTS: ${passedCount} passed, ${failedCount} failed`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
