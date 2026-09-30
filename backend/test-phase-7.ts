process.env.ALLOW_DEMO_MODE = 'true';
process.env.USE_TEST_STORE = 'true';
import app from './src/app.js';
import { Server } from 'http';
import { AddressInfo } from 'net';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING PHASE 7 EVIDENCE GAP DETECTION TEST SUITE');
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
    const resNoAuth = await fetch(`${baseUrl}/projects/proj-1/evidence-gaps`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    assert(resNoAuth.status === 401, 'No authentication rejected with 401');

    // ----------------------------------------------------
    // Test 2: Valid auth -> Own project evidence gap report allowed
    // ----------------------------------------------------
    const resGetGaps = await fetch(`${baseUrl}/projects/proj-1/evidence-gaps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    const gapsData = await resGetGaps.json();
    assert(
      resGetGaps.status === 200 &&
        gapsData.success === true &&
        gapsData.data.projectId === 'proj-1' &&
        Array.isArray(gapsData.data.expected) &&
        Array.isArray(gapsData.data.available) &&
        Array.isArray(gapsData.data.missing) &&
        typeof gapsData.data.coverage?.percentage === 'number',
      'User A can retrieve evidence gap report for own project (proj-1)'
    );

    // ----------------------------------------------------
    // Test 3: User A accesses User B project -> Denied (404/403)
    // ----------------------------------------------------
    // proj-3 is owned by user-demo-456 in mock store
    const resForbiddenProject = await fetch(`${baseUrl}/projects/proj-3/evidence-gaps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    assert(
      resForbiddenProject.status === 404 || resForbiddenProject.status === 403,
      "User A denied accessing User B's project evidence gaps (proj-3)"
    );

    // ----------------------------------------------------
    // Test 4: Project Type Rules Resolution (proj-1: river_restoration)
    // ----------------------------------------------------
    assert(
      gapsData.data.projectType === 'river_restoration' &&
        gapsData.data.projectTypeConfigured === true &&
        gapsData.data.expected.length === 6 &&
        gapsData.data.expected.includes('initial_condition') &&
        gapsData.data.expected.includes('long_term_outcome') &&
        gapsData.data.expected.includes('quantitative_measurement'),
      'Configured project type (river_restoration) resolves exact 6 required categories'
    );

    // ----------------------------------------------------
    // Test 5: Mathematical Invariant: missing = expected - available
    // ----------------------------------------------------
    const { expected, available, missing } = gapsData.data;
    const computedMissing = expected.filter((c: string) => !available.includes(c));
    const setsMatch =
      missing.length === computedMissing.length &&
      missing.every((c: string) => computedMissing.includes(c));
    assert(
      setsMatch,
      'Mathematical invariant verified: missing strictly equals (expected - available)'
    );

    // ----------------------------------------------------
    // Test 6: Phase 5 Comparison Classification into Long-Term Outcome
    // ----------------------------------------------------
    // proj-1 has comp-seed-1 with increased visible vegetation and soil stabilization
    assert(
      available.includes('long_term_outcome'),
      'Phase 5 comparison with sustained vegetation transformation qualifies as long_term_outcome'
    );

    // ----------------------------------------------------
    // Test 7: Conservative Evidence: Quantitative Measurement Remains Missing
    // ----------------------------------------------------
    // Images alone do not satisfy quantitative measurement
    assert(
      missing.includes('quantitative_measurement'),
      'Conservative guardrail: Visual images alone do NOT satisfy quantitative_measurement (remains missing)'
    );

    // ----------------------------------------------------
    // Test 8: Conservative Evidence: Beneficiary Evidence Remains Missing
    // ----------------------------------------------------
    // Photos of workers/people alone do not satisfy beneficiary evidence
    assert(
      missing.includes('beneficiary_evidence'),
      'Conservative guardrail: Images of people alone do NOT satisfy beneficiary_evidence (remains missing)'
    );

    // ----------------------------------------------------
    // Test 9: Duplicate Evidence Does Not Inflate Categories
    // ----------------------------------------------------
    // Check that available categories list has no duplicate strings
    const uniqueAvailable = Array.from(new Set(available));
    assert(
      uniqueAvailable.length === available.length,
      'Duplicate evidence assets do not create duplicate available categories'
    );

    // ----------------------------------------------------
    // Test 10: Empty Project Graceful Handling (0 available, all required missing, no crash)
    // ----------------------------------------------------
    // Create a new empty project
    const resCreateProject = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        name: 'New Empty Afforestation Site',
        description: 'New tree plantation initiative with no media yet',
        project_type: 'tree_plantation',
      }),
    });
    const newProjData = await resCreateProject.json();
    const emptyProjId = newProjData.data.id;

    const resEmptyGaps = await fetch(`${baseUrl}/projects/${emptyProjId}/evidence-gaps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    const emptyGapsData = await resEmptyGaps.json();
    assert(
      resEmptyGaps.status === 200 &&
        emptyGapsData.data.available.length === 0 &&
        emptyGapsData.data.missing.length === 6 &&
        emptyGapsData.data.coverage.available === 0 &&
        emptyGapsData.data.coverage.percentage === 0,
      'Empty project reports 0 available, all 6 missing, without application error'
    );

    // ----------------------------------------------------
    // Test 11: Unconfigured / Unknown Project Type Graceful Handling
    // ----------------------------------------------------
    const resCustomProject = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
      body: JSON.stringify({
        name: 'Experimental Lab Bioassay Research',
        description: 'Non-standard laboratory experimental research',
        project_type: 'other',
      }),
    });
    const customProjData = await resCustomProject.json();
    const customProjId = customProjData.data.id;

    const resCustomGaps = await fetch(`${baseUrl}/projects/${customProjId}/evidence-gaps`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': 'user-demo-123',
      },
    });
    const customGapsData = await resCustomGaps.json();
    assert(
      resCustomGaps.status === 200 &&
        customGapsData.data.projectTypeConfigured === false &&
        customGapsData.data.expected.length === 0 &&
        customGapsData.data.missing.length === 0,
      'Unconfigured project type does not invent arbitrary requirements (expected = 0, missing = 0)'
    );

    // ----------------------------------------------------
    // Test 12: Cross-Project Evidence Isolation
    // ----------------------------------------------------
    // Verify that empty project did not adopt any assets or claims from proj-1
    assert(
      emptyGapsData.data.available.length === 0,
      'Cross-project isolation verified: Empty project does not inherit evidence from other projects'
    );

    // ----------------------------------------------------
    // Test 13: Category Metadata and Actionable Collection Guidance
    // ----------------------------------------------------
    const missingItems = gapsData.data.categories.filter((c: any) => c.status === 'missing');
    const allHaveSuggestions = missingItems.every(
      (c: any) => typeof c.suggestedNextAction === 'string' && c.suggestedNextAction.length > 5
    );
    assert(
      allHaveSuggestions,
      'Every missing evidence category provides clear, rule-based suggested collection actions'
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
