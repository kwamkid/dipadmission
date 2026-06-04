"use client";

import { useEffect, useState, useTransition } from "react";
import type { CandidateDTO } from "@/lib/types";
import {
  GATE_ITEMS,
  CRITERIA,
  gateStatus,
  interviewTotal,
  interviewComplete,
} from "@/lib/interview";
import { ChevronLeft, ChevronRight, X, Check, Phone, Link2, Globe, ExternalLink, DoorOpen, BarChart3, MessageCircle, StickyNote, FileText } from "lucide-react";
import type { LeadDTO } from "@/lib/types";
import { TRAINING_GROUPS } from "@/lib/slots";
import { saveInterview, setRound2Result } from "@/app/actions";
import LeadDetailModal from "./LeadDetailModal";

export default function InterviewPanel({
  candidate,
  lead,
  position,
  rank,
  onClose,
  onPrev,
  onNext,
  onChanged,
  onOptimistic,
}: {
  candidate: CandidateDTO;
  lead: LeadDTO | null;
  position: { index: number; total: number };
  rank: number | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onChanged: () => void;
  onOptimistic: (id: string, data: Partial<CandidateDTO>) => void;
}) {
  const c = candidate;
  const [notes, setNotes] = useState(candidate.itvNotes ?? "");
  const [showDetail, setShowDetail] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setNotes(candidate.itvNotes ?? "");
  }, [candidate.id]);

  function commit(data: Partial<CandidateDTO>, fn: () => Promise<{ ok: boolean; error?: string }>) {
    const src = candidate as unknown as Record<string, unknown>;
    const revert: Record<string, unknown> = {};
    for (const k of Object.keys(data)) revert[k] = src[k];
    onOptimistic(candidate.id, data);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        alert(res.error ?? "บันทึกไม่สำเร็จ");
        onOptimistic(candidate.id, revert as Partial<CandidateDTO>);
      }
      onChanged();
    });
  }

  function save(data: Partial<CandidateDTO>) {
    commit(data, () => saveInterview(candidate.id, data as Parameters<typeof saveInterview>[1]));
  }

  function decide(result: CandidateDTO["round2Result"]) {
    commit({ round2Result: result }, () => setRound2Result(candidate.id, result));
  }

  const gate = gateStatus(c);
  const total = interviewTotal(c);
  const done = interviewComplete(c);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>สัมภาษณ์ทีละคน</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
              {position.index + 1} / {position.total}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onPrev} disabled={!onPrev} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-sm disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
            </button>
            <button onClick={onNext} disabled={!onNext} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-sm disabled:opacity-40">
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
                <div className="text-sm text-slate-500">{c.company ?? "-"}</div>
                <div className="text-xs text-slate-400">
                  {[c.province, c.position].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-700">{total}</div>
                <div className="text-xs text-slate-400">/ 100</div>
                {rank != null && <div className="mt-0.5 text-xs font-medium text-violet-600">อันดับ #{rank}</div>}
              </div>
            </div>
            {c.interviewSlotLabel && (
              <div className="mt-2 inline-block whitespace-pre-line rounded-md bg-violet-50 px-2 py-1 text-xs font-medium leading-tight text-violet-700">
                {c.interviewSlotLabel}
              </div>
            )}
            {c.phone && (
              <a href={`tel:${c.phone}`} className="ml-2 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-green-700 hover:underline">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {c.phone}
              </a>
            )}

            {/* รายละเอียดประกอบการสัมภาษณ์ */}
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
              <Info label="รายได้/ปี" value={c.income} />
              <Info label="อายุ" value={c.age != null ? `${c.age}` : null} />
              <Info label="ช่องทางขาย" value={c.channels.join(", ") || null} />
              <Info label="ประเภท" value={c.position} />
            </div>
            {(c.facebookUrl || c.website) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {c.facebookUrl && (
                  <a href={c.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    <Link2 className="h-3.5 w-3.5" /> Facebook <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <Globe className="h-3.5 w-3.5" /> เว็บไซต์ <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
            {c.reason && (
              <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <div className="mb-1 text-xs font-semibold text-amber-700">เหตุผลที่สมัคร</div>
                {c.reason}
              </div>
            )}
            {lead && (
              <button
                onClick={() => setShowDetail(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" /> ดูรายละเอียดทั้งหมด
              </button>
            )}
          </div>

          {/* กลุ่มอบรมที่สะดวก (ยืนยันอีกครั้งตอนสัมภาษณ์) */}
          <div className="mt-4 rounded-xl border border-slate-200 p-3">
            <div className="text-sm font-medium text-slate-700">กลุ่มอบรมที่สะดวก (เลือกได้ทั้ง 2)</div>
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
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent"}`}>
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

          {/* Gate */}
          <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <DoorOpen className="h-4 w-4" /> ข้อ 1 — Gate (30%) · ต้อง “ได้” ครบ {GATE_ITEMS.length} ข้อ
          </h3>
          {gate === false && (
            <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              ตก Gate — ตามเกณฑ์ต้อง reject (ให้ “ไม่ผ่าน”)
            </div>
          )}
          {gate === true && (
            <div className="mb-2 inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              <Check className="h-4 w-4" /> ผ่าน Gate ครบทั้ง {GATE_ITEMS.length} ข้อ
            </div>
          )}
          <div className="space-y-1.5">
            {GATE_ITEMS.map((g) => {
              const v = c[g.key];
              return (
                <div key={g.key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5">
                  <span className="text-base text-slate-700">{g.label}</span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => save({ [g.key]: v === true ? null : true })}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                        v === true ? "bg-green-600 text-white" : "border border-slate-300 text-slate-500"
                      }`}
                    >
                      ได้
                    </button>
                    <button
                      onClick={() => save({ [g.key]: v === false ? null : false })}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                        v === false ? "bg-red-600 text-white" : "border border-slate-300 text-slate-500"
                      }`}
                    >
                      ไม่ได้
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* เกณฑ์ให้คะแนน 2–7 — กดเลือกระดับที่ตรงกับคำตอบ (5=ดีสุด → 1=น้อยสุด) */}
          <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <BarChart3 className="h-4 w-4" /> ข้อ 2–7 — เลือกระดับที่ตรงที่สุด (70%)
          </h3>
          <div className="space-y-3">
            {CRITERIA.map((cr) => {
              const v = c[cr.key];
              return (
                <div key={cr.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-base font-semibold text-slate-700">
                    ข้อ {cr.no}. {cr.title}
                    <span className="ml-1 text-sm font-normal text-slate-400">({cr.weight}%)</span>
                  </div>
                  <div className="mt-1 flex items-start gap-1.5 text-sm text-slate-500">
                    <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {cr.question}
                  </div>
                  <div className="mt-2 space-y-1">
                    {[5, 4, 3, 2, 1].map((n) => {
                      const on = v === n;
                      return (
                        <button
                          key={n}
                          onClick={() => save({ [cr.key]: v === n ? null : n })}
                          className={`flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left ${
                            on ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              on ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {n}
                          </span>
                          <span className={`text-sm leading-snug ${on ? "text-blue-900" : "text-slate-600"}`}>
                            {cr.levels[n as 1 | 2 | 3 | 4 | 5]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* โน้ต */}
          <h3 className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <StickyNote className="h-4 w-4" /> โน้ตการสัมภาษณ์
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== (c.itvNotes ?? "") && save({ itvNotes: notes })}
            rows={3}
            placeholder="ข้อสังเกตเพิ่มเติม / quote เด่นๆ / จุดแข็ง-จุดอ่อน"
            className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* footer: ผลตัดสิน */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className={`inline-flex items-center gap-1 ${done ? "font-medium text-green-600" : "text-slate-400"}`}>
              {done ? <><Check className="h-3.5 w-3.5" /> ประเมินครบทุกข้อ</> : "ยังประเมินไม่ครบ"}
            </span>
            <span className="text-slate-500">คะแนนรวม <b className="text-slate-800">{total}</b>/100</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => decide(c.round2Result === "PASS" ? "PENDING" : "PASS")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold active:scale-[0.97] ${
                c.round2Result === "PASS"
                  ? "bg-green-600 text-white"
                  : "border border-green-500 text-green-700 hover:bg-green-50"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1"><Check className="h-4 w-4" /> เข้าร่วมโครงการ</span>
            </button>
            <button
              onClick={() => decide(c.round2Result === "FAIL" ? "PENDING" : "FAIL")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold active:scale-[0.97] ${
                c.round2Result === "FAIL"
                  ? "bg-red-600 text-white"
                  : "border border-red-400 text-red-600 hover:bg-red-50"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1"><X className="h-4 w-4" /> ไม่ผ่าน</span>
            </button>
          </div>
        </div>
      </aside>

      {showDetail && lead && <LeadDetailModal lead={lead} onClose={() => setShowDetail(false)} />}
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
