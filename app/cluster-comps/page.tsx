// app/cluster-combos/page.tsx
import ClusterCompsClient from "@/features/cluster-comps/components/ClusterCompsClient";
import type { ClusterTriadSummary } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "ER Nebi – 클러스터 조합 통계" };

type ServerClusterComboRow = {
    cluster_label: string; // "A · B · K"
    samples: number; // team_count
    cluster_ids: number[]; // cluster_id
    wins: number;
    win_rate: number; // 0~1
    pick_rate: number; // 0~1
    avg_mmr: number; // 평균 MMR
    avg_survival: number | null; // 초
};

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

    const j = await res.json();
    const rows: ServerClusterComboRow[] = (j.data ?? j) as any;

    return rows.map((r) => ({
        clusters: r.cluster_label.split("·").map((s) => s.trim()),
        clusterIds: r.cluster_ids,
        winRate: r.win_rate,
        pickRate: r.pick_rate,
        mmrGain: r.avg_mmr,
        survivalTime: r.avg_survival ?? undefined,
        count: r.samples,
        patch: "All", // 패치 테이블 붙기 전까지 All 고정
        tier, // 현재 선택된 티어(또는 All)
    }));
}

export default async function ClusterCompsPage({
    searchParams,
}: {
    searchParams?: {
        tier?: string;
        minSamples?: string;
        limit?: string;
        offset?: string;
    };
}) {
    const sp = await searchParams;
    const tier = sp.tier ?? "All";
    const minSamples = Number.isNaN(Number(sp.minSamples))
        ? 1000
        : Number(sp.minSamples ?? 1000);
    const limit = Number(sp.limit ?? 1000);
    const offset = Number(sp.offset ?? 0);

    const initial = await fetchClusterCombos({
        tier,
        minSamples,
        limit,
        offset,
    });

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            {/* 필요하면 NavBar 노출 */}
            {/* <NavBar /> */}
            <ClusterCompsClient initial={initial} />
        </div>
    );
}
