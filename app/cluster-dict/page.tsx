// app/cluster-dict/page.tsx  (Server Component)
import NavBar from "@/features/ui/NavBar";
import ClusterDirectoryClient from "@/features/cluster-dict/components/ClusterDirectoryClient";
import { ssrGetCwDirectory } from "@/lib/server-api";

export const metadata = { title: "ER Stats – 군집(클러스터) 디렉터리" };
export const revalidate = 300; // ISR: 5분마다 재검증 (원하는 주기로 변경)

export default async function ClustersPage() {
    const headers = await ssrGetCwDirectory(); // ✅ 서버에서 API 호출

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-lg sm:text-xl font-bold mb-3">
                군집(클러스터) 디렉터리
            </h1>
            <p className="text-sm mb-6">
                각 군집은 유사한 역할/플레이스타일을 갖는 실험체들의 묶음입니다.
                역할 탭과 검색을 이용해 빠르게 찾아보세요.
            </p>
            {/* ✅ SSR된 헤더를 클라이언트 컴포넌트로 전달 */}
            <ClusterDirectoryClient initial={headers as any} />
        </div>
    );
}
