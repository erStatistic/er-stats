// features/home/components/FeatureTiles.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

type FeatureItem = {
    key: string;
    title: string;
    caption?: string;
    image: string; // /public or absolute URL
    accent?: string; // 포인트 색
    href?: string; // 내부/외부 링크
    external?: boolean; // 외부 링크 새 탭
    comingSoon?: boolean; // 공사중 배지
};

export default function FeatureTiles({
    items,
    className = "",
}: {
    items: FeatureItem[];
    className?: string;
}) {
    return (
        <section className={`mt-8 ${className}`}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                {items.map((it) => {
                    const disabled = !!(it.comingSoon || !it.href);
                    const Base: any =
                        disabled || !it.href ? "div" : it.external ? "a" : Link;
                    const baseProps: any =
                        disabled || !it.href
                            ? { "aria-disabled": true }
                            : it.external
                              ? {
                                    href: it.href,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                }
                              : { href: it.href, prefetch: true };

                    // 포인트 색 (상단 바만 사용, 테두리는 중립)
                    const accent = it.accent ?? "#6ea8fe";

                    return (
                        <Base
                            key={it.key}
                            {...baseProps}
                            className={[
                                // ✅ 초록룩 제거: ring-app 대신 중립 border
                                "group relative block rounded-2xl overflow-hidden bg-surface",
                                "border border-white/10 hover:border-white/20",
                                "transition-[border,transform] will-change-transform",
                                disabled
                                    ? "cursor-not-allowed opacity-90"
                                    : "hover:translate-y-[-1px]",
                            ].join(" ")}
                            style={{ ["--accent" as any]: accent }}
                        >
                            {/* 상단 포인트 바 (accent) */}
                            <div
                                className="absolute left-0 top-0 h-1 w-full"
                                style={{
                                    background:
                                        "linear-gradient(90deg, var(--accent), transparent 70%)",
                                }}
                            />

                            {/* 이미지 영역 */}
                            <div className="relative aspect-[4/3] sm:aspect-square">
                                <Image
                                    src={it.image}
                                    alt={it.title}
                                    fill
                                    sizes="(min-width: 640px) 33vw, 100vw"
                                    // ✅ 어둡지 않게 기본 밝기/대비 상승 + 오버레이 약화
                                    className={`object-cover object-center transition-transform duration-500 ${
                                        disabled
                                            ? ""
                                            : "group-hover:scale-[1.03]"
                                    } brightness-110 contrast-105`}
                                    priority={false}
                                />
                                {/* ✅ 기존 from-black/60 → 35로 완화, via-black/10 */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />
                            </div>

                            {/* 텍스트 */}
                            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                                {it.caption && (
                                    <p className="text-xs sm:text-sm text-white/80 mb-1">
                                        {it.caption}
                                    </p>
                                )}
                                <h3 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">
                                    {it.title}
                                </h3>
                            </div>
                        </Base>
                    );
                })}
            </div>
        </section>
    );
}
