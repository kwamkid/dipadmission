"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ChevronLeft, ChevronRight, X, Check, Phone, Building2, FileText,
  Lightbulb, AlertTriangle, Target, Globe, ClipboardList, Image as ImageIcon, Link2, ExternalLink,
} from "lucide-react";
import type { VisitItem, VisitReportDTO } from "@/lib/types";
import {
  CHANNEL_STATUS, WEB_COMPONENTS, MANDAY_ACTIVITIES, ASSET_KEYS,
  defaultChannelAnalysis, defaultMandayPlan, defaultWebComponents,
  type ChannelStatus, type AssetKey,
} from "@/lib/visit";
import { TRAINING_GROUPS } from "@/lib/slots";
import { phone66, thaiWeekdayShort, thaiDateShort } from "@/lib/format";
import { saveVisitField, setVisitStatus } from "@/app/actions";
import type { VisitReportInput } from "@/app/actions";

// ค่า report ที่มี default ครบ (กัน null ตอน record ยังไม่มี)
function withDefaults(r: VisitReportDTO | null): VisitReportDTO {
  return {
    capitalRegistered: r?.capitalRegistered ?? null,
    yearRegistered: r?.yearRegistered ?? null,
    currentEcommerce: r?.currentEcommerce ?? null,
    history: r?.history ?? null,
    swotStrength: r?.swotStrength ?? null,
    swotWeakness: r?.swotWeakness ?? null,
    swotOpportunity: r?.swotOpportunity ?? null,
    swotThreat: r?.swotThreat ?? null,
    channelAnalysis: r?.channelAnalysis?.length ? r.channelAnalysis : defaultChannelAnalysis(),
    problems: r?.problems ?? null,
    improvements: r?.improvements ?? null,
    approach: r?.approach ?? null,
    mandayPlan: r?.mandayPlan?.length ? r.mandayPlan : defaultMandayPlan(),
    websiteComponents: r?.websiteComponents?.length ? r.websiteComponents : defaultWebComponents(),
    domainWanted: r?.domainWanted ?? null,
    assets: r?.assets ?? {},
    mouSigned: r?.mouSigned ?? false,
    consentSigned: r?.consentSigned ?? false,
    mandaySigned: r?.mandaySigned ?? false,
    kpiSalesPerMonth: r?.kpiSalesPerMonth ?? null,
    kpiCustomers: r?.kpiCustomers ?? null,
    kpiMainChannel: r?.kpiMainChannel ?? null,
    oldWebsiteUrl: r?.oldWebsiteUrl ?? null,
    photos: r?.photos ?? [],
    videoUrl: r?.videoUrl ?? null,
    status: r?.status ?? "DRAFT",
  };
}

