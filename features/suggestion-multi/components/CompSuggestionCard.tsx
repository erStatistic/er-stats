"use client";

import * as React from "react";
import type { CompSuggestion } from "@/types";

type Props = {
    s: CompSuggestion; // 이미 측정된 값
    nameById: (id: number) => string; // cwId -> "캐릭 (무기)"
    badge?: string; // 우측 상단 라벨
};

function pct(x?: number) {
    const v = Number.isFinite(x as number) ? (x as number) : 0;
    return `${(v * 100).toFixed(1)}%`;
}
function mmr(x?: number) {
    const v = Number.isFinite(x as number) ? (x as number) : 0;
    return v.toFixed(1);
}

export default function CompSuggestionCard({ s, nameById, badge }: Props) {
    const ids = s.comp;

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">
                    Recommended composition
                </div>
                <span className="text-[10px] rounded-md border px-1.5 py-0.5 opacity-80">
                    {badge ?? (s.support?.modeled ? "MODELED" : "MEASURED")}
                </span>
            </div>

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

            <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                    <div className="opacity-70">Win rate</div>
                    <div className="mt-0.5 text-lg font-semibold">
                        {pct(s.winRateEst)}
                    </div>
                </div>
                <div>
                    <div className="opacity-70">Pick rate</div>
                    <div className="mt-0.5 text-lg font-semibold">
                        {pct(s.pickRateEst)}
                    </div>
                </div>
                <div>
                    <div className="opacity-70">Avg. MMR</div>
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
