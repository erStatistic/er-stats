// components/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle({
    className = "",
}: {
    className?: string;
}) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Hydration mismatch 방지
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const isDark = (theme ?? resolvedTheme) === "dark";
    const nextTheme = isDark ? "light" : "dark";

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={() => setTheme(nextTheme)}
            title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors ${className}`}
            style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text)",
            }}
        >
            <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
        </button>
    );
}
