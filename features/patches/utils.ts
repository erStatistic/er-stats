export function deltaTone(
    delta: string,
    t: "buff" | "nerf" | "rework" | "adjust",
) {
    const s = delta.trim();
    const pos = s.startsWith("+");
    const neg = s.startsWith("-");

    // 타입 우선
    if (t === "buff")
        return "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10";
    if (t === "nerf")
        return "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10";

    // 조정/리워크는 delta 부호로 색 보조
    if (pos)
        return "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10";
    if (neg)
        return "border-rose-500/30 text-rose-700 dark:text-rose-300 bg-rose-500/10";

    return "border-app text-muted-app bg-muted";
}

export function arrow(delta: string, t: "buff" | "nerf" | "rework" | "adjust") {
    const s = delta.trim();
    if (s.startsWith("+")) return t === "nerf" ? "▼" : "▲";
    if (s.startsWith("-")) return t === "buff" ? "▲" : "▼";
    return "—";
}
