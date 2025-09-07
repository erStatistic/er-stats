import { PatchNote, CharacterSummary, CompSummary } from "@/types";
import { mulberry32 } from "@/lib/rng";

// ---------- MOCK HELPERS (SSR에서만 호출: 시드 고정으로 Hydration 안전) ----------
const CHAR_NAMES = Array.from({ length: 36 }).map((_, i) => `실험체 ${i + 1}`);
const CHAR_IMG = (id: number) => `/chars/${((id - 1) % 9) + 1}.png`;

export async function fetchLatestPatch(): Promise<PatchNote> {
    const rng = mulberry32(777); // 고정 시드
    // 가장 최신 패치 1건 (간단 버전)
    return {
        id: "patch-0.76.1",
        kind: "official",
        version: "v0.76.1",
        title: "정식 패치",
        date: "2025-08-21",
        entries: [
            {
                id: "e-1",
                targetType: "character",
                targetId: 3,
                targetName: CHAR_NAMES[2],
                field: "기본 공격 피해량",
                before: "50",
                after: "54",
                delta: "+4",
                changeType: "buff",
                notes: "초중반 견제 강화",
            },
            {
                id: "e-2",
                targetType: "character",
                targetId: 11,
                targetName: CHAR_NAMES[10],
                field: "궁극기 쿨다운",
                before: "80s",
                after: "90s",
                delta: "+10s",
                changeType: "nerf",
                notes: "후반 캐리 억제",
            },
        ],
    };
}

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

        const res = await fetch(url, { cache: "no-store" });
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

export async function fetchPopularComps(count = 3): Promise<CompSummary[]> {
    const rng = mulberry32(13579);
    const comps: CompSummary[] = [];
    for (let i = 0; i < count; i++) {
        const base = 1 + i * 3;
        comps.push({
            comp: [base, base + 1, base + 2],
            winRate: 0.5 + rng() * 0.15,
            pickRate: 0.06 + rng() * 0.12,
            mmrGain: 7 + rng() * 6,
            count: 50 + Math.floor(rng() * 200),
        });
    }
    return comps;
}
