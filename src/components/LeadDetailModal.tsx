"use client";

import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import type { LeadDTO, LeadStatus } from "@/lib/types";

export const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v);

// ทุกช่องของผู้สมัคร (ใช้ทั้ง export และหน้ารายละเอียด)
export const LEAD_FIELDS: { key: keyof LeadDTO; label: string }[] = [
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

export const statusLabel = (s: LeadStatus): string => STATUS_META[s].label;

export function StatusBadge({ status }: { status: LeadStatus }) {
  const m = STATUS_META[status];
  return <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>;
}

/** Modal แสดงข้อมูลผู้สมัครทุกช่อง — กดพื้นหลังหรือ Esc เพื่อปิด */
export default function LeadDetailModal({ lead, onClose }: { lead: LeadDTO; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {[lead.prefix, lead.firstName, lead.lastName].filter(Boolean).join(" ")}
            <span className="ml-2"><StatusBadge status={lead.status} /></span>
          </h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {LEAD_FIELDS.map((f) => {
            const v = lead[f.key];
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
  );
}
