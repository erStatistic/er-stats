import { CharacterSummary, CompSummary } from "@/types";

export async function fetchJSON<T>(
    url: string,
    init?: RequestInit,
): Promise<T> {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function getCharacter(
    id: number,
): Promise<ServerCharacter | null> {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<any>(`${base}/api/v1/characters/${id}`);
    if (j?.code === 404 || !j?.data) return null;
    const d = j.data;
    return {
        id: d.ID ?? d.id,
        nameKr: d.name_kr ?? "이름 없음",
        imageUrlMini: (d.image_url_mini ?? "").trim(),
        imageUrlFull: (d.image_url_full ?? "").trim(),
    };
}

export async function fetchTopCharacters(
    count = 5,
): Promise<CharacterSummary[]> {
    try {
        const base = process.env.API_BASE_URL ?? "";
        const url = (base ? `${base}` : "") + `/api/v1/analytics/cw/top5`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const rows = (json?.data as any[]) ?? [];
        const top = rows.slice(0, count);

        const ids = Array.from(new Set<number>(top.map((r) => r.character_id)));

        const characters = await Promise.all(
            ids.map(async (id) => {
                try {
                    return await getCharacter(id);
                } catch {
                    return null;
                }
            }),
        );

        const imgMap = new Map<number, string>();
        for (const c of characters) {
            if (!c) continue;
            imgMap.set(c.id, c.imageUrlMini || "");
        }

        return top.map((r) => ({
            id: r.character_id,
            name: r.character_name_kr,
            weapon: r.weapon_name_kr,
            weapon_id: r.weapon_id,
            winRate: r.win_rate, // 0~1
            pickRate: r.pick_rate, // 0~1
            mmrGain: r.avg_mmr,
            tier: r.tier,
            imageUrl: imgMap.get(r.character_id) ?? "",
        }));
    } catch (e) {
        console.error("fetchTopCharacters failed:", e);
        return [];
    }
}

// types.ts 혹은 이 파일 상단에 함께 배치
export type CompSummaryMember = {
    id: number; // cw_id
    characterId: number; // character_id
    name: string; // character_name_kr
    image?: string | null; // image_url_mini
    weaponName?: string; // weapon_name_kr
    weaponImage?: string | null; // weapon_image_url
};

export type CompSummary = {
    comp: number[]; // cw_id 배열
    winRate: number; // 0~1
    pickRate: number; // 0~1
    mmrGain: number; // 카드 게이지용. avg_mmr(팀 평균 MMR)를 1000으로 나눠 k 단위로 표기
    count: number; // 표본 수
    members?: CompSummaryMember[]; // 카드에 멤버 아바타/이름을 쓰고 싶을 때
};

// ---- API 응답 타입
type PopularCompsApiRow = {
    comp_key: number[];
    samples: number;
    wins: number;
    win_rate: number;
    pick_rate: number;
    avg_mmr: number; // 팀 평균 MMR (예: 7584.6)
    avg_survival: number;
    s_score: number;
    members: Array<{
        cw_id: number;
        weapon_id: number;
        character_id: number;
        weapon_name_kr: string;
        character_name_kr: string;
        image_url_mini?: string | null;
        weapon_image_url?: string | null;
    }>;
};

type PopularCompsApiResp = {
    code: number;
    msg: string;
    data: PopularCompsApiRow[];
};

// ---- 실제 데이터 호출 버전 ----
export async function fetchPopularComps(
    count = 5,
    opts?: {
        start?: string; // ISO (옵션)
        end?: string; // ISO (옵션)
        tier?: string; // 예: "Gold" (옵션)
        minSamples?: number; // 기본값 서버 설정 사용
    },
): Promise<CompSummary[]> {
    const base =
        process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";

    const url = new URL(`${base}/api/v1/analytics/popular-comps`);
    url.searchParams.set("limit", String(count));
    if (opts?.start) url.searchParams.set("start", opts.start);
    if (opts?.end) url.searchParams.set("end", opts.end);
    if (opts?.tier) url.searchParams.set("tier", opts.tier);
    if (opts?.minSamples != null)
        url.searchParams.set("minSamples", String(opts.minSamples));

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) {
        throw new Error(`popular-comps HTTP ${res.status}`);
    }

    const json: PopularCompsApiResp = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];

    // API → UI 타입 매핑
    return rows.map((row) => ({
        comp: row.comp_key,
        winRate: row.win_rate,
        pickRate: row.pick_rate,
        // 카드에 7.2처럼 보이게 하려면 k 단위로 변환(7,200 → 7.2)
        // 그냥 원시 MMR(7,5xx)을 쓰고 싶다면 /1000 제거
        mmrGain: row.avg_mmr,
        count: row.samples,
        members: row.members?.map((m) => ({
            id: m.cw_id,
            characterId: m.character_id,
            name: m.character_name_kr,
            image: m.image_url_mini ?? undefined,
            weaponName: m.weapon_name_kr,
            weaponImage: m.weapon_image_url ?? undefined,
        })),
    }));
}
