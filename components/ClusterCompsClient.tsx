// components/ClusterCompsClient.tsx
"use client";

import { useMemo, useState } from "react";
import { ClusterTriadSummary } from "@/types";
import Carousel from "@/components/Carousel";
import ClusterCompCard from "@/components/ClusterCompCard";

const PATCHES = ["All", "v0.74", "v0.75", "v0.76"] as const;
type Patch = (typeof PATCHES)[number];

const GAME_TIERS = [
    "All",
    "Diamond+",
    "Meteorite+",
    "Mythril+",
    "in 1000",
] as const;
type GameTier = (typeof GAME_TIERS)[number];

export default function ClusterCompsClient({
    initial,
}: {
    initial: ClusterTriadSummary[];
}) {
    const [q, setQ] = useState("");
    const [patch, setPatch] = useState<Patch>("All");
    const [tier, setTier] = useState<GameTier>("All");
    const [sort, setSort] = useState<"wr" | "pick" | "mmr" | "count">("wr");

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

    const sorted = useMemo(() => {
        const c = [...filtered];
        c.sort((a, b) => {
            switch (sort) {
                case "pick":
                    return b.pickRate - a.pickRate;
                case "mmr":
                    return b.mmrGain - a.mmrGain;
                case "count":
                    return b.count - a.count;
                default:
                    return b.winRate - a.winRate;
            }
        });
        return c;
    }, [filtered, sort]);

    const top = sorted.slice(0, Math.min(3, sorted.length));

    return (
        <div className="text-app">
            {/* 필터 바 */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <input
                    className="w-44 rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none placeholder:text-muted-app"
                    placeholder="클러스터 검색 (예: ABC)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
                <select
                    className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none"
                    value={patch}
                    onChange={(e) => setPatch(e.target.value as Patch)}
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
                    onChange={(e) => setSort(e.target.value as any)}
                >
                    <option value="wr">승률</option>
                    <option value="pick">픽률</option>
                    <option value="mmr">평균 MMR</option>
                    <option value="count">게임 수</option>
                </select>
            </div>

            {/* Top3 캐러셀 */}
            {top.length > 0 && (
                <>
                    <h2 className="text-lg sm:text-xl font-bold mb-3">
                        상위 클러스터 조합
                    </h2>
                    <Carousel
                        responsiveVisible={{ base: 1.1, md: 1.4, lg: 1.8 }}
                        autoSlide
                        interval={4500}
                        scaleActive={1.05}
                        scaleInactive={0.9}
                    >
                        {top.map((s, i) => (
                            <ClusterCompCard key={i} s={s} />
                        ))}
                    </Carousel>
                </>
            )}

            {/* 리스트 테이블 */}
            <div className="card mt-8 p-0 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted">
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
                                    {s.count.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {sorted.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
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
    );
}
