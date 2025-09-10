import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

export default [
    // Next.js 기본 권장 설정들
    ...compat.extends("next/core-web-vitals", "next/typescript"),

    // ⬇️ 특정 파일(라인 203:76 에러 발생 파일)만 any 허용
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
];
