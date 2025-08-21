"use client";

import { useMemo, useState } from "react";
import { CompSuggestion, UserProfile } from "@/types";
import CompSuggestionCard from "@/components/CompSuggestionCard";
import { toast } from "sonner";
import CharacterWeaponPicker, {
    CharItem,
} from "@/components/CharacterWeaponPicker";

// -------------------- 데모 유니버스: 캐릭터별 무기군 포함 --------------------
const UNIVERSE: CharItem[] = Array.from({ length: 24 }).map((_, i) => {
    const id = i + 1;
    // 데모용 무기군: 다양하게 섞음
    const pool = [
        ["Axe", "Pistol"],
        ["Bow", "Rapier"],
        ["Spear", "Pistol"],
        ["Axe", "Rapier", "Bow"],
        ["Bow"],
        ["Rapier", "Spear"],
    ];
    const weapons = pool[i % pool.length];
    return {
        id,
        name: `실험체 ${id}`,
        imageUrl: `/chars/${(i % 9) + 1}.png`,
        weapons,
    };
});

// -------------------- 해시/모의 통계 --------------------
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
function compStats(comp: number[]) {
    const s = scoreFromIds(comp);
    const rnd = (seed: number, a: number, b: number) => {
        const r = Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
        return a + (b - a) * r;
    };
    return {
        winRate: rnd(s, 0.46, 0.65),
        pickRate: rnd(s + 13, 0.05, 0.2),
        mmrGain: rnd(s + 37, 5.0, 12.0),
        count: Math.round(rnd(s + 91, 60, 320)),
    };
}

