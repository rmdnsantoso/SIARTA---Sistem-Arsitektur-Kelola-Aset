export default function LoginBanner() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-blue-900 items-center justify-center p-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')]"></div>
      
      <div className="relative z-10 w-full max-w-lg text-white">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-widest text-blue-100">SIARTA</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-6">
          Kelola Aset Operasional<br/>Lebih Presisi.
        </h1>
        <p className="text-blue-100 text-lg leading-relaxed max-w-md">
          Sistem terpadu untuk monitoring alat, pelacakan inventaris, dan persetujuan.
        </p>
        
        <div className="mt-12 flex gap-8">
          <div>
            <p className="text-3xl font-bold text-white mb-1">99.9%</p>
            <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Uptime Sistem</p>
          </div>
          <div className="w-px bg-blue-700"></div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">45k+</p>
            <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Aset Terpantau</p>
          </div>
        </div>
      </div>
    </div>
  )
}
