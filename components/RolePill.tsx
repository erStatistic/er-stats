"use client";
import { Role } from "@/types";

const ROLE_COLOR: Record<Role, string> = {
    탱커: "#8AB4F8",
    브루저: "#F59E0B",
    암살자: "#FB7185",
    원딜: "#60A5FA",
    서포터: "#34D399",
    컨트롤: "#A78BFA",
    기타: "#9CA3AF",
};

export default function RolePill({ role }: { role: Role }) {
    const color = ROLE_COLOR[role] || "#9CA3AF";
    return (
        <span
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{
                color,
                borderColor: `${color}66`,
                backgroundColor: `${color}22`,
            }}
        >
            {role}
        </span>
    );
}
