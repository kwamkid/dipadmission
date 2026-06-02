# ระบบคัดกรองผู้สมัครเข้าโครงการ — Round 1 (Phone Screening)

แอป Next.js สำหรับ **โทรสัมภาษณ์คัดกรองทีละคน** จาก ~186 คน → 30 คน
ผ่าน checklist แล้ว **จองช่องสัมภาษณ์ Online (4–5 มิ.ย.)** ได้ในตัว
(Round 2 — Zoom interview 30 → 15 จะต่อยอดภายหลัง)

## Stack
- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Prisma** + **Postgres (Neon ฟรี)** — ใช้ codebase เดียวทั้ง local และ Vercel
- ไม่มีระบบ login (internal tool)

---

## เริ่มใช้งาน (4 ขั้นตอน)

### 1) สร้างฐานข้อมูล Neon (ฟรี)
1. ไปที่ https://neon.tech → สมัคร → New Project
2. คัดลอก **Connection string** (เลือกแบบ *Pooled*)
3. แก้ไฟล์ `.env`:
   ```
   DATABASE_URL="postgresql://...-pooler...neon.tech/...?sslmode=require"
   DIRECT_URL="postgresql://...(แบบ direct ไม่มี -pooler)...neon.tech/...?sslmode=require"
   ```
   > ถ้ามีสตริงเดียว ใส่ค่าเดียวกันทั้งสองบรรทัดได้

### 2) สร้างตาราง + seed ช่องสัมภาษณ์ 30 ช่อง
```bash
npm install
npm run db:push     # สร้างตารางตาม schema
npm run db:seed     # ใส่ช่องสัมภาษณ์ 30 ช่อง (4–5 มิ.ย.)
```

### 3) นำเข้ารายชื่อผู้สมัคร
- วางไฟล์ของคุณที่ **`data/candidates.csv`**
- หัวคอลัมน์รองรับทั้งไทย/อังกฤษ (ดูตัวอย่างที่ `data/candidates.sample.csv`):
  `#, คะแนน, ชื่อ, โทร, บริษัท, จังหวัด, ตำแหน่ง, รายได้, ช่องทาง, อายุ, เหตุผล`
- ช่องทาง (channels) คั่นด้วย `|` เช่น `FB|TikTok|LINE`
```bash
npm run import
```

### 4) รัน
```bash
npm run dev
```
เปิด http://localhost:3000 → เด้งเข้าหน้า `/screening`

---

## การใช้งานหน้าจอ
- **ตารางรวม** = ภาพรวมผู้สมัครทุกคน (เรียงตามคะแนน) + ตัวกรอง/ค้นหา + สถิติด้านบน (ผ่านกี่/30, ช่องว่างเหลือ)
- คลิกชื่อ → เปิด **แผงคัดทีละคน** ด้านขวา:
  - กดโทร (`tel:`) อ่านเหตุผลที่สมัคร
  - ติ๊ก checklist: **notebook (จำเป็น)**, ว่างพิธีเปิด 11 มิ.ย., กลุ่มเทรนนิ่ง 1/2, Personal consult + i-industry
  - **จองช่องสัมภาษณ์** (จองได้เมื่อมี notebook เท่านั้น; ช่องที่คนอื่นจองแล้วจะกดไม่ได้)
  - ปุ่ม **ผ่าน / ไม่ผ่าน** (ผ่านได้ต้องมี notebook)
  - ปุ่ม **← ก่อนหน้า / ถัดไป →** เพื่อไล่คัดทีละคนต่อเนื่อง
- บันทึกทันทีทุกครั้งที่กด (auto-save)

### กติกาสำคัญ
- **notebook = จำเป็น** ถ้าไม่ติ๊ก → จองช่องไม่ได้ และให้ "ผ่าน" ไม่ได้
- มีช่องสัมภาษณ์รวม **30 ช่อง** (15 ช่อง × 2 วัน) — ระบบกันจองซ้ำให้อัตโนมัติ

---

## Deploy ขึ้น Vercel
1. push โค้ดขึ้น GitHub
2. Vercel → Import project
3. ตั้ง Environment Variables: `DATABASE_URL`, `DIRECT_URL` (ค่าเดียวกับใน `.env`)
4. Build command ใช้ `npm run build` (รัน `prisma generate` ให้อยู่แล้ว)

> ตาราง/seed รันครั้งเดียวจากเครื่อง local ก็พอ (ชี้ DB เดียวกับ production)

---

## โครงสร้าง
```
prisma/schema.prisma        ตาราง Candidate, InterviewSlot
prisma/seed.ts              seed ช่องสัมภาษณ์ 30 ช่อง
scripts/import-candidates.ts นำเข้า CSV → DB
src/lib/slots.ts            นิยามวัน/เวลาช่องสัมภาษณ์ + กลุ่มเทรนนิ่ง
src/app/actions.ts          server actions (save/book/result)
src/app/screening/page.tsx  หน้าหลัก (server fetch)
src/components/ScreeningBoard.tsx   ตาราง + สถิติ + ตัวกรอง
src/components/ScreeningPanel.tsx   แผงคัดทีละคน + จองช่อง
```

## ต่อยอด Round 2 (Zoom 30 → 15)
schema มี `round2Result` ไว้แล้ว — รอบหน้าทำหน้า `/round2` กรองเฉพาะ `result = PASS`
แล้วจัดช่อง Zoom + ให้คะแนน/ตัดสิน `round2Result` ในลักษณะเดียวกัน
# dipadmission
