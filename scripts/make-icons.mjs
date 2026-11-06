import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const svg = await readFile(new URL('../assets/icon.svg', import.meta.url));
const outDir = new URL('../public/icons/', import.meta.url);
await mkdir(outDir, { recursive: true });
const out = (name) => fileURLToPath(new URL(name, outDir));

const render = (size) => sharp(svg, { density: (72 * size) / 512 }).resize(size, size);

await render(192).png().toFile(out('icon-192.png'));
await render(512).png().toFile(out('icon-512.png'));

// Maskable: artwork scaled into the central 60 % (20 % margin) on white.
const artwork = await render(Math.round(512 * 0.6)).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 3, background: '#ffffff' } })
  .composite([{ input: artwork, gravity: 'centre' }])
  .png()
  .toFile(out('icon-maskable-512.png'));
