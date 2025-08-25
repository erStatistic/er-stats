// features/characterDetail/components/RadarChart.tsx
export default function RadarChart({
    values,
    labels,
    size = 200,
    maxR = 78,
    className,
}: {
    values: number[];
    labels: string[];
    size?: number;
    maxR?: number;
    className?: string;
}) {
    const N = 5;
    const vals = (
        values.length === N ? values : new Array(N).fill(0)
    ) as number[];

    const cx = size / 2;
    const cy = size / 2;
    const rings = [0.25, 0.5, 0.75, 1];

    const angle = (i: number) => -Math.PI / 2 + i * ((2 * Math.PI) / N);
    const pt = (i: number, v: number) => {
        const a = angle(i);
        const r = v * maxR;
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const toPoints = (vs: number[]) =>
        vs.map((v, i) => pt(i, v).join(",")).join(" ");
    const labelPt = (i: number) => pt(i, 1.06);

    return (
        <div className={`grid place-items-center ${className ?? ""}`}>
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
                {/* 기준 링 */}
                {rings.map((k) => (
                    <polygon
                        key={k}
                        points={toPoints(new Array(N).fill(k))}
                        fill="none"
                        strokeWidth={1}
                        style={{ stroke: "var(--border)" }}
                    />
                ))}

                {/* 축선 */}
                {Array.from({ length: N }).map((_, i) => {
                    const [x, y] = pt(i, 1);
                    return (
                        <line
                            key={i}
                            x1={cx}
                            y1={cy}
                            x2={x}
                            y2={y}
                            strokeWidth={1}
                            style={{ stroke: "var(--border)" }}
                        />
                    );
                })}

                {/* 데이터 영역 (면 + 외곽선) */}
                <polygon
                    points={toPoints(vals.map((v) => Math.max(0.02, v)))}
                    strokeWidth={1.5}
                    style={{
                        fill: "color-mix(in lab, var(--text), transparent 88%)",
                        stroke: "var(--text)",
                    }}
                />

                {/* ✅ 끝 점(동그라미) 제거 → 렌더하지 않음 */}

                {/* 축 라벨: 카드의 스탯 요약 톤과 동일 */}
                {labels.map((lb, i) => {
                    const [x, y] = labelPt(i);
                    return (
                        <text
                            key={lb}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-[11px]"
                            style={{ fill: "var(--text-muted)" }}
                        >
                            {lb}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
