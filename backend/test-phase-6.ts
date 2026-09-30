process.env.ALLOW_DEMO_MODE = 'true';
process.env.USE_TEST_STORE = 'true';
import app from './src/app.js';
import { Server } from 'http';
import { AddressInfo } from 'net';

async function runTests() {
  process.env.NODE_ENV = 'test';
  console.log('====================================================');
  console.log('RUNNING PHASE 6 EVIDENCE & TRACEABILITY TEST SUITE');
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
    const resNoAuth = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(resNoAuth.status === 401, 'No authentication rejected with 401');

    // ----------------------------------------------------
    // Test 2: Valid auth -> Own project claims allowed
    // ----------------------------------------------------
    const resGetClaims = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    const claimsData = await resGetClaims.json();
    assert(
      resGetClaims.status === 200 &&
        claimsData.success === true &&
        Array.isArray(claimsData.data.claims) &&
        claimsData.data.telemetry !== undefined,
      'User A can access claims and telemetry for own project (proj-1)'
    );

    // ----------------------------------------------------
    // Test 3: User A accesses User B project -> Denied (404/403)
    // ----------------------------------------------------
    // proj-3 is owned by user-demo-456 in mock store
    const resForbiddenProject = await fetch(`${baseUrl}/projects/proj-3/claims`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    assert(
      resForbiddenProject.status === 404 || resForbiddenProject.status === 403,
      "User A denied accessing User B's project claims (proj-3)"
    );

    // ----------------------------------------------------
    // Test 4: Cross-project asset evidence -> Rejected with 400
    // ----------------------------------------------------
    // asset-3 belongs to proj-2; trying to link as evidence in proj-1
    const resCrossProjectAsset = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        claim: 'Mangrove expansion observed along river bend',
        confidence: 0.88,
        sourceType: 'asset_analysis',
        evidenceAssetIds: ['asset-3'], // cross-project!
      }),
    });
    const crossProjData = await resCrossProjectAsset.json();
    assert(
      resCrossProjectAsset.status === 400 && !crossProjData.success,
      'Cross-project evidence asset rejected with 400'
    );

    // ----------------------------------------------------
    // Test 5: Invalid confidence (> 1 or < 0) -> Rejected
    // ----------------------------------------------------
    const resInvalidConfidence = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        claim: 'Valid claim statement',
        confidence: 95, // Invalid! Must be 0 <= c <= 1
        sourceType: 'asset_analysis',
        evidenceAssetIds: ['asset-1'],
      }),
    });
    assert(
      resInvalidConfidence.status === 400,
      'Invalid confidence (95 > 1) rejected with 400 validation error'
    );

    // ----------------------------------------------------
    // Test 6: Empty or whitespace claim -> Rejected
    // ----------------------------------------------------
    const resEmptyClaim = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        claim: '   ',
        confidence: 0.85,
        sourceType: 'asset_analysis',
        evidenceAssetIds: ['asset-1'],
      }),
    });
    assert(
      resEmptyClaim.status === 400,
      'Empty/whitespace claim rejected with 400 validation error'
    );

    // ----------------------------------------------------
    // Test 7: No evidence assets (< 1) -> Rejected
    // ----------------------------------------------------
    const resNoEvidence = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        claim: 'Unproven claim without any media assets',
        confidence: 0.85,
        sourceType: 'asset_analysis',
        evidenceAssetIds: [],
      }),
    });
    assert(
      resNoEvidence.status === 400,
      'Claim without evidence assets rejected with 400'
    );

    // ----------------------------------------------------
    // Test 8: Valid Phase 2 Single-Asset Evidence Claim Creation
    // ----------------------------------------------------
    const resCreateClaim = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        claim: 'Active tree sapling planting observed in cleared riparian buffer zone',
        confidence: 0.91,
        sourceType: 'asset_analysis',
        evidenceAssetIds: ['asset-1'],
      }),
    });
    const createdData = await resCreateClaim.json();
    assert(
      resCreateClaim.status === 201 &&
        createdData.success === true &&
        createdData.data.evidence.length === 1 &&
        createdData.data.evidence[0].assetId === 'asset-1',
      'Phase 2 observation claim created with 1 linked evidence asset'
    );

    // ----------------------------------------------------
    // Test 9: Valid Phase 5 Comparison Evidence Claim Creation (2 Assets)
    // ----------------------------------------------------
    const resCreateCompClaim = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        claim: 'Dense vegetation regrowth visible over formerly bare soil embankment',
        confidence: 0.87,
        sourceType: 'comparison',
        sourceId: 'comp-seed-1',
        evidenceAssetIds: ['asset-1', 'asset-2'],
      }),
    });
    const createdCompData = await resCreateCompClaim.json();
    assert(
      resCreateCompClaim.status === 201 &&
        createdCompData.data.evidence.length === 2 &&
        createdCompData.data.evidence[0].role === 'before' &&
        createdCompData.data.evidence[1].role === 'after',
      'Phase 5 comparison claim created with 2 evidence assets (before & after roles)'
    );

    // ----------------------------------------------------
    // Test 10: Duplicate processing / Idempotency
    // ----------------------------------------------------
    // Sending same claim with different casing and extra spaces
    const resDuplicateClaim = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        claim: '  ACTIVE TREE SAPLING PLANTING OBSERVED IN CLEARED RIPARIAN BUFFER ZONE  ',
        confidence: 0.93,
        sourceType: 'asset_analysis',
        evidenceAssetIds: ['asset-1'],
      }),
    });
    const dupData = await resDuplicateClaim.json();
    assert(
      resDuplicateClaim.status === 201 &&
        dupData.data.id === createdData.data.id,
      'Duplicate claim normalized and updated idempotently without duplicate record creation'
    );

    // ----------------------------------------------------
    // Test 11: Claim IDOR Protection across projects
    // ----------------------------------------------------
    // Requesting a valid claim ID through wrong project URL
    const claimId = createdData.data.id;
    const resIdor = await fetch(`${baseUrl}/projects/proj-2/claims/${claimId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    assert(
      resIdor.status === 404 || resIdor.status === 403,
      'Claim IDOR access across mismatching project rejected (404/403)'
    );

    // ----------------------------------------------------
    // Test 12: Sync Claims endpoint extracts claims from existing project media
    // ----------------------------------------------------
    const resSync = await fetch(`${baseUrl}/projects/proj-1/claims/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    const syncData = await resSync.json();
    assert(
      resSync.status === 200 &&
        syncData.success === true &&
        typeof syncData.data.syncedClaims === 'number',
      'Sync claims endpoint successfully extracts claims from existing project analyses & comparisons'
    );

    // ----------------------------------------------------
    // Test 13: Client-supplied created_by is ignored/overridden by server identity
    // ----------------------------------------------------
    const resSpoof = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        claim: 'Vegetation canopy cover increased visibly',
        confidence: 0.88,
        sourceType: 'asset_analysis',
        evidenceAssetIds: ['asset-1'],
        createdBy: 'hacker-fake-id-999',
      }),
    });
    const spoofData = await resSpoof.json();
    assert(
      resSpoof.status === 201 &&
        spoofData.data.createdBy === 'user-demo-123',
      'Client-supplied createdBy is overridden by server authenticated identity'
    );
  } catch (error: any) {
    console.error('Test execution error:', error);
    failedCount++;
  } finally {
    server.close();
  }

  console.log('====================================================');
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
