import HomeDashboard from "@/features/home/components/HomeDashboard";
import { fetchTopCharacters, fetchPopularComps } from "@/lib/dashboard_data";

export const metadata = { title: "ER Nebi – 대시보드" };

export default async function HomePage() {
    // ✅ SSR에서 한 번만 생성(고정 시드) → Hydration 안전
    const [topChars, popularComps] = await Promise.all([
        fetchTopCharacters(5),
        fetchPopularComps(5),
    ]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <HomeDashboard topChars={topChars} popularComps={popularComps} />
        </div>
    );
}
