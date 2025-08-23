"use client";

import { UserProfile } from "@/types";

// 데모용: 캐릭터별 WR/MMR 산출(결정론 난수)
function hash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}
function rnd(seed: number, a: number, b: number) {
    const r = Math.abs(Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1;
    return a + (b - a) * r;
}
function charStats(charId: number) {
    const s = hash(`char-${charId}`);
    return {
        winRate: rnd(s, 0.45, 0.62),
        mmrGain: rnd(s + 17, 4.0, 10.0),
    };
}
const fmtPercent = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtMMR = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;

type Props = {
    users: UserProfile[];
    onRemove: (name: string) => void;
};

export default function AddedUsersList({ users, onRemove }: Props) {
    if (users.length === 0) return null;

    return (
        <div className="grid gap-3">
            {users.map((u) => {
                const tops = (u.topChars ?? []).slice(0, 3);
                return (
                    <div key={u.name} className="card">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                                {u.name}
                            </div>
                            <button
                                className="text-xs rounded-md border px-2 py-1"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--surface-2)",
                                    color: "var(--text)",
                                }}
                                onClick={() => onRemove(u.name)}
                                aria-label={`${u.name} 제거`}
                                title="Remove"
                            >
                                Remove
                            </button>
                        </div>

                        {tops.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {tops.map((ch) => {
                                    const perf = charStats(ch.id);
                                    return (
                                        <div
                                            key={ch.id}
                                            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2"
                                            style={{
                                                borderColor: "var(--border)",
                                                background: "var(--muted)",
                                                color: "var(--text)",
                                            }}
                                            title={`${ch.name} · WR ${fmtPercent(perf.winRate)} · MMR ${fmtMMR(perf.mmrGain)}`}
                                        >
                                            <img
                                                src={ch.imageUrl}
                                                alt={ch.name}
                                                className="w-6 h-6 rounded-full object-cover"
                                            />
                                            <span className="text-xs font-medium">
                                                {ch.name}
                                            </span>
                                            <span
                                                className="rounded-md border px-1.5 py-0.5 text-[10px]"
                                                style={{
                                                    borderColor:
                                                        "var(--border)",
                                                    background:
                                                        "var(--surface)",
                                                }}
                                            >
                                                WR {fmtPercent(perf.winRate)}
                                            </span>
                                            <span
                                                className="rounded-md border px-1.5 py-0.5 text-[10px]"
                                                style={{
                                                    borderColor:
                                                        "var(--border)",
                                                    background:
                                                        "var(--surface)",
                                                }}
                                            >
                                                MMR {fmtMMR(perf.mmrGain)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div
                                className="mt-2 text-sm"
                                style={{ color: "var(--text-muted)" }}
                            >
                                No recent characters.
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
