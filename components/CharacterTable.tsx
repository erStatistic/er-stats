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
    honeyIds,
}: {
    rows: CharacterSummary[];
    onSelect: (id: number) => void;
    honeyIds?: Set<number>; // optional external honey selection
}) {
    const [sortKey, setSortKey] = useState<SortKey>("tier");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const sorted = useMemo(
        () => sortRows(rows, sortKey, sortDir),
        [rows, sortKey, sortDir],
    );

    // 허니 배지 집합: 외부에서 주면 그걸 쓰고, 없으면 내부 계산
    const honeySet = useMemo(
        () => honeyIds ?? computeHoneySet(rows, 3).ids,
        [honeyIds, rows],
    );

    // 생존 시간 필드 존재 여부(있을 때만 값 렌더)
    const hasSurvival = useMemo(
        () => rows.some((r: any) => r?.survivalTime != null),
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
        return hasSurvival ? ([...base, "survivalTime"] as SortKey[]) : base;
    }, [hasSurvival]);

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
                      : "생존 시간";

    return (
        <div className="rounded-xl border border-app overflow-auto max-h-[70vh] overscroll-contain bg-surface">
            <table className="min-w-full text-sm text-app">
                <thead className="sticky top-0 bg-muted text-muted-app">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="whitespace-nowrap px-3 py-2 text-left font-medium"
                            >
                                <button
                                    className="inline-flex items-center gap-1 hover:opacity-80"
                                    onClick={() => {
                                        setSortKey(col);
                                        setSortDir((prev) =>
                                            sortKey === col && prev === "asc"
                                                ? "desc"
                                                : "asc",
                                        );
                                    }}
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
                    {sorted.map((r) => (
                        <tr
                            key={r.id}
                            className="border-t border-app hover:bg-elev-10 cursor-pointer"
                            onClick={() => onSelect(r.id)}
                        >
                            {/* 티어(+허니) */}
                            <td className="whitespace-nowrap px-3 py-2">
                                <div className="flex items-center gap-1">
                                    <TierPill tier={r.tier} />
                                    {honeySet.has(r.id) && (
                                        <HoneyBadge title="상위 10% (대표무기 기준)" />
                                    )}
                                </div>
                            </td>

                            {/* 이름 */}
                            <td className="whitespace-nowrap px-3 py-2">
                                {r.name}
                            </td>

                            {/* 무기 */}
                            <td className="whitespace-nowrap px-3 py-2">
                                {r.weapon}
                            </td>

                            {/* 승률 / 픽률 / MMR */}
                            <td className="whitespace-nowrap px-3 py-2">
                                {formatPercent(r.winRate)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                                {formatPercent(r.pickRate)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                                {formatMMR(r.mmrGain, 1)}
                            </td>

                            {/* 생존 시간(있을 때만 값, 없으면 대시) */}
                            {hasSurvival && (
                                <td className="whitespace-nowrap px-3 py-2">
                                    {(() => {
                                        const v = (r as any).survivalTime;
                                        if (v == null) return "—";
                                        // 숫자면 소수 1자리 (서버에서 mm:ss 변환해 주면 그대로 표시)
                                        return typeof v === "number"
                                            ? `${v.toFixed(1)}`
                                            : String(v);
                                    })()}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 디버그: P90 표시 */}
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
            </div>
        </div>
    );
}
