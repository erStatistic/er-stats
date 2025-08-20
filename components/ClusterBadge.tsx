"use client";
import { CLUSTER_COLOR } from "@/lib/cluster";

export default function ClusterBadge({ label }: { label: string }) {
    const color = CLUSTER_COLOR[label] || "#8B9FB4";
    return (
        <span
            className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold"
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
