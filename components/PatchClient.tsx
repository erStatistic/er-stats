// components/PatchClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PatchNote, ChangeType, PatchKind } from "@/types";
import { fetchPatchNotes } from "@/lib/patch_api";
import PatchFilters from "./PatchFilters";
import { toast } from "sonner";
import PatchCharacterCard from "./PatchCharacterCard";
import { groupCharacterOnly } from "@/lib/patch_transform";

type Tab = "all" | PatchKind; // "all" | "official" | "hotfix"

const TABS: { value: Tab; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "official", label: "정식 패치" },
    { value: "hotfix", label: "핫픽스" },
];

export default function PatchClient() {
    const [notes, setNotes] = useState<PatchNote[] | null>(null);
    const [loading, setLoading] = useState(false);

    // UI 상태
    const [tab, setTab] = useState<Tab>("all");
    const [q, setQ] = useState("");
    const [types, setTypes] = useState<ChangeType[]>([]); // ["buff","nerf","adjust","rework"]

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setNotes(null);
                const data = await fetchPatchNotes();
                if (!cancelled) setNotes(data);
            } catch {
                toast.error("패치 노트를 불러오지 못했어요.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // 1) 탭(정식/핫픽스/전체) → 2) 검색/유형 → 3) 캐릭터만 그룹핑
    const groupedByCharacter = useMemo(() => {
        if (!notes) return null;
        const term = q.trim().toLowerCase();

        const byTab = notes.filter((n) =>
            tab === "all" ? true : n.kind === tab,
        );

        const byEntry = byTab
            .map((n) => ({
                ...n,
                entries: n.entries.filter((e) => {
                    // 캐릭터 항목만
                    if (e.targetType !== "character") return false;

                    const okType =
                        types.length === 0 || types.includes(e.changeType);
                    const okQ =
                        !term ||
                        e.targetName.toLowerCase().includes(term) ||
                        e.field.toLowerCase().includes(term) ||
                        (e.notes?.toLowerCase().includes(term) ?? false);
                    return okType && okQ;
                }),
            }))
            .filter((n) => n.entries.length > 0);

        return groupCharacterOnly(byEntry);
    }, [notes, tab, q, types]);

    // 탭 키보드 네비게이션 (←/→)
    const onTabsKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const idx = TABS.findIndex((t) => t.value === tab);
            const nextIdx =
                e.key === "ArrowRight"
                    ? (idx + 1) % TABS.length
                    : (idx - 1 + TABS.length) % TABS.length;
            setTab(TABS[nextIdx].value);
        },
        [tab],
    );

    return (
        <div className="text-app">
            {/* 상단 탭 */}
            <div
                role="tablist"
                aria-label="패치 종류"
                onKeyDown={onTabsKeyDown}
                className="mb-4 flex flex-wrap gap-2 p-1 rounded-xl border border-app"
                style={{ background: "var(--muted)" }}
            >
                {TABS.map(({ value, label }) => {
                    const active = tab === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setTab(value)}
                            className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border transition-colors focus:outline-none"
                            style={{
                                background: active
                                    ? "var(--brand)"
                                    : "var(--surface)",
                                color: active ? "#fff" : "var(--text)",
                                borderColor: active
                                    ? "color-mix(in oklab, var(--brand) 40%, transparent)"
                                    : "var(--border)",
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    (e.currentTarget.style.background as any) =
                                        "var(--surface-2)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    (e.currentTarget.style.background as any) =
                                        "var(--surface)";
                                }
                            }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* 검색/유형 필터 */}
            <PatchFilters
                q={q}
                onChangeQ={setQ}
                selectedTypes={types}
                onToggleType={(t) =>
                    setTypes((prev) =>
                        prev.includes(t)
                            ? prev.filter((x) => x !== t)
                            : [...prev, t],
                    )
                }
            />

            {/* 리스트 상태 */}
            {loading && (
                <div className="mt-6 grid gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card h-40 animate-pulse" />
                    ))}
                </div>
            )}

            {!loading &&
                groupedByCharacter &&
                groupedByCharacter.length === 0 && (
                    <div className="mt-10 text-sm text-muted-app">
                        조건에 맞는 캐릭터 변경이 없습니다.
                    </div>
                )}

            {!loading &&
                groupedByCharacter &&
                groupedByCharacter.length > 0 && (
                    <div
                        className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        role="list"
                        aria-label="캐릭터별 밸런스 변경 카드 목록"
                    >
                        {groupedByCharacter.map((g) => (
                            <div
                                key={`${g.characterId ?? g.name}`}
                                role="listitem"
                            >
                                <PatchCharacterCard data={g} />
                            </div>
                        ))}
                    </div>
                )}
        </div>
    );
}
