"use client";
import { PALETTE } from "@/features/cluster-comps";

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
