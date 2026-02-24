'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Hydrate from localStorage immediately for faster UX
    // Skip the /api/auth/me check since cookies don't work reliably
    try {
      const saved = localStorage.getItem('auth_user')

      if (saved) setUser(JSON.parse(saved))
    } catch (e) {
      // ignore
    }

    setInitialized(true)
  }, [])

  useEffect(() => {
    try {
      if (user) localStorage.setItem('auth_user', JSON.stringify(user))
      else localStorage.removeItem('auth_user')
    } catch (e) {
      // ignore
    }
  }, [user])

  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const contentType = res.headers.get('content-type') || ''
      let data = null

      if (contentType.includes('application/json')) data = await res.json()
      else data = { error: await res.text() }

      if (!res.ok) throw new Error(data.error || 'Login failed')

      // server returns user object
      const user = data
      setUser(user)

      return user
    } catch (e) {
      console.error('login error', e)
      throw e
    }
  }, [])

  const register = useCallback(async ({ name, email, password }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const contentType = res.headers.get('content-type') || ''
      let data = null

      if (contentType.includes('application/json')) data = await res.json()
      else data = { error: await res.text() }

      if (!res.ok) throw new Error(data.error || 'Registration failed')

      setUser(data)

      return data
    } catch (e) {
      console.error('register error', e)
      throw e
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (e) {
      // ignore server-side logout errors
    }

    // clear client state
    setUser(null)

    try {
      localStorage.removeItem('auth_user')
    } catch (e) {
      // ignore
    }

    // clear JS-accessible cookies
    try {
      if (typeof document !== 'undefined' && document.cookie) {
        document.cookie.split(';').forEach(c => {
          const eqPos = c.indexOf('=')
          const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim()

          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
        })
      }
    } catch (e) {
      // ignore
    }

    // clear sessionStorage
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
    } catch (e) {
      // ignore
    }

    // clear service worker / CacheStorage caches
    try {
      if (typeof caches !== 'undefined') {
        caches
          .keys()
          .then(keys => Promise.all(keys.map(k => caches.delete(k))))
          .catch(() => {})
      }
    } catch (e) {
      // ignore
    }

    // attempt to delete IndexedDB databases (may be experimental in some browsers)
    try {
      if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
        indexedDB
          .databases()
          .then(dbs => {
            dbs.forEach(db => {
              try {
                indexedDB.deleteDatabase(db.name)
              } catch (err) {
                // ignore
              }
            })
          })
          .catch(() => {})
      }
    } catch (e) {
      // ignore
    }

    // navigate to login and replace history so back-button won't return
    try {
      if (typeof window !== 'undefined') {
        // use location.replace for a hard navigation and history replacement
        window.location.replace('/login')
      } else {
        router.push('/login')
      }
    } catch (e) {
      // ignore navigation errors
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    // استدعي API لتحديث بيانات المستخدم من قاعدة البيانات
    try {
      const res = await fetch('/api/auth/refresh-user', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (res.ok) {
        const { user: updatedUser } = await res.json()
        setUser(updatedUser)
        return updatedUser
      } else {
        // في حالة فشل API، ارجع للـ localStorage
        const saved = localStorage.getItem('auth_user')
        if (saved) {
          const data = JSON.parse(saved)
          setUser(data)
          return data
        }
      }
    } catch (e) {
      console.error('Error refreshing user:', e)
      // في حالة الخطأ، ارجع للـ localStorage
      try {
        const saved = localStorage.getItem('auth_user')
        if (saved) {
          const data = JSON.parse(saved)
          setUser(data)
          return data
        }
      } catch (e) {
        // ignore
      }
    }
    return null
  }, [])

  const resetPassword = useCallback(async ({ email }) => {
    return { ok: true }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, initialized, login, logout, register, resetPassword, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)

  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')

  return ctx
}

export default AuthContext
