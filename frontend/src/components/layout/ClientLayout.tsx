"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import PageTransition from "@/components/animations/PageTransition";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide header and footer on dashboard, login, and register pages for a cleaner portal feel
  const isPortal = pathname?.startsWith("/dashboard") || pathname?.startsWith("/login") || pathname?.startsWith("/register");

  return (
    <>
      {!isPortal && <Header />}
      
      <main className={isPortal ? "flex-grow flex flex-col min-h-screen" : "flex-grow pt-24 pb-12"}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {!isPortal && <Footer />}
    </>
  );
}
