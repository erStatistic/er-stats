// components/ClusterCompsClient.tsx
"use client";

import { useMemo, useState } from "react";
import { ClusterTriadSummary } from "@/types";
import Carousel from "@/features/ui/Carousel";
import ClusterCompCard from "./ClusterCompCard";
import { formatDuration } from "@/lib/stats";
import { PATCHES, GAME_TIERS } from "@/features";
import { SortKey } from "@/features/cluster-comps";

export default function ClusterCompsClient({
    initial,
}: {
    initial: ClusterTriadSummary[];
}) {
    const [q, setQ] = useState("");
    const [patch, setPatch] = useState<Patch>("All");
    const [tier, setTier] = useState<GameTier>("All");
    const [sort, setSort] = useState<SortKey>("winRate");

    // Top3 (전체 기준)
    const topOverall = useMemo(() => {
        const arr = [...initial];
        arr.sort((a, b) => b.winRate - a.winRate);
        return arr.slice(0, Math.min(3, arr.length));
    }, [initial]);

    // ✅ Top3의 최대값(승률/픽률/평균MMR/게임수) 계산 → 진행바 스케일링에 사용
    const topMax = useMemo(() => {
        if (topOverall.length === 0) {
            return { winRate: 1, pickRate: 1, mmr: 1, games: 1 };
        }
        return {
            winRate: Math.max(
                0,
                ...topOverall.map((s) => Number(s.winRate || 0)),
            ), // 0~1
            pickRate: Math.max(
                0,
                ...topOverall.map((s) => Number(s.pickRate || 0)),
            ), // 0~1
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

    // 정렬
    const sorted = useMemo(() => {
        const c = [...filtered];
        c.sort((a, b) => {
            switch (sort) {
                case "pickRate":
                    return b.pickRate - a.pickRate;
                case "mmrGain":
                    return b.mmrGain - a.mmrGain;
                case "count":
                    return b.count - a.count;
                case "survivalTime": {
                    const na = a.survivalTime ?? -Infinity;
                    const nb = b.survivalTime ?? -Infinity;
                    return nb - na;
                }
                default:
                    return b.winRate - a.winRate;
            }
        });
        return c;
    }, [filtered, sort]);

    return (
        <div className="text-app">
            {/* Top3 캐러셀 — 전체 기준 (필터 무시) */}
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
                            //             └─ ✅ 진행바 최대값 전달
                        ))}
                    </Carousel>
                </>
            )}

            {/* 필터 바 */}
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
                <select
                    className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="정렬 기준"
                >
                    <option value="winRate">승률</option>
                    <option value="pickRate">픽률</option>
                    <option value="mmrGain">평균 MMR</option>
                    <option value="survivalTime">평균 생존시간</option>
                    <option value="count">게임 수</option>
                </select>
            </div>

            <div className="card p-0">
                {/* 표 영역 */}
                <div className="max-h-[60vh] overflow-auto overflow-x-auto">
                    <table className="min-w-[720px] w-full text-sm">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr className="text-muted-app">
                                <th className="px-3 py-2 text-left font-medium">
                                    조합(Clusters)
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    승률
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    픽률
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    평균 MMR
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    평균 생존시간
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    게임 수
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((s, i) => (
                                <tr
                                    key={i}
                                    className="border-t border-app hover:bg-elev-5 transition-colors"
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
        </div>
    );
}
