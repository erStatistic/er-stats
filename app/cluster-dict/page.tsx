import NavBar from "@/features/ui/NavBar";
import ClusterDirectoryClient from "@/features/cluster-dict/components/ClusterDirectoryClient";
import { makeClusterDirectory } from "@/lib/cluster";

export const metadata = { title: "ER Stats – 군집(클러스터) 디렉터리" };

export default function ClustersPage() {
    // 실제에선 서버에서 API fetch → props로 넘기세요.
    const data = makeClusterDirectory();
    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-xl font-bold text-white mb-4">
                군집(클러스터) 디렉터리
            </h1>
            <p className="text-sm text-white/60 mb-6">
                각 군집은 유사한 역할/플레이스타일을 갖는 실험체들의 묶음입니다.
                역할 탭과 검색을 이용해 빠르게 찾아보세요.
            </p>
            <ClusterDirectoryClient initial={data} />
        </div>
    );
}
