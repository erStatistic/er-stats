// app/characters/[id]/page.tsx
import { notFound } from "next/navigation";
import CharacterDetailClient from "@/features/characterDetail/components/CharacterDetailClient";
import { mockBuildsFor, mockTeamsFor } from "@/lib/mock";

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

/** 서버 응답 -> 클라가 쓰기 편한 형태로 변환 */
async function getCwOverview(cwId: number) {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<any>(`${base}/api/v1/cws/${cwId}/overview`);
    const d = j?.data;
    if (!d) return null;

    // cluster 단수 → clusters 복수배열로 표준화
    const clusters: string[] = d.cluster?.name ? [String(d.cluster.name)] : [];

    return {
        cwId: d.cwId,
        character: {
            id: d.character?.id,
            name: d.character?.name,
            imageUrl: d.character?.imageUrl ?? "",
        },
        weapon: {
            code: d.weapon?.code,
            name: d.weapon?.name,
            imageUrl: d.weapon?.imageUrl ?? "",
        },
        position: d.position
            ? { id: d.position.id, name: d.position.name }
            : undefined,

        // ✅ 클러스터를 최상위에 두고,
        clusters,

        // ✅ 요약/스탯은 기존 구조 유지(클라가 overview.overview.summary 로 읽음)
        overview: {
            summary: d.overview?.summary ?? null,
            stats: d.overview?.stats ?? null,
            // (선택) 이 안에도 넣어두면 클라 후보 탐색 로직과 100% 호환
            // clusters,
        },
    };
}

// ✅ Next 최신: params/searchParams 는 Promise
type Params = { id: string };
type Query = { wc?: string | string[] };

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<Params>;
    searchParams: Promise<Query>;
}) {
    const base = process.env.API_BASE_URL;
    if (!base) throw new Error("API_BASE_URL is not set");

    const { id } = await params;
    const qs = await searchParams;

    const wcRaw = qs.wc;
    const wc =
        wcRaw != null
            ? Number(Array.isArray(wcRaw) ? wcRaw[0] : wcRaw)
            : undefined;

    const charId = Number(id);
    if (!Number.isFinite(charId)) notFound();

    const character = await getCharacter(charId);
    if (!character) notFound();

    const variants = await getCharacterCws(charId);
    if (!variants || variants.length === 0) notFound();

    const sorted = [...variants].sort((a, b) => {
        const ac = a.weaponCode ?? Number.POSITIVE_INFINITY;
        const bc = b.weaponCode ?? Number.POSITIVE_INFINITY;
        if (ac !== bc) return ac - bc;
        if (a.cwId !== b.cwId) return a.cwId - b.cwId;
        return (a.weapon || "").localeCompare(b.weapon || "");
    });

    let selected = wc ? sorted.find((v) => v.cwId === wc) : undefined;
    if (!selected) {
        selected =
            sorted.find((v) => Number.isFinite(v.weaponCode)) ?? sorted[0];
    }

    const currentWeapon = selected?.weapon ?? sorted[0].weapon;
    const overview = selected ? await getCwOverview(selected.cwId) : null;

    // 최소 tier 정보만 전달
    const rMinimal = {
        id: character.id,
        name: character.nameKr,
        tier: "A",
    } as any;

    const builds = mockBuildsFor(character.id, currentWeapon);
    const teams = mockTeamsFor(character.id, currentWeapon);

    return (
        <CharacterDetailClient
            initial={{
                r: rMinimal,
                variants: sorted,
                currentWeapon,
                builds,
                teams,
                character,
                overview, // ← { clusters: ["B"], overview:{summary,stats}, ... }
            }}
        />
    );
}
