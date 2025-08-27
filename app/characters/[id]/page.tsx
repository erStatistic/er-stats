// app/characters/[id]/page.tsx
import { notFound } from "next/navigation";
import CharacterDetailClient from "@/features/characterDetail/components/CharacterDetailClient";
import { mockBuildsFor, mockTeamsFor } from "@/lib/mock";

// 캐시 끄고, 쿼리 변경마다 강제 동적 렌더
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ServerCharacter = {
    id: number;
    nameKr: string;
    imageUrlMini?: string;
    imageUrlFull?: string;
};

type VariantItem = {
    cwId: number;
    weapon: string;
    weaponCode?: number;
    weaponImageUrl?: string;
};

async function fetchJSON<T>(url: string) {
    const res = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
}

async function getCharacter(id: number): Promise<ServerCharacter | null> {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<any>(`${base}/api/v1/characters/${id}`);
    if (j?.code === 404 || !j?.data) return null;
    const d = j.data;
    return {
        id: d.ID ?? d.id,
        nameKr: d.NameKr ?? d.nameKr ?? d.Name ?? d.name ?? "이름 없음",
        imageUrlMini: (d.ImageUrlMini ?? d.imageUrlMini ?? "").trim(),
        imageUrlFull: (d.ImageUrlFull ?? d.imageUrlFull ?? "").trim(),
    };
}

async function getCharacterCws(characterId: number): Promise<VariantItem[]> {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<any>(
        `${base}/api/v1/characters/${characterId}/cws`,
    );
    const rows = (j?.data ?? j ?? []) as any[];
    return rows.map((r) => ({
        cwId: Number(r.cwId ?? r.CwID ?? r.id),
        weapon:
            r.weapon?.name ??
            r.Weapon?.NameKr ??
            r.Weapon?.name ??
            r.weaponName ??
            "",
        weaponCode: r.weapon?.code ?? r.Weapon?.Code ?? r.weaponCode,
        weaponImageUrl:
            r.weapon?.imageUrl ?? r.Weapon?.ImageURL ?? r.weaponImageUrl,
    }));
}

async function getCwOverview(cwId: number) {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<any>(`${base}/api/v1/cws/${cwId}/overview`);
    // 그대로 넘기면 Client에서 {overview: {summary, stats}} 구조를 파싱함
    return j?.data ?? null;
}

export default async function Page({
    params,
    searchParams,
}: {
    params: { id: string };
    searchParams: { wc?: string };
}) {
    const base = process.env.API_BASE_URL;
    if (!base) throw new Error("API_BASE_URL is not set");

    const charId = Number(params.id);
    if (!Number.isFinite(charId)) notFound();

    const character = await getCharacter(charId);
    if (!character) notFound();

    const variants = await getCharacterCws(charId);
    if (!variants || variants.length === 0) {
        // 조합이 없으면 상세 자체가 의미 없으니 404
        notFound();
    }

    // pill 정렬: weaponCode(weaponId) 오름차순 → cwId → 이름
    const sorted = [...variants].sort((a, b) => {
        const ac = a.weaponCode ?? Number.POSITIVE_INFINITY;
        const bc = b.weaponCode ?? Number.POSITIVE_INFINITY;
        if (ac !== bc) return ac - bc;
        if (a.cwId !== b.cwId) return a.cwId - b.cwId;
        return (a.weapon || "").localeCompare(b.weapon || "");
        // 서버가 이미 정렬해줘도 클라에서 한 번 더 정렬해 안정성 확보
    });

    // 선택 규칙:
    // 1) ?wc= 지정되면 해당 cwId
    // 2) 없으면 weaponCode 가장 작은 것
    // 3) 그마저 없으면 이름 오름차순 첫 번째
    const wc = searchParams.wc ? Number(searchParams.wc) : undefined;
    let selected = wc ? sorted.find((v) => v.cwId === wc) : undefined;
    if (!selected) {
        selected =
            sorted.find((v) => Number.isFinite(v.weaponCode)) ?? sorted[0];
    }

    const currentWeapon = selected?.weapon ?? sorted[0].weapon;
    const overview = selected ? await getCwOverview(selected.cwId) : null;

    // Client가 tier만 쓰므로 최소 구조로 전달
    const rMinimal = {
        id: character.id,
        name: character.nameKr,
        tier: "A",
    } as any;

    // 초기 빌드/팀은 현재 선택 무기로 생성 (mock 유지)
    const builds = mockBuildsFor(character.id, currentWeapon);
    const teams = mockTeamsFor(character.id, currentWeapon);

    return (
        <CharacterDetailClient
            initial={{
                r: rMinimal,
                variants: sorted, // Client가 다시 정렬하지만 여기서도 정렬된 걸 전달
                currentWeapon,
                builds,
                teams,
                character,
                overview, // ← { cwId, character, weapon, position, overview:{summary,stats} }
            }}
        />
    );
}
