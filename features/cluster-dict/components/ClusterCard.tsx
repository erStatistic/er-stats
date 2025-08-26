"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import ClusterBadge from "./ClusterBadge";
import RolePill from "@/features/ui/RolePill";
import { clientGetCwByCluster } from "@/lib/api";

/* ---------- 타입(유연) ---------- */
type CharacterLite = {
    id: number;
    name?: string;
    NameKr?: string;
    imageUrl?: string;
    ImageUrlMini?: string;
    ImageUrlFull?: string;
};
type WeaponLite = {
    id?: number;
    code?: number;
    name?: string;
    NameKr?: string;
    imageUrl?: string;
    ImageUrl?: string;
};
type PositionLite = { id: number; name?: string; Name?: string };

type ClusterEntryCW = {
    cwId: number;
    character: CharacterLite;
    weapon: WeaponLite;
    position?: PositionLite;
};

type ClusterMetaCW = {
    clusterId?: number;
    label: string;
    role?: string;
    entries: ClusterEntryCW[];
    counts?: { cws: number; characters: number };
};
type ClusterMetaChar = {
    label: string;
    role: string;
    characters: { id: number; name?: string; imageUrl?: string }[];
    counts?: { cws: number; characters: number };
};
type HeaderOnly = {
    clusterId: number;
    label: string;
    role: string;
    counts?: { cws: number; characters: number };
};
type PropsData = ClusterMetaCW | ClusterMetaChar | HeaderOnly;

/* ---------- 유틸 ---------- */
const isCW = (d: any): d is ClusterMetaCW => !!d && Array.isArray(d.entries);
const isCharList = (d: any): d is ClusterMetaChar =>
    !!d && Array.isArray(d.characters);
const isHeader = (d: any): d is HeaderOnly =>
    !!d &&
    typeof d.clusterId === "number" &&
    !("entries" in d) &&
    !("characters" in d);

const nameOf = (x?: { name?: string; NameKr?: string }) =>
    x?.name ?? x?.NameKr ?? "";
const charImg = (c?: CharacterLite) =>
    c?.imageUrl ?? c?.ImageUrlMini ?? c?.ImageUrlFull ?? "";
const weapImg = (w?: WeaponLite) => w?.imageUrl ?? (w as any)?.ImageUrl ?? "";

