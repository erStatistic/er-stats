import NavBar from "@/components/NavBar";
import UserMultiSuggestClient from "@/components/UserMultiSuggestClient";

export const metadata = { title: "ER Stats – 멀티 유저 맞춤 조합 추천" };

export default function SuggestMultiPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-xl font-bold text-white mb-2">
                멀티 유저 맞춤 조합 추천
            </h1>
            <p className="text-sm text-white/60 mb-6">
                유저를 1~3명까지 추가하고, 각 유저의 최근 Top3 캐릭터를 기반으로
                팀(3인) 최적 조합을 추천합니다.
            </p>
            <UserMultiSuggestClient />
        </div>
    );
}
