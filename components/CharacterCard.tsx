"use client";
import Image from "next/image";
import { CharacterSummary, HoneyResult } from "@/types";
import TierPill from "./TierPill";
import HoneyBadge from "./HoneyBadge";
import { formatMMR, formatPercent } from "@/lib/stats";

export default function CharacterCard({
    r,
    honey,
    onDetail,
}: {
    r: CharacterSummary;
    honey: HoneyResult;
    onDetail?: (id: number) => void;
}) {
    const honeyTitle =
        honey.mode === "triple"
            ? "상위 10% 모두 충족 (승률·픽률·MMR)"
            : "종합 상위 10% (z-score)";
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{r.name}</h2>
                <TierPill tier={r.tier} />
                {honey.ids.has(r.id) && <HoneyBadge title={honeyTitle} />}
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-[#0E1730] p-3 flex items-center justify-center">
                    <Image
                        src={
                            r.imageUrl ||
                            `https://picsum.photos/seed/er-${r.id}/160/160`
                        }
                        alt={`${r.name} 이미지`}
                        width={128}
                        height={128}
                        className="h-32 w-32 rounded-xl object-cover"
                    />
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0E1730] p-3">
                    <div className="text-white/60">무기</div>
                    <div className="text-white font-medium">{r.weapon}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0E1730] p-3">
                    <div className="text-white/60">승률</div>
                    <div className="text-white font-medium">
                        {formatPercent(r.winRate)}
                    </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0E1730] p-3">
                    <div className="text-white/60">픽률</div>
                    <div className="text-white font-medium">
                        {formatPercent(r.pickRate)}
                    </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0E1730] p-3">
                    <div className="text-white/60">획득 MMR(게임당)</div>
                    <div className="text-white font-medium">
                        {formatMMR(r.mmrGain, 1)}
                    </div>
                </div>
            </div>
        </div>
    );
}