/* ---------- 아바타(캐릭터 1 + 무기 1) ---------- */
function AvatarWithWeapon({
    charSrc,
    weaponSrc,
    size = 56,
    dot = 18,
    onError,
}: {
    charSrc: string;
    weaponSrc?: string;
    size?: number;
    dot?: number;
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}) {
    return (
        <div
            className="relative rounded-full border"
            style={{
                width: size,
                height: size,
                borderColor: "var(--border)",
                background: "var(--surface)",
            }}
        >
            <img
                src={charSrc}
                alt=""
                className="w-full h-full object-cover rounded-full"
                onError={onError}
            />

            {weaponSrc && (
                <div
                    className="absolute right-0 bottom-0 rounded-full border-2 shadow"
                    style={{
                        width: dot,
                        height: dot,
                        backgroundColor: "#000", // 검은 배경
                        borderColor: "var(--surface)", // 카드 배경과 경계
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    <img
                        src={weaponSrc}
                        alt=""
                        className="rounded-full"
                        style={{
                            width: Math.round(dot * 0.78),
                            height: Math.round(dot * 0.78),
                            objectFit: "contain",
                        }}
                        onError={onError}
                    />
                </div>
            )}
        </div>
    );
}

/* ---------- 메인 카드 ---------- */
export default function ClusterCard({ data }: { data: PropsData }) {
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState<ClusterMetaCW | null>(
        isCW(data) ? (data as ClusterMetaCW) : null,
    );
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const listId = useId();
    const router = useRouter();

    // 펼칠 때 상세 로드
    useEffect(() => {
        const load = async () => {
            if (!open || detail || !isHeader(data)) return;
            try {
                setLoading(true);
                setErr(null);
                const res = await clientGetCwByCluster(data.clusterId);
                setDetail({
                    clusterId: data.clusterId,
                    label: res.label,
                    role: (data as HeaderOnly).role,
                    entries: res.entries,
                    counts: {
                        cws: res.entries.length,
                        characters: new Set(
                            res.entries.map((e) => e.character.id),
                        ).size,
                    },
                });
            } catch (e: any) {
                setErr(e?.message ?? "로드 실패");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [open, data, detail]);

    const label = (data as any).label;
    const role = (data as any).role;

    // ✅ 파생값은 매 렌더에서 계산
    const cwCount =
        detail?.counts?.cws ?? (data as any)?.counts?.cws ?? undefined;

    const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        (e.currentTarget as HTMLImageElement).src =
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="100%" height="100%" fill="#cbd5e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="#475569">No Img</text></svg>`,
            );
    };

    return (
        <article className="card overflow-hidden p-0">
            {/* 헤더 */}
            <header
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--muted)",
                }}
            >
                <div className="flex items-center gap-2">
                    <ClusterBadge label={label} />
                    <RolePill role={role} />
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {cwCount != null ? `${cwCount}개` : "…"}
                </div>
            </header>

            {/* 접혀있을 때: 우측 정렬 버튼 */}
            {!open && (
                <div className="px-4 pb-3 mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="rounded-lg border px-3 py-2 text-xs transition hover:opacity-90"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                        }}
                        aria-expanded={open}
                        aria-controls={listId}
                    >
                        목록 보기
                    </button>
                </div>
            )}

            {/* 펼친 목록 */}
            {open && (
                <div className="px-3 pb-4 mt-3" id={listId}>
                    {loading && (
                        <div className="text-xs text-muted-app px-2 py-1">
                            불러오는 중…
                        </div>
                    )}
                    {err && (
                        <div className="text-xs text-red-400 px-2 py-1">
                            에러: {err}
                        </div>
                    )}

                    {detail && (
                        <ul className="grid grid-cols-4 gap-3 place-items-center">
                            {detail.entries.map((e) => {
                                const char = charImg(e.character);
                                const weap = weapImg(e.weapon);
                                const title = `${nameOf(e.character)} · ${nameOf(e.weapon)}`;
                                // ⬇️ 서버가 주는 무기 식별자(code or id) 아무거나 우선 사용
                                const weaponCode = e.weapon.code ?? e.weapon.id;

                                return (
                                    <li key={e.cwId}>
                                        <button
                                            type="button"
                                            // ⬇️ 무기코드를 쿼리로 넘긴다 (?wc=)
                                            onClick={() =>
                                                router.push(
                                                    `/characters/${e.character.id}?wc=${e.cwId}`,
                                                )
                                            }
                                            title={title}
                                            aria-label={title}
                                            className="transition hover:scale-[1.03]"
                                        >
                                            <AvatarWithWeapon
                                                charSrc={char}
                                                weaponSrc={weap}
                                                size={56}
                                                dot={18}
                                                onError={onImgError}
                                            />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* (옵션) 옛 구조 대응 */}
                    {!detail &&
                        isCharList(data) &&
                        Array.isArray((data as any).characters) && (
                            <ul className="grid grid-cols-4 gap-3 place-items-center">
                                {(data as ClusterMetaChar).characters.map(
                                    (c) => (
                                        <li key={c.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.push(
                                                        `/characters/${c.id}`,
                                                    )
                                                }
                                                title={c.name}
                                                aria-label={`${c.name} 상세`}
                                                className="transition hover:scale-[1.03]"
                                            >
                                                <AvatarWithWeapon
                                                    charSrc={c.imageUrl || ""}
                                                    size={56}
                                                    dot={18}
                                                    onError={onImgError}
                                                />
                                            </button>
                                        </li>
                                    ),
                                )}
                            </ul>
                        )}

                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg border px-3 py-2 text-xs transition hover:opacity-90"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                            }}
                        >
                            목록 접기
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}
