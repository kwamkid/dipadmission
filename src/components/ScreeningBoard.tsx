"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CandidateDTO, SlotDTO, Result } from "@/lib/types";
import { checklistComplete } from "@/lib/types";
import { TARGET_PASS, TOTAL_SLOTS } from "@/lib/slots";
import { setResult, setContactStatus, saveScreening } from "@/app/actions";
import ScreeningPanel from "./ScreeningPanel";

type ResultFilter = "ALL" | "PENDING" | "PASS" | "FAIL";
type StatusFilter = "ALL" | "PENDING" | "CONTACTED" | "UNREACHABLE";

export default function ScreeningBoard({
  candidates,
  slots,
}: {
  candidates: CandidateDTO[];
  slots: SlotDTO[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [onlyReady, setOnlyReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  // optimistic overlay สำหรับ quick actions ในตาราง (ผ่าน/ไม่ผ่าน/ติดต่อ) — กดแล้วเห็นผลทันที
  const [over, setOver] = useState<Record<string, Partial<CandidateDTO>>>({});
  // modal กรอกเหตุผลตอนกด "ไม่ผ่าน" ในตาราง
  const [failModal, setFailModal] = useState<{ id: string; name: string; reason: string } | null>(null);

  // realtime sync — ดึงข้อมูลล่าสุดทุก 5 วิ ให้ทุกเครื่องเห็นตรงกัน
  const liveRef = useRef(live);
  liveRef.current = live;
  useEffect(() => {
    const t = setInterval(() => {
      if (liveRef.current && document.visibilityState === "visible") {
        router.refresh();
      }
    }, 5000);
    return () => clearInterval(t);
  }, [router]);

  // ผสม optimistic overlay เข้ากับข้อมูลจาก server
  const cands = useMemo(
    () => candidates.map((c) => (over[c.id] ? { ...c, ...over[c.id] } : c)),
    [candidates, over]
  );

  const stats = useMemo(() => {
    const passed = cands.filter((c) => c.result === "PASS").length;
    const failed = cands.filter((c) => c.result === "FAIL").length;
    const contacted = cands.filter((c) => c.contactStatus === "CONTACTED").length;
    const booked = slots.filter((s) => s.takenBy).length;
    return { passed, failed, contacted, booked, total: cands.length };
  }, [cands, slots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cands.filter((c) => {
      if (resultFilter !== "ALL" && c.result !== resultFilter) return false;
      if (statusFilter !== "ALL" && c.contactStatus !== statusFilter) return false;
      if (onlyReady && !checklistComplete(c)) return false;
      if (q) {
        const hay = `${c.name} ${c.phone ?? ""} ${c.company ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cands, search, resultFilter, statusFilter, onlyReady]);

  const selectedIndex = filtered.findIndex((c) => c.id === selectedId);
  const selected = selectedIndex >= 0 ? filtered[selectedIndex] : null;

  function refresh() {
    startTransition(() => router.refresh());
  }

  // อัปเดต overlay ร่วม (ใช้โดยแถบข้าง panel → ตารางตามทันที แม้ปิด panel ไปแล้ว)
  function applyOverlay(id: string, data: Partial<CandidateDTO>) {
    setOver((o) => ({ ...o, [id]: { ...o[id], ...data } }));
  }

  // patch overlay ทันที + บันทึกเบื้องหลัง (revert ถ้า server ปฏิเสธ)
  function patch(id: string, data: Partial<CandidateDTO>, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setOver((o) => ({ ...o, [id]: { ...o[id], ...data } }));
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        alert(res.error);
        setOver((o) => {
          const cur = { ...o[id] };
          for (const k of Object.keys(data)) delete cur[k as keyof CandidateDTO];
          return { ...o, [id]: cur };
        });
      }
      router.refresh();
    });
  }

  function quickResult(id: string, r: Result) {
    // ตัดสินผ่าน/ไม่ผ่าน = ติดต่อแล้ว → ตั้งสถานะ "ติดต่อได้" ด้วย
    patch(
      id,
      { result: r, ...(r !== "PENDING" && { contactStatus: "CONTACTED" as const }) },
      () => setResult(id, r)
    );
  }

  // กด "ไม่ผ่าน" ในตาราง → เปิด modal กรอกเหตุผล (กดซ้ำตอนเป็น FAIL = ยกเลิก)
  function quickFail(c: CandidateDTO) {
    if (c.result === "FAIL") {
      quickResult(c.id, "PENDING");
      return;
    }
    setFailModal({ id: c.id, name: c.name, reason: c.failReason ?? "" });
  }

  function confirmFail() {
    if (!failModal) return;
    const { id, reason } = failModal;
    const failReason = reason.trim() || null;
    setFailModal(null);
    patch(id, { result: "FAIL", contactStatus: "CONTACTED", failReason }, async () => {
      const r1 = await setResult(id, "FAIL");
      if (!r1.ok) return r1;
      return saveScreening(id, { failReason });
    });
  }

  function quickUnreachable(c: CandidateDTO) {
    const next = c.contactStatus === "UNREACHABLE" ? "PENDING" : "UNREACHABLE";
    patch(c.id, { contactStatus: next }, () => setContactStatus(c.id, next));
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-4">
          <h1 className="text-xl font-bold">📋 คัดกรองผู้สมัครเข้าโครงการ — รอบที่ 1 (Phone Screening)</h1>
          <p className="mt-0.5 text-sm text-blue-100">
            โทรสัมภาษณ์ทีละคน · ผ่าน checklist แล้วจองช่องสัมภาษณ์ Online 4–5 มิ.ย. · เป้าหมายคัดเหลือ {TARGET_PASS} คน
          </p>
        </div>
      </header>

      {/* Stats */}
      <div className="mx-auto max-w-[1500px] px-5 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="ผู้สมัครทั้งหมด" value={stats.total} tone="slate" />
          <Stat label="โทรติดต่อแล้ว" value={stats.contacted} tone="blue" />
          <Stat label="ผ่าน (เป้า 30)" value={`${stats.passed}/${TARGET_PASS}`} tone="green" />
          <Stat label="ไม่ผ่าน" value={stats.failed} tone="red" />
          <Stat label="จองช่องแล้ว" value={`${stats.booked}/${TOTAL_SLOTS}`} tone="violet" />
          <Stat label="ช่องว่างเหลือ" value={TOTAL_SLOTS - stats.booked} tone="amber" />
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ค้นหา ชื่อ / เบอร์ / บริษัท"
            className="h-9 w-60 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          />
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              ["ALL", "สถานะติดต่อ: ทั้งหมด"],
              ["PENDING", "ยังไม่ได้โทร"],
              ["CONTACTED", "ติดต่อได้"],
              ["UNREACHABLE", "ติดต่อไม่ได้"],
            ]}
          />
          <Select
            value={resultFilter}
            onChange={(v) => setResultFilter(v as ResultFilter)}
            options={[
              ["ALL", "ผลคัด: ทั้งหมด"],
              ["PENDING", "ยังไม่ตัดสิน"],
              ["PASS", "ผ่าน"],
              ["FAIL", "ไม่ผ่าน"],
            ]}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyReady}
              onChange={(e) => setOnlyReady(e.target.checked)}
              className="h-4 w-4 accent-green-600"
            />
            เฉพาะ checklist ครบ
          </label>
          <button
            onClick={() => setLive((v) => !v)}
            className={`ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              live ? "border-green-300 bg-green-50 text-green-700" : "border-slate-300 text-slate-400"
            }`}
            title="ซิงค์ข้อมูลอัตโนมัติทุก 5 วินาที"
          >
            <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-green-500" : "bg-slate-300"}`} />
            {live ? "Live" : "หยุดซิงค์"}
          </button>
          <span className="text-sm text-slate-500">
            แสดง {filtered.length} / {candidates.length} ราย
            {isPending && <span className="ml-2 text-blue-500">· กำลังบันทึก…</span>}
          </span>
        </div>

        {/* Legend สีแถว */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="font-medium text-slate-400">สีแถว:</span>
          <LegendDot cls="bg-amber-50" label="ยังไม่โทร" />
          <LegendDot cls="bg-sky-100/60" label="ติดต่อได้ (ยังไม่ตัดสิน)" />
          <LegendDot cls="bg-slate-200/70" label="ติดต่อไม่ได้" />
          <LegendDot cls="bg-emerald-100/70" label="ผ่าน" />
          <LegendDot cls="bg-rose-100/70" label="ไม่ผ่าน" />
        </div>

        {/* Table */}
        <div className="mt-2 max-h-[calc(100vh-220px)] overflow-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[1100px] text-base">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-sm font-semibold uppercase text-slate-500">
                <th className="px-3 py-2.5">สถานะ</th>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">ชื่อ</th>
                <th className="px-3 py-2.5">โทร</th>
                <th className="px-3 py-2.5">บริษัท</th>
                <th className="px-3 py-2.5">รายได้</th>
                <th className="px-3 py-2.5">ช่องทาง</th>
                <th className="px-3 py-2.5">อายุ</th>
                <th className="px-3 py-2.5">checklist</th>
                <th className="px-3 py-2.5">จองเวลา</th>
                <th className="px-3 py-2.5">ผลคัด</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <Row
                  key={c.id}
                  c={c}
                  onOpen={() => setSelectedId(c.id)}
                  onPass={() => quickResult(c.id, c.result === "PASS" ? "PENDING" : "PASS")}
                  onFail={() => quickFail(c)}
                  onUnreachable={() => quickUnreachable(c)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-3 py-12 text-center text-slate-400">
                    {candidates.length === 0
                      ? "ยังไม่มีข้อมูลผู้สมัคร — วางไฟล์ data/candidates.csv แล้วรัน npm run import"
                      : "ไม่พบรายการตามตัวกรอง"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel */}
      {selected && (
        <ScreeningPanel
          candidate={selected}
          slots={slots}
          position={{ index: selectedIndex, total: filtered.length }}
          onClose={() => setSelectedId(null)}
          onPrev={selectedIndex > 0 ? () => setSelectedId(filtered[selectedIndex - 1].id) : undefined}
          onNext={
            selectedIndex < filtered.length - 1
              ? () => setSelectedId(filtered[selectedIndex + 1].id)
              : undefined
          }
          onChanged={refresh}
          onOptimistic={applyOverlay}
        />
      )}

      {/* modal กรอกเหตุผลไม่ผ่าน */}
      {failModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setFailModal(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-800">✕ ไม่ผ่านการคัดกรอง</h3>
            <p className="mt-1 text-sm text-slate-500">
              {failModal.name} — ระบุเหตุผล (เว้นว่างได้)
            </p>
            <textarea
              autoFocus
              value={failModal.reason}
              onChange={(e) => setFailModal((m) => (m ? { ...m, reason: e.target.value } : m))}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") confirmFail();
                if (e.key === "Escape") setFailModal(null);
              }}
              rows={3}
              placeholder="เช่น ไม่มี notebook / ธุรกิจไม่ตรงเงื่อนไข / ไม่สะดวกเวลาอบรม"
              className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-red-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setFailModal(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmFail}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                ✕ ยืนยันไม่ผ่าน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- ชิ้นส่วนย่อย ---------- */

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "slate" | "blue" | "green" | "red" | "violet" | "amber";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-700",
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    violet: "text-violet-600",
    amber: "text-amber-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-blue-500"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-3 w-4 rounded border border-slate-300 ${cls}`} />
      {label}
    </span>
  );
}

function ChannelBadge({ name, href }: { name: string; href?: string | null }) {
  const colors: Record<string, string> = {
    FB: "bg-blue-100 text-blue-700",
    Facebook: "bg-blue-100 text-blue-700",
    TikTok: "bg-slate-900 text-white",
    Web: "bg-slate-200 text-slate-700",
    LINE: "bg-green-100 text-green-700",
  };
  const cls = `whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${colors[name] ?? "bg-slate-100 text-slate-600"}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:underline`} title={href}>
        {name} ↗
      </a>
    );
  }
  return <span className={cls}>{name}</span>;
}

// จับคู่ชื่อช่องทาง → ลิงก์ของผู้สมัคร (ถ้ามี)
function channelHref(name: string, c: CandidateDTO): string | null {
  const n = name.toLowerCase();
  if (n.includes("facebook") || n === "fb") return c.facebookUrl;
  if (n.includes("web")) return c.website;
  return null;
}

function MiniCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-xs ${
        ok ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"
      }`}
      title={label}
    >
      {ok ? "✓" : "○"} {label}
    </span>
  );
}

function Row({
  c,
  onOpen,
  onPass,
  onFail,
  onUnreachable,
}: {
  c: CandidateDTO;
  onOpen: () => void;
  onPass: () => void;
  onFail: () => void;
  onUnreachable: () => void;
}) {
  // สีทั้งแถวตามสถานะ: ผ่าน=เขียว · ไม่ผ่าน=แดง · ติดต่อไม่ได้=เทา · ติดต่อได้(ยังไม่ตัดสิน)=ฟ้า · ยังไม่โทร=เหลือง
  const rowTone =
    c.result === "PASS"
      ? "bg-emerald-100/70"
      : c.result === "FAIL"
      ? "bg-rose-100/70"
      : c.contactStatus === "UNREACHABLE"
      ? "bg-slate-200/70"
      : c.contactStatus === "CONTACTED"
      ? "bg-sky-100/60"
      : "bg-amber-50";

  return (
    <tr className={`border-b border-slate-100 transition hover:brightness-95 ${rowTone}`}>
      <td className="px-3 py-2.5">
        <button
          onClick={onUnreachable}
          className={`whitespace-nowrap rounded-md border px-2 py-1 text-sm font-medium ${
            c.contactStatus === "UNREACHABLE"
              ? "border-slate-400 bg-slate-200 text-slate-700"
              : c.contactStatus === "CONTACTED"
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-amber-300 bg-amber-50 text-amber-700"
          }`}
          title="คลิกเพื่อสลับ ติดต่อไม่ได้"
        >
          {c.contactStatus === "UNREACHABLE"
            ? "ติดต่อไม่ได้"
            : c.contactStatus === "CONTACTED"
            ? "ติดต่อได้"
            : "ยังไม่โทร"}
        </button>
      </td>
      <td className="px-3 py-2.5 text-slate-500">{c.seq ?? "-"}</td>
      <td className="px-3 py-2.5">
        <button onClick={onOpen} className="text-left font-medium text-blue-700 hover:underline">
          {c.name}
        </button>
        {c.position && <div className="text-sm text-slate-400">{c.position}</div>}
      </td>
      <td className="px-3 py-2.5">
        {c.phone ? (
          <a
            href={`tel:${c.phone}`}
            className="inline-flex items-center gap-1.5 text-base font-normal text-slate-700 hover:text-green-700 hover:underline"
          >
            <span aria-hidden>📞</span>
            {c.phone}
          </a>
        ) : (
          "-"
        )}
      </td>
      <td className="px-3 py-2.5">
        <div className="max-w-[220px] truncate" title={c.company ?? ""}>
          {c.company ?? "-"}
        </div>
        {c.province && <div className="text-sm text-slate-400">{c.province}</div>}
      </td>
      <td className="px-3 py-2.5 text-slate-600">
        <div className="max-w-[110px] leading-tight">{c.income ?? "-"}</div>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col items-start gap-1">
          {c.channels.map((ch) => (
            <ChannelBadge key={ch} name={ch} href={channelHref(ch, c)} />
          ))}
        </div>
      </td>
      <td className="px-3 py-2.5 text-slate-600">{c.age ?? "-"}</td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col items-start gap-1">
          <MiniCheck ok={c.hasNotebook} label="notebook" />
          <MiniCheck ok={c.availableLaunch} label="11มิ.ย." />
          <MiniCheck
            ok={c.trainingGroups.length > 0}
            label={c.trainingGroups.length ? `กลุ่ม${c.trainingGroups.join(",")}` : "กลุ่ม"}
          />
          <MiniCheck ok={c.visitAvailable} label="visit" />
          <MiniCheck ok={c.iindustryReg} label="i-industry" />
        </div>
      </td>
      <td className="px-3 py-2.5">
        {c.interviewSlotLabel ? (
          <span className="inline-block whitespace-pre-line rounded-md bg-violet-50 px-2 py-1 text-xs font-medium leading-tight text-violet-700">
            {c.interviewSlotLabel}
          </span>
        ) : (
          <button onClick={onOpen} className="whitespace-nowrap rounded-md border border-dashed border-slate-300 px-2 py-1 text-sm text-slate-400">
            — ยังไม่นัด —
          </button>
        )}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-nowrap gap-1 whitespace-nowrap">
          <button
            onClick={onPass}
            className={`rounded-md px-2 py-1 text-sm font-medium ${
              c.result === "PASS"
                ? "bg-green-600 text-white"
                : "border border-green-300 text-green-700 hover:bg-green-50"
            }`}
          >
            ✓ ผ่าน
          </button>
          <button
            onClick={onFail}
            title={c.result === "FAIL" && c.failReason ? `เหตุผล: ${c.failReason}` : undefined}
            className={`rounded-md px-2 py-1 text-sm font-medium ${
              c.result === "FAIL"
                ? "bg-red-600 text-white"
                : "border border-red-300 text-red-700 hover:bg-red-50"
            }`}
          >
            ✕ ไม่ผ่าน
            {c.result === "FAIL" && c.failReason ? " 📝" : ""}
          </button>
        </div>
      </td>
    </tr>
  );
}
