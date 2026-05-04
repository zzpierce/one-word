export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return { r, g, b };
}

export function lerpColor(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * clamped);
  const g = Math.round(a.g + (b.g - a.g) * clamped);
  const bl = Math.round(a.b + (b.b - a.b) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function getColorAt(
  sortedIndex: number,
  cnt1: number,
  cnt2: number,
  cnt3: number
): string {
  if (sortedIndex < cnt1) {
    const denom = cnt1 - 1;
    const t = denom <= 0 ? 0 : sortedIndex / denom;
    return lerpColor('#4ade80', '#22d3ee', t);
  }
  if (sortedIndex < cnt1 + cnt2) {
    const k = sortedIndex - cnt1;
    const denom = cnt2 - 1;
    const t = denom <= 0 ? 0 : k / denom;
    return lerpColor('#22d3ee', '#6366f1', t);
  }
  const k = sortedIndex - cnt1 - cnt2;
  const denom = cnt3 - 1;
  const t = denom <= 0 ? 0 : k / denom;
  return lerpColor('#6366f1', '#ec4899', t);
}
