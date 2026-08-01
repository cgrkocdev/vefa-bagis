import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Yedirenk Derneği | Bağış Yönetimi", template: "%s | Yedirenk Derneği" },
  description: "Yedirenk Derneği bağış ve kurban süreçleri yönetim sistemi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={poppins.variable}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
