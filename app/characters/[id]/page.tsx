// app/characters/[id]/page.tsx
import { notFound } from "next/navigation";
import CharacterDetailClient from "@/features/characterDetail/components/CharacterDetailClient";
import { mockTeamsFor } from "@/lib/mock";
import type { Build } from "@/types";
import { Stats, RouteInfo } from "@/features/characterDetail/types";
import {
    MinimalR,
    CharacterWeaponOverview,
} from "@/features/characterDetail/types";
import { ServerCharacter } from "@/features/characterDetail/types";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type VariantItem = {
    cwId: number;
    weapon: string;
    weaponCode?: number;
    weaponImageUrl?: string;
};

type ApiResponse<T = unknown> = {
    code?: number;
    msg?: string;
    data?: T;
};

type Summary = {
    games: number;
    winRate: number;
    pickRate: number;
    mmrGain: number;
    survivalSec: number;
};

/* ---------- tiny helpers (no any) ---------- */
const asRecord = (x: unknown): Record<string, unknown> =>
    x && typeof x === "object" ? (x as Record<string, unknown>) : {};

const numOr = (v: unknown, fb = 0): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
        return Number(v);
    return fb;
};

const strOr = (v: unknown, fb = ""): string => (typeof v === "string" ? v : fb);

const pick = (
    rec: Record<string, unknown>,
    keys: string[],
    fb?: unknown,
): unknown => {
    for (const k of keys) {
        if (k in rec && rec[k] !== undefined && rec[k] !== null) return rec[k];
    }
    return fb;
};

/* ---------- fetch JSON with generic ---------- */
async function fetchJSON<T>(url: string) {
    const res = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
}

/* ---------- character ---------- */
async function getCharacter(id: number): Promise<ServerCharacter | null> {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<ApiResponse<unknown>>(
        `${base}/api/v1/characters/${id}`,
    );
    if (j?.code === 404 || !j?.data) return null;

    const d = asRecord(j.data);
    const idNum = numOr(pick(d, ["ID", "id"]), NaN);
    if (!Number.isFinite(idNum)) return null;

    return {
        id: idNum,
        nameKr: strOr(pick(d, ["name_kr"]), "이름 없음"),
        imageUrlMini: strOr(pick(d, ["image_url_mini"]), "").trim(),
        imageUrlFull: strOr(pick(d, ["image_url_full"]), "").trim(),
    };
}

/* ---------- character → CWs (variants) ---------- */
type CwsResponse = {
    cwId: number;
    weapon: {
        code: number;
        name: string;
        imageUrl: string;
    };
};

async function getCharacterCws(characterId: number): Promise<VariantItem[]> {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<ApiResponse<unknown>>(
        `${base}/api/v1/characters/${characterId}/cws`,
    );

    const data = j?.data;
    const rows: CwsResponse[] = Array.isArray(data)
        ? (data as CwsResponse[])
        : [];

    return rows.map((r) => ({
        cwId: Number(r.cwId),
        weapon: r.weapon.name,
        weaponCode: r.weapon.code,
        weaponImageUrl: r.weapon.imageUrl,
    }));
}

