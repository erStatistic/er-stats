export default function ClusterStat({
    label,
    value,
    bar, // 0~1
    barClass, // 예: "bg-green-500"
}: {
    label: string;
    value: string;
    bar: number;
    barClass: string;
}) {
    const width = `${Math.max(0, Math.min(1, bar)) * 100}%`;
    return (
        <div className="card px-3 py-3">
            <div className="text-[11px] sm:text-xs text-muted-app">{label}</div>
            <div className="mt-0.5 text-base sm:text-lg font-semibold text-app">
                {value}
            </div>
            <div
                className="mt-2 h-1.5 rounded-full bg-elev-10 overflow-hidden"
                aria-hidden
            >
                <div className={`h-full ${barClass}`} style={{ width }} />
            </div>
        </div>
    );
}
