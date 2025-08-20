import { CharacterSummary, HoneyResult, SortDir, SortKey } from "@/types";

export const TIER_ORDER = new Map<string, number>([
    ["S", 0],
    ["A", 1],
    ["B", 2],
    ["C", 3],
]);

export function formatPercent(v: number, digits = 1) {
    if (!isFinite(v)) return "0.0%";
    return `${(v * 100).toFixed(digits)}%`;
}

export function formatMMR(v: number, digits = 1) {
    if (!isFinite(v)) return "0.0";
    return `${Number(v).toFixed(digits)}`;
}

export function sortRows(rows: CharacterSummary[], key: SortKey, dir: SortDir) {
    const mul = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
        let va: any = (a as any)[key];
        let vb: any = (b as any)[key];
        if (key === "tier") {
            va = TIER_ORDER.get(String(va)) ?? Number.POSITIVE_INFINITY;
            vb = TIER_ORDER.get(String(vb)) ?? Number.POSITIVE_INFINITY;
        }
        if (typeof va === "number" && typeof vb === "number")
            return (va - vb) * mul;
        return String(va).localeCompare(String(vb)) * mul;
    });
}

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

export function computeHoneySet(rows: CharacterSummary[]): HoneyResult {
    if (!rows.length) return { ids: new Set(), mode: "none", topK: 0 };
    const wrT = computeTop10Threshold(rows.map((r) => r.winRate));
    const prT = computeTop10Threshold(rows.map((r) => r.pickRate));
    const mmT = computeTop10Threshold(rows.map((r) => r.mmrGain));
    const triple = rows
        .filter(
            (r) => r.winRate >= wrT && r.pickRate >= prT && r.mmrGain >= mmT,
        )
        .map((r) => r.id);
    if (triple.length > 0)
        return { ids: new Set(triple), mode: "triple", topK: triple.length };

    const { mean: mw, std: sw } = meanStd(rows.map((r) => r.winRate));
    const { mean: mp, std: sp } = meanStd(rows.map((r) => r.pickRate));
    const { mean: mm, std: sm } = meanStd(rows.map((r) => r.mmrGain));
    const score = (r: CharacterSummary) =>
        (sw ? (r.winRate - mw) / sw : 0) +
        (sp ? (r.pickRate - mp) / sp : 0) +
        (sm ? (r.mmrGain - mm) / sm : 0);
    const scored = rows
        .map((r) => ({ id: r.id, s: score(r) }))
        .sort((a, b) => b.s - a.s);
    const topK = Math.max(1, Math.floor(rows.length * 0.1));
    return {
        ids: new Set(scored.slice(0, topK).map((x) => x.id)),
        mode: "fallback",
        topK,
    };
}
