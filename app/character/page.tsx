// app/character/page.tsx
import CharacterClient from "@/features/character/components/CharacterClient";
import { makeMock } from "@/lib/mock";
import { mulberry32 } from "@/lib/rng";
import { serverListCharacters } from "@/lib/api"; // DB 목록 호출 유틸

export default async function CharacterStatPage() {
    // ✅ mock → 실제 DB 통계 (이름 포함 응답 사용)
    const API = process.env.API_BASE_URL;

    const stats = await fetch(
        `${API}/api/v1/analytics/cw/stats?minSamples=50`,
        { cache: "no-store", headers: { accept: "application/json" } },
    )
        .then((r) => r.json())
        .then((j) => j.data ?? j);

    const rows = (stats as any[]).map((s: any) => ({
        tier:
            s.win_rate >= 0.58
                ? "A"
                : s.win_rate >= 0.52
                  ? "B"
                  : s.win_rate >= 0.48
                    ? "C"
                    : "D",
        characterId: s.character_id,
        weaponId: s.weapon_id,
        name: s.character_name_kr,
        weapon: s.weapon_name_kr,
        winRate: s.win_rate,
        pickRate: s.pick_rate,
        mmrGain: s.avg_mmr, // ← gained_mmr 평균
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
        console.log("dbChars");
    } catch (e) {
        console.error("[characters] list failed:", e);
    }

    return <CharacterClient initialRows={rows} dbChars={dbChars} />;
}
