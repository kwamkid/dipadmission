import { getInterviewQueue } from "@/lib/data";
import { INTERVIEW_DAYS, TOTAL_SLOTS } from "@/lib/slots";
import { thaiWeekdayShort, thaiDateShort } from "@/lib/format";
import TabNav from "@/components/TabNav";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const slots = await getInterviewQueue();
  const booked = slots.filter((s) => s.candidate).length;

  // ข้อความสำหรับคัดลอก (เฉพาะช่องที่จองแล้ว) — คั่นด้วย tab วาง Sheet/Excel ได้
  const copyText = [
    ["คิว", "วัน", "เวลา", "ชื่อ", "กิจการ", "เบอร์"].join("\t"),
    ...slots
      .filter((s) => s.candidate)
      .map((s) =>
        [
          s.label.replace("บ.#", "คิวที่ "),
          `${thaiWeekdayShort(s.day)} ${thaiDateShort(s.day)}`,
          `${s.startTime}-${s.endTime}`,
          s.candidate!.name,
          s.candidate!.company ?? "",
          s.candidate!.phone ?? "",
        ].join("\t")
      ),
  ].join("\n");

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="mx-auto max-w-[1100px] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">🗓️ สรุปคิวสัมภาษณ์ Online (4–5 มิ.ย.)</h1>
              <p className="mt-0.5 text-sm text-blue-100">
                จองแล้ว {booked}/{TOTAL_SLOTS} ช่อง · ว่างเหลือ {TOTAL_SLOTS - booked} ช่อง
              </p>
            </div>
            <CopyButton
              text={copyText}
              label={`📋 คัดลอกตารางคิว (${booked})`}
              doneMessage={`คัดลอกตารางคิว ${booked} คิวแล้ว ✓\n(วางใน Google Sheet / Excel ได้เลย)`}
            />
          </div>
          <TabNav active="queue" />
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] space-y-6 px-5 py-5">
        {INTERVIEW_DAYS.map((d) => {
          const daySlots = slots.filter((s) => s.day === d.date);
          const dayBooked = daySlots.filter((s) => s.candidate).length;
          return (
            <section key={d.date}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-800">{d.labelTH}</h2>
                <span className="text-sm text-slate-500">
                  จอง {dayBooked}/{daySlots.length} ช่อง
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {daySlots.map((s) => {
                  const c = s.candidate;
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0 ${
                        c ? "" : "bg-slate-50/50"
                      }`}
                    >
                      <span className="w-20 shrink-0 text-sm font-semibold text-violet-700">
                        {s.label.replace("บ.#", "คิวที่ ")}
                      </span>
                      <span className="w-28 shrink-0 text-sm text-slate-500">
                        {s.startTime}-{s.endTime}
                      </span>
                      {c ? (
                        <>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-slate-800">{c.name}</div>
                            <div className="truncate text-xs text-slate-500">
                              {[c.company, c.province].filter(Boolean).join(" · ") || "-"}
                            </div>
                          </div>
                          {c.phone && (
                            <a
                              href={`tel:${c.phone}`}
                              className="shrink-0 text-sm text-slate-600 hover:text-green-700 hover:underline"
                            >
                              📞 {c.phone}
                            </a>
                          )}
                          {c.result === "PASS" && (
                            <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              ผ่าน
                            </span>
                          )}
                          {c.result === "FAIL" && (
                            <span className="shrink-0 rounded bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                              ไม่ผ่าน
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="flex-1 text-sm text-slate-300">— ว่าง —</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
