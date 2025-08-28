// features/suggest/UserMultiSuggestClient.tsx
"use client";

import { CompSuggestion, UserProfile } from "@/types";
import CompSuggestionCard from "./CompSuggestionCard";
import { toast } from "sonner";
import CharacterWeaponPicker, { CharItem } from "./CharacterWeaponPicker";
import SegmentedTabs, { SegTab } from "./SegmentedTabs";
import UserAddForm from "./UserAddForm";
import { Suspense, useEffect, useState, useMemo } from "react";
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

/* ============== 데모 점수 ============== */
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

/* ============== 추천(기존 로직 유지) ============== */
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
    const MAX_GEN = topK * 40;

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
                for (const c of POOL) {
                    if (c === a || c === b) continue;
                    pushComp([a, b, c], true);
                    if (out.length >= MAX_GEN) break outer2;
                }
            }
    } else {
        const A = lists[0];
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

/* ============== 새로운: 유저 선택 CW 기반 추천 ============== */
type UserPick = {
    id: number; // character id
    name: string;
    imageUrl: string;
    cwId: number;
    weapon: string;
};
type PicksByUser = Record<string, UserPick[]>;

function suggestionsFromCwPicks(
    picksByUser: PicksByUser,
    topK = 8,
): CompSuggestion[] {
    const all = Object.values(picksByUser).flat();
    if (all.length < 3) return [];

    // 트리오 조합 생성 (같은 캐릭 중복 금지)
    const seen = new Set<string>();
    const out: CompSuggestion[] = [];

    for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
            for (let k = j + 1; k < all.length; k++) {
                const a = all[i],
                    b = all[j],
                    c = all[k];
                // 같은 캐릭 중복 방지
                const charIds = new Set([a.id, b.id, c.id]);
                if (charIds.size !== 3) continue;

                const comp = [a.cwId, b.cwId, c.cwId];
                const key = comp
                    .slice()
                    .sort((x, y) => x - y)
                    .join("-");
                if (seen.has(key)) continue;
                seen.add(key);

                const { winRate, pickRate, mmrGain, count } = compStats(comp);
                out.push({
                    comp, // ⚠️ 이제 comp는 cwId 배열
                    winRateEst: winRate,
                    pickRateEst: pickRate,
                    mmrGainEst: mmrGain,
                    support: {
                        fromPairs: 0.45,
                        fromSolo: 0.2,
                        fromCluster: 0.35,
                        modeled: true,
                    },
                    note: `samples: ${count}`,
                });
            }
        }
    }

    const score = (c: CompSuggestion) =>
        c.winRateEst * 1.2 + c.mmrGainEst / 15 + c.pickRateEst * 0.6;
    return out.sort((a, b) => score(b) - score(a)).slice(0, topK);
}

/* ============== 타입 ============== */
type Tab = "user" | "character";
type SelectedChar = {
    id: number;
    name: string;
    imageUrl: string;
    weapon?: string;
};

type CwLite = {
    cwId: number;
    weapon: string;
    weaponCode?: number;
    weaponImageUrl?: string;
};

const TABS: SegTab[] = [
    { value: "user", label: "By User" },
    { value: "character", label: "By Character" },
];

