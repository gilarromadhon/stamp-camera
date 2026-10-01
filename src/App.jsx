import { useCallback, useEffect, useRef, useState } from 'react'
import History from './History.jsx'
import { addPhoto, deletePhoto } from './storage.js'

const COLORS = ['#ffffff', '#f7d9d9', '#fff0b3', '#d3ecd9', '#d0e2f7', '#e6d8f5', '#1e1e1e']
const SHOW_DISCARD = false // set true to bring back the ✕ (delete + retake) button
const RATIO = 0.75 // sisi pendek / sisi panjang perangko
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ---------- Perangko: lubang perforasi di tepi ---------- */
function holePath(ctx, w, h, s) {
  const r = 4.2 * s
  const nx = Math.max(4, Math.round(w / (11 * s)))
  const ny = Math.max(4, Math.round(h / (11 * s)))
  ctx.beginPath()
  const dot = (x, y) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2) }
  for (let i = 0; i < nx; i++) { const x = (w * (i + 0.5)) / nx; dot(x, 0); dot(x, h) }
  for (let j = 0; j < ny; j++) { const y = (h * (j + 0.5)) / ny; dot(0, y); dot(w, y) }
}

function perforate(ctx, w, h, s) {
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  holePath(ctx, w, h, s)
  ctx.fill()
  ctx.restore()
}

