"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, ClipboardCheck, FileText, Check, Pencil, Phone, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import type { VisitItem, VisitReportDTO, CandidateDTO } from "@/lib/types";
import { TRAINING_GROUPS } from "@/lib/slots";
import { phone66 } from "@/lib/format";
import { visitProgress } from "@/lib/visit";
import { TABLE } from "@/lib/ui";
import { saveFinal } from "@/app/actions";
import TabNav from "./TabNav";
import VisitPanel from "./VisitPanel";

const GROUP_COLOR: Record<number, string> = {
  1: "bg-indigo-100 text-indigo-700",
  2: "bg-teal-100 text-teal-700",
};

export default function VisitBoard({ items }: { items: VisitItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // overlay เก็บค่าที่เพิ่งแก้ (optimistic) ทับ report ของ candidate นั้น
  const [over, setOver] = useState<Record<string, Partial<VisitReportDTO>>>({});
  // overlay สำหรับ field บน Candidate (เช่น i-industry) ที่แก้จากหน้านี้
  const [candOver, setCandOver] = useState<Record<string, Partial<CandidateDTO>>>({});
  // เรียงตามวันนัด visit — default = เร็ว→ช้า ; "desc" = ช้า→เร็ว ; null = ตามเดิม (กลุ่ม/ชื่อ)
  const [dateSort, setDateSort] = useState<null | "asc" | "desc">("asc");

  const rows = useMemo(() => {
    const mapped = items.map((it) => {
      let out = it;
      if (over[it.candidate.id]) out = { ...out, report: { ...(out.report ?? ({} as VisitReportDTO)), ...over[it.candidate.id] } };
      if (candOver[it.candidate.id]) out = { ...out, candidate: { ...out.candidate, ...candOver[it.candidate.id] } };
      return out;
    });
    if (!dateSort) return mapped;
    // คนที่ยังไม่นัดวัน → ไปท้ายสุดเสมอ
    return [...mapped].sort((a, b) => {
      const da = a.candidate.consultDate, db = b.candidate.consultDate;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return dateSort === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [items, over, candOver, dateSort]);

  // อัปเดต field บน Candidate (i-industry / วันนัด visit) → เขียนกลับผ่าน saveFinal
  function setCandidate(id: string, data: Partial<CandidateDTO>, prev: Partial<CandidateDTO>) {
    setCandOver((o) => ({ ...o, [id]: { ...o[id], ...data } }));
    startTransition(async () => {
      const res = await saveFinal(id, data as Parameters<typeof saveFinal>[1]);
      if (!res.ok) {
        alert(res.error);
        setCandOver((o) => ({ ...o, [id]: { ...o[id], ...prev } }));
      }
      router.refresh();
    });
  }
  const setIndustry = (id: string, value: boolean) =>
    setCandidate(id, { iindustryReg: value }, { iindustryReg: !value });
  const setVisitDate = (id: string, date: string | null, prevDate: string | null) =>
    setCandidate(id, { consultDate: date }, { consultDate: prevDate });

  const stats = useMemo(() => {
    const done = rows.filter((r) => r.report?.status === "DONE").length;
    const mou = rows.filter((r) => r.report?.mouSigned).length;
    const ind = rows.filter((r) => r.candidate.iindustryReg).length;
    return { total: rows.length, done, mou, ind };
  }, [rows]);

  const selectedIndex = rows.findIndex((r) => r.candidate.id === selectedId);
  const selected = selectedIndex >= 0 ? rows[selectedIndex] : null;

  function refresh() {
    startTransition(() => router.refresh());
  }
  function applyOverlay(id: string, data: Partial<VisitReportDTO>) {
    setOver((o) => ({ ...o, [id]: { ...o[id], ...data } }));
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-5 py-4">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="h-6 w-6" /> เก็บข้อมูลสถานประกอบการ — 1st Visit / Consult
          </h1>
          <p className="mt-0.5 text-sm text-blue-100">
            กรอกครบ {stats.done}/{stats.total} · MOU เซ็นแล้ว {stats.mou}/{stats.total} · i-industry {stats.ind}/{stats.total}
          </p>
          <TabNav active="visit" />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 sm:px-5 py-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="กิจการทั้งหมด" value={stats.total} tone="slate" />
          <Stat label="กรอกครบ (DONE)" value={`${stats.done}/${stats.total}`} tone="green" />
          <Stat label="MOU เซ็นแล้ว" value={`${stats.mou}/${stats.total}`} tone="blue" />
        </div>

        {/* เรียงตามวันนัด visit */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setDateSort((s) => (s === "asc" ? "desc" : s === "desc" ? null : "asc"))}
            title="เรียงตามวันนัด visit"
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium ${
              dateSort ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {dateSort === "asc" ? <ArrowUp className="h-4 w-4" /> : dateSort === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
            เรียงวันนัด{dateSort === "asc" ? " (เร็ว→ช้า)" : dateSort === "desc" ? " (ช้า→เร็ว)" : " (ปิด)"}
          </button>
        </div>

        {/* ตาราง — tablet ขึ้นไป (≥768px) ; มือถือใช้การ์ด */}
        <div className={`mt-4 hidden md:block ${TABLE.wrap}`}>
          <table className={`min-w-[760px] ${TABLE.table}`}>
            <thead className={TABLE.thead}>
              <tr className={TABLE.theadRow}>
                <th className="px-3 py-2.5">กิจการ</th>
                <th className="px-3 py-2.5">กลุ่ม</th>
                <th className="px-3 py-2.5">โค้ช</th>
                <th className="px-3 py-2.5">วันนัด visit</th>
                <th className="px-3 py-2.5">i-industry</th>
                <th className="px-3 py-2.5">ความครบ</th>
                <th className="px-3 py-2.5">สถานะ</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => (
                <VisitRow key={it.candidate.id} it={it} onOpen={() => setSelectedId(it.candidate.id)} onIndustry={setIndustry} onDate={setVisitDate} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-slate-400">
                    ยังไม่มีกิจการที่ผ่าน Final — ตัดสินผลในหน้าสัมภาษณ์ก่อน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* การ์ด — มือถือเท่านั้น (<768px) */}
        <div className="mt-4 space-y-2 md:hidden">
          {rows.map((it) => (
            <VisitCard key={it.candidate.id} it={it} onOpen={() => setSelectedId(it.candidate.id)} onIndustry={setIndustry} onDate={setVisitDate} />
          ))}
        </div>
      </div>

      {selected && (
        <VisitPanel
          item={selected}
          position={{ index: selectedIndex, total: rows.length }}
          onClose={() => setSelectedId(null)}
          onPrev={selectedIndex > 0 ? () => setSelectedId(rows[selectedIndex - 1].candidate.id) : undefined}
          onNext={selectedIndex < rows.length - 1 ? () => setSelectedId(rows[selectedIndex + 1].candidate.id) : undefined}
          onChanged={refresh}
          onOptimistic={applyOverlay}
        />
      )}
    </div>
  );
}

function GroupBadge({ g }: { g: number | null }) {
  if (!g) return <span className="text-xs text-slate-400">-</span>;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${GROUP_COLOR[g] ?? "bg-slate-100 text-slate-600"}`}>
      {TRAINING_GROUPS[g]?.name.replace(/\s*\(.*\)/, "") ?? `กลุ่ม ${g}`}
    </span>
  );
}

function StatusBadge({ status }: { status?: VisitReportDTO["status"] }) {
  if (status === "DONE")
    return (
      <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <Check className="h-3 w-3" /> เสร็จ
      </span>
    );
  return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">ร่าง</span>;
}

function ProgressBar({ pct }: { pct: number }) {
  const full = pct >= 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${full ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-500">{pct}%</span>
    </div>
  );
}

function OpenButton({ started }: { started: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
        started ? "border border-blue-300 text-blue-700" : "bg-blue-600 text-white"
      }`}
    >
      {started ? <><Pencil className="h-3 w-3" /> แก้ข้อมูล</> : <><FileText className="h-3.5 w-3.5" /> กรอกข้อมูล</>}
    </span>
  );
}

function IndustryToggle({ on, onToggle }: { on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onToggle(!on)}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${
        on ? "bg-green-600 text-white" : "border border-slate-300 text-slate-500"
      }`}
    >
      {on ? <Check className="h-3.5 w-3.5" /> : null} {on ? "ลงแล้ว" : "ยังไม่ลง"}
    </button>
  );
}

// ช่องแก้วันนัด visit + ปุ่มลบ (เขียนกลับที่ Candidate.consultDate)
function DateCell({ value, onChange, full }: { value: string | null; onChange: (date: string | null) => void; full?: boolean }) {
  return (
    <div className={`flex items-center gap-1 ${full ? "w-full" : ""}`}>
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={`h-9 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500 ${full ? "w-full" : ""}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          title="ลบวันนัด"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

type RowProps = {
  it: VisitItem;
  onOpen: () => void;
  onIndustry: (id: string, value: boolean) => void;
  onDate: (id: string, date: string | null, prevDate: string | null) => void;
};

function VisitRow({ it, onOpen, onIndustry, onDate }: RowProps) {
  const { candidate: c, report } = it;
  const pct = visitProgress(report);
  return (
    <tr className={`border-b border-slate-100 transition hover:brightness-95 ${report?.status === "DONE" ? "bg-emerald-50/60" : ""}`}>
      <td className="px-3 py-2.5">
        <button onClick={onOpen} className="text-left font-medium text-blue-700 hover:underline">
          {c.company || c.name}
        </button>
        <div className="text-xs text-slate-400">{c.name}</div>
        {c.phone && (
          <a href={`tel:${c.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-green-700">
            <Phone className="h-3 w-3 text-slate-400" /> {phone66(c.phone)}
          </a>
        )}
      </td>
      <td className="px-3 py-2.5"><GroupBadge g={c.finalGroup} /></td>
      <td className="px-3 py-2.5 text-sm text-slate-600">{c.visitCoach ?? "-"}</td>
      <td className="px-3 py-2.5"><DateCell value={c.consultDate} onChange={(d) => onDate(c.id, d, c.consultDate)} /></td>
      <td className="px-3 py-2.5"><IndustryToggle on={c.iindustryReg} onToggle={(v) => onIndustry(c.id, v)} /></td>
      <td className="px-3 py-2.5"><ProgressBar pct={pct} /></td>
      <td className="px-3 py-2.5"><StatusBadge status={report?.status} /></td>
      <td className="px-3 py-2.5">
        <button onClick={onOpen}><OpenButton started={pct > 0} /></button>
      </td>
    </tr>
  );
}

function VisitCard({ it, onOpen, onIndustry, onDate }: RowProps) {
  const { candidate: c, report } = it;
  const pct = visitProgress(report);
  return (
    <div className={`rounded-xl border border-slate-200 p-3 ${report?.status === "DONE" ? "bg-emerald-50/60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="text-left">
          <div className="font-semibold text-blue-700">{c.company || c.name}</div>
          <div className="text-xs text-slate-500">{c.name}</div>
        </button>
        <StatusBadge status={report?.status} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <GroupBadge g={c.finalGroup} />
        {c.visitCoach && <span>{c.visitCoach}</span>}
      </div>
      <div className="mt-2">
        <div className="mb-0.5 flex items-center gap-1 text-xs text-slate-400"><CalendarDays className="h-3 w-3" /> วันนัด visit</div>
        <DateCell value={c.consultDate} onChange={(d) => onDate(c.id, d, c.consultDate)} full />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">i-industry</span>
          <IndustryToggle on={c.iindustryReg} onToggle={(v) => onIndustry(c.id, v)} />
        </div>
        <ProgressBar pct={pct} />
      </div>
      <div className="mt-2 flex justify-end">
        <button onClick={onOpen}><OpenButton started={pct > 0} /></button>
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
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <ClipboardCheck className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-0.5 text-2xl font-bold ${tones[tone] ?? "text-slate-700"}`}>{value}</div>
    </div>
  );
}
