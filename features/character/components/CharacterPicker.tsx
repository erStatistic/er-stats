"use client";

import { useMemo, useState } from "react";
import type { DbCharacterLite } from "@/lib/api";
import { useRouter } from "next/navigation";

type Props = {
    rows: DbCharacterLite[]; // ← DB 목록을 그대로 받음
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    onOpenDetail: (id: number) => void; // visibleRows에 없을 때 상세로 이동
};

export default function CharacterPicker({
    chars,
    iconSize = 72, // 아이콘 크기(조절 가능)
    maxHeight = 420, // 세로 스크롤 높이
    columns = 10, // ✅ 한 줄에 10개
}: {
    chars: Array<{
        id: number;
        nameKr?: string;
        imageUrlMini?: string;
        imageUrlFull?: string;
    }>;
    iconSize?: number;
    maxHeight?: number;
    columns?: number;
}) {
    const router = useRouter();
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return chars.filter((c) => (c.nameKr ?? "").toLowerCase().includes(qq));
    }, [chars, q]);

    return (
        <section className="card overflow-hidden flex flex-col">
            {/* 검색 바 */}
            <div
                className="px-4 pb-2 flex items-center justify-between gap-2 "
                style={{ background: "var(--surface)" }}
            >
                <h3 className="font-semibold text-app">실험체 선택</h3>
                <input
                    className="w-56 rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-app text-app"
                    placeholder="실험체 검색"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            {/* 스크롤 영역 */}
            <div
                className="card px-3 pb-4 overflow-y-auto min-h-0 pr-1"
                style={{ maxHeight }}
            >
                {/* ✅ 10열 고정: repeat(10, 1fr) */}
                <ul
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                >
                    {filtered.map((c) => {
                        const img =
                            c.imageUrlMini || c.imageUrlFull || "/fallback.png";
                        return (
                            <li key={c.id} className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(`/characters/${c.id}`)
                                    }
                                    title={c.nameKr}
                                    aria-label={c.nameKr}
                                    className="group rounded-full border border-app overflow-hidden bg-elev-10 hover:scale-[1.05] transition"
                                    style={{
                                        width: iconSize,
                                        height: iconSize,
                                    }}
                                >
                                    <img
                                        src={img}
                                        alt={c.nameKr || ""}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}
