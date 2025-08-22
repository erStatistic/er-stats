"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
        <div className="mx-auto max-w-5xl px-4 py-6 text-app">
            {/* 헤더 */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <h1 className="text-2xl font-bold truncate">{r.name}</h1>
                    <TierPill tier={r.tier} />
                    {/* 무기군 선택 (이름 오른쪽) */}
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
                    type="button"
                    onClick={() => router.push("/")}
                    className="rounded-lg border border-app bg-muted px-3 py-2 text-xs hover:bg-elev-10 whitespace-nowrap"
                >
                    ← 목록으로
                </button>
            </div>

            {/* 상단 카드들 */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* 이미지 */}
                <div className="card p-4 flex items-center justify-center">
                    <Image
                        src={r.imageUrl || `/chars/${r.id % 9 || 1}.png`}
                        alt={`${r.name} 이미지`}
                        width={160}
                        height={160}
                        className="h-40 w-40 rounded-xl object-cover"
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

                {/* 선택 무기/수치 */}
                <div className="card p-4">
                    <div className="text-muted-app">선택 무기</div>
                    <div className="text-app font-medium">{selectedWeapon}</div>

                    <div className="mt-3 text-muted-app">
                        승률 · 픽률 · 획득MMR
                    </div>
                    <div className="text-app font-medium">
                        {formatPercent(current.winRate)} ·{" "}
                        {formatPercent(current.pickRate)} ·{" "}
                        {formatMMR(current.mmrGain, 1)}
                    </div>
                </div>

                {/* 티어 */}
                <div className="card p-4">
                    <div className="text-muted-app">티어</div>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="text-app">{r.tier}</span>
                        <span className="text-xs text-muted-app">
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
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {builds.map((b) => (
                        <div key={b.id} className="card p-4">
                            <div className="font-medium text-app">
                                {b.title}
                            </div>
                            <div className="text-xs text-muted-app mt-1">
                                {b.description}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1 text-xs">
                                {b.items.map((it, i) => (
                                    <span
                                        key={i}
                                        className="muted-strip px-2 py-1"
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
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {teams.map((t) => (
                        <div key={t.id} className="card p-4">
                            <div className="font-medium text-app">
                                {t.title}
                            </div>
                            <div className="text-xs text-muted-app mt-1">
                                {t.note || "—"}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1 text-xs">
                                {t.members.map((m) => (
                                    <span
                                        key={m.id}
                                        className="muted-strip px-2 py-1"
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
