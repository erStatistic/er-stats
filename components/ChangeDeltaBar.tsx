"use client";

import React from "react";

type NumLike = string | number | undefined | null;

function parseNumeric(v: NumLike): {
    ok: boolean;
    value: number;
    isPercent: boolean;
} {
    if (v === undefined || v === null)
        return { ok: false, value: 0, isPercent: false };
    if (typeof v === "number") return { ok: true, value: v, isPercent: false };
    const s = String(v).trim();
    const pct = s.endsWith("%");
    const num = parseFloat(pct ? s.slice(0, -1) : s);
    if (!isNaN(num)) return { ok: true, value: num, isPercent: pct };
    return { ok: false, value: 0, isPercent: false };
}

export function formatValue(v?: string | number) {
    if (v === undefined || v === null) return "—";
    return typeof v === "number" ? String(v) : v;
}

export default function ChangeDeltaBar({
    before,
    after,
    delta,
    className = "",
}: {
    before?: string | number;
    after?: string | number;
    /** 서버에서 내려온 값이 있으면 우선 사용 (예: "+3.2%" 또는 "-1.5") */
    delta?: string | number;
    className?: string;
}) {
    const parsedB = parseNumeric(before);
    const parsedA = parseNumeric(after);

    // 1) delta 우선 파싱
    const parsedDelta = parseNumeric(delta);
    // 2) 없으면 before/after로 계산
    const computedDiff =
        !parsedDelta.ok && parsedB.ok && parsedA.ok
            ? parsedA.value - parsedB.value
            : null;

    // 실제 수치/표기용 소스 확정
    const diffNum: number | null = parsedDelta.ok
        ? parsedDelta.value
        : computedDiff;
    const isPercent = parsedDelta.ok
        ? parsedDelta.isPercent
        : parsedB.isPercent || parsedA.isPercent;

    // 화면에 보여줄 문자열
    let displayDelta: string = "—";
    if (parsedDelta.ok) {
        // 서버 문자열 보존: 숫자였다면 우리가 포맷
        displayDelta =
            typeof delta === "string"
                ? delta
                : `${diffNum! > 0 ? "+" : ""}${diffNum!.toFixed(2)}${isPercent ? "%" : ""}`;
    } else if (diffNum !== null) {
        displayDelta = `${diffNum > 0 ? "+" : ""}${diffNum.toFixed(2)}${isPercent ? "%" : ""}`;
    }

    // 게이지 폭 계산 (절대값 캡)
    const cap = isPercent ? 30 : 50; // 퍼센트면 ±30, 숫자면 ±50 기준
    const abs = diffNum !== null ? Math.min(Math.abs(diffNum), cap) : 0;
    const widthPct = `${(abs / cap) * 100}%`;

    const positive = (diffNum ?? 0) > 0;
    const negative = (diffNum ?? 0) < 0;

    const trackCls =
        "mt-2 h-2 rounded-full bg-muted border border-app overflow-hidden";
    const barColor = positive
        ? "bg-emerald-500/60"
        : negative
          ? "bg-rose-500/60"
          : "bg-elev-10";

    return (
        <div className={`w-full ${className}`}>
            {/* 숫자 박스 */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="chip">
                    <span className="text-muted-app mr-1">이전</span>
                    <span className="text-app">{formatValue(before)}</span>
                </span>
                <span className="chip">
                    <span className="text-muted-app mr-1">이후</span>
                    <span className="text-app">{formatValue(after)}</span>
                </span>

                <span
                    className={`chip ${
                        positive
                            ? "ring-1 ring-emerald-400/50 text-app"
                            : negative
                              ? "ring-1 ring-rose-400/50 text-app"
                              : ""
                    }`}
                    title="변화량(After - Before)"
                    aria-label={`변화량 ${displayDelta}`}
                >
                    <span aria-hidden className="mr-1">
                        {positive ? "▲" : negative ? "▼" : "—"}
                    </span>
                    {displayDelta}
                </span>
            </div>

            {/* 변화 게이지 */}
            {diffNum !== null && (
                <div className={trackCls} aria-hidden>
                    <div
                        className={`h-full ${barColor}`}
                        style={{ width: widthPct }}
                    />
                </div>
            )}
        </div>
    );
}
