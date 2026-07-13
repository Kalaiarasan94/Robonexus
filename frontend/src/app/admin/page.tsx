"use client";

import { useEffect } from "react";

export default function AdminRedirect() {
  useEffect(() => {
    // Redirect to the Apache PHP admin panel URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";
    // We parse the base URL of the API (which is /robonexus/backend) to get /robonexus/admin
    const adminUrl = apiUrl.replace(/\/backend\/?$/, "/admin");
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
