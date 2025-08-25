// components/TierPill.tsx
"use client";

import React from "react";

const TIER_COLOR: Record<string, string> = {
    S: "#8A5CF6", // 보라
    A: "#00D1B2", // 민트
    B: "#3DB2FF", // 블루
    C: "#8B9FB4", // 그레이 톤(기본)
    D: "#98A6B8",
    F: "#9CA3AF",
};

type Tone = "subtle" | "solid";

export default function TierPill({
    tier,
    tone = "subtle",
    className = "",
    title,
}: {
    tier: string;
    tone?: Tone;
    className?: string;
    title?: string;
}) {
    const baseColor = TIER_COLOR[tier] || TIER_COLOR["C"];

    // CSS 변수로 넘겨서 color-mix로 밝기/명도 조절 (라이트/다크 모두 자연스럽게)
    const style: React.CSSProperties =
        tone === "solid"
            ? {
                  // 꽉 찬 배경
                  background: baseColor,
                  color: "#fff",
                  borderColor: "transparent",
              }
            : {
                  // 은은한 배경 + 테두리
                  // oklab/oklch가 안되면 lab로 바꿔도 OK
                  color: baseColor,
                  background: `color-mix(in lab, ${baseColor}, transparent 85%)`,
                  borderColor: `color-mix(in lab, ${baseColor}, transparent 55%)`,
              };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
            style={style}
            title={title ?? `Tier ${tier}`}
            aria-label={title ?? `Tier ${tier}`}
        >
            {tier}
        </span>
    );
}
