export function encodeText(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
  } catch (e) {
    throw new Error("Encoding failed: " + (e as Error).message);
  }
}

export function decodeText(str: string): string {
  try {
    const binary = atob(str.trim());
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) {
    throw new Error("Decoding failed — invalid Base64 input. " + (e as Error).message);
  }
}
