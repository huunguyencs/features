export interface JwtHeader {
  alg?: string;
  typ?: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface JwtDecoded {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
}

export interface JwtError {
  error: string;
}

export function b64UrlDecode(str: string): unknown {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
  try {
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}

export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export function decodeJwt(token: string): JwtDecoded | JwtError {
  const parts = token.trim().split(".");
  if (parts.length !== 3)
    return { error: "Invalid JWT — expected 3 dot-separated parts." };
  const header = b64UrlDecode(parts[0] ?? "");
  const payload = b64UrlDecode(parts[1] ?? "");
  if (!header || !payload)
    return { error: "Failed to decode JWT parts (invalid Base64URL or JSON)." };
  return { header: header as JwtHeader, payload: payload as JwtPayload, signature: parts[2] ?? "" };
}
