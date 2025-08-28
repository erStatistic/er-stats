// features/suggest/UserMultiSuggestClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { CompSuggestion, UserProfile } from "@/types";
import CompSuggestionCard from "./CompSuggestionCard";
import { toast } from "sonner";
import CharacterWeaponPicker, { CharItem } from "./CharacterWeaponPicker";
import SegmentedTabs, { SegTab } from "./SegmentedTabs";
import UserAddForm from "./UserAddForm";
import AddedUsersList from "./AddedUsersList";

/* ============== API 유틸 ============== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

async function fetchJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const j = await res.json();
    return (j?.data ?? j) as T;
}

/* ============== 데모 점수 생성기(그대로) ============== */
function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}
function scoreFromIds(ids: number[]) {
    return hash(ids.sort((a, b) => a - b).join("-"));
}
function rnd(seed: number, a: number, b: number) {
    const r = Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
    return a + (b - a) * r;
}
function compStats(comp: number[]) {
    const s = scoreFromIds(comp);
    return {
        winRate: rnd(s, 0.46, 0.65),
        pickRate: rnd(s + 13, 0.05, 0.2),
        mmrGain: rnd(s + 37, 5.0, 12.0),
        count: Math.round(rnd(s + 91, 60, 320)),
    };
}

/* ============================================================
   ★ 변경된 핵심 로직 ★
   - users가 3명 이상: 각 유저의 Top(최대 3개)에서 1명씩 뽑아 조합
   - users가 2명    : 두 유저의 Top에서 1명씩 + 나머지 1명은 "전체 풀"에서 채움
   - users가 1명    : 해당 유저의 Top에서 1명 + 나머지 2명은 "전체 풀"에서 채움
   - 전체 풀: DB의 모든 캐릭터 ID
   ============================================================ */
function suggestionsFromUsersTopWithPool(
    users: UserProfile[],
    poolIds: number[],
    topK = 8,
): CompSuggestion[] {
    const lists = users
        .map((u) =>
            Array.from(new Set(u.topChars.map((t) => t.id))).slice(0, 3),
        )
        .filter((arr) => arr.length > 0);

    if (lists.length === 0) return [];

    const POOL = Array.from(new Set(poolIds));
    const seen = new Set<string>();
    const out: CompSuggestion[] = [];
    const MAX_GEN = topK * 40; // 무한루프/과도한 생성 방지용

    const pushComp = (comp: number[], modeled: boolean) => {
        const key = comp
            .slice()
            .sort((a, b) => a - b)
            .join("-");
        if (seen.has(key)) return;
        seen.add(key);

        const { winRate, pickRate, mmrGain, count } = compStats(comp);
        out.push({
            comp,
            winRateEst: winRate,
            pickRateEst: pickRate,
            mmrGainEst: mmrGain,
            support: modeled
                ? {
                      fromPairs: 0.4,
                      fromSolo: 0.25,
                      fromCluster: 0.35,
                      modeled: true,
                  }
                : {
                      fromPairs: 0.33,
                      fromSolo: 0.33,
                      fromCluster: 0.34,
                      modeled: false,
                  },
            note: `samples: ${count}`,
        });
    };

    if (lists.length >= 3) {
        const [A, B, C] = lists;
        outer3: for (const a of A)
            for (const b of B)
                for (const c of C) {
                    if (a === b || b === c || a === c) continue;
                    pushComp([a, b, c], false);
                    if (out.length >= MAX_GEN) break outer3;
                }
    } else if (lists.length === 2) {
        const [A, B] = lists;
        outer2: for (const a of A)
            for (const b of B) {
                if (a === b) continue;
                // 나머지 1명을 "전체 풀"에서 뽑기
                for (const c of POOL) {
                    if (c === a || c === b) continue;
                    pushComp([a, b, c], true);
                    if (out.length >= MAX_GEN) break outer2;
                }
            }
    } else {
        const A = lists[0];
        // 1명의 유저: Top에서 1명 + 전체 풀에서 2명
        outer1: for (const a of A) {
            for (let i = 0; i < POOL.length; i++) {
                const b = POOL[i];
                if (b === a) continue;
                for (let j = i + 1; j < POOL.length; j++) {
                    const c = POOL[j];
                    if (c === a || c === b) continue;
                    pushComp([a, b, c], true);
                    if (out.length >= MAX_GEN) break outer1;
                }
            }
        }
    }

    const score = (c: CompSuggestion) =>
        c.winRateEst * 1.2 + c.mmrGainEst / 15 + c.pickRateEst * 0.6;

    return out.sort((a, b) => score(b) - score(a)).slice(0, topK);
}

/* ============== 메인 컴포넌트 ============== */
type Tab = "user" | "character";
type SelectedChar = {
    id: number;
    name: string;
    imageUrl: string;
    weapon?: string;
};

const TABS: SegTab[] = [
    { value: "user", label: "By User" },
    { value: "character", label: "By Character" },
];

