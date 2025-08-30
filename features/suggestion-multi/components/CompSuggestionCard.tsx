// features/suggest/CompSuggestionCard.tsx
"use client";

import * as React from "react";
import type { CompSuggestion } from "@/types";
import ClusterBadge from "@/features/cluster-dict/components/ClusterBadge"; // ← 위에서 쓰신 파일
import RolePill from "@/features/ui/RolePill"; // ← 기존에 쓰시던 컴포넌트

type Props = {
    s: CompSuggestion;
    /** ID -> "캐릭터 (무기)" (cwId/charId 혼용 지원) */
    nameById: (id: number) => string;
    /** ID -> 클러스터 라벨 (없으면 미표시) */
    clusterById?: (id: number) => string | null | undefined;
    /** ID -> 포지션/롤 라벨 (없으면 미표시) */
    roleById?: (id: number) => string | null | undefined;
};

function pct(x: number) {
    return `${(x * 100).toFixed(1)}%`;
}
function mmr(x: number) {
    return x.toFixed(1);
}

export default function CompSuggestionCard({
    s,
    nameById,
    clusterById,
    roleById,
}: Props) {
    const ids = s.comp;

    return (
        <div className="card p-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">
                    Recommended composition
                </div>
                {s.support?.modeled && (
                    <span className="text-[10px] rounded-md border px-1.5 py-0.5 opacity-80">
                        MODELED
                    </span>
                )}
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
                        ) : null; // ← 라벨 없으면 아예 표시하지 않음
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
                    <div className="opacity-70">Win rate (est.)</div>
                    <div className="mt-0.5 text-lg font-semibold">
                        {pct(s.winRateEst)}
                    </div>
                </div>
                <div>
                    <div className="opacity-70">Pick rate (est.)</div>
                    <div className="mt-0.5 text-lg font-semibold">
                        {pct(s.pickRateEst)}
                    </div>
                </div>
                <div>
                    <div className="opacity-70">Avg. MMR (est.)</div>
                    <div className="mt-0.5 text-lg font-semibold">
                        {mmr(s.mmrGainEst)}
                    </div>
                </div>
            </div>

            {s.note && (
                <div className="mt-2 text-[11px] opacity-70">{s.note}</div>
            )}
        </div>
    );
}
