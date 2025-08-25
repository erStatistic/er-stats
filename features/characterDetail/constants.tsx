export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const toMD = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
