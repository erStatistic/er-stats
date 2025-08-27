"use client";

import React from "react";
import { CLUSTER_COLOR } from "@/lib/cluster";

export function hexToRGBA(input: string, alpha: number): string {
    // 이미 rgba/hsla 문자열이면 그대로 사용
    if (/^(rgba?|hsla?)\(/i.test(input)) return input.replace(/\s+/g, "");
    // #RGB or #RRGGBB
    const hex = input.replace("#", "").trim();
    const isShort = hex.length === 3;
    const isLong = hex.length === 6;
    if (!isShort && !isLong) return `rgba(139,159,180,${alpha})`; // fallback
    const to255 = (h: string) => parseInt(h, 16);
    const r = isShort ? to255(hex[0] + hex[0]) : to255(hex.slice(0, 2));
    const g = isShort ? to255(hex[1] + hex[1]) : to255(hex.slice(2, 4));
    const b = isShort ? to255(hex[2] + hex[2]) : to255(hex.slice(4, 6));
    return `rgba(${r},${g},${b},${alpha})`;
}

export default function ClusterBadge({ label }: { label: string }) {
    const base = CLUSTER_COLOR[label] || "#8B9FB4";
    // 라이트/다크 모두에서 읽기 좋은 대비로 살짝 연한 배경 + 중간 보더
    const bg = hexToRGBA(base, 0.14); // 배경 투명도
    const border = hexToRGBA(base, 0.35); // 보더 투명도

    return (
        <span
            className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold select-none"
            style={{ color: base, backgroundColor: bg, borderColor: border }}
            title={`Cluster ${label}`}
            aria-label={`Cluster ${label}`}
        >
            {label}
        </span>
    );
}
