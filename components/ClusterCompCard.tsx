"use client";

import { ClusterTriadSummary } from "@/types";
import ClusterChip from "./ClusterChip";
import { memo } from "react";

/** 작은 지표 카드 (라벨/값 + 미니 바) – 테마 토큰 적용 */
function Stat({
    label,
    value,
    bar, // 0~1
    barClass, // 예: "bg-green-500"
}: {
    label: string;
    value: string;
    bar: number;
    barClass: string;
}) {
    const width = `${Math.max(0, Math.min(1, bar)) * 100}%`;
    return (
        <div className="card px-3 py-3">
            <div className="text-[11px] sm:text-xs text-muted-app">{label}</div>
            <div className="mt-0.5 text-base sm:text-lg font-semibold text-app">
                {value}
            </div>
            <div
                className="mt-2 h-1.5 rounded-full bg-elev-10 overflow-hidden"
                aria-hidden
            >
                <div className={`h-full ${barClass}`} style={{ width }} />
            </div>
        </div>
    );
}

export default memo(function ClusterCompCard({
    s,
    title = "Top Cluster Team",
}: {
    s: ClusterTriadSummary;
    title?: string;
}) {
    return (
        <article
            className="
        w-[min(92vw,560px)]
        card overflow-hidden
        shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)]
        transition-transform duration-300 hover:-translate-y-0.5
      "
            role="group"
            aria-label={`Cluster ${s.clusters.join("-")} 조합`}
        >
            {/* 상단 배너 (강조용 그라디언트 유지) */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 text-center text-white">
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
                <Stat
                    label="승률"
                    value={`${(s.winRate * 100).toFixed(1)}%`}
                    bar={s.winRate}
                    barClass="bg-green-500"
                />
                <Stat
                    label="픽률"
                    value={`${(s.pickRate * 100).toFixed(1)}%`}
                    bar={s.pickRate}
                    barClass="bg-blue-500"
                />
                <Stat
                    label="평균 MMR"
                    value={s.mmrGain.toFixed(1)}
                    bar={Math.min(1, s.mmrGain / 20)} // 프리뷰 스케일
                    barClass="bg-purple-500"
                />
                <Stat
                    label="게임 수"
                    value={s.count.toLocaleString()}
                    bar={Math.min(1, s.count / 500)} // 프리뷰 스케일
                    barClass="bg-amber-400"
                />
            </section>
        </article>
    );
});
