import { useCallback, useEffect, useRef, useState } from 'react'
import { deletePhoto, deliver, listPhotos } from './storage.js'
import { FILTERS, renderFiltered, thumbnail } from './filters.js'

const WEBSITE = 'https://www.gilarromadhon.web.id/'

const fmt = (t) => new Date(t).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function History({ onClose }) {
  const [items, setItems] = useState(null)
  const [view, setView] = useState(null)
  const [atBottom, setAtBottom] = useState(false)
  const [dir, setDir] = useState(0) // swipe direction for the slide-in animation
  const touch = useRef(null)
  const [ratios, setRatios] = useState({}) // id -> height / width, so each tile reserves its exact space
  const gridRef = useRef(null)
  const [filter, setFilter] = useState('original')
  const [srcImg, setSrcImg] = useState(null) // decoded <img> of the open photo
  const [thumbs, setThumbs] = useState({})
  const [edit, setEdit] = useState(null) // { canvas, url } for the active filter
  const [showFilters, setShowFilters] = useState(false)

  const onScroll = (e) => {
    const el = e.currentTarget
    setAtBottom(el.scrollTop > 0 && el.scrollTop + el.clientHeight >= el.scrollHeight - 8)
  }
  const toTop = () => gridRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  useEffect(() => setAtBottom(false), [view])

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
    const i = items.findIndex((x) => x.id === id)
    const next = items[i + 1] ?? items[i - 1] ?? null
    await deletePhoto(id)
    setDir(0)
    setView(next ? next.id : null)
    load()
  }
  const send = (item) => deliver(item.blob, `stamp-${item.createdAt}.png`).catch(() => {})

  const idx = items ? items.findIndex((i) => i.id === view) : -1
  const current = idx >= 0 ? items[idx] : null

  // dir: +1 = next (older photo), -1 = previous (newer photo)
  const go = useCallback((d) => {
    if (!items || idx < 0) return
    const n = items[idx + d]
    if (!n) return
    setDir(d)
    setView(n.id)
  }, [items, idx])

  const onTouchStart = (e) => { touch.current = { x: e.clientX, y: e.clientY } }
  const onTouchEnd = (e) => {
    const t = touch.current
    touch.current = null
    if (!t) return
    const dx = e.clientX - t.x
    const dy = e.clientY - t.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
  }

  useEffect(() => {
    if (!current) return
    const key = (e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1) }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [current, go])

  /* Filters: reset + decode the photo whenever a different one is opened */
  useEffect(() => {
    setFilter('original')
    setSrcImg(null)
    setThumbs({})
    if (!current) return
    let dead = false
    const img = new Image()
    img.onload = () => {
      if (dead) return
      setSrcImg(img)
      setThumbs(Object.fromEntries(FILTERS.map((f) => [f.id, thumbnail(img, f.id)])))
    }
    img.src = current.url
    return () => { dead = true }
  }, [current?.id]) // eslint-disable-line

  /* Apply the selected filter (full resolution, shown as preview) */
  useEffect(() => {
    if (!srcImg || filter === 'original') { setEdit(null); return }
    let dead = false
    const canvas = renderFiltered(srcImg, filter)
    canvas.toBlob((blob) => {
      if (dead || !blob) return
      setEdit((old) => { if (old) URL.revokeObjectURL(old.url); return { canvas, url: URL.createObjectURL(blob) } })
    }, 'image/jpeg', 0.92)
    return () => { dead = true }
  }, [srcImg, filter])
  useEffect(() => () => { if (edit) URL.revokeObjectURL(edit.url) }, [edit])

  const filteredBlob = () => new Promise((r) => edit.canvas.toBlob(r, 'image/png'))
  const sendCurrent = async () => {
    if (!edit) return send(current)
    deliver(await filteredBlob(), `stamp-${current.createdAt}-${filter}.png`).catch(() => {})
  }

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
          <div
            className="hist-stage"
            onPointerDown={onTouchStart}
            onPointerUp={onTouchEnd}
            onPointerCancel={() => { touch.current = null }}
          >
            <img
              key={current.id}
              className={dir > 0 ? 'slide-next' : dir < 0 ? 'slide-prev' : ''}
              src={edit?.url ?? current.url}
              alt="Saved photo"
              draggable={false}
            />
          </div>
          {showFilters && (
          <div className="hist-filters" role="listbox" aria-label="Filters">
            {FILTERS.map((f) => (
              <button key={f.id} className={'hist-filter' + (f.id === filter ? ' sel' : '')} onClick={() => setFilter(f.id)} disabled={!srcImg}>
                {thumbs[f.id] ? <img src={thumbs[f.id]} alt="" draggable={false} /> : <span className="ph" />}
                <span>{f.name}</span>
              </button>
            ))}
          </div>
          )}
          <div className="hist-actions">
            <button
              className={'hist-icon' + (showFilters ? ' on' : '') + (filter !== 'original' && !showFilters ? ' dot' : '')}
              onClick={() => setShowFilters((v) => !v)}
              aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              aria-expanded={showFilters}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="5" /><circle cx="15" cy="9" r="5" /><circle cx="12" cy="15" r="5" /></svg>
            </button>
            <button className="hist-icon" onClick={sendCurrent} aria-label="Save to device">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" /></svg>
            </button>
            <button className="hist-icon" onClick={() => remove(current.id)} aria-label="Delete photo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
            </button>
          </div>
        </div>
      ) : items && items.length === 0 ? (
        <p className="hist-empty">No photos yet. Photos you take appear here and are stored only in this browser.</p>
      ) : (
        <div className="hist-grid" ref={gridRef} onScroll={onScroll}>
          {items?.map((i) => (
            <button
              key={i.id}
              className="hist-item"
              style={{ aspectRatio: `1 / ${ratios[i.id] || 2.1}` }}
              onClick={() => setView(i.id)}
            >
              <img
                src={i.url}
                alt={fmt(i.createdAt)}
                decoding="async"
                onLoad={(e) => {
                  const r = e.currentTarget.naturalHeight / e.currentTarget.naturalWidth
                  if (r) setRatios((m) => (m[i.id] === r ? m : { ...m, [i.id]: r }))
                }}
              />
            </button>
          ))}
        </div>
      )}
      {!current && atBottom && (
        <button className="hist-top" onClick={toTop} aria-label="Scroll to top">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
        </button>
      )}
      {!current && (
        <footer className="hist-foot">
          <span>© 2026 . All rights reserved.</span>
          <a href={WEBSITE} target="_blank" rel="noopener noreferrer" aria-label="Website">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" /></svg>
          </a>
        </footer>
      )}
    </div>
  )
}
