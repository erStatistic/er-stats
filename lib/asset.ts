// 간단 매핑: 실서비스에서는 DB에서 slug나 id로 해석하세요.
const CHAR_IMG = (id?: number) =>
    id ? `/chars/${((id - 1) % 9) + 1}.png` : "/chars/placeholder.png";
const WEAPON_IMG = (name: string) => `/weapons/${name}.png`; // 필요 시 스네이크/슬러그 처리

export function patchTargetImage(entry: {
    targetType: "character" | "weapon" | "system";
    targetId?: number;
    targetName: string;
}) {
    if (entry.targetType === "character") return CHAR_IMG(entry.targetId);
    if (entry.targetType === "weapon") return WEAPON_IMG(entry.targetName);
    return SYSTEM_IMG(entry.targetName);
}
