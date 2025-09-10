type Character = {
    id: number;
    nameKr: string;
    imageUrl: string; // 빈 문자열일 수도 있으니 렌더링 전에 폴백 필요
};

// API 응답 타입 (참고용)
type ApiResponse = {
    code: number;
    msg: string;
    data?: {
        ID: number;
        NameKr: string;
        ImageUrlMini: string | null;
        ImageUrlFull: string | null;
        CreatedAt: string;
        UpdatedAt: string;
    } | null;
};
