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
    thickness = 2, // 외곽선 두께(px)
    corner = "tl", // 배지 위치 (tl | tr)
    radius = "xl",
    className,
    bgClassName = "bg-elev-10",
    showBadge = true, // ▲ 새 옵션: 배지 노출
    badgeRounded = "md", // ▲ 새 옵션: 배지 모서리 (md|lg|xl)
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
}) {
    const color = getTierColor(tier);
    const cornerCls = corner === "tr" ? "top-1 right-1" : "top-1 left-1";

    // 사이즈에 따라 글자/패딩 살짝 조정
    const isSmall = size <= 64;
    const textCls = isSmall ? "text-[10px]" : "text-xs";
    const padCls = isSmall ? "px-1.5 py-0.5" : "px-2 py-1";

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

            {/* 2) 안쪽 외곽선 */}
            <div
                className={`pointer-events-none absolute inset-0 ${rcls[radius]}`}
                style={{ boxShadow: `inset 0 0 0 ${thickness}px ${color}` }}
                aria-hidden
            />

            {/* 3) 등급 배지 (네모) */}
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
                            background: hexToRGBA(color, 0.18), // 약간 투명 배경
                            boxShadow: "0 1px 2px rgba(0,0,0,.25)", // 살짝 떠 보이게
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
