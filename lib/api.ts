// 실제 연결 시 여기만 바꾸면 됩니다
const API = process.env.NEXT_PUBLIC_API;

export async function fetchJSON<T>(
    url: string,
    init?: RequestInit,
): Promise<T> {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// lib/api.ts
export type ClientCwEntry = {
    cwId: number;
    character: { id: number; name: string; imageUrl?: string };
    weapon: { code?: number; id?: number; name: string; imageUrl?: string };
    position?: { id: number; name: string };
};

export type ClientCwByCluster = {
    clusterId: number;
    label: string;
    entries: ClientCwEntry[];
};

export async function clientGetCwByCluster(
    clusterId: number,
): Promise<ClientCwByCluster> {
    const url = `/api/v1/cws/by-cluster/${clusterId}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`failed: ${res.status}`);

    const body = await res.json();
    const data = body?.data ?? body;

    // 서버 필드 → 프론트 정규화
    return {
        clusterId: Number(data.ClusterID ?? data.clusterId ?? clusterId),
        label: data.Label ?? data.label,
        entries: (data.Entries ?? data.entries ?? []).map((e: any) => ({
            cwId: e.CwID ?? e.cwId,
            character: {
                id: e.Character?.ID ?? e.character?.id,
                name: e.Character?.Name ?? e.character?.name,
                imageUrl: e.Character?.ImageURL ?? e.character?.imageUrl,
            },
            weapon: {
                id: e.Weapon?.ID ?? e.weapon?.id,
                code: e.Weapon?.Code ?? e.weapon?.code,
                name: e.Weapon?.Name ?? e.weapon?.name,
                imageUrl: e.Weapon?.ImageURL ?? e.weapon?.imageUrl,
            },
            position: e.Position
                ? {
                      id: e.Position?.ID ?? e.position?.id,
                      name: e.Position?.Name ?? e.position?.name,
                  }
                : undefined,
        })),
    };
}

// lib/api.ts
export type DbCharacterLite = {
    id: number;
    name: string;
    imageUrlMini?: string;
    imageUrlFull?: string;
    role?: string | null; // DB에 있으면 사용
};

export async function serverListCharacters(): Promise<DbCharacterLite[]> {
    const base = process.env.API_BASE_URL; // 예: http://localhost:3333
    if (!base) throw new Error("API_BASE_URL is not set");

    const res = await fetch(`${base}/api/v1/characters`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`list characters failed: ${res.status}`);

    const body = await res.json();
    const rows = body?.data ?? body;

    // 대→소문자 정규화
    return (rows as any[]).map((d) => ({
        id: Number(d.ID ?? d.id),
        name: d.name_kr ?? "",
        imageUrlMini: d.image_url_mini ?? "",
        imageUrlFull: d.image_url_full ?? "",
        role: d.Role ?? d.role ?? null,
    }));
}

type ServerClusterComboRow = {
    cluster_label: string; // "A · B · K"
    samples: number;
    wins: number;
    win_rate: number;
    pick_rate: number;
    avg_mmr: number;
    avg_survival: number;
};

export type ClusterTriadSummary = {
    clusters: string[]; // ["A","B","K"]
    clusterIds: number[]; // [11,16,21]
    winRate: number; // 0~1
    pickRate: number; // 0~1
    mmrGain: number;
    survivalTime?: number; // 초
    count: number;
    patch?: "All";
    tier?: "All" | string; // tiers.name
};

export async function fetchClusterCombos({
    tier = "All",
    limit = 500,
    offset = 0,
} = {}) {
    const url = new URL(`${process.env.API_BASE_URL!}/api/v1/combos/clusters`);
    if (tier !== "All") url.searchParams.set("tier", tier);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    const j = await res.json();
    const rows = (j.data ?? j) as ServerClusterComboRow[];

    return rows.map((r) => ({
        clusters: r.cluster_label.split("·").map((s) => s.trim()),
        winRate: r.win_rate,
        pickRate: r.pick_rate,
        mmrGain: r.avg_mmr,
        survivalTime: r.avg_survival,
        count: r.samples,
        patch: "All",
        tier,
    })) as ClusterTriadSummary[];
}
