import { useState, useRef, type ChangeEvent } from "react";
import { encodeText, decodeText } from "../utils/base64";

interface FileInfo {
  name: string;
  size: number;
  type: string;
}

export default function Base64Tool() {
  const [tab, setTab] = useState<"text" | "file">("text");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [fileB64, setFileB64] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function encode() {
    setError("");
    try {
      setOutput(encodeText(input));
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }

  function decode() {
    setError("");
    try {
      setOutput(decodeText(input));
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileInfo({ name: file.name, size: file.size, type: file.type });
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const b64 = dataUrl.split(",")[1] ?? "";
      setFileB64(b64);
      setError("");
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  }

  function downloadDecoded() {
    if (!fileB64 || !fileInfo) return;
    const binary = atob(fileB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], {
      type: fileInfo.type || "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileInfo.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyOutput() {
    navigator.clipboard.writeText(output);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Base64</h1>
        <p className="text-text-secondary text-sm">
          Encode and decode text or files.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface-raised rounded-lg p-1 w-fit">
        {(["text", "file"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError("");
              setOutput("");
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

      {tab === "text" && (
        <div className="tool-card space-y-4">
          <div>
            <label className="tool-label">Input</label>
            <textarea
              className="tool-textarea h-32"
              placeholder="Enter text or Base64 string…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={encode}>
              Encode
            </button>
            <button className="btn-secondary" onClick={decode}>
              Decode
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="tool-label mb-0">Output</label>
                <button
                  className="text-xs text-accent-hover hover:underline"
                  onClick={copyOutput}
                >
                  Copy
                </button>
              </div>
              <div className="output-block text-sm">{output}</div>
            </div>
          )}
        </div>
      )}

      {tab === "file" && (
        <div className="tool-card space-y-4">
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
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {fileInfo && fileB64 && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                {fileInfo.name} — {(fileInfo.size / 1024).toFixed(1)} KB
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="tool-label mb-0">Base64 Output</label>
                  <button
                    className="text-xs text-accent-hover hover:underline"
                    onClick={() => navigator.clipboard.writeText(fileB64)}
                  >
                    Copy
                  </button>
                </div>
                <div className="output-block text-xs max-h-48 overflow-y-auto">
                  {fileB64}
                </div>
              </div>
              <button
                className="btn-secondary text-sm"
                onClick={downloadDecoded}
              >
                Download decoded file
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
