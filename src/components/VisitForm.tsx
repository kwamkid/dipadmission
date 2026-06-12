"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, Phone, Building2, FileText,
  Lightbulb, AlertTriangle, Target, Globe, Link2, ExternalLink, Save, Video, X,
} from "lucide-react";
import type { VisitItem, VisitReportDTO } from "@/lib/types";
import {
  CHANNEL_STATUS, WEB_COMPONENTS,
  defaultChannelAnalysis, defaultWebComponents,
  type ChannelStatus, type ChannelRow, type WebComponentRow,
} from "@/lib/visit";
import { TRAINING_GROUPS } from "@/lib/slots";
import { phone66, thaiWeekdayShort, thaiDateShort } from "@/lib/format";
import { saveVisitField, setVisitStatus } from "@/app/actions";

// รูปร่าง state ของฟอร์ม (ทุก field ที่แก้ได้ — controlled)
type FormState = {
  capitalRegistered: string;
  yearRegistered: string;
  currentEcommerce: string;
  history: string;
  swotStrength: string;
  swotWeakness: string;
  swotOpportunity: string;
  swotThreat: string;
  channelAnalysis: ChannelRow[];
  problems: string;
  improvements: string;
  approach: string;
  websiteComponents: WebComponentRow[];
  domainWanted: string;
  kpiSalesPerMonth: string;
  kpiCustomers: string;
  kpiMainChannel: string;
  oldWebsiteUrl: string;
};

function initState(r: VisitReportDTO | null): FormState {
  return {
    capitalRegistered: r?.capitalRegistered ?? "",
    yearRegistered: r?.yearRegistered ?? "",
    currentEcommerce: r?.currentEcommerce ?? "",
    history: r?.history ?? "",
    swotStrength: r?.swotStrength ?? "",
    swotWeakness: r?.swotWeakness ?? "",
    swotOpportunity: r?.swotOpportunity ?? "",
    swotThreat: r?.swotThreat ?? "",
    channelAnalysis: r?.channelAnalysis?.length ? r.channelAnalysis : defaultChannelAnalysis(),
    problems: r?.problems ?? "",
    improvements: r?.improvements ?? "",
    approach: r?.approach ?? "",
    websiteComponents: r?.websiteComponents?.length ? r.websiteComponents : defaultWebComponents(),
    domainWanted: r?.domainWanted ?? "",
    kpiSalesPerMonth: r?.kpiSalesPerMonth ?? "",
    kpiCustomers: r?.kpiCustomers ?? "",
    kpiMainChannel: r?.kpiMainChannel ?? "",
    oldWebsiteUrl: r?.oldWebsiteUrl ?? "",
  };
}

// แปลง state → payload ส่ง action (string ว่าง → null)
function toPayload(s: FormState) {
  const t = (v: string) => (v.trim() ? v.trim() : null);
  return {
    capitalRegistered: t(s.capitalRegistered),
    yearRegistered: t(s.yearRegistered),
    currentEcommerce: t(s.currentEcommerce),
    history: t(s.history),
    swotStrength: t(s.swotStrength),
    swotWeakness: t(s.swotWeakness),
    swotOpportunity: t(s.swotOpportunity),
    swotThreat: t(s.swotThreat),
    channelAnalysis: s.channelAnalysis,
    problems: t(s.problems),
    improvements: t(s.improvements),
    approach: t(s.approach),
    websiteComponents: s.websiteComponents,
    domainWanted: t(s.domainWanted),
    kpiSalesPerMonth: t(s.kpiSalesPerMonth),
    kpiCustomers: t(s.kpiCustomers),
    kpiMainChannel: t(s.kpiMainChannel),
    oldWebsiteUrl: t(s.oldWebsiteUrl),
  };
}

