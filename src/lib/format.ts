const TH_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** "2026-06-04" → "4 มิ.ย." */
export function thaiDateShort(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map((s) => parseInt(s, 10));
  return `${d} ${TH_MONTHS_SHORT[m - 1]}`;
}

/** แปลง Date เป็น "YYYY-MM-DD" (อิง UTC เพราะคอลัมน์เป็น @db.Date) */
export function toIsoDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}
