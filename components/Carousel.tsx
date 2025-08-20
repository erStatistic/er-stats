"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

interface CarouselProps {
    children: React.ReactNode;
    visible?: number; // 동시에 보이는 개수 (default: 3)
    autoSlide?: boolean;
    interval?: number;
}

export default function Carousel({
    children,
    visible = 3,
    autoSlide = true,
    interval = 4000,
}: CarouselProps) {
    const items = React.Children.toArray(children);
    const [current, setCurrent] = useState(0);
    const total = items.length;

    const next = () => setCurrent((c) => (c + 1) % total);
    const prev = () => setCurrent((c) => (c - 1 + total) % total);

    // 자동 슬라이드
    useEffect(() => {
        if (!autoSlide) return;
        const t = setInterval(next, interval);
        return () => clearInterval(t);
    }, [interval, autoSlide]);

    // 드래그/스와이프 지원
    const startX = useRef(0);
    const endX = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        endX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
        const delta = startX.current - endX.current;
        if (delta > 50) next();
        if (delta < -50) prev();
    };

    return (
        <div
            className="relative w-full overflow-hidden py-6"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* 전체 슬라이드 트랙 */}
            <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                    transform: `translateX(calc(50% - ${(current + 0.5) * (100 / visible)}%))`,
                }}
            >
                {items.map((child, i) => {
                    const isActive = i === current;
                    return (
                        <div
                            key={i}
                            className="flex-shrink-0 flex justify-center"
                            style={{ width: `${100 / visible}%` }}
                        >
                            <div
                                className={`
                  transition-all duration-500 ease-in-out
                  ${isActive ? "scale-100 opacity-100 z-10" : "scale-75 opacity-50 z-0"}
                `}
                            >
                                {child}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 좌우 버튼 */}
            <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
            >
                <ChevronLeft />
            </button>
            <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
            >
                <ChevronRight />
            </button>
        </div>
    );
}
