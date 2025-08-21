"use client";

import { useEffect, useRef } from "react";

export type CharItem = {
    id: number;
    name: string;
    imageUrl: string;
    weapons: string[];
};

export default function CharacterWeaponPicker({
    open,
    character,
    onClose,
    onPick, // (charId, weapon) => void
}: {
    open: boolean;
    character: CharItem | null;
    onClose: () => void;
    onPick: (id: number, weapon: string) => void;
}) {
    const ref = useRef<HTMLDivElement | null>(null);

    // 바깥 클릭 닫기
    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (!open) return;
            if (ref.current && !ref.current.contains(e.target as Node))
                onClose();
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [open, onClose]);

    if (!open || !character) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div
                ref={ref}
                className="card w-[min(92vw,420px)] p-0 overflow-hidden"
            >
                {/* 헤더 */}
                <div
                    className="px-4 py-3 border-b"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div className="flex items-center gap-3">
                        <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <div className="font-semibold">
                                {character.name}
                            </div>
                            <div
                                className="text-xs"
                                style={{ color: "var(--text-muted)" }}
                            >
                                무기군 선택
                            </div>
                        </div>
                    </div>
                </div>

                {/* 무기 버튼들 */}
                <div className="p-4 grid grid-cols-2 gap-2">
                    {character.weapons.map((w) => (
                        <button
                            key={w}
                            className="rounded-xl border px-3 py-2 text-sm hover:opacity-80 transition"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--surface)",
                                color: "var(--text)",
                            }}
                            onClick={() => {
                                onPick(character.id, w);
                                onClose();
                            }}
                        >
                            {w}
                        </button>
                    ))}
                </div>

                <div
                    className="px-4 py-3 border-t flex justify-end"
                    style={{ borderColor: "var(--border)" }}
                >
                    <button
                        className="rounded-xl border px-3 py-1.5 text-sm hover:opacity-80"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--surface)",
                            color: "var(--text)",
                        }}
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
