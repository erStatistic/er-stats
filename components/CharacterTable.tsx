"use client";
import { useMemo, useState } from "react";
import { CharacterSummary, SortDir, SortKey } from "@/types";
import {
    computeHoneySet,
    computeTop10Threshold,
    formatMMR,
    formatPercent,
    sortRows,
} from "@/lib/stats";
import TierPill from "./TierPill";
import HoneyBadge from "./HoneyBadge";

export default function CharacterTable({
    rows,
    onSelect,
}: {
    rows: CharacterSummary[];
    onSelect: (id: number) => void;
}) {
    const [sortKey, setSortKey] = useState<SortKey>("tier");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const sorted = useMemo(
        () => sortRows(rows, sortKey, sortDir),
        [rows, sortKey, sortDir],
    );
    const honey = useMemo(() => computeHoneySet(rows), [rows]);

    return (
        <div className="overflow-auto rounded-xl border border-white/10 max-h-[70vh] overscroll-contain">
            <table className="min-w-full text-sm">
                <thead className="bg-[#0E1730] text-white/80 sticky top-0">
                    <tr>
                        {(
                            [
                                "tier",
                                "name",
                                "weapon",
                                "winRate",
                                "pickRate",
                                "mmrGain",
                            ] as SortKey[]
                        ).map((col) => (
                            <th
                                key={col}
                                className="whitespace-nowrap px-3 py-2 text-left font-medium"
                            >
                                <button
                                    className="inline-flex items-center gap-1"
                                    onClick={() => {
                                        setSortKey(col);
                                        setSortDir((prev) =>
                                            sortKey === col && prev === "asc"
                                                ? "desc"
                                                : "asc",
                                        );
                                    }}
                                >
                                    {col === "tier"
                                        ? "티어"
                                        : col === "name"
                                          ? "이름"
                                          : col === "weapon"
                                            ? "무기"
                                            : col === "winRate"
                                              ? "승률"
                                              : col === "pickRate"
                                                ? "픽률"
                                                : "획득 MMR"}
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
                <tbody className="bg-[#141F3A]">
                    {sorted.map((r) => (
                        <tr
                            key={r.id}
                            className="border-t border-white/5 hover:bg-white/5 cursor-pointer"
                            onClick={() => onSelect(r.id)}
                        >
                            <td className="whitespace-nowrap px-3 py-2 flex items-center gap-1">
                                <TierPill tier={r.tier} />
                                {honey.ids.has(r.id) && (
                                    <HoneyBadge title="상위 10% (대표무기 기준)" />
                                )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                                {r.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                                {r.weapon}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                                {formatPercent(r.winRate)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                                {formatPercent(r.pickRate)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                                {formatMMR(r.mmrGain, 1)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 디버그: P90 표시 */}
            <div className="px-3 py-2 text-xs text-white/60">
                P90 win≈{" "}
                {(
                    computeTop10Threshold(rows.map((r) => r.winRate)) * 100
                ).toFixed(1)}
                % · pick≈{" "}
                {(
                    computeTop10Threshold(rows.map((r) => r.pickRate)) * 100
                ).toFixed(2)}
                % · MMR≈{" "}
                {computeTop10Threshold(rows.map((r) => r.mmrGain)).toFixed(1)}
            </div>
        </div>
    );
}
