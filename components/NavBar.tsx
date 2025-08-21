// components/NavBar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
    const pathname = usePathname();

    const links = [
        { href: "/character", label: "캐릭터별 통계" },
        { href: "/cluster-comps", label: "클러스터 조합 통계" },
        // { href: "/suggest", label: "유저 맞춤 조합 추천" },
        { href: "/suggest-multi", label: "유저 맞춤 조합 추천" },
        // { href: "/comps", label: "조합별 통계" },
        { href: "/patches", label: "밸런스 패치" },
        { href: "/cluster", label: "클러스터 디렉터리" },
    ];

    return (
        <nav className="flex gap-4  rounded-xl">
            {links.map((l) => {
                const active = pathname === l.href;
                return (
                    <Link
                        key={l.href}
                        href={l.href}
                        className={`px-3 py-1 rounded-lg text-sm ${
                            active
                                ? "bg-blue-600 text-white"
                                : "text-white/70 hover:bg-white/10"
                        }`}
                    >
                        {l.label}
                    </Link>
                );
            })}
        </nav>
    );
}
