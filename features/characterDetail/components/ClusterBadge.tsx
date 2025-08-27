// features/characterDetail/components/ClusterBadge.tsx
"use client";

import type { ClusterLite } from "../types";

/**
 * 클러스터(라벨+역할) 표시 pill
 * UI 톤은 기존 pill들과 어울리게 최대한 중립 컬러로 구성했어요.
 */
export default function ClusterBadge({
    cluster,
    className = "",
    size = "md",
}: {
    cluster?: ClusterLite;
    className?: string;
    size?: "sm" | "md";
}) {
    if (!cluster || (!cluster.label && !cluster.role)) return null;

    const base =
        "inline-flex items-center gap-1 rounded-full border border-app bg-elev-10 text-app";
    const padding =
        size === "sm" ? "px-2 py-[2px] text-xs" : "px-3 py-1 text-xs";
    const bubbleSize =
        size === "sm" ? "w-5 h-5 text-[11px]" : "w-5 h-5 text-[11px]";

    return (
        <span className={`${base} ${padding} ${className}`}>
            {/* 라벨 동그라미 (A/B/C ...) */}
            {cluster.label ? (
                <span
                    className={`inline-flex items-center justify-center rounded-full bg-elev-20 ${bubbleSize} font-semibold`}
                    aria-label="클러스터 라벨"
                >
                    {cluster.label}
                </span>
            ) : null}

            {/* 역할 텍스트 */}
            {cluster.role ? (
                <span className="whitespace-nowrap">{cluster.role}</span>
            ) : null}
        </span>
    );
}
