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
    const goDetail = (char_id: number, weapon_id: number) =>
        router.push(`/characters/${char_id}?wc=${weapon_id}`);

    // 🔠 한글 초성 검색 유틸
    const norm = (s: string) => s.normalize("NFC").toLowerCase().trim();
    const collapse = (s: string) => norm(s).replace(/\s+/g, "");
    const CHO = [
        "ㄱ",
        "ㄲ",
        "ㄴ",
        "ㄷ",
        "ㄸ",
        "ㄹ",
        "ㅁ",
        "ㅂ",
        "ㅃ",
        "ㅅ",
        "ㅆ",
        "ㅇ",
        "ㅈ",
        "ㅉ",
        "ㅊ",
        "ㅋ",
        "ㅌ",
        "ㅍ",
        "ㅎ",
    ];
    const toInitials = (s: string) => {
        const base = 0xac00,
            choUnit = 21 * 28;
        let out = "";
        for (const ch of s) {
            const code = ch.charCodeAt(0);
            if (code >= 0xac00 && code <= 0xd7a3) {
                const idx = Math.floor((code - base) / choUnit);
                out += CHO[idx] ?? ch;
            } else out += ch;
        }
        return out;
    };

    const patchedRows = useMemo(() => initialRows, [initialRows, patch]);

    // 🔍 이름/무기명 부분일치 + 초성일치, 그리고 티어 필터
    const filtered = useMemo(() => {
        const raw = q.trim();
        const passTier = (r: CharacterSummary) => {
            const tierOfRow = getRankTier(r);
            return gameTier === "All" || tierOfRow === gameTier;
        };

        if (!raw) return patchedRows.filter(passTier);

        const q1 = collapse(raw);
        const q2 = collapse(toInitials(raw));

        return patchedRows.filter((r) => {
            if (!passTier(r)) return false;

            const name = r.name ?? "";
            const weapon = r.weapon ?? "";

            const n1 = collapse(name);
            const n2 = collapse(toInitials(name));
            const w1 = collapse(weapon);
            const w2 = collapse(toInitials(weapon));

            const okQ =
                n1.includes(q1) ||
                (q2 && n2.includes(q2)) ||
                w1.includes(q1) ||
                (q2 && w2.includes(q2));
            return okQ;
        });
    }, [q, gameTier, patchedRows]);

    const honey = useMemo(() => computeHoneySet(filtered, 3), [filtered]);

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
            <section className="card ">
                <div className="mb-3 px-4 pt-4 flex flex-wrap items-center gap-2">
                    <input
                        className="w-56 rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-app text-app"
                        placeholder="실험체 검색 (이름/초성)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

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

                    <CharacterTabs
                        value={gameTier}
                        onChange={(v) => setGameTier(v)}
                        items={GAME_TIERS}
                    />

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

                <CharacterTable
                    rows={visibleRows}
                    honeyIds={honey.ids}
                    onSelect={goDetail}
                />
            </section>
        </main>
    );
}
