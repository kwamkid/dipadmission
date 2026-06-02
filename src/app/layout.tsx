import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบคัดกรองผู้สมัครโครงการ",
  description: "Phone screening + จองช่องสัมภาษณ์ Online (Round 1)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
