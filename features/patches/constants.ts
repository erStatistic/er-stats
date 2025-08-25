export const TABS: { value: Tab; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "official", label: "정식 패치" },
    { value: "hotfix", label: "핫픽스" },
];
export const ALL: ChangeType[] = ["buff", "nerf", "adjust", "rework"];

// 의미색 (라이트/다크 공통으로 잘 보이는 톤)
export const ACCENT: Record<ChangeType, string> = {
    buff: "#10b981", // emerald-500
    nerf: "#ef4444", // red-500
    adjust: "#38bdf8", // sky-400
    rework: "#f59e0b", // amber-500
};
export const TYPE_CHIP: Record<"buff" | "nerf" | "rework" | "adjust", string> =
    {
        buff: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
        nerf: "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30",
        rework: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
        adjust: "text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/30",
    };

export const TYPE_LABEL = (t: "buff" | "nerf" | "rework" | "adjust") =>
    t === "buff"
        ? "버프"
        : t === "nerf"
          ? "너프"
          : t === "rework"
            ? "리워크"
            : "조정";
