// components/PatchCharacterCard.tsx
"use client";

import { useMemo, useState } from "react";
import { CharacterPatchSummary } from "@/lib/patch_transform";
import { TYPE_CHIP, TYPE_LABEL } from "@/features/patches";
import { deltaTone, arrow } from "@/features/patches";

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
                                {TYPE_LABEL(b)}
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
                                {TYPE_LABEL(c.type)}
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
