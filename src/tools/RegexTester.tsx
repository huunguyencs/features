import { useState, useEffect, useMemo } from "react";
import { debounce } from "@huunguyencs/utils";

const ALL_FLAGS = ["g", "i", "m", "s", "u", "d"] as const;
type Flag = (typeof ALL_FLAGS)[number];

interface Segment {
  text: string;
  isMatch: boolean;
  matchIndex?: number;
}

interface MatchDetail {
  index: number;
  value: string;
  groups: string[]; // numbered capture groups [1], [2], ...
  namedGroups: Record<string, string>;
}

interface SavedPattern {
  name: string;
  pattern: string;
  flags: string;
}

const SAVED_PATTERNS_KEY = "regex-tester-saved-patterns";

function loadSavedPatterns(): SavedPattern[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_PATTERNS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persistSavedPatterns(patterns: SavedPattern[]) {
  localStorage.setItem(SAVED_PATTERNS_KEY, JSON.stringify(patterns));
}

const PRESETS: { key: string; label: string; pattern: string; flags: string }[] = [
  { key: "email",     label: "Email",          pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}",                                                              flags: "gi" },
  { key: "url",       label: "URL (http/s)",   pattern: "https?:\\/\\/[^\\s/$.?#].[^\\s]*",                                                                                  flags: "gi" },
  { key: "phone",     label: "Phone",          pattern: "\\+?[0-9][\\s\\-.]?\\(?[0-9]{3}\\)?[\\s\\-.]?[0-9]{3}[\\s\\-.]?[0-9]{4}",                                         flags: "g"  },
  { key: "ipv4",      label: "IPv4 Address",   pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})\\b",                flags: "g"  },
  { key: "date_iso",  label: "ISO Date",       pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b",                                                          flags: "g"  },
  { key: "hex_color", label: "Hex Color",      pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b",                                                                                       flags: "gi" },
  { key: "uuid",      label: "UUID",           pattern: "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",                                                    flags: "gi" },
  { key: "jwt",       label: "JWT",            pattern: "ey[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+",                                                               flags: "g"  },
  { key: "html_tag",  label: "HTML Tag",       pattern: "<[a-zA-Z][^>]*>",                                                                                                   flags: "gi" },
  { key: "slug",      label: "Slug/Username",  pattern: "[a-z0-9][a-z0-9\\-_]{1,}[a-z0-9]",                                                                                 flags: "gi" },
];

export default function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [selectedFlags, setSelectedFlags] = useState<Set<Flag>>(
    new Set(["g"] as Flag[]),
  );
  const [testText, setTestText] = useState("");
  const [replacementStr, setReplacementStr] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [matches, setMatches] = useState<MatchDetail[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);
  const [replaceOutput, setReplaceOutput] = useState("");

  // UX additions
  const [showReplace, setShowReplace] = useState(false);
  const [savedPatterns, setSavedPatterns] = useState<SavedPattern[]>(loadSavedPatterns);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [copied, setCopied] = useState(false);

  const flagsString = ALL_FLAGS.filter((f) => selectedFlags.has(f)).join("");

  function toggleFlag(flag: Flag) {
    setSelectedFlags((prev) => {
      const next = new Set(prev);
      next.has(flag) ? next.delete(flag) : next.add(flag);
      return next;
    });
  }

  const runMatch = useMemo(
    () =>
      debounce((p: string, f: string, t: string, r: string) => {
        if (!p.trim()) {
          setSegments([]);
          setMatches([]);
          setRegexError(null);
          setReplaceOutput("");
          return;
        }

        let regex: RegExp;
        try {
          regex = new RegExp(p, f);
        } catch (e) {
          setRegexError((e as Error).message);
          setSegments([]);
          setMatches([]);
          setReplaceOutput("");
          return;
        }

        // Build a global version for matchAll
        const globalFlags = regex.flags.includes("g")
          ? regex.flags
          : regex.flags + "g";
        let globalRegex: RegExp;
        try {
          globalRegex = new RegExp(p, globalFlags);
        } catch (e) {
          setRegexError((e as Error).message);
          setSegments([]);
          setMatches([]);
          setReplaceOutput("");
          return;
        }

        const newSegments: Segment[] = [];
        const newMatches: MatchDetail[] = [];
        let lastIndex = 0;
        let matchIndex = 0;

        for (const match of t.matchAll(globalRegex)) {
          const start = match.index ?? 0;

          // Zero-length match guard
          if (match[0].length === 0) {
            lastIndex = start + 1;
            continue;
          }

          // Non-match segment before this match
          if (start > lastIndex) {
            newSegments.push({ text: t.slice(lastIndex, start), isMatch: false });
          }

          // Match segment
          newSegments.push({
            text: match[0],
            isMatch: true,
            matchIndex: matchIndex,
          });

          // Collect match detail
          const namedGroups: Record<string, string> = {};
          if (match.groups) {
            for (const [key, val] of Object.entries(match.groups)) {
              namedGroups[key] = val ?? "";
            }
          }

          newMatches.push({
            index: start,
            value: match[0],
            groups: match.slice(1).map((g) => g ?? ""),
            namedGroups,
          });

          lastIndex = start + match[0].length;
          matchIndex++;
        }

        // Trailing non-match segment
        if (lastIndex < t.length) {
          newSegments.push({ text: t.slice(lastIndex), isMatch: false });
        }

        // Replacement output using original (non-forced-global) regex
        let replaced = "";
        try {
          replaced = t.replace(regex, r);
        } catch {
          replaced = "";
        }

        setSegments(newSegments);
        setMatches(newMatches);
        setRegexError(null);
        setReplaceOutput(replaced);
      }, 150),
    [],
  );

  useEffect(() => {
    runMatch(pattern, flagsString, testText, replacementStr);
  }, [pattern, flagsString, testText, replacementStr, runMatch]);

  // Reset visible count when matches change
  useEffect(() => {
    setVisibleCount(20);
  }, [matches]);

  function handlePresetChange(e: { target: HTMLSelectElement }) {
    const val = e.target.value;
    if (!val) return;
    if (val.startsWith("preset:")) {
      const key = val.slice(7);
      const preset = PRESETS.find((p) => p.key === key);
      if (!preset) return;
      setPattern(preset.pattern);
      setSelectedFlags(
        new Set(
          preset.flags
            .split("")
            .filter((c) => (ALL_FLAGS as readonly string[]).includes(c)) as Flag[],
        ),
      );
    } else if (val.startsWith("saved:")) {
      const idx = parseInt(val.slice(6), 10);
      const sp = savedPatterns[idx];
      if (!sp) return;
      setPattern(sp.pattern);
      setSelectedFlags(
        new Set(
          sp.flags
            .split("")
            .filter((c) => (ALL_FLAGS as readonly string[]).includes(c)) as Flag[],
        ),
      );
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          Regex Tester
        </h1>
        <p className="text-text-secondary text-sm">
          Test patterns with real-time match highlighting.
        </p>
      </div>

      {/* Pattern & Flags card */}
      <div className="tool-card space-y-4">
        {/* Presets dropdown + Save pattern button */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="tool-label">Patterns</label>
            <select
              className="tool-input"
              value=""
              onChange={handlePresetChange}
            >
              <option value="">— Load preset —</option>
              <optgroup label="Common patterns">
                {PRESETS.map((p) => (
                  <option key={p.key} value={`preset:${p.key}`}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              {savedPatterns.length > 0 && (
                <optgroup label="My patterns">
                  {savedPatterns.map((sp, i) => (
                    <option key={i} value={`saved:${i}`}>
                      {sp.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <button
            className="btn-secondary text-xs mb-0.5"
            onClick={() => setShowSaveInput((v) => !v)}
          >
            Save pattern
          </button>
        </div>

        {/* Inline save input */}
        {showSaveInput && (
          <div className="flex items-center gap-2">
            <input
              className="tool-input flex-1"
              placeholder="Pattern name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <button
              className="btn-primary text-xs"
              onClick={() => {
                const trimmed = saveName.trim();
                if (!trimmed || !pattern.trim()) return;
                const next = [
                  ...savedPatterns,
                  { name: trimmed, pattern, flags: flagsString },
                ];
                setSavedPatterns(next);
                persistSavedPatterns(next);
                setSaveName("");
                setShowSaveInput(false);
              }}
            >
              Save
            </button>
          </div>
        )}

        {/* Saved pattern delete list */}
        {savedPatterns.length > 0 && (
          <div className="space-y-1">
            {savedPatterns.map((sp, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs text-text-secondary px-1"
              >
                <span className="font-mono truncate max-w-[80%]">{sp.name}</span>
                <button
                  className="text-text-muted hover:text-red-400 transition-colors px-1"
                  onClick={() => {
                    const next = savedPatterns.filter((_, j) => j !== i);
                    setSavedPatterns(next);
                    persistSavedPatterns(next);
                  }}
                  title="Delete pattern"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pattern input */}
        <div>
          <label className="tool-label">Pattern</label>
          <input
            className="tool-input font-mono"
            placeholder={String.raw`e.g. \b\w+\b`}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Flags */}
        <div>
          <label className="tool-label">Flags</label>
          <div className="flex flex-wrap gap-3">
            {ALL_FLAGS.map((flag) => (
              <label
                key={flag}
                className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedFlags.has(flag)}
                  onChange={() => toggleFlag(flag)}
                  className="accent-accent-primary"
                />
                <span className="font-mono">{flag}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error / match count / 0 matches badge */}
        {regexError && (
          <div className="space-y-1">
            <span className="badge-invalid">Invalid pattern</span>
            <p className="text-red-400 text-xs font-mono">{regexError}</p>
          </div>
        )}
        {!regexError && matches.length > 0 && (
          <span className="badge-valid">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </span>
        )}
        {!regexError && pattern.trim() && testText && matches.length === 0 && (
          <span className="text-xs text-text-muted font-mono px-2 py-0.5 rounded border border-white/10">
            0 matches
          </span>
        )}

        {/* Replace toggle button */}
        <div>
          <button
            className="btn-secondary text-xs"
            onClick={() => setShowReplace((v) => !v)}
          >
            Replace {showReplace ? "▼" : "▶"}
          </button>
        </div>

        {/* Replacement section (conditional) */}
        {showReplace && (
          <div className="space-y-3 pt-1 border-t border-white/10">
            <div>
              <label className="tool-label">
                Replacement{" "}
                <span className="text-text-muted font-normal text-xs">
                  (supports $1, $2, $&lt;name&gt; backreferences)
                </span>
              </label>
              <input
                className="tool-input font-mono"
                placeholder="$1 or literal text"
                value={replacementStr}
                onChange={(e) => setReplacementStr(e.target.value)}
                spellCheck={false}
              />
            </div>

            {replaceOutput && pattern && !regexError && (
              <div>
                <label className="tool-label">
                  {selectedFlags.has("g")
                    ? "All matches replaced"
                    : "First match replaced"}
                </label>
                <pre className="output-block whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">
                  {replaceOutput}
                </pre>
                <button
                  className="btn-secondary text-xs mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(replaceOutput).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                >
                  {copied ? "Copied!" : "Copy result"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test text & highlighted matches card */}
      <div className="tool-card space-y-4">
        <div>
          <label className="tool-label">Test Text</label>
          <textarea
            className="tool-textarea h-40 font-mono"
            placeholder="Paste or type text to test against..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            spellCheck={false}
          />
        </div>

        {testText && (
          <div>
            <label className="tool-label">Highlighted Matches</label>
            <pre className="output-block whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">
              {segments.length > 0
                ? segments.map((seg, i) =>
                    seg.isMatch ? (
                      <mark
                        key={i}
                        className="bg-yellow-400/30 text-yellow-200 rounded px-0.5"
                      >
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    ),
                  )
                : testText}
            </pre>
          </div>
        )}
      </div>

      {/* Match details table */}
      {matches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Matches{" "}
            <span className="text-text-muted text-base font-normal">
              ({matches.length})
            </span>
          </h2>
          <div className="tool-card overflow-x-auto">
            {(() => {
              const namedGroupKeys =
                matches.length > 0 ? Object.keys(matches[0].namedGroups) : [];
              const hasGroups = matches.some((m) => m.groups.length > 0);
              const maxGroups = hasGroups
                ? Math.max(...matches.map((m) => m.groups.length))
                : 0;

              return (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-text-muted font-medium text-xs px-3 py-2 border-b border-white/10">
                        #
                      </th>
                      <th className="text-left text-text-muted font-medium text-xs px-3 py-2 border-b border-white/10">
                        Index
                      </th>
                      <th className="text-left text-text-muted font-medium text-xs px-3 py-2 border-b border-white/10">
                        Match
                      </th>
                      {namedGroupKeys.map((key) => (
                        <th
                          key={key}
                          className="text-left text-text-muted font-medium text-xs px-3 py-2 border-b border-white/10"
                        >
                          {key}
                        </th>
                      ))}
                      {hasGroups &&
                        Array.from({ length: maxGroups }, (_, gi) => (
                          <th
                            key={gi}
                            className="text-left text-text-muted font-medium text-xs px-3 py-2 border-b border-white/10"
                          >
                            Group {gi + 1}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matches.slice(0, visibleCount).map((m, i) => (
                      <tr key={i}>
                        <td className="px-3 py-1.5 text-text-secondary border-b border-white/5 font-mono text-text-muted">
                          {i + 1}
                        </td>
                        <td className="px-3 py-1.5 text-text-secondary border-b border-white/5 font-mono">
                          {m.index}
                        </td>
                        <td className="px-3 py-1.5 text-text-secondary border-b border-white/5">
                          <span className="font-mono text-yellow-200 bg-yellow-400/20 rounded px-1">
                            {m.value}
                          </span>
                        </td>
                        {namedGroupKeys.map((key) => (
                          <td
                            key={key}
                            className="px-3 py-1.5 text-text-secondary border-b border-white/5 font-mono text-xs"
                          >
                            {m.namedGroups[key] ?? ""}
                          </td>
                        ))}
                        {hasGroups &&
                          Array.from({ length: maxGroups }, (_, gi) => (
                            <td
                              key={gi}
                              className="px-3 py-1.5 text-text-secondary border-b border-white/5 font-mono text-xs"
                            >
                              {m.groups[gi] ?? ""}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
            {matches.length > visibleCount && (
              <button
                className="btn-secondary text-xs mt-2"
                onClick={() => setVisibleCount((v) => v + matches.length)}
              >
                Show {matches.length - visibleCount} more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
