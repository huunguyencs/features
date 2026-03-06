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

const PRESETS: Record<string, { label: string; pattern: string; flags: string }> = {
  "": { label: "— Select preset —", pattern: "", flags: "" },
  email: {
    label: "Email",
    pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}",
    flags: "gi",
  },
  url: {
    label: "URL",
    pattern: "https?:\\/\\/[^\\s/$.?#].[^\\s]*",
    flags: "gi",
  },
  phone: {
    label: "Phone",
    pattern:
      "\\+?[0-9][\\s\\-.]?\\(?[0-9]{3}\\)?[\\s\\-.]?[0-9]{3}[\\s\\-.]?[0-9]{4}",
    flags: "g",
  },
  ipv4: {
    label: "IPv4",
    pattern:
      "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9]{1,2})\\b",
    flags: "g",
  },
  date: {
    label: "ISO Date",
    pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b",
    flags: "g",
  },
};

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

  function handlePresetChange(e: { target: HTMLSelectElement }) {
    const key = e.target.value;
    if (!key) return;
    const preset = PRESETS[key];
    if (!preset) return;
    setPattern(preset.pattern);
    const newFlags = new Set<Flag>(
      (preset.flags.split("").filter((c) => (ALL_FLAGS as readonly string[]).includes(c)) as Flag[]),
    );
    setSelectedFlags(newFlags);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
        {/* Presets */}
        <div>
          <label className="tool-label">Common Patterns</label>
          <select
            className="tool-input"
            value=""
            onChange={handlePresetChange}
          >
            {Object.entries(PRESETS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

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

        {/* Error / match count */}
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

      {/* Replacement card */}
      <div className="tool-card space-y-4">
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
              {selectedFlags.has("g") ? "All matches replaced" : "First match replaced"}
            </label>
            <pre className="output-block whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">
              {replaceOutput}
            </pre>
          </div>
        )}
      </div>

      {/* Match details */}
      {matches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Matches{" "}
            <span className="text-text-muted text-base font-normal">
              ({matches.length})
            </span>
          </h2>
          {matches.map((m, i) => (
            <div
              key={i}
              className="bg-surface-raised rounded border border-white/5 p-3 space-y-1.5"
            >
              <div className="flex items-center gap-3 text-sm">
                <span className="text-text-muted font-mono">#{i + 1}</span>
                <span className="text-text-secondary">
                  index{" "}
                  <span className="font-mono text-text-primary">{m.index}</span>
                </span>
                <span className="font-mono text-yellow-200 bg-yellow-400/20 rounded px-1.5 py-0.5 text-xs">
                  {m.value}
                </span>
              </div>

              {m.groups.length > 0 && (
                <div className="text-xs text-text-muted space-y-0.5 pl-2">
                  <span className="text-text-secondary font-medium">
                    Capture groups:
                  </span>
                  {m.groups.map((g, gi) => (
                    <div key={gi} className="font-mono">
                      <span className="text-text-secondary">[{gi + 1}]:</span>{" "}
                      {g}
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(m.namedGroups).length > 0 && (
                <div className="text-xs text-text-muted space-y-0.5 pl-2">
                  <span className="text-text-secondary font-medium">
                    Named groups:
                  </span>
                  {Object.entries(m.namedGroups).map(([name, val]) => (
                    <div key={name} className="font-mono">
                      <span className="text-accent-hover font-mono">{name}</span>
                      :{" "}
                      {val}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
