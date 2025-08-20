"use client";

const PALETTE: Record<string, string> = {
    A: "#7C3AED",
    B: "#0EA5E9",
    C: "#22C55E",
    D: "#F59E0B",
    E: "#10B981",
    F: "#6366F1",
    G: "#EF4444",
    H: "#14B8A6",
    I: "#84CC16",
    J: "#F97316",
    K: "#E879F9",
    L: "#60A5FA",
    M: "#34D399",
    N: "#A78BFA",
    O: "#F43F5E",
    P: "#06B6D4",
    Q: "#D946EF",
    R: "#FB923C",
    S: "#4ADE80",
    T: "#93C5FD",
    U: "#FCA5A5",
};

export default function ClusterChip({ label }: { label: string }) {
    const color = PALETTE[label] || "#8B9FB4";
    return (
        <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold"
            style={{
                color,
                borderColor: `${color}66`,
                backgroundColor: `${color}22`,
            }}
            title={`Cluster ${label}`}
        >
            {label}
        </span>
    );
}
