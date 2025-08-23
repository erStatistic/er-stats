// components/PatchCharacterCard.tsx
"use client";

import { useMemo, useState } from "react";
import { CharacterPatchSummary } from "@/lib/patch_transform";

/** 타입별 칩 색상 (라이트/다크 대응) */
const TYPE_CHIP: Record<"buff" | "nerf" | "rework" | "adjust", string> = {
    buff: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    nerf: "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30",
    rework: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
    adjust: "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30",
};

const typeLabel = (t: "buff" | "nerf" | "rework" | "adjust") =>
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
        <article className="card p-0 overflow-hidden hover:-translate-y-0.5 transition-transform">
            {/* 헤더: 토큰 기반 배너 (라이트/다크 모두 조화) */}
            <header
                className="comp-banner rounded-t-2xl px-4 py-3 flex items-center gap-3"
                style={{
                    // 카드 모서리와 항상 동일하게 유지
                    borderTopLeftRadius: "inherit",
                    borderTopRightRadius: "inherit",
                    // 전역 토큰이 없다면 라이트 친화적인 그라디언트를 폴백으로 사용
                }}
            >
                <img
                    src={data.imageUrl}
                    alt={data.name}
                    width={40}
                    height={40}
                    loading="lazy"
                    className="w-10 h-10 rounded-xl object-cover border border-app bg-muted"
                />
                <div className="min-w-0 flex-1">
                    {/* text-white 제거 → 배너 토큰 색상 사용 */}
                    <h3 className="font-bold truncate">{data.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {data.badges.map((b) => (
                            <span
                                key={b}
                                className={`text-[11px] px-2 py-0.5 rounded-full border ${TYPE_CHIP[b]}`}
                            >
                                {typeLabel(b)}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {/* 변경 항목 */}
            <div className="p-4 space-y-3">
                {shown.map((c) => (
                    <div
                        key={c.id}
                        className="rounded-xl border border-app bg-surface p-3"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="font-medium min-w-0 text-app">
                                <span className="truncate">{c.field}</span>
                                {c.note ? (
                                    <span className="ml-2 text-xs text-muted-app">
                                        ({c.note})
                                    </span>
                                ) : null}
                            </div>
                            <span
                                className={`text-[11px] px-2 py-0.5 rounded-full border ${TYPE_CHIP[c.type]}`}
                            >
                                {typeLabel(c.type)}
                            </span>
                        </div>

                        {/* before/after/delta */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            {c.before !== undefined && (
                                <span className="rounded-md bg-muted border border-app px-2 py-1">
                                    <span className="text-muted-app mr-1">
                                        이전
                                    </span>
                                    <span className="text-app">
                                        {String(c.before)}
                                    </span>
                                </span>
                            )}
                            {c.after !== undefined && (
                                <span className="rounded-md bg-muted border border-app px-2 py-1">
                                    <span className="text-muted-app mr-1">
                                        이후
                                    </span>
                                    <span className="text-app">
                                        {String(c.after)}
                                    </span>
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
                        className="w-full rounded-lg border border-app bg-muted text-xs py-2 hover:opacity-90 transition"
                        aria-expanded={open}
                    >
                        {open ? "접기" : `+${rest}개 더 보기`}
                    </button>
                )}
            </div>
        </article>
    );
}

/** delta만으로 이득/손해를 완벽히 판단하긴 어렵지만, 타입을 함께 참고해 톤을 맞춤 */
function deltaTone(delta: string, t: "buff" | "nerf" | "rework" | "adjust") {
    const s = delta.trim();
    const pos = s.startsWith("+");
    const neg = s.startsWith("-");

    // 타입 우선
    if (t === "buff")
        return "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10";
    if (t === "nerf")
        return "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10";

    // 조정/리워크는 delta 부호로 색 보조
    if (pos)
        return "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10";
    if (neg)
        return "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10";

    return "border-app text-muted-app bg-muted";
}

function arrow(delta: string, t: "buff" | "nerf" | "rework" | "adjust") {
    const s = delta.trim();
    if (s.startsWith("+")) return t === "nerf" ? "▼" : "▲";
    if (s.startsWith("-")) return t === "buff" ? "▲" : "▼";
    return "—";
}
