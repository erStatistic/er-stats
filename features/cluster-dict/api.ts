// import { z } from "zod";
//
// // ── 백엔드 응답 스키마(유연하게: 필요한 필드만 검증)
// const Character = z
//     .object({
//         id: z.number(),
//         nameKr: z.string().optional(),
//         name: z.string().optional(),
//         imageUrlMini: z.string().url().optional().nullable(),
//     })
//     .passthrough();
// const CharacterList = z.array(Character);
//
// const Position = z
//     .object({
//         id: z.number(),
//         label: z.string(), // 예: "탱커", "암살자" 등
//         role: z.string().optional(), // 없으면 label을 role로 사용
//     })
//     .passthrough();
// const PositionList = z.array(Position);
//
// // 클러스터는 여러 모양을 대비 (ids/objects/embed)
// const Cluster = z
//     .object({
//         id: z.number().optional(),
//         label: z.string(),
//         role: z.string().optional(),
//         // 가능성 1) characterIds: number[]
//         characterIds: z.array(z.number()).optional(),
//         // 가능성 2) characters: [{ id } | { characterId }]
//         characters: z
//             .array(
//                 z
//                     .object({
//                         id: z.number().optional(),
//                         characterId: z.number().optional(),
//                     })
//                     .passthrough(),
//             )
//             .optional(),
//     })
//     .passthrough();
// const ClusterList = z.array(Cluster);
//
// // ── 프런트가 원하는 타깃 타입(네 프로젝트의 ClusterMeta와 호환)
// export type UIMember = {
//     id: number;
//     name: string;
//     imageUrlMini?: string | null;
// };
// export type UIClusterMeta = {
//     label: string;
//     role: string;
//     characters: UIMember[];
// };
//
// async function http<T>(path: string, init?: RequestInit): Promise<T> {
//     const res = await fetch(path, {
//         ...init,
//         headers: {
//             "Content-Type": "application/json",
//             ...(init?.headers ?? {}),
//         },
//     });
//     if (!res.ok) throw new Error(`[${res.status}] ${res.statusText}`);
//     return res.json() as Promise<T>;
// }
//
// // ── 원본 호출
// export async function listCharactersRaw() {
//     const data = await http<unknown>("/api/v1/characters");
//     return CharacterList.parse(data);
// }
// export async function listPositionsRaw() {
//     const data = await http<unknown>("/api/v1/positions");
//     return PositionList.parse(data);
// }
// export async function listClustersRaw() {
//     const data = await http<unknown>("/api/v1/clusters");
//     return ClusterList.parse(data);
// }
//
// // ── 조립 로직: clusters + characters(+positions) → UIClusterMeta[]
// export async function fetchClusterDirectory(): Promise<UIClusterMeta[]> {
//     // 병렬 호출
//     const [clusters, characters, positions] = await Promise.all([
//         listClustersRaw(),
//         listCharactersRaw(),
//         listPositionsRaw().catch(() => [] as z.infer<typeof PositionList>), // positions 없어도 동작
//     ]);
//
//     // 캐릭터 맵
//     const cmap = new Map<number, z.infer<typeof Character>>();
//     for (const ch of characters) cmap.set(ch.id, ch);
//
//     // 포지션 라벨→role 매핑(옵션)
//     const roleByLabel = new Map<string, string>();
//     for (const p of positions) roleByLabel.set(p.label, p.role ?? p.label);
//
//     // 클러스터를 UI 구조로 변환
//     const result: UIClusterMeta[] = clusters.map((c) => {
//         // 클러스터 멤버 id 뽑기
//         let ids: number[] = [];
//         if (Array.isArray(c.characterIds)) ids = c.characterIds;
//         else if (Array.isArray(c.characters)) {
//             ids = c.characters
//                 .map((x) => x.id ?? x.characterId)
//                 .filter((v): v is number => typeof v === "number");
//         }
//
//         const members: UIMember[] = ids
//             .map((id) => {
//                 const ch = cmap.get(id);
//                 if (!ch) return null;
//                 const name = ch.nameKr ?? ch.name ?? `#${id}`;
//                 const img = ch.imageUrlMini ?? undefined;
//                 return { id, name, imageUrlMini: img };
//             })
//             .filter(Boolean) as UIMember[];
//
//         const role = c.role ?? roleByLabel.get(c.label) ?? "기타";
//
//         return { label: c.label, role, characters: members };
//     });
//
//     // 라벨 오름차순 기본 정렬(클라에서 또 정렬하더라도 일관성 up)
//     result.sort((a, b) => a.label.localeCompare(b.label));
//     return result;
// }
