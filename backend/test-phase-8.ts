process.env.USE_TEST_STORE = 'true';
import app from './src/app.js';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { ConfidenceService, CONFIDENCE_WEIGHTS, CONFIDENCE_DISCLAIMER } from './src/services/confidence.service.js';
import { ValidationError } from './src/utils/errors.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function runPhase8TestSuite() {
  process.env.NODE_ENV = 'test';
  console.log('====================================================');
  console.log('RUNNING PHASE 8 EVIDENCE CONFIDENCE SYSTEM TEST SUITE');
  console.log('====================================================');

  const confidenceService = new ConfidenceService();

  // --------------------------------------------------------------------------
  // PART 39: UNIT TESTS
  // --------------------------------------------------------------------------

  // Test 1: All scores = 1.0 -> 100%, HIGH
  const t1 = confidenceService.calculate({
    visionConfidence: 1.0,
    metadataConsistency: 1.0,
    imageQuality: 1.0,
    crossAssetAgreement: 1.0,
    temporalConsistency: 1.0,
  });
  assert(
    t1.score === 1.0 && t1.percentage === 100 && t1.level === 'HIGH',
    'Test 1: All signals 1.0 yields 1.0 (100%), HIGH'
  );

  // Test 2: All scores = 0.0 -> 0%, LOW
  const t2 = confidenceService.calculate({
    visionConfidence: 0.0,
    metadataConsistency: 0.0,
    imageQuality: 0.0,
    crossAssetAgreement: 0.0,
    temporalConsistency: 0.0,
  });
  assert(
    t2.score === 0.0 && t2.percentage === 0 && t2.level === 'LOW',
    'Test 2: All signals 0.0 yields 0.0 (0%), LOW'
  );

  // Test 3: Example calculation from Part 17 (0.90, 0.95, 0.90, 0.85, 1.00 -> 0.9125, 91%, HIGH)
  const t3 = confidenceService.calculate({
    visionConfidence: 0.90,
    metadataConsistency: 0.95,
    imageQuality: 0.90,
    crossAssetAgreement: 0.85,
    temporalConsistency: 1.00,
  });
  const expectedT3 =
    0.90 * 0.40 + 0.95 * 0.20 + 0.90 * 0.15 + 0.85 * 0.15 + 1.00 * 0.10; // 0.9125
  assert(
    Math.abs((t3.score || 0) - expectedT3) < 0.0001 &&
      t3.percentage === 91 &&
      t3.level === 'HIGH',
    'Test 3: Part 17 test case reproduces 0.9125 (91%), HIGH'
  );

  // Test 4: Boundary: 0.399 -> LOW
  assert(
    confidenceService.classify(0.399) === 'LOW',
    'Test 4: Boundary score 0.399 classifies as LOW'
  );

  // Test 5: Boundary: 0.40 -> MEDIUM
  assert(
    confidenceService.classify(0.40) === 'MEDIUM',
    'Test 5: Boundary score 0.40 classifies as MEDIUM'
  );

  // Test 6: Boundary: 0.699 -> MEDIUM
  assert(
    confidenceService.classify(0.699) === 'MEDIUM',
    'Test 6: Boundary score 0.699 classifies as MEDIUM'
  );

  // Test 7: Boundary: 0.70 -> HIGH
  assert(
    confidenceService.classify(0.70) === 'HIGH',
    'Test 7: Boundary score 0.70 classifies as HIGH'
  );

  // Test 8: Missing metadata -> remaining weights normalized (0.80)
  const t8 = confidenceService.calculate({
    visionConfidence: 0.90,
    metadataConsistency: null,
    imageQuality: 0.90,
    crossAssetAgreement: 0.85,
    temporalConsistency: 1.00,
  });
  const expectedT8 = (0.36 + 0.135 + 0.1275 + 0.10) / 0.80; // 0.903125
  assert(
    t8.breakdown.metadataConsistency.available === false &&
      t8.breakdown.metadataConsistency.score === null &&
      t8.evaluatedWeightsSum === 0.80 &&
      Math.abs((t8.score || 0) - expectedT8) < 0.0001 &&
      t8.percentage === 90 &&
      t8.level === 'HIGH',
    'Test 8: Missing metadata normalizes over remaining weights (0.80) to 90%, HIGH'
  );

  // Test 9: Missing cross-asset agreement -> remaining weights normalized (0.85)
  const t9 = confidenceService.calculate({
    visionConfidence: 0.90,
    metadataConsistency: 0.95,
    imageQuality: 0.90,
    crossAssetAgreement: null,
    temporalConsistency: 1.00,
  });
  const expectedT9 = (0.36 + 0.19 + 0.135 + 0.10) / 0.85; // 0.923529...
  assert(
    t9.breakdown.crossAssetAgreement.available === false &&
      t9.evaluatedWeightsSum === 0.85 &&
      Math.abs((t9.score || 0) - expectedT9) < 0.0001 &&
      t9.percentage === 92 &&
      t9.level === 'HIGH',
    'Test 9: Missing cross-asset agreement normalizes over remaining weights (0.85) to 92%, HIGH'
  );

  // Test 10: All signals missing -> confidence = unavailable, score: null, not 0
  const t10 = confidenceService.calculate({
    visionConfidence: null,
    metadataConsistency: null,
    imageQuality: null,
    crossAssetAgreement: null,
    temporalConsistency: null,
  });
  assert(
    t10.available === false &&
      t10.score === null &&
      t10.percentage === null &&
      t10.level === 'UNAVAILABLE' &&
      t10.evaluatedWeightsSum === 0,
    'Test 10: All signals missing returns UNAVAILABLE (score = null, not 0)'
  );

  // Test 11: Invalid signal: -0.1 -> Expected validation failure
  try {
    confidenceService.calculate({ visionConfidence: -0.1 });
    assert(false, 'Test 11: Negative signal should throw ValidationError');
  } catch (err) {
    assert(
      err instanceof ValidationError,
      'Test 11: Negative signal (-0.1) rejected with ValidationError'
    );
  }

  // Test 12: Invalid signal: 1.2 -> Expected validation failure
  try {
    confidenceService.calculate({ visionConfidence: 1.2 });
    assert(false, 'Test 12: Value > 1 should throw ValidationError');
  } catch (err) {
    assert(
      err instanceof ValidationError,
      'Test 12: Over-boundary signal (1.2) rejected with ValidationError'
    );
  }

  // Test 13: NaN -> Expected validation failure
  try {
    confidenceService.calculate({ visionConfidence: NaN });
    assert(false, 'Test 13: NaN signal should throw ValidationError');
  } catch (err) {
    assert(
      err instanceof ValidationError,
      'Test 13: NaN signal rejected with ValidationError'
    );
  }

  // Test 14: Duplicate recalculation -> deterministic identical result
  const runA = confidenceService.calculate({
    visionConfidence: 0.88,
    metadataConsistency: 0.92,
    imageQuality: 0.85,
    crossAssetAgreement: 0.80,
    temporalConsistency: 0.95,
  });
  const runB = confidenceService.calculate({
    visionConfidence: 0.88,
    metadataConsistency: 0.92,
    imageQuality: 0.85,
    crossAssetAgreement: 0.80,
    temporalConsistency: 0.95,
  });
  assert(
    runA.score === runB.score &&
      runA.percentage === runB.percentage &&
      runA.level === runB.level &&
      runA.evaluatedWeightsSum === runB.evaluatedWeightsSum,
    'Test 14: Recalculation yields deterministic identical result'
  );

  // --------------------------------------------------------------------------
  // HTTP REST API & INTEGRATION TESTS
  // --------------------------------------------------------------------------
  const server: Server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // Test 15: No auth rejected with 401
    const resNoAuth = await fetch(`${baseUrl}/projects/proj-1/confidence`, {
      method: 'GET',
    });
    assert(resNoAuth.status === 401, 'Test 15: No authentication rejected with 401');

    // Test 16: IDOR Protection: User demo-123 cannot access User demo-456's project (proj-3)
    const resIdor = await fetch(`${baseUrl}/projects/proj-3/confidence`, {
      method: 'GET',
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    assert(
      resIdor.status === 404 || resIdor.status === 403,
      'Test 16: Cross-tenant project access denied (404/403)'
    );

    // Test 17: Valid project confidence report retrieved
    const resConfidence = await fetch(`${baseUrl}/projects/proj-1/confidence`, {
      method: 'GET',
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    const confData = await resConfidence.json();
    assert(
      resConfidence.status === 200 &&
        confData.success === true &&
        confData.data.projectId === 'proj-1' &&
        typeof confData.data.averageCompositePercentage === 'number' &&
        ['LOW', 'MEDIUM', 'HIGH'].includes(confData.data.level) &&
        confData.data.disclaimer === CONFIDENCE_DISCLAIMER,
      'Test 17: User retrieves project confidence report with telemetry and disclaimer'
    );

    // Test 18: Phase 6 Claims endpoint includes compositeConfidence on every claim
    const resClaims = await fetch(`${baseUrl}/projects/proj-1/claims`, {
      method: 'GET',
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    const claimsData = await resClaims.json();
    const firstClaim = claimsData.data.claims[0];
    assert(
      resClaims.status === 200 &&
        firstClaim !== undefined &&
        firstClaim.compositeConfidence !== undefined &&
        firstClaim.compositeConfidence.available === true &&
        firstClaim.compositeConfidence.breakdown.visionConfidence.available === true &&
        firstClaim.compositeConfidence.breakdown.visionConfidence.weight === 0.40 &&
        typeof claimsData.data.telemetry.averageCompositeConfidence === 'number',
      'Test 18: Claims endpoint returns hydrated compositeConfidence with 5 signals on each claim'
    );

    // Test 19: Phase 5 Comparisons endpoint includes compositeConfidence
    const resComparisons = await fetch(`${baseUrl}/projects/proj-1/comparisons`, {
      method: 'GET',
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    const compData = await resComparisons.json();
    const firstComp = compData.data[0];
    assert(
      resComparisons.status === 200 &&
        firstComp !== undefined &&
        firstComp.compositeConfidence !== undefined &&
        firstComp.compositeConfidence.available === true &&
        firstComp.compositeConfidence.breakdown.temporalConsistency.available === true &&
        firstComp.compositeConfidence.breakdown.temporalConsistency.weight === 0.10,
      'Test 19: Comparisons endpoint returns hydrated compositeConfidence with temporal consistency'
    );

    // Test 20: Phase 7 Evidence Gap report coverage does not contaminate Phase 8 confidence
    const resGap = await fetch(`${baseUrl}/projects/proj-1/evidence-gaps`, {
      method: 'GET',
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    const gapData = await resGap.json();
    assert(
      resGap.status === 200 &&
        typeof gapData.data.coverage?.percentage === 'number' &&
        // Coverage percentage measures taxonomy gap, confidence measures signal strength
        gapData.data.coverage.percentage !== confData.data.averageCompositePercentage,
      'Test 20: Phase 7 Evidence Gap taxonomy coverage remains distinct from Phase 8 signal confidence'
    );

    // Test 21: Pure calculation endpoint POST /api/projects/:projectId/confidence/calculate
    const resCalc = await fetch(`${baseUrl}/projects/proj-1/confidence/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        signals: {
          visionConfidence: 0.90,
          metadataConsistency: 0.95,
          imageQuality: 0.90,
          crossAssetAgreement: 0.85,
          temporalConsistency: 1.00,
        },
      }),
    });
    const calcData = await resCalc.json();
    assert(
      resCalc.status === 200 &&
        calcData.success === true &&
        calcData.data.percentage === 91 &&
        calcData.data.level === 'HIGH',
      'Test 21: POST /confidence/calculate accurately computes composite score (91%, HIGH)'
    );

    // Test 22: Mandatory MVP Heuristic Disclaimer verification
    assert(
      confData.data.disclaimer.includes('MVP heuristic') &&
        !confData.data.disclaimer.includes('scientific certainty'),
      'Test 22: Mandatory disclaimer verified: Heuristic indicator without scientific certainty claims'
    );
  } finally {
    server.close();
  }

  console.log('====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8TestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
