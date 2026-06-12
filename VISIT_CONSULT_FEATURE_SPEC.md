# สเปกฟีเจอร์: 1st Visit / Business Consult (เก็บข้อมูลวินิจฉัยรายกิจการ)

> เอกสารสั่งงานสำหรับต่อยอดแอป `recruit-screening` (Next.js 15 + Prisma + Neon)
> เป้าหมาย: พิมพ์ข้อมูลลงพื้นที่ครั้งที่ 1 ของแต่ละกิจการในโปรแกรม แทนการกรอก Word ทีละเล่ม
> ปลายทาง: ข้อมูลนี้ใช้ generate "รายงานการพัฒนาสถานประกอบการ" (งวด 2/3) ได้ครบทุกหัวข้อ

---

## 1. ภาพรวม

- ผู้ใช้: ทีมโค้ช (อ.แอม / อ.มิ้น / อ.เอ็ม) ระหว่างลงพื้นที่ 12–22 มิ.ย. 2569
- ขอบเขต: เฉพาะ 15 กิจการที่ผ่านการคัดเลือก (`Candidate.round2Result = PASS` / มี `finalGroup`)
- รูปแบบ: ทำตาม pattern เดิมของแอป — **หน้าใหม่ `/visit` + `VisitBoard` (รายการ 15 กิจการ) + `VisitPanel` (ฟอร์มกรอกทีละกิจการ) + Server Actions auto-save**
- เพิ่มแท็บใน `TabNav` ชื่อ "Visit/Consult"

> ข้อมูลพื้นฐานกิจการ (ชื่อ, เลขนิติบุคคล, ผู้ติดต่อ, ประเภทธุรกิจ, ผลิตภัณฑ์, รายได้, ที่อยู่, channels, finalGroup, visitCoach, consultDate, iindustryReg) **มีอยู่แล้วใน `Candidate`/`Lead` — ดึงมาแสดงอ่านอย่างเดียว ไม่ต้องพิมพ์ซ้ำ** ฟอร์มนี้เก็บเฉพาะ "เนื้อหาวินิจฉัย" ที่ยังไม่มี

---

## 2. Data Model (Prisma) — เพิ่ม model `VisitReport` (1:1 กับ Candidate)

```prisma
model VisitReport {
  id          String   @id @default(cuid())
  candidateId String   @unique
  candidate   Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)

  // ----- ส่วนที่ 1 ข้อมูลเพิ่มเติม (ที่ Candidate/Lead ยังไม่มี) -----
  capitalRegistered String? // ทุนจดทะเบียน
  yearRegistered    String? // ปีที่จดทะเบียนธุรกิจ
  currentEcommerce  String? // ช่องทาง e-Commerce ปัจจุบัน (สรุป)
  history           String? @db.Text // 1.2 ประวัติความเป็นมา

  // ----- ส่วนที่ 2 วินิจฉัย -----
  swotStrength    String? @db.Text
  swotWeakness    String? @db.Text
  swotOpportunity String? @db.Text
  swotThreat      String? @db.Text
  channelAnalysis Json    @default("[]") // [{ channel, status, recommend }]

  // ----- ส่วนที่ 3 ปัญหา -----
  problems     String? @db.Text // 3.1 ปัญหาหลัก
  improvements String? @db.Text // 3.2 สิ่งที่อยากพัฒนา

  // ----- ส่วนที่ 4 แนวทางพัฒนา -----
  approach   String? @db.Text // 4.1 แนวทาง/วิธีการ
  mandayPlan Json    @default("[]") // [{ activity, planned: bool }]

  // ----- ส่วนที่ 5 เว็บไซต์ที่เหมาะสม -----
  websiteComponents Json    @default("[]") // [{ component, suitable: bool, note }]
  domainWanted      String?
  assets            Json    @default("{}") // { logo, productImages, brandText, oldUrl, theme, social, contact } : bool

  // ----- ภาคผนวก / KPI baseline -----
  mouSigned       Boolean @default(false)
  consentSigned   Boolean @default(false)
  mandaySigned    Boolean @default(false)
  kpiSalesPerMonth String?
  kpiCustomers     String?
  kpiMainChannel   String?
  oldWebsiteUrl    String?

  // ----- รูป/วิดีโอ -----
  photos   String[] @default([]) // ลิงก์/ชื่อไฟล์ภาพ (สินค้า/บริการ/ร้าน/ทีม)
  videoUrl String?

  status    VisitStatus @default(DRAFT) // DRAFT / DONE
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum VisitStatus {
  DRAFT
  DONE
}
```

