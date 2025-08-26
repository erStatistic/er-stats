// components/RolePill.tsx
"use client";

import { Role } from "@/types";
import { ROLE_ACCENT } from "@/features/constants";

export default function RolePill({
    role,
    className = "",
}: {
    role: Role;
    className?: string;
}) {
    const color = ROLE_ACCENT[role] ?? "#9CA3AF";
    const stroke = `${color}66`; // 약 40% 불투명
    const fill = `${color}22`; // 약 13% 불투명 (라이트/다크 모두 무난)

    return (
        <span
            className={`inline-flex h-6 items-center rounded-full border px-2
        text-[11px] leading-none whitespace-nowrap shrink-0 ${className}`}
            style={{
                color,
                borderColor: stroke,
                backgroundColor: fill,
            }}
            title={role}
            aria-label={`역할 ${role}`}
        >
            {role}
        </span>
    );
}
