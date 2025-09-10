import { GameTier } from "@/features/types";

export default function Tabs({
    value,
    onChange,
    items,
}: {
    value: GameTier;
    onChange: (v: GameTier) => void;
    items: readonly GameTier[];
}) {
    return (
        <div className="flex items-center gap-1 rounded-xl border border-app bg-muted p-1">
            {items.map((it) => {
                const active = it === value;
                return (
                    <button
                        key={it}
                        onClick={() => onChange(it)}
                        className={
                            "px-3 py-1.5 text-xs rounded-lg border transition " +
                            (active
                                ? "bg-surface border-app text-app font-medium"
                                : "bg-transparent border-transparent text-muted-app hover:bg-elev-10")
                        }
                        title={it}
                        aria-pressed={active}
                    >
                        {it}
                    </button>
                );
            })}
        </div>
    );
}