เพิ่ม relation ฝั่ง Candidate:
```prisma
model Candidate {
  // ... ของเดิม
  visitReport VisitReport?
}
```

> **ใช้ field เดิมของ Candidate ต่อ (ห้ามสร้างซ้ำ):** วันนัด visit = `consultDate` · โค้ช = `visitCoach` · กลุ่ม = `finalGroup` · i-industry = `iindustryReg` · สถานที่นัด = `visitLocation`

รัน: `npm run db:push`

---

## 3. ค่าคงที่ (สร้างไฟล์ `src/lib/visit.ts` — เลียนแบบ `interview.ts`)

```ts
// ช่องทางการตลาดที่ต้องวิเคราะห์ (ส่วน 2.2)
export const CHANNELS = [
  "Website","Facebook","Instagram","Line OA","TikTok","YouTube",
  "Shopee","Lazada","Grab / LineMan","Foodpanda / Robinhood",
] as const;
// สถานะแต่ละช่องทาง
export const CHANNEL_STATUS = ["ไม่มี","มี-ประสิทธิภาพต่ำ","มี-ใช้ได้ดี"] as const;

// องค์ประกอบเว็บไซต์ (ส่วน 5)
export const WEB_COMPONENTS = [
  "ข้อมูลแบรนด์/ประวัติธุรกิจ","ข้อมูลสินค้า-บริการ + จุดเด่น","ข่าวสาร/กิจกรรม",
  "บทความ (Article) ทำ SEO","ระบบจัดการคำสั่งซื้อ","ระบบจัดการสต็อก","ระบบตะกร้าสินค้า",
  "ระบบตัวกรองสินค้า","ระบบรีวิวสินค้า","ระบบคูปองส่วนลด","ช่องทางการติดต่อ",
  "เชื่อมต่อแพลตฟอร์มสั่งอาหาร/ขนส่ง","ปุ่ม Call to Action",
] as const;

// แผน 6 Manday (ส่วน 4.2)
export const MANDAY_ACTIVITIES = [
  "เก็บข้อมูลวินิจฉัยและวิเคราะห์ปัญหา","วางแผนและออกแบบโครงสร้างเว็บไซต์",
  "วิเคราะห์รูปแบบเว็บไซต์ (Theme)","ติดตั้ง/ทดสอบ/ใช้งานเครื่องมือเว็บไซต์",
  "ถ่ายทอดความรู้การใช้งาน + อัปเดตข้อมูล","ถ่ายทอดหลักการตลาดผ่านเว็บไซต์",
  "ให้คำปรึกษา ปรับปรุง ดูแลบำรุงรักษา","สรุปผลการดำเนินงาน",
] as const;

// asset ที่ต้องขอ (ส่วน 5)
export const ASSET_KEYS = {
  logo:"โลโก้ (ไฟล์ความละเอียดสูง)", productImages:"รูปสินค้า/บริการ",
  brandText:"ข้อความแนะนำธุรกิจ/สินค้า", domain:"ชื่อโดเมนที่ต้องการ",
  oldUrl:"URL เว็บเดิม", theme:"สี/ธีมที่ชอบ", social:"เพจ FB/IG ที่มี",
  contact:"ข้อมูลติดต่อที่จะแสดงบนเว็บ",
} as const;
```

---

## 4. หน้าจอ / UI

### 4.1 `/visit` (src/app/visit/page.tsx)
- ดึง 15 กิจการที่ผ่าน (เหมือนหน้า `final`) + `visitReport`
- เรนเดอร์ `<VisitBoard>` (รายการ) — คอลัมน์: ชื่อกิจการ, กลุ่ม, โค้ช, วันนัด (consultDate), สถานะ (DRAFT/DONE), % ความครบของฟอร์ม
- ด้านบนมีสถิติ: กรอกครบกี่/15, MOU เซ็นครบกี่ราย, i-industry ลงครบกี่ราย

