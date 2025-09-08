"use client";

import { useMemo, useState } from "react";
import { ClusterTriadSummary } from "@/types";
import Carousel from "@/features/ui/Carousel";
import ClusterCompCard from "./ClusterCompCard";
import { formatDuration } from "@/lib/stats";
import { PATCHES, GAME_TIERS } from "@/features";
import { SortKey } from "@/features/cluster-comps";
import ClusterPreviewRail from "@/features/cluster-comps/components/ClusterPreviewRail";

type TriadRef = {
    ids: number[];
    text: string; // "K · P · U"
};

/** 라벨 글자 → 클러스터 숫자 ID (스키마에 맞게 필요시 조정) */
const LETTER_TO_ID: Record<string, number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
    I: 9,
    J: 10,
    K: 11,
    L: 12,
    M: 13,
    N: 14,
    O: 15,
    P: 16,
    Q: 17,
    R: 18,
    S: 19,
    T: 20,
    U: 21,
};
const splitLabel = (txt: string) =>
    txt
        .split("·")
        .map((s) => s.trim())
        .filter(Boolean);
const lettersToIds = (letters: string[]) =>
    letters
        .map((x) => x.toUpperCase())
        .map((c) => LETTER_TO_ID[c])
        .filter((n): n is number => Number.isFinite(n));

