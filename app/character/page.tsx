// app/character/page.tsx
import CharacterClient from "@/features/character/components/CharacterClient";
import { serverListCharacters } from "@/lib/api"; // DB 목록 호출 유틸
import type { CharacterSummary } from "@/types";
import type { Stat } from "@/features/character";

export default async function CharacterStatPage() {
    const API = process.env.API_BASE_URL;
    if (!API) throw new Error("API_BASE_URL is not set");

    // 1) 서버 통계 호출
    const res = await fetch(`${API}/api/v1/analytics/cw/stats?minSamples=50`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) {
        throw new Error(
            `Failed to fetch character stats: HTTP ${res.status} ${res.statusText}`,
        );
    }

    // 2) 응답을 Stat[]로 안전히 해석
    const json = await res.json();
    const statRows: Stat[] = Array.isArray(json?.data)
        ? (json as { data: Stat[] }).data
        : Array.isArray(json)
          ? (json as Stat[])
          : [];

    // 3) CharacterSummary[]로 변환 (CharacterClient가 기대하는 타입)
    const rows: CharacterSummary[] = statRows.map((s) => ({
        name: s.character_name_kr,
        weapon: s.weapon_name_kr,
        weapon_id: s.weapon_id,
        winRate: s.win_rate,
        pickRate: s.pick_rate,
        mmrGain: s.avg_mmr,
        tier: s.tier,
        rankTier: undefined,
        imageUrl: undefined,
        id: s.character_id,
        survivalTime: s.avg_survival, // 이미 number면 그대로
    }));

    // 4) DB 캐릭터 목록 (아이콘 격자용)
    let dbChars: Array<{
        id: number;
        nameKr?: string;
        imageUrlMini?: string;
        imageUrlFull?: string;
    }> = [];
    try {
        dbChars = await serverListCharacters();
    } catch (e) {
        console.error("[characters] list failed:", e);
    }

    return <CharacterClient initialRows={rows} dbChars={dbChars} />;
}
