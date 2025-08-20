export default function HoneyBadge({
    title = "Top 10% (Win·Pick·MMR)",
}: {
    title?: string;
}) {
    return (
        <span title={title} aria-label={title} className="ml-1 select-none">
            🍯
        </span>
    );
}
