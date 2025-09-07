"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ResponsiveVisible = {
    base: number;
    md?: number;
    lg?: number;
    xl?: number;
};

interface CarouselProps {
    children: React.ReactNode;
    responsiveVisible?: ResponsiveVisible;
    visible?: number; // 고정 개수
    autoSlide?: boolean;
    interval?: number;
    pauseOnHover?: boolean;
    className?: string;
    onIndexChange?: (index: number) => void;
    scaleActive?: number; // default 1
    scaleInactive?: number; // default 0.9
}

export default function Carousel({
    children,
    responsiveVisible = { base: 1.1, md: 1.4, lg: 1.8 },
    visible,
    autoSlide = true,
    interval = 5000,
    pauseOnHover = true,
    className = "",
    onIndexChange,
    scaleActive = 1,
    scaleInactive = 0.9,
}: CarouselProps) {
    const items = React.Children.toArray(children);
    const total = items.length;

    if (total === 0) return <div className={`w-full ${className}`} />;

    const [current, setCurrent] = useState(0);

    // 👇 하이드레이션 안정용: 마운트 전에는 반응형 계산 안 함
    const [mounted, setMounted] = useState(false);
    const [vw, setVw] = useState<number | null>(null);

    useEffect(() => {
        setMounted(true);
        const onResize = () => setVw(window.innerWidth);
        onResize(); // mount 직후 실제 width 반영
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const effVisible = useMemo(() => {
        // 1) 고정 visible이 있으면 그걸로 고정 (SSR/CSR 동일)
        if (visible && visible > 0) return visible;

        // 2) 마운트 전에는 base만 사용 → SSR과 동일하게 유지
        if (!mounted) return responsiveVisible.base;

        // 3) 마운트 후에만 실제 뷰포트로 반응형 계산
        const w = vw ?? 0;
        const { base, md, lg, xl } = responsiveVisible;
        if (w >= 1280 && xl) return xl;
        if (w >= 1024 && lg) return lg;
        if (w >= 768 && md) return md;
        return base;
    }, [visible, mounted, vw, responsiveVisible]);

    const next = () => setCurrent((c) => (c + 1) % total);
    const prev = () => setCurrent((c) => (c - 1 + total) % total);

    // 자동 슬라이드: 마운트된 뒤에만 시작
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (!mounted || !autoSlide || total <= 1 || paused) return;
        const t = setInterval(next, interval);
        return () => clearInterval(t);
    }, [mounted, autoSlide, interval, total, paused]);

    useEffect(() => {
        onIndexChange?.(current);
    }, [current, onIndexChange]);

    // 스와이프 (버튼 이벤트와 충돌 방지 가드)
    const isFromButton = (el: EventTarget | null) =>
        el instanceof HTMLElement && el.closest("button");

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const onTouchStart = (e: React.TouchEvent) => {
        if (isFromButton(e.target)) return;
        touchStartX.current = e.touches[0].clientX;
    };
    const onTouchMove = (e: React.TouchEvent) => {
        if (isFromButton(e.target)) return;
        touchEndX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (isFromButton(e.target)) return;
        const delta = touchStartX.current - touchEndX.current;
        if (Math.abs(delta) < 50) return;
        delta > 0 ? next() : prev();
    };

    const isDragging = useRef(false);
    const dragStartX = useRef(0);
    const dragEndX = useRef(0);
    const onPointerDown = (e: React.PointerEvent) => {
        if (isFromButton(e.target)) return;
        isDragging.current = true;
        dragStartX.current = e.clientX;
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || isFromButton(e.target)) return;
        dragEndX.current = e.clientX;
    };
    const onPointerUp = (e: React.PointerEvent) => {
        if (isFromButton(e.target)) {
            isDragging.current = false;
            return;
        }
        if (!isDragging.current) return;
        const delta = dragStartX.current - dragEndX.current;
        isDragging.current = false;
        if (Math.abs(delta) < 60) return;
        delta > 0 ? next() : prev();
    };

    const widthPct = `${100 / effVisible}%`;
    const translate = `translateX(calc(50% - ${(current + 0.5) * (100 / effVisible)}%))`;

    return (
        <div
            className={`relative z-0 isolate w-full overflow-hidden py-6 select-none ${className}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onMouseEnter={() => pauseOnHover && setPaused(true)}
            onMouseLeave={() => pauseOnHover && setPaused(false)}
            role="region"
            aria-roledescription="carousel"
        >
            {/* 트랙 */}
            <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: translate }}
            >
                {items.map((child, i) => {
                    const isActive = i === current;
                    return (
                        <div
                            key={i}
                            className="flex-shrink-0 flex justify-center px-2"
                            style={{ width: widthPct }}
                            aria-hidden={!isActive}
                        >
                            <div
                                className={`transition-transform transition-opacity duration-500 ease-in-out ${
                                    isActive
                                        ? "opacity-100 z-10"
                                        : "opacity-70 z-0"
                                }`}
                                style={{
                                    transform: `scale(${isActive ? scaleActive : scaleInactive})`,
                                    transformOrigin: "center",
                                }}
                            >
                                {child}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 좌/우 버튼: 이벤트 버블 차단 (스와이프와 충돌 방지) */}
            {total > 1 && (
                <>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            prev();
                        }}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60
                       hidden sm:inline-flex z-20 pointer-events-auto"
                        aria-label="이전"
                    >
                        <ChevronLeft />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            next();
                        }}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        className="absolute right-2 top-1/2 -translate-y-1/2
                       bg-black/40 text-white p-2 rounded-full hover:bg-black/60
                       hidden sm:inline-flex z-20 pointer-events-auto"
                        aria-label="다음"
                    >
                        <ChevronRight />
                    </button>
                </>
            )}

            {/* 인디케이터 */}
            {total > 1 && (
                <div className="mt-3 flex justify-center gap-2">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-2 w-2 rounded-full transition-colors ${
                                i === current
                                    ? "bg-white"
                                    : "bg-white/30 hover:bg-white/60"
                            }`}
                            aria-label={`이동 ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
