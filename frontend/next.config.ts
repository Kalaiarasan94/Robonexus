import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export for Hostinger shared hosting (no Node server).
  // Produces an `out/` folder to upload to public_html.
  output: "export",
  // next/image optimization needs a server, so disable it for static export.
  images: {
    unoptimized: true,
  },
  // Emit folder-style URLs (register/index.html) so Apache serves them cleanly.
  trailingSlash: true,
};

export default nextConfig;
