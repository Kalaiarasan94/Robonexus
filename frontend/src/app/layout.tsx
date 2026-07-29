import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import AnimatedGradient from "@/components/animations/AnimatedGradient";
import FloatingElements from "@/components/animations/FloatingElements";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoboNexus | Real Humans. Real Actions. Real Impact on AI.",
  description: "Upgrade your artificial intelligence models with high-fidelity human dataset annotation, human-in-the-loop verification, and advanced robotics training datasets. Founded in 2025.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-dark text-gray-100 overflow-x-hidden">
        {/* Animated background canvas */}
        <AnimatedGradient />
        <FloatingElements />
        
        {/* Client Layout Wrapper (Handles conditional Header/Footer/Padding) */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

