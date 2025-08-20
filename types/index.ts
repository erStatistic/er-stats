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
export type CompSummary = {
    comp: number[]; // 캐릭터 id 배열 [1,2,3]
    winRate: number;
    pickRate: number;
    mmrGain: number;
    count: number;
};
export type ClusterLabel = string; // 'A' | 'B' ... 문자 라벨

export type ClusterTriadSummary = {
    clusters: [ClusterLabel, ClusterLabel, ClusterLabel]; // 예: ['탱커','브루저','원딜'] 대신 지금은 문자 라벨
    winRate: number; // 0..1
    pickRate: number; // 0..1
    mmrGain: number; // per game
    count: number; // 표본 수
    patch?: string;
    tier?: string;
};

// (기존) 캐릭터 타입은 그대로 두되, 이번 페이지에선 사용 안 함
export type CharacterSummary = {
    id: number;
    name: string;
    imageUrl?: string;
    rankTier?: string;
};

export type ClusterLabel = string; // 'A' | 'B' | ... 'U'
export type Role =
    | "탱커"
    | "브루저"
    | "암살자"
    | "원딜"
    | "서포터"
    | "컨트롤"
    | "기타";

export type CharacterBrief = {
    id: number;
    name: string;
    imageUrl?: string;
};

export type ClusterMeta = {
    label: ClusterLabel; // e.g. 'A'
    role: Role; // e.g. '탱커'
    characters: CharacterBrief[];
    note?: string; // 선택: 설명/특징
};
