import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
    title: "ER Stats",
    description: "Eternal Return Stats",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko">
            <body>
                <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0B1220]/80 backdrop-blur">
                    <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                        <h1 className="text-lg font-semibold text-[#00D1B2]">
                            ER Stats
                        </h1>
                    </div>
                </header>
                {children}
            </body>
        </html>
    );
}
