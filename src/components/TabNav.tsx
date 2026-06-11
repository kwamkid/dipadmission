import Link from "next/link";
import { Users, ClipboardList, CalendarDays, Mic, Trophy, Building2 } from "lucide-react";

const TABS = [
  { href: "/applicants", label: "ผู้สมัครทั้งหมด", key: "applicants", Icon: Users },
  { href: "/screening", label: "คัดกรอง", key: "screening", Icon: ClipboardList },
  { href: "/queue", label: "คิวสัมภาษณ์", key: "queue", Icon: CalendarDays },
  { href: "/interview", label: "สัมภาษณ์", key: "interview", Icon: Mic },
  { href: "/final", label: "ผู้เข้าร่วม", key: "final", Icon: Trophy },
  { href: "/visit", label: "เก็บข้อมูลกิจการ", key: "visit", Icon: Building2 },
];

/** เมนูแท็บสลับหน้า — วางในส่วน header (พื้นน้ำเงิน ตัวอักษรขาว) */
export default function TabNav({ active }: { active: string }) {
  return (
    <nav className="mt-3 flex flex-wrap gap-1">
      {TABS.map(({ href, label, key, Icon }) => (
        <Link
          key={key}
          href={href}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            active === key
              ? "bg-white text-blue-700 shadow-sm"
              : "bg-white/15 text-white hover:bg-white/25"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
