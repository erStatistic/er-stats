import { CompSuggestion, UserProfile } from "@/types";

// 더미: pair 시너지/solo 강도/cluster 승률
// 실제 서비스에서는 서버에서 계산된 값을 API로 전달받아야 합니다.
const PAIR = new Map<string, number>(); // key "i-j" (정렬된)
const SOLO = new Map<number, number>(); // id -> [0..1] 강도
const CLUSTER_WR = new Map<string, number>(); // "A-B-K" 같은 cluster triad -> wr

const keyPair = (a: number, b: number) => {
    const [x, y] = a < b ? [a, b] : [b, a];
    return `${x}-${y}`;
};

export function seedRecoMock(ids: number[]) {
    // 간단히: id가 클수록 강하게, 가까울수록 시너지 좋게
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        SOLO.set(id, Math.min(1, 0.4 + (id % 10) * 0.05));
        for (let j = i + 1; j < ids.length; j++) {
            const id2 = ids[j];
            const base =
                0.45 + ((10 - Math.abs((id % 10) - (id2 % 10))) / 10) * 0.1; // 0.45 ~ 0.55
            PAIR.set(keyPair(id, id2), base);
        }
    }
    // cluster 평균은 대충 0.48~0.56 사이
    ["A-B-K", "A-A-K", "B-K-N", "C-K-A", "A-N-O"].forEach((k, idx) => {
        CLUSTER_WR.set(k, 0.5 + ((idx % 5) - 2) * 0.02);
    });
}

type Candidate = {
    comp: number[];
    score: number;
    parts: { pair: number; solo: number; cluster: number };
    modeled: boolean;
};

export function recommendCompsForUser(
    user: UserProfile,
    universe: number[],
    opts?: { topK?: number },
): CompSuggestion[] {
    const topK = opts?.topK ?? 5;
    // 후보군: 유저 top3을 중심으로, 그들과 pair 시너지가 높은 애들 섞어서 생성 (프리뷰용 단순 생성)
    const anchors = user.topChars.map((c) => c.id);
    const pool = Array.from(new Set([...anchors, ...universe])).slice(0, 20); // 제한

    const cand: Candidate[] = [];
    for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
            for (let k = j + 1; k < pool.length; k++) {
                const comp = [pool[i], pool[j], pool[k]];
                // 점수 = pair 평균 + solo 평균 + cluster prior (모델링)
                const p =
                    (PAIR.get(keyPair(comp[0], comp[1])) ??
                        0.5 + PAIR.get(keyPair(comp[0], comp[2])) ??
                        0.5 + PAIR.get(keyPair(comp[1], comp[2])) ??
                        0.5) / 3;
                const s =
                    (SOLO.get(comp[0]) ??
                        0.5 + SOLO.get(comp[1]) ??
                        0.5 + SOLO.get(comp[2]) ??
                        0.5) / 3;
                // 클러스터 prior은 없음 → 0.5로 근사 (백엔드 붙이면 실제 cluster로 교체)
                const c = 0.5;

                const score = 0.5 * p + 0.3 * s + 0.2 * c;
                cand.push({
                    comp,
                    score,
                    parts: { pair: p, solo: s, cluster: c },
                    modeled: true,
                });
            }
        }
    }
    cand.sort((a, b) => b.score - a.score);
    const top = cand.slice(0, topK);
    return top.map((x) => ({
        comp: x.comp,
        winRateEst: Math.min(0.65, Math.max(0.45, x.score)), // 프리뷰 표기 범위 클램프
        pickRateEst: 0.03 + Math.random() * 0.04, // 임시
        mmrGainEst: 6.0 + (x.score - 0.5) * 20, // 임시 스케일
        support: {
            fromPairs: x.parts.pair,
            fromSolo: x.parts.solo,
            fromCluster: x.parts.cluster,
            modeled: x.modeled,
        },
        note: "pair·solo 기반 추정 (프리뷰)",
    }));
}
