import NavBar from "@/components/NavBar";
import UserSuggestClient from "@/components/UserSuggestClient";

export const metadata = { title: "ER Stats – 유저 맞춤 조합 추천" };

export default function SuggestPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <NavBar />
            <h1 className="text-xl font-bold text-white mb-2">
                유저 맞춤 조합 추천
            </h1>
            <p className="text-sm text-white/60 mb-6">
                최근 플레이한 실험체 Top3를 중심으로, pair/solo/cluster 정보를
                종합해 승률이 기대되는 조합을 추천합니다.
            </p>
            <UserSuggestClient />
        </div>
    );
}
