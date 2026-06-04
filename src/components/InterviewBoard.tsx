"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CandidateDTO, Result } from "@/lib/types";
import { Mic, Trophy, FileSpreadsheet, Check, X, Pencil, BarChart3, CalendarDays, AlertTriangle, Phone } from "lucide-react";
import { gateStatus, interviewTotal, interviewComplete, FINAL_TARGET } from "@/lib/interview";
import { TRAINING_GROUPS } from "@/lib/slots";
import { TABLE } from "@/lib/ui";
import { setRound2Result } from "@/app/actions";
import InterviewPanel from "./InterviewPanel";
import TabNav from "./TabNav";
import CopyButton from "./CopyButton";

export default function InterviewBoard({ candidates }: { candidates: CandidateDTO[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const [over, setOver] = useState<Record<string, Partial<CandidateDTO>>>({});

  const liveRef = useRef(live);
  liveRef.current = live;
  useEffect(() => {
    const t = setInterval(() => {
      if (liveRef.current && document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => clearInterval(t);
  }, [router]);

  const cands = useMemo(
    () => candidates.map((c) => (over[c.id] ? { ...c, ...over[c.id] } : c)),
    [candidates, over]
  );

  // จัดอันดับตามคะแนนรวม (มากไปน้อย) — คนที่ตก Gate ไม่ให้อันดับ
  const ranked = useMemo(() => [...cands].sort((a, b) => interviewTotal(b) - interviewTotal(a)), [cands]);
  const rankOf = useMemo(() => {
    const m = new Map<string, number>();
    let r = 0;
    for (const c of ranked) if (gateStatus(c) !== false) m.set(c.id, ++r);
    return m;
  }, [ranked]);

  const stats = useMemo(() => {
    const done = cands.filter(interviewComplete).length;
    const selected = cands.filter((c) => c.round2Result === "PASS").length;
    return { total: cands.length, done, selected };
  }, [cands]);

  const selectedIndex = ranked.findIndex((c) => c.id === selectedId);
  const selected = selectedIndex >= 0 ? ranked[selectedIndex] : null;

  function refresh() {
    startTransition(() => router.refresh());
  }
  function applyOverlay(id: string, data: Partial<CandidateDTO>) {
    setOver((o) => ({ ...o, [id]: { ...o[id], ...data } }));
  }
  function quickDecide(id: string, result: Result) {
    applyOverlay(id, { round2Result: result });
    startTransition(async () => {
      const res = await setRound2Result(id, result);
      if (!res.ok) {
        alert(res.error);
        setOver((o) => {
          const cur = { ...o[id] };
          delete cur.round2Result;
          return { ...o, [id]: cur };
        });
      }
      router.refresh();
    });
  }

  // คัดลอกผู้ที่เข้าร่วม (เรียงตามอันดับ)
  const copyText = [
    ["อันดับ", "คะแนน", "ชื่อ", "กิจการ"].join("\t"),
    ...ranked
      .filter((c) => c.round2Result === "PASS")
      .map((c) => [rankOf.get(c.id) ?? "-", interviewTotal(c), c.name, c.company ?? ""].join("\t")),
  ].join("\n");

  // คัดลอกผลทั้งหมด (ทุกคน + คะแนนแยกข้อ) — วาง Sheet/Excel แยกคอลัมน์ได้
  const exportAll = [
    ["อันดับ", "ชื่อ", "กิจการ", "Gate", "ข้อ2", "ข้อ3", "ข้อ4", "ข้อ5", "ข้อ6", "ข้อ7", "คะแนนรวม", "ผล"].join("\t"),
    ...ranked.map((c) => {
      const g = gateStatus(c);
      return [
        rankOf.get(c.id) ?? "-",
        c.name,
        c.company ?? "",
        g === true ? "ผ่าน" : g === false ? "ตก" : "-",
        c.itvScore2 ?? "",
        c.itvScore3 ?? "",
        c.itvScore4 ?? "",
        c.itvScore5 ?? "",
        c.itvScore6 ?? "",
        c.itvScore7 ?? "",
        interviewTotal(c),
        c.round2Result === "PASS" ? "เข้าร่วม" : c.round2Result === "FAIL" ? "ไม่ผ่าน" : "-",
      ].join("\t");
    }),
  ].join("\n");

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <Mic className="h-6 w-6" /> สัมภาษณ์คัดเลือก — รอบที่ 3 (Zoom)
              </h1>
              <p className="mt-0.5 text-sm text-blue-100">
                ให้คะแนนตาม Matrix · คัดเหลือ {FINAL_TARGET} กิจการ · เลือกแล้ว {stats.selected}/{FINAL_TARGET}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <CopyButton
                text={copyText}
                icon={<Trophy className="h-4 w-4" />}
                label={`คัดลอกผู้เข้าร่วม (${stats.selected})`}
                doneMessage={`คัดลอกผู้เข้าร่วม ${stats.selected} กิจการแล้ว`}
              />
              <CopyButton
                text={exportAll}
                icon={<FileSpreadsheet className="h-4 w-4" />}
                label="คัดลอกผลทั้งหมด"
                doneMessage={`คัดลอกผลสัมภาษณ์ทั้งหมด ${ranked.length} คนแล้ว\n(วางใน Sheet/Excel แยกคอลัมน์ได้)`}
              />
            </div>
          </div>
          <TabNav active="interview" />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="ผู้เข้าสัมภาษณ์" value={stats.total} tone="slate" />
          <Stat label="ประเมินครบ" value={`${stats.done}/${stats.total}`} tone="blue" />
          <Stat label={`เลือกเข้าร่วม (เป้า ${FINAL_TARGET})`} value={`${stats.selected}/${FINAL_TARGET}`} tone="green" />
        </div>

        {/* สรุปกลุ่มอบรม — นับจากผู้สัมภาษณ์ทุกคนที่ติ๊กกลุ่มแล้ว (ไม่ต้องรอผลเลือก) */}
        <TrainingSummary people={cands} />
      </div>

      <div className="mx-auto max-w-[1500px] px-5 pb-4">

        {/* ตาราง — จอใหญ่ */}
        <div className={`mt-4 ${TABLE.tableWrapDesktop} ${TABLE.wrap}`}>
          <table className={`min-w-[900px] ${TABLE.table}`}>
            <thead className={TABLE.thead}>
              <tr className={TABLE.theadRow}>
                <th className="px-3 py-2.5">อันดับ</th>
                <th className="px-3 py-2.5">ชื่อ / กิจการ</th>
                <th className="px-3 py-2.5">คิว</th>
                <th className="px-3 py-2.5">Gate</th>
                <th className="px-3 py-2.5">คะแนน</th>
                <th className="px-3 py-2.5">ให้คะแนน</th>
                <th className="px-3 py-2.5">ผลเลือก</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c) => (
                <ItvRow
                  key={c.id}
                  c={c}
                  rank={rankOf.get(c.id) ?? null}
                  onOpen={() => setSelectedId(c.id)}
                  onPass={() => quickDecide(c.id, c.round2Result === "PASS" ? "PENDING" : "PASS")}
                  onFail={() => quickDecide(c.id, c.round2Result === "FAIL" ? "PENDING" : "FAIL")}
                />
              ))}
              {ranked.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-slate-400">
                    ยังไม่มีผู้จองช่องสัมภาษณ์ — จองช่องในหน้าคัดกรองก่อน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* การ์ด — มือถือ */}
        <div className="mt-4 space-y-2 md:hidden">
          {ranked.map((c) => (
            <ItvCard
              key={c.id}
              c={c}
              rank={rankOf.get(c.id) ?? null}
              onOpen={() => setSelectedId(c.id)}
              onPass={() => quickDecide(c.id, c.round2Result === "PASS" ? "PENDING" : "PASS")}
              onFail={() => quickDecide(c.id, c.round2Result === "FAIL" ? "PENDING" : "FAIL")}
            />
          ))}
          {ranked.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-12 text-center text-slate-400">
              ยังไม่มีผู้จองช่องสัมภาษณ์
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
          <button
            onClick={() => setLive((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              live ? "border-green-300 bg-green-50 text-green-700" : "border-slate-300 text-slate-400"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-green-500" : "bg-slate-300"}`} />
            {live ? "Live" : "หยุดซิงค์"}
          </button>
          {isPending && <span className="text-blue-500">· กำลังบันทึก…</span>}
        </div>
      </div>

      {selected && (
        <InterviewPanel
          candidate={selected}
          rank={rankOf.get(selected.id) ?? null}
          position={{ index: selectedIndex, total: ranked.length }}
          onClose={() => setSelectedId(null)}
          onPrev={selectedIndex > 0 ? () => setSelectedId(ranked[selectedIndex - 1].id) : undefined}
          onNext={selectedIndex < ranked.length - 1 ? () => setSelectedId(ranked[selectedIndex + 1].id) : undefined}
          onChanged={refresh}
          onOptimistic={applyOverlay}
        />
      )}
    </div>
  );
}

type ItvHandlers = { onOpen: () => void; onPass: () => void; onFail: () => void };

function GateBadge({ c }: { c: CandidateDTO }) {
  const g = gateStatus(c);
  if (g === true) return <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">ผ่าน</span>;
  if (g === false) return <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">ตก</span>;
  return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-400">—</span>;
}

function ScoreButton({ c, onOpen }: { c: CandidateDTO; onOpen: () => void }) {
  const scored = [c.itvScore2, c.itvScore3, c.itvScore4, c.itvScore5, c.itvScore6, c.itvScore7].filter((x) => x != null).length;
  const started = scored > 0 || gateStatus(c) != null;
  return (
    <button
      onClick={onOpen}
      className={`mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
        started ? "border border-blue-300 text-blue-700 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {started ? <><Pencil className="h-3 w-3" /> แก้คะแนน ({scored}/6)</> : <><BarChart3 className="h-3.5 w-3.5" /> ให้คะแนน</>}
    </button>
  );
}

function ResultButtons({ c, onPass, onFail }: { c: CandidateDTO; onPass: () => void; onFail: () => void }) {
  return (
    <div className="flex flex-nowrap gap-1 whitespace-nowrap">
      <button
        onClick={onPass}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${
          c.round2Result === "PASS" ? "bg-green-600 text-white" : "border border-green-300 text-green-700 hover:bg-green-50"
        }`}
      >
        <Check className="h-4 w-4" /> เข้าร่วม
      </button>
      <button
        onClick={onFail}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${
          c.round2Result === "FAIL" ? "bg-red-600 text-white" : "border border-red-300 text-red-700 hover:bg-red-50"
        }`}
      >
        <X className="h-4 w-4" /> ไม่ผ่าน
      </button>
    </div>
  );
}

function rowTone(c: CandidateDTO): string {
  if (c.round2Result === "PASS") return "bg-emerald-100/70";
  if (c.round2Result === "FAIL") return "bg-rose-100/70";
  if (gateStatus(c) === false) return "bg-slate-100";
  return "";
}

function ItvRow({ c, rank, onOpen, onPass, onFail }: { c: CandidateDTO; rank: number | null } & ItvHandlers) {
  const total = interviewTotal(c);
  return (
    <tr className={`border-b border-slate-100 transition hover:brightness-95 ${rowTone(c)}`}>
      <td className="px-3 py-2.5">
        {rank != null ? (
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
            rank <= FINAL_TARGET ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"
          }`}>
            {rank}
          </span>
        ) : (
          "-"
        )}
      </td>
      <td className="px-3 py-2.5">
        <button onClick={onOpen} className="text-left font-medium text-blue-700 hover:underline">
          {c.name}
        </button>
        <div className="text-sm text-slate-400">{c.company ?? "-"}</div>
        {c.phone && (
          <a href={`tel:${c.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-green-700 hover:underline">
            <Phone className="h-3.5 w-3.5 text-slate-400" /> {c.phone}
          </a>
        )}
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-block whitespace-pre-line text-xs leading-tight text-violet-700">
          {c.interviewSlotLabel ?? "-"}
        </span>
      </td>
      <td className="px-3 py-2.5"><GateBadge c={c} /></td>
      <td className="px-3 py-2.5">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-slate-800">{total}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
        <div className="text-xs text-slate-400">
          ประเมิน {[c.itvScore2, c.itvScore3, c.itvScore4, c.itvScore5, c.itvScore6, c.itvScore7].filter((x) => x != null).length}/6
        </div>
      </td>
      <td className="px-3 py-2.5"><ScoreButton c={c} onOpen={onOpen} /></td>
      <td className="px-3 py-2.5"><ResultButtons c={c} onPass={onPass} onFail={onFail} /></td>
    </tr>
  );
}

function ItvCard({ c, rank, onOpen, onPass, onFail }: { c: CandidateDTO; rank: number | null } & ItvHandlers) {
  const total = interviewTotal(c);
  return (
    <div className={`rounded-xl border border-slate-200 p-3 ${rowTone(c)}`}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="text-left">
          <div className="font-semibold text-blue-700">
            {rank != null && <span className="mr-1 text-violet-600">#{rank}</span>}
            {c.name}
          </div>
          <div className="text-xs text-slate-500">{c.company ?? "-"}</div>
          {c.phone && (
            <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
              <Phone className="h-3 w-3 text-slate-400" /> {c.phone}
            </div>
          )}
        </button>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-800">
            {total}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <GateBadge c={c} />
        </div>
      </div>
      <div className="mt-1 whitespace-pre-line text-xs text-violet-700">{c.interviewSlotLabel ?? ""}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ScoreButton c={c} onOpen={onOpen} />
        <ResultButtons c={c} onPass={onPass} onFail={onFail} />
      </div>
    </div>
  );
}

function TrainingSummary({ people }: { people: CandidateDTO[] }) {
  const CAP = 8; // เป้าต่อกลุ่ม (~7-8 รวม 15 สำหรับผู้ชนะ)
  const has = (c: CandidateDTO, g: number) => c.trainingGroups.includes(g);
  const picked = people.filter((c) => c.trainingGroups.length > 0).length;
  const g1 = people.filter((c) => has(c, 1)).length;
  const g2 = people.filter((c) => has(c, 2)).length;
  const only1 = people.filter((c) => has(c, 1) && !has(c, 2)).length;
  const only2 = people.filter((c) => has(c, 2) && !has(c, 1)).length;
  const both = people.filter((c) => has(c, 1) && has(c, 2)).length;
  const none = people.filter((c) => c.trainingGroups.length === 0).length;
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <CalendarDays className="h-4 w-4" /> สรุปกลุ่มอบรม (เลือกแล้ว {picked}/{people.length} คน · เป้ารับกลุ่มละ ~{CAP})
        </h3>
        {none > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" /> ยังไม่เลือกกลุ่ม {none} คน
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <GroupBar name={TRAINING_GROUPS[1].name} dates={TRAINING_GROUPS[1].dates} count={g1} cap={CAP} />
        <GroupBar name={TRAINING_GROUPS[2].name} dates={TRAINING_GROUPS[2].dates} count={g2} cap={CAP} />
      </div>
      <div className="mt-2 text-xs text-slate-500">
        เฉพาะพุธ <b className="text-slate-700">{only1}</b> · เฉพาะจันทร์ <b className="text-slate-700">{only2}</b> ·
        สะดวกทั้ง 2 กลุ่ม (ยืดหยุ่นจัดได้) <b className="text-slate-700">{both}</b>
      </div>
    </div>
  );
}

function GroupBar({ name, dates, count, cap }: { name: string; dates: string; count: number; cap: number }) {
  const full = count >= cap;
  const pct = Math.min(100, cap ? (count / cap) * 100 : 0);
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">{name}</span>
        <span className={`inline-flex items-center gap-1 text-sm font-bold ${full ? "text-green-600" : "text-slate-700"}`}>
          {count}/{cap} {full && <><Check className="h-3.5 w-3.5" /> ครบ</>}
        </span>
      </div>
      <div className="mt-0.5 text-xs text-slate-400">{dates}</div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${full ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  const tones: Record<string, string> = {
    slate: "text-slate-700",
    blue: "text-blue-700",
    green: "text-green-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-0.5 text-2xl font-bold ${tones[tone] ?? "text-slate-700"}`}>{value}</div>
    </div>
  );
}
