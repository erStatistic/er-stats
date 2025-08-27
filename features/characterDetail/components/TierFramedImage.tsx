import Image from "next/image";
import { getTierColor } from "@/features/utils";
import { hexToRGBA } from "@/features/cluster-dict/components/ClusterBadge";

type Corner = "tl" | "tr";
type Radius = "md" | "lg" | "xl" | "2xl" | "full";

const rcls: Record<Radius, string> = {
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
};

export default function TierFramedImage({
    src,
    alt,
    tier, // "S" | "A" | "B" | "C" | "D" | "F"
    label, // 기본: tier
    size = 72,
    thickness = 2, // (기존) 기본 두께(px)
    corner = "tl",
    radius = "xl",
    className,
    bgClassName = "bg-elev-10",
    showBadge = true,
    badgeRounded = "md",

    // ▼ 추가 옵션
    frameThickness, // 우선 적용되는 명시적 두께(px)
    autoThickness = false, // true면 size에 비례해 자동 두께
    badgeBorderPx = 2, // 배지 테두리 두께(px)
}: {
    src: string;
    alt: string;
    tier: string;
    label?: string;
    size?: number;
    thickness?: number;
    corner?: Corner;
    radius?: Radius;
    className?: string;
    bgClassName?: string;
    showBadge?: boolean;
    badgeRounded?: "md" | "lg" | "xl";
    frameThickness?: number;
    autoThickness?: boolean;
    badgeBorderPx?: number;
}) {
    const color = getTierColor(tier);
    const cornerCls = corner === "tr" ? "top-1 right-1" : "top-1 left-1";

    // 사이즈에 따라 글자/패딩
    const isSmall = size <= 64;
    const textCls = isSmall ? "text-[10px]" : "text-xs";
    const padCls = isSmall ? "px-1.5 py-0.5" : "px-2 py-1";

    // 🔥 최종 프레임 두께 계산
    // autoThickness가 참이면 size 비례(대략 1/18)로,
    // 아니면 frameThickness > thickness > 2 순으로 결정
    const computedFrame = autoThickness
        ? Math.max(2, Math.round(size / 18))
        : (frameThickness ?? thickness ?? 2);

    return (
        <div
            className={`relative inline-block ${className ?? ""}`}
            style={{ width: size, height: size }}
        >
            {/* 1) 이미지 */}
            <div
                className={`absolute inset-0 overflow-hidden ${rcls[radius]} ${bgClassName}`}
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className={`object-cover object-center ${rcls[radius]}`}
                    sizes={`${size}px`}
                    priority
                />
            </div>

            {/* 2) 안쪽 사각 프레임 (두께 ↑) */}
            <div
                className={`pointer-events-none absolute inset-0 ${rcls[radius]}`}
                style={{ boxShadow: `inset 0 0 0 ${computedFrame}px ${color}` }}
                aria-hidden
            />

            {/* 3) 티어 배지 */}
            {showBadge && (
                <div className={`absolute z-10 ${cornerCls}`}>
                    <span
                        className={[
                            "select-none border font-bold leading-none",
                            padCls,
                            textCls,
                            badgeRounded === "lg"
                                ? "rounded-lg"
                                : badgeRounded === "xl"
                                  ? "rounded-xl"
                                  : "rounded-md",
                        ].join(" ")}
                        style={{
                            color,
                            borderColor: color,
                            borderWidth: badgeBorderPx, // ← 배지 테두리 두께 조정
                            background: hexToRGBA(color, 0.18),
                            boxShadow: "0 1px 2px rgba(0,0,0,.25)",
                        }}
                        aria-label={`티어 ${label ?? tier}`}
                        title={`티어 ${label ?? tier}`}
                    >
                        {label ?? tier}
                    </span>
                </div>
            )}
        </div>
    );
}
