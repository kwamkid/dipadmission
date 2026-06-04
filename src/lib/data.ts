import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { toIsoDate, slotLabelLines } from "./format";
import type { CandidateDTO, SlotDTO, ContactStatus, Result, LeadDTO, LeadStatus } from "./types";

type CandidateRow = Prisma.CandidateGetPayload<{ include: { interviewSlot: true } }>;

function toCandidateDTO(c: CandidateRow): CandidateDTO {
  let interviewSlotLabel: string | null = null;
  if (c.interviewSlot) {
    const iso = toIsoDate(c.interviewSlot.day)!;
    interviewSlotLabel = slotLabelLines(
      c.interviewSlot.label,
      iso,
      c.interviewSlot.startTime,
      c.interviewSlot.endTime
    );
  }
  return {
    id: c.id,
    seq: c.seq,
    score: c.score,
    name: c.name,
    phone: c.phone,
    company: c.company,
    province: c.province,
    position: c.position,
    income: c.income,
    channels: c.channels,
    age: c.age,
    reason: c.reason,
    facebookUrl: c.facebookUrl,
    website: c.website,
    contactStatus: c.contactStatus as ContactStatus,
    hasNotebook: c.hasNotebook,
    availableLaunch: c.availableLaunch,
    trainingGroups: c.trainingGroups,
    visitAvailable: c.visitAvailable,
    consultDate: toIsoDate(c.consultDate),
    iindustryReg: c.iindustryReg,
    interviewSlotId: c.interviewSlotId,
    interviewSlotLabel,
    result: c.result as Result,
    failReason: c.failReason,
    round2Result: c.round2Result as Result,
    notes: c.notes,
    itvGate1a: c.itvGate1a,
    itvGate1b: c.itvGate1b,
    itvGate1c: c.itvGate1c,
    itvGate1d: c.itvGate1d,
    itvScore2: c.itvScore2,
    itvScore3: c.itvScore3,
    itvScore4: c.itvScore4,
    itvScore5: c.itvScore5,
    itvScore6: c.itvScore6,
    itvScore7: c.itvScore7,
    itvNotes: c.itvNotes,
    finalGroup: c.finalGroup,
    visitCoach: c.visitCoach,
  };
}

export async function getScreeningData(): Promise<{
  candidates: CandidateDTO[];
  slots: SlotDTO[];
}> {
  const [rows, slots] = await Promise.all([
    prisma.candidate.findMany({
      orderBy: [{ seq: "asc" }],
      include: { interviewSlot: true },
    }),
    prisma.interviewSlot.findMany({
      orderBy: [{ day: "asc" }, { slotNo: "asc" }],
      include: { candidate: { select: { id: true } } },
    }),
  ]);

  const candidates: CandidateDTO[] = rows.map(toCandidateDTO);

  const slotDTOs: SlotDTO[] = slots.map((s) => ({
    id: s.id,
    day: toIsoDate(s.day)!,
    slotNo: s.slotNo,
    label: s.label,
    startTime: s.startTime,
    endTime: s.endTime,
    takenBy: s.candidate?.id ?? null,
  }));

  return { candidates, slots: slotDTOs };
}

export interface QueueSlot {
  id: string;
  day: string; // "2026-06-04"
  label: string; // "บ.#1"
  startTime: string;
  endTime: string;
  candidate: {
    id: string;
    name: string;
    phone: string | null;
    company: string | null;
    province: string | null;
    result: Result;
  } | null;
}

/** สรุปคิวสัมภาษณ์ — ทุกช่องเรียงตามวัน/เวลา พร้อมผู้ที่จอง (ถ้ามี) */
export async function getInterviewQueue(): Promise<QueueSlot[]> {
  const slots = await prisma.interviewSlot.findMany({
    orderBy: [{ day: "asc" }, { slotNo: "asc" }],
    include: {
      candidate: {
        select: { id: true, name: true, phone: true, company: true, province: true, result: true },
      },
    },
  });
  return slots.map((s) => ({
    id: s.id,
    day: toIsoDate(s.day)!,
    label: s.label,
    startTime: s.startTime,
    endTime: s.endTime,
    candidate: s.candidate
      ? { ...s.candidate, result: s.candidate.result as Result }
      : null,
  }));
}

/** ผู้เข้าสัมภาษณ์ Round 3 = เฉพาะคนที่จองช่องสัมภาษณ์แล้ว (เรียงตามคิว วัน/เวลา) */
export async function getInterviewees(): Promise<CandidateDTO[]> {
  const rows = await prisma.candidate.findMany({
    where: { interviewSlotId: { not: null } },
    orderBy: [{ interviewSlot: { day: "asc" } }, { interviewSlot: { slotNo: "asc" } }],
    include: { interviewSlot: true },
  });
  return rows.map(toCandidateDTO);
}

/** ผู้ผ่านรอบ Final (15 ผู้ชนะ = round2Result PASS) สำหรับจัดกลุ่ม/นัด visit */
export async function getWinners(): Promise<CandidateDTO[]> {
  const rows = await prisma.candidate.findMany({
    where: { round2Result: "PASS" },
    orderBy: [{ finalGroup: "asc" }, { name: "asc" }],
    include: { interviewSlot: true },
  });
  return rows.map(toCandidateDTO);
}

/** ผู้สมัครทั้งหมด (lead) + สถานะในกระบวนการ (จับคู่กับ candidate ด้วยเบอร์) */
export async function getLeads(): Promise<LeadDTO[]> {
  const [leads, cands] = await Promise.all([
    prisma.lead.findMany({ orderBy: { seq: "asc" } }),
    prisma.candidate.findMany({ select: { phone: true, result: true, round2Result: true } }),
  ]);
  const byPhone = new Map<string, { result: Result; round2Result: Result }>();
  for (const c of cands) {
    if (c.phone) byPhone.set(c.phone, { result: c.result as Result, round2Result: c.round2Result as Result });
  }
  return leads.map((l) => {
    const m = l.phoneNorm ? byPhone.get(l.phoneNorm) : undefined;
    let status: LeadStatus = "applicant";
    if (m) status = m.round2Result === "PASS" ? "winner" : m.result === "PASS" ? "round30" : "round1";
    const { createdAt: _omit, ...rest } = l;
    void _omit;
    return { ...rest, status };
  });
}
