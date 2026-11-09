import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIRVAH Control Room",
  description: "Civic Issue Management & Resolution Infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
