// features/characterDetail/components/CharacterDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TierPill from "@/features/ui/TierPill";
import VariantPill from "@/features/ui/VariantPill";
import { Build, TeamComp, CharacterSummary } from "@/types";
import { formatMMR, formatPercent, formatDuration } from "@/lib/stats";
import { mockBuildsFor, mockTeamsFor } from "@/lib/mock";
import ServerCharacter from "@/features/characterDetail/types";
import TierFramedImage from "@/features/characterDetail/components/TierFramedImage";
import RadarChart from "@/features/characterDetail/components/RadarChart";
import StatLine from "@/features/characterDetail/components/StatLine";
import MiniLineChart from "@/features/characterDetail/components/MiniLineChart";
import { makeTrendSeriesPct } from "@/features/characterDetail/utils";

type VariantItem = {
    cwId: number;
    weapon: string;
    weaponCode?: number;
    weaponImageUrl?: string;
};

type OverviewBox = {
    summary?: {
        winRate?: number;
        pickRate?: number;
        mmrGain?: number;
        survivalSec?: number;
    };
    stats?: { atk: number; def: number; cc: number; spd: number; sup: number };
};

type CwOverview =
    | (OverviewBox & {
          cwId: number;
          character: { id: number; name: string; imageUrl: string };
          weapon: { code: number; name: string; imageUrl: string };
          position?: { id?: number | null; name?: string };
      })
    | {
          cwId: number;
          character: { id: number; name: string; imageUrl: string };
          weapon: { code: number; name: string; imageUrl: string };
          position?: { id?: number | null; name?: string };
          overview: OverviewBox;
      };

