import { useState, useCallback, type ChangeEvent } from "react";
import { CHARSETS, generateToken, type CharsetOptions, type CharsetKey } from "../utils/token";

export default function TokenGenerator() {
  const [length, setLength] = useState(32);
  const [charsets, setCharsets] = useState<CharsetOptions>({
    upper: true,
    lower: true,
    numbers: true,
    symbols: false,
  });
  const [token, setToken] = useState(() =>
    generateToken(32, {
      upper: true,
      lower: true,
      numbers: true,
      symbols: false,
    }),
  );
  const [uuid, setUuid] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUuid, setCopiedUuid] = useState(false);

  const regen = useCallback(() => {
    setToken(generateToken(length, charsets));
  }, [length, charsets]);

  function toggleCharset(key: CharsetKey) {
    setCharsets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setToken(generateToken(length, next));
      return next;
    });
  }

  function onLengthChange(e: ChangeEvent<HTMLInputElement>) {
    const l = Number(e.target.value);
    setLength(l);
    setToken(generateToken(l, charsets));
  }

  function copyToken() {
    navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    });
  }

  function generateUuid() {
    const id = crypto.randomUUID();
    setUuid(id);
  }

  function copyUuid() {
    navigator.clipboard.writeText(uuid).then(() => {
      setCopiedUuid(true);
      setTimeout(() => setCopiedUuid(false), 2000);
    });
  }

  const hasCharset = Object.values(charsets).some(Boolean);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Token Generator
        </h1>
        <p className="text-text-secondary text-sm">
          Cryptographically secure random tokens using Web Crypto API.
        </p>
      </div>

      {/* Random Token */}
      <div className="tool-card space-y-4">
        <h2 className="font-semibold text-text-primary">Random Token</h2>

        <div>
          <label className="tool-label">Length: {length}</label>
          <input
            type="range"
            min="8"
            max="128"
            value={length}
            onChange={onLengthChange}
            className="w-full accent-accent-primary"
          />
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>8</span>
            <span>128</span>
          </div>
        </div>

        <div>
          <label className="tool-label">Character Sets</label>
          <div className="flex flex-wrap gap-3 mt-1">
            {(Object.keys(CHARSETS) as CharsetKey[]).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={charsets[key]}
                  onChange={() => toggleCharset(key)}
                  className="accent-accent-primary"
                />
                <span className="text-sm text-text-secondary capitalize">
                  {key}
                </span>
              </label>
            ))}
          </div>
          {!hasCharset && (
            <p className="text-red-400 text-sm mt-1">
              Select at least one character set.
            </p>
          )}
        </div>

        <div className="output-block flex items-center justify-between gap-3">
          <span className="break-all text-sm">{token || "—"}</span>
        </div>

        <div className="flex gap-2">
          <button
            className="btn-primary"
            onClick={regen}
            disabled={!hasCharset}
          >
            Regenerate
          </button>
          <button
            className="btn-secondary"
            onClick={copyToken}
            disabled={!token}
          >
            {copiedToken ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* UUID v4 */}
      <div className="tool-card space-y-4">
        <h2 className="font-semibold text-text-primary">UUID v4</h2>
        {uuid && <div className="output-block text-sm">{uuid}</div>}
        <div className="flex gap-2">
          <button className="btn-primary" onClick={generateUuid}>
            Generate UUID
          </button>
          {uuid && (
            <button className="btn-secondary" onClick={copyUuid}>
              {copiedUuid ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
