import type { Metadata, Viewport } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GreenTrail — Live Intelligence Platform",
  description:
    "Real-time business intelligence platform — live data, AI insights, company analytics, and multi-source integrations.",
  keywords: ["analytics", "real-time", "intelligence", "greentrail", "live data"],
};

export const viewport: Viewport = {
  themeColor: "#070e09",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-gt-card)",
                border: "1px solid var(--color-gt-border-l)",
                color: "var(--color-gt-text-1)",
                fontFamily: "var(--font-sans)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
