'use client'

import { useState } from 'react'
import HSSESidebar from '../../components/hsse/HSSESidebar'
import TopHeader from '../../components/shared/TopHeader'
import { initialTickets } from '../../lib/dummyData'
import HSSEBorrowingProcess from '../../components/hsse/HSSEBorrowingProcess'
import HSSEReturnProcess from '../../components/hsse/HSSEReturnProcess'
import HSSEAssetMaster from '../../components/hsse/HSSEAssetMaster'
import HSSEAssetMaintenance from '../../components/hsse/HSSEAssetMaintenance'
import HSSETicketHistory from '../../components/hsse/HSSETicketHistory'
import HSSEMaintenanceHistory from '../../components/hsse/HSSEMaintenanceHistory'

export default function HSSEDashboard() {
  const [activeNav, setActiveNav] = useState('Verifikasi Peminjaman')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const hssePendingCount = initialTickets.filter(
    (t) => t.overallStatus === 'Menunggu' && t.currentStage === 'HSSE'
  ).length

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900 relative">
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
          hideHamburgerOnMobile={true}
        />
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{activeNav}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Pusat Kendali Verifikasi &amp; Pengawasan Keselamatan (HSSE)</p>
          </div>
          
          {activeNav === 'Verifikasi Peminjaman' && <HSSEBorrowingProcess tickets={initialTickets} />}
          {activeNav === 'Pengembalian Aset' && <HSSEReturnProcess tickets={initialTickets} />}
          {activeNav === 'Master Aset' && <HSSEAssetMaster />}
          {activeNav === 'Pemeliharaan Aset' && <HSSEAssetMaintenance />}
          {activeNav === 'Riwayat Peminjaman' && <HSSETicketHistory tickets={initialTickets} />}
          {activeNav === 'Riwayat Pemeliharaan' && <HSSEMaintenanceHistory />}
        </div>
      </div>
    </div>
  )
}