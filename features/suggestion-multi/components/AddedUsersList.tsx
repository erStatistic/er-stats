// features/suggest/AddedUsersList.tsx
"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/types";
import { fmtPercent, fmtMMR, charStats } from "@/features/suggestion-multi";

/* ===== API util ===== */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
async function fetchJSON<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const j = await res.json();
    return (j?.data ?? j) as T;
}

/* ===== Types ===== */
type CwLite = {
    cwId: number;
    weapon: string;
    weaponCode?: number;
    weaponImageUrl?: string;
};

type UserPick = {
    id: number;
    name: string;
    imageUrl: string;
    cwId: number;
    weapon: string;
};

type Props = {
    users: UserProfile[];
    onRemove: (name: string) => void;
    /** ✅ 컨트롤드: 부모가 유지하는 유저별 선택 목록 */
    picks?: Record<string, UserPick[]>;
    /** 선택 변경 콜백 */
    onPickChange?: (userName: string, picks: UserPick[]) => void;
};

export default function AddedUsersList({
    users,
    onRemove,
    picks,
    onPickChange,
}: Props) {
    if (users.length === 0) return null;

    /* ── 유저별 상태(탭/무기 리스트 캐시) ───────────────── */
    const [activeCharByUser, setActiveCharByUser] = useState<
        Record<string, number | null>
    >({});
    const [cwsCache, setCwsCache] = useState<Record<number, CwLite[]>>({});
    const [cwsLoading, setCwsLoading] = useState<Record<number, boolean>>({});
    const [cwsError, setCwsError] = useState<
        Record<number, string | undefined>
    >({});

    /* ── 유저별 접힘 상태(완전 컨트롤드) ─────────────────── */
    const [openByUser, setOpenByUser] = useState<Record<string, boolean>>({});

    // 유저 목록 변할 때: 초기 탭 지정 + 첫 캐릭 무기 미리 로드 + 접힘 기본값(true=펼침)
    useEffect(() => {
        const nextActive: Record<string, number | null> = {
            ...activeCharByUser,
        };
        const nextOpen: Record<string, boolean> = { ...openByUser };
        users.forEach((u) => {
            // 접힘 상태 기본값: 펼침
            if (nextOpen[u.name] == null) nextOpen[u.name] = true;

            // 활성 캐릭: 기존 유지, 없으면 첫 캐릭
            const current = nextActive[u.name];
            const firstId = u.topChars?.[0]?.id ?? null;
            if (current == null && firstId != null) {
                nextActive[u.name] = firstId;
                void loadCws(firstId);
            }
        });
        // 제거된 유저 키 정리
        Object.keys(nextOpen).forEach((k) => {
            if (!users.find((u) => u.name === k)) delete nextOpen[k];
        });
        Object.keys(nextActive).forEach((k) => {
            if (!users.find((u) => u.name === k)) delete nextActive[k];
        });

        setActiveCharByUser(nextActive);
        setOpenByUser(nextOpen);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users]);

    async function loadCws(charId: number) {
        if (!charId || cwsCache[charId] || cwsLoading[charId]) return;
        setCwsLoading((p) => ({ ...p, [charId]: true }));
        setCwsError((p) => ({ ...p, [charId]: undefined }));
        try {
            const raw = await fetchJSON<any>(
                `/api/v1/characters/${charId}/cws`,
            );
            const list: any[] = Array.isArray(raw)
                ? raw
                : (raw?.items ?? raw?.rows ?? []);
            const mapped: CwLite[] = list
                .map((r) => ({
                    cwId: Number(r.cwId ?? r.id ?? r.CwID ?? r.CWId ?? r.cwid),
                    weapon:
                        r.weapon?.name ??
                        r.weaponName ??
                        r.weapon ??
                        r.Weapon ??
                        r.name ??
                        "—",
                    weaponCode: r.weapon?.code ?? r.weaponCode ?? r.code,
                    weaponImageUrl:
                        r.weapon?.imageUrl ??
                        r.weaponImageUrl ??
                        r.imageUrl ??
                        "",
                }))
                .filter((x) => Number.isFinite(x.cwId));
            setCwsCache((p) => ({ ...p, [charId]: mapped }));
        } catch (e: any) {
            setCwsError((p) => ({
                ...p,
                [charId]: e?.message || "무기 목록을 불러오지 못했습니다.",
            }));
        } finally {
            setCwsLoading((p) => ({ ...p, [charId]: false }));
        }
    }

    function setActiveChar(userName: string, charId: number) {
        setActiveCharByUser((p) => ({ ...p, [userName]: charId }));
        void loadCws(charId);
    }

    /** ✅ 토글(선택/해제) — 컨트롤드: 부모 콜백만 호출 */
    function toggleWeapon(
        userName: string,
        char: { id: number; name: string; imageUrl: string },
        w: CwLite,
    ) {
        const list = picks?.[userName] ?? [];
        const same = list.find((x) => x.id === char.id && x.cwId === w.cwId);

        let next: UserPick[];
        if (same) {
            // 같은 무기 다시 클릭 → 해제
            next = list.filter((x) => !(x.id === char.id && x.cwId === w.cwId));
        } else {
            // 다른 무기로 교체(캐릭터 1개당 1무기 유지)
            const rest = list.filter((x) => x.id !== char.id);
            next = [
                ...rest,
                {
                    id: char.id,
                    name: char.name,
                    imageUrl: char.imageUrl,
                    cwId: w.cwId,
                    weapon: w.weapon,
                },
            ];
        }
        onPickChange?.(userName, next);
    }

    function clearPicks(userName: string) {
        onPickChange?.(userName, []);
    }

    /* ── 렌더 ───────────────────────────────── */
    return (
        <div className="grid gap-3">
            {users.map((u) => {
                const tops = (u.topChars ?? []).slice(0, 3);
                const activeId =
                    activeCharByUser[u.name] ?? tops[0]?.id ?? null;
                const activeChar =
                    tops.find((t) => t.id === activeId) ?? tops[0] ?? null;
                const cws = activeId ? cwsCache[activeId] : undefined;
                const isLoading = activeId ? cwsLoading[activeId] : false;
                const err = activeId ? cwsError[activeId] : undefined;

                const pickedList = picks?.[u.name] ?? [];

                return (
                    <details
                        key={u.name}
                        className="card p-0 overflow-hidden"
                        open={openByUser[u.name] ?? true}
                    >
                        {/* 헤더: 요약줄 클릭 시 직접 토글 (네이티브 토글 막음) */}
                        <summary
                            className="cursor-pointer select-none flex items-center justify-between gap-2 px-4 py-3"
                            onClick={(e) => {
                                e.preventDefault(); // 네이티브 토글 막고
                                setOpenByUser((p) => ({
                                    ...p,
                                    [u.name]: !(p[u.name] ?? true),
                                })); // 직접 토글
                            }}
                        >
                            <div className="inline-flex items-center gap-2">
                                <span
                                    aria-hidden
                                    className={`transition-transform ${
                                        (openByUser[u.name] ?? true)
                                            ? "rotate-90"
                                            : ""
                                    }`}
                                >
                                    ▸
                                </span>
                                <span className="text-sm font-semibold">
                                    {u.name}
                                </span>
                            </div>

                            <button
                                className="text-xs rounded-md border px-2 py-1 hover:bg-elev-10"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--surface-2)",
                                    color: "var(--text)",
                                }}
                                onClick={(ev) => {
                                    ev.stopPropagation(); // Remove 눌러도 접힘 토글 안 되게
                                    onRemove(u.name);
                                }}
                                aria-label={`${u.name} 제거`}
                                title="Remove"
                            >
                                Remove
                            </button>
                        </summary>

                        {/* 본문 */}
                        <div
                            className="px-4 pb-4 border-t"
                            style={{ borderColor: "var(--border)" }}
                        >
                            <div className="grid gap-4 md:grid-cols-2 mt-3">
                                {/* 좌측: Top3 3줄 */}
                                <div className="space-y-2">
                                    {tops.length === 0 && (
                                        <div
                                            className="text-sm"
                                            style={{
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            No recent characters.
                                        </div>
                                    )}
                                    {tops.map((ch) => {
                                        const perf = charStats
                                            ? charStats(ch.id)
                                            : { winRate: 0, mmrGain: 0 };
                                        const on = ch.id === activeId;
                                        return (
                                            <button
                                                key={ch.id}
                                                type="button"
                                                onClick={() =>
                                                    setActiveChar(u.name, ch.id)
                                                }
                                                className="w-full rounded-xl border p-2 flex items-center gap-3 transition hover:bg-elev-10"
                                                style={{
                                                    borderColor: on
                                                        ? "var(--app)"
                                                        : "var(--border)",
                                                    background: on
                                                        ? "var(--elev-20)"
                                                        : "var(--surface)",
                                                }}
                                                title={`${ch.name} · WR ${fmtPercent(perf.winRate)} · MMR ${fmtMMR(perf.mmrGain)}`}
                                            >
                                                <img
                                                    src={ch.imageUrl}
                                                    alt={ch.name}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs flex font-medium truncate">
                                                        {ch.name}
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        <span
                                                            className="rounded-md border px-1.5 py-0.5 text-[10px]"
                                                            style={{
                                                                borderColor:
                                                                    "var(--border)",
                                                                background:
                                                                    "var(--surface-2)",
                                                            }}
                                                        >
                                                            WR{" "}
                                                            {fmtPercent(
                                                                perf.winRate,
                                                            )}
                                                        </span>
                                                        <span
                                                            className="rounded-md border px-1.5 py-0.5 text-[10px]"
                                                            style={{
                                                                borderColor:
                                                                    "var(--border)",
                                                                background:
                                                                    "var(--surface-2)",
                                                            }}
                                                        >
                                                            MMR{" "}
                                                            {fmtMMR(
                                                                perf.mmrGain,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* 우측: 무기군 선택 + 선택 요약 */}
                                <div
                                    className="rounded-lg border p-3"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    <div className="mb-2 flex items-center justify-between">
                                        <div
                                            className="text-xs"
                                            style={{
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            무기 선택
                                        </div>
                                        {activeChar && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <img
                                                    src={activeChar.imageUrl}
                                                    alt={activeChar.name}
                                                    className="w-5 h-5 rounded-full object-cover"
                                                />
                                                <span className="font-medium">
                                                    {activeChar.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 무기군 pill들 */}
                                    <div className="flex flex-wrap gap-2 min-h-[40px]">
                                        {!activeChar ? (
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                선택된 캐릭터가 없습니다.
                                            </div>
                                        ) : isLoading ? (
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                불러오는 중…
                                            </div>
                                        ) : err ? (
                                            <div className="text-xs text-red-500">
                                                {err}
                                            </div>
                                        ) : cws && cws.length > 0 ? (
                                            cws
                                                .slice()
                                                .sort(
                                                    (a, b) =>
                                                        (a.weaponCode ?? 1e9) -
                                                        (b.weaponCode ?? 1e9),
                                                )
                                                .map((w, i) => {
                                                    const picked =
                                                        pickedList.find(
                                                            (x) =>
                                                                x.id ===
                                                                    activeChar.id &&
                                                                x.cwId ===
                                                                    w.cwId,
                                                        );
                                                    return (
                                                        <button
                                                            key={`${activeChar.id}-${w.cwId}-${i}`}
                                                            type="button"
                                                            onClick={() =>
                                                                toggleWeapon(
                                                                    u.name,
                                                                    activeChar,
                                                                    w,
                                                                )
                                                            }
                                                            className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs transition ${
                                                                picked
                                                                    ? "bg-elev-20"
                                                                    : "hover:bg-elev-10"
                                                            }`}
                                                            style={{
                                                                borderColor:
                                                                    picked
                                                                        ? "color-mix(in oklab, var(--brand) 40%, transparent)"
                                                                        : "var(--border)",
                                                                background:
                                                                    picked
                                                                        ? "var(--brand)"
                                                                        : "var(--surface)",
                                                                color: picked
                                                                    ? "#fff"
                                                                    : "var(--text)",
                                                            }}
                                                            title={w.weapon}
                                                        >
                                                            {w.weaponImageUrl ? (
                                                                <img
                                                                    src={
                                                                        w.weaponImageUrl
                                                                    }
                                                                    alt={
                                                                        w.weapon
                                                                    }
                                                                    className="w-4 h-4 object-contain"
                                                                />
                                                            ) : (
                                                                <span
                                                                    aria-hidden
                                                                >
                                                                    🗡️
                                                                </span>
                                                            )}
                                                            <span>
                                                                {w.weapon}
                                                            </span>
                                                        </button>
                                                    );
                                                })
                                        ) : (
                                            <div
                                                className="text-xs"
                                                style={{
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                무기군 정보가 없습니다.
                                            </div>
                                        )}
                                    </div>

                                    {/* 선택 요약 */}
                                    <div className="mt-4">
                                        <div className="flex flex-wrap gap-2">
                                            {pickedList.map((p) => (
                                                <span
                                                    key={`${u.name}-${p.id}`}
                                                    className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5"
                                                    style={{
                                                        borderColor:
                                                            "var(--border)",
                                                        background:
                                                            "var(--surface)",
                                                        color: "var(--text)",
                                                    }}
                                                >
                                                    <img
                                                        src={p.imageUrl}
                                                        alt={p.name}
                                                        className="w-5 h-5 rounded-full object-cover"
                                                    />
                                                    <span className="text-[11px]">
                                                        {p.name}
                                                    </span>
                                                    <span className="text-[10px] opacity-80">
                                                        ({p.weapon})
                                                    </span>
                                                    <button
                                                        className="text-[10px] opacity-70 hover:opacity-100"
                                                        onClick={() => {
                                                            const next =
                                                                pickedList.filter(
                                                                    (x) =>
                                                                        x.id !==
                                                                        p.id,
                                                                );
                                                            onPickChange?.(
                                                                u.name,
                                                                next,
                                                            );
                                                        }}
                                                        title="Remove"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            ))}
                                            {pickedList.length > 0 && (
                                                <button
                                                    className="rounded-xl border px-2 py-1 text-xs transition"
                                                    style={{
                                                        borderColor:
                                                            "var(--border)",
                                                    }}
                                                    onClick={() =>
                                                        clearPicks(u.name)
                                                    }
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                );
            })}
        </div>
    );
}

/* ▼ 옵션: 기본 summary 마커 숨기고 싶다면 전역 CSS에 추가
details > summary::-webkit-details-marker { display: none; }
details > summary { list-style: none; }
*/
