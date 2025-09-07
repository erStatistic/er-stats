"use client";

import React from "react";
import { CompSummary, CharacterSummary } from "@/types";
import StatBlock from "./StatBlock";

// 아주 작은 SVG 폴백
const FALLBACK_AVATAR =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23232a3a"/><circle cx="48" cy="40" r="18" fill="%23354463"/><rect x="22" y="62" width="52" height="22" rx="11" fill="%23354463"/></svg>';

type MemberView = {
    key: string | number;
    name: string;
    charSrc: string;
    weaponSrc?: string;
};

function safeImgOnError(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.src !== FALLBACK_AVATAR) img.src = FALLBACK_AVATAR;
}

function AvatarWithWeapon({
    charSrc,
    weaponSrc,
    size = 56,
    dot = 18,
}: {
    charSrc: string;
    weaponSrc?: string;
    size?: number;
    dot?: number;
}) {
    return (
        <div
            className="relative rounded-full border"
            style={{
                width: size,
                height: size,
                borderColor: "var(--border)",
                background: "var(--surface)",
            }}
        >
            <img
                src={charSrc || FALLBACK_AVATAR}
                alt=""
                className="w-full h-full object-cover rounded-full"
                onError={safeImgOnError}
            />
            {weaponSrc ? (
                <div
                    className="absolute right-0 bottom-0 rounded-full border-2 shadow"
                    style={{
                        width: dot,
                        height: dot,
                        backgroundColor: "#000",
                        borderColor: "var(--surface)",
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    <img
                        src={weaponSrc}
                        alt=""
                        className="rounded-full"
                        style={{
                            width: Math.round(dot * 0.78),
                            height: Math.round(dot * 0.78),
                            objectFit: "contain",
                        }}
                        onError={safeImgOnError}
                    />
                </div>
            ) : null}
        </div>
    );
}

function pickFirst<T>(...vals: (T | null | undefined)[]) {
    for (const v of vals) if (v !== undefined && v !== null) return v;
    return undefined;
}

function toMembers(
    comp: CompSummary | any,
    characters: CharacterSummary[],
): MemberView[] {
    if (Array.isArray(comp?.members) && comp.members.length > 0) {
        return comp.members.slice(0, 3).map((m: any, i: number) => ({
            key: pickFirst<number>(m.cw_id) ?? `m-${i}`,
            name:
                pickFirst<string>(m.character_name_kr, m.nameKr, m.name) ??
                "#undefined",
            charSrc:
                pickFirst<string>(m.image_url_mini, m.image, m.charSrc) ??
                FALLBACK_AVATAR,
            weaponSrc: pickFirst<string>(
                m.weapon_image_url,
                m.weaponImage,
                m.weaponSrc,
            ),
        }));
    }
    if (Array.isArray(comp?.comp)) {
        return comp.comp.slice(0, 3).map((id: number, i: number) => {
            const c = characters.find((x) => x.id === id);
            return {
                key: id ?? `i-${i}`,
                name: c?.name ?? "#undefined",
                charSrc: c?.imageUrl ?? FALLBACK_AVATAR,
                weaponSrc: undefined,
            };
        });
    }
    return [];
}

type Scale = {
    maxWin: number;
    maxPick: number;
    maxMmr: number;
    maxCount: number;
};

interface CompCardProps {
    comp: CompSummary | any;
    characters: CharacterSummary[];
    title?: string;
    /** 인기 조합 묶음에서 계산한 최댓값들(상대 비교용) */
    scale?: Scale;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 막대가 너무 안 보이지 않도록 최소 길이(floor) 적용 */
const withFloor = (v: number, floor = 0.06) =>
    v <= 0 ? 0 : Math.max(floor, v);

export default function CompCard({
    comp,
    characters,
    title = "Top Team",
    scale,
}: CompCardProps) {
    const members = toMembers(comp, characters);

    // 지표 이름 매핑(신/구 포맷 모두 허용)
    const winRate = pickFirst<number>(comp.win_rate, comp.winRate) ?? 0;
    const pickRate = pickFirst<number>(comp.pick_rate, comp.pickRate) ?? 0;
    const mmr = pickFirst<number>(comp.avg_mmr, comp.mmrGain) ?? 0;
    const count = pickFirst<number>(comp.samples, comp.count) ?? 0;

    // 상대 비교(최댓값 대비 정규화)
    const nWin = withFloor(
        clamp01(scale?.maxWin ? winRate / scale.maxWin : winRate),
    );
    const nPick = withFloor(
        clamp01(scale?.maxPick ? pickRate / scale.maxPick : pickRate),
    );
    const nMmr = withFloor(
        clamp01(scale?.maxMmr ? mmr / scale.maxMmr : mmr / 20),
    ); // 이전 로직 /20 폴백
    const nCnt = withFloor(
        clamp01(scale?.maxCount ? count / scale.maxCount : count / 500),
    ); // 이전 로직 /500 폴백

    return (
        <article
            className="
        card w-[min(92vw,560px)] p-0 overflow-hidden
        shadow-[0_10px_30px_rgba(0,0,0,0.15)]
        transition-transform duration-300 hover:-translate-y-0.5
      "
        >
            {/* 상단 배너 */}
            <header className="comp-banner px-4 sm:px-6 py-3 sm:py-4 text-center">
                <h3 className="text-base sm:text-lg font-bold tracking-wide">
                    {title}
                </h3>
            </header>

            {/* 캐릭터 3명 + 무기 아이콘 */}
            <div className="flex items-end justify-center gap-4 sm:gap-6 px-4 sm:px-6 py-6 bg-muted">
                {members.map((m, idx) => {
                    const big = idx === 1; // 가운데 강조
                    const size = big ? 84 : 64;
                    const dot = big ? 24 : 20;
                    return (
                        <div
                            key={m.key ?? `${idx}-${m.name}`}
                            className="flex flex-col items-center"
                        >
                            <AvatarWithWeapon
                                charSrc={m.charSrc}
                                weaponSrc={m.weaponSrc}
                                size={size}
                                dot={dot}
                            />
                            <p className="mt-2 text-[11px] sm:text-xs text-muted-app max-w-[10ch] truncate">
                                {m.name}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* 수치 영역 */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-surface text-app">
                <StatBlock
                    label="승률"
                    value={`${(winRate * 100).toFixed(1)}%`}
                    barValue={nWin}
                    barClass="bg-green-500"
                />
                <StatBlock
                    label="픽률"
                    value={`${(pickRate * 100).toFixed(2)}%`}
                    barValue={nPick}
                    barClass="bg-blue-500"
                />
                <StatBlock
                    label="평균 MMR"
                    value={mmr.toFixed(1)}
                    barValue={nMmr}
                    barClass="bg-purple-500"
                />
                <StatBlock
                    label="게임 수"
                    value={count.toLocaleString()}
                    barValue={nCnt}
                    barClass="bg-amber-400"
                />
            </section>
        </article>
    );
}
