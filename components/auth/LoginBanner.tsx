'use client'

import React from 'react'

export default function LoginBanner() {
  return (
    <div className="relative w-full lg:w-[44%] xl:w-[42%] h-[240px] sm:h-[300px] md:h-[360px] lg:h-auto lg:min-h-screen bg-[#3B4A78] overflow-hidden shrink-0">
      <style jsx>{`
        @keyframes floatLetter {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatDot {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseBadge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.07); }
        }
        @keyframes waveDrift {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(14px); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-in { animation: cardIn 0.7s ease-out both; }
        .letter-1 { animation: floatLetter 7s ease-in-out infinite; }
        .letter-2 { animation: floatLetter 8.5s ease-in-out infinite 0.4s; }
        .letter-3 { animation: floatLetter 6.5s ease-in-out infinite 1s; }
        .letter-4 { animation: floatLetter 9s ease-in-out infinite 0.2s; }
        .letter-5 { animation: floatLetter 7.5s ease-in-out infinite 1.4s; }
        .letter-6 { animation: floatLetter 8s ease-in-out infinite 0.8s; }
        .dot-1 { animation: floatDot 4s ease-in-out infinite; }
        .dot-2 { animation: floatDot 5s ease-in-out infinite 0.6s; }
        .dot-3 { animation: floatDot 4.5s ease-in-out infinite 1.2s; }
        .dot-4 { animation: floatDot 5.5s ease-in-out infinite 0.3s; }
        .badge-pulse { animation: pulseBadge 3.2s ease-in-out infinite; transform-origin: center; }
        .wave-drift { animation: waveDrift 11s ease-in-out infinite alternate; }
      `}</style>

      <svg
        viewBox="0 0 400 500"
        className="absolute inset-0 w-full h-full anim-in"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Huruf SIARTA mengambang sebagai tekstur latar */}
        <text x="15" y="90" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize="90" fill="#FFFFFF" opacity="0.06" transform="rotate(-14 60 60)" className="letter-1">S</text>
        <text x="290" y="70" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize="70" fill="#FFFFFF" opacity="0.06" transform="rotate(10 320 50)" className="letter-2">I</text>
        <text x="10" y="330" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize="110" fill="#FFFFFF" opacity="0.055" transform="rotate(-8 60 300)" className="letter-3">A</text>
        <text x="300" y="240" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize="80" fill="#FFFFFF" opacity="0.06" transform="rotate(13 330 210)" className="letter-4">R</text>
        <text x="170" y="55" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize="55" fill="#FFFFFF" opacity="0.05" transform="rotate(-6 190 30)" className="letter-5">T</text>
        <text x="270" y="410" fontFamily="Arial Black, sans-serif" fontWeight={900} fontSize="95" fill="#FFFFFF" opacity="0.055" transform="rotate(7 310 380)" className="letter-6">A</text>

        {/* Bulatan besar & garis lengkung latar */}
        <circle cx="330" cy="90" r="70" fill="#4E5E92" />
        <path d="M40,150 Q80,120 130,150 Q170,175 220,150 Q260,128 310,155" stroke="#4E5E92" strokeWidth="26" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* Ilustrasi clipboard verifikasi aset */}
        <rect x="115" y="130" width="170" height="220" rx="18" fill="#F7F8FC" />
        <rect x="140" y="160" width="120" height="14" rx="4" fill="#D8DCE8" />
        <rect x="140" y="185" width="80" height="10" rx="4" fill="#E4E6EF" />

        <rect x="140" y="215" width="34" height="34" rx="5" fill="#E4E6EF" />
        <rect x="146" y="221" width="6" height="6" fill="#3B4A78" />
        <rect x="158" y="221" width="6" height="6" fill="#3B4A78" />
        <rect x="146" y="233" width="6" height="6" fill="#3B4A78" />
        <rect x="158" y="233" width="6" height="6" fill="#B4924F" />

        <rect x="185" y="215" width="75" height="10" rx="3" fill="#E4E6EF" />
        <rect x="185" y="233" width="55" height="10" rx="3" fill="#E4E6EF" />

        <rect x="140" y="270" width="120" height="10" rx="4" fill="#E4E6EF" />
        <rect x="140" y="290" width="90" height="10" rx="4" fill="#E4E6EF" />
        <rect x="140" y="310" width="105" height="10" rx="4" fill="#E4E6EF" />

        <g className="badge-pulse">
          <circle cx="265" cy="145" r="28" fill="#B4924F" />
          <path d="M253,145 L262,155 L279,135" stroke="#FFFFFF" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Titik-titik aksen */}
        <circle cx="90" cy="210" r="7" fill="#E4394A" className="dot-1" />
        <circle cx="325" cy="270" r="10" fill="#0076C0" className="dot-2" />
        <circle cx="340" cy="320" r="5" fill="#ADC229" className="dot-3" />
        <circle cx="65" cy="320" r="5" fill="#8B97C4" className="dot-4" />

        {/* Gelombang bawah */}
        <path
          d="M-50,460 Q60,435 130,458 Q210,485 280,455 Q340,432 450,452 L450,510 L-50,510 Z"
          fill="#324070"
          className="wave-drift"
        />
      </svg>

      {/* Wordmark SIARTA + tagline */}
      <div className="absolute left-0 right-0 bottom-4 sm:bottom-6 lg:bottom-10 px-5 sm:px-7 lg:px-12">
        <p className="text-lg sm:text-xl lg:text-3xl font-semibold text-white mb-1">SIARTA</p>
        <p className="text-[10px] sm:text-[11px] lg:text-sm text-[#B9C1DE] leading-relaxed mb-2 lg:mb-3">
          Sistem Arsitektur Kelola Aset
        </p>
        <div className="flex gap-1">
          <div className="w-4 h-[3px] rounded-full bg-[#E4394A]" />
          <div className="w-4 h-[3px] rounded-full bg-[#0076C0]" />
          <div className="w-4 h-[3px] rounded-full bg-[#ADC229]" />
        </div>
      </div>
    </div>
  )
}
