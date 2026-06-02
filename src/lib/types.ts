// DTO ที่ส่งจาก server → client (serializable, แปลง Date เป็น string แล้ว)

export type ContactStatus = "PENDING" | "CONTACTED" | "UNREACHABLE";
export type Result = "PENDING" | "PASS" | "FAIL";

export interface SlotDTO {
  id: string;
  day: string; // "2026-06-04"
  slotNo: number;
  label: string; // "บ.#1"
  startTime: string;
  endTime: string;
  takenBy: string | null; // candidate id ที่จองช่องนี้ (ถ้ามี)
}

export interface CandidateDTO {
  id: string;
  seq: number | null;
  score: number | null;
  name: string;
  phone: string | null;
  company: string | null;
  province: string | null;
  position: string | null;
  income: string | null;
  channels: string[];
  age: number | null;
  reason: string | null;
  facebookUrl: string | null;
  website: string | null;

  contactStatus: ContactStatus;
  hasNotebook: boolean;
  availableLaunch: boolean;
  trainingGroups: number[];
  visitAvailable: boolean; // สะดวกให้นัด visit (ยังไม่กำหนดวัน)
  consultDate: string | null; // "2026-06-12" — วันนัดจริง (ทีหลัง)
  iindustryReg: boolean;

  interviewSlotId: string | null;
  interviewSlotLabel: string | null; // "บ.#1 · 4 มิ.ย. 09:00-09:15"

  result: Result;
  failReason: string | null;
  round2Result: Result;
  notes: string | null;
}

// เงื่อนไขที่ต้องครบ "ก่อนเลือกช่องวันสัมภาษณ์"
// ต้องติ๊กครบ: มี notebook + เข้าร่วมพิธีเปิด + สะดวกนัด visit + เลือกกลุ่มอบรม ≥ 1 กลุ่ม
export function canBookSlot(c: CandidateDTO): boolean {
  return (
    c.hasNotebook &&
    c.availableLaunch &&
    c.visitAvailable &&
    c.trainingGroups.length > 0
  );
}

// ข้อที่ยังขาดสำหรับการจองช่องสัมภาษณ์ (ใช้ขึ้นข้อความบอกผู้ใช้)
export function missingForBooking(c: CandidateDTO): string[] {
  const m: string[] = [];
  if (!c.hasNotebook) m.push("มี notebook");
  if (!c.availableLaunch) m.push("เข้าร่วมพิธีเปิด 11 มิ.ย.");
  if (!c.visitAvailable) m.push("สะดวกให้นัด visit กิจการ");
  if (c.trainingGroups.length === 0) m.push("เลือกกลุ่มอบรม");
  return m;
}

// เงื่อนไขที่ "ครบ checklist" (เกณฑ์ผ่านเชิงข้อมูล)
// notebook = จำเป็น (ถ้าไม่มี → ผ่านไม่ได้)
export function checklistComplete(c: CandidateDTO): boolean {
  return canBookSlot(c) && c.interviewSlotId !== null && c.iindustryReg;
}
