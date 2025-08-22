// components/VariantPill.tsx
"use client";

import { WeaponStat } from "@/types";
import { formatMMR, formatPercent } from "@/lib/stats";

export default function VariantPill({
    v,
    selected,
    onClick,
}: {
    v: WeaponStat;
    selected: boolean;
    onClick: () => void;
}) {
    const title = `${v.weapon} — WR ${formatPercent(v.winRate)} · PR ${formatPercent(
        v.pickRate,
    )} · MMR ${formatMMR(v.mmrGain, 1)}`;

    const selectedStyle: React.CSSProperties = {
        background: "color-mix(in oklab, var(--brand) 12%, transparent)",
        borderColor: "color-mix(in oklab, var(--brand) 45%, transparent)",
        color: "var(--text)",
    };

    const baseStyle: React.CSSProperties = {
        background: "var(--surface)",
        borderColor: "var(--border)",
        color: "var(--text)",
    };

    return (
        <button
            type="button"
            title={title}
            aria-pressed={selected}
            onClick={onClick}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/40"
            style={selected ? selectedStyle : baseStyle}
        >
            {v.weapon}
        </button>
    );
}
