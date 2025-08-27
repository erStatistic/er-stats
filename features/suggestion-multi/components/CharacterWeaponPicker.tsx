"use client";

import React, { useEffect, useRef, useState } from "react";

/** 상위 카탈로그용 캐릭터 타입 */
export type CharItem = {
    id: number;
    name: string;
    imageUrl: string;
};

/** 피커에 표시할 무기 항목 */
type WeaponRow = {
    code?: number;
    name: string;
    imageUrl?: string;
    cwId?: number;
};

/* ---- API 유틸 ---- */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

async function fetchJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const j = await res.json();
    return (j?.data ?? j) as T;
}

export default function CharacterWeaponPicker({
    open,
    character,
    onClose,
    onPick, // (charId, weaponName) => void
}: {
    open: boolean;
    character: CharItem | null;
    onClose: () => void;
    onPick: (id: number, weapon: string) => void;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const firstBtnRef = useRef<HTMLButtonElement | null>(null);

    const [weapons, setWeapons] = useState<WeaponRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // 직전 캐릭터 id (렌더 시점에 변경 감지용)
    const prevIdRef = useRef<number | null>(null);
    const charId = character?.id ?? null;
    const charChangedThisRender =
        open && charId !== null && prevIdRef.current !== charId;

    // Esc로 닫기
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // 닫히면 상태 정리
    useEffect(() => {
        if (!open) {
            setWeapons([]);
            setErr(null);
            setLoading(false);
            prevIdRef.current = null;
        }
    }, [open]);

    // 열릴 때 & 캐릭터가 바뀔 때: 이전 목록 즉시 비우고 새로 로드
    useEffect(() => {
        if (!open || !character) return;

        // 렌더 직후부터 “이 캐릭터에 대한 화면”으로 간주
        prevIdRef.current = character.id;

        // 즉시 초기화(잔상 방지)
        setWeapons([]);
        setErr(null);
        setLoading(true);

        const ctrl = new AbortController();
        let alive = true;

        (async () => {
            try {
                type CwTab = {
                    cwId: number;
                    weapon: { code: number; name: string; imageUrl?: string };
                };

                const rows = await fetchJSON<CwTab[]>(
                    `/api/v1/characters/${character.id}/cws`,
                    ctrl.signal,
                );

                if (!alive) return;

                const mapped: WeaponRow[] = (rows ?? [])
                    .map((r) => ({
                        code: r.weapon?.code,
                        name: r.weapon?.name ?? "무기",
                        imageUrl: r.weapon?.imageUrl ?? "",
                        cwId: r.cwId,
                    }))
                    .filter(
                        (x, i, arr) =>
                            arr.findIndex((y) => y.code === x.code) === i,
                    )
                    .sort((a, b) => {
                        const ac = a.code ?? 9_999;
                        const bc = b.code ?? 9_999;
                        if (ac !== bc) return ac - bc;
                        return (a.name || "").localeCompare(b.name || "");
                    });

                setWeapons(mapped);
                // 첫 버튼 포커스
                setTimeout(() => firstBtnRef.current?.focus(), 0);
            } catch (e: any) {
                if (!alive) return;
                if (e?.name !== "AbortError") {
                    setErr(e?.message || "무기 목록을 불러오지 못했습니다.");
                    setWeapons([]);
                }
            } finally {
                alive && setLoading(false);
            }
        })();

        return () => {
            alive = false;
            ctrl.abort();
        };
    }, [open, character?.id]);

    if (!open || !character) return null;

    const showLoading = loading || charChangedThisRender;

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-elev-30"
            onClick={(e) => {
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

                {/* 본문 */}
                <div className="p-4">
                    {showLoading && (
                        <div className="text-sm text-muted-app">
                            불러오는 중…
                        </div>
                    )}
                    {!showLoading && err && (
                        <div className="text-sm text-red-400">{err}</div>
                    )}
                    {!showLoading && !err && (
                        <div className="grid grid-cols-2 gap-2">
                            {weapons.map((w, idx) => (
                                <button
                                    key={`${w.code ?? w.name}-${idx}`}
                                    ref={idx === 0 ? firstBtnRef : undefined}
                                    className="rounded-xl border border-app bg-surface text-app px-3 py-2 text-sm hover:bg-elev-10 transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)] flex items-center gap-2"
                                    onClick={() => {
                                        onPick(character.id, w.name);
                                        onClose();
                                    }}
                                >
                                    {w.imageUrl ? (
                                        <img
                                            src={w.imageUrl}
                                            alt={w.name}
                                            className="w-5 h-5 rounded object-cover"
                                        />
                                    ) : (
                                        <span className="w-5 h-5 rounded bg-elev-10" />
                                    )}
                                    <span className="truncate">{w.name}</span>
                                </button>
                            ))}
                            {weapons.length === 0 && (
                                <div className="text-sm text-muted-app col-span-2">
                                    선택 가능한 무기가 없습니다.
                                </div>
                            )}
                        </div>
                    )}
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
