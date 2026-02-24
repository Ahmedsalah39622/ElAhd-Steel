;(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'API Script User', email: 'api-script@example.com', password: 'script1234' })
    })

    const text = await res.text()

    console.log('Status:', res.status)
    console.log('Response:', text)
  } catch (err) {
    console.error('Request failed:', err.message || err)
  }
})()
