/** อัปเดต URL รูปจริง (จาก candidates.csv) เข้า Lead.productImage โดย match เบอร์ */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const norm = (v: string) => { let d=(v||"").replace(/\D/g,""); if(d.startsWith("66")&&d.length>=11)d="0"+d.slice(2); return d; };
async function main(){
  const raw = readFileSync(resolve(process.cwd(),"data/candidates.csv"),"utf8").replace(/^﻿/,"");
  const rows: Record<string,string>[] = parse(raw,{columns:true,skip_empty_lines:true,trim:true,relax_column_count:true,bom:true});
  const phoneK = Object.keys(rows[0]).find(h=>h.includes("โทรศัพท์"))!;
  const imgK = Object.keys(rows[0]).find(h=>h.includes("แนบภาพ"))!;
  let updated=0, skip=0;
  for(const r of rows){
    const url=(r[imgK]||"").trim();
    if(!/^https?:\/\//i.test(url)){ skip++; continue; }
    const res = await prisma.lead.updateMany({ where:{ phoneNorm: norm(r[phoneK]) }, data:{ productImage: url } });
    updated += res.count;
  }
  console.log(`✅ อัปเดต URL รูปเข้า Lead ${updated} แถว (ข้าม ${skip} ที่ไม่ใช่ URL)`);
  const withUrl = await prisma.lead.count({ where: { productImage: { startsWith: "http" } } });
  console.log(`📊 Lead ที่มี URL รูปจริงตอนนี้: ${withUrl}/${await prisma.lead.count()}`);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
