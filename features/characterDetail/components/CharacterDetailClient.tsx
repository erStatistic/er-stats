"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TierPill from "@/features/ui/TierPill";
import VariantPill from "@/features/ui/VariantPill";
import { Build, TeamComp, CharacterSummary, WeaponStat } from "@/types";
import { formatMMR, formatPercent, formatDuration } from "@/lib/stats";
import { mockBuildsFor, mockTeamsFor } from "@/lib/mock";
import ServerCharacter from "@/features/characterDetail/types";
import TierFramedImage from "@/features/characterDetail/components/TierFramedImage";
import RadarChart from "@/features/characterDetail/components/RadarChart";
import StatLine from "@/features/characterDetail/components/StatLine";
import MiniLineChart from "@/features/characterDetail/components/MiniLineChart";
import { makeTrendSeriesPct } from "@/features/characterDetail/utils";

export default function CharacterDetailClient({
    initial,
}: {
    initial: {
        r: CharacterSummary;
        variants: WeaponStat[];
        currentWeapon?: string;
        builds: Build[];
        teams: TeamComp[];
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

    const displayName = character?.nameKr ?? (r as any).name ?? "이름 없음";
    const displayId = character?.id ?? r.id;
    const imageUrl =
        character?.imageUrlFull ??
        (r as any).imageUrlFull ??
        `/chars/${displayId % 9 || 1}.png`;
    const portraitSrc =
        character?.imageUrlMini ??
        (r as any).imageUrlMini ??
        imageUrl ??
        "/fallback.png";

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

    // 평균 생존시간(초) 계산
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

    // ───────────── 레이더(오각형) 데이터 계산 ─────────────
    // 정규화 유틸
    const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    const tierScore = (tier: string) => {
        const t = (tier || "").toUpperCase();
        if (t.startsWith("S")) return 1.0;
        if (t.startsWith("A")) return 0.8;
        if (t.startsWith("B")) return 0.6;
        if (t.startsWith("C")) return 0.4;
        if (t.startsWith("D")) return 0.25;
        return 0.1; // F or 기타
    };
    // mmrGain은 프로젝트에 맞게 범위를 조정하세요(여기선 -20~+40을 0~1로)
    const normMMR = (mmr: number) => clamp((mmr + 20) / 60);
    // 생존시간은 0~20분(1200s)을 0~1로
    const normSurvival = (sec: number) => clamp(sec / 1200);

    const radar = useMemo(() => {
        const w = current?.winRate ?? 0; // 0~1
        const p = current?.pickRate ?? 0; // 0~1
        const m = normMMR(current?.mmrGain ?? 0);
        const s = survivalSec != null ? normSurvival(survivalSec) : 0;
        const t = tierScore(r.tier);
        return {
            labels: ["ATK", "DEF", "SPD", "CC", "SUP"],
            values: [w, p, m, s, t], // 0~1
            raw: {
                win: w,
                pick: p,
                mmr: current?.mmrGain ?? 0,
                survival: survivalSec ?? 0,
                tier: r.tier,
            },
        };
    }, [current, survivalSec, r.tier]);

    // 14일 시계열 (메모이제이션)
    const winData = useMemo(
        () =>
            makeTrendSeriesPct(
                current?.winRate ?? 0.5,
                `${selectedWeapon}-win`,
            ),
        [current?.winRate, selectedWeapon],
    );
    const pickData = useMemo(
        () =>
            makeTrendSeriesPct(
                current?.pickRate ?? 0.035,
                `${selectedWeapon}-pick`,
            ),
        [current?.pickRate, selectedWeapon],
    );

    // 탭 상태
    const [trendTab, setTrendTab] = useState<"win" | "pick">("win");
    return (
        <div className="mx-auto max-w-5xl px-4 py-6 text-app">
            {/* 헤더 */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <TierFramedImage
                        src={portraitSrc}
                        alt={displayName}
                        tier={r.tier}
                        size={72}
                        thickness={3}
                        corner="tl"
                        radius="xl"
                    />

                    <div className="flex items-center gap-2 min-w-0">
                        <h1 className="text-2xl font-bold truncate">
                            {displayName}
                        </h1>
                        <TierPill tier={r.tier} />

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
                            router.push("/characters");
                        }
                    }}
                    className="rounded-lg border border-app bg-muted px-3 py-2 text-xs hover:bg-elev-10 whitespace-nowrap"
                >
                    ← 목록으로
                </button>
            </div>
            {/* 상단 카드들 */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-stretch">
                {/* ① 지표 (컴팩트 pill 세로열) */}
                <div className="card p-4 flex flex-col h-full">
                    <h3 className="mb-2 text-sm text-muted-app">지표</h3>

                    {/* 본문: 남은 높이에서 수직 가운데 정렬 */}
                    <div className="flex-1 flex items-center">
                        <div className="w-full grid gap-2 min-h-[160px]">
                            {current ? (
                                <>
                                    <StatLine
                                        label="승률"
                                        value={formatPercent(current.winRate)}
                                        size="sm"
                                    />
                                    <StatLine
                                        label="픽률"
                                        value={formatPercent(current.pickRate)}
                                        size="sm"
                                    />
                                    <StatLine
                                        label="획득MMR"
                                        value={formatMMR(current.mmrGain, 1)}
                                        size="sm"
                                    />
                                    <StatLine
                                        label="평균 생존시간"
                                        value={
                                            survivalSec != null
                                                ? formatDuration(survivalSec)
                                                : "—"
                                        }
                                        size="sm"
                                    />
                                </>
                            ) : (
                                <span className="text-app font-medium">—</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ② 스탯 요약 (레이더) */}
                <div className="card p-4 h-full">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold">스탯 요약</h3>
                        <div className="text-xs text-muted-app">
                            {radar.labels.join(" · ")}
                        </div>
                    </div>
                    <RadarChart
                        values={radar.values}
                        labels={radar.labels}
                        size={220}
                        maxR={88}
                        className="mx-auto max-w-[240px]"
                    />
                </div>

                {/* ③ 최근 추세(14일): 탭으로 승률/픽률 전환 */}
                <div className="card p-4 flex flex-col h-full">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold">최근 추세 (14일)</h3>

                        {/* 탭 */}
                        <div
                            role="tablist"
                            aria-label="최근 추세 탭"
                            className="flex gap-1"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={trendTab === "win"}
                                className={`nav-pill ${trendTab === "win" ? "is-active" : ""}`}
                                onClick={() => setTrendTab("win")}
                            >
                                승률
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={trendTab === "pick"}
                                className={`nav-pill ${trendTab === "pick" ? "is-active" : ""}`}
                                onClick={() => setTrendTab("pick")}
                            >
                                픽률
                            </button>
                        </div>
                    </div>

                    {/* 본문: 가운데 정렬된 단일 차트 */}
                    <div className="flex-1 flex items-center">
                        <MiniLineChart
                            title={
                                trendTab === "win" ? "Win Rate" : "Pick Rate"
                            }
                            data={trendTab === "win" ? winData : pickData}
                            color={trendTab === "win" ? "#ef4444" : "#f59e0b"} // 원하면 var(--brand)로
                            yTickCount={5}
                            suffix="%" // MiniLineChart의 Y라벨에 % 붙이려면 컴포넌트 쪽에서도 사용하도록 반영해둔 버전이어야 해요
                            decimals={1}
                            width={340}
                            height={170}
                        />
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
