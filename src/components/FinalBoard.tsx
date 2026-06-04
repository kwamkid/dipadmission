"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trophy, CalendarDays, Check, MapPin, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import type { CandidateDTO } from "@/lib/types";
import { TRAINING_GROUPS, COACHES } from "@/lib/slots";
import { thaiWeekdayShort, thaiDateShort } from "@/lib/format";
import { TABLE } from "@/lib/ui";
import { saveFinal } from "@/app/actions";
import TabNav from "./TabNav";
import CopyButton from "./CopyButton";

type View = "table" | "groups" | "calendar";

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

export default function FinalBoard({
  winners,
  companyAddress,
}: {
  winners: CandidateDTO[];
  companyAddress: Record<string, string>;
}) {
  const addrOf = (c: CandidateDTO) => (c.phone ? companyAddress[c.phone] ?? "" : "");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [over, setOver] = useState<Record<string, Partial<CandidateDTO>>>({});
  const [view, setView] = useState<View>("table");

  const people = useMemo(
    () => winners.map((c) => (over[c.id] ? { ...c, ...over[c.id] } : c)),
    [winners, over]
  );

  function set(id: string, data: Partial<CandidateDTO>) {
    const before: Partial<CandidateDTO> = {};
    const src = winners.find((w) => w.id === id) as unknown as Record<string, unknown> | undefined;
    for (const k of Object.keys(data)) before[k as keyof CandidateDTO] = (src?.[k] as never) ?? null;
    setOver((o) => ({ ...o, [id]: { ...o[id], ...data } }));
    startTransition(async () => {
      const res = await saveFinal(id, data as Parameters<typeof saveFinal>[1]);
      if (!res.ok) {
        alert(res.error);
        setOver((o) => ({ ...o, [id]: { ...o[id], ...before } }));
      }
      router.refresh();
    });
  }

  const stats = useMemo(() => {
    const g1 = people.filter((c) => c.finalGroup === 1).length;
    const g2 = people.filter((c) => c.finalGroup === 2).length;
    const unassigned = people.filter((c) => !c.finalGroup).length;
    const visit = people.filter((c) => c.consultDate).length;
    const ind = people.filter((c) => c.iindustryReg).length;
    return { g1, g2, unassigned, visit, ind };
  }, [people]);

  const clean = (s: string) => s.replace(/[\t\n]/g, " ");
  const copyText = [
    ["ชื่อ", "กิจการ", "เบอร์", "กลุ่มเรียน", "i-industry", "วัน visit", "โค้ช", "สถานที่นัด"].join("\t"),
    ...people.map((c) =>
      [
        c.name,
        c.company ?? "",
        c.phone ?? "",
        c.finalGroup ? TRAINING_GROUPS[c.finalGroup].name : "",
        c.iindustryReg ? "ลงแล้ว" : "ยัง",
        c.consultDate ? `${thaiWeekdayShort(c.consultDate)} ${thaiDateShort(c.consultDate)}` : "",
        c.visitCoach ?? "",
        clean(c.visitLocation || addrOf(c)),
      ].join("\t")
    ),
  ].join("\n");

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <Trophy className="h-6 w-6" /> ผู้เข้าร่วมโครงการ — จัดกลุ่ม &amp; นัด visit
              </h1>
              <p className="mt-0.5 text-sm text-blue-100">
                {winners.length} กิจการ · กลุ่มพุธ {stats.g1} · กลุ่มจันทร์ {stats.g2} · นัด visit แล้ว {stats.visit}/{winners.length} · i-industry {stats.ind}/{winners.length}
              </p>
            </div>
            <CopyButton text={copyText} icon={<FileSpreadsheet className="h-4 w-4" />} label="คัดลอกตาราง" doneMessage={`คัดลอก ${winners.length} กิจการแล้ว`} />
          </div>
          <TabNav active="final" />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-4">
        {/* สลับมุมมอง + นับกลุ่ม */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            {([["table", "จัดกลุ่ม/นัด"], ["groups", "แยกกลุ่ม"], ["calendar", "ปฏิทิน visit"]] as [View, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === v ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-lg px-2.5 py-1 font-medium ${GROUP_COLOR[1]}`}>กลุ่มพุธ {stats.g1} คน</span>
            <span className={`rounded-lg px-2.5 py-1 font-medium ${GROUP_COLOR[2]}`}>กลุ่มจันทร์ {stats.g2} คน</span>
            {stats.unassigned > 0 && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-500">ยังไม่จัดกลุ่ม {stats.unassigned} คน</span>
            )}
          </div>
        </div>

        {view === "table" && <EditTable people={people} set={set} addrOf={addrOf} />}
        {view === "groups" && <GroupsView people={people} addrOf={addrOf} />}
        {view === "calendar" && <CalendarView people={people} addrOf={addrOf} />}
      </div>
    </div>
  );
}

/* ---------- มุมมองตารางจัดกลุ่ม/นัด ---------- */
function EditTable({ people, set, addrOf }: { people: CandidateDTO[]; set: (id: string, d: Partial<CandidateDTO>) => void; addrOf: (c: CandidateDTO) => string }) {
  return (
    <div className={`${TABLE.wrap}`}>
      <table className={`min-w-[1250px] ${TABLE.table}`}>
        <thead className={TABLE.thead}>
          <tr className={TABLE.theadRow}>
            <th className="px-3 py-2.5">ชื่อ / กิจการ / ที่อยู่</th>
            <th className="px-3 py-2.5">สะดวกกลุ่ม</th>
            <th className="px-3 py-2.5">กลุ่มเรียนจริง</th>
            <th className="px-3 py-2.5">i-industry</th>
            <th className="px-3 py-2.5">วันนัด 1st visit</th>
            <th className="px-3 py-2.5">โค้ชที่ไป</th>
            <th className="px-3 py-2.5">สถานที่นัด</th>
          </tr>
        </thead>
        <tbody>
          {people.map((c) => (
            <tr key={c.id} className={TABLE.row}>
              <td className="px-3 py-2.5">
                <div className="font-medium text-slate-800">{c.name}</div>
                <div className="text-sm text-slate-400">{c.company ?? "-"}</div>
                {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                {addrOf(c) && (
                  <div className="mt-0.5 flex max-w-[240px] items-start gap-1 text-xs text-slate-400">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {addrOf(c)}
                  </div>
                )}
              </td>
              <td className="px-3 py-2.5 text-xs text-slate-500">
                {c.trainingGroups.length
                  ? c.trainingGroups.map((g) => (g === 1 ? "พุธ" : "จันทร์")).join(" / ")
                  : "-"}
              </td>
              <td className="px-3 py-2.5">
                <select
                  value={c.finalGroup ?? ""}
                  onChange={(e) => set(c.id, { finalGroup: e.target.value ? Number(e.target.value) : null })}
                  className={`h-9 rounded-lg border px-2 text-sm outline-none focus:border-blue-500 ${c.finalGroup ? "border-slate-300 font-medium" : "border-slate-300 text-slate-400"}`}
                >
                  <option value="">— เลือกกลุ่ม —</option>
                  <option value="1">กลุ่ม 1 (พุธ)</option>
                  <option value="2">กลุ่ม 2 (จันทร์)</option>
                </select>
              </td>
              <td className="px-3 py-2.5">
                <button
                  onClick={() => set(c.id, { iindustryReg: !c.iindustryReg })}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium ${
                    c.iindustryReg ? "bg-green-600 text-white" : "border border-slate-300 text-slate-500"
                  }`}
                >
                  {c.iindustryReg ? <Check className="h-4 w-4" /> : null} {c.iindustryReg ? "ลงแล้ว" : "ยังไม่ลง"}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <input
                  type="date"
                  value={c.consultDate ?? ""}
                  onChange={(e) => set(c.id, { consultDate: e.target.value || null })}
                  className="h-9 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500"
                />
              </td>
              <td className="px-3 py-2.5">
                <select
                  value={c.visitCoach ?? ""}
                  onChange={(e) => set(c.id, { visitCoach: e.target.value || null })}
                  className="h-9 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">— เลือกโค้ช —</option>
                  {COACHES.map((co) => (
                    <option key={co} value={co}>{co}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2.5">
                <input
                  type="text"
                  defaultValue={c.visitLocation ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || null;
                    if (v !== (c.visitLocation ?? null)) set(c.id, { visitLocation: v });
                  }}
                  placeholder={addrOf(c) ? "ว่าง = ใช้ที่อยู่บริษัท" : "ระบุสถานที่นัด"}
                  className="h-9 w-56 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500"
                />
              </td>
            </tr>
          ))}
          {people.length === 0 && (
            <tr><td colSpan={7} className="px-3 py-12 text-center text-slate-400">ยังไม่มีผู้ผ่านรอบ Final — ไปเลือกผู้เข้าร่วมในหน้าสัมภาษณ์ก่อน</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- มุมมองแยกกลุ่ม ---------- */
function GroupsView({ people, addrOf }: { people: CandidateDTO[]; addrOf: (c: CandidateDTO) => string }) {
  const cols: { key: string; title: string; list: CandidateDTO[] }[] = [
    { key: "1", title: TRAINING_GROUPS[1].name, list: people.filter((c) => c.finalGroup === 1) },
    { key: "2", title: TRAINING_GROUPS[2].name, list: people.filter((c) => c.finalGroup === 2) },
    { key: "0", title: "ยังไม่จัดกลุ่ม", list: people.filter((c) => !c.finalGroup) },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cols.map((col) => (
        <div key={col.key} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">{col.title}</h3>
            <span className="text-xs text-slate-400">{col.list.length} กิจการ</span>
          </div>
          <div className="text-xs text-slate-400">{col.key !== "0" ? TRAINING_GROUPS[Number(col.key)].dates : ""}</div>
          <div className="mt-2 space-y-1.5">
            {col.list.map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                <div className="text-sm font-medium text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-500">{c.company ?? "-"}</div>
                <div className="mt-1 flex flex-wrap gap-1 text-xs">
                  {c.consultDate && (
                    <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-violet-700">
                      <CalendarDays className="h-3 w-3" /> {thaiWeekdayShort(c.consultDate)} {thaiDateShort(c.consultDate)}
                    </span>
                  )}
                  {c.visitCoach && <span className={`rounded px-1.5 py-0.5 ${COACH_COLOR[c.visitCoach] ?? "bg-slate-100"}`}>{c.visitCoach}</span>}
                  {c.iindustryReg && <span className="inline-flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5 text-green-700"><Check className="h-3 w-3" /> i-industry</span>}
                </div>
                {(c.visitLocation || addrOf(c)) && (
                  <div className="mt-1 flex items-start gap-1 text-xs text-slate-400">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {c.visitLocation || addrOf(c)}
                  </div>
                )}
              </div>
            ))}
            {col.list.length === 0 && <div className="py-4 text-center text-xs text-slate-300">—</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- มุมมองปฏิทิน visit (calendar grid รายเดือน) ---------- */
function CalendarView({ people, addrOf }: { people: CandidateDTO[]; addrOf: (c: CandidateDTO) => string }) {
  const visits = useMemo(() => people.filter((c) => c.consultDate), [people]);
  const byDate = useMemo(() => {
    const m = new Map<string, CandidateDTO[]>();
    for (const c of visits) {
      if (!m.has(c.consultDate!)) m.set(c.consultDate!, []);
      m.get(c.consultDate!)!.push(c);
    }
    return m;
  }, [visits]);

  // เดือนเริ่มต้น = เดือนของวันนัดแรกสุด (ไม่งั้น มิ.ย. 2026)
  const initial = useMemo(() => {
    const dates = visits.map((c) => c.consultDate!).sort();
    if (dates.length) {
      const [y, mo] = dates[0].split("-").map(Number);
      return y * 12 + (mo - 1);
    }
    return 2026 * 12 + 5;
  }, [visits]);
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
  const noDate = people.filter((c) => !c.consultDate);

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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
                    {(byDate.get(keyOf(d)) ?? []).map((c) => (
                      <div
                        key={c.id}
                        className={`truncate rounded px-1 py-0.5 text-[11px] font-medium ${c.visitCoach ? COACH_COLOR[c.visitCoach] ?? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-600"}`}
                        title={`${c.company ?? c.name}\n${c.visitCoach ?? "ยังไม่ระบุโค้ช"}\n${c.visitLocation || addrOf(c) || ""}`}
                      >
                        {c.visitCoach ? `${c.visitCoach.replace("อ.", "")}· ` : ""}{c.company ?? c.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {noDate.length > 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-3">
          <h3 className="mb-2 text-sm font-bold text-slate-500">ยังไม่ได้นัด visit ({noDate.length})</h3>
          <div className="flex flex-wrap gap-2">
            {noDate.map((c) => (
              <span key={c.id} className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{c.company ?? c.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
