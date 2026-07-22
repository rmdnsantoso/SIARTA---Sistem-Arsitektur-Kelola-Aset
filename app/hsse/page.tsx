'use client'

import { useState, useEffect, useCallback } from 'react'
import HSSESidebar from '../../components/hsse/HSSESidebar'
import TopHeader from '../../components/shared/TopHeader'
import HSSEBorrowingProcess from '../../components/hsse/HSSEBorrowingProcess'
import HSSEReturnProcess from '../../components/hsse/HSSEReturnProcess'
import HSSEAssetMaster from '../../components/hsse/HSSEAssetMaster'
import HSSEAssetMaintenance from '../../components/hsse/HSSEAssetMaintenance'
import HSSETicketHistory from '../../components/hsse/HSSETicketHistory'
import HSSEMaintenanceHistory from '../../components/hsse/HSSEMaintenanceHistory'
import UserManagement from '../../components/admin/UserManagement'
import { usePolling } from '../../hooks/usePolling'
import { useRealtimeRefetch } from '../../hooks/useRealtimeRefetch'
import { getTicketsForHSSE } from '../../actions/core/ticket'
import { getLoggedInUser } from '../../actions/core/session'
import { adaptTickets } from '../../types/db'
import type { Ticket } from '../../types/ticket'

export default function HSSEDashboard() {
  const [activeNav, setActiveNav] = useState('Verifikasi Pinjam')
  const [isNavInitialized, setIsNavInitialized] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('hsse_activeNav')
    if (saved) setActiveNav(saved)
    setIsNavInitialized(true)
  }, [])

  useEffect(() => {
    if (isNavInitialized) localStorage.setItem('hsse_activeNav', activeNav)
  }, [activeNav, isNavInitialized])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null)

  const refreshData = useCallback(async () => {
    try {
      const [dbTickets, sessionRes] = await Promise.all([
        getTicketsForHSSE(1, 100),
        getLoggedInUser()
      ])
      setTickets(adaptTickets(dbTickets.data))
      if (sessionRes.success && sessionRes.user) {
        setCurrentUser({ id: sessionRes.user.id, name: sessionRes.user.name, role: sessionRes.user.role })
      }
    } catch (err) {
      console.error('Gagal memuat ulang tiket HSSE:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useRealtimeRefetch('Ticket', refreshData)
  usePolling(refreshData, 60000)

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
          onNewNotification={refreshData}
        />
        
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8">

          
          {activeNav === 'Verifikasi Pinjam' && <HSSEBorrowingProcess tickets={tickets} onSuccess={refreshData} />}
          {activeNav === 'Pengembalian Aset' && <HSSEReturnProcess tickets={tickets} onSuccess={refreshData} />}
          {activeNav === 'Master Aset' && <HSSEAssetMaster />}
          {activeNav === 'Pemeliharaan Aset' && <HSSEAssetMaintenance />}
          {activeNav === 'Riwayat Peminjaman' && <HSSETicketHistory tickets={tickets} />}
          {activeNav === 'Riwayat Pemeliharaan' && <HSSEMaintenanceHistory />}
          {activeNav === 'Kelola Pengguna' && <UserManagement isViewOnly={true} currentUserId={currentUser?.id} />}
        </div>
      </div>
    </div>
  )
}