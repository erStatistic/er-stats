// app/characters/[id]/page.tsx  (서버)
import CharacterDetailClient from "@/components/CharacterDetailClient";
import { makeMock, getVariants, mockBuildsFor, mockTeamsFor } from "@/lib/mock";
import { mulberry32 } from "@/lib/rng";

export default async function CharacterDetailPage({
    params,
}: {
    // ✅ params가 Promise일 수 있으므로 Promise 타입으로 받고
    //    아래에서 await로 구조분해합니다.
    params: Promise<{ id: string }>;
}) {
    const { id } = await params; // ✅ 여기서 await
    const numId = Number(id);

    const rng = mulberry32(12345); // 같은 시드
    const rows = makeMock(36, rng); // 서버에서 한 번 생성
    const r = rows.find((x) => x.id === numId);
    if (!r) return <div className="p-6">존재하지 않는 실험체</div>;

    const variants = getVariants(numId, {
        weapon: r.weapon,
        winRate: r.winRate,
        pickRate: r.pickRate,
        mmrGain: r.mmrGain,
    });
    const currentWeapon = variants[0]?.weapon;
    const builds = mockBuildsFor(numId, currentWeapon);
    const teams = mockTeamsFor(numId, currentWeapon);

    return (
        <CharacterDetailClient
            initial={{ r, variants, currentWeapon, builds, teams }}
        />
    );
}
