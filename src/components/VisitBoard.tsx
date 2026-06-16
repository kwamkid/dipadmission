"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, ClipboardCheck, FileText, Check, Pencil, Phone, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown, X, ExternalLink, LayoutList, ChevronLeft, ChevronRight } from "lucide-react";
import type { VisitItem, VisitReportDTO, CandidateDTO } from "@/lib/types";
import { TRAINING_GROUPS, COACHES } from "@/lib/slots";
import { phone66 } from "@/lib/format";
import { visitProgress } from "@/lib/visit";
import { TABLE } from "@/lib/ui";
import { saveFinal } from "@/app/actions";
import TabNav from "./TabNav";

const GROUP_COLOR: Record<number, string> = {
  1: "bg-indigo-100 text-indigo-700",
  2: "bg-teal-100 text-teal-700",
};
const COACH_COLOR: Record<string, string> = {
  "อ.แอม": "bg-rose-100 text-rose-700",
  "อ.มิ้น": "bg-amber-100 text-amber-700",
  "อ.เอ็ม": "bg-sky-100 text-sky-700",
};
const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

type View = "table" | "calendar";

export default function VisitBoard({ items }: { items: VisitItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // overlay สำหรับ field บน Candidate (เช่น i-industry) ที่แก้จากหน้านี้
  const [candOver, setCandOver] = useState<Record<string, Partial<CandidateDTO>>>({});
  // เรียงตามวันนัด visit — default = เร็ว→ช้า ; "desc" = ช้า→เร็ว ; null = ตามเดิม (กลุ่ม/ชื่อ)
  const [dateSort, setDateSort] = useState<null | "asc" | "desc">("asc");
  const [view, setView] = useState<View>("table");
  const [coachFilter, setCoachFilter] = useState<string>(""); // "" = ทุกคน

  const rows = useMemo(() => {
    let mapped = items.map((it) => {
      let out = it;
      if (candOver[it.candidate.id]) out = { ...out, candidate: { ...out.candidate, ...candOver[it.candidate.id] } };
      return out;
    });
    if (coachFilter) mapped = mapped.filter((it) => it.candidate.visitCoach === coachFilter);
    if (!dateSort) return mapped;
    // คนที่ยังไม่นัดวัน → ไปท้ายสุดเสมอ
    return [...mapped].sort((a, b) => {
      const da = a.candidate.consultDate, db = b.candidate.consultDate;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return dateSort === "asc" ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [items, candOver, dateSort, coachFilter]);

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

        {/* แถบเครื่องมือ: สลับมุมมอง + เรียงวันนัด */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* สลับมุมมอง ตาราง / ปฏิทิน */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5">
            {([["table", "ตาราง", LayoutList], ["calendar", "ปฏิทิน visit", CalendarDays]] as [View, string, typeof LayoutList][]).map(([v, label, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium ${
                  view === v ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {/* กรองตามโค้ช (ทั้งสองมุมมอง) */}
          <div className="inline-flex items-center gap-1">
            <button
              onClick={() => setCoachFilter("")}
              className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium ${
                coachFilter === "" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              โค้ชทุกคน
            </button>
            {COACHES.map((co) => (
              <button
                key={co}
                onClick={() => setCoachFilter(co)}
                className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium ${
                  coachFilter === co ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {co}
              </button>
            ))}
          </div>

          {/* เรียงตามวันนัด visit (เฉพาะมุมมองตาราง) */}
          {view === "table" && (
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
          )}
        </div>

        {view === "calendar" ? (
          <div className="mt-4">
            <VisitCalendarView items={rows} />
          </div>
        ) : (
          <>
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
                    <VisitRow key={it.candidate.id} it={it} onIndustry={setIndustry} onDate={setVisitDate} />
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
                <VisitCard key={it.candidate.id} it={it} onIndustry={setIndustry} onDate={setVisitDate} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- มุมมองปฏิทิน visit (calendar grid รายเดือน) ---------- */
function VisitCalendarView({ items }: { items: VisitItem[] }) {
  const withDate = useMemo(() => items.filter((it) => it.candidate.consultDate), [items]);
  const byDate = useMemo(() => {
    const m = new Map<string, VisitItem[]>();
    for (const it of withDate) {
      const d = it.candidate.consultDate!;
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(it);
    }
    return m;
  }, [withDate]);

  // เดือนเริ่มต้น = เดือนของวันนัดแรกสุด
  const initial = useMemo(() => {
    const dates = withDate.map((it) => it.candidate.consultDate!).sort();
    if (dates.length) {
      const [y, mo] = dates[0].split("-").map(Number);
      return y * 12 + (mo - 1);
    }
    return 2026 * 12 + 5;
  }, [withDate]);
  const [ym, setYm] = useState(initial);
  const year = Math.floor(ym / 12);
  const month = ym % 12;

  const firstW = new Date(year, month, 1).getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstW; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const keyOf = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const noDate = items.filter((it) => !it.candidate.consultDate);

  return (
    <div>
      {/* นำทางเดือน + legend โค้ช */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setYm((v) => v - 1)} className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="min-w-[110px] text-center font-bold text-slate-800">{TH_MONTHS[month]} {year + 543}</h3>
          <button onClick={() => setYm((v) => v + 1)} className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {COACHES.map((co) => (
            <span key={co} className={`rounded px-2 py-0.5 font-medium ${COACH_COLOR[co]}`}>{co}</span>
          ))}
          <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-500">ยังไม่ระบุโค้ช</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px] overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => (
              <div key={i} className={`min-h-[100px] border-b border-r border-slate-100 p-1 ${d ? "" : "bg-slate-50/40"}`}>
                {d && (
                  <>
                    <div className="px-1 text-xs font-medium text-slate-400">{d}</div>
                    <div className="mt-0.5 space-y-0.5">
                      {(byDate.get(keyOf(d)) ?? []).map((it) => {
                        const c = it.candidate;
                        const done = it.report?.status === "DONE";
                        return (
                          <a
                            key={c.id}
                            href={`/visit/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] font-medium hover:brightness-95 ${c.visitCoach ? COACH_COLOR[c.visitCoach] ?? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-600"}`}
                            title={`${c.company ?? c.name}\n${c.visitCoach ?? "ยังไม่ระบุโค้ช"}\nสถานะ: ${done ? "เสร็จ" : "ร่าง"} · ความครบ ${visitProgress(it.report)}%`}
                          >
                            {done && <Check className="h-2.5 w-2.5 shrink-0" />}
                            <span className="truncate">{c.visitCoach ? `${c.visitCoach.replace("อ.", "")}· ` : ""}{c.company ?? c.name}</span>
                          </a>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {noDate.length > 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-3">
          <h3 className="mb-2 text-sm font-bold text-slate-500">ยังไม่ได้นัด visit ({noDate.length})</h3>
          <div className="flex flex-wrap gap-2">
            {noDate.map((it) => (
              <a
                key={it.candidate.id}
                href={`/visit/${it.candidate.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
              >
                {it.candidate.company ?? it.candidate.name}
              </a>
            ))}
          </div>
        </div>
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

// ลิงก์เปิดหน้าฟอร์มแยกใน tab ใหม่
function OpenLink({ id, started, full }: { id: string; started: boolean; full?: boolean }) {
  return (
    <a
      href={`/visit/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${full ? "w-full py-2" : ""} ${
        started ? "border border-blue-300 text-blue-700 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {started ? <><Pencil className="h-3 w-3" /> แก้ข้อมูล</> : <><FileText className="h-3.5 w-3.5" /> กรอกข้อมูล</>}
      <ExternalLink className="h-3 w-3 opacity-70" />
    </a>
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
  onIndustry: (id: string, value: boolean) => void;
  onDate: (id: string, date: string | null, prevDate: string | null) => void;
};

function VisitRow({ it, onIndustry, onDate }: RowProps) {
  const { candidate: c, report } = it;
  const pct = visitProgress(report);
  return (
    <tr className={`border-b border-slate-100 transition hover:brightness-95 ${report?.status === "DONE" ? "bg-emerald-50/60" : ""}`}>
      <td className="px-3 py-2.5">
        <a href={`/visit/${c.id}`} target="_blank" rel="noopener noreferrer" className="text-left font-medium text-blue-700 hover:underline">
          {c.company || c.name}
        </a>
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
        <OpenLink id={c.id} started={pct > 0} />
      </td>
    </tr>
  );
}

function VisitCard({ it, onIndustry, onDate }: RowProps) {
  const { candidate: c, report } = it;
  const pct = visitProgress(report);
  return (
    <div className={`rounded-xl border border-slate-200 p-3 ${report?.status === "DONE" ? "bg-emerald-50/60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <a href={`/visit/${c.id}`} target="_blank" rel="noopener noreferrer" className="text-left">
          <div className="font-semibold text-blue-700">{c.company || c.name}</div>
          <div className="text-xs text-slate-500">{c.name}</div>
        </a>
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
      <div className="mt-2">
        <OpenLink id={c.id} started={pct > 0} full />
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
