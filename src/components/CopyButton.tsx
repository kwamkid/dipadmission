"use client";

import type { ReactNode } from "react";

export default function CopyButton({
  text,
  label,
  icon,
  doneMessage,
}: {
  text: string;
  label: string;
  icon?: ReactNode;
  doneMessage?: string;
}) {
  function copy() {
    if (!text.trim()) {
      alert("ยังไม่มีข้อมูลให้คัดลอก");
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => alert(doneMessage ?? "คัดลอกแล้ว (วางใน Google Sheet / Excel ได้เลย)"))
      .catch(() => alert("คัดลอกไม่สำเร็จ — ลองใหม่อีกครั้ง"));
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50"
    >
      {icon}
      {label}
    </button>
  );
}
