// components/TierPill.tsx
"use client";

import React from "react";

import { TIER_COLOR } from "@/features/constants";

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
