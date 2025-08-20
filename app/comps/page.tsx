// app/comps/page.tsx
import CompsClient from "@/components/CompsClient";
import { CompSummary, CharacterSummary } from "@/types";
import NavBar from "@/components/NavBar";
import Carousel from "@/components/Carousel";

// Mock 캐릭터 리스트
function makeMockCharacters(): CharacterSummary[] {
    return [
        { id: 1, name: "리다이린", imageUrl: "/chars/1.png" },
        { id: 2, name: "나딘", imageUrl: "/chars/2.png" },
        { id: 3, name: "현우", imageUrl: "/chars/3.png" },
        { id: 4, name: "아야", imageUrl: "/chars/4.png" },
        { id: 5, name: "매그너스", imageUrl: "/chars/5.png" },
        { id: 6, name: "피오라", imageUrl: "/chars/6.png" },
        { id: 7, name: "하트", imageUrl: "/chars/7.png" },
        { id: 9, name: "쇼우", imageUrl: "/chars/9.png" },
    ];
}

function makeMockComps(): CompSummary[] {
    return [
        {
            comp: [1, 2, 3],
            winRate: 0.55,
            pickRate: 0.12,
            mmrGain: 8.5,
            count: 120,
        },
        {
            comp: [4, 5, 6],
            winRate: 0.61,
            pickRate: 0.08,
            mmrGain: 10.2,
            count: 80,
        },
        {
            comp: [2, 7, 9],
            winRate: 0.47,
            pickRate: 0.15,
            mmrGain: 5.3,
            count: 150,
        },
    ];
}

export const metadata = { title: "ER Stats – 캐릭터 조합 통계" };

export default function CompsPage() {
    const comps = makeMockComps().slice(0, 3);
    const characters = makeMockCharacters();

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <NavBar />

            {/* ⭐ 상위 3개 조합 캐러셀 */}
            <h2 className="text-xl font-bold mb-4">Top 3 캐릭터 조합</h2>

            <Carousel visible={3} autoSlide interval={5000}>
                {comps.map((comp, idx) => (
                    <div
                        key={idx}
                        className="w-64 h-80 bg-gray-800 rounded-xl flex flex-col items-center justify-center text-white shadow-lg"
                    >
                        <p className="text-lg font-bold">조합 {idx + 1}</p>
                        <p>승률: {(comp.winRate * 100).toFixed(1)}%</p>
                        <p>픽률: {(comp.pickRate * 100).toFixed(1)}%</p>
                    </div>
                ))}
            </Carousel>

            {/* 아래 전체 조합 테이블 */}
            <div className="mt-10">
                <CompsClient initialComps={comps} characters={characters} />
            </div>
        </div>
    );
}
