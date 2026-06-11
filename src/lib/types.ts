// DTO ที่ส่งจาก server → client (serializable, แปลง Date เป็น string แล้ว)
import type { Lead } from "@prisma/client";
import type { ChannelRow, MandayRow, WebComponentRow, Assets } from "./visit";

export type ContactStatus = "PENDING" | "CONTACTED" | "UNREACHABLE";
export type Result = "PENDING" | "PASS" | "FAIL";
export type VisitStatus = "DRAFT" | "DONE";

// สถานะของผู้สมัครในกระบวนการ: ทั่วไป → รอบแรก → 30 (สัมภาษณ์) → 15 (ผู้ชนะ)
export type LeadStatus = "applicant" | "round1" | "round30" | "winner";
export type LeadDTO = Omit<Lead, "createdAt"> & { status: LeadStatus };

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

  // คะแนนสัมภาษณ์ Round 3
  itvGate1a: boolean | null;
  itvGate1b: boolean | null;
  itvGate1c: boolean | null;
  itvGate1d: boolean | null;
  itvScore2: number | null;
  itvScore3: number | null;
  itvScore4: number | null;
  itvScore5: number | null;
  itvScore6: number | null;
  itvScore7: number | null;
  itvNotes: string | null;

  // จัดกลุ่มจริง + นัด visit
  finalGroup: number | null;
  visitCoach: string | null;
  visitLocation: string | null;
}

// ---------- รายงานวินิจฉัยรายกิจการ (1st visit / consult) ----------
export interface VisitReportDTO {
  capitalRegistered: string | null;
  yearRegistered: string | null;
  currentEcommerce: string | null;
  history: string | null;

  swotStrength: string | null;
  swotWeakness: string | null;
  swotOpportunity: string | null;
  swotThreat: string | null;
  channelAnalysis: ChannelRow[];

  problems: string | null;
  improvements: string | null;

  approach: string | null;
  mandayPlan: MandayRow[];

  websiteComponents: WebComponentRow[];
  domainWanted: string | null;
  assets: Assets;

  mouSigned: boolean;
  consentSigned: boolean;
  mandaySigned: boolean;
  kpiSalesPerMonth: string | null;
  kpiCustomers: string | null;
  kpiMainChannel: string | null;
  oldWebsiteUrl: string | null;

  photos: string[];
  videoUrl: string | null;

  status: VisitStatus;
}

// ข้อมูลพื้นฐานกิจการ (อ่านอย่างเดียว) — ดึงจาก Lead มาแสดงในหัวฟอร์ม visit
export interface VisitLeadInfo {
  contactName: string | null; // ผู้ติดต่อ (ชื่อ-นามสกุล)
  email: string | null;
  registrationNo: string | null;
  companyAddress: string | null;
  businessType: string | null;
  mainProduct: string | null;
  revenue: string | null;
  yearsOperating: string | null;
  facebookUrl: string | null;
  website: string | null;
}

// หนึ่งรายการในหน้า /visit = candidate (ผู้ผ่าน) + ข้อมูล lead + รายงาน
export interface VisitItem {
  candidate: CandidateDTO;
  lead: VisitLeadInfo | null;
  report: VisitReportDTO | null;
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
  return canBookSlot(c) && c.interviewSlotId !== null;
}
