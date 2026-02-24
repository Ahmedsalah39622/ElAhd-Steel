// scripts/e2e-wallet.js
// Node script to run E2E scenario using fetch
const fetch =
  globalThis.fetch ||
  (async () => {
    throw new Error('No fetch available in this Node runtime')
  })()

const BASE = 'http://localhost:3000'
const user = { name: 'E2E Tester', email: 'e2e@test.local', password: 'Password123!' }

async function register() {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  })
  const text = await res.text()

  try {
    return { res, data: JSON.parse(text) }
  } catch (e) {
    return { res, data: text }
  }
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password })
  })
  const setCookie = res.headers.get('set-cookie') || ''

  console.log('Set-Cookie header:', setCookie)
  const body = await res.json()

  // token is in cookie; also can use JWT by extracting cookie
  const token = (setCookie.match(/token=([^;]+)/) || [])[1]

  return { res, body, token }
}

async function createWallet(token) {
  const res = await fetch(`${BASE}/api/wallets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
    body: JSON.stringify({ name: 'E2E Wallet', allowMainSafeWithdraw: true })
  })
  const text = await res.text()

  try {
    return JSON.parse(text)
  } catch (e) {
    return { status: res.status, text }
  }
}

async function getWallets(token) {
  const res = await fetch(`${BASE}/api/wallets`, { headers: { Cookie: `token=${token}` } })

  return await res.json()
}

async function deposit(token, walletId) {
  const res = await fetch(`${BASE}/api/wallets/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
    body: JSON.stringify({ walletId, amount: 1000, description: 'E2E deposit', password: user.password })
  })

  return await res.json()
}

async function getSafes() {
  const res = await fetch(`${BASE}/api/safes`)

  return await res.json()
}

async function transferToMain(token, walletId, mainSafeId) {
  const res = await fetch(`${BASE}/api/wallets/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
    body: JSON.stringify({
      fromWalletId: walletId,
      toSafeId: mainSafeId,
      amount: 500,
      password: user.password,
      description: 'E2E transfer'
    })
  })

  return await res.json()
}

async function getTxs(token, walletId) {
  const res = await fetch(`${BASE}/api/wallets/${walletId}/transactions`, { headers: { Cookie: `token=${token}` } })

  return await res.json()
}

async function getClientsPool(token) {
  const res = await fetch(`${BASE}/api/wallets/clients-pool`, { headers: { Authorization: `Bearer ${token}` } })

  return await res.json()
}

async function run() {
  console.log('Registering test user...')
  const reg = await register()

  console.log('Register response:', reg.data)

  console.log('Logging in...')
  const li = await login()

  console.log('Login body:', li.body)
  const token = li.token

  console.log('Extracted token:', token)

  if (!token) {
    console.error('No token returned by login (Set-Cookie missing)')
    process.exit(1)
  }

  console.log('Creating wallet...')
  const cw = await createWallet(token)

  console.log('Create wallet:', cw)

  console.log('Get wallets...')
  const wallets = await getWallets(token)

  console.log('Wallets:', wallets)
  const w = wallets[0]

  if (!w) return console.error('No wallet found after creation')

  console.log('Deposit to wallet...')
  const d = await deposit(token, w.id)

  console.log('Deposit result:', d)

  console.log('Get safes...')
  const safes = await getSafes()

  console.log('Safes:', safes)
  const main = safes.find(s => s.isDefault)

  if (!main) return console.error('No main safe found')

  console.log('Transfer to main safe...')
  const tr = await transferToMain(token, w.id, main.id)

  console.log('Transfer result:', tr)

  console.log('Get wallet transactions...')
  const txs = await getTxs(token, w.id)

  console.log('Transactions:', txs)

  console.log('Get clients pool...')
  const pool = await getClientsPool(token)

  console.log('Clients pool:', pool)
}

run().catch(err => {
  console.error('E2E script error:', err)
  process.exit(1)
})
