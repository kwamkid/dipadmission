import "server-only";
import { prisma } from "./prisma";
import { toIsoDate, slotLabelLines } from "./format";
import type { CandidateDTO, SlotDTO, ContactStatus, Result } from "./types";

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

  const candidates: CandidateDTO[] = rows.map((c) => {
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
    };
  });

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
