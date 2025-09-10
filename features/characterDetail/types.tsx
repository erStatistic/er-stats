export type ServerCharacter = {
    id: number;
    nameKr: string;
    imageUrlMini?: string;
    imageUrlFull?: string;
};

export type MinimalR = { id: number; name: string; tier?: string | null };

export type CharacterWeaponOverview = {
    cwId: number;
    tier?: string;
    character: { id: number; name: string; imageUrl: string };
    weapon: { code: number; name: string; imageUrl: string };
    position?: { id: number; name: string };
    clusters: string[];
    overview: { summary: Summary; stats: Stats; routes: RouteInfo[] };
} | null;

export type Stats = {
    atk: number;
    def: number;
    cc: number;
    spd: number;
    sup: number;
};
export type RouteInfo = { id: number; title: string };
