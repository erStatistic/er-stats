// app/characters/[id]/page.tsx
import { notFound } from "next/navigation";
import CharacterDetailClient from "@/features/characterDetail/components/CharacterDetailClient";
import { mockTeamsFor } from "@/lib/mock";
import type { Build } from "@/types";

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
        nameKr: d.name_kr ?? "이름 없음",
        imageUrlMini: (d.image_url_mini ?? "").trim(),
        imageUrlFull: (d.image_url_full ?? "").trim(),
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

/** 서버 응답을 클라 표준으로 정규화해서 반환 */
async function getCwOverview(cwId: number) {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<any>(`${base}/api/v1/cws/${cwId}/overview`);
    const d = j?.data;
    if (!d) return null;

    const clusters: string[] = d.cluster?.name ? [String(d.cluster.name)] : [];

    // ① summary/ stats 키 표준화 (Go 기본 JSON은 PascalCase일 가능성 높음)
    const rawSum = d.overview?.summary ?? {};
    const summary = {
        games: rawSum.games ?? rawSum.Games ?? 0,
        winRate: rawSum.winRate ?? rawSum.WinRate ?? 0,
        pickRate: rawSum.pickRate ?? rawSum.PickRate ?? 0,
        mmrGain: rawSum.mmrGain ?? rawSum.MMRGain ?? 0,
        survivalSec: rawSum.survivalSec ?? rawSum.SurvivalSec ?? 0,
    };

    const rawStats = d.overview?.stats ?? {};
    const stats = {
        atk: rawStats.atk ?? rawStats.ATK ?? 0,
        def: rawStats.def ?? rawStats.DEF ?? 0,
        cc: rawStats.cc ?? rawStats.CC ?? 0,
        spd: rawStats.spd ?? rawStats.SPD ?? 0,
        sup: rawStats.sup ?? rawStats.SUP ?? 0,
    };

    // ② routes 표준화
    const rawRoutes = Array.isArray(d.overview?.routes)
        ? d.overview.routes
        : [];
    const routes = rawRoutes
        .map((r: any) => ({
            id: Number(r.id ?? r.ID),
            title: String(r.title ?? r.Title ?? "추천 경로"),
        }))
        .filter((r: any) => Number.isFinite(r.id));

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
        clusters,
        overview: {
            summary,
            stats,
            routes, // ← 여기까지 서버 1회 호출로 확보
        },
    };
}

/** 각 routeId 상세를 시도해서 Build로 변환 (실패해도 안전하게 폴백) */
async function routeToBuild(
    routeId: number,
    titleFallback: string,
): Promise<Build> {
    const base = process.env.API_BASE_URL!;
    try {
        const j = await fetchJSON<any>(`${base}/api/v1/routes/${routeId}`);
        const d = j?.data ?? j;

        const title =
            d?.title ?? d?.Title ?? titleFallback ?? `추천 #${routeId}`;
        const desc = d?.description ?? d?.desc ?? "경로 기반 추천";

        // steps / items / build / materials 등 가능성 있는 필드 폭넓게 스캔
        const rawItems =
            d?.items ??
            d?.steps ??
            d?.build ??
            d?.routeSteps ??
            d?.materials ??
            [];

        const items = Array.isArray(rawItems)
            ? rawItems.map((x: any) => String(x))
            : typeof rawItems === "string"
              ? rawItems
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
              : [];

        return {
            id: String(d?.id ?? d?.ID ?? routeId),
            title: String(title),
            description: String(desc),
            items,
        };
    } catch {
        // 상세가 없거나 실패하면 제목만 있는 카드로 폴백
        return {
            id: String(routeId),
            title: titleFallback || `추천 #${routeId}`,
            description: "경로 기반 추천",
            items: [],
        };
    }
}

/** overview.routes → Build[] */
async function buildsFromOverviewRoutes(overview: any): Promise<Build[]> {
    const routes = overview?.overview?.routes ?? [];
    if (!routes?.length) return [];

    // 병렬로 최대 4개 정도만 받아도 충분(필요시 늘리면 됨)
    const selected = routes.slice(0, 4);
    const builds = await Promise.all(
        selected.map((r: any) => routeToBuild(r.id, r.title)),
    );
    return builds;
}

/* Next 최신: params/searchParams 는 Promise */
type Params = { id: string };
type Query = { wc?: string | string[]; u?: string | string[] };

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

    // ★ 여기서 overview 호출(여기에 routes 포함됨)
    const overview = selected ? await getCwOverview(selected.cwId) : null;

    // 최소 tier 정보만 전달
    const rMinimal = {
        id: character.id,
        name: character.nameKr,
        tier: "A",
    } as any;

    // ★ 추천 빌드 = overview.routes 기반으로 구성(상세 조회 실패하면 제목 카드라도)
    let builds: Build[] = [];
    if (overview) {
        builds = await buildsFromOverviewRoutes(overview);
    }
    if (builds.length === 0) {
        // 완전 비었으면 임시 폴백(원하면 제거 가능)
        builds = [
            {
                id: "fallback-1",
                title: `${currentWeapon} 추천 #1`,
                description: "임시 폴백 빌드",
                items: [],
            },
        ];
    }

    // 팀 추천은 당장 mock 유지(원하면 동일 패턴으로 교체)
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
                overview, // { overview: { summary, stats, routes }, clusters: [...] }
            }}
        />
    );
}
