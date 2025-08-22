// components/CompCard.tsx
"use client";

import React from "react";
import { CompSummary, CharacterSummary } from "@/types";

interface CompCardProps {
    comp: CompSummary;
    characters: CharacterSummary[];
    title?: string;
}

export default function CompCard({
    comp,
    characters,
    title = "Top Team",
}: CompCardProps) {
    const getChar = (id: number) => characters.find((c) => c.id === id);

    return (
        <article
            className="
        card w-[min(92vw,560px)] p-0
        shadow-[0_10px_30px_rgba(0,0,0,0.15)]
        transition-transform duration-300 hover:-translate-y-0.5
      "
        >
            {/* 상단 배너 */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 text-center">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    {title}
                </h3>
            </header>

            {/* 캐릭터 3명 (중앙 강조) */}
            <div className="flex items-end justify-center gap-3 sm:gap-5 px-4 sm:px-6 py-6 bg-muted">
                {comp.comp.map((id, idx) => {
                    const c = getChar(id);
                    if (!c) return null;
                    const big = idx === 1; // 가운데(두 번째) 강조
                    return (
                        <div key={id} className="flex flex-col items-center">
                            <img
                                src={c.imageUrl}
                                alt={c.name}
                                className={
                                    "rounded-full object-cover border-4 " +
                                    (big
                                        ? "w-24 h-24 sm:w-28 sm:h-28"
                                        : "w-16 h-16 sm:w-20 sm:h-20 opacity-90")
                                }
                                style={{
                                    // 가운데는 브랜드 컬러 테두리, 나머지는 테마 보더
                                    borderColor: big
                                        ? "var(--brand)"
                                        : "var(--border)",
                                }}
                            />
                            <p className="mt-2 text-[11px] sm:text-xs text-muted-app max-w-[10ch] truncate">
                                {c.name}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* 수치 영역: 승률/픽률/MMR/게임 수 */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-surface text-app">
                <StatBlock
                    label="승률"
                    value={`${(comp.winRate * 100).toFixed(1)}%`}
                    barValue={comp.winRate}
                    barClass="bg-green-500"
                />
                <StatBlock
                    label="픽률"
                    value={`${(comp.pickRate * 100).toFixed(1)}%`}
                    barValue={comp.pickRate}
                    barClass="bg-blue-500"
                />
                <StatBlock
                    label="평균 MMR"
                    value={comp.mmrGain.toFixed(1)}
                    barValue={Math.max(0, Math.min(1, comp.mmrGain / 20))}
                    barClass="bg-purple-500"
                />
                <StatBlock
                    label="게임 수"
                    value={comp.count.toLocaleString()}
                    barValue={Math.max(0, Math.min(1, comp.count / 500))}
                    barClass="bg-amber-400"
                />
            </section>
        </article>
    );
}

/** 작은 지표 카드 (라벨/값 + 미니 바) */
function StatBlock({
    label,
    value,
    barValue,
    barClass,
}: {
    label: string;
    value: string | number;
    barValue: number; // 0~1
    barClass: string;
}) {
    return (
        <div className="card px-3 py-3">
            <div className="text-[11px] sm:text-xs text-muted-app">{label}</div>
            <div className="mt-0.5 text-base sm:text-lg font-semibold text-app">
                {value}
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-elev-10">
                <div
                    className={`h-full ${barClass}`}
                    style={{
                        width: `${Math.max(0, Math.min(1, barValue)) * 100}%`,
                    }}
                    aria-hidden
                />
            </div>
        </div>
    );
}
