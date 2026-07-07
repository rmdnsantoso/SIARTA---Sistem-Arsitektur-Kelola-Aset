'use client'

import { useState, useEffect } from 'react'
import HSSESidebar from '../../components/hsse/HSSESidebar'
import TopHeader from '../../components/shared/TopHeader'
import HSSEBorrowingProcess from '../../components/hsse/HSSEBorrowingProcess'
import HSSEReturnProcess from '../../components/hsse/HSSEReturnProcess'
import HSSEAssetMaster from '../../components/hsse/HSSEAssetMaster'
import HSSEAssetMaintenance from '../../components/hsse/HSSEAssetMaintenance'
import HSSETicketHistory from '../../components/hsse/HSSETicketHistory'
import HSSEMaintenanceHistory from '../../components/hsse/HSSEMaintenanceHistory'
import UserManagement from '../../components/admin/UserManagement'
import { getTicketsForHSSE } from '../../actions/core/ticket'
import { getLoggedInUser } from '../../actions/core/session'
import { adaptTickets } from '../../types/db'
import type { Ticket } from '../../types/ticket'

export default function HSSEDashboard() {
  const [activeNav, setActiveNav] = useState('Verifikasi Pinjam')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null)

  const refreshData = async () => {
    try {
      const [dbTickets, sessionRes] = await Promise.all([
        getTicketsForHSSE(),
        getLoggedInUser()
      ])
      setTickets(adaptTickets(dbTickets))
      if (sessionRes.success && sessionRes.user) {
        setCurrentUser({ id: sessionRes.user.id, name: sessionRes.user.name, role: sessionRes.user.role })
      }
    } catch (err) {
      console.error('Gagal memuat ulang tiket HSSE:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(() => {
      refreshData()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const hssePendingCount = tickets.filter(
    (t) => t.overallStatus === 'Menunggu' && t.currentStage === 'HSSE'
  ).length

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Memuat data HSSE...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900 relative">
      <HSSESidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        pendingCount={hssePendingCount}
        sessionUser={currentUser}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          userName={currentUser?.name || 'HSSE'}
          userId={currentUser?.id}
          roleName="HSSE"
          hideHamburgerOnMobile={true}
        />
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{activeNav}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Pusat Kendali Verifikasi & Pengawasan (HSSE)</p>
          </div>
          
          {activeNav === 'Verifikasi Pinjam' && <HSSEBorrowingProcess tickets={tickets} onSuccess={refreshData} />}
          {activeNav === 'Pengembalian Aset' && <HSSEReturnProcess tickets={tickets} onSuccess={refreshData} />}
          {activeNav === 'Master Aset' && <HSSEAssetMaster />}
          {activeNav === 'Pemeliharaan Aset' && <HSSEAssetMaintenance />}
          {activeNav === 'Riwayat Peminjaman' && <HSSETicketHistory tickets={tickets} />}
          {activeNav === 'Riwayat Pemeliharaan' && <HSSEMaintenanceHistory />}
          {activeNav === 'Kelola Pengguna' && <UserManagement currentUserId={currentUser?.id} />}
        </div>
      </div>
    </div>
  )
}