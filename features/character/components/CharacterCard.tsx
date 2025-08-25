"use client";
import { useMemo } from "react";
import Image from "next/image";
import { CharacterSummary, HoneyResult } from "@/types";
import TierPill from "@/features/ui/TierPill";
import HoneyBadge from "@/features/ui/HoneyBadge";
import { formatMMR, formatPercent, formatDuration } from "@/lib/stats";
import StatBox from "./CharacterStat";

type Props = {
    r: CharacterSummary;
    honey: HoneyResult;
    /** 상세 이동 핸들러(카드 내부에서는 버튼을 렌더링하지 않습니다) */
    onDetail?: (id: number) => void;
};

export default function CharacterCard({ r, honey }: Props) {
    const honeyTitle =
        honey.mode === "triple"
            ? "Top 10% on all (Win·Pick·MMR)"
            : "Top 10% overall (z-score)";

    // ids(number[]) → Set으로 변환 (렌더마다 재생성 방지)
    const honeySet = useMemo(() => new Set(honey.ids), [honey.ids]);

    // ✅ 평균 생존시간(초 단위) 계산: survivalTime(숫자/문자) > avgSurvivalSec > avgSurvivalMs
    const survivalSec = useMemo(() => {
        const st: any = (r as any).survivalTime;
        if (typeof st === "number") return Math.round(st);
        if (typeof st === "string") {
            const parts = st.split(":").map(Number);
            if (!parts.some(Number.isNaN)) {
                if (parts.length === 3)
                    return parts[0] * 3600 + parts[1] * 60 + parts[2];
                if (parts.length === 2) return parts[0] * 60 + parts[1];
            }
        }
        if (typeof (r as any).avgSurvivalSec === "number")
            return Math.round((r as any).avgSurvivalSec);
        if (typeof (r as any).avgSurvivalMs === "number")
            return Math.round((r as any).avgSurvivalMs / 1000);
        return undefined;
    }, [r]);

    return (
        <section
            className="card space-y-3"
            aria-labelledby={`char-${r.id}-name`}
        >
            <div className="flex items-center gap-2">
                <h2
                    id={`char-${r.id}-name`}
                    className="text-lg font-semibold text-app"
                >
                    {r.name}
                </h2>
                <TierPill tier={r.tier} />
                {honeySet.has(r.id) && <HoneyBadge title={honeyTitle} />}
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* 이미지 */}
                <div className="rounded-2xl border border-app bg-muted p-3 flex items-center justify-center">
                    <Image
                        src={
                            r.imageUrl ||
                            `https://picsum.photos/seed/er-${r.id}/160/160`
                        }
                        alt={`${r.name} 이미지`}
                        width={128}
                        height={128}
                        className="h-32 w-32 rounded-xl object-cover"
                        unoptimized
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                                "data:image/svg+xml;utf8," +
                                encodeURIComponent(
                                    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
                     <rect width="100%" height="100%" fill="#E2E8F0"/>
                     <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748B" font-size="12">No Image</text>
                   </svg>`,
                                );
                        }}
                    />
                </div>

                {/* 스탯 타일들 */}
                <StatBox label="무기" value={r.weapon} />
                <StatBox label="승률" value={formatPercent(r.winRate)} />
                <StatBox label="픽률" value={formatPercent(r.pickRate)} />
                <StatBox
                    label="획득 MMR(게임당)"
                    value={formatMMR(r.mmrGain, 1)}
                />

                {/* ✅ 평균 생존시간(있을 때만 노출) */}
                {survivalSec != null && (
                    <StatBox
                        label="평균 생존시간(게임당)"
                        value={formatDuration(survivalSec)}
                    />
                )}
            </div>
        </section>
    );
}
