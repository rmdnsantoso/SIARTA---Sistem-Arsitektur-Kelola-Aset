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
    <div className="flex w-full min-h-[350px] lg:h-auto lg:min-h-screen lg:w-1/2 relative bg-[#0B1120] items-center justify-center overflow-hidden lg:border-r border-gray-800 py-10 lg:py-0">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 mix-blend-screen filter blur-[80px] lg:blur-[100px] animate-blob pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 mix-blend-screen filter blur-[80px] lg:blur-[100px] animate-blob animation-delay-2000 pointer-events-none"></div>

      {/* Floating Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-[90%] sm:max-w-md lg:max-w-lg p-6 lg:p-10 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 lg:mb-8">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="text-lg lg:text-xl font-bold tracking-[0.15em] text-white">SIARTA</span>
        </div>
        
        {/* Rotating Main Copy */}
        <div className="space-y-3 lg:space-y-4 mb-0 lg:mb-10">
          <div className="min-h-[70px] sm:min-h-[80px] lg:min-h-[100px]">
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold leading-snug text-white transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {headlines[headlineIndex].split(' ').map((word, idx) => {
                if (word.toLowerCase().includes('aset') || word.toLowerCase().includes('presisi') || word.toLowerCase().includes('cerdas') || word.toLowerCase().includes('perusahaan')) {
                  return <span key={idx} className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{word} </span>
                }
                return word + ' '
              })}
            </h1>
          </div>
          <p className="hidden sm:block text-gray-400 text-xs lg:text-sm leading-relaxed max-w-sm mt-2 lg:mt-0">
            Platform korporat terpadu untuk pemantauan inventaris, manajemen siklus hidup aset, dan persetujuan operasional.
          </p>
        </div>
        
        {/* Metrics - Hidden on very small screens to save space */}
        <div className="hidden sm:flex items-center gap-6 lg:gap-10 p-4 lg:p-5 rounded-xl bg-black/20 border border-white/5 mt-8 lg:mt-16">
          <div>
            <p className="text-xl lg:text-2xl font-bold text-white mb-0.5">99.9%</p>
            <p className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Uptime Sistem</p>
          </div>
          <div className="w-px h-8 lg:h-10 bg-white/10"></div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-white mb-0.5">45k+</p>
            <p className="text-[9px] lg:text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Aset Terkelola</p>
          </div>
        </div>
      </div>
      
      {/* Footer info */}
      <div className="absolute bottom-4 lg:bottom-8 left-0 w-full text-center pointer-events-none hidden sm:block">
        <p className="text-[10px] lg:text-xs text-gray-500/70 font-medium tracking-wide">© 2026 PT PGAS Telekomunikasi Nusantara RO Lampung. All rights reserved.</p>
      </div>
    </div>
  )
}