### 4.2 `<VisitPanel>` (คลิกกิจการ → เปิดแผงขวา, auto-save ทุก field)
แบ่งเป็น accordion/section ตามรายงาน:
- **หัว (อ่านอย่างเดียว):** ชื่อกิจการ, ผู้ติดต่อ, เบอร์, ประเภทธุรกิจ, ผลิตภัณฑ์, ที่อยู่, กลุ่ม, โค้ช (จาก Candidate/Lead)
- **ส่วน 1:** ทุนจดทะเบียน, ปีจดทะเบียน, ช่องทาง e-Commerce ปัจจุบัน, ประวัติความเป็นมา (textarea) + อัปโหลด/ใส่ลิงก์ภาพ + วิดีโอ
- **ส่วน 2:** SWOT 4 textarea + ตารางช่องทาง (map `CHANNELS` → dropdown `CHANNEL_STATUS` + ช่อง "ควรเพิ่ม/ปรับปรุง")
- **ส่วน 3:** problems + improvements (textarea)
- **ส่วน 4:** approach (textarea) + checklist `MANDAY_ACTIVITIES` (8 ข้อ ติ๊ก planned)
- **ส่วน 5:** ตาราง `WEB_COMPONENTS` (ติ๊ก suitable + note) + domainWanted + checklist `ASSET_KEYS`
- **ภาคผนวก:** ติ๊ก mouSigned / consentSigned / mandaySigned / iindustryReg (Candidate) + KPI baseline (salesPerMonth, customers, mainChannel, oldWebsiteUrl)
- ปุ่ม mark `DONE` + ปุ่ม ← ก่อนหน้า / ถัดไป → (ไล่ทีละกิจการเหมือนหน้า screening)

### 4.3 รูปแบบ interaction
- **auto-save ทุกครั้งที่แก้** (เหมือน screening/interview) ผ่าน Server Action — debounce textarea ~500ms
- JSON fields (channelAnalysis/websiteComponents/mandayPlan/assets) seed จากค่าคงที่ตอนเปิดครั้งแรกถ้ายังว่าง

---

## 5. Server Actions (เพิ่มใน `src/app/actions.ts`)

```ts
"use server";
// อัปเดตทีละ field (เหมือน pattern เดิม)
export async function saveVisitField(candidateId: string, data: Partial<VisitReportInput>) {
  await prisma.visitReport.upsert({
    where: { candidateId },
    create: { candidateId, ...data },
    update: { ...data },
  });
  revalidatePath("/visit");
}
export async function setVisitStatus(candidateId: string, status: "DRAFT"|"DONE") { ... }
```
- ใช้ `upsert` เพราะ VisitReport อาจยังไม่มีตอนเปิดกิจการครั้งแรก
- อัปเดต field กลุ่ม/โค้ช/วันนัด/iindustry → เขียนกลับที่ `Candidate` (action เดิมถ้ามี หรือเพิ่ม `saveCandidateVisitMeta`)

---

## 6. Export รายงาน (เฟสถัดไป — ไม่ต้องทำตอนนี้แต่ออกแบบเผื่อ)
- ปุ่ม "Export รายงานรายกิจการ" → ยิงไปสร้าง .docx ตามโครง **ส่วนที่ 1–5 + ภาคผนวก** (ดู `00-Context/Deliverables_Spec_2569.md` ในโปรเจค DIP)
- map: ส่วน1=ข้อมูล+ประวัติ+ภาพ · ส่วน2=SWOT+ตารางช่องทาง · ส่วน3=problems/improvements · ส่วน4=approach+ตารางแผน MD · ส่วน5=ตารางองค์ประกอบเว็บ
- ฟอนต์ TH Sarabun New, ชิดซ้าย, หน้าปก center+โลโก้ (ตาม Document_Format_Guide)

---

## 7. Convention ที่ต้องทำตาม (ของแอปเดิม)
- App Router + Server Actions (ไม่มี REST API route) — มี `src/app/actions.ts`
- โครงไฟล์: `src/app/visit/page.tsx`, `src/components/VisitBoard.tsx`, `src/components/VisitPanel.tsx`, `src/lib/visit.ts`
- ดึงข้อมูลใน `src/lib/data.ts` (เพิ่มฟังก์ชัน `getVisitList()`), type ใน `src/lib/types.ts`
- เพิ่มแท็บใน `src/components/TabNav.tsx`
- ภาษา label เป็นไทย, ไม่มี login (internal tool), auto-save ทุก field
- ใช้ Tailwind + lucide-react ตามเดิม

---

## 8. Checklist สั่งงาน (ลำดับ)
1. [ ] เพิ่ม model `VisitReport` + enum + relation ใน `schema.prisma` → `npm run db:push`
2. [ ] สร้าง `src/lib/visit.ts` (ค่าคงที่)
3. [ ] เพิ่ม `getVisitList()` ใน `data.ts` + types
4. [ ] Server Actions `saveVisitField` / `setVisitStatus` ใน `actions.ts`
5. [ ] `VisitBoard.tsx` (รายการ 15 กิจการ + สถิติ)
6. [ ] `VisitPanel.tsx` (ฟอร์ม 5 ส่วน + ภาคผนวก + auto-save + prev/next)
7. [ ] หน้า `src/app/visit/page.tsx` + แท็บใน `TabNav`
8. [ ] (เฟสถัดไป) ปุ่ม Export .docx รายกิจการ
