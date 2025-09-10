// types.ts — 중복 제거 + 직렬화 안전 + 평균 생존시간 필드 추가

// 1) 캐릭터/무기 통계
export type WeaponStat = {
    weapon: string;
    winRate: number; // 0..1
    pickRate: number; // 0..1
    mmrGain: number; // per game avg
};

export type ApiResponse = {
    code: number;
    msg: string;
    data?: any;
};

export type SortKey =
    | "tier"
    | "name"
    | "weapon"
    | "winRate"
    | "pickRate"
    | "mmrGain"
    | "survivalTime"; // ✅ 추가

export interface CharacterSummary {
    id: number;
    name: string;
    weapon: string;
    weapon_id: number;
    winRate: number;
    pickRate: number;
    mmrGain: number;
    tier: string;
    rankTier?: string;
    imageUrl?: string;

    /** ✅ 게임당 평균 생존시간(초 또는 "mm:ss"/"hh:mm:ss") */
    survivalTime?: number | string;
}

// 2) 빌드/팀 조합
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

// 3) 허니 배지 판정 결과
export type HoneyResult = {
    // ⚠️ Next.js 직렬화 이슈 방지를 위해 Set -> number[] 로 변경
    ids: number[];
    mode: "triple" | "fallback" | "none";
    topK: number;
};

// 4) 조합 요약/클러스터
export type CompSummary = {
    comp: number[]; // 캐릭터 id 배열 [1,2,3]
    winRate: number; // 0..1
    pickRate: number; // 0..1
    mmrGain: number; // per game
    count: number;
};

export type ClusterLabel = string; // 'A' | 'B' | ... 'U'

export type ClusterTriadSummary = {
    clusters: [ClusterLabel, ClusterLabel, ClusterLabel];
    winRate: number; // 0..1
    pickRate: number; // 0..1
    mmrGain: number; // per game
    survivalTime?: number; // ✅ 평균 생존시간(초). 없으면 표시 시 "—"
    count: number;
    patch?: string;
    tier?: string;
};

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

// 5) 유저/추천
export type UserProfile = {
    name: string;
    topChars: { id: number; name: string; imageUrl?: string }[]; // 최근 n게임 기준 Top3
};

export type CompSuggestion = {
    comp: number[]; // [a,b,c] 캐릭터 id
    winRateEst: number; // 0..1 모델 추정
    pickRateEst: number; // 0..1
    mmrGainEst: number; // per-game 추정
    support: {
        fromPairs: number; // pair 시너지 가중치
        fromSolo: number; // solo 강도 가중치
        fromCluster: number; // cluster 조합 가중치
        modeled: boolean; // 관측 부족/모델 보정 여부
    };
    note?: string;
};

// 6) 패치 노트
export type PatchKind = "official" | "hotfix"; // 정식/핫픽스
export type ChangeType = "buff" | "nerf" | "adjust" | "rework";

export type PatchEntry = {
    id: string;
    targetType: "character" | "weapon" | "system";
    targetId?: number;
    targetName: string; // 예: "나딘", "활", "야생동물"
    changeType: ChangeType; // buff/nerf/adjust/rework
    field: string; // 예: "Q 피해량", "패시브", "이속"
    before?: string | number;
    after?: string | number;
    delta?: string; // 예: "+10%", "-20(고정)"
    notes?: string; // 상세 설명
};

export type PatchNote = {
    id: string; // "v0.76-official", "v0.76.1-hotfix"
    version: string; // "v0.76", "v0.76.1"
    kind: PatchKind; // official/hotfix
    date: string; // "2025-08-12"
    title?: string; // "밸런스 패치 0.76"
    entries: PatchEntry[];
};
