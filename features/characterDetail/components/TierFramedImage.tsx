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
        // 🔽 새로 추가된 옵션
        frameBgAlpha = 0.12, // 프레임(테두리 영역) 배경 틴트 투명도
        strokeRatio = 0.35, // 프레임 두께 중 선의 두께 비율 (0~1)
    } = props as any;

    const color = getTierColor(tier);
    const cornerCls = corner === "tr" ? "top-1 right-1" : "top-1 left-1";

    const isSmall = size <= 64;
    const textCls = isSmall ? "text-[12px]" : "text-sm";
    const padCls = isSmall ? "px-1.5 py-0.5" : "px-2 py-1";

    const computedFrame = autoThickness
        ? Math.max(2, Math.round(size / 18))
        : (frameThickness ?? thickness ?? 2);

    // 스트로크(선) 두께는 프레임 두께의 일정 비율로
    const strokePx = Math.max(1, Math.round(computedFrame * strokeRatio));

    return (
        <div
            className={`inline-block ${className ?? ""}`}
            style={{ width: size, height: size }}
        >
            <div
                className={`relative w-full h-full overflow-hidden ${rcls[radius]} ${bgClassName}`}
                style={{ contain: "layout paint" }}
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className={`object-cover object-center ${rcls[radius]}`}
                    sizes={`${size}px`}
                    priority
                />

                {/* 🔹 프레임 배경(틴트) 레이어: 프레임 두께 전체를 부드럽게 채운다 */}
                <div
                    className={`pointer-events-none absolute inset-0 ${rcls[radius]}`}
                    style={{
                        // 프레임 영역 전체를 살짝 채워주는 반투명 컬러
                        boxShadow: `inset 0 0 0 ${computedFrame}px ${hexToRGBA(color, frameBgAlpha)}`,
                    }}
                    aria-hidden
                />

                {/* 🔹 프레임 스트로크(선) 레이어: 얇게 선명한 라인만 */}
                <div
                    className={`pointer-events-none absolute inset-0 ${rcls[radius]}`}
                    style={{
                        boxShadow: `inset 0 0 0 ${strokePx}px ${color}`,
                    }}
                    aria-hidden
                />

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
