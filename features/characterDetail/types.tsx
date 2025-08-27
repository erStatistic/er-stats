export type ServerCharacter = {
    id: number;
    nameKr: string;
    nameEn?: string;
    imageUrl: string;
};

// features/characterDetail/types.ts
export type VariantItem = {
    cwId: number;
    weapon: string;
    weaponCode?: number;
    weaponImageUrl?: string;
};

export type OverviewBox = {
    summary?: {
        winRate?: number;
        pickRate?: number;
        mmrGain?: number;
        survivalSec?: number;
    };
    stats?: { atk: number; def: number; cc: number; spd: number; sup: number };
};

export type ClusterLite = {
    id?: number;
    label?: string; // 예: "A", "B" ...
    role?: string; // 예: "딜 브루저"
};

export type CwOverview =
    | (OverviewBox & {
          cwId: number;
          character: { id: number; name: string; imageUrl: string };
          weapon: { code: number; name: string; imageUrl: string };
          position?: { id?: number | null; name?: string };
          cluster?: ClusterLite; // ✅ 추가
      })
    | {
          cwId: number;
          character: { id: number; name: string; imageUrl: string };
          weapon: { code: number; name: string; imageUrl: string };
          position?: { id?: number | null; name?: string };
          overview: OverviewBox;
          cluster?: ClusterLite; // ✅ 추가
      };
