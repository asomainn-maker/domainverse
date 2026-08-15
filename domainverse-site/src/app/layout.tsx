import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "domainverse.store",
  description: "Layihələrinizi yükləyin və paylaşın",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="az" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
