"use client";

type Props = {
    input: string;
    setInput: (v: string) => void;
    loading: boolean;
    usersLength: number;
    isDuplicate: boolean;
    onAdd: () => void;
    onClearAll?: () => void;
};

export default function UserAddForm({
    input,
    setInput,
    loading,
    usersLength,
    isDuplicate,
    onAdd,
    onClearAll,
}: Props) {
    const normalized = input.trim().toLowerCase();
    const addDisabled =
        loading || !normalized || isDuplicate || usersLength >= 3;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                className="w-64 rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                }}
                placeholder="User nickname (up to 3)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !addDisabled && onAdd()}
                aria-invalid={
                    isDuplicate || usersLength >= 3 ? true : undefined
                }
            />
            <button
                onClick={onAdd}
                className="rounded-xl border px-4 py-2 text-sm transition"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    opacity: addDisabled ? 0.6 : 1,
                    cursor: addDisabled ? ("not-allowed" as const) : "pointer",
                }}
                disabled={addDisabled}
                title={
                    !normalized
                        ? "Enter a nickname"
                        : usersLength >= 3
                          ? "Max 3 users"
                          : isDuplicate
                            ? "This user is already added"
                            : undefined
                }
            >
                {loading ? "Adding..." : "Add user"}
            </button>
            {usersLength > 0 && onClearAll && (
                <button
                    onClick={onClearAll}
                    className="ml-2 rounded-xl border px-3 py-2 text-xs transition"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--surface)",
                        color: "var(--text)",
                    }}
                >
                    Clear all
                </button>
            )}
        </div>
    );
}
