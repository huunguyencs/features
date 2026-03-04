export interface HashResult {
  sha1: string;
  sha256: string;
}

export function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function textToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer as ArrayBuffer;
}

export async function hashBuffer(buffer: ArrayBuffer): Promise<HashResult> {
  const [sha1, sha256] = await Promise.all([
    crypto.subtle.digest("SHA-1", buffer),
    crypto.subtle.digest("SHA-256", buffer),
  ]);
  return {
    sha1: bufToHex(sha1),
    sha256: bufToHex(sha256),
  };
}
