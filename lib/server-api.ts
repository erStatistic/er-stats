// lib/server-api.ts
type Character = {
    id: number;
    nameKr: string;
    imageUrl: string; // 빈 문자열일 수도 있으니 렌더링 전에 폴백 필요
};

// lib/server-api.ts
export type CwDirectoryHeader = {
    clusterId: number;
    label: string;
    role: string;
    counts: { cws: number; characters: number };
};
// {
//            "clusterId": 1,
//            "label": "A",
//            "role": "딜 브루저",
//            "counts": {
//                "cws": 17,
//                "characters": 14
//            }
//        },
export async function ssrGetCwDirectory(): Promise<CwDirectoryHeader[]> {
    const base = process.env.API_BASE_URL; // 예: http://localhost:3333
    if (!base) throw new Error("API_BASE_URL is not set");

    const res = await fetch(`${base}/api/v1/cws/directory`, {
        next: { revalidate: 300 }, // ISR
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`failed: ${res.status}`);
    const body = await res.json();
    const rows = (body?.data ?? body) as CwDirectoryHeader[];

    // 정규화
    return rows.map((r) => ({
        clusterId: r.clusterId,
        label: r.label,
        role: r.role,
        counts: {
            cws: Number(r.counts?.cws),
            characters: Number(r.counts?.characters),
        },
    }));
}

// lib/server-api.ts
export type Character = {
    id: number;
    nameKr: string;
    imageUrlMini: string;
    imageUrlFull: string;
};

export type CwVariant = {
    cwId: number;
    weapon: { code: number; name: string; imageUrl?: string };
    position?: { id: number; name: string };
};

/** 캐릭터가 가진 CW(= 캐릭터×무기 조합) 목록 */
export async function ssrGetCharacterCws(id: number): Promise<CwVariant[]> {
    const base = process.env.API_BASE_URL;
    const res = await fetch(`${base}/api/v1/characters/${id}/cws`, {
        // 캐릭터 상세는 자주 바뀌지 않으면 ISR로 바꿔도 됨
        next: { revalidate: 300 },
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`character cws ${id} ${res.status}`);
    const arr = j<CwVariant[]>(await res.json()) ?? [];
    return arr.map((e) => ({
        cwId: Number(e.cwId ?? e.CwID ?? e.id),
        weapon: {
            code: Number(e.weapon?.code ?? e.Weapon?.Code),
            name: String(e.weapon?.name ?? e.Weapon?.Name ?? ""),
            imageUrl:
                e.weapon?.imageUrl ?? e.Weapon?.ImageURL ?? e.Weapon?.ImageUrl,
        },
        position: e.position
            ? {
                  id: Number(e.position?.id ?? e.Position?.ID),
                  name: String(e.position?.name ?? e.Position?.Name ?? ""),
              }
            : undefined,
    }));
}

// 서버(SSR)에서만 쓰는 fetch 유틸

export type CwOverview = {
    cwId: number;
    character: { id: number; name: string; imageUrl: string };
    weapon: { code: number; name: string; imageUrl: string };
    position?: { id?: number | null; name?: string };
    summary?: {
        winRate?: number; // 0~1
        pickRate?: number; // 0~1
        mmrGain?: number; // 정수/실수
        survivalSec?: number; // 초
    };
    stats?: {
        atk: number; // 0~5
        def: number; // 0~5
        cc: number; // 0~5
        spd: number; // 0~5
        sup: number; // 0~5
    };
};
