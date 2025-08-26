"use client";

import { useMemo, useState } from "react";
import ClusterCard from "./ClusterCard";
import RoleTab from "./RoleTab";

// 서버에서 내려오는 헤더 타입
export type CwDirectoryHeader = {
    clusterId: number;
    label: string;
    role: string;
    counts?: { cws: number; characters: number };
};

type SortKey = "label" | "size";

export default function ClusterDirectoryClient({
    initial,
}: {
    initial: CwDirectoryHeader[];
}) {
    const [q, setQ] = useState("");
    const [role, setRole] = useState<string | "전체">("전체");
    const [sort, setSort] = useState<SortKey>("label");

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return (
            initial
                .filter((c) => role === "전체" || c.role === role)
                // 헤더 단계에서는 라벨만 검색(상세는 카드에서 lazy로 불러옴)
                .filter((c) => (qq ? c.label.toLowerCase().includes(qq) : true))
        );
    }, [initial, role, q]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            if (sort === "size") {
                const aSize = a.counts?.cws ?? a.counts?.characters ?? 0;
                const bSize = b.counts?.cws ?? b.counts?.characters ?? 0;
                return bSize - aSize;
            }
            return a.label.localeCompare(b.label);
        });
        return arr;
    }, [filtered, sort]);

    return (
        <div className="text-app">
            {/* 상단 바 */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <input
                        className="w-56 rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none placeholder:text-muted-app"
                        placeholder="클러스터 검색"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select
                        className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm outline-none"
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                    >
                        <option value="label">라벨순</option>
                        <option value="size">항목 많은 순</option>
                    </select>
                </div>

                {/* 역할 탭 */}
                <div className="flex flex-wrap gap-2">
                    <RoleTab
                        label="전체"
                        active={role === "전체"}
                        onClick={() => setRole("전체")}
                    />
                    {[
                        "탱커",
                        "탱 브루저",
                        "딜 브루저",
                        "암살자",
                        "평원딜",
                        "스증 마법사",
                        "서포터",
                    ].map((r) => (
                        <RoleTab
                            key={r}
                            label={r}
                            active={role === r}
                            onClick={() => setRole(r)}
                        />
                    ))}
                </div>
            </div>

            {/* 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {sorted.map((h) => (
                    <ClusterCard key={h.label} data={h} />
                ))}
            </div>

            {sorted.length === 0 && (
                <div className="mt-10 text-center text-muted-app">
                    조건에 맞는 군집이 없습니다.
                </div>
            )}
        </div>
    );
}
