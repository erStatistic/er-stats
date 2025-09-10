// app/character/page.tsx
import CharacterClient from "@/features/character/components/CharacterClient";
import { serverListCharacters } from "@/lib/api"; // DB 목록 호출 유틸
import { CharacterSummary } from "@/types"; // ✅ 빠진 타입 import 추가

export default async function CharacterStatPage() {
    const API = process.env.API_BASE_URL;
    if (!API) throw new Error("API_BASE_URL is not set");

    const stats = await fetch(
        `${API}/api/v1/analytics/cw/stats?minSamples=50`,
        {
            cache: "no-store",
            headers: { accept: "application/json" },
        },
    )
        .then((r) => r.json())
        .then((j) => j.data ?? j);

    // API 응답(CharacterSummary) -> UI 테이블 행으로 매핑
    const rows = (stats as CharacterSummary[]).map((s: any) => ({
        tier: s.tier,
        id: s.character_id, // UI에서 사용하는 필드명으로 통일
        weapon_id: s.weapon_id,
        name: s.character_name_kr,
        weapon: s.weapon_name_kr,
        winRate: s.win_rate,
        pickRate: s.pick_rate,
        mmrGain: s.avg_mmr,
        survivalTime: s.avg_survival ?? undefined,
    }));

    // DB 캐릭터 목록 (아이콘 격자용)
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
