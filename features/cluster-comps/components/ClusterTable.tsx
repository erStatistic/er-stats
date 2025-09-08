"use client";

import { useMemo, useState } from "react";
import type { ClusterTriadSummary } from "@/types";

/* ===== types ===== */
export type SortKey =
    | "clusters"
    | "winRate"
    | "pickRate"
    | "mmrGain"
    | "survivalTime"
    | "count";
type SortDir = "asc" | "desc";

export type TriadRef = { ids: number[]; text: string };

/* ===== label → id utils ===== */
const LETTER_TO_ID: Record<string, number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
    I: 9,
    J: 10,
    K: 11,
    L: 12,
    M: 13,
    N: 14,
    O: 15,
    P: 16,
    Q: 17,
    R: 18,
    S: 19,
    T: 20,
    U: 21,
};
const splitLabel = (txt: string) =>
    txt
        .split("·")
        .map((s) => s.trim())
        .filter(Boolean);
const lettersToIds = (letters: string[]) =>
    letters
        .map((x) => x.toUpperCase())
        .map((c) => LETTER_TO_ID[c])
        .filter((n): n is number => Number.isFinite(n));

/** 한 행에서 TriadRef 생성 (ids 우선, 없으면 라벨에서 복구) */
export const toTriadRef = (s: ClusterTriadSummary): TriadRef => {
    const any = s as any;
    const text = Array.isArray(s.clusters)
        ? s.clusters.join(" · ")
        : typeof any.cluster_label === "string"
          ? any.cluster_label
          : "";

    let ids: number[] | undefined =
        (any.clusterIds as number[] | undefined) ??
        (any.cluster_ids as number[] | undefined);

    if (!Array.isArray(ids) || ids.length === 0) {
        if (Array.isArray(s.clusters)) {
            ids = lettersToIds(s.clusters);
        } else if (typeof any.cluster_label === "string") {
            ids = lettersToIds(splitLabel(any.cluster_label));
        }
    }
    return { ids: Array.isArray(ids) ? ids : [], text };
};

export default function ClusterTable({
    rows,
    onHover,
    onLeave,
    onClick,
}: {
    rows: ClusterTriadSummary[];
    onHover?: (triad: TriadRef) => void;
    onLeave?: () => void;
    onClick?: (triad: TriadRef) => void;
}) {
    const [sortKey, setSortKey] = useState<SortKey>("winRate");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const columns: SortKey[] = [
        "clusters",
        "winRate",
        "pickRate",
        "mmrGain",
        "survivalTime",
        "count",
    ];

    const labelFor = (col: SortKey) =>
        col === "clusters"
            ? "조합(Clusters)"
            : col === "winRate"
              ? "승률"
              : col === "pickRate"
                ? "픽률"
                : col === "mmrGain"
                  ? "평균 MMR"
                  : col === "survivalTime"
                    ? "평균 생존시간"
                    : "게임 수";

    const handleSortClick = (col: SortKey) => {
        setSortDir((prev) =>
            sortKey === col ? (prev === "asc" ? "desc" : "asc") : "desc",
        );
        setSortKey(col);
    };

    const ariaSort = (col: SortKey): "ascending" | "descending" | "none" =>
        sortKey === col
            ? sortDir === "asc"
                ? "ascending"
                : "descending"
            : "none";

    const sorted = useMemo(() => {
        const arr = [...rows];

        const getLabelText = (s: ClusterTriadSummary) =>
            Array.isArray(s.clusters)
                ? s.clusters.join(" · ")
                : String((s as any).cluster_label ?? "");

        const num = (x: number | undefined | null, forAsc = false) =>
            x == null
                ? forAsc
                    ? Number.POSITIVE_INFINITY
                    : Number.NEGATIVE_INFINITY
                : x;

        arr.sort((a, b) => {
            if (sortKey === "clusters") {
                const la = getLabelText(a);
                const lb = getLabelText(b);
                const cmp = la.localeCompare(lb);
                return sortDir === "asc" ? cmp : -cmp;
            }

            let av = 0,
                bv = 0;
            switch (sortKey) {
                case "winRate":
                    av = num(a.winRate, sortDir === "asc");
                    bv = num(b.winRate, sortDir === "asc");
                    break;
                case "pickRate":
                    av = num(a.pickRate, sortDir === "asc");
                    bv = num(b.pickRate, sortDir === "asc");
                    break;
                case "mmrGain":
                    av = num(a.mmrGain, sortDir === "asc");
                    bv = num(b.mmrGain, sortDir === "asc");
                    break;
                case "survivalTime":
                    av = num(a.survivalTime, sortDir === "asc");
                    bv = num(b.survivalTime, sortDir === "asc");
                    break;
                case "count":
                    av = num(a.count, sortDir === "asc");
                    bv = num(b.count, sortDir === "asc");
                    break;
            }
            return sortDir === "asc" ? av - bv : bv - av;
        });

        return arr;
    }, [rows, sortKey, sortDir]);

    return (
        <div className="rounded-xl border border-app overflow-auto max-h-[60vh] overscroll-contain bg-surface">
            <table className="min-w-[720px] w-full text-sm text-app">
                <thead className="sticky top-0 bg-muted text-muted-app z-10">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col}
                                className={`px-3 py-2 ${col === "clusters" ? "text-left" : "text-right"} font-medium`}
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

                <tbody>
                    {sorted.map((s, i) => {
                        const triad = toTriadRef(s);
                        const pieces = Array.isArray((s as any).clusters)
                            ? (s as any).clusters
                            : splitLabel(
                                  String((s as any).cluster_label ?? ""),
                              );

                        return (
                            <tr
                                key={i}
                                className="border-t border-app hover:bg-elev-10 cursor-pointer"
                                onMouseEnter={() => onHover?.(triad)}
                                onMouseLeave={() => onLeave?.()}
                                onClick={() => onClick?.(triad)}
                                title="클릭하면 우측 미리보기를 고정/해제합니다"
                            >
                                <td className="px-3 py-2 text-left">
                                    <span className="inline-flex gap-1">
                                        {pieces.map((c: string, j: number) => (
                                            <span
                                                key={`${c}-${j}`}
                                                className="inline-block"
                                            >
                                                <strong className="text-app">
                                                    {c}
                                                </strong>
                                                {j < 2 ? " · " : ""}
                                            </span>
                                        ))}
                                    </span>
                                </td>

                                <td className="px-3 py-2 text-right">
                                    {(s.winRate * 100).toFixed(1)}%
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {(s.pickRate * 100).toFixed(2)}%
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {s.mmrGain.toFixed(1)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {s.survivalTime == null
                                        ? "—"
                                        : formatDuration(
                                              Math.round(
                                                  s.survivalTime as number,
                                              ),
                                          )}
                                </td>
                                <td className="px-3 py-2 text-right">
                                    {s.count.toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}

                    {sorted.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="px-3 py-6 text-center text-muted-app"
                            >
                                표시할 조합이 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

/* 작은 헬퍼 – 시간 포맷(초→mm:ss) */
function formatDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
