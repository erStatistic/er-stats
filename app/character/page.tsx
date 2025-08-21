// app/page.tsx
import HomeClient from "@/components/HomeClient";
import { makeMock } from "@/lib/mock";
import { mulberry32 } from "@/lib/rng";

export default function CharacterStatPage() {
    const rng = mulberry32(12345);
    const rows = makeMock(36, rng);

    return <HomeClient initialRows={rows} />;
}
