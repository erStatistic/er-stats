export const PATCHES = ["v0.74", "v0.75", "v0.76"] as const;
export const GAME_TIERS = [
    "All",
    "Diamond+",
    "Meteorite+",
    "Mythril+",
    "in 1000",
] as const;
export type Role =
    | "탱커"
    | "탱 브루저"
    | "딜 브루저"
    | "암살자"
    | "평원딜"
    | "스증 마법사"
    | "서포터"
    | "컨트롤"
    | "기타";

export const ROLE_ACCENT: Record<Role, string> = {
    탱커: "#8AB4F8",
    "탱 브루저": "#F59E0B",
    "딜 브루저": "#F59E0B",
    암살자: "#FB7185",
    평원딜: "#60A5FA",
    "스증 마법사": "#A78BFA",
    서포터: "#34D399",
    컨트롤: "#94A3B8",
    기타: "#9CA3AF",
} as const;
export const TIER_COLOR: Record<string, string> = {
    S: "#8A5CF6", // 보라
    A: "#00D1B2", // 민트
    B: "#3DB2FF", // 블루
    C: "#8B9FB4", // 그레이 톤(기본)
    D: "#98A6B8",
    F: "#9CA3AF",
};
