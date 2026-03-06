import { useState, useMemo } from "react";
import { decodeJwt, formatDate, type JwtDecoded } from "@huunguyencs/utils";

const NOW_SECONDS = Math.floor(Date.now() / 1000);

function JsonView({ data }: { data: unknown }) {
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

  const isDecoded = decoded && !("error" in decoded);
  const payload = isDecoded ? (decoded as JwtDecoded).payload : null;

  const exp = payload?.exp;
  const iat = payload?.iat;
  const nbf = payload?.nbf;
  const isExpired = exp !== undefined && exp < NOW_SECONDS;

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

      {decoded && "error" in decoded && (
        <div className="tool-card">
          <p className="text-red-400 text-sm">{decoded.error}</p>
        </div>
      )}

      {isDecoded && (
        <div className="space-y-4">
          {/* Header */}
          <div className="tool-card space-y-2">
            <h2 className="font-semibold text-text-primary">Header</h2>
            <JsonView data={(decoded as JwtDecoded).header} />
          </div>

          {/* Payload */}
          <div className="tool-card space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-text-primary">Payload</h2>
              {exp !== undefined && (
                <span className={isExpired ? "badge-invalid" : "badge-valid"}>
                  {isExpired ? "Expired" : "Not expired"}
                </span>
              )}
            </div>
            <JsonView data={(decoded as JwtDecoded).payload} />

            {/* Time fields */}
            {(exp !== undefined || iat !== undefined || nbf !== undefined) && (
              <div className="space-y-1 mt-2 text-sm">
                {iat !== undefined && (
                  <p className="text-text-secondary">
                    <span className="text-text-muted font-mono mr-2">iat</span>
                    Issued at: {formatDate(iat)}
                  </p>
                )}
                {nbf !== undefined && (
                  <p className="text-text-secondary">
                    <span className="text-text-muted font-mono mr-2">nbf</span>
                    Not before: {formatDate(nbf)}
                  </p>
                )}
                {exp !== undefined && (
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
              {(decoded as JwtDecoded).signature}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
