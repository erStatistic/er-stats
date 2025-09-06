// features/suggest/UserMultiSuggestClient.tsx
"use client";

import { CompSuggestion, UserProfile } from "@/types";
import CompSuggestionCard from "./CompSuggestionCard";
import { toast } from "sonner";
import CharacterWeaponPicker, { CharItem } from "./CharacterWeaponPicker";
import { Suspense, useEffect, useMemo, useState } from "react";
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

/** 선택된 cw 3개로 조합 지표 조회(서버의 GetCompMetricsBySelectedCWs) */
type CompMetricResp = {
    samples: number;
    wins: number;
    win_rate: number;
    pick_rate: number;
    avg_mmr: number;
    avg_survival: number;
};
async function fetchCompMetrics(
    cwIds: number[],
    opts?: { start?: string; end?: string; tier?: string; minSamples?: number },
): Promise<CompMetricResp | null> {
    const body = JSON.stringify({
        cw: cwIds, // ← 필수: [cwId, cwId, cwId]
        start: opts?.start ?? null,
        end: opts?.end ?? null,
        tier: opts?.tier ?? "",
        minSamples: opts?.minSamples ?? 50,
    });
    const res = await fetch(`${API_BASE}/analytics/comp/metrics`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json",
        },
        cache: "no-store",
        body,
    });
    if (!res.ok) return null;
    const j = await res.json();
    return (j?.data ?? j) as CompMetricResp;
}

/* ============== 데모 점수(기존) ============== */
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

/* ============== 신규: 선택 CW 기반 + 부족분 풀 보완(유저 탭에서 사용) ============== */
type UserPick = {
    id: number;
    name: string;
    imageUrl: string;
    cwId: number;
    weapon: string;
};
type PicksByUser = Record<string, UserPick[]>;
function suggestFromUserCwWithPool(
    picksByUserTop3: PicksByUser,
    allCharIds: number[],
    topK = 8,
): CompSuggestion[] {
    const sets = Object.values(picksByUserTop3).filter((arr) => arr.length > 0);
    const n = Math.min(sets.length, 3);
    if (n === 0) return [];

    const seen = new Set<string>();
    const out: CompSuggestion[] = [];
    const push = (comp: number[]) => {
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
                fromPairs: 0.45,
                fromSolo: 0.2,
                fromCluster: 0.35,
                modeled: true,
            },
            note: `samples: ${count}`,
        });
    };

    if (n === 3) {
        const [A, B, C] = sets;
        for (const a of A)
            for (const b of B)
                for (const c of C) {
                    const chars = new Set([a.id, b.id, c.id]);
                    if (chars.size !== 3) continue;
                    push([a.cwId, b.cwId, c.cwId]);
                }
    } else if (n === 2) {
        const [A, B] = sets;
        for (const a of A)
            for (const b of B) {
                if (a.id === b.id) continue;
                for (const x of allCharIds) {
                    if (x === a.id || x === b.id) continue;
                    push([a.cwId, b.cwId, x]); // x는 캐릭 id(무기 미지정)
                }
            }
    } else {
        const [A] = sets;
        for (const a of A) {
            for (let i = 0; i < allCharIds.length; i++) {
                const b = allCharIds[i];
                if (b === a.id) continue;
                for (let j = i + 1; j < allCharIds.length; j++) {
                    const c = allCharIds[j];
                    if (c === a.id || c === b) continue;
                    push([a.cwId, b, c]);
                }
            }
        }
    }
    const score = (c: CompSuggestion) =>
        c.winRateEst * 1.2 + c.mmrGainEst / 15 + c.pickRateEst * 0.6;
    return out.sort((a, b) => score(b) - score(a)).slice(0, topK);
}

/* ============== 타입 ============== */
type SelectedChar = {
    id: number;
    name: string;
    imageUrl: string;
    weapon?: string;
    /** ✅ 반드시 포함: 선택된 무기 cwId */
    cwId?: number;
};

