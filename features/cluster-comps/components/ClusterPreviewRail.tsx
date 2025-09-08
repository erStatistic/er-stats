"use client";

import { useEffect, useMemo, useState } from "react";

type Member = {
    id: number;
    name: string;
    imageUrl: string;
    weaponIcon?: string;
};

type Bucket = {
    id: number;
    label: string; // 단일 클러스터 라벨(K, P, U 등)
    items: Member[];
};

/** 클러스터 ID 묶음으로 캐릭터를 클러스터별 버킷으로 가져오기 */
async function fetchBucketsByClusterIds(ids: number[]): Promise<Bucket[]> {
    if (!ids?.length) return [];
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
        /\/$/,
        "",
    );
    const url = `${base}/api/v1/cws/by-clusters?ids=${encodeURIComponent(
        ids.join(","),
    )}`;

    const res = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) return [];

    const json = await res.json();
    // {data:{data:[...]}} | {data:[...]} 모두 대응
    const bucketsRaw: any[] = Array.isArray(json?.data?.data)
        ? json.data.data
        : Array.isArray(json?.data)
          ? json.data
          : [];

    return bucketsRaw.map((b) => ({
        id: b.clusterId ?? b.cluster_id ?? 0,
        label: b.label ?? b.cluster_label ?? "",
        items: (b.entries ?? []).map((e: any) => ({
            id: e?.character?.id ?? e?.character_id ?? 0,
            name:
                e?.character?.name ??
                e?.character_name_kr ??
                e?.name_kr ??
                e?.name ??
                "",
            imageUrl:
                e?.character?.imageUrl ??
                e?.image_url_mini ??
                e?.imageUrl ??
                "",
            weaponIcon: e?.weapon?.imageUrl ?? e?.weapon_image_url ?? undefined,
        })),
    }));
}

/**
 * 사이드 레일(클러스터 미리보기)
 * - clusterIds: [11,16,21] 처럼 숫자 ID 배열(우선 사용)
 * - clusterLabels: "K · P · U" 같이 보여줄 문자열 (선택)
 */
