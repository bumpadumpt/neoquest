import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeoQuest — Find your next side quest",
  description:
    "Less scrolling, more stories. Discover nearby hangouts that fit your friends, your mood, and your budget.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
