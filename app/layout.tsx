import type { Metadata } from "next";
import { Nunito, Fraunces } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AudioUnlock } from "@/components/audio/AudioUnlock";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WordZoo",
  description: "Learn languages with memorable mnemonics",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WordZoo',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${fraunces.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ThemeProvider>
              <AudioUnlock />
              {children}
            </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
