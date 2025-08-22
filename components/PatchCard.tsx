// components/PatchCard.tsx
"use client";

import { PatchEntry } from "@/types";
import ChangeDeltaBar from "./ChangeDeltaBar";
import { patchTargetImage } from "@/lib/asset";

const TYPE_CLASS: Record<
    PatchEntry["changeType"],
    { chip: string; label: string }
> = {
    buff: {
        // 라이트: 짙은 초록 텍스트 / 다크: 밝은 초록 텍스트
        chip: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
        label: "버프",
    },
    nerf: {
        chip: "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30",
        label: "너프",
    },
    rework: {
        chip: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
        label: "리워크",
    },
    adjust: {
        chip: "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30",
        label: "조정",
    },
};

export default function PatchCard({ entry }: { entry: PatchEntry }) {
    const img = patchTargetImage(entry);
    const type = TYPE_CLASS[entry.changeType];

    return (
        <article className="card px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
            {/* 좌: 아이콘 + 타이틀 */}
            <div className="flex gap-3 min-w-0">
                <img
                    src={img}
                    alt={entry.targetName}
                    className="w-12 h-12 rounded-xl object-cover border border-app bg-muted flex-shrink-0"
                />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${type.chip}`}
                        >
                            {type.label}
                        </span>
                        <div className="font-semibold truncate text-app">
                            {entry.targetName}
                            <span className="text-sm text-muted-app">
                                {" "}
                                · {entry.field}
                            </span>
                        </div>
                    </div>

                    {entry.notes && (
                        <div
                            className="mt-1 text-xs text-muted-app line-clamp-2"
                            title={entry.notes}
                        >
                            {entry.notes}
                        </div>
                    )}
                </div>
            </div>

            {/* 우: 변화량(숫자 + 게이지) */}
            <div className="sm:min-w-[320px]">
                <ChangeDeltaBar
                    before={entry.before}
                    after={entry.after}
                    delta={entry.delta}
                />
            </div>
        </article>
    );
}
