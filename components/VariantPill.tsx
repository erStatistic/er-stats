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
    const title = `${v.weapon} — WR ${formatPercent(v.winRate)} · PR ${formatPercent(v.pickRate)} · MMR ${formatMMR(v.mmrGain, 1)}`;
    return (
        <button
            title={title}
            onClick={onClick}
            className={`rounded-full px-3 py-1 text-xs whitespace-nowrap ${selected ? "bg-white/20 border border-white/30" : "bg-[#0E1730] border border-white/10 hover:bg-white/10"}`}
        >
            {v.weapon}
        </button>
    );
}
