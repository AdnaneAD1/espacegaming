import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

// Enregistre les polices custom si besoin
const fonts = [
  { file: 'NotoSans-Regular.ttf', family: 'Noto Sans' },
  { file: 'Symbola.ttf', family: 'Symbola' },
  { file: 'NotoSansArabic-Regular.ttf', family: 'Noto Sans Arabic' },
  { file: 'NotoSansJP-Regular.ttf', family: 'Noto Sans JP' },
];
fonts.forEach(({ file, family }) => {
  const fontPath = path.join(process.cwd(), 'public', 'fonts', file);
  if (fs.existsSync(fontPath)) {
    registerFont(fontPath, { family });
  }
});

export function textToPngBuffer(text: string, fontSize = 22, fontFamily = 'Noto Sans', color = '#181c2c', width = 700, height = 40) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.clearRect(0, 0, width, height);
  ctx.fillText(text, 0, 0);
  return canvas.toBuffer('image/png');
}
