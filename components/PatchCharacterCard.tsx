"use client";

import { useMemo, useState } from "react";
import { CharacterPatchSummary } from "@/lib/patch_transform";

function badgeStyle(t: "buff" | "nerf" | "rework" | "adjust") {
    switch (t) {
        case "buff":
            return "border-emerald-400/40 text-emerald-300 bg-emerald-500/10";
        case "nerf":
            return "border-rose-400/40 text-rose-300 bg-rose-500/10";
        case "rework":
            return "border-amber-400/40 text-amber-300 bg-amber-500/10";
        default:
            return "border-sky-400/40 text-sky-300 bg-sky-500/10";
    }
}
const label = (t: "buff" | "nerf" | "rework" | "adjust") =>
    t === "buff"
        ? "버프"
        : t === "nerf"
          ? "너프"
          : t === "rework"
            ? "리워크"
            : "조정";

export default function PatchCharacterCard({
    data,
    defaultFold = 4,
}: {
    data: CharacterPatchSummary;
    defaultFold?: number;
}) {
    const [open, setOpen] = useState(false);
    const shown = useMemo(
        () => (open ? data.changes : data.changes.slice(0, defaultFold)),
        [open, data.changes, defaultFold],
    );
    const rest = Math.max(0, data.changes.length - shown.length);

    return (
        <article className="rounded-2xl overflow-hidden border border-white/10 bg-[#121826] hover:-translate-y-0.5 transition-transform">
            {/* 헤더 */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center gap-3">
                <img
                    src={data.imageUrl}
                    alt={data.name}
                    className="w-10 h-10 rounded-xl object-cover border border-white/10"
                />
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white truncate">
                        {data.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {data.badges.map((b) => (
                            <span
                                key={b}
                                className={`text-[11px] px-2 py-0.5 rounded-full border ${badgeStyle(b)}`}
                            >
                                {label(b)}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {/* 변경 항목(가변 길이) */}
            <div className="p-4 space-y-3">
                {shown.map((c) => (
                    <div
                        key={c.id}
                        className="rounded-xl border border-white/10 bg-[#0E1422] p-3"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="font-medium min-w-0">
                                <span className="truncate">{c.field}</span>
                                {c.note ? (
                                    <span className="ml-2 text-xs text-white/60">
                                        ({c.note})
                                    </span>
                                ) : null}
                            </div>
                            <span
                                className={`text-[11px] px-2 py-0.5 rounded-full border ${badgeStyle(c.type)}`}
                            >
                                {label(c.type)}
                            </span>
                        </div>

                        {/* before/after/delta – 값은 항목마다 다를 수 있음 */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            {c.before !== undefined && (
                                <span className="rounded-md bg-white/5 border border-white/10 px-2 py-1">
                                    <span className="text-white/50 mr-1">
                                        이전
                                    </span>
                                    {String(c.before)}
                                </span>
                            )}
                            {c.after !== undefined && (
                                <span className="rounded-md bg-white/5 border border-white/10 px-2 py-1">
                                    <span className="text-white/50 mr-1">
                                        이후
                                    </span>
                                    {String(c.after)}
                                </span>
                            )}
                            {c.delta && (
                                <span
                                    className={`rounded-md px-2 py-1 border ${deltaTone(c.delta, c.type)}`}
                                >
                                    {arrow(c.delta, c.type)} {c.delta}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {rest > 0 && (
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 text-xs py-2 hover:bg-white/10"
                    >
                        {open ? "접기" : `+${rest}개 더 보기`}
                    </button>
                )}
            </div>
        </article>
    );
}

/** delta만으로 이득/손해를 완벽히 판단하긴 어렵지만, 타입을 함께 참고해 톤을 맞춥니다. */
function deltaTone(delta: string, t: "buff" | "nerf" | "rework" | "adjust") {
    const s = delta.trim();
    const pos = s.startsWith("+");
    const neg = s.startsWith("-");
    if (t === "buff")
        return "border-emerald-400/30 text-emerald-300 bg-emerald-500/10";
    if (t === "nerf") return "border-rose-400/30 text-rose-300 bg-rose-500/10";
    if (pos) return "border-emerald-400/30 text-emerald-300 bg-emerald-500/10";
    if (neg) return "border-rose-400/30 text-rose-300 bg-rose-500/10";
    return "border-white/10 text-white/80 bg-white/5";
}
function arrow(delta: string, t: "buff" | "nerf" | "rework" | "adjust") {
    const s = delta.trim();
    if (s.startsWith("+")) return t === "nerf" ? "▼" : "▲";
    if (s.startsWith("-")) return t === "buff" ? "▲" : "▼";
    return "—";
}
