import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { hashBuffer, textToBuffer, type HashResult } from "../utils/hash";

interface FileInfo {
  name: string;
  size: number;
}

export default function HashGenerator() {
  const [tab, setTab] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState<HashResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [secure, setSecure] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSecure(window.isSecureContext);
  }, []);

  useEffect(() => {
    if (tab !== "text" || !text.trim()) {
      setHashes(null);
      return;
    }
    let cancelled = false;
    hashBuffer(textToBuffer(text))
      .then((h) => {
        if (!cancelled) setHashes(h);
      })
      .catch(() => {
        if (!cancelled) setError("Hashing failed.");
      });
    return () => {
      cancelled = true;
    };
  }, [text, tab]);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileInfo({ name: file.name, size: file.size });
    setHashes(null);
    setError("");
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const h = await hashBuffer(buffer);
      setHashes(h);
    } catch {
      setError("Failed to hash file.");
    } finally {
      setLoading(false);
    }
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value);
  }

  if (!secure) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="tool-card">
          <p className="text-red-400 font-medium mb-2">
            Secure context required
          </p>
          <p className="text-text-secondary text-sm">
            Web Crypto API requires HTTPS or localhost. Hash Generator is
            unavailable on plain HTTP.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Hash Generator
        </h1>
        <p className="text-text-secondary text-sm">
          SHA-1 and SHA-256 via Web Crypto API.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface-raised rounded-lg p-1 w-fit">
        {(["text", "file"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setHashes(null);
              setError("");
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-accent-primary text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="tool-card space-y-4">
        {tab === "text" && (
          <div>
            <label className="tool-label">Input Text</label>
            <textarea
              className="tool-textarea h-32"
              placeholder="Enter text to hash…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
            />
          </div>
        )}

        {tab === "file" && (
          <div>
            <label className="tool-label">Select File</label>
            <input
              ref={fileRef}
              type="file"
              onChange={handleFile}
              className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0 file:text-sm file:font-medium
                         file:bg-surface-overlay file:text-text-primary
                         hover:file:bg-accent-muted cursor-pointer"
            />
            {fileInfo && (
              <p className="text-sm text-text-secondary mt-2">
                {fileInfo.name} — {(fileInfo.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {loading && (
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Computing hash…
          </div>
        )}

        {hashes && (
          <div className="space-y-3">
            {(
              [
                ["SHA-1", hashes.sha1],
                ["SHA-256", hashes.sha256],
              ] as [string, string][]
            ).map(([algo, hash]) => (
              <div key={algo}>
                <div className="flex items-center justify-between mb-1">
                  <label className="tool-label mb-0">{algo}</label>
                  <button
                    className="text-xs text-accent-hover hover:underline"
                    onClick={() => copy(hash)}
                  >
                    Copy
                  </button>
                </div>
                <div className="output-block text-xs">{hash}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