export default function ClusterCompsClient({
    initial,
}: {
    initial: ClusterTriadSummary[];
}) {
    const [q, setQ] = useState("");
    const [patch, setPatch] = useState<Patch>("All");
    const [tier, setTier] = useState<GameTier>("All");
    const [sort, setSort] = useState<SortKey>("winRate");

    // ✅ 사이드 미리보기 상태 (숫자 IDs + 라벨 텍스트)
    const [previewTriad, setPreviewTriad] = useState<TriadRef | null>(null); // hover
    const [pinnedTriad, setPinnedTriad] = useState<TriadRef | null>(null); // click 고정

    // Top3 (전체 기준)
    const topOverall = useMemo(() => {
        const arr = [...initial];
        arr.sort((a, b) => b.winRate - a.winRate);
        return arr.slice(0, Math.min(3, arr.length));
    }, [initial]);

    // 진행바 최대값(Top3 기준)
    const topMax = useMemo(() => {
        if (topOverall.length === 0) {
            return { winRate: 1, pickRate: 1, mmr: 1, games: 1 };
        }
        return {
            winRate: Math.max(
                0,
                ...topOverall.map((s) => Number(s.winRate || 0)),
            ),
            pickRate: Math.max(
                0,
                ...topOverall.map((s) => Number(s.pickRate || 0)),
            ),
            mmr: Math.max(1, ...topOverall.map((s) => Number(s.mmrGain || 0))),
            games: Math.max(1, ...topOverall.map((s) => Number(s.count || 0))),
        };
    }, [topOverall]);

    // 필터링
    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return initial
            .filter(
                (s) =>
                    (patch === "All" || s.patch === patch) &&
                    (tier === "All" || s.tier === tier),
            )
            .filter((s) => {
                if (!qq) return true;
                const label = Array.isArray(s.clusters)
                    ? s.clusters.join("")
                    : String((s as any).cluster_label ?? "");
                return label.toLowerCase().includes(qq);
            });
    }, [initial, patch, tier, q]);

    // 정렬
    const sorted = useMemo(() => {
        const c = [...filtered];
        c.sort((a, b) => {
            switch (sort) {
                case "pickRate":
                    return b.pickRate - a.pickRate;
                case "mmrGain":
                    return b.mmrGain - a.mmrGain;
                case "count":
                    return b.count - a.count;
                case "survivalTime": {
                    const na = a.survivalTime ?? -Infinity;
                    const nb = b.survivalTime ?? -Infinity;
                    return nb - na;
                }
                default:
                    return b.winRate - a.winRate;
            }
        });
        return c;
    }, [filtered, sort]);

    /** 행에서 TriadRef(ids+text) 만들기
     *  1) s.clusterIds (camelCase) 우선 사용
     *  2) 없으면 s["cluster_ids"] 사용
     *  3) 그래도 없으면 라벨(clusters/cluster_label)에서 복구
     */
    const toTriadRef = (s: ClusterTriadSummary): TriadRef => {
        const any = s as any;

        const text = Array.isArray(s.clusters)
            ? s.clusters.join(" · ")
            : typeof any.cluster_label === "string"
              ? any.cluster_label
              : "";

        let ids: number[] | undefined =
            (s as any).clusterIds ?? (s as any).cluster_ids;

        if (!Array.isArray(ids) || ids.length === 0) {
            if (Array.isArray(s.clusters)) {
                ids = lettersToIds(s.clusters);
            } else if (typeof any.cluster_label === "string") {
                ids = lettersToIds(splitLabel(any.cluster_label));
            }
        }
        return { ids: Array.isArray(ids) ? ids : [], text };
    };

    const sameTriad = (a: TriadRef | null, b: TriadRef | null) =>
        !!a && !!b && a.ids.join(",") === b.ids.join(",");

    // 기본(Top #1) 도 안전하게 준비
    const top1Triad = useMemo(
        () => (topOverall[0] ? toTriadRef(topOverall[0]) : null),
        [topOverall],
    );

    return (
        <div className="text-app relative">
            {/* Top3 캐러셀 */}
            {topOverall.length > 0 && (
                <>
                    <h2 className="text-lg sm:text-xl font-bold mb-3">
                        상위 클러스터 조합{" "}
                        <span className="text-muted-app text-sm">
                            (전체 기준)
                        </span>
                    </h2>
                    <Carousel
                        responsiveVisible={{ base: 1.1, md: 1.4, lg: 1.8 }}
                        autoSlide
                        interval={4500}
                        scaleActive={1.05}
                        scaleInactive={0.9}
                    >
                        {topOverall.map((s, i) => (
                            <ClusterCompCard key={i} s={s} max={topMax} />
                        ))}
                    </Carousel>
                </>
            )}

            {/* 필터 바 */}
            <div className="mt-6 mb-4 flex flex-wrap items-center gap-2">
                <input
                    className="w-44 rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none placeholder:text-muted-app"
                    placeholder="클러스터 검색 (예: ABC)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="클러스터 검색"
                />
                <select
                    className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none"
                    value={patch}
                    onChange={(e) => setPatch(e.target.value as Patch)}
                    aria-label="패치 선택"
                >
                    {PATCHES.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
                <select
                    className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none"
                    value={tier}
                    onChange={(e) => setTier(e.target.value as GameTier)}
                    aria-label="티어 선택"
                >
                    {GAME_TIERS.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
                <select
                    className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="정렬 기준"
                >
                    <option value="winRate">승률</option>
                    <option value="pickRate">픽률</option>
                    <option value="mmrGain">평균 MMR</option>
                    <option value="survivalTime">평균 생존시간</option>
                    <option value="count">게임 수</option>
                </select>
            </div>

            {/* 표 */}
            <div className="card p-0">
                <div className="max-h-[60vh] overflow-auto overflow-x-auto">
                    <table className="min-w-[720px] w-full text-sm">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr className="text-muted-app">
                                <th className="px-3 py-2 text-left font-medium">
                                    조합(Clusters)
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    승률
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    픽률
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    평균 MMR
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    평균 생존시간
                                </th>
                                <th className="px-3 py-2 text-right font-medium">
                                    게임 수
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((s, i) => {
                                const triad = toTriadRef(s);
                                return (
                                    <tr
                                        key={i}
                                        className="border-t border-app hover:bg-elev-5 transition-colors cursor-pointer"
                                        onMouseEnter={() =>
                                            !pinnedTriad &&
                                            setPreviewTriad(triad)
                                        }
                                        onMouseLeave={() =>
                                            !pinnedTriad &&
                                            setPreviewTriad(null)
                                        }
                                        onClick={() =>
                                            setPinnedTriad((cur) =>
                                                sameTriad(cur, triad)
                                                    ? null
                                                    : triad,
                                            )
                                        }
                                        title="클릭하면 우측 미리보기를 고정/해제합니다"
                                    >
                                        <td className="px-3 py-2">
                                            <span className="inline-flex gap-1">
                                                {(Array.isArray(
                                                    (s as any).clusters,
                                                )
                                                    ? (s as any).clusters
                                                    : splitLabel(
                                                          String(
                                                              (s as any)
                                                                  .cluster_label ??
                                                                  "",
                                                          ),
                                                      )
                                                ).map(
                                                    (c: string, j: number) => (
                                                        <span
                                                            key={`${c}-${j}`}
                                                            className="inline-block"
                                                        >
                                                            <strong className="text-app">
                                                                {c}
                                                            </strong>
                                                            {j < 2 ? " · " : ""}
                                                        </span>
                                                    ),
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {(s.winRate * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {(s.pickRate * 100).toFixed(2)}%
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {s.mmrGain.toFixed(1)}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {s.survivalTime == null
                                                ? "—"
                                                : formatDuration(
                                                      Math.round(
                                                          s.survivalTime,
                                                      ),
                                                  )}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            {s.count.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                            {sorted.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-3 py-6 text-center text-muted-app"
                                    >
                                        표시할 조합이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🔒 클릭 고정 > hover > Top #1 */}
            <ClusterPreviewRail
                side="right"
                clusterIds={
                    pinnedTriad?.ids ??
                    previewTriad?.ids ??
                    top1Triad?.ids ??
                    null
                }
                clusterLabels={
                    pinnedTriad?.text ??
                    previewTriad?.text ??
                    top1Triad?.text ??
                    null
                }
                containerMax={1152}
                top={96}
                width={280}
                gap={16}
                hideBelow={1536}
                title="클러스터 미리보기"
                bottomGap={36}
            />
        </div>
    );
}
