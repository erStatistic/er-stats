// features/suggest/CompSuggestionCard.tsx
"use client";

import * as React from "react";
import type { CompSuggestion } from "@/types";
import ClusterBadge from "@/features/cluster-dict/components/ClusterBadge";
import RolePill from "@/features/ui/RolePill";

type Props = {
    s: CompSuggestion;
    /** ID -> "캐릭터 (무기)" (cwId/charId 혼용 지원) */
    nameById: (id: number) => string;
    /** ID -> 클러스터 라벨 (없으면 미표시) */
    clusterById?: (id: number) => string | null | undefined;
    /** ID -> 포지션/롤 라벨 (없으면 미표시) */
    roleById?: (id: number) => string | null | undefined;

    /**
     * ✅ 실측(DB) 지표를 카드가 직접 불러오게 할지 여부
     * 기본 true. 끄고 싶으면 false.
     */
    enableLiveMetrics?: boolean;

    /**
     * ✅ (선택) comp가 캐릭터 id라면, 여기로 정확한 cwId 3개를 넘겨서 조회.
     * 넘기지 않으면 s.comp를 cwId로 간주한다.
     */
    cwIds?: number[];

    /**
     * ✅ (선택) 조회 옵션
     */
    query?: {
        start?: string; // ISO
        end?: string; // ISO
        tier?: string; // "All"/""/실제 티어명
        minSamples?: number; // 기본 50
    };
};

function pct(x: number) {
    return `${(x * 100).toFixed(1)}%`;
}
function mmr(x: number) {
    return x.toFixed(1);
}
function formatDur(sec?: number | null) {
    if (!sec || sec <= 0) return "—";
    const s = Math.round(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

type LiveMetrics = {
    samples: number;
    wins: number;
    win_rate: number;
    pick_rate: number;
    avg_mmr: number;
    avg_survival: number;
} | null;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

export default function CompSuggestionCard({
    s,
    nameById,
    clusterById,
    roleById,
    enableLiveMetrics = true,
    cwIds,
    query,
}: Props) {
    const ids = s.comp;
    const [live, setLive] = React.useState<LiveMetrics>(null);
    const [loading, setLoading] = React.useState(false);
    const useMeasured = !!live; // 실측 성공 시 우선 사용

    React.useEffect(() => {
        if (!enableLiveMetrics) {
            setLive(null);
            return;
        }
        const want = (cwIds && cwIds.length === 3 ? cwIds : ids) as number[];
        if (!Array.isArray(want) || want.length !== 3) {
            setLive(null);
            return; // comp 길이가 3이 아니면 조회 안 함
        }

        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const body = JSON.stringify({
                    cw: want, // 서버: [cwId, cwId, cwId]
                    start: query?.start ?? null,
                    end: query?.end ?? null,
                    tier: query?.tier ?? "",
                    minSamples: query?.minSamples ?? 50,
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
                if (!res.ok) {
                    if (!cancelled) setLive(null);
                    return;
                }
                const j = await res.json();
                const data = (j?.data ?? j) as LiveMetrics;
                if (!cancelled) setLive(data || null);
            } catch {
                if (!cancelled) setLive(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        API_BASE,
        JSON.stringify(cwIds ?? ids),
        enableLiveMetrics,
        JSON.stringify(query),
    ]);

    // 표시값 결정: 실측(or 추정)
    const win = useMeasured ? live!.win_rate : s.winRateEst;
    const pick = useMeasured ? live!.pick_rate : s.pickRateEst;
    const mmrGain = useMeasured ? live!.avg_mmr : s.mmrGainEst;
    const samplesNote = useMeasured ? `samples: ${live!.samples}` : s.note;
    const survival = useMeasured ? live!.avg_survival : undefined;

    return (
        <div className="card p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">
                    Recommended composition
                </div>

                {/* 뱃지: 실측/모델드 구분 */}
                <span className="text-[10px] rounded-md border px-1.5 py-0.5 opacity-80">
                    {useMeasured
                        ? "MEASURED"
                        : s.support?.modeled
                          ? "MODELED"
                          : "ESTIMATED"}
                </span>
            </div>

            {/* ▶ 클러스터 뱃지 */}
            {typeof clusterById === "function" && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {ids.map((id, i) => {
                        const label = clusterById(id);
                        return label ? (
                            <ClusterBadge
                                key={`cluster-${id}-${i}`}
                                label={label}
                            />
                        ) : null;
                    })}
                </div>
            )}

            {/* 포지션/롤 뱃지 (선택) */}
            {typeof roleById === "function" && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {ids.map((id, i) => {
                        const role = roleById(id);
                        return role ? (
                            <RolePill key={`role-${id}-${i}`} role={role} />
                        ) : null;
                    })}
                </div>
            )}

            {/* 캐릭터(무기) 칩 */}
            <div className="flex flex-wrap gap-2 mb-3">
                {ids.map((id, i) => (
                    <span
                        key={`name-${id}-${i}`}
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--surface)",
                        }}
                        title={nameById(id)}
                    >
                        {nameById(id)}
                    </span>
                ))}
            </div>

            {/* 메트릭 */}
            <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                    <div className="opacity-70">
                        Win rate{useMeasured ? "" : " (est.)"}
                    </div>
                    <div className="mt-0.5 text-lg font-semibold">
                        {pct(win)}
                    </div>
                </div>
                <div>
                    <div className="opacity-70">
                        Pick rate{useMeasured ? "" : " (est.)"}
                    </div>
                    <div className="mt-0.5 text-lg font-semibold">
                        {pct(pick)}
                    </div>
                </div>
                <div>
                    <div className="opacity-70">
                        Avg. MMR{useMeasured ? "" : " (est.)"}
                    </div>
                    <div className="mt-0.5 text-lg font-semibold">
                        {mmr(mmrGain)}
                    </div>
                </div>
            </div>

            {/* 실측일 때만 생존시간 표시 */}
            {useMeasured && (
                <div className="mt-2 text-[11px] opacity-80">
                    Avg. survival: {formatDur(survival)}
                </div>
            )}

            {/* 샘플/노트 */}
            {samplesNote && (
                <div className="mt-1 text-[11px] opacity-70">
                    {loading ? "Loading…" : samplesNote}
                </div>
            )}
        </div>
    );
}
