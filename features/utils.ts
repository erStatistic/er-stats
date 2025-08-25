import { TIER_COLOR } from "@/features/constants";
export function getTierColor(tier?: string) {
    return TIER_COLOR[tier ?? ""] ?? TIER_COLOR["C"];
}
