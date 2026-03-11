// diffEngine.ts — Pure Myers diff engine. No React. No side effects. No runtime dependencies.

export type ChangeType = "equal" | "insert" | "delete";

export interface InlineSpan {
  type: ChangeType;
  value: string;
}

export interface SideBySideRow {
  type: "equal" | "replace" | "insert" | "delete";
  origLineNum: number | null; // 1-based; null = placeholder row
  modLineNum: number | null; // 1-based; null = placeholder row
  origText: string | null; // null = this side has no line (placeholder)
  modText: string | null; // null = this side has no line (placeholder)
  inlineOrig?: InlineSpan[]; // only on type="replace", only if line ≤500 chars
  inlineMod?: InlineSpan[]; // only on type="replace", only if line ≤500 chars
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

const CHAR_DIFF_THRESHOLD = 500;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function normalizeWs(token: string): string {
  return token.replace(/\s+/g, " ").trim();
}

type EditToken = { type: ChangeType; value: string };

/**
 * Myers diff algorithm.
 * Returns a flat edit script (equal/delete/insert tokens) transforming `a` into `b`.
 * Accepts an optional `compare` function for custom equality (e.g., ignore-whitespace).
 * The `value` in the returned tokens is always the original token text from `a` or `b`.
 */
function myersDiff(
  a: string[],
  b: string[],
  compare: (x: string, y: string) => boolean = (x, y) => x === y
): EditToken[] {
  const n = a.length;
  const m = b.length;

  // Fast-path: both empty
  if (n === 0 && m === 0) return [];

  // Fast-path: one side empty
  if (n === 0) return b.map((v) => ({ type: "insert" as const, value: v }));
  if (m === 0) return a.map((v) => ({ type: "delete" as const, value: v }));

  const max = n + m;
  // v[k + max] = furthest x reached on diagonal k
  const v = new Int32Array(2 * max + 1);
  // Keep a snapshot of v at each edit distance d
  const trace: Int32Array[] = [];

  outer: for (let d = 0; d <= max; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      const vKm1 = v[k - 1 + max] ?? 0;
      const vKp1 = v[k + 1 + max] ?? 0;
      if (k === -d || (k !== d && vKm1 < vKp1)) {
        // Move down (insert from b)
        x = vKp1;
      } else {
        // Move right (delete from a)
        x = vKm1 + 1;
      }
      let y = x - k;
      // Extend diagonal (equal tokens)
      while (x < n && y < m && compare(a[x] ?? "", b[y] ?? "")) {
        x++;
        y++;
      }
      v[k + max] = x;
      if (x >= n && y >= m) {
        break outer;
      }
    }
  }

  return backtrack(trace, a, b, max);
}

function backtrack(
  trace: Int32Array[],
  a: string[],
  b: string[],
  max: number
): EditToken[] {
  const result: EditToken[] = [];
  let x = a.length;
  let y = b.length;

  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d];
    if (!v) continue;
    const k = x - y;

    // Determine which direction was taken to reach diagonal k at edit distance d
    const vKm1 = v[k - 1 + max] ?? 0;
    const vKp1 = v[k + 1 + max] ?? 0;
    let prevK: number;
    if (k === -d || (k !== d && vKm1 < vKp1)) {
      prevK = k + 1; // came from insert (move down)
    } else {
      prevK = k - 1; // came from delete (move right)
    }

    const prevX = v[prevK + max] ?? 0;
    const prevY = prevX - prevK;

    // Walk back along the diagonal (equal tokens) from (x,y) to the decision point
    while (x > prevX && y > prevY) {
      result.push({ type: "equal", value: a[x - 1] ?? "" });
      x--;
      y--;
    }

    if (d > 0) {
      if (x === prevX) {
        // Moved down: insert from b
        result.push({ type: "insert", value: b[y - 1] ?? "" });
        y--;
      } else {
        // Moved right: delete from a
        result.push({ type: "delete", value: a[x - 1] ?? "" });
        x--;
      }
    }
  }

  result.reverse();
  return result;
}

// ---------------------------------------------------------------------------
// charDiff — character-level diff
// ---------------------------------------------------------------------------

/**
 * Returns `{ origSpans, modSpans }` with merged InlineSpan[] arrays.
 * Consecutive equal tokens are merged into single spans for performance.
 */
export function charDiff(
  a: string,
  b: string
): { origSpans: InlineSpan[]; modSpans: InlineSpan[] } {
  const aChars = [...a]; // Unicode-aware spread
  const bChars = [...b];
  const tokens = myersDiff(aChars, bChars);

  const origSpans: InlineSpan[] = [];
  const modSpans: InlineSpan[] = [];

  for (const tok of tokens) {
    if (tok.type === "equal") {
      appendSpan(origSpans, "equal", tok.value);
      appendSpan(modSpans, "equal", tok.value);
    } else if (tok.type === "delete") {
      appendSpan(origSpans, "delete", tok.value);
    } else {
      // insert
      appendSpan(modSpans, "insert", tok.value);
    }
  }

  return { origSpans, modSpans };
}

/** Append to spans array, merging with last span if same type. */
function appendSpan(spans: InlineSpan[], type: ChangeType, value: string): void {
  const last = spans[spans.length - 1];
  if (last !== undefined && last.type === type) {
    spans[spans.length - 1] = { type, value: last.value + value };
  } else {
    spans.push({ type, value });
  }
}

