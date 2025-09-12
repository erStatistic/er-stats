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

export async function ssrGetCwDirectory(): Promise<CwDirectoryHeader[]> {
    const base = process.env.API_BASE_URL; // 예: http://localhost:3333
    if (!base) throw new Error("API_BASE_URL is not set");

    const res = await fetch(`${base}/api/v1/cws/directory`, {
        next: { revalidate: 300 }, // ISR
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`failed: ${res.status}`);
    const body = await res.json();
    const rows = (body?.data ?? body) as any[];

    // 정규화
    return rows.map((r) => ({
        clusterId: r.ClusterID ?? r.clusterId ?? r.id,
        label: r.Label ?? r.label,
        role: r.Role ?? r.role ?? "기타",
        counts: {
            cws: Number(r.counts?.Cws ?? r.counts?.cws ?? r.cws ?? 0),
            characters: Number(
                r.counts?.characters ??
                    r.counts?.characters ??
                    r.characters ??
                    0,
            ),
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

export type CwOverview = {
    cwId: number;
    character: { id: number; name: string; imageUrl?: string };
    weapon: { code: number; name: string; imageUrl?: string };
    position: { id: number; name: string };
    overview: {
        summary: {
            games: number;
            pickRate: number;
            winRate: number;
            avgMmrDelta: number;
        };
        builds: any[];
        teams: any[];
    };
};

function j<T>(x: any): T {
    return x?.data ?? x;
}

/** 캐릭터 단건 */
export async function ssrGetCharacter(id: number): Promise<Character | null> {
    const base = process.env.API_BASE_URL;
    const res = await fetch(`${base}/api/v1/characters/${id}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`character ${id} ${res.status}`);
    const body = j<any>(await res.json());
    return {
        id: Number(body.ID ?? body.id),
        nameKr: body.NameKr ?? body.nameKr ?? "",
        imageUrlMini: (body.ImageUrlMini ?? body.imageUrlMini ?? "").trim(),
        imageUrlFull: (body.ImageUrlFull ?? body.imageUrlFull ?? "").trim(),
    };
}

/** 캐릭터가 가진 CW(= 캐릭터×무기 조합) 목록 */
export async function ssrGetCharacterCws(id: number): Promise<CwVariant[]> {
    const base = process.env.API_BASE_URL;
    const res = await fetch(`${base}/api/v1/characters/${id}/cws`, {
        // 캐릭터 상세는 자주 바뀌지 않으면 ISR로 바꿔도 됨
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`character cws ${id} ${res.status}`);
    const arr = j<any[]>(await res.json()) ?? [];
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

// 숫자 변환 유틸(문자/undefined 방어)
const toNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
};

export async function ssrGetCwOverview(cwId: number): Promise<CwOverview> {
    const base = process.env.NEXT_PUBLIC_API_BASE;
    const res = await fetch(`/api/v1/cws/${cwId}/overview`, {
        // 개별 요청마다 최신값 원하면 no-store, 아니라면 revalidate 옵션 사용
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`overview failed: ${res.status}`);

    const body = await res.json();
    const d = body?.data ?? body;

    // 다양한 케이스 대비한 느슨한 맵핑
    const character = d.character ?? d.Character ?? {};
    const weapon = d.weapon ?? d.Weapon ?? {};
    const position = d.position ?? d.Position ?? undefined;
    const summary = d.summary ?? d.Summary ?? undefined;
    const stats = d.stats ?? d.Stats ?? undefined;

    return {
        cwId: Number(d.cwId ?? d.CwID ?? d.cw_id ?? cwId),
        character: {
            id: Number(character.id ?? character.ID),
            name: String(character.name ?? character.Name ?? ""),
            imageUrl: String(character.imageUrl ?? character.ImageURL ?? ""),
        },
        weapon: {
            code: Number(weapon.code ?? weapon.Code),
            name: String(weapon.name ?? weapon.Name ?? ""),
            imageUrl: String(weapon.imageUrl ?? weapon.ImageURL ?? ""),
        },
        position: position
            ? {
                  id:
                      position.id ??
                      position.ID ??
                      (position.p_id != null ? Number(position.p_id) : null),
                  name: String(
                      position.name ?? position.Name ?? position.p_name ?? "",
                  ),
              }
            : undefined,
        summary: summary
            ? {
                  winRate: toNum((summary.winRate ?? summary.win_rate) as any),
                  pickRate: toNum(
                      (summary.pickRate ?? summary.pick_rate) as any,
                  ),
                  mmrGain: toNum((summary.mmrGain ?? summary.mmr_gain) as any),
                  survivalSec: toNum(
                      (summary.survivalSec ?? summary.avg_survival_sec) as any,
                  ),
              }
            : undefined,
        stats: stats
            ? {
                  atk: Number(stats.atk ?? stats.ATK ?? 0),
                  def: Number(stats.def ?? stats.DEF ?? 0),
                  cc: Number(stats.cc ?? stats.CC ?? 0),
                  spd: Number(stats.spd ?? stats.SPD ?? 0),
                  sup: Number(stats.sup ?? stats.SUP ?? 0),
              }
            : undefined,
    };
}
