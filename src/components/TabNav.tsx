import Link from "next/link";

const TABS = [
  { href: "/applicants", label: "👥 ผู้สมัครทั้งหมด", key: "applicants" },
  { href: "/screening", label: "📋 คัดกรอง", key: "screening" },
  { href: "/queue", label: "🗓️ คิวสัมภาษณ์", key: "queue" },
  { href: "/interview", label: "🎤 สัมภาษณ์", key: "interview" },
];

/** เมนูแท็บสลับหน้า — วางในส่วน header (พื้นน้ำเงิน ตัวอักษรขาว) */
export default function TabNav({ active }: { active: string }) {
  return (
    <nav className="mt-3 flex gap-1">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            active === t.key
              ? "bg-white text-blue-700 shadow-sm"
              : "bg-white/15 text-white hover:bg-white/25"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
