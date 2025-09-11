"use client";

import { useMemo, useState } from "react";
import { CharacterSummary, SortDir, SortKey } from "@/types";
import {
    computeTop10Threshold,
    formatMMR,
    formatPercent,
    sortRows,
    formatDuration,
    parseDurationToSec,
} from "@/lib/stats";
import TierPill from "@/features/ui/TierPill";
import HoneyBadge from "@/features/ui/HoneyBadge";

type RowLike = CharacterSummary & {
    characterId?: number; // 서버 매핑 필드
    weaponId?: number; // 서버 매핑 필드
    cwId?: number;
    s_score?: number; // snake_case 대응
    sScore?: number; // camelCase 대응
};

export default function CharacterTable({
    rows,
    onSelect,
}: {
    rows: CharacterSummary[];
    onSelect: (char_id: number, weapon_id: number) => void;
}) {
    const [sortKey, setSortKey] = useState<SortKey>("tier");
    const [sortDir, setSortDir] = useState<SortDir>("desc"); // s_score 내림차순 기본

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

    // s_score 접근 헬퍼
    const scoreOf = (r: CharacterSummary) =>
        (r as RowLike).s_score ?? (r as RowLike).sScore ?? 0;

    // ✅ Honey 규칙(소수 기준: 0.15=15%)
    const HONEY_RULE = { win: 0.15, pick: 0.02, mmr: 65 };
    const isRuleHoney = (r: CharacterSummary) =>
        r.winRate >= HONEY_RULE.win &&
        r.pickRate >= HONEY_RULE.pick &&
        r.mmrGain >= HONEY_RULE.mmr;

    // ✅ 티어 컬럼 클릭 시 s_score로 정렬(표시는 tier)
    const sorted = useMemo(() => {
        if (sortKey === "tier") {
            return [...rows].sort((a, b) =>
                sortDir === "asc"
                    ? scoreOf(a) - scoreOf(b)
                    : scoreOf(b) - scoreOf(a),
            );
        }
        return sortRows(rows, sortKey, sortDir);
    }, [rows, sortKey, sortDir]);

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
                        const row = r as RowLike;
                        const charId = row.characterId ?? r.id;
                        const weaponId = row.weapon_id;
                        const key = `${charId}-${weaponId ?? r.weapon}-${i}`;
                        const sec = parseDurationToSec(r.survivalTime as any);

                        const showHoney = isRuleHoney(r); // ✅ 규칙만 사용

                        return (
                            <tr
                                key={key}
                                className="border-t border-app hover:bg-elev-10 cursor-pointer"
                                onClick={() => {
                                    if (
                                        Number.isFinite(charId) &&
                                        Number.isFinite(weaponId as number)
                                    ) {
                                        onSelect(
                                            charId as number,
                                            weaponId as number,
                                        );
                                    }
                                }}
                            >
                                {/* 티어(+허니) */}
                                <td className="whitespace-nowrap px-3 py-2">
                                    <div className="flex items-center gap-1">
                                        <TierPill tier={r.tier} />
                                        {showHoney && <HoneyBadge />}
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
