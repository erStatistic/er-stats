// components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
    className?: string;
};

const LINKS = [
    { href: "/character", label: "캐릭터별 통계" },
    { href: "/cluster-comps", label: "클러스터 조합 통계" },
    // { href: "/suggest", label: "유저 맞춤 조합 추천" },
    { href: "/suggest-multi", label: "유저 맞춤 조합 추천" },
    // { href: "/comps", label: "조합별 통계" },
    { href: "/patches", label: "밸런스 패치" },
    { href: "/cluster", label: "클러스터 디렉터리" },
];

export default function NavBar({ className = "" }: Props) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <div className={`relative ${className}`}>
            {/* 가로 스크롤 컨테이너 + 스크롤바 숨김 */}
            <nav
                className="flex items-center gap-2 overflow-x-auto no-scrollbar"
                aria-label="주요 내비게이션"
            >
                {LINKS.map((l) => {
                    const active = isActive(l.href);
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`nav-pill ${active ? "is-active" : ""}`}
                            aria-current={active ? "page" : undefined}
                        >
                            {l.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
