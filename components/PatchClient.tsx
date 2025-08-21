"use client";

import { useEffect, useMemo, useState } from "react";
import { PatchNote, ChangeType, PatchKind } from "@/types";
import { fetchPatchNotes } from "@/lib/patch_api";
import PatchFilters from "./PatchFilters";
import { toast } from "sonner";

import PatchCharacterCard from "./PatchCharacterCard";
import { groupCharacterOnly } from "@/lib/patch_transform";

type Tab = "all" | PatchKind; // all / official / hotfix

export default function PatchClient() {
    const [notes, setNotes] = useState<PatchNote[] | null>(null);
    const [loading, setLoading] = useState(false);

    // UI 상태
    const [tab, setTab] = useState<Tab>("all");
    const [q, setQ] = useState("");
    const [types, setTypes] = useState<ChangeType[]>([]); // ["buff","nerf",...]

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
                    // ⭐ 캐릭터만 남김
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

    return (
        <div className="text-white">
            {/* 상단 탭 */}
            <div className="mb-4 flex items-center gap-2">
                <button
                    className={`rounded-xl px-4 py-2 text-sm border ${tab === "all" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"}`}
                    onClick={() => setTab("all")}
                >
                    전체
                </button>
                <button
                    className={`rounded-xl px-4 py-2 text-sm border ${tab === "official" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"}`}
                    onClick={() => setTab("official")}
                >
                    정식 패치
                </button>
                <button
                    className={`rounded-xl px-4 py-2 text-sm border ${tab === "hotfix" ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"}`}
                    onClick={() => setTab("hotfix")}
                >
                    핫픽스
                </button>
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
                        <div
                            key={i}
                            className="rounded-2xl border border-white/10 bg-white/5 h-40 animate-pulse"
                        />
                    ))}
                </div>
            )}

            {!loading &&
                groupedByCharacter &&
                groupedByCharacter.length === 0 && (
                    <div className="mt-10 text-white/60 text-sm">
                        조건에 맞는 캐릭터 변경이 없습니다.
                    </div>
                )}

            {!loading &&
                groupedByCharacter &&
                groupedByCharacter.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedByCharacter.map((g) => (
                            <PatchCharacterCard
                                key={`${g.characterId ?? g.name}`}
                                data={g}
                            />
                        ))}
                    </div>
                )}
        </div>
    );
}
