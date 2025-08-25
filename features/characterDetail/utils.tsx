import { clamp01, toMD } from "@/features/characterDetail/constants";
/** 0~1 값을 %로 변환한 14일 시계열 생성 (항상 같은 시드 결과) */
export function makeTrendSeriesPct(base01: number, seedKey: string, days = 14) {
    const rnd = seeded(seedKey);
    const slope = (rnd() - 0.5) * 0.08; // 총 변화 -4%p ~ +4%p
    let v = clamp01(base01 - slope / 2);
    const out: { x: string; y: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const noise = (rnd() - 0.5) * 0.03; // 하루 노이즈 ±1.5%p
        v = clamp01(v + slope / days + noise);
        out.push({ x: toMD(d), y: v * 100 }); // % 값으로 저장
    }
    return out;
}

export function seeded(seedKey: string) {
    // 간단한 xorshift32 기반 시드
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedKey.length; i++)
        h = Math.imul(h ^ seedKey.charCodeAt(i), 16777619);
    return function () {
        h += 0x6d2b79f5;
        let t = Math.imul(h ^ (h >>> 15), 1 | h);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function niceScale(min: number, max: number, ticks = 5) {
    const span = Math.max(1e-6, max - min);
    const rawStep = span / Math.max(1, ticks);
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    let niceNorm: number;
    if (norm < 1.5) niceNorm = 1;
    else if (norm < 3) niceNorm = 2;
    else if (norm < 7) niceNorm = 5;
    else niceNorm = 10;
    const step = niceNorm * mag;
    const niceMin = Math.floor(min / step) * step;
    const niceMax = Math.ceil(max / step) * step;
    return { min: niceMin, max: niceMax, step };
}
