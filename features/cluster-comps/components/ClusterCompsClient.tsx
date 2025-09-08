// components/ClusterCompsClient.tsx
"use client";

import { useMemo, useState } from "react";
import { ClusterTriadSummary } from "@/types";
import Carousel from "@/features/ui/Carousel";
import ClusterCompCard from "./ClusterCompCard";
import { formatDuration } from "@/lib/stats";
import { PATCHES, GAME_TIERS } from "@/features";
import ClusterPreviewRail from "@/features/cluster-comps/components/ClusterPreviewRail";
import type { Patch, GameTier } from "@/features";
import type { SortKey } from "@/features/cluster-comps"; // "winRate" | "pickRate" | "mmrGain" | "survivalTime" | "count"

type SortDir = "asc" | "desc";

export default function ClusterCompsClient({
    initial,
}: {
    initial: ClusterTriadSummary[];
}) {
    const [q, setQ] = useState("");
    const [patch, setPatch] = useState<Patch>("All");
    const [tier, setTier] = useState<GameTier>("All");

    // 🔽 테이블 정렬 상태(헤더로만 제어)
    const [sortKey, setSortKey] = useState<SortKey>("winRate");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    // 사이드 미리보기
    const [previewClusters, setPreviewClusters] = useState<string[] | null>(
        null,
    );
    const [pinnedClusters, setPinnedClusters] = useState<string[] | null>(null);

    // Top3 (전체 기준)
    const topOverall = useMemo(() => {
        const arr = [...initial].sort((a, b) => b.winRate - a.winRate);
        return arr.slice(0, Math.min(3, arr.length));
    }, [initial]);

    // 진행바 최대값(Top3 기준)
    const topMax = useMemo(() => {
        if (topOverall.length === 0)
            return { winRate: 1, pickRate: 1, mmr: 1, games: 1 };
        return {
            winRate: Math.max(
                0,
                ...topOverall.map((s) => Number(s.winRate || 0)),
            ),
            pickRate: Math.max(
                0,
                ...topOverall.map((s) => Number(s.pickRate || 0)),
            ),
            mmr: Math.max(1, ...topOverall.map((s) => Number(s.mmrGain || 0))),
            games: Math.max(1, ...topOverall.map((s) => Number(s.count || 0))),
        };
    }, [topOverall]);

    // 필터링
    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return initial
            .filter(
                (s) =>
                    (patch === "All" || s.patch === patch) &&
                    (tier === "All" || s.tier === tier),
            )
            .filter(
                (s) => !qq || s.clusters.join("").toLowerCase().includes(qq),
            );
    }, [initial, patch, tier, q]);

    // 정렬값 추출
    const getVal = (s: ClusterTriadSummary, key: SortKey) => {
        switch (key) {
            case "winRate":
                return s.winRate ?? 0;
            case "pickRate":
                return s.pickRate ?? 0;
            case "mmrGain":
                return s.mmrGain ?? 0;
            case "survivalTime":
                // null은 항상 끝으로
                return s.survivalTime == null
                    ? sortDir === "asc"
                        ? Number.POSITIVE_INFINITY
                        : Number.NEGATIVE_INFINITY
                    : s.survivalTime;
            case "count":
                return s.count ?? 0;
            default:
                return 0;
        }
    };

    // 정렬 적용
    const sorted = useMemo(() => {
        const out = [...filtered];
        out.sort((a, b) => {
            const av = getVal(a, sortKey);
            const bv = getVal(b, sortKey);
            if (av === bv) {
                // 보조: 게임 수 ↓, 클러스터 문자열 ↑
                const byCount = (b.count ?? 0) - (a.count ?? 0);
                if (byCount !== 0) return byCount;
                return a.clusters.join("").localeCompare(b.clusters.join(""));
            }
            return sortDir === "asc" ? av - bv : bv - av;
        });
        return out;
    }, [filtered, sortKey, sortDir]);

    // 헤더 클릭: 같은 컬럼이면 dir 토글, 아니면 dir=asc로 시작
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

    const labelFor = (col: SortKey) =>
        col === "winRate"
            ? "승률"
            : col === "pickRate"
              ? "픽률"
              : col === "mmrGain"
                ? "평균 MMR"
                : col === "survivalTime"
                  ? "평균 생존시간"
                  : "게임 수";

    const columns: SortKey[] = [
        "winRate",
        "pickRate",
        "mmrGain",
        "survivalTime",
        "count",
    ];

    return (
        <div className="text-app relative">
            {/* Top3 캐러셀 */}
            {topOverall.length > 0 && (
                <>
                    <h2 className="text-lg sm:text-xl font-bold mb-3">
                        상위 클러스터 조합{" "}
                        <span className="text-muted-app text-sm">
                            (전체 기준)
                        </span>
                    </h2>
                    <Carousel
                        responsiveVisible={{ base: 1.1, md: 1.4, lg: 1.8 }}
                        autoSlide
                        interval={4500}
                        scaleActive={1.05}
                        scaleInactive={0.9}
                    >
                        {topOverall.map((s, i) => (
                            <ClusterCompCard key={i} s={s} max={topMax} />
                        ))}
                    </Carousel>
                </>
            )}

            {/* 필터 바 (정렬 컨트롤 없음) */}
            <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
                <input
                    className="w-44 rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none placeholder:text-muted-app"
                    placeholder="클러스터 검색 (예: ABC)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="클러스터 검색"
                />
                <select
                    className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none"
                    value={patch}
                    onChange={(e) => setPatch(e.target.value as Patch)}
                    aria-label="패치 선택"
                >
                    {PATCHES.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
                <select
                    className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none"
                    value={tier}
                    onChange={(e) => setTier(e.target.value as GameTier)}
                    aria-label="티어 선택"
                >
                    {GAME_TIERS.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>

            {/* 표 */}
            <div className="card p-0">
                <div className="max-h-[60vh] overflow-auto overflow-x-auto">
                    <table className="min-w-[720px] w-full text-sm">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr className="text-muted-app">
                                <th className="px-3 py-2 text-left font-medium">
                                    조합(Clusters)
                                </th>
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        className="px-3 py-2 text-right font-medium"
                                        aria-sort={ariaSort(col)}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleSortClick(col)}
                                            className="inline-flex items-center gap-1 w-full justify-end hover:opacity-80 select-none"
                                            title={`${labelFor(col)}로 정렬`}
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
                            {sorted.map((s, i) => (
                                <tr
                                    key={i}
                                    className="border-t border-app hover:bg-elev-5 transition-colors cursor-pointer"
                                    onMouseEnter={() =>
                                        !pinnedClusters &&
                                        setPreviewClusters(s.clusters)
                                    }
                                    onMouseLeave={() =>
                                        !pinnedClusters &&
                                        setPreviewClusters(null)
                                    }
                                    onClick={() =>
                                        setPinnedClusters((cur) =>
                                            cur &&
                                            cur.join() === s.clusters.join()
                                                ? null
                                                : s.clusters,
                                        )
                                    }
                                    title="클릭하면 우측 미리보기를 고정/해제합니다"
                                >
                                    <td className="px-3 py-2">
                                        <span className="inline-flex gap-1">
                                            {s.clusters.map((c, j) => (
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
                                                  Math.round(s.survivalTime),
                                              )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        {s.count.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
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
            </div>

            {/* 🔒 클릭 고정 > 우선, 아니면 hover 프리뷰 > 아니면 Top #1 기본 표시 */}
            <ClusterPreviewRail
                side="right"
                clusters={
                    pinnedClusters ??
                    previewClusters ??
                    topOverall[0]?.clusters ??
                    null
                }
                containerMax={1152}
                top={96}
                width={280}
                gap={16}
                hideBelow={1536}
                title="클러스터 미리보기"
            />
        </div>
    );
}
