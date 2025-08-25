import NavBar from "@/features/ui/NavBar";
import ClusterCompsClient from "@/features/cluster-comps/components/ClusterCompsClient";
import { ClusterTriadSummary } from "@/types";

// 🔧 임시 Mock: 나중에 API로 교체
function mockClusterTriads(
    rng: () => number = Math.random,
): ClusterTriadSummary[] {
    const randSec = (min: number, max: number) =>
        Math.round(min + rng() * (max - min));
    const base = [
        {
            clusters: ["A", "B", "K"],
            winRate: 0.58,
            pickRate: 0.12,
            mmrGain: 9.4,
            count: 420,
        },
        {
            clusters: ["A", "A", "K"],
            winRate: 0.55,
            pickRate: 0.1,
            mmrGain: 8.7,
            count: 360,
        },
        {
            clusters: ["B", "K", "N"],
            winRate: 0.53,
            pickRate: 0.09,
            mmrGain: 7.9,
            count: 300,
        },
        {
            clusters: ["C", "K", "A"],
            winRate: 0.51,
            pickRate: 0.07,
            mmrGain: 6.8,
            count: 210,
        },
        {
            clusters: ["A", "N", "O"],
            winRate: 0.49,
            pickRate: 0.05,
            mmrGain: 5.4,
            count: 140,
        },
    ] as const;

    return base.map((b, i) => ({
        ...b,
        survivalTime: randSec(720 - i * 30, 960 - i * 30), // 12–16분에서 약간씩 차등
        patch: "v0.76",
        tier: "All",
    }));
}
export const metadata = { title: "ER Stats – 클러스터 조합 통계" };

export default function ClusterCompsPage() {
    const data = mockClusterTriads();
    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <ClusterCompsClient initial={data} />
        </div>
    );
}
