"use client";

import { ChangeType } from "@/types";

const ALL: ChangeType[] = ["buff", "nerf", "adjust", "rework"];

export default function PatchFilters({
    q,
    onChangeQ,
    selectedTypes,
    onToggleType,
}: {
    q: string;
    onChangeQ: (v: string) => void;
    selectedTypes: ChangeType[];
    onToggleType: (t: ChangeType) => void;
}) {
    const chipStyle = (t: ChangeType) => {
        const active = selectedTypes.includes(t);
        const base = "text-xs rounded-full border px-3 py-1 transition-colors";
        const byType =
            t === "buff"
                ? "border-emerald-400/40 text-emerald-300"
                : t === "nerf"
                  ? "border-rose-400/40 text-rose-300"
                  : t === "rework"
                    ? "border-amber-400/40 text-amber-300"
                    : "border-sky-400/40 text-sky-300";
        const bg = active ? "bg-white/10" : "hover:bg-white/5";
        return `${base} ${byType} ${bg}`;
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-[#111A2E] p-3 flex flex-wrap items-center gap-2">
            <input
                className="w-64 rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none placeholder-white/50"
                placeholder="실험체/무기/설명 검색"
                value={q}
                onChange={(e) => onChangeQ(e.target.value)}
            />
            <div className="flex items-center gap-2">
                {ALL.map((t) => (
                    <button
                        key={t}
                        className={chipStyle(t)}
                        onClick={() => onToggleType(t)}
                    >
                        {t === "buff"
                            ? "버프"
                            : t === "nerf"
                              ? "너프"
                              : t === "rework"
                                ? "리워크"
                                : "조정"}
                    </button>
                ))}
            </div>
        </div>
    );
}
