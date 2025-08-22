"use client";

import React, { useEffect, useRef } from "react";

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
    const panelRef = useRef<HTMLDivElement | null>(null);
    const firstBtnRef = useRef<HTMLButtonElement | null>(null);

    // Esc로 닫기 + 첫 버튼 포커스
    useEffect(() => {
        if (!open) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);

        // 살짝 지연 후 포커스(마운트 직후 포커스 안정화)
        const t = setTimeout(() => firstBtnRef.current?.focus(), 0);

        return () => {
            window.removeEventListener("keydown", onKey);
            clearTimeout(t);
        };
    }, [open, onClose]);

    if (!open || !character) return null;

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-elev-30"
            onClick={(e) => {
                // 바깥(오버레이) 클릭 시 닫기
                if (e.target === e.currentTarget) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="weapon-picker-title"
        >
            <div
                ref={panelRef}
                className="card w-[min(92vw,420px)] p-0 overflow-hidden"
            >
                {/* 헤더 */}
                <div className="px-4 py-3 border-b border-app bg-surface">
                    <div className="flex items-center gap-3">
                        <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <div
                                id="weapon-picker-title"
                                className="font-semibold text-app"
                            >
                                {character.name}
                            </div>
                            <div className="text-xs text-muted-app">
                                무기군 선택
                            </div>
                        </div>
                    </div>
                </div>

                {/* 무기 버튼들 */}
                <div className="p-4 grid grid-cols-2 gap-2">
                    {character.weapons.map((w, idx) => (
                        <button
                            key={w}
                            ref={idx === 0 ? firstBtnRef : undefined}
                            className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm hover:bg-elev-10 transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                            onClick={() => {
                                onPick(character.id, w);
                                onClose();
                            }}
                        >
                            {w}
                        </button>
                    ))}
                </div>

                {/* 푸터 */}
                <div className="px-4 py-3 border-t border-app bg-surface flex justify-end">
                    <button
                        className="rounded-xl border border-app bg-surface text-app px-3 py-1.5 text-sm hover:bg-elev-10 transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
