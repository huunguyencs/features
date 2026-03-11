// vietqrMath.ts — Pure EMVCo TLV + CRC-16/CCITT-FALSE + VietQR payload builder
// Zero imports. No React. No external libraries.
// All lengths are 2-digit zero-padded decimal strings (not hex).

// ---------------------------------------------------------------------------
// Bank interface and BANKS constant
// Source: api.vietqr.io/v2/banks (fetched 2026-03-11)
// ---------------------------------------------------------------------------

export interface Bank {
  bin: string;       // e.g. "970416" — used in TLV payload
  code: string;      // e.g. "ACB"    — used in logo URL (cdn.vietqr.io/img/{CODE}.png)
  shortName: string; // e.g. "ACB"    — displayed in selector + filter
  name: string;      // e.g. "Ngân hàng TMCP Á Châu" — displayed in selector + filter
}

export const BANKS: Bank[] = [
  { bin: "970415", code: "ICB",        shortName: "VietinBank",       name: "Ngân hàng TMCP Công thương Việt Nam" },
  { bin: "970436", code: "VCB",        shortName: "Vietcombank",      name: "Ngân hàng TMCP Ngoại Thương Việt Nam" },
  { bin: "970418", code: "BIDV",       shortName: "BIDV",             name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam" },
  { bin: "970405", code: "VBA",        shortName: "Agribank",         name: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam" },
  { bin: "970448", code: "OCB",        shortName: "OCB",              name: "Ngân hàng TMCP Phương Đông" },
  { bin: "970422", code: "MB",         shortName: "MBBank",           name: "Ngân hàng TMCP Quân đội" },
  { bin: "970407", code: "TCB",        shortName: "Techcombank",      name: "Ngân hàng TMCP Kỹ thương Việt Nam" },
  { bin: "970416", code: "ACB",        shortName: "ACB",              name: "Ngân hàng TMCP Á Châu" },
  { bin: "970432", code: "VPB",        shortName: "VPBank",           name: "Ngân hàng TMCP Việt Nam Thịnh Vượng" },
  { bin: "970423", code: "TPB",        shortName: "TPBank",           name: "Ngân hàng TMCP Tiên Phong" },
  { bin: "970403", code: "STB",        shortName: "Sacombank",        name: "Ngân hàng TMCP Sài Gòn Thương Tín" },
  { bin: "970437", code: "HDB",        shortName: "HDBank",           name: "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh" },
  { bin: "970454", code: "VCCB",       shortName: "VietCapitalBank",  name: "Ngân hàng TMCP Bản Việt" },
  { bin: "970429", code: "SCB",        shortName: "SCB",              name: "Ngân hàng TMCP Sài Gòn" },
  { bin: "970441", code: "VIB",        shortName: "VIB",              name: "Ngân hàng TMCP Quốc tế Việt Nam" },
  { bin: "970443", code: "SHB",        shortName: "SHB",              name: "Ngân hàng TMCP Sài Gòn - Hà Nội" },
  { bin: "970431", code: "EIB",        shortName: "Eximbank",         name: "Ngân hàng TMCP Xuất Nhập khẩu Việt Nam" },
  { bin: "970426", code: "MSB",        shortName: "MSB",              name: "Ngân hàng TMCP Hàng Hải Việt Nam" },
  { bin: "546034", code: "CAKE",       shortName: "CAKE",             name: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số CAKE by VPBank" },
  { bin: "546035", code: "Ubank",      shortName: "Ubank",            name: "TMCP Việt Nam Thịnh Vượng - Ngân hàng số Ubank by VPBank" },
  { bin: "971005", code: "VTLMONEY",   shortName: "ViettelMoney",     name: "Tổng Công ty Dịch vụ số Viettel" },
  { bin: "963388", code: "TIMO",       shortName: "Timo",             name: "Ngân hàng số Timo by Ban Viet Bank" },
  { bin: "971011", code: "VNPTMONEY",  shortName: "VNPTMoney",        name: "VNPT Money" },
  { bin: "970400", code: "SGICB",      shortName: "SaigonBank",       name: "Ngân hàng TMCP Sài Gòn Công Thương" },
  { bin: "970409", code: "BAB",        shortName: "BacABank",         name: "Ngân hàng TMCP Bắc Á" },
  { bin: "971025", code: "momo",       shortName: "MoMo",             name: "CTCP Dịch Vụ Di Động Trực Tuyến" },
  { bin: "971133", code: "PVDB",       shortName: "PVcomBank Pay",    name: "Ngân hàng TMCP Đại Chúng Việt Nam Ngân hàng số" },
  { bin: "970412", code: "PVCB",       shortName: "PVcomBank",        name: "Ngân hàng TMCP Đại Chúng Việt Nam" },
  { bin: "970414", code: "MBV",        shortName: "MBV",              name: "Ngân hàng TNHH MTV Việt Nam Hiện Đại" },
  { bin: "970419", code: "NCB",        shortName: "NCB",              name: "Ngân hàng TMCP Quốc Dân" },
  { bin: "970424", code: "SHBVN",      shortName: "ShinhanBank",      name: "Ngân hàng TNHH MTV Shinhan Việt Nam" },
  { bin: "970425", code: "ABB",        shortName: "ABBANK",           name: "Ngân hàng TMCP An Bình" },
  { bin: "970427", code: "VAB",        shortName: "VietABank",        name: "Ngân hàng TMCP Việt Á" },
  { bin: "970428", code: "NAB",        shortName: "NamABank",         name: "Ngân hàng TMCP Nam Á" },
  { bin: "970430", code: "PGB",        shortName: "PGBank",           name: "Ngân hàng TMCP Thịnh vượng và Phát triển" },
  { bin: "970433", code: "VIETBANK",   shortName: "VietBank",         name: "Ngân hàng TMCP Việt Nam Thương Tín" },
  { bin: "970438", code: "BVB",        shortName: "BaoVietBank",      name: "Ngân hàng TMCP Bảo Việt" },
  { bin: "970440", code: "SEAB",       shortName: "SeABank",          name: "Ngân hàng TMCP Đông Nam Á" },
  { bin: "970446", code: "COOPBANK",   shortName: "COOPBANK",         name: "Ngân hàng Hợp tác xã Việt Nam" },
  { bin: "970449", code: "LPB",        shortName: "LPBank",           name: "Ngân hàng TMCP Lộc Phát Việt Nam" },
  { bin: "970452", code: "KLB",        shortName: "KienLongBank",     name: "Ngân hàng TMCP Kiên Long" },
  { bin: "668888", code: "KBank",      shortName: "KBank",            name: "Ngân hàng Đại chúng TNHH Kasikornbank" },
  { bin: "977777", code: "MAFC",       shortName: "MAFC",             name: "Công ty Tài chính TNHH MTV Mirae Asset" },
  { bin: "970442", code: "HLBVN",      shortName: "HongLeong",        name: "Ngân hàng TNHH MTV Hong Leong Việt Nam" },
  { bin: "970467", code: "KEBHANAHN",  shortName: "KEBHANAHN",        name: "Ngân hàng KEB Hana – Chi nhánh Hà Nội" },
  { bin: "970466", code: "KEBHANAHCM", shortName: "KEBHanaHCM",       name: "Ngân hàng KEB Hana – Chi nhánh Thành phố Hồ Chí Minh" },
  { bin: "533948", code: "CITIBANK",   shortName: "Citibank",         name: "Ngân hàng Citibank, N.A. - Chi nhánh Hà Nội" },
  { bin: "970444", code: "CBB",        shortName: "CBBank",           name: "Ngân hàng Thương mại TNHH MTV Xây dựng Việt Nam" },
  { bin: "422589", code: "CIMB",       shortName: "CIMB",             name: "Ngân hàng TNHH MTV CIMB Việt Nam" },
  { bin: "796500", code: "DBS",        shortName: "DBSBank",          name: "DBS Bank Ltd - Chi nhánh Thành phố Hồ Chí Minh" },
  { bin: "970406", code: "Vikki",      shortName: "Vikki",            name: "Ngân hàng TNHH MTV Số Vikki" },
  { bin: "999888", code: "VBSP",       shortName: "VBSP",             name: "Ngân hàng Chính sách Xã hội" },
  { bin: "970408", code: "GPB",        shortName: "GPBank",           name: "Ngân hàng Thương mại TNHH MTV Dầu Khí Toàn Cầu" },
  { bin: "970463", code: "KBHCM",      shortName: "KookminHCM",       name: "Ngân hàng Kookmin - Chi nhánh Thành phố Hồ Chí Minh" },
  { bin: "970462", code: "KBHN",       shortName: "KookminHN",        name: "Ngân hàng Kookmin - Chi nhánh Hà Nội" },
  { bin: "970457", code: "WVN",        shortName: "Woori",            name: "Ngân hàng TNHH MTV Woori Việt Nam" },
  { bin: "970421", code: "VRB",        shortName: "VRB",              name: "Ngân hàng Liên doanh Việt - Nga" },
  { bin: "458761", code: "HSBC",       shortName: "HSBC",             name: "Ngân hàng TNHH MTV HSBC (Việt Nam)" },
  { bin: "970455", code: "IBK - HN",   shortName: "IBKHN",            name: "Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh Hà Nội" },
  { bin: "970456", code: "IBK - HCM",  shortName: "IBKHCM",           name: "Ngân hàng Công nghiệp Hàn Quốc - Chi nhánh TP. Hồ Chí Minh" },
  { bin: "970434", code: "IVB",        shortName: "IndovinaBank",     name: "Ngân hàng TNHH Indovina" },
  { bin: "970458", code: "UOB",        shortName: "UnitedOverseas",   name: "Ngân hàng United Overseas - Chi nhánh TP. Hồ Chí Minh" },
  { bin: "801011", code: "NHB HN",     shortName: "Nonghyup",         name: "Ngân hàng Nonghyup - Chi nhánh Hà Nội" },
  { bin: "970410", code: "SCVN",       shortName: "StandardChartered", name: "Ngân hàng TNHH MTV Standard Chartered Bank Việt Nam" },
  { bin: "970439", code: "PBVN",       shortName: "PublicBank",       name: "Ngân hàng TNHH MTV Public Việt Nam" },
];

// ---------------------------------------------------------------------------
// buildTLV
// Encode a single TLV field.
// Length = character count of VALUE only, zero-padded to 2 decimal digits.
// This is decimal, NOT hex. Never the total TLV length.
// ---------------------------------------------------------------------------

export function buildTLV(tag: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${tag}${len}${value}`;
}

// ---------------------------------------------------------------------------
// crc16 — CRC-16/CCITT-FALSE
// Polynomial: 0x1021, Initial value: 0xFFFF
// No input/output reflection. No final XOR.
// Test vector: crc16("123456789") === 0x29B1
// Source: EMVCo QR spec; verified against reveng.sourceforge.io CRC catalogue
// ---------------------------------------------------------------------------

const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let crc = i << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
    table.push(crc & 0xffff);
  }
  return table;
})();

export function crc16(str: string): number {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc = ((crc << 8) ^ CRC_TABLE[((crc >> 8) ^ str.charCodeAt(i)) & 0xff]!) & 0xffff;
  }
  return crc;
}

// ---------------------------------------------------------------------------
// buildVietQRPayload
// Assemble an EMVCo-compliant VietQR payload string.
//
// Tag order (mandatory): 00, 01, 38, 53, 54 (conditional), 58, 62 (conditional), 6304 + CRC
// CRC is computed over the entire string INCLUDING the literal "6304" suffix.
//
// Tag 38 — two levels of nesting (critical):
//   Level 1 (tag38Value):
//     sub-tag 00: NAPAS GUID "A000000727"
//     sub-tag 01: beneficiaryTLV (a nested TLV)
//     sub-tag 02: service code "QRIBFTTA"
//   Level 2 (beneficiaryTLV):
//     sub-sub-tag 00: BIN (e.g. "970416")
//     sub-sub-tag 01: account number
//
// Initiation method: "12" (dynamic) when amount OR description present; "11" (static) otherwise.
// ---------------------------------------------------------------------------

export interface VietQRParams {
  bin: string;
  accountNumber: string;
  amount?: string;
  description?: string;
}

export function buildVietQRPayload(params: VietQRParams): string {
  const { bin, accountNumber, amount, description } = params;

  // Tag 38 — inner beneficiary TLV (two-level nesting)
  const beneficiaryTLV =
    buildTLV("00", bin) +
    buildTLV("01", accountNumber);

  const tag38Value =
    buildTLV("00", "A000000727") +
    buildTLV("01", beneficiaryTLV) +
    buildTLV("02", "QRIBFTTA");

  // Tag 54 (amount) — omit entirely when no amount provided; never encode "0"
  const tag54 = amount ? buildTLV("54", amount) : "";

  // Tag 62 (additional data) — omit entirely when no description provided
  const tag62 = description ? buildTLV("62", buildTLV("08", description)) : "";

  // Initiation method: "12" = dynamic, "11" = static
  const initMethod = (amount || description) ? "12" : "11";

  // Assemble payload up to and including the CRC placeholder "6304"
  const payload =
    buildTLV("00", "01") +
    buildTLV("01", initMethod) +
    buildTLV("38", tag38Value) +
    buildTLV("53", "704") +
    tag54 +
    buildTLV("58", "VN") +
    tag62 +
    "6304";

  // CRC over full payload (including "6304"), appended as 4 uppercase hex digits
  const checksum = crc16(payload).toString(16).toUpperCase().padStart(4, "0");
  return payload + checksum;
}
