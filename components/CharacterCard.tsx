"use client";
import Image from "next/image";
import { CharacterSummary, HoneyResult } from "@/types";
import TierPill from "./TierPill";
import HoneyBadge from "./HoneyBadge";
import { formatMMR, formatPercent } from "@/lib/stats";

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
                {honey.ids.has(r.id) && <HoneyBadge title={honeyTitle} />}
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
                        // 외부 도메인 세팅 전이라도 깨지지 않도록
                        unoptimized
                        onError={(e) => {
                            // next/image도 HTMLImageElement라 src 대체 가능
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
            </div>
        </section>
    );
}

/** 공통 스탯 타일 (라이트/다크 토큰 사용) */
function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-app bg-muted p-3">
            <div className="text-muted-app">{label}</div>
            <div className="text-app font-medium">{value}</div>
        </div>
    );
}
