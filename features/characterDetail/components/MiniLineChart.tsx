import { useMemo, useRef, useState } from "react";
import { niceScale } from "@/features/characterDetail/utils";

export default function MiniLineChart({
    title,
    data,
    color = "var(--brand)",
    width = 230,
    height = 140,
    yTickCount = 5,
    suffix = "",
    decimals = 1,
    yFromZero = true, // 0부터 시작
}: {
    title: string;
    data: { x: string; y: number }[]; // y는 % 값(예: 10.5)
    color?: string;
    width?: number;
    height?: number;
    yTickCount?: number;
    suffix?: string; // y축/툴팁 단위 (예: "%")
    decimals?: number; // 표기 소수점 자리
    yFromZero?: boolean;
}) {
    if (!data.length) return null;

    // ── 레이아웃(라벨/툴팁 여유)
    const m = { top: 18, right: 12, bottom: 42, left: 40 };
    const w = width,
        h = height;
    const iw = Math.max(0, w - m.left - m.right);
    const ih = Math.max(0, h - m.top - m.bottom);

    // ── 스케일
    const ys = data.map((d) => d.y);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const nice = yFromZero
        ? niceScale(0, yMax, yTickCount)
        : niceScale(yMin, yMax, yTickCount);

    let y0 = yFromZero ? 0 : nice.min;
    let y1 = nice.max;
    let step = nice.step;
    if (y1 - y0 === 0) {
        y1 = y0 + 1;
        step = (y1 - y0) / Math.max(yTickCount, 1);
    }

    const xPos = (i: number) =>
        m.left + (i * iw) / Math.max(data.length - 1, 1);
    const yPos = (v: number) => m.top + ih - ((v - y0) / (y1 - y0 || 1)) * ih;

    // ── path
    const path = useMemo(
        () =>
            data
                .map((d, i) => `${i ? "L" : "M"} ${xPos(i)} ${yPos(d.y)}`)
                .join(" "),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [data, w, h, y0, y1],
    );

    // ── Y 틱
    const yTicks: number[] = [];
    for (let v = y0; v <= y1 + 1e-6; v += step) {
        yTicks.push(Number(v.toFixed(6)));
    }

    // ── X 라벨 간격이 좁으면 일부만 표시
    const stepX = iw / Math.max(data.length - 1, 1);
    const minGap = 26; // 최소 간격(px)
    const xEvery = Math.max(1, Math.ceil(minGap / stepX));
    const xLabelY = m.top + ih + 18;
    const n = data.length;

    // ── Hover(툴팁)
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [hi, setHi] = useState<number | null>(null);

    const onMove = (e: React.MouseEvent<SVGRectElement>) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const px = (e.clientX - rect.left) * (w / rect.width);
        // 영역 밖이면 무시
        if (px < m.left || px > m.left + iw) return;

        // 가장 가까운 인덱스 찾기
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < n; i++) {
            const dx = Math.abs(xPos(i) - px);
            if (dx < bestDist) {
                bestDist = dx;
                best = i;
            }
        }
        setHi(best);
    };

    const onLeave = () => setHi(null);

    // 툴팁 위치/문구
    let tipX = 0,
        tipY = 0,
        tipW = 0,
        tipH = 20,
        tipText = "";
    if (hi != null) {
        const d = data[hi];
        const tx = xPos(hi);
        const ty = yPos(d.y);
        tipText = `${d.x} · ${d.y.toFixed(decimals)}${suffix}`;
        tipW = Math.max(44, tipText.length * 6 + 10);

        tipX = tx + 8;
        tipY = ty - tipH - 8;
        if (tipX + tipW > w - 2) tipX = tx - tipW - 8; // 우측 넘칠 때 좌측 배치
        if (tipY < 2) tipY = ty + 8; // 위로 넘칠 때 아래 배치
    }

    return (
        <div className="w-full">
            <div className="mb-1 text-center text-sm font-semibold text-app">
                {title}
            </div>

            <svg
                ref={svgRef}
                viewBox={`0 0 ${w} ${h}`}
                className="w-full h-auto"
            >
                {/* 그리드(가로) */}
                {yTicks.map((t, i) => (
                    <line
                        key={i}
                        x1={m.left}
                        x2={m.left + iw}
                        y1={yPos(t)}
                        y2={yPos(t)}
                        stroke="var(--border)"
                        strokeWidth="1"
                    />
                ))}

                {/* 축 틱 라벨 (Y) */}
                {yTicks.map((t, i) => (
                    <text
                        key={`yl${i}`}
                        x={m.left - 8}
                        y={yPos(t)}
                        textAnchor="end"
                        dominantBaseline="middle"
                        style={{ fill: "var(--text-muted)", fontSize: "10px" }}
                    >
                        {t.toFixed(decimals)}
                        {suffix}
                    </text>
                ))}

                {/* X 라벨(45도 회전, 일부만 표시) */}
                {data.map((d, i) => {
                    if (i % xEvery !== 0) return null;
                    const x = xPos(i);
                    const dx = i === 0 ? 6 : i === n - 1 ? -6 : 0;
                    return (
                        <text
                            key={`xl${i}`}
                            x={x}
                            y={xLabelY}
                            transform={`rotate(45 ${x} ${xLabelY})`}
                            textAnchor="end"
                            style={{
                                fill: "var(--text-muted)",
                                fontSize: "10px",
                            }}
                            dx={dx}
                        >
                            {d.x}
                        </text>
                    );
                })}

                {/* 라인 + 포인트 */}
                <path d={path} fill="none" stroke={color} strokeWidth={2} />
                {data.map((d, i) => (
                    <circle
                        key={`p${i}`}
                        cx={xPos(i)}
                        cy={yPos(d.y)}
                        r={2.5}
                        fill={color}
                    />
                ))}

                {/* Hover 가이드 & 툴팁 */}
                {hi != null && (
                    <>
                        {/* 수직 가이드라인 */}
                        <line
                            x1={xPos(hi)}
                            x2={xPos(hi)}
                            y1={m.top}
                            y2={m.top + ih}
                            stroke="var(--border)"
                            strokeDasharray="4 4"
                        />
                        {/* 하이라이트 포인트 */}
                        <circle
                            cx={xPos(hi)}
                            cy={yPos(data[hi].y)}
                            r={4}
                            fill={color}
                            stroke="white"
                            strokeWidth={1.5}
                        />
                        {/* 툴팁 */}
                        <g>
                            <rect
                                x={tipX}
                                y={tipY}
                                width={tipW}
                                height={tipH}
                                rx={4}
                                fill="var(--elev-10)"
                                stroke="var(--border)"
                            />
                            <text
                                x={tipX + tipW / 2}
                                y={tipY + tipH / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                    fill: "var(--text)",
                                    fontSize: "11px",
                                }}
                            >
                                {tipText}
                            </text>
                        </g>
                    </>
                )}

                {/* 포인터 이벤트 캡쳐(차트 영역) */}
                <rect
                    x={m.left}
                    y={m.top}
                    width={iw}
                    height={ih}
                    fill="transparent"
                    onMouseMove={onMove}
                    onMouseLeave={onLeave}
                />
            </svg>
        </div>
    );
}
