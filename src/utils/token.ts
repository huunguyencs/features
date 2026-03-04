export type CharsetKey = "upper" | "lower" | "numbers" | "symbols";

export const CHARSETS: Record<CharsetKey, string> = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:,.<>?",
};

export type CharsetOptions = Record<CharsetKey, boolean>;

export function generateToken(length: number, charsets: CharsetOptions): string {
  const pool = (Object.entries(charsets) as [CharsetKey, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([key]) => CHARSETS[key])
    .join("");

  if (!pool) return "";

  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => pool[byte % pool.length]).join("");
}
