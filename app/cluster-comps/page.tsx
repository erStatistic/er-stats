import NavBar from "@/components/NavBar";
import ClusterCompsClient from "@/components/ClusterCompsClient";
import { ClusterTriadSummary } from "@/types";

// 🔧 임시 Mock: 나중에 API로 교체
function mockClusterTriads(): ClusterTriadSummary[] {
    return [
        {
            clusters: ["A", "B", "K"],
            winRate: 0.58,
            pickRate: 0.12,
            mmrGain: 9.4,
            count: 420,
            patch: "v0.76",
            tier: "All",
        },
        {
            clusters: ["A", "A", "K"],
            winRate: 0.55,
            pickRate: 0.1,
            mmrGain: 8.7,
            count: 360,
            patch: "v0.76",
            tier: "All",
        },
        {
            clusters: ["B", "K", "N"],
            winRate: 0.53,
            pickRate: 0.09,
            mmrGain: 7.9,
            count: 300,
            patch: "v0.76",
            tier: "All",
        },
        {
            clusters: ["C", "K", "A"],
            winRate: 0.51,
            pickRate: 0.07,
            mmrGain: 6.8,
            count: 210,
            patch: "v0.76",
            tier: "All",
        },
        {
            clusters: ["A", "N", "O"],
            winRate: 0.49,
            pickRate: 0.05,
            mmrGain: 5.4,
            count: 140,
            patch: "v0.76",
            tier: "All",
        },
    ];
}

export const metadata = { title: "ER Stats – 클러스터 조합 통계" };

export default function ClusterCompsPage() {
    const data = mockClusterTriads();
    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <NavBar />
            <ClusterCompsClient initial={data} />
        </div>
    );
}
