"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CharacterSummary } from "@/types";
import CharacterTable from "./CharacterTable";
import CharacterTabs from "./CharacterTabs";
import { PATCHES, GAME_TIERS } from "@/features";
import { getRankTier } from "@/features/character";
import CharacterPicker from "./CharacterPicker";
// (프로젝트에 따라 타입 경로가 다르면 조정)
import type { Patch, GameTier } from "@/features";

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

    // 패치별 데이터가 이미 서버에서 들어왔다면 그대로 사용
    const patchedRows = useMemo(() => initialRows, [initialRows, patch]);

    // ✅ Honey 규칙(소수 기준: 0.15 = 15%)
    const HONEY_RULE = { win: 0.15, pick: 0.02, mmr: 65 };
    const isHoney = (r: CharacterSummary) =>
        r.winRate >= HONEY_RULE.win &&
        r.pickRate >= HONEY_RULE.pick &&
        r.mmrGain >= HONEY_RULE.mmr;

    // 🔍 검색 + 티어 필터
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

    // ✅ 부모에서 Honey 필터 적용(규칙만)
    const visibleRows = useMemo(
        () => (honeyOnly ? filtered.filter(isHoney) : filtered),
        [filtered, honeyOnly],
    );

    return (
        <main className="mx-auto max-w-5xl flex flex-col gap-4 pb-20">
            {/* ① 캐릭터 선택 박스 (DB 데이터) */}
            <CharacterPicker chars={dbChars} />

            {/* ② 통계(테이블) 박스 */}
            <section className="card">
                <div className="mb-3 px-4 pt-4 flex flex-wrap items-center gap-2">
                    <input
                        className="w-56 rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-app text-app"
                        placeholder="실험체 검색 (이름/초성)"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    {/* 🍯 Honey 배지 보유만 보기 토글 */}
                    <button
                        type="button"
                        onClick={() => setHoneyOnly((prev) => !prev)}
                        className={
                            "px-3 py-1.5 text-s rounded-lg border transition " +
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

                {/* ✅ 규칙 기반 필터링 rows만 전달 / honeyIds는 넘기지 않음 */}
                <CharacterTable rows={visibleRows} onSelect={goDetail} />
            </section>
        </main>
    );
}
