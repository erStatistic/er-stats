export type WeaponStat = {
    weapon: string;
    winRate: number; // 0..1
    pickRate: number; // 0..1
    mmrGain: number; // per game avg
};

export interface CharacterSummary {
    id: number;
    name: string;
    weapon: string;
    winRate: number;
    pickRate: number;
    mmrGain: number;
    tier: string; // 캐릭터 성능 티어 (S/A/B/C)
    rankTier: string; // 게임 티어 (다이아+, 메테오라이트+ 등)
    imageUrl?: string;
}
export type SortKey =
    | "tier"
    | "name"
    | "weapon"
    | "winRate"
    | "pickRate"
    | "mmrGain";
export type SortDir = "asc" | "desc";

export type Build = {
    id: string;
    title: string;
    description: string;
    items: string[];
};
export type TeamComp = {
    id: string;
    title: string;
    members: { id: number; name: string }[];
    note?: string;
};

export type HoneyResult = {
    ids: Set<number>;
    mode: "triple" | "fallback" | "none";
    topK: number;
};
