"use client";

import { CompSuggestion } from "@/types";

export default function CompSuggestionCard({
    s,
    nameById,
}: {
    s: CompSuggestion;
    nameById: (id: number) => string;
}) {
    return (
        <article className="rounded-2xl border border-white/10 bg-[#121826] p-4 text-white">
            <header className="flex items-center justify-between">
                <div className="text-sm text-white/70">Recommended composition</div>
                {s.support.modeled && (
                    <span className="text-[10px] rounded-full border px-2 py-0.5 border-amber-400/40 text-amber-300 bg-amber-400/10">
                        MODELED
                    </span>
                )}
            </header>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {s.comp.map((id) => (
                    <span
                        key={id}
                        className="rounded-full bg-[#0E1422] border border-white/10 px-2.5 py-1"
                    >
                        {nameById(id)}
                    </span>
                ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                    <div className="text-xs text-white/60">Win rate (est.)</div>
                    <div className="text-lg font-semibold">
                        {(s.winRateEst * 100).toFixed(1)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-white/60">Pick rate (est.)</div>
                    <div className="text-lg font-semibold">
                        {(s.pickRateEst * 100).toFixed(2)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-white/60">Avg. MMR (est.)</div>
                    <div className="text-lg font-semibold">
                        {s.mmrGainEst.toFixed(1)}
                    </div>
                </div>
            </div>

            <details className="mt-3 text-xs text-white/70">
                <summary className="cursor-pointer select-none">
                    Show rationale
                </summary>
                <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>pair: {(s.support.fromPairs * 100).toFixed(1)}%</div>
                    <div>solo: {(s.support.fromSolo * 100).toFixed(1)}%</div>
                    <div>cluster: {(s.support.fromCluster * 100).toFixed(1)}%</div>
                </div>
                <div className="mt-1 text-white/50">{s.note}</div>
            </details>
        </article>
    );
}