export default function VisitForm({ item }: { item: VisitItem }) {
  const router = useRouter();
  const c = item.candidate;
  const lead = item.lead;
  const [form, setForm] = useState<FormState>(() => initState(item.report));
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<VisitReportDTO["status"]>(item.report?.status ?? "DRAFT");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  // helper อัปเดต field + mark dirty
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  // เตือนก่อนปิด tab/ออกจากหน้า ถ้ายังไม่บันทึก
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function handleSave() {
    setSaving(true);
    startTransition(async () => {
      const res = await saveVisitField(c.id, toPayload(form));
      setSaving(false);
      if (!res.ok) {
        alert("บันทึกไม่สำเร็จ: " + res.error);
        return;
      }
      setDirty(false);
      router.refresh();
    });
  }

  function toggleStatus() {
    const next = status === "DONE" ? "DRAFT" : "DONE";
    setStatus(next);
    startTransition(async () => {
      const res = await setVisitStatus(c.id, next);
      if (!res.ok) {
        alert("เปลี่ยนสถานะไม่สำเร็จ: " + res.error);
        setStatus(status);
        return;
      }
      router.refresh();
    });
  }

  const visitDate = c.consultDate ? `${thaiWeekdayShort(c.consultDate)} ${thaiDateShort(c.consultDate)}` : "ยังไม่นัด";

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <a href="/visit" className="inline-flex items-center gap-1 text-sm text-blue-100 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> กลับรายการ
          </a>
          <div className="flex items-center gap-2 text-sm">
            {dirty && <span className="rounded bg-amber-400 px-2 py-0.5 font-medium text-amber-900">ยังไม่บันทึก</span>}
            <span className={`rounded px-2 py-0.5 font-medium ${status === "DONE" ? "bg-green-500 text-white" : "bg-white/20 text-white"}`}>
              {status === "DONE" ? "เสร็จ" : "ร่าง"}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-5">
        {/* ---------- หัว: ข้อมูลพื้นฐานกิจการ (อ่านอย่างเดียว) ---------- */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800">{c.company || c.name}</h1>
              <div className="text-sm text-slate-500">{lead?.contactName || c.name}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {c.phone && (
              <Info label="เบอร์">
                <a href={`tel:${c.phone}`} className="text-slate-700 hover:text-green-700 hover:underline">{phone66(c.phone)}</a>
              </Info>
            )}
            {lead?.email && <Info label="อีเมล"><span className="break-all text-slate-700">{lead.email}</span></Info>}
            <Info label="เลขนิติบุคคล/พาณิชย์"><span className="text-slate-700">{lead?.registrationNo ?? "-"}</span></Info>
            <Info label="ประเภทธุรกิจ"><span className="text-slate-700">{lead?.businessType ?? c.position ?? "-"}</span></Info>
            <Info label="สินค้า/บริการหลัก"><span className="text-slate-700">{lead?.mainProduct ?? "-"}</span></Info>
            <Info label="รายได้/ปี"><span className="text-slate-700">{lead?.revenue ?? c.income ?? "-"}</span></Info>
            <Info label="ระยะเวลาดำเนินธุรกิจ"><span className="text-slate-700">{lead?.yearsOperating ?? "-"}</span></Info>
            <Info label="กลุ่ม / โค้ช / วันนัด">
              <span className="text-slate-700">
                {c.finalGroup ? TRAINING_GROUPS[c.finalGroup]?.name.replace(/\s*\(.*\)/, "") : "-"} · {c.visitCoach ?? "-"} · {visitDate}
              </span>
            </Info>
          </div>
          {lead?.companyAddress && (
            <div className="mt-2 border-t border-slate-200 pt-2 text-sm">
              <div className="text-xs text-slate-400">ที่อยู่บริษัท</div>
              <div className="text-slate-700">{lead.companyAddress}</div>
            </div>
          )}
          {(lead?.facebookUrl || lead?.website) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {lead.facebookUrl && (
                <a href={lead.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <Link2 className="h-3.5 w-3.5" /> Facebook <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {lead.website && (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <Globe className="h-3.5 w-3.5" /> เว็บไซต์ <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* ---------- เตือน: สคริปต์อัด VDO 3 นาที (On-site) ---------- */}
        <VideoScriptReminder company={c.company || c.name} />

        {/* ---------- ส่วนที่ 1 ---------- */}
        <Section icon={<FileText className="h-4 w-4" />} title="ส่วนที่ 1 — ข้อมูลเพิ่มเติม / ประวัติ">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="ทุนจดทะเบียน" value={form.capitalRegistered} onChange={(v) => set("capitalRegistered", v)} />
            <TextField label="ปีที่จดทะเบียนธุรกิจ" value={form.yearRegistered} onChange={(v) => set("yearRegistered", v)} />
          </div>
          <TextField label="ช่องทาง e-Commerce ปัจจุบัน (สรุป)" value={form.currentEcommerce} onChange={(v) => set("currentEcommerce", v)} />
          <TextArea label="1.2 ประวัติความเป็นมา" value={form.history} onChange={(v) => set("history", v)} rows={5} />
        </Section>

        {/* ---------- ส่วนที่ 2 ---------- */}
        <Section icon={<Lightbulb className="h-4 w-4" />} title="ส่วนที่ 2 — วินิจฉัย (SWOT + ช่องทาง)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextArea label="จุดแข็ง (Strength)" value={form.swotStrength} onChange={(v) => set("swotStrength", v)} rows={5} />
            <TextArea label="จุดอ่อน (Weakness)" value={form.swotWeakness} onChange={(v) => set("swotWeakness", v)} rows={5} />
            <TextArea label="โอกาส (Opportunity)" value={form.swotOpportunity} onChange={(v) => set("swotOpportunity", v)} rows={5} />
            <TextArea label="อุปสรรค (Threat)" value={form.swotThreat} onChange={(v) => set("swotThreat", v)} rows={5} />
          </div>
          <div className="mt-3 text-sm font-medium text-slate-600">ตารางวิเคราะห์ช่องทางการตลาด</div>
          <div className="mt-1 space-y-1.5">
            {form.channelAnalysis.map((row, i) => (
              <div key={row.channel} className="grid grid-cols-[110px_1fr] items-start gap-2 rounded-lg border border-slate-200 bg-white p-2">
                <div className="pt-1.5 text-sm font-medium text-slate-700">{row.channel}</div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {CHANNEL_STATUS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => set("channelAnalysis", form.channelAnalysis.map((x, j) => (j === i ? { ...x, status: st as ChannelStatus } : x)))}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          row.status === st
                            ? st === "มี-ใช้ได้ดี" ? "bg-green-600 text-white" : st === "มี-ประสิทธิภาพต่ำ" ? "bg-amber-500 text-white" : "bg-slate-400 text-white"
                            : "border border-slate-300 text-slate-500"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <input
                    value={row.recommend}
                    placeholder="ควรเพิ่ม / ปรับปรุงอย่างไร"
                    onChange={(e) => set("channelAnalysis", form.channelAnalysis.map((x, j) => (j === i ? { ...x, recommend: e.target.value } : x)))}
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------- ส่วนที่ 3 ---------- */}
        <Section icon={<AlertTriangle className="h-4 w-4" />} title="ส่วนที่ 3 — ปัญหา / สิ่งที่อยากพัฒนา">
          <TextArea label="3.1 ปัญหาหลัก" value={form.problems} onChange={(v) => set("problems", v)} rows={4} />
          <TextArea label="3.2 สิ่งที่อยากพัฒนา" value={form.improvements} onChange={(v) => set("improvements", v)} rows={4} />
        </Section>

        {/* ---------- ส่วนที่ 4 (ตัดแผน Manday ออก) ---------- */}
        <Section icon={<Target className="h-4 w-4" />} title="ส่วนที่ 4 — แนวทางพัฒนา">
          <TextArea label="แนวทาง / วิธีการ" value={form.approach} onChange={(v) => set("approach", v)} rows={8} />
        </Section>

        {/* ---------- ส่วนที่ 5 ---------- */}
        <Section icon={<Globe className="h-4 w-4" />} title="ส่วนที่ 5 — เว็บไซต์ที่เหมาะสม">
          <div className="text-sm font-medium text-slate-600">องค์ประกอบเว็บไซต์ที่เหมาะสม</div>
          <div className="mt-1 space-y-1">
            {WEB_COMPONENTS.map((component, i) => {
              const row = form.websiteComponents[i] ?? { component, suitable: false, note: "" };
              return (
                <div key={component} className="rounded-lg border border-slate-200 bg-white p-2">
                  <Toggle
                    label={component}
                    on={row.suitable}
                    onToggle={() => set("websiteComponents", form.websiteComponents.map((x, j) => (j === i ? { ...x, suitable: !x.suitable } : x)))}
                    bare
                  />
                  {row.suitable && (
                    <textarea
                      value={row.note}
                      placeholder="หมายเหตุ"
                      rows={2}
                      onChange={(e) => set("websiteComponents", form.websiteComponents.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3">
            <TextField label="ชื่อโดเมนที่ต้องการ" value={form.domainWanted} onChange={(v) => set("domainWanted", v)} />
          </div>
        </Section>

        {/* ---------- ภาคผนวก: KPI baseline ---------- */}
        <Section icon={<Target className="h-4 w-4" />} title="ภาคผนวก — KPI baseline">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="ยอดขาย/เดือน (baseline)" value={form.kpiSalesPerMonth} onChange={(v) => set("kpiSalesPerMonth", v)} />
            <TextField label="จำนวนลูกค้า (baseline)" value={form.kpiCustomers} onChange={(v) => set("kpiCustomers", v)} />
            <TextField label="ช่องทางหลักปัจจุบัน" value={form.kpiMainChannel} onChange={(v) => set("kpiMainChannel", v)} />
            <TextField label="URL เว็บเดิม (ถ้ามี)" value={form.oldWebsiteUrl} onChange={(v) => set("oldWebsiteUrl", v)} />
          </div>
        </Section>

        {/* mark DONE */}
        <div className="mt-5">
          <button
            type="button"
            onClick={toggleStatus}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold active:scale-[0.99] ${
              status === "DONE" ? "bg-green-600 text-white" : "border border-green-500 text-green-700 hover:bg-green-50"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1">
              <Check className="h-4 w-4" /> {status === "DONE" ? "เก็บข้อมูลครบแล้ว (กดเพื่อกลับเป็นร่าง)" : "ทำเครื่องหมายว่าเก็บข้อมูลครบ"}
            </span>
          </button>
        </div>
      </div>

      {/* ---------- แถบปุ่มบันทึก (sticky ล่าง) ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="text-sm text-slate-500">
            {dirty ? <span className="text-amber-600">มีการแก้ไขที่ยังไม่บันทึก</span> : "บันทึกล่าสุดแล้ว"}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- ชิ้นส่วนย่อย ---------- */

// กล่องเตือน + template สคริปต์อัดวิดีโอ On-site 3 นาที (พับ/กางได้ + ปุ่มคัดลอก)
function VideoScriptReminder({ company }: { company: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const script = `สคริปต์เปิด – อัดวิดีโอการให้คำปรึกษา On-site (อย่างน้อย 3 นาที)
กิจกรรมการเพิ่มประสิทธิภาพเว็บไซต์และระบบจัดการด้วยเทคโนโลยีดิจิทัลและปัญญาประดิษฐ์ — DIPROM ปี 2569

— บทพูดเปิด —

สวัสดีครับ / ค่ะ
วันนี้เป็นวัน.............. ที่.......... เดือน.................. พ.ศ. 2569
ผม / ดิฉัน ..................(ชื่อ–นามสกุล).................. เป็นผู้เชี่ยวชาญจาก กิจกรรมการเพิ่มประสิทธิภาพเว็บไซต์และระบบจัดการด้วยเทคโนโลยีดิจิทัลและปัญญาประดิษฐ์ ซึ่งดำเนินการโดย กรมส่งเสริมอุตสาหกรรม กระทรวงอุตสาหกรรม หรือ DIPROM
วันนี้เป็นการเข้าให้คำปรึกษาแนะนำแก่ ${company} ครั้งที่ .......... ในรูปแบบ On-site

เนื้อหาที่จะให้คำปรึกษาในวันนี้ มีดังนี้
1. ..................................................................
2. ..................................................................
3. ..................................................................

เอาล่ะครับ เรามาเริ่มกันเลย

— หมายเหตุการอัดวิดีโอ —
• On-site: อัดวิดีโออย่างน้อย 3 นาที โดยให้เห็นทั้งผู้เชี่ยวชาญและผู้ประกอบการอยู่ในเฟรม
• ตั้งชื่อไฟล์: [ชื่อกิจการ]_Visit[ครั้งที่]_[วันที่].mp4 เก็บไว้ในโฟลเดอร์ส่งมอบงานของกิจการนั้น`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("คัดลอกไม่สำเร็จ");
    }
  }

  return (
    <>
      <section className="mt-4 overflow-hidden rounded-xl border-2 border-rose-300 bg-rose-50">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
            <Video className="h-5 w-5" /> อย่าลืม! อัดวิดีโอ On-site อย่างน้อย 3 นาที
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md border border-rose-300 bg-white px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            ดูสคริปต์
          </button>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-rose-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-700">
                <Video className="h-5 w-5" /> สคริปต์อัดวิดีโอ On-site (3 นาที)
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-slate-700">
{script}
            </pre>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                {copied ? <><Check className="h-4 w-4" /> คัดลอกแล้ว</> : "คัดลอกสคริปต์"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">{icon} {title}</h3>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">{children}</div>
    </section>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

// controlled text input
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

// controlled textarea
function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

function Toggle({ label, on, onToggle, bare }: { label: string; on: boolean; onToggle: () => void; bare?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-2 text-left text-sm ${
        bare ? "" : "rounded-lg border p-2"
      } ${!bare && on ? "border-blue-400 bg-blue-50" : !bare ? "border-slate-200 hover:border-slate-300" : ""}`}
    >
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent"}`}>
        <Check className="h-3 w-3" />
      </span>
      <span className="text-slate-700">{label}</span>
    </button>
  );
}
