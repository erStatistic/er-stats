// app/cluster-combos/page.tsx
import ClusterCompsClient from "@/features/cluster-comps/components/ClusterCompsClient";
import type { ClusterTriadSummary } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "ER Nebi – 클러스터 조합 통계" };

type ServerClusterComboRow = {
    cluster_label: string;
    samples: number;
    cluster_ids: number[];
    wins: number;
    win_rate: number;
    pick_rate: number;
    avg_mmr: number;
    avg_survival: number | null;
};
function toTriad<T>(arr: T[] | null | undefined, fallback: T): [T, T, T] {
    const a = Array.isArray(arr) ? arr : [];
    return [a[0] ?? fallback, a[1] ?? fallback, a[2] ?? fallback];
}

async function fetchClusterCombos(opts: {
    tier?: string;
    minSamples?: number;
    limit?: number;
    offset?: number;
}): Promise<ClusterTriadSummary[]> {
    const base = process.env.API_BASE_URL;
    if (!base) throw new Error("API_BASE_URL is not set");

    const tier = opts.tier ?? "All";
    const minSamples = opts.minSamples ?? 1000;
    const limit = opts.limit ?? 1000;
    const offset = opts.offset ?? 0;

    const url = new URL(`${base}/api/v1/analytics/combos/clusters`);
    if (tier !== "All") url.searchParams.set("tier", tier);
    if (minSamples) url.searchParams.set("minSamples", String(minSamples));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { accept: "application/json" },
    });

    if (!res.ok) {
        console.error(
            "[cluster-combos] fetch failed:",
            res.status,
            res.statusText,
        );
        return [];
    }

    const j = await res.json();
    const rows: ServerClusterComboRow[] = Array.isArray(j?.data) ? j.data : [];

    return rows.map<ClusterTriadSummary>((r) => {
        // "A · B · K" → ["A","B","K"] → 튜플 [a,b,c]로 보정
        const labels = r.cluster_label
            .split("·")
            .map((s: string) => s.trim())
            .filter(Boolean);
        const clusters = toTriad<string>(labels, ""); // [string,string,string]

        // 서버가 3개를 보장 못할 수도 있으니 보정
        const clusterIds = toTriad<number>(r.cluster_ids, 0); // [number,number,number]

        return {
            clusters, // [string, string, string]
            clusterIds, // [number, number, number]
            winRate: r.win_rate,
            pickRate: r.pick_rate,
            mmrGain: r.avg_mmr,
            survivalTime: r.avg_survival ?? undefined,
            count: r.samples,
            patch: "All",
            tier,
        };
    });
}
// ✅ Next.js 15 스타일: searchParams는 Promise 타입으로 받고 await 해서 사용
export default async function ClusterCompsPage({
    searchParams,
}: {
    searchParams?: Promise<{
        tier?: string | string[];
        minSamples?: string | string[];
        limit?: string | string[];
        offset?: string | string[];
    }>;
}) {
    const sp = (await searchParams) ?? {};

    const first = <T,>(v: T | T[] | undefined): T | undefined =>
        Array.isArray(v) ? v[0] : v;

    const tier = first(sp.tier) ?? "All";

    const minSamplesStr = first(sp.minSamples);
    const minSamples = Number.isNaN(Number(minSamplesStr))
        ? 1000
        : Number(minSamplesStr ?? 1000);

    const limitStr = first(sp.limit);
    const limit = Number.isNaN(Number(limitStr))
        ? 1000
        : Number(limitStr ?? 1000);

    const offsetStr = first(sp.offset);
    const offset = Number.isNaN(Number(offsetStr)) ? 0 : Number(offsetStr ?? 0);

    const initial = await fetchClusterCombos({
        tier,
        minSamples,
        limit,
        offset,
    });

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <ClusterCompsClient initial={initial} />
        </div>
    );
}