export default function VisitPanel({
  item,
  position,
  onClose,
  onPrev,
  onNext,
  onChanged,
  onOptimistic,
}: {
  item: VisitItem;
  position: { index: number; total: number };
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onChanged: () => void;
  onOptimistic: (id: string, data: Partial<VisitReportDTO>) => void;
}) {
  const c = item.candidate;
  const lead = item.lead;
  const r = withDefaults(item.report);
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  // บันทึก field (optimistic + auto-save)
  function save(data: VisitReportInput) {
    onOptimistic(c.id, data as Partial<VisitReportDTO>);
    setSaving(true);
    startTransition(async () => {
      const res = await saveVisitField(c.id, data);
      setSaving(false);
      if (!res.ok) alert(res.error);
      onChanged();
    });
  }

  function toggleStatus() {
    const next = r.status === "DONE" ? "DRAFT" : "DONE";
    onOptimistic(c.id, { status: next });
    startTransition(async () => {
      const res = await setVisitStatus(c.id, next);
      if (!res.ok) alert(res.error);
      onChanged();
    });
  }

  const visitDate = c.consultDate ? `${thaiWeekdayShort(c.consultDate)} ${thaiDateShort(c.consultDate)}` : "ยังไม่นัด";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>เก็บข้อมูลทีละกิจการ</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
              {position.index + 1} / {position.total}
            </span>
            {saving && <span className="text-blue-500">· กำลังบันทึก…</span>}
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
          {/* ---------- หัว: ข้อมูลพื้นฐานกิจการ (อ่านอย่างเดียว) ---------- */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-800">{c.company || c.name}</h2>
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

          {/* ---------- ส่วนที่ 1: ข้อมูลเพิ่มเติม + ประวัติ ---------- */}
          <Section icon={<FileText className="h-4 w-4" />} title="ส่วนที่ 1 — ข้อมูลเพิ่มเติม / ประวัติ">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="ทุนจดทะเบียน" value={r.capitalRegistered} onSave={(v) => save({ capitalRegistered: v })} />
              <TextField label="ปีที่จดทะเบียนธุรกิจ" value={r.yearRegistered} onSave={(v) => save({ yearRegistered: v })} />
            </div>
            <TextField label="ช่องทาง e-Commerce ปัจจุบัน (สรุป)" value={r.currentEcommerce} onSave={(v) => save({ currentEcommerce: v })} />
            <TextArea label="1.2 ประวัติความเป็นมา" value={r.history} onSave={(v) => save({ history: v })} rows={4} />
          </Section>

          {/* ---------- ส่วนที่ 2: SWOT + ช่องทางการตลาด ---------- */}
          <Section icon={<Lightbulb className="h-4 w-4" />} title="ส่วนที่ 2 — วินิจฉัย (SWOT + ช่องทาง)">
            <div className="grid grid-cols-2 gap-3">
              <TextArea label="จุดแข็ง (Strength)" value={r.swotStrength} onSave={(v) => save({ swotStrength: v })} rows={3} />
              <TextArea label="จุดอ่อน (Weakness)" value={r.swotWeakness} onSave={(v) => save({ swotWeakness: v })} rows={3} />
              <TextArea label="โอกาส (Opportunity)" value={r.swotOpportunity} onSave={(v) => save({ swotOpportunity: v })} rows={3} />
              <TextArea label="อุปสรรค (Threat)" value={r.swotThreat} onSave={(v) => save({ swotThreat: v })} rows={3} />
            </div>
            <div className="mt-3 text-sm font-medium text-slate-600">ตารางวิเคราะห์ช่องทางการตลาด</div>
            <div className="mt-1 space-y-1.5">
              {r.channelAnalysis.map((row, i) => (
                <div key={row.channel} className="grid grid-cols-[110px_1fr] items-start gap-2 rounded-lg border border-slate-200 p-2">
                  <div className="pt-1.5 text-sm font-medium text-slate-700">{row.channel}</div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      {CHANNEL_STATUS.map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            const next = r.channelAnalysis.map((x, j) => (j === i ? { ...x, status: st as ChannelStatus } : x));
                            save({ channelAnalysis: next });
                          }}
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
                      defaultValue={row.recommend}
                      placeholder="ควรเพิ่ม / ปรับปรุงอย่างไร"
                      onBlur={(e) => {
                        if (e.target.value !== row.recommend) {
                          const next = r.channelAnalysis.map((x, j) => (j === i ? { ...x, recommend: e.target.value } : x));
                          save({ channelAnalysis: next });
                        }
                      }}
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ---------- ส่วนที่ 3: ปัญหา ---------- */}
          <Section icon={<AlertTriangle className="h-4 w-4" />} title="ส่วนที่ 3 — ปัญหา / สิ่งที่อยากพัฒนา">
            <TextArea label="3.1 ปัญหาหลัก" value={r.problems} onSave={(v) => save({ problems: v })} rows={3} />
            <TextArea label="3.2 สิ่งที่อยากพัฒนา" value={r.improvements} onSave={(v) => save({ improvements: v })} rows={3} />
          </Section>

          {/* ---------- ส่วนที่ 4: แนวทาง + แผน Manday ---------- */}
          <Section icon={<Target className="h-4 w-4" />} title="ส่วนที่ 4 — แนวทางพัฒนา + แผน 6 Manday">
            <TextArea label="4.1 แนวทาง / วิธีการ" value={r.approach} onSave={(v) => save({ approach: v })} rows={3} />
            <div className="mt-2 text-sm font-medium text-slate-600">4.2 แผนกิจกรรม (ติ๊กที่จะทำ)</div>
            <div className="mt-1 space-y-1">
              {MANDAY_ACTIVITIES.map((activity, i) => {
                const row = r.mandayPlan[i] ?? { activity, planned: false };
                return (
                  <Toggle
                    key={activity}
                    label={`${i + 1}. ${activity}`}
                    on={row.planned}
                    onToggle={() => {
                      const next = MANDAY_ACTIVITIES.map((a, j) => ({
                        activity: a,
                        planned: j === i ? !row.planned : r.mandayPlan[j]?.planned ?? false,
                      }));
                      save({ mandayPlan: next });
                    }}
                  />
                );
              })}
            </div>
          </Section>

          {/* ---------- ส่วนที่ 5: เว็บไซต์ที่เหมาะสม ---------- */}
          <Section icon={<Globe className="h-4 w-4" />} title="ส่วนที่ 5 — เว็บไซต์ที่เหมาะสม">
            <div className="text-sm font-medium text-slate-600">องค์ประกอบเว็บไซต์ที่เหมาะสม</div>
            <div className="mt-1 space-y-1">
              {WEB_COMPONENTS.map((component, i) => {
                const row = r.websiteComponents[i] ?? { component, suitable: false, note: "" };
                return (
                  <div key={component} className="rounded-lg border border-slate-200 p-2">
                    <Toggle
                      label={component}
                      on={row.suitable}
                      onToggle={() => {
                        const next = WEB_COMPONENTS.map((comp, j) => ({
                          component: comp,
                          suitable: j === i ? !row.suitable : r.websiteComponents[j]?.suitable ?? false,
                          note: r.websiteComponents[j]?.note ?? "",
                        }));
                        save({ websiteComponents: next });
                      }}
                      bare
                    />
                    {row.suitable && (
                      <input
                        defaultValue={row.note}
                        placeholder="หมายเหตุ"
                        onBlur={(e) => {
                          if (e.target.value !== row.note) {
                            const next = r.websiteComponents.map((x, j) => (j === i ? { ...x, note: e.target.value } : x));
                            save({ websiteComponents: next });
                          }
                        }}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <TextField label="ชื่อโดเมนที่ต้องการ" value={r.domainWanted} onSave={(v) => save({ domainWanted: v })} />
            </div>
            <div className="mt-3 text-sm font-medium text-slate-600">Asset ที่ต้องขอจากกิจการ</div>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {(Object.keys(ASSET_KEYS) as AssetKey[]).map((key) => (
                <Toggle
                  key={key}
                  label={ASSET_KEYS[key]}
                  on={!!r.assets[key]}
                  onToggle={() => save({ assets: { ...r.assets, [key]: !r.assets[key] } })}
                />
              ))}
            </div>
          </Section>

          {/* ---------- รูป/วิดีโอ (checklist เตือน) ---------- */}
          <Section icon={<ImageIcon className="h-4 w-4" />} title="รูป / วิดีโอ (เตือน — เก็บไฟล์นอกระบบ)">
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ถ่าย/รวบรวมไฟล์เก็บไว้ในเครื่องเอง — ช่องนี้ใส่ชื่อโฟลเดอร์/ลิงก์ไว้กันลืมได้
            </div>
            <TextArea
              label="รายการภาพ (สินค้า/บริการ/ร้าน/ทีม) — ชื่อไฟล์หรือลิงก์ บรรทัดละ 1 รายการ"
              value={r.photos.join("\n")}
              onSave={(v) => save({ photos: v ? v.split("\n").map((s) => s.trim()).filter(Boolean) : [] })}
              rows={3}
            />
            <TextField label="ลิงก์วิดีโอ" value={r.videoUrl} onSave={(v) => save({ videoUrl: v })} />
          </Section>

          {/* ---------- ภาคผนวก: MOU + KPI ---------- */}
          <Section icon={<ClipboardList className="h-4 w-4" />} title="ภาคผนวก — เอกสาร / KPI baseline">
            <div className="grid grid-cols-1 gap-1">
              <Toggle label="เซ็น MOU แล้ว" on={r.mouSigned} onToggle={() => save({ mouSigned: !r.mouSigned })} />
              <Toggle label="เซ็นหนังสือยินยอม (Consent) แล้ว" on={r.consentSigned} onToggle={() => save({ consentSigned: !r.consentSigned })} />
              <Toggle label="เซ็นใบรับรอง Manday แล้ว" on={r.mandaySigned} onToggle={() => save({ mandaySigned: !r.mandaySigned })} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <TextField label="ยอดขาย/เดือน (baseline)" value={r.kpiSalesPerMonth} onSave={(v) => save({ kpiSalesPerMonth: v })} />
              <TextField label="จำนวนลูกค้า (baseline)" value={r.kpiCustomers} onSave={(v) => save({ kpiCustomers: v })} />
              <TextField label="ช่องทางหลักปัจจุบัน" value={r.kpiMainChannel} onSave={(v) => save({ kpiMainChannel: v })} />
              <TextField label="URL เว็บเดิม (ถ้ามี)" value={r.oldWebsiteUrl} onSave={(v) => save({ oldWebsiteUrl: v })} />
            </div>
          </Section>
        </div>

        {/* footer: mark DONE */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            onClick={toggleStatus}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold active:scale-[0.99] ${
              r.status === "DONE" ? "bg-green-600 text-white" : "border border-green-500 text-green-700 hover:bg-green-50"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-1">
              <Check className="h-4 w-4" /> {r.status === "DONE" ? "เก็บข้อมูลครบแล้ว (กดเพื่อกลับเป็นร่าง)" : "ทำเครื่องหมายว่าเก็บข้อมูลครบ"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ---------- ชิ้นส่วนย่อย ---------- */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-700">{icon} {title}</h3>
      <div className="space-y-3 rounded-xl border border-slate-200 p-3">{children}</div>
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

// input text แบบ uncontrolled — บันทึกตอน blur (เทียบกับค่าเดิม)
function TextField({ label, value, onSave }: { label: string; value: string | null; onSave: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = value ?? "";
  }, [value]);
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <input
        ref={ref}
        defaultValue={value ?? ""}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== (value ?? "")) onSave(v || null);
        }}
        className="mt-0.5 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

// textarea แบบ uncontrolled — บันทึกตอน blur
function TextArea({ label, value, onSave, rows = 3 }: { label: string; value: string | null; onSave: (v: string | null) => void; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = value ?? "";
  }, [value]);
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <textarea
        ref={ref}
        defaultValue={value ?? ""}
        rows={rows}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v !== (value ?? "")) onSave(v || null);
        }}
        className="mt-0.5 w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-blue-500"
      />
    </label>
  );
}

function Toggle({ label, on, onToggle, bare }: { label: string; on: boolean; onToggle: () => void; bare?: boolean }) {
  return (
    <button
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
