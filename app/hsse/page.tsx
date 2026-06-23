'use client'

import { useState } from 'react'
import HSSESidebar from '../../components/hsse/HSSESidebar'
import TopHeader from '../../components/dashboard/TopHeader'
import { initialTickets } from '../../lib/dummyData'
import BorrowingProcess from '../../components/admin/BorrowingProcess'
import ReturnProcess from '../../components/admin/ReturnProcess'
import AssetMaster from '../../components/admin/AssetMaster'
import AssetMaintenance from '../../components/admin/AssetMaintenance'
import TicketHistory from '../../components/admin/TicketHistory'
import MaintenanceHistory from '../../components/admin/MaintenanceHistory'

export default function HSSEDashboard() {
  const [activeNav, setActiveNav] = useState('Verifikasi Peminjaman')

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const hssePendingCount = initialTickets.filter(
    (t) => t.overallStatus === 'Menunggu' && t.currentStage === 'HSSE'
  ).length

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      {sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-30 md:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}
      <HSSESidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        pendingCount={hssePendingCount}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          userName="Hendra"
          roleName="HSSE"
        />
        
        <div className="flex-1 overflow-auto p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{activeNav}</h1>
            <p className="text-sm text-gray-500 mt-1">Halaman ini sedang dalam tahap pengembangan.</p>
          </div>
          
          {activeNav === 'Verifikasi Peminjaman' && (
  <BorrowingProcess tickets={initialTickets} />
)}

{activeNav === 'Pengembalian Aset' && (
  <ReturnProcess tickets={initialTickets} />
)}

{activeNav === 'Master Aset' && (
  <AssetMaster />
)}

{activeNav === 'Pemeliharaan Aset' && (
  <AssetMaintenance />
)}

{activeNav === 'Riwayat Peminjaman' && (
  <TicketHistory tickets={initialTickets} />
)}

{activeNav === 'Riwayat Pemeliharaan' && (
  <MaintenanceHistory />
)}

          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
             <p className="text-gray-500 font-medium">Konten {activeNav} akan segera hadir.</p>
          </div>
        </div>
      </div>
    </div>
  )
}