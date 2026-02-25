// Pure Node.js PNG generator — no external deps.
// Produces a simple icon for each required PWA size.
import { createWriteStream, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'

// --- Minimal PNG encoder ---
function u32be(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n)
  return b
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.concat([typeBytes, data])
  let crc = 0xffffffff
  const table = makeCrcTable()
  for (let i = 0; i < crcBuf.length; i++) {
    crc = table[(crc ^ crcBuf[i]) & 0xff] ^ (crc >>> 8)
  }
  crc = (crc ^ 0xffffffff) >>> 0
  return Buffer.concat([u32be(data.length), typeBytes, data, u32be(crc)])
}

let _crcTable = null
function makeCrcTable() {
  if (_crcTable) return _crcTable
  _crcTable = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1)
    _crcTable[i] = c
  }
  return _crcTable
}

function encodePng(pixels, width, height) {
  // pixels: Uint8Array of RGBA, row-major
  const sig = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdr = pngChunk('IHDR', Buffer.concat([
    u32be(width), u32be(height),
    Buffer.from([8, 2, 0, 0, 0]) // 8-bit RGB, no alpha, no filter, no interlace
  ]))

  // Build raw rows (filter byte 0 + RGB data)
  const rowSize = width * 3
  const raw = Buffer.alloc((rowSize + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4
      const dst = y * (rowSize + 1) + 1 + x * 3
      raw[dst] = pixels[src]     // R
      raw[dst + 1] = pixels[src + 1] // G
      raw[dst + 2] = pixels[src + 2] // B
    }
  }

  const compressed = deflateSync(raw, { level: 9 })
  const idat = pngChunk('IDAT', compressed)
  const iend = pngChunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend])
}

// --- Icon drawing ---
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4)
  const bg = hexToRgb('#0f172a')
  const fg = hexToRgb('#6366f1')

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4] = bg[0]; pixels[i * 4 + 1] = bg[1]; pixels[i * 4 + 2] = bg[2]; pixels[i * 4 + 3] = 255
  }

  function setPixel(x, y, color) {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = (y * size + x) * 4
    pixels[i] = color[0]; pixels[i + 1] = color[1]; pixels[i + 2] = color[2]; pixels[i + 3] = 255
  }

  // Thick line drawing (circle brush)
  function drawLine(x0, y0, x1, y1, color, thick) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      for (let dy = -thick; dy <= thick; dy++) {
        for (let dx = -thick; dx <= thick; dx++) {
          if (dx * dx + dy * dy <= thick * thick) {
            setPixel(Math.round(x + dx), Math.round(y + dy), color)
          }
        }
      }
    }
  }

  const cx = size / 2, cy = size / 2
  const w = size * 0.22, h = size * 0.2
  const thick = Math.max(1, Math.round(size * 0.04))

  // Left chevron <
  drawLine(cx - w * 0.05, cy - h, cx - w * 0.7, cy, fg, thick)
  drawLine(cx - w * 0.7, cy, cx - w * 0.05, cy + h, fg, thick)

  // Right chevron >
  drawLine(cx + w * 0.05, cy - h, cx + w * 0.7, cy, fg, thick)
  drawLine(cx + w * 0.7, cy, cx + w * 0.05, cy + h, fg, thick)

  // Slash /
  drawLine(cx + w * 0.2, cy - h, cx - w * 0.2, cy + h, fg, thick)

  return pixels
}

const sizes = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-512x512.png', size: 512 },
]

mkdirSync('public/icons', { recursive: true })

for (const { name, size } of sizes) {
  const pixels = drawIcon(size)
  const png = encodePng(pixels, size, size)
  const path = `public/icons/${name}`
  const ws = createWriteStream(path)
  ws.write(png)
  ws.end()
  console.log(`Generated ${path} (${png.length} bytes)`)
}
