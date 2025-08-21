"use client";

import React from "react";

function parseNumeric(v?: string | number): {
    ok: boolean;
    value: number;
    isPercent: boolean;
} {
    if (v === undefined || v === null)
        return { ok: false, value: 0, isPercent: false };
    if (typeof v === "number") return { ok: true, value: v, isPercent: false };
    const s = v.trim();
    const pct = s.endsWith("%");
    const num = parseFloat(s.replace("%", ""));
    if (!isNaN(num)) return { ok: true, value: num, isPercent: pct };
    return { ok: false, value: 0, isPercent: false };
}

export function formatValue(v?: string | number) {
    if (v === undefined || v === null) return "—";
    if (typeof v === "number") return v.toString();
    return v;
}

export default function ChangeDeltaBar({
    before,
    after,
    delta,
    className = "",
}: {
    before?: string | number;
    after?: string | number;
    delta?: string; // 서버가 계산해서 내려주는 경우 우선 사용
    className?: string;
}) {
    // 1) 먼저 delta가 문자열로 오면 그대로 표시
    const parsedB = parseNumeric(before);
    const parsedA = parseNumeric(after);

    let displayDelta = delta;
    let diffNum: number | null = null;
    let isPercent = parsedB.isPercent || parsedA.isPercent;

    if (!displayDelta && parsedB.ok && parsedA.ok) {
        diffNum = parsedA.value - parsedB.value;
        displayDelta = isPercent
            ? `${diffNum > 0 ? "+" : ""}${diffNum.toFixed(2)}%`
            : `${diffNum > 0 ? "+" : ""}${diffNum.toFixed(2)}`;
    }

    // 게이지 스케일: 상대적 비교가 어려우니 “변화 폭”만 시각화 (절대값 제한)
    const abs =
        diffNum !== null ? Math.min(Math.abs(diffNum), isPercent ? 30 : 50) : 0; // 퍼센트면 30%, 숫자면 50 범위 캡
    const widthPct = `${(abs / (isPercent ? 30 : 50)) * 100}%`;

    const positive = (diffNum ?? 0) > 0;
    const negative = (diffNum ?? 0) < 0;
    const color = positive
        ? "bg-emerald-500/40"
        : negative
          ? "bg-rose-500/50"
          : "bg-white/20";

    const arrow = positive ? "▲" : negative ? "▼" : "—";

    return (
        <div className={`w-full ${className}`}>
            {/* 숫자 박스 */}
            <div className="flex items-center gap-2 text-sm">
                <span className="rounded-md bg-white/5 border border-white/10 px-2 py-1">
                    <span className="text-white/50 mr-1">이전</span>
                    {formatValue(before)}
                </span>
                <span className="rounded-md bg-white/5 border border-white/10 px-2 py-1">
                    <span className="text-white/50 mr-1">이후</span>
                    {formatValue(after)}
                </span>
                <span
                    className={`rounded-md px-2 py-1 border text-sm ${
                        positive
                            ? "border-emerald-400/30 text-emerald-300 bg-emerald-500/10"
                            : negative
                              ? "border-rose-400/30 text-rose-300 bg-rose-500/10"
                              : "border-white/10 text-white/70 bg-white/5"
                    }`}
                    title="변화량(After - Before)"
                >
                    {arrow} {displayDelta ?? "—"}
                </span>
            </div>

            {/* 변화 게이지 */}
            {diffNum !== null && (
                <div
                    className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden"
                    aria-hidden
                >
                    <div
                        className={`h-full ${color}`}
                        style={{ width: widthPct }}
                    />
                </div>
            )}
        </div>
    );
}
