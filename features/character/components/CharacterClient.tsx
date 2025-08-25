// components/CharacterClient.tsx
"use client";
import { useMemo, useState } from "react";
import { CharacterSummary } from "@/types";
import CharacterTable from "./CharacterTable";
import CharacterCard from "./CharacterCard";
import CharacterTabs from "./CharacterTabs";
import { computeHoneySet } from "@/lib/stats";
import { PATCHES, GAME_TIERS } from "@/features";
import { getRankTier } from "@/features/character";

export default function CharacterClient({
    initialRows,
}: {
    initialRows: CharacterSummary[];
}) {
    const [q, setQ] = useState("");
    const [patch, setPatch] = useState<Patch>("v0.76");
    const [gameTier, setGameTier] = useState<GameTier>("All"); // ← 단일 선택 탭
    const [honeyOnly, setHoneyOnly] = useState(false);
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

    // 허니셋: 필터된 목록에서 산출 (표와 뱃지 일관)
    const honey = useMemo(() => computeHoneySet(filtered, 3), [filtered]);

    // 허니 전용 보기 적용
    const visibleRows = useMemo(
        () =>
            honeyOnly ? filtered.filter((r) => honey.ids.has(r.id)) : filtered,
        [filtered, honeyOnly, honey],
    );

    // 선택된 행 (현재 가시 목록 기준)
    const selected = useMemo(
        () =>
            selectedId == null
                ? null
                : visibleRows.find((r) => r.id === selectedId) || null,
        [visibleRows, selectedId],
    );

    const goDetail = (id: number) => {
        window.location.href = `/characters/${id}`;
    };

    // 선택 전엔 목록이 전체, 선택 후엔 3+2 레이아웃
    const leftSpan = selected ? "lg:col-span-3" : "lg:col-span-5";

    return (
        <main className="mx-auto max-w-5xl grid grid-cols-1 gap-4 lg:grid-cols-5 pb-20">
            {/* 왼쪽: 목록 */}
            <section className={`card overflow-hidden ${leftSpan}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {/* 검색 */}
                    <input
                        className="w-56 rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-app text-app"
                        placeholder="실험체 검색"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    {/* 패치 선택 */}
                    <select
                        className="rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none text-app"
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
                    <CharacterTabs
                        value={gameTier}
                        onChange={(v) => {
                            setGameTier(v);
                            setSelectedId(null);
                        }}
                        items={GAME_TIERS}
                    />

                    {/* 허니 배지 필터 */}
                    <button
                        type="button"
                        onClick={() => {
                            setHoneyOnly((prev) => !prev);
                            setSelectedId(null);
                        }}
                        className={
                            "px-3 py-1.5 text-xs rounded-lg border transition " +
                            (honeyOnly
                                ? "bg-elev-20 border-app text-app"
                                : "bg-surface border-app text-muted-app hover:bg-elev-10")
                        }
                        title="허니 배지 보유만 보기"
                        aria-pressed={honeyOnly}
                    >
                        <span aria-hidden>🍯</span>
                    </button>
                </div>

                <CharacterTable
                    rows={visibleRows}
                    honeyIds={honey.ids}
                    onSelect={(id) =>
                        setSelectedId((prev) => (prev === id ? null : id))
                    } // 같은 행 클릭 시 닫힘
                />
            </section>

            {/* 오른쪽: 선택된 경우에만 표시 */}
            {selected && (
                <section className="card lg:col-span-2">
                    <div className="mb-2 text-xs text-muted-app">
                        패치{" "}
                        <span className="font-medium text-app">{patch}</span> ·
                        티어{" "}
                        <span className="font-medium text-app">{gameTier}</span>{" "}
                        · 기간{" "}
                        <span className="font-medium text-app">최근 14일</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-app">
                                캐릭터 정보
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    className="text-xs rounded-lg border border-app px-2 py-1 hover:bg-elev-10"
                                    onClick={() => goDetail(selected.id)}
                                >
                                    자세히 보기
                                </button>
                                <button
                                    className="text-xs rounded-lg border border-app px-2 py-1 hover:bg-elev-10"
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
