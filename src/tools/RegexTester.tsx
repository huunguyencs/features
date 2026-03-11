import { useState, useEffect, useMemo, useRef } from "react";
import { debounce } from "@huunguyencs/utils";
import Tooltip from "../components/Tooltip";

const ALL_FLAGS = ["g", "i", "m", "s", "u", "d"] as const;
type Flag = (typeof ALL_FLAGS)[number];

const FLAG_DESCRIPTIONS: Record<Flag, string> = {
  g: "Global — find all matches",
  i: "Case insensitive",
  m: "Multiline — ^ and $ match line breaks",
  s: "Dot all — . matches newlines too",
  u: "Unicode — full Unicode support",
  d: "Indices — include match position data",
};


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
  const [patternCopied, setPatternCopied] = useState(false);
  const [activePresetLabel, setActivePresetLabel] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  function syncScroll() {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

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
      setActivePresetLabel(preset.label);
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
      setActivePresetLabel(sp.name);
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
        {/* Presets dropdown — common patterns only */}
        <div>
          <label className="tool-label">Common patterns</label>
          <select
            className="tool-input"
            value=""
            onChange={handlePresetChange}
          >
            <option value="">— Load preset —</option>
            {PRESETS.map((p) => (
              <option key={p.key} value={`preset:${p.key}`}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* My patterns — chips */}
        {savedPatterns.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted">My patterns</p>
            <div className="flex flex-wrap gap-1.5">
              {savedPatterns.map((sp, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded border border-white/10 bg-surface-raised text-xs font-mono overflow-hidden"
                >
                  <button
                    className="px-2.5 py-1 text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
                    title={`Load: /${sp.pattern}/${sp.flags}`}
                    onClick={() => {
                      setPattern(sp.pattern);
                      setSelectedFlags(
                        new Set(
                          sp.flags
                            .split("")
                            .filter((c) => (ALL_FLAGS as readonly string[]).includes(c)) as Flag[],
                        ),
                      );
                      setActivePresetLabel(sp.name);
                    }}
                  >
                    {sp.name}
                  </button>
                  <button
                    className="px-1.5 py-1 text-text-muted hover:text-red-400 border-l border-white/10 hover:bg-white/5 transition-colors"
                    title="Delete"
                    onClick={() => {
                      const next = savedPatterns.filter((_, j) => j !== i);
                      setSavedPatterns(next);
                      persistSavedPatterns(next);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

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

        {/* Pattern input with / delimiter decoration + save + copy icons */}
        <div className="space-y-1.5">
          <label className="tool-label">Pattern</label>
          <div className="flex items-center gap-2">
            <div
              className="tool-input flex-1 flex items-center font-mono text-sm cursor-text gap-0"
              onClick={() => (document.getElementById("pattern-input") as HTMLInputElement)?.focus()}
            >
              <span className="text-text-secondary select-none shrink-0 opacity-75">/</span>
              <input
                id="pattern-input"
                className="bg-transparent outline-none border-0 p-0 font-mono text-sm text-text-primary placeholder-text-muted min-w-[2ch]"
                style={{ width: `${Math.max(pattern.length, 3)}ch` }}
                placeholder={String.raw`\d+`}
                value={pattern}
                onChange={(e) => { setPattern(e.target.value); setActivePresetLabel(null); }}
                spellCheck={false}
              />
              <span className="text-text-secondary select-none shrink-0 opacity-75">{"/" + flagsString}</span>
            </div>
            {/* Save / Cancel icon button */}
            <Tooltip text={showSaveInput ? "Cancel" : "Save pattern"}>
              <button
                className="btn-secondary p-2 shrink-0"
                onClick={() => setShowSaveInput((v) => !v)}
              >
                {showSaveInput ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                )}
              </button>
            </Tooltip>
            {/* Copy regex literal icon button */}
            <Tooltip text={patternCopied ? "Copied!" : "Copy"}>
              <button
                className="btn-secondary p-2 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(`/${pattern}/${flagsString}`).then(() => {
                    setPatternCopied(true);
                    setTimeout(() => setPatternCopied(false), 2000);
                  });
                }}
              >
                {patternCopied ? (
                  <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                )}
              </button>
            </Tooltip>
          </div>
          {/* Active preset label */}
          {activePresetLabel && (
            <p className="text-xs text-text-muted">
              Loaded: <span className="text-text-secondary">{activePresetLabel}</span>
            </p>
          )}
        </div>

        {/* Flags */}
        <div>
          <label className="tool-label">Flags</label>
          <div className="flex flex-wrap gap-3">
            {ALL_FLAGS.map((flag) => (
              <Tooltip key={flag} text={FLAG_DESCRIPTIONS[flag]}>
                <label className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedFlags.has(flag)}
                    onChange={() => toggleFlag(flag)}
                    className="accent-accent-primary"
                  />
                  <span className="font-mono">{flag}</span>
                </label>
              </Tooltip>
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

      {/* Test text with inline highlight overlay */}
      <div className="tool-card">
        <label className="tool-label">Test Text</label>
        <div className="relative w-full bg-surface-overlay border border-text-muted rounded-lg transition-colors focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary">
          {/* Highlight backdrop — same font/padding as textarea, text transparent, match backgrounds visible */}
          <div
            ref={highlightRef}
            className="absolute inset-0 px-3 py-2 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden pointer-events-none select-none"
            aria-hidden="true"
          >
            {segments.length > 0
              ? segments.map((seg, i) =>
                  seg.isMatch ? (
                    <span key={i} className="bg-yellow-400/30 text-transparent rounded">{seg.text}</span>
                  ) : (
                    <span key={i} className="text-transparent">{seg.text}</span>
                  ),
                )
              : <span className="text-transparent">{testText}</span>
            }
          </div>
          {/* Textarea — transparent background so highlight layer shows through */}
          <textarea
            ref={textareaRef}
            className="relative w-full min-h-[10rem] bg-transparent border-0 outline-none resize-y font-mono text-sm leading-relaxed px-3 py-2 placeholder-text-muted text-text-primary"
            placeholder="Paste or type text to test against..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            onScroll={syncScroll}
            spellCheck={false}
          />
        </div>
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
