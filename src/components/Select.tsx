"use client";

import { ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };

/**
 * combobox กลางของแอป — ใช้ทุกหน้าให้หน้าตา/พฤติกรรมเหมือนกัน
 * - options รับได้ทั้ง { value, label } หรือ tuple [value, label]
 * - placeholder = ตัวเลือกแรกค่าว่าง "" (เช่น "— เลือกกลุ่ม —")
 * - full = กว้างเต็ม container (ใช้ในการ์ดมือถือ)
 * - muteEmpty = ทำตัวอักษรจางเมื่อยังไม่ได้เลือก (value ว่าง)
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder,
  full,
  muteEmpty,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[] | readonly (readonly [string, string])[];
  placeholder?: string;
  full?: boolean;
  muteEmpty?: boolean;
  className?: string;
}) {
  const opts: SelectOption[] = options.map((o) =>
    Array.isArray(o) ? { value: o[0], label: o[1] } : (o as SelectOption)
  );
  const muted = muteEmpty && !value;
  return (
    <div className={`relative ${full ? "w-full" : "inline-block"}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 appearance-none rounded-lg border border-slate-300 bg-white pl-2.5 pr-8 text-sm outline-none focus:border-blue-500 ${
          full ? "w-full" : ""
        } ${muted ? "text-slate-400" : "font-medium text-slate-700"} ${className}`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
