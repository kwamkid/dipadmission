/**
 * นำเข้ารายชื่อผู้สมัครจาก CSV → ตาราง Candidate
 *
 * วิธีใช้:
 *   1) วางไฟล์ของคุณที่  data/candidates.csv
 *   2) รัน              npm run import
 *      (ใส่ --reset เพื่อล้างผู้สมัครเดิมทั้งหมดก่อนนำเข้า)
 *
 * รองรับ 2 รูปแบบไฟล์อัตโนมัติ:
 *   A) รูปแบบสั้น (เหมือน data/candidates.sample.csv)
 *      seq/# , score/คะแนน , name/ชื่อ , phone/โทร , company/บริษัท , province/จังหวัด ,
 *      position/ตำแหน่ง , income/รายได้ , channels/ช่องทาง , age/อายุ , reason/เหตุผล
 *
 *   B) รูปแบบฟอร์มสมัคร (export จาก AooForm/Google Form, คอลัมน์เยอะ)
 *      ระบบจะรวม "คำนำหน้าชื่อ + ชื่อ + นามสกุล" เป็นชื่อเต็ม,
 *      แปลงเบอร์ 66xxxxxxxxx → 0xxxxxxxxx ให้กดโทรได้, และ map คอลัมน์อื่นให้อัตโนมัติ
 *
 * ช่องทาง (channels) คั่นได้ด้วย  |  ,  /  หรือเว้นวรรค  เช่น "FB|TikTok" หรือ "Facebook, Line"
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CSV_PATH = resolve(process.cwd(), "data/candidates.csv");

// ---------- helper ----------
const norm = (s: string) => s.trim().toLowerCase();

/** หาค่าจาก row โดยเทียบ header: ตรงเป๊ะก่อน แล้วค่อยเทียบแบบ "ขึ้นต้นด้วย" */
function col(row: Record<string, string>, ...candidates: string[]): string | undefined {
  const headers = Object.keys(row);
  for (const c of candidates) {
    const cn = norm(c);
    const exact = headers.find((h) => norm(h) === cn);
    if (exact && row[exact]?.trim()) return row[exact].trim();
  }
  for (const c of candidates) {
    const cn = norm(c);
    const starts = headers.find((h) => norm(h).startsWith(cn));
    if (starts && row[starts]?.trim()) return row[starts].trim();
  }
  return undefined;
}

