// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
    title: "ER Stats",
    description: "Eternal Return Stats",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body className="min-h-screen transition-colors">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                >
                    <header
                        className="
              sticky top-0 z-10 backdrop-blur
              border-b
              transition-colors
            "
                        style={{
                            // 변수 사용(라이트/다크 자동 반영)
                            borderColor: "var(--border)",
                            background:
                                "color-mix(in lab, var(--bg), transparent 20%)",
                        }}
                    >
                        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
                            <h1 className="text-lg font-semibold">
                                <Link
                                    href="/"
                                    className="transition-colors"
                                    style={{ color: "var(--brand)" }}
                                >
                                    ER Stats
                                </Link>
                            </h1>
                            <NavBar />
                            <div className="ml-auto">
                                <ThemeToggle />
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto max-w-6xl px-4 py-6">
                        {children}
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}
