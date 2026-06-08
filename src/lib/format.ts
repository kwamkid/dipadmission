const TH_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** "2026-06-04" → "4 มิ.ย." */
export function thaiDateShort(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map((s) => parseInt(s, 10));
  return `${d} ${TH_MONTHS_SHORT[m - 1]}`;
}

const TH_WEEKDAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** "2026-06-04" → "พฤ" */
export function thaiWeekdayShort(isoDate: string): string {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return TH_WEEKDAYS_SHORT[day];
}

/** ป้ายช่องสัมภาษณ์แบบ 3 บรรทัด: "คิวที่ N" / "พฤ 4 มิ.ย." / "09:15-09:30" */
export function slotLabelLines(label: string, isoDate: string, start: string, end: string): string {
  const queue = label.replace("บ.#", "คิวที่ ");
  return `${queue}\n${thaiWeekdayShort(isoDate)} ${thaiDateShort(isoDate)}\n${start}-${end}`;
}

/** เบอร์ไทยเป็น format 66: "0854149995" → "66854149995" */
export function phone66(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("66")) return digits;
  return `66${digits.replace(/^0+/, "")}`;
}

/** แปลง Date เป็น "YYYY-MM-DD" (อิง UTC เพราะคอลัมน์เป็น @db.Date) */
export function toIsoDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}
