// components/PatchFilters.tsx
"use client";

import { ChangeType } from "@/types";
import { ALL, ACCENT } from "@/features/patches";

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
    const Chip = ({ t }: { t: ChangeType }) => {
        const active = selectedTypes.includes(t);
        const color = ACCENT[t];

        return (
            <button
                type="button"
                aria-pressed={active}
                onClick={() => onToggleType(t)}
                className="text-xs rounded-full px-3 py-1 border transition-colors"
                style={{
                    borderColor: active ? `${color}66` : "var(--border)",
                    background: active ? `${color}1a` : "var(--surface)",
                    color: active ? color : "var(--text)",
                }}
            >
                {t === "buff"
                    ? "버프"
                    : t === "nerf"
                      ? "너프"
                      : t === "rework"
                        ? "리워크"
                        : "조정"}
            </button>
        );
    };

    return (
        <div className="card p-3 flex flex-wrap items-center gap-2">
            {/* 검색 입력 */}
            <input
                className="rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                }}
                placeholder="실험체/무기/설명 검색"
                value={q}
                onChange={(e) => onChangeQ(e.target.value)}
            />

            {/* 타입 칩들 */}
            <div className="flex items-center gap-2">
                {ALL.map((t) => (
                    <Chip key={t} t={t} />
                ))}
            </div>
        </div>
    );
}
