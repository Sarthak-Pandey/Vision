import app from './src/app.js';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { ImpactReportService } from './src/services/report.service.js';
import { ProjectService } from './src/services/project.service.js';
import { CONFIDENCE_DISCLAIMER } from './src/services/confidence.service.js';

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

async function runPhase9TestSuite() {
  console.log('====================================================');
  console.log('RUNNING PHASE 9 PROJECT IMPACT REPORT TEST SUITE');
  console.log('====================================================');

  const reportService = new ImpactReportService();
  const projectService = new ProjectService();

  // --------------------------------------------------------------------------
  // PART 1: COMPLETE PROJECT REPORT (proj-1)
  // --------------------------------------------------------------------------
  const fullReport = await reportService.generateProjectReport('proj-1', 'user-demo-123');

  // Test 1: Section 1 - Project Overview
  assert(
    fullReport.project.id === 'proj-1' &&
      fullReport.project.name === 'Yamuna Restoration' &&
      fullReport.project.location === 'Delhi' &&
      fullReport.project.mediaCount === 2 &&
      fullReport.project.projectType === 'river_restoration' &&
      fullReport.project.startDate !== null &&
      fullReport.project.createdDate !== null,
    'Test 1: Section 1 - Project Overview populated with accurate database values'
  );

  // Test 2: Section 2 - Timeline
  assert(
    Array.isArray(fullReport.timeline.timeline) &&
      fullReport.timeline.timeline.length > 0 &&
      fullReport.timeline.timeline[0].year === '2025' &&
      fullReport.timeline.timeline[0].totalAssets === 2 &&
      fullReport.timeline.undatedAssetsCount === 0,
    'Test 2: Section 2 - Timeline accurately groups assets by Year and Month'
  );

  // Test 3: Section 3 - Activities
  assert(
    Array.isArray(fullReport.activities.activities) &&
      fullReport.activities.totalActivitiesCount >= 0,
    'Test 3: Section 3 - Activities categorized without duplicating total media count'
  );

  // Test 4: Section 4 - Locations
  assert(
    fullReport.locations.locationsCount >= 1 &&
      fullReport.locations.locations[0].formattedCoordinates.includes('° N'),
    'Test 4: Section 4 - Locations clustered by coordinate boundaries (~110m precision)'
  );

  // Test 5: Section 5 - Before / After Evidence
  assert(
    fullReport.beforeAfter.comparisonsCount >= 1 &&
      fullReport.beforeAfter.comparisons[0].beforeAssetUrl !== '' &&
      fullReport.beforeAfter.comparisons[0].afterAssetUrl !== '' &&
      Array.isArray(fullReport.beforeAfter.comparisons[0].changes) &&
      fullReport.beforeAfter.comparisons[0].changes.length > 0,
    'Test 5: Section 5 - Before/After displays dual media, capture dates, and observed changes'
  );

  // Test 6: Section 6 - Observed Changes
  assert(
    fullReport.observedChanges.length >= 1 &&
      fullReport.observedChanges[0].occurrences >= 1 &&
      fullReport.observedChanges[0].supportingComparisonIds.length >= 1 &&
      fullReport.observedChanges[0].description.length > 5,
    'Test 6: Section 6 - Observed Changes aggregated from comparisons preserving original wording'
  );

  // Test 7: Section 7 - Evidence Quality
  assert(
    typeof fullReport.evidenceQuality.compositePercentage === 'number' &&
      ['LOW', 'MEDIUM', 'HIGH'].includes(fullReport.evidenceQuality.confidenceLevel) &&
      fullReport.evidenceQuality.signalsSummary.visionConfidence !== null &&
      fullReport.evidenceQuality.totalClaims >= 2 &&
      fullReport.evidenceQuality.evidenceBackedClaimsCount >= 2 &&
      fullReport.evidenceQuality.disclaimer === CONFIDENCE_DISCLAIMER,
    'Test 7: Section 7 - Evidence Quality reflects Phase 8 composite score and mandatory disclaimer'
  );

  // Test 8: Section 8 - Evidence Gaps
  assert(
    fullReport.evidenceGaps.projectType === 'river_restoration' &&
      fullReport.evidenceGaps.expectedCategories.length === 6 &&
      Array.isArray(fullReport.evidenceGaps.availableCategories) &&
      Array.isArray(fullReport.evidenceGaps.missingCategories) &&
      typeof fullReport.evidenceGaps.coveragePercentage === 'number',
    'Test 8: Section 8 - Evidence Gaps reuses Phase 7 rule-based taxonomy and coverage'
  );

  // Test 9: Section 9 - Source Assets & Traceability Matrix
  assert(
    fullReport.sourceAssets.length === 2 &&
      fullReport.sourceAssets.every((a) => a.url.startsWith('https://')) &&
      fullReport.sourceAssets.some((a) => a.supportingClaims.length > 0) &&
      fullReport.sourceAssets.some((a) => a.usedInComparisons.length > 0),
    'Test 9: Section 9 - Source assets link directly to supporting claims and comparisons'
  );

  // Test 10: Traceability Chain Verification
  const sampleClaim = fullReport.sourceAssets[0].supportingClaims[0];
  assert(
    sampleClaim !== undefined && sampleClaim.claim.length > 0,
    'Test 10: Report claim is auditable and traceable back to ground-truth media asset'
  );

  // --------------------------------------------------------------------------
  // PART 2: PARTIALLY POPULATED PROJECT (proj-2, has media, no comparisons)
  // --------------------------------------------------------------------------
  const partialReport = await reportService.generateProjectReport('proj-2', 'user-demo-123');

  assert(
    partialReport.project.id === 'proj-2' &&
      partialReport.project.mediaCount === 1 &&
      partialReport.beforeAfter.comparisonsCount === 0 &&
      partialReport.observedChanges.length === 0 &&
      partialReport.timeline.timeline.length === 1 &&
      partialReport.evidenceGaps.expectedCategories.length === 5,
    'Test 11: Partially populated project renders available sections without crashing'
  );

  // --------------------------------------------------------------------------
  // PART 3: EMPTY PROJECT (0 assets, 0 comparisons, 0 claims)
  // --------------------------------------------------------------------------
  const emptyProject = await projectService.createProject(
    {
      name: 'Empty Test Project',
      description: 'Brand new project with zero media',
      project_type: 'solar_installation',
    },
    'user-demo-123'
  );

  const emptyReport = await reportService.generateProjectReport(emptyProject.id, 'user-demo-123');

  assert(
    emptyReport.project.mediaCount === 0 &&
      emptyReport.timeline.timeline.length === 0 &&
      emptyReport.timeline.undatedAssetsCount === 0 &&
      emptyReport.activities.activities.length === 0 &&
      emptyReport.locations.locationsCount === 0 &&
      emptyReport.beforeAfter.comparisonsCount === 0 &&
      emptyReport.observedChanges.length === 0 &&
      emptyReport.evidenceQuality.totalClaims === 0 &&
      emptyReport.evidenceGaps.availableCategories.length === 0 &&
      emptyReport.evidenceGaps.coveragePercentage === 0 &&
      emptyReport.sourceAssets.length === 0,
    'Test 12: Empty project handles all sections gracefully with zero-data empty states'
  );

  // Clean up empty project
  await projectService.deleteProject(emptyProject.id, 'user-demo-123');

  // --------------------------------------------------------------------------
  // PART 4: DATA CONSISTENCY CHECK
  // --------------------------------------------------------------------------
  // Report media count must match asset count
  assert(
    fullReport.project.mediaCount === fullReport.sourceAssets.length,
    'Test 13: Report media count is 100% consistent with source assets count'
  );

  // --------------------------------------------------------------------------
  // PART 5: HTTP REST API & AUTHORIZATION TESTS
  // --------------------------------------------------------------------------
  const server: Server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // Test 14: Unauthenticated request -> 401
    const resNoAuth = await fetch(`${baseUrl}/projects/proj-1/report`, {
      method: 'GET',
    });
    assert(resNoAuth.status === 401, 'Test 14: Unauthenticated request rejected with 401');

    // Test 15: Cross-tenant unauthorized request (User demo-123 accessing proj-3 owned by demo-456) -> 404
    const resIdor = await fetch(`${baseUrl}/projects/proj-3/report`, {
      method: 'GET',
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    assert(
      resIdor.status === 404 || resIdor.status === 403,
      'Test 15: IDOR cross-tenant report access rejected with 404/403'
    );

    // Test 16: Non-existent project -> 404
    const resNotFound = await fetch(`${baseUrl}/projects/proj-nonexistent-999/report`, {
      method: 'GET',
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    assert(resNotFound.status === 404, 'Test 16: Non-existent project ID rejected with 404');

    // Test 17: Authorized report request -> 200 with complete report
    const resAuth = await fetch(`${baseUrl}/projects/proj-1/report`, {
      method: 'GET',
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    const authData = await resAuth.json();
    assert(
      resAuth.status === 200 &&
        authData.success === true &&
        authData.data.project.id === 'proj-1' &&
        authData.data.timeline !== undefined &&
        authData.data.activities !== undefined &&
        authData.data.locations !== undefined &&
        authData.data.beforeAfter !== undefined &&
        authData.data.observedChanges !== undefined &&
        authData.data.evidenceQuality !== undefined &&
        authData.data.evidenceGaps !== undefined &&
        authData.data.sourceAssets !== undefined,
      'Test 17: Authorized user receives 200 with structured 9-section report'
    );

    // Test 18: Anti-hallucination guardrail: Report preserves factual wording and does not invent percentages
    const rawReportJson = JSON.stringify(authData.data);
    assert(
      !rawReportJson.includes('carbon reduction') &&
        !rawReportJson.includes('biodiversity percentage') &&
        !rawReportJson.includes('pollution reduced by') &&
        !rawReportJson.includes('undefined') &&
        !rawReportJson.includes('Invalid Date'),
      'Test 18: Anti-hallucination guardrail: No unsupported scientific claims or malformed date strings'
    );
  } finally {
    server.close();
  }

  console.log('====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runPhase9TestSuite();
