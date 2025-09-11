// next.config.ts
import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_API;
const isLoose = process.env.LOOSE_BUILD === "1"; // 로컬에서만 느슨 빌드하고 싶을 때 LOOSE_BUILD=1

const nextConfig: NextConfig = {
    reactStrictMode: true,

    // ⬇️ dev처럼: 타입/ESLint 에러가 있어도 빌드 실패하지 않음(LOOSE_BUILD=1일 때만)
    typescript: { ignoreBuildErrors: isLoose },
    eslint: { ignoreDuringBuilds: isLoose },

    images: {
        remotePatterns: [
            { protocol: "https", hostname: "picsum.photos" },
            {
                protocol: "http",
                hostname: "218.38.121.112",
                port: "9000",
                pathname: "/**",
            },
        ],
    },

    async rewrites() {
        // BACKEND 미설정 시 잘못된 rewrite가 생기지 않도록 가드
        if (!BACKEND) return [];
        return [
            {
                source: "/api/v1/:path*",
                destination: `${BACKEND}/api/v1/:path*`,
            },
        ];
    },
};

export default nextConfig;
