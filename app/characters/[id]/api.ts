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

async function getCharacter(id: number): Promise<Character | null> {
    const base = process.env.API_BASE_URL; // 예: http://localhost:3333
    if (!base) throw new Error("API_BASE_URL is not set");

    const res = await fetch(`${base}/api/v1/characters/${id}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch character: ${res.status}`);

    const json = (await res.json()) as ApiResponse;

    // 응답 코드 체크
    if (json.code !== 200 || !json.data) return null;

    // ✅ 정규화 (대문자 → 소문자, null/빈문자 처리)
    const d = json.data;
    console.log("[getCharacter] GET", `${base}/api/v1/characters/${id}`);
    return {
        id: d.ID,
        nameKr: d.name_kr,
        imageUrlMini: (d.image_url_mini ?? "").trim(), // 빈 문자열일 수 있음
        imageUrlFull: (d.image_url_full ?? "").trim(),
    };
}
