"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Hydration mismatch 방지
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const isDark = (theme ?? resolvedTheme) === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-lg px-3 py-1.5 text-sm
                 hover:bg-white/10 transition-colors"
            aria-label="Toggle color theme"
            title={isDark ? "라이트 모드" : "다크 모드"}
        >
            {isDark ? "🌙" : "☀️"}
        </button>
    );
}
