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
}: {
    title: string;
    data: { x: string; y: number }[]; // y는 % 값(예: 50.2)
    color?: string;
    width?: number;
    height?: number;
    yTickCount?: number;
    suffix?: string; // y축/툴팁 표기 단위
    decimals?: number; // y축/툴팁 소수
}) {
    if (!data.length) return null;

    // ── 레이아웃
    const m = { top: 18, right: 12, bottom: 28, left: 28 };
    const w = width,
        h = height;
    const iw = w - m.left - m.right;
    const ih = h - m.top - m.bottom;

    // ── 스케일
    const ys = data.map((d) => d.y);
    const yMin = Math.min(...ys),
        yMax = Math.max(...ys);
    const { min: y0, max: y1, step } = niceScale(yMin, yMax, yTickCount);
    const xPos = (i: number) => m.left + (i * iw) / (data.length - 1 || 1);
    const yPos = (v: number) => m.top + ih - ((v - y0) / (y1 - y0 || 1)) * ih;

    // ── path
    const path = data
        .map((d, i) => `${i ? "L" : "M"} ${xPos(i)} ${yPos(d.y)}`)
        .join(" ");

    // ── ticks
    const yTicks: number[] = [];
    for (let v = y0; v <= y1 + 1e-6; v += step)
        yTicks.push(Number(v.toFixed(6)));

    return (
        <div className="w-full">
            <div className="mb-1 text-center text-sm font-semibold text-app">
                {title}
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
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
                        x={m.left - 6}
                        y={yPos(t)}
                        textAnchor="end"
                        dominantBaseline="middle"
                        style={{ fill: "var(--text-muted)", fontSize: "10px" }}
                    >
                        {t.toFixed(decimals)}
                    </text>
                ))}

                {/* X 라벨(날짜, 45도 회전) */}
                {data.map((d, i) => (
                    <text
                        key={`xl${i}`}
                        x={xPos(i)}
                        y={m.top + ih + 16}
                        transform={`rotate(45 ${xPos(i)} ${m.top + ih + 16})`}
                        textAnchor="end"
                        style={{ fill: "var(--text-muted)", fontSize: "10px" }}
                    >
                        {d.x}
                    </text>
                ))}

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
            </svg>
        </div>
    );
}
