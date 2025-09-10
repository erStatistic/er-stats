import { CharacterSummary, HoneyResult, SortDir, SortKey } from "@/types";

export const TIER_ORDER = new Map<string, number>([
    ["S", 0],
    ["A", 1],
    ["B", 2],
    ["C", 3],
]);

import type { SortDir, SortKey } from "@/types";

export function formatDuration(sec?: number): string {
    if (sec == null || isNaN(sec)) return "—";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${m}:${String(s).padStart(2, "0")}`;
}

export function parseDurationToSec(
    v: number | string | undefined,
): number | null {
    if (v == null) return null;
    if (typeof v === "number") return v;
    const parts = v.split(":").map(Number);
    if (parts.some(Number.isNaN)) return null;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return null;
}

export function sortRows<T extends Record<string, any>>(
    rows: T[],
    key: SortKey,
    dir: SortDir,
): T[] {
    const arr = [...rows];
    const mul = dir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
        const av = a[key];
        const bv = b[key];

        // ✅ 생존시간은 숫자/문자 모두 초 단위로 비교
        if (key === "survivalTime") {
            const as = parseDurationToSec(av);
            const bs = parseDurationToSec(bv);
            const na = as ?? -Infinity;
            const nb = bs ?? -Infinity;
            return (na - nb) * mul;
        }

        // 문자열 비교
        if (typeof av === "string" || typeof bv === "string") {
            return String(av ?? "").localeCompare(String(bv ?? "")) * mul;
        }

        // 숫자 비교
        const na = Number(av ?? -Infinity);
        const nb = Number(bv ?? -Infinity);
        return (na - nb) * mul;
    });

    return arr;
}
export function formatPercent(v: number, digits = 1) {
    if (!isFinite(v)) return "0.0%";
    return `${(v * 100).toFixed(digits)}%`;
}

export function formatMMR(v: number, digits = 1) {
    if (!isFinite(v)) return "0.0";
    return `${Number(v).toFixed(digits)}`;
}

// export function sortRows(rows: CharacterSummary[], key: SortKey, dir: SortDir) {
//     const mul = dir === "asc" ? 1 : -1;
//     return [...rows].sort((a, b) => {
//         let va: any = (a as any)[key];
//         let vb: any = (b as any)[key];
//         if (key === "tier") {
//             va = TIER_ORDER.get(String(va)) ?? Number.POSITIVE_INFINITY;
//             vb = TIER_ORDER.get(String(vb)) ?? Number.POSITIVE_INFINITY;
//         }
//         if (typeof va === "number" && typeof vb === "number")
//             return (va - vb) * mul;
//         return String(va).localeCompare(String(vb)) * mul;
//     });
// }

export function computeTop10Threshold(values: number[]) {
    if (!values.length) return Infinity;
    const sorted = [...values].sort((a, b) => b - a);
    const idx = Math.max(0, Math.floor(values.length * 0.1) - 1);
    return sorted[idx] ?? Infinity;
}

export function meanStd(values: number[]) {
    if (!values.length) return { mean: 0, std: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
        values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    return { mean, std: Math.sqrt(variance) };
}
