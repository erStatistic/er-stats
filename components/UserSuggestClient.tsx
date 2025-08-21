"use client";

import { useMemo, useState } from "react";
import { UserProfile } from "@/types";
import CompSuggestionCard from "@/components/CompSuggestionCard";
import { recommendCompsForUser, seedRecoMock } from "@/lib/reco";

type Character = { id: number; name: string; imageUrl?: string };

// 데모용 유니버스(캐릭터 id 집합)
const UNIVERSE: Character[] = Array.from({ length: 24 }).map((_, i) => ({
    id: i + 1,
    name: `실험체 ${i + 1}`,
    imageUrl: `/chars/${(i % 9) + 1}.png`,
}));

seedRecoMock(UNIVERSE.map((x) => x.id)); // 프리뷰용 시드

// 가짜 유저 조회 (나중에 API로 교체)
async function fetchUserProfileMock(name: string): Promise<UserProfile | null> {
    if (!name.trim()) return null;
    const idx = Math.abs(hash(name)) % UNIVERSE.length;
    const top = [
        UNIVERSE[idx],
        UNIVERSE[(idx + 3) % UNIVERSE.length],
        UNIVERSE[(idx + 7) % UNIVERSE.length],
    ];
    return {
        name,
        topChars: top.map((t) => ({
            id: t.id,
            name: t.name,
            imageUrl: t.imageUrl,
        })),
    };
}

function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

export default function UserSuggestClient() {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const nameById = (id: number) =>
        UNIVERSE.find((x) => x.id === id)?.name || `ID ${id}`;

    const suggestions = useMemo(() => {
        if (!user) return [];
        return recommendCompsForUser(
            user,
            UNIVERSE.map((x) => x.id),
            { topK: 5 },
        );
    }, [user]);

    const onSearch = async () => {
        setError(null);
        setLoading(true);
        try {
            const res = await fetchUserProfileMock(q);
            if (!res) {
                setUser(null);
                setError("닉네임을 입력해 주세요.");
            } else setUser(res);
        } catch (e: any) {
            setError("유저 정보를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-white">
            {/* 검색바 */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <input
                    className="w-64 rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none placeholder-white/50"
                    placeholder="유저 닉네임"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSearch();
                    }}
                />
                <button
                    onClick={onSearch}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
                    disabled={loading}
                >
                    {loading ? "검색 중..." : "검색"}
                </button>
            </div>

            {/* 유저 Top3 */}
            {user && (
                <div className="mb-3">
                    <div className="text-sm text-white/70 mb-2">
                        {user.name}님의 최근 플레이 Top3
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.topChars.map((ch) => (
                            <span
                                key={ch.id}
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0E1422] px-2.5 py-1.5"
                            >
                                <img
                                    src={ch.imageUrl}
                                    alt={ch.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                                <span className="text-xs">{ch.name}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* 추천 결과 */}
            {user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((s, i) => (
                        <CompSuggestionCard key={i} s={s} nameById={nameById} />
                    ))}
                </div>
            )}

            {!user && !loading && !error && (
                <div className="mt-10 text-white/60 text-sm">
                    닉네임으로 검색하면 추천 조합을 보여드립니다.
                </div>
            )}
            {error && <div className="mt-3 text-rose-300 text-sm">{error}</div>}
        </div>
    );
}
