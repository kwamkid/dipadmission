"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ContactStatus, Result } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

/** บันทึกข้อมูล checklist + โน้ต ของผู้สมัครหนึ่งคน */
export async function saveScreening(
  id: string,
  data: {
    contactStatus?: ContactStatus;
    hasNotebook?: boolean;
    availableLaunch?: boolean;
    trainingGroups?: number[];
    visitAvailable?: boolean;
    consultDate?: string | null; // "YYYY-MM-DD"
    iindustryReg?: boolean;
    notes?: string | null;
  }
): Promise<ActionResult> {
  try {
    await prisma.candidate.update({
      where: { id },
      data: {
        ...(data.contactStatus !== undefined && { contactStatus: data.contactStatus }),
        ...(data.hasNotebook !== undefined && { hasNotebook: data.hasNotebook }),
        ...(data.availableLaunch !== undefined && { availableLaunch: data.availableLaunch }),
        ...(data.trainingGroups !== undefined && { trainingGroups: data.trainingGroups }),
        ...(data.visitAvailable !== undefined && { visitAvailable: data.visitAvailable }),
        ...(data.consultDate !== undefined && {
          consultDate: data.consultDate ? new Date(data.consultDate) : null,
        }),
        ...(data.iindustryReg !== undefined && { iindustryReg: data.iindustryReg }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
    revalidatePath("/screening");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** อัปเดตสถานะติดต่อ (ติดต่อได้/ไม่ได้) แบบเร็วจากตาราง */
export async function setContactStatus(
  id: string,
  status: ContactStatus
): Promise<ActionResult> {
  try {
    await prisma.candidate.update({ where: { id }, data: { contactStatus: status } });
    revalidatePath("/screening");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** จอง/ยกเลิกช่องสัมภาษณ์ — ต้องมี notebook ก่อนถึงจะจองได้ */
export async function bookSlot(
  candidateId: string,
  slotId: string | null
): Promise<ActionResult> {
  try {
    if (slotId === null) {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { interviewSlotId: null },
      });
      revalidatePath("/screening");
      return { ok: true };
    }

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) return { ok: false, error: "ไม่พบผู้สมัคร" };
    // ต้องติ๊กครบทุกข้อก่อนจึงจองช่องสัมภาษณ์ได้
    const missing: string[] = [];
    if (!candidate.hasNotebook) missing.push("มี notebook");
    if (!candidate.availableLaunch) missing.push("เข้าร่วมพิธีเปิด 11 มิ.ย.");
    if (!candidate.visitAvailable) missing.push("สะดวกให้นัด visit กิจการ");
    if (candidate.trainingGroups.length === 0) missing.push("เลือกกลุ่มอบรม");
    if (missing.length > 0)
      return { ok: false, error: `ต้องติ๊กให้ครบก่อนจองช่อง: ${missing.join(", ")}` };

    // ช่องนี้ถูกจองโดยคนอื่นแล้วหรือยัง (เช็คก่อนเพื่อขึ้นข้อความที่อ่านง่าย)
    const holder = await prisma.candidate.findUnique({
      where: { interviewSlotId: slotId },
      select: { id: true, name: true },
    });
    if (holder && holder.id !== candidateId)
      return { ok: false, error: `ช่องนี้ถูกจองโดย ${holder.name} แล้ว` };

    try {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { interviewSlotId: slotId },
      });
    } catch (e) {
      // กันชนกรณีแย่งจองพร้อมกัน: interviewSlotId เป็น unique → คนมาทีหลังจะโดน P2002
      if ((e as { code?: string }).code === "P2002")
        return { ok: false, error: "ช่องนี้เพิ่งถูกจองไปแล้ว — ใครกดก่อนได้ก่อน" };
      throw e;
    }
    revalidatePath("/screening");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** ตัดสินผลคัด Round 1 — ผ่านได้ต้องมี notebook (จำเป็น) */
export async function setResult(id: string, result: Result): Promise<ActionResult> {
  try {
    if (result === "PASS") {
      const c = await prisma.candidate.findUnique({ where: { id } });
      if (!c) return { ok: false, error: "ไม่พบผู้สมัคร" };
      if (!c.hasNotebook)
        return { ok: false, error: "ผ่านไม่ได้: ผู้สมัครต้องมี notebook (จำเป็น)" };
    }
    await prisma.candidate.update({ where: { id }, data: { result } });
    revalidatePath("/screening");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
