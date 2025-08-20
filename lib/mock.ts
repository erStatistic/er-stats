import { Build, CharacterSummary, TeamComp, WeaponStat } from "@/types";

export const WEAPONS = ["Axe", "Pistol", "Bow", "Rapier", "Spear"] as const;
export const TIERS = ["S", "A", "B", "C"] as const;

const VARIANT_STORE: Map<number, WeaponStat[]> = new Map();

function makeVariants(
    baseWeapon: string,
    base: { winRate: number; pickRate: number; mmrGain: number },
    count = 2,
): WeaponStat[] {
    const others = WEAPONS.filter((w) => w !== baseWeapon);
    const out: WeaponStat[] = [{ weapon: baseWeapon, ...base }];
    for (let i = 0; i < count; i++) {
        const w =
            others[(i * 2 + Math.floor(base.winRate * 100)) % others.length];
        const winRate = Math.max(
            0.35,
            Math.min(0.65, base.winRate + (i % 2 === 0 ? 0.03 : -0.02)),
        );
        const pickRate = Math.max(
            0.005,
            Math.min(0.15, base.pickRate * (i % 2 === 0 ? 0.8 : 1.2)),
        );
        const mmrGain = Math.max(
            1,
            Math.min(18, base.mmrGain + (i % 2 === 0 ? 1.1 : -0.7)),
        );
        out.push({ weapon: w, winRate, pickRate, mmrGain });
    }
    return out;
}

export function makeMock(
    n = 36,
    rng: () => number = Math.random,
): CharacterSummary[] {
    const arr: CharacterSummary[] = [];
    for (let i = 0; i < n; i++) {
        const winRate = 0.4 + rng() * 0.2;
        const pickRate = 0.01 + rng() * 0.1;
        const mmrGain = 3 + rng() * 12;
        const id = i + 1;
        const primaryWeapon = WEAPONS[i % WEAPONS.length];
        const primary = { winRate, pickRate, mmrGain };
        VARIANT_STORE.set(id, makeVariants(primaryWeapon, primary, 2));
        arr.push({
            id,
            name: `Experimenter ${id}`,
            weapon: primaryWeapon,
            winRate,
            pickRate,
            mmrGain,
            tier: TIERS[i % TIERS.length],
            imageUrl: `https://picsum.photos/seed/er-${id}/160/160`,
        });
    }
    return arr;
}

export function getVariants(
    charId: number,
    fallback: WeaponStat,
): WeaponStat[] {
    return VARIANT_STORE.get(charId) ?? [fallback];
}

export function mockBuildsFor(charId: number, weapon?: string): Build[] {
    const base = (charId + (weapon ? weapon.length : 0)) % 3;
    return [0, 1, 2].map((i) => ({
        id: `${charId}-${weapon || "any"}-b${i}`,
        title: `${weapon ? `[${weapon}] ` : ""}추천 빌드 #${i + 1}`,
        description:
            base === i
                ? "안정적인 운영형"
                : i === 1
                  ? "공격적인 고위험 고수익"
                  : "균형 잡힌 범용",
        items: ["장비A", "장비B", "장비C", "장비D"].slice(
            0,
            3 + ((charId + i) % 2),
        ),
    }));
}

export function mockTeamsFor(charId: number, weapon?: string): TeamComp[] {
    const len = weapon ? Math.max(2, Math.min(3, (weapon.length % 3) + 2)) : 3;
    const pick = (k: number) =>
        Array.from({ length: k }).map((_, i) => {
            const id = ((charId * 7 + i * 3) % 36) + 1;
            return { id, name: `Exp ${id}` };
        });
    return [
        {
            id: `${charId}-${weapon || "any"}-t1`,
            title: `${weapon ? `[${weapon}] ` : ""}라인 밸런스 조합`,
            members: pick(len - 1),
            note: "초중반 교전 강함",
        },
        {
            id: `${charId}-${weapon || "any"}-t2`,
            title: `${weapon ? `[${weapon}] ` : ""}후반 캐리 조합`,
            members: pick(len),
            note: "오브젝트 한타 특화",
        },
    ];
}
