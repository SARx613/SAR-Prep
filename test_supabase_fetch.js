const SUPABASE_URL = 'https://inxybwglotmkfbdtbvmh.supabase.co';
const KEY = 'sb_publishable_nfh9wJ391McaT0TiyMa7zQ_J6FQ9QCO';

async function runTest() {
  console.log("1. Signing up dummy user...");
  const fakeEmail = `test_${Date.now()}@example.com`;
  
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': KEY },
    body: JSON.stringify({ email: fakeEmail, password: 'SuperSecretPassword123!' })
  });
  const authData = await authRes.json();
  
  if (authData.error || !authData.user) {
    console.error("Auth Error:", authData);
    return;
  }
  
  const user = authData.user;
  const token = authData.session.access_token;
  console.log("Created user with ID:", user.id);

  console.log("2. Attempting to upsert into users_progress...");
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/users_progress?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify({
      user_id: user.id,
      mastered_ids: '{1,2,3}',
      review_ids: '{4,5}',
      session_score: 50,
      lives: 4,
      total_seen: 10
    })
  });
  
  console.log("Status:", dbRes.status);
  const text = await dbRes.text();
  console.log("Response:", text);
}

runTest();
