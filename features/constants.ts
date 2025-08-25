export const PATCHES = ["v0.74", "v0.75", "v0.76"] as const;
export const GAME_TIERS = [
    "All",
    "Diamond+",
    "Meteorite+",
    "Mythril+",
    "in 1000",
] as const;
export const ROLE_ACCENT: Record<Role, string> = {
    탱커: "#8AB4F8",
    브루저: "#F59E0B",
    암살자: "#FB7185",
    원딜: "#60A5FA",
    서포터: "#34D399",
    컨트롤: "#A78BFA",
    기타: "#9CA3AF",
};
export const TIER_COLOR: Record<string, string> = {
    S: "#8A5CF6", // 보라
    A: "#00D1B2", // 민트
    B: "#3DB2FF", // 블루
    C: "#8B9FB4", // 그레이 톤(기본)
    D: "#98A6B8",
    F: "#9CA3AF",
};
