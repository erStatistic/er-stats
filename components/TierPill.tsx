export default function TierPill({ tier }: { tier: string }) {
    const color =
        tier === "S"
            ? "#8A5CF6"
            : tier === "A"
              ? "#00D1B2"
              : tier === "B"
                ? "#3DB2FF"
                : "#8B9FB4";
    return (
        <span
            className="rounded-full border px-2 py-0.5 text-xs font-bold"
            style={{
                color,
                borderColor: `${color}66`,
                backgroundColor: `${color}22`,
            }}
        >
            {tier}
        </span>
    );
}
