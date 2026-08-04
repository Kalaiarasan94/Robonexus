"use client";

import { useEffect } from "react";

export default function AdminRedirect() {
  useEffect(() => {
    // Bounce to the PHP admin panel, which lives beside the backend folder.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";

    // Normal case: ".../backend" -> ".../admin". If the API URL has no /backend
    // suffix the swap would silently do nothing and land the user back on the
    // API root, so fall back to /admin on the same origin instead.
    const adminUrl = /\/backend\/?$/.test(apiUrl)
      ? apiUrl.replace(/\/backend\/?$/, "/admin")
      : new URL("/admin", apiUrl).href;

    window.location.href = adminUrl;
  }, []);

  return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="text-center flex flex-col items-center gap-4">
        <span className="h-10 w-10 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin shrink-0" />
        <p className="text-gray-400 font-mono text-xs tracking-wider">
          DECRYPTING ACCESS PORTAL... REDIRECTING TO CONTROL CONSOLE
        </p>
      </div>
    </div>
  );
}
