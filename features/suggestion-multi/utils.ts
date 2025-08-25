export function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}
export function rnd(seed: number, a: number, b: number) {
    const r = Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
    return a + (b - a) * r;
}
export function charStats(charId: number) {
    const s = hash(`char-${charId}`);
    return {
        winRate: rnd(s, 0.45, 0.62),
        mmrGain: rnd(s + 17, 4.0, 10.0),
    };
}
export const fmtPercent = (v: number) => `${(v * 100).toFixed(1)}%`;
export const fmtMMR = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
