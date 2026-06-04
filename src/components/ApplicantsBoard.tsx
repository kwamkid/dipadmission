"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Search, Phone, ExternalLink, Image as ImageIcon, X, FileSpreadsheet } from "lucide-react";
import type { LeadDTO, LeadStatus } from "@/lib/types";
import { TABLE } from "@/lib/ui";
import TabNav from "./TabNav";
import CopyButton from "./CopyButton";

const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v);

// ทุกช่องของผู้สมัคร (ใช้ทั้ง export และหน้ารายละเอียด)
const FIELDS: { key: keyof LeadDTO; label: string }[] = [
  { key: "submittedAt", label: "ส่งเมื่อ" },
  { key: "prefix", label: "คำนำหน้า" },
  { key: "firstName", label: "ชื่อ" },
  { key: "lastName", label: "นามสกุล" },
  { key: "idCard", label: "เลขบัตรประชาชน" },
  { key: "birthDate", label: "วันเกิด" },
  { key: "phone", label: "เบอร์โทร" },
  { key: "email", label: "อีเมล" },
  { key: "address", label: "ที่อยู่" },
  { key: "company", label: "ชื่อธุรกิจ/บริษัท" },
  { key: "registrationNo", label: "เลขทะเบียนนิติบุคคล" },
  { key: "companyAddress", label: "ที่อยู่บริษัท" },
  { key: "area", label: "เขตพื้นที่/จังหวัด" },
  { key: "businessType", label: "ประเภทธุรกิจ" },
  { key: "mainProduct", label: "สินค้า/บริการหลัก" },
  { key: "businessAbout", label: "ทำธุรกิจเกี่ยวกับ" },
  { key: "channels", label: "ช่องทางจำหน่าย" },
  { key: "position", label: "ตำแหน่ง" },
  { key: "department", label: "แผนก" },
  { key: "revenue", label: "รายได้ต่อปี" },
  { key: "businessSize", label: "ขนาดกิจการ" },
  { key: "yearsOperating", label: "ระยะเวลาดำเนินธุรกิจ" },
  { key: "websiteReason", label: "ทำไมต้องมีเว็บไซต์" },
  { key: "facebookUrl", label: "เพจ Facebook" },
  { key: "website", label: "เว็บไซต์" },
  { key: "consent", label: "การยินยอม" },
  { key: "productImage", label: "ภาพถ่ายผลิตภัณฑ์/บริการ" },
];

const STATUS_META: Record<LeadStatus, { label: string; cls: string }> = {
  applicant: { label: "ผู้สมัคร", cls: "bg-slate-100 text-slate-500" },
  round1: { label: "รอบแรก", cls: "bg-blue-100 text-blue-700" },
  round30: { label: "เข้าสัมภาษณ์ (30)", cls: "bg-violet-100 text-violet-700" },
  winner: { label: "ผู้ชนะ (15)", cls: "bg-green-100 text-green-700" },
};

type StatusFilter = "ALL" | LeadStatus;

