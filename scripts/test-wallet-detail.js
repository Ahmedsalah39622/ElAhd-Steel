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
  console.log('Register status', res.status)

  console.log('Logging in...')
  res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: user.password })
  })
  const setCookie = res.headers.get('set-cookie') || ''
  const token = (setCookie.match(/token=([^;]+)/) || [])[1]
  console.log('Got token cookie?', !!token)

  console.log('Fetching wallets list...')
  res = await fetch(`${BASE}/api/wallets`, { headers: token ? { Cookie: `token=${token}` } : {} })
  const wallets = await res.json()
  console.log('Wallets status', res.status)
  console.log(JSON.stringify(wallets, null, 2))
  const w = wallets && wallets[0]
  if (!w) return console.error('No wallet found to test')

  console.log('Fetching wallet detail for id', w.id)
  res = await fetch(`${BASE}/api/wallets/${w.id}`, { headers: token ? { Cookie: `token=${token}` } : {} })
  console.log('Detail status', res.status)
  const body = await res.json()
  console.log('Detail body:', JSON.stringify(body, null, 2))
})().catch(err => {
  console.error('Test error:', err)
  process.exit(1)
})
