const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args))

async function waitForServer(url, retries = 10, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok || res.status === 200) return true
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, delay))
  }
  return false
}

;(async () => {
  const base = 'http://localhost:3001'
  const up = await waitForServer(base)
  if (!up) {
    console.error('Server not reachable at', base)
    process.exit(2)
  }

  try {
    const reg = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'CIUser', email: 'ciuser@example.com', password: 'pass1234' })
    })
    console.log('register status', reg.status)
    console.log(await reg.text())
  } catch (e) {
    console.error('register error', e.message)
  }

  try {
    const login = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ciuser@example.com', password: 'pass1234' }),
      redirect: 'manual'
    })
    console.log('login status', login.status)
    console.log('set-cookie header:', login.headers.get('set-cookie'))
    console.log('response text:', await login.text())
  } catch (e) {
    console.error('login error', e.message)
  }
})()
