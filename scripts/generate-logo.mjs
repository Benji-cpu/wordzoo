import sharp from "sharp";
import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "brand");
mkdirSync(OUT_DIR, { recursive: true });

const ORANGE = "#FF8A3D";
const CREAM = "#FDF8EE";
const DEEP = "#9A3412";

// Master SVG — italic Fraunces lowercase w on warm orange. The right ascender
// of the w gets a single-Bezier curl that nods at the fox-tail palette
// already in globals.css without becoming a literal mascot. Designed at
// 1024×1024, scales down to 16×16.
const svg = ({ size } = {}) => {
  const s = size;
  const cx = s / 2;
  const cornerR = s * 0.22;

  // Italic lowercase w sits roughly on the x-height, baseline higher than caps.
  const monogramSize = s * 0.78;
  const monogramY = s * 0.5 + monogramSize * 0.22;

  // Fox-tail curl: a single quadratic from the rightmost ascender top,
  // sweeping out and flicking up. Stroke only — additive cue at small sizes.
  const tailStartX = s * 0.78;
  const tailStartY = s * 0.34;
  const tailCtrlX = s * 0.92;
  const tailCtrlY = s * 0.22;
  const tailEndX = s * 0.86;
  const tailEndY = s * 0.16;
  const tailW = Math.max(1.5, s * 0.022);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${cornerR}" ry="${cornerR}" fill="${ORANGE}"/>
  <text x="${cx}" y="${monogramY}"
        font-family="Fraunces, 'EB Garamond', Georgia, 'Times New Roman', serif"
        font-style="italic"
        font-weight="500"
        font-size="${monogramSize}"
        fill="${CREAM}"
        text-anchor="middle">w</text>
  <path d="M ${tailStartX} ${tailStartY} Q ${tailCtrlX} ${tailCtrlY} ${tailEndX} ${tailEndY}"
        stroke="${CREAM}" stroke-width="${tailW}" stroke-linecap="round" fill="none" opacity="0.9"/>
</svg>`;
};

const renders = [
  { name: "logo-1024.png", size: 1024 },
  { name: "logo-512.png", size: 512 },
  { name: "logo-192.png", size: 192 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-32.png", size: 32 },
  { name: "icon-16.png", size: 16 },
];

for (const { name, size } of renders) {
  const out = join(OUT_DIR, name);
  await sharp(Buffer.from(svg({ size })))
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${out}`);
}

writeFileSync(join(OUT_DIR, "logo.svg"), svg({ size: 1024 }));
console.log(`wrote ${join(OUT_DIR, "logo.svg")}`);

const ogSvg = () => {
  const w = 1200;
  const h = 630;
  const markSize = 380;
  const markX = 120;
  const markY = (h - markSize) / 2;
  const cornerR = markSize * 0.22;

  const monogramSize = markSize * 0.78;
  const monogramCx = markX + markSize / 2;
  const monogramY = markY + markSize / 2 + monogramSize * 0.22;

  const tailStartX = markX + markSize * 0.78;
  const tailStartY = markY + markSize * 0.34;
  const tailCtrlX = markX + markSize * 0.92;
  const tailCtrlY = markY + markSize * 0.22;
  const tailEndX = markX + markSize * 0.86;
  const tailEndY = markY + markSize * 0.16;
  const tailW = Math.max(1.5, markSize * 0.022);

  const textX = markX + markSize + 80;
  const wordmarkY = h / 2 - 10;
  const taglineY = h / 2 + 60;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${CREAM}"/>
  <rect x="${markX}" y="${markY}" width="${markSize}" height="${markSize}" rx="${cornerR}" ry="${cornerR}" fill="${ORANGE}"/>
  <text x="${monogramCx}" y="${monogramY}"
        font-family="Fraunces, 'EB Garamond', Georgia, 'Times New Roman', serif"
        font-style="italic"
        font-weight="500"
        font-size="${monogramSize}"
        fill="${CREAM}"
        text-anchor="middle">w</text>
  <path d="M ${tailStartX} ${tailStartY} Q ${tailCtrlX} ${tailCtrlY} ${tailEndX} ${tailEndY}"
        stroke="${CREAM}" stroke-width="${tailW}" stroke-linecap="round" fill="none" opacity="0.9"/>
  <text x="${textX}" y="${wordmarkY}"
        font-family="Fraunces, Georgia, 'Times New Roman', serif"
        font-weight="500"
        font-style="italic"
        font-size="104"
        fill="${DEEP}"
        text-anchor="start">WordZoo</text>
  <text x="${textX}" y="${taglineY}"
        font-family="Nunito, 'Helvetica Neue', Arial, sans-serif"
        font-weight="700"
        font-size="28"
        letter-spacing="2"
        fill="${ORANGE}"
        text-anchor="start">LEARN LANGUAGES WITH MEMORABLE MNEMONICS</text>
</svg>`;
};

const ogBuffer = await sharp(Buffer.from(ogSvg()))
  .png({ compressionLevel: 9 })
  .toBuffer();

writeFileSync(join(OUT_DIR, "og-image.png"), ogBuffer);
console.log(`wrote ${join(OUT_DIR, "og-image.png")}`);

const APP_DIR = join(process.cwd(), "app");
writeFileSync(join(APP_DIR, "opengraph-image.png"), ogBuffer);
console.log(`wrote ${join(APP_DIR, "opengraph-image.png")}`);

copyFileSync(join(OUT_DIR, "icon-32.png"), join(APP_DIR, "icon.png"));
console.log(`wrote ${join(APP_DIR, "icon.png")}`);
copyFileSync(join(OUT_DIR, "apple-touch-icon.png"), join(APP_DIR, "apple-icon.png"));
console.log(`wrote ${join(APP_DIR, "apple-icon.png")}`);

// Refresh the existing PWA icons too — they used to be placeholder.
copyFileSync(join(OUT_DIR, "logo-192.png"), join(process.cwd(), "public", "icons", "icon-192x192.png"));
copyFileSync(join(OUT_DIR, "logo-512.png"), join(process.cwd(), "public", "icons", "icon-512x512.png"));
console.log(`refreshed public/icons/icon-{192,512}x{192,512}.png`);
