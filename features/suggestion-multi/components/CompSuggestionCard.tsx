// components/CompSuggestionCard.tsx
"use client";

import { CompSuggestion } from "@/types";

export default function CompSuggestionCard({
    s,
    nameById,
}: {
    s: CompSuggestion;
    nameById: (id: number) => string;
}) {
    // ✅ support가 없을 때도 안전하게 동작하도록 기본값 지정
    const support = s.support ?? {
        modeled: false,
        fromPairs: 0,
        fromSolo: 0,
        fromCluster: 0,
    };

    return (
        <article className="card p-4">
            <header className="flex items-center justify-between">
                <div className="text-sm text-muted-app">
                    Recommended composition
                </div>

                {support.modeled && (
                    <span
                        className="text-[10px] rounded-full border px-2 py-0.5"
                        style={{
                            borderColor:
                                "color-mix(in lab, #fbbf24, transparent 60%)",
                            color: "#fbbf24",
                            background:
                                "color-mix(in lab, #fbbf24, transparent 90%)",
                        }}
                    >
                        MODELED
                    </span>
                )}
            </header>

            {/* 구성원 칩 */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {s.comp.map((id) => (
                    <span
                        key={id}
                        className="rounded-full border px-2.5 py-1 bg-muted text-app border-app"
                    >
                        {nameById(id)}
                    </span>
                ))}
            </div>

            {/* 추정 수치 */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                    <div className="text-xs text-muted-app">
                        Win rate (est.)
                    </div>
                    <div className="text-lg font-semibold text-app">
                        {(s.winRateEst * 100).toFixed(1)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-muted-app">
                        Pick rate (est.)
                    </div>
                    <div className="text-lg font-semibold text-app">
                        {(s.pickRateEst * 100).toFixed(2)}%
                    </div>
                </div>
                <div>
                    <div className="text-xs text-muted-app">
                        Avg. MMR (est.)
                    </div>
                    <div className="text-lg font-semibold text-app">
                        {s.mmrGainEst.toFixed(1)}
                    </div>
                </div>
            </div>

            {/* 근거 */}
            {/* <details className="mt-3 text-xs"> */}
            {/*     <summary className="cursor-pointer select-none text-app"> */}
            {/*         Show rationale */}
            {/*     </summary> */}
            {/**/}
            {/*     <div className="mt-2 grid grid-cols-3 gap-2 text-app"> */}
            {/*         <div>pair: {(support.fromPairs * 100).toFixed(1)}%</div> */}
            {/*         <div>solo: {(support.fromSolo * 100).toFixed(1)}%</div> */}
            {/*         <div> */}
            {/*             cluster: {(support.fromCluster * 100).toFixed(1)}% */}
            {/*         </div> */}
            {/*     </div> */}
            {/**/}
            {/*     {s.note && <div className="mt-1 text-muted-app">{s.note}</div>} */}
            {/* </details> */}
        </article>
    );
}
