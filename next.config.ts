// next.config.ts
import type { NextConfig } from "next";

const BACKEND = process.env.NEXT_PUBLIC_API;

const nextConfig: NextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "picsum.photos" },
            {
                protocol: "http",
                hostname: "localhost",
                port: "9000",
                pathname: "/**",
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: "/api/v1/:path*",
                destination: `${BACKEND}/api/v1/:path*`,
            },
        ];
    },
};

export default nextConfig;
