// app/character/page.tsx
import CharacterClient from "@/features/character/components/CharacterClient";
import { makeMock } from "@/lib/mock";
import { mulberry32 } from "@/lib/rng";
import { serverListCharacters } from "@/lib/api"; // DB 목록 호출 유틸

export default async function CharacterStatPage() {
    // 표/통계는 기존 mock 유지
    const rng = mulberry32(12345);
    const rows = makeMock(36, rng);

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
