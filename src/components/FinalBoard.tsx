"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users, CalendarDays, Check, MapPin, FileSpreadsheet } from "lucide-react";
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

export default function FinalBoard({ winners }: { winners: CandidateDTO[] }) {
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
    const visit = people.filter((c) => c.consultDate).length;
    const ind = people.filter((c) => c.iindustryReg).length;
    return { g1, g2, visit, ind };
  }, [people]);

  const copyText = [
    ["ชื่อ", "กิจการ", "เบอร์", "กลุ่มเรียน", "i-industry", "วัน visit", "โค้ช"].join("\t"),
    ...people.map((c) =>
      [
        c.name,
        c.company ?? "",
        c.phone ?? "",
        c.finalGroup ? TRAINING_GROUPS[c.finalGroup].name : "",
        c.iindustryReg ? "ลงแล้ว" : "ยัง",
        c.consultDate ? `${thaiWeekdayShort(c.consultDate)} ${thaiDateShort(c.consultDate)}` : "",
        c.visitCoach ?? "",
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
        {/* สลับมุมมอง */}
        <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-white p-1">
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

        {view === "table" && <EditTable people={people} set={set} />}
        {view === "groups" && <GroupsView people={people} />}
        {view === "calendar" && <CalendarView people={people} />}
      </div>
    </div>
  );
}

/* ---------- มุมมองตารางจัดกลุ่ม/นัด ---------- */
function EditTable({ people, set }: { people: CandidateDTO[]; set: (id: string, d: Partial<CandidateDTO>) => void }) {
  return (
    <div className={`${TABLE.wrap}`}>
      <table className={`min-w-[1000px] ${TABLE.table}`}>
        <thead className={TABLE.thead}>
          <tr className={TABLE.theadRow}>
            <th className="px-3 py-2.5">ชื่อ / กิจการ</th>
            <th className="px-3 py-2.5">สะดวกกลุ่ม</th>
            <th className="px-3 py-2.5">กลุ่มเรียนจริง</th>
            <th className="px-3 py-2.5">i-industry</th>
            <th className="px-3 py-2.5">วันนัด 1st visit</th>
            <th className="px-3 py-2.5">โค้ชที่ไป</th>
          </tr>
        </thead>
        <tbody>
          {people.map((c) => (
            <tr key={c.id} className={TABLE.row}>
              <td className="px-3 py-2.5">
                <div className="font-medium text-slate-800">{c.name}</div>
                <div className="text-sm text-slate-400">{c.company ?? "-"}</div>
                {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
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
            </tr>
          ))}
          {people.length === 0 && (
            <tr><td colSpan={6} className="px-3 py-12 text-center text-slate-400">ยังไม่มีผู้ผ่านรอบ Final — ไปเลือกผู้เข้าร่วมในหน้าสัมภาษณ์ก่อน</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- มุมมองแยกกลุ่ม ---------- */
function GroupsView({ people }: { people: CandidateDTO[] }) {
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
              </div>
            ))}
            {col.list.length === 0 && <div className="py-4 text-center text-xs text-slate-300">—</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- มุมมองปฏิทิน visit (จัดตามวัน) ---------- */
function CalendarView({ people }: { people: CandidateDTO[] }) {
  const byDate = useMemo(() => {
    const m = new Map<string, CandidateDTO[]>();
    for (const c of people) if (c.consultDate) {
      if (!m.has(c.consultDate)) m.set(c.consultDate, []);
      m.get(c.consultDate)!.push(c);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [people]);
  const noDate = people.filter((c) => !c.consultDate);

  return (
    <div className="space-y-3">
      {byDate.map(([date, list]) => (
        <div key={date} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-violet-600" />
            <h3 className="font-bold text-slate-800">{thaiWeekdayShort(date)} {thaiDateShort(date)}</h3>
            <span className="text-xs text-slate-400">· {list.length} กิจการ</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <div key={c.id} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800">{c.company ?? c.name}</div>
                  <div className="truncate text-xs text-slate-500">{c.name}{c.phone ? ` · ${c.phone}` : ""}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs">
                    {c.visitCoach ? (
                      <span className={`rounded px-1.5 py-0.5 font-medium ${COACH_COLOR[c.visitCoach] ?? "bg-slate-100"}`}>{c.visitCoach}</span>
                    ) : (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">ยังไม่ระบุโค้ช</span>
                    )}
                    {c.finalGroup && <span className={`rounded px-1.5 py-0.5 ${GROUP_COLOR[c.finalGroup]}`}>{c.finalGroup === 1 ? "พุธ" : "จันทร์"}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {byDate.length === 0 && <div className="rounded-xl border border-slate-200 bg-white px-3 py-12 text-center text-slate-400">ยังไม่มีการนัด visit</div>}
      {noDate.length > 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
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
