import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://nurschedule.vercel.app'),
  title: "NurSchedule AI - 간호사 근무표 3초 완성 (Nurse Duty Roster)",
  description: "수간호사 업무 해방! 복잡한 3교대 듀티표(Nurse Scheduler)를 AI가 자동으로 짜드립니다. 700명 스케일 완벽 지원, 엑셀 다운로드, 고정 휴무 반영.",
  keywords: [
    "간호사 근무표",
    "Nurse Duty",
    "3교대 근무표",
    "자동 듀티표",
    "간호사 스케줄러",
    "Nurse Roster",
    "수간호사",
    "병원 근무표",
    "AI 스케줄링"
  ],
  openGraph: {
    title: "NurSchedule AI - 간호사 근무표 스트레스 끝!",
    description: "규칙만 넣으세요. 나머지는 AI가 알아서 최적의 근무표를 짜드립니다. (무료/엑셀 호환)",
    type: "website",
    locale: "ko_KR",
  },
  icons: {
    icon: "/favicon.ico", // 아이콘이 있다면
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
