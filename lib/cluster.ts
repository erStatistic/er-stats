import { ClusterMeta, Role } from "@/types";

// 1) 클러스터→역할 매핑 (예시)
//    실제 정책에 맞게 여기서만 바꿔주면 전체 UI 반영됩니다.
export const CLUSTER_ROLE: Record<string, Role> = {
    A: "탱커",
    B: "브루저",
    C: "탱커",
    D: "브루저",
    E: "기타",
    F: "브루저",
    G: "브루저",
    H: "서포터",
    I: "컨트롤",
    J: "원딜",
    K: "원딜",
    L: "원딜",
    M: "기타",
    N: "탱커",
    O: "탱커",
    P: "탱커",
    Q: "탱커",
    R: "컨트롤",
    S: "컨트롤",
    T: "컨트롤",
    U: "서포터",
};

// 2) 컬러 팔레트 (역할 또는 라벨 기준)
export const CLUSTER_COLOR: Record<string, string> = {
    A: "#7C3AED",
    B: "#0EA5E9",
    C: "#22C55E",
    D: "#F59E0B",
    E: "#10B981",
    F: "#6366F1",
    G: "#EF4444",
    H: "#14B8A6",
    I: "#84CC16",
    J: "#F97316",
    K: "#E879F9",
    L: "#60A5FA",
    M: "#34D399",
    N: "#A78BFA",
    O: "#F43F5E",
    P: "#06B6D4",
    Q: "#D946EF",
    R: "#FB923C",
    S: "#4ADE80",
    T: "#93C5FD",
    U: "#FCA5A5",
};

// 3) 목 캐릭터 (실제에선 API에서 join해서 내려주면 됨)
const mockNames = (seed: number, n: number) =>
    Array.from({ length: n }).map((_, i) => ({
        id: seed * 1000 + i + 1,
        name: `실험체 ${seed}-${i + 1}`,
        imageUrl: `/chars/${((seed + i) % 9) + 1}.png`,
    }));

// 4) 주신 no,kmeans를 압축해서 라벨만 사용 (실제에선 서버에서 join)
//    아래는 데모용으로 각 라벨별 캐릭터 몇 명만 배치.
const LABELS = [
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "A", // 15
    "B",
    "B",
    "B",
    "B",
    "B",
    "B",
    "B",
    "B",
    "B",
    "B",
    "B",
    "B", // 12
    "C",
    "C",
    "C",
    "C",
    "C",
    "C", // 6
    "D",
    "D",
    "D",
    "D", // 4
    "E", // 1
    "F",
    "F", // 2
    "G", // 1
    "H",
    "H", // 2
    "I",
    "I",
    "I",
    "I",
    "I",
    "I", // 6
    "J",
    "J",
    "J", // 3
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K",
    "K", // 15
    "L",
    "L", // 2
    "M", // 1
    "N",
    "N",
    "N",
    "N",
    "N",
    "N",
    "N", // 7
    "O",
    "O",
    "O",
    "O",
    "O", // 5
    "P",
    "P",
    "P",
    "P", // 4
    "Q",
    "Q", // 2
    "R",
    "R",
    "R",
    "R", // 4
    "S", // 1
    "T", // 1
    "U",
    "U",
    "U",
    "U",
    "U",
    "U",
    "U", // 7
];

export function makeClusterDirectory(): ClusterMeta[] {
    // 라벨별로 캐릭터 묶기(데모: 라벨당 캐릭터 3~8명)
    const byLabel: Record<string, ClusterMeta> = {};
    let gid = 1;
    for (const lab of LABELS) {
        if (!byLabel[lab]) {
            byLabel[lab] = {
                label: lab,
                role: CLUSTER_ROLE[lab] ?? "기타",
                characters: [],
            };
        }
        // 각 라벨에 더미 캐릭터 한 명 추가
        byLabel[lab].characters.push({
            id: gid,
            name: `실험체 ${gid}`,
            imageUrl: `/chars/${gid % 9 || 1}.png`,
        });
        gid++;
    }
    return Object.values(byLabel).sort((a, b) =>
        a.label.localeCompare(b.label),
    );
}

export const ROLES: Role[] = [
    "탱커",
    "브루저",
    "암살자",
    "원딜",
    "서포터",
    "컨트롤",
    "기타",
];
