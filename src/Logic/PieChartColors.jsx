export function generateGradient(baseColor, count) {
  const colors = [];

  const hexToRgb = (hex) => {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };

  const rgbToHex = (r, g, b) =>
    `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

  const start = hexToRgb(baseColor);
  const maxFactor = 0.4;

  for (let i = 0; i < count; i++) {
    const factor = i / (count - 1) * maxFactor;
    const r = Math.round(start.r + factor * (255 - start.r));
    const g = Math.round(start.g + factor * (255 - start.g));
    const b = Math.round(start.b + factor * (255 - start.b));
    colors.push(rgbToHex(r, g, b));
  }

  return colors;
}
