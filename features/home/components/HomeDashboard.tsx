"use client";

import Link from "next/link";
import Carousel from "@/features/ui/Carousel";
import CompCard from "./CompCard";
import FeatureTiles from "./FeatureTiles";
import { CharacterSummary, CompSummary } from "@/types";
import { formatPercent } from "@/lib/stats";

function pick<T>(obj: any, a: keyof any, b: keyof any, def: T): T {
    return (obj?.[a] ?? obj?.[b] ?? def) as T;
}

export default function HomeDashboard({
    topChars,
    popularComps,
}: {
    topChars: CharacterSummary[];
    popularComps: CompSummary[];
}) {
    // ── 인기 조합들 사이의 상대 비교용 스케일(최댓값) 계산
    const scale = popularComps.reduce(
        (acc, c) => {
            acc.maxWin = Math.max(
                acc.maxWin,
                pick<number>(c, "win_rate", "winRate", 0),
            );
            acc.maxPick = Math.max(
                acc.maxPick,
                pick<number>(c, "pick_rate", "pickRate", 0),
            );
            acc.maxMmr = Math.max(
                acc.maxMmr,
                pick<number>(c, "avg_mmr", "mmrGain", 0),
            );
            acc.maxCount = Math.max(
                acc.maxCount,
                pick<number>(c, "samples", "count", 0),
            );
            return acc;
        },
        { maxWin: 0, maxPick: 0, maxMmr: 0, maxCount: 0 },
    );

    return (
        <div className="space-y-8">
            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-app">인기 조합</h2>
                    <Link
                        href="/cluster-comps"
                        className="text-sm text-muted-app hover:text-app"
                    >
                        조합 통계로 이동 →
                    </Link>
                </div>

                <Carousel
                    responsiveVisible={{ base: 1.05, md: 1.4, lg: 1.8 }}
                    autoSlide
                    interval={5000}
                    scaleActive={1}
                    scaleInactive={0.92}
                >
                    {popularComps.map((comp, idx) => (
                        <div key={idx} className="px-1">
                            <div className="rounded-2xl overflow-hidden border border-app bg-surface focus-within:outline-none">
                                <CompCard
                                    comp={comp}
                                    characters={
                                        topChars /* 프리뷰용 – 실제에선 전체 캐릭터 map 전달 */
                                    }
                                    title={`Top 조합 #${idx + 1}`}
                                    scale={scale}
                                />
                            </div>
                        </div>
                    ))}
                </Carousel>
            </section>
            <section>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-app">Top 캐릭터</h2>
                    <Link
                        href="/character"
                        className="text-sm text-muted-app hover:text-app"
                    >
                        캐릭터 통계로 이동 →
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {topChars.map((c) => (
                        <Link
                            key={c.id}
                            href={`/characters/${c.id}`}
                            className="card hover:bg-elev-10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={c.imageUrl}
                                    alt={c.name}
                                    className="h-12 w-12 rounded-xl object-cover border border-app"
                                />
                                <div className="min-w-0">
                                    <div className="truncate font-medium text-app">
                                        {c.name}
                                    </div>
                                    <div className="truncate text-[12px] text-muted-app">
                                        {c.weapon}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 grid grid-cols-3 text-center text-[11px] gap-1">
                                <div className="rounded-md bg-muted py-1">
                                    <div className="text-muted-app">승률</div>
                                    <div className="font-semibold text-app">
                                        {formatPercent(c.winRate)}
                                    </div>
                                </div>
                                <div className="rounded-md bg-muted py-1">
                                    <div className="text-muted-app">픽률</div>
                                    <div className="font-semibold text-app">
                                        {formatPercent(c.pickRate)}
                                    </div>
                                </div>
                                <div className="rounded-md bg-muted py-1">
                                    <div className="text-muted-app">MMR</div>
                                    <div className="font-semibold text-app">
                                        {c.mmrGain.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <FeatureTiles
                items={[
                    {
                        key: "patch",
                        title: "패치노트",
                        // 실제 외부 페이지로 교체하세요
                        href: "https://game.naver.com/lounge/Eternal_Return/board/17",
                        external: true,
                        image: "/home/tiles/patch-note.png",
                        accent: "#5CC0FF",
                    },
                    {
                        key: "event",
                        title: "이벤트",
                        // 실제 외부 페이지로 교체하세요
                        href: "https://game.naver.com/lounge/Eternal_Return/board/22",
                        external: true,
                        image: "/home/tiles/event.png",
                        accent: "#FF6B6B",
                    },
                    {
                        key: "story",
                        title: "스토리 위키",
                        caption: "다음 업데이트 예정",
                        // 아직 페이지 미구현 → 링크 비활성 + '공사중' 배지
                        comingSoon: true,
                        image: "/home/tiles/story-under-construction.png", // 공사장 이미지(임시)
                        accent: "#F1C232",
                    },
                ]}
            />
        </div>
    );
}
