import "server-only";
import { prisma } from "./prisma";
import { toIsoDate, thaiDateShort } from "./format";
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
      interviewSlotLabel = `${c.interviewSlot.label} · ${thaiDateShort(iso)} ${c.interviewSlot.startTime}-${c.interviewSlot.endTime}`;
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
      consultDate: toIsoDate(c.consultDate),
      iindustryReg: c.iindustryReg,
      interviewSlotId: c.interviewSlotId,
      interviewSlotLabel,
      result: c.result as Result,
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