export default function CharacterDetailClient({
    initial,
}: {
    initial: {
        r: CharacterSummary; // tier만 사용
        variants: VariantItem[]; // 서버 제공
        currentWeapon?: string; // 서버가 선택한 무기 문자열
        builds: Build[];
        teams: TeamComp[];
        character?: ServerCharacter & {
            imageUrlMini?: string;
            imageUrlFull?: string;
        };
        overview?: CwOverview; // { ... , overview:{ summary, stats } }
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
        overview,
    } = initial;

    const displayName = character?.nameKr ?? (r as any).name ?? "이름 없음";
    const displayId = character?.id ?? r.id;
    const portraitSrc =
        character?.imageUrlMini ??
        (r as any).imageUrlMini ??
        character?.imageUrlFull ??
        `/chars/${displayId % 9 || 1}.png`;

    // pill 정렬(weaponCode → cwId → 이름)
    const sortedVariants = useMemo(() => {
        const arr = [...(variants ?? [])];
        arr.sort((a, b) => {
            const ac = a.weaponCode ?? Number.POSITIVE_INFINITY;
            const bc = b.weaponCode ?? Number.POSITIVE_INFINITY;
            if (ac !== bc) return ac - bc;
            if (a.cwId !== b.cwId) return a.cwId - b.cwId;
            return (a.weapon || "").localeCompare(b.weapon || "");
        });
        return arr;
    }, [variants]);

    // 선택값: 서버가 정해준 currentWeapon을 신뢰
    const [selectedWeapon, setSelectedWeapon] = useState(
        currentWeapon ?? sortedVariants[0]?.weapon ?? "",
    );
    const [builds, setBuilds] = useState<Build[]>(
        initBuilds ?? mockBuildsFor(displayId, selectedWeapon),
    );
    const [teams, setTeams] = useState<TeamComp[]>(
        initTeams ?? mockTeamsFor(displayId, selectedWeapon),
    );

    // 🔁 서버가 새 props(currentWeapon/overview)를 주면 동기화
    useEffect(() => {
        const next = currentWeapon ?? sortedVariants[0]?.weapon ?? "";
        setSelectedWeapon(next);
        setBuilds(mockBuildsFor(displayId, next));
        setTeams(mockTeamsFor(displayId, next));
    }, [currentWeapon, sortedVariants, displayId]);

    // overview 중첩/평탄 통합
    const ov: OverviewBox | undefined = useMemo(() => {
        if (!overview) return undefined;
        const any = overview as any;
        return any.overview
            ? any.overview
            : { summary: any.summary, stats: any.stats };
    }, [overview]);

    // 지표
    const winRate = ov?.summary?.winRate ?? 0;
    const pickRate = ov?.summary?.pickRate ?? 0;
    const mmrGain = ov?.summary?.mmrGain ?? 0;
    const survivalSec = ov?.summary?.survivalSec;

    // 레이더(1~5 → 0~1)
    const radar = useMemo(() => {
        const s = ov?.stats;
        if (!s)
            return {
                labels: ["ATK", "DEF", "SPD", "CC", "SUP"],
                values: [0.5, 0.5, 0.5, 0.5, 0.5],
            };
        const to01 = (v: number) => Math.max(0, Math.min(1, v / 5));
        return {
            labels: ["ATK", "DEF", "SPD", "CC", "SUP"],
            values: [
                to01(s.atk),
                to01(s.def),
                to01(s.spd),
                to01(s.cc),
                to01(s.sup),
            ],
        };
    }, [ov?.stats]);

    // 추세(데모)
    const winData = useMemo(
        () => makeTrendSeriesPct(winRate ?? 0.5, `${selectedWeapon}-win`),
        [winRate, selectedWeapon],
    );
    const pickData = useMemo(
        () => makeTrendSeriesPct(pickRate ?? 0.035, `${selectedWeapon}-pick`),
        [pickRate, selectedWeapon],
    );
    const [trendTab, setTrendTab] = useState<"win" | "pick">("win");

    // ✅ pill 클릭: URL wc 갱신 + 서버 데이터 강제 새로고침
    function goWeapon(v: VariantItem) {
        setSelectedWeapon(v.weapon); // 즉시 UI 표시
        setBuilds(mockBuildsFor(displayId, v.weapon));
        setTeams(mockTeamsFor(displayId, v.weapon));
        router.replace(`/characters/${displayId}?wc=${v.cwId}`, {
            scroll: false,
        });
        router.refresh(); // ← 서버가 새 overview를 fetch하도록 보장
    }

    const keyFor = (v: VariantItem, i: number) =>
        Number.isFinite(v.cwId)
            ? `cw-${v.cwId}`
            : Number.isFinite(v.weaponCode)
              ? `code-${v.weaponCode}-${i}`
              : `idx-${i}`;

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 text-app">
            {/* 헤더 */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <TierFramedImage
                        src={portraitSrc || "/fallback.png"}
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

                        {sortedVariants.length > 0 && (
                            <div className="ml-2 flex items-center gap-1 overflow-x-auto">
                                {sortedVariants.map((v, i) => (
                                    <VariantPill
                                        key={keyFor(v, i)}
                                        v={{ weapon: v.weapon } as any}
                                        selected={v.weapon === selectedWeapon}
                                        onClick={() => goWeapon(v)}
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
                {/* ① 지표 */}
                <div className="card p-4 flex flex-col h-full">
                    <h3 className="mb-2 font-semibold">지표</h3>
                    <div className="flex-1 flex items-center">
                        <div className="w-full grid gap-2 min-h-[160px]">
                            <StatLine
                                label="승률"
                                value={formatPercent(winRate ?? 0)}
                                size="sm"
                            />
                            <StatLine
                                label="픽률"
                                value={formatPercent(pickRate ?? 0)}
                                size="sm"
                            />
                            <StatLine
                                label="획득MMR"
                                value={formatMMR(mmrGain ?? 0, 1)}
                                size="sm"
                            />
                            <StatLine
                                label="평균 생존시간"
                                value={
                                    survivalSec != null
                                        ? formatDuration(
                                              Math.round(survivalSec),
                                          )
                                        : "—"
                                }
                                size="sm"
                            />
                        </div>
                    </div>
                </div>

                {/* ② 레이더 */}
                <div className="card p-4 h-full">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold">스탯 요약</h3>
                    </div>
                    <RadarChart
                        values={radar.values}
                        labels={radar.labels}
                        size={220}
                        maxR={88}
                        className="mx-auto max-w-[240px]"
                    />
                </div>

                {/* ③ 최근 추세 */}
                <div className="card p-4 flex flex-col h-full">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold">최근 추세 (14일)</h3>
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
                    <div className="flex-1 flex items-center">
                        <MiniLineChart
                            title={
                                trendTab === "win" ? "Win Rate" : "Pick Rate"
                            }
                            data={trendTab === "win" ? winData : pickData}
                            color={trendTab === "win" ? "#ef4444" : "#f59e0b"}
                            yTickCount={5}
                            suffix="%"
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
