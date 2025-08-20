"use client";
import { useMemo, useState } from "react";
import { CompSummary, CharacterSummary } from "@/types";
import { formatPercent, formatMMR } from "@/lib/stats";

type SortKey = "winRate" | "pickRate" | "mmrGain" | "count";
type SortDir = "asc" | "desc";

export default function CompsClient({
    initialComps,
    characters,
}: {
    initialComps: CompSummary[];
    characters: CharacterSummary[];
}) {
    const [sortKey, setSortKey] = useState<SortKey>("winRate");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    // id → 캐릭터 맵
    const charMap = useMemo(
        () => Object.fromEntries(characters.map((c) => [c.id, c])),
        [characters],
    );

    const sorted = useMemo(() => {
        const mul = sortDir === "asc" ? 1 : -1;
        return [...initialComps].sort(
            (a, b) => ((a as any)[sortKey] - (b as any)[sortKey]) * mul,
        );
    }, [initialComps, sortKey, sortDir]);

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 text-white">
            <h1 className="mb-4 text-xl font-semibold">캐릭터 조합 통계</h1>

            <div className="overflow-auto rounded-xl border border-white/10 bg-[#111A2E]">
                <table className="min-w-full text-sm">
                    <thead className="bg-[#0E1730] text-white/80">
                        <tr>
                            <th className="px-3 py-2 text-left">조합</th>
                            {(
                                [
                                    "winRate",
                                    "pickRate",
                                    "mmrGain",
                                    "count",
                                ] as SortKey[]
                            ).map((col) => (
                                <th key={col} className="px-3 py-2 text-left">
                                    <button
                                        className="inline-flex items-center gap-1"
                                        onClick={() => {
                                            setSortKey(col);
                                            setSortDir((prev) =>
                                                sortKey === col &&
                                                prev === "asc"
                                                    ? "desc"
                                                    : "asc",
                                            );
                                        }}
                                    >
                                        {col === "winRate"
                                            ? "승률"
                                            : col === "pickRate"
                                              ? "픽률"
                                              : col === "mmrGain"
                                                ? "평균 MMR"
                                                : "표본"}
                                        <span className="text-xs text-white/40">
                                            {sortKey === col
                                                ? sortDir === "asc"
                                                    ? "▲"
                                                    : "▼"
                                                : "↕"}
                                        </span>
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((c, idx) => (
                            <tr
                                key={idx}
                                className="border-t border-white/10 hover:bg-white/5"
                            >
                                {/* 조합 칸 */}
                                <td className="px-3 py-2 flex gap-2">
                                    {c.comp.map((id) => {
                                        const char = charMap[id];
                                        return char ? (
                                            <div
                                                key={id}
                                                className="flex items-center gap-1 rounded bg-[#16223C] px-2 py-1 text-xs"
                                            >
                                                <img
                                                    src={char.imageUrl}
                                                    alt={char.name}
                                                    className="h-5 w-5 rounded-full"
                                                />
                                                <span>{char.name}</span>
                                            </div>
                                        ) : (
                                            <span key={id}>?</span>
                                        );
                                    })}
                                </td>

                                {/* 승률, 픽률, MMR, 표본 */}
                                <td className="px-3 py-2">
                                    {formatPercent(c.winRate)}
                                </td>
                                <td className="px-3 py-2">
                                    {formatPercent(c.pickRate)}
                                </td>
                                <td className="px-3 py-2">
                                    {formatMMR(c.mmrGain)}
                                </td>
                                <td className="px-3 py-2">{c.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
