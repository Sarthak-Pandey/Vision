import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function runSecurityTests() {
  console.log('=== STARTING SECURITY & AUTHORIZATION VERIFICATION ===\n');

  // Test 1: Request with NO credentials
  console.log('1. Testing Unauthenticated Request (No Auth / No Demo Header)...');
  const noAuthRes = await fetch(`${BASE_URL}/projects`);
  const noAuthData = await noAuthRes.json();
  console.log('   Status:', noAuthRes.status, '(Expected: 401)');
  console.log('   Response:', noAuthData);

  // Test 2: Request with Invalid Bearer Token (when configured or token validation)
  console.log('\n2. Testing Malformed/Invalid Token...');
  const invalidTokenRes = await fetch(`${BASE_URL}/projects`, {
    headers: {
      Authorization: 'Bearer ',
    },
  });
  console.log('   Status:', invalidTokenRes.status, '(Expected: 401)');
  console.log('   Response:', await invalidTokenRes.json());

  // Test 3: Explicit Demo User A Access
  console.log('\n3. Testing User A (x-demo-user: user-demo-123)...');
  const userARes = await fetch(`${BASE_URL}/projects`, {
    headers: { 'x-demo-user': 'user-demo-123' },
  });
  const userAData = await userARes.json();
  console.log('   Status:', userARes.status, '(Expected: 200)');
  console.log('   Projects returned for User A:', userAData.data?.map((p) => ({ id: p.id, name: p.name, owner: p.created_by })));

  // Test 4: Explicit Demo User B Access
  console.log('\n4. Testing User B (x-demo-user: user-demo-456)...');
  const userBRes = await fetch(`${BASE_URL}/projects`, {
    headers: { 'x-demo-user': 'user-demo-456' },
  });
  const userBData = await userBRes.json();
  console.log('   Status:', userBRes.status, '(Expected: 200)');
  console.log('   Projects returned for User B:', userBData.data?.map((p) => ({ id: p.id, name: p.name, owner: p.created_by })));

  // Test 5: User A accessing User A's project (proj-1)
  console.log('\n5. Testing User A accessing User A Project (proj-1)...');
  const userAOwnRes = await fetch(`${BASE_URL}/projects/proj-1`, {
    headers: { 'x-demo-user': 'user-demo-123' },
  });
  console.log('   Status:', userAOwnRes.status, '(Expected: 200)');

  // Test 6: User A attempting IDOR access to User B's project (proj-3)
  console.log('\n6. Testing User A attempting IDOR access to User B Project (proj-3)...');
  const userACrossRes = await fetch(`${BASE_URL}/projects/proj-3`, {
    headers: { 'x-demo-user': 'user-demo-123' },
  });
  console.log('   Status:', userACrossRes.status, '(Expected: 404)');
  console.log('   Response:', await userACrossRes.json());

  // Test 7: User B attempting IDOR access to User A's project (proj-1)
  console.log('\n7. Testing User B attempting IDOR access to User A Project (proj-1)...');
  const userBCrossRes = await fetch(`${BASE_URL}/projects/proj-1`, {
    headers: { 'x-demo-user': 'user-demo-456' },
  });
  console.log('   Status:', userBCrossRes.status, '(Expected: 404)');

  // Test 8: Attacker-Controlled created_by Spoofing
  console.log('\n8. Testing Fake created_by Injection during Project Creation...');
  const createSpoofRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-demo-user': 'user-demo-123',
    },
    body: JSON.stringify({
      name: 'Ownership Spoof Test',
      created_by: 'user-demo-456', // Attempting to assign project to User B!
    }),
  });
  const spoofData = await createSpoofRes.json();
  console.log('   Status:', createSpoofRes.status, '(Expected: 201)');
  console.log('   Actual assigned owner:', spoofData.data?.created_by, '(Expected: user-demo-123)');

  // Test 9: User A attempting Cross-Tenant Edit on User B Project
  console.log('\n9. Testing User A attempting to Edit User B Project (proj-3)...');
  const editCrossRes = await fetch(`${BASE_URL}/projects/proj-3`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-demo-user': 'user-demo-123',
    },
    body: JSON.stringify({ name: 'Hacked Name' }),
  });
  console.log('   Status:', editCrossRes.status, '(Expected: 404)');

  // Test 10: User A attempting Cross-Tenant Delete on User B Project
  console.log('\n10. Testing User A attempting to Delete User B Project (proj-3)...');
  const deleteCrossRes = await fetch(`${BASE_URL}/projects/proj-3`, {
    method: 'DELETE',
    headers: { 'x-demo-user': 'user-demo-123' },
  });
  console.log('   Status:', deleteCrossRes.status, '(Expected: 404)');

  // Test 11: User A attempting Asset Access for User B Project
  console.log('\n11. Testing User A attempting to fetch assets for User B Project (proj-3)...');
  const assetCrossRes = await fetch(`${BASE_URL}/assets?projectId=proj-3`, {
    headers: { 'x-demo-user': 'user-demo-123' },
  });
  console.log('   Status:', assetCrossRes.status, '(Expected: 404)');

  console.log('\n=== ALL SECURITY TESTS COMPLETE ===');
}

runSecurityTests().catch((err) => console.error(err));
