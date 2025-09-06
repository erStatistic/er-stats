"use client";

import { CompSuggestion } from "@/types";
import CompSuggestionCard from "./CompSuggestionCard";
import { toast } from "sonner";
import CharacterWeaponPicker, { CharItem } from "./CharacterWeaponPicker";
import { useEffect, useMemo, useState } from "react";

/* ============== API 유틸 ============== */
/** 예: NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080" (꼭 슬래시 제거) */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
const HAS_PREFIX = RAW_BASE.endsWith("/api/v1");
const API = (p: string) =>
    `${RAW_BASE}${HAS_PREFIX ? "" : "/api/v1"}${p.startsWith("/") ? p : `/${p}`}`;

async function fetchJSON<T>(path: string): Promise<T> {
    const url = API(path);
    const res = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const j = await res.json();
    return (j?.data ?? j) as T;
}

/* ============== 타입 ============== */
type SelectedChar = {
    id: number;
    name: string;
    imageUrl: string;
    weapon?: string;
    cwId?: number; // 선택된 무기(있으면 바로 사용)
};

/** 백엔드 실제 응답 스키마 */
type CompMetricsBoth = {
    by_cw?: {
        cw_ids: number[];
        samples: number;
        wins: number;
        win_rate: number | string;
        pick_rate: number | string;
        avg_mmr: number | string;
        avg_survival: number | string;
    };
    by_cluster?: {
        cluster_ids: number[];
        cluster_label: string;
        samples: number;
        wins: number;
        win_rate: number | string;
        pick_rate: number | string;
        avg_mmr: number | string;
        avg_survival: number | string;
    };
};

/** 프론트에서 쓰기 쉬운 평평한 타입 */
type CompMetricResp = {
    samples: number;
    wins: number;
    win_rate: number;
    pick_rate: number;
    avg_mmr: number;
    avg_survival: number;
    source: "cw" | "cluster";
};

function toNum(x: any): number {
    const n = typeof x === "string" ? parseFloat(x) : x;
    return Number.isFinite(n) ? n : 0;
}

/** 선택된 cw 3개로 조합 지표 조회 (정규화) */
async function fetchCompMetrics(
    cwIds: number[],
    opts?: { start?: string; end?: string; tier?: string; minSamples?: number },
): Promise<CompMetricResp | null> {
    const url = API("/analytics/comp/metrics");
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
            cw: cwIds,
            // 백엔드가 포인터(nil) + 역참조를 쓰므로 null 대신 빈 문자열 권장
            start: opts?.start ?? "",
            end: opts?.end ?? "",
            tier: opts?.tier ?? "",
            // 멀티 서제스트는 최소샘플 기준을 두지 않으므로 1로
            minSamples: opts?.minSamples ?? 1,
        }),
    });
    if (!res.ok) return null;

    const raw = await res.json();
    const data: CompMetricsBoth | any = raw?.data ?? raw;

    const picked =
        (data?.by_cw && { ...data.by_cw, __source: "cw" as const }) ||
        (data?.by_cluster && {
            ...data.by_cluster,
            __source: "cluster" as const,
        }) ||
        null;

    if (!picked) return null;

    return {
        samples: picked.samples ?? 0,
        wins: picked.wins ?? 0,
        win_rate: toNum(picked.win_rate),
        pick_rate: toNum(picked.pick_rate),
        avg_mmr: toNum(picked.avg_mmr),
        avg_survival: toNum(picked.avg_survival),
        source: picked.__source,
    };
}

/** cw 단위 성능행 (GetCwStats 결과와 호환) */
type CwStatRow = {
    cw_id: number;
    character_id: number;
    character_name_kr: string;
    weapon_id: number;
    weapon_name_kr: string;
    samples: number;
    wins: number;
    win_rate: number;
    pick_rate: number;
    avg_mmr: number;
    avg_survival: number;
};

async function fetchCwStats(params?: {
    start?: string | null;
    end?: string | null;
    tier?: string;
    minSamples?: number;
}): Promise<CwStatRow[]> {
    const sp = new URLSearchParams();
    if (params?.start) sp.set("start", params.start);
    if (params?.end) sp.set("end", params.end);
    if (params?.tier) sp.set("tier", params.tier);
    if (params?.minSamples != null)
        sp.set("minSamples", String(params.minSamples));
    const q = sp.toString();
    return fetchJSON<CwStatRow[]>(`/analytics/cw/stats${q ? `?${q}` : ""}`);
}