function toInt(v?: string): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function toChannels(v?: string): string[] {
  if (!v) return [];
  return v
    .split(/[|,/]| {2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** แปลงเบอร์ให้กดโทรได้: 66919163999 → 0919163999 , เก็บเฉพาะตัวเลข */
function normPhone(v?: string): string | null {
  if (!v) return null;
  let d = v.replace(/\D/g, "");
  if (d.startsWith("66") && d.length >= 11) d = "0" + d.slice(2);
  return d || null;
}

/** ดึง URL ที่ใช้ได้จริงจากค่าในช่อง (เผื่อมีข้อความปนหรือไม่มี https://) — ถ้าไม่ใช่ลิงก์คืน null */
function toUrl(v?: string): string | null {
  if (!v) return null;
  const s = v.trim();
  const http = s.match(/https?:\/\/\S+/i); // มี URL เต็มฝังอยู่
  if (http) return http[0].replace(/^https?/i, (m) => m.toLowerCase());
  // โดเมนเปล่า เช่น www.example.com/page — ไม่มีช่องว่าง ไม่มีอักษรไทย และมีจุด + TLD
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s)) return `https://${s}`;
  return null; // ข้อความอย่าง "ไม่มี", "ยังไม่มี Facebook"
}

/** คำนวณอายุ (ปีเต็ม) จากวันเกิด เช่น "1985-08-29" — รองรับ YYYY-MM-DD และ DD/MM/YYYY */
function ageFromBirth(v?: string): number | null {
  if (!v) return null;
  let y: number, m: number, d: number;
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (iso) {
    y = +iso[1]; m = +iso[2]; d = +iso[3];
  } else if (dmy) {
    d = +dmy[1]; m = +dmy[2]; y = +dmy[3];
  } else {
    return null;
  }
  if (y > 2500) y -= 543; // เผื่อกรอกเป็น พ.ศ.
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age >= 0 && age < 120 ? age : null;
}

// ---------- mapping ----------
/** รูปแบบฟอร์มสมัคร: ชื่อแยก คำนำหน้า/ชื่อ/นามสกุล */
function isFormFormat(headers: string[]): boolean {
  return headers.some((h) => norm(h).startsWith("คำนำหน้า"));
}

function mapForm(row: Record<string, string>) {
  const prefix = col(row, "คำนำหน้าชื่อ") ?? "";
  const first = col(row, "ชื่อ (โปรดระบุ", "ชื่อจริง") ?? "";
  const last = col(row, "นามสกุล") ?? "";
  const name = `${prefix}${first}${first && last ? " " : ""}${last}`.trim();
  return {
    name,
    phone: normPhone(col(row, "หมายเลขโทรศัพท์", "เบอร์")),
    company: col(row, "ชื่อธุรกิจ", "บริษัท") ?? null,
    province: col(row, "เขตพื้นที่", "จังหวัด") ?? null,
    position: col(row, "ตำแหน่งของท่าน", "ตำแหน่ง") ?? null,
    income: col(row, "รายได้บริษัท", "รายได้") ?? null,
    channels: toChannels(col(row, "ปัจจุบันท่านได้จำหน่าย", "ช่องทาง")),
    age: toInt(col(row, "อายุ")) ?? ageFromBirth(col(row, "วันเกิด")),
    reason: col(row, "ทำไมธุรกิจคุณ", "เหตุผล") ?? null,
    facebookUrl: toUrl(col(row, "เพจ Facebook", "facebook")),
    website: toUrl(col(row, "เว็บไซต์", "website")),
    seq: null as number | null,
    score: null as number | null,
  };
}

/** รูปแบบสั้น (sample) */
function mapShort(row: Record<string, string>) {
  return {
    name: col(row, "name", "ชื่อ", "ชื่อ-สกุล") ?? "",
    phone: normPhone(col(row, "phone", "tel", "โทร", "เบอร์", "เบอร์โทร")),
    company: col(row, "company", "บริษัท") ?? null,
    province: col(row, "province", "จังหวัด") ?? null,
    position: col(row, "position", "ตำแหน่ง") ?? null,
    income: col(row, "income", "รายได้") ?? null,
    channels: toChannels(col(row, "channels", "channel", "ช่องทาง")),
    age: toInt(col(row, "age", "อายุ")),
    reason: col(row, "reason", "เหตุผล", "note") ?? null,
    facebookUrl: toUrl(col(row, "facebook", "เพจ facebook")),
    website: toUrl(col(row, "website", "เว็บไซต์", "web")),
    seq: toInt(col(row, "seq", "#", "no", "ลำดับ")),
    score: toInt(col(row, "score", "คะแนน")),
  };
}

async function main() {
  if (!existsSync(CSV_PATH)) {
    console.error(`❌ ไม่พบไฟล์ ${CSV_PATH}\n   วางไฟล์ CSV ของคุณที่ data/candidates.csv ก่อนครับ`);
    process.exit(1);
  }

  if (process.argv.includes("--reset")) {
    const del = await prisma.candidate.deleteMany();
    console.log(`🧹 ล้างผู้สมัครเดิม ${del.count} ราย`);
  }

  const raw = readFileSync(CSV_PATH, "utf8").replace(/^﻿/, ""); // strip BOM
  const rows: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  });

  const headers = rows.length ? Object.keys(rows[0]) : [];
  const formMode = isFormFormat(headers);
  console.log(
    `📄 อ่านได้ ${rows.length} แถวจาก data/candidates.csv  (รูปแบบ: ${formMode ? "ฟอร์มสมัคร" : "สั้น/sample"})`
  );

  let created = 0;
  let skipped = 0;
  let order = 0;
  for (const row of rows) {
    order++;
    const m = formMode ? mapForm(row) : mapShort(row);
    if (!m.name) {
      skipped++;
      continue;
    }
    await prisma.candidate.create({
      data: {
        seq: m.seq ?? order, // ฟอร์มไม่มีเลขลำดับ → ใช้ลำดับแถวแทน
        score: m.score,
        name: m.name,
        phone: m.phone,
        company: m.company,
        province: m.province,
        position: m.position,
        income: m.income,
        channels: m.channels,
        age: m.age,
        reason: m.reason,
        facebookUrl: m.facebookUrl,
        website: m.website,
      },
    });
    created++;
  }

  console.log(`✅ นำเข้าสำเร็จ ${created} ราย (ข้าม ${skipped} แถวที่ไม่มีชื่อ)`);
  const total = await prisma.candidate.count();
  console.log(`📊 รวมในระบบตอนนี้ ${total} ราย`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
