'use client'

import React, { useState, useEffect } from 'react'

const headlines = [
  "Kelola Aset Operasional Lebih Presisi.",
  "Pantau Inventaris Secara Cerdas.",
  "Tingkatkan Efisiensi Perusahaan."
]

export default function LoginBanner() {
  const [headlineIndex, setHeadlineIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setHeadlineIndex((prev) => (prev + 1) % headlines.length)
        setFade(true)
      }, 500)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="
      w-full lg:w-1/2 lg:min-h-screen
      relative flex flex-col
      bg-transparent
      overflow-hidden
      py-6 px-4
      sm:py-8 sm:px-8
      lg:py-0 lg:px-0
      animate-fade-in-slide-left
    ">

      {/* PGN COM Logo — top left, slides in from LEFT */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex items-center">
        <svg
          className="h-8 sm:h-9 lg:h-10 w-auto animate-slide-from-left"
          viewBox="0 0 290 82"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* "pgn" — bold rounded slate-gray */}
          <text
            x="0" y="62"
            fontFamily="'Arial Black', 'Arial Rounded MT Bold', sans-serif"
            fontWeight="900"
            fontSize="68"
            fill="#546579"
            letterSpacing="-2"
          >pgn</text>

          {/* "COM" — cyan-blue, right next to pgn */}
          <text
            x="156" y="58"
            fontFamily="'Arial', sans-serif"
            fontWeight="400"
            fontSize="52"
            fill="#29ABE2"
            letterSpacing="1"
          >COM</text>

          {/* "always reliable" — italic, smaller, same cyan-blue */}
          <text
            x="158" y="77"
            fontFamily="'Arial', sans-serif"
            fontWeight="300"
            fontStyle="italic"
            fontSize="17"
            fill="#29ABE2"
            letterSpacing="0.5"
          >always reliable</text>
        </svg>
      </div>

      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 mix-blend-screen filter blur-[80px] lg:blur-[100px] animate-blob pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 mix-blend-screen filter blur-[80px] lg:blur-[100px] animate-blob animation-delay-2000 pointer-events-none" />

      {/* Main content — centered vertically on desktop, compact on mobile */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-4 lg:py-0 pt-16 sm:pt-16 lg:pt-14">
        {/* Glassmorphism Card */}
        <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg p-5 sm:p-7 lg:p-10 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-2xl">

          {/* SIARTA Logo — slides in from RIGHT */}
          <div className="flex items-center gap-3 mb-4 lg:mb-6 animate-slide-from-right">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-lg lg:text-xl font-bold tracking-[0.15em] text-white">SIARTA</span>
          </div>

          {/* Rotating Headline */}
          <div className="space-y-2 lg:space-y-4 mb-0 lg:mb-8">
            <div className="min-h-[56px] sm:min-h-[70px] lg:min-h-[100px]">
              <h1 className={`text-xl sm:text-2xl lg:text-4xl font-bold leading-snug text-white transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {headlines[headlineIndex].split(' ').map((word, idx) => {
                  if (['aset','presisi','cerdas','perusahaan','inventaris'].includes(word.toLowerCase().replace('.', ''))) {
                    return <span key={idx} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{word} </span>
                  }
                  return word + ' '
                })}
              </h1>
            </div>
            <p className="block text-gray-400 text-xs lg:text-sm leading-relaxed max-w-sm mt-1">
              Platform korporat terpadu untuk pemantauan inventaris, manajemen siklus hidup aset, dan persetujuan operasional.
            </p>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-3 lg:gap-6 p-3 lg:p-5 rounded-xl bg-black/20 border border-white/5 mt-5 lg:mt-12">
            <div className="flex-1 text-center">
              <p className="text-lg lg:text-2xl font-bold text-white mb-0.5">500+</p>
              <p className="text-[8px] lg:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Aset Terdaftar</p>
            </div>
            <div className="w-px h-7 lg:h-10 bg-white/10" />
            <div className="flex-1 text-center">
              <p className="text-lg lg:text-2xl font-bold text-white mb-0.5">24</p>
              <p className="text-[8px] lg:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Kategori</p>
            </div>
            <div className="w-px h-7 lg:h-10 bg-white/10" />
            <div className="flex-1 text-center">
              <p className="text-lg lg:text-2xl font-bold text-[#22C55E] mb-0.5">99.9%</p>
              <p className="text-[8px] lg:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">System Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pb-4 lg:pb-8 text-center flex-shrink-0">
        <p className="text-[9px] lg:text-[10px] text-[#94A3B8] font-bold tracking-widest uppercase">
          SIARTA 2026 · PTGAS TELEKOMUNIKASI NUSANTARA, RO LAMPUNG
        </p>
      </div>
    </div>
  )
}
