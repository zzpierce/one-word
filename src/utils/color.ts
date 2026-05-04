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

/**
 * 颜色锚点：N 段渐变需要 N+1 个锚点。
 * 当前 7 段（L1..L7）配 8 锚点：草绿 → 翠绿 → 浅青 → 天蓝 → 紫蓝 → 紫罗兰 → 紫红 → 粉红。
 */
export const PALETTE_ANCHORS = [
  '#4ade80',
  '#34d399',
  '#22d3ee',
  '#38bdf8',
  '#6366f1',
  '#a855f7',
  '#d946ef',
  '#ec4899',
] as const;

/**
 * 在 N 段渐变色卡上根据全局排序索引取色。
 * - counts[i] 表示第 i 段的词数（i 从 0 开始）
 * - 段数 = counts.length；要求 PALETTE_ANCHORS.length === counts.length + 1
 * - 空段（counts[i] === 0）自动跳过
 */
export function getColorAt(sortedIndex: number, counts: number[]): string {
  let acc = 0;
  for (let seg = 0; seg < counts.length; seg++) {
    const segLen = counts[seg];
    if (segLen === 0) continue;
    if (sortedIndex < acc + segLen) {
      const denom = segLen - 1;
      const t = denom <= 0 ? 0 : (sortedIndex - acc) / denom;
      return lerpColor(PALETTE_ANCHORS[seg], PALETTE_ANCHORS[seg + 1], t);
    }
    acc += segLen;
  }
  return PALETTE_ANCHORS[PALETTE_ANCHORS.length - 1];
}
