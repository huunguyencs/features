import { describe, it, expect } from "vitest";
import { buildTLV, crc16, buildVietQRPayload, BANKS } from "./vietqrMath";

describe("buildTLV", () => {
  it("encodes tag + zero-padded length + value", () => {
    // tag "00", value "A000000727" (length 10 → "10")
    expect(buildTLV("00", "A000000727")).toBe("0010A000000727");
    // tag "01", value "12" (length 2 → "02")
    expect(buildTLV("01", "12")).toBe("010212");
    // tag "53", value "704" (length 3 → "03")
    expect(buildTLV("53", "704")).toBe("5303704");
  });
});

describe("crc16", () => {
  it("satisfies CCITT-FALSE test vector: crc16('123456789') === 0x29B1", () => {
    // CCITT-FALSE: poly=0x1021, init=0xFFFF, no reflection, no final XOR
    expect(crc16("123456789")).toBe(0x29b1); // 10673 decimal
    // Sanity guard: KERMIT variant would yield 0x2189 — we must NOT get that
    expect(crc16("123456789")).not.toBe(0x2189);
  });
});

describe("buildVietQRPayload", () => {
  it("produces known-good payload for ACB account with amount and description", () => {
    const result = buildVietQRPayload({
      bin: "970416",
      accountNumber: "092576788590",
      amount: "10000",
      description: "Chuyen tien",
    });
    // Correct EMVCo TLV payload: accountNumber "092576788590" (12 chars) → sub-sub-tag 01 len "12"
    // The research doc had a mismatched example (payload was from account "257678859", not "092576788590").
    // This expected value is computed from the correct algorithm: all lengths are character count of VALUE.
    expect(result).toBe(
      "00020101021238560010A0000007270126000697041601120925767885900208QRIBFTTA53037045405100005802VN62150811Chuyen tien6304A2BB"
    );
  });

  it("uses initiation method '11' (static) when no amount or description", () => {
    const result = buildVietQRPayload({
      bin: "970416",
      accountNumber: "1234567890",
    });
    // tag 01, len 02, value "11" → static
    expect(result).toContain("010211");
    // tag 54 (amount) must be absent
    expect(result).not.toContain("5404");
    // tag 62 (additional data) must be absent
    expect(result).not.toContain("6204");
    expect(result).not.toContain("6215");
  });

  it("uses initiation method '12' (dynamic) when amount is provided", () => {
    const result = buildVietQRPayload({
      bin: "970416",
      accountNumber: "1234567890",
      amount: "50000",
    });
    // tag 01, len 02, value "12" → dynamic
    expect(result).toContain("010212");
    // tag 54 present with 5-digit amount
    expect(result).toContain("5405");
    expect(result).toContain("50000");
  });

  it("CRC appended as 4 uppercase hex digits", () => {
    const result = buildVietQRPayload({
      bin: "970416",
      accountNumber: "1234567890",
    });
    const crcPart = result.slice(-4);
    // Must be 4 uppercase hex digits
    expect(crcPart).toMatch(/^[0-9A-F]{4}$/);
    // CRC must cover everything before the last 4 chars
    const payload = result.slice(0, -4);
    const expectedCrc = crc16(payload).toString(16).toUpperCase().padStart(4, "0");
    expect(crcPart).toBe(expectedCrc);
  });
});

describe("BANKS", () => {
  it("contains at least 60 banks with required fields", () => {
    expect(BANKS.length).toBeGreaterThanOrEqual(60);
    for (const bank of BANKS) {
      expect(typeof bank.bin).toBe("string");
      expect(bank.bin.length).toBeGreaterThan(0);
      expect(typeof bank.code).toBe("string");
      expect(bank.code.length).toBeGreaterThan(0);
      expect(typeof bank.shortName).toBe("string");
      expect(bank.shortName.length).toBeGreaterThan(0);
      expect(typeof bank.name).toBe("string");
      expect(bank.name.length).toBeGreaterThan(0);
    }
    // Spot-check known BIN values
    expect(BANKS.find((b) => b.code === "VCB")?.bin).toBe("970436");
    expect(BANKS.find((b) => b.code === "ACB")?.bin).toBe("970416");
  });
});
