"use client";
import { Copy, Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import VariantPill from "@/features/ui/VariantPill";
import { Build, TeamComp, CharacterSummary, Role } from "@/types";
import { formatMMR, formatPercent, formatDuration } from "@/lib/stats";
import { mockBuildsFor, mockTeamsFor } from "@/lib/mock";
import ServerCharacter from "@/features/characterDetail/types";
import TierFramedImage from "@/features/characterDetail/components/TierFramedImage";
import RadarChart from "@/features/characterDetail/components/RadarChart";
import MiniLineChart from "@/features/characterDetail/components/MiniLineChart";
import KpiCard from "@/features/characterDetail/components/KpiCard";
import ClusterBadge from "@/features/cluster-dict/components/ClusterBadge";
import RolePill from "@/features/ui/RolePill";

// ---- API 타입들 ----
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
    routes?: Array<{ id: number; title?: string }>;
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

type TrendRow = {
    day: string; // "YYYY-MM-DD"
    samples: number;
    win_rate: number; // 0~1
    pick_rate: number; // 0~1
};

type BestCompRow = {
    comp_key: number[];
    samples: number;
    wins: number;
    win_rate: number; // 0~1
    pick_rate: number; // 0~1
    avg_mmr: number;
    avg_survival: number;
    s_score: number;
    members: Array<{
        cw_id: number;
        weapon_id: number;
        character_id: number;
        weapon_name_kr: string;
        character_name_kr: string;
        image_url_mini?: string | null;
    }>;
};

// ---- UI 전용 타입(메타/이미지 포함) ----
type UiTeamComp = TeamComp & {
    meta?: { win: number; pick: number; mmr: number; samples: number };
    membersEx?: Array<{ id: number; name: string; img?: string }>;
};

function AvatarWithWeapon({
    charSrc,
    weaponSrc,
    size = 56,
    dot = 18,
    onError,
}: {
    charSrc: string;
    weaponSrc?: string;
    size?: number;
    dot?: number;
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
    return (
        <div
            className="relative rounded-full border"
            style={{
                width: size,
                height: size,
                borderColor: "var(--border)",
                background: "var(--surface)",
            }}
        >
            <img
                src={charSrc}
                alt=""
                className="w-full h-full object-cover rounded-full"
                onError={onError}
            />
            {weaponSrc && (
                <div
                    className="absolute right-0 bottom-0 rounded-full border-2 shadow"
                    style={{
                        width: dot,
                        height: dot,
                        backgroundColor: "#000",
                        borderColor: "var(--surface)",
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    <img
                        src={weaponSrc}
                        alt=""
                        className="rounded-full"
                        style={{
                            width: Math.round(dot * 0.78),
                            height: Math.round(dot * 0.78),
                            objectFit: "contain",
                        }}
                        onError={onError}
                    />
                </div>
            )}
        </div>
    );
}

export default function CharacterDetailClient({
    initial,
}: {
    initial: {
        r: CharacterSummary;
        variants: VariantItem[];
        currentWeapon?: string;
        builds: Build[];
        teams: TeamComp[];
        character?: ServerCharacter & {
            imageUrlMini?: string;
            imageUrlFull?: string;
        };
        overview?: CwOverview;
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

    console.log(r);
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

    const [selectedWeapon, setSelectedWeapon] = useState(
        currentWeapon ?? sortedVariants[0]?.weapon ?? "",
    );
    const [builds, setBuilds] = useState<Build[]>(
        initBuilds ?? mockBuildsFor(displayId, selectedWeapon),
    );
    const [teams, setTeams] = useState<UiTeamComp[]>(
        (initTeams as UiTeamComp[]) ??
            (mockTeamsFor(displayId, selectedWeapon) as UiTeamComp[]),
    );

    // 의존성 안정화를 위한 키
    const variantsKey = useMemo(
        () =>
            sortedVariants
                .map(
                    (v) =>
                        `${v.weaponCode ?? ""}:${v.cwId ?? ""}:${v.weapon ?? ""}`,
                )
                .join("|"),
        [sortedVariants],
    );

    // 서버 값이 바뀐 경우에만 동기화 (사용자 pill 클릭을 덮어쓰지 않도록)
    const lastServerWeaponRef = useRef<string | undefined>(currentWeapon);
    const lastDisplayIdRef = useRef<number | undefined>(displayId);

    useEffect(() => {
        const serverChanged = currentWeapon !== lastServerWeaponRef.current;
        const idChanged = lastDisplayIdRef.current !== displayId;

        if (serverChanged) lastServerWeaponRef.current = currentWeapon;
        if (idChanged) lastDisplayIdRef.current = displayId;

        if (serverChanged || idChanged) {
            const first = sortedVariants[0]?.weapon ?? "";
            const next = currentWeapon ?? first;

            if (next && next !== selectedWeapon) {
                setSelectedWeapon(next);
                setBuilds(mockBuildsFor(displayId, next));
                setTeams(
                    (initTeams as UiTeamComp[]) ??
                        (mockTeamsFor(displayId, next) as UiTeamComp[]),
                );
            } else if (!next && !selectedWeapon && first) {
                setSelectedWeapon(first);
                setBuilds(mockBuildsFor(displayId, first));
                setTeams(
                    (initTeams as UiTeamComp[]) ??
                        (mockTeamsFor(displayId, first) as UiTeamComp[]),
                );
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWeapon, variantsKey, displayId]);

    // overview 중첩/평탄 통합
    const ov: OverviewBox | undefined = useMemo(() => {
        if (!overview) return undefined;
        const any = overview as any;
        return any.overview ? any.overview : { ...any };
    }, [overview]);

    // 지표
    const winRate = ov?.summary?.winRate ?? 0;
    const pickRate = ov?.summary?.pickRate ?? 0;
    const mmrGain = ov?.summary?.mmrGain ?? 0;
    const survivalSec = ov?.summary?.survivalSec;

    const metricsAllZero =
        (winRate ?? 0) === 0 &&
        (pickRate ?? 0) === 0 &&
        (mmrGain ?? 0) === 0 &&
        (survivalSec ?? 0) === 0;
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

    // --------- 🔻 트렌드(실 DB) ----------
    const [trendTab, setTrendTab] = useState<"win" | "pick">("win");
    const [trendLoading, setTrendLoading] = useState(false);
    const [trendWin, setTrendWin] = useState<Array<{ x: string; y: number }>>(
        [],
    );
    const [trendPick, setTrendPick] = useState<Array<{ x: string; y: number }>>(
        [],
    );

    const selectedCwId = useMemo(() => {
        const v = sortedVariants.find((v) => v.weapon === selectedWeapon);
        return v?.cwId;
    }, [sortedVariants, selectedWeapon]);

    const fetchTrend = useCallback(async (cwId?: number) => {
        if (!cwId) {
            setTrendWin([]);
            setTrendPick([]);
            return;
        }
        setTrendLoading(true);
        try {
            const base =
                process.env.NEXT_PUBLIC_API_BASE_URL ||
                process.env.API_BASE_URL ||
                "";
            const url = `${base}/api/v1/analytics/cw/${cwId}/trend`;
            const res = await fetch(url, {
                cache: "no-store",
                headers: { accept: "application/json" },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const rows: TrendRow[] = Array.isArray(json?.data) ? json.data : [];
            const toLabel = (s: string) => s.slice(5); // "MM-DD"
            setTrendWin(
                rows.map((r) => ({
                    x: toLabel(r.day),
                    y: Math.round(r.win_rate * 1000) / 10,
                })),
            );
            setTrendPick(
                rows.map((r) => ({
                    x: toLabel(r.day),
                    y: Math.round(r.pick_rate * 1000) / 10,
                })),
            );
        } catch (e) {
            console.error("trend fetch failed:", e);
            setTrendWin([]);
            setTrendPick([]);
        } finally {
            setTrendLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrend(selectedCwId);
    }, [selectedCwId, fetchTrend]);
    // --------------------------------------

    // --------- 🔻 추천 팀 조합(실 DB) ----------
    const [compsLoading, setCompsLoading] = useState(false);

    const fetchBestComps = useCallback(
        async (cwId?: number) => {
            if (!cwId) return;

            setCompsLoading(true);
            try {
                const base =
                    process.env.NEXT_PUBLIC_API_BASE_URL ||
                    process.env.API_BASE_URL ||
                    "";
                const url = `${base}/api/v1/analytics/cw/${cwId}/best-comps?limit=2&minSamples=20`;
                const res = await fetch(url, {
                    cache: "no-store",
                    headers: { accept: "application/json" },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const rows: BestCompRow[] = Array.isArray(json?.data)
                    ? json.data
                    : [];

                const mapped: UiTeamComp[] = rows.map((row) => ({
                    id: row.comp_key.join("-"),
                    members: row.members.map((m) => ({
                        id: m.cw_id,
                        name: m.character_name_kr,
                    })),
                    membersEx: row.members.map((m) => ({
                        id: m.cw_id,
                        name: m.character_name_kr,
                        img: m.image_url_mini || undefined,
                    })),
                    meta: {
                        win: row.win_rate,
                        pick: row.pick_rate,
                        mmr: row.avg_mmr,
                        samples: row.samples,
                    },
                }));

                setTeams(mapped);
            } catch (e) {
                console.error("best-comps fetch failed:", e);
                const mock = mockTeamsFor(
                    displayId,
                    selectedWeapon,
                ) as UiTeamComp[];
                setTeams(
                    mock.map((t) => ({
                        ...t,
                        meta: { win: 0, pick: 0, mmr: 0, samples: 0 },
                    })),
                );
            } finally {
                setCompsLoading(false);
            }
        },
        [displayId, selectedWeapon],
    );

    useEffect(() => {
        fetchBestComps(selectedCwId);
    }, [selectedCwId, fetchBestComps]);
    // --------------------------------------

    // ✅ 조합 존재 여부
    const hasComps = useMemo(() => {
        if (!teams || teams.length === 0) return false;
        return teams.some(
            (t) =>
                ((t as UiTeamComp).membersEx?.length ?? 0) > 0 ||
                (t.members?.length ?? 0) > 0,
        );
    }, [teams]);

    // ✅ pill 클릭: wc=weaponId(=weaponCode)로 라우팅
    function goWeapon(v: VariantItem) {
        setSelectedWeapon(v.weapon);
        setBuilds(mockBuildsFor(displayId, v.weapon));
        const code = Number.isFinite(v.weaponCode as number)
            ? Number(v.weaponCode)
            : undefined;
        const qs = code != null ? `?wc=${code}` : "";
        router.replace(`/characters/${displayId}${qs}`, { scroll: false });
        router.refresh();
    }

    const positionName =
        (overview as any)?.position?.name ??
        (character as any)?.position?.name ??
        "";

    const clusters: string[] = useMemo(() => {
        const c =
            (character as any)?.clusters ??
            (overview as any)?.clusters ??
            (r as any)?.clusters ??
            [];
        return Array.isArray(c) ? [...c].sort() : [];
    }, [character, overview, r]);

    const keyFor = (v: VariantItem, i: number) =>
        Number.isFinite(v.cwId)
            ? `cw-${v.cwId}`
            : Number.isFinite(v.weaponCode)
              ? `code-${v.weaponCode}-${i}`
              : `idx-${i}`;

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 text-app">
            {/* 헤더 */}
            {metricsAllZero && !ov?.routes?.length && !hasComps && (
                <div className="mb-4 rounded-md border border-app/40 bg-elev-5 px-3 py-2 text-xm font-bold text-muted-app text-center">
                    신규/최근 추가된 캐릭터라 데이터가 아직 부족해요. 일정량
                    이상 쌓이면 지표·추천이 자동으로 채워집니다.
                </div>
            )}
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

                {(positionName || clusters.length > 0) && (
                    <div className="flex items-center gap-2 overflow-x-auto shrink-0">
                        {clusters.map((c) => (
                            <ClusterBadge key={c} label={c} />
                        ))}
                        {positionName && (
                            <RolePill role={positionName as Role} />
                        )}
                    </div>
                )}
            </div>

            {/* 상단 카드들 */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-stretch">
                {/* ① 지표 */}
                <div className="card p-4 flex flex-col h-full">
                    <h3 className="font-semibold">지표</h3>
                    <div className="grid grid-cols-2 gap-3 my-auto">
                        <KpiCard
                            label="승률"
                            value={formatPercent(winRate ?? 0)}
                        />
                        <KpiCard
                            label="픽률"
                            value={formatPercent(pickRate ?? 0)}
                        />
                        <KpiCard
                            label="획득MMR"
                            value={formatMMR(mmrGain ?? 0, 1)}
                        />
                        <KpiCard
                            label="평균 생존시간"
                            value={
                                survivalSec != null
                                    ? formatDuration(Math.round(survivalSec))
                                    : "—"
                            }
                        />
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
                        {trendLoading ? (
                            <div className="w-full h-[170px] animate-pulse rounded-md bg-elev-5" />
                        ) : (
                            <MiniLineChart
                                title={
                                    trendTab === "win"
                                        ? "Win Rate"
                                        : "Pick Rate"
                                }
                                data={trendTab === "win" ? trendWin : trendPick}
                                color={
                                    trendTab === "win" ? "#ef4444" : "#f59e0b"
                                }
                                yTickCount={5}
                                suffix="%"
                                decimals={1}
                                width={340}
                                height={170}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 추천 빌드 */}
            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">추천 빌드</h2>

                {/* ✅ 아무 경로도 없을 때 */}
                {(!ov?.routes || ov.routes.length === 0) && (
                    <div className="card p-6 flex items-center justify-center">
                        <div className="text-center">
                            <div className="font-medium text-app">
                                추천 빌드가 없습니다
                            </div>
                            <div className="text-xs text-muted-app mt-1">
                                최근 데이터 기준 조건을 만족하는 추천 경로가
                                아직 없어요.
                            </div>
                        </div>
                    </div>
                )}

                {ov?.routes?.length > 0 && (
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 items-stretch">
                        {ov.routes.map((b) => (
                            <div key={b.id} className="card p-4 relative">
                                <CopyButton id={b.id} />
                                <div className="font-medium text-app">
                                    루트 번호: {b.id}
                                </div>
                                <div className="text-xs text-muted-app mt-1">
                                    {b.title || "추천"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            {/* 추천 팀 조합 */}
            <section>
                <h2 className="text-lg font-semibold mb-2">추천 팀 조합</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {compsLoading && (
                        <>
                            <div className="card p-4 h-[140px] animate-pulse bg-elev-5" />
                            <div className="card p-4 h-[140px] animate-pulse bg-elev-5" />
                        </>
                    )}

                    {/* ✅ 빈 상태 카드 */}
                    {!compsLoading && !hasComps && (
                        <div className="card p-6 col-span-1 md:col-span-2 flex items-center justify-center">
                            <div className="text-center">
                                <div className="font-medium text-app">
                                    추천 조합이 없습니다
                                </div>
                                <div className="text-xs text-muted-app mt-1">
                                    최근 데이터 기준 조건을 만족하는 팀이
                                    없어요.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ 조합 카드 */}
                    {!compsLoading &&
                        hasComps &&
                        teams.map((t) => {
                            const meta = (t as UiTeamComp).meta;
                            const ex = (t as UiTeamComp).membersEx;
                            return (
                                <div key={t.id} className="card p-4">
                                    <div className="mt-3 flex items-center justify-center gap-6 sm:gap-8 md:gap-10">
                                        {ex?.map((m) => (
                                            <div
                                                key={m.id}
                                                className="flex flex-col items-center"
                                            >
                                                <img
                                                    src={
                                                        m.img ||
                                                        `/chars/${m.id % 9 || 1}.png`
                                                    }
                                                    alt={m.name}
                                                    className="w-12 h-12 rounded-full border border-app/30 object-cover"
                                                    loading="lazy"
                                                />
                                                <div className="mt-1 text-xs text-app">
                                                    {m.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {meta && (
                                        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-app text-center">
                                            <div>
                                                승률 {formatPercent(meta.win)}
                                            </div>
                                            <div>
                                                MMR {formatMMR(meta.mmr, 1)}
                                            </div>
                                            <div>표본 {meta.samples}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </section>
        </div>
    );
}

// 작은 복사 버튼 분리
function CopyButton({ id }: { id: number }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-md border border-app/40 bg-elev-5 hover:bg-elev-10 text-muted-app hover:text-app transition focus:outline-none focus:ring-2 focus:ring-app/40"
            aria-label={`루트 ID ${id} 복사`}
            title={copied ? "복사됨!" : "복사"}
            onClick={async (e) => {
                e.preventDefault();
                const text = String(id);
                try {
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(text);
                    } else {
                        const ta = document.createElement("textarea");
                        ta.value = text;
                        ta.style.position = "fixed";
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand("copy");
                        document.body.removeChild(ta);
                    }
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                } catch (err) {
                    console.error("Copy failed:", err);
                }
            }}
        >
            {copied ? (
                <Check size={16} aria-hidden />
            ) : (
                <Copy size={16} aria-hidden />
            )}
            <span className="sr-only">복사</span>
        </button>
    );
}
