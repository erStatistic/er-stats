// lib/patch_api.ts
import { PatchNote } from "@/types";

const mock: PatchNote[] = [
    {
        id: "v0.76-official",
        version: "v0.76",
        kind: "official",
        date: "2025-08-08",
        title: "정식 패치 v0.76",
        entries: [
            {
                id: "e1",
                targetType: "character",
                targetId: 2,
                targetName: "나딘",
                changeType: "buff",
                field: "Q 피해량",
                before: "80/120/160",
                after: "90/130/170",
                delta: "+10",
                notes: "초반 라인전 보완",
            },
            {
                id: "e2",
                targetType: "weapon",
                targetName: "활",
                changeType: "nerf",
                field: "치명타 확률",
                before: "15%",
                after: "12%",
                delta: "-3%",
                notes: "과도한 한방을 억제",
            },
            {
                id: "e3",
                targetType: "system",
                targetName: "야생동물",
                changeType: "adjust",
                field: "처치 보상",
                before: "+75 EXP",
                after: "+65 EXP",
                delta: "-10",
            },
            {
                id: "e4",
                targetType: "character",
                targetId: 7,
                targetName: "하트",
                changeType: "rework",
                field: "패시브",
                notes: "음표 스택 획득 방식 전면 개편",
            },
        ],
    },
    {
        id: "v0.76.1-hotfix",
        version: "v0.76.1",
        kind: "hotfix",
        date: "2025-08-12",
        title: "핫픽스 v0.76.1",
        entries: [
            {
                id: "e5",
                targetType: "character",
                targetName: "피오라",
                changeType: "nerf",
                field: "E 쿨다운",
                before: "14/12/10",
                after: "16/14/12",
                delta: "+2s",
                notes: "과한 기동력 조정",
            },
            {
                id: "e6",
                targetType: "character",
                targetName: "리다이린",
                changeType: "buff",
                field: "기본 공격 사거리",
                before: "3.2",
                after: "3.4",
                delta: "+0.2",
            },
        ],
    },
];

export async function fetchPatchNotes(): Promise<PatchNote[]> {
    // 실제에선: const res = await fetch("/api/v1/patch-notes", { cache: "no-store" })
    // return res.json()
    await new Promise((r) => setTimeout(r, 250));
    // 최신 날짜/버전 우선 정렬
    return [...mock].sort((a, b) => (a.date < b.date ? 1 : -1));
}
