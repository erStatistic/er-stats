"use client";

import { useState } from "react";
import { ClusterMeta } from "@/types";
import ClusterBadge from "./ClusterBadge";
import RolePill from "./RolePill";

export default function ClusterCard({ data }: { data: ClusterMeta }) {
    const [open, setOpen] = useState(false);

    return (
        <article className="rounded-2xl border border-white/10 bg-[#121826] text-white overflow-hidden">
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0E1422]">
                <div className="flex items-center gap-2">
                    <ClusterBadge label={data.label} />
                    <RolePill role={data.role} />
                </div>
                <div className="text-xs text-white/60">
                    캐릭터 {data.characters.length}명
                </div>
            </header>

            <div className="px-4 py-3 text-sm text-white/80">
                {data.note ||
                    "이 군집은 유사한 플레이스타일/역할을 수행하는 실험체들의 모음입니다."}
            </div>

            <div className="px-4 pb-3">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="text-xs rounded-lg border border-white/10 px-3 py-2 hover:bg-white/5"
                    aria-expanded={open}
                >
                    {open ? "캐릭터 접기" : "캐릭터 보기"}
                </button>
            </div>

            {open && (
                <div className="px-3 pb-4">
                    <ul className="flex flex-wrap gap-2">
                        {data.characters.map((c) => (
                            <li key={c.id}>
                                <button
                                    className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0E1422] px-2.5 py-1.5 hover:bg-white/5"
                                    // 추후 /characters/[id]로 이동
                                    onClick={() =>
                                        (window.location.href = `/characters/${c.id}`)
                                    }
                                    title={c.name}
                                >
                                    <img
                                        src={c.imageUrl}
                                        alt={c.name}
                                        className="w-6 h-6 rounded-full object-cover"
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