export default function ClusterPreviewRail({
    clusterIds,
    clusterLabels,
    side = "right",
    top = 96,
    width = 320,
    gap = 16,
    containerMax = 1152,
    hideBelow = 1536,
    title = "클러스터 미리보기",
    bottomGap = 24,
}: {
    clusterIds: number[] | null;
    clusterLabels?: string[] | string | null;
    side?: "left" | "right";
    top?: number;
    width?: number;
    gap?: number;
    containerMax?: number;
    hideBelow?: number;
    title?: string;
    bottomGap?: number;
}) {
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [collapsed, setCollapsed] = useState(false);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({}); // 버킷별 더보기 상태

    const showRail = useMemo(() => {
        if (typeof window === "undefined") return true;
        return window.innerWidth >= hideBelow;
    }, [hideBelow]);

    useEffect(() => {
        if (!clusterIds?.length) {
            setBuckets([]);
            return;
        }
        fetchBucketsByClusterIds(clusterIds)
            .then(setBuckets)
            .catch(() => setBuckets([]));
    }, [JSON.stringify(clusterIds)]);

    // 컨테이너 바깥쪽에 고정 배치
    const baseLeft =
        side === "right"
            ? `calc(50% + ${containerMax / 2}px + ${gap}px)`
            : `calc(50% - ${containerMax / 2}px - ${gap + width}px)`;

    if (!showRail) return null;

    // 안쪽 콘텐츠는 화면을 벗어나면 스크롤
    const scrollMaxH = `calc(100vh - ${top + 64 + bottomGap}px)`;

    return (
        <aside
            aria-label="Cluster preview side rail"
            style={{
                position: "fixed",
                top,
                left: baseLeft,
                width,
                zIndex: 25,
            }}
            className="pointer-events-auto"
        >
            <div
                className="rounded-2xl border bg-surface text-app shadow-lg"
                style={{ borderColor: "var(--border)" }}
            >
                {/* 상단 헤더 */}
                <div
                    className="flex items-center justify-between px-3 py-2 border-b"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div className="text-sm font-semibold">{title}</div>
                    <button
                        onClick={() => setCollapsed((v) => !v)}
                        className="text-xs text-muted-app hover:text-app"
                        aria-label="토글"
                    >
                        {collapsed ? "펼치기" : "접기"}
                    </button>
                </div>

                {!collapsed && (
                    <>
                        {/* 스크롤 가능한 본문 */}
                        <div
                            className="p-3 space-y-3 pb-2"
                            style={{ maxHeight: scrollMaxH, overflowY: "auto" }}
                        >
                            {/* 버킷(클러스터) 단위로 분리 렌더 */}
                            {buckets.map((b) => {
                                const showAll = !!expanded[b.id];
                                const visible = showAll
                                    ? b.items
                                    : b.items.slice(0, 8);

                                return (
                                    <section
                                        key={b.id}
                                        className="rounded-xl border"
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        {/* 섹션 헤더 */}
                                        <div
                                            className="flex items-center justify-between px-2 py-1 text-xs font-semibold border-b"
                                            style={{
                                                borderColor: "var(--border)",
                                                background:
                                                    "var(--elev-5, var(--muted))",
                                            }}
                                        >
                                            <span>
                                                {b.label || `Cluster ${b.id}`}
                                            </span>
                                            <span className="text-muted-app">
                                                {b.items.length}명
                                            </span>
                                        </div>

                                        {/* 목록 */}
                                        <ul className="grid grid-cols-2 gap-2 p-2">
                                            {visible.map((m) => (
                                                <li
                                                    key={`${b.id}-${m.id}-${m.weaponIcon ?? ""}`}
                                                >
                                                    <div className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-elev-5">
                                                        <div className="relative">
                                                            <img
                                                                src={m.imageUrl}
                                                                alt={m.name}
                                                                className="w-9 h-9 rounded-full object-cover border"
                                                                style={{
                                                                    borderColor:
                                                                        "var(--border)",
                                                                }}
                                                                loading="lazy"
                                                            />
                                                            {!!m.weaponIcon && (
                                                                <img
                                                                    src={
                                                                        m.weaponIcon
                                                                    }
                                                                    alt=""
                                                                    className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full border bg-black"
                                                                    style={{
                                                                        borderColor:
                                                                            "var(--surface)",
                                                                    }}
                                                                    loading="lazy"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="text-xs truncate">
                                                            {m.name}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}

                                            {b.items.length === 0 && (
                                                <li className="col-span-2 text-center text-xs text-muted-app py-3">
                                                    데이터가 없습니다.
                                                </li>
                                            )}
                                        </ul>

                                        {/* 더보기/접기 */}
                                        {b.items.length > 8 && (
                                            <div className="flex justify-end px-2 pb-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpanded((prev) => ({
                                                            ...prev,
                                                            [b.id]: !prev[b.id],
                                                        }))
                                                    }
                                                    className="rounded-lg border px-2 py-1 text-[11px] transition hover:opacity-90"
                                                    style={{
                                                        borderColor:
                                                            "var(--border)",
                                                        background:
                                                            "var(--surface)",
                                                        color: "var(--text)",
                                                    }}
                                                >
                                                    {showAll
                                                        ? "접기"
                                                        : "더 보기"}
                                                </button>
                                            </div>
                                        )}
                                    </section>
                                );
                            })}

                            {/* 상태 표시 */}
                            {!clusterIds?.length && (
                                <div className="text-center text-xs text-muted-app py-4">
                                    클러스터를 선택하세요.
                                </div>
                            )}
                            {clusterIds?.length && buckets.length === 0 && (
                                <div className="text-center text-xs text-muted-app py-4">
                                    데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
