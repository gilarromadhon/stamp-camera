import { useEffect, useRef, useState } from 'react'

/* ---------- Cosmic illustrations (SVG, grainy gradients) ---------- */
function Defs() {
  return (
    <defs>
      {/* sparse light speckle = the grainy texture */}
      <filter id="grain" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="7" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.4 -1.2" result="speck" />
        <feComposite in="speck" in2="SourceAlpha" operator="in" result="s" />
        <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="s" /></feMerge>
      </filter>
      <radialGradient id="gSun" cx=".4" cy=".35" r=".75">
        <stop offset="0" stopColor="#ffe11a" /><stop offset=".55" stopColor="#ffbd00" /><stop offset="1" stopColor="#ff5a2a" />
      </radialGradient>
      <radialGradient id="gBlue" cx=".35" cy=".3" r=".8">
        <stop offset="0" stopColor="#d7c9ff" /><stop offset=".45" stopColor="#6d80ff" /><stop offset="1" stopColor="#2c55f0" />
      </radialGradient>
      <radialGradient id="gLav" cx=".4" cy=".3" r=".8">
        <stop offset="0" stopColor="#e6d2ff" /><stop offset=".55" stopColor="#ffd34a" /><stop offset="1" stopColor="#ffa21a" />
      </radialGradient>
      <radialGradient id="gOrange" cx=".35" cy=".3" r=".8">
        <stop offset="0" stopColor="#ffb02e" /><stop offset="1" stopColor="#f2461a" />
      </radialGradient>
      <linearGradient id="gRim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffd400" /><stop offset="1" stopColor="#ff4d2e" />
      </linearGradient>
      <linearGradient id="gBlade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7a86ff" /><stop offset=".5" stopColor="#a58bd8" /><stop offset="1" stopColor="#f08fb0" />
      </linearGradient>
      <linearGradient id="gCone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4264c4" /><stop offset=".6" stopColor="#1d3277" /><stop offset="1" stopColor="#16245a" />
      </linearGradient>
      <linearGradient id="gBase" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ff7a18" /><stop offset=".55" stopColor="#b9a0ff" /><stop offset="1" stopColor="#7f8cff" />
      </linearGradient>
      <linearGradient id="gRing" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3b63ff" /><stop offset=".5" stopColor="#ffd21a" /><stop offset="1" stopColor="#ff5a2a" />
      </linearGradient>
    </defs>
  )
}

const Sparkle = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r="9" fill="#fff" opacity=".18" />
    <path d="M0 -17 L2.6 -2.6 L17 0 L2.6 2.6 L0 17 L-2.6 2.6 L-17 0 L-2.6 -2.6Z" fill="#fff" />
  </g>
)

const ArtUrl = () => (
  /* Browser window + address bar + globe + cursor  ->  "Just Open the URL" */
  <svg viewBox="0 0 320 360" aria-hidden="true">
    <Defs />
    <g filter="url(#grain)">
      <rect x="36" y="64" width="248" height="204" rx="24" fill="url(#gCone)" />
      <path d="M36 88 a24 24 0 0 1 24 -24 h200 a24 24 0 0 1 24 24 v26 H36Z" fill="#5a78d6" />
      <circle cx="62" cy="89" r="6" fill="url(#gOrange)" />
      <circle cx="82" cy="89" r="6" fill="#ffd21a" />
      <circle cx="102" cy="89" r="6" fill="#8c9bff" />
      <rect x="122" y="76" width="140" height="26" rx="13" fill="#fff" fillOpacity=".22" />
      <circle cx="160" cy="196" r="52" fill="url(#gBlue)" />
      <circle cx="60" cy="240" r="13" fill="url(#gOrange)" />
    </g>
    <rect x="122" y="76" width="140" height="26" rx="13" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
    <circle cx="138" cy="89" r="6" fill="none" stroke="#fff" strokeWidth="1.8" />
    <path d="M132 89h12M138 83c3 3 3 9 0 12M138 83c-3 3-3 9 0 12" fill="none" stroke="#fff" strokeWidth="1.3" />
    <rect x="152" y="86" width="86" height="6" rx="3" fill="#fff" fillOpacity=".8" />
    <ellipse cx="160" cy="196" rx="78" ry="16" transform="rotate(-14 160 196)" fill="none" stroke="#fff" strokeWidth="2" />
    <g transform="translate(196 206)">
      <path d="M0 0 L0 38 L10 29 L18 46 L26 42 L18 26 L31 26Z" fill="#fff" stroke="#141418" strokeWidth="3" strokeLinejoin="round" />
    </g>
    <Sparkle x={262} y={44} />
    <circle cx="40" cy="48" r="9" fill="#fff" />
    <circle cx="270" cy="300" r="12" fill="#fff" />
    <ellipse cx="160" cy="312" rx="100" ry="13" fill="none" stroke="#fff" strokeWidth="2" />
    <ellipse cx="160" cy="338" rx="62" ry="8" fill="none" stroke="#fff" strokeWidth="2" />
  </svg>
)

