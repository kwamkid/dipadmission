// คลาส style กลางของตาราง — ใช้ร่วมทุกหน้าให้หน้าตาเหมือนกัน
export const TABLE = {
  // กล่องครอบตาราง (เลื่อนได้ + header ค้าง)
  wrap: "max-h-[calc(100vh-240px)] overflow-auto rounded-xl border border-slate-200 bg-white",
  table: "w-full text-base",
  thead: "sticky top-0 z-10",
  theadRow:
    "border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
  th: "whitespace-nowrap px-3 py-2.5",
  row: "border-b border-slate-100 transition hover:brightness-[0.97]",
  td: "px-3 py-2.5 align-top",
  // การ์ดบนมือถือ
  card: "rounded-xl border border-slate-200 bg-white p-3",
  cardsWrap: "space-y-2 md:hidden",
  tableWrapDesktop: "hidden md:block",
};
