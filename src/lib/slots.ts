// นิยามช่องเวลาสัมภาษณ์ Online 4-5 มิ.ย. 2569
// 15 นาที/ช่อง · 15 ช่อง/วัน · 09:00-14:00 · พักเช้า 15 นาที (10:15-10:30) + พักเที่ยง 60 นาที (11:45-12:45)

export const INTERVIEW_DAYS = [
  { date: "2026-06-04", labelTH: "วัน 1 — 4 มิ.ย. (พฤ.)" },
  { date: "2026-06-05", labelTH: "วัน 2 — 5 มิ.ย. (ศ.)" },
] as const;

// เวลาเริ่ม-จบของแต่ละช่อง (15 ช่อง) เว้นช่วงพักตามตาราง
export const SLOT_TIMES: { slotNo: number; start: string; end: string }[] = [
  { slotNo: 1, start: "09:00", end: "09:15" },
  { slotNo: 2, start: "09:15", end: "09:30" },
  { slotNo: 3, start: "09:30", end: "09:45" },
  { slotNo: 4, start: "09:45", end: "10:00" },
  { slotNo: 5, start: "10:00", end: "10:15" },
  // ☕ พักช่วงเช้า 15 นาที (10:15-10:30)
  { slotNo: 6, start: "10:30", end: "10:45" },
  { slotNo: 7, start: "10:45", end: "11:00" },
  { slotNo: 8, start: "11:00", end: "11:15" },
  { slotNo: 9, start: "11:15", end: "11:30" },
  { slotNo: 10, start: "11:30", end: "11:45" },
  // 🍽️ พักกลางวัน 60 นาที (11:45-12:45)
  { slotNo: 11, start: "12:45", end: "13:00" },
  { slotNo: 12, start: "13:00", end: "13:15" },
  { slotNo: 13, start: "13:15", end: "13:30" },
  { slotNo: 14, start: "13:30", end: "13:45" },
  { slotNo: 15, start: "13:45", end: "14:00" },
];

export const SLOTS_PER_DAY = SLOT_TIMES.length; // 15
export const TOTAL_SLOTS = SLOTS_PER_DAY * INTERVIEW_DAYS.length; // 30
export const TARGET_PASS = TOTAL_SLOTS; // คัดเหลือ 30 คน

// สร้างรายการช่องทั้งหมด (ใช้ทั้งตอน seed และแสดงผล)
export function buildAllSlots() {
  const out: {
    day: string;
    slotNo: number;
    label: string;
    startTime: string;
    endTime: string;
  }[] = [];
  let running = 1; // บ.#1 ... บ.#30 ต่อเนื่องข้ามวัน
  for (const d of INTERVIEW_DAYS) {
    for (const t of SLOT_TIMES) {
      out.push({
        day: d.date,
        slotNo: t.slotNo,
        label: `บ.#${running}`,
        startTime: t.start,
        endTime: t.end,
      });
      running++;
    }
  }
  return out;
}

export const TRAINING_GROUPS: Record<number, { name: string; dates: string }> = {
  1: { name: "กลุ่ม 1 (ทุกวันพุธ)", dates: "24 มิ.ย. / 1 ก.ค. / 8 ก.ค. / 15 ก.ค." },
  2: { name: "กลุ่ม 2 (ทุกวันจันทร์)", dates: "6 ก.ค. / 13 ก.ค. / 20 ก.ค. / 27 ก.ค." },
};
