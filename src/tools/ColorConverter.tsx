import { useState, useMemo } from "react";
import { debounce } from "@huunguyencs/utils";
import {
  parseHex, parseRgb, parseHsl, parseOklch,
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb,
  rgbToOklch, oklchToRgb,
  isOutOfGamut, clampToSRGB,
  relativeLuminance, contrastRatio,
} from "./colorMath";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FieldName = "hex" | "rgb" | "hsl" | "oklch";

// ---------------------------------------------------------------------------
// WCAG thresholds (WCAG 2.1)
// ---------------------------------------------------------------------------

const WCAG_NORMAL_AA  = 4.5;
const WCAG_NORMAL_AAA = 7.0;
const WCAG_LARGE_AA   = 3.0;
const WCAG_LARGE_AAA  = 4.5;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ColorConverter() {
  // Canonical state — always lowercase #rrggbb
  const [hex, setHex] = useState<string>("#3b82f6");

  // Dirty buffer — while user types, show raw; on blur revert to derived
  const [editingField, setEditingField] = useState<FieldName | null>(null);
  const [rawInput, setRawInput] = useState<Partial<Record<FieldName, string>>>({});

  // Per-field copy feedback (show checkmark for 2s)
  const [copiedField, setCopiedField] = useState<FieldName | null>(null);

  // WCAG card state
  const [wcagMode, setWcagMode] = useState<"white" | "black" | "custom">("white");
  const [wcagCustomInput, setWcagCustomInput] = useState<string>("");

  // ---------------------------------------------------------------------------
  // Derived state via useMemo
  // ---------------------------------------------------------------------------

  const rgb    = useMemo(() => hexToRgb(hex), [hex]);
  const hsl    = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);
  const oklch  = useMemo(() => rgbToOklch(rgb.r, rgb.g, rgb.b), [rgb]);
  const outOfGamut = useMemo(() => isOutOfGamut(oklch.l, oklch.c, oklch.h), [oklch]);

  // CSS display strings
  const hexStr   = useMemo(() => hex.toUpperCase(), [hex]);
  const rgbStr   = useMemo(() => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, [rgb]);
  const hslStr   = useMemo(() => `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, [hsl]);
  const oklchStr = useMemo(
    () => `oklch(${oklch.l.toFixed(2)} ${oklch.c.toFixed(3)} ${oklch.h.toFixed(1)})`,
    [oklch]
  );

  // WCAG derived state
  const wcagBgHex = useMemo((): string => {
    if (wcagMode === "white") return "#ffffff";
    if (wcagMode === "black") return "#000000";
    // custom: try parsing the text input
    const parsedHex = parseHex(wcagCustomInput);
    if (parsedHex) return parsedHex;
    const parsedRgb = parseRgb(wcagCustomInput);
    if (parsedRgb) return rgbToHex(parsedRgb.r, parsedRgb.g, parsedRgb.b);
    const parsedHsl = parseHsl(wcagCustomInput);
    if (parsedHsl) {
      const r = hslToRgb(parsedHsl.h, parsedHsl.s, parsedHsl.l);
      return rgbToHex(r.r, r.g, r.b);
    }
    return "#ffffff"; // fallback to white if custom input is invalid
  }, [wcagMode, wcagCustomInput]);

  const wcagRatio = useMemo((): number => {
    const fgRgb = hexToRgb(hex);
    const bgRgb = hexToRgb(wcagBgHex);
    const fgLum = relativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    return contrastRatio(fgLum, bgLum);
  }, [hex, wcagBgHex]);

  // ---------------------------------------------------------------------------
  // Dirty buffer helpers
  // ---------------------------------------------------------------------------

  function displayValue(field: FieldName, derived: string): string {
    return editingField === field ? (rawInput[field] ?? derived) : derived;
  }

  // Debounced parse (150ms — same as RegexTester)
  const debouncedParse = useMemo(
    () =>
      debounce((field: FieldName, value: string) => {
        let newHex: string | null = null;

        if (field === "hex") {
          newHex = parseHex(value);
        } else if (field === "rgb") {
          const r = parseRgb(value);
          if (r) newHex = rgbToHex(r.r, r.g, r.b);
        } else if (field === "hsl") {
          const h = parseHsl(value);
          if (h) {
            const r = hslToRgb(h.h, h.s, h.l);
            newHex = rgbToHex(r.r, r.g, r.b);
          }
        } else if (field === "oklch") {
          const o = parseOklch(value);
          if (o) {
            // Out-of-gamut OKLCH: parse succeeds, clamp to sRGB
            const clamped = clampToSRGB(o.l, o.c, o.h);
            newHex = rgbToHex(clamped.r, clamped.g, clamped.b);
            // Check if actually out of gamut (before clamping)
            if (isOutOfGamut(o.l, o.c, o.h)) {
              // newHex is already the clamped value
            } else {
              const inGamutRgb = oklchToRgb(o.l, o.c, o.h);
              newHex = rgbToHex(inGamutRgb.r, inGamutRgb.g, inGamutRgb.b);
            }
          }
        }

        if (newHex) setHex(newHex);
      }, 150),
    []
  );

  function handleFieldChange(field: FieldName, value: string) {
    setEditingField(field);
    setRawInput(prev => ({ ...prev, [field]: value }));
    debouncedParse(field, value);
  }

  function handleFieldBlur(field: FieldName) {
    setEditingField(null);
    setRawInput(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  // ---------------------------------------------------------------------------
  // Copy handler
  // ---------------------------------------------------------------------------

  function copyFormat(field: FieldName, value: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  // ---------------------------------------------------------------------------
  // Format cell renderer
  // ---------------------------------------------------------------------------

  function renderFormatCell(field: FieldName, label: string, derivedStr: string) {
    return (
      <div className="space-y-1.5">
        <label className="tool-label">{label}</label>
        <div className="relative flex items-center">
          <input
            className="tool-input pr-9 font-mono text-sm w-full"
            value={displayValue(field, derivedStr)}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            onBlur={() => handleFieldBlur(field)}
            spellCheck={false}
          />
          <button
            className="absolute right-2 text-text-muted hover:text-text-primary transition-colors"
            onClick={() => copyFormat(field, derivedStr)}
            aria-label={`Copy ${label}`}
          >
            {copiedField === field ? (
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            )}
          </button>
        </div>
        {field === "oklch" && outOfGamut && (
          <span className="badge-invalid text-xs">Out of sRGB gamut</span>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Color Converter</h1>
        <p className="text-text-secondary text-sm mt-1">
          Convert between HEX, RGB, HSL, and OKLCH. Click the swatch to pick a color.
        </p>
      </div>

      {/* Converter card */}
      <div className="tool-card space-y-4">
        {/* Hero swatch / native color picker */}
        <div
          className="relative w-full rounded-xl overflow-hidden"
          style={{ height: "100px", backgroundColor: hex }}
        >
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Pick color"
          />
        </div>

        {/* 2×2 format grid */}
        <div className="grid grid-cols-2 gap-4">
          {renderFormatCell("hex",   "HEX",   hexStr)}
          {renderFormatCell("rgb",   "RGB",   rgbStr)}
          {renderFormatCell("hsl",   "HSL",   hslStr)}
          {renderFormatCell("oklch", "OKLCH", oklchStr)}
        </div>
      </div>

      {/* WCAG contrast card */}
      <div className="tool-card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">WCAG Contrast</h2>
          <p className="text-text-secondary text-sm">Contrast ratio of current color against a background.</p>
        </div>

        {/* Background selector */}
        <div className="space-y-2">
          <label className="tool-label">Background</label>
          <div className="flex gap-2">
            {(["white", "black", "custom"] as const).map((mode) => (
              <button
                key={mode}
                className={`btn-secondary text-xs capitalize ${wcagMode === mode ? "ring-1 ring-accent-primary" : ""}`}
                onClick={() => setWcagMode(mode)}
              >
                {mode === "white" ? "White" : mode === "black" ? "Black" : "Custom"}
              </button>
            ))}
          </div>
          {wcagMode === "custom" && (
            <input
              className="tool-input font-mono text-sm"
              placeholder="#rrggbb or rgb(…) or hsl(…)"
              value={wcagCustomInput}
              onChange={(e) => setWcagCustomInput(e.target.value)}
              spellCheck={false}
            />
          )}
        </div>

        {/* Ratio display */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-text-primary tabular-nums">
            {wcagRatio.toFixed(2)}:1
          </span>
          <div className="flex gap-2 text-xs">
            {/* Color preview swatches side by side */}
            <div className="w-6 h-6 rounded border border-white/10" style={{ backgroundColor: hex }} title="Foreground" />
            <div className="w-6 h-6 rounded border border-white/10" style={{ backgroundColor: wcagBgHex }} title="Background" />
          </div>
        </div>

        {/* Pass/fail grid: 3×3 (header + 2 data rows × 2 AA/AAA columns) */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          {/* Header row */}
          <div />
          <div className="text-center text-text-muted text-xs font-medium">AA</div>
          <div className="text-center text-text-muted text-xs font-medium">AAA</div>
          {/* Normal text row */}
          <div className="text-text-secondary text-xs flex items-center">Normal text</div>
          <div className="flex justify-center">
            <span className={wcagRatio >= WCAG_NORMAL_AA ? "badge-valid" : "badge-invalid"}>
              {wcagRatio >= WCAG_NORMAL_AA ? "Pass" : "Fail"}
            </span>
          </div>
          <div className="flex justify-center">
            <span className={wcagRatio >= WCAG_NORMAL_AAA ? "badge-valid" : "badge-invalid"}>
              {wcagRatio >= WCAG_NORMAL_AAA ? "Pass" : "Fail"}
            </span>
          </div>
          {/* Large text row */}
          <div className="text-text-secondary text-xs flex items-center">Large text</div>
          <div className="flex justify-center">
            <span className={wcagRatio >= WCAG_LARGE_AA ? "badge-valid" : "badge-invalid"}>
              {wcagRatio >= WCAG_LARGE_AA ? "Pass" : "Fail"}
            </span>
          </div>
          <div className="flex justify-center">
            <span className={wcagRatio >= WCAG_LARGE_AAA ? "badge-valid" : "badge-invalid"}>
              {wcagRatio >= WCAG_LARGE_AAA ? "Pass" : "Fail"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
