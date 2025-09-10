"use client";

import { useMemo, useState } from "react";
import type { ClusterTriadSummary } from "@/types";
import Carousel from "@/features/ui/Carousel";
import CharacterTabs from "@/features/character/components/CharacterTabs";
import ClusterCompCard from "./ClusterCompCard";
import ClusterPreviewRail from "@/features/cluster-comps/components/ClusterPreviewRail";
import { PATCHES, GAME_TIERS } from "@/features";
import type { Patch, GameTier } from "@/features";

/* ====== 정렬 타입 ====== */
type SortKey =
    | "clusters"
    | "winRate"
    | "pickRate"
    | "mmrGain"
    | "survivalTime"
    | "count";
type SortDir = "asc" | "desc";

/* ====== 라벨→ID 매핑 유틸 ====== */
type TriadRef = { ids: number[]; text: string };
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

    // ⬇️ 추가: 패치/티어 상태
    const [patch, setPatch] = useState<Patch>(PATCHES[0] as Patch); // 예: "v0.76"
    const [tier, setTier] = useState<GameTier>("All");

    // 사이드 미리보기 상태
    const [previewTriad, setPreviewTriad] = useState<TriadRef | null>(null);
    const [pinnedTriad, setPinnedTriad] = useState<TriadRef | null>(null);

    // 헤더 정렬 상태
    const [sortKey, setSortKey] = useState<SortKey>("winRate");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

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

    /* 🔎 검색 + 패치/티어 필터
     - 서버에서 patch/tier별로 이미 나눠주면 정확히 필터됨
     - 아직 "All"만 온다면 UI는 표시만 되고 필터는 전부 통과함 */
    // 🔎 검색만 적용, 패치/티어는 무시하고 전부 노출
    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return initial;
        return initial.filter((s) => {
            const label = Array.isArray(s.clusters)
                ? s.clusters.join("")
                : String((s as any).cluster_label ?? "");
            return label.toLowerCase().includes(qq);
        });
    }, [initial, q]);
    /* ====== 행에서 TriadRef 만들기 ====== */
    const toTriadRef = (s: ClusterTriadSummary): TriadRef => {
        const any = s as any;
        const text = Array.isArray(s.clusters)
            ? s.clusters.join(" · ")
            : typeof any.cluster_label === "string"
              ? any.cluster_label
              : "";

        let ids: number[] | undefined =
            (any.clusterIds as number[] | undefined) ??
            (any.cluster_ids as number[] | undefined);

        if (!Array.isArray(ids) || ids.length === 0) {
            if (Array.isArray(s.clusters)) ids = lettersToIds(s.clusters);
            else if (typeof any.cluster_label === "string")
                ids = lettersToIds(splitLabel(any.cluster_label));
        }
        return { ids: Array.isArray(ids) ? ids : [], text };
    };

    const top1Triad = useMemo(
        () => (topOverall[0] ? toTriadRef(topOverall[0]) : null),
        [topOverall],
    );

    /* ====== 표 정렬 유틸 ====== */
    const columns: SortKey[] = [
        "clusters",
        "winRate",
        "pickRate",
        "mmrGain",
        "survivalTime",
        "count",
    ];
    const labelFor = (col: SortKey) =>
        col === "clusters"
            ? "조합(Clusters)"
            : col === "winRate"
              ? "승률"
              : col === "pickRate"
                ? "픽률"
                : col === "mmrGain"
                  ? "평균 MMR"
                  : col === "survivalTime"
                    ? "평균 생존시간"
                    : "게임 수";
    const handleSortClick = (col: SortKey) => {
        setSortDir((prev) =>
            sortKey === col ? (prev === "asc" ? "desc" : "asc") : "desc",
        );
        setSortKey(col);
    };
    const ariaSort = (col: SortKey): "ascending" | "descending" | "none" =>
        sortKey === col
            ? sortDir === "asc"
                ? "ascending"
                : "descending"
            : "none";

    const sorted = useMemo(() => {
        const arr = [...filtered];

        const getLabelText = (s: ClusterTriadSummary) =>
            Array.isArray(s.clusters)
                ? s.clusters.join(" · ")
                : String((s as any).cluster_label ?? "");

        const num = (x: number | undefined | null, forAsc = false) =>
            x == null
                ? forAsc
                    ? Number.POSITIVE_INFINITY
                    : Number.NEGATIVE_INFINITY
                : x;

        arr.sort((a, b) => {
            if (sortKey === "clusters") {
                const la = getLabelText(a);
                const lb = getLabelText(b);
                const cmp = la.localeCompare(lb);
                return sortDir === "asc" ? cmp : -cmp;
            }
            let av = 0,
                bv = 0;
            switch (sortKey) {
                case "winRate":
                    av = num(a.winRate, sortDir === "asc");
                    bv = num(b.winRate, sortDir === "asc");
                    break;
                case "pickRate":
                    av = num(a.pickRate, sortDir === "asc");
                    bv = num(b.pickRate, sortDir === "asc");
                    break;
                case "mmrGain":
                    av = num(a.mmrGain, sortDir === "asc");
                    bv = num(b.mmrGain, sortDir === "asc");
                    break;
                case "survivalTime":
                    av = num(a.survivalTime, sortDir === "asc");
                    bv = num(b.survivalTime, sortDir === "asc");
                    break;
                case "count":
                    av = num(a.count, sortDir === "asc");
                    bv = num(b.count, sortDir === "asc");
                    break;
            }
            return sortDir === "asc" ? av - bv : bv - av;
        });

        return arr;
    }, [filtered, sortKey, sortDir]);

    const sameTriad = (a: TriadRef | null, b: TriadRef | null) =>
        !!a && !!b && a.ids.join(",") === b.ids.join(",");

    return (
        <main className="mx-auto max-w-6xl flex flex-col gap-4 pb-20">
            {/* Top3 캐러셀 */}
            {topOverall.length > 0 && (
                <section>
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
                </section>
            )}

            {/* 🔎 검색 + 패치/티어 탭 */}
            <section className="card">
                <div className="mb-3 px-4 pt-4 flex flex-wrap items-center gap-2">
                    {/* 검색 */}
                    <input
                        className="w-56 rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-app text-app"
                        placeholder="클러스터 검색 (예: ABC)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    {/* 패치 셀렉트 (캐릭터 페이지와 동일한 라벨) */}
                </div>

                {/* 표 — 헤더 클릭 정렬 */}
                <div className="card p-0">
                    <div className="max-h-[60vh] overflow-auto overflow-x-auto">
                        <table className="min-w-[720px] w-full text-sm">
                            <thead className="bg-muted sticky top-0 z-10">
                                <tr className="text-muted-app">
                                    {columns.map((col) => (
                                        <th
                                            key={col}
                                            className={`px-3 py-2 ${col === "clusters" ? "text-left" : "text-right"} font-medium`}
                                            aria-sort={ariaSort(col)}
                                        >
                                            <button
                                                className="inline-flex items-center gap-1 hover:opacity-80"
                                                onClick={() =>
                                                    handleSortClick(col)
                                                }
                                            >
                                                {labelFor(col)}
                                                <span className="text-xs text-muted-app">
                                                    {sortKey === col
                                                        ? sortDir === "asc"
                                                            ? "▲"
                                                            : "▼"
                                                        : "↕"}
                                                </span>
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {sorted.map((s, i) => {
                                    const triad = toTriadRef(s);
                                    const pieces = Array.isArray(
                                        (s as any).clusters,
                                    )
                                        ? (s as any).clusters
                                        : splitLabel(
                                              String(
                                                  (s as any).cluster_label ??
                                                      "",
                                              ),
                                          );

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
                                            <td className="px-3 py-2 text-left">
                                                <span className="inline-flex gap-1">
                                                    {pieces.map(
                                                        (
                                                            c: string,
                                                            j: number,
                                                        ) => (
                                                            <span
                                                                key={`${c}-${j}`}
                                                                className="inline-block"
                                                            >
                                                                <strong className="text-app">
                                                                    {c}
                                                                </strong>
                                                                {j < 2
                                                                    ? " · "
                                                                    : ""}
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
            </section>

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
        </main>
    );
}

/* 간단 포맷 */
function formatDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
