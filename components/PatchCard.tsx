"use client";

import { PatchEntry } from "@/types";
import ChangeDeltaBar from "./ChangeDeltaBar";
import { patchTargetImage } from "@/lib/asset";

export default function PatchCard({ entry }: { entry: PatchEntry }) {
    const color =
        entry.changeType === "buff"
            ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
            : entry.changeType === "nerf"
              ? "text-rose-300 bg-rose-500/10 border-rose-500/30"
              : entry.changeType === "rework"
                ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                : "text-sky-300 bg-sky-500/10 border-sky-500/30";

    const img = patchTargetImage(entry);

    return (
        <article className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-between">
            {/* 좌: 아이콘 + 타이틀 */}
            <div className="flex gap-3 min-w-0">
                <img
                    src={img}
                    alt={entry.targetName}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                />
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border ${color}`}
                        >
                            {labelByType(entry.changeType)}
                        </span>
                        <div className="font-semibold truncate">
                            {entry.targetName}
                            <span className="text-white/60 text-sm">
                                {" "}
                                · {entry.field}
                            </span>
                        </div>
                    </div>
                    {entry.notes && (
                        <div
                            className="mt-1 text-xs text-white/70 line-clamp-2"
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

function labelByType(t: PatchEntry["changeType"]) {
    return t === "buff"
        ? "버프"
        : t === "nerf"
          ? "너프"
          : t === "rework"
            ? "리워크"
            : "조정";
}
