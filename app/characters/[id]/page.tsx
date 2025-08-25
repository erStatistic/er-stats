// app/characters/[id]/page.tsx (서버 컴포넌트)
import { notFound } from "next/navigation";
import Image from "next/image";
import CharacterDetailClient from "@/features/characterDetail/components/CharacterDetailClient";
import { makeMock, getVariants, mockBuildsFor, mockTeamsFor } from "@/lib/mock";
import { mulberry32 } from "@/lib/rng";

type Character = {
    id: number;
    nameKr: string;
    imageUrl: string; // 빈 문자열일 수도 있으니 렌더링 전에 폴백 필요
};

// API 응답 타입 (참고용)
type ApiResponse = {
    code: number;
    msg: string;
    data?: {
        ID: number;
        NameKr: string;
        ImageUrlMini: string | null;
        ImageUrlFull: string | null;
        CreatedAt: string;
        UpdatedAt: string;
    } | null;
};

async function getCharacter(id: number): Promise<Character | null> {
    const base = process.env.API_BASE_URL; // 예: http://localhost:3333
    if (!base) throw new Error("API_BASE_URL is not set");

    const res = await fetch(`${base}/api/v1/characters/${id}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch character: ${res.status}`);

    const json = (await res.json()) as ApiResponse;

    // 응답 코드 체크
    if (json.code !== 200 || !json.data) return null;

    // ✅ 정규화 (대문자 → 소문자, null/빈문자 처리)
    const d = json.data;
    console.log("[getCharacter] GET", `${base}/api/v1/characters/${id}`);
    return {
        id: d.ID,
        nameKr: d.NameKr,
        imageUrlMini: (d.ImageUrlMini ?? "").trim(), // 빈 문자열일 수 있음
        imageUrlFull: (d.ImageUrlFull ?? "").trim(), // 빈 문자열일 수 있음
    };
}
export default async function CharacterDetailPage({
    params,
}: {
    // Next 15 경고 회피 패턴 (현재 코드 유지)
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isFinite(numId)) notFound();

    console.log("[CharacterDetailPage] GET", `/api/v1/characters/${numId}`);
    // 1) 캐릭터 fetch
    const character = await getCharacter(numId);
    if (!character) notFound();

    // 2) 기존 mock 로직 유지 (원하면 제거 가능)
    const rng = mulberry32(12345);
    const rows = makeMock(36, rng);
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
        <>
            <CharacterDetailClient
                initial={{
                    r,
                    variants,
                    currentWeapon,
                    builds,
                    teams,
                    character,
                }}
            />
        </>
    );
}