export default function UserMultiSuggestClient() {
    // 전체 캐릭(추천 풀)
    const [characters, setCharacters] = useState<CharItem[]>([]);
    // Character 탭용
    const [charQ, setCharQ] = useState("");
    const [selectedChars, setSelectedChars] = useState<SelectedChar[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<CharItem | null>(null);

    /* ---------- 캐릭터 목록 로드 ---------- */
    useEffect(() => {
        (async () => {
            try {
                const rows = await fetchJSON<Array<any>>("/characters");
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

    /** 무기 선택 콜백: CharacterWeaponPicker 가 `cwId`를 함께 넘김 */
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

    /* ---------- ① 선택 3개(모두 cwId)라면 단일 조합 측정 ---------- */
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
                const m = await fetchCompMetrics(ids, { minSamples: 1 });
                if (!m) {
                    setMeasured(null);
                    return;
                }
                setMeasured({
                    comp: ids,
                    winRateEst: m.win_rate ?? 0,
                    pickRateEst: m.pick_rate ?? 0,
                    mmrGainEst: m.avg_mmr ?? 0,
                    support: {
                        modeled: false,
                        fromPairs: 0,
                        fromSolo: 0,
                        fromCluster: 1,
                    },
                    note: `samples: ${m.samples}${
                        m.source === "cluster" ? " (cluster agg)" : ""
                    }`,
                });
            } catch {
                setMeasured(null);
            } finally {
                setMetricLoading(false);
            }
        })();
    }, [selectedChars]);

    /* ---------- ② DB 기반 추천(선택 캐릭 ≥ 3) ---------- */
    const [suggestions, setSuggestions] = useState<CompSuggestion[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    // cwId -> "캐릭 (무기)" 라벨러
    const [cwNameById, setCwNameById] = useState<(id: number) => string>(
        () => (id) => `CW ${id}`,
    );

    useEffect(() => {
        if (selectedChars.length < 3) {
            setSuggestions([]);
            return;
        }

        (async () => {
            setSuggestLoading(true);
            try {
                // 1) 후보 추출용 cw 통계 (최소샘플 제한 없이 1로)
                const rows = await fetchCwStats({ minSamples: 1 });

                const TOP_K = 3;
                const cwLabel = new Map<number, string>();
                const candidates: number[][] = [];

                for (const sel of selectedChars.slice(0, 3)) {
                    if (sel.cwId) {
                        candidates.push([sel.cwId]);
                        cwLabel.set(
                            sel.cwId,
                            `${sel.name} (${sel.weapon ?? ""})`.trim(),
                        );
                        continue;
                    }
                    const pool = rows
                        .filter((r) => r.character_id === sel.id)
                        .sort((a, b) => b.win_rate - a.win_rate)
                        .slice(0, TOP_K);

                    const ids = pool.map((r) => {
                        cwLabel.set(
                            r.cw_id,
                            `${r.character_name_kr ?? sel.name} (${r.weapon_name_kr ?? ""})`.trim(),
                        );
                        return r.cw_id;
                    });

                    if (ids.length === 0) {
                        setSuggestions([]);
                        setSuggestLoading(false);
                        return;
                    }
                    candidates.push(ids);
                }

                // 2) 후보 교차곱 조합
                const combos: number[][] = [];
                const LIMIT = 24;
                const [A, B, C] = candidates;
                for (const a of A)
                    for (const b of B)
                        for (const c of C) {
                            if (combos.length >= LIMIT) break;
                            combos.push([a, b, c]);
                        }

                // 3) 각 조합 메트릭 호출 (최소샘플 1) + 정규화 사용
                const results = await Promise.allSettled(
                    combos.map((ids) =>
                        fetchCompMetrics(ids, { minSamples: 1 }),
                    ),
                );

                // 샘플 0도 카드로 표기
                const out: CompSuggestion[] = results.map((res, i) => {
                    const m = res.status === "fulfilled" ? res.value : null;
                    return {
                        comp: combos[i],
                        winRateEst: m?.win_rate ?? 0,
                        pickRateEst: m?.pick_rate ?? 0,
                        mmrGainEst: m?.avg_mmr ?? 0,
                        support: {
                            modeled: false,
                            fromPairs: 0,
                            fromSolo: 0,
                            fromCluster: 1,
                        },
                        note: `samples: ${m?.samples ?? 0}${
                            m?.source === "cluster" ? " (cluster agg)" : ""
                        }`,
                    };
                });

                out.sort(
                    (a, b) =>
                        b.winRateEst - a.winRateEst ||
                        b.mmrGainEst - a.mmrGainEst ||
                        b.pickRateEst - a.pickRateEst,
                );

                setSuggestions(out.slice(0, 8));
                setCwNameById(
                    () => (id: number) => cwLabel.get(id) ?? `CW ${id}`,
                );
            } catch {
                setSuggestions([]);
            } finally {
                setSuggestLoading(false);
            }
        })();
    }, [JSON.stringify(selectedChars.map((c) => [c.id, c.cwId]))]);

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

                {/* ✅ DB 기반 추천 조합 (샘플 0도 카드 표시) */}
                {selectedChars.length >= 3 && (
                    <>
                        <div
                            className="text-sm mb-2"
                            style={{ color: "var(--text-muted)" }}
                        >
                            Recommended comps based on {selectedChars.length}{" "}
                            selected
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestLoading && (
                                <div
                                    className="card p-4 text-sm"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    Loading suggestions…
                                </div>
                            )}
                            {!suggestLoading &&
                                suggestions.map((s, i) => (
                                    <CompSuggestionCard
                                        key={i}
                                        s={s}
                                        nameById={cwNameById}
                                        badge="MEASURED"
                                    />
                                ))}
                            {!suggestLoading && suggestions.length === 0 && (
                                <div
                                    className="card p-4 text-sm"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    Not enough samples.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>

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
