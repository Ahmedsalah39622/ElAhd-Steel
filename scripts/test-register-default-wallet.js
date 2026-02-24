;(async () => {
  const fetch = globalThis.fetch || (await import('node-fetch')).default
  const ts = Date.now()
  const email = `autotest+${ts}@test.local`
  const BASE = 'http://localhost:3000'
  const user = { name: 'AutoTest', email, password: 'Pass123!' }

  console.log('Registering', email)
  let res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
  console.log('Register status', res.status, await res.text())

  console.log('Logging in...')
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: user.password })
  })
  const setCookie = res.headers.get('set-cookie') || ''
  console.log('Login set-cookie:', setCookie)
  const token = (setCookie.match(/token=([^;]+)/) || [])[1]

  console.log('Fetching wallets...')
  res = await fetch(`${BASE}/api/wallets`, { headers: token ? { Cookie: `token=${token}` } : {} })
  const wallets = await res.json()
  console.log('Wallets status', res.status)
  console.log(JSON.stringify(wallets, null, 2))
})().catch(err => {
  console.error('Test script error:', err)
  process.exit(1)
})
