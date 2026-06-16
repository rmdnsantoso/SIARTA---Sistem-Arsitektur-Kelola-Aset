'use client'

import { useState } from 'react'
import PeminjamSidebar from '../../components/peminjam/PeminjamSidebar'
import TopHeader from '../../components/dashboard/TopHeader'

export default function PeminjamDashboard() {
  const [activeNav, setActiveNav] = useState('Katalog Alat')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <PeminjamSidebar
        sidebarOpen={sidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          userName="Ahmad"
          roleName="Peminjam"
        />
        
        <div className="flex-1 overflow-auto p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{activeNav}</h1>
            <p className="text-sm text-gray-500 mt-1">Halaman ini sedang dalam tahap pengembangan.</p>
          </div>
          
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
             <p className="text-gray-500 font-medium">Konten {activeNav} akan segera hadir.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

