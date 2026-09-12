import type { Metadata } from "next";
import "./globals.css";
import "./intro.css";

export const metadata: Metadata = {
  title: "AQUA / Pump Reliability Operations Desk",
  description: "Evidence-led pump reliability investigations for water operations. Interactive synthetic demonstration.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
