import { redirect } from "next/navigation";

// /dashboard → /screening (กัน 404 เผื่อมีคนเข้าลิงก์เก่า/พิมพ์ path นี้)
export default function Dashboard() {
  redirect("/screening");
}
