import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const noto = Noto_Sans({ variable: "--font-noto", subsets: ["latin"], display: "swap" });
const deva = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VarshaVani – Hyperlocal Monsoon Onset & Break Advisory",
    template: "%s · VarshaVani",
  },
  description:
    "Block-level 1-4 week probabilistic outlook for monsoon onset, dry spells and heavy rain, with crop advisories in English, Hindi and Marathi. Prototype with simulated data.",
  applicationName: "VarshaVani",
  appleWebApp: { capable: true, title: "VarshaVani", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#1a4577",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${noto.variable} ${deva.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
