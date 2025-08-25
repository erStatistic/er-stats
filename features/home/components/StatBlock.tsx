export default function StatBlock({
    label,
    value,
    barValue,
    barClass,
}: {
    label: string;
    value: string | number;
    barValue: number; // 0~1
    barClass: string;
}) {
    return (
        <div className="card px-3 py-3">
            <div className="text-[11px] sm:text-xs text-muted-app">{label}</div>
            <div className="mt-0.5 text-base sm:text-lg font-semibold text-app">
                {value}
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-elev-10">
                <div
                    className={`h-full ${barClass}`}
                    style={{
                        width: `${Math.max(0, Math.min(1, barValue)) * 100}%`,
                    }}
                    aria-hidden
                />
            </div>
        </div>
    );
}
