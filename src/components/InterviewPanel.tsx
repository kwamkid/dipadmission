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
import { saveInterview, setRound2Result } from "@/app/actions";

export default function InterviewPanel({
  candidate,
  position,
  rank,
  onClose,
  onPrev,
  onNext,
  onChanged,
  onOptimistic,
}: {
  candidate: CandidateDTO;
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
            <button onClick={onPrev} disabled={!onPrev} className="rounded-md border border-slate-300 px-2.5 py-1 text-sm disabled:opacity-40">
              ← ก่อนหน้า
            </button>
            <button onClick={onNext} disabled={!onNext} className="rounded-md border border-slate-300 px-2.5 py-1 text-sm disabled:opacity-40">
              ถัดไป →
            </button>
            <button onClick={onClose} className="ml-1 rounded-md px-2.5 py-1 text-sm text-slate-500 hover:bg-slate-200">
              ✕
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
              <a href={`tel:${c.phone}`} className="ml-2 text-sm text-slate-600 hover:text-green-700 hover:underline">
                📞 {c.phone}
              </a>
            )}
          </div>

          {/* Gate */}
          <h3 className="mt-5 mb-2 text-sm font-bold text-slate-700">🚪 ข้อ 1 — Gate (30%) · ต้อง “ได้” ครบ 4 ข้อ</h3>
          {gate === false && (
            <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              ตก Gate — ตามเกณฑ์ต้อง reject (ให้ “ไม่ผ่าน”)
            </div>
          )}
          {gate === true && (
            <div className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              ✓ ผ่าน Gate ครบทั้ง 4 ข้อ
            </div>
          )}
          <div className="space-y-1.5">
            {GATE_ITEMS.map((g) => {
              const v = c[g.key];
              return (
                <div key={g.key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5">
                  <span className="text-sm text-slate-700">{g.label}</span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => save({ [g.key]: true })}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        v === true ? "bg-green-600 text-white" : "border border-slate-300 text-slate-500"
                      }`}
                    >
                      ได้
                    </button>
                    <button
                      onClick={() => save({ [g.key]: false })}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
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

          {/* เกณฑ์ให้คะแนน 2–7 */}
          <h3 className="mt-5 mb-2 text-sm font-bold text-slate-700">📊 ข้อ 2–7 — ให้คะแนน 1–5 (70%)</h3>
          <div className="space-y-2">
            {CRITERIA.map((cr) => {
              const v = c[cr.key];
              return (
                <div key={cr.key} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-medium text-slate-700">
                    ข้อ {cr.no}. {cr.title}
                    <span className="ml-1 text-xs font-normal text-slate-400">({cr.weight}%)</span>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{cr.question}</div>
                  <div className="mt-2 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => save({ [cr.key]: n })}
                        className={`h-9 w-9 rounded-md text-sm font-semibold ${
                          v === n
                            ? "bg-blue-600 text-white"
                            : "border border-slate-300 text-slate-500 hover:border-blue-400"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  {v != null && (
                    <div className="mt-1.5 rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">
                      {cr.levels[v as 1 | 2 | 3 | 4 | 5]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* โน้ต */}
          <h3 className="mt-5 mb-2 text-sm font-bold text-slate-700">📝 โน้ตการสัมภาษณ์</h3>
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
            <span className={done ? "font-medium text-green-600" : "text-slate-400"}>
              {done ? "✓ ประเมินครบทุกข้อ" : "ยังประเมินไม่ครบ"}
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
              ✓ เข้าร่วมโครงการ
            </button>
            <button
              onClick={() => decide(c.round2Result === "FAIL" ? "PENDING" : "FAIL")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold active:scale-[0.97] ${
                c.round2Result === "FAIL"
                  ? "bg-red-600 text-white"
                  : "border border-red-400 text-red-600 hover:bg-red-50"
              }`}
            >
              ✕ ไม่ผ่าน
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
