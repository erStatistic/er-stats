"use client";

import { PatchNote } from "@/types";
import { groupPatchByCharacter } from "@/lib/patch_transform";
import PatchCharacterCard from "./PatchCharacterCard";

export default function PatchCharacterGrid({ notes }: { notes: PatchNote[] }) {
    const grouped = groupPatchByCharacter(notes);
    if (grouped.length === 0) {
        return (
            <div className="mt-6 text-sm text-white/60">
                이번 버전에서 캐릭터 변경이 없습니다.
            </div>
        );
    }
    return (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped.map((g) => (
                <PatchCharacterCard
                    key={`${g.characterId ?? g.name}`}
                    data={g}
                />
            ))}
        </div>
    );
}
