/** Basit nokta matrisi ile yıldız yazı */
const GLYPHS = {
  S: ['0111', '1000', '0110', '0001', '1110'],
  s: ['0111', '0010', '0110', '0001', '1110'],
  e: ['0110', '1001', '1111', '1000', '0110'],
  n: ['1001', '1101', '1011', '1001', '1001'],
  i: ['0110', '0010', '0010', '0010', '0110'],
  v: ['1001', '1001', '1001', '1001', '0110'],
  y: ['1001', '1001', '0110', '0010', '0010'],
  o: ['0110', '1001', '1001', '1001', '0110'],
  r: ['1110', '1001', '1110', '1010', '1001'],
  u: ['1001', '1001', '1001', '1001', '0110'],
  m: ['10001', '11011', '10101', '10001', '10001'],
  ' ': [],
};

export function getStarTextPoints(text, centerX, centerY, cell = 9) {
  const points = [];
  const chars = [...text];
  const widths = chars.map((ch) => {
    const g = GLYPHS[ch];
    return g?.[0]?.length ?? 2;
  });
  const gap = cell * 0.85;
  const letterGap = cell * 1.1;
  const totalW =
    widths.reduce((a, w) => a + w * gap, 0) + Math.max(0, chars.length - 1) * letterGap;
  let x = centerX - totalW / 2;

  chars.forEach((ch, ci) => {
    const glyph = GLYPHS[ch];
    if (!glyph?.length) {
      x += letterGap;
      return;
    }
    const rows = glyph.length;
    const cols = glyph[0].length;
    const h = rows * gap;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (glyph[row][col] === '1') {
          points.push({
            x: x + col * gap,
            y: centerY - h / 2 + row * gap,
            order: ci * 100 + row * 10 + col,
          });
        }
      }
    }
    x += cols * gap + letterGap;
  });

  return points.sort((a, b) => a.order - b.order);
}
