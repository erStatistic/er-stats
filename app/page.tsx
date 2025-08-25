import HomeDashboard from "@/features/home/components/HomeDashboard";
import {
    fetchLatestPatch,
    fetchTopCharacters,
    fetchPopularComps,
} from "@/lib/dashboard_data";

export const metadata = { title: "ER Stats – 대시보드" };

export default async function HomePage() {
    // ✅ SSR에서 한 번만 생성(고정 시드) → Hydration 안전
    const [latestPatch, topChars, popularComps] = await Promise.all([
        fetchLatestPatch(),
        fetchTopCharacters(5),
        fetchPopularComps(3),
    ]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <HomeDashboard
                latestPatch={latestPatch}
                topChars={topChars}
                popularComps={popularComps}
            />
        </div>
    );
}