// Gambar potongan video (crop) ke canvas berbentuk perangko. Ukuran w×h dalam CSS px, s = skala piksel.
function drawStamp(canvas, video, crop, mirror, w, h, s, perf = true) {
  canvas.width = Math.round(w * s)
  canvas.height = Math.round(h * s)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.save()
  if (mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
  ctx.drawImage(video, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height)
  ctx.restore()
  if (perf) perforate(ctx, canvas.width, canvas.height, s)
}

// Hitung area video yang tertutup bingkai perangko (video tampil object-fit: cover).
function getCrop(video, cw, ch, sw, sh, mirror) {
  const vw = video.videoWidth, vh = video.videoHeight
  const k = Math.max(cw / vw, ch / vh)
  const ox = (cw - vw * k) / 2, oy = (ch - vh * k) / 2
  let sx = ((cw - sw) / 2 - ox) / k
  const sy = ((ch - sh) / 2 - oy) / k
  const cwid = sw / k
  if (mirror) sx = vw - (sx + cwid)
  return { sx, sy, sw: cwid, sh: sh / k }
}

/* ---------- Ikon ---------- */
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const PaletteIcon = () => <Icon><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7" r="1" /></Icon>
const FlashIcon = ({ off }) => <Icon><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill={off ? 'none' : 'currentColor'} /></Icon>
const FlipIcon = () => <Icon><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><path d="M9 13a3 3 0 0 1 5-1.5M15 14.5a3 3 0 0 1-5 1.5" /></Icon>
const Shape = ({ tall }) => (
  <svg viewBox="0 0 24 24"><rect x={tall ? 6.5 : 3.5} y={tall ? 3.5 : 6.5} width={tall ? 11 : 17} height={tall ? 17 : 11} rx="2" fill="currentColor" /></svg>
)

export default function App() {
  const bottomRef = useRef(null)
  const videoRef = useRef(null)
  const topCanvas = useRef(null)
  const frameCanvas = useRef(null)
  const holesCanvas = useRef(null)
  const streamRef = useRef(null)

  const [facing, setFacing] = useState('environment')
  const [vertical, setVertical] = useState(false)
  const [bg, setBg] = useState(COLORS[0])
  const [flash, setFlash] = useState(false)
  const [torchOk, setTorchOk] = useState(false)
  const [screenFlash, setScreenFlash] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { stamp, outside } data URL PNG
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [menu, setMenu] = useState(false)
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 1800) }
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(0.62) // skala ukuran perangko (pinch in/out)
  const pointers = useRef(new Map())
  const pinch = useRef(null)

  const mirror = facing === 'user'

  // Ukuran perangko (CSS px)
  const base = Math.min(box.w * 0.66, box.h * 0.78)
  const maxLong = Math.min(box.w * 0.94, box.h * 0.94)
  const long = Math.max(base * 0.3, Math.min(base * zoom, maxLong))
  const sw = Math.round(vertical ? long * RATIO : long)
  const sh = Math.round(vertical ? long : long * RATIO)

  /* Ukur setengah layar bawah */
  useEffect(() => {
    const el = bottomRef.current
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Pinch in/out untuk mengubah ukuran perangko (ctrl + scroll di desktop) */
  const clampZoom = (z) => Math.min(2, Math.max(0.3, z))
  const dist = () => { const [a, b] = [...pointers.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y) }
  const onDown = (e) => {
    if (result) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) pinch.current = { d: dist() || 1, z: zoom }
  }
  const onMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) setZoom(clampZoom((pinch.current.z * dist()) / pinch.current.d))
  }
  const onUp = (e) => { pointers.current.delete(e.pointerId); pinch.current = null }
  useEffect(() => {
    const el = bottomRef.current
    const wheel = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      setZoom((z) => clampZoom(z * Math.exp(-e.deltaY * 0.01)))
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [])

  /* Nyalakan kamera */
  const startCamera = useCallback(async (mode) => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not available. Open this page over HTTPS or localhost.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 3840 }, height: { ideal: 2160 } },
        audio: false,
      })
      streamRef.current = stream
      const track = stream.getVideoTracks()[0]
      setTorchOk(!!track.getCapabilities?.().torch)
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    } catch {
      setError('Camera permission was denied or no camera was found. Allow camera access in your browser settings, then reload.')
    }
  }, [])

  // Kamera hanya menyala saat benar-benar dipakai: mati saat riwayat dibuka atau app di background
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  useEffect(() => {
    const onVis = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const camActive = pageVisible && !showHistory
  useEffect(() => {
    if (!camActive) return
    startCamera(facing)
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [facing, camActive, startCamera])

  /* Mask perangko berwarna latar di atas kamera */
  useEffect(() => {
    const c = frameCanvas.current
    if (!c || !sw) return
    const dpr = window.devicePixelRatio || 1
    c.width = sw * dpr
    c.height = sh * dpr
    const ctx = c.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, c.width, c.height)
    perforate(ctx, c.width, c.height, dpr)
  }, [sw, sh, bg])

  /* Lubang perforasi preview: digambar sekali (warna latar), bukan tiap frame */
  const pd = Math.min(window.devicePixelRatio || 1, 2)
  useEffect(() => {
    const c = holesCanvas.current
    if (!c || !sw) return
    c.width = Math.round(sw * pd)
    c.height = Math.round(sh * pd)
    const ctx = c.getContext('2d')
    ctx.fillStyle = bg
    holePath(ctx, c.width, c.height, pd)
    ctx.fill()
  }, [sw, sh, bg, result, pd])

  /* Preview langsung di layout atas: hanya drawImage per frame video baru */
  useEffect(() => {
    if (result || !sw) return
    const v = videoRef.current
    const c = topCanvas.current
    c.width = Math.round(sw * pd)
    c.height = Math.round(sh * pd)
    const ctx = c.getContext('2d', { alpha: false })
    ctx.imageSmoothingQuality = 'low'
    const useRvfc = 'requestVideoFrameCallback' in v
    let stop = false
    let handle
    const tick = () => {
      if (stop) return
      if (v.videoWidth) {
        const cr = getCrop(v, box.w, box.h, sw, sh, mirror)
        ctx.setTransform(mirror ? -1 : 1, 0, 0, 1, mirror ? c.width : 0, 0)
        ctx.drawImage(v, cr.sx, cr.sy, cr.sw, cr.sh, 0, 0, c.width, c.height)
      }
      handle = useRvfc ? v.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
    }
    tick()
    return () => {
      stop = true
      if (useRvfc) v.cancelVideoFrameCallback?.(handle)
      else cancelAnimationFrame(handle)
    }
  }, [result, box, sw, sh, mirror, pd])

  /* Ambil foto */
  const shoot = async () => {
    const v = videoRef.current
    if (busy || !v.videoWidth) return
    setBusy(true)
    const track = streamRef.current?.getVideoTracks()[0]
    let torchOn = false
    if (flash) {
      if (torchOk && !mirror) {
        try { await track.applyConstraints({ advanced: [{ torch: true }] }); torchOn = true } catch { setScreenFlash(true) }
      } else setScreenFlash(true)
      await sleep(400)
    }
    const crop = getCrop(v, box.w, box.h, sw, sh, mirror)
    const out = document.createElement('canvas')
    drawStamp(out, v, crop, mirror, sw, sh, Math.max(crop.sw / sw, window.devicePixelRatio || 1))

    // Bagian bawah: seluruh frame kamera di luar perangko, area perangko diisi warna latar berperforasi
    const s2 = 1 / Math.max(box.w / v.videoWidth, box.h / v.videoHeight)
    const full = document.createElement('canvas')
    drawStamp(full, v, getCrop(v, box.w, box.h, box.w, box.h, mirror), mirror, box.w, box.h, s2, false)
    const hole = document.createElement('canvas')
    hole.width = Math.round(sw * s2)
    hole.height = Math.round(sh * s2)
    const hctx = hole.getContext('2d')
    hctx.fillStyle = bg
    hctx.fillRect(0, 0, hole.width, hole.height)
    perforate(hctx, hole.width, hole.height, s2)
    full.getContext('2d').drawImage(hole, Math.round(((box.w - sw) / 2) * s2), Math.round(((box.h - sh) / 2) * s2))

    // Gabungan atas-bawah, langsung disimpan ke riwayat
    const W = 1080, H = Math.round(W * (box.h / box.w)), k = W / box.w
    const comp = document.createElement('canvas')
    comp.width = W
    comp.height = H * 2
    const cctx = comp.getContext('2d')
    cctx.imageSmoothingQuality = 'high'
    cctx.fillStyle = bg
    cctx.fillRect(0, 0, W, H)
    cctx.drawImage(out, (W - sw * k) / 2, (H - sh * k) / 2, sw * k, sh * k)
    cctx.drawImage(full, 0, H, W, H)
    let id = null
    try {
      const blob = await new Promise((r) => comp.toBlob(r, 'image/png'))
      id = await addPhoto(blob)
      notify('Saved to history')
    } catch { notify('Could not save to history') }

    setResult({ id, stamp: out.toDataURL('image/png'), outside: full.toDataURL('image/jpeg', 0.95) })
    setMenu(false)
    if (torchOn) track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {})
    setScreenFlash(false)
    setBusy(false)
  }

  const retake = async (remove) => {
    if (remove && result?.id != null) { try { await deletePhoto(result.id) } catch {} }
    setResult(null)
  }

  return (
    <div className="app">
      {/* Layout atas: latar berwarna + perangko */}
      <div className="half top" style={{ background: bg }}>
        {result
          ? <img src={result.stamp} width={sw} height={sh} alt="Stamp photo" />
          : (
            <div className="stamp-live" style={{ width: sw, height: sh }}>
              <canvas ref={topCanvas} />
              <canvas ref={holesCanvas} />
            </div>
          )}
        {!result && <div className="hint" style={{ color: bg === '#1e1e1e' ? 'rgba(255,255,255,.5)' : undefined }}>Pinch the bottom screen to resize</div>}
      </div>

      {/* Layout bawah: kamera + bingkai */}
      <div className="half bottom" ref={bottomRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <video ref={videoRef} className={mirror ? 'mirror' : ''} playsInline muted autoPlay />
        <canvas ref={frameCanvas} className="frame" style={{ width: sw, height: sh }} />
        {result && <img className="outside" src={result.outside} alt="Photo outside the stamp" />}
        {error && <div className="msg">{error}</div>}

        {menu && !result && (
          <div className="menu">
            <div className="menu-row">
              <span className="menu-label">Background color</span>
              <div className="swatches">
                {COLORS.map((c) => (
                  <button key={c} className={'swatch' + (c === bg ? ' sel' : '')} style={{ background: c }} onClick={() => setBg(c)} aria-label={`Color ${c}`} />
                ))}
              </div>
            </div>
            <button className="menu-row menu-item" onClick={() => setVertical((v) => !v)}>
              <Shape tall={!vertical} /><span className="menu-label">Rotate stamp</span><em>{vertical ? 'Vertical' : 'Horizontal'}</em>
            </button>
            <button className="menu-row menu-item" onClick={() => setFlash((f) => !f)}>
              <FlashIcon off={!flash} /><span className="menu-label">Flash</span><em>{flash ? 'On' : 'Off'}</em>
            </button>
            <button className="menu-row menu-item" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}>
              <FlipIcon /><span className="menu-label">Switch camera</span><em>{mirror ? 'Front' : 'Back'}</em>
            </button>
          </div>
        )}

        {result ? (
          <div className="bar result">
            <button className="save" onClick={() => retake(false)}>Retake</button>
            {SHOW_DISCARD && <button className="discard" onClick={() => retake(true)} aria-label="Delete from history and retake">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>}
          </div>
        ) : (
          <div className="bar">
            <button className="btn side start" onClick={() => setShowHistory(true)} aria-label="Photo history">
              <Icon><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Icon>
            </button>
            <button className="shutter" onClick={shoot} disabled={busy || !!error} aria-label="Take photo" />
            <button className={'btn side end' + (menu ? ' on' : '') + (flash && !menu ? ' dot' : '')} onClick={() => setMenu((m) => !m)} aria-label="Settings menu">
              <Icon><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Icon>
            </button>
          </div>
        )}
      </div>

      {screenFlash && <div className="flash" />}
      {toast && <div className="toast">{toast}</div>}
      {showHistory && <History onClose={() => setShowHistory(false)} />}
    </div>
  )
}
