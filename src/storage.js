// Riwayat foto disimpan lokal di IndexedDB (tidak dikirim ke server)
const DB = 'stamp-cam'
const STORE = 'photos'

const open = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const run = async (mode, fn) => {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => { db.close(); resolve(req?.result) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export const addPhoto = (blob) => run('readwrite', (s) => s.add({ blob, createdAt: Date.now() }))
export const deletePhoto = (id) => run('readwrite', (s) => s.delete(id))
export const listPhotos = async () => ((await run('readonly', (s) => s.getAll())) || []).sort((a, b) => b.createdAt - a.createdAt)

// Bagikan lewat menu share (HP) atau unduh (desktop)
export async function deliver(blob, name) {
  const file = new File([blob], name, { type: blob.type || 'image/png' })
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file] })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
