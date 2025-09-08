"use client";

import { useMemo, useState } from "react";
import type { ClusterTriadSummary } from "@/types";
import Carousel from "@/features/ui/Carousel";
import ClusterCompCard from "./ClusterCompCard";
import ClusterPreviewRail from "@/features/cluster-comps/components/ClusterPreviewRail";

import ClusterTable, {
    TriadRef,
    toTriadRef,
} from "@/features/cluster-comps/components/ClusterTable";

export default function ClusterCompsClient({
    initial,
}: {
    initial: ClusterTriadSummary[];
}) {
    const [q, setQ] = useState("");

    // 사이드 미리보기 상태
    const [previewTriad, setPreviewTriad] = useState<TriadRef | null>(null);
    const [pinnedTriad, setPinnedTriad] = useState<TriadRef | null>(null);

    // Top3 (전체 기준)
    const topOverall = useMemo(() => {
        const arr = [...initial];
        arr.sort((a, b) => b.winRate - a.winRate);
        return arr.slice(0, Math.min(3, arr.length));
    }, [initial]);

    // 진행바 최대값(Top3 기준)
    const topMax = useMemo(() => {
        if (topOverall.length === 0) {
            return { winRate: 1, pickRate: 1, mmr: 1, games: 1 };
        }
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

    // 🔎 검색만 적용(패치/티어 제거)
    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return initial;

        return initial.filter((s) => {
            const label = Array.isArray(s.clusters)
                ? s.clusters.join("")
                : String((s as any).cluster_label ?? "");
            return label.toLowerCase().includes(qq);
        });
    }, [initial, q]);

    // 기본 프리뷰(TOP #1)
    const top1Triad = useMemo(
        () => (topOverall[0] ? toTriadRef(topOverall[0]) : null),
        [topOverall],
    );

    return (
        <main className="mx-auto max-w-6xl flex flex-col gap-4 pb-20">
            {/* 상단: Top3 캐러셀 */}
            {topOverall.length > 0 && (
                <section>
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
                </section>
            )}

            {/* 검색 바 + 표(캐릭터 페이지 레이아웃처럼) */}
            <section className="card">
                <div className="mb-3 px-4 pt-4 flex flex-wrap items-center gap-2">
                    <input
                        className="w-56 rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-app text-app"
                        placeholder="클러스터 검색 (예: ABC)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>

                <div className="px-4 pb-4">
                    <ClusterTable
                        rows={filtered}
                        onHover={(t) => !pinnedTriad && setPreviewTriad(t)}
                        onLeave={() => !pinnedTriad && setPreviewTriad(null)}
                        onClick={(t) =>
                            setPinnedTriad((cur) =>
                                cur && cur.ids.join(",") === t.ids.join(",")
                                    ? null
                                    : t,
                            )
                        }
                    />
                </div>
            </section>

            {/* 🔒 클릭 고정 > hover > Top #1 */}
            <ClusterPreviewRail
                side="right"
                clusterIds={
                    pinnedTriad?.ids ??
                    previewTriad?.ids ??
                    top1Triad?.ids ??
                    null
                }
                clusterLabels={
                    pinnedTriad?.text ??
                    previewTriad?.text ??
                    top1Triad?.text ??
                    null
                }
                containerMax={1152}
                top={96}
                width={280}
                gap={16}
                hideBelow={1536}
                title="클러스터 미리보기"
                bottomGap={36} // 우측 레일 하단 여백
            />
        </main>
    );
}
