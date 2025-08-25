export default function RoleTab({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                active
                    ? "bg-[var(--brand)] text-white border-transparent"
                    : "bg-surface text-app border-app hover:bg-elev-5"
            }`}
            aria-pressed={active}
        >
            {label}
        </button>
    );
}
