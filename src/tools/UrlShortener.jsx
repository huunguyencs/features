import { useState } from "react";
import { nanoid } from "nanoid";

const MAP_KEY = "devtools-url-map";
const HISTORY_KEY = "devtools-url-history";
const MAX_HISTORY = 20;

function loadMap() {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || "{}");
  } catch {
    return {};
  }
}
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveMap(map) {
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}
function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export default function UrlShortener() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const baseUrl = `${window.location.origin}${window.location.pathname}`;

  function shorten() {
    setError("");
    const url = input.trim();
    if (!url) {
      setError("Please enter a URL.");
      return;
    }
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL (include http:// or https://).");
      return;
    }

    const id = nanoid(8);
    const shortUrl = `${baseUrl}#/r/${id}`;

    const map = loadMap();
    map[id] = url;
    saveMap(map);

    const newEntry = { id, shortUrl, original: url, createdAt: Date.now() };
    const newHistory = [newEntry, ...history].slice(0, MAX_HISTORY);
    saveHistory(newHistory);
    setHistory(newHistory);
    setResult(shortUrl);
    setInput("");
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function deleteEntry(id) {
    const map = loadMap();
    delete map[id];
    saveMap(map);
    const newHistory = history.filter((e) => e.id !== id);
    saveHistory(newHistory);
    setHistory(newHistory);
    if (result && result.includes(id)) setResult(null);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          URL Shortener
        </h1>
        <p className="text-text-secondary text-sm">
          Local short links — only work in this browser (stored in
          localStorage).
        </p>
      </div>

      <div className="tool-card space-y-4">
        <div>
          <label className="tool-label">Long URL</label>
          <input
            className="tool-input"
            type="url"
            placeholder="https://example.com/very/long/path?foo=bar"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && shorten()}
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
        <button className="btn-primary" onClick={shorten}>
          Shorten
        </button>

        {result && (
          <div className="bg-surface-base rounded-lg p-4 flex items-center gap-3">
            <a
              href={result}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-accent-hover font-mono text-sm break-all hover:underline"
            >
              {result}
            </a>
            <button
              className="btn-secondary shrink-0 text-sm"
              onClick={() => copyToClipboard(result)}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="tool-card space-y-3">
          <h2 className="font-semibold text-text-primary">History</h2>
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 bg-surface-base rounded-lg text-sm"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <a
                    href={entry.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-hover font-mono hover:underline block truncate"
                  >
                    {entry.shortUrl}
                  </a>
                  <p className="text-text-muted truncate">{entry.original}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="text-text-secondary hover:text-text-primary transition-colors text-xs px-2 py-1 rounded bg-surface-overlay"
                    onClick={() => copyToClipboard(entry.shortUrl)}
                  >
                    Copy
                  </button>
                  <button
                    className="text-red-400 hover:text-red-300 transition-colors text-xs px-2 py-1 rounded bg-surface-overlay"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
