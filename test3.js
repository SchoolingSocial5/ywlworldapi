async function run() {
  const loginRes = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({email: 'admin@example.com', password: 'password'})
  });
  const { token } = await loginRes.json();
  
  const form = new FormData();
  form.append('name', 'TestChannel');
  form.append('url', 'https://test.com');
  
  const res = await fetch('http://localhost:5000/api/admin/social-media/platforms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });
  const text = await res.text();
  console.log("Response:", res.status, text);
}
run();
