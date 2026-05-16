const STEP = 1000;

export function nextAppendPosition(maxPos: number | null): number {
  if (maxPos === null || Number.isNaN(maxPos)) return STEP;
  return maxPos + STEP;
}

export function midpoint(a: number, b: number): number {
  return (a + b) / 2;
}
