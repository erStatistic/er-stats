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

export async function fetchTopCharacters(
    count = 5,
): Promise<CharacterSummary[]> {
    const rng = mulberry32(20250821);
    const rows: CharacterSummary[] = [];
    for (let i = 0; i < count; i++) {
        const id = i + 1;
        const win = 0.45 + rng() * 0.15; // 45~60%
        const pick = 0.02 + rng() * 0.1; // 2~12%
        const mmr = 5 + rng() * 10; // 5~15
        rows.push({
            id,
            name: CHAR_NAMES[id - 1],
            weapon: ["Axe", "Pistol", "Bow", "Rapier", "Spear"][i % 5],
            winRate: win,
            pickRate: pick,
            mmrGain: mmr,
            tier: ["S", "A", "A", "B", "S"][i % 5],
            imageUrl: CHAR_IMG(id),
            // (선택) 랭크 티어가 있다면: rankTier: "Diamond+"
        } as any);
    }
    return rows;
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
