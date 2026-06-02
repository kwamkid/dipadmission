// เกณฑ์สัมภาษณ์ Round 3 (Zoom) — Matrix + Rubric DIP × AOO 2569
// Gate (30%, binary) + 6 เกณฑ์ให้คะแนน (70%, 1–5) → รวม Σ(คะแนน×น้ำหนัก)/5 = เต็ม 100
import type { CandidateDTO } from "./types";

export const FINAL_TARGET = 15; // คัดเหลือ 15 กิจการ

export const GATE_WEIGHT = 30;

// ข้อ 1 — Gate (ตอบได้/ไม่ได้ ทั้ง 4 ข้อ ถึงจะผ่าน)
export const GATE_ITEMS: { key: GateKey; label: string }[] = [
  { key: "itvGate1a", label: "มาพิธีเปิด 11 มิ.ย. 2569 (09:00) ผ่าน Zoom ได้" },
  { key: "itvGate1b", label: "เข้า Group Sessions ×4 ครั้ง (มิ.ย.–ก.ค.) ได้" },
  { key: "itvGate1c", label: "รับ On-site Visit ×5 ครั้ง (มิ.ย.–ก.ค.) ได้" },
  { key: "itvGate1d", label: "ลงทะเบียน i-industry ภายใน 23 มิ.ย. ได้" },
];

export type GateKey = "itvGate1a" | "itvGate1b" | "itvGate1c" | "itvGate1d";
export type ScoreKey = "itvScore2" | "itvScore3" | "itvScore4" | "itvScore5" | "itvScore6" | "itvScore7";

