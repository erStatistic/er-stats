"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Build, TeamComp, CharacterSummary, WeaponStat } from "@/types";
import { formatMMR, formatPercent, formatDuration } from "@/lib/stats";
import TierPill from "@/features/ui/TierPill";
import VariantPill from "@/features/ui/VariantPill";
import { mockBuildsFor, mockTeamsFor } from "@/lib/mock";
import { useRouter } from "next/navigation";
import ServerCharacter from "@/features/characterDetail/types";

export default function CharacterDetailClient({
    initial,
}: {
    initial: {
        r: CharacterSummary;
        variants: WeaponStat[];
        currentWeapon?: string;
        builds: Build[];
        teams: TeamComp[];
        // 서버 컴포넌트에서 API로 받아온 정식 캐릭터 정보 (선호)
        character?: ServerCharacter;
    };
}) {
    const router = useRouter();
    const {
        r,
        variants,
        currentWeapon,
        builds: initBuilds,
        teams: initTeams,
        character,
    } = initial;

    // 이름/이미지는 서버 데이터 > 요약 r > 폴백 순서로 선택
    const displayName = character?.nameKr ?? (r as any).name ?? "이름 없음";
    const displayId = character?.id ?? r.id;

    const imageUrl =
        character?.imageUrlFull ??
        (r as any).imageUrlFull ??
        `/chars/${displayId % 9 || 1}.png`;

    // 선택 무기
    const [selectedWeapon, setSelectedWeapon] = useState(
        currentWeapon ?? variants[0]?.weapon ?? "",
    );
    const [builds, setBuilds] = useState(initBuilds);
    const [teams, setTeams] = useState(initTeams);

    function onSelectWeapon(w: string) {
        setSelectedWeapon(w);
        setBuilds(mockBuildsFor(displayId, w));
        setTeams(mockTeamsFor(displayId, w));
    }

    const current = useMemo(
        () => variants.find((v) => v.weapon === selectedWeapon) ?? variants[0],
        [variants, selectedWeapon],
    );

    // 평균 생존시간 계산
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
        <div className="mx-auto max-w-5xl px-4 py-6 text-app">
            {/* 헤더 */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <h1 className="text-2xl font-bold truncate">
                        {displayName}
                    </h1>
                    <TierPill tier={r.tier} />

                    {/* 무기군 선택 */}
                    {variants.length > 0 && (
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
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => {
                        if (
                            typeof window !== "undefined" &&
                            window.history.length > 1
                        ) {
                            router.back();
                        } else {
                            router.push("/characters"); // 목록 경로 수정
                        }
                    }}
                    className="rounded-lg border border-app bg-muted px-3 py-2 text-xs hover:bg-elev-10 whitespace-nowrap"
                >
                    ← 목록으로
                </button>
            </div>

            {/* 상단 카드들 */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="card p-4">
                    <div className="text-muted-app">선택 무기</div>
                    <div className="text-app font-medium">
                        {selectedWeapon || "—"}
                    </div>

                    <div className="mt-3 text-muted-app">
                        승률 · 픽률 · 획득MMR
                    </div>
                    <div className="text-app font-medium">
                        {current ? (
                            <>
                                {formatPercent(current.winRate)} ·{" "}
                                {formatPercent(current.pickRate)} ·{" "}
                                {formatMMR(current.mmrGain, 1)}
                            </>
                        ) : (
                            "—"
                        )}
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

                {/* 평균 생존시간 */}
                <div className="card p-4">
                    <div className="text-muted-app">평균 생존시간(게임당)</div>
                    <div className="text-app font-medium">
                        {survivalSec != null
                            ? formatDuration(survivalSec)
                            : "—"}
                    </div>
                </div>
            </div>

            {/* 추천 빌드 */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                    {selectedWeapon || "—"} 추천 빌드
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
                    {selectedWeapon || "—"} 추천 팀 조합
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