export default function UserMultiSuggestClient() {
    // 전체 캐릭(추천 풀)
    const [characters, setCharacters] = useState<CharItem[]>([]);
    // Character 탭용
    const [charQ, setCharQ] = useState("");
    const [selectedChars, setSelectedChars] = useState<SelectedChar[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<CharItem | null>(null);

    // (유저 탭 관련 상태는 생략: 기존 그대로)

    /* ---------- 캐릭터 목록 로드 ---------- */
    useEffect(() => {
        (async () => {
            try {
                const rows = await fetchJSON<Array<any>>("/api/v1/characters");
                const mapped: CharItem[] = rows.map((c) => ({
                    id: c.id ?? c.ID,
                    name: c.name_kr ?? "이름 없음",
                    imageUrl: c.image_url_mini ?? "",
                }));
                setCharacters(mapped);
            } catch {
                toast.error("캐릭터 목록을 불러오지 못했습니다.");
            }
        })();
    }, []);

    /* ---------- Character 탭 ---------- */
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

    /** ✅ 무기 선택 콜백: CharacterWeaponPicker 가 `cwId`를 함께 넘겨야 함 */
    const pickWeapon = (id: number, weaponLabel: string, cwId: number) => {
        const c = characters.find((x) => x.id === id);
        if (!c) return;
        setSelectedChars((prev) => [
            ...prev,
            {
                id: c.id,
                name: c.name,
                imageUrl: c.imageUrl,
                weapon: weaponLabel,
                cwId,
            },
        ]);
    };

    const removeChar = (id: number) =>
        setSelectedChars((p) => p.filter((c) => c.id !== id));

    /* ---------- 실측 조합 지표 요청 ---------- */
    const [measured, setMeasured] = useState<CompSuggestion | null>(null);
    const [metricLoading, setMetricLoading] = useState(false);

    useEffect(() => {
        const ids = selectedChars
            .map((c) => c.cwId)
            .filter((x): x is number => Number.isFinite(x));
        if (ids.length !== 3) {
            setMeasured(null);
            return;
        }
        (async () => {
            try {
                setMetricLoading(true);
                const m = await fetchCompMetrics(ids, { minSamples: 50 }); // tier/start/end 필요시 추가
                if (!m) {
                    setMeasured(null);
                    return;
                }
                // 카드에 맞게 매핑
                setMeasured({
                    comp: ids, // cwId 3개
                    winRateEst: m.win_rate,
                    pickRateEst: m.pick_rate,
                    mmrGainEst: m.avg_mmr,
                    support: {
                        fromPairs: 0.0,
                        fromSolo: 0.0,
                        fromCluster: 1.0,
                        modeled: false,
                    },
                    note: `samples: ${m.samples}`,
                });
            } catch {
                setMeasured(null);
            } finally {
                setMetricLoading(false);
            }
        })();
    }, [selectedChars]);

    /* ---------- 렌더 ---------- */
    return (
        <div className="text-app">
            <section className="space-y-5">
                {/* 선택된 캐릭들 */}
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

                {/* 캐릭터 카탈로그 */}
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

                {/* ✅ 실측 지표 카드: 3개 무기(cwId) 모두 선택되었을 때 */}
                {selectedChars.filter((c) => Number.isFinite(c.cwId)).length ===
                    3 && (
                    <>
                        <div
                            className="text-sm mb-2"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Measured metrics for selected composition
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {measured ? (
                                <CompSuggestionCard
                                    s={measured}
                                    nameById={(id) => {
                                        // id는 cwId. 선택 목록에서 찾아 라벨링
                                        const hit = selectedChars.find(
                                            (c) => c.cwId === id,
                                        );
                                        return hit
                                            ? `${hit.name} (${hit.weapon ?? ""})`
                                            : `CW ${id}`;
                                    }}
                                    badge="MEASURED"
                                />
                            ) : (
                                <div
                                    className="card p-4 text-sm"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    {metricLoading
                                        ? "Loading metrics…"
                                        : "Not enough samples."}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* (선택) 모델드 추천: 캐릭터만 선택한 경우 등 기존 모형 카드 유지 */}
                {selectedChars.length > 0 && (
                    <>
                        <div
                            className="text-sm mb-2"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Recommended comps based on {selectedChars.length}{" "}
                            selected
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        for (let j = i + 1; j < ids.length; j++)
                                            for (
                                                let k = j + 1;
                                                k < ids.length;
                                                k++
                                            )
                                                push([ids[i], ids[j], ids[k]]);
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

            {/* 무기 선택 모달
         ✅ onPick 시그니처를 (id, weaponLabel, cwId) 로 맞춰주세요. */}
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
