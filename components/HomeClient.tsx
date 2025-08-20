// components/HomeClient.tsx
"use client";
import { useMemo, useState } from "react";
import { CharacterSummary } from "@/types";
import CharacterTable from "@/components/CharacterTable";
import CharacterCard from "@/components/CharacterCard";
import { computeHoneySet } from "@/lib/stats";

const PATCHES = ["v0.74", "v0.75", "v0.76"] as const;
type Patch = (typeof PATCHES)[number];

// UI 라벨 기준 게임 티어 (단일 선택 탭)
const GAME_TIERS = [
    "All",
    "Diamond+",
    "Meteorite+",
    "Mythril+",
    "in 1000",
] as const;
type GameTier = (typeof GAME_TIERS)[number];

// rankTier가 없을 때 임시 분배 (서버가 값 주면 그 값 우선)
function getRankTier(r: CharacterSummary): GameTier {
    const labels = GAME_TIERS as readonly string[];
    if (r.rankTier && labels.includes(r.rankTier))
        return r.rankTier as GameTier;
    // 임시 분배: id로 안정적 그룹화
    const idx = r.id % (labels.length - 1); // All 제외 4개
    return labels[idx + 1] as GameTier; // Diamond+부터
}

// 간단한 탭 컴포넌트 (Tailwind)
function Tabs({
    value,
    onChange,
    items,
}: {
    value: GameTier;
    onChange: (v: GameTier) => void;
    items: readonly GameTier[];
}) {
    return (
        <div className="flex items-center gap-1 rounded-xl bg-[#0F1830] p-1 border border-white/10">
            {items.map((it) => {
                const active = it === value;
                return (
                    <button
                        key={it}
                        onClick={() => onChange(it)}
                        className={`px-3 py-1.5 text-xs rounded-lg transition
              ${active ? "bg-white/20 text-white border border-white/30" : "text-white/70 hover:bg-white/10 border border-transparent"}`}
                        title={it}
                    >
                        {it}
                    </button>
                );
            })}
        </div>
    );
}

export default function HomeClient({
    initialRows,
}: {
    initialRows: CharacterSummary[];
}) {
    const [q, setQ] = useState("");
    const [patch, setPatch] = useState<Patch>("v0.76");
    const [gameTier, setGameTier] = useState<GameTier>("All"); // ← 단일 선택 탭
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // (추후 서버 패치 데이터로 교체 가능)
    const patchedRows = useMemo(() => initialRows, [initialRows, patch]);

    // 검색 + (단일) 게임티어 탭 필터
    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return patchedRows.filter((r) => {
            const okQ = !qq || r.name.toLowerCase().includes(qq);
            const tierOfRow = getRankTier(r);
            const okTier = gameTier === "All" || tierOfRow === gameTier;
            return okQ && okTier;
        });
    }, [q, gameTier, patchedRows]);

    const selected = useMemo(
        () =>
            selectedId == null
                ? null
                : filtered.find((r) => r.id === selectedId) || null,
        [filtered, selectedId],
    );

    const honey = useMemo(() => computeHoneySet(filtered), [filtered]);

    const goDetail = (id: number) => {
        window.location.href = `/characters/${id}`;
    };

    // 선택 전엔 목록이 전체, 선택 후엔 3+2 레이아웃
    const leftSpan = selected ? "lg:col-span-3" : "lg:col-span-5";

    return (
        <main className="mx-auto max-w-5xl flex-1 px-4 py-6 grid grid-cols-1 gap-4 lg:grid-cols-5 pb-20">
            {/* 왼쪽: 목록 */}
            <section
                className={`rounded-2xl border border-white/10 bg-[#111A2E] p-4 overflow-hidden ${leftSpan}`}
            >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {/* 검색 */}
                    <input
                        className="w-56 rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none placeholder-white/50"
                        placeholder="실험체 검색"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    {/* 패치 선택 */}
                    <select
                        className="rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none"
                        value={patch}
                        onChange={(e) => {
                            setPatch(e.target.value as Patch);
                            setSelectedId(null);
                        }}
                        title="패치 선택"
                    >
                        {PATCHES.map((p) => (
                            <option key={p} value={p}>
                                {p} (최근 14일)
                            </option>
                        ))}
                    </select>

                    {/* 게임 티어 탭 (단일 선택) */}
                    <Tabs
                        value={gameTier}
                        onChange={(v) => {
                            setGameTier(v);
                            setSelectedId(null);
                        }}
                        items={GAME_TIERS}
                    />
                </div>

                <CharacterTable
                    rows={filtered}
                    onSelect={(id) =>
                        setSelectedId((prev) => (prev === id ? null : id))
                    } // 같은 행 클릭 시 닫힘
                />
            </section>

            {/* 오른쪽: 선택된 경우에만 표시 */}
            {selected && (
                <section className="rounded-2xl border border-white/10 bg-[#111A2E] p-4 lg:col-span-2">
                    <div className="mb-2 text-xs text-white/60">
                        패치{" "}
                        <span className="font-medium text-white">{patch}</span>{" "}
                        · 티어{" "}
                        <span className="font-medium text-white">
                            {gameTier}
                        </span>{" "}
                        · 기간{" "}
                        <span className="font-medium text-white">
                            최근 14일
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white/80">
                                캐릭터 정보
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    className="text-xs rounded-lg border border-white/10 px-2 py-1 hover:bg-white/5"
                                    onClick={() => goDetail(selected.id)}
                                >
                                    자세히 보기
                                </button>
                                <button
                                    className="text-xs rounded-lg border border-white/10 px-2 py-1 hover:bg-white/5"
                                    onClick={() => setSelectedId(null)}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                        <CharacterCard
                            r={selected}
                            honey={honey}
                            onDetail={goDetail}
                        />
                    </div>
                </section>
            )}
        </main>
    );
}
