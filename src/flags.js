import { useEffect, useState } from 'react'

// Safe defaults: used while loading, when offline, or when /api/flags is unavailable (e.g. `vite dev`)
const DEFAULTS = { showButtonFilter: true }
const CACHE_KEY = 'stamp-cam:flags'

const readCache = () => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } } catch { return DEFAULTS }
}

export function useFlags() {
  const [flags, setFlags] = useState(readCache) // last known values, so the PWA behaves offline

  useEffect(() => {
    let dead = false
    fetch('/api/flags')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        if (dead) return
        const next = {}
        for (const k of Object.keys(DEFAULTS)) if (typeof json[k] === 'boolean') next[k] = json[k]
        setFlags((f) => ({ ...f, ...next }))
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)) } catch {}
      })
      .catch(() => {}) // keep cached/default values
    return () => { dead = true }
  }, [])

  return flags
}
