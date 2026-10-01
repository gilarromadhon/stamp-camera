// Pixel-based photo filters. Done on ImageData (not ctx.filter) so it works on iOS Safari too.
export const FILTERS = [
  { id: 'original', name: 'Original' },
  { id: 'mono', name: 'Mono', gray: 1, contrast: 1.08 },
  { id: 'noir', name: 'Noir', gray: 1, contrast: 1.5, brightness: 0.94 },
  { id: 'sepia', name: 'Sepia', sepia: 1 },
  { id: 'vintage', name: 'Vintage', sepia: 0.4, saturate: 0.85, contrast: 0.92, brightness: 1.05, tint: [1.05, 1, 0.9] },
  { id: 'warm', name: 'Warm', saturate: 1.1, tint: [1.09, 1.02, 0.88] },
  { id: 'cool', name: 'Cool', tint: [0.9, 1, 1.12] },
  { id: 'vivid', name: 'Vivid', saturate: 1.5, contrast: 1.12 },
  { id: 'fade', name: 'Fade', saturate: 0.85, contrast: 0.84, brightness: 1.06, lift: 26 },
  { id: 'drama', name: 'Drama', saturate: 0.8, contrast: 1.38, brightness: 0.95 },
]

function run(data, f) {
  const { gray = 0, sepia = 0, saturate = 1, contrast = 1, brightness = 1, lift = 0, tint = [1, 1, 1] } = f
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2]
    if (saturate !== 1) {
      const l = 0.299 * r + 0.587 * g + 0.114 * b
      r = l + (r - l) * saturate; g = l + (g - l) * saturate; b = l + (b - l) * saturate
    }
    if (gray) {
      const l = 0.299 * r + 0.587 * g + 0.114 * b
      r += (l - r) * gray; g += (l - g) * gray; b += (l - b) * gray
    }
    if (sepia) {
      const sr = 0.393 * r + 0.769 * g + 0.189 * b
      const sg = 0.349 * r + 0.686 * g + 0.168 * b
      const sb = 0.272 * r + 0.534 * g + 0.131 * b
      r += (sr - r) * sepia; g += (sg - g) * sepia; b += (sb - b) * sepia
    }
    r *= tint[0] * brightness; g *= tint[1] * brightness; b *= tint[2] * brightness
    if (contrast !== 1) { r = (r - 128) * contrast + 128; g = (g - 128) * contrast + 128; b = (b - 128) * contrast + 128 }
    if (lift) { const k = 1 - lift / 255; r = r * k + lift; g = g * k + lift; b = b * k + lift }
    data[i] = r; data[i + 1] = g; data[i + 2] = b // Uint8ClampedArray clamps
  }
}

// Full-size filtered canvas from a loaded <img>
export function renderFiltered(img, id) {
  const f = FILTERS.find((x) => x.id === id) || FILTERS[0]
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  if (f.id !== 'original') {
    const d = ctx.getImageData(0, 0, c.width, c.height)
    run(d.data, f)
    ctx.putImageData(d, 0, 0)
  }
  return c
}

// Small preview chip (cover-cropped)
export function thumbnail(img, id, w = 60, h = 80) {
  const f = FILTERS.find((x) => x.id === id) || FILTERS[0]
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / k, sh = h / k
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h)
  if (f.id !== 'original') {
    const d = ctx.getImageData(0, 0, w, h)
    run(d.data, f)
    ctx.putImageData(d, 0, 0)
  }
  return c.toDataURL('image/jpeg', 0.8)
}
