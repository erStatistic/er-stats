export default function StatLine({
    label,
    value,
    size = "md",
}: {
    label: string;
    value: string;
    size?: "sm" | "md";
}) {
    const isSm = size === "sm";
    return (
        <div
            className={[
                "flex items-center justify-between rounded-xl border",
                isSm
                    ? "px-3 py-1.5 border-app/50"
                    : "px-4 py-2.5 border-app/60",
            ].join(" ")}
            title={`${label}: ${value}`}
        >
            <span
                className={[
                    "inline-flex items-center  text-muted-app",
                    isSm ? "px-2 py-0.5 text-[13px]" : "px-2.5 py-0.5 text-xs",
                ].join(" ")}
            >
                {label}
            </span>
            <span
                className={[
                    "font-semibold text-app",
                    isSm ? "text-base" : "text-lg",
                ].join(" ")}
            >
                {value}
            </span>
        </div>
    );
}
