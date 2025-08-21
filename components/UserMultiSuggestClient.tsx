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

// -------------------- 캐릭터 기준 추천 --------------------
function recommendForChars(
    partial: { id: number; weapon?: string }[],
    opts: { topK?: number; poolLimit?: number } = {},
) {
    const topK = opts.topK ?? 8;
    const poolLimit = opts.poolLimit ?? UNIVERSE.length;

    const ids = partial.map((p) => p.id);
    // 3명이면 단일 결과
    if (partial.length === 3) {
        const { winRate, pickRate, mmrGain, count } = compStats(ids);
        return [
            { comp: ids.slice(0, 3), winRate, pickRate, mmrGain, count },
        ] as CompSuggestion[];
    }

    // 후보 풀
    const pool = UNIVERSE.map((x) => x.id)
        .slice(0, poolLimit)
        .filter((id) => !ids.includes(id));
    const out: CompSuggestion[] = [];

    // 1명 → 2자리 채움, 2명 → 1자리 채움
    for (let i = 0; i < pool.length && out.length < topK * 2; i++) {
        if (partial.length === 1) {
            for (let j = i + 1; j < pool.length && out.length < topK * 2; j++) {
                const comp = [ids[0], pool[i], pool[j]];
                const { winRate, pickRate, mmrGain, count } = compStats(comp);
                out.push({ comp, winRate, pickRate, mmrGain, count });
            }
        } else if (partial.length === 2) {
            const comp = [ids[0], ids[1], pool[i]];
            const { winRate, pickRate, mmrGain, count } = compStats(comp);
            out.push({ comp, winRate, pickRate, mmrGain, count });
        }
    }

    const score = (c: CompSuggestion) =>
        c.winRate * 1.2 + c.mmrGain / 15 + c.pickRate * 0.6;
    return out.sort((a, b) => score(b) - score(a)).slice(0, topK);
}

// -------------------- 메인 컴포넌트 --------------------
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

    // 유저 추가
    const addUser = async () => {
        const name = input.trim();
        if (!name) return;
        if (users.length >= 3)
            return toast.error("유저는 최대 3명까지만 추가할 수 있어요.");
        if (users.some((u) => u.name.toLowerCase() === name.toLowerCase()))
            return toast.error(`"${name}" 는 이미 추가된 유저예요.`);
        setLoading(true);
        try {
            const u = await fetchUserProfileMock(name);
            setUsers((prev) => [...prev, u]);
            setInput("");
            toast.success(`"${name}" 추가 완료!`);
        } catch {
            toast.error("유저 정보를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };
    const removeUser = (name: string) =>
        setUsers((p) => p.filter((u) => u.name !== name));

    // 캐릭터 검색 + 그리드
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
            return toast.error("캐릭터는 최대 3개까지 선택할 수 있어요.");
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
        toast.success(`${c.name} (${weapon}) 선택됨`);
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
            {/* 탭 */}
            <div className="mb-4 flex gap-2">
                <button
                    className={`rounded-xl border px-4 py-2 text-sm transition-colors ${tab === "user" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"}`}
                    onClick={() => setTab("user")}
                >
                    유저 기준
                </button>
                <button
                    className={`rounded-xl border px-4 py-2 text-sm transition-colors ${tab === "character" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"}`}
                    onClick={() => setTab("character")}
                >
                    캐릭터 기준
                </button>
            </div>

            {/* ============== 유저 탭 ============== */}
            {tab === "user" && (
                <section className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            className="w-64 rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none placeholder-white/50"
                            placeholder="유저 닉네임 (최대 3명)"
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
                            {loading ? "추가 중..." : "유저 추가"}
                        </button>
                        {users.length > 0 && (
                            <button
                                onClick={() => setUsers([])}
                                className="ml-2 rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
                            >
                                모두 제거
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
                            유저를 1~3명 추가하면 맞춤 조합을 추천합니다.
                        </div>
                    )}
                </section>
            )}

            {/* ============== 캐릭터 탭 ============== */}
            {tab === "character" && (
                <section className="space-y-5">
                    {/* 선택된 캐릭터(무기 포함) 태그 */}
                    <div className="card">
                        <div
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                        >
                            선택된 캐릭터 ({selectedChars.length}/3)
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
                                        title="제거"
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
                                    모두 제거
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 검색 + 캐릭터 그리드 */}
                    <div>
                        <div className="mb-3">
                            <input
                                className="w-72 rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none placeholder-white/50"
                                placeholder="캐릭터 검색"
                                value={charQ}
                                onChange={(e) => setCharQ(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                    </div>

                    {/* 결과 영역 */}
                    {selectedChars.length === 0 ? (
                        <div className="mt-6 text-white/60 text-sm">
                            캐릭터를 1~3명 선택하고 무기군까지 고르면,
                            추천/평가가 표시됩니다.
                        </div>
                    ) : selectedChars.length < 3 ? (
                        <>
                            <div className="text-sm text-white/80 mb-2">
                                선택 {selectedChars.length}명 기준 추천 조합
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
                                선택한 3인 조합의 성능
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
