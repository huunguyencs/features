import { describe, it, expect } from "vitest";
import { lineDiff, wordDiff, charDiff, computeStats } from "./diffEngine";
import type { SideBySideRow, DiffStats } from "./diffEngine";

describe("lineDiff", () => {
  it("classifies equal, insert, delete lines correctly (DIFF-02)", () => {
    const rows = lineDiff("foo\nbar", "foo\nbaz");
    expect(rows).toHaveLength(2);
    expect(rows[0].type).toBe("equal");
    expect(rows[1].type).toBe("replace");
  });

  it("assigns correct 1-based line numbers and null for placeholder rows (DIFF-04)", () => {
    const rows = lineDiff("foo\nbar", "foo\nbaz");
    expect(rows[0].origLineNum).toBe(1);
    expect(rows[0].modLineNum).toBe(1);
    expect(rows[1].origLineNum).toBe(2);
    expect(rows[1].modLineNum).toBe(2);

    // delete-only row: modLineNum should be null
    const deleteRows = lineDiff("abc\ndef", "abc");
    const deleteRow = deleteRows.find((r) => r.type === "delete");
    expect(deleteRow).toBeDefined();
    expect(deleteRow!.modLineNum).toBeNull();

    // insert-only row: origLineNum should be null
    const insertRows = lineDiff("abc", "abc\nxyz");
    const insertRow = insertRows.find((r) => r.type === "insert");
    expect(insertRow).toBeDefined();
    expect(insertRow!.origLineNum).toBeNull();
  });

  it("normalizes CRLF before diffing (DIFF-07)", () => {
    const crlfResult = lineDiff("foo\r\nbar", "foo\nbar");
    const lfResult = lineDiff("foo\nbar", "foo\nbar");
    expect(crlfResult.length).toBe(lfResult.length);
    crlfResult.forEach((row, i) => {
      expect(row.type).toBe(lfResult[i].type);
    });
    // All rows should be equal when CRLF is normalized
    expect(crlfResult.every((r) => r.type === "equal")).toBe(true);
  });

  it("treats whitespace-only differences as equal when ignoreWs=true (DIFF-09)", () => {
    const rows = lineDiff("foo  bar", "foo bar", true);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("equal");
  });

  it("handles empty inputs without throwing (DIFF-02 edge case)", () => {
    // Both empty
    const emptyRows = lineDiff("", "");
    expect(Array.isArray(emptyRows)).toBe(true);
    // Empty result or single equal row with empty strings
    if (emptyRows.length > 0) {
      expect(emptyRows[0].type).toBe("equal");
    }

    // Original has content, modified is empty
    const deleteAll = lineDiff("abc", "");
    expect(deleteAll.length).toBeGreaterThan(0);
    expect(deleteAll.every((r) => r.type === "delete")).toBe(true);
  });
});

describe("charDiff", () => {
  it("identifies exact changed characters within a changed line (DIFF-03)", () => {
    const result = charDiff("hello world", "hello earth");
    expect(result).toHaveProperty("origSpans");
    expect(result).toHaveProperty("modSpans");

    // "hello " should be equal in both
    const origEqual = result.origSpans.find((s) => s.type === "equal");
    expect(origEqual).toBeDefined();
    expect(origEqual!.value).toContain("hello");

    // "world" should be a delete span in origSpans
    const origDelete = result.origSpans.find((s) => s.type === "delete");
    expect(origDelete).toBeDefined();
    expect(origDelete!.value).toBeTruthy();

    // "earth" should be an insert span in modSpans
    const modInsert = result.modSpans.find((s) => s.type === "insert");
    expect(modInsert).toBeDefined();
    expect(modInsert!.value).toBeTruthy();
  });

  it("returns all-equal spans for identical strings (DIFF-03 edge case)", () => {
    const result = charDiff("hello", "hello");
    expect(result.origSpans.every((s) => s.type === "equal")).toBe(true);
    expect(result.modSpans.every((s) => s.type === "equal")).toBe(true);
  });
});

describe("computeStats", () => {
  it("counts added, removed, unchanged lines correctly (DIFF-06)", () => {
    const rows: SideBySideRow[] = [
      { type: "insert", origLineNum: null, modLineNum: 1, origText: null, modText: "added" },
      { type: "delete", origLineNum: 1, modLineNum: null, origText: "removed", modText: null },
      { type: "equal", origLineNum: 2, modLineNum: 2, origText: "same", modText: "same" },
      { type: "replace", origLineNum: 3, modLineNum: 3, origText: "old", modText: "new" },
    ];
    const stats: DiffStats = computeStats(rows);
    // insert = 1 added, delete = 1 removed, equal = 1 unchanged, replace = 1 added + 1 removed
    expect(stats.added).toBe(2);
    expect(stats.removed).toBe(2);
    expect(stats.unchanged).toBe(1);
  });

  it("returns zeros for all-equal diff", () => {
    const rows: SideBySideRow[] = [
      { type: "equal", origLineNum: 1, modLineNum: 1, origText: "same", modText: "same" },
    ];
    const stats = computeStats(rows);
    expect(stats.added).toBe(0);
    expect(stats.removed).toBe(0);
    expect(stats.unchanged).toBe(1);
  });
});

describe("wordDiff", () => {
  it("produces word-level insert/delete for changed words (DIFF-11)", () => {
    const rows = wordDiff("hello world", "hello there");
    // Should contain at least one row with inlineOrig or inlineMod showing word-level spans
    expect(rows.length).toBeGreaterThan(0);

    // Find a row that has inline spans
    const changedRow = rows.find(
      (r) => (r.inlineOrig && r.inlineOrig.length > 0) || (r.inlineMod && r.inlineMod.length > 0)
    );
    expect(changedRow).toBeDefined();

    if (changedRow) {
      // "world" should appear as a delete span in inlineOrig
      const worldDelete = changedRow.inlineOrig?.find(
        (s) => s.type === "delete" && s.value.includes("world")
      );
      expect(worldDelete).toBeDefined();

      // "there" should appear as an insert span in inlineMod
      const thereInsert = changedRow.inlineMod?.find(
        (s) => s.type === "insert" && s.value.includes("there")
      );
      expect(thereInsert).toBeDefined();
    }
  });
});
