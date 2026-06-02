/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ให้ build แยกโฟลเดอร์ได้ (กันชนกับ dev server ที่ใช้ .next อยู่ → แก้ glitch "Cannot find module for page")
  // ปกติใช้ .next; ตอน verify build ใช้ NEXT_DIST_DIR=.next-verify เพื่อไม่ชนกับ dev
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
