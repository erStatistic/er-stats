"use client";

import { ClusterTriadSummary } from "@/types";
import ClusterChip from "./ClusterChip";
import { memo } from "react";
import ClusterStat from "./ClusterStat";

type MetricMax = {
    /** 0~1 값 */
    winRate?: number;
    /** 0~1 값 */
    pickRate?: number;
    /** 정수/실수 */
    mmr?: number;
    /** 정수 */
    games?: number;
};

function clamp01(x: number) {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(1, x));
}

export default memo(function ClusterCompCard({
    s,
    title = "Top Cluster Team",
    max,
}: {
    s: ClusterTriadSummary;
    title?: string;
    /** 진행바 스케일 상한 (선택) */
    max?: MetricMax;
}) {
    // 최대값(미전달 시 기존 기본값 유지)
    const wrMax = max?.winRate ?? 1; // 승률은 0~1
    const prMax = max?.pickRate ?? 1; // 픽률은 0~1
    const mmrMax = max?.mmr ?? 20; // 기본 20
    const gamesMax = max?.games ?? 500; // 기본 500

    // 비율 계산
    const wrRatio = clamp01(s.winRate / wrMax);
    const prRatio = clamp01(s.pickRate / prMax);
    const mmrRatio = clamp01(s.mmrGain / mmrMax);
    const gamesRatio = clamp01(s.count / gamesMax);

    return (
        <article
            className="
        w-[min(92vw,560px)]
        card p-0 overflow-hidden
        shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)]
        transition-transform duration-300 hover:-translate-y-0.5
      "
            role="group"
            aria-label={`Cluster ${s.clusters.join("-")} 조합`}
        >
            {/* 상단 배너 (토큰 기반 + 윗모서리만 둥글게) */}
            <header
                className="comp-banner rounded-t-2xl px-4 sm:px-6 py-3 sm:py-4 text-center"
                style={{
                    borderTopLeftRadius: "inherit",
                    borderTopRightRadius: "inherit",
                }}
            >
                <h3 className="text-base sm:text-lg font-bold tracking-wide">
                    {title}
                </h3>
            </header>

            {/* 클러스터 3개 (중앙 강조) */}
            <div className="flex items-end justify-center gap-3 sm:gap-5 px-4 sm:px-6 py-6 bg-muted">
                {s.clusters.map((c, idx) => (
                    <div
                        key={`${c}-${idx}`}
                        className="flex flex-col items-center"
                    >
                        <div className={idx === 1 ? "scale-110" : "opacity-90"}>
                            <ClusterChip label={c} />
                        </div>
                        <p className="mt-2 text-[11px] sm:text-xs text-muted-app">
                            Cluster {c}
                        </p>
                    </div>
                ))}
            </div>

            {/* 수치 영역 */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 py-4">
                <ClusterStat
                    label="승률"
                    value={`${(s.winRate * 100).toFixed(1)}%`}
                    bar={wrRatio}
                    barClass="bg-green-500"
                />
                <ClusterStat
                    label="픽률"
                    value={`${(s.pickRate * 100).toFixed(1)}%`}
                    bar={prRatio}
                    barClass="bg-blue-500"
                />
                <ClusterStat
                    label="평균 MMR"
                    value={s.mmrGain.toFixed(1)}
                    bar={mmrRatio}
                    barClass="bg-purple-500"
                />
                <ClusterStat
                    label="게임 수"
                    value={s.count.toLocaleString()}
                    bar={gamesRatio}
                    barClass="bg-amber-400"
                />
            </section>
        </article>
    );
});
