// 실제 연결 시 여기만 바꾸면 됩니다.
const API = process.env.NEXT_PUBLIC_API;

export async function fetchJSON<T>(
    url: string,
    init?: RequestInit,
): Promise<T> {
    const res = await fetch(url, { cache: "no-store", ...init });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// 예: 실 API 사용 시
// export const getCharacters = () => fetchJSON<CharacterSummary[]>(`${API}/api/v1/characters`)
// export const getCharacter  = (id: string) => fetchJSON<CharacterSummary>(`${API}/api/v1/characters/${id}`)
// export const getVariants   = (id: string) => fetchJSON<WeaponStat[]>(`${API}/api/v1/characters/${id}/variants`)
// export const getBuilds     = (id: string, weapon?: string) => fetchJSON<Build[]>(`${API}/api/v1/characters/${id}/builds${weapon ? `?weapon=${weapon}`:''}`)
// export const getTeams      = (id: string, weapon?: string) => fetchJSON<TeamComp[]>(`${API}/api/v1/characters/${id}/teams${weapon ? `?weapon=${weapon}`:''}`)
