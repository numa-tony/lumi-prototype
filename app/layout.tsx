import type { Metadata } from "next";
import "./globals.css";
import { Annotations } from "@/components/dev/Annotations";

export const metadata: Metadata = {
  title: "Numa — Lumi Prototype",
  description: "Numa app prototype with Lumi, the AI concierge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {children}
        <Annotations />
      </body>
    </html>
  );
}
