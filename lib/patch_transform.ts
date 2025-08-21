import { PatchEntry, PatchNote } from "@/types";

export type CharacterPatchSummary = {
    characterId?: number;
    name: string;
    imageUrl: string;
    badges: Array<"buff" | "nerf" | "rework" | "adjust">; // 포함된 변경 타입
    changes: Array<{
        id: string;
        field: string;
        before?: string | number;
        after?: string | number;
        delta?: string;
        type: PatchEntry["changeType"];
        note?: string;
    }>;
};

// 이미지 경로 규칙은 서비스 규칙대로 바꿔도 됩니다.
const charImg = (id?: number) =>
    id ? `/chars/${((id - 1) % 9) + 1}.png` : "/chars/placeholder.png";

/** PatchNote[] -> 캐릭터만 묶어서 카드용 요약 */
export function groupCharacterOnly(
    notes: PatchNote[],
): CharacterPatchSummary[] {
    const byChar = new Map<string, CharacterPatchSummary>();

    const pushChange = (e: PatchEntry) => {
        if (e.targetType !== "character") return; // ⭐ 캐릭터만 남김
        const key = e.targetId ? String(e.targetId) : e.targetName;
        if (!byChar.has(key)) {
            byChar.set(key, {
                characterId: e.targetId,
                name: e.targetName,
                imageUrl: charImg(e.targetId),
                badges: [],
                changes: [],
            });
        }
        const cur = byChar.get(key)!;
        cur.changes.push({
            id: e.id,
            field: e.field,
            before: e.before,
            after: e.after,
            delta: e.delta,
            type: e.changeType,
            note: e.notes,
        });
        if (!cur.badges.includes(e.changeType)) cur.badges.push(e.changeType);
    };

    // 노트들 돌면서 캐릭터 항목만 축적
    notes.forEach((n) => n.entries.forEach(pushChange));

    // 카드 정렬(혼합/리워크/너프/버프/조정)
    const order = (s: CharacterPatchSummary) => {
        if (s.badges.length >= 2) return 0;
        if (s.badges.includes("rework")) return 1;
        if (s.badges.includes("nerf")) return 2;
        if (s.badges.includes("buff")) return 3;
        return 4;
    };
    return Array.from(byChar.values()).sort((a, b) => order(a) - order(b));
}