export default function UserMultiSuggestClient() {
    const [tab, setTab] = useState<Tab>("user");

    // 유저
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]);

    // 전체 캐릭(추천 풀)
    const [characters, setCharacters] = useState<CharItem[]>([]);

    // Character 탭용
    const [charQ, setCharQ] = useState("");
    const [selectedChars, setSelectedChars] = useState<SelectedChar[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<CharItem | null>(null);

    // ✅ 유저별 선택 무기(컨트롤드, 리셋 방지의 핵심)
    const [picksByUser, setPicksByUser] = useState<PicksByUser>({});
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    /* ---------- 캐릭터 목록 로드 ---------- */
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

    /* ---------- 유저 추가 ---------- */
    const normalized = input.trim().toLowerCase();
    const dup = users.some((u) => u.name.trim().toLowerCase() === normalized);

    async function fetchUserProfileMock(name: string): Promise<UserProfile> {
        if (characters.length === 0) return { name, topChars: [] };
        const seed = hash(name);
        const pick = (k: number) => characters[(seed + k) % characters.length];
        const top = [pick(0), pick(3), pick(7)].map((t) => ({
            id: t.id,
            name: t.name,
            imageUrl: t.imageUrl,
        }));
        return { name, topChars: top };
    }

    const addUser = async () => {
        const display = input.trim();
        if (!display || dup || users.length >= 3) {
            setInput("");
            return;
        }
        setLoading(true);
        try {
            const u = await fetchUserProfileMock(display);
            setUsers((prev) => [...prev, u]);
            // picksByUser는 유지
            setInput("");
        } catch {
            toast.error("Failed to fetch user info.");
        } finally {
            setLoading(false);
        }
    };

    const removeUser = (name: string) => {
        setUsers((prev) => prev.filter((u) => u.name !== name));
        setPicksByUser((prev) => {
            const cp = { ...prev };
            delete cp[name];
            return cp;
        });
    };

    /* ---------- Character 탭(기존) ---------- */
    const filteredChars = useMemo(() => {
        const term = charQ.trim().toLowerCase();
        const selectedIds = new Set(selectedChars.map((c) => c.id));
        return characters.filter(
            (c) =>
                !selectedIds.has(c.id) &&
                (!term || c.name.toLowerCase().includes(term)),
        );
    }, [charQ, characters, selectedChars]);

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

    /* ---------- 결과 ---------- */
    const allIds = useMemo(() => characters.map((c) => c.id), [characters]);

    // ① 기존: 사용자 Top 기반(캐릭터 id)
    const suggestionsByUserCharOnly = useMemo(() => {
        if (users.length === 0) return [] as CompSuggestion[];
        return suggestionsFromUsersTopWithPool(users, allIds, 8);
    }, [users, allIds]);

    // ② 신규: 유저가 고른 CW 기반
    const suggestionsByCw = useMemo(() => {
        return suggestionsFromCwPicks(picksByUser, 8);
    }, [picksByUser]);

    // ③ 어느 것을 보여줄지: cw 선택이 3개 이상이면 cw 기반, 아니면 기존
    const totalCwPicks = useMemo(
        () => Object.values(picksByUser).reduce((n, arr) => n + arr.length, 0),
        [picksByUser],
    );
    const finalSuggestions =
        totalCwPicks >= 3 ? suggestionsByCw : suggestionsByUserCharOnly;

    // 라벨 매핑: cwId -> "캐릭터 (무기)"
    const cwLabelMap = useMemo(() => {
        const m: Record<
            number,
            { charId: number; charName: string; weapon: string }
        > = {};
        for (const list of Object.values(picksByUser)) {
            for (const p of list) {
                m[p.cwId] = {
                    charId: p.id,
                    charName: p.name,
                    weapon: p.weapon,
                };
            }
        }
        return m;
    }, [picksByUser]);

    // 이름 표시: cwId면 "이름 (무기)", 아니면 캐릭터 이름
    const nameById = (id: number) => {
        const cw = cwLabelMap[id];
        if (cw) return `${cw.charName} (${cw.weapon})`;
        return characters.find((x) => x.id === id)?.name || `ID ${id}`;
    };

    // ✅ 자식 콜백: 유저별 선택 변경 반영
    const handlePickChange = (userName: string, picks: PicksByUser[string]) => {
        setPicksByUser((prev) => ({ ...prev, [userName]: picks }));
    };

    /* ============== Render ============== */
    return (
        <div className="text-app">
            <SegmentedTabs
                tabs={TABS}
                value={tab}
                onChange={(v) => setTab(v as Tab)}
                ariaLabel="추천 기준 선택"
            />

            {/* ───────────── User 탭 ───────────── */}
            {tab === "user" && (
                <section className="space-y-4">
                    <UserAddForm
                        input={input}
                        setInput={setInput}
                        loading={loading}
                        usersLength={users.length}
                        isDuplicate={dup}
                        onAdd={addUser}
                        onClearAll={() => {
                            setUsers([]);
                            setPicksByUser({}); // ← 선택도 같이 초기화
                        }}
                    />

                    {/* ✅ 선택 상태는 부모가 소유하고 자식은 컨트롤드 렌더만 */}
                    <Suspense fallback={null}>
                        {mounted ? (
                            <AddedUsersList
                                key={users.map((u) => u.name).join("|")}
                                users={users}
                                onRemove={removeUser}
                                picks={picksByUser}
                                onPickChange={handlePickChange}
                            />
                        ) : null}
                    </Suspense>

                    {users.length > 0 ? (
                        <>
                            <div
                                className="text-xs mb-1"
                                style={{ color: "var(--text-muted)" }}
                            >
                                각 유저의 Top3 오른쪽 패널에서 캐릭터 탭을
                                전환하고 무기군을 선택하세요.
                            </div>

                            {/* 🔁 최종 추천 (CW 선택이 충분하면 CW기반, 아니면 기존 캐릭터기반) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                {finalSuggestions.map((s, i) => (
                                    <CompSuggestionCard
                                        key={i}
                                        s={s}
                                        nameById={nameById} // ← "캐릭터 (무기)" 지원
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

            {/* ───────────── Character 탭(기존) ───────────── */}
            {tab === "character" && (
                <section className="space-y-5">
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
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

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
                                {/** 기존 캐릭터 탭 추천은 그대로 유지 */}
                                {(() => {
                                    const ids = selectedChars.map((c) => c.id);
                                    const out: CompSuggestion[] = [];
                                    const seen = new Set<string>();
                                    const push = (comp: number[]) => {
                                        const key = comp
                                            .slice()
                                            .sort((a, b) => a - b)
                                            .join("-");
                                        if (seen.has(key)) return;
                                        seen.add(key);
                                        const {
                                            winRate,
                                            pickRate,
                                            mmrGain,
                                            count,
                                        } = compStats(comp);
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
                                            for (
                                                let j = i + 1;
                                                j < ids.length;
                                                j++
                                            )
                                                for (
                                                    let k = j + 1;
                                                    k < ids.length;
                                                    k++
                                                )
                                                    push([
                                                        ids[i],
                                                        ids[j],
                                                        ids[k],
                                                    ]);
                                    }
                                    const score = (c: CompSuggestion) =>
                                        c.winRateEst * 1.2 +
                                        c.mmrGainEst / 15 +
                                        c.pickRateEst * 0.6;
                                    return out
                                        .sort((a, b) => score(b) - score(a))
                                        .slice(0, 8)
                                        .map((s, i) => (
                                            <CompSuggestionCard
                                                key={i}
                                                s={s}
                                                nameById={(id) =>
                                                    characters.find(
                                                        (x) => x.id === id,
                                                    )?.name || `ID ${id}`
                                                }
                                            />
                                        ));
                                })()}
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Character 탭용 무기 선택 모달 */}
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
