import Image from "next/image";
import { getTierColor } from "@/features/utils";

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
    label, // 기본값: tier
    size = 72,
    thickness = 2, // 외곽선 두께(px)
    corner = "tl", // 배지 위치
    radius = "xl",
    className,
    bgClassName = "bg-elev-10",
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
}) {
    const color = getTierColor(tier);
    const badgePos =
        corner === "tr" ? "top-[-6px] right-[-6px]" : "top-[-6px] left-[-6px]";

    return (
        <div
            className={`relative inline-block ${className ?? ""}`}
            style={{ width: size, height: size }}
        >
            {/* 1) 사진을 fill + cover로 꽉 채움 */}
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

            {/* 2) 이미지 '위'에 외곽선 오버레이 (inset box-shadow) */}
            <div
                className={`pointer-events-none absolute inset-0 ${rcls[radius]}`}
                style={{ boxShadow: `inset 0 0 0 ${thickness}px ${color}` }}
                aria-hidden
            />
        </div>
    );
}
