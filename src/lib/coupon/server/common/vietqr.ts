/** VietQR img.vietqr.io — 은행 앱 스캔용 표준 QR 이미지 */

const BANK_ACQ_IDS: [RegExp, string][] = [
  [/vietcombank|vcb/i, "970436"],
  [/techcombank|tcb/i, "970407"],
  [/bidv/i, "970418"],
  [/agribank/i, "970405"],
  [/mbbank|military bank|mb bank/i, "970422"],
  [/acb/i, "970416"],
  [/sacombank/i, "970403"],
  [/vpbank/i, "970432"],
];

export function resolveBankAcqId(bankName: string): string | null {
  for (const [pattern, acqId] of BANK_ACQ_IDS) {
    if (pattern.test(bankName)) return acqId;
  }
  const fallback = process.env.VIETQR_DEFAULT_ACQ_ID?.trim();
  return fallback || null;
}

export function buildVietQrImageUrl(input: {
  bankName: string;
  bankAccount: string;
  amount: number;
  transferNote: string;
  bankHolder: string;
}): string | null {
  const acqId = resolveBankAcqId(input.bankName);
  if (!acqId) return null;

  const account = input.bankAccount.replace(/\s/g, "");
  if (!account) return null;

  const params = new URLSearchParams({
    amount: String(Math.round(input.amount)),
    addInfo: input.transferNote,
    accountName: input.bankHolder,
  });

  return `https://img.vietqr.io/image/${acqId}-${account}-compact2.png?${params.toString()}`;
}

export function extractOrderPrefixFromTransferNote(
  description: string,
): string | null {
  const match = description.match(/CAFE-([A-F0-9]{8})/i);
  return match ? match[1].toLowerCase() : null;
}
