// components/HomeDashboard.tsx
"use client";

import Link from "next/link";
import Carousel from "@/features/ui/Carousel";
import CompCard from "./CompCard";
import { CharacterSummary, CompSummary, PatchNote } from "@/types";
import { formatPercent } from "@/lib/stats";

export default function HomeDashboard({
    latestPatch,
    topChars,
    popularComps,
}: {
    latestPatch: PatchNote;
    topChars: CharacterSummary[];
    popularComps: CompSummary[];
}) {
    return (
        <div className="space-y-8">
            {/* 1) 최신 패치 하이라이트 */}
            <section className="card overflow-hidden p-0">
                <header
                    className={
                        "px-4 py-3 text-white " +
                        (latestPatch.kind === "official"
                            ? "bg-gradient-to-r from-sky-600 to-indigo-600"
                            : "bg-gradient-to-r from-amber-600 to-rose-600")
                    }
                >
                    <div className="flex items-center justify-between">
                        <div className="font-bold">
                            {latestPatch.title ??
                                (latestPatch.kind === "official"
                                    ? "정식 패치"
                                    : "핫픽스")}{" "}
                            — {latestPatch.version}
                        </div>
                        <div className="text-sm/none opacity-90">
                            {latestPatch.date}
                        </div>
                    </div>
                </header>

                <div className="p-4">
                    <div className="mb-2 text-sm text-muted-app">주요 변경</div>
                    <ul className="space-y-2">
                        {latestPatch.entries.slice(0, 3).map((e) => (
                            <li key={e.id} className="flex items-center gap-3">
                                <span
                                    className={
                                        "text-[11px] px-2 py-0.5 rounded-full border " +
                                        (e.changeType === "buff"
                                            ? "border-emerald-400/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                                            : e.changeType === "nerf"
                                              ? "border-rose-400/40 text-rose-700 dark:text-rose-300 bg-rose-500/10"
                                              : e.changeType === "rework"
                                                ? "border-amber-400/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
                                                : "border-sky-400/40 text-sky-700 dark:text-sky-300 bg-sky-500/10")
                                    }
                                >
                                    {e.changeType === "buff"
                                        ? "버프"
                                        : e.changeType === "nerf"
                                          ? "너프"
                                          : e.changeType === "rework"
                                            ? "리워크"
                                            : "조정"}
                                </span>
                                <span className="truncate text-app">
                                    <b>{e.targetName}</b> · {e.field}{" "}
                                    {e.delta ? `(${e.delta})` : ""}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4">
                        <Link
                            href="/patches"
                            className="inline-block rounded-lg border border-app bg-surface px-3 py-2 text-sm text-app hover:bg-elev-10"
                        >
                            패치 상세 보기 →
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2) Top 캐릭터 5 (간단 카드 스트립) */}
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

            {/* 3) 인기 조합 3 (캐러셀) */}
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
                                    characters={topChars}
                                    title={`Top 조합 #${idx + 1}`}
                                />
                            </div>
                        </div>
                    ))}
                </Carousel>
            </section>
        </div>
    );
}
