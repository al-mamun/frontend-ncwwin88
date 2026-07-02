/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Game/logo/banner thumbnails come from arbitrary tenant/provider CDNs that are
  // not known at build time. `unoptimized` lets next/image render any external src
  // without a per-host remotePatterns allowlist (and without the image optimizer).
  images: { unoptimized: true },
};

export default nextConfig;
