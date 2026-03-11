import React, { useState, useMemo, useRef, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { buildVietQRPayload, BANKS } from "./vietqrMath";
import type { Bank } from "./vietqrMath";

// ---------------------------------------------------------------------------
// BankLogo — shows bank logo from cdn.vietqr.io, falls back to initials circle
// ---------------------------------------------------------------------------

function BankLogo({ code, size = 28 }: { code: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initial = code[0]?.toUpperCase() ?? "?";
  if (failed) {
    return (
      <div
        className="rounded-full bg-accent-muted text-accent-hover flex items-center justify-center text-xs font-bold shrink-0"
        style={{ width: size, height: size }}
      >
        {initial}
      </div>
    );
  }
  return (
    <img
      src={`https://cdn.vietqr.io/img/${code}.png`}
      alt={code}
      width={size}
      height={size}
      className="rounded-sm object-contain shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

// ---------------------------------------------------------------------------
// BankSelector — combobox with floating dropdown, collapses after selection
// ---------------------------------------------------------------------------

interface BankSelectorProps {
  selected: Bank | null;
  onSelect: (bank: Bank) => void;
}

function BankSelector({ selected, onSelect }: BankSelectorProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return BANKS;
    const q = query.toLowerCase();
    return BANKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q)
    );
  }, [query]);

  function handleSelect(bank: Bank) {
    onSelect(bank);
    setIsOpen(false);
    setQuery("");
  }

  function handleInputFocus() {
    setIsOpen(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setIsOpen(true);
  }

  // Display value: when not searching show selected bank name, otherwise show query
  const displayValue = isOpen ? query : selected ? selected.shortName : "";

  return (
    <div ref={containerRef} className="relative">
      <label className="tool-label">Bank</label>
      <div
        className="tool-input flex items-center gap-2 cursor-pointer"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {selected && !isOpen && (
          <BankLogo code={selected.code} size={20} />
        )}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted min-w-0"
          placeholder="Search or select a bank…"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        {/* Chevron indicator */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-4 h-4 text-text-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Floating dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 tool-card border border-surface-overlay shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-text-muted px-3 py-2">No banks found.</p>
          )}
          {filtered.map((bank) => (
            <div
              key={bank.bin}
              onMouseDown={(e) => {
                // Use mousedown to prevent input blur before click fires
                e.preventDefault();
                handleSelect(bank);
              }}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-overlay"
            >
              <BankLogo code={bank.code} size={22} />
              <span className="text-sm font-medium text-text-primary">
                {bank.shortName}
              </span>
              <span className="text-xs text-text-muted truncate">
                {bank.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Selected bank full name display (when closed + selected) */}
      {selected && !isOpen && (
        <p className="text-sm text-text-primary mt-1">{selected.name}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Currency formatting helpers
// ---------------------------------------------------------------------------

function formatCurrency(raw: string): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function stripFormatting(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// localStorage recents helpers
// ---------------------------------------------------------------------------

interface RecentEntry {
  bin: string;
  code: string;
  shortName: string;
  name: string;
  accountNumber: string;
}

const RECENTS_KEY = "vietqr-recents";

function loadRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentEntry[];
  } catch {
    return [];
  }
}

function saveRecent(
  entry: RecentEntry,
  current: RecentEntry[]
): RecentEntry[] {
  try {
    // Deduplicate by bin + accountNumber — move existing to front
    const deduped = current.filter(
      (r) => !(r.bin === entry.bin && r.accountNumber === entry.accountNumber)
    );
    const next = [entry, ...deduped].slice(0, 5);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    return next;
  } catch {
    return current;
  }
}

// ---------------------------------------------------------------------------
// VietQRTool — main exported component
// ---------------------------------------------------------------------------

export default function VietQRTool() {
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  // amount stores the raw numeric string (no commas)
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recents, setRecents] = useState<RecentEntry[]>(() => loadRecents());
  // generatedPayload is only set when user clicks "Generate QR"
  const [generatedPayload, setGeneratedPayload] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const isReady = !!selectedBank && accountNumber.trim().length > 0;

  function handleGenerateQR() {
    if (!isReady || !selectedBank) return;
    const payload = buildVietQRPayload({
      bin: selectedBank.bin,
      accountNumber: accountNumber.trim(),
      amount: amount.trim() || undefined,
      description: description.trim() || undefined,
    });
    setGeneratedPayload(payload);
  }

  // Clear generated QR when key inputs change (so the user knows they need to regenerate)
  function handleBankChange(bank: Bank) {
    setSelectedBank(bank);
    setGeneratedPayload(null);
  }

  function handleAccountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAccountNumber(e.target.value);
    setGeneratedPayload(null);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = stripFormatting(e.target.value);
    setAmount(raw);
    setGeneratedPayload(null);
  }

  function handleDescriptionChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDescription(e.target.value);
    setGeneratedPayload(null);
  }

  function handlePreset(value: string) {
    setAmount(value);
    setGeneratedPayload(null);
  }

  function downloadPng() {
    if (!generatedPayload) return;
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "vietqr.png";
    a.click();
    // Save to recents on download
    if (selectedBank) {
      const entry: RecentEntry = {
        bin: selectedBank.bin,
        code: selectedBank.code,
        shortName: selectedBank.shortName,
        name: selectedBank.name,
        accountNumber: accountNumber.trim(),
      };
      setRecents((prev) => saveRecent(entry, prev));
    }
  }

  const AMOUNT_PRESETS = [
    { label: "50K", value: "50000" },
    { label: "100K", value: "100000" },
    { label: "200K", value: "200000" },
    { label: "500K", value: "500000" },
    { label: "1M", value: "1000000" },
    { label: "2M", value: "2000000" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          VietQR Bank Transfer
        </h1>
        <p className="text-text-secondary text-sm">
          Generate a Vietnamese bank transfer QR code.
        </p>
      </div>

      {/* Two-column: form left, QR right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: bank selector + form fields */}
        <div className="space-y-4">
          <div className="tool-card space-y-4">
            <BankSelector selected={selectedBank} onSelect={handleBankChange} />

            {/* Account number (VIETQR-02) */}
            <div>
              <label className="tool-label">Account Number</label>
              <input
                className="tool-input"
                type="text"
                placeholder="e.g. 1234567890"
                value={accountNumber}
                onChange={handleAccountChange}
              />
            </div>

            {/* Amount (VIETQR-03) */}
            <div>
              <label className="tool-label">Amount (VND, optional)</label>
              <input
                className="tool-input"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 100,000"
                value={formatCurrency(amount)}
                onChange={handleAmountChange}
              />
              {/* Amount presets (VIETQR-09) */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {AMOUNT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePreset(p.value)}
                    className="btn-secondary text-xs px-2.5 py-1 rounded-full"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description (VIETQR-04) */}
            <div>
              <label className="tool-label">
                Description (optional, max 25 chars)
              </label>
              <input
                className="tool-input"
                type="text"
                placeholder="e.g. Chuyen tien"
                maxLength={25}
                value={description}
                onChange={handleDescriptionChange}
              />
            </div>

            {/* Generate button */}
            <button
              className="btn-primary w-full"
              disabled={!isReady}
              onClick={handleGenerateQR}
            >
              Generate QR
            </button>
          </div>
        </div>

        {/* Right: QR display + download (VIETQR-05, 06) */}
        <div className="tool-card flex flex-col items-center justify-center gap-4 min-h-[280px]">
          {generatedPayload ? (
            <>
              {/* QR with padding so the code has breathing room */}
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={generatedPayload}
                  size={220}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              {/* Hidden canvas for download */}
              <div ref={canvasRef} className="hidden">
                <QRCodeCanvas
                  value={generatedPayload}
                  size={220}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <button className="btn-primary" onClick={downloadPng}>
                Download PNG
              </button>
            </>
          ) : (
            <div
              className="border-2 border-dashed border-surface-overlay rounded-lg flex items-center justify-center"
              style={{ width: 220, height: 220 }}
            >
              <p className="text-text-muted text-sm text-center px-4">
                {isReady
                  ? "Click Generate QR to create your code"
                  : "Fill in bank and account to generate QR"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recents section (VIETQR-10) — only rendered when recents.length > 0 */}
      {recents.length > 0 && (
        <div className="tool-card space-y-2">
          <p className="text-sm font-medium text-text-secondary">Recent</p>
          {recents.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                const bank = BANKS.find((b) => b.bin === r.bin);
                if (bank) setSelectedBank(bank);
                setAccountNumber(r.accountNumber);
                setGeneratedPayload(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface-overlay text-left transition-colors"
            >
              <BankLogo code={r.code} size={24} />
              <span className="text-sm text-text-primary font-medium">{r.shortName}</span>
              <span className="text-xs text-text-muted">{r.accountNumber}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
