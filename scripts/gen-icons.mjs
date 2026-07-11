// Genera icone PWA placeholder (quadrato blu #2563EB con cerchio bianco).
// Uso: node scripts/gen-icons.mjs
import zlib from 'zlib'
import fs from 'fs'
import path from 'path'

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function makePng(size) {
  const BLUE = [37, 99, 235], WHITE = [255, 255, 255]
  const cx = size / 2, cy = size / 2, r = size * 0.3
  const raw = Buffer.alloc(size * (1 + size * 4))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0 // filtro
    for (let x = 0; x < size; x++) {
      const inCircle = (x - cx) ** 2 + (y - cy) ** 2 <= r * r
      const [cr, cg, cb] = inCircle ? WHITE : BLUE
      raw[o++] = cr; raw[o++] = cg; raw[o++] = cb; raw[o++] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6 // 8 bit, RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const dir = path.join(process.cwd(), 'public', 'icons')
fs.mkdirSync(dir, { recursive: true })
for (const size of [192, 512]) {
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), makePng(size))
  console.log(`✓ public/icons/icon-${size}.png`)
}
