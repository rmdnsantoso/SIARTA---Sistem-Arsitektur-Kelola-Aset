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
          // HSTS (Strict-Transport-Security)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self' data:; connect-src 'self' https:;"
          },
        ],
      },
    ]
  },
};

export default nextConfig;
