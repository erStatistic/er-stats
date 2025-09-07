"use client";

import { CompSuggestion } from "@/types";
import CompSuggestionCard from "./CompSuggestionCard";
import { toast } from "sonner";
import CharacterWeaponPicker, { CharItem } from "./CharacterWeaponPicker";
import { useEffect, useMemo, useState } from "react";

/* ============== API 유틸 ============== */
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

/* ============== 초성 검색 유틸 ============== */
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
] as const;
const CHO_SET = new Set(CHO);

/** 문자열에서 한글 음절의 초성만 추출하여 이어붙임(공백 제거) */
function toChosung(str: string): string {
    let out = "";
    for (const ch of (str || "").replace(/\s+/g, "")) {
        const code = ch.codePointAt(0)!;
        if (code >= 0xac00 && code <= 0xd7a3) {
            const idx = Math.floor((code - 0xac00) / 588);
            out += CHO[idx] ?? "";
        } else if (CHO_SET.has(ch as any)) {
            out += ch; // 이미 초성(ㄱ, ㄲ …)이면 그대로
        }
    }
    return out;
}

/** 쿼리가 '초성만'으로 이루어졌는지 판별 */
function isChosungQuery(q: string): boolean {
    const t = (q || "").replace(/\s+/g, "");
    if (!t) return false;
    for (const ch of t) {
        if (!CHO_SET.has(ch as any)) return false;
    }
    return true;
}

/* ============== 타입 ============== */
type SelectedChar = {
    id: number;
    name: string;
    imageUrl: string;
    weapon?: string;
    cwId?: number;
};

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
            start: opts?.start ?? "",
            end: opts?.end ?? "",
            tier: opts?.tier ?? "",
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

    /* ---------- 검색용 전처리(소문자/초성) ---------- */
    type CatalogItem = CharItem & { _lower: string; _cho: string };
    const catalog: CatalogItem[] = useMemo(
        () =>
            characters.map((c) => ({
                ...c,
                _lower: (c.name || "").toLowerCase(),
                _cho: toChosung(c.name || ""),
            })),
        [characters],
    );

    /* ---------- Character 탭(초성 검색 지원) ---------- */
    const filteredChars = useMemo(() => {
        const term = (charQ || "").trim();
        const termLower = term.toLowerCase();
        const termCho = toChosung(term);
        const choOnly = isChosungQuery(term);
        const selectedIds = new Set(selectedChars.map((c) => c.id));

        return catalog.filter((c) => {
            if (selectedIds.has(c.id)) return false;
            if (!term) return true;

            // 초성만 입력한 경우: 초성 기준 포함 여부
            if (choOnly) return c._cho.includes(termCho);

            // 일반 검색 + 초성 보조 검색
            return (
                c._lower.includes(termLower) ||
                (!!termCho && c._cho.includes(termCho))
            );
        });
    }, [charQ, catalog, selectedChars]);

    const openPickerFor = (c: CharItem) => {
        if (selectedChars.length >= 3)
            return toast.error("You can select up to 3 characters.");
        setPickerTarget(c);
        setPickerOpen(true);
    };

    /** 무기 선택 콜백 */
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
                    note: `samples: ${m.samples}${m.source === "cluster" ? " (cluster agg)" : ""}`,
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

                const combos: number[][] = [];
                const LIMIT = 24;
                const [A, B, C] = candidates;
                for (const a of A)
                    for (const b of B)
                        for (const c of C) {
                            if (combos.length >= LIMIT) break;
                            combos.push([a, b, c]);
                        }

                const results = await Promise.allSettled(
                    combos.map((ids) =>
                        fetchCompMetrics(ids, { minSamples: 1 }),
                    ),
                );

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
                        note: `samples: ${m?.samples ?? 0}${m?.source === "cluster" ? " (cluster agg)" : ""}`,
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
                            placeholder="Search characters (초성도 가능: ㅇㄹㅂ)"
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

                {/* 추천 조합 */}
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
                            {suggestions.map((s, i) => (
                                <CompSuggestionCard
                                    key={i}
                                    s={s}
                                    nameById={cwNameById}
                                    badge="MEASURED"
                                />
                            ))}
                            {suggestions.length === 0 && (
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
