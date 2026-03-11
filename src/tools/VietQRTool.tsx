import { useState, useMemo, useRef } from "react";
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
// BankSelector — search + scrollable bank list, collapses after selection
// ---------------------------------------------------------------------------

interface BankSelectorProps {
  selected: Bank | null;
  onSelect: (bank: Bank) => void;
}

function BankSelector({ selected, onSelect }: BankSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return BANKS;
    const q = query.toLowerCase();
    return BANKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q)
    );
  }, [query]);

  // Collapsed view: selected bank is shown with a "Change" button
  if (selected !== null && !open) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 tool-card rounded-md">
        <BankLogo code={selected.code} />
        <span className="text-sm text-text-primary font-medium">
          {selected.shortName}
        </span>
        <span className="text-xs text-text-muted truncate flex-1">
          {selected.name}
        </span>
        <button
          onClick={() => setOpen(true)}
          className="btn-secondary text-xs shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  // Expanded view: search input + scrollable list
  return (
    <div className="tool-card space-y-2">
      <input
        className="tool-input mb-2"
        type="text"
        placeholder="Search bank name or code…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={open}
      />
      <div className="max-h-48 overflow-y-auto space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-xs text-text-muted px-3 py-2">No banks found.</p>
        )}
        {filtered.map((bank) => (
          <div
            key={bank.bin}
            onClick={() => {
              onSelect(bank);
              setOpen(false);
              setQuery("");
            }}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-overlay rounded-md"
          >
            <BankLogo code={bank.code} />
            <span className="text-sm text-text-primary">{bank.shortName}</span>
            <span className="text-xs text-text-muted truncate">
              {bank.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
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
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recents, setRecents] = useState<RecentEntry[]>(() => loadRecents());
  const canvasRef = useRef<HTMLDivElement>(null);

  const isReady = !!selectedBank && accountNumber.trim().length > 0;

  const payload = useMemo(() => {
    if (!isReady || !selectedBank) return "";
    return buildVietQRPayload({
      bin: selectedBank.bin,
      accountNumber: accountNumber.trim(),
      amount: amount.trim() || undefined,
      description: description.trim() || undefined,
    });
  }, [isReady, selectedBank, accountNumber, amount, description]);

  function downloadPng() {
    if (!isReady) return;
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
            <BankSelector selected={selectedBank} onSelect={setSelectedBank} />

            {/* Account number (VIETQR-02) */}
            <div>
              <label className="tool-label">Account Number</label>
              <input
                className="tool-input"
                type="text"
                placeholder="e.g. 1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            {/* Amount (VIETQR-03) */}
            <div>
              <label className="tool-label">Amount (VND, optional)</label>
              <input
                className="tool-input"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 100000"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/\D/g, ""))
                }
              />
              {/* Amount presets (VIETQR-09) */}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {AMOUNT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setAmount(p.value)}
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
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right: QR display + download (VIETQR-05, 06) */}
        <div className="tool-card flex flex-col items-center justify-center gap-4 min-h-[280px]">
          {isReady ? (
            <>
              <QRCodeSVG
                value={payload}
                size={220}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
              {/* Hidden canvas for download */}
              <div ref={canvasRef} className="hidden">
                <QRCodeCanvas
                  value={payload}
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
                Fill in bank and account to generate QR
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
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface-overlay text-left transition-colors"
            >
              <BankLogo code={r.code} size={24} />
              <span className="text-sm text-text-primary">{r.shortName}</span>
              <span className="text-xs text-text-muted">{r.accountNumber}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
