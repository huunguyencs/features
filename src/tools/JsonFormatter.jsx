import { useState, useEffect, useCallback } from "react";

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null); // 'valid' | 'invalid' | null
  const [indent, setIndent] = useState(2);
  const [minify, setMinify] = useState(false);

  const validate = useCallback(
    debounce((text, spaces, mini) => {
      if (!text.trim()) {
        setStatus(null);
        setError("");
        setOutput("");
        return;
      }
      try {
        const parsed = JSON.parse(text);
        const formatted = mini
          ? JSON.stringify(parsed)
          : JSON.stringify(parsed, null, spaces);
        setOutput(formatted);
        setError("");
        setStatus("valid");
      } catch (e) {
        setStatus("invalid");
        setError(e.message);
        setOutput("");
      }
    }, 300),
    [],
  );

  useEffect(() => {
    validate(input, indent, minify);
  }, [input, indent, minify, validate]);

  function copyOutput() {
    navigator.clipboard.writeText(output);
  }

  function downloadJson() {
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          JSON Formatter
        </h1>
        <p className="text-text-secondary text-sm">
          Pretty-print, validate, and minify JSON.
        </p>
      </div>

      <div className="tool-card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="indent"
                checked={indent === 2 && !minify}
                onChange={() => {
                  setIndent(2);
                  setMinify(false);
                }}
                className="accent-accent-primary"
              />
              2 spaces
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="indent"
                checked={indent === 4 && !minify}
                onChange={() => {
                  setIndent(4);
                  setMinify(false);
                }}
                className="accent-accent-primary"
              />
              4 spaces
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="radio"
                name="indent"
                checked={minify}
                onChange={() => setMinify(true)}
                className="accent-accent-primary"
              />
              Minify
            </label>
          </div>
          {status && (
            <span
              className={status === "valid" ? "badge-valid" : "badge-invalid"}
            >
              {status === "valid" ? "✓ Valid JSON" : "✗ Invalid JSON"}
            </span>
          )}
        </div>

        <div>
          <label className="tool-label">Input</label>
          <textarea
            className="tool-textarea h-48"
            placeholder='{"key": "value"}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="tool-label mb-0">Output</label>
              <div className="flex gap-3">
                <button
                  className="text-xs text-accent-hover hover:underline"
                  onClick={copyOutput}
                >
                  Copy
                </button>
                <button
                  className="text-xs text-accent-hover hover:underline"
                  onClick={downloadJson}
                >
                  Download
                </button>
              </div>
            </div>
            <pre className="output-block text-xs leading-5 overflow-x-auto max-h-96">
              {output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
