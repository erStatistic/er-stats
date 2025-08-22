"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { ClusterMeta } from "@/types";
import ClusterBadge from "./ClusterBadge";
import RolePill from "./RolePill";

export default function ClusterCard({ data }: { data: ClusterMeta }) {
    const [open, setOpen] = useState(false);
    const listId = useId(); // aria-controls용 고유 id
    const router = useRouter();

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
                    <ClusterBadge label={data.label} />
                    <RolePill role={data.role} />
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    캐릭터 {data.characters.length}명
                </div>
            </header>

            {/* 설명 */}
            <div
                className="px-4 py-3 text-sm"
                style={{ color: "var(--text-muted)" }}
            >
                {data.note ||
                    "이 군집은 유사한 플레이스타일/역할을 수행하는 실험체들의 모음입니다."}
            </div>

            {/* 토글 버튼 */}
            <div className="px-4 pb-3">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="rounded-lg border px-3 py-2 text-xs transition hover:opacity-90"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--surface)",
                        color: "var(--text)",
                    }}
                    aria-expanded={open}
                    aria-controls={listId}
                >
                    {open ? "캐릭터 접기" : "캐릭터 보기"}
                </button>
            </div>

            {/* 캐릭터 목록 */}
            {open && (
                <div className="px-3 pb-4" id={listId}>
                    <ul className="flex flex-wrap gap-2">
                        {data.characters.map((c) => (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    className="group inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition"
                                    style={{
                                        borderColor: "var(--border)",
                                        background: "var(--muted)",
                                        color: "var(--text)",
                                    }}
                                    onClick={() =>
                                        router.push(`/characters/${c.id}`)
                                    }
                                    title={c.name}
                                >
                                    <img
                                        src={c.imageUrl}
                                        alt={c.name}
                                        className="w-6 h-6 rounded-full object-cover"
                                        onError={(e) => {
                                            (
                                                e.currentTarget as HTMLImageElement
                                            ).src =
                                                "data:image/svg+xml;utf8," +
                                                encodeURIComponent(
                                                    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="100%" height="100%" fill="#cbd5e1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="#475569">No Img</text></svg>`,
                                                );
                                        }}
                                    />
                                    <span className="text-xs">{c.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    );
}
