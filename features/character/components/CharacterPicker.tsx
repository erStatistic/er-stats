"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function CharacterPicker({
    chars,
    iconSize = 72, // 아이콘 크기(조절 가능)
    maxHeight = 420, // 세로 스크롤 높이
    columns = 10, // 한 줄에 10개
}: {
    chars: Array<{
        id: number;
        name?: string;
        imageUrlMini?: string;
        imageUrlFull?: string;
    }>;
    iconSize?: number;
    maxHeight?: number;
    columns?: number;
}) {
    const router = useRouter();
    const [q, setQ] = useState("");

    // 문자열 정규화/정리
    const norm = (s: string) => s.normalize("NFC").toLowerCase().trim();
    const collapse = (s: string) => norm(s).replace(/\s+/g, "");

    // 한글 초성 추출 (예: "재키" -> "ㅈㅋ")
    const CHO = [
        "ㄱ",
        "ㄲ",
        "ㄴ",
        "ㄷ",
        "ㄸ",
        "ㄹ",
        "ㅁ",
        "ㅂ",
        "ㅃ",
        "ㅅ",
        "ㅆ",
        "ㅇ",
        "ㅈ",
        "ㅉ",
        "ㅊ",
        "ㅋ",
        "ㅌ",
        "ㅍ",
        "ㅎ",
    ];
    const toInitials = (s: string) => {
        const base = 0xac00;
        const choUnit = 21 * 28; // 588
        let out = "";
        for (const ch of s) {
            const code = ch.charCodeAt(0);
            if (code >= 0xac00 && code <= 0xd7a3) {
                const idx = Math.floor((code - base) / choUnit);
                out += CHO[idx] ?? ch;
            } else {
                out += ch; // 한글 아닌 문자는 그대로
            }
        }
        return out;
    };

    // 검색: name 한 개 필드만 사용 (부분일치 + 초성일치 지원)
    const filtered = useMemo(() => {
        const raw = q.trim();
        if (!raw) return chars;

        const q1 = collapse(raw);
        const q2 = collapse(toInitials(raw));

        return chars.filter((c) => {
            const name = c.name ?? "";
            const n1 = collapse(name);
            const n2 = collapse(toInitials(name));
            return n1.includes(q1) || (q2 && n2.includes(q2));
        });
    }, [chars, q]);

    return (
        <section className="card overflow-hidden flex flex-col">
            {/* 검색 바 */}
            <div
                className="px-4 pb-2 flex items-center justify-between gap-2 "
                style={{ background: "var(--surface)" }}
            >
                <h3 className="font-semibold text-app">실험체 선택</h3>
                <input
                    className="w-56 rounded-xl border border-app bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted-app text-app"
                    placeholder="실험체 검색 (이름/초성)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            {/* 스크롤 영역 */}
            <div
                className="card px-3 pb-4 overflow-y-auto min-h-0 pr-1"
                style={{ maxHeight }}
            >
                {/* 10열 고정 */}
                <ul
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                >
                    {filtered.map((c) => {
                        const img =
                            c.imageUrlMini || c.imageUrlFull || "/fallback.png";
                        return (
                            <li key={c.id} className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(`/characters/${c.id}`)
                                    }
                                    title={c.name}
                                    aria-label={c.name}
                                    className="group rounded-full border border-app overflow-hidden bg-elev-10 hover:scale-[1.05] transition"
                                    style={{
                                        width: iconSize,
                                        height: iconSize,
                                    }}
                                >
                                    <img
                                        src={img}
                                        alt={c.name || ""}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {filtered.length === 0 && (
                    <div className="text-sm text-muted-app px-3 pt-3">
                        검색 결과가 없습니다.
                    </div>
                )}
            </div>
        </section>
    );
}
