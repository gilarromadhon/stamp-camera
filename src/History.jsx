import { useCallback, useEffect, useState } from 'react'
import { deletePhoto, deliver, listPhotos } from './storage.js'

const LINKEDIN = 'http://linkedin.com/in/gilarromadhon'
const WEBSITE = 'https://www.gilarromadhon.web.id/'

const fmt = (t) => new Date(t).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function History({ onClose }) {
  const [items, setItems] = useState(null)
  const [view, setView] = useState(null)

  const load = useCallback(async () => {
    const rows = await listPhotos().catch(() => [])
    setItems((old) => {
      old?.forEach((i) => URL.revokeObjectURL(i.url))
      return rows.map((r) => ({ ...r, url: URL.createObjectURL(r.blob) }))
    })
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => () => items?.forEach((i) => URL.revokeObjectURL(i.url)), []) // eslint-disable-line

  const remove = async (id) => {
    await deletePhoto(id)
    setView(null)
    load()
  }
  const send = (item) => deliver(item.blob, `stamp-${item.createdAt}.png`).catch(() => {})

  const current = items?.find((i) => i.id === view)

  return (
    <div className="hist">
      <div className="hist-head">
        <button className="hist-close" onClick={current ? () => setView(null) : onClose} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span>{current ? fmt(current.createdAt) : 'Photo history'}</span>
      </div>

      {current ? (
        <div className="hist-view">
          <img src={current.url} alt="Saved photo" />
          <div className="hist-actions">
            <button className="save" onClick={() => send(current)}>Save to device</button>
            <button className="hist-del" onClick={() => remove(current.id)}>Delete</button>
          </div>
        </div>
      ) : items && items.length === 0 ? (
        <p className="hist-empty">No photos yet. Photos you take appear here and are stored only in this browser.</p>
      ) : (
        <div className="hist-grid">
          {items?.map((i) => (
            <button key={i.id} className="hist-item" onClick={() => setView(i.id)}>
              <img src={i.url} alt={fmt(i.createdAt)} loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {!current && (
        <footer className="hist-foot">
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" /></svg>
          </a>
          <a href={WEBSITE} target="_blank" rel="noopener noreferrer" aria-label="Website">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" /></svg>
          </a>
        </footer>
      )}
    </div>
  )
}
