// app/page.tsx
import CharacterClient from "@/features/character/components/CharacterClient";
import { makeMock } from "@/lib/mock";
import { mulberry32 } from "@/lib/rng";

export default function CharacterStatPage() {
    const rng = mulberry32(12345);
    const rows = makeMock(36, rng);

    return <CharacterClient initialRows={rows} />;
}
