import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { Server } from 'http';
import { AddressInfo } from 'net';

async function runHackathonDemoE2E() {
  console.log('================================================================');
  console.log('HACKATHON DEMO & SECURITY E2E TEST SUITE');
  console.log('Testing Remove Identity, Real Guest Auth, Isolation, & Phases 1-9');
  console.log('================================================================\n');

  const server: Server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string, detail?: any) {
    if (cond) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`, detail || '');
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: SECURITY & AUTHENTICATION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('--- SECTION 1: Authentication & Protection ---');

    // 1.1 Unauthenticated requests must ALWAYS return 401 (No automatic guest access)
    const resNoAuthProjects = await fetch(`${baseUrl}/projects`);
    assert(resNoAuthProjects.status === 401, 'Unauthenticated /projects returns 401 Unauthorized');

    const resNoAuthAssets = await fetch(`${baseUrl}/assets`);
    assert(resNoAuthAssets.status === 401, 'Unauthenticated /assets returns 401 Unauthorized');

    const resNoAuthSearch = await fetch(`${baseUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'dummy', query: 'river' }),
    });
    assert(resNoAuthSearch.status === 401, 'Unauthenticated /search returns 401 Unauthorized');

    // 1.2 Insecure demo-token or x-demo-user must NEVER bypass auth in production/standard mode
    const resBypassAttempt = await fetch(`${baseUrl}/projects`, {
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    assert(resBypassAttempt.status === 401, 'x-demo-user header blocked with 401 Unauthorized');

    const resDemoTokenAttempt = await fetch(`${baseUrl}/projects`, {
      headers: { Authorization: 'Bearer demo-token' },
    });
    assert(resDemoTokenAttempt.status === 401, 'demo-token Bearer token blocked with 401 Unauthorized');

    // -------------------------------------------------------------------------
    // TEST SECTION 2: GUEST DEMO LOGIN
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Dedicated Guest Login via Existing Auth ---');

    // 2.1 Trigger guest login endpoint
    const guestLoginRes = await fetch(`${baseUrl}/auth/guest-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const guestLoginJson = await guestLoginRes.json();

    assert(guestLoginRes.status === 200, 'POST /auth/guest-login succeeds with 200 OK');
    assert(guestLoginJson.success === true, 'Guest login response has success = true');
    assert(!!guestLoginJson.data?.token, 'Guest receives real JWT authentication token');
    assert(guestLoginJson.data?.user?.email === 'guest@demo.local', 'Guest identity is dedicated guest@demo.local');
    assert(guestLoginJson.data?.user?.name === 'Guest Demo', 'Guest name is Guest Demo');
    assert(guestLoginJson.data?.user?.isGuest === true, 'User session flagged as isGuest');
    assert(!!guestLoginJson.data?.defaultProjectId, 'Guest receives defaultProjectId for immediate redirection');

    const guestToken = guestLoginJson.data.token;
    const demoProjectId = guestLoginJson.data.defaultProjectId;
    const guestUserId = guestLoginJson.data.user.id;

    // 2.2 Verify guest token with /auth/me
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const meJson = await meRes.json();
    assert(meRes.status === 200, 'GET /auth/me verifies guest token with 200 OK');
    assert(meJson.data?.id === guestUserId, 'GET /auth/me returns guest user ID');
    assert(meJson.data?.email === 'guest@demo.local', 'GET /auth/me returns guest email');
    assert(meJson.data?.name === 'Guest Demo', 'GET /auth/me returns Guest Demo display name');

    // -------------------------------------------------------------------------
    // TEST SECTION 3: FULL GUEST DEMO WORKSPACE JOURNEY (PHASES 1 - 9)
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: Full Guest Demo Journey (Phases 1 - 9) ---');

    // Step 3.1: Open Demo Project
    const projectRes = await fetch(`${baseUrl}/projects/${demoProjectId}`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const projectJson = await projectRes.json();
    assert(projectRes.status === 200, 'Demo Project loads successfully with 200 OK');
    assert(projectJson.data?.name === 'Yamuna River Restoration Demo', 'Demo project name is Yamuna River Restoration Demo');
    assert(projectJson.data?.location === 'Delhi, India', 'Demo project location is Delhi, India');
    assert(projectJson.data?.project_type === 'river_restoration', 'Demo project type is river_restoration');
    assert(projectJson.data?.created_by === guestUserId, 'Demo project is owned by guest user');

    // Step 3.2: View Media Assets
    const assetsRes = await fetch(`${baseUrl}/assets?projectId=${demoProjectId}`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const assetsJson = await assetsRes.json();
    assert(assetsRes.status === 200, 'Guest retrieves demo assets with 200 OK');
    assert(Array.isArray(assetsJson.data) && assetsJson.data.length >= 8, `Demo has ${assetsJson.data?.length} assets (minimum 8 required)`);

    // Verify personal names are NOT in uploaded_by
    const hasPersonalUploader = assetsJson.data.some((a: any) =>
      a.uploaded_by?.toLowerCase().includes('sarthak') || a.uploaded_by?.toLowerCase().includes('pandey')
    );
    assert(!hasPersonalUploader, 'Zero personal identity references in asset uploaders');

    // Step 3.3: View AI Analysis
    const sampleAsset = assetsJson.data[0];
    const analysisRes = await fetch(`${baseUrl}/assets/${sampleAsset.id}/analysis`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const analysisJson = await analysisRes.json();
    assert(analysisRes.status === 200, 'Guest retrieves AI analysis for demo asset');
    assert(!!analysisJson.data?.description, 'AI analysis has structured environmental description');
    assert(Array.isArray(analysisJson.data?.activities), 'AI analysis has structured activities');
    assert(typeof analysisJson.data?.confidence === 'number', 'AI analysis has numeric confidence score');

    // Step 3.4: Try Semantic Vector Search (Phase 4)
    const searchRes = await fetch(`${baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guestToken}`,
      },
      body: JSON.stringify({
        projectId: demoProjectId,
        query: 'river cleanup and debris removal',
        limit: 5,
        threshold: 0.1,
      }),
    });
    const searchJson = await searchRes.json();
    assert(searchRes.status === 200, 'Guest runs semantic vector search successfully');
    assert(searchJson.data?.results?.length > 0, `Semantic search returned ${searchJson.data?.results?.length} results`);

    // Step 3.5: Open Before / After Comparison (Phase 5)
    const comparisonsRes = await fetch(`${baseUrl}/projects/${demoProjectId}/comparisons`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const comparisonsJson = await comparisonsRes.json();
    assert(comparisonsRes.status === 200, 'Guest retrieves Before/After comparisons with 200 OK');
    assert(comparisonsJson.data?.length >= 1, `Demo has ${comparisonsJson.data?.length} Before/After comparison`);
    const comp = comparisonsJson.data[0];
    assert(!!comp.comparison_result?.observed_changes, 'Comparison contains verified observed changes');
    assert(comp.confidence >= 0.9, `Comparison confidence is high (${comp.confidence})`);

    // Step 3.6: Open Evidence & Claims (Phase 6)
    const claimsRes = await fetch(`${baseUrl}/projects/${demoProjectId}/claims`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const claimsJson = await claimsRes.json();
    assert(claimsRes.status === 200, 'Guest retrieves Evidence & Claims with 200 OK');
    assert(claimsJson.data?.claims?.length >= 5, `Demo has ${claimsJson.data?.claims?.length} evidence claims`);
    const claimWithEvidence = claimsJson.data.claims.find((c: any) => c.evidence?.length > 0);
    assert(!!claimWithEvidence, 'Claims are traced back to supporting media assets');

    // Step 3.7: Open Evidence Gap Detection (Phase 7)
    const gapsRes = await fetch(`${baseUrl}/projects/${demoProjectId}/evidence-gaps`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const gapsJson = await gapsRes.json();
    assert(gapsRes.status === 200, 'Guest retrieves Evidence Gap Detection report');
    assert(gapsJson.data?.expected?.length === 6, 'River restoration taxonomy resolves 6 required categories');
    assert(gapsJson.data?.missing?.length >= 2, `Evidence gap report detects ${gapsJson.data?.missing?.length} gaps (minimum 2 required)`);
    const hasSuggestedActions = gapsJson.data?.categories?.some((c: any) => !c.available && !!c.suggestedNextAction);
    assert(hasSuggestedActions, 'Rule-based suggested collection actions provided for gaps');

    // Step 3.8: Inspect Confidence System (Phase 8)
    const confRes = await fetch(`${baseUrl}/projects/${demoProjectId}/confidence`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const confJson = await confRes.json();
    assert(confRes.status === 200, 'Guest retrieves Project Confidence Report');
    assert(typeof confJson.data?.averageCompositePercentage === 'number', 'Confidence percentage is calculated');
    assert(confJson.data?.level === 'HIGH', 'Confidence level is classified as HIGH');
    assert(!!confJson.data?.disclaimer, 'Mandatory heuristic indicator disclaimer is present');

    // Step 3.9: Open Complete Impact Report (Phase 9)
    const reportRes = await fetch(`${baseUrl}/projects/${demoProjectId}/report`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    const reportJson = await reportRes.json();
    assert(reportRes.status === 200, 'Guest retrieves Project Impact Report with 200 OK');
    assert(!!reportJson.data?.project, 'Report contains Section 1: Project Overview');
    assert(!!reportJson.data?.timeline, 'Report contains Section 2: Timeline');
    assert(!!reportJson.data?.activities, 'Report contains Section 3: Activities');
    assert(!!reportJson.data?.locations, 'Report contains Section 4: Locations');
    assert(!!reportJson.data?.beforeAfter, 'Report contains Section 5: Before / After');
    assert(Array.isArray(reportJson.data?.observedChanges), 'Report contains Section 6: Observed Changes');
    assert(!!reportJson.data?.evidenceQuality, 'Report contains Section 7: Evidence Quality');
    assert(!!reportJson.data?.evidenceGaps, 'Report contains Section 8: Evidence Gaps');
    assert(Array.isArray(reportJson.data?.sourceAssets), 'Report contains Section 9: Source Assets & Provenance');

    // -------------------------------------------------------------------------
    // TEST SECTION 4: MULTI-TENANT ISOLATION & IDOR PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Multi-Tenant Isolation & IDOR Protection ---');

    // 4.1 Login as Normal User B (analyst.b@example.com)
    const userBSignInRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'analyst.b@example.com',
        password: 'password123',
      }),
    });
    const userBData = await userBSignInRes.json();
    assert(userBSignInRes.status === 200 && !!userBData.data?.token, 'User B authenticates via normal /auth/login');
    const userBToken = userBData.data.token;
    const userBId = userBData.data.user.id;

    // 4.2 User B creates a private project
    const userBProjectRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        name: `Private User B Initiative ${Date.now()}`,
        description: 'Classified corporate mangrove reforestation effort.',
        location: 'Sundarbans, India',
      }),
    });
    const userBProjectJson = await userBProjectRes.json();
    assert(userBProjectRes.status === 201, 'User B creates private project successfully');
    const userBProjectId = userBProjectJson.data?.id;

    // 4.3 GUEST tries to access User B's project (IDOR Test 1)
    const guestAccessBProj = await fetch(`${baseUrl}/projects/${userBProjectId}`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    assert(
      guestAccessBProj.status === 404 || guestAccessBProj.status === 403,
      'Guest access to User B private project denied (404/403)'
    );

    // 4.4 GUEST tries to access User B's impact report (IDOR Test 2)
    const guestAccessBReport = await fetch(`${baseUrl}/projects/${userBProjectId}/report`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    assert(
      guestAccessBReport.status === 404 || guestAccessBReport.status === 403,
      'Guest access to User B impact report denied (404/403)'
    );

    // 4.5 GUEST tries to search inside User B's project (IDOR Test 3)
    const guestSearchB = await fetch(`${baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${guestToken}`,
      },
      body: JSON.stringify({
        projectId: userBProjectId,
        query: 'mangrove',
      }),
    });
    assert(
      guestSearchB.status === 404 || guestSearchB.status === 403,
      'Guest search in User B project denied (404/403)'
    );

    // 4.6 GUEST tries to delete the shared Demo Project (Part 10 Destructive Protection)
    const guestDeleteDemoProj = await fetch(`${baseUrl}/projects/${demoProjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${guestToken}` },
    });
    assert(
      guestDeleteDemoProj.status === 403,
      'Deleting demonstration project rejected with 403 Forbidden'
    );

    // 4.7 Normal User B CANNOT access Guest's Demo project if scoped to guest (RLS & Ownership)
    const userBAccessDemo = await fetch(`${baseUrl}/projects/${demoProjectId}`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(
      userBAccessDemo.status === 404 || userBAccessDemo.status === 403,
      'User B cannot access Guest demo project (cross-tenant isolation)'
    );

    // 4.8 Guest simulated logout: Invalidating token locally leaves API requests requiring auth
    const logoutRes = await fetch(`${baseUrl}/projects`, {
      headers: { Authorization: '' },
    });
    assert(logoutRes.status === 401, 'Logged out guest requires authentication again (401)');

    // Clean up User B test project
    if (userBProjectId) {
      await fetch(`${baseUrl}/projects/${userBProjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userBToken}` },
      });
    }

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHackathonDemoE2E().catch((err) => {
  console.error('Unexpected error during test execution:', err);
  process.exit(1);
});
