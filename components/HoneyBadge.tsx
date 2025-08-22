// components/HoneyBadge.tsx
export default function HoneyBadge({
    title = "Top 10% (Win·Pick·MMR)",
    compact = false,
    className = "",
}: {
    title?: string;
    /** true면 아이콘만 표시 (텍스트 숨김) */
    compact?: boolean;
    className?: string;
}) {
    return (
        <span
            title={title}
            aria-label={title}
            className={[
                // pill 스타일 (라이트/다크 모두 자연스럽게)
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                "text-amber-800 dark:text-amber-200",
                "border-amber-400/40",
                "bg-amber-500/10",
                className,
            ].join(" ")}
        >
            <span aria-hidden>🍯</span>
            {!compact && <span className="ml-1">HONEY</span>}
        </span>
    );
}
