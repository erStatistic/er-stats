export default function StatBox({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-app bg-muted p-3">
            <div className="text-muted-app">{label}</div>
            <div className="text-app font-medium">{value}</div>
        </div>
    );
}
