import UserMultiSuggestClient from "@/features/suggestion-multi/components/UserMultiSuggestClient";

export const metadata = { title: "ER Nebi – 멀티 유저 맞춤 조합 추천" };

export default function SuggestMultiPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <h1 className="text-xl font-bold mb-2">캐릭터 맞춤 조합 통계</h1>
            <p className="text-sm  mb-6">
                캐릭터를 3개를 추가하고, 클러스터 기준으로 팀(3인)의 지표를
                보여줍니다.
            </p>
            <UserMultiSuggestClient />
        </div>
    );
}
