"use client";

import { useEffect, useMemo, useState } from "react";

type Member = {
    id: number;
    name: string;
    imageUrl: string;
    weaponIcon?: string;
};

/** 서버에서 해당 클러스터에 속한 캐릭터 목록을 가져옵니다. */
async function fetchClusterMembers(labels: string[]): Promise<Member[]> {
    if (!labels?.length) return [];
    // 예: NEXT_PUBLIC_API_BASE_URL = http://localhost:8080  (뒤 슬래시 제거)
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
        /\/$/,
        "",
    );
    // 👇 엔드포인트는 프로젝트에 맞게 바꿔주세요.
    const url = `${base}/api/v1/cluster-dict/members?labels=${encodeURIComponent(
        labels.join(","),
    )}`;

    const res = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });
    if (!res.ok) return [];

    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : json;

    // 백엔드 스키마에 맞게 매핑
    return rows.map((r: any) => ({
        id: r.character_id ?? r.id,
        name: r.character_name_kr ?? r.name_kr ?? r.name,
        imageUrl: r.image_url_mini ?? r.imageUrl ?? "",
        weaponIcon: r.weapon_image_url ?? r.weaponIcon,
    })) as Member[];
}

/**
 * 광고 배너처럼 컨테이너 바깥에 고정되는 사이드 레일.
 * - 화면이 좁으면 hideBelow 미만에선 자동 숨김
 * - 상단 네비와 겹치지 않게 top 오프셋 제공
 * - containerMax: 본문 max-width(px)에 맞춰 좌표 계산
 */
export default function ClusterPreviewRail({
    clusters,
    side = "right",
    top = 96,
    width = 280,
    gap = 16,
    containerMax = 1152, // Tailwind max-w-6xl ≈ 1152px
    hideBelow = 1536, // 2xl 이상일 때만 노출
    title = "클러스터 미리보기",
}: {
    clusters: string[] | null;
    side?: "left" | "right";
    top?: number;
    width?: number;
    gap?: number;
    containerMax?: number;
    hideBelow?: number;
    title?: string;
}) {
    const [members, setMembers] = useState<Member[]>([]);
    const [collapsed, setCollapsed] = useState(false);

    // 화면 폭이 충분할 때만 노출
    const showRail = useMemo(() => {
        if (typeof window === "undefined") return true; // SSR 안전 가드
        return window.innerWidth >= hideBelow;
    }, [hideBelow]);

    useEffect(() => {
        if (!clusters?.length) {
            setMembers([]);
            return;
        }
        fetchClusterMembers(clusters)
            .then(setMembers)
            .catch(() => setMembers([]));
    }, [JSON.stringify(clusters)]);

    // 컨테이너 바깥쪽에 고정 배치
    const baseLeft =
        side === "right"
            ? `calc(50% + ${containerMax / 2}px + ${gap}px)`
            : `calc(50% - ${containerMax / 2}px - ${gap + width}px)`;

    if (!showRail) return null;

    return (
        <aside
            aria-label="Cluster preview side rail"
            style={{
                position: "fixed",
                top,
                left: baseLeft,
                width,
                zIndex: 25, // 네비보다 낮고 본문 위
            }}
            className="pointer-events-auto"
        >
            <div
                className="rounded-2xl border bg-surface text-app shadow-lg"
                style={{ borderColor: "var(--border)" }}
            >
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
                        <div className="px-3 pt-2 text-xs text-muted-app">
                            {clusters?.length
                                ? clusters.join(" · ")
                                : "클러스터를 선택하세요"}
                        </div>

                        <div className="p-3 grid grid-cols-2 gap-2">
                            {members.map((m) => (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-elev-5"
                                >
                                    <div className="relative">
                                        <img
                                            src={m.imageUrl}
                                            alt={m.name}
                                            className="w-9 h-9 rounded-full object-cover border"
                                            style={{
                                                borderColor: "var(--border)",
                                            }}
                                            loading="lazy"
                                        />
                                        {!!m.weaponIcon && (
                                            <img
                                                src={m.weaponIcon}
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
                            ))}

                            {members.length === 0 && (
                                <div className="col-span-2 text-center text-xs text-muted-app py-4">
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
