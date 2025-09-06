"use client";
import { useMemo, useState } from "react";
import { CharacterSummary, SortDir, SortKey } from "@/types";
import {
    computeHoneySet,
    computeTop10Threshold,
    formatMMR,
    formatPercent,
    sortRows,
    formatDuration,
    parseDurationToSec,
} from "@/lib/stats";
import TierPill from "@/features/ui/TierPill";
import HoneyBadge from "@/features/ui/HoneyBadge";

export default function CharacterTable({
    rows,
    onSelect,
    honeyIds,
}: {
    rows: CharacterSummary[];
    onSelect: (id: number) => void;
    honeyIds?: number[] | Set<number>;
}) {
    const [sortKey, setSortKey] = useState<SortKey>("tier");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const hasSurvival = useMemo(
        () => rows.some((r) => r.survivalTime != null),
        [rows],
    );

    const columns: SortKey[] = useMemo(() => {
        const base: SortKey[] = [
            "tier",
            "name",
            "weapon",
            "winRate",
            "pickRate",
            "mmrGain",
        ];
        return hasSurvival ? [...base, "survivalTime"] : base;
    }, [hasSurvival]);

    const honeySet = useMemo(() => {
        if (honeyIds instanceof Set) return honeyIds;
        if (Array.isArray(honeyIds)) return new Set(honeyIds);
        const internal = computeHoneySet(rows, 3)?.ids;
        if (internal instanceof Set) return internal;
        return new Set(internal ?? []);
    }, [honeyIds, rows]);

    const sorted = useMemo(
        () => sortRows(rows, sortKey, sortDir),
        [rows, sortKey, sortDir],
    );

    const labelFor = (col: SortKey) =>
        col === "tier"
            ? "티어"
            : col === "name"
              ? "이름"
              : col === "weapon"
                ? "무기"
                : col === "winRate"
                  ? "승률"
                  : col === "pickRate"
                    ? "픽률"
                    : col === "mmrGain"
                      ? "평균 MMR"
                      : "평균 생존시간";

    const handleSortClick = (col: SortKey) => {
        setSortDir((prev) =>
            sortKey === col ? (prev === "asc" ? "desc" : "asc") : "asc",
        );
        setSortKey(col);
    };

    const ariaSort = (col: SortKey): "ascending" | "descending" | "none" =>
        sortKey === col
            ? sortDir === "asc"
                ? "ascending"
                : "descending"
            : "none";

    return (
        <div className="rounded-xl border border-app overflow-auto max-h-[70vh] overscroll-contain bg-surface">
            <table className="min-w-full text-sm text-app">
                <thead className="sticky top-0 bg-muted text-muted-app">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="whitespace-nowrap px-3 py-2 text-left font-medium"
                                aria-sort={ariaSort(col)}
                            >
                                <button
                                    className="inline-flex items-center gap-1 hover:opacity-80"
                                    onClick={() => handleSortClick(col)}
                                >
                                    {labelFor(col)}
                                    <span className="text-xs text-muted-app">
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

                <tbody className="bg-surface">
                    {sorted.map((r, i) => {
                        // ✅ key & select용 id 안전 처리
                        const cwId = (r as any).cwId; // 있으면 사용
                        const rowId =
                            typeof r.id === "number"
                                ? r.id
                                : typeof cwId === "number"
                                  ? cwId
                                  : undefined;

                        const key = rowId ?? `${r.name}-${r.weapon}-${i}`;
                        const sec = parseDurationToSec(r.survivalTime as any);

                        return (
                            <tr
                                key={key}
                                className="border-t border-app hover:bg-elev-10 cursor-pointer"
                                onClick={() => {
                                    if (typeof rowId === "number")
                                        onSelect(rowId);
                                }}
                            >
                                {/* 티어(+허니) */}
                                <td className="whitespace-nowrap px-3 py-2">
                                    <div className="flex items-center gap-1">
                                        <TierPill tier={r.tier} />
                                        {typeof rowId === "number" &&
                                            honeySet.has(rowId) && (
                                                <HoneyBadge title="상위 10% (대표무기 기준)" />
                                            )}
                                    </div>
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

                                {/* ✅ 평균 생존시간 */}
                                {hasSurvival && (
                                    <td className="whitespace-nowrap px-3 py-2">
                                        {sec == null
                                            ? "—"
                                            : formatDuration(Math.round(sec))}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* 디버그: P90 */}
            <div className="px-3 py-2 text-xs text-muted-app">
                P90 win ≈{" "}
                {(
                    computeTop10Threshold(rows.map((r) => r.winRate)) * 100
                ).toFixed(1)}
                % · pick ≈{" "}
                {(
                    computeTop10Threshold(rows.map((r) => r.pickRate)) * 100
                ).toFixed(2)}
                % · MMR ≈{" "}
                {computeTop10Threshold(rows.map((r) => r.mmrGain)).toFixed(1)}
                {hasSurvival &&
                    (() => {
                        const secs = rows
                            .map((r) =>
                                parseDurationToSec(r.survivalTime as any),
                            )
                            .filter((x): x is number => x != null);
                        if (!secs.length) return null;
                        const p90 = computeTop10Threshold(secs);
                        return (
                            <> · 생존시간 ≈ {formatDuration(Math.round(p90))}</>
                        );
                    })()}
            </div>
        </div>
    );
}
