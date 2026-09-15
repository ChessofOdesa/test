import { Chess } from 'chess.js';
import type { AnalysisArrow } from './model';
export type PositionImageOptions = {
  fen: string; flipped: boolean; light: string; dark: string; title: string; comment: string;
  lastMove?: string; arrows: AnalysisArrow[]; showLastMove: boolean; showArrows: boolean; showComment: boolean;
};
const escapeXml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
const color = (value: string, fallback: string) => /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) ? value : fallback;
const squareValid = (value: string) => /^[a-h][1-8]$/.test(value);
export function imageSquare(square: string, flipped: boolean) {
  if (!squareValid(square)) throw new Error('Неправильне поле.');
  const file = square.charCodeAt(0) - 97, rank = Number(square[1]) - 1;
  return { x: 40 + (flipped ? 7 - file : file) * 100, y: 100 + (flipped ? rank : 7 - rank) * 100 };
}
function wrapText(value: string): string[] {
  const lines: string[] = [];
  for (const paragraph of value.replace(/\r/g, '').split('\n')) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      const chars = Array.from(word);
      if (line && Array.from(line).length + 1 + chars.length > 64) { lines.push(line); line = ''; }
      while (chars.length > 64) { lines.push(chars.splice(0, 64).join('')); }
      if (chars.length) line += (line ? ' ' : '') + chars.join('');
    }
    lines.push(line);
  }
  return lines;
}
export function positionSvg(options: PositionImageOptions) {
  const game = new Chess(options.fen);
  const comment = options.showComment ? options.comment : '';
  if (comment.length > 2000) throw new Error('Скоротіть підпис до 2000 символів.');
  const lines = comment ? wrapText(comment) : [];
  if (lines.length > 64) throw new Error('Забагато рядків підпису: максимум 64.');
  const height = 980 + lines.length * 25;
  const parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="880" height="' + height + '" viewBox="0 0 880 ' + height + '">',
    '<rect width="880" height="' + height + '" fill="#ffffff"/>',
    '<text x="40" y="45" fill="#172b45" font-family="sans-serif" font-size="24">' + escapeXml(Array.from(options.title).slice(0, 55).join('')) + '</text>',
    '<text x="40" y="76" fill="#52667d" font-family="sans-serif" font-size="18">' + (game.turn() === 'w' ? 'Хід білих' : 'Хід чорних') + ' · Chess of Odesa</text>'];
  const symbols: Record<string, string> = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
  const highlights = options.showLastMove && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(options.lastMove || '') ? [options.lastMove!.slice(0, 2), options.lastMove!.slice(2, 4)] : [];
  for (let rank = 1; rank <= 8; rank++) for (let file = 0; file < 8; file++) {
    const square = String.fromCharCode(97 + file) + rank, { x, y } = imageSquare(square, options.flipped);
    parts.push('<rect data-square="' + square + '" x="' + x + '" y="' + y + '" width="100" height="100" fill="' + color((file + rank) % 2 ? options.dark : options.light, '#b58863') + '"/>');
    if (highlights.includes(square)) parts.push('<rect data-last-move="' + square + '" x="' + x + '" y="' + y + '" width="100" height="100" fill="#f1c84a" opacity=".5"/>');
    const piece = game.get(square as Parameters<Chess['get']>[0]);
    if (piece) parts.push('<text x="' + (x + 50) + '" y="' + (y + 77) + '" text-anchor="middle" font-family="DejaVu Sans,Segoe UI Symbol,serif" font-size="86" fill="' + (piece.color === 'w' ? '#ffffff' : '#172b45') + '" stroke="' + (piece.color === 'w' ? '#172b45' : '#ffffff') + '" stroke-width="1.3" paint-order="stroke">' + symbols[piece.type] + '</text>');
  }
  if (options.showArrows) options.arrows.slice(0, 32).forEach(([from, to, tint], i) => {
    if (!squareValid(from) || !squareValid(to) || from === to) return;
    const a = imageSquare(from, options.flipped), b = imageSquare(to, options.flipped), stroke = color(tint || '', '#cf6d24');
    parts.push('<defs><marker id="arrow' + i + '" markerWidth="3" markerHeight="3" refX="2.3" refY="1.5" orient="auto"><path d="M0 0 L3 1.5 L0 3 Z" fill="' + stroke + '"/></marker></defs><line data-arrow="' + from + to + '" x1="' + (a.x + 50) + '" y1="' + (a.y + 50) + '" x2="' + (b.x + 50) + '" y2="' + (b.y + 50) + '" stroke="' + stroke + '" stroke-width="15" opacity=".78" marker-end="url(#arrow' + i + ')"/>');
  });
  for (let i = 0; i < 8; i++) {
    parts.push('<text x="' + (90 + i * 100) + '" y="925" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#172b45">' + String.fromCharCode(97 + (options.flipped ? 7 - i : i)) + '</text>');
    parts.push('<text x="22" y="' + (160 + i * 100) + '" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#172b45">' + (options.flipped ? i + 1 : 8 - i) + '</text>');
  }
  lines.forEach((line, i) => parts.push('<text x="40" y="' + (960 + i * 25) + '" font-family="monospace" font-size="19" fill="#172b45">' + escapeXml(line) + '</text>'));
  parts.push('</svg>'); return parts.join('');
}
export function downloadImageBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function svgToPng(svg: string): Promise<Blob> {
  await document.fonts?.ready;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Не вдалося намалювати картинку. Спробуйте SVG.')); image.src = url; });
    const canvas = document.createElement('canvas'); canvas.width = image.width * 2; canvas.height = image.height * 2;
    const context = canvas.getContext('2d'); if (!context) throw new Error('PNG недоступний. Скористайтеся SVG.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG недоступний. Скористайтеся SVG.')), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
