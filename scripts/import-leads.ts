/**
 * นำเข้าผู้สมัครทั้งหมดจาก data/lead.csv → ตาราง Lead (เก็บครบทุกช่อง)
 * วิธีใช้:  npm run import:leads          (เพิ่มต่อ)
 *          npm run import:leads -- --reset (ล้างของเดิมก่อน)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CSV_PATH = resolve(process.cwd(), "data/lead.csv");

const norm = (s: string) => s.trim().toLowerCase();

function col(row: Record<string, string>, ...candidates: string[]): string | null {
  const headers = Object.keys(row);
  for (const c of candidates) {
    const cn = norm(c);
    const h = headers.find((x) => norm(x) === cn) ?? headers.find((x) => norm(x).startsWith(cn));
    if (h && row[h]?.trim()) return row[h].trim();
  }
  return null;
}

/** 66xxxxxxxxx → 0xxxxxxxxx (ใช้จับคู่กับ candidate.phone) */
function normPhone(v: string | null): string | null {
  if (!v) return null;
  let d = v.replace(/\D/g, "");
  if (d.startsWith("66") && d.length >= 11) d = "0" + d.slice(2);
  return d || null;
}

async function main() {
  if (!existsSync(CSV_PATH)) {
    console.error(`❌ ไม่พบไฟล์ ${CSV_PATH} — วาง lead.csv ใน data/ ก่อน`);
    process.exit(1);
  }
  if (process.argv.includes("--reset")) {
    const del = await prisma.lead.deleteMany();
    console.log(`🧹 ล้างผู้สมัครเดิม ${del.count} ราย`);
  }

  const raw = readFileSync(CSV_PATH, "utf8").replace(/^﻿/, "");
  const rows: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  });
  console.log(`📄 อ่านได้ ${rows.length} แถวจาก data/lead.csv`);

  let order = 0;
  let created = 0;
  for (const row of rows) {
    order++;
    const phone = col(row, "หมายเลขโทรศัพท์", "เบอร์");
    await prisma.lead.create({
      data: {
        seq: order,
        submittedAt: col(row, "ส่งเมื่อ"),
        prefix: col(row, "คำนำหน้า"),
        firstName: col(row, "ชื่อ (โปรดระบุ", "ชื่อจริง"),
        lastName: col(row, "นามสกุล"),
        idCard: col(row, "เลขบัตรประชาชน"),
        birthDate: col(row, "วันเกิด"),
        phone,
        phoneNorm: normPhone(phone),
        email: col(row, "e-mail", "email", "อีเมล"),
        address: col(row, "ที่อยู่  (กรอก", "ที่อยู่ ("),
        company: col(row, "ชื่อธุรกิจ"),
        registrationNo: col(row, "เลขทะเบียนนิติบุคคล"),
        companyAddress: col(row, "ที่อยู่บริษัท"),
        area: col(row, "เขตพื้นที่"),
        businessType: col(row, "ประเภทธุรกิจ"),
        mainProduct: col(row, "สินค้า/บริการ หลัก"),
        businessAbout: col(row, "ทำธุรกิจเกี่ยวกับ"),
        channels: col(row, "ปัจจุบันท่านได้จำหน่าย"),
        position: col(row, "ตำแหน่งของท่าน"),
        department: col(row, "แผนก"),
        revenue: col(row, "รายได้บริษัท"),
        businessSize: col(row, "ขนาดกิจการ"),
        yearsOperating: col(row, "ระยะเวลาการดำเนิน"),
        websiteReason: col(row, "ทำไมธุรกิจคุณ"),
        facebookUrl: col(row, "เพจ Facebook"),
        website: col(row, "เว็บไซต์"),
        consent: col(row, "การยินยอม"),
        productImage: col(row, "แนบภาพ"),
      },
    });
    created++;
  }
  console.log(`✅ นำเข้าผู้สมัครทั้งหมด ${created} ราย`);
  console.log(`📊 รวมในตาราง Lead ${await prisma.lead.count()} ราย`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
