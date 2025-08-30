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

export default function TierFramedImage({ ...props }) {
    const {
        src,
        alt,
        tier,
        label,
        size = 72,
        thickness = 2,
        corner = "tl",
        radius = "xl",
        className,
        bgClassName = "bg-elev-10",
        showBadge = true,
        badgeRounded = "md",
        frameThickness,
        autoThickness = false,
        badgeBorderPx = 2,
    } = props;

    const color = getTierColor(tier);
    const cornerCls = corner === "tr" ? "top-1 right-1" : "top-1 left-1";

    const isSmall = size <= 64;
    const textCls = isSmall ? "text-[12px]" : "text-sm";
    const padCls = isSmall ? "px-1.5 py-0.5" : "px-2 py-1";

    const computedFrame = autoThickness
        ? Math.max(2, Math.round(size / 18))
        : (frameThickness ?? thickness ?? 2);

    return (
        <div
            className={`inline-block ${className ?? ""}`}
            style={{ width: size, height: size }}
        >
            {/* ✅ 이 박스가 전부의 기준점이 되도록 relative 지정 */}
            <div
                className={`relative w-full h-full overflow-hidden ${rcls[radius]} ${bgClassName}`}
                style={{ contain: "layout paint" }} // 스택/포지셔닝 안정화(옵션)
            >
                {/* 이미지: fill은 이 relative 박스 기준으로 꽉 채움 */}
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className={`object-cover object-center ${rcls[radius]}`}
                    sizes={`${size}px`}
                    priority
                />

                {/* 안쪽 프레임 */}
                <div
                    className={`pointer-events-none absolute inset-0 ${rcls[radius]}`}
                    style={{
                        boxShadow: `inset 0 0 0 ${computedFrame}px ${color}`,
                    }}
                    aria-hidden
                />

                {/* 배지: 같은 relative 박스 기준으로 고정됨 */}
                {showBadge && (
                    <div className={`absolute z-20 ${cornerCls}`}>
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
                                borderWidth: badgeBorderPx,
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
        </div>
    );
}
