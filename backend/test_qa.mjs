import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-demo-user': 'true',
};

async function runTests() {
  console.log('=== STARTING PHASE 3 QA & FUNCTIONAL SUITE ===\n');

  // 1. Health check
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('1. Health Check:', healthRes.status, healthData);
  } catch (err) {
    console.error('Failed to reach backend:', err.message);
    process.exit(1);
  }

  // 2. Test Project Creation Validation
  console.log('\n2. Testing Project Creation Validation...');

  // Blank name test
  const blankNameRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ name: '' }),
  });
  console.log(' - Blank name response status:', blankNameRes.status, await blankNameRes.json());

  // Whitespace-only name test
  const spaceNameRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ name: '     ' }),
  });
  console.log(' - Whitespace name response status:', spaceNameRes.status, await spaceNameRes.json());

  // Invalid date range test (end_date < start_date)
  const invalidDateRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      name: 'Invalid Date Project',
      start_date: '2026-12-31',
      end_date: '2025-01-01',
    }),
  });
  console.log(' - End < Start date response status:', invalidDateRes.status, await invalidDateRes.json());

  // Valid project creation
  console.log('\n3. Creating Valid Test Projects...');
  const validProjectA = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      name: 'Yamuna River Restoration QA',
      description: 'River cleanup and plantation project QA',
      location: 'Delhi',
      start_date: '2025-01-01',
      end_date: '2026-12-31',
    }),
  });
  const projAData = await validProjectA.json();
  console.log(' - Project A created:', validProjectA.status, projAData);
  const projA = projAData.data;

  const validProjectB = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      name: 'Green Village QA',
      description: 'Solar microgrid installation',
      location: 'Rajasthan',
      start_date: '2025-06-01',
      end_date: '2025-12-31',
    }),
  });
  const projBData = await validProjectB.json();
  console.log(' - Project B created:', validProjectB.status, projBData);
  const projB = projBData.data;

  // 4. Test Asset Linking & Media Count Separation
  console.log('\n4. Testing Asset Creation & Media Count Isolation...');
  const assetA1 = await (
    await fetch(`${BASE_URL}/assets`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        project_id: projA.id,
        url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        type: 'image',
        capture_date: '2025-02-10T10:00:00Z',
        latitude: 28.6139,
        longitude: 77.209,
      }),
    })
  ).json();

  const assetA2 = await (
    await fetch(`${BASE_URL}/assets`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        project_id: projA.id,
        url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        type: 'image',
        capture_date: '2025-03-15T14:30:00Z',
        latitude: 28.6145,
        longitude: 77.2095,
      }),
    })
  ).json();

  const assetB1 = await (
    await fetch(`${BASE_URL}/assets`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        project_id: projB.id,
        url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800',
        type: 'image',
        capture_date: '2025-07-20T09:15:00Z',
        latitude: 26.9124,
        longitude: 75.7873,
      }),
    })
  ).json();

  console.log(' - Asset A1:', assetA1.data.id, 'linked to Project A:', assetA1.data.project_id);
  console.log(' - Asset A2:', assetA2.data.id, 'linked to Project A:', assetA2.data.project_id);
  console.log(' - Asset B1:', assetB1.data.id, 'linked to Project B:', assetB1.data.project_id);

  // Fetch Project A assets vs Project B assets
  const projAAssetsRes = await (await fetch(`${BASE_URL}/assets?projectId=${projA.id}`, { headers: HEADERS })).json();
  const projBAssetsRes = await (await fetch(`${BASE_URL}/assets?projectId=${projB.id}`, { headers: HEADERS })).json();

  console.log(' - Project A asset count retrieved:', projAAssetsRes.data.length, '(Expected: 2)');
  console.log(' - Project B asset count retrieved:', projBAssetsRes.data.length, '(Expected: 1)');

  // 5. Test AI Analysis Integration
  console.log('\n5. Testing Automated Phase 2 AI Vision Analysis...');
  const analyzeResA1 = await (await fetch(`${BASE_URL}/assets/${assetA1.data.id}/analyze`, { method: 'POST', headers: HEADERS })).json();
  console.log(' - Asset A1 AI Analysis result:', analyzeResA1.data ? 'SUCCESS' : 'FAILED', analyzeResA1.data);

  // 6. Test Project Editing
  console.log('\n6. Testing Project Edit Persistence...');
  const editRes = await fetch(`${BASE_URL}/projects/${projA.id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({
      name: 'Yamuna River Restoration QA (Edited)',
      location: 'Delhi NCR',
    }),
  });
  const editData = await editRes.json();
  console.log(' - Project edit response:', editRes.status, editData.data);

  // Re-fetch project to verify persistence
  const getUpdatedRes = await (await fetch(`${BASE_URL}/projects/${projA.id}`, { headers: HEADERS })).json();
  console.log(' - Verified persisted name:', getUpdatedRes.data.name, 'Location:', getUpdatedRes.data.location);

  // 7. Test Non-existent / Invalid Routes
  console.log('\n7. Testing Invalid Routes & Nonexistent IDs...');
  const invalidIdRes = await fetch(`${BASE_URL}/projects/nonexistent-id-999999`, { headers: HEADERS });
  console.log(' - Nonexistent project response status:', invalidIdRes.status, await invalidIdRes.json());

  // 8. Test Clean Up / Project Delete
  console.log('\n8. Testing Project Deletion...');
  const deleteRes = await fetch(`${BASE_URL}/projects/${projA.id}`, { method: 'DELETE', headers: HEADERS });
  console.log(' - Project deletion response status:', deleteRes.status);

  console.log('\n=== QA SUITE COMPLETE ===');
}

runTests().catch((err) => console.error(err));