// ข้อ 2–7 — เกณฑ์ให้คะแนน 1–5
export const CRITERIA: {
  key: ScoreKey;
  no: number;
  weight: number;
  title: string;
  question: string;
  levels: Record<1 | 2 | 3 | 4 | 5, string>;
}[] = [
  {
    key: "itvScore2",
    no: 2,
    weight: 20,
    title: "ความจำเป็นของเว็บไซต์/AI ต่อธุรกิจ",
    question: "เว็บ/AI ที่จะทำ จะเอาไปแก้ปัญหาอะไรของธุรกิจ?",
    levels: {
      5: "ระบุปัญหาชัด + อธิบายว่าเว็บ/AI ช่วยตรงจุด + มีตัวเลขรองรับ",
      4: "ระบุปัญหาชัด เห็นภาพ แต่ไม่มีตัวเลข",
      3: "รู้ว่าต้องมี แต่ตอบกว้างๆ",
      2: "ตอบไม่ตรง / ลังเล",
      1: "ไม่รู้ว่าจะเอาเว็บไปทำอะไร",
    },
  },
  {
    key: "itvScore3",
    no: 3,
    weight: 15,
    title: "สินค้า/บริการชัดเจน เจาะกลุ่มได้",
    question: "ขายอะไร ลูกค้าหลักคือใคร จุดเด่นต่างจากคู่แข่งยังไง?",
    levels: {
      5: "ชัดครบ — product + target + USP + ราคา + positioning",
      4: "สินค้า+target ชัด แต่ USP ยังกว้าง",
      3: "บอกสินค้าได้ แต่ target/USP ไม่ชัด",
      2: "สินค้ายังไม่ชัด / จับกลุ่มไม่ได้",
      1: "ไม่มีสินค้าจริง / ยังไม่เริ่ม",
    },
  },
  {
    key: "itvScore4",
    no: 4,
    weight: 12,
    title: "ประสบการณ์ช่องทางออนไลน์ที่ผ่านมา",
    question: "เคยทำ FB Ads / LINE OA / Shopee / TikTok ไหม ผลเป็นยังไง?",
    levels: {
      5: "ทำหลายช่องทาง + มีตัวเลขผล (CPL/ROAS) + วิเคราะห์เป็น",
      4: "ทำบางช่องทาง + บอกผลคร่าวๆ + เข้าใจ logic",
      3: "เคยทำเล็กน้อย / ไม่มีระบบ แต่ตั้งใจลอง",
      2: "เคยลอง แต่เล่าผลไม่ได้",
      1: "ไม่เคยทำเลย / ไม่รู้จัก",
    },
  },
  {
    key: "itvScore5",
    no: 5,
    weight: 10,
    title: "ความตั้งใจเข้าร่วม",
    question: "30 ชั่วโมง 5 ครั้ง คืออะไรบ้าง จัดเวลายังไง?",
    levels: {
      5: "เคลียร์ตารางมาแล้ว + บอกได้ว่าจะจัดเวลายังไง + กระตือรือร้น",
      4: "เข้าใจว่าต้องทุ่ม + ตอบดี แต่ยังไม่มีแผนชัด",
      3: "รับว่าเข้าได้ แต่ไม่ค่อยมั่นใจ",
      2: "ลังเล / 'ลองดู' / 'น่าจะ'",
      1: "ติดงานเยอะ / ขอเลื่อนตั้งแต่สัมภาษณ์",
    },
  },
  {
    key: "itvScore6",
    no: 6,
    weight: 8,
    title: "ความพร้อมของต้นทุนทางเดิม (asset)",
    question: "ตอนนี้มี FB Page / LINE OA / รูปสินค้า / content อยู่แล้วไหม?",
    levels: {
      5: "ครบ — FB + LINE OA + รูปสินค้าคุณภาพดี + คอนเทนต์ต่อเนื่อง",
      4: "มี FB + LINE OA + รูปสินค้าอยู่บ้าง",
      3: "มี FB หรือ LINE OA อย่างใดอย่างหนึ่ง + รูปมีบ้าง",
      2: "มี FB แต่ไม่ active / รูปน้อย",
      1: "ไม่มีช่องทางออนไลน์เลย",
    },
  },
  {
    key: "itvScore7",
    no: 7,
    weight: 5,
    title: "ทักษะ digital + พร้อมเรียนรู้ AI",
    question: "ทีมงานใช้เครื่องมือดิจิทัลอะไร เคยลอง AI tool ไหม?",
    levels: {
      5: "ใช้ Workspace/Notion/Canva + เคยลอง AI + เปิดรับของใหม่",
      4: "ใช้ Office + Line + เคยลอง AI บ้าง",
      3: "ใช้เครื่องมือพื้นฐาน + รู้จัก AI แต่ยังไม่ได้ใช้",
      2: "ใช้แค่ Line + ไม่เคยลอง AI",
      1: "ไม่ถนัดเครื่องมือ / กลัวของใหม่",
    },
  },
];

const TOTAL_WEIGHT = GATE_WEIGHT + CRITERIA.reduce((a, c) => a + c.weight, 0); // = 100

/** Gate ผ่านไหม: true=ผ่านครบ, false=ตก, null=ยังตอบไม่ครบ 4 ข้อ */
export function gateStatus(c: CandidateDTO): boolean | null {
  const ans = GATE_ITEMS.map((g) => c[g.key]);
  if (ans.some((a) => a === null || a === undefined)) return null;
  return ans.every(Boolean);
}

/** คะแนนรวม (เต็ม 100) — Σ(คะแนน×น้ำหนัก)/5 ; gate=5 ถ้าผ่าน, 0 ถ้าไม่ */
export function interviewTotal(c: CandidateDTO): number {
  const gate = gateStatus(c) === true ? 5 : 0;
  let sum = gate * GATE_WEIGHT;
  for (const cr of CRITERIA) sum += (c[cr.key] ?? 0) * cr.weight;
  return Math.round((sum / 5) * 10) / 10; // ทศนิยม 1 ตำแหน่ง
}

/** ประเมินครบทุกข้อหรือยัง (gate 4 ข้อ + 6 เกณฑ์) */
export function interviewComplete(c: CandidateDTO): boolean {
  return gateStatus(c) !== null && CRITERIA.every((cr) => c[cr.key] != null);
}

export { TOTAL_WEIGHT };
