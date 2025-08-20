// components/NavBar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
    const pathname = usePathname();

    const links = [
        { href: "/", label: "캐릭터별 통계" },
        { href: "/comps", label: "조합별 통계" },
    ];

    return (
        <nav className="flex gap-4 border-b border-white/10 bg-[#111A2E] p-3 mb-4 rounded-xl">
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