export default function ApplicantsBoard({ leads }: { leads: LeadDTO[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [detail, setDetail] = useState<LeadDTO | null>(null);

  // กด Esc ปิด modal รายละเอียด
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDetail(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  const counts = useMemo(() => {
    const c = { round1: 0, round30: 0, winner: 0 };
    for (const l of leads) {
      if (l.status === "winner") c.winner++;
      if (l.status === "winner" || l.status === "round30") c.round30++;
      if (l.status !== "applicant") c.round1++;
    }
    return c;
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (status !== "ALL" && l.status !== status) return false;
      if (q) {
        const hay = `${l.firstName ?? ""} ${l.lastName ?? ""} ${l.company ?? ""} ${l.phone ?? ""} ${l.mainProduct ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, status]);

  const exportText = [
    ["สถานะ", ...FIELDS.map((f) => f.label)].join("\t"),
    ...filtered.map((l) =>
      [STATUS_META[l.status].label, ...FIELDS.map((f) => String(l[f.key] ?? "").replace(/[\t\n]/g, " "))].join("\t")
    ),
  ].join("\n");

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold">
                <Users className="h-6 w-6" /> ผู้สมัครทั้งหมด
              </h1>
              <p className="mt-0.5 text-sm text-blue-100">
                ทั้งหมด {leads.length} ราย · รอบแรก {counts.round1} · เข้าสัมภาษณ์ {counts.round30} · ผู้ชนะ {counts.winner}
              </p>
            </div>
            <CopyButton
              text={exportText}
              icon={<FileSpreadsheet className="h-4 w-4" />}
              label={`คัดลอกทุกช่อง (${filtered.length})`}
              doneMessage={`คัดลอก ${filtered.length} ราย (ทุกช่อง) แล้ว\n(วางใน Sheet/Excel แยกคอลัมน์ได้)`}
            />
          </div>
          <TabNav active="applicants" />
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-4">
        {/* filter */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา ชื่อ / บริษัท / เบอร์ / สินค้า"
              className="h-9 w-64 rounded-lg border border-slate-300 pl-8 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">สถานะ: ทั้งหมด</option>
            <option value="applicant">ผู้สมัคร (ยังไม่เข้ารอบ)</option>
            <option value="round1">รอบแรก</option>
            <option value="round30">เข้าสัมภาษณ์ (30)</option>
            <option value="winner">ผู้ชนะ (15)</option>
          </select>
          <span className="ml-auto text-sm text-slate-500">แสดง {filtered.length} / {leads.length} ราย</span>
        </div>

        {/* ตาราง — จอใหญ่ */}
        <div className={`mt-3 ${TABLE.tableWrapDesktop} ${TABLE.wrap}`}>
          <table className={`min-w-[1100px] ${TABLE.table}`}>
            <thead className={TABLE.thead}>
              <tr className={TABLE.theadRow}>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">สถานะ</th>
                <th className="px-3 py-2.5">ชื่อ-สกุล</th>
                <th className="px-3 py-2.5">บริษัท</th>
                <th className="px-3 py-2.5">ประเภท/สินค้า</th>
                <th className="px-3 py-2.5">ช่องทาง</th>
                <th className="px-3 py-2.5">เบอร์</th>
                <th className="px-3 py-2.5">รายได้/ปี</th>
                <th className="px-3 py-2.5">ภาพ</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-blue-50/40">
                  <td className="px-3 py-2.5 text-slate-400">{l.seq}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={l.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{[l.prefix, l.firstName, l.lastName].filter(Boolean).join(" ")}</div>
                    <div className="text-xs text-slate-400">{l.position ?? ""}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="max-w-[180px] truncate" title={l.company ?? ""}>{l.company ?? "-"}</div>
                    <div className="text-xs text-slate-400">{l.area ?? ""}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-slate-600">{l.businessType ?? "-"}</div>
                    <div className="max-w-[160px] truncate text-xs text-slate-400" title={l.mainProduct ?? ""}>{l.mainProduct ?? ""}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500"><div className="max-w-[140px]">{l.channels ?? "-"}</div></td>
                  <td className="px-3 py-2.5">
                    {l.phone ? (
                      <a href={`tel:${l.phoneNorm ?? l.phone}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:underline">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> {l.phoneNorm ?? l.phone}
                      </a>
                    ) : "-"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500"><div className="max-w-[120px]">{l.revenue ?? "-"}</div></td>
                  <td className="px-3 py-2.5">
                    {isUrl(l.productImage) ? (
                      <a href={l.productImage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <ImageIcon className="h-3.5 w-3.5" /> ดู
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => setDetail(l)} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                      ดูทั้งหมด
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-3 py-12 text-center text-slate-400">ไม่พบรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* การ์ด — มือถือ */}
        <div className="mt-3 space-y-2 md:hidden">
          {filtered.map((l) => (
            <button key={l.id} onClick={() => setDetail(l)} className="block w-full rounded-xl border border-slate-200 bg-white p-3 text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-slate-800">{[l.prefix, l.firstName, l.lastName].filter(Boolean).join(" ")}</div>
                <StatusBadge status={l.status} />
              </div>
              <div className="text-sm text-slate-600">{l.company ?? "-"}</div>
              <div className="text-xs text-slate-400">{[l.area, l.businessType, l.mainProduct].filter(Boolean).join(" · ")}</div>
              {l.phone && (
                <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {l.phoneNorm ?? l.phone}
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && <div className="rounded-xl border border-slate-200 bg-white px-3 py-12 text-center text-slate-400">ไม่พบรายการ</div>}
        </div>
      </div>

      {/* รายละเอียดทุกช่อง */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {[detail.prefix, detail.firstName, detail.lastName].filter(Boolean).join(" ")}
                <span className="ml-2"><StatusBadge status={detail.status} /></span>
              </h3>
              <button onClick={() => setDetail(null)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              {FIELDS.map((f) => {
                const v = detail[f.key];
                if (v == null || v === "") return null;
                return (
                  <div key={String(f.key)} className="grid grid-cols-[160px_1fr] gap-2 border-b border-slate-100 pb-2 text-sm">
                    <div className="text-slate-400">{f.label}</div>
                    <div className="text-slate-700">
                      {isUrl(v) ? (
                        <a href={String(v)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-blue-600 hover:underline">
                          {String(v)} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="whitespace-pre-wrap">{String(v)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const m = STATUS_META[status];
  return <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}
