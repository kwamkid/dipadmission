// ค่าคงที่สำหรับฟอร์มวินิจฉัยรายกิจการ (1st visit / consult)
// ใช้ seed ค่าเริ่มต้นของ JSON fields + เรนเดอร์ตาราง/checklist ในฟอร์ม

// ช่องทางการตลาดที่ต้องวิเคราะห์ (ส่วน 2.2)
export const CHANNELS = [
  "Website", "Facebook", "Instagram", "Line OA", "TikTok", "YouTube",
  "Shopee", "Lazada", "Grab / LineMan", "Foodpanda / Robinhood",
] as const;

// สถานะแต่ละช่องทาง
export const CHANNEL_STATUS = ["ไม่มี", "มี-ประสิทธิภาพต่ำ", "มี-ใช้ได้ดี"] as const;
export type ChannelStatus = (typeof CHANNEL_STATUS)[number];

// องค์ประกอบเว็บไซต์ (ส่วน 5)
export const WEB_COMPONENTS = [
  "ข้อมูลแบรนด์/ประวัติธุรกิจ", "ข้อมูลสินค้า-บริการ + จุดเด่น", "ข่าวสาร/กิจกรรม",
  "บทความ (Article) ทำ SEO", "ระบบจัดการคำสั่งซื้อ", "ระบบจัดการสต็อก", "ระบบตะกร้าสินค้า",
  "ระบบตัวกรองสินค้า", "ระบบรีวิวสินค้า", "ระบบคูปองส่วนลด", "ช่องทางการติดต่อ",
  "เชื่อมต่อแพลตฟอร์มสั่งอาหาร/ขนส่ง", "ปุ่ม Call to Action",
] as const;

// แผน 6 Manday (ส่วน 4.2) — 8 กิจกรรม
export const MANDAY_ACTIVITIES = [
  "เก็บข้อมูลวินิจฉัยและวิเคราะห์ปัญหา", "วางแผนและออกแบบโครงสร้างเว็บไซต์",
  "วิเคราะห์รูปแบบเว็บไซต์ (Theme)", "ติดตั้ง/ทดสอบ/ใช้งานเครื่องมือเว็บไซต์",
  "ถ่ายทอดความรู้การใช้งาน + อัปเดตข้อมูล", "ถ่ายทอดหลักการตลาดผ่านเว็บไซต์",
  "ให้คำปรึกษา ปรับปรุง ดูแลบำรุงรักษา", "สรุปผลการดำเนินงาน",
] as const;

// asset ที่ต้องขอจากกิจการ (ส่วน 5) — key → label
export const ASSET_KEYS = {
  logo: "โลโก้ (ไฟล์ความละเอียดสูง)",
  productImages: "รูปสินค้า/บริการ",
  brandText: "ข้อความแนะนำธุรกิจ/สินค้า",
  domain: "ชื่อโดเมนที่ต้องการ",
  oldUrl: "URL เว็บเดิม",
  theme: "สี/ธีมที่ชอบ",
  social: "เพจ FB/IG ที่มี",
  contact: "ข้อมูลติดต่อที่จะแสดงบนเว็บ",
} as const;

export type AssetKey = keyof typeof ASSET_KEYS;

// ---------- รูปร่างของ JSON fields ----------
export type ChannelRow = { channel: string; status: ChannelStatus; recommend: string };
export type MandayRow = { activity: string; planned: boolean };
export type WebComponentRow = { component: string; suitable: boolean; note: string };
export type Assets = Partial<Record<AssetKey, boolean>>;

// ---------- ค่าเริ่มต้น (seed ตอนเปิดกิจการครั้งแรกถ้ายังว่าง) ----------
export function defaultChannelAnalysis(): ChannelRow[] {
  return CHANNELS.map((channel) => ({ channel, status: "ไม่มี", recommend: "" }));
}
export function defaultMandayPlan(): MandayRow[] {
  return MANDAY_ACTIVITIES.map((activity) => ({ activity, planned: false }));
}
export function defaultWebComponents(): WebComponentRow[] {
  return WEB_COMPONENTS.map((component) => ({ component, suitable: false, note: "" }));
}

// ---------- คำนวณ % ความครบของฟอร์ม (ใช้แสดงในรายการ) ----------
// 12 ช่องสำคัญที่ถือว่า "กรอกแล้ว" — ใช้คิดเปอร์เซ็นต์คร่าวๆ
export type VisitReportLike = {
  history?: string | null;
  swotStrength?: string | null;
  swotWeakness?: string | null;
  swotOpportunity?: string | null;
  swotThreat?: string | null;
  problems?: string | null;
  improvements?: string | null;
  approach?: string | null;
  domainWanted?: string | null;
  channelAnalysis?: ChannelRow[];
  mandayPlan?: MandayRow[];
  websiteComponents?: WebComponentRow[];
} | null | undefined;

export function visitProgress(r: VisitReportLike): number {
  if (!r) return 0;
  const filled = (s?: string | null) => !!(s && s.trim());
  const checks: boolean[] = [
    filled(r.history),
    filled(r.swotStrength),
    filled(r.swotWeakness),
    filled(r.swotOpportunity),
    filled(r.swotThreat),
    filled(r.problems),
    filled(r.improvements),
    filled(r.approach),
    filled(r.domainWanted),
    !!r.channelAnalysis?.some((c) => c.status !== "ไม่มี" || filled(c.recommend)),
    !!r.mandayPlan?.some((m) => m.planned),
    !!r.websiteComponents?.some((w) => w.suitable),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
