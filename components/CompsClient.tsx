// components/CompsClient.tsx
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
    ) as Record<number, CharacterSummary | undefined>;

    const sorted = useMemo(() => {
        const mul = sortDir === "asc" ? 1 : -1;
        return [...initialComps].sort(
            (a, b) =>
                (((a as any)[sortKey] as number) -
                    ((b as any)[sortKey] as number)) *
                mul,
        );
    }, [initialComps, sortKey, sortDir]);

    const headers: { key: SortKey; label: string; right?: boolean }[] = [
        { key: "winRate", label: "승률", right: true },
        { key: "pickRate", label: "픽률", right: true },
        { key: "mmrGain", label: "평균 MMR", right: true },
        { key: "count", label: "표본", right: true },
    ];

    const nextDir = (col: SortKey) =>
        sortKey === col ? (sortDir === "asc" ? "desc" : "asc") : "desc";

    return (
        <div className="text-app">
            <h1 className="mb-4 text-xl font-semibold">캐릭터 조합 통계</h1>

            <div className="card p-0 overflow-auto">
                <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                        <tr className="text-muted-app">
                            <th className="px-3 py-2 text-left font-medium">
                                조합
                            </th>
                            {headers.map(({ key, label, right }) => {
                                const active = sortKey === key;
                                const dir = active ? sortDir : undefined;
                                return (
                                    <th
                                        key={key}
                                        className={`px-3 py-2 ${right ? "text-right" : "text-left"} font-medium`}
                                        aria-sort={
                                            active
                                                ? dir === "asc"
                                                    ? "ascending"
                                                    : "descending"
                                                : "none"
                                        }
                                    >
                                        <button
                                            className="inline-flex items-center gap-1 hover:opacity-80"
                                            onClick={() => {
                                                setSortKey(key);
                                                setSortDir(nextDir(key));
                                            }}
                                        >
                                            {label}
                                            <span className="text-xs text-muted-app">
                                                {active
                                                    ? dir === "asc"
                                                        ? "▲"
                                                        : "▼"
                                                    : "↕"}
                                            </span>
                                        </button>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {sorted.map((c, idx) => (
                            <tr
                                key={idx}
                                className="border-t border-app hover:bg-elev-10"
                            >
                                {/* 조합 칸 */}
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-2">
                                        {c.comp.map((id) => {
                                            const char = charMap[id];
                                            return char ? (
                                                <span
                                                    key={id}
                                                    className="inline-flex items-center gap-1 rounded border border-app bg-muted px-2 py-1 text-xs"
                                                    title={char.name}
                                                >
                                                    <img
                                                        src={char.imageUrl}
                                                        alt={char.name}
                                                        className="h-5 w-5 rounded-full object-cover"
                                                    />
                                                    <span className="truncate max-w-[12ch]">
                                                        {char.name}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span
                                                    key={id}
                                                    className="text-muted-app text-xs"
                                                >
                                                    ?
                                                </span>
                                            );
                                        })}
                                    </div>
                                </td>

                                {/* 승률 / 픽률 / MMR / 표본 */}
                                <td className="px-3 py-2 text-right">
                                    {formatPercent(c.winRate)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {formatPercent(c.pickRate)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {formatMMR(c.mmrGain)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {c.count.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