// -------------------- 유저 조회 (데모) --------------------
async function fetchUserProfileMock(name: string): Promise<UserProfile> {
    const idx = Math.abs(hash(name)) % UNIVERSE.length;
    const top = [
        UNIVERSE[idx],
        UNIVERSE[(idx + 3) % UNIVERSE.length],
        UNIVERSE[(idx + 7) % UNIVERSE.length],
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

// -------------------- Character-based recommendations --------------------
function recommendForChars(
    partial: { id: number; weapon?: string }[],
    opts: { topK?: number; poolLimit?: number } = {},
) {
    const topK = opts.topK ?? 8;
    const poolLimit = opts.poolLimit ?? UNIVERSE.length;

    const ids = partial.map((p) => p.id);
    // If exactly 3 are selected, return a single result for the trio
    if (partial.length === 3) {
        const { winRate, pickRate, mmrGain, count } = compStats(ids);
        return [
            {
                comp: ids.slice(0, 3),
                winRateEst: winRate,
                pickRateEst: pickRate,
                mmrGainEst: mmrGain,
                support: {
                    fromPairs: 0.33,
                    fromSolo: 0.33,
                    fromCluster: 0.34,
                    modeled: false,
                },
                note: `samples: ${count}`,
            },
        ] as CompSuggestion[];
    }

    // Candidate pool
    const pool = UNIVERSE.map((x) => x.id)
        .slice(0, poolLimit)
        .filter((id) => !ids.includes(id));
    const out: CompSuggestion[] = [];

    // If 1 anchor → fill 2 spots, if 2 anchors → fill 1 spot
    for (let i = 0; i < pool.length && out.length < topK * 2; i++) {
        if (partial.length === 1) {
            for (let j = i + 1; j < pool.length && out.length < topK * 2; j++) {
                const comp = [ids[0], pool[i], pool[j]];
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
            }
        } else if (partial.length === 2) {
            const comp = [ids[0], ids[1], pool[i]];
            const { winRate, pickRate, mmrGain, count } = compStats(comp);
            out.push({
                comp,
                winRateEst: winRate,
                pickRateEst: pickRate,
                mmrGainEst: mmrGain,
                support: {
                    fromPairs: 0.4,
                    fromSolo: 0.25,
                    fromCluster: 0.35,
                    modeled: true,
                },
                note: `samples: ${count}`,
            });
        }
    }

    const score = (c: CompSuggestion) =>
        c.winRate * 1.2 + c.mmrGain / 15 + c.pickRate * 0.6;
    return out.sort((a, b) => score(b) - score(a)).slice(0, topK);
}

// -------------------- Main component --------------------
type Tab = "user" | "character";
type SelectedChar = {
    id: number;
    name: string;
    imageUrl: string;
    weapon?: string;
};

export default function UserMultiSuggestClient() {
    const [tab, setTab] = useState<Tab>("user");

    // 유저 기준
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]); // 최대 3명

    // 캐릭터 기준
    const [charQ, setCharQ] = useState("");
    const [selectedChars, setSelectedChars] = useState<SelectedChar[]>([]); // 최대 3개
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<CharItem | null>(null);

    // Add user
    const addUser = async () => {
        const name = input.trim();
        if (!name) return;
        if (users.length >= 3)
            return toast.error("You can add up to 3 users.");
        if (users.some((u) => u.name.toLowerCase() === name.toLowerCase()))
            return toast.error(`"${name}" is already added.`);
        setLoading(true);
        try {
            const u = await fetchUserProfileMock(name);
            setUsers((prev) => [...prev, u]);
            setInput("");
            toast.success(`Added "${name}"`);
        } catch {
            toast.error("Failed to fetch user info.");
        } finally {
            setLoading(false);
        }
    };
    const removeUser = (name: string) =>
        setUsers((p) => p.filter((u) => u.name !== name));

    // Character search + grid
    const filteredChars = useMemo(() => {
        const term = charQ.trim().toLowerCase();
        const selectedIds = new Set(selectedChars.map((c) => c.id));
        return UNIVERSE.filter(
            (c) =>
                !selectedIds.has(c.id) &&
                (!term || c.name.toLowerCase().includes(term)),
        ).slice(0, 30);
    }, [charQ, selectedChars]);

    const openPickerFor = (c: CharItem) => {
        if (selectedChars.length >= 3)
            return toast.error("You can select up to 3 characters.");
        setPickerTarget(c);
        setPickerOpen(true);
    };

    const pickWeapon = (id: number, weapon: string) => {
        const c = UNIVERSE.find((x) => x.id === id);
        if (!c) return;
        setSelectedChars((prev) => [
            ...prev,
            { id: c.id, name: c.name, imageUrl: c.imageUrl, weapon },
        ]);
        toast.success(`${c.name} (${weapon}) selected`);
    };

    const removeChar = (id: number) =>
        setSelectedChars((p) => p.filter((c) => c.id !== id));

    // 추천 결과
    const suggestionsByUser = useMemo(() => {
        if (users.length === 0) return [] as CompSuggestion[];
        const anchorIds = Array.from(
            new Set(users.flatMap((u) => u.topChars.map((t) => t.id))),
        );
        const partial = anchorIds.slice(0, 2).map((id) => ({ id })); // 데모: 2명 기준 앵커
        return recommendForChars(partial, { topK: 8, poolLimit: 24 });
    }, [users]);

    const suggestionsByChar = useMemo(() => {
        if (selectedChars.length === 0) return [] as CompSuggestion[];
        return recommendForChars(
            selectedChars.map(({ id, weapon }) => ({ id, weapon })),
            { topK: 8, poolLimit: 24 },
        );
    }, [selectedChars]);

    const nameById = (id: number) =>
        UNIVERSE.find((x) => x.id === id)?.name || `ID ${id}`;

    return (
        <div className="text-white">
            {/* Tabs */}
            <div className="mb-4 flex gap-2">
                <button
                    className={`rounded-xl border px-4 py-2 text-sm transition-colors ${tab === "user" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"}`}
                    onClick={() => setTab("user")}
                >
                    By User
                </button>
                <button
                    className={`rounded-xl border px-4 py-2 text-sm transition-colors ${tab === "character" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"}`}
                    onClick={() => setTab("character")}
                >
                    By Character
                </button>
            </div>

            {/* ============== User tab ============== */}
            {tab === "user" && (
                <section className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            className="w-64 rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none placeholder-white/50"
                            placeholder="User nickname (up to 3)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addUser()}
                        />
                        <button
                            onClick={addUser}
                            className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
                            disabled={
                                loading || !input.trim() || users.length >= 3
                            }
                        >
                            {loading ? "Adding..." : "Add user"}
                        </button>
                        {users.length > 0 && (
                            <button
                                onClick={() => setUsers([])}
                                className="ml-2 rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {users.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestionsByUser.map((s, i) => (
                                <CompSuggestionCard
                                    key={i}
                                    s={s}
                                    nameById={(id) =>
                                        UNIVERSE.find((x) => x.id === id)
                                            ?.name || `ID ${id}`
                                    }
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="mt-10 text-white/60 text-sm">
                            Add 1–3 users to see personalized team suggestions.
                        </div>
                    )}
                </section>
            )}

            {/* ============== Character tab ============== */}
            {tab === "character" && (
                <section className="space-y-5">
                    {/* Selected characters (with weapon) */}
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
                                    className="rounded-xl border px-2 py-1 text-xs hover:opacity-80"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search + character grid (collapsible) */}
                    <details className="card" open>
                        <summary className="cursor-pointer select-none text-sm font-medium flex items-center gap-2">
                            Character catalog
                            <span className="text-xs opacity-70">({filteredChars.length})</span>
                        </summary>

                        <div className="mt-3">
                            <input
                                className="w-72 rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none placeholder-white/50"
                                placeholder="Search characters"
                                value={charQ}
                                onChange={(e) => setCharQ(e.target.value)}
                            />
                        </div>

                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {filteredChars.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => openPickerFor(c)}
                                    className="card flex flex-col items-center gap-2 hover:opacity-90"
                                >
                                    <img
                                        src={c.imageUrl}
                                        alt={c.name}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                    <div className="text-xs font-medium">
                                        {c.name}
                                    </div>
                                    <div className="text-[10px] opacity-70">
                                        {c.weapons.join(" · ")}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </details>

                    {/* Results */}
                    {selectedChars.length === 0 ? (
                        <div className="mt-6 text-white/60 text-sm">
                            Pick 1–3 characters and optionally weapons to see recommendations.
                        </div>
                    ) : selectedChars.length < 3 ? (
                        <>
                            <div className="text-sm text-white/80 mb-2">
                                Recommended comps based on {selectedChars.length} selected
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {suggestionsByChar.map((s, i) => (
                                    <CompSuggestionCard
                                        key={i}
                                        s={s}
                                        nameById={(id) =>
                                            UNIVERSE.find((x) => x.id === id)
                                                ?.name || `ID ${id}`
                                        }
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-sm text-white/80 mb-2">
                                Performance of the selected trio
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {suggestionsByChar.map((s, i) => (
                                    <CompSuggestionCard
                                        key={i}
                                        s={s}
                                        nameById={(id) =>
                                            UNIVERSE.find((x) => x.id === id)
                                                ?.name || `ID ${id}`
                                        }
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* 무기 선택 모달 */}
            <CharacterWeaponPicker
                open={pickerOpen}
                character={pickerTarget}
                onClose={() => setPickerOpen(false)}
                onPick={pickWeapon}
            />
        </div>
    );
}
