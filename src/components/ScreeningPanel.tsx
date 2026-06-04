"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, X, Check, Phone, Link2, Globe, ExternalLink, CalendarDays, StickyNote } from "lucide-react";
import type { CandidateDTO, SlotDTO } from "@/lib/types";
import { checklistComplete, canBookSlot, missingForBooking } from "@/lib/types";
import { INTERVIEW_DAYS, TRAINING_GROUPS } from "@/lib/slots";
import { slotLabelLines } from "@/lib/format";
import { saveScreening, bookSlot, setResult } from "@/app/actions";

export default function ScreeningPanel({
  candidate,
  slots,
  position,
  onClose,
  onPrev,
  onNext,
  onChanged,
  onOptimistic,
}: {
  candidate: CandidateDTO;
  slots: SlotDTO[];
  position: { index: number; total: number };
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onChanged: () => void;
  onOptimistic: (id: string, data: Partial<CandidateDTO>) => void; // อัปเดต overlay ร่วม → ตารางตามทันที
}) {
  // candidate ถูก merge กับ optimistic overlay มาจาก board แล้ว → ตาราง + แถบข้างตรงกันเสมอ
  const c = candidate;
  const [notes, setNotes] = useState(candidate.notes ?? "");
  const [failReason, setFailReason] = useState(candidate.failReason ?? "");
  const [, startTransition] = useTransition();

  // sync ช่องกรอกเมื่อสลับไปคนใหม่
  useEffect(() => {
    setNotes(candidate.notes ?? "");
    setFailReason(candidate.failReason ?? "");
  }, [candidate.id]);

  // apply optimistic ไป overlay ร่วม (board) + ยิง server + revert ถ้า server ปฏิเสธ
  function commit(data: Partial<CandidateDTO>, fn: () => Promise<{ ok: boolean; error?: string }>) {
    const revert: Record<string, unknown> = {};
    const src = candidate as unknown as Record<string, unknown>;
    for (const k of Object.keys(data)) revert[k] = src[k];
    onOptimistic(candidate.id, data);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        alert(res.error ?? "ไม่สำเร็จ");
        onOptimistic(candidate.id, revert as Partial<CandidateDTO>);
      }
      onChanged();
    });
  }

  // จองช่องสัมภาษณ์ (กดช่องเดิมซ้ำ = ยกเลิกจอง) — revert ถ้าช่องถูกจองแล้ว/ติ๊กไม่ครบ
  function book(slotId: string) {
    const target = c.interviewSlotId === slotId ? null : slotId;
    const slot = target ? slots.find((s) => s.id === target) : null;
    const label = slot ? slotLabelLines(slot.label, slot.day, slot.startTime, slot.endTime) : null;
    commit({ interviewSlotId: target, interviewSlotLabel: label }, () => bookSlot(candidate.id, target));
  }

  // checklist toggles + notes/failReason
  function save(data: Parameters<typeof saveScreening>[1]) {
    commit(data as Partial<CandidateDTO>, () => saveScreening(candidate.id, data));
  }

  // ตัดสินผล (ผ่าน/ไม่ผ่าน = ติดต่อแล้ว → ตั้งสถานะ "ติดต่อได้" ด้วย)
  function decide(result: CandidateDTO["result"]) {
    const data: Partial<CandidateDTO> = {
      result,
      ...(result !== "PENDING" && { contactStatus: "CONTACTED" as const }),
    };
    commit(data, () => setResult(candidate.id, result));
  }

  const ready = checklistComplete(c);

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>คัดทีละคน</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
              {position.index + 1} / {position.total}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              disabled={!onPrev}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
            </button>
            <button
              onClick={onNext}
              disabled={!onNext}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-sm disabled:opacity-40"
            >
              ถัดไป <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="ml-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ข้อมูลผู้สมัคร */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{c.name}</h2>
                <div className="text-sm text-slate-500">
                  {c.position ?? "-"}
                  {c.age != null && ` · อายุ ${c.age}`}
                </div>
              </div>
              {c.score != null && (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {c.score}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Info label="บริษัท" value={c.company} />
              <Info label="จังหวัด" value={c.province} />
              <Info label="รายได้" value={c.income} />
              <div>
                <div className="text-xs text-slate-400">ช่องทาง</div>
                <div className="flex flex-wrap gap-1 text-slate-700">
                  {c.channels.length ? c.channels.join(", ") : "-"}
                </div>
              </div>
            </div>

            {/* ลิงก์เพจ / เว็บไซต์ — กดไปดูได้ */}
            {(c.facebookUrl || c.website) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.facebookUrl && (
                  <a
                    href={c.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    <Link2 className="h-4 w-4" /> เพจ Facebook <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Globe className="h-4 w-4" /> เว็บไซต์ <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}

            {c.phone && (
              <a
                href={`tel:${c.phone}`}
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white"
              >
                <Phone className="h-4 w-4" /> โทรหา {c.phone}
              </a>
            )}

            {c.reason && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <div className="mb-1 text-xs font-semibold text-amber-700">เหตุผลที่สมัคร</div>
                {c.reason}
              </div>
            )}

            {/* สถานะติดต่อ */}
            <div className="mt-3 flex gap-2">
              {(["CONTACTED", "UNREACHABLE", "PENDING"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => save({ contactStatus: s })}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                    c.contactStatus === s
                      ? s === "CONTACTED"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : s === "UNREACHABLE"
                        ? "border-slate-500 bg-slate-100 text-slate-700"
                        : "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  {s === "CONTACTED" ? "ติดต่อได้" : s === "UNREACHABLE" ? "ติดต่อไม่ได้" : "ยังไม่โทร"}
                </button>
              ))}
            </div>
          </div>

          {/* CHECKLIST */}
          <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <Check className="h-4 w-4" /> Checklist เงื่อนไขเข้ารอบสัมภาษณ์
          </h3>

          {/* 1. notebook (จำเป็น) */}
          <ToggleCard
            required
            checked={c.hasNotebook}
            onToggle={() => save({ hasNotebook: !c.hasNotebook })}
            title="มี notebook สำหรับเข้าอบรม"
            hint="จำเป็น — ถ้าไม่มี จะจองช่องสัมภาษณ์และให้ผ่านไม่ได้"
          />

          {/* 3. พิธีเปิด 11 มิ.ย. */}
          <ToggleCard
            checked={c.availableLaunch}
            onToggle={() => save({ availableLaunch: !c.availableLaunch })}
            title="ว่างมาร่วมพิธีเปิดตัวโครงการ"
            hint="11 มิ.ย. 09:00 · Zoom 2 ชม."
          />

          {/* 4. กลุ่มเทรนนิ่ง — เลือกได้หลายกลุ่ม */}
          <div className="mt-2 rounded-xl border border-slate-200 p-3">
            <div className="text-sm font-medium text-slate-700">
              สะดวกเข้ากลุ่มอบรม (4 ครั้ง) — เลือกได้ทั้ง 2 กลุ่ม
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[1, 2].map((g) => {
                const on = c.trainingGroups.includes(g);
                return (
                  <button
                    key={g}
                    onClick={() =>
                      save({
                        trainingGroups: on
                          ? c.trainingGroups.filter((x) => x !== g)
                          : [...c.trainingGroups, g].sort(),
                      })
                    }
                    className={`rounded-lg border p-2 text-left text-xs ${
                      on ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent"
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      {TRAINING_GROUPS[g].name}
                    </div>
                    <div className="mt-0.5 text-slate-500">{TRAINING_GROUPS[g].dates}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. นัด visit (แค่ติ๊กว่าสะดวก) */}
          <ToggleCard
            checked={c.visitAvailable}
            onToggle={() => save({ visitAvailable: !c.visitAvailable })}
            title="สะดวกให้นัด visit กิจการครั้งแรก"
            hint="ช่วง 12–23 มิ.ย. (ยังไม่ต้องเลือกวัน ค่อยนัดวันจริงทีหลัง)"
          />

          {/* 2. จองช่องสัมภาษณ์ */}
          <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <CalendarDays className="h-4 w-4" /> จองช่องสัมภาษณ์ Online (4–5 มิ.ย.)
          </h3>
          {!canBookSlot(c) && (
            <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              ต้องติ๊กให้ครบก่อนจองช่อง — ยังขาด: {missingForBooking(c).join(", ")}
            </div>
          )}
          <SlotGrid
            slots={slots}
            currentId={c.interviewSlotId}
            canBook={canBookSlot(c)}
            onPick={(slotId) => book(slotId)}
          />

          {/* notes */}
          <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <StickyNote className="h-4 w-4" /> บันทึกเพิ่มเติม
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (c.notes ?? "") && save({ notes })}
            rows={3}
            placeholder="โน้ตจากการโทร เช่น สนใจมาก / ขอคิดดูก่อน / นัดโทรใหม่…"
            className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* footer: ผลคัด */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className={`inline-flex items-center gap-1 ${ready ? "font-medium text-green-600" : "text-slate-400"}`}>
              {ready ? <><Check className="h-3.5 w-3.5" /> checklist ครบทุกข้อ</> : "checklist ยังไม่ครบ"}
            </span>
            <span className="text-slate-500">{c.interviewSlotLabel ?? "ยังไม่จองช่อง"}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => decide(c.result === "PASS" ? "PENDING" : "PASS")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold active:scale-[0.97] ${
                c.result === "PASS"
                  ? "bg-green-600 text-white"
                  : "border border-green-500 text-green-700 hover:bg-green-50"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1"><Check className="h-4 w-4" /> ผ่านเข้ารอบสัมภาษณ์</span>
            </button>
            <button
              onClick={() => decide(c.result === "FAIL" ? "PENDING" : "FAIL")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold active:scale-[0.97] ${
                c.result === "FAIL"
                  ? "bg-red-600 text-white"
                  : "border border-red-400 text-red-600 hover:bg-red-50"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1"><X className="h-4 w-4" /> ไม่ผ่าน</span>
            </button>
          </div>

          {/* เหตุผลที่ไม่ผ่าน — โผล่ใต้ปุ่มเมื่อเลือก "ไม่ผ่าน" */}
          {c.result === "FAIL" && (
            <div className="mt-2">
              <label className="mb-1 block text-xs font-medium text-red-600">เหตุผลที่ไม่ผ่าน</label>
              <textarea
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                onBlur={() => failReason !== (c.failReason ?? "") && save({ failReason })}
                rows={2}
                placeholder="เช่น ไม่มี notebook / ธุรกิจไม่ตรงเงื่อนไข / ไม่สะดวกเวลาอบรม"
                className="w-full rounded-lg border border-red-300 bg-red-50/50 p-2.5 text-sm outline-none focus:border-red-500"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-slate-700">{value ?? "-"}</div>
    </div>
  );
}

function ToggleCard({
  checked,
  onToggle,
  title,
  hint,
  required,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`mt-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
        checked ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
          checked ? "border-green-600 bg-green-600 text-white" : "border-slate-300 text-transparent"
        }`}
      >
        <Check className="h-4 w-4" />
      </span>
      <span>
        <span className="text-sm font-medium text-slate-700">
          {title}
          {required && <span className="ml-1 text-xs text-red-500">*จำเป็น</span>}
        </span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </button>
  );
}

function SlotGrid({
  slots,
  currentId,
  canBook,
  onPick,
}: {
  slots: SlotDTO[];
  currentId: string | null;
  canBook: boolean;
  onPick: (slotId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {INTERVIEW_DAYS.map((d) => {
        const daySlots = slots.filter((s) => s.day === d.date);
        return (
          <div key={d.date}>
            <div className="mb-1 text-xs font-semibold text-slate-500">{d.labelTH}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {daySlots.map((s) => {
                const isMine = s.id === currentId;
                const takenByOther = s.takenBy !== null && !isMine;
                return (
                  <button
                    key={s.id}
                    disabled={!isMine && (takenByOther || !canBook)}
                    onClick={() => onPick(s.id)}
                    className={`rounded-md border px-1.5 py-1 text-[11px] leading-tight ${
                      isMine
                        ? "border-violet-600 bg-violet-600 text-white"
                        : takenByOther
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300 line-through"
                        : canBook
                        ? "border-slate-300 text-slate-600 hover:border-violet-400 hover:bg-violet-50"
                        : "cursor-not-allowed border-slate-200 text-slate-300"
                    }`}
                    title={takenByOther ? "ช่องนี้ถูกจองแล้ว" : `${s.label} ${s.startTime}-${s.endTime}`}
                  >
                    <div className="font-semibold">{s.label}</div>
                    <div>{s.startTime}</div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
