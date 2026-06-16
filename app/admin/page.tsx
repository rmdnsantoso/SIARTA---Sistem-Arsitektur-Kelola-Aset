'use client'

import { useState } from 'react'
import AdminSidebar from '../../components/admin/AdminSidebar'
import TopHeader from '../../components/dashboard/TopHeader'
import AnalyticsContent from '../../components/dashboard/AnalyticsContent'
import UserManagement from '../../components/admin/UserManagement'
import AssetMaster from '../../components/admin/AssetMaster'
import BorrowingProcess from '../../components/admin/BorrowingProcess'
import AssetMaintenance from '../../components/admin/AssetMaintenance'
import { initialTickets } from '../../lib/dummyData'

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState('Verifikasi Pinjam')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const adminPendingCount = initialTickets.filter(
    (t) => t.overallStatus === 'Menunggu' && t.currentStage === 'Admin'
  ).length

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        pendingCount={adminPendingCount}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          userName="Siti Aminah" 
          roleName="Admin Gudang" 
        />
        
        <div className="flex-1 overflow-auto p-8">
          {activeNav !== 'Analitik' && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{activeNav}</h1>
              <p className="text-sm text-gray-500 mt-1">Pusat Kendali Logistik & Inventaris (Admin)</p>
            </div>
          )}
          
          {activeNav === 'Verifikasi Pinjam' && <BorrowingProcess tickets={initialTickets} />}
          {activeNav === 'Analitik' && <AnalyticsContent />}
          {activeNav === 'Kelola Pengguna' && <UserManagement />}
          {activeNav === 'Master Aset' && <AssetMaster />}
          {activeNav === 'Pemeliharaan Aset' && <AssetMaintenance />}
        </div>
      </div>
    </div>
  )
}
