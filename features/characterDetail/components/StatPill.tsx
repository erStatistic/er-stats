export default function StatPill({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full border border-app bg-surface px-2.5 py-1 text-xs"
            title={`${label}: ${value}`}
        >
            <span className="text-muted-app">{label}</span>
            <strong className="text-app">{value}</strong>
        </span>
    );
}
