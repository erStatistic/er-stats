// /lib/reco_multi.ts
import { CompSuggestion, UserProfile } from "@/types";

// ------ 프리뷰용 시너지/강도 가짜 매트릭스 ------
const PAIR = new Map<string, number>(); // "i-j" (i<j) -> [0.45..0.60]
const SOLO = new Map<number, number>(); // id -> [0.40..0.90]

const pairKey = (a: number, b: number) => {
    const [x, y] = a < b ? [a, b] : [b, a];
    return `${x}-${y}`;
};

export function seedRecoMockFor(ids: number[]) {
    // 간단 규칙: id가 비슷할수록 시너지↑, id 끝자리가 클수록 solo↑
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const solo = 0.4 + (id % 10) * 0.05; // 0.40 ~ 0.90
        SOLO.set(id, Math.min(0.9, solo));
        for (let j = i + 1; j < ids.length; j++) {
            const id2 = ids[j];
            const dist = Math.abs((id % 10) - (id2 % 10));
            const base = 0.47 + ((10 - dist) / 10) * 0.13; // 0.47 ~ 0.60
            PAIR.set(pairKey(id, id2), Math.max(0.47, Math.min(0.6, base)));
        }
    }
}

// ------ 점수 함수 ------
function scoreTriad(a: number, b: number, c: number) {
    const p1 = PAIR.get(pairKey(a, b)) ?? 0.5;
    const p2 = PAIR.get(pairKey(a, c)) ?? 0.5;
    const p3 = PAIR.get(pairKey(b, c)) ?? 0.5;
    const pairMean = (p1 + p2 + p3) / 3;

    const s1 = SOLO.get(a) ?? 0.5;
    const s2 = SOLO.get(b) ?? 0.5;
    const s3 = SOLO.get(c) ?? 0.5;
    const soloMean = (s1 + s2 + s3) / 3;

    // 클러스터 prior은 서버 연결 전까지 0.5 고정(프리뷰)
    const clusterPrior = 0.5;

    // 가중 합 (나중에 서버에서 튜닝)
    const score = 0.55 * pairMean + 0.3 * soloMean + 0.15 * clusterPrior;

    return {
        score,
        parts: { pair: pairMean, solo: soloMean, cluster: clusterPrior },
    };
}

// ------ 후보 생성기 ------
type Opts = { topK?: number; poolLimit?: number };

export function recommendForUsers(
    users: UserProfile[], // 0~3명
    universeIds: number[], // 보완용 풀
    { topK = 10, poolLimit = 24 }: Opts = {},
): CompSuggestion[] {
    const uniq = (arr: number[]) => Array.from(new Set(arr));
    const anchors: number[][] = users.map((u) =>
        uniq(u.topChars.map((x) => x.id)).slice(0, 3),
    );
    const pool = uniq([...anchors.flat(), ...universeIds.slice(0, poolLimit)]);

    const N = users.length;
    const cands: {
        comp: [number, number, number];
        s: number;
        parts: { pair: number; solo: number; cluster: number };
    }[] = [];

    const addCand = (a: number, b: number, c: number) => {
        if (a === b || a === c || b === c) return;
        const { score, parts } = scoreTriad(a, b, c);
        cands.push({ comp: [a, b, c], s: score, parts });
    };

    if (N >= 3) {
        // 정확히 각 유저에서 1명씩
        for (const a of anchors[0])
            for (const b of anchors[1])
                for (const c of anchors[2]) addCand(a, b, c);
    } else if (N === 2) {
        // 각 유저에서 최소 1명씩 + 나머지 1명은 pool에서
        for (const a of anchors[0])
            for (const b of anchors[1]) {
                for (const c of pool) addCand(a, b, c);
            }
    } else if (N === 1) {
        // 유저 Top3에서 최소 1명 포함 + 나머지 2명은 pool
        for (const a of anchors[0]) {
            for (let i = 0; i < pool.length; i++) {
                for (let j = i + 1; j < pool.length; j++)
                    addCand(a, pool[i], pool[j]);
            }
        }
    } else {
        // 유저가 없으면 전체 pool로 추천 (fallback)
        for (let i = 0; i < pool.length; i++)
            for (let j = i + 1; j < pool.length; j++)
                for (let k = j + 1; k < pool.length; k++)
                    addCand(pool[i], pool[j], pool[k]);
    }

    cands.sort((x, y) => y.s - x.s);
    const top = cands.slice(0, topK);

    // 프리뷰용 표기 스케일
    return top.map((t) => ({
        comp: t.comp,
        winRateEst: Math.max(0.45, Math.min(0.68, t.s)),
        pickRateEst: 0.03 + (t.s - 0.5) * 0.1, // 대충 2~4%대
        mmrGainEst: 6.0 + (t.s - 0.5) * 22, // 6±
        support: {
            fromPairs: t.parts.pair,
            fromSolo: t.parts.solo,
            fromCluster: t.parts.cluster,
            modeled: true,
        },
        note:
            N >= 3
                ? "각 유저 Top3에서 1명씩 선택"
                : N === 2
                  ? "각 유저 1명 포함 + 보완 1명"
                  : N === 1
                    ? "유저 Top3 포함 + 보완 2명"
                    : "풀 기반 추천",
    }));
}
