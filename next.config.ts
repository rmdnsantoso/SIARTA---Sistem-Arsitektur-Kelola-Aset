import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Turunkan dari 10mb ke 5mb — cukup untuk upload gambar aset
      bodySizeLimit: '5mb',
    },
  },

  // ── Security Headers untuk Production ──────────────────────────────────────
  // Melindungi dari XSS, clickjacking, MIME sniffing, dan serangan umum lainnya
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Cegah halaman dimuat dalam iframe (anti-clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Cegah browser menebak tipe konten sendiri
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Kontrol informasi referrer yang dikirim
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Aktifkan XSS filter bawaan browser
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Batasi akses fitur browser yang sensitif
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
