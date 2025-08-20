"use client";
import { useMemo, useState } from "react";
import { Build, TeamComp, CharacterSummary, WeaponStat } from "@/types";
import { formatMMR, formatPercent } from "@/lib/stats";
import TierPill from "@/components/TierPill";
import VariantPill from "@/components/VariantPill";
import { mockBuildsFor, mockTeamsFor } from "@/lib/mock";
import { useRouter } from "next/navigation";

export default function CharacterDetailClient({
    initial,
}: {
    initial: {
        r: CharacterSummary;
        variants: WeaponStat[];
        currentWeapon: string;
        builds: Build[];
        teams: TeamComp[];
    };
}) {
    const router = useRouter();
    const {
        r,
        variants,
        currentWeapon,
        builds: initBuilds,
        teams: initTeams,
    } = initial;
    const [selectedWeapon, setSelectedWeapon] = useState(currentWeapon);
    const [builds, setBuilds] = useState(initBuilds);
    const [teams, setTeams] = useState(initTeams);

    // 무기 선택 변경 시 추천 섹션 갱신
    function onSelectWeapon(w: string) {
        setSelectedWeapon(w);
        setBuilds(mockBuildsFor(r.id, w));
        setTeams(mockTeamsFor(r.id, w));
    }

    const current = useMemo(
        () => variants.find((v) => v.weapon === selectedWeapon) || variants[0],
        [variants, selectedWeapon],
    );

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 text-white">
            {/* 헤더 */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <h1 className="text-2xl font-bold truncate">{r.name}</h1>
                    <TierPill tier={r.tier} />
                    <div className="ml-2 flex items-center gap-1 overflow-x-auto">
                        {variants.map((v) => (
                            <VariantPill
                                key={v.weapon}
                                v={v}
                                selected={v.weapon === selectedWeapon}
                                onClick={() => onSelectWeapon(v.weapon)}
                            />
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => router.push("/")}
                    className="text-xs rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5 whitespace-nowrap"
                >
                    ← 목록으로
                </button>
            </div>

            {/* 상단 카드들 */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-[#111A2E] p-4 flex items-center justify-center">
                    <img
                        src={r.imageUrl}
                        alt={`${r.name} 이미지`}
                        className="h-40 w-40 rounded-xl object-cover"
                    />
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#111A2E] p-4">
                    <div className="text-white/60">선택 무기</div>
                    <div className="text-white font-medium">
                        {selectedWeapon}
                    </div>
                    <div className="mt-3 text-white/60">
                        승률 · 픽률 · 획득MMR
                    </div>
                    <div className="text-white font-medium">
                        {formatPercent(current.winRate)} ·{" "}
                        {formatPercent(current.pickRate)} ·{" "}
                        {formatMMR(current.mmrGain, 1)}
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#111A2E] p-4">
                    <div className="text-white/60">티어</div>
                    <div className="mt-1 flex items-center gap-2">
                        <span>{r.tier}</span>
                        <span className="text-xs text-white/50">
                            (최근 14일, 프리뷰)
                        </span>
                    </div>
                </div>
            </div>

            {/* 추천 빌드 */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                    {selectedWeapon} 추천 빌드
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {builds.map((b) => (
                        <div
                            key={b.id}
                            className="rounded-xl border border-white/10 bg-[#111A2E] p-4"
                        >
                            <div className="text-white font-medium">
                                {b.title}
                            </div>
                            <div className="text-xs text-white/60 mt-1">
                                {b.description}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1 text-xs">
                                {b.items.map((it, i) => (
                                    <span
                                        key={i}
                                        className="rounded-md bg-[#0E1730] border border-white/10 px-2 py-1"
                                    >
                                        {it}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 추천 팀 조합 */}
            <section>
                <h2 className="text-lg font-semibold mb-2">
                    {selectedWeapon} 추천 팀 조합
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teams.map((t) => (
                        <div
                            key={t.id}
                            className="rounded-xl border border-white/10 bg-[#111A2E] p-4"
                        >
                            <div className="text-white font-medium">
                                {t.title}
                            </div>
                            <div className="text-xs text-white/60 mt-1">
                                {t.note || "—"}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1 text-xs">
                                {t.members.map((m) => (
                                    <span
                                        key={m.id}
                                        className="rounded-md bg-[#0E1730] border border-white/10 px-2 py-1"
                                    >
                                        {m.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
