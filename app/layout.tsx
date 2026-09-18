import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drmayers Delivery",
  description: "Local delivery platform for Nasarawa State"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