/* ---------- CW overview ---------- */
async function getCwOverview(
    cwId: number,
): Promise<CharacterWeaponOverview | undefined> {
    const base = process.env.API_BASE_URL!;
    const j = await fetchJSON<ApiResponse<unknown>>(
        `${base}/api/v1/cws/${cwId}/overview`,
    );
    const d = asRecord(j?.data);
    if (!j?.data) return undefined;

    // cluster name
    const clusterRec = asRecord(d["cluster"]);
    const clusterName = strOr(clusterRec["name"]);
    const clusters = clusterName ? [clusterName] : [];

    // summary
    const sumRec = asRecord(asRecord(d["overview"])["summary"]);
    const summary: Summary = {
        games: numOr(pick(sumRec, ["games", "Games"]), 0),
        winRate: numOr(pick(sumRec, ["winRate", "WinRate"]), 0),
        pickRate: numOr(pick(sumRec, ["pickRate", "PickRate"]), 0),
        mmrGain: numOr(pick(sumRec, ["mmrGain", "MMRGain"]), 0),
        survivalSec: numOr(pick(sumRec, ["survivalSec", "SurvivalSec"]), 0),
    };

    // stats
    const statsRec = asRecord(asRecord(d["overview"])["stats"]);
    const stats: Stats = {
        atk: numOr(pick(statsRec, ["atk", "ATK"]), 0),
        def: numOr(pick(statsRec, ["def", "DEF"]), 0),
        cc: numOr(pick(statsRec, ["cc", "CC"]), 0),
        spd: numOr(pick(statsRec, ["spd", "SPD"]), 0),
        sup: numOr(pick(statsRec, ["sup", "SUP"]), 0),
    };

    // routes
    const routesRaw = asRecord(d["overview"])["routes"];
    const routes: RouteInfo[] = Array.isArray(routesRaw)
        ? (routesRaw as unknown[]).reduce<RouteInfo[]>((acc, r) => {
              const rec = asRecord(r);
              const id = numOr(pick(rec, ["id", "ID"]), NaN);
              if (!Number.isFinite(id)) return acc;
              const title = strOr(pick(rec, ["title", "Title"]), "추천 경로");
              acc.push({ id, title });
              return acc;
          }, [])
        : [];

    // character, weapon, position
    const charRec = asRecord(d["character"]);
    const weaponRec = asRecord(d["weapon"]);
    const posRec = asRecord(d["position"]);

    return {
        cwId: numOr(d["cwId"], cwId),
        tier: strOr(d["tier"]) || undefined,
        character: {
            id: numOr(charRec["id"], 0),
            name: strOr(charRec["name"]),
            imageUrl: strOr(charRec["imageUrl"]),
        },
        weapon: {
            code: numOr(weaponRec["code"], 0),
            name: strOr(weaponRec["name"]),
            imageUrl: strOr(weaponRec["imageUrl"]),
        },
        position:
            "id" in posRec || "name" in posRec
                ? { id: numOr(posRec["id"], 0), name: strOr(posRec["name"]) }
                : undefined,
        clusters,
        overview: { summary, stats, routes },
    };
}

/* ---------- route → Build ---------- */
async function routeToBuild(
    routeId: number,
    titleFallback: string,
): Promise<Build> {
    const base = process.env.API_BASE_URL!;
    try {
        const j = await fetchJSON<ApiResponse<unknown>>(
            `${base}/api/v1/routes/${routeId}`,
        );
        const d = asRecord(j?.data ?? j);

        const title = strOr(
            pick(d, ["title", "Title"], titleFallback || `추천 #${routeId}`),
        );
        const desc = strOr(pick(d, ["description", "desc"], "경로 기반 추천"));

        const rawItems = pick(
            d,
            ["items", "steps", "build", "routeSteps", "materials"],
            [],
        );
        let items: string[] = [];
        if (Array.isArray(rawItems)) {
            items = (rawItems as unknown[]).map((x) => String(x));
        } else if (typeof rawItems === "string") {
            items = rawItems
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }

        const idVal = pick(d, ["id", "ID"], routeId);

        return {
            id: String(idVal),
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

async function buildsFromOverviewRoutes(
    overview: NonNullable<CharacterWeaponOverview>,
): Promise<Build[]> {
    const routes = overview.overview.routes;
    if (!routes.length) return [];
    const selected = routes.slice(0, 4);
    return Promise.all(selected.map((r) => routeToBuild(r.id, r.title)));
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

    const overview = selected ? await getCwOverview(selected.cwId) : undefined;

    const rMinimal: MinimalR = {
        id: character.id,
        name: character.nameKr,
        tier: overview?.tier ?? null,
    };

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
