/** 지표용 작은 카드 */
export default function KpiCard({
    label,
    value,
    sub,
}: {
    label: string;
    value: string | number;
    sub?: string; // 필요 없으면 생략
}) {
    return (
        <div
            className="rounded-xl border bg-surface p-3 flex flex-col justify-center"
            style={{ borderColor: "var(--border)" }}
        >
            <div className="text-xs font-semibold text-muted-app mb-1">
                {label}
            </div>
            <div className="text-2xl font-semibold text-app leading-tight">
                {value}
            </div>
            {sub ? (
                <div className="text-[11px] text-muted-app mt-0.5">{sub}</div>
            ) : null}
        </div>
    );
}
