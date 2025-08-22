// components/RolePill.tsx
"use client";

import { Role } from "@/types";

const ROLE_ACCENT: Record<Role, string> = {
    탱커: "#8AB4F8",
    브루저: "#F59E0B",
    암살자: "#FB7185",
    원딜: "#60A5FA",
    서포터: "#34D399",
    컨트롤: "#A78BFA",
    기타: "#9CA3AF",
};

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
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
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
