// app/page.tsx (서버 컴포넌트: 'use client' 없음)
import HomeClient from "@/components/HomeClient";
import NavBar from "@/components/NavBar"; // ✅ NavBar 추가
import { makeMock } from "@/lib/mock";
import { mulberry32 } from "@/lib/rng";

export default function HomePage() {
    const rng = mulberry32(12345); // 고정 시드
    const rows = makeMock(36, rng); // 서버에서 한 번 생성

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <NavBar /> {/* ✅ 상단 네비게이션 */}
            <HomeClient initialRows={rows} /> {/* 클라 컴포넌트 */}
        </div>
    );
}
