"use client";

import { useMemo, useState } from "react";
import { ClusterMeta, Role } from "@/types";
import { ROLES } from "@/lib/cluster";
import ClusterCard from "./ClusterCard";

type SortKey = "label" | "size";

export default function ClusterDirectoryClient({
    initial,
}: {
    initial: ClusterMeta[];
}) {
    const [q, setQ] = useState("");
    const [role, setRole] = useState<Role | "전체">("전체");
    const [sort, setSort] = useState<SortKey>("label");

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        return initial
            .filter((c) => role === "전체" || c.role === role)
            .filter(
                (c) =>
                    !qq ||
                    c.label.toLowerCase().includes(qq) ||
                    c.characters.some((x) => x.name.toLowerCase().includes(qq)),
            );
    }, [initial, role, q]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        arr.sort((a, b) => {
            if (sort === "size")
                return b.characters.length - a.characters.length;
            return a.label.localeCompare(b.label);
        });
        return arr;
    }, [filtered, sort]);

    return (
        <div className="text-white">
            {/* 상단 바: 검색 + 역할 탭 + 정렬 */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <input
                        className="w-56 rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none placeholder-white/50"
                        placeholder="클러스터 / 캐릭터 검색"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select
                        className="rounded-xl bg-[#16223C] px-3 py-2 text-sm outline-none"
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                    >
                        <option value="label">라벨순</option>
                        <option value="size">캐릭터 많은 순</option>
                    </select>
                </div>

                {/* 역할 탭 */}
                <div className="flex flex-wrap gap-2">
                    <RoleTab
                        label="전체"
                        active={role === "전체"}
                        onClick={() => setRole("전체")}
                    />
                    {ROLES.map((r) => (
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
                {sorted.map((c) => (
                    <ClusterCard key={c.label} data={c} />
                ))}
            </div>

            {sorted.length === 0 && (
                <div className="mt-10 text-center text-white/60">
                    조건에 맞는 군집이 없습니다.
                </div>
            )}
        </div>
    );
}

function RoleTab({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full border px-3 py-1 text-xs ${
                active
                    ? "bg-white/15 border-white/30"
                    : "bg-[#16223C] border-white/10 hover:bg-white/10"
            }`}
        >
            {label}
        </button>
    );
}
