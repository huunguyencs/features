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
  // Container slightly larger than image to give white padding
  const containerSize = size + 8;
  const imgSize = size;
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
    <div
      className="bg-white rounded flex items-center justify-center shrink-0"
      style={{ width: containerSize, height: containerSize }}
    >
      <img
        src={`https://cdn.vietqr.io/img/${code}.png`}
        alt={code}
        width={imgSize}
        height={imgSize}
        className="object-contain"
        onError={() => setFailed(true)}
      />
    </div>
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
// Account number masking helper
// ---------------------------------------------------------------------------

function maskAccount(account: string): string {
  if (account.length <= 6) return account;
  return account.slice(0, 3) + "****" + account.slice(-3);
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
  holderName?: string;
  amount?: string;
  description?: string;
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
  const [holderName, setHolderName] = useState("");
  // amount stores the raw numeric string (no commas)
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recents, setRecents] = useState<RecentEntry[]>(() => loadRecents());
  // generatedPayload is only set when user clicks "Generate QR"
  const [generatedPayload, setGeneratedPayload] = useState<string | null>(null);
  const [showFullAccount, setShowFullAccount] = useState(false);
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

  function handleHolderNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHolderName(e.target.value);
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
    const qrCanvas = canvasRef.current?.querySelector("canvas");
    if (!qrCanvas || !generatedPayload || !selectedBank) return;

    const DPR = 2; // fixed 2x for crisp output on all devices
    const LOGICAL_W = 320;
    const QR_SIZE = 240;
    const FRAME_PAD = 14;
    const FRAME_BORDER = 2;
    const TOTAL_QR_AREA = QR_SIZE + FRAME_PAD * 2 + FRAME_BORDER * 2;
    const INFO_H = holderName ? 110 : 90; // space for info text below QR
    const LOGICAL_H = TOTAL_QR_AREA + INFO_H + 24; // 24px bottom margin

    const canvas = document.createElement("canvas");
    canvas.width = LOGICAL_W * DPR;
    canvas.height = LOGICAL_H * DPR;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Blue border frame
    ctx.strokeStyle = "#60a5fa"; // blue-400
    ctx.lineWidth = FRAME_BORDER;
    const frameX = (LOGICAL_W - TOTAL_QR_AREA) / 2;
    const frameY = 16;
    ctx.strokeRect(frameX, frameY, TOTAL_QR_AREA, TOTAL_QR_AREA);

    // QR image inside frame
    ctx.drawImage(
      qrCanvas,
      frameX + FRAME_BORDER + FRAME_PAD,
      frameY + FRAME_BORDER + FRAME_PAD,
      QR_SIZE,
      QR_SIZE
    );

    // Info text below frame
    const cx = LOGICAL_W / 2;
    let y = frameY + TOTAL_QR_AREA + 20;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Bank short name (since logo can't draw cross-origin)
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#111827";
    ctx.fillText(selectedBank.shortName, cx, y);
    y += 22;

    // Holder name (if set)
    if (holderName.trim()) {
      ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "#0f766e"; // teal-700
      ctx.fillText(holderName.toUpperCase(), cx, y);
      y += 22;
    }

    // Account number
    const displayAcc = showFullAccount
      ? accountNumber
      : maskAccount(accountNumber);
    ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#111827";
    ctx.fillText(displayAcc, cx, y);
    y += 24;

    // Bank full name
    ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(selectedBank.name, cx, y);

    // Download
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "vietqr.png";
    a.click();

    // Save to recents on download
    const entry: RecentEntry = {
      bin: selectedBank.bin,
      code: selectedBank.code,
      shortName: selectedBank.shortName,
      name: selectedBank.name,
      accountNumber: accountNumber.trim(),
      holderName: holderName.trim() || undefined,
      amount: amount.trim() || undefined,
      description: description.trim() || undefined,
    };
    setRecents((prev) => saveRecent(entry, prev));
  }

  const AMOUNT_PRESETS = [
    { label: "50K", value: "50000" },
    { label: "100K", value: "100000" },
    { label: "200K", value: "200000" },
    { label: "500K", value: "500000" },
    { label: "1M", value: "1000000" },
    { label: "2M", value: "2000000" },
  ];

  const displayAccount = showFullAccount
    ? accountNumber.trim()
    : maskAccount(accountNumber.trim());

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

            {/* Account number */}
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

            {/* Account holder name (display-only — not included in QR payload) */}
            <div>
              <label className="tool-label">
                Account Holder Name (optional)
              </label>
              <input
                className="tool-input"
                type="text"
                placeholder="e.g. NGUYEN VAN A"
                value={holderName}
                onChange={handleHolderNameChange}
              />
            </div>

            {/* Amount */}
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
              {/* Amount presets */}
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

            {/* Description */}
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

        {/* Right: QR display + download */}
        <div className="tool-card flex flex-col items-center justify-center gap-4 min-h-[280px]">
          {generatedPayload ? (
            <>
              {/* QR card */}
              <div className="bg-white rounded-lg p-4 flex flex-col items-center w-full max-w-xs">
                {/* QR with blue border frame */}
                <div className="border-2 border-blue-400 rounded p-2 mx-auto w-fit">
                  <QRCodeSVG
                    value={generatedPayload}
                    size={220}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                {/* Bank logo — centered */}
                <div className="flex items-center justify-center my-3">
                  <div className="bg-white rounded-lg w-16 h-16 p-1.5 flex items-center justify-center shadow-sm border border-gray-100">
                    <BankLogo code={selectedBank?.code ?? ""} size={56} />
                  </div>
                </div>

                {/* Account holder name — only shown if provided */}
                {holderName.trim() && (
                  <div className="w-full text-center text-sm mt-1">
                    <span className="text-teal-600 font-medium uppercase">
                      {holderName.trim()}
                    </span>
                  </div>
                )}

                {/* Account number row with toggle — centered */}
                <div className="w-full flex items-center justify-center gap-1 mt-1">
                  <span className="text-base font-bold text-gray-900">
                    {displayAccount}
                  </span>
                  <button
                    onClick={() => setShowFullAccount((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                    title={showFullAccount ? "Hide account number" : "Show full account number"}
                    aria-label={showFullAccount ? "Hide account number" : "Show full account number"}
                  >
                    {showFullAccount ? (
                      /* Eye-off icon */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      /* Eye icon */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Bank full name — centered */}
                <div className="w-full text-center text-xs text-gray-500 mt-1">
                  {selectedBank?.name}
                </div>
              </div>

              {/* Hidden canvas for download */}
              <div ref={canvasRef} className="hidden">
                <QRCodeCanvas
                  value={generatedPayload}
                  size={240}
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

      {/* Recents section — only rendered when recents.length > 0 */}
      {recents.length > 0 && (
        <div className="tool-card space-y-2">
          <p className="text-sm font-medium text-text-secondary">Recent</p>
          {recents.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                const bank = BANKS.find((b) => b.bin === r.bin);
                if (!bank) return;
                setSelectedBank(bank);
                setAccountNumber(r.accountNumber);
                setHolderName(r.holderName ?? "");
                if (r.amount) setAmount(r.amount);
                if (r.description) setDescription(r.description);
                // Auto-generate immediately using entry values directly (avoids async state)
                const payload = buildVietQRPayload({
                  bin: r.bin,
                  accountNumber: r.accountNumber,
                  amount: r.amount ?? "",
                  description: r.description ?? "",
                });
                setGeneratedPayload(payload);
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