// ---------------------------------------------------------------------------
// lineDiff — line-level diff
// ---------------------------------------------------------------------------

export function lineDiff(orig: string, mod: string, ignoreWs?: boolean): SideBySideRow[] {
  // CRLF normalization first (DIFF-07)
  const normOrig = normalizeLineEndings(orig);
  const normMod = normalizeLineEndings(mod);

  // Split on "\n", but treat a single empty string as zero lines
  const aLines = normOrig === "" ? [] : normOrig.split("\n");
  const bLines = normMod === "" ? [] : normMod.split("\n");

  const compare = ignoreWs
    ? (x: string, y: string) => normalizeWs(x) === normalizeWs(y)
    : (x: string, y: string) => x === y;

  const tokens = myersDiff(aLines, bLines, compare);

  return buildSideBySideRows(tokens);
}

/**
 * Convert a flat edit script into SideBySideRow[].
 * Adjacent delete+insert pairs become "replace" rows.
 */
function buildSideBySideRows(tokens: EditToken[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let origLineNum = 1;
  let modLineNum = 1;
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok === undefined) break;

    if (tok.type === "equal") {
      rows.push({
        type: "equal",
        origLineNum: origLineNum++,
        modLineNum: modLineNum++,
        origText: tok.value,
        modText: tok.value,
      });
      i++;
    } else if (tok.type === "delete") {
      // Collect consecutive deletes
      const deletes: string[] = [];
      while (i < tokens.length) {
        const t = tokens[i];
        if (t === undefined || t.type !== "delete") break;
        deletes.push(t.value);
        i++;
      }
      // Collect consecutive inserts that immediately follow
      const inserts: string[] = [];
      while (i < tokens.length) {
        const t = tokens[i];
        if (t === undefined || t.type !== "insert") break;
        inserts.push(t.value);
        i++;
      }

      // Pair 1:1 up to min(deletes, inserts) as replace rows
      const pairCount = Math.min(deletes.length, inserts.length);
      for (let p = 0; p < pairCount; p++) {
        const origText = deletes[p] ?? "";
        const modText = inserts[p] ?? "";
        const row: SideBySideRow = {
          type: "replace",
          origLineNum: origLineNum++,
          modLineNum: modLineNum++,
          origText,
          modText,
        };
        // Add inline char diff for replace rows within threshold
        if (
          origText.length <= CHAR_DIFF_THRESHOLD &&
          modText.length <= CHAR_DIFF_THRESHOLD
        ) {
          const { origSpans, modSpans } = charDiff(origText, modText);
          row.inlineOrig = origSpans;
          row.inlineMod = modSpans;
        }
        rows.push(row);
      }

      // Remaining unpaired deletes
      for (let p = pairCount; p < deletes.length; p++) {
        rows.push({
          type: "delete",
          origLineNum: origLineNum++,
          modLineNum: null,
          origText: deletes[p] ?? "",
          modText: null,
        });
      }

      // Remaining unpaired inserts
      for (let p = pairCount; p < inserts.length; p++) {
        rows.push({
          type: "insert",
          origLineNum: null,
          modLineNum: modLineNum++,
          origText: null,
          modText: inserts[p] ?? "",
        });
      }
    } else {
      // insert not preceded by delete
      rows.push({
        type: "insert",
        origLineNum: null,
        modLineNum: modLineNum++,
        origText: null,
        modText: tok.value,
      });
      i++;
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// wordDiff — word-level diff
// ---------------------------------------------------------------------------

export function wordDiff(orig: string, mod: string): SideBySideRow[] {
  if (orig === mod) {
    return [
      {
        type: "equal",
        origLineNum: 1,
        modLineNum: 1,
        origText: orig,
        modText: mod,
      },
    ];
  }

  const aWords = orig.match(/\S+|\s+/g) ?? [];
  const bWords = mod.match(/\S+|\s+/g) ?? [];
  const tokens = myersDiff(aWords, bWords);

  // Build word-level InlineSpan arrays for orig and mod
  const origSpans: InlineSpan[] = [];
  const modSpans: InlineSpan[] = [];

  for (const tok of tokens) {
    if (tok.type === "equal") {
      appendSpan(origSpans, "equal", tok.value);
      appendSpan(modSpans, "equal", tok.value);
    } else if (tok.type === "delete") {
      appendSpan(origSpans, "delete", tok.value);
    } else {
      appendSpan(modSpans, "insert", tok.value);
    }
  }

  return [
    {
      type: "replace",
      origLineNum: 1,
      modLineNum: 1,
      origText: orig,
      modText: mod,
      inlineOrig: origSpans,
      inlineMod: modSpans,
    },
  ];
}

// ---------------------------------------------------------------------------
// computeStats
// ---------------------------------------------------------------------------

export function computeStats(rows: SideBySideRow[]): DiffStats {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const row of rows) {
    if (row.type === "insert") added++;
    else if (row.type === "delete") removed++;
    else if (row.type === "equal") unchanged++;
    else if (row.type === "replace") {
      added++;
      removed++;
    }
  }

  return { added, removed, unchanged };
}
