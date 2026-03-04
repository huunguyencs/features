import { useState, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

type EcLevel = "L" | "M" | "Q" | "H";

const EC_LEVELS: EcLevel[] = ["L", "M", "Q", "H"];

export default function QrGenerator() {
  const [value, setValue] = useState("https://example.com");
  const [size, setSize] = useState(256);
  const [ecLevel, setEcLevel] = useState<EcLevel>("M");
  const [fgColor, setFgColor] = useState("#f1f5f9");
  const [bgColor, setBgColor] = useState("#1e293b");
  const canvasRef = useRef<HTMLDivElement>(null);

  function downloadPng() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.png";
    a.click();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          QR Code Generator
        </h1>
        <p className="text-text-secondary text-sm">
          Generate QR codes with custom colors and error correction.
        </p>
      </div>

      <div className="tool-card space-y-4">
        <div>
          <label className="tool-label">Content</label>
          <input
            className="tool-input"
            type="text"
            placeholder="https://example.com or any text…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="tool-label">Size: {size}px</label>
            <input
              type="range"
              min="128"
              max="512"
              step="16"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-accent-primary"
            />
          </div>

          <div>
            <label className="tool-label">Error Correction</label>
            <div className="flex gap-1 mt-1">
              {EC_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setEcLevel(lvl)}
                  className={`flex-1 py-1 text-sm rounded-md font-medium transition-colors ${
                    ecLevel === lvl
                      ? "bg-accent-primary text-white"
                      : "bg-surface-overlay text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="tool-label">Foreground</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-10 h-9 rounded cursor-pointer bg-surface-overlay border border-text-muted"
              />
              <input
                className="tool-input flex-1"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>

          <div>
            <label className="tool-label">Background</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-9 rounded cursor-pointer bg-surface-overlay border border-text-muted"
              />
              <input
                className="tool-input flex-1"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </div>

      {value.trim() && (
        <div className="tool-card flex flex-col items-center gap-4">
          <QRCodeSVG
            value={value}
            size={Math.min(size, 400)}
            level={ecLevel}
            fgColor={fgColor}
            bgColor={bgColor}
          />

          {/* Hidden canvas for download */}
          <div ref={canvasRef} className="hidden">
            <QRCodeCanvas
              value={value}
              size={size}
              level={ecLevel}
              fgColor={fgColor}
              bgColor={bgColor}
            />
          </div>

          <button className="btn-primary" onClick={downloadPng}>
            Download PNG ({size}×{size})
          </button>
        </div>
      )}
    </div>
  );
}
