import { CharacterSummary } from "@/types";
import { GameTier } from "@/features/types";
import { GAME_TIERS } from "@/features";

export function getRankTier(r: CharacterSummary): GameTier {
    const labels = GAME_TIERS as readonly string[];
    if (r.rankTier && labels.includes(r.rankTier))
        return r.rankTier as GameTier;
    const idx = r.id % (labels.length - 1); // All 제외
    return labels[idx + 1] as GameTier;
}