const ArtServer = () => (
  /* Phone with lock + crossed-out cloud  ->  "No Server Storage" */
  <svg viewBox="0 0 320 360" aria-hidden="true">
    <Defs />
    <g filter="url(#grain)">
      <rect x="92" y="62" width="136" height="236" rx="30" fill="url(#gCone)" />
      <rect x="92" y="62" width="136" height="236" rx="30" fill="none" stroke="url(#gBase)" strokeWidth="8" />
      <rect x="136" y="76" width="48" height="10" rx="5" fill="#0d1535" />
      <rect x="130" y="176" width="60" height="50" rx="12" fill="url(#gSun)" />
      <circle cx="262" cy="210" r="14" fill="url(#gBlue)" />
      <circle cx="46" cy="250" r="13" fill="url(#gOrange)" />
    </g>
    <path d="M142 178 v-14 a18 18 0 0 1 36 0 v14" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
    <circle cx="160" cy="198" r="6" fill="#7a2a0a" />
    <rect x="157" y="200" width="6" height="13" rx="3" fill="#7a2a0a" />
    <g transform="translate(244 74)">
      <path d="M-34 16 A15 15 0 0 1 -30 -14 A22 22 0 0 1 12 -22 A17 17 0 0 1 34 4 A13 13 0 0 1 26 16Z" fill="#141418" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M-30 30 L30 -34" stroke="url(#gRim)" strokeWidth="7" strokeLinecap="round" />
    </g>
    <Sparkle x={52} y={96} />
    <circle cx="268" cy="150" r="9" fill="#fff" />
    <circle cx="70" cy="190" r="10" fill="#fff" />
    <ellipse cx="160" cy="320" rx="104" ry="13" fill="none" stroke="#fff" strokeWidth="2" />
    <ellipse cx="160" cy="344" rx="62" ry="8" fill="none" stroke="#fff" strokeWidth="2" />
  </svg>
)

const ArtStamp = () => (
  /* Live shot becomes a perforated stamp instantly  ->  "Instant Stamp Photos" */
  <svg viewBox="0 0 320 360" aria-hidden="true">
    <Defs />
    <defs>
      <mask id="mStamp" maskUnits="userSpaceOnUse" x="54" y="26" width="212" height="224">
        <rect x="54" y="26" width="212" height="224" fill="#fff" />
        <g fill="#000"><circle cx="73.2" cy="38.0" r="6"/><circle cx="73.2" cy="238.0" r="6"/><circle cx="87.7" cy="38.0" r="6"/><circle cx="87.7" cy="238.0" r="6"/><circle cx="102.2" cy="38.0" r="6"/><circle cx="102.2" cy="238.0" r="6"/><circle cx="116.6" cy="38.0" r="6"/><circle cx="116.6" cy="238.0" r="6"/><circle cx="131.1" cy="38.0" r="6"/><circle cx="131.1" cy="238.0" r="6"/><circle cx="145.5" cy="38.0" r="6"/><circle cx="145.5" cy="238.0" r="6"/><circle cx="160.0" cy="38.0" r="6"/><circle cx="160.0" cy="238.0" r="6"/><circle cx="174.5" cy="38.0" r="6"/><circle cx="174.5" cy="238.0" r="6"/><circle cx="188.9" cy="38.0" r="6"/><circle cx="188.9" cy="238.0" r="6"/><circle cx="203.4" cy="38.0" r="6"/><circle cx="203.4" cy="238.0" r="6"/><circle cx="217.8" cy="38.0" r="6"/><circle cx="217.8" cy="238.0" r="6"/><circle cx="232.3" cy="38.0" r="6"/><circle cx="232.3" cy="238.0" r="6"/><circle cx="246.8" cy="38.0" r="6"/><circle cx="246.8" cy="238.0" r="6"/><circle cx="66.0" cy="45.7" r="6"/><circle cx="254.0" cy="45.7" r="6"/><circle cx="66.0" cy="61.1" r="6"/><circle cx="254.0" cy="61.1" r="6"/><circle cx="66.0" cy="76.5" r="6"/><circle cx="254.0" cy="76.5" r="6"/><circle cx="66.0" cy="91.8" r="6"/><circle cx="254.0" cy="91.8" r="6"/><circle cx="66.0" cy="107.2" r="6"/><circle cx="254.0" cy="107.2" r="6"/><circle cx="66.0" cy="122.6" r="6"/><circle cx="254.0" cy="122.6" r="6"/><circle cx="66.0" cy="138.0" r="6"/><circle cx="254.0" cy="138.0" r="6"/><circle cx="66.0" cy="153.4" r="6"/><circle cx="254.0" cy="153.4" r="6"/><circle cx="66.0" cy="168.8" r="6"/><circle cx="254.0" cy="168.8" r="6"/><circle cx="66.0" cy="184.2" r="6"/><circle cx="254.0" cy="184.2" r="6"/><circle cx="66.0" cy="199.5" r="6"/><circle cx="254.0" cy="199.5" r="6"/><circle cx="66.0" cy="214.9" r="6"/><circle cx="254.0" cy="214.9" r="6"/><circle cx="66.0" cy="230.3" r="6"/><circle cx="254.0" cy="230.3" r="6"/></g>
      </mask>
    </defs>
    <g transform="rotate(-4 160 138)">
      <g mask="url(#mStamp)">
        <g filter="url(#grain)">
          <rect x="66" y="38" width="188" height="200" fill="url(#gCone)" />
          <path d="M66 96 C 104 50 150 130 206 80 S 250 70 254 100 L254 128 C 230 108 190 160 140 128 S 90 104 66 140Z" fill="#5dffae" opacity=".5" />
          <circle cx="206" cy="86" r="22" fill="url(#gSun)" />
          <polygon points="66,238 66,170 108,128 140,156 178,100 218,150 236,136 254,162 254,238" fill="#dbe7f3" />
          <polygon points="178,100 218,150 196,176 164,140" fill="#9fb3c8" />
          <rect x="66" y="204" width="188" height="34" fill="#0e2a33" />
        </g>
      </g>
    </g>
    <Sparkle x={262} y={50} />
    <circle cx="44" cy="70" r="9" fill="#fff" />
    <path d="M160 246 v14" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 8" />
    <g filter="url(#grain)">
      <circle cx="160" cy="304" r="44" fill="#2b2b33" />
    </g>
    <circle cx="160" cy="304" r="44" fill="none" stroke="#fff" strokeWidth="6" />
    <circle cx="160" cy="304" r="31" fill="url(#gSun)" />
    <path d="M214 288 l10 -14 M222 306 h16 M214 324 l10 14" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M106 288 l-10 -14 M98 306 h-16 M106 324 l-10 14" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="276" cy="196" r="12" fill="#fff" />
    <circle cx="40" cy="250" r="13" fill="url(#gOrange)" />
  </svg>
)

const STEPS = [
  { title: 'Instant Stamp Photos', text: 'Point, shoot, done. Your photo becomes a stamp instantly, no editing needed.', art: <ArtStamp /> },
  { title: 'Just Open the URL', text: 'No install needed. Open the link in your browser and start taking stamp photos right away.', art: <ArtUrl /> },
  { title: 'No Server Storage', text: 'Your photos stay on your device. Nothing is uploaded and you can delete them anytime', art: <ArtServer /> },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const touch = useRef(null)
  const last = step === STEPS.length - 1
  const go = (d) => setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + d)))

  useEffect(() => {
    const key = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  return (
    <div className="ob" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="ob-dots" role="tablist" aria-label="Steps">
        {STEPS.map((_, i) => (
          <button key={i} className={'ob-dot' + (i === step ? ' on' : '')} onClick={() => setStep(i)} role="tab" aria-selected={i === step} aria-label={`Step ${i + 1}`} />
        ))}
      </div>

      <div
        className="ob-viewport"
        onPointerDown={(e) => { touch.current = { x: e.clientX, y: e.clientY } }}
        onPointerUp={(e) => {
          const t = touch.current
          touch.current = null
          if (!t) return
          const dx = e.clientX - t.x, dy = e.clientY - t.y
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
        }}
        onPointerCancel={() => { touch.current = null }}
      >
        <div className="ob-track" style={{ transform: `translateX(${-step * 100}%)` }}>
          {STEPS.map((s, i) => (
            <section className="ob-slide" key={s.title} aria-hidden={i !== step}>
              <div className="ob-art">{s.art}</div>
              <h1>{s.title}</h1>
              <p>{s.text}</p>
            </section>
          ))}
        </div>
      </div>

      <div className="ob-bottom">
        <button className="ob-btn" onClick={() => (last ? onDone() : go(1))}>{last ? 'Start' : 'Next'}</button>
      </div>
    </div>
  )
}
