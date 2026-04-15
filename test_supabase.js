const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://inxybwglotmkfbdtbvmh.supabase.co';
const supabaseKey = 'sb_publishable_nfh9wJ391McaT0TiyMa7zQ_J6FQ9QCO';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("1. Signing up dummy user...");
  const fakeEmail = `test_${Date.now()}@example.com`;
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: fakeEmail,
    password: 'SuperSecretPassword123!',
  });

  if (authErr) {
    console.error("Auth Error:", authErr.message);
    return;
  }
  
  const user = authData.user;
  console.log("Created user with ID:", user.id);

  console.log("2. Attempting to insert into users_progress...");
  const { data, error } = await supabase.from('users_progress').upsert(
    {
      user_id: user.id,
      mastered_ids: [1, 2, 3],
      review_ids: [4, 5],
      session_score: 50,
      lives: 4,
      total_seen: 10,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error("Upsert Failed! Supabase Error:", error);
  } else {
    console.log("Upsert Succeeded! Data inserted successfully.");
  }
}

runTest();
