"use client";

import { useCallback } from "react";

export type SegTab = { value: string; label: string };

type Props = {
    tabs: SegTab[];
    value: string;
    onChange: (v: string) => void;
    ariaLabel?: string;
};

export default function SegmentedTabs({
    tabs,
    value,
    onChange,
    ariaLabel,
}: Props) {
    const onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const idx = tabs.findIndex((t) => t.value === value);
            const nextIdx =
                e.key === "ArrowRight"
                    ? (idx + 1) % tabs.length
                    : (idx - 1 + tabs.length) % tabs.length;
            onChange(tabs[nextIdx].value);
        },
        [tabs, value, onChange],
    );

    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            onKeyDown={onKeyDown}
            className="mb-4 flex flex-wrap gap-2 p-1 rounded-xl border border-app"
            style={{ background: "var(--muted)" }}
        >
            {tabs.map((t) => {
                const active = value === t.value;
                return (
                    <button
                        key={t.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border transition-colors focus:outline-none"
                        onClick={() => onChange(t.value)}
                        style={{
                            borderColor: active
                                ? "color-mix(in oklab, var(--brand) 40%, transparent)"
                                : "var(--border)",
                            background: active
                                ? "var(--brand)"
                                : "var(--surface)",
                            color: active ? "#fff" : "var(--text)",
                        }}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}
