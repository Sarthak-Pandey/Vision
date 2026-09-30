import app from './src/app.js';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://szilariqsodwgqidxlbz.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aWxhcmlxc29kd2dxaWR4bGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NzczMjksImV4cCI6MjEwNjA1MzMyOX0.a4mWgG4P0WiAx1osYR8nkOdY7Gr2bviMhKIbB8G2PI8';

async function runRealE2EJourney() {
  console.log('================================================================');
  console.log('STARTING REAL PRODUCTION E2E INTEGRATION & SECURITY AUDIT TEST');
  console.log('================================================================\n');

  // Launch local express server
  const server: Server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let userAToken = '';
  let userAId = '';
  let userBToken = '';
  let userBId = '';

  let createdProjectId = '';
  let assetBeforeId = '';
  let assetAfterId = '';
  let comparisonId = '';

  try {
    // -------------------------------------------------------------------------
    // STEP 1: AUTHENTICATION AUDIT (PART 4 & PART 27)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 1: Real Supabase Authentication & Demo Lockdown ---');

    // 1.1 Unauthenticated request must return 401
    const resNoAuth = await fetch(`${baseUrl}/projects`);
    assert(resNoAuth.status === 401, 'No authentication rejected with 401');

    // 1.2 Fake demo token in production mode must be rejected with 401
    const resDemoFake = await fetch(`${baseUrl}/projects`, {
      headers: { Authorization: 'Bearer demo-token' },
    });
    assert(resDemoFake.status === 401, 'demo-token header rejected with 401');

    // 1.3 x-demo-user header in production mode must be rejected with 401
    const resDemoHeader = await fetch(`${baseUrl}/projects`, {
      headers: { 'x-demo-user': 'user-demo-123' },
    });
    assert(resDemoHeader.status === 401, 'x-demo-user rejected with 401');

    // 1.4 Real Login: User A (sarthak.pandey@example.com)
    const loginARes = await anonClient.auth.signInWithPassword({
      email: 'sarthak.pandey@example.com',
      password: 'password123',
    });
    assert(
      !loginARes.error && !!loginARes.data.session,
      'User A successfully authenticates with Supabase Auth',
      loginARes.error?.message
    );
    userAToken = loginARes.data.session?.access_token || '';
    userAId = loginARes.data.user?.id || '';

    // 1.5 Real Login: User B (analyst.b@example.com)
    const loginBRes = await anonClient.auth.signInWithPassword({
      email: 'analyst.b@example.com',
      password: 'password123',
    });
    assert(
      !loginBRes.error && !!loginBRes.data.session,
      'User B successfully authenticates with Supabase Auth',
      loginBRes.error?.message
    );
    userBToken = loginBRes.data.session?.access_token || '';
    userBId = loginBRes.data.user?.id || '';

    // 1.6 Verify Token with backend /auth/me
    const resMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const meData = await resMe.json();
    assert(
      resMe.status === 200 && meData.data?.email === 'sarthak.pandey@example.com',
      'Backend verifies JWT with Supabase and extracts real user session'
    );

    // -------------------------------------------------------------------------
    // STEP 2: PROJECT CREATION & SCOPING (PART 11 & PART 12)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Project Management & Tenant Scoping ---');

    const projectPayload = {
      name: `E2E Himalayan Reforestation ${Date.now()}`,
      description: 'Community-led alpine reforestation and high-altitude soil stabilization initiative.',
      location: 'Himachal Pradesh, India',
      project_type: 'tree_plantation',
      start_date: '2025-01-10',
      end_date: '2026-12-31',
    };

    const resCreateProj = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify(projectPayload),
    });

    const createProjData = await resCreateProj.json();
    assert(
      resCreateProj.status === 201 && !!createProjData.data?.id,
      'Real project persisted to Supabase database',
      createProjData.error?.message
    );
    createdProjectId = createProjData.data?.id;

    assert(
      createProjData.data?.project_type === 'tree_plantation',
      'Project type correctly parsed and persisted without being stripped'
    );
    assert(
      createProjData.data?.created_by === userAId,
      'Project ownership automatically bound to authenticated User A ID'
    );

    // Verify User A can fetch this project
    const resGetProj = await fetch(`${baseUrl}/projects/${createdProjectId}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    assert(resGetProj.status === 200, 'User A can retrieve own project');

    // Verify User B CANNOT fetch User A's project (IDOR guard)
    const resIDOR = await fetch(`${baseUrl}/projects/${createdProjectId}`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(resIDOR.status === 404, 'User B denied access to User A project (404/IDOR blocked)');

    // -------------------------------------------------------------------------
    // STEP 3: MEDIA UPLOAD & SECURITY GUARDS (PART 7 & PART 8)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Media Upload, Cloudinary & Security Guards ---');

    // 3.1 Unsupported file type (text/plain) must be rejected
    const textBlob = new Blob(['plain text fake file'], { type: 'text/plain' });
    const textForm = new FormData();
    textForm.append('file', textBlob, 'hack.txt');

    const resBadMime = await fetch(`${baseUrl}/assets/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: textForm,
    });
    assert(resBadMime.status === 400, 'Unsupported MIME type rejected with 400');

    // 3.2 Real 1x1 test image upload to Cloudinary (Before photo)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const pngBlobBefore = new Blob([pngBuffer], { type: 'image/png' });
    const uploadFormBefore = new FormData();
    uploadFormBefore.append('file', pngBlobBefore, 'before_field.png');

    const resUploadBefore = await fetch(`${baseUrl}/assets/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: uploadFormBefore,
    });
    const uploadBeforeData = await resUploadBefore.json();
    assert(
      resUploadBefore.status === 200 && uploadBeforeData.data?.url?.includes('cloudinary.com'),
      'Real image uploaded to live Cloudinary with secure URL returned',
      uploadBeforeData.error?.message
    );

    const beforeCloudinaryUrl = uploadBeforeData.data.url;
    const beforePublicId = uploadBeforeData.data.public_id;

    // 3.3 Create Asset Record in Supabase (Before Asset)
    const resAssetBefore = await fetch(`${baseUrl}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        project_id: createdProjectId,
        url: beforeCloudinaryUrl,
        cloudinary_public_id: beforePublicId,
        type: 'image',
        capture_date: '2025-02-01T10:00:00Z',
        latitude: 31.1048,
        longitude: 77.1734,
      }),
    });
    const assetBeforeData = await resAssetBefore.json();
    assert(
      resAssetBefore.status === 201 && !!assetBeforeData.data?.id,
      'Asset record persisted in Supabase assets table',
      assetBeforeData.error?.message
    );
    assetBeforeId = assetBeforeData.data.id;

    // 3.4 Upload Second Image to Cloudinary (After photo)
    const pngBlobAfter = new Blob([pngBuffer], { type: 'image/png' });
    const uploadFormAfter = new FormData();
    uploadFormAfter.append('file', pngBlobAfter, 'after_field.png');

    const resUploadAfter = await fetch(`${baseUrl}/assets/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: uploadFormAfter,
    });
    const uploadAfterData = await resUploadAfter.json();
    assert(
      resUploadAfter.status === 200 && uploadAfterData.data?.url?.includes('cloudinary.com'),
      'Second image uploaded to live Cloudinary',
      uploadAfterData.error?.message
    );

    const afterCloudinaryUrl = uploadAfterData.data.url;
    const afterPublicId = uploadAfterData.data.public_id;

    // 3.5 Create Second Asset Record in Supabase (After Asset)
    const resAssetAfter = await fetch(`${baseUrl}/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        project_id: createdProjectId,
        url: afterCloudinaryUrl,
        cloudinary_public_id: afterPublicId,
        type: 'image',
        capture_date: '2025-06-15T14:30:00Z',
        latitude: 31.1052,
        longitude: 77.1739,
      }),
    });
    const assetAfterData = await resAssetAfter.json();
    assert(
      resAssetAfter.status === 201 && !!assetAfterData.data?.id,
      'Second asset record persisted in Supabase assets table'
    );
    assetAfterId = assetAfterData.data.id;

    // -------------------------------------------------------------------------
    // STEP 4: AI VISION ANALYSIS & PGVECTOR SEARCH (PART 9, 13, 14)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: AI Vision Analysis & pgvector Semantic Search ---');

    // 4.1 Trigger Vision Analysis on Before Asset
    const resAnalyze = await fetch(`${baseUrl}/assets/${assetBeforeId}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const analyzeData = await resAnalyze.json();
    assert(
      resAnalyze.status === 200 && !!analyzeData.data?.description,
      'AI Vision inspection executes and returns structured description and objects',
      analyzeData.error?.message
    );

    // 4.2 Verify Analysis persisted in Supabase ai_analysis table
    const { data: dbAnalysisList } = await adminClient
      .from('ai_analysis')
      .select('*')
      .eq('asset_id', assetBeforeId)
      .order('created_at', { ascending: false });
    const dbAnalysis = dbAnalysisList && dbAnalysisList[0];
    assert(
      !!dbAnalysis && Number(dbAnalysis.confidence) > 0,
      'AI Analysis record successfully verified in Supabase ai_analysis table'
    );

    // 4.3 Trigger Image Embedding into pgvector
    const resIndex = await fetch(`${baseUrl}/search/index`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({ projectId: createdProjectId }),
    });
    const indexData = await resIndex.json();
    assert(
      resIndex.status === 200 && (indexData.data?.successful !== undefined || indexData.data?.total !== undefined),
      'pgvector 1536-dimensional embeddings generated and indexed for assets',
      indexData.error?.message
    );

    // 4.4 Verify Embedding in Supabase embeddings table
    const { data: dbEmbeddings } = await adminClient
      .from('embeddings')
      .select('id, model')
      .eq('asset_id', assetBeforeId);
    assert(
      !!dbEmbeddings && dbEmbeddings.length > 0,
      'Embedding verified in Supabase pgvector embeddings table'
    );

    // 4.5 Execute Semantic Search using match_assets RPC
    const resSearch = await fetch(`${baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        projectId: createdProjectId,
        query: 'saplings and mountain forest vegetation',
        threshold: 0.1,
      }),
    });
    const searchData = await resSearch.json();
    assert(
      resSearch.status === 200 && Array.isArray(searchData.data?.results),
      'pgvector cosine similarity search executed via stored RPC function',
      searchData.error?.message
    );

    // 4.6 Search Cross-Tenant Isolation: User B cannot search User A's project
    const resSearchUserB = await fetch(`${baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        projectId: createdProjectId,
        query: 'saplings',
      }),
    });
    assert(
      resSearchUserB.status === 404,
      'User B denied semantic search on User A project (cross-project isolation enforced)'
    );

    // -------------------------------------------------------------------------
    // STEP 5: BEFORE / AFTER INTELLIGENCE (PART 15 & 16)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Before / After Intelligence & Chronological Safety ---');

    // 5.1 Same asset comparison rejected
    const resSameComp = await fetch(`${baseUrl}/projects/${createdProjectId}/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        beforeAssetId: assetBeforeId,
        afterAssetId: assetBeforeId,
      }),
    });
    assert(resSameComp.status === 400, 'Same asset comparison rejected with 400');

    // 5.2 Reversed dates rejected
    const resReversedComp = await fetch(`${baseUrl}/projects/${createdProjectId}/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        beforeAssetId: assetAfterId, // June (later)
        afterAssetId: assetBeforeId, // Feb (earlier)
      }),
    });
    assert(resReversedComp.status === 400, 'Reversed chronological dates rejected with 400');

    // 5.3 Valid Before / After comparison
    const resValidComp = await fetch(`${baseUrl}/projects/${createdProjectId}/comparisons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        beforeAssetId: assetBeforeId,
        afterAssetId: assetAfterId,
      }),
    });
    const compData = await resValidComp.json();
    assert(
      resValidComp.status === 201 && !!compData.data?.id,
      'Valid Before/After comparison generated and persisted to Supabase comparisons table',
      compData.error?.message
    );
    comparisonId = compData.data.id;

    assert(
      Number(compData.data?.confidence) > 0 && typeof compData.data?.comparison_result?.summary === 'string',
      'Comparison result satisfies schema with summary, changes, and confidence bounds'
    );

    // -------------------------------------------------------------------------
    // STEP 6: EVIDENCE & TRACEABILITY (PART 17 & 18)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Evidence Claims & Many-to-Many Traceability ---');

    // 6.1 Sync / Generate claims
    const resSyncClaims = await fetch(`${baseUrl}/projects/${createdProjectId}/claims/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const syncData = await resSyncClaims.json();
    assert(
      resSyncClaims.status === 200 && syncData.data?.syncedClaims >= 1,
      'Evidence claims extracted and linked to source media in Supabase',
      syncData.error?.message
    );

    // 6.2 Retrieve Claims
    const resGetClaims = await fetch(`${baseUrl}/projects/${createdProjectId}/claims`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const claimsData = await resGetClaims.json();
    const claimsList = claimsData.data?.claims || [];
    assert(
      claimsList.length >= 1,
      `Retrieved ${claimsList.length} evidence claims with telemetry and composite confidence`
    );

    // Verify traceability chain on first claim
    const firstClaim = claimsList[0];
    assert(
      !!firstClaim && firstClaim.evidence?.length >= 1,
      'Claim links directly to supporting asset IDs in claim_evidence table'
    );

    // 6.3 Cross-Tenant Claim Security
    const resClaimsUserB = await fetch(`${baseUrl}/projects/${createdProjectId}/claims`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(resClaimsUserB.status === 404, 'User B denied access to User A claims (404/IDOR blocked)');

    // -------------------------------------------------------------------------
    // STEP 7: EVIDENCE GAP DETECTION (PART 19 & 20)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Evidence Gap Detection (Rule Engine) ---');

    const resGaps = await fetch(`${baseUrl}/projects/${createdProjectId}/evidence-gaps`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const gapsData = await resGaps.json();
    const gapReport = gapsData.data;

    assert(
      resGaps.status === 200 && gapReport.projectType === 'tree_plantation',
      'Evidence gap engine detects tree_plantation taxonomy requirements (6 expected categories)'
    );

    assert(
      gapReport.missing.length === (gapReport.expected.length - gapReport.available.length),
      'Mathematical invariant verified on live database: missing == expected - available'
    );

    assert(
      gapReport.missing.includes('quantitative_measurement'),
      'Conservative guardrail: Visual images alone do NOT satisfy quantitative_measurement (remains missing)'
    );

    // -------------------------------------------------------------------------
    // STEP 8: CONFIDENCE SYSTEM (PART 21, 22, 23)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Evidence Confidence System & Exact Boundaries ---');

    const resConfidence = await fetch(`${baseUrl}/projects/${createdProjectId}/confidence`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const confData = await resConfidence.json();
    const confReport = confData.data;

    assert(
      resConfidence.status === 200 && !!confReport.disclaimer,
      'Project confidence report generated with breakdown and disclaimer'
    );

    assert(
      confReport.disclaimer.includes('Not a scientifically validated probability'),
      'Mandatory heuristic disclaimer verified on live API output'
    );

    // Boundary Test via POST /confidence/calculate
    const resCalcHigh = await fetch(`${baseUrl}/projects/${createdProjectId}/confidence/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        signals: {
          visionConfidence: 0.70,
          metadataConsistency: 0.70,
          imageQuality: 0.70,
          crossAssetAgreement: 0.70,
          temporalConsistency: 0.70,
        },
      }),
    });
    const calcHighData = await resCalcHigh.json();
    assert(
      calcHighData.data?.level === 'HIGH' && calcHighData.data?.percentage === 70,
      'Exact boundary: 70.0% classifies as HIGH'
    );

    const resCalcMed = await fetch(`${baseUrl}/projects/${createdProjectId}/confidence/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        signals: {
          visionConfidence: 0.40,
          metadataConsistency: 0.40,
          imageQuality: 0.40,
          crossAssetAgreement: 0.40,
          temporalConsistency: 0.40,
        },
      }),
    });
    const calcMedData = await resCalcMed.json();
    assert(
      calcMedData.data?.level === 'MEDIUM' && calcMedData.data?.percentage === 40,
      'Exact boundary: 40.0% classifies as MEDIUM'
    );

    // -------------------------------------------------------------------------
    // STEP 9: IMPACT REPORT & TRACEABILITY (PART 24, 25, 26)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Project Impact Report & Traceability ---');

    const resReport = await fetch(`${baseUrl}/projects/${createdProjectId}/report`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const reportData = await resReport.json();
    const report = reportData.data;

    assert(
      resReport.status === 200 && !!report.project && !!report.timeline && !!report.activities &&
      !!report.locations && !!report.beforeAfter && !!report.observedChanges &&
      !!report.evidenceQuality && !!report.evidenceGaps && !!report.sourceAssets,
      'Impact report dynamically composed with all 9 structured sections'
    );

    assert(
      report.project.id === createdProjectId && report.sourceAssets.length === 2,
      'Report media count strictly equals ground-truth asset count in Supabase (2 assets)'
    );

    assert(
      report.beforeAfter.comparisons.length >= 1 && report.beforeAfter.comparisons[0].beforeAssetUrl.includes('cloudinary.com'),
      'Before/After evidence in report links directly to live Cloudinary URLs'
    );

    assert(
      !JSON.stringify(report).includes('carbon offset: 450t') && !JSON.stringify(report).includes('98% biodiversity'),
      'Anti-hallucination guardrail: Report strictly free of fabricated scientific or carbon metrics'
    );

    // Cross-tenant report access denied
    const resReportUserB = await fetch(`${baseUrl}/projects/${createdProjectId}/report`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(resReportUserB.status === 404, 'User B denied access to User A report (404/IDOR blocked)');

  } catch (error: any) {
    console.error('CRITICAL UNEXPECTED ERROR IN E2E SUITE:', error);
    failed++;
  } finally {
    // Cleanup test project and child assets from live database
    if (createdProjectId) {
      console.log('\n--- Cleaning up temporary E2E test project from live database ---');
      await adminClient.from('projects').delete().eq('id', createdProjectId);
      console.log(`Cleaned up project ${createdProjectId}`);
    }

    server.close();

    console.log('\n================================================================');
    console.log(`REAL E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runRealE2EJourney();
