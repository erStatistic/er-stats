// app/cluster-combos/page.tsx
import ClusterCompsClient from "@/features/cluster-comps/components/ClusterCompsClient";
import type { ClusterTriadSummary } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "ER Nebi – 클러스터 조합 통계" };

type ServerClusterComboRow = {
    cluster_label: string; // "A · B · K"
    samples: number; // team_count
    cluster_ids: number[]; // cluster_id[]
    wins: number;
    win_rate: number; // 0~1
    pick_rate: number; // 0~1
    avg_mmr: number; // 평균 MMR
    avg_survival: number | null; // 초
};

function toTriad(arr: string[]): [string, string, string] {
    const a = arr.slice(0, 3);
    while (a.length < 3) a.push("");
    return [a[0] ?? "", a[1] ?? "", a[2] ?? ""];
}

async function fetchClusterCombos(opts: {
    tier?: string; // tiers.name or "All"
    minSamples?: number; // 없거나 0이면 SQL 기본 50
    limit?: number;
    offset?: number;
}): Promise<ClusterTriadSummary[]> {
    const base = process.env.API_BASE_URL; // 예: http://localhost:3333
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
        // 실패 시 빈 배열 반환(페이지는 정상 렌더)
        console.error(
            "[cluster-combos] fetch failed:",
            res.status,
            res.statusText,
        );
        return [];
    }

    const payload = (await res.json()) as unknown;
    const data = (payload as { data?: unknown })?.data ?? payload;
    const rows: ServerClusterComboRow[] = Array.isArray(data)
        ? (data as ServerClusterComboRow[])
        : [];

    return rows.map<ClusterTriadSummary>((r) => {
        const names = r.cluster_label.split("·").map((s) => s.trim());
        const clusters = toTriad(names); // ✅ [string, string, string] 보장

        return {
            clusters,
            clusterIds: r.cluster_ids,
            winRate: r.win_rate,
            pickRate: r.pick_rate,
            mmrGain: r.avg_mmr,
            survivalTime: r.avg_survival ?? undefined,
            count: r.samples,
            patch: "All", // 패치 테이블 붙기 전까지 All 고정
            tier, // 현재 선택된 티어(또는 All)
        };
    });
}

// ✅ Next.js 15: searchParams는 Promise 형태
export default async function ClusterCompsPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[]>>;
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