export default function UserMultiSuggestClient() {
    const [tab, setTab] = useState<Tab>("user");

    // 유저 기준
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]); // 최대 3명

    // 캐릭터 기준 (DB)
    const [charQ, setCharQ] = useState("");
    const [characters, setCharacters] = useState<CharItem[]>([]);
    const [selectedChars, setSelectedChars] = useState<SelectedChar[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<CharItem | null>(null);

    /* DB 캐릭터 목록 로드 */
    useEffect(() => {
        (async () => {
            try {
                const rows = await fetchJSON<Array<any>>("/api/v1/characters");
                const mapped: CharItem[] = rows.map((c) => ({
                    id: c.id ?? c.ID,
                    name: c.nameKr ?? c.NameKr ?? c.name ?? "이름 없음",
                    imageUrl:
                        c.imageUrlMini ??
                        c.ImageUrlMini ??
                        c.imageUrlFull ??
                        "",
                }));
                setCharacters(mapped);
            } catch {
                toast.error("캐릭터 목록을 불러오지 못했습니다.");
            }
        })();
    }, []);

    /* 유저 입력 중복 */
    const normalizedInput = input.trim().toLowerCase();
    const isDuplicateNow = users.some(
        (u) => u.name.trim().toLowerCase() === normalizedInput,
    );

    /* 데모용 유저 프로필 (DB 캐릭터 기반) */
    async function fetchUserProfileMock(name: string): Promise<UserProfile> {
        if (characters.length === 0) {
            return { name, topChars: [] };
        }
        const idx = Math.abs(hash(name)) % characters.length;
        const pick = (k: number) => characters[(idx + k) % characters.length];
        const top = [
            pick(0),
            pick(3 % characters.length),
            pick(7 % characters.length),
        ];
        return {
            name,
            topChars: top.map((t) => ({
                id: t.id,
                name: t.name,
                imageUrl: t.imageUrl,
            })),
        };
    }

    /* 유저 추가/삭제 */
    const addUser = async () => {
        const displayName = input.trim();
        if (!displayName) return;
        if (isDuplicateNow) {
            setInput("");
            return;
        }
        if (users.length >= 3) return;

        setLoading(true);
        try {
            const u = await fetchUserProfileMock(displayName);
            setUsers((prev) => [...prev, u]);
            setInput("");
        } catch {
            toast.error("Failed to fetch user info.");
        } finally {
            setLoading(false);
        }
    };
    const removeUser = (name: string) =>
        setUsers((p) => p.filter((u) => u.name !== name));

    /* 카탈로그 필터 */
    const filteredChars = useMemo(() => {
        const term = charQ.trim().toLowerCase();
        const selectedIds = new Set(selectedChars.map((c) => c.id));
        return characters.filter(
            (c) =>
                !selectedIds.has(c.id) &&
                (!term || c.name.toLowerCase().includes(term)),
        );
    }, [charQ, characters, selectedChars]);

    /* 무기 선택 모달 */
    const openPickerFor = (c: CharItem) => {
        if (selectedChars.length >= 3)
            return toast.error("You can select up to 3 characters.");
        setPickerTarget(c);
        setPickerOpen(true);
    };
    const pickWeapon = (id: number, weapon: string) => {
        const c = characters.find((x) => x.id === id);
        if (!c) return;
        setSelectedChars((prev) => [
            ...prev,
            { id: c.id, name: c.name, imageUrl: c.imageUrl, weapon },
        ]);
    };
    const removeChar = (id: number) =>
        setSelectedChars((p) => p.filter((c) => c.id !== id));

    /* 결과 계산 */
    const allIds = useMemo(() => characters.map((c) => c.id), [characters]);

    // ★ User 탭: 변경된 로직 적용 (poolIds 사용)
    const suggestionsByUser = useMemo(() => {
        if (users.length === 0) return [] as CompSuggestion[];
        return suggestionsFromUsersTopWithPool(users, allIds, 8);
    }, [users, allIds]);

    // Character 탭: 선택 캐릭터들로 조합 생성(기존 데모)
    const suggestionsByChar = useMemo(() => {
        if (selectedChars.length === 0) return [] as CompSuggestion[];
        const ids = selectedChars.map((c) => c.id);
        const out: CompSuggestion[] = [];
        const seen = new Set<string>();

        const pushComp = (comp: number[]) => {
            const key = comp
                .slice()
                .sort((a, b) => a - b)
                .join("-");
            if (seen.has(key)) return;
            seen.add(key);

            const { winRate, pickRate, mmrGain, count } = compStats(comp);
            out.push({
                comp,
                winRateEst: winRate,
                pickRateEst: pickRate,
                mmrGainEst: mmrGain,
                support: {
                    fromPairs: 0.5,
                    fromSolo: 0.2,
                    fromCluster: 0.3,
                    modeled: true,
                },
                note: `samples: ${count}`,
            });
        };

        if (ids.length >= 3) {
            for (let i = 0; i < ids.length; i++)
                for (let j = i + 1; j < ids.length; j++)
                    for (let k = j + 1; k < ids.length; k++)
                        pushComp([ids[i], ids[j], ids[k]]);
        }

        const score = (c: CompSuggestion) =>
            c.winRateEst * 1.2 + c.mmrGainEst / 15 + c.pickRateEst * 0.6;

        return out.sort((a, b) => score(b) - score(a)).slice(0, 8);
    }, [selectedChars]);

    const nameById = (id: number) =>
        characters.find((x) => x.id === id)?.name || `ID ${id}`;

    /* ============== Render ============== */
    return (
        <div className="text-app">
            <SegmentedTabs
                tabs={TABS}
                value={tab}
                onChange={(v) => setTab(v as Tab)}
                ariaLabel="추천 기준 선택"
            />

            {/* -------- User tab -------- */}
            {tab === "user" && (
                <section className="space-y-4">
                    <UserAddForm
                        input={input}
                        setInput={setInput}
                        loading={loading}
                        usersLength={users.length}
                        isDuplicate={isDuplicateNow}
                        onAdd={addUser}
                        onClearAll={() => setUsers([])}
                    />

                    <AddedUsersList users={users} onRemove={removeUser} />

                    {users.length > 0 ? (
                        <>
                            <div
                                className="text-xs mb-1"
                                style={{ color: "var(--text-muted)" }}
                            >
                                * 조합은 각 유저의 Top(최대 3개)에서 고정 앵커를
                                잡고, 부족한 자리는 <b>전체 캐릭터 풀</b>에서
                                보완합니다.
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {suggestionsByUser.map((s, i) => (
                                    <CompSuggestionCard
                                        key={i}
                                        s={s}
                                        nameById={nameById}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div
                            className="mt-10 text-sm"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Add 1–3 users to see team suggestions.
                        </div>
                    )}
                </section>
            )}

            {/* -------- Character tab -------- */}
            {tab === "character" && (
                <section className="space-y-5">
                    {/* Selected */}
                    <div className="card">
                        <div
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Selected characters ({selectedChars.length}/3)
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {selectedChars.map((c) => (
                                <span
                                    key={c.id}
                                    className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5"
                                    style={{
                                        borderColor: "var(--border)",
                                        background: "var(--surface)",
                                        color: "var(--text)",
                                    }}
                                >
                                    <img
                                        src={c.imageUrl}
                                        alt={c.name}
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                    <span className="text-xs">{c.name}</span>
                                    {c.weapon && (
                                        <span className="text-[10px] opacity-80">
                                            ({c.weapon})
                                        </span>
                                    )}
                                    <button
                                        className="text-[10px] opacity-70 hover:opacity-100"
                                        onClick={() => removeChar(c.id)}
                                        title="Remove"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                            {selectedChars.length > 0 && (
                                <button
                                    onClick={() => setSelectedChars([])}
                                    className="rounded-xl border px-2 py-1 text-xs transition"
                                    style={{
                                        borderColor: "var(--border)",
                                        background: "var(--surface)",
                                        color: "var(--text)",
                                    }}
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Catalog */}
                    <details className="card p-0 overflow-hidden" open>
                        <summary className="cursor-pointer select-none text-sm font-medium flex items-center gap-2 px-4 py-3">
                            Character catalog{" "}
                            <span
                                className="text-xs"
                                style={{ color: "var(--text-muted)" }}
                            >
                                ({filteredChars.length})
                            </span>
                        </summary>

                        <div className="px-4 py-3 border-t border-app sticky top-0 bg-surface z-10">
                            <input
                                className="w-72 rounded-xl border px-3 py-2 text-sm outline-none"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--surface)",
                                    color: "var(--text)",
                                }}
                                placeholder="Search characters"
                                value={charQ}
                                onChange={(e) => setCharQ(e.target.value)}
                            />
                        </div>

                        <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {filteredChars.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => openPickerFor(c)}
                                        className="card flex flex-col items-center gap-2 transition hover:opacity-90"
                                    >
                                        <img
                                            src={c.imageUrl}
                                            alt={c.name}
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                        <div className="text-xs font-medium">
                                            {c.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </details>

                    {/* Results */}
                    {selectedChars.length === 0 ? (
                        <div
                            className="mt-6 text-sm"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Pick 1–3 characters and optionally weapons to see
                            recommendations.
                        </div>
                    ) : (
                        <>
                            <div
                                className="text-sm mb-2"
                                style={{ color: "var(--text-muted)" }}
                            >
                                Recommended comps based on{" "}
                                {selectedChars.length} selected
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {suggestionsByChar.map((s, i) => (
                                    <CompSuggestionCard
                                        key={i}
                                        s={s}
                                        nameById={nameById}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* 무기 선택 모달 */}
            <CharacterWeaponPicker
                key={pickerTarget?.id ?? "none"}
                open={pickerOpen}
                character={pickerTarget}
                onClose={() => setPickerOpen(false)}
                onPick={pickWeapon}
            />
        </div>
    );
}
