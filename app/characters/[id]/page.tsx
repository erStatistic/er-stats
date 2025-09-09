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

async function getCwOverview(cwId: number) {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<any>(`${base}/api/v1/cws/${cwId}/overview`);
    const d = j?.data;
    if (!d) return null;

    const clusters: string[] = d.cluster?.name ? [String(d.cluster.name)] : [];

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
        tier: d.tier,
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
        overview: { summary, stats, routes },
    };
}

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
        return {
            id: String(routeId),
            title: titleFallback || `추천 #${routeId}`,
            description: "경로 기반 추천",
            items: [],
        };
    }
}
async function getCharacterTierFromStats(id: number): Promise<string> {
    const base = process.env.API_BASE_URL!;
    // 🔎 너희 “캐릭터별 통계 테이블”에서 단일 캐릭 요약을 주는 엔드포인트를 연결해줘.
    // (예시 1) /api/v1/analytics/characters/{id}/summary
    // (예시 2) /api/v1/analytics/characters/row?id=...
    const tryUrls = [
        `${base}/api/v1/analytics/characters/${id}/summary`,
        `${base}/api/v1/analytics/characters/${id}`,
        `${base}/api/v1/characters/${id}/stats`,
    ];
    for (const url of tryUrls) {
        try {
            const j = await fetchJSON<any>(url);
            const d = j?.data ?? j;
            const t = d?.tier ?? d?.grade ?? d?.rankTier ?? d?.Tier ?? d?.Grade;
            if (typeof t === "string" && t.trim())
                return t.trim().toUpperCase();
        } catch {
            /* try next */
        }
    }
    return "A"; // 폴백
}

async function buildsFromOverviewRoutes(overview: any): Promise<Build[]> {
    const routes = overview?.overview?.routes ?? [];
    if (!routes?.length) return [];
    const selected = routes.slice(0, 4);
    return Promise.all(selected.map((r: any) => routeToBuild(r.id, r.title)));
}

/** Next App Router: params/searchParams는 Promise */
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
            : undefined; // weaponId (= weaponCode)

    const charId = Number(id);
    if (!Number.isFinite(charId)) notFound();

    const character = await getCharacter(charId);
    if (!character) notFound();

    const variants = await getCharacterCws(charId);
    if (!variants || variants.length === 0) notFound();

    const tierFromStats = await getCharacterTierFromStats(charId);

    const sorted = [...variants].sort((a, b) => {
        const ac = a.weaponCode ?? Number.POSITIVE_INFINITY;
        const bc = b.weaponCode ?? Number.POSITIVE_INFINITY;
        if (ac !== bc) return ac - bc;
        if (a.cwId !== b.cwId) return a.cwId - b.cwId;
        return (a.weapon || "").localeCompare(b.weapon || "");
    });

    // 🔧 핵심 수정: wc(weaponId) → weaponCode로 매칭
    let selected =
        wc != null && Number.isFinite(wc)
            ? sorted.find((v) => v.weaponCode === wc)
            : undefined;

    if (!selected) {
        selected =
            sorted.find((v) => Number.isFinite(v.weaponCode)) ?? sorted[0];
    }

    const currentWeapon = selected?.weapon ?? sorted[0].weapon;

    const overview = selected ? await getCwOverview(selected.cwId) : null;

    // ✅ 통계 테이블 기준 티어 주입

    const rMinimal = {
        id: character.id,
        name: character.nameKr,
        tier: overview.tier, // ⬅️ 요걸 TierFramedImage에 넘김
    } as any;

    console.log(rMinimal);

    let builds: Build[] = [];
    if (overview) {
        builds = await buildsFromOverviewRoutes(overview);
    }

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
                overview,
            }}
        />
    );
}
