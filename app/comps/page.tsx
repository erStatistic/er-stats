// app/comps/page.tsx  (서버 컴포넌트)
import CompsClient from "@/components/CompsClient";
import { CompSummary, CharacterSummary } from "@/types";
import NavBar from "@/components/NavBar";
import Carousel from "@/components/Carousel";
import CompCard from "@/components/CompCard";

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
    const characters = makeMockCharacters();
    const allComps = makeMockComps();

    // 상단 캐러셀은 Top3만
    const topComps = allComps.slice(0, Math.min(3, allComps.length));

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            {topComps.length > 0 && (
                <>
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                        상위 조합
                    </h2>
                    <Carousel
                        // 모바일 1.1장, md 1.4장, lg 1.8장 보이도록 (가운데 포커스 크게, 양옆 힌트)
                        responsiveVisible={{ base: 1.1, md: 1.4, lg: 1.8 }}
                        autoSlide
                        interval={5000}
                        scaleActive={1.05}
                        scaleInactive={0.9}
                    >
                        {topComps.map((comp, i) => (
                            <CompCard
                                key={i}
                                comp={comp}
                                characters={characters}
                            />
                        ))}
                    </Carousel>
                </>
            )}

            {/* 전체 조합 테이블 */}
            <div className="mt-10">
                <CompsClient initialComps={allComps} characters={characters} />
            </div>
        </div>
    );
}
