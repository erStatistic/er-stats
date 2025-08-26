// features/character/components/CharacterClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CharacterSummary } from "@/types";
import CharacterTable from "./CharacterTable";
import CharacterTabs from "./CharacterTabs";
import { computeHoneySet } from "@/lib/stats";
import { PATCHES, GAME_TIERS } from "@/features";
import { getRankTier } from "@/features/character";
import CharacterPicker from "./CharacterPicker";

export default function CharacterClient({
    initialRows,
    dbChars = [],
}: {
    initialRows: CharacterSummary[];
    dbChars?: Array<{
        id: number;
        nameKr?: string;
        imageUrlMini?: string;
        imageUrlFull?: string;
    }>;
}) {
    const [q, setQ] = useState("");
    const [patch, setPatch] = useState<Patch>("v0.76");
    const [gameTier, setGameTier] = useState<GameTier>("All");
    const [honeyOnly, setHoneyOnly] = useState(false);

    const router = useRouter();
    const goDetail = (id: number) => router.push(`/characters/${id}`);

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

    return (
        <main className="mx-auto max-w-5xl flex flex-col gap-4 pb-20">
            {/* ① 캐릭터 선택 박스 (DB 데이터) */}
            <CharacterPicker chars={dbChars} />
            {/* ② 통계(테이블) 박스 */}
            <section className="card overflow-hidden">
                <div className="mb-3 px-4 pt-4 flex flex-wrap items-center gap-2">
                    {/* 검색(표 전용) */}
                    <input
                        className="w-56 rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-app text-app"
                        placeholder="실험체 검색 (표)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    {/* 패치 선택 */}
                    <select
                        className="rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none text-app"
                        value={patch}
                        onChange={(e) => setPatch(e.target.value as Patch)}
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
                        onChange={(v) => setGameTier(v)}
                        items={GAME_TIERS}
                    />

                    {/* 허니 배지 필터 */}
                    <button
                        type="button"
                        onClick={() => setHoneyOnly((prev) => !prev)}
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

                {/* 표: 행 클릭 시 상세로 이동 */}
                <CharacterTable
                    rows={visibleRows}
                    honeyIds={honey.ids}
                    onSelect={(id) => goDetail(id)}
                />
            </section>
        </main>
    );
}
