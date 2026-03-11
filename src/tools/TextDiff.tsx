import { useState, useEffect, useMemo, useRef } from "react";
import { debounce } from "@huunguyencs/utils";
import { lineDiff, wordDiff, computeStats } from "./diffEngine";
import type { SideBySideRow, InlineSpan, DiffStats } from "./diffEngine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

// ---------------------------------------------------------------------------
// Span class helpers
// ---------------------------------------------------------------------------

function origSpanClass(type: "equal" | "insert" | "delete"): string {
  if (type === "delete") return "bg-red-700/70";
  return "";
}

function modSpanClass(type: "equal" | "insert" | "delete"): string {
  if (type === "insert") return "bg-green-700/70";
  return "";
}

// ---------------------------------------------------------------------------
// Cell rendering helper
// ---------------------------------------------------------------------------

function renderSpans(
  spans: InlineSpan[],
  spanClassFn: (type: "equal" | "insert" | "delete") => string,
) {
  return spans.map((s, i) => {
    const cls = spanClassFn(s.type);
    return cls ? (
      <span key={i} className={cls}>
        {s.value}
      </span>
    ) : (
      <span key={i}>{s.value}</span>
    );
  });
}

function renderCell(
  text: string | null,
  lineNum: number | null,
  spans: InlineSpan[] | undefined,
  bgClass: string,
  spanClassFn: (type: "equal" | "insert" | "delete") => string,
) {
  return (
    <div className={`flex items-start px-2 py-0.5 font-mono text-sm ${bgClass}`}>
      <span className="text-text-muted text-xs w-10 shrink-0 text-right pr-3 select-none leading-5">
        {lineNum ?? ""}
      </span>
      <span className="flex-1 break-all whitespace-pre-wrap leading-5 min-h-[1.25rem]">
        {text === null ? (
          "\u00a0"
        ) : spans ? (
          renderSpans(spans, spanClassFn)
        ) : (
          text || "\u00a0"
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row background classes
// ---------------------------------------------------------------------------

function rowOrigBg(type: SideBySideRow["type"]): string {
  if (type === "delete" || type === "replace") return "bg-red-950/60";
  return "";
}

function rowModBg(type: SideBySideRow["type"]): string {
  if (type === "insert" || type === "replace") return "bg-green-950/60";
  return "";
}

function rowEqualTextClass(): string {
  return "text-text-secondary";
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TextDiff() {
  // --- Input state ---
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  // --- Controls state ---
  const [viewMode, setViewMode] = useState<"side-by-side" | "unified">("side-by-side");
  const [granularity, setGranularity] = useState<"line" | "word" | "char">("line");
  const [ignoreWs, setIgnoreWs] = useState(false);

  // --- Diff output state ---
  const [diffRows, setDiffRows] = useState<SideBySideRow[]>([]);
  const [stats, setStats] = useState<DiffStats>({ added: 0, removed: 0, unchanged: 0 });

  // --- Scroll sync refs ---
  const scrollingRef = useRef(false);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // --- Textarea refs (for swap height reset) ---
  const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rightTextareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Handlers ---
  function handleSwap() {
    setLeft(right);
    setRight(left);
    // Reset heights — will be recalculated on next render via useEffect
    if (leftTextareaRef.current) leftTextareaRef.current.style.height = "auto";
    if (rightTextareaRef.current) rightTextareaRef.current.style.height = "auto";
  }

  function handleLeftScroll() {
    if (scrollingRef.current) return;
    scrollingRef.current = true;
    if (rightScrollRef.current && leftScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
      rightScrollRef.current.scrollLeft = leftScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      scrollingRef.current = false;
    });
  }

  function handleRightScroll() {
    if (scrollingRef.current) return;
    scrollingRef.current = true;
    if (leftScrollRef.current && rightScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
      leftScrollRef.current.scrollLeft = rightScrollRef.current.scrollLeft;
    }
    requestAnimationFrame(() => {
      scrollingRef.current = false;
    });
  }

  // --- Debounced diff computation ---
  const runDiff = useMemo(
    () =>
      debounce((l: string, r: string, g: typeof granularity, iw: boolean) => {
        if (l === "" && r === "") {
          setDiffRows([]);
          setStats({ added: 0, removed: 0, unchanged: 0 });
          return;
        }
        // char granularity uses lineDiff — charDiff is called internally on replace rows
        const rows = g === "word" ? wordDiff(l, r) : lineDiff(l, r, iw);
        setDiffRows(rows);
        setStats(computeStats(rows));
      }, 300),
    [],
  );

  useEffect(() => {
    runDiff(left, right, granularity, ignoreWs);
  }, [left, right, granularity, ignoreWs, runDiff]);

  // --- Sync textarea heights after swap ---
  useEffect(() => {
    if (leftTextareaRef.current && left !== "") {
      autoResize(leftTextareaRef.current);
    }
    if (rightTextareaRef.current && right !== "") {
      autoResize(rightTextareaRef.current);
    }
  }, [left, right]);

  // --- Derived state ---
  const isEmpty = left === "" && right === "";
  const isIdentical =
    !isEmpty && stats.added === 0 && stats.removed === 0 && diffRows.length > 0;

  // ---------------------------------------------------------------------------
  // Side-by-side view rendering
  // ---------------------------------------------------------------------------

  function renderSideBySide() {
    return (
      <div className="flex gap-0 border border-white/10 rounded-lg overflow-hidden">
        {/* Left column — Original */}
        <div
          ref={leftScrollRef}
          onScroll={handleLeftScroll}
          className="flex-1 overflow-x-auto overflow-y-auto max-h-[60vh] border-r border-white/10"
        >
          <div className="min-w-0">
            <div className="px-2 py-1 bg-surface-overlay text-text-muted text-xs font-medium sticky top-0 z-10">
              Original
            </div>
            {diffRows.map((row, i) => {
              if (row.type === "insert") {
                // Placeholder on orig side, content on mod side
                return (
                  <div key={i} className="bg-green-950/20 min-h-[1.25rem] flex items-start px-2 py-0.5">
                    <span className="w-10 shrink-0" />
                    <span className="flex-1">{"\u00a0"}</span>
                  </div>
                );
              }
              const bgClass =
                row.type === "equal" ? rowEqualTextClass() : rowOrigBg(row.type);
              const isEqual = row.type === "equal";
              return renderCell(
                row.origText,
                row.origLineNum,
                row.type === "replace" ? row.inlineOrig : undefined,
                isEqual ? "" : bgClass,
                origSpanClass,
              );
            })}
          </div>
        </div>

        {/* Right column — Modified */}
        <div
          ref={rightScrollRef}
          onScroll={handleRightScroll}
          className="flex-1 overflow-x-auto overflow-y-auto max-h-[60vh]"
        >
          <div className="min-w-0">
            <div className="px-2 py-1 bg-surface-overlay text-text-muted text-xs font-medium sticky top-0 z-10">
              Modified
            </div>
            {diffRows.map((row, i) => {
              if (row.type === "delete") {
                // Placeholder on mod side
                return (
                  <div key={i} className="bg-red-950/20 min-h-[1.25rem] flex items-start px-2 py-0.5">
                    <span className="w-10 shrink-0" />
                    <span className="flex-1">{"\u00a0"}</span>
                  </div>
                );
              }
              const isEqual = row.type === "equal";
              return renderCell(
                row.modText,
                row.modLineNum,
                row.type === "replace" ? row.inlineMod : undefined,
                isEqual ? "" : rowModBg(row.type),
                modSpanClass,
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Unified view rendering
  // ---------------------------------------------------------------------------

  function renderUnified() {
    const lines: { key: string; prefix: string; bgClass: string; text: string; lineNum: string }[] =
      [];

    diffRows.forEach((row, i) => {
      if (row.type === "equal") {
        lines.push({
          key: `e-${i}`,
          prefix: " ",
          bgClass: "",
          text: row.origText ?? "",
          lineNum: `${row.origLineNum ?? ""}`,
        });
      } else if (row.type === "delete") {
        lines.push({
          key: `d-${i}`,
          prefix: "-",
          bgClass: "bg-red-950/60 text-red-300",
          text: row.origText ?? "",
          lineNum: `${row.origLineNum ?? ""}`,
        });
      } else if (row.type === "insert") {
        lines.push({
          key: `ins-${i}`,
          prefix: "+",
          bgClass: "bg-green-950/60 text-green-300",
          text: row.modText ?? "",
          lineNum: `${row.modLineNum ?? ""}`,
        });
      } else if (row.type === "replace") {
        lines.push({
          key: `rd-${i}`,
          prefix: "-",
          bgClass: "bg-red-950/60 text-red-300",
          text: row.origText ?? "",
          lineNum: `${row.origLineNum ?? ""}`,
        });
        lines.push({
          key: `ri-${i}`,
          prefix: "+",
          bgClass: "bg-green-950/60 text-green-300",
          text: row.modText ?? "",
          lineNum: `${row.modLineNum ?? ""}`,
        });
      }
    });

    return (
      <div className="overflow-x-auto overflow-y-auto max-h-[60vh] border border-white/10 rounded-lg">
        {lines.map((line) => (
          <div
            key={line.key}
            className={`flex items-start px-2 py-0.5 font-mono text-sm ${line.bgClass}`}
          >
            <span className="text-text-muted text-xs w-6 shrink-0 text-center select-none leading-5">
              {line.prefix}
            </span>
            <span className="text-text-muted text-xs w-10 shrink-0 text-right pr-3 select-none leading-5">
              {line.lineNum}
            </span>
            <span className="flex-1 break-all whitespace-pre-wrap leading-5">
              {line.text || "\u00a0"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Input card */}
      <div className="tool-card">
        <div className="flex gap-3 items-start">
          {/* Left textarea */}
          <div className="flex-1 space-y-1">
            <label className="tool-label">Original</label>
            <textarea
              ref={leftTextareaRef}
              className="tool-textarea font-mono text-sm w-full"
              style={{ resize: "none", overflow: "hidden", minHeight: "8rem" }}
              placeholder="Original text..."
              value={left}
              spellCheck={false}
              onChange={(e) => {
                setLeft(e.target.value);
                autoResize(e.target);
              }}
            />
          </div>

          {/* Swap button — centered vertically */}
          <div className="flex flex-col items-center justify-center pt-7">
            <button
              className="btn-secondary p-2"
              title="Swap sides"
              onClick={handleSwap}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M7 16V4m0 0L3 8m4-4l4 4" />
                <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Right textarea */}
          <div className="flex-1 space-y-1">
            <label className="tool-label">Modified</label>
            <textarea
              ref={rightTextareaRef}
              className="tool-textarea font-mono text-sm w-full"
              style={{ resize: "none", overflow: "hidden", minHeight: "8rem" }}
              placeholder="Modified text..."
              value={right}
              spellCheck={false}
              onChange={(e) => {
                setRight(e.target.value);
                autoResize(e.target);
              }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap px-1">
        {/* View mode segmented group */}
        <div className="flex gap-1">
          {(["side-by-side", "unified"] as const).map((mode) => (
            <button
              key={mode}
              className={`btn-secondary text-xs ${
                viewMode === mode ? "ring-1 ring-accent-primary" : ""
              }`}
              onClick={() => setViewMode(mode)}
            >
              {mode === "side-by-side" ? "Side by side" : "Unified"}
            </button>
          ))}
        </div>

        {/* Granularity segmented group */}
        <div className="flex gap-1">
          {(["line", "word", "char"] as const).map((g) => (
            <button
              key={g}
              className={`btn-secondary text-xs capitalize ${
                granularity === g ? "ring-1 ring-accent-primary" : ""
              }`}
              onClick={() => setGranularity(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Ignore whitespace */}
        <label className="flex items-center gap-1.5 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreWs}
            onChange={(e) => setIgnoreWs(e.target.checked)}
          />
          Ignore whitespace
        </label>

        {/* Summary stats — far right */}
        {diffRows.length > 0 && (
          <span className="ml-auto text-sm font-mono">
            <span className="text-green-400">+{stats.added}</span>{" "}
            <span className="text-red-400">-{stats.removed}</span>{" "}
            <span className="text-text-muted">={stats.unchanged}</span>
          </span>
        )}
      </div>

      {/* Diff output card */}
      <div className="tool-card overflow-hidden">
        {isEmpty ? (
          <p className="text-text-muted text-sm text-center py-8">
            Paste text in both fields to see the diff
          </p>
        ) : (
          <>
            {isIdentical && (
              <div className="text-sm text-text-secondary bg-surface-overlay rounded px-3 py-1.5 mb-3 inline-block">
                Texts are identical
              </div>
            )}
            {viewMode === "side-by-side" ? renderSideBySide() : renderUnified()}
          </>
        )}
      </div>
    </div>
  );
}
