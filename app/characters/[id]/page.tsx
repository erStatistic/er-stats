// app/characters/[id]/page.tsx
import { notFound } from "next/navigation";
import CharacterDetailClient from "@/features/characterDetail/components/CharacterDetailClient";

type Character = {
    id: number;
    nameKr: string;
    imageUrlMini?: string;
    imageUrlFull?: string;
};

type CwItem = {
    cwId: number;
    character?: { id: number; name?: string; imageUrl?: string };
    weapon?: { code: number; name: string; imageUrl?: string };
    position?: { id?: number; name?: string | null };
};

type OverviewBox = {
    summary?: {
        winRate?: number;
        pickRate?: number;
        mmrGain?: number;
        survivalSec?: number;
    };
    stats?: { atk: number; def: number; cc: number; spd: number; sup: number };
};
type CwOverview = {
    cwId: number;
    character: { id: number; name: string; imageUrl: string };
    weapon: { code: number; name: string; imageUrl: string };
    position?: { id?: number | null; name?: string };
    overview?: OverviewBox; // 서버가 overview 중첩으로 주는 형태
};

// ── fetch helpers ───────────────────────────────────────────────────────────
async function getCharacter(id: number): Promise<Character | null> {
    const base = process.env.API_BASE_URL!;
    const res = await fetch(`${base}/api/v1/characters/${id}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`character ${id} ${res.status}`);
    const j = await res.json();
    const d = j?.data;
    return d
        ? {
              id: d.ID ?? d.id,
              nameKr: d.NameKr ?? d.nameKr,
              imageUrlMini: d.ImageUrlMini ?? d.imageUrlMini ?? undefined,
              imageUrlFull: d.ImageUrlFull ?? d.imageUrlFull ?? undefined,
          }
        : null;
}

async function getCwsByCharacter(id: number): Promise<CwItem[]> {
    const base = process.env.API_BASE_URL!;
    const res = await fetch(`${base}/api/v1/characters/${id}/cws`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`cws for ch ${id} ${res.status}`);
    const j = await res.json();
    const arr = j?.data ?? j;
    return Array.isArray(arr) ? arr : [];
}

async function getCwOverview(cwId: number): Promise<CwOverview | null> {
    const base = process.env.API_BASE_URL!;
    const res = await fetch(`${base}/api/v1/cws/${cwId}/overview`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`overview ${cwId} ${res.status}`);
    const j = await res.json();
    return j?.data ?? j;
}

export default async function Page({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ wc?: string }>;
}) {
    const { id } = await params;
    const sp = await searchParams;
    const chId = Number(id);
    if (!Number.isFinite(chId)) notFound();

    const character = await getCharacter(chId);
    if (!character) notFound();

    // 1) 이 캐릭터의 CW 목록 가져오기
    const cws = await getCwsByCharacter(chId);

    // variants: Pill에 쓸 가벼운 뷰 모델
    const variants = cws.map((x) => ({
        cwId: Number(x.cwId),
        weapon: x.weapon?.name ?? "",
        weaponImageUrl: x.weapon?.imageUrl ?? "",
    }));

    if (variants.length === 0) {
        // CW가 없으면 빈 overview로 렌더
        return (
            <CharacterDetailClient
                initial={{
                    r: { id: character.id, tier: "A" } as any, // 기존 타입 호환용 최소 필드
                    variants: [],
                    currentWeapon: "",
                    builds: [],
                    teams: [],
                    character,
                    overview: undefined,
                }}
            />
        );
    }

    // 2) 선택된 cwId 결정 (쿼리 wc, 없으면 첫번째)
    const selectedCwId = sp?.wc ? Number(sp.wc) : variants[0].cwId;
    const selected =
        variants.find((v) => v.cwId === selectedCwId) ?? variants[0];

    // 3) overview 호출
    const overview = await getCwOverview(selected.cwId);

    return (
        <CharacterDetailClient
            initial={{
                r: { id: character.id, tier: "A" } as any, // (기존 컴포넌트가 tier를 쓰므로 최소값만)
                variants,
                currentWeapon: selected.weapon,
                builds: [], // 아직 mock 유지면 []로 전달하고 클라에서 mock 채워도 OK
                teams: [],
                character,
                overview,
            }}
        />
    );
}
