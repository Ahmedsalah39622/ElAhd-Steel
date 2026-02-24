import modelsModule from '../../models'

let cachedDb = null
let isAuthenticated = false

// Returns the initialized Sequelize instance and all models exported by models/index.js
export async function initializeDatabase() {
  console.log('[db] initializing database models...')
  // Return cached connection if already authenticated
  if (cachedDb && isAuthenticated) {
    return cachedDb
  }

  // models/index.js exposes `getDb` which initializes and returns the db object
  const dbModels = await modelsModule.getDb()

  // Only authenticate once
  if (!isAuthenticated) {
    // Retry authenticate for transient network errors (ETIMEDOUT, ECONNRESET, etc.)
    const maxAttempts = 3
    let attempt = 0
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

    while (!isAuthenticated) {
      attempt += 1
      try {
        await dbModels.sequelize.authenticate()
        isAuthenticated = true
        break
      } catch (err) {
        console.error(`[db] sequelize.authenticate() attempt ${attempt} failed:`, err && err.message ? err.message : err)
        if (attempt >= maxAttempts) {
          // rethrow the last error after exhausting attempts
          throw err
        }
        // exponential backoff
        const waitMs = 500 * Math.pow(2, attempt - 1)
        await delay(waitMs)
      }
    }
  }

  cachedDb = dbModels
  return cachedDb
}

// also provide CommonJS fallback for require() users
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeDatabase }
}
