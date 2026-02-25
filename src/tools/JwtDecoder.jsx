import { useState, useMemo } from "react";

function b64UrlDecode(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "==".slice(0, (4 - (base64.length % 4)) % 4);
  try {
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleString();
}

function decodeJwt(token) {
  const parts = token.trim().split(".");
  if (parts.length !== 3)
    return { error: "Invalid JWT — expected 3 dot-separated parts." };
  const header = b64UrlDecode(parts[0]);
  const payload = b64UrlDecode(parts[1]);
  if (!header || !payload)
    return { error: "Failed to decode JWT parts (invalid Base64URL or JSON)." };
  return { header, payload, signature: parts[2] };
}

function JsonView({ data }) {
  return (
    <pre className="output-block text-xs leading-5 overflow-x-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function JwtDecoder() {
  const [token, setToken] = useState("");

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    return decodeJwt(token);
  }, [token]);

  const exp = decoded?.payload?.exp;
  const iat = decoded?.payload?.iat;
  const nbf = decoded?.payload?.nbf;
  // eslint-disable-next-line react-hooks/purity
  const isExpired = exp && exp < Math.floor(Date.now() / 1000);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          JWT Decoder
        </h1>
        <p className="text-text-secondary text-sm">
          Decodes header and payload — signature is NOT verified.
        </p>
      </div>

      <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg px-4 py-3 text-yellow-300 text-sm flex gap-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5 shrink-0 mt-0.5"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>
          Signature is NOT verified. Do not trust the claims for security
          decisions.
        </span>
      </div>

      <div className="tool-card space-y-3">
        <label className="tool-label">JWT Token</label>
        <textarea
          className="tool-textarea h-28"
          placeholder="Paste your JWT here…"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
        />
      </div>

      {decoded?.error && (
        <div className="tool-card">
          <p className="text-red-400 text-sm">{decoded.error}</p>
        </div>
      )}

      {decoded && !decoded.error && (
        <div className="space-y-4">
          {/* Header */}
          <div className="tool-card space-y-2">
            <h2 className="font-semibold text-text-primary">Header</h2>
            <JsonView data={decoded.header} />
          </div>

          {/* Payload */}
          <div className="tool-card space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-text-primary">Payload</h2>
              {exp && (
                <span className={isExpired ? "badge-invalid" : "badge-valid"}>
                  {isExpired ? "Expired" : "Not expired"}
                </span>
              )}
            </div>
            <JsonView data={decoded.payload} />

            {/* Time fields */}
            {(exp || iat || nbf) && (
              <div className="space-y-1 mt-2 text-sm">
                {iat && (
                  <p className="text-text-secondary">
                    <span className="text-text-muted font-mono mr-2">iat</span>
                    Issued at: {formatDate(iat)}
                  </p>
                )}
                {nbf && (
                  <p className="text-text-secondary">
                    <span className="text-text-muted font-mono mr-2">nbf</span>
                    Not before: {formatDate(nbf)}
                  </p>
                )}
                {exp && (
                  <p
                    className={
                      isExpired ? "text-red-400" : "text-text-secondary"
                    }
                  >
                    <span
                      className={`font-mono mr-2 ${isExpired ? "text-red-500" : "text-text-muted"}`}
                    >
                      exp
                    </span>
                    Expires: {formatDate(exp)}
                    {isExpired && " (EXPIRED)"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="tool-card space-y-2">
            <h2 className="font-semibold text-text-primary">Signature (raw)</h2>
            <div className="output-block text-xs break-all">
              {decoded.signature}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
